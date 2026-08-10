import type { Metadata } from "next";
import PlatformPageLayout from '@/components/platform/PlatformPageLayout';
import { platformFeatures } from '@/data/platformFeatures';

export const metadata: Metadata = {
  title: "Tasks & Follow-ups | Pulse CRM",
  description: "Keep sales activities, tasks, and follow-ups organized so important opportunities keep moving.",
};

export default function TasksFollowUpsPage() {
  return <PlatformPageLayout feature={platformFeatures['tasks-follow-ups']} />;
}