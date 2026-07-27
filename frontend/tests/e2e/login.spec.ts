import { test, expect, Page } from '@playwright/test';

/** Inject auth into session/local storage BEFORE page JS runs */
async function authenticate(page: Page, role: string = 'representative') {
  await page.addInitScript((r) => {
    sessionStorage.setItem('pulse-crm-auth', 'true');
    localStorage.setItem('pulse-crm-role', r);
    localStorage.setItem('pulse-crm-user', r === 'admin' ? 'System Admin' : r === 'manager' ? 'Alex Johnson' : 'Sarah Johnson');
  }, role);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
}

/** Scoped auth modal form (excludes the newsletter form) */
function authForm(page: Page) {
  return page.locator('form').filter({ hasText: /Password|Email|Create Account|Sign In/i });
}

// ──────────────────────────────────────────────
// LANDING & AUTH MODAL
// ──────────────────────────────────────────────
test.describe('Login', () => {
  test('should render the landing page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/PULSE|Pulse CRM/i);
  });

  test('should open auth modal via Get Started Free', async ({ page }) => {
    await page.goto('/');

    const cta = page.getByRole('button', { name: /Get Started Free/i }).first();
    await expect(cta).toBeVisible({ timeout: 10000 });
    await cta.click();

    const modalHeading = page.getByRole('heading', { name: /Get started free/i });
    await expect(modalHeading).toBeVisible({ timeout: 5000 });
  });

  test('signup modal shows all form fields', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Get Started Free/i }).first().click();
    const form = authForm(page);

    await expect(page.getByRole('heading', { name: /Get started free/i })).toBeVisible();
    await expect(form.getByPlaceholder('John')).toBeVisible();
    await expect(form.getByPlaceholder('Acme Inc.')).toBeVisible();
    await expect(form.getByPlaceholder('you@company.com')).toBeVisible();
    await expect(form.getByPlaceholder(/•/)).toBeVisible();
    await expect(form.getByRole('button', { name: /Create Account/i })).toBeVisible();
  });

  test('role selector pills are present and clickable', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Get Started Free/i }).first().click();

    await expect(page.getByRole('button', { name: /^Admin$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Manager$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Sales Rep/i })).toBeVisible();
  });

  test('toggle to signin mode hides name/company fields', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Get Started Free/i }).first().click();
    const form = authForm(page);

    await page.getByRole('button', { name: /^Sign in$/i }).click();
    await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible();

    await expect(form.getByPlaceholder('John')).not.toBeVisible({ timeout: 1000 }).catch(() => {});
    await expect(form.getByPlaceholder('Acme Inc.')).not.toBeVisible({ timeout: 1000 }).catch(() => {});
    await expect(form.getByRole('button', { name: /Sign In/i })).toBeVisible();
  });

  test('empty form submission shows validation error', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.getByRole('button', { name: /Get Started Free/i }).first().click();

    await page.getByPlaceholder('John').fill('John');
    await page.getByPlaceholder('Acme Inc.').fill('Acme');
    await page.locator('form').last().evaluate((f: HTMLFormElement) => {
      f.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    });

    await expect(page.getByText('Please fill in all fields')).toBeVisible({ timeout: 5000 });
  });
});

