"""
Subscription Service
Phase 2: Subscription management and billing logic

Manages subscription lifecycle: creation, activation, expiration, and notifications.
"""

from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import logging
import uuid

from firestore_db import FirestoreDB
from models.identity_models import (
    Subscription, SubscriptionCreate, SubscriptionStatus, SubscriptionPlan
)
from audit_log_utils import log_audit_event
from config import settings

logger = logging.getLogger(__name__)

# Firestore collection
subscriptions_collection = FirestoreDB('subscriptions')


class SubscriptionService:
    """Service for managing subscriptions"""
    
    @staticmethod
    async def get_subscription(
        user_id: Optional[str] = None,
        business_id: Optional[str] = None,
        organization_id: Optional[str] = None
    ) -> Optional[Subscription]:
        """
        Get subscription for user, business, or organization
        
        Args:
            user_id: User ID (for personal accounts)
            business_id: Business ID (for business accounts)
            organization_id: Organization ID (for organization accounts)
        
        Returns:
            Subscription object or None
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
                return None
            
            sub_doc = await subscriptions_collection.find_one(query)
            
            if sub_doc:
                return Subscription(**sub_doc)
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting subscription: {e}", exc_info=True)
            return None
    
    @staticmethod
    async def create_subscription(
        subscription_data: SubscriptionCreate,
        user_id: Optional[str] = None,
        business_id: Optional[str] = None,
        organization_id: Optional[str] = None,
        actor_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Subscription:
        """
        Create a new subscription with trial period
        
        Args:
            subscription_data: Subscription creation data
            user_id: User ID (for personal accounts)
            business_id: Business ID (for business accounts)
            organization_id: Organization ID (for organization accounts)
            actor_id: ID of user creating subscription (for audit log)
            ip_address: IP address (for audit log)
            user_agent: User agent (for audit log)
        
        Returns:
            Created Subscription object
        """
        try:
            # Use config default trial days if not specified
            trial_days = subscription_data.trial_days if subscription_data.trial_days > 0 else settings.SUBSCRIPTION_TRIAL_DAYS
            
            # Calculate trial dates if trial
            trial_start = None
            trial_end = None
            status = SubscriptionStatus.NONE
            
            if trial_days > 0:
                # Set trial dates: start = now, end = now + trial_days (14 days)
                trial_start = datetime.utcnow()
                trial_end = trial_start + timedelta(days=trial_days)
                status = SubscriptionStatus.TRIAL
                logger.info(f"Setting trial period: start={trial_start.isoformat()}, end={trial_end.isoformat()}, days={trial_days}")
            
            # Create subscription
            subscription = Subscription(
                user_id=user_id,
                business_id=business_id,
                organization_id=organization_id,
                plan=subscription_data.plan,
                status=status,
                billing_cycle=subscription_data.billing_cycle,
                trial_start_date=trial_start,
                trial_end_date=trial_end
            )
            
            # Save to Firestore
            await subscriptions_collection.insert_one(subscription.model_dump())
            
            logger.info(f"Created subscription: {subscription.id} with status={status}, trial_days={trial_days}")
            
            # Log trial_started audit event if trial was started
            if status == SubscriptionStatus.TRIAL and actor_id:
                entity_type = "subscription"
                entity_id = subscription.id
                metadata = {
                    "subscription_id": subscription.id,
                    "plan": subscription.plan,
                    "trial_days": trial_days,
                    "trial_start_date": trial_start.isoformat() if trial_start else None,
                    "trial_end_date": trial_end.isoformat() if trial_end else None
                }
                if user_id:
                    metadata["user_id"] = user_id
                if business_id:
                    metadata["business_id"] = business_id
                if organization_id:
                    metadata["organization_id"] = organization_id
                
                await log_audit_event(
                    actor_id=actor_id,
                    action='trial_started',
                    entity_type=entity_type,
                    entity_id=entity_id,
                    ip_address=ip_address or "unknown",
                    user_agent=user_agent or "unknown",
                    metadata=metadata,
                    status="success"
                )
            
            return subscription
            
        except Exception as e:
            logger.error(f"Error creating subscription: {e}", exc_info=True)
            raise
    
    @staticmethod
    async def activate_subscription(
        subscription_id: str,
        billing_cycle: str = "yearly",
        actor_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> bool:
        """
        Activate a subscription (after successful payment)
        Sets expiry = now + 1 year for yearly plans
        
        Args:
            subscription_id: Subscription ID
            billing_cycle: Billing cycle ("monthly" = 30 days, "yearly" = 365 days)
            actor_id: ID of user activating subscription (for audit log)
            ip_address: IP address (for audit log)
            user_agent: User agent (for audit log)
        
        Returns:
            True if activated successfully
        """
        try:
            # Get subscription to get current details
            sub_doc = await subscriptions_collection.find_one({'id': subscription_id})
            if not sub_doc:
                logger.error(f"Subscription not found: {subscription_id}")
                return False
            
            now = datetime.utcnow()
            # Set billing period based on cycle: yearly = 365 days, monthly = 30 days
            if billing_cycle == "yearly":
                billing_period_days = 365
            else:
                billing_period_days = 30
            
            current_period_end = now + timedelta(days=billing_period_days)
            
            result = await subscriptions_collection.update_one(
                {'id': subscription_id},
                {'$set': {
                    'status': SubscriptionStatus.ACTIVE,
                    'current_period_start': now,
                    'current_period_end': current_period_end,
                    'billing_cycle': billing_cycle,
                    'updated_at': now
                }}
            )
            
            if result.get('modified_count', 0) > 0:
                logger.info(f"Activated subscription: {subscription_id}, expires in {billing_period_days} days")
                
                # Log subscription_activated audit event
                if actor_id:
                    entity_type = "subscription"
                    metadata = {
                        "subscription_id": subscription_id,
                        "plan": sub_doc.get('plan'),
                        "billing_cycle": billing_cycle,
                        "period_start": now.isoformat(),
                        "period_end": current_period_end.isoformat(),
                        "period_days": billing_period_days
                    }
                    
                    await log_audit_event(
                        actor_id=actor_id,
                        action='subscription_activated',
                        entity_type=entity_type,
                        entity_id=subscription_id,
                        ip_address=ip_address or "unknown",
                        user_agent=user_agent or "unknown",
                        metadata=metadata,
                        status="success"
                    )
                
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error activating subscription: {e}", exc_info=True)
            return False
    
    @staticmethod
    async def cancel_subscription(subscription_id: str) -> bool:
        """
        Cancel a subscription
        
        Args:
            subscription_id: Subscription ID
        
        Returns:
            True if cancelled successfully
        """
        try:
            result = await subscriptions_collection.update_one(
                {'id': subscription_id},
                {'$set': {
                    'status': SubscriptionStatus.EXPIRED,
                    'cancelled_at': datetime.utcnow(),
                    'updated_at': datetime.utcnow()
                }}
            )
            
            if result.get('modified_count', 0) > 0:
                logger.info(f"Cancelled subscription: {subscription_id}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error cancelling subscription: {e}", exc_info=True)
            return False
    
    @staticmethod
    async def check_and_update_expired_subscriptions() -> int:
        """
        Check and update expired subscriptions
        
        Idempotent cron job - can be run multiple times safely.
        Should be run periodically (e.g., daily cron job)
        
        Returns:
            Number of subscriptions updated
        """
        try:
            now = datetime.utcnow()
            count = 0
            
            # Find active subscriptions past their end date
            expired_subs = await subscriptions_collection.find({
                'status': SubscriptionStatus.ACTIVE,
                'current_period_end': {'$lt': now}
            })
            
            for sub in expired_subs:
                # Only update if still active (idempotent check)
                result = await subscriptions_collection.update_one(
                    {'id': sub['id'], 'status': SubscriptionStatus.ACTIVE},
                    {'$set': {
                        'status': SubscriptionStatus.EXPIRED,
                        'updated_at': now
                    }}
                )
                if result.get('modified_count', 0) > 0:
                    count += 1
                    logger.info(f"Expired active subscription: {sub['id']}")
                    
                    # Log expiry (use system actor for cron jobs)
                    await log_audit_event(
                        actor_id="system",
                        action='subscription_expired',
                        entity_type='subscription',
                        entity_id=sub['id'],
                        ip_address="system",
                        user_agent="cron_job",
                        metadata={
                            "subscription_id": sub['id'],
                            "plan": sub.get('plan'),
                            "expired_at": now.isoformat(),
                            "previous_status": SubscriptionStatus.ACTIVE
                        },
                        status="success"
                    )
            
            # Find trial subscriptions past their end date
            expired_trials = await subscriptions_collection.find({
                'status': SubscriptionStatus.TRIAL,
                'trial_end_date': {'$lt': now}
            })
            
            for sub in expired_trials:
                # Only update if still in trial (idempotent check)
                result = await subscriptions_collection.update_one(
                    {'id': sub['id'], 'status': SubscriptionStatus.TRIAL},
                    {'$set': {
                        'status': SubscriptionStatus.EXPIRED,
                        'updated_at': now
                    }}
                )
                if result.get('modified_count', 0) > 0:
                    count += 1
                    logger.info(f"Expired trial subscription: {sub['id']}")
                    
                    # Log expiry
                    await log_audit_event(
                        actor_id="system",
                        action='subscription_expired',
                        entity_type='subscription',
                        entity_id=sub['id'],
                        ip_address="system",
                        user_agent="cron_job",
                        metadata={
                            "subscription_id": sub['id'],
                            "plan": sub.get('plan'),
                            "expired_at": now.isoformat(),
                            "previous_status": SubscriptionStatus.TRIAL,
                            "trial_end_date": sub.get('trial_end_date').isoformat() if sub.get('trial_end_date') else None
                        },
                        status="success"
                    )
            
            if count > 0:
                logger.info(f"Updated {count} expired subscriptions")
            
            return count
            
        except Exception as e:
            logger.error(f"Error checking expired subscriptions: {e}", exc_info=True)
            return 0
    
    @staticmethod
    async def get_subscription_status_summary(
        user_id: Optional[str] = None,
        business_id: Optional[str] = None,
        organization_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get subscription status summary with helpful info
        
        Args:
            user_id: User ID
            business_id: Business ID
            organization_id: Organization ID
        
        Returns:
            Summary dict with status, days remaining, etc.
        """
        try:
            subscription = await SubscriptionService.get_subscription(
                user_id=user_id,
                business_id=business_id,
                organization_id=organization_id
            )
            
            if not subscription:
                return {
                    "has_subscription": False,
                    "status": SubscriptionStatus.NONE,
                    "plan": None,
                    "access_allowed": True,  # Free tier
                    "message": "No active subscription"
                }
            
            now = datetime.utcnow()
            days_remaining = None
            access_allowed = subscription.status in [
                SubscriptionStatus.ACTIVE,
                SubscriptionStatus.TRIAL
            ]
            
            # Helper to normalize datetimes to offset-naive UTC for subtraction
            def _to_naive_utc(dt: Optional[datetime]) -> Optional[datetime]:
                if not dt:
                    return None
                if isinstance(dt, datetime):
                    # If timezone-aware, convert to UTC then drop tzinfo
                    if dt.tzinfo is not None:
                        return dt.astimezone(tz=None).replace(tzinfo=None)
                    return dt
                return None

            # Normalize subscription dates
            trial_end = _to_naive_utc(subscription.trial_end_date)
            period_end = _to_naive_utc(subscription.current_period_end)

            # Calculate days remaining using normalized datetimes
            if subscription.status == SubscriptionStatus.TRIAL and trial_end:
                days_remaining = (trial_end - now).days
            elif subscription.status == SubscriptionStatus.ACTIVE and period_end:
                days_remaining = (period_end - now).days
            
            message = ""
            if subscription.status == SubscriptionStatus.TRIAL:
                message = f"Trial ends in {days_remaining} days" if days_remaining else "Trial active"
            elif subscription.status == SubscriptionStatus.ACTIVE:
                message = f"Active until {subscription.current_period_end.strftime('%Y-%m-%d')}" if subscription.current_period_end else "Active"
            elif subscription.status == SubscriptionStatus.EXPIRED:
                message = "Subscription expired. Please renew."
                access_allowed = False
            
            return {
                "has_subscription": True,
                "subscription_id": subscription.id,
                "status": subscription.status,
                "plan": subscription.plan,
                "billing_cycle": subscription.billing_cycle,
                "days_remaining": days_remaining,
                "access_allowed": access_allowed,
                "message": message,
                "trial_end_date": subscription.trial_end_date,
                "current_period_end": subscription.current_period_end
            }
            
        except Exception as e:
            logger.error(f"Error getting subscription summary: {e}", exc_info=True)
            return {
                "has_subscription": False,
                "status": SubscriptionStatus.NONE,
                "access_allowed": True,  # Fail open
                "message": "Error retrieving subscription"
            }
    
    @staticmethod
    async def get_expiring_trials(days_before: int = 3) -> list:
        """
        Get trials expiring within specified days
        
        Args:
            days_before: Days before expiry (e.g., 3 for 3 days before)
        
        Returns:
            List of subscription dicts
        """
        try:
            now = datetime.utcnow()
            target_date = now + timedelta(days=days_before)
            next_day = target_date + timedelta(days=1)
            
            # Find trials expiring in the next day window
            expiring_trials = await subscriptions_collection.find({
                'status': SubscriptionStatus.TRIAL,
                'trial_end_date': {
                    '$gte': target_date,
                    '$lt': next_day
                }
            })
            
            return list(expiring_trials)
            
        except Exception as e:
            logger.error(f"Error getting expiring trials: {e}", exc_info=True)
            return []

