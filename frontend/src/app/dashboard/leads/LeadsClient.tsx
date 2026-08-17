'use client';

import LeadsView from '@/components/dashboard/LeadsView';
import { useDashboardApp } from '@/components/dashboard/DashboardAppContext';

export default function LeadsClient() {
  const { navigateToTab, openEmailCompose } = useDashboardApp();
  return (
    <LeadsView
      onTabChange={navigateToTab}
      onComposeEmail={openEmailCompose}
    />
  );
}
