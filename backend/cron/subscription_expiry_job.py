"""
Subscription Expiry Cron Job
Runs periodically to check and expire subscriptions, send notifications

This is an idempotent job that can be run multiple times safely.
Should be run daily (or more frequently for testing).
"""

from datetime import datetime, timedelta
import logging
import asyncio

import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.subscription_service import SubscriptionService
from firestore_db import FirestoreDB
from models.identity_models import SubscriptionStatus
from audit_log_utils import log_audit_event

logger = logging.getLogger(__name__)

# Firestore collections
users_collection = FirestoreDB('users')
businesses_collection = FirestoreDB('businesses')
organizations_collection = FirestoreDB('organizations')


async def send_trial_reminder_notification(subscription: dict, days_remaining: int, user_email: str = None):
    """
    Send trial reminder notification
    
    Args:
        subscription: Subscription document
        days_remaining: Days until trial expires
        user_email: User email address
    """
    try:
        # TODO: Implement actual notification (email, push, etc.)
        # For now, just log the notification
        logger.info(
            f"Trial reminder: Subscription {subscription['id']} expires in {days_remaining} days. "
            f"User: {user_email or 'unknown'}"
        )
        
        # Log notification event
        actor_id = subscription.get('user_id') or subscription.get('business_id') or subscription.get('organization_id') or "system"
        
        await log_audit_event(
            actor_id="system",
            action='trial_reminder_sent',
            entity_type='subscription',
            entity_id=subscription['id'],
            ip_address="system",
            user_agent="cron_job",
            metadata={
                "subscription_id": subscription['id'],
                "plan": subscription.get('plan'),
                "days_remaining": days_remaining,
                "user_email": user_email
            },
            status="success"
        )
        
    except Exception as e:
        logger.error(f"Error sending trial reminder notification: {e}", exc_info=True)


async def send_expiry_notification(subscription: dict, user_email: str = None):
    """
    Send subscription expiry notification
    
    Args:
        subscription: Subscription document
        user_email: User email address
    """
    try:
        # TODO: Implement actual notification (email, push, etc.)
        # For now, just log the notification
        logger.info(
            f"Subscription expired: {subscription['id']}. User: {user_email or 'unknown'}"
        )
        
        # Log notification event
        await log_audit_event(
            actor_id="system",
            action='expiry_notification_sent',
            entity_type='subscription',
            entity_id=subscription['id'],
            ip_address="system",
            user_agent="cron_job",
            metadata={
                "subscription_id": subscription['id'],
                "plan": subscription.get('plan'),
                "user_email": user_email
            },
            status="success"
        )
        
    except Exception as e:
        logger.error(f"Error sending expiry notification: {e}", exc_info=True)


async def get_user_email_for_subscription(subscription: dict) -> str:
    """
    Get user email for a subscription
    
    Args:
        subscription: Subscription document
    
    Returns:
        User email or None
    """
    try:
        user_id = subscription.get('user_id')
        business_id = subscription.get('business_id')
        organization_id = subscription.get('organization_id')
        
        if user_id:
            user = await users_collection.find_one({'id': user_id})
            return user.get('email') if user else None
        elif business_id:
            business = await businesses_collection.find_one({'id': business_id})
            if business:
                owner_id = business.get('owner_id')
                user = await users_collection.find_one({'id': owner_id})
                return user.get('email') if user else None
        elif organization_id:
            organization = await organizations_collection.find_one({'id': organization_id})
            if organization:
                owner_id = organization.get('owner_id')
                user = await users_collection.find_one({'id': owner_id})
                return user.get('email') if user else None
        
        return None
        
    except Exception as e:
        logger.error(f"Error getting user email for subscription: {e}", exc_info=True)
        return None


async def process_subscription_expiry():
    """
    Main cron job function to process subscription expiry
    
    This function:
    1. Expires subscriptions that have passed their end date
    2. Sends reminders for trials expiring soon (3 days, 1 day)
    3. Sends expiry notifications
    """
    try:
        logger.info("Starting subscription expiry job...")
        
        # Step 1: Check and expire subscriptions
        expired_count = await SubscriptionService.check_and_update_expired_subscriptions()
        logger.info(f"Expired {expired_count} subscriptions")
        
        # Step 2: Get trials expiring in 3 days
        trials_3_days = await SubscriptionService.get_expiring_trials(days_before=3)
        for trial in trials_3_days:
            user_email = await get_user_email_for_subscription(trial)
            await send_trial_reminder_notification(trial, days_remaining=3, user_email=user_email)
        
        # Step 3: Get trials expiring in 1 day
        trials_1_day = await SubscriptionService.get_expiring_trials(days_before=1)
        for trial in trials_1_day:
            user_email = await get_user_email_for_subscription(trial)
            await send_trial_reminder_notification(trial, days_remaining=1, user_email=user_email)
        
        # Step 4: Get recently expired subscriptions (expired today) to send notifications
        # This is handled by the expiry check above, but we can also send notifications here
        subscriptions_collection = FirestoreDB('subscriptions')
        
        now = datetime.utcnow()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        
        recently_expired = await subscriptions_collection.find({
            'status': SubscriptionStatus.EXPIRED,
            'updated_at': {'$gte': today_start}
        })
        
        for expired_sub in recently_expired:
            user_email = await get_user_email_for_subscription(expired_sub)
            await send_expiry_notification(expired_sub, user_email=user_email)
        
        logger.info("Subscription expiry job completed successfully")
        return {
            "status": "success",
            "expired_count": expired_count,
            "reminders_3_days": len(trials_3_days),
            "reminders_1_day": len(trials_1_day),
            "expiry_notifications": len(list(recently_expired))
        }
        
    except Exception as e:
        logger.error(f"Error in subscription expiry job: {e}", exc_info=True)
        return {
            "status": "error",
            "error": str(e)
        }


# Standalone runner for testing or manual execution
if __name__ == "__main__":
    async def main():
        result = await process_subscription_expiry()
        print(f"Job result: {result}")
    
    asyncio.run(main())

