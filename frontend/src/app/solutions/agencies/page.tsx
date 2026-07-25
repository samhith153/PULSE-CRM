'use client';
import React, { useState } from 'react';
import { Briefcase, Users, Target, Zap } from 'lucide-react';
import { PageContainer, HeroWithScreenshot, FeatureCards, CTASection } from '@/components/shared/PageTemplates';

const AgencyScreenshot = () => (
  <div style={{ padding: '20px', background: '#f8fafc' }}>
    <div style={{ background: '#fff', borderRadius: 12, padding: '16px', border: '1px solid #e2e8f0' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Client Pipelines</div>
      {['Client A', 'Client B', 'Client C'].map((client, i) => (
        <div key={i} style={{ padding: '12px', background: '#f8fafc', borderRadius: 8, marginBottom: 8, border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{client}</div>
            <div style={{ fontSize: 12, fontWeight: 900, color: '#7c3aed' }}>₹{[12, 8, 15][i]}L</div>
          </div>
          <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>{[8, 5, 12][i]} active deals</div>
        </div>
      ))}
    </div>
  </div>
);

export default function AgenciesPage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <PageContainer>
      <HeroWithScreenshot
        badge="Solutions · Agencies"
        badgeIcon={Briefcase}
        title={<>Manage multiple clients.<br /><span style={{ color: '#7c3aed' }}>One clean dashboard.</span></>}
        description="Separate pipelines per client. White-label reporting. Team collaboration. Built for agencies managing dozens of clients."
        screenshot={<AgencyScreenshot />}
        onCTA={() => setModalOpen(true)}
      />

      <FeatureCards
        features={[
          { icon: Users, title: 'Multi-Client Pipelines', description: 'Separate deal pipelines for every client you manage.' },
          { icon: Target, title: 'White-Label Reports', description: 'Branded reports with your agency logo and colors.' },
          { icon: Zap, title: 'Team Collaboration', description: 'Assign team members to specific client accounts.' },
        ]}
      />

      <CTASection
        title="Built for agencies that scale."
        description="Start free. Manage multiple clients from day one. No per-client fees."
        onCTA={() => setModalOpen(true)}
      />
    </PageContainer>
  );
}
