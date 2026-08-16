export type Role = 'sales_rep' | 'manager' | 'admin';

export const ROLE_HOME: Record<Role, string> = {
  sales_rep: 'home',
  manager: 'home',
  admin: 'home',
};

/**
 * Tabs each role is allowed to visit — the access-control source enforced by
 * the dashboard guard (DashboardAppContext). Users who open a route outside
 * their role's set are redirected to their role home.
 *
 * Keep this in sync with the navigation surfaced in lib/dashboard-nav.ts
 * (NAV_SECTIONS + NAV_EXTRA_ITEMS + NAV_HOME): every tab shown to a role there
 * must be present in that role's set here, otherwise the sidebar / command
 * palette would send users into a redirect loop.
 */
export const ROLE_TABS: Record<Role, Set<string>> = {
  sales_rep: new Set([
    'home', 'leads', 'contacts', 'companies', 'deals', 'activities', 'emails',
    'tasks', 'calendar', 'workflows', 'ai insights', 'reports', 'documents',
    'settings', 'profile', 'notifications', 'integrations',
  ]),
  manager: new Set([
    'home', 'my team', 'targets', 'team pipeline', 'leads', 'companies',
    'contacts', 'reports', 'forecast', 'team performance', 'activities',
    'ai insights', 'documents', 'settings', 'notifications', 'tasks',
    'calendar', 'profile', 'integrations',
  ]),
  admin: new Set([
    'home', 'leads', 'contacts', 'companies', 'deals', 'activities', 'tasks',
    'calendar', 'ai insights', 'reports', 'settings', 'profile', 'notifications',
    'forecast', 'team performance', 'team pipeline', 'teams', 'users',
    'roles & permissions', 'integrations', 'ai models', 'automation',
    'audit logs', 'recycle bin', 'products',
  ]),
};
