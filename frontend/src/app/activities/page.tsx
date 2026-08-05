'use client';

import { useEffect, useState } from 'react';
import DashboardShell from "@/components/dashboard/DashboardShell";
import { Loader2 } from 'lucide-react';

export default function ActivitiesPage() {
  const [role, setRole] = useState<'sales_rep' | 'manager' | 'admin' | null>(null);

  useEffect(() => {
    const storedRole = localStorage.getItem('pulse-crm-role') as any;
    if (storedRole) {
      setRole(storedRole);
    } else {
      setRole('sales_rep');
    }
  }, []);

  if (!role) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 text-brand-purple animate-spin" />
      </div>
    );
  }

  return <DashboardShell requiredRole={role} defaultTab="activities" />;
}
