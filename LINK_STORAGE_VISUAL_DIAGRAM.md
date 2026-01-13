# Link Storage Visual Architecture

## Complete Data Flow

```
                    ┌─────────────────────────────────────────┐
                    │         FIRESTORE DATABASE              │
                    │                                         │
                    │  ┌───────────────────────────────────┐ │
                    │  │    USERS COLLECTION               │ │
                    │  │                                   │ │
                    │  │  Document: user-123               │ │
                    │  │  {                                │ │
                    │  │    id: "user-123"                 │ │
                    │  │    username: "johndoe"            │ │
                    │  │    email: "john@example.com"      │ │
                    │  │    name: "John Doe"               │ │
                    │  │    bio: "Developer & Creator"     │ │
                    │  │    avatar: "https://..."          │ │
                    │  │    ring_id: "RING001"             │ │
                    │  │    theme: "dark"                  │ │
                    │  │  }                                │ │
                    │  └───────────────────────────────────┘ │
                    │            │                            │
                    │            │ 1:N relationship           │
                    │            ▼                            │
                    │  ┌───────────────────────────────────┐ │
                    │  │    LINKS COLLECTION               │ │
                    │  │                                   │ │
                    │  │  Document: link-1                 │ │
                    │  │  {                                │ │
                    │  │    id: "link-1"                   │ │
                    │  │    user_id: "user-123" ◄──────────┼─┤ FOREIGN KEY
                    │  │    title: "Instagram"             │ │
                    │  │    url: "https://instagram..."    │ │
                    │  │    icon: "Instagram"              │ │
                    │  │    category: "social"             │ │
                    │  │    active: true                   │ │
                    │  │    order: 0                       │ │
                    │  │    clicks: 42                     │ │
                    │  │  }                                │ │
                    │  │                                   │ │
                    │  │  Document: link-2                 │ │
                    │  │  {                                │ │
                    │  │    id: "link-2"                   │ │
                    │  │    user_id: "user-123" ◄──────────┼─┤ FOREIGN KEY
                    │  │    title: "Personal Website"      │ │
                    │  │    url: "https://johndoe.com"     │ │
                    │  │    icon: "Globe"                  │ │
                    │  │    category: "general"            │ │
                    │  │    active: true                   │ │
                    │  │    order: 1                       │ │
                    │  │    clicks: 15                     │ │
                    │  │  }                                │ │
                    │  │                                   │ │
                    │  │  Document: link-3                 │ │
                    │  │  {                                │ │
                    │  │    id: "link-3"                   │ │
                    │  │    user_id: "user-123" ◄──────────┼─┤ FOREIGN KEY
                    │  │    title: "LinkedIn"              │ │
                    │  │    url: "https://linkedin..."     │ │
                    │  │    icon: "Linkedin"               │ │
                    │  │    category: "social"             │ │
                    │  │    active: false                  │ │
                    │  │    order: 2                       │ │
                    │  │    clicks: 8                      │ │
                    │  │  }                                │ │
                    │  └───────────────────────────────────┘ │
                    └─────────────────────────────────────────┘
```

---

## Link Creation Flow

```
┌───────────────┐
│  USER TYPES   │
│  IN BROWSER   │
│               │
│ "Add Link"    │
│ Title: GitHub │
│ URL: https:// │
└───────┬───────┘
        │
        │ 1. Click "Save"
        │
        ▼
┌─────────────────────────┐
│  FRONTEND (React)       │
│                         │
│  POST /api/links        │
│  Headers:               │
│    Authorization:       │
│      Bearer eyJ0eXAi... │  ◄─── JWT contains user_id
│  Body:                  │
│    {                    │
│      title: "GitHub",   │
│      url: "https://...",│
│      icon: "Github"     │
│    }                    │
└──────────┬──────────────┘
           │
           │ 2. HTTP Request
           │
           ▼
┌─────────────────────────────────────────────────────────┐
│  BACKEND (FastAPI)                                      │
│                                                         │
│  @api_router.post("/links")                            │
│  async def create_link(                                │
│    link_data: LinkCreate,                              │
│    current_user: User = Depends(get_current_user)     │
│  ):                                                     │
│                                                         │
│    ┌───────────────────────────────────┐              │
│    │ 3. JWT Validation                 │              │
│    │    - Decode JWT                   │              │
│    │    - Extract user_id from payload │              │
│    │    - Validate session             │              │
│    │    - Fetch user from Firestore    │              │
│    │    → current_user = User(...)     │              │
│    └───────────────────────────────────┘              │
│                 │                                       │
│                 ▼                                       │
│    ┌───────────────────────────────────┐              │
│    │ 4. Calculate Order Number         │              │
│    │    Query:                          │              │
│    │      WHERE user_id = current_user.id│            │
│    │      ORDER BY order DESC           │              │
│    │      LIMIT 1                       │              │
│    │    → next_order = last.order + 1  │              │
│    └───────────────────────────────────┘              │
│                 │                                       │
│                 ▼                                       │
│    ┌───────────────────────────────────┐              │
│    │ 5. Create Link Object             │              │
│    │    link = Link(                   │              │
│    │      id: uuid.uuid4()             │              │
│    │      user_id: current_user.id ◄───┼──── CRITICAL │
│    │      title: "GitHub"              │              │
│    │      url: "https://..."           │              │
│    │      order: next_order            │              │
│    │      active: true                 │              │
│    │      clicks: 0                    │              │
│    │      created_at: now()            │              │
│    │    )                              │              │
│    └───────────────────────────────────┘              │
│                 │                                       │
│                 ▼                                       │
│    ┌───────────────────────────────────┐              │
│    │ 6. Insert to Firestore            │              │
│    │    await links_collection         │              │
│    │      .insert_one(link.model_dump())│             │
│    └───────────────────────────────────┘              │
│                 │                                       │
│                 ▼                                       │
│    ┌───────────────────────────────────┐              │
│    │ 7. Log Audit Event                │              │
│    │    await log_link_create(         │              │
│    │      user_id, link_id, ip, agent) │              │
│    └───────────────────────────────────┘              │
│                 │                                       │
│                 ▼                                       │
│         return link.model_dump()                       │
│                                                         │
└─────────────────────────┬───────────────────────────────┘
                          │
                          │ 8. HTTP Response
                          │    { id, user_id, title, ... }
                          │
                          ▼
┌─────────────────────────────────┐
│  FRONTEND                       │
│  - Updates local state          │
│  - Shows success toast          │
│  - Displays new link in list    │
└─────────────────────────────────┘
```

