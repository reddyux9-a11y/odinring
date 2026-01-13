# OdinRing Data Flow Diagram

**Complete System Architecture & Data Flow**

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          ODINRING SYSTEM                                │
│                                                                         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────────┐ │
│  │   Frontend   │◄──►│   Backend    │◄──►│   Google Cloud          │ │
│  │   (React)    │    │  (FastAPI)   │    │   Firestore             │ │
│  └──────────────┘    └──────────────┘    └──────────────────────────┘ │
│         ▲                    ▲                                         │
│         │                    │                                         │
│         └────────────────────┴──────────────────────────────────────┐  │
│                              │                                       │  │
│                    ┌──────────────────┐                             │  │
│                    │  Firebase Auth   │                             │  │
│                    │  (Google OAuth)  │                             │  │
│                    └──────────────────┘                             │  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 1. User Authentication Flow

### 1.1 Google Sign-In Flow

```
┌────────────┐
│   User     │
│  (Client)  │
└─────┬──────┘
      │
      │ 1. Clicks "Sign in with Google"
      ▼
┌──────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                              │
│  Component: GoogleSignInButton.jsx                               │
│                                                                  │
│  2. handleGoogleSignIn()                                        │
│     ├─ signInWithGooglePopup() from firebase.js                │
│     └─ If popup blocked: signInWithGoogleRedirect()            │
└──────────────┬───────────────────────────────────────────────────┘
               │
               │ 3. Firebase SDK initiates OAuth flow
               ▼
┌──────────────────────────────────────────────────────────────────┐
│              FIREBASE AUTHENTICATION                             │
│                                                                  │
│  4. User authenticates with Google                              │
│  5. Firebase returns:                                           │
│     ├─ Firebase ID Token (JWT)                                  │
│     ├─ User email                                               │
│     ├─ User name                                                │
│     ├─ Photo URL                                                │
│     └─ UID                                                      │
└──────────────┬───────────────────────────────────────────────────┘
               │
               │ 6. Frontend receives Firebase result
               ▼
┌──────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                              │
│  Component: GoogleSignInButton.jsx                               │
│                                                                  │
│  7. Extract data from Firebase result                           │
│  8. Call AuthContext.loginWithGoogle({                          │
│       firebaseToken: idToken,                                   │
│       email: user.email,                                        │
│       name: user.displayName,                                   │
│       photoURL: user.photoURL,                                  │
│       uid: user.uid                                             │
│     })                                                          │
└──────────────┬───────────────────────────────────────────────────┘
               │
               │ 9. POST /api/auth/google-signin
               │    Body: {firebase_token, email, name, photo_url, uid}
               ▼
┌──────────────────────────────────────────────────────────────────┐
│                    BACKEND (FastAPI)                             │
│  Endpoint: /api/auth/google-signin                               │
│                                                                  │
│  10. Verify Firebase ID token                                   │
│      ├─ firebase_auth.verify_id_token(firebase_token)           │
│      └─ Validate UID matches                                    │
│                                                                  │
│  11. Check if user exists in Firestore                          │
│      └─ users_collection.find_one({"email": email})             │
│                                                                  │
│  12a. IF USER EXISTS:                                           │
│       ├─ Update google_id and profile_photo                     │
│       └─ users_collection.update_one(...)                       │
│                                                                  │
│  12b. IF NEW USER:                                              │
│       ├─ Generate unique username from email                    │
│       ├─ Create User object with UUID                           │
│       └─ users_collection.insert_one(user_dict)                 │
│                                                                  │
│  13. Generate JWT token                                         │
│      ├─ Payload: {user_id: user.id, exp: 7 days}               │
│      └─ jwt.encode(payload, JWT_SECRET)                         │
│                                                                  │
│  14. Return {token: jwt_token, user: user_object}               │
└──────────────┬───────────────────────────────────────────────────┘
               │
               │ 15. Response with token and user data
               ▼
┌──────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                              │
│  Context: AuthContext.jsx                                        │
│                                                                  │
│  16. Store authentication data:                                 │
│      ├─ localStorage.setItem('token', token)                    │
│      ├─ localStorage.setItem('user_data', JSON.stringify(user)) │
│      └─ localStorage.setItem('user_id', user.id)                │
│                                                                  │
│  17. Update React state:                                        │
│      ├─ setUser(user)                                           │
│      ├─ setAuthChecked(true)                                    │
│      └─ setLoading(false)                                       │
│                                                                  │
│  18. Navigate to /dashboard                                     │
└──────────────────────────────────────────────────────────────────┘
```

