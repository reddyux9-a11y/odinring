# 🧪 Testing Script - Step-by-Step Execution Guide

**Purpose:** Execute all tests to achieve 100% GREEN status  
**Duration:** ~60 minutes  
**Prerequisites:** Backend and frontend servers running

---

## 🚀 PRE-FLIGHT CHECKLIST

### Environment Setup (5 minutes)

```bash
# Terminal 1 - Backend
cd /Users/sankarreddy/Desktop/odinring-main-2/backend
source venv/bin/activate
python3 -m uvicorn server:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend  
cd /Users/sankarreddy/Desktop/odinring-main-2/frontend
npm start

# Wait for both servers to start
# Backend: http://localhost:8000
# Frontend: http://localhost:3000
```

**Checklist:**
- [ ] Backend running on port 8000
- [ ] Frontend running on port 3000
- [ ] No startup errors
- [ ] Browser opened to http://localhost:3000

---

## 🔴 CRITICAL TESTS

### TEST 1: onAuthStateChanged Verification
**Time:** 5 minutes | **Priority:** CRITICAL | **Status:** ⏳

#### Steps:

1. **Open Browser DevTools**
   ```
   Mac: Cmd + Option + I
   Windows: F12
   ```

2. **Navigate to Console Tab**

3. **Go to Auth Page**
   ```
   http://localhost:3000/auth
   ```

4. **Execute Test: Sign In**
   - Click "Sign in with Google" button
   - **Expected Console Logs:**
     ```
     🔍 firebase.js: Auth state via onAuthStateChanged: User logged in (email@example.com)
     🔐 AuthContext: Firebase auth state changed: {hasUser: true, email: "...", uid: "..."}
     ```
   - [ ] ✅ PASS | [ ] ❌ FAIL
   - **Screenshot:** [Take screenshot of console logs]

5. **Execute Test: Page Reload**
   - Press `Cmd + R` to reload
   - **Expected Console Logs:**
     ```
     🔐 AuthContext: Firebase auth state changed
     🔄 AuthContext: User state changed
     ```
   - [ ] ✅ PASS | [ ] ❌ FAIL

6. **Execute Test: Logout**
   - Click logout button
   - **Expected Console Logs:**
     ```
     🔍 firebase.js: Auth state via onAuthStateChanged: No user
     👤 AuthContext: No user (logged out or not authenticated)
     ```
   - [ ] ✅ PASS | [ ] ❌ FAIL

**Result:** [ ] ✅ ALL PASS | [ ] ❌ SOME FAILED

**Notes:**
- _[Record any issues or observations]_

---

### TEST 2: Auth Persistence Verification
**Time:** 10 minutes | **Priority:** CRITICAL | **Status:** ⏳

#### Steps:

1. **Ensure Logged Out**
   - If logged in, click logout first

2. **Execute Test: Page Reload After Login**
   - Go to http://localhost:3000/auth
   - Sign in with Google
   - **Wait for dashboard to load**
   - Press `Cmd + R` to reload
   - **Expected:** Still logged in, dashboard loads
   - Check localStorage: 
     ```javascript
     localStorage.getItem('token')
     // Should return: "eyJhbGci..."
     ```
   - [ ] ✅ PASS | [ ] ❌ FAIL

3. **Execute Test: Browser Close/Reopen**
   - Ensure logged in
   - **Close browser completely** (Cmd + Q)
   - **Reopen browser**
   - Navigate to http://localhost:3000
   - **Expected:** Auto-redirect to /dashboard, still logged in
   - [ ] ✅ PASS | [ ] ❌ FAIL

4. **Execute Test: New Tab**
   - Ensure logged in in Tab 1
   - Open new tab (Cmd + T)
   - Go to http://localhost:3000
   - **Expected:** Logged in automatically
   - [ ] ✅ PASS | [ ] ❌ FAIL

5. **Execute Test: Clear Storage**
   - In console, run:
     ```javascript
     localStorage.clear();
     location.reload();
     ```
   - **Expected:** Logged out, redirected to /auth
   - [ ] ✅ PASS | [ ] ❌ FAIL

6. **Verify Console Log**
   - During login, check for:
     ```
     ✅ Firebase Auth persistence set to LOCAL
     ```
   - [ ] ✅ PASS | [ ] ❌ FAIL

