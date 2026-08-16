import { test, expect, type Page } from '@playwright/test';

/**
 * Dashboard E2E suite.
 *
 * The backend is not required: every /api/v1 request is intercepted and
 * answered with empty payloads, so the shell, routing, role guard, sidebar and
 * command palette are exercised against the real production build.
 *
 * Run with: npm run build && npx playwright test --config playwright-dashboard.config.ts
 */

type Role = 'sales_rep' | 'manager' | 'admin';

const TOKEN = 'e2e.test.token'; // must match /^\w+\.\w+\.\w+$/

function makeUser(role: Role) {
  return {
    id: '1',
    email: `${role}@pulse.test`,
    full_name: role === 'admin' ? 'Test Admin' : role === 'manager' ? 'Test Manager' : 'Test Rep',
    roles: [role],
    permissions: [],
    is_verified: true,
    organization_id: 'org1',
    avatar_url: null,
  };
}

/** Stub every API call with safe empty payloads. */
async function stubApi(page: Page, role: Role) {
  await page.route('**/api/v1/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();

    if (path === '/api/v1/auth/me') {
      return route.fulfill({ json: makeUser(role) });
    }
    if (path === '/api/v1/dashboard/me') {
      return route.fulfill({
        json: {
          kpis: { open_deals: 0, calls_today: 0 },
          deals: [],
          leads: [],
          meetings_today: [],
          open_tasks: [],
          priority_queue: [],
          deals_at_risk: [],
          quota_pace: null,
        },
      });
    }
    if (path.startsWith('/api/v1/dashboard/manager')) {
      return route.fulfill({
        json: {
          summary: { team_revenue: 0, forecast_projection: 0, pipeline_value: 0, quota_achievement: 0, team_members: 0, conversion_rate: 0, win_rate: 0, average_sales_cycle: 0 },
          revenue_stats: { team_revenue_won: 0, team_target: 0, achievement_pct: 0, monthly_growth_pct: 0 },
          forecast: { projected_revenue: 0, forecast_accuracy: 0, confidence_score: 0, expected_quarter_revenue: 0 },
          pipeline_health: { active_pipeline_value: 0, total_deals: 0, health_score: 0, stage_distribution: [] },
          rep_quota_attainment: [],
          monthly_revenue_trend: [],
          top_reps: [],
          deals_at_risk: [],
          alerts: [],
          recent_activities: [],
          team_metrics: { total_members: 0, active_reps: 0, avg_deal_size: 0, avg_sales_cycle_days: 0, team_conversion_rate: 0, win_rate: 0, forecast_accuracy: 0 },
        },
      });
    }
    if (path === '/api/v1/dashboard/admin') {
      return route.fulfill({
        json: {
          summary: {
            organizations: { total: 0, added_this_month: 0, monthly_growth_pct: 0 },
            users: { total: 0, active: 0, inactive: 0, new_this_month: 0 },
            companies: { total: 0, added_this_month: 0, monthly_growth_pct: 0 },
            contacts: { total: 0, new_this_month: 0, monthly_growth_pct: 0 },
            leads: { total: 0, new_today: 0, new_this_month: 0, monthly_growth_pct: 0, converted: 0, conversion_rate: 0 },
            revenue: { today: 0, this_week: 0, this_month: 0, this_year: 0, growth_pct: 0 },
            tasks: { pending: 0, overdue: 0, due_today: 0 },
          },
          monthly_sales: [],
          lead_sources: [],
          lead_funnel: [],
          top_sales_reps: [],
          top_companies: [],
          recent_activities: [],
          notifications: { overdue_tasks: 0, todays_meetings: 0, pending_approvals: 0, high_priority_leads: 0, system_alerts: 0 },
        },
      });
    }
    if (path.startsWith('/api/v1/notifications')) {
      return route.fulfill({ json: { items: [], total: 0, unread_count: 0 } });
    }
    if (path.includes('/stream/dashboard')) {
      return route.fulfill({ status: 200, contentType: 'text/event-stream', body: '' });
    }
    if (method === 'GET') {
      return route.fulfill({ json: [] });
    }
    return route.fulfill({ json: {} });
  });
}

/**
 * Log in as `role`: seed auth storage before the first navigation (standard
 * Playwright auth setup — deterministic, no handoff reload race) and open the
 * given path. The real query-param handoff is covered by its own test below.
 */
async function login(page: Page, role: Role, path = '/dashboard') {
  await stubApi(page, role);
  await page.addInitScript(
    ({ role: r, token }) => {
      localStorage.setItem('pulse-crm-role', r);
      localStorage.setItem('pulse-crm-user', `${r}@pulse.test`);
      sessionStorage.setItem('pulse-crm-auth', 'true');
      sessionStorage.setItem('pulse-crm-token', token);
    },
    { role, token: TOKEN },
  );
  await page.goto(path);
}

/** Sidebar nav button scoped to the <aside>. */
function sidebarNav(page: Page, name: string) {
  return page.locator('aside').getByRole('button', { name, exact: true });
}

test.describe('auth handoff', () => {
  test('landing auth params store the session and clean the URL (no token leak)', async ({ page }) => {
    await stubApi(page, 'sales_rep');
    await page.goto(`/dashboard?auth=true&role=sales_rep&token=${TOKEN}&email=sales_rep@pulse.test`);
    // Handoff reloads to a clean URL and renders the shell.
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('aside')).toContainText('Pulse CRM');
  });
});

