# Firestore Subscription Architecture

## Overview

The subscription system in OdinRing is built on Firestore and manages user subscriptions, trial periods, billing cycles, and access control. This document describes the complete architecture and database structure.

## Collection: `subscriptions`

### Document Structure

Each subscription document in Firestore follows this structure:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "user-uuid-here",              // For personal accounts
  "business_id": null,                       // For business_solo accounts
  "organization_id": null,                   // For organization accounts
  "plan": "solo",                            // "personal", "solo", "org"
  "status": "trial",                         // "none", "trial", "active", "expired"
  "billing_cycle": "yearly",                 // "monthly", "yearly"
  "trial_start_date": "2024-01-15T10:30:00Z",
  "trial_end_date": "2024-01-29T10:30:00Z",
  "current_period_start": null,
  "current_period_end": null,
  "billing": {
    "amount": 24.0,
    "currency": "EUR",
    "last_payment_date": null,
    "next_payment_date": null
  },
  "payment_integration": {
    "provider": "stripe",
    "customer_id": "cus_1234567890",
    "subscription_id": "sub_1234567890",
    "payment_method_id": "pm_1234567890"
  },
  "cancelled_at": null,
  "metadata": {
    "source": "registration",
    "notes": "Default subscription created on signup"
  },
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string (UUID) | Yes | Unique subscription identifier |
| `user_id` | string | Conditional | User ID for personal account subscriptions |
| `business_id` | string | Conditional | Business ID for business_solo account subscriptions |
| `organization_id` | string | Conditional | Organization ID for organization account subscriptions |
| `plan` | string (enum) | Yes | Subscription plan: `"personal"`, `"solo"`, `"org"` |
| `status` | string (enum) | Yes | Status: `"none"`, `"trial"`, `"active"`, `"expired"` |
| `billing_cycle` | string (enum) | Yes | Billing frequency: `"monthly"`, `"yearly"` |
| `trial_start_date` | timestamp | Conditional | Trial start date (required when status is "trial") |
| `trial_end_date` | timestamp | Conditional | Trial end date (trial_start_date + 14 days) |
| `current_period_start` | timestamp | Conditional | Billing period start (required when status is "active") |
| `current_period_end` | timestamp | Conditional | Billing period end (current_period_start + billing_period_days) |
| `billing` | object | No | Billing information (amount, currency, payment dates) |
| `payment_integration` | object | No | Payment gateway integration data |
| `cancelled_at` | timestamp | No | Cancellation timestamp |
| `metadata` | object | No | Additional metadata |
| `created_at` | timestamp | Yes | Document creation timestamp |
| `updated_at` | timestamp | Yes | Last update timestamp |

### Subscription Status Flow

```
┌─────────┐
│  none   │  (No subscription)
└────┬────┘
     │ User signs up
     ▼
┌─────────┐
│  trial  │  (14-day free trial)
└────┬────┘
     │ Trial expires OR User pays
     ├───────────────┐
     │               │
     ▼               ▼
┌─────────┐    ┌─────────┐
│ expired │    │ active  │  (Paid subscription)
└────┬────┘    └────┬────┘
     │              │ Period ends
     │              ▼
     │         ┌─────────┐
     │         │ expired │
     └─────────┴─────────┘
                │ User renews
                ▼
           ┌─────────┐
           │ active  │
           └─────────┘
```

### Subscription Lifecycle

#### 1. **Trial State** (Default on Signup)
- **Status**: `"trial"`
- **Fields**: 
  - `trial_start_date`: Set to signup time
  - `trial_end_date`: trial_start_date + 14 days
  - `current_period_start`: null
  - `current_period_end`: null
- **Access**: Full access to Standard plan features
- **Duration**: 14 days from signup
- **Transition**: 
  - To `"active"`: User completes payment
  - To `"expired"`: Trial period ends (14 days)

#### 2. **Active State** (After Payment)
- **Status**: `"active"`
- **Fields**:
  - `current_period_start`: Set to activation time
  - `current_period_end`: current_period_start + 365 days (yearly) or + 30 days (monthly)
  - `trial_start_date`: Retained for historical reference
  - `trial_end_date`: Retained for historical reference
