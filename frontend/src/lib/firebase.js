/**
 * Firebase Configuration
 * Handles Firebase initialization and authentication
 */

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
  applyActionCode
} from 'firebase/auth';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Debug: Log configuration (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('🔥 Firebase Config Check:', {
    apiKey: firebaseConfig.apiKey ? '✅ Set' : '❌ Missing',
    authDomain: firebaseConfig.authDomain ? '✅ Set' : '❌ Missing',
    projectId: firebaseConfig.projectId ? '✅ Set' : '❌ Missing',
    storageBucket: firebaseConfig.storageBucket ? '✅ Set' : '❌ Missing',
    messagingSenderId: firebaseConfig.messagingSenderId ? '✅ Set' : '❌ Missing',
    appId: firebaseConfig.appId ? '✅ Set' : '❌ Missing'
  });
  
  // Check if any required fields are missing
  const missingFields = Object.keys(firebaseConfig).filter(key => !firebaseConfig[key]);
  if (missingFields.length > 0) {
    console.error('❌ Missing Firebase config fields:', missingFields);
    console.error('📖 Please check your frontend/.env file');
    console.error('📖 All variables must start with REACT_APP_');
    console.error('📖 Restart frontend server after changing .env');
  }
}

// Validate configuration before initializing
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  const errorMsg = 'Firebase configuration is missing. Please check your frontend/.env file and ensure all REACT_APP_FIREBASE_* variables are set correctly. Then restart the frontend server.';
  console.error('❌', errorMsg);
  throw new Error(errorMsg);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Set auth persistence to LOCAL (survives page reloads and redirects)
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log('✅ Firebase Auth persistence set to LOCAL');
  })
  .catch((error) => {
    console.error('❌ Failed to set Firebase Auth persistence:', error);
    console.warn('⚠️ Auth will work but may not persist across page reloads');
    console.warn('💡 Try clearing browser data if you see repeated IndexedDB errors');
  });

// Add global error handler for IndexedDB errors to prevent spam
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('IndexedDB') || 
      event.reason?.message?.includes('Indexed Database')) {
    console.warn('⚠️ IndexedDB error suppressed:', event.reason.message);
    console.warn('💡 Clear browser data: localStorage.clear(); indexedDB.deleteDatabase("firebaseLocalStorageDb"); location.reload();');
    event.preventDefault(); // Prevent error spam in console
  }
});

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Add scopes for Google APIs
googleProvider.addScope('https://www.googleapis.com/auth/calendar.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/contacts.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/gmail.readonly');  // Optional

googleProvider.setCustomParameters({
  prompt: 'consent',  // Force consent to get refresh token
  access_type: 'offline'  // Get refresh token
});

/**
 * Sign in with Google using redirect flow (popup is disabled due to COOP)
 * @returns {Promise<void>}
 */
