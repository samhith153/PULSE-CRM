'use client';

import { useParams } from 'next/navigation';
import ContactsView from "@/components/dashboard/ContactsView";
import { useDashboardApp } from "@/components/dashboard/DashboardAppContext";

export default function ContactDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { navigateToTab, openEmailCompose } = useDashboardApp();
  return <ContactsView openContactId={id} onTabChange={navigateToTab} onComposeEmail={openEmailCompose} />;
}
