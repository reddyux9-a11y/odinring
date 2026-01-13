# 🔥 Firebase Invalid API Key Fix

## Error Details

**Error:** `Firebase: Error (auth/invalid-api-key)`

**Cause:** The Firebase API key in your frontend `.env` file is either:
1. Missing or empty
2. Incorrect
3. Not being loaded by React
4. Environment variables need a server restart

---

## ✅ Solution

### Step 1: Verify Frontend .env File

Check that `frontend/.env` exists and contains:

```env
REACT_APP_BACKEND_URL=http://localhost:8000

# WebSocket/HMR Configuration
WDS_SOCKET_PORT=0
WDS_SOCKET_HOST=localhost

# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=AIzaSyBQ5u38tm0592ekWX1DHxCDD4IN8Pqz4cs
REACT_APP_FIREBASE_AUTH_DOMAIN=studio-7743041576-fc16f.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=studio-7743041576-fc16f
REACT_APP_FIREBASE_STORAGE_BUCKET=studio-7743041576-fc16f.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=544218567948
REACT_APP_FIREBASE_APP_ID=1:544218567948:web:59374d5038ec7051b32529
```

**Important:** All React environment variables MUST start with `REACT_APP_`

---

### Step 2: Restart Frontend Server

Environment variables are only loaded when the server starts. You MUST restart:

```bash
# Stop the frontend (Ctrl+C in the terminal)
# Then start again:

cd /Users/sankarreddy/Desktop/odinring-main-2/frontend
npm start

# Or use restart script:
./restart-dev.sh
```

---

### Step 3: Verify in Browser Console

After restarting, open the browser console (F12) and look for:

```
🔥 Firebase Config Check:
  apiKey: ✅ Set
  authDomain: ✅ Set
  projectId: ✅ Set
  storageBucket: ✅ Set
  messagingSenderId: ✅ Set
  appId: ✅ Set
```

If you see `❌ Missing` for any field, the environment variables are not loading correctly.

---

## 🔍 Troubleshooting

### Issue 1: Environment Variables Not Loading

**Symptoms:**
- Browser console shows "❌ Missing" for Firebase config
- API key is empty or undefined

**Solution:**
```bash
# 1. Verify .env file exists
ls -la frontend/.env

# 2. Check file contents
cat frontend/.env

# 3. Make sure NO SPACES around = sign
# ❌ WRONG: REACT_APP_FIREBASE_API_KEY = value
# ✅ CORRECT: REACT_APP_FIREBASE_API_KEY=value

# 4. Hard restart frontend
cd frontend
rm -rf node_modules/.cache
npm start
```

---

### Issue 2: Invalid API Key

**Symptoms:**
- `auth/invalid-api-key` error
- API key is shown as set but still fails

**Solution:**

Get the correct API key from Firebase Console:

1. **Go to Firebase Console:**
   https://console.firebase.google.com/project/studio-7743041576-fc16f/settings/general

2. **Scroll to "Your apps" section**

3. **Find the Web App** (should show your app name)

4. **Click "Config" to see credentials**

5. **Copy the exact values:**
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",  // Copy this
     authDomain: "studio-7743041576-fc16f.firebaseapp.com",
     projectId: "studio-7743041576-fc16f",
     storageBucket: "studio-7743041576-fc16f.firebasestorage.app",
     messagingSenderId: "544218567948",
     appId: "1:544218567948:web:..."
   };
   ```

6. **Update frontend/.env** with the exact values

7. **Restart frontend server**

---

### Issue 3: Web App Not Created in Firebase

**Symptoms:**
- No web app configuration available in Firebase Console

**Solution:**

1. **Go to Firebase Console:**
   https://console.firebase.google.com/project/studio-7743041576-fc16f/settings/general

2. **Scroll to "Your apps" section**

3. **If no web app exists:**
   - Click "Add app" button
   - Select Web (</> icon)
   - Give it a name (e.g., "OdinRing Web")
   - Click "Register app"
   - Copy the configuration

4. **Update frontend/.env** with the new values

5. **Restart frontend server**

---

### Issue 4: .env File Has Wrong Format

**Common Mistakes:**

❌ **WRONG:**
```env
# Quotes around values
REACT_APP_FIREBASE_API_KEY="AIzaSy..."

