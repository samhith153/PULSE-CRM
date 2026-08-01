import { test, expect } from '@playwright/test';
import { openAuthModal, loginViaStorage } from '../helpers/auth';
import { BUTTONS, FORMS } from '../helpers/selectors';

test.describe('Password Reset Flow', () => {
  test('forgot password link is clickable', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await openAuthModal(page);
    await BUTTONS.signIn(page).click();

    const forgotLink = page.getByText(/forgot|reset/i).first();
    await expect(forgotLink).toBeVisible();
  });
});

test.describe('Change Password', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaStorage(page, 'admin');
  });

  test('settings page has password change section', async ({ page }) => {
    await page.getByRole('button', { name: /^Settings$/i }).click();
    await expect(page.getByText(/password|change.*password/i).first()).toBeVisible({ timeout: 10000 });
  });
});
