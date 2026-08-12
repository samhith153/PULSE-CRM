import type { Metadata } from "next";
import PlatformPageLayout from '@/components/platform/PlatformPageLayout';
import { platformFeatures } from '@/data/platformFeatures';

export const metadata: Metadata = {
  title: "Contact Management | Pulse CRM",
  description: "Manage customer contacts, communication details, and relationship history from one place.",
};

export default function ContactManagementPage() {
  return <PlatformPageLayout feature={platformFeatures['contact-management']} />;
}