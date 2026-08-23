"use client";

import React, { useState } from "react";
import "./landing-v2.css";
import { LandingNav } from "./LandingNav";
import { Hero } from "./Hero";
import { LogoClusters } from "./LogoClusters";
import { DarkBand } from "./DarkBand";
import { MediaRows } from "./MediaRows";
import { BentoGrid } from "./BentoGrid";
import { FrameworkSection } from "./FrameworkSection";
import { CaseCarousel } from "./CaseCarousel";
import { TestimonialWall } from "./TestimonialWall";
import { BottomCta } from "./BottomCta";
import { SiteFooter } from "./SiteFooter";
import AuthModal from "@/components/shared/AuthModal";

interface NewLandingPageProps {
  onLogin: (role: "representative" | "manager" | "admin") => void;
}

/**
 * Pulse landing — "Signal Instrument" edition.
 * Forced-dark marketing shell; all app functionality (auth modal,
 * navigation routes, CTAs) is preserved exactly.
 */
export default function NewLandingPage({ onLogin }: NewLandingPageProps) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <div className="pl-root min-h-screen antialiased">
      <LandingNav />
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

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultMode="signup"
        onSuccess={() => {
          setIsAuthModalOpen(false);
          const role = (localStorage.getItem("pulse-crm-role") as any) || "manager";
          onLogin(role);
        }}
      />
    </div>
  );
}
