/**
 * E2E tests for token refresh functionality
 */
const { test, expect } = require('@playwright/test');

test.describe('Token Refresh Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to auth page
    await page.goto('/auth');
  });

  test('should automatically refresh token on 401', async ({ page }) => {
    // Mock API responses
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock_access_token',
          refresh_token: 'mock_refresh_token',
          user: {
            id: 'user_123',
            email: 'test@example.com',
            name: 'Test User'
          }
        })
      });
    });

    // Login
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard');

    // Mock 401 response for first request
    let requestCount = 0;
    await page.route('**/api/me', async (route) => {
      requestCount++;
      if (requestCount === 1) {
        // First request: 401
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Token expired' })
        });
      } else {
        // After refresh: 200
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'user_123',
            email: 'test@example.com',
            name: 'Test User'
          })
        });
      }
    });

    // Mock refresh endpoint
    await page.route('**/api/auth/refresh', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'new_access_token',
          refresh_token: 'new_refresh_token'
        })
      });
    });

    // Trigger API call that will get 401
    await page.evaluate(() => {
      return fetch('/api/me', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
    });

    // Verify refresh was called
    await page.waitForResponse(response => 
      response.url().includes('/api/auth/refresh') && response.status() === 200
    );

    // Verify new token was stored
    const newToken = await page.evaluate(() => localStorage.getItem('token'));
    expect(newToken).toBe('new_access_token');
  });

  test('should queue multiple requests during refresh', async ({ page }) => {
    // Login first
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock_token',
          refresh_token: 'mock_refresh',
          user: { id: '123', email: 'test@example.com' }
        })
      });
    });

    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Track refresh calls
    let refreshCallCount = 0;
    await page.route('**/api/auth/refresh', async (route) => {
      refreshCallCount++;
      // Simulate slow refresh
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'new_token',
          refresh_token: 'new_refresh'
        })
      });
    });

    // Mock 401 for first call, then 200
    let apiCallCount = 0;
    await page.route('**/api/me', async (route) => {
      apiCallCount++;
      if (apiCallCount === 1) {
        await route.fulfill({ status: 401 });
      } else {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ id: '123' })
        });
      }
    });

    // Make multiple simultaneous API calls
    await page.evaluate(() => {
      Promise.all([
        fetch('/api/me'),
        fetch('/api/me'),
        fetch('/api/me')
      ]);
    });

    // Wait for refresh to complete
    await page.waitForTimeout(2000);

    // Verify refresh was called only once (not 3 times)
    expect(refreshCallCount).toBe(1);
  });

  test('should redirect to login on refresh failure', async ({ page }) => {
    // Login
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          access_token: 'token',
          refresh_token: 'refresh',
          user: { id: '123', email: 'test@example.com' }
        })
      });
    });

    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Mock 401 for API call
    await page.route('**/api/me', async (route) => {
      await route.fulfill({ status: 401 });
    });

    // Mock refresh failure
    await page.route('**/api/auth/refresh', async (route) => {
      await route.fulfill({
        status: 401,
        body: JSON.stringify({ detail: 'Refresh token invalid' })
      });
    });

    // Trigger API call
    await page.evaluate(() => fetch('/api/me'));

    // Should redirect to login
    await page.waitForURL('**/login', { timeout: 5000 });

    // Verify tokens were cleared
    const token = await page.evaluate(() => localStorage.getItem('token'));
    const refreshToken = await page.evaluate(() => localStorage.getItem('refresh_token'));
    
    expect(token).toBeNull();
    expect(refreshToken).toBeNull();
  });
});

test.describe('Proactive Token Refresh', () => {
  test('should proactively refresh expiring token', async ({ page }) => {
    await page.goto('/auth');

    // Login with token expiring soon
    const soonToExpireToken = createTokenExpiringSoon(4); // 4 minutes
    
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          access_token: soonToExpireToken,
          refresh_token: 'refresh_token',
          user: { id: '123', email: 'test@example.com' }
        })
      });
    });

    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Mock refresh endpoint
    await page.route('**/api/auth/refresh', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          access_token: 'new_fresh_token',
          refresh_token: 'new_refresh'
        })
      });
    });

    // Make an API call - should trigger proactive refresh
    await page.evaluate(() => fetch('/api/me'));

    // Verify refresh was called
    await page.waitForResponse(response => 
      response.url().includes('/api/auth/refresh')
    );
  });
});

// Helper function to create token expiring soon
function createTokenExpiringSoon(minutes) {
  const exp = Math.floor(Date.now() / 1000) + (minutes * 60);
  const payload = { user_id: '123', exp };
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
  return `header.${base64Payload}.signature`;
}