**Result:** [ ] ✅ ALL PASS | [ ] ❌ SOME FAILED

**Notes:**
- _[Record any issues]_

---

### TEST 3: Firebase Configuration Verification
**Time:** 5 minutes | **Priority:** CRITICAL | **Status:** ⏳

#### Steps:

1. **Run Verification Script**
   ```bash
   cd /Users/sankarreddy/Desktop/odinring-main-2/frontend
   node verify-firebase-config.js
   ```
   - **Expected Output:**
     ```
     ✅ All Firebase configuration variables are set!
     ✅ API Key format looks correct
     ✅ Auth Domain format looks correct
     ✅ Project ID format looks correct
     ```
   - [ ] ✅ PASS | [ ] ❌ FAIL

2. **Firebase Console - Authorized Domains** 🔴 MANUAL
   - Open: https://console.firebase.google.com/
   - Select project: `studio-7743041576-fc16f`
   - Navigate: Authentication → Settings → Authorized domains
   - **Check for:**
     ```
     ✓ localhost
     ```
   - [ ] ✅ localhost PRESENT | [ ] ❌ MISSING
   - **If missing:** Click "Add domain", enter `localhost`, click "Add"
   - **Screenshot:** [Capture authorized domains list]

3. **Firebase Console - Google Sign-In Enabled**
   - Navigate: Authentication → Sign-in method
   - **Check:**
     ```
     ✓ Google provider: Enabled
     ✓ Support email configured
     ```
   - [ ] ✅ ENABLED | [ ] ❌ DISABLED

4. **Firebase Console - Firestore Database**
   - Navigate: Firestore Database
   - **Check:**
     ```
     ✓ Database exists: odinringdb
     ✓ Mode: Native
     ```
   - [ ] ✅ EXISTS | [ ] ❌ MISSING

**Result:** [ ] ✅ ALL PASS | [ ] ❌ SOME FAILED

**Notes:**
- Firebase Project ID: studio-7743041576-fc16f
- _[Record any issues]_

---

## 🟠 HIGH PRIORITY TESTS

### TEST 4: No Duplicate Firebase Initialization
**Time:** 3 minutes | **Priority:** HIGH | **Status:** ⏳

#### Steps:

1. **Clear Console**
   - Click clear button or press `Cmd + K`

2. **Navigate Through App**
   - Go to: `/` (landing)
   - Go to: `/auth`
   - Sign in
   - Go to: `/dashboard`
   - Go to: `/dashboard` (profile section)

3. **Check Console for Errors**
   - **Look for:** `"Firebase already initialized"` or similar
   - **Expected:** No such errors
   - [ ] ✅ PASS (No errors) | [ ] ❌ FAIL (Error found)

4. **Check Network Tab**
   - Open DevTools → Network tab
   - Filter: `firebaseapp.com`
   - **Expected:** Firebase SDK loaded only once
   - [ ] ✅ PASS | [ ] ❌ FAIL

**Result:** [ ] ✅ PASS | [ ] ❌ FAIL

**Notes:**
- _[Record any issues]_

---

## 🟡 MEDIUM PRIORITY TESTS

### TEST 5: Landing Page Performance
**Time:** 5 minutes | **Priority:** MEDIUM | **Status:** ⏳

#### Steps:

1. **Build Production Bundle**
   ```bash
   cd /Users/sankarreddy/Desktop/odinring-main-2/frontend
   npm run build
   ```
   - Wait for build to complete
   - [ ] ✅ Build successful | [ ] ❌ Build failed

2. **Check Bundle Sizes**
   ```bash
   ls -lh build/static/js/*.js
   ```
   - Record main bundle size: ____________ KB
   - [ ] ✅ < 500KB | [ ] ⚠️ > 500KB

3. **Lighthouse Audit**
   - Open: http://localhost:3000
   - Open DevTools → Lighthouse tab
   - **Settings:**
     - Mode: Navigation
     - Device: Desktop
     - Categories: Performance
   - Click "Analyze page load"
   - **Record Score:** ________
   - [ ] ✅ Score > 90 | [ ] ⚠️ Score < 90

4. **Check for Modal Imports**
   - In Network tab, go to landing page
   - Filter JavaScript files
   - **Expected:** No modal-related chunks
   - [ ] ✅ PASS | [ ] ❌ FAIL

