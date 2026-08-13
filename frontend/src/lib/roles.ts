export type Role = 'sales_rep' | 'manager' | 'admin';


export const ROLE_HOME: Record<Role, string> = {
  sales_rep: 'home',
  manager: 'home',
  admin: 'home',
};

export const ROLE_TABS: Record<Role, Set<string>> = {
  sales_rep: new Set([
    'home', 'leads', 'contacts', 'companies', 'deals', 'activities',
    'integrations', 'ai insights', 'reports',
    'notifications', 'settings', 'profile',
  ]),
  manager: new Set([
    'home', 'my team', 'targets', 'team pipeline', 'leads', 'companies', 'contacts', 'reports',
    'forecast', 'team performance', 'activities', 'calendar',
    'ai insights', 'integrations', 'notifications', 'settings', 'profile',
  ]),
  admin: new Set([
    'home', 'leads', 'contacts', 'companies', 'deals', 'products', 'activities',
    'ai insights', 'reports', 'settings', 'profile',
    'notifications', 'calendar', 'forecast', 'team performance', 'team pipeline',
    'teams', 'users', 'roles & permissions', 'integrations', 'ai models', 'audit logs', 'recycle bin',
  ]),
};