export const signInWithGoogle = async () => {
  try {
    console.log('🔄 Starting Google Sign-In...');
    
    
    // Ensure persistence is set
    console.log('🔧 Setting auth persistence to LOCAL...');
    await setPersistence(auth, browserLocalPersistence);
    console.log('✅ Auth persistence set successfully');
    
    // Try popup first (faster and more reliable for localhost)
    try {
      console.log('🪟 Attempting popup sign-in...');
      const result = await signInWithPopup(auth, googleProvider);
      
      console.log('✅ Popup sign-in successful!', result.user.email);
      const idToken = await result.user.getIdToken();
      
      // Get OAuth credential for Google APIs
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;
      
      return {
        user: result.user,
        idToken,  // For backend authentication
        accessToken,  // For Google API calls
        credential
      };
    } catch (popupError) {
      // If popup fails (blocked or closed), fall back to redirect
      console.warn('⚠️ Popup failed, falling back to redirect:', popupError.code);
      
      if (popupError.code === 'auth/popup-blocked' || 
          popupError.code === 'auth/popup-closed-by-user' ||
          popupError.code === 'auth/cancelled-popup-request') {
        
        
        console.log('🌐 Initiating redirect to Google...');
        await signInWithRedirect(auth, googleProvider);
        return null; // Redirect will reload page
      }
      
      // Re-throw other errors
      throw popupError;
    }
  } catch (error) {
    console.error('❌ Google Sign-In Error:', error);
    console.error('❌ Error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};

/**
 * Handle redirect result after Google Sign-In redirect
 * Call this on page load to check for redirect results
 * @returns {Promise<UserCredential|null>}
 */
export const handleGoogleRedirectResult = async () => {
  try {
    // Check if localStorage is available
    console.log('🔍 firebase.js: Checking localStorage availability...');
    try {
      const testKey = '__firebase_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      console.log('✅ firebase.js: localStorage is available');
    } catch (e) {
      console.error('❌ firebase.js: localStorage is NOT available!', e);
    }
    
    console.log('🔍 firebase.js: Calling getRedirectResult()...');
    console.log('🔍 firebase.js: Current URL:', window.location.href);
    
    // Get current auth state using onAuthStateChanged (more reliable than auth.currentUser)
    let currentAuthUser = null;
    const authStatePromise = new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        currentAuthUser = user;
        console.log('🔍 firebase.js: Auth state via onAuthStateChanged:', user ? `User logged in (${user.email})` : 'No user');
        unsubscribe(); // Unsubscribe after first callback
        resolve(user);
      });
    });
    
    // Wait for initial auth state
    await authStatePromise;
    
    const result = await getRedirectResult(auth);
    console.log('🔍 firebase.js: getRedirectResult() returned:', result ? 'User found' : 'No result');
    
    
    if (result) {
      console.log('✅ firebase.js: User authenticated!', {
        email: result.user.email,
        uid: result.user.uid,
        displayName: result.user.displayName
      });
      
      console.log('🔑 firebase.js: Getting ID token...');
      const idToken = await result.user.getIdToken();
      console.log('✅ firebase.js: ID token obtained (length:', idToken.length, ')');
      
      // Get OAuth credential for Google APIs
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;
      
      return {
        user: result.user,
        idToken,  // For backend authentication
        accessToken,  // For Google API calls
        credential
      };
    }
    
    // Check if there's a current user even without redirect result using onAuthStateChanged
    if (currentAuthUser) {
      console.log('⚠️ firebase.js: No redirect result, but user is already logged in!');
      console.log('👤 firebase.js: Current user:', currentAuthUser.email);
      
      
      // FIX: If user is authenticated but redirect result is null,
      // this means Firebase auth completed but the redirect result was consumed/lost.
      // Return the user data so the app can complete the login flow.
      console.log('🔧 firebase.js: Recovering user from auth state (redirect result was lost)');
      console.log('🔑 firebase.js: Getting ID token from current user...');
      
      try {
        const idToken = await currentAuthUser.getIdToken();
        console.log('✅ firebase.js: ID token obtained (length:', idToken.length, ')');
        
        return {
          user: currentAuthUser,
          idToken,  // For backend authentication
          accessToken: null,  // No access token available without redirect result
          credential: null // No credential available without redirect result
        };
      } catch (tokenError) {
        console.error('❌ firebase.js: Failed to get ID token:', tokenError);
        return null;
      }
    } else {
    }
    
    return null;
  } catch (error) {
    console.error('❌ firebase.js: Google Redirect Result Error:', error);
    console.error('❌ firebase.js: Error details:', {
      message: error.message,
      code: error.code,
      name: error.name
    });
    throw error;
  }
};

/**
 * Sign in with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<UserCredential>}
 */
export const signInWithEmail = async (email, password) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await result.user.getIdToken();
    
    return {
      user: result.user,
      idToken
    };
  } catch (error) {
    console.error('Email Sign-In Error:', error);
    throw error;
  }
};

/**
 * Register with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<UserCredential>}
 */
export const registerWithEmail = async (email, password) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const idToken = await result.user.getIdToken();
    
    return {
      user: result.user,
      idToken
    };
  } catch (error) {
    console.error('Email Registration Error:', error);
    throw error;
  }
};

