// frontend/src/app/dashboard/leads/[id]/page.tsx
// ──────────────────────────────────────────────────────────────────────────────
// SERVER COMPONENT — thin shell, data fetching happens client-side in LeadsView.
// ──────────────────────────────────────────────────────────────────────────────

import LeadsClient from '../LeadsClient';

interface LeadDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const { id } = await params;
  return <LeadsClient />;
}