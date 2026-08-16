'use client';

import { useParams } from 'next/navigation';
import ActivitiesView from "@/components/dashboard/ActivitiesView";
import { useDashboardApp } from "@/components/dashboard/DashboardAppContext";

export default function ActivityDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { navigateToTab, openEmailCompose } = useDashboardApp();
  return <ActivitiesView activityId={id} onTabChange={navigateToTab} onComposeEmail={openEmailCompose} />;
}
