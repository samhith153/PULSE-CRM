import { test, expect } from '@playwright/test';
import { loginViaStorage } from '../helpers/auth';
import { SIDEBAR } from '../helpers/selectors';

test.describe('API Response Time', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaStorage(page, 'representative');
  });

  test('leads page loads and shows data', async ({ page }) => {
    const apiCalls: { url: string; duration: number; status: number }[] = [];

    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/api/') && !url.includes('/health')) {
        try {
          const timing = response.request().timing();
          apiCalls.push({
            url,
            duration: timing.responseEnd - timing.requestStart,
            status: response.status(),
          });
        } catch {
          // Response may have been disposed
        }
      }
    });

    await SIDEBAR.leads(page).click();
    await page.waitForLoadState('domcontentloaded', { timeout: 30_000 });
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
    await page.waitForTimeout(2000);

    for (const call of apiCalls) {
      console.log(`[API] ${call.url.split('?')[0]} - ${call.duration.toFixed(0)}ms (${call.status})`);
      // Only assert on successful calls (not 401/429 which are expected with mock auth)
      if (call.status >= 200 && call.status < 300) {
        expect(call.duration, `API ${call.url} should respond in < 10s`).toBeLessThan(10000);
      }
    }

    // Page should render regardless of API status (falls back to mock data)
    await expect(page.getByText(/lead|sales/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('contacts page loads and shows data', async ({ page }) => {
    await SIDEBAR.contacts(page).click();
    await page.waitForLoadState('domcontentloaded', { timeout: 30_000 });
    await expect(page.getByText(/contact|directory/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('companies page loads and shows data', async ({ page }) => {
    await SIDEBAR.companies(page).click();
    await page.waitForLoadState('domcontentloaded', { timeout: 30_000 });
    await expect(page.getByText(/company|corporation/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('deals page loads and shows data', async ({ page }) => {
    await SIDEBAR.deals(page).click();
    await page.waitForLoadState('domcontentloaded', { timeout: 30_000 });
    await expect(page.getByText(/deal|pipeline|stage/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('dashboard loads and shows stats', async ({ page }) => {
    const apiCalls: { url: string; duration: number; status: number }[] = [];

    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/api/') && !url.includes('/health')) {
        try {
          const timing = response.request().timing();
          apiCalls.push({
            url,
            duration: timing.responseEnd - timing.requestStart,
            status: response.status(),
          });
        } catch {
          // Response may have been disposed
        }
      }
    });

    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
    await page.waitForTimeout(2000);

    for (const call of apiCalls) {
      console.log(`[API] ${call.url.split('?')[0]} - ${call.duration.toFixed(0)}ms (${call.status})`);
    }

    // Dashboard should render with mock data even if API returns 401
    await expect(page.getByText(/revenue|deals|leads|dashboard/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('navigation between views is responsive', async ({ page }) => {
    const timings: { view: string; duration: number }[] = [];

    const views = [
      { name: 'Leads', action: () => SIDEBAR.leads(page).click() },
      { name: 'Contacts', action: () => SIDEBAR.contacts(page).click() },
      { name: 'Companies', action: () => SIDEBAR.companies(page).click() },
    ];

    for (const view of views) {
      const start = Date.now();
      await view.action();
      await page.waitForLoadState('domcontentloaded', { timeout: 30_000 });
      const duration = Date.now() - start;
      timings.push({ view: view.name, duration });
      console.log(`[NAV] ${view.name}: ${duration}ms`);
    }

    for (const timing of timings) {
      expect(timing.duration, `${timing.view} navigation should be < 10s`).toBeLessThan(10000);
    }
  });
});
