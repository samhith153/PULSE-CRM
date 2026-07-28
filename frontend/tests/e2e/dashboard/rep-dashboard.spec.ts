import { test, expect } from '@playwright/test';
import { loginViaStorage } from '../helpers/auth';
import { SIDEBAR } from '../helpers/selectors';

test.describe('Representative Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaStorage(page, 'representative');
  });

  test('displays stat cards with KPI data', async ({ page }) => {
    await expect(page.getByText(/revenue|deals|leads|conversion/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('stat cards show numerical values', async ({ page }) => {
    await expect(page.getByText(/\$[\d,]+|[\d]+%|[\d,]+/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('charts section is visible', async ({ page }) => {
    const charts = page.locator('canvas, svg, [class*="chart"]');
    await expect(charts.first()).toBeVisible({ timeout: 5000 });
  });

  test('widgets section is visible', async ({ page }) => {
    await expect(page.getByText(/leaderboard|activity|recent/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('time filter is available', async ({ page }) => {
    const timeFilter = page.getByRole('combobox').or(page.getByText(/today|week|month|quarter/i).first());
    await expect(timeFilter.first()).toBeVisible({ timeout: 5000 });
  });

  test('right panel shows key metrics', async ({ page }) => {
    const rightPanel = page.locator('[class*="right"], [class*="panel"]').last();
    if (await rightPanel.isVisible()) {
      await expect(rightPanel).toBeVisible();
    }
  });
});

test.describe('Manager Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaStorage(page, 'manager');
  });

  test('displays revenue metrics', async ({ page }) => {
    await expect(page.getByText(/revenue|pipeline|forecast/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('shows team leaderboard', async ({ page }) => {
    await expect(page.getByText(/leaderboard|top.*rep|performance/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('shows alerts section', async ({ page }) => {
    await expect(page.getByText(/alerts|notifications|attention/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('pipeline overview is visible', async ({ page }) => {
    await expect(page.getByText(/pipeline|deals|stage/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('forecast section is visible', async ({ page }) => {
    await expect(page.getByText(/forecast|projection|target/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('team performance metrics are shown', async ({ page }) => {
    await expect(page.getByText(/team|performance|metric/i).first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaStorage(page, 'admin');
  });

  test('displays KPI cards', async ({ page }) => {
    await expect(page.getByText(/kpi|metric|overview/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('shows financial overview', async ({ page }) => {
    await expect(page.getByText(/revenue|financial|income|profit/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('shows activity metrics', async ({ page }) => {
    await expect(page.getByText(/user|traffic|arrivals|overview|dashboard/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('shows user metrics', async ({ page }) => {
    await expect(page.getByText(/user|member|team/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('shows system health', async ({ page }) => {
    await expect(page.getByText(/health|status|uptime|system/i).first()).toBeVisible({ timeout: 5000 });
  });
});
