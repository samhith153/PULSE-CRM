'use client';

import { SiteHeader } from '@/components/landing/SiteHeader';
import { Hero } from '@/components/landing/Hero';
import { LogoClusters } from '@/components/landing/LogoClusters';
import { DarkBand } from '@/components/landing/DarkBand';
import { MediaRows } from '@/components/landing/MediaRows';
import { BentoGrid } from '@/components/landing/BentoGrid';
import { FrameworkSection } from '@/components/landing/FrameworkSection';
import { CaseCarousel } from '@/components/landing/CaseCarousel';
import { TestimonialWall } from '@/components/landing/TestimonialWall';
import { BottomCta } from '@/components/landing/BottomCta';
import { SiteFooter } from '@/components/landing/SiteFooter';

export default function LandingPage() {
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
