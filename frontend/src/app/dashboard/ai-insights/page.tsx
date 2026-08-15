'use client';

import AIInsightsView from "@/components/dashboard/AIInsightsView";
import { useDashboardApp } from "@/components/dashboard/DashboardAppContext";

export default function AIInsightsPage() {
  const { navigateToTab } = useDashboardApp();
  return <AIInsightsView onTabChange={navigateToTab} />;
}
