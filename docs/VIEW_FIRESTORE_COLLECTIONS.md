# How to View and Create Missing Firestore Collections

## Overview

If you're only seeing **10 collections** in your Firestore console, there are actually **8 missing collections** (18 total). The missing ones are:

### Missing Collections (8 total)

**Phase 1 - Security Collections (3):**
1. `sessions` - Active user sessions
2. `refresh_tokens` - JWT refresh tokens  
3. `audit_logs` - Audit trail for compliance

**Phase 2 - Identity & Subscription Collections (5):**
4. `businesses` - Solo business profiles
5. `organizations` - Multi-user organizations
6. `departments` - Organization departments
7. `memberships` - Organization memberships
8. `subscriptions` - **Subscription plans and billing** ⭐ (This is what you're looking for!)

---

## Why You're Only Seeing 10 Collections

Firestore **doesn't create collections until the first document is written**. The 10 collections you see are the **Core Collections (Phase 0)** that are actively used by your application:

1. `users`
2. `links`
3. `rings`
4. `analytics`
5. `ring_analytics`
6. `qr_scans`
7. `appointments`
8. `availability`
9. `admins`
10. `status_checks`

The missing collections will only appear when:
- You run the initialization script (recommended)
- The application creates the first document in those collections
- Someone signs up with a business/organization account type
- A subscription is created for a user

---

## Method 1: Run the Initialization Script (Recommended)

This will create all 15 collections with placeholder documents:

### Step 1: Navigate to the project directory

```bash
cd /Users/sankarreddy/Desktop/odinring-main-2
```

### Step 2: Run the initialization script

```bash
python3 backend/scripts/init_firestore_collections.py
```

This script will:
- ✅ Create all 15 collections
- ✅ Add placeholder documents to initialize each collection
- ✅ Verify all collections exist
- ✅ Show you detailed information about each collection

### Step 3: Verify in Firestore Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database**
4. You should now see all **15 collections**

---

## Method 2: Create Collections Manually in Firestore Console

If you prefer to create them manually:

### Step 1: Open Firestore Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click on **Firestore Database** in the left sidebar

### Step 2: Create Each Missing Collection

For each collection below, click **"Start collection"** and create a placeholder document:

#### Create `sessions` Collection

- Collection ID: `sessions`
- Document ID: `_placeholder_sessions`
- Fields:
  - `_is_placeholder` (boolean): `true`
  - `_description` (string): `"Active user sessions for authentication"`
  - `_created_at` (timestamp): Current time

#### Create `refresh_tokens` Collection

- Collection ID: `refresh_tokens`
- Document ID: `_placeholder_refresh_tokens`
- Fields:
  - `_is_placeholder` (boolean): `true`
  - `_description` (string): `"Refresh tokens for JWT rotation"`
  - `_created_at` (timestamp): Current time

#### Create `audit_logs` Collection

- Collection ID: `audit_logs`
- Document ID: `_placeholder_audit_logs`
- Fields:
  - `_is_placeholder` (boolean): `true`
  - `_description` (string): `"Comprehensive audit trail for compliance"`
  - `_created_at` (timestamp): Current time

#### Create `businesses` Collection

- Collection ID: `businesses`
- Document ID: `_placeholder_businesses`
- Fields:
  - `_is_placeholder` (boolean): `true`
  - `_description` (string): `"Solo business and micro-enterprise profiles"`
  - `_created_at` (timestamp): Current time

#### Create `organizations` Collection

- Collection ID: `organizations`
- Document ID: `_placeholder_organizations`
- Fields:
  - `_is_placeholder` (boolean): `true`
  - `_description` (string): `"Multi-user organization profiles"`
  - `_created_at` (timestamp): Current time

#### Create `departments` Collection

- Collection ID: `departments`
- Document ID: `_placeholder_departments`
- Fields:
  - `_is_placeholder` (boolean): `true`
  - `_description` (string): `"Organization departments or teams"`
  - `_created_at` (timestamp): Current time

#### Create `memberships` Collection

- Collection ID: `memberships`
- Document ID: `_placeholder_memberships`
- Fields:
  - `_is_placeholder` (boolean): `true`
  - `_description` (string): `"Organization membership and roles"`
  - `_created_at` (timestamp): Current time

#### Create `subscriptions` Collection ⭐

- Collection ID: `subscriptions`
- Document ID: `_placeholder_subscriptions`
- Fields:
  - `_is_placeholder` (boolean): `true`
  - `_description` (string): `"Subscription plans and billing state"`
  - `_created_at` (timestamp): Current time

---

## Method 3: Verify Collections Exist (Check Script)

Run the verification script to see which collections exist:

```bash
python3 backend/scripts/verify_firestore.py
```

This will:
- ✅ Check which collections exist
- ✅ Show document counts for each collection
- ✅ Identify missing collections
- ✅ Generate a verification report

---

## Method 4: Collections Will Auto-Create on First Use

If you don't want to create them manually, the collections will automatically be created when:

- **`sessions`**: When a user logs in
- **`refresh_tokens`**: When a user refreshes their token
- **`audit_logs`**: When any audited action occurs (login, subscription creation, etc.)
- **`businesses`**: When a user creates a business account
- **`organizations`**: When a user creates an organization account
- **`departments`**: When an organization creates a department
- **`memberships`**: When a user joins an organization
- **`subscriptions`**: When a user signs up (subscription is auto-created)

---

## Quick Check: Where to Find Collections in Firestore Console

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project**
3. **Click "Firestore Database"** in the left sidebar
4. **Click "Data" tab** at the top
5. **View Collections**: You'll see all collections listed on the left side

The collections should appear in alphabetical order:
- `admins`
- `analytics`
- `appointments`
- `audit_logs` ⬅️ Phase 1
- `availability`
- `businesses` ⬅️ Phase 2
- `departments` ⬅️ Phase 2
- `links`
- `memberships` ⬅️ Phase 2
- `organizations` ⬅️ Phase 2
- `qr_scans`
- `refresh_tokens` ⬅️ Phase 1
- `ring_analytics`
- `rings`
- `sessions` ⬅️ Phase 1
- `status_checks`
- `subscriptions` ⬅️ Phase 2 ⭐
- `users`

---

## Most Important: The `subscriptions` Collection

The **`subscriptions`** collection is the one you specifically asked about. This collection stores:

- Subscription plans (personal, solo, org)
- Subscription status (trial, active, expired)
- Trial periods (14-day free trial)
- Billing cycles (monthly, yearly)
- Payment information
- Transaction IDs
- Checkout details

### When Subscriptions Collection is Created

The `subscriptions` collection will be automatically created when:
1. A new user signs up (subscription with trial is auto-created)
2. A user selects a plan and makes a payment
3. The backend creates a subscription document

### How to Verify Subscriptions Exist

Run this query in Firestore Console or via the verification script:

```bash
# Check if subscriptions collection exists and has documents
python3 backend/scripts/verify_firestore.py
```

Or check manually in Firestore Console:
1. Look for `subscriptions` in the collections list
2. If it doesn't exist, create it using Method 1 or Method 2 above
3. If it exists but is empty, that's normal until users sign up

---

## Summary: All 15 Collections

| # | Collection | Phase | Status |
|---|------------|-------|--------|
| 1 | `users` | Core | ✅ Visible |
| 2 | `links` | Core | ✅ Visible |
| 3 | `rings` | Core | ✅ Visible |
| 4 | `analytics` | Core | ✅ Visible |
| 5 | `ring_analytics` | Core | ✅ Visible |
| 6 | `qr_scans` | Core | ✅ Visible |
| 7 | `appointments` | Core | ✅ Visible |
| 8 | `availability` | Core | ✅ Visible |
| 9 | `admins` | Core | ✅ Visible |
| 10 | `status_checks` | Core | ✅ Visible |
| 11 | `sessions` | Phase 1 | ⚠️ May be missing |
| 12 | `refresh_tokens` | Phase 1 | ⚠️ May be missing |
| 13 | `audit_logs` | Phase 1 | ⚠️ May be missing |
| 14 | `businesses` | Phase 2 | ⚠️ May be missing |
| 15 | `organizations` | Phase 2 | ⚠️ May be missing |
| 16 | `departments` | Phase 2 | ⚠️ May be missing |
| 17 | `memberships` | Phase 2 | ⚠️ May be missing |
| 18 | `subscriptions` | Phase 2 | ⚠️ May be missing ⭐ |

---

## Next Steps

1. **Run the initialization script** (Method 1) - This is the easiest way
2. **Verify collections exist** using the verification script
3. **Deploy indexes** if needed: `firebase deploy --only firestore:indexes`
4. **Check the subscriptions collection** - This will be populated when users sign up

---

## Need Help?

If collections still don't appear after running the initialization script:

1. Check Firebase permissions
2. Verify you're connected to the correct Firebase project
3. Check the console for any errors
4. Run the verification script to see detailed status

---

**Last Updated**: 2024-01-29

