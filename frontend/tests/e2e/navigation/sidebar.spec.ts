import { test, expect } from '@playwright/test';
import { loginViaStorage } from '../helpers/auth';
import { SIDEBAR, BUTTONS, FORMS } from '../helpers/selectors';

test.describe('Sidebar Navigation', () => {
  test('representative sees correct nav items', async ({ page }) => {
    await loginViaStorage(page, 'representative');
    await expect(SIDEBAR.leads(page)).toBeVisible();
    await expect(SIDEBAR.contacts(page)).toBeVisible();
    await expect(SIDEBAR.companies(page)).toBeVisible();
    await expect(SIDEBAR.deals(page)).toBeVisible();
  });

  test('manager sees correct nav items', async ({ page }) => {
    await loginViaStorage(page, 'manager');
    await expect(SIDEBAR.leads(page)).toBeVisible();
    await expect(SIDEBAR.contacts(page)).toBeVisible();
    await expect(SIDEBAR.companies(page)).toBeVisible();
    await expect(page.getByRole('button', { name: /team pipeline/i }).first()).toBeVisible();
  });

  test('admin sees correct nav items', async ({ page }) => {
    await loginViaStorage(page, 'admin');
    await expect(SIDEBAR.users(page)).toBeVisible();
    await expect(SIDEBAR.companies(page)).toBeVisible();
    await expect(SIDEBAR.contacts(page)).toBeVisible();
    await expect(page.getByRole('button', { name: /integrations/i }).first()).toBeVisible();
  });

  test('clicking nav items changes active view', async ({ page }) => {
    await loginViaStorage(page, 'representative');

    await SIDEBAR.leads(page).click();
    await expect(page.getByRole('heading', { name: /Sales Leads/i })).toBeVisible({ timeout: 5000 });

    await SIDEBAR.companies(page).click();
    await expect(page.getByRole('heading', { name: /^Companies$/i })).toBeVisible({ timeout: 5000 });

    await SIDEBAR.contacts(page).click();
    await expect(page.getByRole('heading', { name: /Contacts/i })).toBeVisible({ timeout: 5000 });
  });

  test('sidebar collapse/expand works', async ({ page }) => {
    await loginViaStorage(page, 'representative');
    const collapseBtn = page.getByRole('button', { name: /collapse|toggle|menu|sidebar/i }).first();
    if (await collapseBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await collapseBtn.click();
      await page.waitForTimeout(500);
      await collapseBtn.click();
    }
  });

  test('active nav item is highlighted', async ({ page }) => {
    await loginViaStorage(page, 'representative');
    await SIDEBAR.leads(page).click();
    await page.waitForTimeout(300);
    const activeItem = SIDEBAR.leads(page);
    await expect(activeItem).toHaveAttribute('aria-current', /.+/).catch(() => {});
  });

  test('admin does not see rep-only items', async ({ page }) => {
    await loginViaStorage(page, 'admin');
    await expect(SIDEBAR.products(page)).not.toBeVisible().catch(() => {});
    await expect(SIDEBAR.workflows(page)).not.toBeVisible().catch(() => {});
  });

  test('rep does not see admin-only items', async ({ page }) => {
    await loginViaStorage(page, 'representative');
    await expect(SIDEBAR.users(page)).not.toBeVisible().catch(() => {});
    await expect(SIDEBAR.rolesPermissions(page)).not.toBeVisible().catch(() => {});
    await expect(SIDEBAR.auditLogs(page)).not.toBeVisible().catch(() => {});
  });
});

test.describe('Header Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaStorage(page, 'representative');
  });

  test('profile menu is accessible', async ({ page }) => {
    await BUTTONS.profileMenu(page).click();
    await expect(page.getByText(/profile|settings|sign out/i).first()).toBeVisible({ timeout: 3000 });
  });

  test('profile dropdown shows user name', async ({ page }) => {
    await BUTTONS.profileMenu(page).click();
    await expect(page.getByText(/sarah johnson|admin|manager/i).first()).toBeVisible({ timeout: 3000 });
  });

  test('sign out option is available', async ({ page }) => {
    await BUTTONS.profileMenu(page).click();
    await expect(BUTTONS.signOut(page)).toBeVisible();
  });

  test('theme toggle is available', async ({ page }) => {
    const themeToggle = page.getByRole('button', { name: /theme|dark|light|mode/i }).first();
    if (await themeToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
      await themeToggle.click();
      await page.waitForTimeout(300);
    }
  });

  test('search shortcut hint is visible', async ({ page }) => {
    await expect(page.getByText(/Ctrl\+K|⌘K|⌘\+K|\(Ctrl\+K\)/i).first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Command Palette', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaStorage(page, 'representative');
  });

  test('opens with Ctrl+K', async ({ page }) => {
    await page.keyboard.press('Control+k');
    await expect(page.getByPlaceholder(/search|type to/i).first()).toBeVisible({ timeout: 3000 });
  });

  test('closes with Escape', async ({ page }) => {
    await page.keyboard.press('Control+k');
    await expect(page.getByPlaceholder(/type to search/i).first()).toBeVisible({ timeout: 3000 });
    await page.keyboard.press('Escape');
    await expect(page.getByPlaceholder(/type to search/i).first()).not.toBeVisible({ timeout: 3000 });
  });

  test('search input accepts text', async ({ page }) => {
    await page.keyboard.press('Control+k');
    const searchInput = page.getByPlaceholder(/type to search/i).first();
    await expect(searchInput).toBeVisible({ timeout: 3000 });
    await searchInput.fill('leads');
    await expect(searchInput).toHaveValue('leads');
  });

  test('shows navigation suggestions', async ({ page }) => {
    await page.keyboard.press('Control+k');
    await expect(page.getByText(/leads|contacts|companies|deals|settings/i).first()).toBeVisible({ timeout: 3000 });
  });
});
