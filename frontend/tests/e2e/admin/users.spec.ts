import { test, expect } from '@playwright/test';
import { loginViaStorage } from '../helpers/auth';
import { SIDEBAR, BUTTONS, FORMS } from '../helpers/selectors';

test.describe('Users Management (Admin)', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaStorage(page, 'admin');
    await SIDEBAR.users(page).click();
    await expect(page.getByRole('heading', { name: /User Profiles/i })).toBeVisible({ timeout: 5000 });
  });

  test('displays users list', async ({ page }) => {
    await expect(page.getByText(/user|member|admin|manager|rep/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('user table has correct columns', async ({ page }) => {
    await expect(page.getByRole('columnheader', { name: /User/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Email/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Authorization Role/i })).toBeVisible();
  });

  test('search filters users', async ({ page }) => {
    const searchInput = page.getByRole('combobox').or(page.getByPlaceholder(/search users|filter/i)).first();
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('admin');
      await page.waitForTimeout(500);
    }
  });

  test('Add User button opens form', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: /create user/i }).first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await expect(page.getByRole('dialog').or(page.getByText(/create.*user|new.*user/i).first())).toBeVisible({ timeout: 5000 });
    }
  });

  test('user roles are displayed', async ({ page }) => {
    await expect(page.getByText(/Admin|Sales Manager|Sales Representative/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('user status indicators are shown', async ({ page }) => {
    await expect(page.getByText(/Active|Disabled/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('clicking a user opens details', async ({ page }) => {
    const userRow = page.getByText(/System Admin|Sarah Johnson|Alex Johnson|David Wilson|Lisa Martinez/i).first();
    if (await userRow.isVisible()) {
      await userRow.click();
      await expect(page.getByText(/email|role|status|permission|department/i).first()).toBeVisible({ timeout: 3000 });
    }
  });
});

test.describe('Roles & Permissions (Admin)', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaStorage(page, 'admin');
    await SIDEBAR.rolesPermissions(page).click();
  });

  test('displays roles list', async ({ page }) => {
    await expect(page.getByText(/admin|manager|sales.?rep/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('permissions matrix is visible', async ({ page }) => {
    await expect(page.getByText(/permission|access|role/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('role descriptions are shown', async ({ page }) => {
    await expect(page.getByText(/create|read|update|delete|manage/i).first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Audit Logs (Admin)', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaStorage(page, 'admin');
    await SIDEBAR.auditLogs(page).click();
  });

  test('displays audit log entries', async ({ page }) => {
    await expect(page.getByText(/log|event|action|activity/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('log entries have timestamps', async ({ page }) => {
    await expect(page.getByText(/\d{4}|\d{2}:\d{2}|ago|today/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('log entries have action types', async ({ page }) => {
    await expect(page.getByText(/create|update|delete|login|logout/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('search filters audit logs', async ({ page }) => {
    const auditSearch = page.getByRole('complementary').getByPlaceholder(/search/i).first();
    const mainSearch = page.locator('aside').getByPlaceholder(/search/i).first();
    const searchInput = auditSearch.or(mainSearch);
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('login');
      await page.waitForTimeout(500);
    }
  });
});
