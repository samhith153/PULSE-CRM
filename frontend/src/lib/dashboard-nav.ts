import type { Role } from './roles';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  Award,
  BarChart3,
  Bell,
  Building2,
  Calendar,
  Contact,
  FileText,
  Layers,
  LayoutDashboard,
  Mail,
  Package,
  Settings,
  Shield,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  User,
  UserCog,
  Users,
  Zap,
} from 'lucide-react';

/**
 * Central navigation config — the single source of truth that maps dashboard
 * tab keys to real URLs. Every sidebar item, command-palette shortcut and
 * route page derives from this file, so adding a new feature page is a
 * one-line change here (plus the page file).
 */

/** Tab key (as used across views & sidebar) -> URL path segment. */
export const TAB_TO_PATH: Record<string, string> = {
  home: '', // resolved to the role home below
  leads: 'leads',
  contacts: 'contacts',
  companies: 'companies',
  deals: 'deals',
  activities: 'activities',
  emails: 'emails',
  tasks: 'tasks',
  calendar: 'calendar',
  workflows: 'workflows',
  'ai insights': 'ai-insights',
  reports: 'reports',
  documents: 'documents',
  settings: 'settings',
  profile: 'profile',
  notifications: 'notifications',
  products: 'products',
  'my team': 'team',
  targets: 'targets',
  'team pipeline': 'pipeline',
  'team performance': 'team-performance',
  forecast: 'forecast',
  teams: 'teams',
  users: 'users',
  'roles & permissions': 'roles-permissions',
  'recycle bin': 'recycle-bin',
  'audit logs': 'audit-logs',
  integrations: 'integrations',
  automation: 'automation',
  'ai models': 'ai-models',
};

/** Reverse map: URL path segment -> tab key. */
export const PATH_TO_TAB: Record<string, string> = Object.fromEntries(
  Object.entries(TAB_TO_PATH)
    .filter(([, seg]) => seg !== '')
    .map(([tab, seg]) => [seg, tab]),
);

/** Home URL per role (keeps existing landing-page redirects working). */
export const ROLE_HOME_PATH: Record<Role, string> = {
  sales_rep: '/dashboard',
  manager: '/dashboard/manager',
  admin: '/dashboard/admin',
};

/** Role gates for the two legacy role-scoped home URLs. */
export const PATH_REQUIRED_ROLE: Record<string, Role> = {
  '/dashboard/admin': 'admin',
  '/dashboard/manager': 'manager',
};

export function roleHomePath(role: Role): string {
  return ROLE_HOME_PATH[role] ?? '/dashboard';
}

/** Resolve a tab key to its route path for the given role. */
export function tabToPath(tab: string, role: Role): string {
  if (tab === 'home') return roleHomePath(role);
  const seg = TAB_TO_PATH[tab];
  return seg ? `/dashboard/${seg}` : roleHomePath(role);
}

/**
 * Resolve a pathname back to a tab key.
 * - Paths under /dashboard map 1:1 to their tab.
 * - The legacy role homes (/dashboard/admin, /dashboard/manager) are 'home'.
 * - Anything else (e.g. /activities, /reports/*) falls back to `fallback`.
 */
export function pathToTab(pathname: string, fallback: string): string {
  const rest = pathname.replace(/^\/dashboard/, '').replace(/^\/+/, '');
  if (!rest) return 'home';
  if (rest === 'admin' || rest === 'manager') return 'home';
  const seg = rest.split('/')[0];
  return PATH_TO_TAB[seg] ?? fallback;
}

/** Role that is required to visit a pathname, or null when open to any role. */
export function pathRequiredRole(pathname: string): Role | null {
  return PATH_REQUIRED_ROLE[pathname] ?? null;
}

/* ── Navigation items ───────────────────────────────────────────────────────
 * The sidebar and command palette both render from these definitions, so a
 * nav entry's label, icon, tab key and URL are all defined here — one place.
 */

