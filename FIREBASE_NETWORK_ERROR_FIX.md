# 🔧 Firebase Network Error Fix Guide

**Issue:** "Network Error" on frontend login screen  
**Likely Cause:** Firebase API key restrictions or Firestore security rules

---

## 🎯 **Quick Diagnosis**

The "Network Error" could be caused by:

1. **Firebase API Key Restrictions** (Most Common)
2. **Firestore Security Rules** blocking requests
3. **CORS Configuration** issues
4. **Backend Connectivity** problems

---

## ✅ **Step 1: Check Firebase API Key Restrictions**

### **A. Go to Google Cloud Console:**
1. Visit: https://console.cloud.google.com/
2. Select project: `studio-7743041576-fc16f`
3. Navigate: **APIs & Services** → **Credentials**
4. Find your **API keys** (look for Firebase Web API key)

### **B. Check Restrictions:**
- **Application restrictions:** Should be "None" or "HTTP referrers"
- **API restrictions:** Should include Firebase APIs

### **C. If HTTP Referrer Restrictions Exist:**
Add these domains:
```
https://odinring-frontend-*.vercel.app/*
https://odinring-frontend-2rwt2stpp-odin-rings-projects.vercel.app/*
https://*.vercel.app/*
http://localhost:3000/*
```

---

## ✅ **Step 2: Check Firestore Security Rules**

Your current rules in `firestore.rules` should allow:
- ✅ Public read for user profiles: `allow read: if true;`
- ✅ Authenticated write: `allow create: if isSignedIn()`

**Verify rules are deployed:**
```bash
firebase deploy --only firestore:rules
```

---

## ✅ **Step 3: Check Frontend Environment Variables**

Verify these are set in Vercel:
- `REACT_APP_FIREBASE_API_KEY`
- `REACT_APP_FIREBASE_AUTH_DOMAIN`
- `REACT_APP_FIREBASE_PROJECT_ID`
- `REACT_APP_FIREBASE_STORAGE_BUCKET`
- `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`
- `REACT_APP_FIREBASE_APP_ID`

---

## ✅ **Step 4: Test Backend Connectivity**

```bash
curl https://odinring-backend.vercel.app/api/health
```

Expected: JSON response with health status

---

## 🔧 **Quick Fix Steps**

### **Option 1: Remove API Restrictions (Temporary Testing)**

1. Go to Google Cloud Console → Credentials
2. Click on your Firebase API key
3. Under "Application restrictions", select **"None"**
4. Save and wait 5 minutes
5. Test frontend again

**If this fixes it:** The issue is API key restrictions. Add HTTP referrer restrictions instead.

### **Option 2: Check Browser Console**

1. Open frontend in browser
2. Press F12 → Console tab
3. Look for specific error messages:
   - `FirebaseError: ...`
   - `CORS error: ...`
   - `Network request failed`

### **Option 3: Check Network Tab**

1. Open browser DevTools → Network tab
2. Try to login
3. Look for failed requests:
   - Red requests = failed
   - Check the error message
   - Check the request URL

---

## 📋 **Common Error Messages & Fixes**

### **Error: "API key not valid"**
- **Fix:** Check API key in environment variables
- **Fix:** Verify API key in Google Cloud Console

### **Error: "Permission denied"**
- **Fix:** Check Firestore security rules
- **Fix:** Verify user is authenticated

### **Error: "CORS error"**
- **Fix:** Check `CORS_ORIGINS` in backend
- **Fix:** Verify frontend URL is in allowed origins

### **Error: "Network request failed"**
- **Fix:** Check API key restrictions
- **Fix:** Check Firestore rules
- **Fix:** Verify backend is accessible

---

## 🎯 **Recommended Configuration**

### **For Production:**

1. **API Key Restrictions:**
   - Type: HTTP referrers (web sites)
   - Domains:
     ```
     https://odinring-frontend-*.vercel.app/*
     https://your-custom-domain.com/*
     ```

2. **API Restrictions:**
   - Enable: Firebase Authentication API
   - Enable: Cloud Firestore API
   - Enable: Firebase Storage API

3. **Firestore Rules:**
   - Deploy current rules (they look correct)
   - Test with authenticated users

---

## 🔍 **Debugging Checklist**

- [ ] Check Google Cloud Console for API key restrictions
- [ ] Verify Firebase API key in frontend env vars
- [ ] Check Firestore security rules are deployed
- [ ] Test backend health endpoint
- [ ] Check browser console for specific errors
- [ ] Check browser Network tab for failed requests
- [ ] Verify CORS configuration in backend
- [ ] Test with API restrictions temporarily removed

---

## 🚨 **Important Notes**

1. **Backend (Firebase Admin SDK):**
   - ✅ Never needs IP whitelisting
   - ✅ Uses service account credentials
   - ✅ Works from any IP

2. **Frontend (Firebase Client SDK):**
   - ⚠️ May have API key restrictions
   - ⚠️ Check Google Cloud Console
   - ✅ Use HTTP referrer restrictions (not IP)

3. **Vercel IPs:**
   - ❌ Don't use IP whitelisting (IPs change)
   - ✅ Use HTTP referrer restrictions instead

---

## 📞 **Next Steps**

1. **Check Google Cloud Console** for API key restrictions
2. **Check browser console** for specific error messages
3. **Temporarily remove restrictions** to test
4. **Add HTTP referrer restrictions** for production

---

**Status:** Need to check Firebase API key restrictions in Google Cloud Console  
**Most Likely Fix:** Remove or configure API key restrictions
