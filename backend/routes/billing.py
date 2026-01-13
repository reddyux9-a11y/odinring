"""
Billing Routes
Subscription activation and plan selection
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from typing import Optional
import logging
from datetime import datetime

from server import get_current_user, User
from firestore_db import FirestoreDB
from models.identity_models import SubscriptionStatus, SubscriptionPlan
from services.subscription_service import SubscriptionService
from services.identity_resolver import IdentityResolver
from audit_log_utils import log_audit_event, get_client_ip, get_user_agent
from config import settings

logger = logging.getLogger(__name__)

# Router for billing endpoints
billing_router = APIRouter(prefix="/billing", tags=["Billing"])

# Firestore collections
subscriptions_collection = FirestoreDB('subscriptions')
businesses_collection = FirestoreDB('businesses')
organizations_collection = FirestoreDB('organizations')


@billing_router.get(
    "/plans",
    response_model=dict,
    summary="Get available subscription plans",
    description="Returns available subscription plans with pricing"
)
async def get_subscription_plans():
    """
    Get available subscription plans with pricing
    
    Returns:
        Available plans with pricing information
    """
    try:
        plans = {
            "personal": {
                "id": "personal",
                "name": "Personal Plan",
                "description": "Free tier for individual users",
                "price": {
                    "yearly": 0,
                    "currency": "EUR"
                },
                "features": {
                    "links": "unlimited",
                    "items": "unlimited",
                    "customization": "basic",
                    "analytics": "basic",
                    "custom_branding": False,
                    "qr_codes": False
                }
            },
            "solo_standard": {
                "id": "solo_standard",
                "name": "Business Solo - Standard",
                "description": "For solo businesses and micro enterprises",
                "price": {
                    "yearly": settings.SUBSCRIPTION_PRICE_SOLO_STANDARD,
                    "currency": "EUR"
                },
                "features": {
                    "links": "unlimited",
                    "items": "unlimited",
                    "customization": "advanced",
                    "analytics": "advanced",
                    "custom_branding": True,
                    "qr_codes": True
                }
            },
            "solo_enterprise": {
                "id": "solo_enterprise",
                "name": "Business Solo - Enterprise",
                "description": "Enhanced features for growing businesses",
                "price": {
                    "yearly": settings.SUBSCRIPTION_PRICE_SOLO_ENTERPRISE,
                    "currency": "EUR"
                },
                "features": {
                    "links": "unlimited",
                    "items": "unlimited",
                    "customization": "advanced",
                    "analytics": "advanced",
                    "custom_branding": True,
                    "qr_codes": True,
                    "priority_support": True
                }
            },
            "org": {
                "id": "org",
                "name": "Organization Plan",
                "description": "For organizations with multiple members",
                "price": {
                    "yearly": settings.SUBSCRIPTION_PRICE_ORG,
                    "currency": "EUR"
                },
                "features": {
                    "links": "unlimited",
                    "items": "unlimited",
                    "customization": "advanced",
                    "analytics": "advanced",
                    "custom_branding": True,
                    "qr_codes": True,
                    "team_collaboration": True,
                    "departments": True,
                    "max_members": 10,
                    "max_departments": 5
                }
            }
        }
        
        return {
            "plans": plans,
            "currency": "EUR"
        }
        
    except Exception as e:
        logger.error(f"Error getting subscription plans: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve plans: {str(e)}"
        )


@billing_router.get(
    "/subscription",
    response_model=dict,
    summary="Get current subscription",
    description="Get current user's subscription details"
)
async def get_current_subscription(
    current_user: User = Depends(get_current_user)
):
    """
    Get current user's subscription
    
    Returns:
        Subscription details with status and plan info
    """
    try:
        # Resolve identity to get account type
        context = await IdentityResolver.resolve_identity(current_user.id)
        
        # Get subscription based on account type
        subscription = None
        if context.business_id:
            subscription = await SubscriptionService.get_subscription(
                business_id=context.business_id
            )
        elif context.organization_id:
            subscription = await SubscriptionService.get_subscription(
                organization_id=context.organization_id
            )
        else:
            subscription = await SubscriptionService.get_subscription(
                user_id=current_user.id
            )
        
        if not subscription:
            return {
                "has_subscription": False,
                "subscription": None,
                "status": SubscriptionStatus.NONE,
                "plan": None
            }
        
        # Get subscription summary with days remaining
        summary = await SubscriptionService.get_subscription_status_summary(
            user_id=context.user_id,
            business_id=context.business_id,
            organization_id=context.organization_id
        )
        
        return {
            "has_subscription": True,
            "subscription": {
                "id": subscription.id,
                "plan": subscription.plan,
                "status": subscription.status,
                "billing_cycle": subscription.billing_cycle,
                "trial_start_date": subscription.trial_start_date.isoformat() if subscription.trial_start_date else None,
                "trial_end_date": subscription.trial_end_date.isoformat() if subscription.trial_end_date else None,
                "current_period_start": subscription.current_period_start.isoformat() if subscription.current_period_start else None,
                "current_period_end": subscription.current_period_end.isoformat() if subscription.current_period_end else None
            },
            "days_remaining": summary.get("days_remaining"),
            "message": summary.get("message"),
            "access_allowed": summary.get("access_allowed", True)
        }
        
    except Exception as e:
        logger.error(f"Error getting subscription: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve subscription: {str(e)}"
        )


@billing_router.post(
    "/subscriptions/{subscription_id}/activate",
    response_model=dict,
    summary="Activate subscription",
    description="Activate a subscription after successful payment"
)
async def activate_subscription(
    request: Request,
    subscription_id: str,
    billing_cycle: str = "yearly",
    current_user: User = Depends(get_current_user)
):
    """
    Activate a subscription (after payment)
    
    Args:
        subscription_id: Subscription ID
        billing_cycle: Billing cycle ("monthly" or "yearly")
        current_user: Authenticated user
    
    Returns:
        Activation result
    """
    # Extract client info
    ip_address = get_client_ip(request)
    user_agent = get_user_agent(request)
    
    try:
        # Get subscription
        subscription = await subscriptions_collection.find_one({"id": subscription_id})
        if not subscription:
            raise HTTPException(status_code=404, detail="Subscription not found")
        
        # Verify user has access to this subscription
        context = await IdentityResolver.resolve_identity(current_user.id)
        has_access = False
        
        if subscription.get('user_id') == current_user.id:
            has_access = True
        elif subscription.get('business_id') and context.business_id == subscription.get('business_id'):
            has_access = True
        elif subscription.get('organization_id') and context.organization_id == subscription.get('organization_id'):
            # Check if user is owner
            if context.role == 'owner':
                has_access = True
        
        if not has_access:
            raise HTTPException(status_code=403, detail="Access denied to this subscription")
        
        # Activate subscription
        success = await SubscriptionService.activate_subscription(
            subscription_id=subscription_id,
            billing_cycle=billing_cycle,
            actor_id=current_user.id,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to activate subscription")
        
        # Get updated subscription
        updated_sub = await SubscriptionService.get_subscription(
            user_id=subscription.get('user_id'),
            business_id=subscription.get('business_id'),
            organization_id=subscription.get('organization_id')
        )
        
        return {
            "success": True,
            "message": "Subscription activated successfully",
            "subscription": {
                "id": updated_sub.id,
                "status": updated_sub.status,
                "plan": updated_sub.plan,
                "current_period_end": updated_sub.current_period_end.isoformat() if updated_sub.current_period_end else None
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error activating subscription: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to activate subscription: {str(e)}"
        )

