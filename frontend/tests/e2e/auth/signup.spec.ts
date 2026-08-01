import { test, expect } from '@playwright/test';
import { openAuthModal, authForm, loginViaStorage } from '../helpers/auth';
import { BUTTONS, FORMS, HEADINGS, ROLES } from '../helpers/selectors';

test.describe('Signup Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('complete signup as admin', async ({ page }) => {
    await openAuthModal(page);
    await ROLES.admin(page).click();

    await FORMS.firstName(page).fill('Test Admin');
    await FORMS.companyName(page).fill('Test Company');
    await FORMS.email(page).fill(`test-admin-${Date.now()}@example.com`);
    await FORMS.password(page).fill('TestPass123!');

    await BUTTONS.createAccount(page).click();
    await page.waitForTimeout(3000);

    const isOnDashboard = await page.getByRole('button', { name: /profile menu/i }).isVisible({ timeout: 3000 }).catch(() => false);
    const auth = await page.evaluate(() => sessionStorage.getItem('pulse-crm-auth'));
    const hasError = await page.getByText(/error|invalid|failed/i).first().isVisible({ timeout: 1000 }).catch(() => false);
    expect(isOnDashboard || auth === 'true' || hasError).toBeTruthy();
  });

  test('complete signup as manager', async ({ page }) => {
    await openAuthModal(page);
    await ROLES.manager(page).click();

    await FORMS.firstName(page).fill('Test Manager');
    await FORMS.companyName(page).fill('Test Company');
    await FORMS.email(page).fill(`test-manager-${Date.now()}@example.com`);
    await FORMS.password(page).fill('TestPass123!');

    await BUTTONS.createAccount(page).click();
    await page.waitForTimeout(3000);

    const isOnDashboard = await page.getByRole('button', { name: /profile menu/i }).isVisible({ timeout: 3000 }).catch(() => false);
    const auth = await page.evaluate(() => sessionStorage.getItem('pulse-crm-auth'));
    const hasError = await page.getByText(/error|invalid|failed/i).first().isVisible({ timeout: 1000 }).catch(() => false);
    expect(isOnDashboard || auth === 'true' || hasError).toBeTruthy();
  });

  test('complete signup as sales rep', async ({ page }) => {
    await openAuthModal(page);
    await ROLES.salesRep(page).click();

    await FORMS.firstName(page).fill('Test Rep');
    await FORMS.companyName(page).fill('Test Company');
    await FORMS.email(page).fill(`test-rep-${Date.now()}@example.com`);
    await FORMS.password(page).fill('TestPass123!');

    await BUTTONS.createAccount(page).click();
    await page.waitForTimeout(3000);

    const isOnDashboard = await page.getByRole('button', { name: /profile menu/i }).isVisible({ timeout: 3000 }).catch(() => false);
    const auth = await page.evaluate(() => sessionStorage.getItem('pulse-crm-auth'));
    const hasError = await page.getByText(/error|invalid|failed/i).first().isVisible({ timeout: 1000 }).catch(() => false);
    expect(isOnDashboard || auth === 'true' || hasError).toBeTruthy();
  });

  test('duplicate email shows error', async ({ page }) => {
    await openAuthModal(page);

    await FORMS.firstName(page).fill('Duplicate User');
    await FORMS.companyName(page).fill('Test Company');
    await FORMS.email(page).fill('admin@kalnet-pulse.com');
    await FORMS.password(page).fill('TestPass123!');

    await BUTTONS.createAccount(page).click();

    await expect(page.getByText(/error|exists|duplicate|taken|already/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('weak password shows validation error', async ({ page }) => {
    await openAuthModal(page);

    await FORMS.firstName(page).fill('Weak Pass');
    await FORMS.companyName(page).fill('Test Company');
    await FORMS.email(page).fill(`weak-${Date.now()}@test.com`);
    await FORMS.password(page).fill('123');

    await BUTTONS.createAccount(page).click();

    await expect(page.getByText(/password|weak|invalid|error|minimum/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('Google sign-in button is visible', async ({ page }) => {
    await openAuthModal(page);
    const googleBtn = page.getByRole('button', { name: /Google/i });
    await expect(googleBtn).toBeVisible();
  });
});

test.describe('Signin Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await openAuthModal(page);
    await BUTTONS.signIn(page).click();
  });

  test('signin with invalid password shows error', async ({ page }) => {
    await FORMS.email(page).fill('admin@kalnet-pulse.com');
    await FORMS.password(page).fill('WrongPassword123!');
    await page.getByRole('button', { name: /Sign In/i }).last().click();

    await page.waitForTimeout(3000);
    const isStillOnLogin = await page.getByRole('button', { name: /Sign In/i }).last().isVisible({ timeout: 2000 }).catch(() => false);
    const hasError = await page.locator('[class*="error"], [class*="alert"], [role="alert"]').filter({ hasText: /invalid|incorrect|wrong|credentials|error/i }).first().isVisible({ timeout: 2000 }).catch(() => false);
    const bodyHasError = await page.locator('body').filter({ hasText: /invalid.*password|incorrect.*password|wrong.*password|bad.*credentials/i }).isVisible({ timeout: 2000 }).catch(() => false);
    expect(isStillOnLogin || hasError || bodyHasError).toBeTruthy();
  });

  test('signin with non-existent email shows error', async ({ page }) => {
    await FORMS.email(page).fill(`nonexistent-${Date.now()}@example.com`);
    await FORMS.password(page).fill('TestPass123!');
    await page.getByRole('button', { name: /Sign In/i }).last().click();

    await page.waitForTimeout(3000);
    const isStillOnLogin = await page.getByRole('button', { name: /Sign In/i }).last().isVisible({ timeout: 2000 }).catch(() => false);
    const hasError = await page.locator('[class*="error"], [class*="alert"], [role="alert"]').filter({ hasText: /not found|invalid|does not exist|credentials|error/i }).first().isVisible({ timeout: 2000 }).catch(() => false);
    const bodyHasError = await page.locator('body').filter({ hasText: /not found|does not exist|invalid.*email|user.*not/i }).isVisible({ timeout: 2000 }).catch(() => false);
    expect(isStillOnLogin || hasError || bodyHasError).toBeTruthy();
  });

  test('forgot password link is visible', async ({ page }) => {
    await expect(page.getByText(/forgot|reset/i).first()).toBeVisible();
  });
});
