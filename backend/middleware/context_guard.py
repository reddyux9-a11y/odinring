"""
Context Guard Middleware
Phase 2: Dashboard access control based on subscription status

Enforces subscription requirements for dashboard access.
Non-breaking: Falls open if context resolution fails.
"""

from fastapi import HTTPException, Request, Depends
from typing import Optional
import logging

from server import get_current_user, User
from services.identity_resolver import IdentityResolver
from models.identity_models import SubscriptionStatus

logger = logging.getLogger(__name__)


class ContextGuard:
    """
    Dashboard access guard based on identity context
    
    Enforces subscription requirements:
    - Active subscription required for dashboard access
    - Expired subscription routes to /billing
    - Organization members blocked if org subscription expired
    - Owner always allowed to access billing
    """
    
    @staticmethod
    async def check_dashboard_access(current_user: User) -> bool:
        """
        Check if user has dashboard access
        
        Args:
            current_user: Authenticated user
        
        Returns:
            True if access allowed
        
        Raises:
            HTTPException if access denied
        """
        try:
            # Resolve identity context
            has_access, reason = await IdentityResolver.check_dashboard_access(current_user.id)
            
            if not has_access:
                if reason == "subscription_expired":
                    raise HTTPException(
                        status_code=402,  # Payment Required
                        detail="Subscription expired. Please renew your subscription.",
                        headers={"X-Redirect": "/billing/choose-plan"}
                    )
                else:
                    raise HTTPException(
                        status_code=403,
                        detail="Dashboard access denied"
                    )
            
            return True
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error checking dashboard access: {e}", exc_info=True)
            # Fail open to avoid breaking existing users
            return True
    
    @staticmethod
    async def get_guarded_user(current_user: User = Depends(get_current_user)) -> User:
        """
        Dependency that checks dashboard access
        
        Use this instead of get_current_user for dashboard routes
        
        Args:
            current_user: Authenticated user
        
        Returns:
            User if access allowed
        
        Raises:
            HTTPException if access denied
        """
        await ContextGuard.check_dashboard_access(current_user)
        return current_user


# Dependency for dashboard routes
async def require_dashboard_access(current_user: User = Depends(get_current_user)) -> User:
    """
    FastAPI dependency that enforces dashboard access
    
    Usage:
        @app.get("/dashboard/stats")
        async def get_stats(current_user: User = Depends(require_dashboard_access)):
            ...
    
    Args:
        current_user: Authenticated user
    
    Returns:
        User if access allowed
    
    Raises:
        HTTPException: 402 if subscription expired, 403 otherwise
    """
    return await ContextGuard.get_guarded_user(current_user)


# Helper function to check organization permission with subscription
async def require_organization_access(
    organization_id: str,
    current_user: User = Depends(get_current_user),
    required_role: Optional[str] = None
) -> User:
    """
    FastAPI dependency that checks organization access
    
    Verifies:
    1. User is member/owner of organization
    2. Organization subscription is active
    3. User has required role (if specified)
    
    Args:
        organization_id: Organization ID
        current_user: Authenticated user
        required_role: Required role (owner, admin, member)
    
    Returns:
        User if access allowed
    
    Raises:
        HTTPException if access denied
    """
    try:
        # Check organization permission
        has_permission = await IdentityResolver.check_organization_permission(
            user_id=current_user.id,
            organization_id=organization_id,
            required_role=required_role
        )
        
        if not has_permission:
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to access this organization"
            )
        
        # Check subscription status
        from services.subscription_service import SubscriptionService
        
        subscription = await SubscriptionService.get_subscription(
            organization_id=organization_id
        )
        
        if subscription and subscription.status == SubscriptionStatus.EXPIRED:
            # Check if user is owner (owners can access billing)
            from firestore_db import FirestoreDB
            organizations_collection = FirestoreDB('organizations')
            
            org = await organizations_collection.find_one({"id": organization_id})
            
            if org and org['owner_id'] == current_user.id:
                # Owner can access even with expired subscription (to renew)
                return current_user
            else:
                # Members blocked if subscription expired
                raise HTTPException(
                    status_code=402,
                    detail="Organization subscription expired. Contact organization owner.",
                    headers={"X-Redirect": "/billing/choose-plan"}
                )
        
        return current_user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error checking organization access: {e}", exc_info=True)
        # Fail open
        return current_user

