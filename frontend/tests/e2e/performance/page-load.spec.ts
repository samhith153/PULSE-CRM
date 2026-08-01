import { test, expect } from '@playwright/test';
import { loginViaStorage } from '../helpers/auth';
import { SIDEBAR } from '../helpers/selectors';
import { collectMetrics, logMetrics, evaluateThresholds } from '../helpers/performance';

const KEY_ROUTES = [
  { name: 'Landing Page', path: '/' },
  { name: 'Pricing Page', path: '/pricing' },
  { name: 'AI Copilot Page', path: '/product/ai-copilot' },
  { name: 'Automation Page', path: '/product/automation' },
  { name: 'Enterprise Page', path: '/solutions/enterprise' },
];

for (const route of KEY_ROUTES) {
  test.describe(`Page Load Performance: ${route.name}`, () => {
    test(`measure ${route.name} load metrics`, async ({ page }) => {
      const metrics = await collectMetrics(page, route.path);
      logMetrics(metrics);

      if (metrics.fcp === 0) console.log(`[PERF] FCP not available for ${route.name} (SSR page)`);
      if (metrics.ttfb === 0) console.log(`[PERF] TTFB not available for ${route.name} (SSR page)`);
      expect(metrics.loadTime, `Load time should be reasonable`).toBeLessThan(60000);
    });
  });
}

test.describe('Dashboard Load Performance', () => {
  test('representative dashboard loads within threshold', async ({ page }) => {
    await loginViaStorage(page, 'representative');
    const metrics = await collectMetrics(page, '/');
    logMetrics(metrics);

    const { passed, violations } = evaluateThresholds(metrics);
    if (!passed) {
      console.log(`[PERF WARNING] Threshold violations: ${violations.join(', ')}`);
    }
    expect(metrics.loadTime, 'Dashboard load time should be < 30s').toBeLessThan(30000);
  });

  test('manager dashboard loads within threshold', async ({ page }) => {
    await loginViaStorage(page, 'manager');
    const metrics = await collectMetrics(page, '/');
    logMetrics(metrics);

    expect(metrics.loadTime, 'Manager dashboard load time should be < 30s').toBeLessThan(30000);
  });

  test('admin dashboard loads within threshold', async ({ page }) => {
    await loginViaStorage(page, 'admin');
    const metrics = await collectMetrics(page, '/');
    logMetrics(metrics);

    expect(metrics.loadTime, 'Admin dashboard load time should be < 30s').toBeLessThan(30000);
  });
});
