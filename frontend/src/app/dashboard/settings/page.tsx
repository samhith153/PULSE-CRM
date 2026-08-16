'use client';

import SettingsView from "@/components/dashboard/SettingsView";
import { useDashboardApp } from "@/components/dashboard/DashboardAppContext";

export default function SettingsPage() {
  const { userRole } = useDashboardApp();
  return <SettingsView userRole={userRole} />;
}
