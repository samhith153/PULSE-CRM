// frontend/src/app/dashboard/companies/page.tsx
// ──────────────────────────────────────────────────────────────────────────────
// SERVER COMPONENT — fetches initial data in parallel, streams HTML immediately.
// ──────────────────────────────────────────────────────────────────────────────

import { getCompaniesServer } from '@/lib/api-server';
import CompaniesClient from './CompaniesClient';

export default async function CompaniesPage() {
  // Parallel fetch — no waterfall
  const [companies] = await Promise.all([
    getCompaniesServer(),
  ]);

  return <CompaniesClient initialCompanies={companies} />;
}