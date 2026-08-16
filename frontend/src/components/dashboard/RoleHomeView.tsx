'use client';

import HomeView from './HomeView';
import ManagerDashboardView from './ManagerDashboardView';
import AdminDashboardView from './AdminDashboardView';
import { useDashboardApp } from './DashboardAppContext';

/**
 * Home landing view. The same /dashboard URL serves every role — the correct
 * home is chosen from the authenticated user's role.
 */
export default function RoleHomeView() {
  const { userRole, navigateToTab, dashboardData } = useDashboardApp();

  if (userRole === 'manager') {
    return <ManagerDashboardView onTabChange={navigateToTab} />;
  }
  if (userRole === 'admin') {
    return <AdminDashboardView />;
  }
  return <HomeView onTabChange={navigateToTab} dashboardData={dashboardData ?? undefined} />;
}
