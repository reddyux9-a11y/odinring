# Password Reset Troubleshooting Guide

## Common Issues and Solutions

### Issue: Not Receiving Password Reset Email

#### 1. Check Firebase Configuration
Ensure all Firebase environment variables are set in `frontend/.env`:
```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

**After updating .env, restart the frontend server!**

#### 2. Enable Email/Password Authentication in Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** → **Sign-in method**
4. Enable **Email/Password** provider
5. Click **Save**

#### 3. Check Authorized Domains
1. Firebase Console → **Authentication** → **Settings** → **Authorized domains**
2. Ensure your domain is listed (localhost is included by default for development)
3. Add your production domain if needed

#### 4. Verify User Exists in Firebase Auth
**Important:** Users must exist in **Firebase Auth** (not just Firestore) for password reset to work.

- **New users** (registered after this update): Automatically created in Firebase Auth ✅
- **Existing users** (registered before this update): May not exist in Firebase Auth ❌

**Solution for existing users:**
- Option 1: User can register again (will create Firebase Auth account)
- Option 2: Manually create user in Firebase Console → Authentication → Users → Add user
- Option 3: User can try logging in first (will attempt to sync with Firebase Auth)

#### 5. Check Email Template Configuration
1. Firebase Console → **Authentication** → **Templates**
2. Click on **Password reset** template
3. Ensure the action URL is set correctly:
   - Development: `http://localhost:3000/reset-password`
   - Production: `https://yourdomain.com/reset-password`
4. Customize the email template if needed
5. Click **Save**

#### 6. Check Spam/Junk Folder
Firebase emails sometimes end up in spam folders. Check:
- Spam/Junk folder
- Promotions tab (Gmail)
- All Mail folder

#### 7. Check Browser Console for Errors
Open browser DevTools (F12) → Console tab and look for:
- Firebase configuration errors
- Network errors
- Authentication errors

Common errors:
- `Firebase configuration is missing` → Check .env file
- `auth/user-not-found` → User doesn't exist in Firebase Auth
- `auth/network-request-failed` → Network/connectivity issue
- `auth/too-many-requests` → Rate limit exceeded, wait and retry

#### 8. Verify Email Address
- Ensure the email address is correct
- Check for typos
- Try with a different email address to test

#### 9. Test with Firebase Console
1. Go to Firebase Console → **Authentication** → **Users**
2. Find the user by email
3. Click on the user
4. Click **Reset password** button
5. This will send a password reset email directly from Firebase

If this works, the issue is with the frontend code. If it doesn't, the issue is with Firebase configuration.

## Debugging Steps

### Step 1: Check Console Logs
When requesting password reset, check browser console for:
```
📧 firebase.js: Sending password reset email to: user@example.com
✅ firebase.js: Password reset email sent successfully
```

If you see errors instead, note the error code and message.

### Step 2: Verify Firebase Auth Initialization
In browser console, run:
```javascript
// Check if Firebase is initialized
console.log(window.firebase || 'Firebase not found');
```

### Step 3: Test Firebase Auth Directly
In browser console, run:
```javascript
import { auth, sendPasswordResetEmail } from './lib/firebase';
sendPasswordResetEmail(auth, 'your-email@example.com', {
  url: window.location.origin + '/reset-password',
  handleCodeInApp: true
}).then(() => console.log('Email sent!')).catch(err => console.error('Error:', err));
```

## Still Not Working?

1. **Check Firebase Project Settings:**
   - Ensure you're using the correct Firebase project
   - Verify API keys match the project

2. **Check Email Service Status:**
   - Firebase email service should be operational
   - Check [Firebase Status Page](https://status.firebase.google.com/)

3. **Contact Support:**
   - Provide error messages from console
   - Include Firebase project ID
   - Include email address (if safe to share)

## Quick Fix Checklist

- [ ] Firebase environment variables set in `.env`
- [ ] Frontend server restarted after .env changes
- [ ] Email/Password authentication enabled in Firebase Console
- [ ] User exists in Firebase Auth (not just Firestore)
- [ ] Authorized domains configured correctly
- [ ] Email template action URL is correct
- [ ] Checked spam/junk folder
- [ ] No console errors related to Firebase
- [ ] Network connection is stable

## Testing the Flow

1. **Register a new user** (creates Firebase Auth account automatically)
2. **Log out**
3. **Go to Forgot Password page**
4. **Enter email and submit**
5. **Check email** (including spam folder)
6. **Click reset link**
7. **Set new password**
8. **Log in with new password**

If all steps work, password reset is configured correctly! ✅



