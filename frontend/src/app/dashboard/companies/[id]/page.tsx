'use client';

import { useParams } from 'next/navigation';
import CompaniesView from "@/components/dashboard/CompaniesView";
import { useDashboardApp } from "@/components/dashboard/DashboardAppContext";

export default function CompanyDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { navigateToTab } = useDashboardApp();
  return <CompaniesView openCompanyId={id} />;
}