### 1.2 Email/Password Registration Flow

```
┌────────────┐
│   User     │
└─────┬──────┘
      │ 1. Fills registration form
      │    (name, username, email, password)
      ▼
┌──────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                              │
│  Page: AuthPage.jsx                                              │
│                                                                  │
│  2. Form validation (client-side)                               │
│  3. POST /api/auth/register                                     │
│     Body: {name, username, email, password}                     │
└──────────────┬───────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────────┐
│                    BACKEND (FastAPI)                             │
│  Endpoint: /api/auth/register                                    │
│                                                                  │
│  4. Validate input (Pydantic models)                            │
│                                                                  │
│  5. Check if email exists                                       │
│     └─ users_collection.find_one({"email": email})              │
│                                                                  │
│  6. Check if username exists                                    │
│     └─ users_collection.find_one({"username": username})        │
│                                                                  │
│  7. Hash password                                               │
│     └─ bcrypt.hashpw(password, bcrypt.gensalt())                │
│                                                                  │
│  8. Generate ring_id                                            │
│     └─ generate_ring_id() → "RING-XXXXXX"                       │
│                                                                  │
│  9. Create User object                                          │
│     ├─ id: str(uuid.uuid4())                                    │
│     ├─ name, username, email                                    │
│     ├─ ring_id                                                  │
│     ├─ created_at: datetime.utcnow()                            │
│     └─ Default theme/colors                                     │
│                                                                  │
│  10. Store in Firestore                                         │
│      ├─ user_dict = user.model_dump()                           │
│      ├─ user_dict["password"] = hashed_password                 │
│      └─ users_collection.insert_one(user_dict)                  │
│                                                                  │
│  11. Track ring assignment (analytics)                          │
│      └─ track_ring_event(ring_id, "assigned", user.id)          │
│                                                                  │
│  12. Generate JWT token                                         │
│      └─ create_jwt_token(user.id)                               │
│                                                                  │
│  13. Return {token, user}                                       │
└──────────────┬───────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                              │
│  Context: AuthContext.jsx                                        │
│                                                                  │
│  14. Store token and user data (same as Google Sign-In)         │
│  15. Navigate to /dashboard                                     │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. User Profile Persistence Flow

### 2.1 App Load & Auto-Login

```
┌────────────┐
│   User     │
│  Opens App │
└─────┬──────┘
      │
      ▼
┌──────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                              │
│  Component: App.js → AuthProvider                                │
│                                                                  │
│  1. useEffect(() => checkAuthStatus(), [])                      │
└──────────────┬───────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                              │
│  Context: AuthContext.checkAuthStatus()                          │
│                                                                  │
│  2. Check localStorage for token                                │
│     const token = localStorage.getItem('token')                 │
│                                                                  │
│  3. IF TOKEN EXISTS:                                            │
│     ┌─────────────────────────────────────────────────────┐    │
│     │ INSTANT RESTORATION (Fast UX)                       │    │
│     │                                                     │    │
│     │ a. Get cached user data                            │    │
│     │    const cachedUserData = localStorage.getItem(    │    │
│     │      'user_data'                                   │    │
│     │    )                                               │    │
│     │                                                     │    │
│     │ b. Parse and restore immediately                   │    │
│     │    const userData = JSON.parse(cachedUserData)     │    │
│     │    setUser(userData)  // User sees data instantly  │    │
│     │    setLoading(false)                               │    │
│     └─────────────────────────────────────────────────────┘    │
│                                                                  │
│  4. BACKGROUND REFRESH (Fresh data)                             │
│     └─ fetchUserData(token)                                     │
└──────────────┬───────────────────────────────────────────────────┘
               │
               │ 5. GET /api/me
               │    Headers: {Authorization: Bearer <token>}
               ▼
