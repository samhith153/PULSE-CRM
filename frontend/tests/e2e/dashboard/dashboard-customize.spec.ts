import { test, expect, type Page } from '@playwright/test';

/**
 * Customize-layout E2E for manager + admin dashboards.
 *
 * Verifies that dragging a section via its grip handle actually sticks in the
 * new position (the earlier bug: sections rendered in fixed JSX order snapped
 * back on drop), persists to localStorage, and survives a reload.
 *
 * Note: a tall viewport is required — grip handles sit well below the default
 * 720px viewport, and dnd-kit activation needs real pointer input on the handle.
 * Backend is not required: every /api/v1 request is stubbed (same approach as
 * dashboard.spec.ts).
 */

type Role = 'manager' | 'admin';

const TOKEN = 'e2e.test.token'; // must match /^\w+\.\w+\.\w+$/

test.use({ viewport: { width: 1280, height: 2200 } });

function makeUser(role: Role) {
  return {
    id: '1',
    email: `${role}@pulse.test`,
    full_name: role === 'admin' ? 'Test Admin' : 'Test Manager',
    roles: [role],
    permissions: [],
    is_verified: true,
    organization_id: 'org1',
    avatar_url: null,
  };
}

/** Stub every API call with payloads rich enough for all sections to render. */
async function stubApi(page: Page, role: Role) {
  await page.route('**/api/v1/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();

    if (path === '/api/v1/auth/me') {
      return route.fulfill({ json: makeUser(role) });
    }
    if (path.startsWith('/api/v1/dashboard/manager')) {
      return route.fulfill({
        json: {
          summary: { team_revenue: 1200000, pipeline_value: 5200000, forecast_projection: 0, quota_achievement: 0, team_members: 0, conversion_rate: 0, win_rate: 0, average_sales_cycle: 0 },
          revenue_stats: { team_revenue_won: 1000000, team_target: 1500000, achievement_pct: 68, monthly_growth_pct: 12 },
          forecast: { projected_revenue: 1350000, forecast_accuracy: 0, confidence_score: 72, expected_quarter_revenue: 0 },
          pipeline_health: {
            active_pipeline_value: 5200000,
            total_deals: 210,
            health_score: 74,
            stage_distribution: [
              { stage: 'New', deal_count: 84, total_value: 41100000, percentage: 40 },
              { stage: 'Qualified', deal_count: 52, total_value: 15100000, percentage: 25 },
              { stage: 'Proposal', deal_count: 36, total_value: 15100000, percentage: 17 },
              { stage: 'Negotiation', deal_count: 22, total_value: 11200000, percentage: 11 },
              { stage: 'Closed Won', deal_count: 16, total_value: 12300000, percentage: 7 },
            ],
          },
          rep_quota_attainment: [
            { user_id: 'u1', full_name: 'Alice', revenue_generated: 420000, quota_achievement_pct: 92 },
            { user_id: 'u2', full_name: 'Bob', revenue_generated: 310000, quota_achievement_pct: 71 },
            { user_id: 'u3', full_name: 'Carol', revenue_generated: 220000, quota_achievement_pct: 55 },
          ],
          monthly_revenue_trend: [
            { month: '2026-02', revenue: 900000, target: 1000000 },
            { month: '2026-03', revenue: 1050000, target: 1100000 },
            { month: '2026-04', revenue: 980000, target: 1150000 },
            { month: '2026-05', revenue: 1200000, target: 1200000 },
          ],
          top_reps: [],
          deals_at_risk: [
            { deal_id: 'd1', deal_name: 'Acme Renewal', company: 'Acme', deal_value: 250000, owner_name: 'Alice', risk_reason: 'stalled 20d', days_since_last_activity: 20 },
          ],
          alerts: [{ severity: 'high', message: 'Quota gap for Bob', timestamp: '2026-08-10T10:00:00Z' }],
          recent_activities: [{ id: 1, title: 'Alice closed Acme deal', action: 'deal.won', created_at: '2026-08-11T05:00:00Z', created_by: 'Alice' }],
          team_metrics: { total_members: 5, active_reps: 3, avg_deal_size: 0, avg_sales_cycle_days: 0, team_conversion_rate: 0, win_rate: 0, forecast_accuracy: 0 },
        },
      });
    }
    if (path === '/api/v1/dashboard/admin') {
      return route.fulfill({
        json: {
          summary: {
            organizations: { total: 4, added_this_month: 1, monthly_growth_pct: 5 },
            users: { total: 20, active: 18, inactive: 2, new_this_month: 2 },
            companies: { total: 120, added_this_month: 6, monthly_growth_pct: 8 },
            contacts: { total: 900, new_this_month: 40, monthly_growth_pct: 6 },
            leads: { total: 500, new_today: 5, new_this_month: 60, monthly_growth_pct: 9, converted: 40, conversion_rate: 8 },
            revenue: { today: 100000, this_week: 500000, this_month: 2200000, this_year: 18000000, growth_pct: 12 },
            tasks: { pending: 30, overdue: 2, due_today: 5 },
          },
          monthly_sales: [],
          lead_sources: [{ source: 'Website', percentage: 55 }, { source: 'Referral', percentage: 45 }],
          lead_funnel: [],
          top_sales_reps: [],
          top_companies: [
            { company_id: 'c1', name: 'Acme Corp', revenue: 5000000, lead_count: 40, contact_count: 120 },
            { company_id: 'c2', name: 'Globex', revenue: 3500000, lead_count: 25, contact_count: 80 },
          ],
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

/** Visual top-to-bottom order of every section grip handles. */
async function handleOrder(page: Page, count: number): Promise<number[]> {
  const handles = page.getByTitle('Drag to reorder');
  await expect(handles).toHaveCount(count);
  const order: number[] = [];
  for (let i = 0; i < count; i++) {
    const box = await handles.nth(i).boundingBox();
    if (!box) throw new Error('missing handle bbox');
    order.push(box.y);
  }
  return order;
}

/**
 * Drag a grip handle using real pointer input (Playwright's `dragTo` moves too
 * quickly for dnd-kit's sensor activation to engage reliably; a manual slow
 * mouse sequence does). Requires a viewport tall enough to contain both ends.
 */
async function dragHandleByIndex(page: Page, fromIndex: number, toIndex: number) {
  const handles = page.getByTitle('Drag to reorder');
  const src = await handles.nth(fromIndex).boundingBox();
  const dst = await handles.nth(toIndex).boundingBox();
  if (!src || !dst) throw new Error('missing handle bbox for drag');

  const startX = src.x + src.width / 2;
  const startY = src.y + src.height / 2;
  const endX = dst.x + dst.width / 2;
  const endY = dst.y + dst.height / 2;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.waitForTimeout(150);
  // Approach the target in a few steps so the sensor activates and `over` updates.
  const steps = 12;
  for (let i = 1; i <= steps; i++) {
    const x = startX + ((endX - startX) * i) / steps;
    const y = startY + ((endY - startY) * i) / steps;
    await page.mouse.move(x, y);
  }
  await page.waitForTimeout(150);
  await page.mouse.up();
  await page.waitForTimeout(300);
}

test.describe('manager customize layout', () => {
  test('dragging the last section to the top sticks, persists, and survives reload', async ({ page }) => {
    await login(page, 'manager', '/dashboard/manager');
    await expect(page.getByText('Welcome back, Manager')).toBeVisible();

    // Sections must render before customizing.
    await expect(page.getByText('Revenue vs Target')).toBeVisible();

    await page.getByRole('button', { name: 'Customize Layout' }).click();
    await expect(page.getByText('Dashboard Customizer Active')).toBeVisible();

    // Manager has 5 sections: kpi, revenue, pipeline, team, actions.
    const before = await handleOrder(page, 5);
    expect([...before].sort((a, b) => a - b)).toEqual(before); // ascending = current DOM top-to-bottom

    // Drag the last handle (Manager Action Queue) onto the first (KPI cards).
    await dragHandleByIndex(page, 4, 0);

    // The dragged section must now be visual top-of-page (y of last handle < y of first).
    await expect(async () => {
      const after = await handleOrder(page, 5);
      expect(after[4]).toBeLessThan(after[0]);
    }).toPass();

    // Persisted layout must reflect the new order.
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('pulse-crm-manager-layout') || '{}'));
    expect(saved.layout[0]).toBe('actions');
    expect(saved.layout).toContain('kpi');
    expect(saved.layout.length).toBe(5);

    // Save (leave edit mode), reload, re-enter customize: order must persist.
    await page.getByRole('button', { name: 'Save Layout' }).click();
    await page.reload();
    await expect(page.getByText('Welcome back, Manager')).toBeVisible();
    await page.getByRole('button', { name: 'Customize Layout' }).click();
    await expect(page.getByText('Dashboard Customizer Active')).toBeVisible();

    const persisted = await handleOrder(page, 5);
    expect(persisted[4]).toBeLessThan(persisted[0]);
  });
});

test.describe('admin customize layout', () => {
  test('dragging the last section to the top sticks, persists, and survives reload', async ({ page }) => {
    await login(page, 'admin', '/dashboard/admin');
    await expect(page.getByText('Admin overview')).toBeVisible();
    await expect(page.getByText('Top companies')).toBeVisible();

    await page.getByRole('button', { name: 'Customize Layout' }).click();
    await expect(page.getByText('Dashboard Customizer Active')).toBeVisible();

    // Admin has 4 sections: kpi, revenue, systems, companies.
    const before = await handleOrder(page, 4);
    expect([...before].sort((a, b) => a - b)).toEqual(before);

    // Drag the last handle (Top Companies) onto the first (KPI cards).
    await dragHandleByIndex(page, 3, 0);

    await expect(async () => {
      const after = await handleOrder(page, 4);
      expect(after[3]).toBeLessThan(after[0]);
    }).toPass();

    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('pulse-crm-admin-layout') || '{}'));
    expect(saved.layout[0]).toBe('companies');
    expect(saved.layout.length).toBe(4);

    // Save, reload, re-enter customize: order must persist.
    await page.getByRole('button', { name: 'Save Layout' }).click();
    await page.reload();
    await expect(page.getByText('Admin overview')).toBeVisible();
    await page.getByRole('button', { name: 'Customize Layout' }).click();
    await expect(page.getByText('Dashboard Customizer Active')).toBeVisible();

    const persisted = await handleOrder(page, 4);
    expect(persisted[3]).toBeLessThan(persisted[0]);
  });
});