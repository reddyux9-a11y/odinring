# Manual Guide: Create Missing Collections in Firestore Console

Since the script can't connect to your Firestore database, here's how to manually create the missing collections directly in the Firestore Console.

## Step-by-Step Instructions

### Step 1: Open Firestore Console

1. Go to: https://console.firebase.google.com/
2. Select your project: `studio-7743041576-fc16f`
3. Click **"Firestore Database"** in the left sidebar
4. Click the **"Data"** tab at the top

### Step 2: Create Each Missing Collection

For each of the 8 missing collections below, follow these steps:

1. Click **"Start collection"** button (or the **"+"** icon)
2. Enter the **Collection ID** (see list below)
3. Click **"Next"**
4. Create a placeholder document:
   - **Document ID**: `_placeholder_init` (or leave auto-generated)
   - Add these fields:

| Field Name | Type | Value |
|------------|------|-------|
| `_is_placeholder` | boolean | `true` |
| `_description` | string | (see description below for each collection) |
| `_created_at` | timestamp | Click "Set" and use current time |
| `_note` | string | `"Placeholder document - can be deleted later"` |

5. Click **"Save"**

---

## Missing Collections to Create

### Phase 1 - Security Collections (3)

#### 1. `sessions`
- **Description**: `"Active user sessions for authentication"`
- **Note**: Will be populated when users log in

#### 2. `refresh_tokens`
- **Description**: `"Refresh tokens for JWT rotation"`
- **Note**: Will be populated when tokens are issued

#### 3. `audit_logs`
- **Description**: `"Comprehensive audit trail for compliance"`
- **Note**: Will be populated when audited actions occur

---

### Phase 2 - Identity & Subscription Collections (5)

#### 4. `businesses`
- **Description**: `"Solo business and micro-enterprise profiles"`
- **Note**: Will be populated when users create business accounts

#### 5. `organizations`
- **Description**: `"Multi-user organization profiles"`
- **Note**: Will be populated when users create organizations

#### 6. `departments`
- **Description**: `"Organization departments or teams"`
- **Note**: Will be populated when organizations create departments

#### 7. `memberships`
- **Description**: `"Organization membership and roles"`
- **Note**: Will be populated when users join organizations

#### 8. `subscriptions` ⭐ **IMPORTANT**
- **Description**: `"Subscription plans and billing state"`
- **Note**: Will be populated when users sign up (subscriptions are auto-created)

---

## Quick Copy-Paste Values

For each collection, use these values:

### `sessions`
```
_is_placeholder: true (boolean)
_description: "Active user sessions for authentication" (string)
_created_at: [current timestamp]
_note: "Placeholder document - can be deleted later" (string)
```

### `refresh_tokens`
```
_is_placeholder: true (boolean)
_description: "Refresh tokens for JWT rotation" (string)
_created_at: [current timestamp]
_note: "Placeholder document - can be deleted later" (string)
```

### `audit_logs`
```
_is_placeholder: true (boolean)
_description: "Comprehensive audit trail for compliance" (string)
_created_at: [current timestamp]
_note: "Placeholder document - can be deleted later" (string)
```

### `businesses`
```
_is_placeholder: true (boolean)
_description: "Solo business and micro-enterprise profiles" (string)
_created_at: [current timestamp]
_note: "Placeholder document - can be deleted later" (string)
```

### `organizations`
```
_is_placeholder: true (boolean)
_description: "Multi-user organization profiles" (string)
_created_at: [current timestamp]
_note: "Placeholder document - can be deleted later" (string)
```

### `departments`
```
_is_placeholder: true (boolean)
_description: "Organization departments or teams" (string)
_created_at: [current timestamp]
_note: "Placeholder document - can be deleted later" (string)
```

### `memberships`
```
_is_placeholder: true (boolean)
_description: "Organization membership and roles" (string)
_created_at: [current timestamp]
_note: "Placeholder document - can be deleted later" (string)
```

### `subscriptions` ⭐
```
_is_placeholder: true (boolean)
_description: "Subscription plans and billing state" (string)
_created_at: [current timestamp]
_note: "Placeholder document - can be deleted later" (string)
```

---

## Verification

After creating all collections, you should see **18 total collections** in your Firestore console:

### Core Collections (10) - Already exist
1. ✅ users
2. ✅ links
3. ✅ rings
4. ✅ analytics
5. ✅ ring_analytics
6. ✅ qr_scans
7. ✅ appointments
8. ✅ availability
9. ✅ admins
10. ✅ status_checks

### New Collections (8) - Just created
11. ✅ sessions
12. ✅ refresh_tokens
13. ✅ audit_logs
14. ✅ businesses
15. ✅ organizations
16. ✅ departments
17. ✅ memberships
18. ✅ subscriptions ⭐

---

## Important Notes

1. **Placeholder Documents**: The placeholder documents can be safely deleted once real data is added to the collections.

2. **Auto-Population**: These collections will be automatically populated when:
   - `subscriptions` → User signs up
   - `sessions` → User logs in
   - `audit_logs` → Actions are performed
   - Others → When the application uses them

3. **No Data Loss**: Creating placeholder documents doesn't affect existing functionality. Real data will be added alongside or replace placeholders.

---

## Troubleshooting

If you can't create collections:

1. **Check Permissions**: Ensure you have Editor or Owner role in Firebase
2. **Check Project**: Make sure you're in the correct Firebase project
3. **Check Database Mode**: Ensure you're using Firestore (Native mode), not Datastore
4. **Try Refresh**: Refresh the Firebase console page

---

## Alternative: Collections Will Auto-Create

If you prefer not to create them manually, the collections will automatically appear when:
- The application first writes to them
- Users sign up (creates `subscriptions`)
- Users log in (creates `sessions`)
- Actions occur (creates `audit_logs`)

**However**, creating them now makes them visible in the console immediately, which is helpful for monitoring and development.

---

**Last Updated**: 2024-01-29

