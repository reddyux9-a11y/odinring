# Firestore Schema Documentation

This directory contains schema definitions and documentation for Firestore collections.

## Subscription Collection Schema

### Files

- **`subscription_schema.json`** - Complete JSON schema definition with:
  - Field definitions and types
  - Required vs optional fields
  - Example documents
  - Query patterns
  - Business rules
  - Lifecycle states

### Related Documentation

- **`../docs/firestore_subscription_architecture.md`** - Comprehensive architecture documentation

### Setup Scripts

- **`../scripts/setup_subscription_collection.py`** - Script to validate and set up subscription collection
- **`../scripts/init_firestore_collections.py`** - Initializes all Firestore collections including subscriptions

### Firestore Indexes

Indexes are defined in **`../../firestore.indexes.json`**. Required indexes for subscriptions:

1. Single field: `user_id`
2. Single field: `business_id`
3. Single field: `organization_id`
4. Composite: `status + trial_end_date`
5. Composite: `status + current_period_end`

### Deployment

To deploy the indexes:

```bash
firebase deploy --only firestore:indexes
```

### Validation

Run the setup script to validate the subscription collection:

```bash
python backend/scripts/setup_subscription_collection.py
```







