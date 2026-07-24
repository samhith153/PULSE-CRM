'use client';
import React, { useState } from 'react';
import { Mail, RefreshCw, Link2, Activity } from 'lucide-react';
import { PageContainer, HeroWithScreenshot, FeatureCards, CTASection } from '@/components/shared/PageTemplates';

const EmailScreenshot = () => (
  <div style={{ padding: '20px', background: '#f8fafc' }}>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: '16px', border: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Inbox</div>
        {['Acme Corp', 'Wayne Ent.', 'Pied Piper'].map((name, i) => (
          <div key={i} style={{ padding: '10px', background: i === 0 ? '#f5f3ff' : '#f8fafc', borderRadius: 8, marginBottom: 8, border: `1px solid ${i === 0 ? '#ede9fe' : '#e2e8f0'}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>{name}</div>
            <div style={{ height: 2, width: '80%', background: '#e2e8f0', borderRadius: 1, marginTop: 4 }} />
          </div>
        ))}
      </div>
      <div style={{ background: '#fff', borderRadius: 12, padding: '16px', border: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Thread Timeline</div>
        {[1, 2, 3].map((_, i) => (
          <div key={i} style={{ padding: '12px', background: '#f8fafc', borderRadius: 8, marginBottom: 8 }}>
            <div style={{ height: 3, width: '60%', background: '#e2e8f0', borderRadius: 2, marginBottom: 6 }} />
            <div style={{ height: 3, width: '40%', background: '#f1f5f9', borderRadius: 2 }} />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function EmailIntelligencePage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <PageContainer>
      <HeroWithScreenshot
        badge="Product · Email Intelligence"
        badgeIcon={Mail}
        title={<>Every email, automatically<br /><span style={{ color: '#7c3aed' }}>linked to the right deal.</span></>}
        description="Real-time Gmail sync. Every thread tracked. Opens and clicks monitored. AI-drafted replies ready."
        screenshot={<EmailScreenshot />}
        onCTA={() => setModalOpen(true)}
      />

      <FeatureCards
        features={[
          { icon: RefreshCw, title: 'Real-Time Gmail Sync', description: 'OAuth integration. Emails appear in Pulse within 5 seconds.' },
          { icon: Link2, title: 'Auto-Link to Deals', description: 'Matches emails to contacts and deals automatically.' },
          { icon: Activity, title: 'Open & Click Tracking', description: 'See exactly when prospects open your emails.' },
        ]}
      />

      <CTASection
        title="Never lose track of a conversation."
        description="Connect Gmail to Pulse CRM. Every email auto-linked from day one."
        onCTA={() => setModalOpen(true)}
      />
    </PageContainer>
  );
}
