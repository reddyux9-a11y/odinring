"""
Billing Routes
Subscription activation and plan selection
"""

from fastapi import APIRouter, HTTPException, Depends, Request, Body
from typing import Optional
from pydantic import BaseModel
import logging
from datetime import datetime
import json
from urllib.parse import urlparse

import stripe

from server import get_current_user, User
from firestore_db import FirestoreDB
from models.identity_models import SubscriptionStatus, SubscriptionPlan
from services.subscription_service import SubscriptionService
from services.identity_resolver import IdentityResolver
from audit_log_utils import log_audit_event, get_client_ip, get_user_agent
from config import settings

logger = logging.getLogger(__name__)

# Configure Stripe (if keys are present)
if settings.STRIPE_SECRET_KEY:
    stripe.api_key = settings.STRIPE_SECRET_KEY

# Router for billing endpoints
billing_router = APIRouter(prefix="/billing", tags=["Billing"])

# Firestore collections
subscriptions_collection = FirestoreDB('subscriptions')
businesses_collection = FirestoreDB('businesses')
organizations_collection = FirestoreDB('organizations')


def _checkout_allowed_frontend_origins() -> set[str]:
    """Origins allowed for Stripe return URLs (aligned with CORS + configured FRONTEND_URL)."""
    origins: set[str] = set()
    raw = (settings.CORS_ORIGINS or "").strip()
    if raw:
        for part in raw.split(","):
            o = part.strip().rstrip("/")
            if o:
                origins.add(o)
    fu = (settings.FRONTEND_URL or "").strip().rstrip("/")
    if fu:
        origins.add(fu)
    return origins


def _resolve_stripe_frontend_base(request: Request) -> str:
    """
    Prefer the request Origin (or Referer host) when allowlisted so Stripe success/cancel
    URLs match the site the user actually opened — not only FRONTEND_URL (often localhost in .env).
    """
    allowed = _checkout_allowed_frontend_origins()
    origin = (request.headers.get("origin") or "").strip().rstrip("/")
    if origin and origin in allowed:
        return origin

    referer = (request.headers.get("referer") or "").strip()
    if referer:
        try:
            parsed = urlparse(referer)
            if parsed.scheme and parsed.netloc:
                candidate = f"{parsed.scheme}://{parsed.netloc}".rstrip("/")
                if candidate in allowed:
                    return candidate
        except Exception:
            logger.debug("Could not parse Referer for Stripe return URL", exc_info=True)

    return (settings.FRONTEND_URL or "http://localhost:3000").rstrip("/")


def _get_available_plans() -> dict:
    """
    Central helper for subscription plans.
    Used by both the public plans endpoint and Stripe checkout.
    """
    return {
        "personal": {
            "id": "personal",
            "name": "Personal Plan",
            "description": "Free tier for individual users",
            "price": {
                "yearly": 0,
                "currency": "EUR",
            },
            "features": {
                "links": "unlimited",
                "items": "unlimited",
                "customization": "basic",
                "analytics": "basic",
                "custom_branding": False,
                "qr_codes": False,
            },
        },
        "solo_standard": {
            "id": "solo_standard",
            "name": "Business Solo - Standard",
            "description": "For solo businesses and micro enterprises",
            "price": {
                "yearly": settings.SUBSCRIPTION_PRICE_SOLO_STANDARD,
                "currency": "EUR",
            },
            "features": {
                "links": "unlimited",
                "items": "unlimited",
                "customization": "advanced",
                "analytics": "advanced",
                "custom_branding": True,
                "qr_codes": True,
            },
        },
        "solo_enterprise": {
            "id": "solo_enterprise",
            "name": "Business Solo - Enterprise",
            "description": "Enhanced features for growing businesses",
            "price": {
                "yearly": settings.SUBSCRIPTION_PRICE_SOLO_ENTERPRISE,
                "currency": "EUR",
            },
            "features": {
                "links": "unlimited",
                "items": "unlimited",
                "customization": "advanced",
                "analytics": "advanced",
                "custom_branding": True,
                "qr_codes": True,
                "priority_support": True,
            },
        },
        "org": {
            "id": "org",
            "name": "Organization Plan",
            "description": "For organizations with multiple members",
            "price": {
                "yearly": settings.SUBSCRIPTION_PRICE_ORG,
                "currency": "EUR",
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
                "max_departments": 5,
            },
        },
    }


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
        plans = _get_available_plans()
        
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


