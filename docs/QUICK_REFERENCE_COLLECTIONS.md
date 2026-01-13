# Quick Reference: Firestore Collections

## Total Collections: 18

### Currently Visible (10 Core Collections)
These are the collections you can see in your Firestore console:

1. ✅ `users` - User profiles
2. ✅ `links` - User links
3. ✅ `rings` - NFC ring inventory
4. ✅ `analytics` - Page view analytics
5. ✅ `ring_analytics` - Ring tap events
6. ✅ `qr_scans` - QR code scans
7. ✅ `appointments` - User appointments
8. ✅ `availability` - User availability
9. ✅ `admins` - Admin accounts
10. ✅ `status_checks` - System health checks

### Missing Collections (8 Collections)
These will appear when created or when first used:

#### Phase 1 - Security (3)
11. ⚠️ `sessions` - Active user sessions
12. ⚠️ `refresh_tokens` - JWT refresh tokens
13. ⚠️ `audit_logs` - Audit trail

#### Phase 2 - Subscriptions & Identity (5)
14. ⚠️ `businesses` - Business profiles
15. ⚠️ `organizations` - Organization profiles
16. ⚠️ `departments` - Organization departments
17. ⚠️ `memberships` - Organization memberships
18. ⚠️ `subscriptions` - **⭐ Subscription plans & billing**

---

## How to Create Missing Collections

### Option 1: Run Initialization Script (Easiest)

```bash
cd /Users/sankarreddy/Desktop/odinring-main-2
python3 backend/scripts/init_firestore_collections.py
```

This will create all 18 collections instantly!

### Option 2: Verify What Exists

```bash
python3 backend/scripts/verify_firestore.py
```

This shows which collections exist and which are missing.

### Option 3: Wait for Auto-Creation

Collections will automatically appear when:
- User signs up → `subscriptions` created
- User logs in → `sessions` created
- User performs actions → `audit_logs` created

---

## The `subscriptions` Collection (Most Important)

**What it stores:**
- User subscription plans (personal, solo, org)
- Subscription status (trial, active, expired)
- 14-day free trial periods
- Billing cycles (monthly, yearly)
- Payment transaction IDs
- Checkout details
- Plan expiry dates

**When it's created:**
- Automatically when a new user signs up
- Or manually via initialization script

**How to see it:**
1. Run: `python3 backend/scripts/init_firestore_collections.py`
2. Check Firestore Console → Data tab
3. Look for `subscriptions` in the collections list

---

## Firestore Console Location

1. Go to: https://console.firebase.google.com/
2. Select your project
3. Click **Firestore Database** (left sidebar)
4. Click **Data** tab (top)
5. Collections list appears on the left side

---

## Summary Table

| Collection | Phase | Created | Visible |
|------------|-------|---------|---------|
| users | Core | ✅ | ✅ |
| links | Core | ✅ | ✅ |
| rings | Core | ✅ | ✅ |
| analytics | Core | ✅ | ✅ |
| ring_analytics | Core | ✅ | ✅ |
| qr_scans | Core | ✅ | ✅ |
| appointments | Core | ✅ | ✅ |
| availability | Core | ✅ | ✅ |
| admins | Core | ✅ | ✅ |
| status_checks | Core | ✅ | ✅ |
| sessions | Phase 1 | ⚠️ | ❌ |
| refresh_tokens | Phase 1 | ⚠️ | ❌ |
| audit_logs | Phase 1 | ⚠️ | ❌ |
| businesses | Phase 2 | ⚠️ | ❌ |
| organizations | Phase 2 | ⚠️ | ❌ |
| departments | Phase 2 | ⚠️ | ❌ |
| memberships | Phase 2 | ⚠️ | ❌ |
| **subscriptions** | **Phase 2** | **⚠️** | **❌** |

---

**To see all 18 collections, run the initialization script!**

