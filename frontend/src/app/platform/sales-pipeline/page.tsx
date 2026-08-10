import type { Metadata } from "next";
import PlatformPageLayout from '@/components/platform/PlatformPageLayout';
import { platformFeatures } from '@/data/platformFeatures';

export const metadata: Metadata = {
  title: "Sales Pipeline | Pulse CRM",
  description: "Track deals through every stage of your sales process with a clear pipeline view.",
};

export default function SalesPipelinePage() {
  return <PlatformPageLayout feature={platformFeatures['sales-pipeline']} />;
}