┌──────────────────────────────────────────────────────────────────┐
│                    BACKEND (FastAPI)                             │
│  Endpoint: /api/me                                               │
│                                                                  │
│  6. Extract JWT from Authorization header                       │
│  7. Verify JWT token                                            │
│     ├─ jwt.decode(token, JWT_SECRET)                            │
│     └─ Extract user_id from payload                             │
│                                                                  │
│  8. Fetch user from Firestore                                   │
│     └─ users_collection.find_one({"id": user_id})               │
│                                                                  │
│  9. Return user object (without password)                       │
└──────────────┬───────────────────────────────────────────────────┘
               │
               │ 10. Response with fresh user data
               ▼
┌──────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                              │
│  Context: AuthContext.fetchUserData()                            │
│                                                                  │
│  11. Update cache with fresh data                               │
│      ├─ localStorage.setItem('user_data', JSON.stringify(user)) │
│      └─ localStorage.setItem('user_id', user.id)                │
│                                                                  │
│  12. Update React state                                         │
│      └─ setUser(user)  // Re-render with fresh data             │
│                                                                  │
│  13. setAuthChecked(true)                                       │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 User Profile Update Flow

```
┌────────────┐
│   User     │
│  (Dashboard)│
└─────┬──────┘
      │ 1. Edits profile (name, bio, avatar, theme)
      │ 2. Clicks "Save"
      ▼
┌──────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                              │
│  Component: ProfileSettings.jsx                                  │
│                                                                  │
│  3. PUT /api/profile                                            │
│     Body: {name, bio, avatar, theme, accent_color, ...}         │
│     Headers: {Authorization: Bearer <token>}                    │
└──────────────┬───────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────────┐
│                    BACKEND (FastAPI)                             │
│  Endpoint: /api/profile                                          │
│                                                                  │
│  4. Verify JWT and get current_user                             │
│                                                                  │
│  5. Validate update data (Pydantic UserUpdate model)            │
│                                                                  │
│  6. Update user in Firestore                                    │
│     └─ users_collection.update_one(                             │
│          {"id": current_user.id},                               │
│          {"$set": {                                             │
│            "name": name,                                        │
│            "bio": bio,                                          │
│            "avatar": avatar,                                    │
│            "theme": theme,                                      │
│            "updated_at": datetime.utcnow()                      │
│          }}                                                     │
│        )                                                        │
│                                                                  │
│  7. Fetch updated user                                          │
│     └─ users_collection.find_one({"id": current_user.id})      │
│                                                                  │
│  8. Return updated user object                                  │
└──────────────┬───────────────────────────────────────────────────┘
               │
               │ 9. Response with updated user
               ▼
┌──────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                              │
│  Context: AuthContext.updateUserData()                           │
│                                                                  │
│  10. Update all caches                                          │
│      ├─ localStorage.setItem('user_data', JSON.stringify(user)) │
│      └─ setUser(user)  // React state                           │
│                                                                  │
│  11. UI updates automatically (React re-render)                 │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. Links Data Flow

### 3.1 Dashboard Load - Fetch User Links

```
┌────────────┐
│   User     │
│  (Logged In)│
└─────┬──────┘
      │ 1. Navigates to /dashboard
      ▼
┌──────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                              │
│  Component: Dashboard.jsx                                        │
│                                                                  │
│  2. useEffect(() => {                                           │
│       if (user) {                                               │
│         loadUserData()                                          │
│       }                                                         │
│     }, [user])                                                  │
└──────────────┬───────────────────────────────────────────────────┘
               │
               │ 3. GET /api/links
               │    Headers: {Authorization: Bearer <token>}
               ▼
┌──────────────────────────────────────────────────────────────────┐
│                    BACKEND (FastAPI)                             │
│  Endpoint: /api/links (GET)                                      │
│                                                                  │
│  4. Verify JWT and get current_user                             │
│                                                                  │
│  5. Query Firestore for user's links                            │
│     └─ links_collection.find(                                   │
│          filter_dict={"user_id": current_user.id},              │
│          sort=[("order", 1)]  # Ascending order                 │
│        )                                                        │
│                                                                  │
│  6. Convert to Link objects                                     │
│     └─ links = [Link(**link_doc) for link_doc in link_docs]    │
│                                                                  │
│  7. Return array of link objects                                │
│     └─ [link.model_dump() for link in links]                   │
└──────────────┬───────────────────────────────────────────────────┘
               │
               │ 8. Response: [{id, user_id, title, url, ...}, ...]
               ▼
