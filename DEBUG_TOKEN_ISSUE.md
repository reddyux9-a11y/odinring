# Debugging Token Issue - Step by Step

## Current Situation

You're looking at `api.js` line 160 where the warning fires:
```javascript
console.warn('⚠️ api.js interceptor: NO TOKEN - Request will be sent without Authorization header!');
```

This happens because at line 118, `localStorage.getItem('token')` returns `NULL`.

## ⚠️ CRITICAL FINDING: Timing/Race Condition Issue

**Important Discovery:** Console logs show that Dashboard.jsx CAN read the token:
- `JWT Payload: ► Object` ✅
- `User ID from JWT: 87db5a76-e8a9-44a1-8ffb-77a01dcaf799` ✅
- `Token expires: 2026-01-03T19:14:51.000Z` ✅

**But the API interceptor sees NULL!** This indicates a **race condition** or **timing issue**:

1. Dashboard.jsx reads token successfully (line 230)
2. API interceptor runs later and sees NULL (line 118)
3. Token may be cleared between these two points, OR
4. Different code paths access localStorage at different times

**This is NOT a "token never stored" issue - it's a "token disappears" or "timing mismatch" issue.**

## Immediate Debugging Steps (In Browser DevTools)

### Step 1: Set Breakpoint at Token Retrieval

1. **In Sources tab, go to line 118:**
   ```javascript
   const token = localStorage.getItem('token');
   ```

2. **Click the line number to set a breakpoint**

3. **Reload the page** - execution will pause here

4. **When paused, check:**
   ```javascript
   // In console, run:
   localStorage.getItem('token')  // Should show the token or null
   localStorage.getItem('refresh_token')  // Check if refresh token exists
   ```

### Step 2: Trace Token Lifecycle

**Add logging to see when token is set/removed:**

In console, run this to monitor token changes:

```javascript
// Monitor token storage
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
  if (key === 'token') {
    console.log('🔑 TOKEN STORED:', value ? value.substring(0, 20) + '...' : 'NULL');
    console.trace('Stack trace:');
  }
  return originalSetItem.apply(this, arguments);
};

const originalRemoveItem = localStorage.removeItem;
localStorage.removeItem = function(key) {
  if (key === 'token') {
    console.log('🗑️ TOKEN REMOVED');
    console.trace('Stack trace:');
  }
  return originalRemoveItem.apply(this, arguments);
};

console.log('✅ Token monitoring active - reload page to see token lifecycle');
```

### Step 3: Check Token on Page Load

**In console, run:**

```javascript
// Check immediately
console.log('Token on load:', localStorage.getItem('token'));

// Check after a delay (in case it's set asynchronously)
setTimeout(() => {
  console.log('Token after 1s:', localStorage.getItem('token'));
  console.log('Token after 2s:', localStorage.getItem('token'));
}, 1000);

setTimeout(() => {
  console.log('Token after 2s:', localStorage.getItem('token'));
}, 2000);

setTimeout(() => {
  console.log('Token after 5s:', localStorage.getItem('token'));
}, 5000);
```

### Step 4: Check AuthContext Initialization

**Look for these console messages on page load:**

- `🔍 AuthContext: checkAuthStatus() called`
- `🔍 AuthContext: Token in localStorage: EXISTS` or `NULL`
- `✅ AuthContext: Access token stored successfully!` (after login)

**If you don't see token storage messages:**
- Login flow may not be completing
- Token may not be returned from backend
- Token storage may be failing

### Step 5: Inspect Request Flow

**With breakpoint at line 118, check:**

1. **What URL is being requested?**
   - Check `config.url` in the debugger
   - Public endpoints (like `/profile/{username}`) don't need tokens
   - Protected endpoints (like `/dashboard/data`) do need tokens

2. **Is this an auth endpoint?**
   - Line 110 checks: `if (config.url?.includes('/auth/'))`
   - Auth endpoints skip token check (correct behavior)

3. **Check the call stack:**
   - Where is this request coming from?
   - Is it from Dashboard? Profile page? Another component?

## Common Scenarios

### Scenario 1: Token Never Stored
**Symptoms:**
- No `✅ AuthContext: Access token stored successfully!` message
- Token is NULL from the start

**Debug:**
```javascript
// Check if login completed
// Look for login API response in Network tab
// Check if response contains access_token or token field
```

### Scenario 2: Token Cleared After Storage
**Symptoms:**
- Token exists initially
- Then gets removed
- See `🗑️ TOKEN REMOVED` in monitoring

