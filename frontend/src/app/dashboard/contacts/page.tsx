'use client';

import ContactsView from "@/components/dashboard/ContactsView";
import { useDashboardApp } from "@/components/dashboard/DashboardAppContext";

export default function ContactsPage() {
  const { navigateToTab, openEmailCompose } = useDashboardApp();
  return <ContactsView onTabChange={navigateToTab} onComposeEmail={openEmailCompose} />;
}
