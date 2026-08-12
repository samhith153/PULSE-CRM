import type { Metadata } from "next";
import PlatformPageLayout from '@/components/platform/PlatformPageLayout';
import { platformFeatures } from '@/data/platformFeatures';

export const metadata: Metadata = {
  title: "Deal Management | Pulse CRM",
  description: "Create, organize, and manage sales opportunities throughout the entire deal lifecycle.",
};

export default function DealManagementPage() {
  return <PlatformPageLayout feature={platformFeatures['deal-management']} />;
}