┌──────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                              │
│  Component: Dashboard.jsx                                        │
│                                                                  │
│  9. Store links in state                                        │
│     └─ setLinks(response.data)                                  │
│                                                                  │
│  10. Render links in SimpleLinkManager                          │
│      └─ links.map(link => <LinkCard key={link.id} ... />)       │
└──────────────────────────────────────────────────────────────────┘
```

### 3.2 Create New Link Flow

```
┌────────────┐
│   User     │
│  (Dashboard)│
└─────┬──────┘
      │ 1. Clicks "Add Link"
      │ 2. Fills form (title, url, icon, category, style)
      │ 3. Clicks "Save"
      ▼
┌──────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                              │
│  Component: SimpleLinkManager.jsx                                │
│                                                                  │
│  4. onAddLink(linkData)                                         │
│  5. POST /api/links                                             │
│     Body: {                                                     │
│       title: "My Website",                                      │
│       url: "https://example.com",                               │
│       icon: "Globe",                                            │
│       category: "general",                                      │
│       style: "default",                                         │
│       color: "#000000",                                         │
│       ...                                                       │
│     }                                                           │
│     Headers: {Authorization: Bearer <token>}                    │
└──────────────┬───────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────────┐
│                    BACKEND (FastAPI)                             │
│  Endpoint: /api/links (POST)                                     │
│                                                                  │
│  6. Verify JWT and get current_user                             │
│                                                                  │
│  7. Calculate next order number                                 │
│     └─ last_links = links_collection.find(                      │
│          filter_dict={"user_id": current_user.id},              │
│          sort=[("order", -1)],  # Descending                    │
│          limit=1                                                │
│        )                                                        │
│     └─ next_order = (last_links[0]["order"] + 1) if last_links │
│                     else 0                                      │
│                                                                  │
│  8. Create Link object                                          │
│     └─ link = Link(                                             │
│          id=str(uuid.uuid4()),                                  │
│          user_id=current_user.id,  # FOREIGN KEY                │
│          order=next_order,                                      │
│          **link_data.model_dump()                               │
│        )                                                        │
│                                                                  │
│  9. Insert into Firestore                                       │
│     └─ links_collection.insert_one(link.model_dump())           │
│        (Document ID = link.id)                                  │
│                                                                  │
│  10. Return created link                                        │
│      └─ link.model_dump()                                       │
└──────────────┬───────────────────────────────────────────────────┘
               │
               │ 11. Response: {id, user_id, title, url, order, ...}
               ▼
┌──────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                              │
│  Component: SimpleLinkManager.jsx                                │
│                                                                  │
│  12. Add new link to state                                      │
│      └─ setLinks([...links, response.data])                     │
│                                                                  │
│  13. UI updates automatically                                   │
│      └─ New LinkCard appears in list                            │
└──────────────────────────────────────────────────────────────────┘
```

### 3.3 Update Link Flow

```
┌────────────┐
│   User     │
└─────┬──────┘
      │ 1. Clicks edit on a link
      │ 2. Modifies title/url/style
      │ 3. Clicks "Save"
      ▼
