'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { DashboardLayoutProvider } from './DashboardLayoutContext';
import { useDashboardOverview } from '@/hooks/use-dashboard';
import { useCrmStream } from '@/hooks/use-crm-stream';
import {
  clearToken,
  setToken,
  setRefreshToken,
  type EmailComposeTarget,
  type DashboardOverviewData,
} from '@/utils/api';
import { pathToTab, tabToPath, roleHomePath, pathRequiredRole } from '@/lib/dashboard-nav';
import { ROLE_TABS, type Role } from '@/lib/roles';

export interface DashboardAppContextValue {
  /** Whether the signed-in user passed the auth + role guard. */
  authorized: boolean;
  /** Effective role of the signed-in user. */
  userRole: Role;
  /** Currently active tab derived from the URL. */
  activeTab: string;
  /** Navigate to a tab's route (keeps the legacy `setActiveTab` API). */
  navigateToTab: (tab: string) => void;
  /** Open the Emails page with a one-click AI draft for the recipient. */
  openEmailCompose: (target: Omit<EmailComposeTarget, 'requestId'>) => void;
  composeTarget: EmailComposeTarget | null;
  consumeCompose: () => void;
  isReportModalOpen: boolean;
  openReportModal: () => void;
  closeReportModal: () => void;
  isCommandPaletteOpen: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  isCustomizerOpen: boolean;
  openCustomizer: () => void;
  closeCustomizer: () => void;
  signOut: () => void;
  collapsed: boolean;
  toggleCollapsed: () => void;
  /** Unified dashboard data (GET /api/v1/dashboard/me) + SSE-backed refetch. */
  dashboardData: DashboardOverviewData | null;
  refetchDashboard: () => void;
}

const DashboardAppContext = createContext<DashboardAppContextValue | undefined>(undefined);

export function useDashboardApp(): DashboardAppContextValue {
  const ctx = useContext(DashboardAppContext);
  if (!ctx) {
    throw new Error('useDashboardApp must be used within DashboardAppProvider');
  }
  return ctx;
}

interface DashboardAppProviderProps {
  /** Enforce a specific role (legacy role-scoped entry pages only). */
  requiredRole?: Role;
  /** Fallback tab for paths outside /dashboard (e.g. /activities). */
  defaultTab?: string;
  children: React.ReactNode;
}

/**
 * App-wide state for the dashboard shell. Lives above the chrome (Sidebar /
 * Header / modals) so it persists across route navigations — the shell never
 * unmounts between pages, only the page content swaps.
 */
