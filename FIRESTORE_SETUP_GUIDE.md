# 🔥 Firestore Setup & Verification Guide

**Complete guide to initialize, index, and verify Firebase Firestore**

---

## 📋 Quick Start

```bash
# 1. Initialize all collections
python backend/scripts/init_firestore_collections.py

# 2. Deploy indexes to Firebase
./backend/scripts/deploy_indexes.sh

# Or manually:
firebase deploy --only firestore:indexes

# 3. Deploy Firestore rules
firebase deploy --only firestore:rules

# 4. Verify everything is working
python backend/scripts/verify_firestore.py
```

---

## 🗂️ Collections Overview

### Total Collections: 19

**Core Collections (10)** - Phase 0
```
✅ users                - User profiles & authentication
✅ links                - User links & content
✅ rings                - NFC ring inventory
✅ analytics            - Page view tracking
✅ ring_analytics       - Ring tap events
✅ qr_scans             - QR code tracking
✅ appointments         - Scheduling data
✅ availability         - Time slots
✅ admins               - Admin accounts
✅ status_checks        - Health checks
```

**Security Collections (3)** - Phase 1
```
✅ sessions             - Active user sessions
✅ refresh_tokens       - JWT refresh tokens
✅ audit_logs           - Audit trail
```

**Identity Collections (6)** - Phase 2
```
✅ businesses           - Business profiles
✅ organizations        - Organization profiles
✅ departments          - Organization departments
✅ memberships          - Organization memberships
✅ subscriptions        - Subscription state
```

---

## 📊 Indexes Overview

### Total Composite Indexes: 35

**Distribution:**
- Core collections: 14 indexes
- Session management: 7 indexes  
- Audit logging: 4 indexes
- Phase 2 features: 10 indexes

**Critical Indexes:**

```javascript
// Sessions (3 indexes)
sessions:
  • user_id + is_active + created_at
  • expires_at + is_active
  • user_id + last_activity

// Refresh Tokens (4 indexes)
refresh_tokens:
  • user_id + is_revoked + created_at
  • expires_at + is_revoked
  • family_id + created_at
  • session_id + is_revoked

// Audit Logs (4 indexes)
audit_logs:
  • actor_id + timestamp
  • action + timestamp
  • entity_type + entity_id + timestamp
  • ip_address + timestamp

// Links (3 indexes)
links:
  • user_id + order
  • user_id + is_active + order
  • user_id + created_at
```

---

## 🚀 Step-by-Step Setup

### Step 1: Prerequisites

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Set Firebase project
firebase use <your-project-id>

# Verify connection
firebase projects:list
```

### Step 2: Initialize Collections

```bash
# Navigate to project root
cd /Users/sankarreddy/Desktop/odinring-main-2

# Run initialization script
python backend/scripts/init_firestore_collections.py
```

**What it does:**
- ✅ Creates all 19 collections
- ✅ Adds placeholder documents
- ✅ Verifies collections exist
- ✅ Prints collection information

**Expected Output:**
```
🔥 INITIALIZING FIRESTORE COLLECTIONS
======================================================================

✅ Created collection 'users' - User profiles and authentication data
✅ Created collection 'links' - User links and content
✅ Created collection 'sessions' - Active user sessions
...

📊 COLLECTION INITIALIZATION SUMMARY
======================================================================
Total Collections: 19
✅ Successfully Created/Verified: 19
❌ Failed: 0
```

### Step 3: Deploy Indexes

**Option A: Using the deployment script**
```bash
./backend/scripts/deploy_indexes.sh
```

**Option B: Using Firebase CLI directly**
```bash
firebase deploy --only firestore:indexes
```

**What it does:**
- ✅ Uploads `firestore.indexes.json` to Firebase
- ✅ Creates all 35 composite indexes
- ✅ Starts index building process

**Expected Output:**
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/your-project/overview
```

**⏰ Important:** Index building takes time!
- Simple indexes: 1-5 minutes
- Complex indexes: 5-15 minutes
- Large datasets: 15+ minutes

**Check Status:**
```bash
# Open Firebase Console
https://console.firebase.google.com/project/<your-project>/firestore/indexes
```

### Step 4: Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

**What it does:**
- ✅ Uploads security rules from `firestore.rules`
- ✅ Configures access control
- ✅ Enables/restricts operations

### Step 5: Verify Setup

```bash
python backend/scripts/verify_firestore.py
```

**What it does:**
- ✅ Tests Firestore connection
- ✅ Verifies all collections exist
- ✅ Tests critical indexes
- ✅ Checks for sample data
- ✅ Generates verification report

**Expected Output:**
```
🔥 FIRESTORE COMPREHENSIVE VERIFICATION
======================================================================

🔍 TESTING FIRESTORE CONNECTION
✅ Write test: SUCCESS
✅ Read test: SUCCESS
✅ Delete test: SUCCESS

📂 CHECKING COLLECTIONS
✅ users                - 5 documents
✅ links                - 12 documents
✅ sessions             - 0 documents (empty)
...

🔍 CHECKING CRITICAL INDEXES (Query Tests)
✅ users by email
✅ links by user_id and order
✅ sessions by user_id and is_active
...

🎯 FINAL VERIFICATION SUMMARY
Connection:  ✅ PASS
Collections: ✅ PASS
Indexes:     ✅ PASS

Overall Status: READY
✅ Firestore is properly configured and ready for production!
```

---

## 🔍 Troubleshooting

### Issue: "Missing index" error

**Symptom:**
```
Error: The query requires an index. You can create it here:
https://console.firebase.google.com/...
```

**Solution:**
1. Click the link to auto-create the index
2. Wait for index to build
3. OR manually deploy: `firebase deploy --only firestore:indexes`