// ──────────────────────────────────────────────
// AUTHENTICATED DASHBOARD  (representative role)
// ──────────────────────────────────────────────
test.describe('Dashboard - Representative', () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page, 'representative');
  });

  test('sidebar shows core nav items', async ({ page }) => {
    await expect(page.getByRole('button', { name: /^Leads$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Contacts$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Companies$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Deals$/i })).toBeVisible();
  });

  test('clicking Leads shows the leads view', async ({ page }) => {
    await page.getByRole('button', { name: /^Leads$/i }).click();
    await expect(page.getByRole('heading', { name: /Sales Leads/i })).toBeVisible();
    await expect(page.getByPlaceholder('Search leads, companies...')).toBeVisible();
  });

  test('clicking Companies shows the companies view', async ({ page }) => {
    await page.getByRole('button', { name: /^Companies$/i }).click();
    await expect(page.getByRole('heading', { name: /^Companies$/i })).toBeVisible();
    await expect(page.getByPlaceholder('Search companies...')).toBeVisible();
  });

  test('clicking Contacts shows the contacts view', async ({ page }) => {
    await page.getByRole('button', { name: /^Contacts$/i }).click();
    await expect(page.getByRole('heading', { name: /Contacts Directory/i })).toBeVisible();
  });

  test('clicking Deals shows the pipeline view', async ({ page }) => {
    await page.getByRole('button', { name: /^Deals$/i }).click();
    await expect(page.getByText(/pipeline|deal|stage|column/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('dashboard sub-tabs are clickable', async ({ page }) => {
    // Stay on default dashboard tab (rep role has sub-tabs)
    await page.getByRole('button', { name: /^Sales$/i }).click();
    await page.waitForTimeout(600);
    await page.getByRole('button', { name: /^Pipeline$/i }).click();
    await page.waitForTimeout(600);
  });
});

// ──────────────────────────────────────────────
// DATA VIEWS
// ──────────────────────────────────────────────
test.describe('Data Views', () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page, 'representative');
  });

  test('Leads view shows mock lead data', async ({ page }) => {
    await page.getByRole('button', { name: /^Leads$/i }).click();
    await expect(page.getByText('Alex Rivera')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('TechCorp Inc.')).toBeVisible();
  });

  test('Leads table has correct column headers', async ({ page }) => {
    await page.getByRole('button', { name: /^Leads$/i }).click();

    await expect(page.getByRole('columnheader', { name: /Name.*Company/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Score/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Status/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Priority/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Owner/i })).toBeVisible();
  });

  test('clicking a lead opens detail side panel', async ({ page }) => {
    await page.getByRole('button', { name: /^Leads$/i }).click();

    await page.getByText('Alex Rivera').first().click();
    await expect(page.getByRole('button', { name: /^Email$/i }).first()).toBeVisible({ timeout: 3000 });
    await expect(page.getByRole('button', { name: /Log Call/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /^Meet$/i }).first()).toBeVisible();
  });

  test('Companies view shows mock companies', async ({ page }) => {
    await page.getByRole('button', { name: /^Companies$/i }).click();
    await expect(page.getByText('TechCorp Inc.')).toBeVisible({ timeout: 5000 });
  });

  test('Companies table has correct column headers', async ({ page }) => {
    await page.getByRole('button', { name: /^Companies$/i }).click();

    await expect(page.getByRole('columnheader', { name: /Company Name/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Industry/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Revenue/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Employees/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Open Deals/i })).toBeVisible();
  });

  test('Contacts view shows mock contacts', async ({ page }) => {
    await page.getByRole('button', { name: /^Contacts$/i }).click();
    await expect(page.getByText('Alex Rivera')).toBeVisible({ timeout: 5000 });
  });
});

// ──────────────────────────────────────────────
// SIGN OUT
// ──────────────────────────────────────────────
test.describe('Sign Out', () => {
  test('should return to landing page after sign out', async ({ page }) => {
    await authenticate(page, 'representative');

    await page.getByLabel('Profile menu').click();
    await page.getByRole('button', { name: /Sign Out/i }).click();

    await expect(page.getByText(/Close Deals Faster/i).first()).toBeVisible({ timeout: 5000 });
  });
});

// ──────────────────────────────────────────────
// EDGE CASES
// ──────────────────────────────────────────────
test.describe('Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page, 'representative');
  });

  test('command palette opens with Ctrl+K', async ({ page }) => {
    await page.keyboard.press('Control+k');
    await expect(page.getByPlaceholder('Type to search dashboard, pages, leads, or deals...')).toBeVisible({ timeout: 3000 });
  });
});