---

## Link Retrieval: Authenticated User

```
┌───────────────────────┐
│  USER OPENS DASHBOARD │
└───────────┬───────────┘
            │
            │ 1. useEffect(() => { loadLinks() })
            │
            ▼
┌────────────────────────────┐
│  FRONTEND                  │
│                            │
│  GET /api/links            │
│  Headers:                  │
│    Authorization: Bearer JWT│
└────────────┬───────────────┘
             │
             │ 2. HTTP Request
             │
             ▼
┌─────────────────────────────────────────────┐
│  BACKEND                                    │
│                                             │
│  @api_router.get("/links")                 │
│  async def get_user_links(                 │
│    current_user: User = Depends(...)       │
│  ):                                         │
│                                             │
│    ┌──────────────────────────────┐        │
│    │ 3. Validate JWT              │        │
│    │    → current_user.id         │        │
│    └──────────────────────────────┘        │
│                │                            │
│                ▼                            │
│    ┌──────────────────────────────┐        │
│    │ 4. Query Firestore           │        │
│    │    links_collection.find(    │        │
│    │      {                        │        │
│    │        "user_id": current_user.id ◄───┼─ Filter by owner
│    │      },                       │        │
│    │      sort=[("order", 1)]     │        │
│    │    )                          │        │
│    │    → Returns ALL links        │        │
│    │       (active + inactive)     │        │
│    └──────────────────────────────┘        │
│                │                            │
│                ▼                            │
│         return [link1, link2, link3]       │
│                                             │
└────────────────┬────────────────────────────┘
                 │
                 │ 5. HTTP Response
                 │    [ {id, title, url, active, order}, ... ]
                 │
                 ▼
┌───────────────────────────────────┐
│  FRONTEND                         │
│  - Renders links in dashboard     │
│  - Shows edit/delete buttons      │
│  - Allows reordering              │
│  - Shows active/inactive toggle   │
└───────────────────────────────────┘
```

---

## Link Retrieval: Public Profile (NOT YET IMPLEMENTED)

```
┌───────────────────────────┐
│  PUBLIC VISITOR           │
│  Navigates to:            │
│  odinring.com/johndoe     │
└────────────┬──────────────┘
             │
             │ 1. Browser loads profile page
             │
             ▼
┌────────────────────────────────┐
│  FRONTEND                      │
│                                │
│  GET /api/p/johndoe            │  ◄─── NOT YET IMPLEMENTED
│  (No Authorization header)     │
└────────────┬───────────────────┘
             │
             │ 2. HTTP Request
             │
             ▼
┌─────────────────────────────────────────────────┐
│  BACKEND (Proposed Implementation)              │
│                                                 │
│  @app.get("/api/p/{username}")                 │
│  async def get_public_profile(username: str):  │
│                                                 │
│    ┌─────────────────────────────┐            │
│    │ 3. Find User by Username    │            │
│    │    user = await users       │            │
│    │      .find_one({            │            │
│    │        "username": "johndoe"│            │
│    │      })                     │            │
│    └─────────────────────────────┘            │
│                │                                │
│                ▼                                │
│    ┌─────────────────────────────┐            │
│    │ 4. Get Active Links         │            │
│    │    links = await links      │            │
│    │      .find({                │            │
│    │        "user_id": user.id,  │            │
│    │        "active": true ◄─────┼──── Only active
│    │      },                     │            │
│    │      sort=[("order", 1)]   │            │
│    │    )                        │            │
│    └─────────────────────────────┘            │
│                │                                │
│                ▼                                │
│    ┌─────────────────────────────┐            │
│    │ 5. Sanitize User Data       │            │
│    │    Remove:                  │            │
│    │    - email                  │            │
│    │    - phone_number           │            │
│    │    - private fields         │            │
│    └─────────────────────────────┘            │
│                │                                │
│                ▼                                │
│         return {                                │
│           user: { name, bio, avatar, ... },    │
│           links: [ ... ]                        │
│         }                                       │
│                                                 │
└────────────────┬────────────────────────────────┘
                 │
                 │ 6. HTTP Response
                 │
                 ▼
┌───────────────────────────────────┐
│  FRONTEND                         │
│  - Renders public profile         │
│  - Shows user info (name, bio)    │
│  - Displays active links only     │
│  - No edit controls               │
│  - Tracks clicks on links         │
└───────────────────────────────────┘
```

