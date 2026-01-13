# Google API Integration Guide

**Date:** January 11, 2025  
**Purpose:** Guide to connecting Google APIs automatically when users sign in with Google Auth

---

## ✅ YES - It's Possible!

**Answer:** Yes, you can automatically connect Google APIs when users sign in with Google Auth by requesting additional OAuth scopes.

---

## 📊 Current Implementation Status

### Current State:
- ✅ **Google Sign-In:** Implemented via Firebase Auth
- ✅ **Authentication:** Users can sign in with Google
- ✅ **Basic Info:** Email, name, photo_url obtained
- ❌ **Additional APIs:** Not integrated yet
- ❌ **OAuth Scopes:** Only default authentication scopes

### Current Google Sign-In Flow:
1. User clicks "Sign in with Google"
2. Firebase Auth handles OAuth
3. User grants basic permissions (email, profile)
4. Backend receives Firebase ID token
5. User is authenticated
6. **Limited to:** Basic profile info only

---

## 🎯 What's Possible with Google APIs

When users sign in with Google, you can request access to:

### Available Google APIs:

1. **Gmail API** (`https://www.googleapis.com/auth/gmail`)
   - Read/send emails
   - Access inbox
   - Manage labels

2. **Google Calendar API** (`https://www.googleapis.com/auth/calendar`)
   - Read/write calendar events
   - Manage calendars
   - Sync appointments

3. **Google Drive API** (`https://www.googleapis.com/auth/drive`)
   - Access files
   - Upload/download files
   - Manage storage

4. **Google Contacts API** (`https://www.googleapis.com/auth/contacts`)
   - Read/write contacts
   - Import contacts
   - Sync contact lists

5. **Google People API** (`https://www.googleapis.com/auth/userinfo.profile`)
   - Extended profile info
   - Contact information

6. **YouTube Data API** (`https://www.googleapis.com/auth/youtube`)
   - Access channel info
   - Manage videos

7. **Google Photos API** (`https://www.googleapis.com/auth/photoslibrary`)
   - Access photos
   - Upload photos

---

## 🔧 How to Implement

### Step 1: Request Additional OAuth Scopes

**Current Code** (`frontend/src/lib/firebase.js`, lines 88-92):
```javascript
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
// ❌ No additional scopes requested
```

**Updated Code** (with additional scopes):
```javascript
const googleProvider = new GoogleAuthProvider();

// Add additional scopes
googleProvider.addScope('https://www.googleapis.com/auth/gmail.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/calendar.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/contacts.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/drive.readonly');

googleProvider.setCustomParameters({
  prompt: 'select_account'
});
```

### Step 2: Get OAuth Access Token (Not Just ID Token)

**Current Code:** Only gets Firebase ID token
```javascript
const result = await signInWithPopup(auth, googleProvider);
const idToken = await result.user.getIdToken();  // ✅ For authentication
// ❌ Missing: OAuth access token for Google APIs
```

**Updated Code:** Get both ID token and OAuth credential
```javascript
const result = await signInWithPopup(auth, googleProvider);
const idToken = await result.user.getIdToken();  // ✅ For authentication

// Get OAuth credential for Google APIs
const credential = GoogleAuthProvider.credentialFromResult(result);
const accessToken = credential.accessToken;  // ✅ For Google API calls

return {
  user: result.user,
  idToken,  // For backend authentication
  accessToken  // For Google API calls
};
```

### Step 3: Send Access Token to Backend

**Update Frontend** (`frontend/src/contexts/AuthContext.jsx`):
```javascript
const loginWithGoogle = async () => {
  const result = await signInWithGoogle();
  
  const response = await api.post('/auth/google-signin', {
    firebase_token: result.idToken,
    email: result.user.email,
    name: result.user.displayName,
    photo_url: result.user.photoURL,
    uid: result.user.uid,
    google_access_token: result.accessToken  // ✅ Add access token
  });
  
  // Store access token for Google API calls
  localStorage.setItem('google_access_token', result.accessToken);
};
```

### Step 4: Store Access Token in Backend

**Update Backend Model** (`backend/server.py`):
```python
class GoogleSignInRequest(BaseModel):
    firebase_token: str
    email: str
    name: str
    photo_url: Optional[str] = None
    uid: str
    google_access_token: Optional[str] = None  # ✅ Add access token
```

**Update User Model** (`backend/server.py`):
```python
class User(BaseModel):
    # ... existing fields ...
    google_access_token: Optional[str] = None  # ✅ Store encrypted
    google_refresh_token: Optional[str] = None  # ✅ Store encrypted
    google_token_expiry: Optional[datetime] = None
```

