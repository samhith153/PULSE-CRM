import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Platform | Pulse CRM",
  description: "Comprehensive CRM platform features for lead management, sales pipeline, and customer relationships.",
};

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}