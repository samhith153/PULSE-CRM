import { Page, BrowserContext } from '@playwright/test';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type UserRole = 'admin' | 'manager' | 'representative';

const ROLE_USER_MAP: Record<UserRole, { name: string; email: string; password: string }> = {
  admin: { name: 'System Admin', email: 'admin@kalnet-pulse.com', password: 'Admin1234!' },
  manager: { name: 'Alex Johnson', email: 'manager@test.com', password: 'Manager1234!' },
  representative: { name: 'Sarah Johnson', email: 'rep@test.com', password: 'Rep1234!' },
};

/**
 * Inject auth into sessionStorage/localStorage BEFORE page JS runs.
 * This bypasses the real login flow for faster, deterministic tests.
 */
export async function authenticateViaStorage(page: Page, role: UserRole = 'representative'): Promise<void> {
  const user = ROLE_USER_MAP[role];
  await page.addInitScript((r) => {
    sessionStorage.setItem('pulse-crm-auth', 'true');
    localStorage.setItem('pulse-crm-role', r);
    localStorage.setItem('pulse-crm-user', r === 'admin' ? 'System Admin' : r === 'manager' ? 'Alex Johnson' : 'Sarah Johnson');
  }, role);
}

/**
 * Navigate to the app with storage-based auth pre-injected.
 * Call this AFTER authenticateViaStorage() — it navigates to '/' and waits for load.
 */
export async function loginViaStorage(page: Page, role: UserRole = 'representative'): Promise<void> {
  await authenticateViaStorage(page, role);
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
}

/**
 * Perform a real login via the backend API. Returns the JWT token.
 * Use this when tests need a valid token for API-level operations.
 */
export async function loginViaAPI(
  role: UserRole = 'representative'
): Promise<{ token: string; refreshToken: string; userId: number }> {
  const user = ROLE_USER_MAP[role];
  const response = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email, password: user.password }),
  });

  if (!response.ok) {
    throw new Error(`API login failed for ${role}: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return {
    token: data.data.access_token,
    refreshToken: data.data.refresh_token,
    userId: data.data.user.id,
  };
}

/**
 * Register a new test user via the backend API. Returns the JWT token.
 * Useful for tests that need a fresh user.
 */
export async function registerViaAPI(userData: {
  organizationName: string;
  fullName: string;
  email: string;
  password: string;
}): Promise<{ token: string; refreshToken: string; userId: number; orgId: number }> {
  const response = await fetch(`${API_BASE}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    throw new Error(`API register failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return {
    token: data.data.access_token,
    refreshToken: data.data.refresh_token,
    userId: data.data.user.id,
    orgId: data.data.organization.id,
  };
}

/**
 * Inject a real JWT token into the page's sessionStorage before navigation.
 * Combines storage-based auth with a real API token.
 */
export async function loginWithRealToken(page: Page, role: UserRole = 'representative'): Promise<string> {
  const { token } = await loginViaAPI(role);

  await page.addInitScript((args) => {
    sessionStorage.setItem('pulse-crm-auth', 'true');
    sessionStorage.setItem('pulse-crm-token', args.token);
    localStorage.setItem('pulse-crm-role', args.role);
    localStorage.setItem('pulse-crm-user', args.role === 'admin' ? 'System Admin' : args.role === 'manager' ? 'Alex Johnson' : 'Sarah Johnson');
  }, { token, role });

  return token;
}

/**
 * Open auth modal via the "Get Started Free" button.
 */
export async function openAuthModal(page: Page): Promise<void> {
  const cta = page.getByRole('button', { name: /Get Started Free/i }).first();
  await cta.click();
}

/**
 * Scoped auth modal form (excludes the newsletter form).
 */
export function authForm(page: Page) {
  return page.locator('form').filter({ hasText: /Password|Email|Create Account|Sign In/i });
}

export { ROLE_USER_MAP, type UserRole };
