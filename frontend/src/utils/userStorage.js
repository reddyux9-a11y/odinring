/**
 * User Storage Utility Functions
 * 
 * Provides easy access to user data stored in localStorage.
 * These functions allow components to quickly access user information
 * without needing to use the AuthContext.
 */

/**
 * Get the current user's ID
 * @returns {string|null} User ID or null if not logged in
 */
export const getUserId = () => {
  try {
    // Fast path: Check localStorage first
    const cachedId = localStorage.getItem('user_id');
    if (cachedId) {
      return cachedId;
    }
    
    // Fallback: Parse from user_data
    const userData = localStorage.getItem('user_data');
    if (userData) {
      const parsed = JSON.parse(userData);
      return parsed?.id || null;
    }
    
    return null;
  } catch (error) {
    console.error('getUserId: Error reading user ID:', error);
    return null;
  }
};

/**
 * Get the full user data object
 * @returns {Object|null} User data object or null if not logged in
 */
export const getUserData = () => {
  try {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      return JSON.parse(userData);
    }
    return null;
  } catch (error) {
    console.error('getUserData: Error parsing user data:', error);
    return null;
  }
};

/**
 * Check if user is logged in
 * @returns {boolean} True if user is logged in
 */
export const isUserLoggedIn = () => {
  try {
    const hasToken = !!localStorage.getItem('token');
    const hasUserId = !!localStorage.getItem('user_id');
    return hasToken && hasUserId;
  } catch (error) {
    console.error('isUserLoggedIn: Error checking login status:', error);
    return false;
  }
};

/**
 * Get user's email
 * @returns {string|null} User email or null
 */
export const getUserEmail = () => {
  try {
    const userData = getUserData();
    return userData?.email || null;
  } catch (error) {
    console.error('getUserEmail: Error getting email:', error);
    return null;
  }
};

/**
 * Get user's display name
 * @returns {string|null} User name or null
 */
export const getUserName = () => {
  try {
    const userData = getUserData();
    return userData?.name || null;
  } catch (error) {
    console.error('getUserName: Error getting name:', error);
    return null;
  }
};

/**
 * Get user's username
 * @returns {string|null} Username or null
 */
export const getUsername = () => {
  try {
    const userData = getUserData();
    return userData?.username || null;
  } catch (error) {
    console.error('getUsername: Error getting username:', error);
    return null;
  }
};

/**
 * Get user's avatar URL
 * @returns {string|null} Avatar URL or null
 */
export const getUserAvatar = () => {
  try {
    const userData = getUserData();
    return userData?.avatar || null;
  } catch (error) {
    console.error('getUserAvatar: Error getting avatar:', error);
    return null;
  }
};

/**
 * Get user's ring ID
 * @returns {string|null} Ring ID or null
 */
export const getUserRingId = () => {
  try {
    const userData = getUserData();
    return userData?.ring_id || null;
  } catch (error) {
    console.error('getUserRingId: Error getting ring ID:', error);
    return null;
  }
};

/**
 * Validate user cache integrity
 * @returns {Object} Validation result with status and reason
 */
export const validateUserCache = () => {
  try {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user_data');
    const userId = localStorage.getItem('user_id');
    
    if (!token) {
      return { valid: false, reason: 'no_token' };
    }
    
    if (!userData) {
      return { valid: false, reason: 'no_user_data' };
    }
    
    if (!userId) {
      return { valid: false, reason: 'no_user_id' };
    }
    
    // Parse and validate user data structure
    const parsed = JSON.parse(userData);
    
    if (!parsed.id) {
      return { valid: false, reason: 'missing_id_in_data' };
    }
    
    if (parsed.id !== userId) {
      return { valid: false, reason: 'id_mismatch' };
    }
    
    if (!parsed.email) {
      return { valid: false, reason: 'missing_email' };
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, reason: 'parse_error', error: error.message };
  }
};

/**
 * Get comprehensive user persistence state for debugging
 * @returns {Object} Complete state object
 */
export const getUserPersistenceState = () => {
  try {
    const validation = validateUserCache();
    
    return {
      hasToken: !!localStorage.getItem('token'),
      hasUserData: !!localStorage.getItem('user_data'),
      hasUserId: !!localStorage.getItem('user_id'),
      userId: localStorage.getItem('user_id'),
      cacheValid: validation.valid,
      cacheValidationReason: validation.reason || 'valid',
      isLoggedIn: isUserLoggedIn(),
      userData: getUserData(),
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      error: true,
      message: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};

/**
 * Clear all user data from localStorage (for logout)
 * @returns {boolean} True if successful
 */
export const clearUserData = () => {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('user_id');
    console.log('✅ User data cleared from localStorage');
    return true;
  } catch (error) {
    console.error('clearUserData: Error clearing user data:', error);
    return false;
  }
};

/**
 * Debug: Log current user persistence state to console
 */
export const debugUserPersistence = () => {
  const state = getUserPersistenceState();
  console.log('🔍 User Persistence Debug:', state);
  return state;
};

// Export all functions as default object for convenience
export default {
  getUserId,
  getUserData,
  isUserLoggedIn,
  getUserEmail,
  getUserName,
  getUsername,
  getUserAvatar,
  getUserRingId,
  validateUserCache,
  getUserPersistenceState,
  clearUserData,
  debugUserPersistence,
};


