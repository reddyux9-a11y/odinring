# Complete Subscription Structure Documentation

## Overview

This document provides a complete overview of the OdinRing subscription system, including data structures, lifecycle management, and user flows.

**Version**: 1.0  
**Last Updated**: 2024-01-29  
**Phase**: Phase 2 - Identity & Subscriptions

---

## Table of Contents

1. [Account Types](#account-types)
2. [Subscription Plans](#subscription-plans)
3. [Subscription Statuses](#subscription-statuses)
4. [Data Model Structure](#data-model-structure)
5. [Database Schema](#database-schema)
6. [Subscription Lifecycle](#subscription-lifecycle)
7. [API Endpoints](#api-endpoints)
8. [Frontend Integration](#frontend-integration)
9. [Access Control](#access-control)
10. [Flowchart](#flowchart)

---

## Account Types

The system supports three account types, each with different subscription requirements:

### 1. Personal Account
- **ID**: `personal`
- **Name**: Personal Account
- **Description**: Individual user account
- **Subscription Required**: No
- **Default Plan**: `personal` (free tier)
- **Trial Days**: 0 (no trial needed)

### 2. Business Solo
- **ID**: `business_solo`
- **Name**: Solo Business
- **Description**: Single-person business or micro enterprise
- **Subscription Required**: Yes
- **Default Plan**: `solo`
- **Trial Days**: 14 days
- **Features**: Custom branding, QR codes, advanced analytics

### 3. Organization
- **ID**: `organization`
- **Name**: Organization
- **Description**: Multi-department organization with multiple members
- **Subscription Required**: Yes
- **Default Plan**: `org`
- **Trial Days**: 14 days
- **Max Members**: 10
- **Max Departments**: 5
- **Features**: Team collaboration, departments, custom branding, QR codes

---

## Subscription Plans

### Personal Plan
- **ID**: `personal`
- **Name**: Personal Plan
- **Price**: Free (€0/month, €0/year)
- **Currency**: EUR
- **Billing Cycle**: N/A (free)
- **Features**:
  - Links: Unlimited
  - Items: Unlimited
  - Customization: Basic
  - Analytics: Basic
  - Custom Branding: No
  - QR Codes: No
  - Trial: Yes (14 days from signup)
- **Available For**: Personal accounts

### Solo Business Plan
- **ID**: `solo`
- **Name**: Solo Business Plan
- **Price**: 
  - Standard: €24/month or €24/year (user selectable)
  - Enterprise: €36/month or €36/year (user selectable)
- **Currency**: EUR
- **Billing Cycle**: User selectable - Monthly (30 days) or Yearly (365 days)
- **Features**:
  - Links: Unlimited
  - Items: Unlimited
  - Customization: Advanced
  - Analytics: Advanced
  - Custom Branding: Yes
  - QR Codes: Yes
  - Trial: Yes (14 days from signup)
- **Available For**: Business Solo accounts

### Organization Plan
- **ID**: `org`
- **Name**: Organization Plan
- **Price**: €68/month or €68/year (user selectable)
- **Currency**: EUR
- **Billing Cycle**: User selectable - Monthly (30 days) or Yearly (365 days)
- **Features**:
  - Links: Unlimited
  - Items: Unlimited
  - Customization: Advanced
  - Analytics: Advanced
  - Custom Branding: Yes
  - QR Codes: Yes
  - Team Collaboration: Yes
  - Departments: Yes
  - Max Members: 10
  - Max Departments: 5
  - Trial: Yes (14 days from signup)
- **Available For**: Organization accounts

---

## Subscription Statuses

The subscription system uses three status labels: **Trial**, **Active**, and **Expired**. All subscriptions start with a trial status upon signup.

### Trial
- **ID**: `trial`
- **Name**: Trial
- **Description**: Active 14-day trial period (starts from signup date)
- **Access Allowed**: Yes
- **Dashboard Access**: Yes
- **Default Routing**: `/dashboard`
- **Trial Duration**: 14 days from signup (fixed for all subscription plans)
- **Duration**: 14 days from creation/signup
- **Transition**: 
  - To `"active"`: User completes payment (can activate before trial ends)
  - To `"expired"`: Trial period ends after 14 days

### Active
- **ID**: `active`
- **Name**: Active
- **Description**: Active paid subscription with user-selected billing cycle
- **Access Allowed**: Yes
- **Dashboard Access**: Yes
- **Default Routing**: `/dashboard`
- **Billing Cycles**: User selectable - `monthly` (30 days) or `yearly` (365 days)
- **Transition**: 
  - To `"expired"`: Billing period ends without renewal

### Expired
- **ID**: `expired`
- **Name**: Expired
- **Description**: Subscription has expired (trial ended or billing period ended)
- **Grace Period**: 3 days after expiration - access still allowed, user can renew
- **Access Allowed**: Yes (during 3-day grace period), No (after grace period)
- **Dashboard Access**: Yes (during grace period), No (after grace period ends)
- **Default Routing**: `/dashboard` (grace period) → `/billing/choose-plan` (after grace period)
- **Grace Period Duration**: 3 days after expiration date
- **Transition**: Can be renewed to `active` (within or after grace period)

---

## Data Model Structure

### Subscription Model (Python/Pydantic)

```python
class Subscription(BaseModel):
    # Unique identifier
    id: str  # UUID
    
    # Subscriber reference (one of these is set)
    user_id: Optional[str] = None           # For personal accounts
    business_id: Optional[str] = None       # For business_solo accounts
    organization_id: Optional[str] = None   # For organization accounts
    
    # Subscription details
    plan: str = "personal"      # "personal", "solo", "org"
    status: str = "trial"       # "trial", "active", "expired" (all start as trial)
    
    # Billing
    billing_cycle: str = "monthly"  # User selectable: "monthly" (30 days) or "yearly" (365 days)
    amount: float = 0.0
    currency: str = "EUR"       # All pricing in Euros
    
    # Dates
    trial_start_date: Optional[datetime] = None
    trial_end_date: Optional[datetime] = None
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    
    # Payment integration
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    transaction_id: Optional[str] = None
    checkout_details: Optional[Dict[str, Any]] = None
    
    # Metadata
    created_at: datetime
    updated_at: datetime
```

### SubscriptionCreate Model

```python
class SubscriptionCreate(BaseModel):
    plan: str                    # "personal", "solo", "org"
    billing_cycle: str = "monthly"  # "monthly", "yearly"
    trial_days: int = 14        # Trial period duration
```

---

## Database Schema

### Firestore Collection: `subscriptions`

#### Document Structure

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "user-uuid-here",              // Optional: For personal accounts
  "business_id": "business-uuid-here",      // Optional: For business_solo accounts
  "organization_id": "org-uuid-here",       // Optional: For organization accounts
  
  "plan": "solo",                            // "personal", "solo", "org"
  "status": "trial",                         // "trial", "active", "expired" (all start as trial)
  "billing_cycle": "yearly",                 // User selectable: "monthly" (30 days) or "yearly" (365 days)
  
  "trial_start_date": "2024-01-15T10:30:00Z",
  "trial_end_date": "2024-01-29T10:30:00Z",
  "current_period_start": null,
  "current_period_end": null,
  "cancelled_at": null,
  
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
  
  "transaction_id": "ch_1234567890",
  "checkout_details": {
    "checkout_session_id": "cs_test_1234567890",
    "payment_intent_id": "pi_1234567890",
    "amount_paid": 24.0,
    "currency": "EUR",
    "payment_date": "2024-01-29T10:30:00Z",
    "payment_method": "card",
    "billing_address": {}
  },
  
  "metadata": {
    "source": "onboarding",
    "notes": "Subscription created during onboarding"
  },
  
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-29T10:30:00Z"
}
```

#### Field Specifications

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string (UUID) | Yes | Unique subscription identifier |
| `user_id` | string | Conditional | User ID for personal account subscriptions |
| `business_id` | string | Conditional | Business ID for business_solo account subscriptions |
| `organization_id` | string | Conditional | Organization ID for organization account subscriptions |
| `plan` | string (enum) | Yes | Subscription plan: `"personal"`, `"solo"`, `"org"` |
| `status` | string (enum) | Yes | Status: `"trial"`, `"active"`, `"expired"` (all subscriptions start as trial) |
| `billing_cycle` | string (enum) | Yes | User selectable billing frequency: `"monthly"` (30 days) or `"yearly"` (365 days) |
| `trial_start_date` | timestamp | Conditional | Trial start date (required when status is "trial") |
| `trial_end_date` | timestamp | Conditional | Trial end date (trial_start_date + 14 days) |
| `current_period_start` | timestamp | Conditional | Billing period start (required when status is "active") |
| `current_period_end` | timestamp | Conditional | Billing period end (current_period_start + billing_period_days) |
| `cancelled_at` | timestamp | No | Cancellation timestamp |
| `transaction_id` | string | No | Payment transaction ID from payment gateway |
| `checkout_details` | object | No | Checkout and payment details |
| `billing` | object | No | Billing information (amount, currency, payment dates) |
| `payment_integration` | object | No | Payment gateway integration data |
| `metadata` | object | No | Additional metadata |
| `created_at` | timestamp | Yes | Document creation timestamp |
| `updated_at` | timestamp | Yes | Last update timestamp |

#### Indexes

**Single Field Indexes:**
- `user_id`
- `business_id`
- `organization_id`
- `status`
- `plan`
- `trial_start_date`
- `trial_end_date`
- `current_period_start`
- `current_period_end`
- `transaction_id`

**Composite Indexes:**
- `status + trial_end_date` (for expired trial queries)
- `status + current_period_end` (for expired subscription queries)
- `plan + trial_start_date`
- `plan + current_period_start`
- `plan + trial_end_date`
- `plan + current_period_end`

---

## Subscription Lifecycle

### State Transitions

```
┌─────────┐
│  trial  │  (14-day trial from signup - ALL subscriptions start here)
└────┬────┘
     │ Trial expires OR User pays
     ├───────────────┐
     │               │
     ▼               ▼
┌─────────┐    ┌─────────┐
│ expired │    │ active  │  (Paid subscription - user selects monthly/yearly)
│(grace)  │    └────┬────┘
└────┬────┘         │ Period ends
     │              ▼
     │         ┌─────────┐
     │         │ expired │  (3-day grace period starts)
     │         │(grace)  │
     └─────────┴────┬────┘
                    │ User renews (within or after grace period)
                    ▼
               ┌─────────┐
               │ active  │
               └─────────┘
```

### Lifecycle States

#### 1. Trial State (Default - All Subscriptions Start Here)
- **Status**: `"trial"`
- **Fields**:
  - `trial_start_date`: Set to signup/creation time
  - `trial_end_date`: trial_start_date + 14 days (fixed for all plans)
  - `current_period_start`: null
  - `current_period_end`: null
- **Access**: Full access to plan features
- **Duration**: 14 days from signup (fixed for all subscription plans)
- **Note**: All subscriptions (personal, solo, org) start with trial status upon signup
- **Transitions**:
  - To `"active"`: User completes payment (can activate before trial ends)
  - To `"expired"`: Trial period ends after 14 days

#### 2. Active State
- **Status**: `"active"`
- **Fields**:
  - `current_period_start`: Set to activation time
  - `current_period_end`: current_period_start + billing_period_days (based on user-selected cycle)
  - `trial_start_date`: Retained for historical reference
  - `trial_end_date`: Retained for historical reference
- **Access**: Full access to subscribed plan features
- **Duration**: 
  - 365 days for yearly billing (user selected)
  - 30 days for monthly billing (user selected)
- **Billing Cycle**: User can toggle between monthly and yearly when activating/renewing
- **Transitions**:
  - To `"expired"`: Billing period ends without renewal (enters 3-day grace period)

#### 3. Expired State (with Grace Period)
- **Status**: `"expired"`
- **Grace Period**: 3 days after expiration date
- **Access During Grace Period**: 
  - Dashboard access: Allowed (user can still use features)
  - Routing: `/dashboard` (with expiration warning)
- **Access After Grace Period**: 
  - Dashboard access: Blocked
  - Routing: `/billing/choose-plan` (user must renew)
- **Fields**:
  - `current_period_end` or `trial_end_date`: Expiration date
  - Grace period ends: expiration_date + 3 days
- **Transitions**:
  - To `"active"`: User renews (within grace period or after)

### Lifecycle Operations

#### Creation
- **Trigger**: During signup or account type selection
- **Service**: `SubscriptionService.create_subscription()`
- **Process**:
  1. Set trial_start_date to signup time
  2. Calculate trial_end_date = trial_start_date + 14 days (fixed for all plans)
  3. Set status to 'trial' (all subscriptions start as trial)
  4. Create Subscription object
  5. Save to Firestore 'subscriptions' collection
  6. Log audit event: `trial_started`
- **Note**: All subscriptions start with trial status, regardless of plan type

#### Activation
- **Trigger**: After successful payment (user can activate during trial or after expiration)
- **Service**: `SubscriptionService.activate_subscription()`
- **Process**:
  1. Set status to 'active'
  2. Set current_period_start to now
  3. Set current_period_end based on user-selected billing_cycle:
     - Yearly: current_period_start + 365 days
     - Monthly: current_period_start + 30 days
  4. Update Firestore
  5. Log audit event: `subscription_activated`
- **Note**: User selects billing cycle (monthly/yearly) during checkout/activation

#### Expiration Check
- **Trigger**: Periodic cron job (daily recommended)
- **Service**: `SubscriptionService.check_and_update_expired_subscriptions()`
- **Process**:
  1. Find active subscriptions past current_period_end
  2. Find trial subscriptions past trial_end_date
  3. Update status to 'expired'
  4. Update Firestore
  5. Log audit event: `subscription_expired`

#### Cancellation
- **Trigger**: User cancels or payment fails
- **Service**: `SubscriptionService.cancel_subscription()`
- **Process**:
  1. Set status to 'expired'
  2. Set cancelled_at timestamp
  3. Update Firestore
  4. Log audit event: `subscription_cancelled`

---

## API Endpoints

### Identity Context

#### GET /me/context
- **Description**: Get identity context with subscription status
- **Returns**: `IdentityContext` object
- **Response**:
  ```json
  {
    "authenticated": true,
    "account_type": "business_solo",
    "user_id": "user-uuid",
    "profile_id": "profile-uuid",
    "business_id": "business-uuid",
    "subscription": {
      "status": "trial",
      "plan": "solo"
    },
    "next_route": "/dashboard",
    "needs_onboarding": false,
    "needs_billing": false
  }
  ```

### Subscription Endpoints

#### GET /subscriptions/{id}
- **Description**: Get subscription by ID
- **Status**: Not implemented (internal use only)

#### POST /subscriptions
- **Description**: Create subscription
- **Status**: Internal only (via onboarding)

#### PUT /subscriptions/{id}/activate
- **Description**: Activate subscription (after payment)
- **Status**: Internal only

#### PUT /subscriptions/{id}/cancel
- **Description**: Cancel subscription
- **Status**: Internal only

### Onboarding Endpoints

#### POST /onboarding/select-account-type
- **Description**: Select account type and create subscription
- **Creates**: Account entity + Subscription
- **Request**:
  ```json
  {
    "account_type": "business_solo",
    "business_data": {
      "business_name": "My Business",
      "business_email": "business@example.com"
    }
  }
  ```

---

## Frontend Integration

### Hook: useIdentityContext

**File**: `frontend/src/hooks/useIdentityContext.js`

**Functionality**:
- Fetches identity context from `/me/context`
- Provides subscription status
- Determines routing
- Checks if billing is needed

**Usage**:
```javascript
const { subscription, accountType, nextRoute, needsBilling } = useIdentityContext();
```

### Components

#### SubscriptionBadge
- **File**: `frontend/src/components/SubscriptionBadge.jsx`
- **Description**: Displays subscription status badge
- **Used In**: Sidebar, Dashboard header, Mobile settings

#### SubscriptionStatusBanner
- **File**: `frontend/src/components/SubscriptionStatusBanner.jsx`
- **Description**: Shows trial status, expired status, or upgrade prompts
- **Used In**: Dashboard

#### SubscriptionManagement
- **File**: `frontend/src/pages/SubscriptionManagement.jsx`
- **Description**: View and manage current subscription
- **Route**: `/subscription/manage`

#### BillingChoosePlan
- **File**: `frontend/src/pages/BillingChoosePlan.jsx`
- **Description**: Plan selection for expired subscriptions or upgrades
- **Route**: `/billing/choose-plan`

---

## Access Control

### Dashboard Access Rules

| Account Type | Status | Access | Routing |
|-------------|--------|--------|---------|
| Personal | trial | Allowed | `/dashboard` |
| Personal | active | Allowed | `/dashboard` |
| Personal | expired | Allowed (during 3-day grace period) / Blocked (after grace period) | `/dashboard` (grace) → `/billing/choose-plan` (after grace) |
| Business Solo | trial | Allowed | `/dashboard` |
| Business Solo | active | Allowed | `/dashboard` |
| Business Solo | expired | Allowed (during 3-day grace period) / Blocked (after grace period) | `/dashboard` (grace) → `/billing/choose-plan` (after grace) |
| Organization | trial | Allowed | `/dashboard` |
| Organization | active | Allowed | `/dashboard` |
| Organization | expired | Allowed (during 3-day grace period) / Blocked (after grace period) | `/dashboard` (grace) → `/billing/choose-plan` (after grace) |

### Middleware: ContextGuard

**Purpose**: Enforces subscription requirements for dashboard access

**Checks**:
1. User authentication
2. Subscription status
3. Account type
4. Organization membership (if applicable)

**Responses**:
- `402`: Subscription expired
- `403`: Access forbidden

---

## Business Rules

### Trial Period
- **Duration**: 14 days (fixed for all subscription plans)
- **Calculation**: `trial_end_date = trial_start_date + 14 days`
- **Available For**: All subscription plans (personal, solo, org)
- **Start**: Trial starts from signup date
- **Access**: Full access to plan features during trial
- **Note**: All subscriptions start with trial status upon signup

### Billing Periods (User Selectable)
- **Yearly**: 365 days (user selectable option)
  - `current_period_end = current_period_start + 365 days`
- **Monthly**: 30 days (user selectable option)
  - `current_period_end = current_period_start + 30 days`
- **User Choice**: Users can toggle between monthly and yearly billing cycles during checkout/activation

### Pricing (All in EUR)
- **Solo Standard**: €24/month or €24/year (user selectable)
- **Solo Enterprise**: €36/month or €36/year (user selectable)
- **Organization**: €68/month or €68/year (user selectable)
- **Currency**: EUR (Euros) - all pricing must be in EUR

### Expiration Handling with Grace Period
- **Trial Expiration**:
  - Trigger: `trial_end_date < now`
  - Action: Set status to 'expired', enter 3-day grace period
  - Grace Period: 3 days - access still allowed, user can renew
  - After Grace: Block dashboard access, redirect to `/billing/choose-plan`
- **Subscription Expiration**:
  - Trigger: `current_period_end < now AND status = 'active'`
  - Action: Set status to 'expired', enter 3-day grace period
  - Grace Period: 3 days - access still allowed, user can renew
  - After Grace: Block dashboard access, redirect to `/billing/choose-plan`
- **Grace Period Calculation**: `grace_period_end = expiration_date + 3 days`

---

## Configuration

### Trial Settings
- **Default Trial Days**: 14
- **Grace Period Days**: 3
- **Config File**: `backend/config.py`
- **Variables**: 
  - `SUBSCRIPTION_TRIAL_DAYS`
  - `SUBSCRIPTION_GRACE_PERIOD_DAYS`

### Organization Limits
- **Max Members Default**: 10
- **Max Departments Default**: 5
- **Config File**: `backend/config.py`
- **Variable**: `MAX_ORG_MEMBERS_DEFAULT`

### Payment Integration
- **Provider**: Stripe
- **Status**: Configured but not fully implemented
- **Config File**: `backend/config.py`
- **Variable**: `STRIPE_SECRET_KEY`

---

## Audit Logging

All subscription lifecycle events are logged with the following events:

- **trial_started**: When trial begins
- **subscription_activated**: When subscription is activated after payment
- **subscription_expired**: When trial or subscription expires
- **subscription_cancelled**: When user cancels subscription

Each audit log includes:
- Actor ID (user ID or "system" for cron jobs)
- Action type
- Entity type ("subscription")
- Entity ID (subscription ID)
- Metadata (plan, dates, status changes)
- IP address and user agent
- Status (success/failure)

---

## Current Limitations

1. **Payment Processing**: Stripe integration configured but not fully implemented
2. **Pricing**: Plan prices not dynamically set in system
3. **Billing Page**: Billing page route exists but UI not fully implemented
4. **Subscription Management**: Read-only operations available, write operations are internal only

---

## Future Enhancements

- [ ] Full Stripe payment integration
- [ ] Subscription upgrade/downgrade flows
- [ ] Billing history
- [ ] Invoice generation
- [ ] Payment method management
- [ ] Subscription renewal automation
- [ ] Usage-based billing
- [ ] Plan comparison page
- [ ] Email notifications for subscription events
- [ ] Usage analytics per subscription tier
- [ ] Family/team subscription plans

---

## Related Documentation

- [Subscription User Flow](./SUBSCRIPTION_USER_FLOW.md)
- [Firestore Subscription Architecture](./firestore_subscription_architecture.md)
- [Identity Models](../backend/models/identity_models.py)
- [Subscription Service](../backend/services/subscription_service.py)

---

**Last Updated**: 2024-01-29

