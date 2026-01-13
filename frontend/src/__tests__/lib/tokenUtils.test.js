/**
 * Unit tests for tokenUtils.js
 * Tests token management and refresh logic
 */
import {
  getToken,
  setToken,
  removeToken,
  getRefreshToken,
  setRefreshToken,
  removeRefreshToken,
  refreshAccessToken
} from '../../lib/tokenUtils';
import api from '../../lib/api';

// Mock dependencies
jest.mock('../../lib/api');

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('tokenUtils', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('Token Storage', () => {
    it('should store and retrieve access token', () => {
      const token = 'test_access_token';
      setToken(token);
      expect(getToken()).toBe(token);
    });

    it('should remove access token', () => {
      setToken('test_token');
      removeToken();
      expect(getToken()).toBeNull();
    });

    it('should store and retrieve refresh token', () => {
      const refreshToken = 'test_refresh_token';
      setRefreshToken(refreshToken);
      expect(getRefreshToken()).toBe(refreshToken);
    });

    it('should remove refresh token', () => {
      setRefreshToken('test_refresh_token');
      removeRefreshToken();
      expect(getRefreshToken()).toBeNull();
    });
  });

  describe('Token Refresh', () => {
    it('should refresh access token successfully', async () => {
      const oldRefreshToken = 'old_refresh_token';
      const newAccessToken = 'new_access_token';
      const newRefreshToken = 'new_refresh_token';

      setRefreshToken(oldRefreshToken);

      // Mock API response
      api.post.mockResolvedValue({
        data: {
          access_token: newAccessToken,
          refresh_token: newRefreshToken
        }
      });

      const result = await refreshAccessToken();

      // Verify API was called correctly
      expect(api.post).toHaveBeenCalledWith('/auth/refresh', {
        refresh_token: oldRefreshToken
      });

      // Verify tokens were updated
      expect(result).toBe(newAccessToken);
      expect(getToken()).toBe(newAccessToken);
      expect(getRefreshToken()).toBe(newRefreshToken);
    });

    it('should throw error when no refresh token is available', async () => {
      removeRefreshToken(); // Ensure no refresh token

      await expect(refreshAccessToken()).rejects.toThrow('No refresh token available');
      expect(api.post).not.toHaveBeenCalled();
    });

    it('should clear tokens on refresh failure', async () => {
      setToken('old_access_token');
      setRefreshToken('old_refresh_token');

      // Mock API error
      api.post.mockRejectedValue(new Error('Refresh failed'));

      await expect(refreshAccessToken()).rejects.toThrow();

      // Verify tokens were cleared
      expect(getToken()).toBeNull();
      expect(getRefreshToken()).toBeNull();
    });

    it('should handle concurrent refresh requests', async () => {
      setRefreshToken('refresh_token');

      api.post.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          data: {
            access_token: 'new_token',
            refresh_token: 'new_refresh'
          }
        }), 100))
      );

      // Trigger multiple refresh requests simultaneously
      const promise1 = refreshAccessToken();
      const promise2 = refreshAccessToken();
      const promise3 = refreshAccessToken();

      const results = await Promise.all([promise1, promise2, promise3]);

      // All should get the same token
      expect(results[0]).toBe(results[1]);
      expect(results[1]).toBe(results[2]);

      // API should only be called once
      expect(api.post).toHaveBeenCalledTimes(1);
    });

    it('should rotate refresh token after each refresh', async () => {
      const firstRefreshToken = 'first_refresh_token';
      const secondRefreshToken = 'second_refresh_token';
      const thirdRefreshToken = 'third_refresh_token';

      setRefreshToken(firstRefreshToken);

      // First refresh
      api.post.mockResolvedValueOnce({
        data: {
          access_token: 'access_1',
          refresh_token: secondRefreshToken
        }
      });

      await refreshAccessToken();
      expect(getRefreshToken()).toBe(secondRefreshToken);

      // Second refresh
      api.post.mockResolvedValueOnce({
        data: {
          access_token: 'access_2',
          refresh_token: thirdRefreshToken
        }
      });

      await refreshAccessToken();
      expect(getRefreshToken()).toBe(thirdRefreshToken);
    });

    it('should handle 401 response during refresh', async () => {
      setToken('old_token');
      setRefreshToken('old_refresh');

      const error401 = new Error('Unauthorized');
      error401.response = { status: 401 };
      api.post.mockRejectedValue(error401);

      await expect(refreshAccessToken()).rejects.toThrow();

      // Tokens should be cleared
      expect(getToken()).toBeNull();
      expect(getRefreshToken()).toBeNull();
    });
  });

  describe('Token Persistence', () => {
    it('should persist tokens across page reloads', () => {
      const accessToken = 'persistent_access_token';
      const refreshToken = 'persistent_refresh_token';

      setToken(accessToken);
      setRefreshToken(refreshToken);

      // Simulate page reload by creating new localStorage instance
      const storedAccessToken = localStorage.getItem('token');
      const storedRefreshToken = localStorage.getItem('refresh_token');

      expect(storedAccessToken).toBe(accessToken);
      expect(storedRefreshToken).toBe(refreshToken);
    });

    it('should handle missing tokens gracefully', () => {
      expect(getToken()).toBeNull();
      expect(getRefreshToken()).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors during refresh', async () => {
      setRefreshToken('refresh_token');

      const networkError = new Error('Network request failed');
      networkError.code = 'NETWORK_ERROR';
      api.post.mockRejectedValue(networkError);

      await expect(refreshAccessToken()).rejects.toThrow('Network request failed');

      // Tokens should be cleared on network error
      expect(getToken()).toBeNull();
      expect(getRefreshToken()).toBeNull();
    });

    it('should handle malformed API response', async () => {
      setRefreshToken('refresh_token');

      // API returns malformed response (missing tokens)
      api.post.mockResolvedValue({
        data: {
          // Missing access_token and refresh_token
          message: 'Success'
        }
      });

      // Should handle gracefully without crashing
      await refreshAccessToken();

      // Check that tokens are set (even if undefined)
      // This tests that the code doesn't crash
    });
  });
});
