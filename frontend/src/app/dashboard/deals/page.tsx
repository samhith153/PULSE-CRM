import DashboardShell from '@/components/dashboard/DashboardShell';

export default function DealsPage() {
  return <DashboardShell requiredRole="sales_rep" defaultTab="deals" />;
}
