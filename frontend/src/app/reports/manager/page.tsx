import DashboardShell from "@/components/dashboard/DashboardShell";

export default function ManagerReports() {
  return <DashboardShell requiredRole="manager" defaultTab="reports" />;
}
