// frontend/src/app/dashboard/contacts/page.tsx
// ──────────────────────────────────────────────────────────────────────────────
// SERVER COMPONENT — thin shell, data fetching happens client-side in ContactsView.
// ──────────────────────────────────────────────────────────────────────────────

import ContactsClient from './ContactsClient';

export default function ContactsPage() {
  return <ContactsClient />;
}