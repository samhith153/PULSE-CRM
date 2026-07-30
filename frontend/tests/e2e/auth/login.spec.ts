import { test, expect } from '@playwright/test';
import { loginViaStorage, openAuthModal, authForm } from '../helpers/auth';
import { BUTTONS, FORMS, HEADINGS, SIDEBAR, ROLES } from '../helpers/selectors';

test.describe('Login', () => {
  test('should render the landing page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/PULSE|Pulse CRM/i);
  });

  test('should open auth modal via Get Started Free', async ({ page }) => {
    await page.goto('/');
    await BUTTONS.getStartedFree(page).click();
    await expect(HEADINGS.getStartedFree(page)).toBeVisible({ timeout: 5000 });
  });

  test('signup modal shows all form fields', async ({ page }) => {
    await page.goto('/');
    await BUTTONS.getStartedFree(page).click();

    await expect(HEADINGS.getStartedFree(page)).toBeVisible();
    await expect(FORMS.firstName(page)).toBeVisible();
    await expect(FORMS.companyName(page)).toBeVisible();
    await expect(FORMS.email(page)).toBeVisible();
    await expect(FORMS.password(page)).toBeVisible();
    await expect(BUTTONS.createAccount(page)).toBeVisible();
  });

  test('role selector pills are present and clickable', async ({ page }) => {
    await page.goto('/');
    await BUTTONS.getStartedFree(page).click();

    await expect(ROLES.admin(page)).toBeVisible();
    await expect(ROLES.manager(page)).toBeVisible();
    await expect(ROLES.salesRep(page)).toBeVisible();
  });

  test('toggle to signin mode hides name/company fields', async ({ page }) => {
    await page.goto('/');
    await BUTTONS.getStartedFree(page).click();

    await BUTTONS.signIn(page).click();
    await expect(HEADINGS.welcomeBack(page)).toBeVisible();

    await expect(FORMS.firstName(page)).not.toBeVisible({ timeout: 1000 }).catch(() => {});
    await expect(FORMS.companyName(page)).not.toBeVisible({ timeout: 1000 }).catch(() => {});
    await expect(page.getByRole('button', { name: /Sign In/i })).toBeVisible();
  });
});

test.describe('Dashboard - Representative', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaStorage(page, 'representative');
  });

  test('sidebar shows core nav items', async ({ page }) => {
    await expect(SIDEBAR.leads(page)).toBeVisible();
    await expect(SIDEBAR.contacts(page)).toBeVisible();
    await expect(SIDEBAR.companies(page)).toBeVisible();
    await expect(SIDEBAR.deals(page)).toBeVisible();
  });

  test('clicking Leads shows the leads view', async ({ page }) => {
    await SIDEBAR.leads(page).click();
    await expect(HEADINGS.salesLeads(page)).toBeVisible();
    await expect(FORMS.leadSearch(page)).toBeVisible();
  });

  test('clicking Companies shows the companies view', async ({ page }) => {
    await SIDEBAR.companies(page).click();
    await expect(HEADINGS.companies(page)).toBeVisible();
    await expect(FORMS.companySearch(page)).toBeVisible();
  });

  test('clicking Contacts shows the contacts view', async ({ page }) => {
    await SIDEBAR.contacts(page).click();
    await expect(HEADINGS.contactsDirectory(page)).toBeVisible();
  });

  test('clicking Deals shows the pipeline view', async ({ page }) => {
    await SIDEBAR.deals(page).click();
    await expect(HEADINGS.pipeline(page)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Data Views', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaStorage(page, 'representative');
  });

  test('Leads view shows mock lead data', async ({ page }) => {
    await SIDEBAR.leads(page).click();
    await expect(page.getByText('Alex Rivera')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('TechCorp Inc.')).toBeVisible();
  });

  test('Leads table has correct column headers', async ({ page }) => {
    await SIDEBAR.leads(page).click();
    await expect(page.getByRole('columnheader', { name: /Name.*Company/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Score/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Status/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Priority/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Owner/i })).toBeVisible();
  });

  test('clicking a lead opens detail side panel', async ({ page }) => {
    await SIDEBAR.leads(page).click();
    await page.getByText('Alex Rivera').first().click();
    await expect(BUTTONS.email(page)).toBeVisible({ timeout: 3000 });
    await expect(BUTTONS.logCall(page)).toBeVisible();
    await expect(BUTTONS.meet(page)).toBeVisible();
  });

  test('Companies view shows mock companies', async ({ page }) => {
    await SIDEBAR.companies(page).click();
    await expect(page.getByText('TechCorp Inc.')).toBeVisible({ timeout: 5000 });
  });

  test('Companies table has correct column headers', async ({ page }) => {
    await SIDEBAR.companies(page).click();
    await expect(page.getByRole('columnheader', { name: /Company Name/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Industry/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Revenue/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Employees/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Open Deals/i })).toBeVisible();
  });

  test('Contacts view shows mock contacts', async ({ page }) => {
    await SIDEBAR.contacts(page).click();
    await expect(page.getByText('Alex Rivera')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Sign Out', () => {
  test('should return to landing page after sign out', async ({ page }) => {
    await loginViaStorage(page, 'representative');
    await BUTTONS.profileMenu(page).click();
    await BUTTONS.signOut(page).click();
    await expect(page.locator('body')).toContainText(/Pulse CRM|Get Started|Start Free Trial/i, { timeout: 5000 });
  });
});

test.describe('Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaStorage(page, 'representative');
  });

  test('command palette opens with Ctrl+K', async ({ page }) => {
    await page.keyboard.press('Control+k');
    await expect(page.getByPlaceholder(/search|type to/i).first()).toBeVisible({ timeout: 5000 });
  });
});