export default function DashboardAppProvider({
  requiredRole,
  defaultTab = 'home',
  children,
}: DashboardAppProviderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [authorized, setAuthorized] = useState(false);
  const [userRole, setUserRole] = useState<Role>(() => {
    if (typeof window === 'undefined') return requiredRole ?? 'sales_rep';
    return (localStorage.getItem('pulse-crm-role') as Role) || requiredRole || 'sales_rep';
  });
  const [collapsed, setCollapsed] = useState(false);
  const [composeTarget, setComposeTarget] = useState<EmailComposeTarget | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  const activeTab = pathToTab(pathname, defaultTab);

  // ── Auth handoff from the landing page (sessionStorage does not cross
  // origins, so the token is passed through query params once) ──────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authParam = params.get('auth');
    const roleParam = params.get('role');
    const emailParam = params.get('email');
    const tokenParam = params.get('token');
    const refreshTokenParam = params.get('refresh_token');

    if (authParam === 'true' && roleParam) {
      // Validate token looks like a JWT (three dot-separated base64 segments)
      if (tokenParam && /^\w+\.\w+\.\w+$/.test(tokenParam)) {
        setToken(tokenParam);
      }
      if (refreshTokenParam && /^\w+\.\w+\.\w+$/.test(refreshTokenParam)) {
        setRefreshToken(refreshTokenParam);
      }
      sessionStorage.setItem('pulse-crm-auth', 'true');
      localStorage.setItem('pulse-crm-role', roleParam);
      if (emailParam) localStorage.setItem('pulse-crm-user', emailParam);
      // Clean URL — remove the token from the address bar. A full navigation is
      // used (not history.replaceState / router.replace): raw replaceState left
      // the router's internal URL stale (the old query resurfaced on later
      // pushes), and Next's router preserves search params on replaces. The
      // token itself survives the reload via sessionStorage (pulse-crm-token).
      window.location.replace(window.location.pathname);
    }
  }, []);

  // ── Auth & role guard ─────────────────────────────────────────────────────
  useEffect(() => {
    const auth = sessionStorage.getItem('pulse-crm-auth') === 'true';
    const storedRole = (localStorage.getItem('pulse-crm-role') || null) as Role | null;
    const role = storedRole ?? requiredRole ?? 'sales_rep';
    setUserRole(role);

    if (!auth) {
      router.push('/login');
      return;
    }

    // Explicit role gate (legacy pages like /activities, /reports/*)
    if (requiredRole && storedRole && storedRole !== requiredRole) {
      router.push(roleHomePath(storedRole));
      return;
    }

    // Path-based role gate (/dashboard/admin, /dashboard/manager)
    const pathRole = pathRequiredRole(pathname);
    if (pathRole && storedRole && storedRole !== pathRole) {
      router.push(roleHomePath(storedRole));
      return;
    }

    // Per-tab role gate — ROLE_TABS defines which tabs each role may visit.
    // Redirects e.g. a sales rep away from /dashboard/users or a manager away
    // from /dashboard/emails back to their role home.
    if (storedRole && !ROLE_TABS[storedRole].has(activeTab)) {
      router.push(roleHomePath(storedRole));
      return;
    }

    setAuthorized(true);
  }, [pathname, requiredRole, activeTab, router]);

  // Global listener for Ctrl+K (with input/textarea focus guard)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ── Unified dashboard data + real-time SSE invalidation ──────────────────
  const dashboardOverview = useDashboardOverview();
  const refetchDashboard = dashboardOverview.refetch;

  useCrmStream({
    enabled: authorized,
    onInvalidate: refetchDashboard,
  });

  // ── Actions ───────────────────────────────────────────────────────────────
  const navigateToTab = useCallback(
    (tab: string) => {
      router.push(tabToPath(tab, userRole));
    },
    [router, userRole],
  );

  const openEmailCompose = useCallback(
    (target: Omit<EmailComposeTarget, 'requestId'>) => {
      if (!target.to) return;
      setComposeTarget({ ...target, requestId: Date.now() });
      router.push(tabToPath('emails', userRole));
    },
    [router, userRole],
  );

  const consumeCompose = useCallback(() => setComposeTarget(null), []);

  const openReportModal = useCallback(() => setIsReportModalOpen(true), []);
  const closeReportModal = useCallback(() => setIsReportModalOpen(false), []);
  const openCommandPalette = useCallback(() => setIsCommandPaletteOpen(true), []);
  const closeCommandPalette = useCallback(() => setIsCommandPaletteOpen(false), []);
  const openCustomizer = useCallback(() => setIsCustomizerOpen(true), []);
  const closeCustomizer = useCallback(() => setIsCustomizerOpen(false), []);

  const toggleCollapsed = useCallback(() => setCollapsed(c => !c), []);

  const signOut = useCallback(() => {
    sessionStorage.removeItem('pulse-crm-auth');
    localStorage.removeItem('pulse-crm-role');
    localStorage.removeItem('pulse-crm-user');
    clearToken();
    router.push('/login');
  }, [router]);

  const value: DashboardAppContextValue = useMemo(() => ({
    authorized,
    userRole,
    activeTab,
    navigateToTab,
    openEmailCompose,
    composeTarget,
    consumeCompose,
    isReportModalOpen,
    openReportModal,
    closeReportModal,
    isCommandPaletteOpen,
    openCommandPalette,
    closeCommandPalette,
    isCustomizerOpen,
    openCustomizer,
    closeCustomizer,
    signOut,
    collapsed,
    toggleCollapsed,
    dashboardData: dashboardOverview.data,
    refetchDashboard,
  }), [
    authorized, userRole, activeTab, navigateToTab, openEmailCompose,
    composeTarget, consumeCompose, isReportModalOpen, openReportModal,
    closeReportModal, isCommandPaletteOpen, openCommandPalette,
    closeCommandPalette, isCustomizerOpen, openCustomizer, closeCustomizer,
    signOut, collapsed, toggleCollapsed, dashboardOverview.data, refetchDashboard,
  ]);

  return (
    <DashboardAppContext.Provider value={value}>
      <DashboardLayoutProvider>{children}</DashboardLayoutProvider>
    </DashboardAppContext.Provider>
  );
}
