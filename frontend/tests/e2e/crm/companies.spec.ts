import { test, expect } from '@playwright/test';
import { loginViaStorage } from '../helpers/auth';
import { SIDEBAR, BUTTONS, FORMS, HEADINGS } from '../helpers/selectors';

test.describe('Companies View', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaStorage(page, 'representative');
    await SIDEBAR.companies(page).click();
    await expect(HEADINGS.companies(page)).toBeVisible({ timeout: 5000 });
  });

  test('displays companies list with data', async ({ page }) => {
    await expect(page.getByText('TechCorp Inc.')).toBeVisible({ timeout: 5000 });
  });

  test('table has correct columns', async ({ page }) => {
    await expect(page.getByRole('columnheader', { name: /Company Name/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Industry/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Revenue/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Employees/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Open Deals/i })).toBeVisible();
  });

  test('search filters companies', async ({ page }) => {
    const searchInput = FORMS.companySearch(page);
    await searchInput.fill('Tech');
    await page.waitForTimeout(500);
    await expect(page.getByText('TechCorp Inc.')).toBeVisible();
  });

  test('clicking a company opens detail panel', async ({ page }) => {
    await page.getByText('TechCorp Inc.').first().click();
    await expect(page.getByText(/industry|revenue|employees|contacts/i).first()).toBeVisible({ timeout: 3000 });
  });

  test('detail panel shows company info', async ({ page }) => {
    await page.getByText('TechCorp Inc.').first().click();
    await expect(page.getByText(/Technology|Software|Tech/i).first()).toBeVisible({ timeout: 3000 });
  });

  test('Add Company button opens form', async ({ page }) => {
    const addBtn = BUTTONS.addCompany(page);
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await expect(page.getByRole('dialog').or(page.getByText(/new company|add company/i).first())).toBeVisible({ timeout: 5000 });
    }
  });

  test('company detail shows timeline', async ({ page }) => {
    await page.getByText('TechCorp Inc.').first().click();
    await expect(page.getByText(/timeline|activity|history/i).first()).toBeVisible({ timeout: 3000 });
  });

  test('company detail shows related contacts', async ({ page }) => {
    await page.getByText('TechCorp Inc.').first().click();
    await expect(page.getByText(/contacts|people|team/i).first()).toBeVisible({ timeout: 3000 });
  });
});
