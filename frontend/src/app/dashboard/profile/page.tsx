'use client';

import ProfileView from "@/components/dashboard/ProfileView";
import { useDashboardApp } from "@/components/dashboard/DashboardAppContext";

export default function ProfilePage() {
  const { userRole } = useDashboardApp();
  return <ProfileView userRole={userRole} />;
}
