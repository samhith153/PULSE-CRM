'use client';

import React from 'react';
import { DashboardLayoutProvider } from '@/components/dashboard/DashboardLayoutContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayoutProvider>
      {children}
    </DashboardLayoutProvider>
  );
}