**Result:** [ ] ✅ PASS | [ ] ❌ FAIL

**Notes:**
- Performance Score: _______
- Bundle Size: _______ KB

---

## 🟢 LOW PRIORITY TESTS

### TEST 6: Console Logging Verification
**Time:** 5 minutes | **Priority:** LOW | **Status:** ⏳

#### Steps:

1. **Test User State Logging**
   - Clear console
   - Sign in with Google
   - **Check for logs:**
     ```
     🔄 AuthContext: User state changed: {...}
     👤 AuthContext: Full user object: {...}
     ✅ AuthContext: Login complete! User: [email]
     ```
   - [ ] ✅ ALL PRESENT | [ ] ❌ MISSING

2. **Test Firebase Auth State Logging**
   - **Check for log:**
     ```
     🔐 AuthContext: Firebase auth state changed: {...}
     ```
   - [ ] ✅ PRESENT | [ ] ❌ MISSING

3. **Test Token Logging**
   - **Check for logs:**
     ```
     🔍 AuthContext: Token in localStorage: EXISTS (...)
     📡 AuthContext: fetchUserData() called
     ```
   - [ ] ✅ PRESENT | [ ] ❌ MISSING

4. **Test Logout Logging**
   - Click logout
   - **Check for log:**
     ```
     👤 AuthContext: No user (logged out or not authenticated)
     ```
   - [ ] ✅ PRESENT | [ ] ❌ MISSING

5. **Verify User Object Contents**
   - In console, find the "Full user object" log
   - Expand the object
   - **Check for fields:**
     ```
     ✓ id
     ✓ email
     ✓ name
     ✓ username
     ```
   - [ ] ✅ ALL FIELDS PRESENT | [ ] ❌ MISSING FIELDS

**Result:** [ ] ✅ PASS | [ ] ❌ FAIL

**Notes:**
- _[Record any observations]_

---

## 🎯 END-TO-END TEST SCENARIOS

### E2E TEST 1: Complete Sign-In Flow
**Time:** 5 minutes | **Priority:** CRITICAL | **Status:** ⏳

#### Scenario: New User Sign-In with Google

1. **Start Fresh**
   ```javascript
   // In console:
   localStorage.clear();
   location.reload();
   ```

2. **Navigate to Landing**
   - Go to: http://localhost:3000
   - [ ] Page loads successfully

3. **Go to Auth**
   - Click "Get Started" or navigate to `/auth`
   - [ ] Auth page loads

4. **Sign In**
   - Click "Sign in with Google"
   - [ ] Google sign-in popup/redirect appears
   - Select Google account
   - [ ] OAuth completes

5. **Verify Redirect**
   - [ ] Redirected to `/dashboard`
   - [ ] User name displayed
   - [ ] Dashboard loads without errors

6. **Verify Storage**
   ```javascript
   // In console:
   localStorage.getItem('token')
   ```
   - [ ] Token is present

**Result:** [ ] ✅ COMPLETE SUCCESS | [ ] ❌ FAILED

**Time Taken:** _______ seconds

---

### E2E TEST 2: Session Persistence
**Time:** 3 minutes | **Priority:** CRITICAL | **Status:** ⏳

#### Scenario: Auth Survives Page Reload

1. **Ensure Logged In**
   - Should be logged in from E2E Test 1

2. **Reload Page**
   - Press `Cmd + R`
   - [ ] Still on `/dashboard`
   - [ ] User data still visible
   - [ ] No re-authentication required

3. **Close and Reopen Browser**
   - Close browser (Cmd + Q)
   - Reopen and go to http://localhost:3000
   - [ ] Auto-redirects to `/dashboard`
   - [ ] Still logged in

**Result:** [ ] ✅ COMPLETE SUCCESS | [ ] ❌ FAILED

---

### E2E TEST 3: Logout Flow
**Time:** 2 minutes | **Priority:** CRITICAL | **Status:** ⏳

#### Scenario: Clean Logout

1. **Ensure Logged In**

2. **Logout**
   - Find and click logout button
   - [ ] Redirects to `/auth`

3. **Verify Logout**
   ```javascript
   // In console:
   localStorage.getItem('token')
   ```
   - [ ] Returns `null`

4. **Try Protected Route**
   - Manually navigate to `/dashboard`
   - [ ] Redirects to `/auth`

