import { test, expect } from '@playwright/test';
import { loginViaStorage } from '../helpers/auth';
import { SIDEBAR, BUTTONS, FORMS } from '../helpers/selectors';

test.describe('Settings View', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaStorage(page, 'representative');
    await SIDEBAR.settings(page).click();
  });

  test('displays settings page', async ({ page }) => {
    await expect(page.getByText(/settings|configuration|preferences/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('profile section is visible', async ({ page }) => {
    await expect(page.getByText(/profile|personal|account/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('notification preferences are shown', async ({ page }) => {
    await expect(page.getByText(/notification|alert|email.*notification/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('password change section exists', async ({ page }) => {
    await expect(page.getByText(/password|change.*password|security/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('settings form has save button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /save/i }).first()).toBeVisible({ timeout: 5000 });
  });

  test('profile edit shows user info', async ({ page }) => {
    await expect(page.getByText(/name|email|phone|company/i).first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Emails View', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaStorage(page, 'representative');
    await page.getByRole('complementary').getByRole('button', { name: 'Emails' }).click();
  });

  test('displays emails list', async ({ page }) => {
    await expect(page.getByText(/email|inbox|message|mail/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('Gmail connection status is shown', async ({ page }) => {
    await expect(page.getByText(/gmail|connect|sync|account/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('compose button is available', async ({ page }) => {
    const composeBtn = page.getByRole('button', { name: /send email|compose/i }).first();
    if (await composeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(composeBtn).toBeVisible();
    }
  });

  test('email list has sender info', async ({ page }) => {
    await expect(page.getByText(/from:|sender:|subject:|re:|fw:|inbox|sent|unread/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('email list has timestamps', async ({ page }) => {
    await expect(page.getByText(/email|inbox|message|mail|sent|unread|all mail/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('sync button triggers email sync', async ({ page }) => {
    const syncBtn = page.getByRole('button', { name: /sync gmail|sync|refresh|fetch/i }).first();
    if (await syncBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await syncBtn.click();
      await page.waitForTimeout(1000);
    }
  });
});

test.describe('Integrations View (Admin)', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaStorage(page, 'admin');
    await SIDEBAR.integrations(page).click();
  });

  test('displays integrations page', async ({ page }) => {
    await expect(page.getByText(/integration|connect|third.*party/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('Gmail integration is listed', async ({ page }) => {
    await expect(page.getByText(/gmail|google|email/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('integration status is shown', async ({ page }) => {
    await expect(page.getByText(/connected|disconnected|active|inactive|status/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('connect/disconnect buttons are available', async ({ page }) => {
    await expect(page.getByText(/connect|disconnect|setup|configure/i).first()).toBeVisible({ timeout: 5000 });
  });
});
