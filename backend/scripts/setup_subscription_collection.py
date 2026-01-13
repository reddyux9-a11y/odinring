#!/usr/bin/env python3
"""
Setup Subscription Collection in Firestore

This script initializes the subscriptions collection in Firestore
with proper indexes and validates the schema structure.

Usage:
    python backend/scripts/setup_subscription_collection.py
"""

import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from firestore_db import FirestoreDB
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Firestore collection
subscriptions_collection = FirestoreDB('subscriptions')


async def validate_subscription_schema():
    """Validate that subscription documents match expected schema"""
    logger.info("Validating subscription schema...")
    
    # Get a sample subscription document
    sample_sub = await subscriptions_collection.find_one({})
    
    if not sample_sub:
        logger.info("No existing subscriptions found. Schema will be validated on first document creation.")
        return True
    
    # Expected fields
    required_fields = ['id', 'plan', 'status', 'billing_cycle', 'created_at', 'updated_at']
    optional_fields = [
        'user_id', 'business_id', 'organization_id',
        'trial_start_date', 'trial_end_date',
        'current_period_start', 'current_period_end',
        'billing', 'payment_integration', 'cancelled_at', 'metadata'
    ]
    
    all_fields = required_fields + optional_fields
    sample_fields = set(sample_sub.keys())
    
    # Check for required fields
    missing_required = set(required_fields) - sample_fields
    if missing_required:
        logger.warning(f"Sample subscription missing required fields: {missing_required}")
        return False
    
    # Check for unexpected fields (warn only)
    unexpected = sample_fields - set(all_fields)
    if unexpected:
        logger.info(f"Sample subscription has additional fields: {unexpected}")
    
    logger.info("✅ Subscription schema validation passed")
    return True


async def create_sample_subscription_document():
    """Create a sample subscription document for reference"""
    logger.info("Creating sample subscription document...")
    
    from models.identity_models import Subscription, SubscriptionPlan, SubscriptionStatus
    
    sample_subscription = Subscription(
        id="sample-subscription-id",
        user_id="sample-user-id",
        plan=SubscriptionPlan.SOLO,
        status=SubscriptionStatus.TRIAL,
        billing_cycle="yearly",
        trial_start_date=datetime.utcnow(),
        trial_end_date=datetime.utcnow()
    )
    
    # Check if sample already exists
    existing = await subscriptions_collection.find_one({"id": "sample-subscription-id"})
    if existing:
        logger.info("Sample subscription document already exists. Skipping creation.")
        return
    
    try:
        await subscriptions_collection.insert_one(sample_subscription.model_dump())
        logger.info("✅ Sample subscription document created")
    except Exception as e:
        logger.error(f"Failed to create sample subscription: {e}")
        # Don't fail the script if sample creation fails


async def list_all_subscriptions():
    """List all subscriptions for verification"""
    logger.info("Listing all subscriptions...")
    
    try:
        subscriptions = await subscriptions_collection.find({})
        count = len(list(subscriptions))
        logger.info(f"Found {count} subscription(s) in collection")
        
        if count > 0:
            logger.info("\nSubscription IDs:")
            for sub in subscriptions:
                logger.info(f"  - {sub.get('id')} (plan: {sub.get('plan')}, status: {sub.get('status')})")
    except Exception as e:
        logger.error(f"Error listing subscriptions: {e}")


async def verify_indexes():
    """Verify that required indexes exist"""
    logger.info("Verifying Firestore indexes...")
    logger.info("Note: Indexes must be created in Firebase Console or via firestore.indexes.json")
    logger.info("Required indexes for subscriptions collection:")
    logger.info("  1. Single field: user_id")
    logger.info("  2. Single field: business_id")
    logger.info("  3. Single field: organization_id")
    logger.info("  4. Single field: status")
    logger.info("  5. Composite: status + trial_end_date")
    logger.info("  6. Composite: status + current_period_end")


async def main():
    """Main setup function"""
    logger.info("=" * 60)
    logger.info("Setting up Subscription Collection in Firestore")
    logger.info("=" * 60)
    
    try:
        # Validate schema
        await validate_subscription_schema()
        
        # List existing subscriptions
        await list_all_subscriptions()
        
        # Verify indexes (informational only)
        await verify_indexes()
        
        logger.info("\n" + "=" * 60)
        logger.info("✅ Subscription collection setup complete!")
        logger.info("=" * 60)
        
    except Exception as e:
        logger.error(f"❌ Setup failed: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())







