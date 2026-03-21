#!/usr/bin/env node

/**
 * Authentication Status Checker
 * Diagnoses authentication issues preventing performance verification
 * 
 * Usage: node scripts/check-auth-status.js
 */

console.log('🔍 Authentication Status Checker');
console.log('================================\n');

// Check localStorage (if running in browser context)
if (typeof localStorage !== 'undefined') {
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
      console.log(`Session ID: ${payload.session_id || 'N/A'}`);
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
    console.log('   1. Log out completely: localStorage.clear(); window.location.reload();');
    console.log('   2. Log in again');
    console.log('   3. Check console for: "✅ AuthContext: Access token stored successfully!"');
    console.log('   4. Verify token exists: localStorage.getItem("token")');
    console.log('');
  }
  
  // Check for common issues
  console.log('🔍 Diagnostic Checks:');
  console.log('-------------------------------------');
  
  const issues = [];
  
  if (!token) {
    issues.push('❌ No access token in localStorage');
  }
  
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiresAt = new Date(payload.exp * 1000);
      if (new Date() > expiresAt) {
        issues.push('❌ Token is expired');
        if (!refreshToken) {
          issues.push('❌ No refresh token available for automatic renewal');
        }
      }
    } catch (e) {
      issues.push('❌ Token is malformed or invalid');
    }
  }
  
  if (!refreshToken && token) {
    issues.push('⚠️  No refresh token (token cannot be automatically renewed)');
  }
  
  if (!userData) {
    issues.push('⚠️  No user data cached (may cause slower initial load)');
  }
  
  if (issues.length === 0) {
    console.log('✅ All checks passed! Authentication should work correctly.\n');
  } else {
    console.log('Issues found:');
    issues.forEach(issue => console.log(`   ${issue}`));
    console.log('');
  }
  
  // Performance verification impact
  console.log('📊 Performance Verification Impact:');
  console.log('-------------------------------------');
  if (!token || (token && new Date() > new Date(JSON.parse(atob(token.split('.')[1])).exp * 1000))) {
    console.log('❌ BLOCKED: Cannot verify performance');
    console.log('   - /api/dashboard/data requires authentication');
    console.log('   - Without token, requests will return 403 Forbidden');
    console.log('   - Performance metrics will be incorrect\n');
  } else {
    console.log('✅ READY: Can verify performance');
    console.log('   - Token is valid');
    console.log('   - /api/dashboard/data should work');
    console.log('   - Expected load time: 2-3 seconds\n');
  }
  
} else {
  console.log('⚠️  This script must be run in a browser console.');
  console.log('');
  console.log('To use:');
  console.log('   1. Open browser DevTools (F12)');
  console.log('   2. Go to Console tab');
  console.log('   3. Copy and paste the contents of this file');
  console.log('   4. Or use the browser-based version below:\n');
  
  console.log('// Browser Console Version:');
  console.log(`
const token = localStorage.getItem('token');
const refreshToken = localStorage.getItem('refresh_token');
const userData = localStorage.getItem('user_data');

console.log('Token:', token ? 'EXISTS' : 'NULL');
console.log('Refresh Token:', refreshToken ? 'EXISTS' : 'NULL');
console.log('User Data:', userData ? 'EXISTS' : 'NULL');

if (token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiresAt = new Date(payload.exp * 1000);
    const now = new Date();
    console.log('Token expires:', expiresAt);
    console.log('Is expired:', now > expiresAt);
  } catch (e) {
    console.error('Error parsing token:', e);
  }
}
  `);
}



