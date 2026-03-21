# 🔧 Fix Firebase Authorized Domains

**Issue:** `auth/unauthorized-domain` - Frontend domain not authorized for OAuth

---

## 🎯 **Quick Fix**

### **Step 1: Go to Firebase Console**
1. Visit: https://console.firebase.google.com/
2. Select project: `studio-7743041576-fc16f`
3. Navigate: **Authentication** → **Settings** → **Authorized domains** tab

### **Step 2: Add Frontend Domain**
Click **"Add domain"** and add:
```
odinring-frontend.vercel.app
```

### **Step 3: Save**
Click **"Add"** to save the domain.

---

## 📋 **Authorized Domains List**

Your authorized domains should include:
- ✅ `localhost` (for development)
- ✅ `odinring-frontend.vercel.app` (production)
- ✅ Any custom domain you use

---

## ✅ **After Adding Domain**

1. **No restart needed** - Changes take effect immediately
2. **Test Google Sign-In** - Should work without `auth/unauthorized-domain` error
3. **Verify** - Check browser console for errors

---

## 🔍 **Verify It's Fixed**

After adding the domain:
1. Refresh the frontend page
2. Try Google Sign-In again
3. Check console - `auth/unauthorized-domain` error should be gone

---

**Status:** Manual step required in Firebase Console  
**Time:** ~30 seconds to fix