5. **No Redirect Loop**
   - Stay on `/auth` page for 5 seconds
   - [ ] Stays on `/auth` (no auto-redirect)

**Result:** [ ] ✅ COMPLETE SUCCESS | [ ] ❌ FAILED

---

### E2E TEST 4: Email/Password Authentication
**Time:** 5 minutes | **Priority:** HIGH | **Status:** ⏳

#### Scenario: Register and Login with Email

1. **Start Fresh**
   ```javascript
   localStorage.clear();
   location.reload();
   ```

2. **Register New Account**
   - Go to `/auth`
   - Click "Sign Up" tab
   - Fill form:
     - Name: "Test User"
     - Email: "test-" + Date.now() + "@example.com"
     - Password: "test123456"
     - Confirm: "test123456"
   - Click "Create Account"
   - [ ] Success toast appears
   - [ ] Redirects to `/dashboard`

3. **Logout**
   - Click logout
   - [ ] Redirects to `/auth`

4. **Login with Email**
   - Click "Sign In" tab
   - Enter same email and password
   - Click "Sign In"
   - [ ] Success toast appears
   - [ ] Redirects to `/dashboard`

**Result:** [ ] ✅ COMPLETE SUCCESS | [ ] ❌ FAILED

---

## 📊 TEST RESULTS SUMMARY

### Status Table

| Test ID | Name | Priority | Status | Time | Pass/Fail |
|---------|------|----------|--------|------|-----------|
| TEST-1 | onAuthStateChanged | 🔴 CRITICAL | ⏳ | ___ min | ☐ ✅ ☐ ❌ |
| TEST-2 | Auth Persistence | 🔴 CRITICAL | ⏳ | ___ min | ☐ ✅ ☐ ❌ |
| TEST-3 | Firebase Config | 🔴 CRITICAL | ⏳ | ___ min | ☐ ✅ ☐ ❌ |
| TEST-4 | No Duplicate Init | 🟠 HIGH | ⏳ | ___ min | ☐ ✅ ☐ ❌ |
| TEST-5 | Landing Performance | 🟡 MEDIUM | ⏳ | ___ min | ☐ ✅ ☐ ❌ |
| TEST-6 | Console Logging | 🟢 LOW | ⏳ | ___ min | ☐ ✅ ☐ ❌ |
| E2E-1 | Sign-In Flow | 🔴 CRITICAL | ⏳ | ___ min | ☐ ✅ ☐ ❌ |
| E2E-2 | Session Persist | 🔴 CRITICAL | ⏳ | ___ min | ☐ ✅ ☐ ❌ |
| E2E-3 | Logout Flow | 🔴 CRITICAL | ⏳ | ___ min | ☐ ✅ ☐ ❌ |
| E2E-4 | Email Auth | 🟠 HIGH | ⏳ | ___ min | ☐ ✅ ☐ ❌ |

### Overall Results

- **Tests Executed:** ____ / 10
- **Tests Passed:** ____ / 10
- **Tests Failed:** ____ / 10
- **Pass Rate:** _____%
- **Total Time:** ____ minutes

### Status
- [ ] 🟢 ALL TESTS PASSED - 100% GREEN
- [ ] 🟡 SOME TESTS FAILED - NEEDS ATTENTION
- [ ] 🔴 CRITICAL FAILURES - IMMEDIATE ACTION REQUIRED

---

## 📸 REQUIRED SCREENSHOTS

### Checklist:
- [ ] Firebase Console - Authorized Domains
- [ ] Console logs - onAuthStateChanged working
- [ ] Console logs - Auth persistence message
- [ ] Console logs - User object logged
- [ ] Lighthouse performance score
- [ ] localStorage showing token
- [ ] Dashboard after successful login

---

## ✅ SIGN-OFF

**Tester Name:** ____________________  
**Date:** ____________________  
**Time:** ____________________  

**Overall Assessment:**
- [ ] Ready for Production
- [ ] Minor Issues (Document below)
- [ ] Major Issues (Document below)

**Issues Found:**
1. _____________________________
2. _____________________________
3. _____________________________

**Recommendations:**
1. _____________________________
2. _____________________________

**Final Status:** [ ] ✅ APPROVED | [ ] ❌ REJECTED

---

**Testing Script Version:** 1.0  
**Last Updated:** December 23, 2025  
**Next Review:** After completion