┌──────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                              │
│                                                                  │
│  4. PUT /api/links/{link_id}                                    │
│     Body: {title: "Updated Title", url: "https://new.com"}      │
│     Headers: {Authorization: Bearer <token>}                    │
└──────────────┬───────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────────┐
│                    BACKEND (FastAPI)                             │
│  Endpoint: /api/links/{link_id} (PUT)                           │
│                                                                  │
│  5. Verify JWT and get current_user                             │
│                                                                  │
│  6. Verify link ownership                                       │
│     └─ link_doc = links_collection.find_one({                   │
│          "id": link_id,                                         │
│          "user_id": current_user.id  # Security check           │
│        })                                                       │
│     └─ If not found: raise HTTPException(404)                   │
│                                                                  │
│  7. Prepare update data (remove None values)                    │
│     └─ update_data = {k: v for k, v in link_update.model_dump() │
│                       if v is not None}                         │
│                                                                  │
│  8. Update in Firestore                                         │
│     └─ links_collection.update_one(                             │
│          {"id": link_id, "user_id": current_user.id},           │
│          {"$set": update_data}                                  │
│        )                                                        │
│                                                                  │
│  9. Fetch updated link                                          │
│     └─ updated_link_doc = links_collection.find_one(            │
│          {"id": link_id}                                        │
│        )                                                        │
│                                                                  │
│  10. Return updated link                                        │
│      └─ Link(**updated_link_doc).model_dump()                   │
└──────────────┬───────────────────────────────────────────────────┘
               │
               │ 11. Response: {id, user_id, title, url, ...}
               ▼
┌──────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                              │
│                                                                  │
│  12. Update link in state                                       │
│      └─ setLinks(links.map(l =>                                 │
│           l.id === link_id ? response.data : l                  │
│         ))                                                      │
│                                                                  │
│  13. UI updates automatically                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 3.4 Delete Link Flow

```
┌────────────┐
│   User     │
└─────┬──────┘
      │ 1. Clicks delete on a link
      │ 2. Confirms deletion
      ▼
┌──────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                              │
│                                                                  │
│  3. DELETE /api/links/{link_id}                                 │
│     Headers: {Authorization: Bearer <token>}                    │
└──────────────┬───────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────────┐
│                    BACKEND (FastAPI)                             │
│  Endpoint: /api/links/{link_id} (DELETE)                        │
│                                                                  │
│  4. Verify JWT and get current_user                             │
│                                                                  │
│  5. Delete link (with ownership check)                          │
│     └─ result = links_collection.delete_one({                   │
│          "id": link_id,                                         │
│          "user_id": current_user.id  # Security check           │
│        })                                                       │
│                                                                  │
│  6. Check if deleted                                            │
│     └─ If result.deleted_count == 0:                            │
│          raise HTTPException(404, "Link not found")             │
│                                                                  │
│  7. Return success message                                      │
│     └─ {"message": "Link deleted successfully"}                 │
└──────────────┬───────────────────────────────────────────────────┘
               │
               │ 8. Response: {message: "Link deleted successfully"}
               ▼
┌──────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                              │
│                                                                  │
│  9. Remove link from state                                      │
│     └─ setLinks(links.filter(l => l.id !== link_id))            │
│                                                                  │
│  10. UI updates automatically (link disappears)                 │
└──────────────────────────────────────────────────────────────────┘
```

---

## 4. Public Profile & Analytics Flow

### 4.1 Public Profile View

```
┌────────────┐
│  Visitor   │
│ (Anonymous)│
└─────┬──────┘
      │ 1. Visits /profile/{username}
      ▼
┌──────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                              │
│  Component: Profile.jsx                                          │
│                                                                  │
│  2. useEffect(() => {                                           │
│       fetchProfile(username)                                    │
│     }, [username])                                              │
│                                                                  │
│  3. GET /api/profile/{username}                                 │
│     (No authentication required)                                │
└──────────────┬───────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────────┐
│                    BACKEND (FastAPI)                             │
│  Endpoint: /api/profile/{username} (GET)                         │
│                                                                  │
│  4. Find user by username                                       │
│     └─ user_doc = users_collection.find_one(                    │
│          {"username": username}                                 │
│        )                                                        │
│     └─ If not found: raise HTTPException(404)                   │
│                                                                  │
│  5. Fetch user's active links                                   │
│     └─ links_cursor = links_collection.find(                    │
│          filter_dict={                                          │
│            "user_id": user.id,                                  │
│            "active": True  # Only show active links             │
│          },                                                     │
│          sort=[("order", 1)]                                    │
│        )                                                        │
│                                                                  │
│  6. Build public profile response                               │
│     └─ {                                                        │
│          "name": user.name,                                     │
│          "username": user.username,                             │
│          "bio": user.bio,                                       │
│          "avatar": user.avatar,                                 │
│          "theme": user.theme,                                   │
│          "accent_color": user.accent_color,                     │
│          "links": [link.model_dump() for link in links]         │
│        }                                                        │
│                                                                  │
│  7. Return public profile                                       │
└──────────────┬───────────────────────────────────────────────────┘
               │
               │ 8. Response: {name, username, bio, links: [...]}
               ▼
┌──────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                              │
│  Component: Profile.jsx                                          │
│                                                                  │
│  9. Render profile                                              │
│     ├─ Display user info (name, bio, avatar)                    │
│     └─ Render links as clickable cards                          │
└──────────────────────────────────────────────────────────────────┘
```

