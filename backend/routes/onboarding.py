"""
Onboarding Routes
Phase 2: Account type selection and profile creation

New routes for onboarding flow. Non-breaking additions.
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from typing import Optional, Any
import logging
from datetime import datetime

from app.api.deps.auth import get_current_user
from firestore_db import FirestoreDB
from models.identity_models import (
    AccountTypeSelection, OnboardingStatus, AccountType,
    Business, Organization, Membership, OrganizationRole,
    SubscriptionCreate, SubscriptionPlan
)
from services.subscription_service import SubscriptionService
from audit_log_utils import log_audit_event, get_client_ip, get_user_agent

logger = logging.getLogger(__name__)

# Router for onboarding endpoints
onboarding_router = APIRouter(prefix="/onboarding", tags=["Onboarding"])

# Firestore collections
businesses_collection = FirestoreDB('businesses')
organizations_collection = FirestoreDB('organizations')
memberships_collection = FirestoreDB('memberships')
users_collection = FirestoreDB('users')


@onboarding_router.post(
    "/account-type",
    response_model=dict,
    summary="Create account type",
    description="Phase 2: Create personal, business, or organization account during onboarding. Atomic operation."
)
async def create_account_type(
    request: Request,
    account_selection: AccountTypeSelection,
    current_user: Any = Depends(get_current_user)
):
    """
    Create account type and associated profile
    
    Phase 2: Onboarding flow
    - Creates business or organization atomically
    - Sets up initial subscription (trial)
    - Logs onboarding completion
    
    Args:
        account_selection: Account type selection data
        current_user: Authenticated user
    
    Returns:
        OnboardingStatus with routing decision
    """
    # Extract client info
    ip_address = get_client_ip(request)
    user_agent = get_user_agent(request)
    
    try:
        account_type = account_selection.account_type
        
        # Validate account type
        if account_type not in [AccountType.PERSONAL, AccountType.BUSINESS_SOLO, AccountType.ORGANIZATION]:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid account type: {account_type}"
            )
        
        # Check if user already has an account type set up
        existing_business = await businesses_collection.find_one({
            "owner_id": current_user.id
        })
        
        existing_org = await organizations_collection.find_one({
            "owner_id": current_user.id
        })
        
        if existing_business or existing_org:
            raise HTTPException(
                status_code=400,
                detail="User already has an account type set up"
            )
        
        # Handle based on account type
        if account_type == AccountType.PERSONAL:
            # Personal account - create default Standard plan subscription with 14-day trial
            # User profile already exists from registration
            
            # Create default Standard plan subscription with trial
            try:
                subscription_data = SubscriptionCreate(
                    plan=SubscriptionPlan.SOLO,  # Default to Standard plan
                    billing_cycle="yearly",
                    trial_days=14  # 14-day trial period
                )
                
                await SubscriptionService.create_subscription(
                    subscription_data=subscription_data,
                    user_id=current_user.id,
                    actor_id=current_user.id,
                    ip_address=ip_address,
                    user_agent=user_agent
                )
            except Exception as e:
                logger.warning(f"Failed to create default subscription: {e}")
                # Don't fail onboarding if subscription creation fails
            
            # Log onboarding completion
            await log_audit_event(
                actor_id=current_user.id,
                action='onboarding_completed',
                entity_type='user',
                entity_id=current_user.id,
                ip_address=ip_address,
                user_agent=user_agent,
                metadata={'account_type': AccountType.PERSONAL}
            )
            
            return OnboardingStatus(
                completed=True,
                account_type=AccountType.PERSONAL,
                profile_id=current_user.id,
                next_route="/dashboard"
            ).model_dump()
        
        elif account_type == AccountType.BUSINESS_SOLO:
            # Business account - create business profile
            if not account_selection.business_data:
                raise HTTPException(
                    status_code=400,
                    detail="Business data required for business account"
                )
            
            # Create business
            business = Business(
                owner_id=current_user.id,
                **account_selection.business_data.model_dump()
            )
            
            await businesses_collection.insert_one(business.model_dump())
            
            # Create subscription with trial (Standard plan)
            try:
                subscription_data = SubscriptionCreate(
                    plan=SubscriptionPlan.SOLO,  # Standard plan
                    billing_cycle="yearly",
                    trial_days=14  # 14-day trial period
                )
                
                await SubscriptionService.create_subscription(
                    subscription_data=subscription_data,
                    business_id=business.id,
                    actor_id=current_user.id,
                    ip_address=ip_address,
                    user_agent=user_agent
                )
            except Exception as e:
                logger.error(f"Failed to create business subscription: {e}")
                # Rollback business creation
                await businesses_collection.delete_one({"id": business.id})
                raise HTTPException(
                    status_code=500,
                    detail="Failed to create subscription"
                )
            
            # Log onboarding completion
            await log_audit_event(
                actor_id=current_user.id,
                action='onboarding_completed',
                entity_type='business',
                entity_id=business.id,
                ip_address=ip_address,
                user_agent=user_agent,
                metadata={
                    'account_type': AccountType.BUSINESS_SOLO,
                    'business_name': business.business_name
                }
            )
            
            return OnboardingStatus(
                completed=True,
                account_type=AccountType.BUSINESS_SOLO,
                profile_id=current_user.id,
                business_id=business.id,
                next_route="/dashboard"
            ).model_dump()
        
        elif account_type == AccountType.ORGANIZATION:
            # Organization account - create organization profile
            if not account_selection.organization_data:
                raise HTTPException(
                    status_code=400,
                    detail="Organization data required for organization account"
                )
            
            # Create organization
            organization = Organization(
                owner_id=current_user.id,
                **account_selection.organization_data.model_dump()
            )
            
            await organizations_collection.insert_one(organization.model_dump())
            
            # Create owner membership
            owner_membership = Membership(
                organization_id=organization.id,
                user_id=current_user.id,
                role=OrganizationRole.OWNER
            )
            
            await memberships_collection.insert_one(owner_membership.model_dump())
            
            # Create subscription with trial (Organization plan)
            try:
                subscription_data = SubscriptionCreate(
                    plan=SubscriptionPlan.ORGANIZATION,
                    billing_cycle="yearly",
                    trial_days=14  # 14-day trial period
                )
                
                await SubscriptionService.create_subscription(
                    subscription_data=subscription_data,
                    organization_id=organization.id,
                    actor_id=current_user.id,
                    ip_address=ip_address,
                    user_agent=user_agent
                )
            except Exception as e:
                logger.error(f"Failed to create organization subscription: {e}")
                # Rollback organization and membership creation
                await organizations_collection.delete_one({"id": organization.id})
                await memberships_collection.delete_one({"id": owner_membership.id})
                raise HTTPException(
                    status_code=500,
                    detail="Failed to create subscription"
                )
            
            # Log onboarding completion
            await log_audit_event(
                actor_id=current_user.id,
                action='onboarding_completed',
                entity_type='organization',
                entity_id=organization.id,
                ip_address=ip_address,
                user_agent=user_agent,
                metadata={
                    'account_type': AccountType.ORGANIZATION,
                    'organization_name': organization.organization_name
                }
            )
            
            return OnboardingStatus(
                completed=True,
                account_type=AccountType.ORGANIZATION,
                profile_id=current_user.id,
                organization_id=organization.id,
                next_route="/dashboard"
            ).model_dump()
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Onboarding error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Onboarding failed: {str(e)}"
        )


@onboarding_router.get(
    "/status",
    response_model=dict,
    summary="Get onboarding status",
    description="Check if user has completed onboarding"
)
async def get_onboarding_status(current_user: Any = Depends(get_current_user)):
    """
    Get onboarding status for current user
    
    Returns:
        Onboarding completion status
    """
    try:
        # Check if user has business or organization
        business = await businesses_collection.find_one({
            "owner_id": current_user.id
        })
        
        organization = await organizations_collection.find_one({
            "owner_id": current_user.id
        })
        
        # Determine account type
        if business:
            account_type = AccountType.BUSINESS_SOLO
            completed = True
            next_route = "/dashboard"
        elif organization:
            account_type = AccountType.ORGANIZATION
            completed = True
            next_route = "/dashboard"
        else:
            # Personal account or not onboarded
            account_type = AccountType.PERSONAL
            completed = True  # Existing users are considered onboarded
            next_route = "/dashboard"
        
        return {
            "completed": completed,
            "account_type": account_type,
            "needs_onboarding": not completed,
            "next_route": next_route
        }
        
    except Exception as e:
        logger.error(f"Error getting onboarding status: {e}", exc_info=True)
        return {
            "completed": True,  # Fail open
            "account_type": AccountType.PERSONAL,
            "needs_onboarding": False,
            "next_route": "/dashboard"
        }

