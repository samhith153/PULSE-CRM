// frontend/src/app/dashboard/companies/[id]/page.tsx
// ──────────────────────────────────────────────────────────────────────────────
// SERVER COMPONENT — thin shell, data fetching happens client-side in CompaniesClient.
// ──────────────────────────────────────────────────────────────────────────────

import CompaniesClient from '../CompaniesClient';

export default function CompanyDetailPage() {
  return <CompaniesClient initialCompanies={[]} />;
}