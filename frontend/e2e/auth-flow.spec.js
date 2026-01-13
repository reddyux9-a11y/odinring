/**
 * E2E tests for complete authentication flow
 * Tests registration, login, token refresh, and logout
 */
const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3000';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
  });

  test('should complete full registration flow', async ({ page }) => {
    // Navigate to auth page
    await page.goto('/auth');

    // Fill registration form
    await page.fill('input[name="email"]', `test${Date.now()}@example.com`);
    await page.fill('input[name="username"]', `testuser${Date.now()}`);
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="password"]', 'SecurePassword123!');

    // Submit registration
    await page.click('button[type="submit"]');

    // Should redirect to onboarding or dashboard
    await expect(page).toHaveURL(/\/(onboarding|dashboard)/);

    // Verify tokens are stored
    const token = await page.evaluate(() => localStorage.getItem('token'));
    const refreshToken = await page.evaluate(() => localStorage.getItem('refresh_token'));

    expect(token).toBeTruthy();
    expect(refreshToken).toBeTruthy();
  });

  test('should login existing user', async ({ page }) => {
    // Navigate to login page
    await page.goto('/auth');

    // Fill login form
    await page.fill('input[name="email"]', 'existing@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');

    // Click login button
    await page.click('button:has-text("Login")');

    // Wait for redirect
    await page.waitForURL(/\/(dashboard|onboarding)/);

    // Verify user is logged in
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();
  });

  test('should handle invalid login credentials', async ({ page }) => {
    await page.goto('/auth');

    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'WrongPassword');

    await page.click('button:has-text("Login")');

    // Should show error message
    await expect(page.locator('text=/Invalid|Error|Failed/')).toBeVisible({ timeout: 5000 });

    // Should not redirect
    await expect(page).toHaveURL(/\/auth/);
  });
});

test.describe('Token Refresh', () => {
  test.beforeEach(async ({ page }) => {
    // Set up authenticated state with near-expiring token
    await page.goto('/auth');
    
    // Create a token that expires soon
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEyMyIsInNlc3Npb25faWQiOiJzZXNzaW9uXzEyMyIsImV4cCI6MTY3MDAwMDAwMH0.mock_signature';
    const mockRefreshToken = 'mock_refresh_token';

    await page.evaluate(({ token, refreshToken }) => {
      localStorage.setItem('token', token);
      localStorage.setItem('refresh_token', refreshToken);
    }, { token: mockToken, refreshToken: mockRefreshToken });
  });

  test('should automatically refresh expired token', async ({ page, context }) => {
    // Mock the refresh endpoint
    await context.route('**/api/auth/refresh', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'new_access_token',
          refresh_token: 'new_refresh_token'
        })
      });
    });

    // Navigate to protected page (should trigger refresh)
    await page.goto('/dashboard');

    // Wait for refresh to complete
    await page.waitForTimeout(1000);

    // Verify new tokens are stored
    const newToken = await page.evaluate(() => localStorage.getItem('token'));
    const newRefreshToken = await page.evaluate(() => localStorage.getItem('refresh_token'));

    expect(newToken).toBe('new_access_token');
    expect(newRefreshToken).toBe('new_refresh_token');
  });

  test('should logout on failed token refresh', async ({ page, context }) => {
    // Mock failed refresh
    await context.route('**/api/auth/refresh', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Invalid refresh token' })
      });
    });

    await page.goto('/dashboard');

    // Should redirect to auth page
    await expect(page).toHaveURL(/\/auth/, { timeout: 5000 });

    // Tokens should be cleared
    const token = await page.evaluate(() => localStorage.getItem('token'));
    const refreshToken = await page.evaluate(() => localStorage.getItem('refresh_token'));

    expect(token).toBeNull();
    expect(refreshToken).toBeNull();
  });
});

