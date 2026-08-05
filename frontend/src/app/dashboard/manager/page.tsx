import DashboardShell from "@/components/dashboard/DashboardShell";

export default function ManagerDashboard() {
  return <DashboardShell requiredRole="manager" defaultTab="home" />;
}
