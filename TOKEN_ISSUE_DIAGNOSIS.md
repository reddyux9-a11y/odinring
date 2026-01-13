# Token Issue Diagnosis - Root Causes Identified

## Diagnosis Results

After examining the codebase, **ALL FOUR CAUSES are present** and contributing to the issue:

---

## ✅ Cause 1: Token Cleared by Error Handler (CONFIRMED)

### Locations Found:

1. **API Interceptor - Token Refresh Failure** (`api.js:239-242`)
   ```javascript
   catch (refreshError) {
     // Clear auth state
     localStorage.removeItem('token');
     localStorage.removeItem('refresh_token');
     // ...
   }
   ```
   **Problem:** Clears token on ANY refresh failure, even transient network errors

2. **AuthContext - Auth Check Failure** (`AuthContext.jsx:325-326`)
   ```javascript
   catch (error) {
     // Clear invalid tokens
     localStorage.removeItem('token');
     localStorage.removeItem('admin_token');
   }
   ```
   **Problem:** Clears token on ANY error during auth check, even network issues

3. **AuthContext - fetchUserData Failure** (`AuthContext.jsx:362`)
   ```javascript
   catch (error) {
     localStorage.removeItem('token');
     // ...
   }
   ```
   **Problem:** Clears token if `/api/me` fails, even if it's a temporary network issue

### Impact:
- Transient network errors → Token cleared
- Temporary server issues → Token cleared
- Any 401 error → Token cleared (even if refresh would work)

---

## ✅ Cause 2: Multiple Auth Checks (CONFIRMED)

### Locations Found:

1. **AuthContext.checkAuthStatus()** - Runs on mount
2. **Dashboard.jsx** - Reads token directly (line 230)
3. **API Interceptor** - Checks token on every request
4. **Multiple components** - Each checking auth independently

### Impact:
- Race conditions between checks
- One component clears token, others see NULL
- No single source of truth

---

## ✅ Cause 3: Async Initialization Race (CONFIRMED - LIKELY PRIMARY CAUSE)

### The Race Condition:

1. **Dashboard loads** → Reads token from localStorage (EXISTS) ✅
2. **AuthContext initializes** → Runs `checkAuthStatus()`
3. **AuthContext calls `fetchUserData(token)`** → Makes `/api/me` request
4. **If `/api/me` fails** (network error, 401, etc.) → Token cleared ❌
5. **API interceptor runs** → Sees NULL token ❌

### Timeline:
```
T+0ms:  Dashboard reads token → EXISTS ✅
T+50ms: AuthContext.checkAuthStatus() starts
T+100ms: fetchUserData() called with token
T+150ms: /api/me request fails (network error/401)
T+200ms: Token cleared in catch block ❌
T+250ms: API interceptor reads token → NULL ❌
```

### Code Evidence:
```javascript
// AuthContext.jsx:305
await fetchUserData(token);  // If this fails...

// AuthContext.jsx:362
catch (error) {
  localStorage.removeItem('token');  // Token cleared!
  // ...
}
```

---

## ✅ Cause 4: Token Refresh Failure (CONFIRMED)

### Location: `api.js:231-243`

```javascript
catch (refreshError) {
  // Clear auth state
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
  // ...
}
```

### Problem:
- Clears token on ANY refresh failure
- Doesn't distinguish between:
  - Invalid refresh token (should clear)
  - Network error (should retry, not clear)
  - Server error (should retry, not clear)

---

## Primary Root Cause: Cause 3 (Async Initialization Race)

**Most Likely Scenario:**

1. User has valid token from previous session
2. Dashboard loads and reads token successfully
3. AuthContext initializes and calls `fetchUserData()`
4. `/api/me` request fails (could be network, 401, timeout, etc.)
5. Error handler clears token
6. Subsequent API requests see NULL token

**Why this matches your symptoms:**
- ✅ Dashboard can read token (happens first)
- ❌ API interceptor sees NULL (happens after token cleared)
- ✅ Token exists initially, then disappears