test.describe('Identity Context', () => {
  test('should resolve personal account identity', async ({ page, context }) => {
    // Mock login
    await context.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'mock_token',
          refresh_token: 'mock_refresh',
          user: {
            id: 'user_123',
            email: 'personal@example.com',
            username: 'personaluser'
          }
        })
      });
    });

    // Mock identity context
    await context.route('**/api/me/context', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          authenticated: true,
          account_type: 'personal',
          profile_id: 'user_123',
          business_id: null,
          organization_id: null,
          subscription: {
            status: 'trial',
            plan: 'personal'
          },
          next_route: '/dashboard/personal'
        })
      });
    });

    await page.goto('/auth');
    await page.fill('input[name="email"]', 'personal@example.com');
    await page.fill('input[name="password"]', 'Test123!');
    await page.click('button:has-text("Login")');

    // Should show personal dashboard
    await page.waitForURL(/\/dashboard/);

    // Verify account type is displayed
    await expect(page.locator('text=/Personal Account|personal/i')).toBeVisible();
  });

  test('should resolve business account identity', async ({ page, context }) => {
    // Mock business identity
    await context.route('**/api/me/context', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          authenticated: true,
          account_type: 'business_solo',
          profile_id: 'user_123',
          business_id: 'business_456',
          organization_id: null,
          subscription: {
            status: 'active',
            plan: 'solo'
          },
          next_route: '/dashboard/business'
        })
      });
    });

    await page.goto('/dashboard');

    // Should show business indicators
    await expect(page.locator('text=/Business|Solo Business/i')).toBeVisible();
  });

  test('should handle expired subscription', async ({ page, context }) => {
    await context.route('**/api/me/context', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          authenticated: true,
          account_type: 'personal',
          profile_id: 'user_123',
          subscription: {
            status: 'expired',
            plan: 'personal'
          },
          next_route: '/billing'
        })
      });
    });

    await page.goto('/dashboard');

    // Should redirect to billing
    await expect(page).toHaveURL(/\/billing/);

    // Should show subscription expired message
    await expect(page.locator('text=/expired|renew|subscription/i')).toBeVisible();
  });
});

test.describe('Logout Flow', () => {
  test.beforeEach(async ({ page, context }) => {
    // Set up authenticated state
    await page.goto('/auth');

    await page.evaluate(() => {
      localStorage.setItem('token', 'mock_token');
      localStorage.setItem('refresh_token', 'mock_refresh');
      localStorage.setItem('user_data', JSON.stringify({
        id: 'user_123',
        email: 'test@example.com'
      }));
    });

    // Mock logout endpoint
    await context.route('**/api/auth/logout', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Logged out successfully' })
      });
    });
  });

  test('should logout user and clear tokens', async ({ page }) => {
    await page.goto('/dashboard');

    // Click logout button
    await page.click('button:has-text("Logout")');

    // Should redirect to auth page
    await expect(page).toHaveURL(/\/auth/);

    // Tokens should be cleared
    const token = await page.evaluate(() => localStorage.getItem('token'));
    const refreshToken = await page.evaluate(() => localStorage.getItem('refresh_token'));
    const userData = await page.evaluate(() => localStorage.getItem('user_data'));

    expect(token).toBeNull();
    expect(refreshToken).toBeNull();
    expect(userData).toBeNull();
  });
});

test.describe('Session Management', () => {
  test('should maintain session across page navigation', async ({ page }) => {
    // Set authenticated state
    await page.evaluate(() => {
      localStorage.setItem('token', 'valid_token');
      localStorage.setItem('refresh_token', 'valid_refresh');
    });

    // Navigate through multiple pages
    await page.goto('/dashboard');
    await page.goto('/dashboard/settings');
    await page.goto('/dashboard/analytics');

    // Session should persist
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();

    // User should remain logged in
    await expect(page).not.toHaveURL(/\/auth/);
  });

  test('should handle concurrent requests with same token', async ({ page, context }) => {
    await page.evaluate(() => {
      localStorage.setItem('token', 'valid_token');
      localStorage.setItem('refresh_token', 'valid_refresh');
    });

    // Mock API endpoints
    await context.route('**/api/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'user_123', email: 'test@example.com' })
      });
    });

    await context.route('**/api/links', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    await page.goto('/dashboard');

    // Multiple API calls should succeed
    await expect(page.locator('text=/Dashboard|Welcome/i')).toBeVisible();
  });
});