**Update Backend Endpoint** (`backend/server.py`, `/auth/google-signin`):
```python
async def google_signin(request: Request, google_data: GoogleSignInRequest):
    # ... existing code ...
    
    if user_doc:
        # Update existing user
        await users_collection.update_one(
            {"email": google_data.email},
            {
                "$set": {
                    "google_id": google_data.uid,
                    "profile_photo": google_data.photo_url,
                    "name": google_data.name,
                    "google_access_token": google_data.google_access_token,  # ✅ Store
                    "updated_at": datetime.utcnow()
                }
            }
        )
    else:
        # Create new user
        new_user = {
            # ... existing fields ...
            "google_access_token": google_data.google_access_token,  # ✅ Store
        }
```

### Step 5: Use Google APIs

**Backend Example** (Gmail API):
```python
import httpx

async def get_user_emails(user_id: str):
    # Get user's Google access token
    user_doc = await users_collection.find_one({"id": user_id})
    access_token = user_doc.get("google_access_token")
    
    if not access_token:
        raise HTTPException(status_code=400, detail="Google account not connected")
    
    # Call Gmail API
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://gmail.googleapis.com/gmail/v1/users/me/messages",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        return response.json()
```

**Frontend Example**:
```javascript
// Use stored access token
const accessToken = localStorage.getItem('google_access_token');

// Call Google API directly from frontend
const response = await fetch(
  'https://www.googleapis.com/calendar/v3/calendars/primary/events',
  {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  }
);
```

---

## 🔐 Security Considerations

### 1. Store Tokens Securely

**Backend:**
- ✅ Encrypt access tokens in database
- ✅ Store refresh tokens (for token renewal)
- ✅ Don't log tokens
- ✅ Use environment variables for API keys

**Frontend:**
- ⚠️ Access tokens in localStorage (consider HttpOnly cookies)
- ✅ Clear tokens on logout
- ✅ Refresh tokens before expiry

### 2. Token Management

**Token Expiry:**
- Access tokens expire (typically 1 hour)
- Use refresh tokens to get new access tokens
- Store token expiry time
- Refresh tokens before they expire

**Example:**
```python
# Check if token is expired
if user_doc.get("google_token_expiry") < datetime.utcnow():
    # Refresh token using refresh_token
    new_token = await refresh_google_token(user_doc.get("google_refresh_token"))
    # Update in database
```

### 3. Privacy & Consent

- ✅ **Clear Consent:** Explain what data you'll access
- ✅ **Privacy Policy:** Update privacy policy
- ✅ **User Control:** Allow users to disconnect Google account
- ✅ **Data Usage:** Only use data for stated purposes

---

## 📋 Recommended Scopes for OdinRing

Based on your platform (bio link/profile), useful scopes:

### Suggested Scopes:

1. **Google Calendar** (`https://www.googleapis.com/auth/calendar.readonly`)
   - Sync user's calendar
   - Show availability
   - Link to calendar events

2. **Google Contacts** (`https://www.googleapis.com/auth/contacts.readonly`)
   - Import contacts
   - Suggest connections
   - Add contact links

3. **Google People API** (`https://www.googleapis.com/auth/userinfo.profile`)
   - Extended profile info
   - Profile photos

4. **Gmail** (`https://www.googleapis.com/auth/gmail.readonly`)
   - Email integration
   - Show unread count (optional)

### Scopes to Avoid (Unless Needed):

- ❌ Full Gmail write access (unless emailing feature)
- ❌ Drive write access (unless file storage)
- ❌ YouTube write access (unless content management)

---

## 🎯 Implementation Approach

### Option 1: Request Scopes on Sign-In (Simpler)

**Pros:**
- ✅ One-time consent
- ✅ Automatic connection
- ✅ Simpler UX

**Cons:**
- ⚠️ May request more than needed
- ⚠️ Users might decline

**Implementation:**
```javascript
// Add scopes to GoogleAuthProvider
googleProvider.addScope('https://www.googleapis.com/auth/calendar.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/contacts.readonly');
```

### Option 2: Request Scopes Later (Granular)

**Pros:**
- ✅ Only request what's needed
- ✅ Better user experience
- ✅ More control

**Cons:**
- ⚠️ Multiple consent flows
- ⚠️ More complex implementation

**Implementation:**
```javascript
// Request scopes when user enables feature
const requestCalendarAccess = async () => {
  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
  const result = await signInWithPopup(auth, provider);
  // Store new access token
};
```

---

## 📋 Implementation Checklist

### Phase 1: Setup (Required)
- [ ] Enable Google APIs in Google Cloud Console
- [ ] Configure OAuth consent screen
- [ ] Add required scopes to consent screen
- [ ] Test OAuth flow

### Phase 2: Frontend Updates
- [ ] Update `GoogleAuthProvider` to request scopes
- [ ] Capture OAuth access token
- [ ] Send access token to backend
- [ ] Store access token securely

### Phase 3: Backend Updates
- [ ] Update `GoogleSignInRequest` model
- [ ] Store access tokens in database
- [ ] Implement token refresh logic
- [ ] Create Google API endpoints

