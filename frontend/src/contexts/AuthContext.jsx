import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';
import { onAuthChange, signOut as firebaseSignOut } from '../lib/firebase';
import logger from '../lib/logger';

const AuthContext = createContext();

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  // Debug: Track user state changes with detailed logging
  useEffect(() => {
    logger.debug('🔄 AuthContext: User state changed:', {
      user: user ? {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username
      } : null,
      loading,
      authChecked,
      hasToken: !!localStorage.getItem('token')
    });
    
    // Enhanced user logging for debugging
    if (user) {
      logger.debug('👤 AuthContext: Full user object:', user);
    } else {
      logger.debug('👤 AuthContext: No user (logged out or not authenticated)');
    }
  }, [user, loading, authChecked]);

  /**
   * Helper function to handle auth response from backend
   * Supports both new (access_token + refresh_token) and legacy (token) formats
   */
  const handleAuthResponse = (responseData) => {
logger.debug('📦 AuthContext: Processing auth response...');
    
    // Extract tokens - support both new and legacy formats
    const { access_token, refresh_token, token: legacyToken, user: userData } = responseData;
    
    // Use new format if available, otherwise fall back to legacy
    const accessToken = access_token || legacyToken;
    const refreshToken = refresh_token;
    
    if (!accessToken) {
      logger.error('❌ AuthContext: No access token in response!', responseData);
throw new Error('Backend did not return an access token');
    }
    
    logger.debug('💾 AuthContext: Storing tokens...');
    logger.debug('🔑 AuthContext: Access token:', accessToken.substring(0, 20) + '...');
    if (refreshToken) {
      logger.debug('🔑 AuthContext: Refresh token:', refreshToken.substring(0, 20) + '...');
    } else {
      logger.warn('⚠️  AuthContext: No refresh token in response (legacy format)');
    }
// Clear existing tokens first
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    logger.debug('🗑️ AuthContext: Cleared existing tokens');
// Store new tokens
    localStorage.setItem('token', accessToken);
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }
    logger.debug('💾 AuthContext: Tokens stored');
    
    // Verify tokens were stored
    const storedToken = localStorage.getItem('token');
    const storedRefreshToken = localStorage.getItem('refresh_token');
if (storedToken) {
      logger.debug('✅ AuthContext: Access token stored successfully!');
    } else {
      logger.error('❌ AuthContext: Access token NOT stored!');
throw new Error('Failed to store access token in localStorage');
    }
    
    if (refreshToken && storedRefreshToken) {
      logger.debug('✅ AuthContext: Refresh token stored successfully!');
    }
    
    // Store user data in localStorage for instant restoration
    if (userData) {
      try {
localStorage.setItem('user_data', JSON.stringify(userData));
        localStorage.setItem('user_id', userData.id);
        logger.debug('💾 AuthContext: User data cached in localStorage');
        logger.debug('💾 AuthContext: User ID:', userData.id);
      } catch (e) {
        logger.warn('⚠️ AuthContext: Failed to cache user data:', e);
}
      
      setUser(userData);
      logger.debug('✅ AuthContext: User state set:', userData);
}
    
    setAuthChecked(true);
    setLoading(false);
    
    logger.debug('✅ AuthContext: Auth response processed successfully!');
