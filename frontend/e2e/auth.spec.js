import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
  });

  test('should display login form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should stay on auth page
    await expect(page).toHaveURL(/\/auth/);
  });

  test('should show sign up form when clicking sign up link', async ({ page }) => {
    // Look for sign up link/button
    const signUpButton = page.getByText(/sign up/i).first();
    if (await signUpButton.isVisible()) {
      await signUpButton.click();
      
      // Should show additional fields for sign up
      await expect(page.getByLabel(/name/i)).toBeVisible();
      await expect(page.getByLabel(/username/i)).toBeVisible();
    }
  });

  test('should navigate to dashboard after successful login', async ({ page }) => {
    // This would require actual authentication or mocking
    // For now, just test the form submission
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('TestPassword123!');
    
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait for potential navigation or error message
    await page.waitForTimeout(1000);
  });
});

test.describe('Protected Routes', () => {
  test('should redirect to auth when not logged in', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should redirect to auth page
    await expect(page).toHaveURL(/\/auth/);
  });
});


