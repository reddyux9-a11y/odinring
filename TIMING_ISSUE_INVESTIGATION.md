# Timing Issue Investigation - Token Exists Then Disappears

## Problem Summary

**Evidence from console logs:**
- ✅ Dashboard.jsx successfully reads token (line 230-233)
- ✅ JWT payload decoded successfully
- ✅ User ID extracted: `87db5a76-e8a9-44a1-8ffb-77a01dcaf799`
- ✅ Token expiration parsed: `2026-01-03T19:14:51.000Z`
- ❌ API interceptor sees NULL token (line 118)

**Conclusion:** This is a **timing/race condition**, not a "token never stored" issue.

## Investigation Steps

### Step 1: Add Timing Logs

**Modify `frontend/src/pages/Dashboard.jsx` around line 230:**

```javascript
// Add before token decode
console.log('⏰ [Dashboard] Reading token at:', new Date().toISOString());
const token = localStorage.getItem('token');
console.log('⏰ [Dashboard] Token exists?', !!token);
console.log('⏰ [Dashboard] Token value:', token ? token.substring(0, 30) + '...' : 'NULL');

// Decode JWT to see user_id
try {
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log('🔐 JWT Payload:', payload);
  console.log('🆔 User ID from JWT:', payload.user_id);
  console.log('⏰ Token expires:', new Date(payload.exp * 1000).toISOString());
} catch (e) {
  console.error('❌ Failed to decode JWT:', e);
}
```

**Modify `frontend/src/lib/api.js` around line 118:**

```javascript
// Add detailed timing logs
const requestTime = new Date().toISOString();
console.log('⏰ [API Interceptor] Reading token at:', requestTime);
console.log('⏰ [API Interceptor] Request URL:', config.url);
console.log('⏰ [API Interceptor] Request method:', config.method);

const token = localStorage.getItem('token');
console.log('⏰ [API Interceptor] Token exists?', !!token);
console.log('⏰ [API Interceptor] Token value:', token ? token.substring(0, 30) + '...' : 'NULL');

// Log all localStorage keys for debugging
console.log('⏰ [API Interceptor] All localStorage keys:', Object.keys(localStorage));
```

### Step 2: Monitor Token Lifecycle

**Run this in browser console before reloading:**

```javascript
// Comprehensive token monitoring
const tokenHistory = [];
const originalSetItem = localStorage.setItem;
const originalRemoveItem = localStorage.removeItem;

localStorage.setItem = function(key, value) {
  if (key === 'token') {
    const timestamp = new Date().toISOString();
    tokenHistory.push({ action: 'SET', timestamp, value: value.substring(0, 30) + '...' });
    console.log(`🔑 [${timestamp}] TOKEN STORED`);
    console.trace('Stack trace:');
  }
  return originalSetItem.apply(this, arguments);
};

localStorage.removeItem = function(key) {
  if (key === 'token') {
    const timestamp = new Date().toISOString();
    tokenHistory.push({ action: 'REMOVE', timestamp });
    console.log(`🗑️ [${timestamp}] TOKEN REMOVED`);
    console.trace('Stack trace:');
  }
  return originalRemoveItem.apply(this, arguments);
};

// Expose history for inspection
window.tokenHistory = tokenHistory;

console.log('✅ Token monitoring active - reload page');
console.log('After reload, check: window.tokenHistory');
```

### Step 3: Compare Timestamps

**After adding logs and reloading, check console for:**

1. **Dashboard token read time:**
   - Look for: `⏰ [Dashboard] Reading token at: 2026-01-02T...`
   - Note the timestamp

2. **API interceptor token read time:**
   - Look for: `⏰ [API Interceptor] Reading token at: 2026-01-02T...`
   - Note the timestamp

3. **Token removal time (if any):**
   - Look for: `🗑️ [timestamp] TOKEN REMOVED`
   - Check if removal happens between Dashboard read and API interceptor read

4. **Request order:**
   - Which request URL is being called when token is NULL?
   - Is it `/api/dashboard/data`?
   - Or another endpoint?

### Step 4: Check Request Sequence

**Look for this pattern in console:**

```
⏰ [Dashboard] Reading token at: 10:00:00.100 → Token EXISTS ✅
⏰ [API Interceptor] Reading token at: 10:00:00.050 → Token NULL ❌
```

**If Dashboard reads AFTER API interceptor but token is NULL in interceptor:**
- Token was cleared between these two reads
- Check `window.tokenHistory` for removal events

**If Dashboard reads BEFORE API interceptor but token is NULL in interceptor:**
- Token was cleared after Dashboard read
- Check what code runs between these two points

### Step 5: Check for Multiple Token Reads

**The issue might be:**
- Dashboard reads token directly from localStorage (line 230)
- API interceptor reads token from localStorage (line 118)
- But they're reading at different times
- Something clears the token between reads

**Check if there are multiple components reading the token:**
```javascript
// In console, search for all token reads
// Look for patterns like:
// - localStorage.getItem('token')
// - Multiple components trying to read token
// - Race conditions in useEffect hooks
```

## Common Causes

### Cause 1: Token Cleared by Error Handler
**Symptoms:**
- Token exists initially
- Error occurs (401, network error, etc.)
- Error handler clears token
- Subsequent requests see NULL

**Fix:**
- Check error handlers in AuthContext
- Check error handlers in API interceptor
- Don't clear token on transient errors

### Cause 2: Multiple Auth Checks
**Symptoms:**
- Multiple components check auth status
- One clears token, others see NULL

**Fix:**
- Ensure single source of truth for auth state
- Don't clear token unless absolutely necessary

### Cause 3: Async Initialization Race
**Symptoms:**
- Dashboard loads before AuthContext initializes
- Dashboard reads token (exists from previous session)
- AuthContext runs check, clears "stale" token
- API requests see NULL

**Fix:**
- Ensure AuthContext initializes before Dashboard
- Don't clear token during initialization unless truly invalid

### Cause 4: Token Refresh Failure
**Symptoms:**
- Token exists but is expired
- Refresh attempt fails
- Token cleared
- New requests see NULL

**Fix:**
- Check refresh token logic
- Don't clear access token if refresh fails (might be transient)

## Quick Test

**To verify timing issue, add this to Dashboard.jsx:**

```javascript
// In loadUserData function, after reading token
const token = localStorage.getItem('token');
console.log('🔍 Dashboard token check:', !!token);

// Wait a bit, then check again
setTimeout(() => {
  const tokenLater = localStorage.getItem('token');
  console.log('🔍 Dashboard token check (after 100ms):', !!tokenLater);
  if (token && !tokenLater) {
    console.error('❌ TOKEN DISAPPEARED! Was there, now gone!');
  }
}, 100);
```

## Expected Fix

Once you identify when/why the token is cleared:

1. **If cleared by error handler:**
   - Make error handler smarter (don't clear on transient errors)
   - Only clear on actual auth failures

2. **If cleared during initialization:**
   - Fix initialization order
   - Don't clear token during startup

3. **If cleared by refresh failure:**
   - Improve refresh logic
   - Don't clear access token unless refresh token is also invalid

---

**Status:** Active investigation  
**Priority:** High (blocks performance verification)  
**Last Updated:** January 2, 2026



