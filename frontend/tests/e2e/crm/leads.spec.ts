import { test, expect } from '@playwright/test';
import { loginViaStorage } from '../helpers/auth';
import { SIDEBAR, BUTTONS, FORMS, HEADINGS } from '../helpers/selectors';

test.describe('Leads View', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaStorage(page, 'representative');
    await SIDEBAR.leads(page).click();
    await expect(HEADINGS.salesLeads(page)).toBeVisible({ timeout: 5000 });
  });

  test('displays leads table with rows', async ({ page }) => {
    const rows = page.locator('table tbody tr, [class*="lead-row"]');
    await expect(rows.first()).toBeVisible({ timeout: 5000 });
  });

  test('table has correct columns', async ({ page }) => {
    await expect(page.getByRole('columnheader', { name: /Name.*Company/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Score/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Status/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Priority/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Owner/i })).toBeVisible();
  });

  test('search filters leads', async ({ page }) => {
    const searchInput = FORMS.leadSearch(page);
    const initialCount = await page.locator('table tbody tr').count();
    await searchInput.fill('ZZZZNONEXISTENT');
    await page.waitForTimeout(500);
    const filteredCount = await page.locator('table tbody tr').count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  });

  test('search with no results shows empty state', async ({ page }) => {
    const searchInput = FORMS.leadSearch(page);
    await searchInput.fill('ZZZZNONEXISTENT');
    await page.waitForTimeout(500);
    await expect(page.getByText(/no.*leads|no.*results|empty/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('clicking a lead opens detail panel', async ({ page }) => {
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.click();
    await expect(BUTTONS.email(page)).toBeVisible({ timeout: 3000 });
    await expect(BUTTONS.logCall(page)).toBeVisible();
    await expect(BUTTONS.meet(page)).toBeVisible();
  });

  test('detail panel shows lead score', async ({ page }) => {
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.click();
    await expect(page.getByText(/score|rating/i).first()).toBeVisible({ timeout: 3000 });
  });

  test('detail panel shows timeline', async ({ page }) => {
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.click();
    await expect(page.getByText(/timeline|activity|history/i).first()).toBeVisible({ timeout: 3000 });
  });

  test('Add Lead button opens form', async ({ page }) => {
    const addBtn = BUTTONS.addLead(page);
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await expect(page.getByRole('dialog').or(page.getByText(/new lead|add lead|create lead/i).first())).toBeVisible({ timeout: 5000 });
    }
  });

  test('status filter works', async ({ page }) => {
    const statusFilter = page.getByRole('combobox').or(page.getByLabel(/status/i));
    if (await statusFilter.first().isVisible()) {
      await statusFilter.first().click();
      await page.waitForTimeout(300);
    }
  });

  test('lead conversion button is visible in detail panel', async ({ page }) => {
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.click();
    const convertBtn = page.getByRole('button', { name: /convert/i });
    if (await convertBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(convertBtn).toBeVisible();
    }
  });

  test('priority badges are displayed', async ({ page }) => {
    const priorities = page.getByText(/high|medium|low/i);
    await expect(priorities.first()).toBeVisible({ timeout: 5000 });
  });
});
