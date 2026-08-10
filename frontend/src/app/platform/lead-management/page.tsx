import type { Metadata } from "next";
import PlatformPageLayout from '@/components/platform/PlatformPageLayout';
import { platformFeatures } from '@/data/platformFeatures';

export const metadata: Metadata = {
  title: "Lead Management | Pulse CRM",
  description: "Capture, qualify, and manage leads with Pulse CRM.",
};

export default function LeadManagementPage() {
  return <PlatformPageLayout feature={platformFeatures['lead-management']} />;
}