"use client";

import React, { useState } from "react";
import { SiteHeader } from "./SiteHeader";
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

export default function NewLandingPage({ onLogin }: NewLandingPageProps) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"signin" | "signup">("signup");

  const openSignUp = () => {
    setAuthModalMode("signup");
    setIsAuthModalOpen(true);
  };

  const openSignIn = () => {
    setAuthModalMode("signin");
    setIsAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
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

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultMode={authModalMode}
        onSuccess={() => {
          setIsAuthModalOpen(false);
          const role = (localStorage.getItem("pulse-crm-role") as any) || "manager";
          onLogin(role);
        }}
      />
    </div>
  );
}
