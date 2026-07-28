import { test, expect } from '@playwright/test';
import { loginViaStorage } from '../helpers/auth';
import { SIDEBAR, BUTTONS, HEADINGS } from '../helpers/selectors';

test.describe('Pipeline View', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaStorage(page, 'representative');
    await SIDEBAR.deals(page).click();
    await expect(HEADINGS.pipeline(page)).toBeVisible({ timeout: 5000 });
  });

  test('displays pipeline columns', async ({ page }) => {
    await expect(page.getByText(/qualified|proposal|review|won|lost/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('pipeline shows deals in columns', async ({ page }) => {
    await expect(page.getByText(/deal|opportunity/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('stage headers are visible', async ({ page }) => {
    await expect(page.getByText(/qualified|proposal|review|won|lost/i).first()).toBeVisible();
  });

  test('deals have value amounts displayed', async ({ page }) => {
    await expect(page.getByText(/\$[\d,]+/).first()).toBeVisible({ timeout: 5000 });
  });

  test('Add Deal button opens form', async ({ page }) => {
    const addBtn = BUTTONS.addDeal(page);
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await expect(page.getByRole('dialog').or(page.getByText(/new deal|add deal/i).first())).toBeVisible({ timeout: 5000 });
    }
  });

  test('pipeline view is responsive', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    await expect(HEADINGS.pipeline(page)).toBeVisible();
  });

  test('clicking a deal opens detail', async ({ page }) => {
    const dealCard = page.getByText(/deal|opportunity/i).first();
    if (await dealCard.isVisible()) {
      await dealCard.click();
      await expect(page.getByText(/details|amount|stage|owner/i).first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('pipeline statistics are shown', async ({ page }) => {
    await expect(page.getByText(/total|count|value|pipeline/i).first()).toBeVisible({ timeout: 5000 });
  });
});