### 4.2 Link Click Tracking

```
┌────────────┐
│  Visitor   │
└─────┬──────┘
      │ 1. Clicks a link on public profile
      ▼
┌──────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                              │
│  Component: Profile.jsx                                          │
│                                                                  │
│  2. handleLinkClick(link_id)                                    │
│  3. POST /api/links/{link_id}/click                             │
│     (No authentication required)                                │
└──────────────┬───────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────────┐
│                    BACKEND (FastAPI)                             │
│  Endpoint: /api/links/{link_id}/click (POST)                    │
│                                                                  │
│  4. Get link info                                               │
│     └─ link_doc = links_collection.find_one({"id": link_id})    │
│                                                                  │
│  5. Increment click count                                       │
│     └─ links_collection.update_one(                             │
│          {"id": link_id},                                       │
│          {"$inc": {"clicks": 1}}  # Atomic increment            │
│        )                                                        │
│                                                                  │
│  6. Get link owner (user)                                       │
│     └─ user_doc = users_collection.find_one(                    │
│          {"id": link_doc["user_id"]}                            │
│        )                                                        │
│                                                                  │
│  7. IF user has ring_id:                                        │
│     └─ Track ring analytics                                     │
│        ring_analytics_collection.insert_one({                   │
│          "id": str(uuid.uuid4()),                               │
│          "ring_id": user_doc["ring_id"],                        │
│          "event_type": "click",                                 │
│          "user_id": user_doc["id"],                             │
│          "link_id": link_id,                                    │
│          "ip_address": request.client.host,                     │
│          "user_agent": request.headers["user-agent"],           │
│          "timestamp": datetime.utcnow()                         │
│        })                                                       │
│                                                                  │
│  8. Return success                                              │
│     └─ {"message": "Click tracked"}                             │
└──────────────┬───────────────────────────────────────────────────┘
               │
               │ 9. Response: {message: "Click tracked"}
               ▼
┌──────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                              │
│                                                                  │
│  10. Redirect visitor to link.url                               │
│      └─ window.open(link.url, '_blank')                         │
└──────────────────────────────────────────────────────────────────┘
```

---

## 5. Data Storage Architecture

