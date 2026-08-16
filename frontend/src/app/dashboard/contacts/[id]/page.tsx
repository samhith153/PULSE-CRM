// frontend/src/app/dashboard/contacts/[id]/page.tsx
// ──────────────────────────────────────────────────────────────────────────────
// SERVER COMPONENT — thin shell, data fetching happens client-side in ContactsView.
// ──────────────────────────────────────────────────────────────────────────────

import ContactsClient from '../ContactsClient';

interface ContactDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ContactDetailPage({ params }: ContactDetailPageProps) {
  const { id } = await params;
  return <ContactsClient />;
}