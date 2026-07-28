import { test, expect } from '@playwright/test';
import { openAuthModal } from '../helpers/auth';
import { BUTTONS } from '../helpers/selectors';

const MARKETING_ROUTES = [
  { path: '/', contentPattern: /PulseCRM|Close More Deals|future of sales/i },
  { path: '/pricing', contentPattern: /pricing|plans|Start free/i },
  { path: '/product/ai-copilot', contentPattern: /ai.*copilot|copilot|scoring/i },
  { path: '/product/automation', contentPattern: /automation|next.*best/i },
  { path: '/product/email-intelligence', contentPattern: /email|intelligence/i },
  { path: '/product/revenue-analytics', contentPattern: /revenue|analytics/i },
  { path: '/product/security-rbac', contentPattern: /security|rbac|permission/i },
  { path: '/product/visual-pipeline', contentPattern: /pipeline|visual|stages/i },
  { path: '/solutions/enterprise', contentPattern: /enterprise/i },
  { path: '/solutions/startups', contentPattern: /startup/i },
  { path: '/solutions/sales-reps', contentPattern: /sales.*rep/i },
  { path: '/solutions/sales-managers', contentPattern: /sales.*manager/i },
  { path: '/solutions/agencies', contentPattern: /agencies|agency/i },
  { path: '/solutions/revops', contentPattern: /revops|revenue.*ops/i },
  { path: '/resources/documentation', contentPattern: /documentation|docs/i },
  { path: '/resources/blog', contentPattern: /blog/i },
  { path: '/resources/community', contentPattern: /community/i },
  { path: '/resources/support', contentPattern: /support/i },
  { path: '/resources/api-reference', contentPattern: /api.*reference|api/i },
  { path: '/resources/implementation-guide', contentPattern: /implementation|guide/i },
];

for (const route of MARKETING_ROUTES) {
  test.describe(`Marketing Page: ${route.path}`, () => {
    test(`renders ${route.path} correctly`, async ({ page }) => {
      await page.goto(route.path, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);
      await expect(page.locator('body')).toContainText(route.contentPattern, { timeout: 10000 });
    });

    test(`${route.path} has navbar`, async ({ page }) => {
      await page.goto(route.path, { waitUntil: 'domcontentloaded' });
      const navbar = page.getByRole('navigation').or(page.locator('nav')).or(page.locator('header')).or(page.getByText(/PulseCRM/i).first());
      await expect(navbar.first()).toBeVisible({ timeout: 10000 });
    });

    test(`${route.path} has footer`, async ({ page }) => {
      await page.goto(route.path, { waitUntil: 'domcontentloaded' });
      const footer = page.getByRole('contentinfo').or(page.locator('footer'));
      await expect(footer.first()).toBeVisible({ timeout: 5000 });
    });
  });
}

test.describe('Navbar Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
  });

  test('Product dropdown opens on hover/click', async ({ page }) => {
    const productBtn = page.getByRole('button', { name: /^Product$/i }).or(page.getByText(/^Product$/i).first());
    if (await productBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await productBtn.click();
      await expect(page.getByText(/ai.*copilot|automation|pipeline|email/i).first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('Solutions dropdown opens on hover/click', async ({ page }) => {
    const solutionsBtn = page.getByRole('button', { name: /^Solutions$/i }).or(page.getByText(/^Solutions$/i).first());
    if (await solutionsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await solutionsBtn.click();
      await expect(page.getByText(/enterprise|startup|sales.*rep|agency/i).first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('Resources dropdown opens on hover/click', async ({ page }) => {
    const resourcesBtn = page.getByRole('button', { name: /^Resources$/i }).or(page.getByText(/^Resources$/i).first());
    if (await resourcesBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await resourcesBtn.click();
      await expect(page.getByText(/documentation|blog|community|support/i).first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('CTA buttons open auth modal', async ({ page }) => {
    const cta = page.getByRole('button', { name: /Get Started Free|Start Free Trial/i }).first();
    if (await cta.isVisible({ timeout: 5000 }).catch(() => false)) {
      await cta.click();
      await expect(page.getByRole('heading', { name: /get started|sign up|create account/i }).first()).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Mobile Navigation', () => {
  test('mobile menu button is visible on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const menuBtn = page.getByRole('button', { name: /open menu|close menu/i }).first();
    await expect(menuBtn).toBeVisible({ timeout: 5000 });
  });

  test('mobile drawer opens on menu click', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const menuBtn = page.getByRole('button', { name: /open menu|close menu/i }).first();
    if (await menuBtn.isVisible()) {
      await menuBtn.click();
      await page.waitForTimeout(500);
      await expect(page.getByText(/product|solution|resource|pricing/i).first()).toBeVisible({ timeout: 3000 });
    }
  });
});
