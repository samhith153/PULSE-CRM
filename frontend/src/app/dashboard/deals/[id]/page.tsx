'use client';

import { useParams } from 'next/navigation';
import PipelineView from "@/components/dashboard/PipelineView";
import { useDashboardApp } from "@/components/dashboard/DashboardAppContext";

export default function DealDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { navigateToTab } = useDashboardApp();
  return <PipelineView openDealId={id} />;
}
