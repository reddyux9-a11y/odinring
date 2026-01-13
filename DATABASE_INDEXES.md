# Firestore Database Indexes Documentation

**Database:** odinringdb  
**Platform:** Firebase Firestore  
**Last Updated:** December 25, 2025

---

## 📊 Overview

This document outlines all required Firestore indexes for the OdinRing application. Proper indexing is critical for query performance and avoiding runtime errors in production.

---

## 🔍 Index Categories

### Automatic Single-Field Indexes

Firestore automatically creates single-field indexes for all fields. These don't need manual configuration but are listed here for reference:

- `users`: id, email, username, ring_id, google_id
- `links`: id, user_id, is_active, order
- `rings`: id, ring_id, assigned_user, status
- `sessions`: id, user_id, is_active
- `audit_logs`: id, actor_id, timestamp
- `refresh_tokens`: id, user_id, is_revoked
- `businesses`: id, owner_id
- `organizations`: id, owner_id
- `memberships`: id, user_id, organization_id, role
- `subscriptions`: id, owner_id, status

---

## 📝 Required Composite Indexes

### Core Collections

#### 1. **links** Collection

**Query:** Get active links for a user, ordered by position
```javascript
db.collection('links')
  .where('user_id', '==', userId)
  .where('is_active', '==', true)
  .orderBy('order', 'asc')
```

**Index:**
```
Collection: links
Fields:
  - user_id (Ascending)
  - is_active (Ascending)
  - order (Ascending)
```

**Query:** Get all links for a user, ordered by creation date
```javascript
db.collection('links')
  .where('user_id', '==', userId)
  .orderBy('created_at', 'desc')
```

**Index:**
```
Collection: links
Fields:
  - user_id (Ascending)
  - created_at (Descending)
```

---

#### 2. **analytics** Collection

**Query:** Get analytics for a user within date range
```javascript
db.collection('analytics')
  .where('user_id', '==', userId)
  .where('timestamp', '>=', startDate)
  .where('timestamp', '<=', endDate)
  .orderBy('timestamp', 'desc')
```

**Index:**
```
Collection: analytics
Fields:
  - user_id (Ascending)
  - timestamp (Descending)
```

**Query:** Get analytics by referrer for a user
```javascript
db.collection('analytics')
  .where('user_id', '==', userId)
  .where('referrer', '==', referrer)
  .orderBy('timestamp', 'desc')
```

**Index:**
```
Collection: analytics
Fields:
  - user_id (Ascending)
  - referrer (Ascending)
  - timestamp (Descending)
```

---

#### 3. **ring_analytics** Collection

**Query:** Get ring tap events for a specific ring within date range
```javascript
db.collection('ring_analytics')
  .where('ring_id', '==', ringId)
  .where('timestamp', '>=', startDate)
  .where('timestamp', '<=', endDate)
  .orderBy('timestamp', 'desc')
```

**Index:**
```
Collection: ring_analytics
Fields:
  - ring_id (Ascending)
  - timestamp (Descending)
```

---

#### 4. **appointments** Collection

**Query:** Get appointments for a user, ordered by date
```javascript
db.collection('appointments')
  .where('user_id', '==', userId)
  .where('status', '==', 'scheduled')
  .orderBy('appointment_date', 'asc')
```

**Index:**
```
Collection: appointments
Fields:
  - user_id (Ascending)
  - status (Ascending)
  - appointment_date (Ascending)
```

---

### Phase 1 Collections (Security & Compliance)

#### 5. **sessions** Collection

**Query:** Get active sessions for a user
```javascript
db.collection('sessions')
  .where('user_id', '==', userId)
  .where('is_active', '==', true)
  .orderBy('created_at', 'desc')
```

**Index:**
```
Collection: sessions
Fields:
  - user_id (Ascending)
  - is_active (Ascending)
  - created_at (Descending)
```

**Query:** Clean up expired sessions
```javascript
db.collection('sessions')
  .where('expires_at', '<', now)
  .where('is_active', '==', true)
```

**Index:**
```
Collection: sessions
Fields:
  - expires_at (Ascending)
  - is_active (Ascending)
```

---

#### 6. **refresh_tokens** Collection

**Query:** Get active refresh tokens for a user
```javascript
db.collection('refresh_tokens')
  .where('user_id', '==', userId)
  .where('is_revoked', '==', false)
  .orderBy('created_at', 'desc')
```

**Index:**
```
Collection: refresh_tokens
Fields:
  - user_id (Ascending)
  - is_revoked (Ascending)
  - created_at (Descending)
```

