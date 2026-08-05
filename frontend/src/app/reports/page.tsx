import DashboardShell from "@/components/dashboard/DashboardShell";

export default function SalesRepReports() {
  return <DashboardShell requiredRole="sales_rep" defaultTab="reports" />;
}
