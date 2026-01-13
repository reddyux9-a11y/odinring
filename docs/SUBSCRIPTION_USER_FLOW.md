# Subscription User Flow - Complete UI Screens Documentation

## Overview

This document describes the complete user flow for the subscription system, including all UI screens and navigation paths.

## User Flow Diagram

```
1. Sign Up
   ↓
2. Dashboard (with 14-day trial)
   ↓
3. Optional: Subscription Index Page (can skip)
   ↓
4. Dashboard (trial active)
   ├─ Trial Status Banner (14 days remaining)
   ├─ Subscription Badge (Trial)
   └─ "Manage Subscription" link
   ↓
5a. Trial Expires → Redirected to Billing Choose Plan
5b. User clicks "Manage Subscription" → Subscription Management
5c. User continues using dashboard
   ↓
6. Billing Choose Plan Page
   ├─ View available plans
   ├─ Select plan
   └─ Navigate to Checkout
   ↓
7. Checkout Page
   ├─ Enter payment details (mock)
   ├─ Review order
   └─ Submit payment
   ↓
8a. Payment Success → Payment Success Page
8b. Payment Failed → Payment Failed Page
   ↓
9. Dashboard (subscription active)
   ├─ Active Status Banner
   ├─ Subscription Badge (Active)
   └─ Full access to premium features
```

---

## Screen-by-Screen Breakdown

### 1. Sign Up (`/auth`)

**File**: `frontend/src/pages/AuthPage.jsx`

**What happens**:
- User registers with email/password
- Backend automatically creates subscription with `status: "trial"`, 14-day trial period
- User is redirected to `/dashboard`

**Key Points**:
- Subscription is created automatically on signup
- No explicit subscription selection required at signup

---

### 2. Dashboard (`/dashboard`)

**File**: `frontend/src/pages/Dashboard.jsx`

**Features**:
- Main application dashboard
- Displays `SubscriptionStatusBanner` component
- Shows subscription status via `SubscriptionBadge` in sidebar
- Access to all features during trial

**Subscription Status Banner**:
- **Trial**: Shows days remaining, "Upgrade Now" button
- **Expired**: Shows "Subscription Expired" message, "Choose Plan" button
- **Active**: No banner (user has full access)

**Subscription Badge** (in sidebar):
- Clickable badge showing current subscription status
- Clicking navigates to `/subscription/manage`

---

### 3. Subscription Index (`/subscription`)

**File**: `frontend/src/pages/SubscriptionIndex.jsx`

**Purpose**: Optional subscription selection screen after signup

**Features**:
- Display available plans (Business Solo Standard, Enterprise, Organization)
- "Choose Plan" buttons navigate to `/checkout?plan={planId}`
- "Skip for now" button navigates to `/dashboard`
- Can be accessed later via sidebar → Subscription

**User Actions**:
- Select a plan → Goes to checkout
- Skip → Goes to dashboard (trial continues)

---

### 4. Billing Choose Plan (`/billing/choose-plan`)

**File**: `frontend/src/pages/BillingChoosePlan.jsx`

**Purpose**: Plan selection for expired subscriptions or upgrades

**When Shown**:
- Trial expires → Automatic redirect
- User manually navigates from dashboard
- User clicks "Upgrade" button

**Features**:
- Shows available plans based on account type
- Displays current subscription status
- Shows days remaining for trial
- "Choose Plan" buttons navigate to `/checkout?plan={planId}`

**Plans Available**:
- **Business Solo - Standard**: €24/year
- **Business Solo - Enterprise**: €36/year
- **Organization**: €68/year

---

### 5. Checkout (`/checkout`)

**File**: `frontend/src/pages/Checkout.jsx`

**Purpose**: Payment processing page

**Features**:
- Payment form (card number, expiry, CVV, name, billing address)
- Order summary with selected plan details
- Mock payment processing (no real payment gateway)
- Form validation
- Loading states

**User Flow**:
1. User fills payment form
2. Submits payment
3. Backend activates subscription
4. On success → Navigate to `/payment/success`
5. On failure → Navigate to `/payment/failed`

**URL Parameters**:
- `plan`: Plan ID (e.g., `solo_standard`, `solo_enterprise`, `org`)

---

### 6. Payment Success (`/payment/success`)

**File**: `frontend/src/pages/PaymentSuccess.jsx`

**Purpose**: Confirmation page after successful payment

**Features**:
- Success message and icon
- Plan name display
- Transaction ID (if available)
- "Go to Dashboard" button
- Refetches identity context to update subscription status

**URL Parameters**:
- `plan`: Plan name
- `transaction_id`: Transaction ID (optional)

**User Actions**:
- Click "Go to Dashboard" → Returns to `/dashboard` with active subscription

---

### 7. Payment Failed (`/payment/failed`)

**File**: `frontend/src/pages/PaymentFailed.jsx`

**Purpose**: Error page when payment fails

**Features**:
- Error message
- Common reasons for failure
- "Try Payment Again" button (returns to checkout)
- "Choose a Different Plan" button (returns to choose plan)

**URL Parameters**:
- `error`: Error message (optional)
- `plan`: Plan ID for retry (optional)

**User Actions**:
- Retry payment → Returns to `/checkout?plan={planId}`
- Choose different plan → Returns to `/billing/choose-plan`

---

### 8. Subscription Management (`/subscription/manage`)

**File**: `frontend/src/pages/SubscriptionManagement.jsx`

