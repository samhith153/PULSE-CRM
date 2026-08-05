import DashboardShell from "@/components/dashboard/DashboardShell";

export default function AdminDashboard() {
  return <DashboardShell requiredRole="admin" defaultTab="home" />;
}