/**
 * Sign out current user
 * @returns {Promise<void>}
 */
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Sign Out Error:', error);
    throw error;
  }
};

/**
 * Get current user's ID token
 * Uses onAuthStateChanged to get current user instead of auth.currentUser
 * @returns {Promise<string|null>}
 */
export const getCurrentUserToken = async () => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe(); // Unsubscribe immediately
      if (user) {
        try {
          const token = await user.getIdToken();
          resolve(token);
        } catch (error) {
          console.error('❌ firebase.js: Error getting ID token:', error);
          resolve(null);
        }
      } else {
        resolve(null);
      }
    });
  });
};

/**
 * Listen to auth state changes
 * @param {Function} callback
 * @returns {Function} Unsubscribe function
 */
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Send password reset email using Firebase Auth
 * @param {string} email - User's email address
 * @returns {Promise<void>}
 */
// Cache origin to avoid repeated window.location.origin calls
let cachedOrigin = null;
const getOrigin = () => {
  if (!cachedOrigin) {
    cachedOrigin = window.location.origin;
  }
  return cachedOrigin;
};

export const sendPasswordReset = async (email) => {
  try {
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 firebase.js: Sending password reset email to:', email);
    }
    
    // Validate Firebase Auth is initialized (early return for performance)
    if (!auth) {
      throw new Error('Firebase Auth is not initialized. Please check your Firebase configuration.');
    }
    
    // Configure action code settings for the password reset email
    // Use cached origin for better performance
    const actionCodeSettings = {
      url: `${getOrigin()}/reset-password`,
      handleCodeInApp: true,
    };
    
    // Use await with error handling optimized for performance
    await sendPasswordResetEmail(auth, email, actionCodeSettings);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ firebase.js: Password reset email sent successfully');
    }
  } catch (error) {
    // Only log errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ firebase.js: Password reset email error:', error.code || error.message);
    }
    
    // Optimize error handling - check codes first (faster than string matching)
    const errorCode = error.code;
    if (errorCode === 'auth/invalid-email') {
      throw new Error('Invalid email address. Please check and try again.');
    } else if (errorCode === 'auth/user-not-found') {
      throw error; // Re-throw with same code
    } else if (errorCode === 'auth/too-many-requests') {
      throw new Error('Too many password reset requests. Please wait a few minutes and try again.');
    } else if (errorCode === 'auth/network-request-failed') {
      throw new Error('Network error. Please check your internet connection and try again.');
    }
    
    throw error;
  }
};

/**
 * Verify password reset code
 * @param {string} actionCode - The action code from the email link
 * @returns {Promise<string>} Email address associated with the code
 */
export const verifyResetCode = async (actionCode) => {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 firebase.js: Verifying password reset code...');
    }
    const email = await verifyPasswordResetCode(auth, actionCode);
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ firebase.js: Password reset code verified for:', email);
    }
    return email;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ firebase.js: Password reset code verification failed:', error);
    }
    throw error;
  }
};

/**
 * Confirm password reset with new password
 * @param {string} actionCode - The action code from the email link
 * @param {string} newPassword - The new password
 * @returns {Promise<void>}
 */
export const confirmResetPassword = async (actionCode, newPassword) => {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 firebase.js: Confirming password reset...');
    }
    await confirmPasswordReset(auth, actionCode, newPassword);
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ firebase.js: Password reset confirmed successfully');
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ firebase.js: Password reset confirmation failed:', error);
    }
    throw error;
  }
};

/**
 * Apply action code (for handling email verification, password reset, etc.)
 * @param {string} actionCode - The action code from the email link
 * @returns {Promise<void>}
 */
export const applyActionCodeWrapper = async (actionCode) => {
  try {
    console.log('🔄 firebase.js: Applying action code...');
    await applyActionCode(auth, actionCode);
    console.log('✅ firebase.js: Action code applied successfully');
  } catch (error) {
    console.error('❌ firebase.js: Action code application failed:', error);
    throw error;
  }
};

export { auth };
export default app;

