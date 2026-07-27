import { test, expect } from '@playwright/test';

test.describe('Login', () => {
  test('should render the login page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/PULSE|Pulse CRM/i);
  });

  test('should show email field and password field', async ({ page }) => {
    await page.goto('/');
    const emailInput = page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i));
    const passwordInput = page.getByLabel(/password/i).or(page.getByPlaceholder(/password/i));
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });
});