export type NavItem = {
  /** Tab key — must exist in TAB_TO_PATH above. */
  tab: string;
  /** Display label. */
  name: string;
  /** Icon. */
  icon: LucideIcon;
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

/** Home nav entry (rendered above the sections in the sidebar). */
export const NAV_HOME: NavItem = { tab: 'home', name: 'Home', icon: LayoutDashboard };

/** Sidebar sections per role. */
export const NAV_SECTIONS: Record<Role, NavSection[]> = {
  manager: [
    {
      label: 'Sales',
      items: [
        { tab: 'my team', name: 'My Team', icon: UserCog },
        { tab: 'targets', name: 'Targets', icon: Target },
        { tab: 'team pipeline', name: 'Team Pipeline', icon: Layers },
        { tab: 'leads', name: 'Leads', icon: Users },
        { tab: 'companies', name: 'Companies', icon: Building2 },
        { tab: 'contacts', name: 'Contacts', icon: Contact },
      ],
    },
    {
      label: 'Forecasting',
      items: [
        { tab: 'reports', name: 'Reports', icon: BarChart3 },
        { tab: 'forecast', name: 'Forecast', icon: TrendingUp },
        { tab: 'team performance', name: 'Team Performance', icon: Award },
      ],
    },
    {
      label: 'Productivity',
      items: [
        { tab: 'activities', name: 'Activities', icon: Activity },
        { tab: 'ai insights', name: 'AI Insights', icon: Sparkles },
        { tab: 'documents', name: 'Documents', icon: FileText },
      ],
    },
    {
      label: 'Settings',
      items: [
        { tab: 'settings', name: 'Settings', icon: Settings },
        { tab: 'notifications', name: 'Notifications', icon: Bell },
      ],
    },
  ],

  admin: [
    {
      label: 'People',
      items: [
        { tab: 'teams', name: 'Teams', icon: UserCog },
        { tab: 'users', name: 'Users', icon: Users },
        { tab: 'roles & permissions', name: 'Roles & Perms', icon: Shield },
      ],
    },
    {
      label: 'Data',
      items: [{ tab: 'recycle bin', name: 'Recycle Bin', icon: Trash2 }],
    },
    {
      label: 'Records',
      items: [
        { tab: 'companies', name: 'Companies', icon: Building2 },
        { tab: 'contacts', name: 'Contacts', icon: Contact },
        { tab: 'products', name: 'Products', icon: Package },
      ],
    },
    {
      label: 'Intelligence',
      items: [
        { tab: 'reports', name: 'Reports', icon: BarChart3 },
        { tab: 'audit logs', name: 'Audit Logs', icon: Activity },
      ],
    },
    {
      label: 'Settings',
      items: [
        { tab: 'settings', name: 'Settings', icon: Settings },
        { tab: 'notifications', name: 'Notifications', icon: Bell },
      ],
    },
  ],

  sales_rep: [
    {
      label: 'Productivity',
      items: [
        { tab: 'leads', name: 'Leads', icon: Users },
        { tab: 'contacts', name: 'Contacts', icon: Contact },
        { tab: 'companies', name: 'Companies', icon: Building2 },
        { tab: 'deals', name: 'Deals', icon: Layers },
        { tab: 'activities', name: 'Activities', icon: Activity },
        { tab: 'emails', name: 'Emails', icon: Mail },
      ],
    },
    {
      label: 'Automations & Intelligence',
      items: [
        { tab: 'workflows', name: 'Workflows', icon: Zap },
        { tab: 'ai insights', name: 'AI Insights', icon: Sparkles },
      ],
    },
    {
      label: 'Data & Analytics',
      items: [
        { tab: 'reports', name: 'Reports', icon: BarChart3 },
        { tab: 'documents', name: 'Documents', icon: FileText },
      ],
    },
    {
      label: 'Settings',
      items: [
        { tab: 'settings', name: 'Settings', icon: Settings },
        { tab: 'notifications', name: 'Notifications', icon: Bell },
      ],
    },
  ],
};

/** Extra destinations surfaced in the command palette (not in the sidebar). */
export const NAV_EXTRA_ITEMS: NavItem[] = [
  { tab: 'tasks', name: 'Tasks', icon: FileText },
  { tab: 'calendar', name: 'Calendar', icon: Calendar },
  { tab: 'profile', name: 'Profile', icon: User },
];

export function getNavSections(role: Role): NavSection[] {
  return NAV_SECTIONS[role] ?? [];
}
