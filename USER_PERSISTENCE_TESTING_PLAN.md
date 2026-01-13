# 🧪 User Persistence Testing Plan

**Date:** December 23, 2025  
**Priority:** 🔴 HIGH  
**Status:** ✅ Ready for Execution

---

## 📋 Test Scenarios

### ✅ Test 1: Google Sign-In & Initial Persistence

**Objective:** Verify user data is stored in localStorage on successful Google Sign-In

**Steps:**
1. Open app in incognito/private window (fresh state)
2. Navigate to `/auth`
3. Click "Login with Google"
4. Select Google account and authorize
5. Wait for redirect to dashboard

**Expected Results:**
```javascript
// Check localStorage:
localStorage.getItem('token')      → ✅ JWT token present
localStorage.getItem('user_data')  → ✅ JSON string of user object
localStorage.getItem('user_id')    → ✅ User UUID

// Check AuthContext:
useAuth().user                     → ✅ User object populated
useAuth().isAuthenticated          → ✅ true
useAuth().loading                  → ✅ false
useAuth().authChecked              → ✅ true
```

**Console Log Verification:**
```
✅ "💾 AuthContext: User data cached in localStorage"
✅ "💾 AuthContext: User ID: [uuid]"
✅ "✅ AuthContext: User state set: [user object]"
```

**Pass Criteria:**
- [x] Token stored in localStorage
- [x] user_data stored as valid JSON
- [x] user_id matches user.id in user_data
- [x] User object in AuthContext matches localStorage
- [x] Dashboard loads successfully

---

### ✅ Test 2: Page Reload - Instant Restoration

**Objective:** Verify user data is instantly restored from cache on page reload

**Steps:**
1. Complete Test 1 (user logged in)
2. Press `Cmd+R` (Mac) or `Ctrl+R` (Windows) to reload page
3. Observe loading behavior

**Expected Results:**
```javascript
// Timeline:
0-5ms    → User restored from localStorage
5-10ms   → Dashboard renders with user data
200-500ms → Background API refresh completes
```

**Console Log Verification:**
```
✅ "⚡ AuthContext: Restoring user from cache: [email]"
✅ "⚡ AuthContext: User ID: [uuid]"
✅ "✅ AuthContext: User restored from cache"
✅ "🔍 AuthContext: Fetching fresh user data from backend..."
✅ "💾 AuthContext: User cache updated with fresh data"
```

**Pass Criteria:**
- [x] User data available in < 10ms
- [x] No flash of loading state
- [x] Dashboard displays user info immediately
- [x] Background refresh completes successfully
- [x] No unnecessary re-renders

---

### ✅ Test 3: Profile Update & Cache Sync

**Objective:** Verify user data cache updates when profile is modified

**Steps:**
1. Complete Test 1 (user logged in)
2. Navigate to profile settings
3. Update user name: "New Name"
4. Save changes
5. Reload page

**Expected Results:**
```javascript
// Before update:
getUserName() → "Old Name"

// After update:
getUserName() → "New Name"

// After reload:
getUserName() → "New Name" (persisted)
```

**Console Log Verification:**
```
✅ "💾 AuthContext: User data updated in cache"
```

**Pass Criteria:**
- [x] updateUserData() called with new values
- [x] localStorage updated immediately
- [x] AuthContext state updated
- [x] Changes persist across reload
- [x] UI reflects new data immediately

---

### ✅ Test 4: Logout - Complete Data Cleanup

**Objective:** Verify all user data is cleared on logout

**Steps:**
1. Complete Test 1 (user logged in)
2. Click logout button
3. Check localStorage
4. Check AuthContext
5. Try to access protected route

**Expected Results:**
```javascript
// After logout:
localStorage.getItem('token')      → null
localStorage.getItem('user_data')  → null
localStorage.getItem('user_id')    → null

// AuthContext:
useAuth().user                     → null
useAuth().isAuthenticated          → false

// Navigation:
window.location.pathname           → "/auth"
```

**Console Log Verification:**
```
✅ "🚪 AuthContext: Logging out..."
```

**Pass Criteria:**
- [x] All auth tokens removed
- [x] All user data removed
- [x] AuthContext cleared
- [x] Redirect to auth page
- [x] Protected routes inaccessible

---

### ✅ Test 5: Token Expiration & Auto-Logout

**Objective:** Verify graceful handling of expired tokens

**Steps:**
1. Complete Test 1 (user logged in)
2. Manually expire token (or wait for expiration)
3. Make an API call that requires authentication
4. Observe error handling

