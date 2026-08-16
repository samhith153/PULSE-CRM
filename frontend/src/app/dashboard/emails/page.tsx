'use client';

import EmailsView from "@/components/dashboard/EmailsView";
import { useDashboardApp } from "@/components/dashboard/DashboardAppContext";

export default function EmailsPage() {
  const { navigateToTab, composeTarget, consumeCompose } = useDashboardApp();
  return (
    <EmailsView
      onTabChange={navigateToTab}
      composeTarget={composeTarget}
      onComposeConsumed={consumeCompose}
    />
  );
}
