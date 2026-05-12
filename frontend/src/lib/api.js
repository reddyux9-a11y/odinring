import axios from 'axios';
import { decrementInFlight, incrementInFlight } from './apiLoading';
import { getAccessToken, getRefreshToken, setAuthTokens, clearAuthTokens } from './authTokenStore';
import { shouldRefreshToken } from './tokenUtils';

const baseURL = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

// Token refresh state management
let isRefreshing = false;
let refreshSubscribers = [];

// Callback registered by AuthContext so api.js can trigger a full logout
// when refresh fails (clears user state, not just tokens).
let onAuthFailure = null;
export const setOnAuthFailure = (callback) => { onAuthFailure = callback; };

/**
 * Subscribe to token refresh completion
 * @param {Function} callback - Function to call when token is refreshed
 */
const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

/**
 * Notify all subscribers that token has been refreshed
 * @param {string} token - New access token
 */
const onTokenRefreshed = (token) => {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
};

/**
 * Refresh access token using refresh token
 * @returns {Promise<string>} New access token
 */
export const refreshAccessToken = async () => {
  try {
    const refreshToken = getRefreshToken();
    // Create a new axios instance to avoid interceptors
    const response = await axios.post(
      `${baseURL}/auth/refresh`,
      refreshToken ? { refresh_token: refreshToken } : {},
      { withCredentials: true }
    );
    
    const { access_token, refresh_token: new_refresh_token } = response.data;
    
    if (!access_token) {
      throw new Error('No access token in refresh response');
    }
    
    setAuthTokens({
      access_token,
      refresh_token: new_refresh_token || refreshToken || null,
    });
    return access_token;
  } catch (error) {
    const status = error.response?.status;
    // Backend clears invalid/expired token cookies.
    
    // Only redirect if we're not already on auth pages
    // NOTE: Do NOT use window.location.href as it causes full page reload
    // Instead, let the auth context handle the redirect via React Router
    if (typeof window !== 'undefined' && 
        !window.location.pathname.match(/^\/(login|signup|auth)/)) {
      // Don't redirect here - let ProtectedRoute handle it via React Router
      // This prevents full page reload
    }
    
    throw error;
  }
};

// Request interceptor - Attach token, proactively refreshing if near expiry
api.interceptors.request.use(
  async (config) => {
    try {
      incrementInFlight();
      config._inFlightTracked = true;
    } catch {
      // non-blocking
    }

    // Auth endpoints never need a token injected
    if (config.url?.includes('/auth/')) {
      return config;
    }

    const token = getAccessToken();

    // Proactively refresh when another refresh is already running — queue behind it
    if (isRefreshing) {
      const freshToken = await new Promise((resolve) => subscribeTokenRefresh(resolve));
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${freshToken}`;
      return config;
    }

    // Proactively refresh when the token is expired or within 5 minutes of expiry.
    // This prevents 401s entirely instead of relying on the reactive retry path.
    if (token && shouldRefreshToken(token)) {
      isRefreshing = true;
      try {
        const newToken = await refreshAccessToken();
        isRefreshing = false;
        onTokenRefreshed(newToken);
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${newToken}`;
      } catch {
        isRefreshing = false;
        // Fall through with the old token; the 401 handler will fire
        if (token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    }

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    try {
      if (error?.config?._inFlightTracked) decrementInFlight();
    } catch {
      // non-blocking
    }
    return Promise.reject(error);
  }
);

// Response interceptor - Handle 401 errors with automatic token refresh
api.interceptors.response.use(
  (response) => {
    try {
      if (response?.config?._inFlightTracked) decrementInFlight();
    } catch {
      // non-blocking
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    try {
      if (originalRequest?._inFlightTracked) decrementInFlight();
    } catch {
      // non-blocking
    }
    
    // Check if error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Attempt token refresh
      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        const newToken = await refreshAccessToken();
        isRefreshing = false;

        onTokenRefreshed(newToken);

        if (newToken) {
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        // Clear tokens AND notify AuthContext to clear user state + redirect to login.
        // Without this, the app appears logged-in but every API call fails silently.
        clearAuthTokens();
        onAuthFailure?.();
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Password reset functions
export const forgotPassword = async (email) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

export const resetPassword = async (token, newPassword) => {
  const response = await api.post('/auth/reset-password', { token, new_password: newPassword });
  return response.data;
};

export default api;


