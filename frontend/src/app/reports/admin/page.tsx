import DashboardShell from "@/components/dashboard/DashboardShell";

export default function AdminReports() {
  return <DashboardShell requiredRole="admin" defaultTab="reports" />;
}