# Spaces around =
REACT_APP_FIREBASE_API_KEY = AIzaSy...

# Missing REACT_APP_ prefix
FIREBASE_API_KEY=AIzaSy...

# Comments on same line
REACT_APP_FIREBASE_API_KEY=AIzaSy... # my key
```

✅ **CORRECT:**
```env
# No quotes, no spaces, REACT_APP_ prefix, comment on separate line
REACT_APP_FIREBASE_API_KEY=AIzaSy...
REACT_APP_FIREBASE_AUTH_DOMAIN=studio-7743041576-fc16f.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=studio-7743041576-fc16f
```

---

### Issue 5: Still Not Working After Restart

**Try these steps:**

```bash
# 1. Stop all servers
./stop-dev.sh

# 2. Clear all caches
cd frontend
rm -rf node_modules/.cache
rm -rf build
cd ..

# 3. Verify .env file
cat frontend/.env

# 4. Start fresh
./start-dev.sh

# 5. Check browser console for Firebase Config Check message
```

---

## 🔐 Getting Your Firebase Configuration

### Method 1: Firebase Console (Recommended)

1. Open: https://console.firebase.google.com/project/studio-7743041576-fc16f/settings/general
2. Scroll down to "Your apps"
3. Find your web app
4. Click "Config" button
5. Copy all values

### Method 2: From Project Settings

1. Open: https://console.firebase.google.com/project/studio-7743041576-fc16f
2. Click gear icon (⚙️) → Project settings
3. Scroll to "Your apps" section
4. Select your web app
5. Copy SDK configuration

---

## 📝 Complete Frontend .env Template

```env
# Backend API
REACT_APP_BACKEND_URL=http://localhost:8000

# WebSocket/HMR Configuration
WDS_SOCKET_PORT=0
WDS_SOCKET_HOST=localhost

# Firebase Configuration (Get these from Firebase Console)
REACT_APP_FIREBASE_API_KEY=your-api-key-here
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

**Replace all `your-*-here` values with actual values from Firebase Console!**

---

## ✅ Verification Steps

After fixing:

1. **Restart frontend:**
   ```bash
   ./restart-dev.sh
   ```

2. **Open browser console (F12)**

3. **Look for:**
   ```
   🔥 Firebase Config Check:
     apiKey: ✅ Set
     authDomain: ✅ Set
     projectId: ✅ Set
     storageBucket: ✅ Set
     messagingSenderId: ✅ Set
     appId: ✅ Set
   ```

4. **No errors should appear**

5. **Google Sign-In button should work**

---

## 🆘 Still Having Issues?

### Check These:

1. **File Location:**
   - File MUST be at: `frontend/.env`
   - NOT at: `frontend/src/.env`
   - NOT at: `.env` (root)

2. **File Permissions:**
   ```bash
   ls -la frontend/.env
   # Should show readable file
   ```

3. **File Encoding:**
   - Must be UTF-8
   - No BOM (Byte Order Mark)
   - Unix line endings (LF, not CRLF)

4. **React Version:**
   - Environment variables are supported in Create React App
   - Must start with `REACT_APP_`

---

## 🎯 Quick Fix Summary

```bash
# 1. Check .env exists
cat frontend/.env

# 2. Verify API key is correct
# Compare with Firebase Console

# 3. Hard restart
./stop-dev.sh
rm -rf frontend/node_modules/.cache
./start-dev.sh

# 4. Check browser console
# Should see "🔥 Firebase Config Check" with all ✅

# 5. Test Google Sign-In
# Button should work without errors
```

---

## 📖 Related Documentation

- `START_HERE.md` - Complete Firebase setup
- `DEV_SERVER_GUIDE.md` - Server management
- `TROUBLESHOOTING.md` - Common issues

---

**Remember:** ALWAYS restart the frontend server after changing .env files!

