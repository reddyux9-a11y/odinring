/**
 * Token Utilities
 * Handles JWT token expiration checks and validation
 */

/**
 * Decode JWT token without verification
 * @param {string} token - JWT token
 * @returns {object|null} Decoded token payload or null if invalid
 */
export const decodeToken = (token) => {
  if (!token) return null;
  
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('❌ Failed to decode token:', error);
    return null;
  }
};

/**
 * Check if token is expired
 * @param {string} token - JWT token
 * @returns {boolean} True if token is expired or invalid
 */
export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return true;
    
    const currentTime = Date.now() / 1000;
    
    // Token expires in less than 1 minute - consider it expired
    return decoded.exp < (currentTime + 60);
  } catch {
    return true;
  }
};

/**
 * Check if token should be refreshed
 * @param {string} token - JWT token
 * @returns {boolean} True if token should be refreshed (expires in < 5 minutes)
 */
export const shouldRefreshToken = (token) => {
  if (!token) return false;
  
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return false;
    
    const currentTime = Date.now() / 1000;
    
    // Refresh if token expires in less than 5 minutes
    return decoded.exp < (currentTime + 300);
  } catch {
    return false;
  }
};

/**
 * Get token expiration time
 * @param {string} token - JWT token
 * @returns {Date|null} Expiration date or null if invalid
 */
export const getTokenExpiration = (token) => {
  if (!token) return null;
  
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return null;
    
    return new Date(decoded.exp * 1000);
  } catch {
    return null;
  }
};

/**
 * Get token info for debugging
 * @param {string} token - JWT token
 * @returns {object} Token information
 */
export const getTokenInfo = (token) => {
  if (!token) {
    return {
      valid: false,
      expired: true,
      expiresAt: null,
      timeUntilExpiry: null
    };
  }
  
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) {
      return {
        valid: false,
        expired: true,
        expiresAt: null,
        timeUntilExpiry: null
      };
    }
    
    const expiresAt = new Date(decoded.exp * 1000);
    const now = new Date();
    const timeUntilExpiry = expiresAt - now;
    const expired = timeUntilExpiry <= 0;
    
    return {
      valid: true,
      expired,
      expiresAt,
      timeUntilExpiry,
      timeUntilExpiryMinutes: Math.floor(timeUntilExpiry / 60000),
      userId: decoded.user_id || decoded.sub,
      issuedAt: decoded.iat ? new Date(decoded.iat * 1000) : null
    };
  } catch (error) {
    console.error('❌ Failed to get token info:', error);
    return {
      valid: false,
      expired: true,
      expiresAt: null,
      timeUntilExpiry: null
    };
  }
};

