"""
Identity Resolution Service
Phase 2: Determines account type and routing for authenticated users

This service is read-only and non-breaking.
Resolves identity context based on existing data in Firestore.
"""

from typing import Optional, Dict, Any
from datetime import datetime
import logging

from firestore_db import FirestoreDB
from models.identity_models import (
    IdentityContext, AccountType, SubscriptionStatus, OrganizationRole
)

logger = logging.getLogger(__name__)

# Firestore collections
businesses_collection = FirestoreDB('businesses')
organizations_collection = FirestoreDB('organizations')
memberships_collection = FirestoreDB('memberships')
subscriptions_collection = FirestoreDB('subscriptions')
users_collection = FirestoreDB('users')


class IdentityResolver:
    """
    Resolves user identity and determines account type
    
    Non-breaking identity resolution rules:
    1. If user has no business/org → personal account
    2. If user owns a business → business_solo account
    3. If user owns or belongs to organization → organization account
    """
    
    @staticmethod
    async def resolve_identity(user_id: str) -> IdentityContext:
        """
        Resolve complete identity context for a user
        
        Args:
            user_id: User ID from JWT token
        
        Returns:
            IdentityContext with routing decision
        """
        try:
            # Step 1: Get user profile
            user = await users_collection.find_one({"id": user_id})
            if not user:
                return IdentityContext(
                    authenticated=False,
                    account_type=AccountType.PERSONAL,
                    next_route="/login"
                )
            
            # Step 2: Check if user owns a business
            business = await businesses_collection.find_one({
                "owner_id": user_id,
                "is_active": True
            })
            
            if business:
                # Business owner
                subscription = await IdentityResolver._get_subscription(
                    business_id=business['id']
                )
                
                route = IdentityResolver._determine_route(subscription)
                needs_billing = subscription['status'] == SubscriptionStatus.EXPIRED
                
                return IdentityContext(
                    authenticated=True,
                    account_type=AccountType.BUSINESS_SOLO,
                    user_id=user_id,
                    profile_id=user_id,
                    business_id=business['id'],
                    subscription=subscription,
                    next_route=route,
                    needs_billing=needs_billing
                )
            
            # Step 3: Check if user owns an organization
            organization = await organizations_collection.find_one({
                "owner_id": user_id,
                "is_active": True
            })
            
            if organization:
                # Organization owner
                subscription = await IdentityResolver._get_subscription(
                    organization_id=organization['id']
                )
                
                route = IdentityResolver._determine_route(subscription)
                needs_billing = subscription['status'] == SubscriptionStatus.EXPIRED
                
                return IdentityContext(
                    authenticated=True,
                    account_type=AccountType.ORGANIZATION,
                    user_id=user_id,
                    profile_id=user_id,
                    organization_id=organization['id'],
                    role=OrganizationRole.OWNER,
                    subscription=subscription,
                    next_route=route,
                    needs_billing=needs_billing
                )
            
            # Step 4: Check if user is a member of an organization
            membership = await memberships_collection.find_one({
                "user_id": user_id,
                "is_active": True
            })
            
            if membership:
                # Organization member
                org = await organizations_collection.find_one({
                    "id": membership['organization_id']
                })
                
                if org:
                    subscription = await IdentityResolver._get_subscription(
                        organization_id=org['id']
                    )
                    
                    # Members are blocked if org subscription expired
                    if subscription['status'] == SubscriptionStatus.EXPIRED:
                        next_route = "/billing/choose-plan"
                    elif subscription['status'] == SubscriptionStatus.NONE:
                        next_route = "/billing-required"
                    else:
                        next_route = "/dashboard"
                    
                    needs_billing = subscription['status'] == SubscriptionStatus.EXPIRED
                    
                    return IdentityContext(
                        authenticated=True,
                        account_type=AccountType.ORGANIZATION,
                        user_id=user_id,
                        profile_id=user_id,
                        organization_id=org['id'],
                        department_id=membership.get('department_id'),
                        role=membership['role'],
                        subscription=subscription,
                        next_route=next_route,
                        needs_billing=needs_billing
                    )
            
            # Step 5: Default to personal account
            # This handles existing users who don't have business/org
            subscription = await IdentityResolver._get_subscription(
                user_id=user_id
            )
            
            route = IdentityResolver._determine_route(subscription)
            # Personal accounts are free, so no billing needed
            needs_billing = False
            
            return IdentityContext(
                authenticated=True,
                account_type=AccountType.PERSONAL,
                user_id=user_id,
                profile_id=user_id,
                subscription=subscription,
                next_route=route,
                needs_billing=needs_billing
            )
            
        except Exception as e:
            logger.error(f"Error resolving identity for user {user_id}: {e}", exc_info=True)
            # Return safe default
            return IdentityContext(
                authenticated=True,
                account_type=AccountType.PERSONAL,
                user_id=user_id,
                profile_id=user_id,
                next_route="/dashboard"
            )
    
    @staticmethod
    async def _get_subscription(
        user_id: Optional[str] = None,
        business_id: Optional[str] = None,
        organization_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get subscription for user, business, or organization
        
        Args:
            user_id: User ID (for personal accounts)
            business_id: Business ID (for business accounts)
            organization_id: Organization ID (for organization accounts)
        
        Returns:
            Subscription dict with status and plan
        """
        try:
            query = {}
            if user_id:
                query['user_id'] = user_id
            elif business_id:
                query['business_id'] = business_id
            elif organization_id:
                query['organization_id'] = organization_id
            else:
                # No subscription
                return {
                    "status": SubscriptionStatus.NONE,
                    "plan": None
                }
            
            subscription = await subscriptions_collection.find_one(query)
            
            if not subscription:
                return {
                    "status": SubscriptionStatus.NONE,
                    "plan": None
                }
            
            # Check if subscription is expired
            status = subscription.get('status', SubscriptionStatus.NONE)
            now = datetime.utcnow()
            
            # Convert Firestore timestamps to datetime if needed
            def to_datetime(value):
                """Convert Firestore timestamp to datetime"""
                if value is None:
                    return None
                if isinstance(value, datetime):
                    return value
                # If it's a dict with timestamp fields (Firestore format)
                if isinstance(value, dict):
                    # Firestore timestamps can be in different formats
                    if '_seconds' in value:
                        from datetime import datetime, timezone
                        return datetime.fromtimestamp(value['_seconds'], tz=timezone.utc).replace(tzinfo=None)
                # If it's already a string ISO format
                if isinstance(value, str):
                    try:
                        return datetime.fromisoformat(value.replace('Z', '+00:00')).replace(tzinfo=None)
                    except:
                        pass
                return value
            
            if status == SubscriptionStatus.ACTIVE:
                # Verify current period hasn't ended
                current_period_end = to_datetime(subscription.get('current_period_end'))
                if current_period_end:
                    if isinstance(current_period_end, datetime) and now > current_period_end:
                        status = SubscriptionStatus.EXPIRED
                        # Update in database (idempotent update)
                        try:
                            await subscriptions_collection.update_one(
                                {'id': subscription.get('id')},
                                {'$set': {
                                    'status': SubscriptionStatus.EXPIRED,
                                    'updated_at': now
                                }}
                            )
                            logger.info(f"Updated expired active subscription: {subscription.get('id')}")
                        except Exception as e:
                            logger.warning(f"Failed to update expired subscription status: {e}")
            elif status == SubscriptionStatus.TRIAL:
                # Verify trial hasn't ended - check against trial_end_date from Firestore
                trial_end_date = to_datetime(subscription.get('trial_end_date'))
                if trial_end_date:
                    if isinstance(trial_end_date, datetime) and now > trial_end_date:
                        status = SubscriptionStatus.EXPIRED
                        # Update in database (idempotent update)
                        try:
                            await subscriptions_collection.update_one(
                                {'id': subscription.get('id'), 'status': SubscriptionStatus.TRIAL},
                                {'$set': {
                                    'status': SubscriptionStatus.EXPIRED,
                                    'updated_at': now
                                }}
                            )
                            logger.info(f"Updated expired trial subscription: {subscription.get('id')}, trial_end_date={trial_end_date.isoformat()}, now={now.isoformat()}")
                        except Exception as e:
                            logger.warning(f"Failed to update expired trial status: {e}")
            
            # Return subscription with calculated status
            result = {
                "status": status,
                "plan": subscription.get('plan'),
                "current_period_end": subscription.get('current_period_end'),
                "trial_end_date": subscription.get('trial_end_date'),
                "trial_start_date": subscription.get('trial_start_date'),
                "days_remaining": None
            }
            
            # Calculate days remaining for trial or active subscriptions
            if status == SubscriptionStatus.TRIAL and subscription.get('trial_end_date'):
                trial_end = to_datetime(subscription.get('trial_end_date'))
                if isinstance(trial_end, datetime):
                    days_remaining = (trial_end - now).days
                    result["days_remaining"] = max(0, days_remaining)  # Don't return negative days
            elif status == SubscriptionStatus.ACTIVE and subscription.get('current_period_end'):
                period_end = to_datetime(subscription.get('current_period_end'))
                if isinstance(period_end, datetime):
                    days_remaining = (period_end - now).days
                    result["days_remaining"] = max(0, days_remaining)
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting subscription: {e}", exc_info=True)
            return {
                "status": SubscriptionStatus.NONE,
                "plan": None
            }
    
    @staticmethod
    def _determine_route(subscription: Dict[str, Any]) -> str:
        """
        Determine next route based on subscription status
        
        Args:
            subscription: Subscription dict
        
        Returns:
            Next route path
        """
        status = subscription.get('status', SubscriptionStatus.NONE)
        
        if status == SubscriptionStatus.ACTIVE or status == SubscriptionStatus.TRIAL:
            return "/dashboard"
        elif status == SubscriptionStatus.EXPIRED:
            # Redirect expired subscriptions to plan selection
            return "/billing/choose-plan"
        else:
            # No subscription - allow access but prompt for upgrade
            return "/dashboard"
    
    @staticmethod
    async def check_dashboard_access(user_id: str) -> tuple[bool, str]:
        """
        Check if user has dashboard access
        
        Args:
            user_id: User ID
        
        Returns:
            Tuple of (has_access: bool, reason: str)
        """
        try:
            context = await IdentityResolver.resolve_identity(user_id)
            
            # Allow access if subscription is active or trial
            if context.subscription['status'] in [
                SubscriptionStatus.ACTIVE,
                SubscriptionStatus.TRIAL,
                SubscriptionStatus.NONE  # Free tier
            ]:
                return True, "access_granted"
            
            # Block if expired
            if context.subscription['status'] == SubscriptionStatus.EXPIRED:
                return False, "subscription_expired"
            
            # Default allow
            return True, "access_granted"
            
        except Exception as e:
            logger.error(f"Error checking dashboard access: {e}", exc_info=True)
            # Fail open (allow access) to avoid breaking existing users
            return True, "error_fallback"
    
    @staticmethod
    async def get_organization_members(organization_id: str) -> list:
        """
        Get all members of an organization
        
        Args:
            organization_id: Organization ID
        
        Returns:
            List of membership records with user details
        """
        try:
            memberships = await memberships_collection.find({
                "organization_id": organization_id,
                "is_active": True
            })
            
            members = []
            for membership in memberships:
                user = await users_collection.find_one({"id": membership['user_id']})
                if user:
                    members.append({
                        "membership_id": membership['id'],
                        "user_id": user['id'],
                        "user_name": user.get('name'),
                        "user_email": user.get('email'),
                        "role": membership['role'],
                        "department_id": membership.get('department_id'),
                        "joined_at": membership.get('joined_at')
                    })
            
            return members
            
        except Exception as e:
            logger.error(f"Error getting organization members: {e}", exc_info=True)
            return []
    
    @staticmethod
    async def check_organization_permission(
        user_id: str,
        organization_id: str,
        required_role: Optional[str] = None
    ) -> bool:
        """
        Check if user has permission in an organization
        
        Args:
            user_id: User ID
            organization_id: Organization ID
            required_role: Required role (owner, admin, member)
        
        Returns:
            True if user has permission
        """
        try:
            # Check if user is owner
            org = await organizations_collection.find_one({
                "id": organization_id,
                "owner_id": user_id
            })
            
            if org:
                return True  # Owner has all permissions
            
            # Check membership
            membership = await memberships_collection.find_one({
                "user_id": user_id,
                "organization_id": organization_id,
                "is_active": True
            })
            
            if not membership:
                return False
            
            # If no specific role required, membership is enough
            if not required_role:
                return True
            
            # Check role hierarchy: owner > admin > member
            role_hierarchy = {
                OrganizationRole.OWNER: 3,
                OrganizationRole.ADMIN: 2,
                OrganizationRole.MEMBER: 1
            }
            
            user_role_level = role_hierarchy.get(membership['role'], 0)
            required_role_level = role_hierarchy.get(required_role, 0)
            
            return user_role_level >= required_role_level
            
        except Exception as e:
            logger.error(f"Error checking organization permission: {e}", exc_info=True)
            return False