**Query:** Clean up expired tokens
```javascript
db.collection('refresh_tokens')
  .where('expires_at', '<', now)
  .where('is_revoked', '==', false)
```

**Index:**
```
Collection: refresh_tokens
Fields:
  - expires_at (Ascending)
  - is_revoked (Ascending)
```

**Query:** Get tokens by family (for rotation detection)
```javascript
db.collection('refresh_tokens')
  .where('family_id', '==', familyId)
  .orderBy('created_at', 'desc')
```

**Index:**
```
Collection: refresh_tokens
Fields:
  - family_id (Ascending)
  - created_at (Descending)
```

---

#### 7. **audit_logs** Collection

**Query:** Get audit logs for a specific actor within date range
```javascript
db.collection('audit_logs')
  .where('actor_id', '==', actorId)
  .where('timestamp', '>=', startDate)
  .where('timestamp', '<=', endDate)
  .orderBy('timestamp', 'desc')
```

**Index:**
```
Collection: audit_logs
Fields:
  - actor_id (Ascending)
  - timestamp (Descending)
```

**Query:** Get audit logs by action type
```javascript
db.collection('audit_logs')
  .where('action', '==', action)
  .orderBy('timestamp', 'desc')
  .limit(100)
```

**Index:**
```
Collection: audit_logs
Fields:
  - action (Ascending)
  - timestamp (Descending)
```

**Query:** Get audit logs by entity
```javascript
db.collection('audit_logs')
  .where('entity_type', '==', entityType)
  .where('entity_id', '==', entityId)
  .orderBy('timestamp', 'desc')
```

**Index:**
```
Collection: audit_logs
Fields:
  - entity_type (Ascending)
  - entity_id (Ascending)
  - timestamp (Descending)
```

---

### Phase 2 Collections (Identity & Subscriptions)

#### 8. **businesses** Collection

**Query:** Get businesses owned by a user
```javascript
db.collection('businesses')
  .where('owner_id', '==', userId)
  .orderBy('created_at', 'desc')
```

**Index:**
```
Collection: businesses
Fields:
  - owner_id (Ascending)
  - created_at (Descending)
```

---

#### 9. **organizations** Collection

**Query:** Get organizations owned by a user
```javascript
db.collection('organizations')
  .where('owner_id', '==', userId)
  .orderBy('created_at', 'desc')
```

**Index:**
```
Collection: organizations
Fields:
  - owner_id (Ascending)
  - created_at (Descending)
```

---

#### 10. **departments** Collection

**Query:** Get departments for an organization
```javascript
db.collection('departments')
  .where('organization_id', '==', orgId)
  .orderBy('name', 'asc')
```

**Index:**
```
Collection: departments
Fields:
  - organization_id (Ascending)
  - name (Ascending)
```

---

#### 11. **memberships** Collection

**Query:** Get memberships for a user
```javascript
db.collection('memberships')
  .where('user_id', '==', userId)
  .orderBy('created_at', 'desc')
```

**Index:**
```
Collection: memberships
Fields:
  - user_id (Ascending)
  - created_at (Descending)
```

**Query:** Get members of an organization
```javascript
db.collection('memberships')
  .where('organization_id', '==', orgId)
  .where('role', 'in', ['owner', 'admin', 'member'])
  .orderBy('created_at', 'asc')
```

**Index:**
```
Collection: memberships
Fields:
  - organization_id (Ascending)
  - role (Ascending)
  - created_at (Ascending)
```

**Query:** Get organization members by department
```javascript
db.collection('memberships')
  .where('organization_id', '==', orgId)
  .where('department_id', '==', deptId)
  .orderBy('created_at', 'asc')
```

**Index:**
```
Collection: memberships
Fields:
  - organization_id (Ascending)
  - department_id (Ascending)
  - created_at (Ascending)
```

---

#### 12. **subscriptions** Collection

**Query:** Get subscription by owner
```javascript
db.collection('subscriptions')
  .where('owner_id', '==', ownerId)
  .where('owner_type', '==', ownerType)
  .orderBy('created_at', 'desc')
  .limit(1)
```

**Index:**
```
Collection: subscriptions
Fields:
  - owner_id (Ascending)
  - owner_type (Ascending)
  - created_at (Descending)
```

**Query:** Get active subscriptions by plan
```javascript
db.collection('subscriptions')
  .where('status', '==', 'active')
  .where('plan', '==', plan)
  .orderBy('created_at', 'desc')
```

**Index:**
```
Collection: subscriptions
Fields:
  - status (Ascending)
  - plan (Ascending)
  - created_at (Descending)
```