### 5.1 Firestore Collection Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                    GOOGLE CLOUD FIRESTORE                       │
│                    Database: odinringdb                         │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  USERS Collection                                        │  │
│  │  Document ID: user.id (UUID)                             │  │
│  │                                                          │  │
│  │  {                                                       │  │
│  │    id: "550e8400-e29b-41d4-a716-446655440000",          │  │
│  │    email: "user@example.com",                           │  │
│  │    username: "johndoe",                                 │  │
│  │    name: "John Doe",                                    │  │
│  │    ring_id: "RING-ABC123",  ◄──┐                        │  │
│  │    bio: "...",                  │                        │  │
│  │    avatar: "https://...",       │                        │  │
│  │    theme: "light",              │                        │  │
│  │    created_at: Timestamp,       │                        │  │
│  │    ...                          │                        │  │
│  │  }                              │                        │  │
│  └─────────┬────────────────────────┼──────────────────────┘  │
│            │                        │                          │
│            │ 1:N                    │ 1:1                      │
│            │                        │                          │
│  ┌─────────▼────────────────────────┼──────────────────────┐  │
│  │  LINKS Collection                │                      │  │
│  │  Document ID: link.id (UUID)     │                      │  │
│  │                                  │                      │  │
│  │  {                               │                      │  │
│  │    id: "660e8400-...",           │                      │  │
│  │    user_id: "550e8400-...", ◄────┘ FOREIGN KEY          │  │
│  │    title: "My Website",                                 │  │
│  │    url: "https://example.com",                          │  │
│  │    order: 0,                                            │  │
│  │    clicks: 42,                                          │  │
│  │    active: true,                                        │  │
│  │    ...                                                  │  │
│  │  }                                                      │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  RINGS Collection                                       │  │
│  │  Document ID: ring.id (UUID)                            │  │
│  │                                                         │  │
│  │  {                                                      │  │
│  │    id: "770e8400-...",                                  │  │
│  │    ring_id: "RING-ABC123",  ◄───────┐ REFERENCED BY    │  │
│  │    user_id: "550e8400-...",         │ users.ring_id    │  │
│  │    assigned_at: Timestamp,          │                  │  │
│  │    direct_mode: false,              │                  │  │
│  │    ...                              │                  │  │
│  │  }                                  │                  │  │
│  └─────────────────────────────────────┼──────────────────┘  │
│                                        │                      │
│  ┌─────────────────────────────────────┼──────────────────┐  │
│  │  RING_ANALYTICS Collection          │                  │  │
│  │  Document ID: event.id (UUID)       │                  │  │
│  │                                     │                  │  │
│  │  {                                  │                  │  │
│  │    id: "880e8400-...",              │                  │  │
│  │    ring_id: "RING-ABC123",  ◄───────┘                  │  │
│  │    user_id: "550e8400-...",                            │  │
│  │    link_id: "660e8400-...",                            │  │
│  │    event_type: "click",                                │  │
│  │    ip_address: "192.168.1.1",                          │  │
│  │    timestamp: Timestamp,                               │  │
│  │    ...                                                 │  │
│  │  }                                                     │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  QR_SCANS Collection                                    │  │
│  │  APPOINTMENTS Collection                                │  │
│  │  AVAILABILITY Collection                                │  │
│  │  ADMINS Collection                                      │  │
│  │  STATUS_CHECKS Collection                               │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Frontend Data Caching Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND DATA LAYERS                         │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  LAYER 1: React State (In-Memory)                      │  │
│  │  ─────────────────────────────────────────────────────  │  │
│  │  Speed: Instant                                         │  │
│  │  Persistence: Until page refresh                        │  │
│  │                                                         │  │
│  │  AuthContext:                                           │  │
│  │    - user: User object                                  │  │
│  │    - admin: Admin object                                │  │
│  │    - loading: boolean                                   │  │
│  │    - authChecked: boolean                               │  │
│  │                                                         │  │
│  │  Dashboard:                                             │  │
│  │    - links: Link[]                                      │  │
│  │    - profile: Profile object                            │  │
│  │    - ringSettings: RingSettings                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                          ▲                                      │
│                          │ Instant read/write                   │
│                          ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  LAYER 2: localStorage (Browser Storage)               │  │
│  │  ─────────────────────────────────────────────────────  │  │
│  │  Speed: Very fast (~1ms)                                │  │
│  │  Persistence: Until cleared or logout                   │  │
│  │  Size Limit: ~5-10MB                                    │  │
│  │                                                         │  │
│  │  Keys:                                                  │  │
│  │    - token: JWT string                                  │  │
│  │    - user_data: JSON.stringify(user)                    │  │
│  │    - user_id: user.id                                   │  │
│  │    - admin_token: JWT string (if admin)                 │  │
│  │    - theme: "light" | "dark"                            │  │
│  │    - activeSection: "links" | "analytics" | ...         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                          ▲                                      │
│                          │ Background sync                      │
│                          ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  LAYER 3: Backend API (Source of Truth)                │  │
│  │  ─────────────────────────────────────────────────────  │  │
│  │  Speed: Network dependent (~100-500ms)                  │  │
│  │  Persistence: Permanent (Firestore)                     │  │
│  │                                                         │  │
│  │  Endpoints:                                             │  │
│  │    - GET /api/me → Fresh user data                      │  │
│  │    - GET /api/links → User's links                      │  │
│  │    - PUT /api/profile → Update user                     │  │
│  │    - POST /api/links → Create link                      │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Security & Authentication Flow

