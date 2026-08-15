'use client';

import { useParams } from 'next/navigation';
import LeadsView from "@/components/dashboard/LeadsView";
import { useDashboardApp } from "@/components/dashboard/DashboardAppContext";

export default function LeadDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { navigateToTab, openEmailCompose } = useDashboardApp();
  return <LeadsView openLeadId={id} onTabChange={navigateToTab} onComposeEmail={openEmailCompose} />;
}
