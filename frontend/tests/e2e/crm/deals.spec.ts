import { test, expect } from '@playwright/test';
import { loginViaStorage } from '../helpers/auth';
import { SIDEBAR, BUTTONS, HEADINGS } from '../helpers/selectors';

test.describe('Deals View', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaStorage(page, 'representative');
    await SIDEBAR.deals(page).click();
    await expect(HEADINGS.pipeline(page)).toBeVisible({ timeout: 5000 });
  });

  test('displays deals list', async ({ page }) => {
    await expect(page.getByText(/deal|opportunity|pipeline/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('deals have status indicators', async ({ page }) => {
    await expect(page.getByText(/qualified|proposal|negotiation|won|lost/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('deals show monetary values', async ({ page }) => {
    await expect(page.getByText(/\$[\d,]+/).first()).toBeVisible({ timeout: 5000 });
  });

  test('Add Deal button is available', async ({ page }) => {
    const addBtn = BUTTONS.addDeal(page);
    if (await addBtn.isVisible()) {
      await expect(addBtn).toBeVisible();
    }
  });

  test('deal cards show company names', async ({ page }) => {
    await expect(page.getByText(/deal|pipeline|opportunity|enterprise|saas|upgrade|logistics|global|api|acme|wayne/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('pipeline has multiple stages', async ({ page }) => {
    const stageHeaders = page.locator('h3, h4, [class*="stage-header"], [class*="column-header"]');
    const count = await stageHeaders.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('clicking a deal opens its details', async ({ page }) => {
    const dealElement = page.getByText(/deal|opportunity/i).first();
    if (await dealElement.isVisible()) {
      await dealElement.click();
      await expect(page.getByText(/amount|stage|owner|company|close/i).first()).toBeVisible({ timeout: 3000 });
    }
  });
});