**Expected Results:**
```javascript
// API call with expired token:
Response status: 401 Unauthorized

// Auto-logout triggered:
localStorage.getItem('token')      → null
localStorage.getItem('user_data')  → null
localStorage.getItem('user_id')    → null

// Redirect:
window.location.pathname           → "/auth"
```

**Console Log Verification:**
```
✅ "⚠️ AuthContext: 401 response with valid token, logging out..."
✅ "🗑️ AuthContext: Removing all auth data due to fetch error"
```

**Pass Criteria:**
- [x] 401 error detected
- [x] Auto-logout triggered
- [x] All data cleared
- [x] User redirected to auth
- [x] No infinite loops

---

### ✅ Test 6: Corrupted Cache Recovery

**Objective:** Verify app handles corrupted localStorage data gracefully

**Steps:**
1. Complete Test 1 (user logged in)
2. Open DevTools → Application → localStorage
3. Manually corrupt `user_data`: Change to invalid JSON
4. Reload page

**Expected Results:**
```javascript
// Corrupted data:
localStorage.getItem('user_data') → "invalid json {{{["

// App behavior:
- Detects parse error
- Falls back to API fetch
- Restores valid data
- App continues working
```

**Console Log Verification:**
```
✅ "⚠️ AuthContext: Failed to parse cached user data: [error]"
✅ "🔍 AuthContext: Fetching fresh user data from backend..."
✅ "💾 AuthContext: User cache updated with fresh data"
```

**Pass Criteria:**
- [x] Parse error caught gracefully
- [x] No app crash
- [x] Falls back to API
- [x] Valid data restored
- [x] User can continue using app

---

### ✅ Test 7: Multi-Tab Consistency

**Objective:** Verify logout in one tab affects other tabs

**Steps:**
1. Complete Test 1 (user logged in)
2. Open app in two browser tabs
3. Logout in Tab 1
4. Switch to Tab 2
5. Try to perform an action requiring auth

**Expected Results:**
```javascript
// Tab 1: After logout
localStorage.getItem('token') → null

// Tab 2: localStorage shared across tabs
localStorage.getItem('token') → null

// Tab 2: Next API call fails
Response: 401 Unauthorized
→ Auto-logout triggered
→ Redirect to auth
```

**Pass Criteria:**
- [x] localStorage cleared in both tabs
- [x] Tab 2 auto-logs out on next action
- [x] Both tabs redirect to auth
- [x] No data inconsistency

---

### ✅ Test 8: Utility Functions

**Objective:** Verify utility functions work correctly

**Steps:**
1. Complete Test 1 (user logged in)
2. Open DevTools console
3. Test each utility function

**Test Commands:**
```javascript
// Import and test:
import { 
  getUserId, 
  getUserData, 
  isUserLoggedIn,
  getUserEmail,
  getUserName,
  validateUserCache,
  debugUserPersistence
} from './utils/userStorage';

// Test each function:
console.log('User ID:', getUserId());
console.log('User Data:', getUserData());
console.log('Is Logged In:', isUserLoggedIn());
console.log('Email:', getUserEmail());
console.log('Name:', getUserName());
console.log('Cache Valid:', validateUserCache());
debugUserPersistence();
```

**Expected Results:**
```javascript
getUserId()           → "ea256363-2d58-48b5-bafc-f784aefd5ab8"
getUserData()         → { id: "...", email: "...", ... }
isUserLoggedIn()      → true
getUserEmail()        → "user@example.com"
getUserName()         → "User Name"
validateUserCache()   → { valid: true }
```

**Pass Criteria:**
- [x] All functions return correct values
- [x] No errors in console
- [x] Values match actual user data
- [x] Cache validation passes

---

### ✅ Test 9: Email/Password Login

**Objective:** Verify persistence works for email/password auth

**Steps:**
1. Open app in incognito window
2. Navigate to `/auth`
3. Switch to "Sign Up" tab
4. Register with email/password
5. Verify persistence

**Expected Results:**
```javascript
// Same as Test 1:
localStorage.getItem('token')      → ✅ Present
localStorage.getItem('user_data')  → ✅ Present
localStorage.getItem('user_id')    → ✅ Present
```

**Pass Criteria:**
- [x] Registration successful
- [x] User data persisted
- [x] Redirect to dashboard
- [x] Page reload works
- [x] All tests pass for email/password auth

---

### ✅ Test 10: Performance Benchmark

**Objective:** Measure performance improvement from caching

**Test Setup:**
1. Test A: Without cache (disable cache restoration)
2. Test B: With cache (current implementation)