**Debug:**
- Check stack trace from `localStorage.removeItem` monitoring
- Look for error handlers that clear tokens
- Check token refresh failures

### Scenario 3: Token Expired
**Symptoms:**
- Token exists but is expired
- Refresh should happen automatically

**Debug:**
```javascript
const token = localStorage.getItem('token');
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  const expiresAt = new Date(payload.exp * 1000);
  console.log('Expires:', expiresAt);
  console.log('Now:', new Date());
  console.log('Expired:', new Date() > expiresAt);
}
```

### Scenario 4: Race Condition (LIKELY YOUR ISSUE)
**Symptoms:**
- Dashboard.jsx can read token (you see JWT payload in console)
- API interceptor sees NULL
- Token exists at one point, NULL at another

**Debug Steps:**

1. **Add timing logs to see when token is read:**
   ```javascript
   // In Dashboard.jsx around line 230, add:
   console.log('⏰ Dashboard: Reading token at', new Date().toISOString());
   const token = localStorage.getItem('token');
   console.log('⏰ Dashboard: Token exists?', !!token);
   ```

2. **Add timing logs to API interceptor:**
   ```javascript
   // In api.js line 118, modify to:
   const token = localStorage.getItem('token');
   console.log('⏰ API Interceptor: Reading token at', new Date().toISOString());
   console.log('⏰ API Interceptor: Token exists?', !!token);
   console.log('⏰ API Interceptor: Request URL:', config.url);
   ```

3. **Compare timestamps:**
   - If Dashboard reads token at 10:00:00.100
   - And API interceptor reads NULL at 10:00:00.050
   - Then token was cleared between these times!

4. **Check for token clearing between reads:**
   - Use the token monitoring code (Step 2 above)
   - Look for `🗑️ TOKEN REMOVED` messages
   - Check if removal happens between Dashboard read and API interceptor read

5. **Check request order:**
   - Which request fires first?
   - Is `/api/dashboard/data` called before token is set?
   - Is there a request that clears the token?

## Quick Fixes to Try

### Fix 1: Force Token Refresh
```javascript
// If you have a refresh token, try refreshing
const refreshToken = localStorage.getItem('refresh_token');
if (refreshToken) {
  fetch('http://localhost:8000/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken })
  })
  .then(r => r.json())
  .then(data => {
    if (data.access_token) {
      localStorage.setItem('token', data.access_token);
      console.log('✅ Token refreshed!');
      window.location.reload();
    }
  });
}
```

### Fix 2: Clear and Re-authenticate
```javascript
// Nuclear option - clear everything
localStorage.clear();
sessionStorage.clear();
console.log('✅ Cleared all storage');
window.location.reload();
// Then log in again
```

### Fix 3: Manual Token Check
```javascript
// If you have a valid token from elsewhere, set it manually
// (Only for debugging - not a permanent solution)
const manualToken = 'YOUR_TOKEN_HERE';
localStorage.setItem('token', manualToken);
console.log('✅ Token set manually');
window.location.reload();
```

## What to Look For in Network Tab

1. **Login request:**
   - `POST /api/auth/login`
   - Response should contain `access_token` or `token`
   - Status should be 200

2. **Token refresh:**
   - `POST /api/auth/refresh`
   - Should return new `access_token`
   - Status should be 200

3. **Dashboard request:**
   - `GET /api/dashboard/data`
   - Should have `Authorization: Bearer <token>` header
   - Status should be 200 (not 403)

## Expected Flow

1. **Page loads** → `checkAuthStatus()` runs
2. **Token found** → User restored from cache (instant)
3. **Fresh data fetched** → `/api/me` called with token
4. **Dashboard loads** → `/api/dashboard/data` called with token
5. **All requests succeed** → Data displayed

## Current Issue Flow

1. **Page loads** → `checkAuthStatus()` runs
2. **Token is NULL** → No user restored
3. **Requests made** → No token attached
4. **403 errors** → Requests fail
5. **Fallback used** → Parallel individual calls (slower)

## Next Steps

1. ✅ Set breakpoint at line 118
2. ✅ Add token monitoring (Step 2)
3. ✅ Check token lifecycle
4. ✅ Identify when/why token is NULL
5. ✅ Fix the root cause
6. ✅ Verify performance verification works

---

**Status:** Active debugging guide  
**Last Updated:** January 2, 2026