return { token: accessToken, refresh_token: refreshToken, user: userData };
  };

  const logout = () => {
    logger.debug('🚪 AuthContext: Logging out...');
    logger.debug('🚪 AuthContext: Stack trace:', new Error().stack);

    // Best-effort sign out from Firebase so Google session doesn't silently persist
    try {
      firebaseSignOut()
        .then(() => {
          logger.debug('✅ AuthContext: Firebase sign-out completed');
        })
        .catch((error) => {
          logger.warn('⚠️ AuthContext: Firebase sign-out failed (continuing logout):', error);
        });
    } catch (error) {
      logger.warn('⚠️ AuthContext: Error triggering Firebase sign-out (continuing logout):', error);
    }

    // Clear all auth-related data including refresh token
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('user_id');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('google_access_token');

    setUser(null);
    setAdmin(null);
  };

  const adminLogout = () => {
    localStorage.removeItem('admin_token');
    setAdmin(null);
  };

  // Google Sign-In
  const loginWithGoogle = async (googleData) => {
    try {
      logger.debug('📤 AuthContext: Sending Google sign-in to backend...', {
        email: googleData.email,
        name: googleData.name,
        uid: googleData.uid
      });
      
      const response = await api.post(`/auth/google-signin`, {
        firebase_token: googleData.firebaseToken,
        email: googleData.email,
        name: googleData.name,
        photo_url: googleData.photoURL,
        uid: googleData.uid,
        google_access_token: googleData.accessToken || null  // ✅ NEW: Google API access token
      });

      // Store access token for API calls (if provided)
      if (googleData.accessToken) {
        localStorage.setItem('google_access_token', googleData.accessToken);
        logger.debug('💾 AuthContext: Google access token stored');
      }

      logger.debug('✅ AuthContext: Backend response received:', response.status);
      logger.debug('📦 AuthContext: Response data:', response.data);
      
      // Use new helper function to handle auth response
      const result = handleAuthResponse(response.data);

      logger.debug('✅ AuthContext: Google Sign-In complete! User:', result.user?.email);
      logger.debug('🗂️ AuthContext: All localStorage keys:', Object.keys(localStorage));
      return result;
    } catch (error) {
      logger.error('❌ AuthContext: Google Sign-In failed:', error);
      logger.error('❌ AuthContext: Error response:', error.response?.data);
      logger.error('❌ AuthContext: Error status:', error.response?.status);
      throw error;
    }
  };

  // Note: 401 handling with automatic token refresh is now handled in api.js interceptor

  // Listen to Firebase auth state changes using onAuthStateChanged
  useEffect(() => {
    logger.debug('🔐 AuthContext: Setting up Firebase auth state listener...');
    const unsubscribe = onAuthChange((firebaseUser) => {
      logger.debug('🔐 AuthContext: Firebase auth state changed:', {
        hasUser: !!firebaseUser,
        email: firebaseUser?.email || null,
        uid: firebaseUser?.uid || null
      });
      
      // Firebase auth state changed - sync with backend if needed
      // Note: This doesn't auto-sign-in, just tracks Firebase auth state
      if (firebaseUser && !user) {
        logger.debug('🔐 AuthContext: Firebase user exists but no backend user - will sync on next action');
      } else if (!firebaseUser && user) {
        logger.debug('🔐 AuthContext: Firebase user logged out but backend user exists - may need to sync');
      }
    });

    // Cleanup listener on unmount
    return () => {
      logger.debug('🔐 AuthContext: Cleaning up Firebase auth state listener');
      unsubscribe();
    };
  }, [user]);

  // Check authentication status on app start
  useEffect(() => {
checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
logger.debug('🔍 AuthContext: checkAuthStatus() called');
    logger.debug('🔍 AuthContext: Current user state before check:', user ? user.email : 'null');
    
    // If user is already set, don't clear it during check
    if (user && localStorage.getItem('token')) {
      logger.debug('✅ AuthContext: User already authenticated, skipping re-check');
      setLoading(false);
      setAuthChecked(true);
return;
    }
    
    try {
      // Check user authentication
      const token = localStorage.getItem('token');
      logger.debug('🔍 AuthContext: Token in localStorage:', token ? `EXISTS (${token.substring(0, 20)}...)` : 'NULL');
      
      if (token) {
        // Instantly restore user from cache for faster UX
        const cachedUserData = localStorage.getItem('user_data');
        const cachedUserId = localStorage.getItem('user_id');
        
        if (cachedUserData && cachedUserId) {
          try {
            const userData = JSON.parse(cachedUserData);
            logger.debug('⚡ AuthContext: Restoring user from cache:', userData.email);
            logger.debug('⚡ AuthContext: User ID:', cachedUserId);
setUser(userData);  // Instant restoration
            setLoading(false);   // Remove loading state immediately
            logger.debug('✅ AuthContext: User restored from cache');
          } catch (e) {
            logger.warn('⚠️ AuthContext: Failed to parse cached user data:', e);
          }
        }
        
        // Then fetch fresh data from backend (background refresh)
        logger.debug('🔍 AuthContext: Fetching fresh user data from backend...');
await fetchUserData(token);
} else {
        logger.debug('ℹ️ AuthContext: No token found, user not logged in');
      }

      // Check admin authentication
      const adminToken = localStorage.getItem('admin_token');
      if (adminToken) {
        await fetchAdminData(adminToken);
      }
    } catch (error) {
      logger.error('❌ AuthContext: Auth check failed:', error);
const status = error.response?.status;
      const isNetworkError = !error.response;
      
      // Only clear token on actual auth failures (401/403)
      // Don't clear on network errors, timeouts, or server errors (might be transient)
      if (status === 401 || status === 403) {
        logger.debug('🗑️ AuthContext: Clearing tokens due to auth failure (401/403)');
        localStorage.removeItem('token');
        localStorage.removeItem('admin_token');
      } else {
        logger.warn('⚠️ AuthContext: Auth check failed but keeping token (might be network/server issue)');
        logger.warn('⚠️ AuthContext: Error type:', isNetworkError ? 'Network Error' : `HTTP ${status}`);
        // Keep token - might be transient error
      }
    } finally {
      setLoading(false);
      setAuthChecked(true);
      logger.debug('✅ AuthContext: checkAuthStatus() complete');
}
  };

  const fetchUserData = async (token) => {
    logger.debug('📡 AuthContext: fetchUserData() called');
    logger.debug('📡 AuthContext: Token param:', token ? `EXISTS (${token.substring(0, 20)}...)` : 'NULL');
    
    try {
      logger.debug('📡 AuthContext: Sending GET /api/me request...');
      const response = await api.get(`/me`);
      logger.debug('✅ AuthContext: GET /api/me response:', response.status);
      logger.debug('✅ AuthContext: User data:', response.data);
      
      // Update cache with fresh data
      try {
        localStorage.setItem('user_data', JSON.stringify(response.data));
        localStorage.setItem('user_id', response.data.id);
        logger.debug('💾 AuthContext: User cache updated with fresh data');
      } catch (e) {
        logger.warn('⚠️ AuthContext: Failed to update user cache:', e);
      }
      
      setUser(response.data);
    } catch (error) {
      logger.error('❌ AuthContext: Failed to fetch user data:', error);
      logger.error('❌ AuthContext: Error status:', error.response?.status);
      logger.error('❌ AuthContext: Error data:', error.response?.data);
      
      const status = error.response?.status;
      const isNetworkError = !error.response; // No response = network error
      
      // Only clear token on actual auth failures (401/403)
      // Don't clear on network errors, timeouts, or server errors (might be transient)
      if (status === 401 || status === 403) {
        logger.debug('🗑️ AuthContext: Removing all auth data due to auth failure (401/403)');
        localStorage.removeItem('token');
        localStorage.removeItem('user_data');
        localStorage.removeItem('user_id');
        setUser(null);
      } else {
        logger.warn('⚠️ AuthContext: Failed to fetch user data but keeping token (might be network/server issue)');
        logger.warn('⚠️ AuthContext: Error type:', isNetworkError ? 'Network Error' : `HTTP ${status}`);
        // Keep token - might be transient error, user can retry
      }
      throw error;
    }
  };

  const fetchAdminData = async (token) => {
    try {
      // For now, we'll decode the token client-side to get admin info
      // In production, you'd validate this server-side
      const payload = JSON.parse(atob(token.split('.')[1]));
      setAdmin({
        id: payload.admin_id,
        role: payload.role,
        username: 'admin' // This would come from a proper /admin/me endpoint
      });
    } catch (error) {
      logger.error('Failed to fetch admin data:', error);
      localStorage.removeItem('admin_token');
      setAdmin(null);
      throw error;
    }
  };

  const login = async (credentials) => {
try {
      logger.debug('🔐 AuthContext: Logging in with email...');

      // Try backend password auth first (fast path, avoids noisy Firebase failures)
      try {
const response = await api.post(`/auth/login`, credentials);
logger.debug('✅ AuthContext: Backend password login response received');
const result = handleAuthResponse(response.data);
logger.debug('✅ AuthContext: Login complete! User:', result.user?.email);
return result;
      } catch (backendError) {
        const backendStatus = backendError?.response?.status;
        // Only attempt Firebase fallback on auth failures.
        // For server/network errors, surface backend error directly.
        if (backendStatus !== 401 && backendStatus !== 400) {
          throw backendError;
        }
        logger.warn('⚠️ AuthContext: Backend password login failed, trying Firebase fallback');
      }

      // Fallback path: useful when password was changed via Firebase reset flow
      // and backend hash has not been synchronized yet.
      const { signInWithEmail } = await import('../lib/firebase');
      const firebaseResult = await signInWithEmail(credentials.email, credentials.password);
      const firebaseToken = firebaseResult.idToken;

const firebaseLoginResponse = await api.post(`/auth/firebase-login`, {
        firebase_token: firebaseToken,
        email: credentials.email
      });
logger.debug('✅ AuthContext: Firebase token login response received');
const result = handleAuthResponse(firebaseLoginResponse.data);
logger.debug('✅ AuthContext: Login complete via Firebase fallback! User:', result.user?.email);
return result;
    } catch (error) {
      logger.error('❌ AuthContext: Login failed:', error);
throw error;
    }
  };

  const register = async (userData) => {
    try {
      logger.debug('📝 AuthContext: Registering new user...');
      
      // First, create user in Firebase Auth (required for password reset to work)
      try {
        const { registerWithEmail } = await import('../lib/firebase');
        logger.debug('🔥 AuthContext: Creating user in Firebase Auth...');
        const firebaseResult = await registerWithEmail(userData.email, userData.password);
        logger.debug('✅ AuthContext: User created in Firebase Auth:', firebaseResult.user.email);
      } catch (firebaseError) {
        // If Firebase Auth creation fails, log but continue with backend registration
        // This allows the system to work even if Firebase Auth has issues
        logger.warn('⚠️ AuthContext: Firebase Auth registration failed (continuing with backend):', firebaseError.message);
        // Only throw if it's not a "user already exists" error (might be creating in backend first)
        if (firebaseError.code !== 'auth/email-already-in-use') {
          logger.warn('⚠️ AuthContext: User may not be able to use password reset feature');
        }
      }
      
      // Then register with backend (creates user in Firestore)
      const response = await api.post(`/auth/register`, userData);
      logger.debug('✅ AuthContext: Registration response received');
      
      // Use helper to handle auth response
      const result = handleAuthResponse(response.data);
      
      logger.debug('✅ AuthContext: Registration complete! User:', result.user?.email);
      return result;
    } catch (error) {
      logger.error('❌ AuthContext: Registration failed:', error);
      throw error;
    }
  };

  const adminLogin = async (credentials) => {
    try {
      const response = await api.post(`/admin/auth/login`, credentials);
      const { token, admin } = response.data;

      // Store admin token
      localStorage.setItem('admin_token', token);
      setAdmin(admin);

      return { token, admin };
    } catch (error) {
      logger.error('Admin login failed:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      await fetchUserData(token);
    }
  };

  // Update user data (for profile updates, settings changes, etc.)
  const updateUserData = (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    
    // Sync to localStorage
    try {
      localStorage.setItem('user_data', JSON.stringify(updatedUser));
      logger.debug('💾 AuthContext: User data updated in cache');
    } catch (e) {
      logger.warn('⚠️ AuthContext: Failed to update user cache:', e);
    }
  };

  const forgotPassword = async (email) => {
    try {
      logger.debug('📧 AuthContext: Requesting password reset for:', email);
      const response = await api.post(`/auth/forgot-password`, { email });
      logger.debug('✅ AuthContext: Password reset request successful');
      return response.data;
    } catch (error) {
      logger.error('❌ AuthContext: Password reset request failed:', error);
      throw error;
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      logger.debug('🔐 AuthContext: Resetting password with token');
      const response = await api.post(`/auth/reset-password`, {
        token,
        new_password: newPassword
      });
      logger.debug('✅ AuthContext: Password reset successful');
      return response.data;
    } catch (error) {
      logger.error('❌ AuthContext: Password reset failed:', error);
      throw error;
    }
  };

  const verifyResetOtp = async (email, otp) => {
    try {
      logger.debug('🔎 AuthContext: Verifying reset OTP for:', email);
      const response = await api.post(`/auth/verify-reset-otp`, { email, otp });
      logger.debug('✅ AuthContext: Reset OTP verified');
      return response.data;
    } catch (error) {
      logger.error('❌ AuthContext: Reset OTP verification failed:', error);
      throw error;
    }
  };

  const value = {
    user,
    admin,
    loading,
    authChecked,
    login,
    register,
    loginWithGoogle,
    adminLogin,
    logout,
    adminLogout,
    refreshUser,
    updateUserData,
    forgotPassword,
    verifyResetOtp,
    resetPassword,
    isAuthenticated: !!user,
    isAdmin: !!admin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