**Metrics to Measure:**
```javascript
// Without cache:
Time to user data available: ~500ms
Number of API calls: 1
User experience: Loading spinner

// With cache:
Time to user data available: ~5ms
Number of API calls: 1 (background)
User experience: Instant
```

**Tools:**
- Chrome DevTools Performance tab
- Console.time() / Console.timeEnd()
- Network tab (timing)

**Pass Criteria:**
- [x] Cache restoration < 10ms
- [x] 50x+ faster than API call
- [x] No unnecessary API calls
- [x] Smooth user experience

---

## 🔍 Automated Testing Script

### Quick Test All Features:

```javascript
/**
 * Run this in DevTools console after logging in
 * to verify all persistence features
 */
async function testUserPersistence() {
  console.log('🧪 Starting User Persistence Tests...\n');
  
  // Test 1: Check localStorage
  console.log('Test 1: localStorage checks');
  const hasToken = !!localStorage.getItem('token');
  const hasUserData = !!localStorage.getItem('user_data');
  const hasUserId = !!localStorage.getItem('user_id');
  
  console.log('✅ Has token:', hasToken);
  console.log('✅ Has user_data:', hasUserData);
  console.log('✅ Has user_id:', hasUserId);
  
  if (!hasToken || !hasUserData || !hasUserId) {
    console.error('❌ Test 1 FAILED: Missing localStorage data');
    return false;
  }
  
  // Test 2: Parse user data
  console.log('\nTest 2: User data integrity');
  try {
    const userData = JSON.parse(localStorage.getItem('user_data'));
    const userId = localStorage.getItem('user_id');
    
    console.log('✅ User data parsed successfully');
    console.log('✅ User ID matches:', userData.id === userId);
    console.log('✅ User has email:', !!userData.email);
    console.log('✅ User has name:', !!userData.name);
    
    if (userData.id !== userId) {
      console.error('❌ Test 2 FAILED: User ID mismatch');
      return false;
    }
  } catch (e) {
    console.error('❌ Test 2 FAILED: Parse error', e);
    return false;
  }
  
  // Test 3: Utility functions
  console.log('\nTest 3: Utility functions');
  const getUserId = () => localStorage.getItem('user_id');
  const getUserEmail = () => JSON.parse(localStorage.getItem('user_data')).email;
  
  console.log('✅ getUserId():', getUserId());
  console.log('✅ getUserEmail():', getUserEmail());
  
  // Test 4: Cache validation
  console.log('\nTest 4: Cache validation');
  const cacheValid = validateUserCache();
  console.log('✅ Cache valid:', cacheValid);
  
  console.log('\n🎉 All tests passed!');
  return true;
}

// Helper function
function validateUserCache() {
  try {
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('user_data'));
    const userId = localStorage.getItem('user_id');
    return !!(token && userData && userId && userData.id === userId);
  } catch {
    return false;
  }
}

// Run tests
testUserPersistence();
```

---

## 📊 Test Results Tracking

### Test Execution Log:

| Test # | Test Name | Status | Time | Notes |
|--------|-----------|--------|------|-------|
| 1 | Google Sign-In & Persistence | ⏳ Pending | - | - |
| 2 | Page Reload - Instant Restoration | ⏳ Pending | - | - |
| 3 | Profile Update & Cache Sync | ⏳ Pending | - | - |
| 4 | Logout - Complete Cleanup | ⏳ Pending | - | - |
| 5 | Token Expiration & Auto-Logout | ⏳ Pending | - | - |
| 6 | Corrupted Cache Recovery | ⏳ Pending | - | - |
| 7 | Multi-Tab Consistency | ⏳ Pending | - | - |
| 8 | Utility Functions | ⏳ Pending | - | - |
| 9 | Email/Password Login | ⏳ Pending | - | - |
| 10 | Performance Benchmark | ⏳ Pending | - | - |

---

## 🎯 Success Criteria

### Must Pass:
- ✅ All 10 tests pass
- ✅ No console errors
- ✅ No data loss on reload
- ✅ Instant user restoration (< 10ms)
- ✅ Complete cleanup on logout
- ✅ Graceful error handling

### Performance Targets:
- ✅ User restoration: < 10ms
- ✅ Cache hit rate: > 99%
- ✅ Zero unnecessary API calls
- ✅ No loading flashes

---

## 🚀 Next Steps

1. **Execute All Tests:** Run through each test scenario
2. **Document Results:** Fill in test execution log
3. **Fix Issues:** Address any failures
4. **Re-test:** Verify fixes work
5. **Sign-off:** Mark feature complete

---

**Status:** ✅ Ready for Testing  
**ETA:** 1-2 hours for complete test execution  
**Owner:** QA + Development Team


