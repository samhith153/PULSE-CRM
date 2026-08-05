export type Role = 'representative' | 'manager' | 'admin';

export const ROLE_HOME: Record<Role, string> = {
  representative: 'home',
  manager: 'home',
  admin: 'home',
};

export const ROLE_TABS: Record<Role, Set<string>> = {
  representative: new Set([
    'home', 'leads', 'contacts', 'companies', 'deals', 'activities',
    'integrations', 'ai insights', 'reports',
    'notifications', 'settings', 'profile',
  ]),
  manager: new Set([
    'home', 'team pipeline', 'leads', 'companies', 'contacts', 'reports',
    'forecast', 'team performance', 'activities', 'calendar',
    'ai insights', 'integrations', 'notifications', 'settings', 'profile',
  ]),
  admin: new Set([
    'home', 'leads', 'contacts', 'companies', 'deals', 'products', 'activities',
    'ai insights', 'reports', 'settings', 'profile',
    'notifications', 'calendar', 'forecast', 'team performance', 'team pipeline',
    'users', 'roles & permissions', 'integrations', 'ai models', 'audit logs',
  ]),
};
