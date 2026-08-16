'use client';

import ActivitiesView from "@/components/dashboard/ActivitiesView";
import { useDashboardApp } from "@/components/dashboard/DashboardAppContext";

export default function ActivitiesPage() {
  const { navigateToTab, openEmailCompose } = useDashboardApp();
  return <ActivitiesView onTabChange={navigateToTab} onComposeEmail={openEmailCompose} />;
}