class TrialStartRequest(BaseModel):
    """Request model for starting a free trial"""
    plan_id: str


class CreateCheckoutSessionRequest(BaseModel):
    """Request model for creating a Stripe Checkout Session for a paid plan"""
    plan_id: str
    billing_cycle: str = "yearly"  # currently only yearly is used


@billing_router.post(
    "/checkout-session",
    response_model=dict,
    summary="Create Stripe Checkout Session",
    description="Create a Stripe Checkout Session for a paid subscription plan"
)
async def create_checkout_session(
    request: Request,
    body: CreateCheckoutSessionRequest = Body(...),
    current_user: User = Depends(get_current_user),
):
    """
    Create a Stripe Checkout Session for the selected plan.
    This will also create a pending subscription record which is activated
    via Stripe webhook after successful payment.
    """
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(
            status_code=500,
            detail="Stripe is not configured on the server. Please contact support."
        )

    plan_id = body.plan_id
    billing_cycle = body.billing_cycle or "yearly"

    try:
        plans = _get_available_plans()
        if plan_id not in plans:
            raise HTTPException(status_code=400, detail="Invalid plan_id")

        plan = plans[plan_id]
        price_yearly = plan["price"]["yearly"]
        currency = plan["price"]["currency"].lower()

        if price_yearly <= 0:
            raise HTTPException(
                status_code=400,
                detail="Selected plan is free and does not require payment."
            )

        # Resolve identity to attach subscription to correct owner
        context = await IdentityResolver.resolve_identity(current_user.id)

        from models.identity_models import SubscriptionCreate

        subscription_data = SubscriptionCreate(
            plan=plan_id,
            billing_cycle=billing_cycle,
            trial_days=0,  # paid subscription, no trial here
        )

        subscription = await SubscriptionService.create_subscription(
            subscription_data=subscription_data,
            user_id=context.user_id,
            business_id=context.business_id,
            organization_id=context.organization_id,
            actor_id=current_user.id,
            ip_address=get_client_ip(request),
            user_agent=get_user_agent(request),
        )

        # Persist amount & currency on the subscription
        try:
            await subscriptions_collection.update_one(
                {"id": subscription.id},
                {
                    "$set": {
                        "amount": float(price_yearly),
                        "currency": plan["price"]["currency"],
                    }
                },
            )
        except Exception:
            logger.warning("Failed to update subscription amount/currency", exc_info=True)

        # Create Stripe Checkout Session (subscription mode, yearly interval)
        frontend_base = _resolve_stripe_frontend_base(request)
        success_url = f"{frontend_base}/billing/choose-plan?status=success"
        cancel_url = f"{frontend_base}/billing/choose-plan?status=cancelled"

        try:
            checkout_session = stripe.checkout.Session.create(
                mode="subscription",
                payment_method_types=["card"],
                line_items=[
                    {
                        "price_data": {
                            "currency": currency,
                            "unit_amount": int(price_yearly * 100),
                            "product_data": {
                                "name": plan["name"],
                                "description": plan.get("description") or "",
                            },
                            "recurring": {
                                "interval": "year",
                            },
                        },
                        "quantity": 1,
                    }
                ],
                metadata={
                    "subscription_id": subscription.id,
                    "plan_id": plan_id,
                    "billing_cycle": billing_cycle,
                    "user_id": current_user.id,
                },
                success_url=success_url,
                cancel_url=cancel_url,
            )
        except Exception as e:
            logger.error(f"Error creating Stripe checkout session: {e}", exc_info=True)
            raise HTTPException(
                status_code=500,
                detail="Failed to create checkout session. Please try again.",
            )

        return {
            "checkout_url": checkout_session.url,
            "subscription_id": subscription.id,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in create_checkout_session: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Unexpected error while creating checkout session.",
        )