test.describe('shell and navigation', () => {
  test('sales rep home renders the shell with rep nav', async ({ page }) => {
    await login(page, 'sales_rep');
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('aside')).toContainText('Pulse CRM');
    await expect(sidebarNav(page, 'Leads')).toBeVisible();
    await expect(sidebarNav(page, 'Deals')).toBeVisible();
    await expect(sidebarNav(page, 'Emails')).toBeVisible();
    // Manager/admin-only nav must NOT be present for a rep.
    await expect(sidebarNav(page, 'My Team')).toHaveCount(0);
    await expect(sidebarNav(page, 'Users')).toHaveCount(0);
  });

  test('manager and admin get their own nav', async ({ page }) => {
    await login(page, 'manager');
    await expect(page).toHaveURL('/dashboard');
    await expect(sidebarNav(page, 'My Team')).toBeVisible();
    await expect(sidebarNav(page, 'Targets')).toBeVisible();
  });

  test('admin home URL stays on its role home', async ({ page }) => {
    await login(page, 'admin', '/dashboard/admin');
    await expect(page).toHaveURL('/dashboard/admin');
    await expect(sidebarNav(page, 'Users')).toBeVisible();
    await expect(sidebarNav(page, 'Teams')).toBeVisible();
  });

  test('sidebar clicks navigate to real URLs', async ({ page }) => {
    await login(page, 'sales_rep');
    await sidebarNav(page, 'Leads').click();
    await expect(page).toHaveURL('/dashboard/leads');

    await sidebarNav(page, 'Deals').click();
    await expect(page).toHaveURL('/dashboard/deals');

    await sidebarNav(page, 'Home').click();
    await expect(page).toHaveURL('/dashboard');
  });
});

test.describe('role guard', () => {
  test('sales rep is redirected away from admin/manager pages', async ({ page }) => {
    await login(page, 'sales_rep', '/dashboard/users');
    await expect(page).toHaveURL('/dashboard');

    await login(page, 'sales_rep', '/dashboard/targets');
    await expect(page).toHaveURL('/dashboard');

    await login(page, 'sales_rep', '/dashboard/teams');
    await expect(page).toHaveURL('/dashboard');
  });

  test('manager is redirected away from rep pages', async ({ page }) => {
    await login(page, 'manager', '/dashboard/emails');
    await expect(page).toHaveURL('/dashboard/manager');

    await login(page, 'manager', '/dashboard/deals/5');
    await expect(page).toHaveURL('/dashboard/manager');

    await login(page, 'manager', '/dashboard/workflows');
    await expect(page).toHaveURL('/dashboard/manager');
  });

  test('admin is redirected away from rep pages', async ({ page }) => {
    await login(page, 'admin', '/dashboard/emails');
    await expect(page).toHaveURL('/dashboard/admin');

    await login(page, 'admin', '/dashboard/workflows');
    await expect(page).toHaveURL('/dashboard/admin');
  });

  test('allowed pages are not redirected', async ({ page }) => {
    await login(page, 'admin', '/dashboard/users');
    await expect(page).toHaveURL('/dashboard/users');
    await expect(page.locator('aside')).toContainText('Pulse CRM');
  });
});

test.describe('deep links', () => {
  test('record detail URLs render inside the shell', async ({ page }) => {
    await login(page, 'sales_rep', '/dashboard/leads/123');
    await expect(page).toHaveURL('/dashboard/leads/123');
    await expect(page.locator('aside')).toContainText('Pulse CRM');

    await login(page, 'sales_rep', '/dashboard/contacts/42');
    await expect(page).toHaveURL('/dashboard/contacts/42');
  });
});

test.describe('command palette (Ctrl+K)', () => {
  test('opens and navigates to the matching route', async ({ page }) => {
    await login(page, 'manager');
    await page.keyboard.press('Control+k');

    const input = page.getByPlaceholder('Type a command or search...');
    await expect(input).toBeVisible();
    await input.fill('team');

    // Manager palette offers manager destinations only.
    await expect(page.getByText('Go to My Team', { exact: true })).toBeVisible();
    await expect(page.getByText('Go to Users', { exact: true })).toHaveCount(0);

    await page.getByText('Go to My Team', { exact: true }).click();
    await expect(page).toHaveURL('/dashboard/team');
  });

  test('rep palette offers rep destinations', async ({ page }) => {
    await login(page, 'sales_rep');
    await page.keyboard.press('Control+k');
    const input = page.getByPlaceholder('Type a command or search...');
    await expect(input).toBeVisible();
    await input.fill('email');

    await page.getByText('Go to Emails', { exact: true }).click();
    await expect(page).toHaveURL('/dashboard/emails');
  });
});

test.describe('legacy routes and root', () => {
  test('legacy /activities and /reports redirect to /dashboard', async ({ page }) => {
    await login(page, 'sales_rep', '/activities');
    await expect(page).toHaveURL('/dashboard/activities');

    await login(page, 'sales_rep', '/activities/42');
    await expect(page).toHaveURL('/dashboard/activities/42');

    await login(page, 'manager', '/reports/manager');
    await expect(page).toHaveURL('/dashboard/reports');

    await login(page, 'admin', '/reports/admin');
    await expect(page).toHaveURL('/dashboard/reports');
  });

  test('root page sends authenticated users to /dashboard', async ({ page }) => {
    await login(page, 'sales_rep');
    await page.goto('/');
    await expect(page).toHaveURL('/dashboard');
  });
});