### Issue: Collections not found

**Symptom:**
```
❌ sessions - NOT FOUND
```

**Solution:**
```bash
# Re-run initialization
python backend/scripts/init_firestore_collections.py

# Verify Firebase connection
python backend/test_firestore_connection.py
```

### Issue: Permission denied

**Symptom:**
```
Error: Missing or insufficient permissions
```

**Solution:**
1. Check Firestore rules are deployed
2. Verify service account has proper permissions
3. Check Firebase Console IAM settings

### Issue: Indexes taking too long

**Symptom:**
Indexes stuck in "Building" state for > 30 minutes

**Solution:**
1. Check Firebase Console for errors
2. Verify no conflicting indexes
3. Try deleting and recreating problematic index
4. Contact Firebase support if persistent

---

## 📝 Collection Details

### Core Collections Structure

#### users
```javascript
{
  id: "uuid",
  email: "user@example.com",
  username: "username",
  name: "User Name",
  password: "hashed_password",
  ring_id: "RING_XXX",              // optional
  google_id: "google_uid",          // optional
  profile_photo: "url",
  bio: "Bio text",
  theme: "light|dark",
  accent_color: "#hexcolor",
  created_at: timestamp,
  updated_at: timestamp
}
```

#### sessions
```javascript
{
  id: "uuid",
  user_id: "user_uuid",
  session_id: "session_uuid",
  token: "jwt_token",
  ip_address: "127.0.0.1",
  user_agent: "browser_info",
  created_at: timestamp,
  expires_at: timestamp,
  is_active: true,
  last_activity: timestamp
}
```

#### refresh_tokens
```javascript
{
  id: "uuid",
  user_id: "user_uuid",
  session_id: "session_uuid",
  token_hash: "hashed_token",
  family_id: "family_uuid",
  created_at: timestamp,
  expires_at: timestamp,
  is_revoked: false,
  revoked_at: null                  // optional
}
```

#### audit_logs
```javascript
{
  id: "uuid",
  actor_id: "user_uuid",
  action: "login|logout|update|delete",
  entity_type: "user|link|ring|etc",
  entity_id: "entity_uuid",
  timestamp: timestamp,
  ip_address: "127.0.0.1",
  user_agent: "browser_info",
  metadata: {}                      // optional
}
```

---

## 🧪 Testing

### Test Firestore Connection

```bash
python backend/test_firestore_connection.py
```

### Test Specific Collection

```python
from firebase_admin import firestore
from firebase_config import initialize_firebase

initialize_firebase()
db = firestore.client()

# Test users collection
users = db.collection('users')
docs = list(users.limit(5).stream())
print(f"Found {len(docs)} users")
```

### Test Index Query

```python
# Query that requires index
users = db.collection('users').where('email', '==', 'test@example.com').stream()

# Query with multiple filters
links = db.collection('links') \
    .where('user_id', '==', 'user123') \
    .where('is_active', '==', True) \
    .order_by('order') \
    .stream()
```

---

## 📊 Monitoring

### Check Index Status

```bash
# Via Firebase Console
https://console.firebase.google.com/project/<project-id>/firestore/indexes

# Via CLI
firebase firestore:indexes
```

### Monitor Collection Size

```python
from firebase_admin import firestore

db = firestore.client()

for collection_name in ['users', 'links', 'sessions']:
    count = len(list(db.collection(collection_name).stream()))
    print(f"{collection_name}: {count} documents")
```

### Check Query Performance

```python
import time

start = time.time()
results = list(db.collection('users').where('email', '==', 'test@example.com').stream())
duration = time.time() - start

print(f"Query took {duration:.3f}s")
```

---

## 🔐 Security Rules

### Current Rules Location

```
firestore.rules
```

### Deploy Rules

```bash
firebase deploy --only firestore:rules
```

### Test Rules

```bash
# Via Firebase Emulator
firebase emulators:start --only firestore

# Via Rules Playground in Firebase Console
https://console.firebase.google.com/project/<project-id>/firestore/rules
```

---

## 📚 Maintenance

### Regular Tasks

**Weekly:**
- [ ] Check index status in Console
- [ ] Monitor collection sizes
- [ ] Review audit logs

**Monthly:**
- [ ] Review and optimize indexes
- [ ] Check for orphaned documents
- [ ] Update security rules if needed

**Quarterly:**
- [ ] Full verification: `python backend/scripts/verify_firestore.py`
- [ ] Performance review
- [ ] Capacity planning

---

## 🎯 Quick Commands Reference

```bash
# Initialize
python backend/scripts/init_firestore_collections.py

# Deploy indexes
firebase deploy --only firestore:indexes

# Deploy rules
firebase deploy --only firestore:rules

# Verify setup
python backend/scripts/verify_firestore.py

# Check Firebase project
firebase projects:list
firebase use <project-id>

# View indexes
firebase firestore:indexes

# Test connection
python backend/test_firestore_connection.py

# Emulator (for local testing)
firebase emulators:start --only firestore
```

---

## ✅ Production Checklist

Before deploying to production, ensure:

- [ ] All 19 collections created
- [ ] All 35 indexes deployed and built
- [ ] Firestore rules deployed
- [ ] Verification script passes
- [ ] Service account has proper permissions
- [ ] Backup strategy in place
- [ ] Monitoring configured
- [ ] Security rules tested

---

## 📞 Support

### Firebase Console
https://console.firebase.google.com/

### Firebase Status
https://status.firebase.google.com/

### Firebase Support
https://firebase.google.com/support

### Documentation
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firestore Indexes](https://firebase.google.com/docs/firestore/query-data/indexing)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

---

**Guide Version:** 1.0  
**Last Updated:** December 25, 2025  
**Status:** ✅ PRODUCTION READY








