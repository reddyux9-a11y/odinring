# Google API Integration - Quick Start

**Date:** January 11, 2025  
**Purpose:** Quick reference for adding Google API integration

---

## ✅ Yes - You Can Connect Google APIs!

When users sign in with Google Auth, you can automatically request access to their Google account data (Gmail, Calendar, Contacts, Drive, etc.) by adding OAuth scopes.

---

## 🚀 Quick Implementation (3 Steps)

### Step 1: Add OAuth Scopes

**File:** `frontend/src/lib/firebase.js`

**Current Code (Lines 88-92):**
```javascript
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
```

**Updated Code:**
```javascript
const googleProvider = new GoogleAuthProvider();

// Add scopes for Google APIs
googleProvider.addScope('https://www.googleapis.com/auth/calendar.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/contacts.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/gmail.readonly');  // Optional

googleProvider.setCustomParameters({
  prompt: 'select_account',
  access_type: 'offline',  // Get refresh token
  prompt: 'consent'  // Force consent to get refresh token
});
```

### Step 2: Capture Access Token

**File:** `frontend/src/lib/firebase.js` (Lines 98-147)

**Add to `signInWithGoogle` function:**
```javascript
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const idToken = await result.user.getIdToken();
    
    // ✅ NEW: Get OAuth access token for Google APIs
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken;
    
    return {
      user: result.user,
      idToken,  // For backend authentication
      accessToken  // ✅ NEW: For Google API calls
    };
  } catch (error) {
    // Error handling
  }
};
```

### Step 3: Send Access Token to Backend

**File:** `frontend/src/contexts/AuthContext.jsx` (loginWithGoogle function)

**Current:**
```javascript
const response = await api.post('/auth/google-signin', {
  firebase_token: result.idToken,
  email: result.user.email,
  name: result.user.displayName,
  photo_url: result.user.photoURL,
  uid: result.user.uid
});
```

**Updated:**
```javascript
const response = await api.post('/auth/google-signin', {
  firebase_token: result.idToken,
  email: result.user.email,
  name: result.user.displayName,
  photo_url: result.user.photoURL,
  uid: result.user.uid,
  google_access_token: result.accessToken  // ✅ NEW
});

// Store access token for API calls
if (result.accessToken) {
  localStorage.setItem('google_access_token', result.accessToken);
}
```

### Step 4: Store in Backend (Optional)

**File:** `backend/server.py`

**Update GoogleSignInRequest:**
```python
class GoogleSignInRequest(BaseModel):
    firebase_token: str
    email: str
    name: str
    photo_url: Optional[str] = None
    uid: str
    google_access_token: Optional[str] = None  # ✅ NEW
```

**Update google_signin endpoint:**
```python
# Store access token (encrypt before storing!)
if google_data.google_access_token:
    update_data["google_access_token"] = google_data.google_access_token
```

---

## 📋 Available Google APIs

### Recommended for OdinRing:

1. **Calendar API** (`calendar.readonly`)
   - Show calendar events
   - Sync availability
   - Book appointments

2. **Contacts API** (`contacts.readonly`)
   - Import contacts
   - Suggest connections

3. **Gmail API** (`gmail.readonly`) - Optional
   - Email integration
   - Unread count

---

## 🔐 Security Notes

1. **Encrypt Tokens:** Don't store access tokens in plain text
2. **Token Expiry:** Access tokens expire (~1 hour), need refresh tokens
3. **Privacy:** Update privacy policy and get user consent
4. **Revocation:** Allow users to disconnect Google account

---

## 📚 Next Steps

1. **Choose APIs:** Decide which Google APIs you want
2. **Google Cloud Console:**
   - Enable APIs
   - Configure OAuth consent screen
   - Add scopes
3. **Implement:** Follow steps above
4. **Test:** Test OAuth flow and API calls
5. **Privacy:** Update privacy policy

---

## ✅ Summary

**Answer:** ✅ YES - You can automatically connect Google APIs when users sign in with Google Auth

**How:** Add OAuth scopes to `GoogleAuthProvider` and capture the access token

**Status:** Ready to implement - current code supports it, just need to add scopes

---

**See:** `GOOGLE_API_INTEGRATION_GUIDE.md` for detailed implementation guide