### 6.1 JWT Token Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    JWT AUTHENTICATION FLOW                      │
│                                                                 │
│  1. USER LOGS IN                                                │
│     └─ Backend generates JWT                                    │
│        {                                                        │
│          "user_id": "550e8400-...",                             │
│          "exp": 1735689600  // 7 days from now                  │
│        }                                                        │
│        Signed with JWT_SECRET                                   │
│                                                                 │
│  2. TOKEN STORED                                                │
│     └─ localStorage.setItem('token', jwt_token)                 │
│                                                                 │
│  3. EVERY API REQUEST                                           │
│     ┌─────────────────────────────────────────────────────┐    │
│     │  Frontend (api.js)                                  │    │
│     │  ─────────────────────────────────────────────────  │    │
│     │  Request Interceptor:                               │    │
│     │    const token = localStorage.getItem('token')      │    │
│     │    if (token) {                                     │    │
│     │      config.headers.Authorization = `Bearer ${token}` │  │
│     │    }                                                │    │
│     └─────────────────────────────────────────────────────┘    │
│                          │                                      │
│                          ▼                                      │
│     ┌─────────────────────────────────────────────────────┐    │
│     │  Backend (server.py)                                │    │
│     │  ─────────────────────────────────────────────────  │    │
│     │  async def get_current_user(                        │    │
│     │    credentials: HTTPAuthorizationCredentials        │    │
│     │  ):                                                 │    │
│     │    1. Extract token from Authorization header       │    │
│     │    2. jwt.decode(token, JWT_SECRET)                 │    │
│     │    3. Extract user_id from payload                  │    │
│     │    4. Fetch user from Firestore                     │    │
│     │    5. Return User object                            │    │
│     └─────────────────────────────────────────────────────┘    │
│                                                                 │
│  4. TOKEN EXPIRATION (After 7 days)                             │
│     ┌─────────────────────────────────────────────────────┐    │
│     │  Backend returns 401 Unauthorized                   │    │
│     └─────────────────────────────────────────────────────┘    │
│                          │                                      │
│                          ▼                                      │
│     ┌─────────────────────────────────────────────────────┐    │
│     │  Frontend (AuthContext)                             │    │
│     │  ─────────────────────────────────────────────────  │    │
│     │  Axios Response Interceptor:                        │    │
│     │    if (error.response?.status === 401) {            │    │
│     │      logout()  // Clear all auth data               │    │
│     │      navigate('/auth')  // Redirect to login        │    │
│     │    }                                                │    │
│     └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Complete System State Summary

### 7.1 Live Components

✅ **Frontend (React)**
- AuthContext for authentication state
- Dashboard for user interface
- Public Profile for visitor views
- All components functional and connected

✅ **Backend (FastAPI)**
- All API endpoints operational
- JWT authentication working
- Firebase token verification active
- Error handling implemented

✅ **Database (Firestore)**
- 9 collections configured
- FirestoreDB wrapper functional
- Document ID indexing working
- Query operations validated

✅ **Authentication**
- Google Sign-In via Firebase
- Email/Password registration/login
- JWT token generation/verification
- Auto-login on app load

✅ **Data Persistence**
- localStorage caching
- Background data refresh
- Link CRUD operations
- Analytics tracking

### 7.2 Placeholder/Stubbed Components

⚠️ **Sign-out Buttons**
- PremiumSidebar: Directly calls logout()
- MobileSettingsPage: Directly calls onLogout()
- No additional confirmation or cleanup logic

⚠️ **Google Calendar Integration**
- Backend has optional integration
- Limited functionality if HAS_GOOGLE_CALENDAR = false
- Scheduling features may be incomplete

### 7.3 Disconnected/Legacy Components

❌ **MongoDB References**
- Fully replaced by Firestore
- No MongoDB connections remain

❌ **Legacy Analytics**
- Old analytics collection exists but unused
- ring_analytics_collection is primary

---

**Document Version:** 1.0  
**Last Updated:** December 24, 2025  
**Status:** ✅ VALIDATED & OPERATIONAL


