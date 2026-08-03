export type Role = 'sales_rep' | 'manager' | 'admin';

export const ROLE_HOME: Record<Role, string> = {
  sales_rep: 'dashboard',
  manager: 'dashboard',
  admin: 'dashboard',
};

export const ROLE_TABS: Record<Role, Set<string>> = {
  sales_rep: new Set([
    'dashboard', 'leads', 'contacts', 'companies', 'deals', 'activities', 'emails',
    'integrations', 'workflows', 'ai insights', 'reports', 'documents',
    'notifications', 'settings', 'profile',
  ]),
  manager: new Set([
    'dashboard', 'team pipeline', 'leads', 'companies', 'contacts', 'reports',
    'forecast', 'team performance', 'activities', 'calendar', 'emails',
    'ai insights', 'integrations', 'notifications', 'settings', 'profile',
  ]),
  admin: new Set([
    'dashboard', 'leads', 'contacts', 'companies', 'deals', 'products', 'activities',
    'emails', 'documents', 'workflows', 'ai insights', 'reports', 'settings', 'profile',
    'notifications', 'calendar', 'forecast', 'team performance', 'team pipeline',
    'users', 'roles & permissions', 'integrations', 'automation', 'ai models', 'audit logs',
  ]),
};
