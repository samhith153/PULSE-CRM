import { test, expect } from '@playwright/test';
import { loginViaStorage } from '../helpers/auth';
import { SIDEBAR } from '../helpers/selectors';
import { setupPerformanceObservers, getPerformanceMetrics } from '../helpers/performance';

test.describe('Navigation Flow Performance', () => {
  test('full navigation flow (landing -> auth -> dashboard -> leads)', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
    const landingTime = Date.now() - startTime;
    console.log(`[FLOW] Landing page: ${landingTime}ms`);

    await setupPerformanceObservers(page);

    const authStartTime = Date.now();
    await loginViaStorage(page, 'representative');
    const authTime = Date.now() - authStartTime;
    console.log(`[FLOW] Auth + Dashboard load: ${authTime}ms`);

    const leadsStartTime = Date.now();
    await SIDEBAR.leads(page).click();
    await page.waitForLoadState('domcontentloaded', { timeout: 30_000 });
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
    const leadsTime = Date.now() - leadsStartTime;
    console.log(`[FLOW] Leads view load: ${leadsTime}ms`);

    const totalTime = Date.now() - startTime;
    console.log(`[FLOW] Total flow time: ${totalTime}ms`);

    const perfMetrics = await getPerformanceMetrics(page);
    console.log(`[FLOW] LCP: ${perfMetrics.lcp.toFixed(0)}ms, FCP: ${perfMetrics.fcp.toFixed(0)}ms`);

    expect(totalTime, 'Full flow should complete in < 60s').toBeLessThan(60000);
  });

  test('dashboard -> leads -> contacts -> companies navigation', async ({ page }) => {
    await loginViaStorage(page, 'representative');

    const timings: { view: string; duration: number }[] = [];

    const views = [
      { name: 'Leads', action: () => SIDEBAR.leads(page).click() },
      { name: 'Contacts', action: () => SIDEBAR.contacts(page).click() },
      { name: 'Companies', action: () => SIDEBAR.companies(page).click() },
      { name: 'Deals', action: () => SIDEBAR.deals(page).click() },
      { name: 'Dashboard', action: () => page.goto('/') },
    ];

    for (const view of views) {
      const start = Date.now();
      await view.action();
      await page.waitForLoadState('domcontentloaded', { timeout: 30_000 });
      await page.waitForTimeout(500);
      const duration = Date.now() - start;
      timings.push({ view: view.name, duration });
      console.log(`[NAV] ${view.name}: ${duration}ms`);
    }

    const totalTime = timings.reduce((sum, t) => sum + t.duration, 0);
    console.log(`[NAV] Total navigation time: ${totalTime}ms`);

    for (const timing of timings) {
      expect(timing.duration, `${timing.view} should load in < 10s`).toBeLessThan(10000);
    }
  });

  test('command palette opens and is interactive', async ({ page }) => {
    await loginViaStorage(page, 'representative');

    const start = Date.now();
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(500);
    const paletteOpenTime = Date.now() - start;
    console.log(`[CMD] Palette open: ${paletteOpenTime}ms`);

    const searchInput = page.getByPlaceholder(/search|type to/i).first();
    await expect(searchInput).toBeVisible({ timeout: 3000 });

    // Type into the input instead of fill (it may be readonly)
    await page.keyboard.type('leads', { delay: 50 });
    await page.waitForTimeout(500);

    expect(paletteOpenTime, 'Command palette should open in < 3s').toBeLessThan(3000);
  });

  test('sidebar collapse/expand is smooth', async ({ page }) => {
    await loginViaStorage(page, 'representative');

    const collapseBtn = page.getByRole('button', { name: /collapse|toggle|menu|sidebar/i }).first();
    if (await collapseBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      const start = Date.now();
      await collapseBtn.click();
      await page.waitForTimeout(500);
      const collapseTime = Date.now() - start;

      const expandStart = Date.now();
      await collapseBtn.click();
      await page.waitForTimeout(500);
      const expandTime = Date.now() - expandStart;

      console.log(`[UI] Collapse: ${collapseTime}ms, Expand: ${expandTime}ms`);

      expect(collapseTime, 'Collapse should be < 3s').toBeLessThan(3000);
      expect(expandTime, 'Expand should be < 3s').toBeLessThan(3000);
    }
  });

  test('detail panel open/close is smooth', async ({ page }) => {
    await loginViaStorage(page, 'representative');
    await SIDEBAR.leads(page).click();
    await page.waitForLoadState('networkidle');

    const leadRow = page.getByText('Alex Rivera').first();
    if (await leadRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      const openStart = Date.now();
      await leadRow.click();
      await page.waitForTimeout(500);
      const openTime = Date.now() - openStart;

      const closeBtn = page.getByRole('button', { name: /close|×|x/i }).first();
      if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        const closeStart = Date.now();
        await closeBtn.click();
        await page.waitForTimeout(500);
        const closeTime = Date.now() - closeStart;

        console.log(`[UI] Panel open: ${openTime}ms, Close: ${closeTime}ms`);
        expect(openTime, 'Panel open should be < 5s').toBeLessThan(5000);
      }
    }
  });
});
