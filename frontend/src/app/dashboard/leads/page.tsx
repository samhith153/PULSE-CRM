// frontend/src/app/dashboard/leads/page.tsx
// ──────────────────────────────────────────────────────────────────────────────
// SERVER COMPONENT — thin shell, data fetching happens client-side in LeadsView.
// ──────────────────────────────────────────────────────────────────────────────

import LeadsClient from './LeadsClient';

export default function LeadsPage() {
  return <LeadsClient />;
}