import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/pulse/SiteHeader";
import { Hero } from "@/components/pulse/Hero";
import { LogoClusters } from "@/components/pulse/LogoClusters";
import { DarkBand } from "@/components/pulse/DarkBand";
import { MediaRows } from "@/components/pulse/MediaRows";
import { BentoGrid } from "@/components/pulse/BentoGrid";
import { FrameworkSection } from "@/components/pulse/FrameworkSection";
import { CaseCarousel } from "@/components/pulse/CaseCarousel";

import { TestimonialWall } from "@/components/pulse/TestimonialWall";
import { BottomCta } from "@/components/pulse/BottomCta";
import { SiteFooter } from "@/components/pulse/SiteFooter";

const title = "Pulse CRM — AI lead scoring for reps who close more deals";
const description =
  "Pulse CRM captures every lead, scores it instantly, and gives sales reps AI recommendations on the next best action to close more deals.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <Hero />
        <LogoClusters />
        <DarkBand />
        <MediaRows />
        <BentoGrid />
        <FrameworkSection />

        <CaseCarousel />
        <TestimonialWall />
        <BottomCta />
      </main>
      <SiteFooter />
    </div>
  );
}
