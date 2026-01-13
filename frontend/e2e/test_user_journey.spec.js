/**
 * End-to-End Tests for User Journey
 * 
 * Tests complete user flows using Playwright
 */
import { test, expect } from '@playwright/test';

test.describe('User Registration and Profile Flow', () => {
  test('complete user registration and profile setup', async ({ page }) => {
    // Navigate to registration page
    await page.goto('http://localhost:3000/auth');
    
    // Fill registration form
    await page.fill('input[name="email"]', 'e2e-test@example.com');
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.fill('input[name="username"]', 'e2etest');
    await page.fill('input[name="name"]', 'E2E Test User');
    
    // Submit registration
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Verify dashboard is loaded
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('user can create and manage links', async ({ page }) => {
    // Assume user is logged in (would need auth setup)
    await page.goto('http://localhost:3000/dashboard');
    
    // Click add link button
    await page.click('button:has-text("Add Link")');
    
    // Fill link form
    await page.fill('input[name="title"]', 'E2E Test Link');
    await page.fill('input[name="url"]', 'https://example.com');
    
    // Save link
    await page.click('button:has-text("Save")');
    
    // Verify link appears in list
    await expect(page.locator('text=E2E Test Link')).toBeVisible();
  });

  test('user can view public profile', async ({ page }) => {
    await page.goto('http://localhost:3000/profile/testuser');
    
    // Verify profile elements
    await expect(page.locator('text=Test User')).toBeVisible();
  });
});

test.describe('Authentication Flow', () => {
  test('user can login with email and password', async ({ page }) => {
    await page.goto('http://localhost:3000/auth');
    
    // Switch to login tab
    await page.click('button:has-text("Login")');
    
    // Fill login form
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    
    // Submit login
    await page.click('button[type="submit"]');
    
    // Verify redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  });

  test('user can logout', async ({ page }) => {
    // Assume logged in
    await page.goto('http://localhost:3000/dashboard');
    
    // Click logout
    await page.click('button:has-text("Logout")');
    
    // Verify redirect to auth page
    await page.waitForURL('**/auth', { timeout: 5000 });
  });
});

test.describe('Mobile Responsiveness', () => {
  test('dashboard is responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('http://localhost:3000/dashboard');
    
    // Verify mobile layout
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });
});