**Purpose**: View and manage current subscription

**Features**:
- Current subscription details (plan, status, dates)
- Days remaining (for trial or active subscription)
- Renewal date (for active subscriptions)
- Plan pricing information
- Actions:
  - **Trial/Expired**: "Upgrade Now" button
  - **Active**: "Change Plan" and "Cancel Subscription" buttons
- Payment information (transaction ID, payment method)
- Help text about trial, cancellation, renewal

**Access Points**:
- Sidebar → Settings → Subscription
- Subscription badge click
- "Manage Subscription" link in banners

**User Actions**:
- Upgrade/Change Plan → Navigates to `/billing/choose-plan`
- Cancel Subscription → Confirms and cancels (access until period ends)

---

## Component Integration

### SubscriptionStatusBanner

**File**: `frontend/src/components/SubscriptionStatusBanner.jsx`

**Used In**: Dashboard

**Displays**:
- Trial status with days remaining
- Expired status with upgrade prompt
- Active status: Hidden (no banner needed)

### SubscriptionBadge

**File**: `frontend/src/components/SubscriptionBadge.jsx`

**Used In**: 
- Sidebar (desktop)
- Mobile settings page
- Dashboard header

**Features**:
- Shows subscription status (Trial, Active, Expired)
- Clickable → Navigates to `/subscription/manage`
- Different sizes (small, default, large)

---

## Navigation Structure

### Sidebar Navigation

**File**: `frontend/src/components/PremiumSidebar.jsx`

**Subscription Entry Points**:
1. **Subscription Badge** (next to username) → `/subscription/manage`
2. **Settings → Subscription** → `/subscription/manage`

### Mobile Navigation

**File**: `frontend/src/components/MobileNavigation.jsx`

Similar navigation structure for mobile devices.

---

## Routes Configuration

**File**: `frontend/src/App.js`

All routes are protected (require authentication):

```javascript
/subscription                    → SubscriptionIndex (optional plan selection)
/subscription/manage             → SubscriptionManagement (view/manage subscription)
/billing/choose-plan             → BillingChoosePlan (select plan for expired/upgrade)
/checkout                        → Checkout (payment processing)
/payment/success                 → PaymentSuccess (payment confirmation)
/payment/failed                  → PaymentFailed (payment error)
/dashboard                       → Dashboard (main app, shows subscription status)
```

---

## State Management

### Identity Context

**File**: `frontend/src/hooks/useIdentityContext.js`

**Provides**:
- `subscription`: Current subscription object
- `accountType`: User account type
- `nextRoute`: Backend-suggested route (e.g., `/billing/choose-plan` for expired)
- `needsBilling`: Boolean indicating if billing is required

**Used By**:
- All subscription-related pages
- Dashboard for routing decisions
- Components for displaying subscription status

---

## User Flow Scenarios

### Scenario 1: New User Signup

1. User signs up → Subscription created (trial)
2. Redirected to `/dashboard`
3. Sees trial banner (14 days remaining)
4. Can optionally visit `/subscription` to choose plan early
5. Or continue using dashboard during trial
6. After 14 days → Redirected to `/billing/choose-plan`

### Scenario 2: Trial Expires

1. User on dashboard → Trial ends
2. Backend sets `status: "expired"`
3. Middleware/Identity resolver redirects to `/billing/choose-plan`
4. User selects plan → `/checkout`
5. Completes payment → `/payment/success`
6. Returns to `/dashboard` with active subscription

### Scenario 3: User Upgrades During Trial

1. User on dashboard during trial
2. Clicks "Upgrade Now" or visits `/subscription/manage`
3. Selects plan → `/checkout`
4. Completes payment → `/payment/success`
5. Trial converts to active subscription immediately
6. Returns to `/dashboard` with active subscription

### Scenario 4: Payment Fails

1. User on `/checkout`
2. Submits payment → Error occurs
3. Redirected to `/payment/failed`
4. User can retry or choose different plan
5. Returns to `/checkout` or `/billing/choose-plan`

### Scenario 5: Active Subscription Management

1. User on `/dashboard` with active subscription
2. Clicks subscription badge or sidebar → `/subscription/manage`
3. Views subscription details
4. Can change plan or cancel
5. Changes take effect at next billing cycle (for cancellation)

---

## Key Features

### Subscription Status Display

- **Trial**: Blue badge, shows days remaining
- **Active**: Green badge, shows renewal date
- **Expired**: Red badge, shows expired message

### Access Control

- **Trial**: Full dashboard access
- **Active**: Full dashboard access
- **Expired**: Dashboard access blocked, redirected to billing

### Payment Processing

- Currently uses mock checkout (no real payment gateway)
- Backend activates subscription on payment success
- Transaction ID stored for reference

### Subscription Lifecycle

1. **Creation**: On signup, trial starts immediately
2. **Trial**: 14 days of full access
3. **Activation**: After payment, status changes to active
4. **Expiration**: After period ends, status changes to expired
5. **Renewal**: Automatic (unless cancelled)

---

## Future Enhancements

- [ ] Real payment gateway integration (Stripe, PayPal, etc.)
- [ ] Billing history page (invoices, receipts)
- [ ] Subscription upgrade/downgrade with prorated billing
- [ ] Email notifications for subscription events
- [ ] Usage analytics per subscription tier
- [ ] Family/team subscription plans

---

**Last Updated**: 2024-01-29







