# 🔧 IndexedDB Error Fix

## ❌ The Error

```
ERROR: Connection to Indexed Database server lost. Refresh the page to try again
```

This error repeats hundreds of times and prevents the app from loading.

---

## 🔍 What Causes This?

Firebase Authentication tries to persist user auth state in the browser's **IndexedDB**. When it can't connect:

1. **Corrupted IndexedDB** - Previous session left bad data
2. **Multiple tabs open** - IndexedDB is locked by another tab
3. **Private browsing** - IndexedDB is disabled
4. **Storage quota** - Browser storage is full
5. **Browser bug** - Rare browser-specific issue

---

## ✅ How to Fix

### Option 1: Clear Browser Data (Recommended)

**Via DevTools:**
1. Open DevTools: `F12` or `Cmd + Option + I`
2. Go to **Application** tab
3. Left sidebar → **Storage** section
4. Click **"Clear site data"**
5. Check ALL boxes: 
   - ✓ Local storage
   - ✓ Session storage
   - ✓ IndexedDB
   - ✓ Cookies
6. Click **"Clear site data"**
7. Close DevTools
8. Hard refresh: `Cmd + Shift + R` (Mac) or `Ctrl + Shift + R` (Windows)

---

### Option 2: Clear via Console (Faster)

**Open Console and paste:**

```javascript
localStorage.clear();
sessionStorage.clear();
indexedDB.deleteDatabase('firebaseLocalStorageDb');
location.reload();
```

---

### Option 3: Close Other Tabs

If you have multiple tabs open to `localhost:3000`:
1. Close ALL other tabs
2. Refresh the current tab
3. Try again

---

## 🛡️ Prevention

We've added error handling to prevent this spam:

**Added to `frontend/src/lib/firebase.js`:**

```javascript
// Add global error handler for IndexedDB errors to prevent spam
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('IndexedDB') || 
      event.reason?.message?.includes('Indexed Database')) {
    console.warn('⚠️ IndexedDB error suppressed:', event.reason.message);
    console.warn('💡 Clear browser data: localStorage.clear(); indexedDB.deleteDatabase("firebaseLocalStorageDb"); location.reload();');
    event.preventDefault(); // Prevent error spam in console
  }
});
```

This will:
- ✅ Catch IndexedDB errors before they spam the console
- ✅ Show helpful warning instead
- ✅ Auth will still work (just won't persist)

---

## 🧪 After Clearing

1. **Reload the page** - Should load without errors
2. **Sign in again** - You'll need to re-authenticate
3. **Check console** - Should see:
   ```
   ✅ Firebase Auth persistence set to LOCAL
   ```

---

## ⚠️ If It Still Happens

Try these in order:

1. **Close ALL browser tabs** for `localhost:3000`
2. **Restart browser** completely
3. **Try incognito/private mode** - Tests if extensions are interfering
4. **Try different browser** - Tests if browser-specific issue
5. **Clear ALL browser data** - Nuclear option:
   - Chrome: Settings → Privacy → Clear browsing data → All time
   - Firefox: Settings → Privacy → Clear Data
   - Safari: Preferences → Privacy → Manage Website Data → Remove All

---

## 📊 Status

**Error Handling Added:** ✅  
**Servers Running:**
- Backend: ✅ `http://localhost:8000`
- Frontend: ✅ `http://localhost:3000`

**Next Steps:**
1. Clear browser data (Option 1 or 2)
2. Hard refresh
3. Test sign-in flow
4. Should work without spam!

---

## 🔗 Related Files

- `frontend/src/lib/firebase.js` - Error handler added
- `CRITICAL_AUTO_SIGNIN_FIX.md` - Previous auth fix

---

**Created:** Dec 22, 2025  
**Issue:** IndexedDB connection errors spamming console  
**Fix:** Clear browser data + error suppression

