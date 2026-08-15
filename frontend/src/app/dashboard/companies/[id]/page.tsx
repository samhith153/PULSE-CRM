// frontend/src/app/dashboard/companies/[id]/page.tsx
// ──────────────────────────────────────────────────────────────────────────────
// SERVER COMPONENT — fetches single company + list for the sidebar.
// ──────────────────────────────────────────────────────────────────────────────

import { getCompaniesServer, getCompanyServer } from '@/lib/api-server';
import { notFound } from 'next/navigation';
import CompaniesClient from '../CompaniesClient';

interface CompanyDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CompanyDetailPage({ params }: CompanyDetailPageProps) {
  const { id } = await params;
  
  // Parallel fetch: detail + list (for sidebar navigation)
  const [company, companies] = await Promise.all([
    getCompanyServer(id),
    getCompaniesServer(),
  ]);

  if (!company) {
    notFound();
  }

  return <CompaniesClient initialCompanies={companies} initialSelectedId={company.id} />;
}