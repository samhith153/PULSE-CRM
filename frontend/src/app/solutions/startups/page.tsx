'use client';
import React, { useState } from 'react';
import { Rocket, Zap, Banknote, TrendingUp } from 'lucide-react';
import { PageContainer, HeroWithScreenshot, Statistics, CTASection } from '@/components/shared/PageTemplates';

const StartupScreenshot = () => (
  <div style={{ padding: '40px 20px', background: 'linear-gradient(135deg, #f5f3ff 0%, #fff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12 }}>
    <div style={{ textAlign: 'center' }}>
      <Rocket size={48} color="#7c3aed" style={{ marginBottom: 16 }} />
      <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Launch in 2 Minutes</div>
      <div style={{ fontSize: 13, color: '#64748b' }}>Import contacts • Invite team • Start selling</div>
    </div>
  </div>
);

export default function StartupsPage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <PageContainer>
      <HeroWithScreenshot
        badge="Solutions · Startups"
        badgeIcon={Rocket}
        title={<>Launch in 2 minutes.<br /><span style={{ color: '#7c3aed' }}>Scale without limits.</span></>}
        description="Sign up, import contacts, close your first deal — all in under 10 minutes. No consultants. No onboarding calls."
        screenshot={<StartupScreenshot />}
        onCTA={() => setModalOpen(true)}
      />

      <Statistics
        stats={[
          { value: '< 2min', label: 'Time to First Deal', description: 'From signup to creating your first deal' },
          { value: '₹29', label: 'Starting Price', description: 'Per month for 5 users with free trial' },
          { value: 'Zero', label: 'Migration Needed', description: 'Upgrade plans without changing platforms' },
          { value: '100%', label: 'Data Portability', description: 'Export all data via CSV or REST API' },
        ]}
      />

      <CTASection
        title="Start closing deals today."
        description="Sign up free. Import contacts. Create your first deal in under 10 minutes."
        onCTA={() => setModalOpen(true)}
      />
    </PageContainer>
  );
}