**Query:** Get expiring subscriptions
```javascript
db.collection('subscriptions')
  .where('status', '==', 'active')
  .where('current_period_end', '<=', checkDate)
  .orderBy('current_period_end', 'asc')
```

**Index:**
```
Collection: subscriptions
Fields:
  - status (Ascending)
  - current_period_end (Ascending)
```

---

## 🛠️ Index Creation Methods

### Method 1: Firebase Console (Recommended)

1. Navigate to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database** → **Indexes**
4. Click **Add Index**
5. Enter collection name and field configurations
6. Click **Create**

### Method 2: Automatic Index Creation

When you run a query that requires an index, Firestore will throw an error with a link to automatically create the required index. This is the easiest method during development.

### Method 3: firestore.indexes.json

Create or update `/firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "links",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "user_id", "order": "ASCENDING" },
        { "fieldPath": "is_active", "order": "ASCENDING" },
        { "fieldPath": "order", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "sessions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "user_id", "order": "ASCENDING" },
        { "fieldPath": "is_active", "order": "ASCENDING" },
        { "fieldPath": "created_at", "order": "DESCENDING" }
      ]
    }
    // Add all other indexes here
  ]
}
```

Deploy with:
```bash
firebase deploy --only firestore:indexes
```

---

## 📊 Index Size Estimates

| Collection | Estimated Documents | Index Count | Impact |
|------------|--------------------:|------------:|--------|
| users | 10,000 | 5 | Low |
| links | 100,000 | 2 | Medium |
| analytics | 1,000,000 | 2 | High |
| sessions | 50,000 | 2 | Low |
| audit_logs | 500,000 | 3 | Medium |
| refresh_tokens | 50,000 | 3 | Low |
| businesses | 5,000 | 1 | Low |
| organizations | 1,000 | 1 | Low |
| memberships | 10,000 | 3 | Low |
| subscriptions | 10,000 | 3 | Low |

**Total Composite Indexes:** 26

---

## ✅ Index Verification Script

Create a script to verify all indexes exist:

```python
# scripts/verify_indexes.py
from firebase_admin import firestore
from firebase_config import initialize_firebase

initialize_firebase()
db = firestore.client()

REQUIRED_INDEXES = {
    'links': [
        ['user_id', 'is_active', 'order'],
        ['user_id', 'created_at']
    ],
    'analytics': [
        ['user_id', 'timestamp'],
        ['user_id', 'referrer', 'timestamp']
    ],
    'sessions': [
        ['user_id', 'is_active', 'created_at'],
        ['expires_at', 'is_active']
    ],
    # Add all others...
}

def verify_indexes():
    """Verify all required indexes exist"""
    print("🔍 Verifying Firestore indexes...")
    
    # Note: Firestore Admin SDK doesn't provide direct index inspection
    # This would need to be checked via Firebase Console or deployment logs
    
    print("⚠️  Manual verification required via Firebase Console")
    print("   https://console.firebase.google.com/")

if __name__ == "__main__":
    verify_indexes()
```

---

## 🚨 Common Issues

### Issue 1: Missing Index Error

**Error:**
```
The query requires an index. You can create it here: https://console.firebase.google.com/...
```

**Solution:**
1. Click the provided link
2. Wait 2-5 minutes for index to build
3. Retry the query

### Issue 2: Slow Query Performance

**Symptoms:**
- Queries taking > 1 second
- High read costs

**Solution:**
1. Check if composite index exists
2. Verify field order in index matches query
3. Consider denormalization for frequent queries

### Issue 3: Index Build Failures

**Symptoms:**
- Index stuck in "Building" state
- Index creation fails

**Solution:**
1. Check for collection size limits
2. Verify field types are indexable
3. Contact Firebase support if persistent

---

## 📈 Index Maintenance

### Monthly Tasks
- [ ] Review query patterns in Firebase Console
- [ ] Identify slow queries (> 500ms)
- [ ] Check index usage statistics
- [ ] Remove unused indexes

### Quarterly Tasks
- [ ] Audit all indexes for relevance
- [ ] Optimize index field ordering
- [ ] Review storage costs
- [ ] Update this documentation

---

## 🔗 Additional Resources

- [Firestore Index Documentation](https://firebase.google.com/docs/firestore/query-data/indexing)
- [Best Practices for Queries](https://firebase.google.com/docs/firestore/best-practices)
- [Index Limitations](https://firebase.google.com/docs/firestore/quotas#indexes)
- [Firestore Pricing](https://firebase.google.com/pricing)

---

**Document Status:** ✅ COMPLETE  
**Next Review:** March 2026  
**Maintained By:** Development Team

