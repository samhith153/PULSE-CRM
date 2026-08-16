import React from 'react';
import DashboardAppProvider from '@/components/dashboard/DashboardAppContext';
import DashboardShell from '@/components/dashboard/DashboardShell';

/**
 * Every /dashboard/* route shares this layout. The provider owns all shared
 * state (auth, role, navigation, modals) and the shell renders the persistent
 * chrome — sidebar, header, command palette — so switching pages only swaps
 * the page content below.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardAppProvider>
      <DashboardShell>{children}</DashboardShell>
    </DashboardAppProvider>
  );
}