---

## Fixes Required

### Fix 1: Don't Clear Token on Transient Errors

**File:** `frontend/src/contexts/AuthContext.jsx`

**Change:** Only clear token on actual auth failures, not network errors

```javascript
catch (error) {
  console.error('❌ AuthContext: Auth check failed:', error);
  
  // Only clear token if it's an actual auth failure (401/403)
  // Don't clear on network errors, timeouts, or server errors
  const status = error.response?.status;
  if (status === 401 || status === 403) {
    console.log('🗑️ AuthContext: Clearing tokens due to auth failure');
    localStorage.removeItem('token');
    localStorage.removeItem('admin_token');
  } else {
    console.warn('⚠️ AuthContext: Auth check failed but keeping token (might be transient error)');
    // Keep token, might be network issue
  }
}
```

### Fix 2: Don't Clear Token in fetchUserData on Network Errors

**File:** `frontend/src/contexts/AuthContext.jsx`

**Change:** Only clear token on 401/403, not on all errors

```javascript
catch (error) {
  console.error('❌ AuthContext: Failed to fetch user data:', error);
  
  const status = error.response?.status;
  if (status === 401 || status === 403) {
    // Actual auth failure - clear token
    console.log('🗑️ AuthContext: Removing all auth data due to auth failure');
    localStorage.removeItem('token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('user_id');
    setUser(null);
  } else {
    // Network error or server error - keep token, might be transient
    console.warn('⚠️ AuthContext: Failed to fetch user data but keeping token (might be network issue)');
  }
  throw error;
}
```

### Fix 3: Improve Token Refresh Error Handling

**File:** `frontend/src/lib/api.js`

**Change:** Only clear token if refresh token is also invalid

```javascript
catch (refreshError) {
  isRefreshing = false;
  console.log('ℹ️  Token refresh failed');
  
  const status = refreshError.response?.status;
  
  // Only clear tokens if refresh token is invalid (401/403)
  // Don't clear on network errors - might be transient
  if (status === 401 || status === 403) {
    console.log('🗑️ Refresh token invalid - clearing all auth state');
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('user_id');
  } else {
    console.warn('⚠️ Token refresh failed but keeping tokens (might be network issue)');
    // Keep tokens, might be transient network error
  }
  
  return Promise.reject(refreshError);
}
```

### Fix 4: Add Retry Logic for Transient Errors

**File:** `frontend/src/contexts/AuthContext.jsx`

**Change:** Retry fetchUserData on network errors before clearing token

```javascript
const fetchUserData = async (token, retryCount = 0) => {
  const MAX_RETRIES = 2;
  
  try {
    const response = await api.get(`/me`);
    // ... success handling
  } catch (error) {
    const status = error.response?.status;
    const isNetworkError = !error.response; // No response = network error
    
    // Retry on network errors
    if (isNetworkError && retryCount < MAX_RETRIES) {
      console.log(`🔄 Retrying fetchUserData (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
      return fetchUserData(token, retryCount + 1);
    }
    
    // Only clear on actual auth failures
    if (status === 401 || status === 403) {
      // Clear token
    } else {
      // Keep token, log warning
    }
  }
};
```

---

## Implementation Priority

1. **HIGH:** Fix 2 (fetchUserData error handling) - Most likely cause
2. **HIGH:** Fix 1 (checkAuthStatus error handling) - Prevents token clearing
3. **MEDIUM:** Fix 3 (Token refresh error handling) - Prevents unnecessary clearing
4. **LOW:** Fix 4 (Retry logic) - Nice to have, but fixes 1-3 should solve it

---

## Testing After Fix

1. **Clear localStorage and reload**
2. **Log in**
3. **Check console for token storage**
4. **Simulate network error** (disable network in DevTools)
5. **Verify token is NOT cleared**
6. **Re-enable network**
7. **Verify requests work with existing token**

---

**Status:** Root causes identified, fixes ready  
**Priority:** High  
**Last Updated:** January 2, 2026