### Phase 4: API Integration
- [ ] Choose which APIs to integrate
- [ ] Implement API calls
- [ ] Handle errors and rate limits
- [ ] Test integration

### Phase 5: UX & Privacy
- [ ] Update privacy policy
- [ ] Add consent messages
- [ ] Add disconnect option
- [ ] Test user flows

---

## 🚀 Quick Start Example

### 1. Update Firebase Configuration

**File:** `frontend/src/lib/firebase.js`

```javascript
// Google Auth Provider with additional scopes
const googleProvider = new GoogleAuthProvider();

// Add scopes you need
googleProvider.addScope('https://www.googleapis.com/auth/calendar.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/contacts.readonly');

googleProvider.setCustomParameters({
  prompt: 'select_account'
});
```

### 2. Capture Access Token

**File:** `frontend/src/lib/firebase.js`

```javascript
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const idToken = await result.user.getIdToken();
    
    // Get OAuth credential for Google APIs
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential.accessToken;
    
    return {
      user: result.user,
      idToken,  // For Firebase/backend auth
      accessToken  // For Google API calls
    };
  } catch (error) {
    // Error handling
  }
};
```

### 3. Send to Backend

**File:** `frontend/src/contexts/AuthContext.jsx`

```javascript
const loginWithGoogle = async () => {
  const result = await signInWithGoogle();
  
  const response = await api.post('/auth/google-signin', {
    firebase_token: result.idToken,
    email: result.user.email,
    name: result.user.displayName,
    photo_url: result.user.photoURL,
    uid: result.user.uid,
    google_access_token: result.accessToken  // ✅ New
  });
};
```

### 4. Store in Backend

**File:** `backend/server.py`

```python
class GoogleSignInRequest(BaseModel):
    firebase_token: str
    email: str
    name: str
    photo_url: Optional[str] = None
    uid: str
    google_access_token: Optional[str] = None  # ✅ New

async def google_signin(request: Request, google_data: GoogleSignInRequest):
    # ... verify token ...
    
    # Store access token
    update_data = {
        "google_access_token": google_data.google_access_token,  # ✅ Store
        # ... other fields ...
    }
    
    await users_collection.update_one(
        {"email": google_data.email},
        {"$set": update_data}
    )
```

---

## 📚 Google API Documentation

- **OAuth 2.0:** https://developers.google.com/identity/protocols/oauth2
- **Gmail API:** https://developers.google.com/gmail/api
- **Calendar API:** https://developers.google.com/calendar/api
- **Contacts API:** https://developers.google.com/people/api
- **Drive API:** https://developers.google.com/drive/api
- **Scopes Reference:** https://developers.google.com/identity/protocols/oauth2/scopes

---

## ⚠️ Important Notes

### 1. Google Cloud Console Setup

**Required Steps:**
1. Go to Google Cloud Console
2. Enable APIs you want to use
3. Configure OAuth consent screen
4. Add scopes to consent screen
5. Submit for verification (if using sensitive scopes)

### 2. OAuth Consent Screen

- **User Type:** Internal or External
- **Scopes:** Add all scopes you'll request
- **Privacy Policy:** Required for sensitive scopes
- **Terms of Service:** May be required

### 3. Token Refresh

**Important:** Access tokens expire (usually 1 hour). You need:
- Refresh tokens (if requesting `offline` access)
- Token refresh logic
- Store refresh tokens securely

**Example:**
```javascript
// Request refresh token
googleProvider.addScope('https://www.googleapis.com/auth/calendar');
googleProvider.setCustomParameters({
  access_type: 'offline',  // ✅ Get refresh token
  prompt: 'consent'  // ✅ Force consent to get refresh token
});
```

### 4. Rate Limits

- Google APIs have rate limits
- Implement rate limiting
- Handle 429 (Too Many Requests) errors
- Consider caching

---

## 🎯 Recommended Features for OdinRing

Based on your platform, these integrations make sense:

1. **Calendar Integration**
   - Sync calendar events
   - Show availability
   - Book appointments directly

2. **Contacts Integration**
   - Import contacts
   - Suggest connections
   - Quick add to contacts

3. **Email Integration** (Optional)
   - Show email stats
   - Quick email actions

---

## ✅ Summary

**Can you connect Google APIs automatically?**
✅ **YES** - By requesting additional OAuth scopes during Google Sign-In

**Current Status:**
- ✅ Google Sign-In implemented
- ❌ Additional APIs not integrated yet
- ✅ Ready to add scopes and API integration

**Next Steps:**
1. Choose which Google APIs to integrate
2. Add scopes to `GoogleAuthProvider`
3. Capture and store OAuth access tokens
4. Implement Google API calls
5. Test integration

---

**Last Updated:** January 11, 2025  
**Status:** Ready to implement Google API integration
