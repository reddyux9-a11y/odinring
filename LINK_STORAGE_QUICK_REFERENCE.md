# Link Storage Quick Reference

## TL;DR - How Links Are Stored

```
USER (Authentication + Profile)
  ↓
  └── user.id = "uuid-123"
       ↓
       └── LINKS (1:N relationship)
            ├── link1 { user_id: "uuid-123", title: "Instagram", order: 0 }
            ├── link2 { user_id: "uuid-123", title: "Website", order: 1 }
            └── link3 { user_id: "uuid-123", title: "LinkedIn", order: 2 }
```

**Key Point:** There is **NO separate "profile" entity**. The User model IS the profile.

---

## Data Model

### User Collection
```json
{
  "id": "uuid",              // Primary key
  "username": "johndoe",     // Unique, used in URLs
  "email": "john@example",   // Auth only
  "name": "John Doe",        // Display name
  "bio": "Developer",        // Profile bio
  "avatar": "https://...",   // Profile picture
  "ring_id": "RING001",      // NFC ring ID
  "theme": "light",          // UI theme
  "accent_color": "#000",    // Customization
  "custom_logo": "https://", // Branding
  "created_at": "2025-01-01"
}
```

### Links Collection
```json
{
  "id": "uuid",                  // Primary key
  "user_id": "uuid",             // 🔑 Foreign key → users.id
  "title": "Instagram",          // Display title
  "url": "https://instagram...", // Target URL
  "icon": "Instagram",           // Icon name
  "category": "social",          // social|business|media|general
  "active": true,                // Visible on profile?
  "order": 0,                    // Display order
  "clicks": 42,                  // Click counter
  "created_at": "2025-01-01",
  "updated_at": "2025-01-02"
}
```

---

## CRUD Operations

### Create Link
```
POST /api/links
Authorization: Bearer {JWT}
Body: { title, url, icon, category, ... }

Flow:
1. Extract user_id from JWT
2. Calculate next order number
3. Create link with user_id
4. Insert into links collection
5. Log audit event
```

### Read Links
```
GET /api/links (Authenticated)
→ Returns ALL links for current user (active + inactive)
→ Sorted by order ASC

GET /api/p/{username} (Public) ← NOT YET IMPLEMENTED
→ Should return ONLY active links
→ No auth required
```

### Update Link
```
PUT /api/links/{link_id}
Authorization: Bearer {JWT}
Body: { title?, url?, active?, ... }

Security:
- Verifies link.user_id == current_user.id
- Returns 404 if not owned by user
```

### Delete Link
```
DELETE /api/links/{link_id}
Authorization: Bearer {JWT}

Security:
- Verifies link.user_id == current_user.id
- Logs audit event
```

---

## Database Indexes

### Primary Query Pattern
```
Query: user_id = "xyz" AND active = true ORDER BY order ASC
Index: (user_id ASC, active ASC, order ASC)
```

### Index Definitions
```json
[
  {"user_id": "ASC", "order": "ASC"},
  {"user_id": "ASC", "is_active": "ASC", "order": "ASC"},
  {"user_id": "ASC", "created_at": "DESC"}
]
```

---

## Security Model

### Ownership Enforcement
```python
# Every write operation checks:
link_doc = await links_collection.find_one({
    "id": link_id,
    "user_id": current_user.id  # 🔒 Prevents cross-user access
})
if not link_doc:
    raise HTTPException(404, "Link not found")
```

### Audit Trail
```
All operations logged to audit_logs collection:
- link_create
- link_update
- link_delete

Tracked: user_id, ip_address, user_agent, timestamp
```

---

## Current Limitations

1. **No Public Profile API**
   - Frontend must implement profile viewing
   - No dedicated `/api/p/{username}` endpoint

2. **No Multi-Profile Support**
   - One user = one set of links
   - Cannot have "personal" vs "business" link sets
   - Phase 2 will address this

3. **Simple Click Tracking**
   - Just a counter (no time series)
   - No analytics breakdown
   - Consider moving to analytics collection

4. **No Link Sharing**
   - Links owned by exactly one user
   - Cannot share across team/org

---

## Phase 2 Changes (In Progress)

### Identity System
```
User (Auth) → Profile (Display)
  ├── Personal Account (default)
  ├── Business Account (solo)
  └── Organization Account (team)
```

**Current Status:**
- ✅ `/me/context` endpoint (resolves account type)
- ✅ Onboarding flow (select account type)
- ⚠️ Links still use `user_id` (not profile-aware)

**Next Steps:**
- Add `profile_id` to links table
- Support multiple profiles per user
- Implement profile switching

---

## Quick Diagnostics

### Check Link Count for User
```python
link_count = await links_collection.count_documents({
    "user_id": "user-uuid"
})
```

### Find Orphaned Links
```python
all_links = await links_collection.find()
for link in all_links:
    user_exists = await users_collection.find_one({"id": link["user_id"]})
    if not user_exists:
        print(f"Orphaned link: {link['id']}")
```

### Get User's Most Clicked Link
```python
links = await links_collection.find(
    {"user_id": "user-uuid"},
    sort=[("clicks", -1)],
    limit=1
)
```

---

## Key Takeaways

1. **Links are stored with a simple `user_id` foreign key**
2. **Each link belongs to exactly one user**
3. **No separate "profile" entity - User IS the profile**
4. **All queries use indexed user_id lookups**
5. **Security enforced at every write operation**
6. **Phase 2 will extend to multi-profile support**

---

**See:** `LINK_STORAGE_ARCHITECTURE_ANALYSIS.md` for full details.








