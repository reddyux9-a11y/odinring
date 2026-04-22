import axios from 'axios';
import { isTokenExpired, shouldRefreshToken } from './tokenUtils';
import { decrementInFlight, incrementInFlight } from './apiLoading';

const baseURL = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const api = axios.create({ baseURL });

// Token refresh state management
let isRefreshing = false;
let refreshSubscribers = [];

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
  const refreshToken = localStorage.getItem('refresh_token');
  
  if (!refreshToken) {
    // Silent failure - user just isn't logged in or session expired
    // Clear any stale tokens
    localStorage.removeItem('token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('user_id');
    
    throw new Error('No refresh token available');
  }
  
  try {
    // Create a new axios instance to avoid interceptors
    const response = await axios.post(`${baseURL}/auth/refresh`, {
      refresh_token: refreshToken
    });
    
    const { access_token, refresh_token: new_refresh_token } = response.data;
    
    if (!access_token) {
      throw new Error('No access token in refresh response');
    }
    
    // Store new tokens
    localStorage.setItem('token', access_token);
    
    if (new_refresh_token) {
      localStorage.setItem('refresh_token', new_refresh_token);
    }
    
    return access_token;
  } catch (error) {
    const status = error.response?.status;
    const isNetworkError = !error.response;
    
    // Only clear tokens if refresh token is invalid (401/403)
    // Don't clear on network errors - might be transient
    if (status === 401 || status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_data');
      localStorage.removeItem('user_id');
    } else {
      // Keep tokens - might be transient error
    }
    
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

// Request interceptor - Attach token to requests
api.interceptors.request.use(
  async (config) => {
    // Track in-flight requests for global loader UX.
    // Mark config so we only decrement what we incremented.
    try {
      incrementInFlight();
      config._inFlightTracked = true;
    } catch {
      // non-blocking
    }

    // Skip token check for auth endpoints
    if (config.url?.includes('/auth/')) {
      return config;
    }
    
    const token = localStorage.getItem('token');
    // Check if token needs refresh (proactive refresh)
    if (token && shouldRefreshToken(token) && !isRefreshing) {
      const refreshToken = localStorage.getItem('refresh_token');
      
      // Only attempt refresh if we have a refresh token
      if (refreshToken) {
        try {
          const newToken = await refreshAccessToken();
          config.headers.Authorization = `Bearer ${newToken}`;
          return config;
        } catch (error) {
          // Continue with existing token
        }
      } else {
        // Continue with existing token, will fail if truly expired
      }
    }
    
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // Only warn for protected routes, not for public routes like password reset
      const isPublicRoute = config.url?.includes('/auth/forgot-password') || 
                           config.url?.includes('/auth/reset-password') ||
                           config.url?.includes('/auth/register') ||
                           config.url?.includes('/auth/login');
      
      if (!isPublicRoute) {
        // Suppress warning for password reset related routes
        const isPasswordResetRoute = window.location.pathname.includes('/forgot-password') ||
                                    window.location.pathname.includes('/reset-password') ||
                                    window.location.pathname.includes('/auth');
        
        if (!isPasswordResetRoute) {
          // Request will be sent without Authorization header
        }
      }
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
      // Check if we have a refresh token before attempting refresh
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (!refreshToken) {
        isRefreshing = false;
        return Promise.reject(error);
      }
      
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
        
        // Notify all queued requests
        onTokenRefreshed(newToken);
        
        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        
        const status = refreshError.response?.status;
        const isNetworkError = !refreshError.response;
        
        // Only clear tokens if refresh token is invalid (401/403)
        // Don't clear on network errors - might be transient
        if (status === 401 || status === 403) {
          // Clear auth state - ProtectedRoute will handle redirect via React Router
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user_data');
          localStorage.removeItem('user_id');
        } else {
          // Keep tokens - might be transient network error, can retry later
        }
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