---

## Security: Ownership Verification

```
┌────────────────────────────┐
│  USER ATTEMPTS TO DELETE   │
│  ANOTHER USER'S LINK       │
│                            │
│  DELETE /api/links/xyz     │
│  (Malicious request)       │
└────────────┬───────────────┘
             │
             ▼
┌──────────────────────────────────────────────┐
│  BACKEND                                     │
│                                              │
│  @api_router.delete("/links/{link_id}")     │
│  async def delete_link(                     │
│    link_id: str,                            │
│    current_user: User = Depends(...)        │
│  ):                                          │
│                                              │
│    ┌────────────────────────────┐           │
│    │ 1. Validate JWT            │           │
│    │    → current_user.id = "A" │           │
│    └────────────────────────────┘           │
│                │                             │
│                ▼                             │
│    ┌────────────────────────────┐           │
│    │ 2. Find Link & Verify Owner│           │
│    │    link = await links      │           │
│    │      .find_one({           │           │
│    │        "id": "xyz",        │           │
│    │        "user_id": "A" ◄────┼──── CRITICAL
│    │      })                    │           │
│    │                            │           │
│    │    if not link:            │           │
│    │      raise HTTPException(  │           │
│    │        404,                │           │
│    │        "Link not found"    │  ◄─── Hides existence
│    │      )                     │           │
│    └────────────────────────────┘           │
│                │                             │
│                ▼                             │
│    ❌ Link belongs to user "B"              │
│    ❌ Returns 404 (not 403)                 │
│    ❌ Attacker cannot confirm link exists   │
│                                              │
└──────────────────────────────────────────────┘
```

**Security Benefits:**
- ✅ Every write checks `user_id`
- ✅ Returns 404 (not 403) to hide data existence
- ✅ No cross-user data access possible
- ✅ All operations audited with IP + user agent

---

## Index Performance

```
Query: "Get all active links for user X in order"

WITHOUT INDEX:
┌──────────────────────────────────────┐
│  links collection (100,000 docs)     │
│  ┌──────────────────────────────┐   │
│  │ Scan EVERY document          │   │
│  │ Filter user_id = "X"         │   │
│  │ Filter active = true         │   │
│  │ Sort by order                │   │
│  │ Time: ~500ms                 │   │
│  └──────────────────────────────┘   │
└──────────────────────────────────────┘

WITH COMPOSITE INDEX:
┌──────────────────────────────────────┐
│  Index: (user_id, active, order)     │
│  ┌──────────────────────────────┐   │
│  │ Jump directly to user X      │   │
│  │ Filter active = true (fast)  │   │
│  │ Already sorted by order      │   │
│  │ Time: ~5ms                   │   │
│  └──────────────────────────────┘   │
└──────────────────────────────────────┘

Performance Gain: 100x faster
```

**Current Indexes:**
```
1. (user_id ASC, order ASC)
   → For dashboard link retrieval

2. (user_id ASC, is_active ASC, order ASC)
   → For public profile (active links only)

3. (user_id ASC, created_at DESC)
   → For analytics, history views
```

---

## Phase 2: Multi-Profile Architecture (Future)

```
CURRENT (Phase 1):
┌──────────┐
│   USER   │ = PROFILE (single entity)
└────┬─────┘
     │
     └──► LINKS

FUTURE (Phase 2):
┌──────────┐
│   USER   │ (Auth identity)
└────┬─────┘
     │
     ├──► PERSONAL PROFILE ──► LINKS (personal)
     │
     ├──► BUSINESS PROFILE ──► LINKS (business)
     │
     └──► ORG PROFILE ──► LINKS (organization)

Links Table Extension:
{
  id: "uuid",
  user_id: "uuid",           ← Still present (creator)
  profile_id: "uuid",        ← NEW: Which profile owns this
  profile_type: "personal",  ← NEW: personal|business|organization
  owner_type: "user",        ← NEW: user|business|organization
  owner_id: "uuid",          ← NEW: Actual owner (may differ from creator)
  ...
}
```

---

**End of Visual Diagrams**








