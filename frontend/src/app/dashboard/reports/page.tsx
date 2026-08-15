'use client';

import ReportsView from "@/components/dashboard/ReportsView";
import ManagerReportsView from "@/components/dashboard/ManagerReportsView";
import AdminReportsView from "@/components/dashboard/AdminReportsView";
import { useDashboardApp } from "@/components/dashboard/DashboardAppContext";

export default function ReportsPage() {
  const { userRole, navigateToTab, openReportModal } = useDashboardApp();

  if (userRole === 'manager') {
    return <ManagerReportsView onTabChange={navigateToTab} onNewReport={openReportModal} />;
  }
  if (userRole === 'admin') {
    return <AdminReportsView />;
  }
  return <ReportsView />;
}
