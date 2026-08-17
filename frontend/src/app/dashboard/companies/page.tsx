// frontend/src/app/dashboard/companies/page.tsx
// ──────────────────────────────────────────────────────────────────────────────
// SERVER COMPONENT — thin shell, data fetching happens client-side in CompaniesClient.
// ──────────────────────────────────────────────────────────────────────────────

import CompaniesClient from './CompaniesClient';

export default function CompaniesPage() {
  return <CompaniesClient initialCompanies={[]} />;
}