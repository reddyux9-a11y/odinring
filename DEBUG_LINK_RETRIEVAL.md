# Link Retrieval Debugging Guide

## Problem
Links exist in Firestore (verified: 5 links for user `reddyux9`) but are not showing in the frontend.

## Potential Issues

### 1. User ID Mismatch
**Most likely issue:** The user_id in the JWT token might not match the user_id in Firestore.

**Check:**
- JWT contains: `user_id = ???`
- Firestore has links for: `user_id = ea256363-2d58-48b5-bafc-f784aefd5ab8`

### 2. Authentication Flow

```
Frontend: api.get('/links')
    ↓
api.js interceptor: Adds Bearer token
    ↓
Backend: GET /api/links
    ↓
get_current_user() extracts user_id from JWT
    ↓
Query Firestore: links_collection.find({"user_id": current_user.id})
    ↓
Return links
```

**If user_id in JWT ≠ user_id in Firestore → Returns empty array**

### 3. API Endpoint Logging

Backend needs logging to see:
- What user_id is extracted from JWT
- What query is sent to Firestore
- What results are returned

## Debugging Steps

### Step 1: Check JWT Token Content

Add to Dashboard.jsx (line 214):
```javascript
const loadUserData = async (skipUserRefresh = false) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ No token found!');
      return;
    }
    
    // Decode JWT to see user_id
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('🔐 JWT Payload:', payload);
    console.log('🆔 User ID from JWT:', payload.user_id);
    
    // Load user's links
    console.log('📡 Calling GET /links...');
    const response = await api.get(`/links`);
    console.log('📦 Response received:', response.data);
    console.log('📊 Number of links:', response.data.length);
    
    if (isMountedRef.current) {
      setLinks(response.data);
    }
  } catch (error) {
    console.error('❌ loadUserData error:', error);
    console.error('Error response:', error.response?.data);
  }
};
```

### Step 2: Check Backend Logging

Add to backend/server.py (line 3336):
```python
@api_router.get("/links")
async def get_user_links(current_user: User = Depends(get_current_user)):
    logger.info(f"🔍 GET /links called")
    logger.info(f"🆔 current_user.id: {current_user.id}")
    logger.info(f"👤 current_user.username: {current_user.username}")
    logger.info(f"📧 current_user.email: {current_user.email}")
    
    # Get links sorted by order
    link_docs = await links_collection.find(
        {"user_id": current_user.id},
        sort=[("order", 1)]
    )
    
    logger.info(f"📊 Found {len(link_docs)} links")
    
    if len(link_docs) == 0:
        logger.warning(f"⚠️  No links found for user_id: {current_user.id}")
        logger.info(f"💡 Check if links in Firestore have different user_id")
    
    links = [Link(**link_doc) for link_doc in link_docs]
    return [link.model_dump() for link in links]
```

### Step 3: Verify User ID Match

Run this script:
```python
# check_user_id_match.py
import asyncio
from firestore_db import FirestoreDB

async def check_user_ids():
    users_collection = FirestoreDB('users')
    links_collection = FirestoreDB('links')
    
    # Get the user
    user = await users_collection.find_one({"email": "reddyux9@gmail.com"})
    print(f"User ID: {user['id']}")
    print(f"Username: {user['username']}")
    print(f"Email: {user['email']}")
    
    # Get links for this user
    links = await links_collection.find({"user_id": user['id']})
    print(f"\nLinks found: {len(links)}")
    
    if len(links) == 0:
        print("\n⚠️  WARNING: No links found for this user_id!")
        print("Checking all links...")
        all_links = await links_collection.find({})
        print(f"Total links in database: {len(all_links)}")
        if all_links:
            print(f"Example link user_id: {all_links[0]['user_id']}")

asyncio.run(check_user_ids())
```

## Common Causes

### Cause 1: User Created Links Before Login
If links were created with a different user_id (perhaps from a test account), they won't show for the current user.

**Solution:** Update links to have correct user_id:
```python
# Fix: Update all links to correct user_id
links = await links_collection.find({})
for link in links:
    await links_collection.update_one(
        {"id": link['id']},
        {"$set": {"user_id": "ea256363-2d58-48b5-bafc-f784aefd5ab8"}}
    )
```

### Cause 2: JWT Contains Wrong User ID
If JWT was created with a different user_id.

**Solution:** Log out and log in again to get fresh JWT.

### Cause 3: API Not Being Called
Frontend might not be calling loadUserData().

**Solution:** Check useEffect dependencies.

### Cause 4: CORS or Network Error
API call might be failing silently.

**Solution:** Check browser Network tab for 401/500 errors.

## Quick Fix Test

Add this to Dashboard.jsx to force load:
```javascript
useEffect(() => {
  if (user && links.length === 0) {
    console.log('🔄 Links empty, forcing reload...');
    loadUserData();
  }
}, [user, links]);
```

## Expected Console Output

**If working correctly:**
```
🔐 JWT Payload: { user_id: "ea256363-2d58-48b5-bafc-f784aefd5ab8", ... }
🆔 User ID from JWT: ea256363-2d58-48b5-bafc-f784aefd5ab8
📡 Calling GET /links...
📦 Response received: [{ id: "...", title: "website", ... }, ...]
📊 Number of links: 5
```

**If broken:**
```
🔐 JWT Payload: { user_id: "DIFFERENT_ID", ... }
🆔 User ID from JWT: DIFFERENT_ID
📡 Calling GET /links...
📦 Response received: []
📊 Number of links: 0
```

## Backend Expected Log Output

**If working:**
```
🔍 GET /links called
🆔 current_user.id: ea256363-2d58-48b5-bafc-f784aefd5ab8
👤 current_user.username: reddyux9
📧 current_user.email: reddyux9@gmail.com
📊 Found 5 links
```

**If broken:**
```
🔍 GET /links called
🆔 current_user.id: WRONG_ID
👤 current_user.username: ???
📧 current_user.email: ???
📊 Found 0 links
⚠️  No links found for user_id: WRONG_ID
```








