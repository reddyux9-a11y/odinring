/**
 * Firebase Configuration Verification Script
 * Run this to verify your Firebase config is correct
 * 
 * Usage: node verify-firebase-config.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Firebase Configuration...\n');

// Read .env file
const envPath = path.join(__dirname, '.env');
let envContent = '';

try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (error) {
  console.error('❌ Could not read .env file:', envPath);
  console.error('   Make sure frontend/.env exists\n');
  process.exit(1);
}

// Extract Firebase config variables
const requiredVars = [
  'REACT_APP_FIREBASE_API_KEY',
  'REACT_APP_FIREBASE_AUTH_DOMAIN',
  'REACT_APP_FIREBASE_PROJECT_ID',
  'REACT_APP_FIREBASE_STORAGE_BUCKET',
  'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
  'REACT_APP_FIREBASE_APP_ID'
];

const config = {};
const missing = [];
const present = [];

requiredVars.forEach(varName => {
  const regex = new RegExp(`${varName}=(.+)`, 'i');
  const match = envContent.match(regex);
  
  if (match && match[1] && match[1].trim() !== '') {
    const value = match[1].trim();
    config[varName] = value;
    present.push(varName);
  } else {
    missing.push(varName);
  }
});

// Display results
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (missing.length === 0) {
  console.log('✅ All Firebase configuration variables are set!\n');
  
  console.log('📋 Configuration Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  present.forEach(varName => {
    const value = config[varName];
    const preview = value.length > 30 ? value.substring(0, 30) + '...' : value;
    console.log(`✅ ${varName}: ${preview}`);
  });
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Verify format
  console.log('🔍 Format Verification:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const apiKey = config['REACT_APP_FIREBASE_API_KEY'];
  if (apiKey && apiKey.startsWith('AIza')) {
    console.log('✅ API Key format looks correct (starts with AIza)');
  } else {
    console.log('⚠️  API Key format may be incorrect (should start with AIza)');
  }
  
  const projectId = config['REACT_APP_FIREBASE_PROJECT_ID'];
  if (projectId && projectId.includes('firebaseapp.com')) {
    console.log('⚠️  Project ID should not include .firebaseapp.com');
  } else if (projectId) {
    console.log('✅ Project ID format looks correct');
  }
  
  const authDomain = config['REACT_APP_FIREBASE_AUTH_DOMAIN'];
  if (authDomain && authDomain.endsWith('.firebaseapp.com')) {
    console.log('✅ Auth Domain format looks correct');
  } else if (authDomain) {
    console.log('⚠️  Auth Domain should end with .firebaseapp.com');
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('📝 Next Steps:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1. Verify these values match your Firebase Console:');
  console.log('   → https://console.firebase.google.com/');
  console.log('   → Project Settings → General → Your apps\n');
  console.log('2. Check Authorized Domains in Firebase Console:');
  console.log('   → Authentication → Settings → Authorized domains');
  console.log('   → Should include: localhost\n');
  console.log('3. Restart frontend server after any .env changes:');
  console.log('   → npm start (or your start command)\n');
  
} else {
  console.log('❌ Missing Firebase configuration variables:\n');
  missing.forEach(varName => {
    console.log(`   ❌ ${varName}`);
  });
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📝 How to Fix:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1. Open frontend/.env file');
  console.log('2. Add the missing variables:');
  console.log('   REACT_APP_FIREBASE_API_KEY=your_api_key');
  console.log('   REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com');
  console.log('   ... (etc)\n');
  console.log('3. Get values from Firebase Console:');
  console.log('   → https://console.firebase.google.com/');
  console.log('   → Project Settings → General → Your apps\n');
  console.log('4. Restart frontend server\n');
  
  process.exit(1);
}

console.log('✅ Verification complete!\n');