@billing_router.post(
    "/trial/start",
    response_model=dict,
    summary="Start free trial",
    description="Start a 14-day free trial for a subscription plan"
)
async def start_free_trial(
    request: Request,
    trial_request: TrialStartRequest = Body(...),
    current_user: User = Depends(get_current_user)
):
    """
    Start a 14-day free trial for a subscription plan
    
    Args:
        trial_request: Request body with plan_id
        current_user: Authenticated user
    
    Returns:
        Trial subscription details
    """
    # Extract client info
    ip_address = get_client_ip(request)
    user_agent = get_user_agent(request)
    plan_id = trial_request.plan_id
    
    try:
        # Validate plan ID
        valid_plans = ['solo_standard', 'solo_enterprise', 'org']
        if plan_id not in valid_plans:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid plan ID. Must be one of: {', '.join(valid_plans)}"
            )
        
        # Resolve identity to get account type
        context = await IdentityResolver.resolve_identity(current_user.id)
        
        # Check if user already has an active subscription or trial
        existing_subscription = None
        if context.business_id:
            existing_subscription = await SubscriptionService.get_subscription(
                business_id=context.business_id
            )
        elif context.organization_id:
            existing_subscription = await SubscriptionService.get_subscription(
                organization_id=context.organization_id
            )
        else:
            existing_subscription = await SubscriptionService.get_subscription(
                user_id=current_user.id
            )
        
        # Check if user already has an active trial or subscription
        if existing_subscription:
            if existing_subscription.status == SubscriptionStatus.TRIAL:
                raise HTTPException(
                    status_code=400,
                    detail="You already have an active trial. Please wait for it to end or subscribe directly."
                )
            elif existing_subscription.status == SubscriptionStatus.ACTIVE:
                raise HTTPException(
                    status_code=400,
                    detail="You already have an active subscription."
                )
        
        # Create subscription with 14-day trial
        from models.identity_models import SubscriptionCreate
        
        subscription_data = SubscriptionCreate(
            plan=plan_id,
            billing_cycle="yearly",  # Default to yearly, can be changed later
            trial_days=14  # 14-day free trial
        )
        
        # Create subscription with trial
        subscription = await SubscriptionService.create_subscription(
            subscription_data=subscription_data,
            user_id=context.user_id,
            business_id=context.business_id,
            organization_id=context.organization_id,
            actor_id=current_user.id,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        return {
            "success": True,
            "message": "Free trial started successfully!",
            "subscription": {
                "id": subscription.id,
                "plan": subscription.plan,
                "status": subscription.status,
                "trial_start_date": subscription.trial_start_date.isoformat() if subscription.trial_start_date else None,
                "trial_end_date": subscription.trial_end_date.isoformat() if subscription.trial_end_date else None,
                "trial_days_remaining": 14
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting free trial: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to start free trial: {str(e)}"
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


@billing_router.post(
    "/stripe/webhook",
    summary="Stripe webhook handler",
    description="Handles Stripe webhook events to activate subscriptions after successful payment",
)
async def stripe_webhook(request: Request):
    """
    Stripe webhook endpoint.
    Primarily listens for checkout.session.completed to activate subscriptions.
    """
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        if settings.STRIPE_WEBHOOK_SECRET:
            event = stripe.Webhook.construct_event(
                payload=payload,
                sig_header=sig_header,
                secret=settings.STRIPE_WEBHOOK_SECRET,
            )
        else:
            # Fallback: no signature verification (development only)
            logger.warning("STRIPE_WEBHOOK_SECRET not set; skipping signature verification")
            event = json.loads(payload.decode("utf-8"))
    except Exception as e:
        logger.error(f"Error verifying Stripe webhook: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail="Invalid Stripe webhook")

    event_type = event.get("type")
    data_object = event.get("data", {}).get("object", {})

    try:
        if event_type == "checkout.session.completed":
            metadata = data_object.get("metadata") or {}
            subscription_id = metadata.get("subscription_id")

            if subscription_id:
                update_fields = {
                    "stripe_customer_id": data_object.get("customer"),
                    "stripe_subscription_id": data_object.get("subscription"),
                    "transaction_id": data_object.get("payment_intent") or data_object.get("id"),
                    "checkout_details": {
                        "payment_status": data_object.get("payment_status"),
                        "amount_total": data_object.get("amount_total"),
                        "currency": data_object.get("currency"),
                        "payment_method_types": data_object.get("payment_method_types"),
                    },
                }

                await subscriptions_collection.update_one(
                    {"id": subscription_id},
                    {"$set": update_fields},
                )

                # Activate subscription (yearly by default)
                await SubscriptionService.activate_subscription(
                    subscription_id=subscription_id,
                    billing_cycle=metadata.get("billing_cycle") or "yearly",
                    actor_id=metadata.get("user_id") or "system",
                    ip_address="stripe_webhook",
                    user_agent="stripe_webhook",
                )

    except Exception as e:
        logger.error(f"Error handling Stripe webhook event: {e}", exc_info=True)
        # Return 200 so Stripe does not keep retrying forever for non-transient errors
        return {"received": True, "processed": False}

    return {"received": True, "processed": True}