- **Access**: Full access to subscribed plan features
- **Duration**: Based on billing cycle (365 days for yearly, 30 days for monthly)
- **Transition**: 
  - To `"expired"`: Billing period ends without renewal

#### 3. **Expired State**
- **Status**: `"expired"`
- **Access**: Dashboard access blocked, redirected to `/billing/choose-plan`
- **Transition**: 
  - To `"active"`: User selects and pays for a new plan

### Subscription Plans

| Plan | Price | Billing Cycle | Description |
|------|-------|---------------|-------------|
| `personal` | Free | N/A | Personal account (no longer used, defaults to Standard) |
| `solo` (Standard) | €24/year | yearly | Business Solo - Standard plan |
| `solo` (Enterprise) | €36/year | yearly | Business Solo - Enterprise plan |
| `org` | €68/year | yearly | Organization plan |

### Default Subscription Creation

**On User Registration:**
1. User signs up via `/api/auth/register`
2. Default subscription created automatically:
   - Plan: `"solo"` (Standard)
   - Status: `"trial"`
   - Trial period: 14 days from signup
   - Billing cycle: `"yearly"`

**On Account Type Selection (Onboarding):**
1. User completes onboarding and selects account type
2. Subscription updated or created based on account type:
   - Personal: Standard plan with trial
   - Business Solo: Standard plan with trial
   - Organization: Organization plan with trial

### Query Patterns

#### Get User Subscription
```python
subscription = await subscriptions_collection.find_one({
    "user_id": user_id
})
```

#### Get Business Subscription
```python
subscription = await subscriptions_collection.find_one({
    "business_id": business_id
})
```

#### Find Expired Trials
```python
expired_trials = await subscriptions_collection.find({
    "status": "trial",
    "trial_end_date": {"$lt": datetime.utcnow()}
})
```

#### Find Expiring Trials (within N days)
```python
target_date = datetime.utcnow() + timedelta(days=3)
next_day = target_date + timedelta(days=1)

expiring_trials = await subscriptions_collection.find({
    "status": "trial",
    "trial_end_date": {
        "$gte": target_date,
        "$lt": next_day
    }
})
```

#### Find Expired Active Subscriptions
```python
expired_subscriptions = await subscriptions_collection.find({
    "status": "active",
    "current_period_end": {"$lt": datetime.utcnow()}
})
```

### Indexes Required

1. **Single Field Indexes:**
   - `user_id`
   - `business_id`
   - `organization_id`
   - `status`
   - `trial_end_date`
   - `current_period_end`

2. **Composite Indexes:**
   - `status` + `trial_end_date` (for expired trial queries)
   - `status` + `current_period_end` (for expired subscription queries)

### Business Rules

1. **Trial Period**: All new subscriptions start with a 14-day trial
2. **Expiration**: Subscriptions automatically expire when trial_end_date or current_period_end passes
3. **Access Control**: Only `"trial"` and `"active"` statuses allow dashboard access
4. **Default Plan**: All new signups get Standard plan (solo) by default
5. **Billing**: All plans are billed yearly (365 days) by default

### Integration Points

1. **Identity Resolver**: Checks subscription status to determine access and routing
2. **Context Guard**: Enforces subscription-based access control
3. **Subscription Service**: Manages subscription lifecycle (create, activate, expire)
4. **Cron Job**: Periodically checks and updates expired subscriptions
5. **Payment Gateway**: Integrates with Stripe (or other providers) for payment processing

### Audit Logging

All subscription lifecycle events are logged:
- `trial_started`: When trial begins
- `subscription_activated`: When subscription is activated after payment
- `subscription_expired`: When trial or subscription expires
- `subscription_cancelled`: When user cancels subscription

### Migration Notes

- Existing users without subscriptions are treated as having no subscription (`status: "none"`)
- Personal accounts default to Standard plan with trial (not free tier)
- Trial periods are calculated from signup time, not onboarding completion time







