import type { Metadata } from "next";
import PlatformPageLayout from '@/components/platform/PlatformPageLayout';
import { platformFeatures } from '@/data/platformFeatures';

export const metadata: Metadata = {
  title: "Company Management | Pulse CRM",
  description: "Centralize company information and give your team a clear view of every account.",
};

export default function CompanyManagementPage() {
  return <PlatformPageLayout feature={platformFeatures['company-management']} />;
}