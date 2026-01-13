# 🗄️ Firestore Database - Quick Reference

## **Project Info**
- **Project ID:** `studio-7743041576-fc16f`
- **Database:** Firestore (NoSQL)
- **Total Collections:** 16
- **Total Indexes:** 26
- **Active Collections:** 10

---

## **Core Collections**

### **1. users** (3 documents)
```json
{
  "id": "uuid",
  "name": "string",
  "username": "string (unique)",
  "email": "string (unique)",
  "password": "string (hashed)",
  "items": [...],  ← NEW: Items stored here
  "ring_id": "string",
  "theme": "light/dark",
  "created_at": "timestamp"
}
```
**Indexes:** email, username, ring_id, google_id

---

### **2. links** (6 documents)
```json
{
  "id": "uuid",
  "user_id": "string",
  "title": "string",
  "url": "string",
  "active": "boolean",
  "order": "integer",
  "style": "default/minimal/gradient/glass/filled/outlined",
  "created_at": "timestamp"
}
```
**Indexes:** user_id+order, user_id+is_active+order

---

### **3. items** (10 documents) ⚠️ DEPRECATED
```json
{
  "id": "uuid",
  "user_id": "string",
  "name": "string",
  "price": "float",
  "currency": "USD/EUR/GBP",
  "active": "boolean"
}
```
**Status:** DEPRECATED - Items now in `users.items` array

---

### **4. sessions** (71 documents)
```json
{
  "id": "uuid (session_id)",
  "user_id": "string",
  "token": "string (JWT)",
  "is_active": "boolean",
  "expires_at": "timestamp",
  "ip_address": "string"
}
```
**TTL:** 7 days

---

### **5. refresh_tokens** (90 documents)
```json
{
  "id": "uuid",
  "user_id": "string",
  "session_id": "string",
  "token_hash": "string",
  "is_active": "boolean",
  "expires_at": "timestamp"
}
```
**TTL:** 7 days

---

### **6. audit_logs**
```json
{
  "id": "uuid",
  "actor_id": "string (user_id)",
  "action": "login/logout/profile_update/etc",
  "entity_type": "user/link/ring",
  "entity_id": "string",
  "timestamp": "timestamp"
}
```
**Purpose:** Security & compliance audit trail

---

## **Analytics Collections**

### **7. analytics**
General analytics events

### **8. ring_analytics**
NFC ring tap tracking

### **9. qr_scans**
QR code scan tracking

---

## **Scheduling Collections**

### **10. availability**
User availability schedules

### **11. appointments**
Scheduled appointments with status tracking

---

## **Phase 2 Collections** (Identity & Subscriptions)

### **12. businesses** (0 documents)
Solo business accounts

### **13. organizations** (0 documents)
Multi-user organization accounts

### **14. departments** (0 documents)
Organization departments

### **15. memberships** (0 documents)
Organization member roles

### **16. subscriptions** (0 documents)
Subscription and billing

---

## **Key Changes**

### **Items Storage Migration**
```
BEFORE: Separate 'items' collection
AFTER:  users.items[] array

Benefits:
✅ No user_id mismatches
✅ Atomic operations
✅ Faster queries (one read instead of two)
✅ Better data locality
```

---

## **Indexes Summary**

| Collection | Indexes |
|------------|---------|
| users | 4 |
| links | 3 |
| sessions | 3 |
| refresh_tokens | 4 |
| audit_logs | 4 |
| ring_analytics | 3 |
| appointments | 1 |
| businesses | 1 |
| organizations | 1 |
| departments | 1 |
| memberships | 3 |
| subscriptions | 3 |

**Total:** 26 composite indexes

---

## **Data Relationships**

```
users
├── links (one-to-many via user_id)
├── items (embedded array)
├── sessions (one-to-many via user_id)
├── ring (one-to-one via ring_id)
└── businesses (one-to-one via owner_id)

organizations
├── departments (one-to-many)
└── memberships (many-to-many with users)
```

---

## **Security Features**

✅ **JWT Authentication** with refresh tokens  
✅ **Session Management** with expiry tracking  
✅ **Audit Logging** for compliance  
✅ **Token Rotation** for security  
✅ **Password Hashing** with bcrypt  
✅ **Rate Limiting** on all endpoints  

---

## **Access Patterns**

### **Get User with Items:**
```python
user = await users_collection.find_one({"id": user_id})
items = user.get("items", [])  # Items embedded!
```

### **Get User Links:**
```python
links = await links_collection.find(
    {"user_id": user_id},
    sort=[("order", 1)]
)
```

### **Get Active Sessions:**
```python
sessions = await sessions_collection.find({
    "user_id": user_id,
    "is_active": True
}, sort=[("created_at", -1)])
```

---

## **Configuration Files**

- **Indexes:** `firestore.indexes.json`
- **Config:** `backend/firebase_config.py`
- **Service Account:** `firebase-service-account.json`
- **Full Structure:** `FIRESTORE_DATABASE_STRUCTURE.json`

---

**Last Updated:** 2025-12-26

