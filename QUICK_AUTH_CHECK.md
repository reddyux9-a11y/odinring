# Quick Authentication Check

## Browser Console Diagnostic

**Copy and paste this into your browser console (F12 → Console tab):**

```javascript
// Quick Authentication Status Check
console.log('🔍 Authentication Status Check');
console.log('================================\n');

const token = localStorage.getItem('token');
const refreshToken = localStorage.getItem('refresh_token');
const userData = localStorage.getItem('user_data');
const userId = localStorage.getItem('user_id');

console.log('📦 LocalStorage Status:');
console.log('-------------------------------------');
console.log(`Token: ${token ? `✅ EXISTS (${token.substring(0, 20)}...)` : '❌ NULL'}`);
console.log(`Refresh Token: ${refreshToken ? `✅ EXISTS` : '❌ NULL'}`);
console.log(`User Data: ${userData ? '✅ EXISTS' : '❌ NULL'}`);
console.log(`User ID: ${userId || '❌ NULL'}\n`);

if (token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiresAt = new Date(payload.exp * 1000);
    const now = new Date();
    const isExpired = now > expiresAt;
    const timeUntilExpiry = (expiresAt - now) / 1000;
    
    console.log('🔐 Token Details:');
    console.log('-------------------------------------');
    console.log(`User ID: ${payload.user_id || 'N/A'}`);
    console.log(`Expires At: ${expiresAt.toISOString()}`);
    console.log(`Current Time: ${now.toISOString()}`);
    console.log(`Status: ${isExpired ? '❌ EXPIRED' : '✅ VALID'}`);
    if (!isExpired) {
      console.log(`Time Until Expiry: ${Math.floor(timeUntilExpiry / 60)} minutes`);
    }
    console.log('');
    
    if (isExpired) {
      console.log('⚠️  WARNING: Token is expired!');
      console.log('   - Automatic refresh should occur');
      console.log('   - Check if refresh token exists');
      console.log('   - You may need to log in again\n');
    }
  } catch (e) {
    console.error('❌ Error parsing token:', e.message);
    console.log('');
  }
} else {
  console.log('❌ CRITICAL: No token found!');
  console.log('');
  console.log('🔧 Fix Steps:');
  console.log('   1. Log out: localStorage.clear(); window.location.reload();');
  console.log('   2. Log in again');
  console.log('   3. Check console for: "✅ AuthContext: Access token stored successfully!"');
  console.log('   4. Run this check again');
  console.log('');
}

// Performance verification impact
console.log('📊 Performance Verification Impact:');
console.log('-------------------------------------');
if (!token) {
  console.log('❌ BLOCKED: Cannot verify performance');
  console.log('   - /api/dashboard/data requires authentication');
  console.log('   - Without token, requests will return 403 Forbidden');
  console.log('   - Performance metrics will be incorrect\n');
} else if (token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiresAt = new Date(payload.exp * 1000);
    if (new Date() > expiresAt) {
      console.log('❌ BLOCKED: Token expired');
      console.log('   - Need to refresh or log in again\n');
    } else {
      console.log('✅ READY: Can verify performance');
      console.log('   - Token is valid');
      console.log('   - /api/dashboard/data should work');
      console.log('   - Expected load time: 2-3 seconds\n');
    }
  } catch (e) {
    console.log('❌ BLOCKED: Token is invalid');
    console.log('   - Need to log in again\n');
  }
}
```

## Quick Fix Commands

**If token is NULL or expired, run these in console:**

```javascript
// Step 1: Clear everything
localStorage.clear();
console.log('✅ Cleared localStorage');

// Step 2: Reload page
window.location.reload();
// Then log in again through the UI
```

**After logging in, verify:**

```javascript
// Check if token was stored
const token = localStorage.getItem('token');
if (token) {
  console.log('✅ Token stored successfully!');
  console.log('Token preview:', token.substring(0, 30) + '...');
} else {
  console.error('❌ Token still not found - login may have failed');
}
```

## What to Look For

### ✅ Good Signs:
- Token exists in localStorage
- Token is not expired
- Console shows: `✅ AuthContext: Access token stored successfully!`
- No 403 errors for `/api/dashboard/data`

### ❌ Bad Signs:
- Token is NULL
- Token is expired
- Multiple 403 Forbidden errors
- Console shows: `api.js interceptor: NO TOKEN`
- Dashboard data fails to load

---

**Status:** Ready to use  
**Last Updated:** January 2, 2026

