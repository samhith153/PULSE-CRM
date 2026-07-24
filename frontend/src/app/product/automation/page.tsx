'use client';
import React, { useState } from 'react';
import { Workflow, Zap, Mail, Users } from 'lucide-react';
import { PageContainer, HeroWithScreenshot, FeatureCards, CTASection } from '@/components/shared/PageTemplates';

const AutomationScreenshot = () => (
  <div style={{ padding: '20px', background: '#f8fafc' }}>
    <div style={{ background: '#fff', borderRadius: 12, padding: '20px', border: '1px solid #e2e8f0' }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Workflow Builder</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {[
          { label: 'Lead Created', color: '#7c3aed' },
          { label: '→', color: '#cbd5e1' },
          { label: 'AI Score', color: '#2563eb' },
          { label: '→', color: '#cbd5e1' },
          { label: 'Assign Rep', color: '#059669' },
          { label: '→', color: '#cbd5e1' },
          { label: 'Send Email', color: '#d97706' },
        ].map((node, i) => (
          node.label === '→' ? (
            <span key={i} style={{ color: node.color, fontSize: 20 }}>→</span>
          ) : (
            <div key={i} style={{ padding: '10px 14px', background: `${node.color}10`, border: `1px solid ${node.color}30`, borderRadius: 8, fontSize: 11, fontWeight: 700, color: node.color }}>
              {node.label}
            </div>
          )
        ))}
      </div>
    </div>
  </div>
);

export default function AutomationPage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <PageContainer>
      <HeroWithScreenshot
        badge="Product · Automation"
        badgeIcon={Workflow}
        title={<>Your sales process,<br /><span style={{ color: '#7c3aed' }}>running on autopilot.</span></>}
        description="Build powerful workflows without code. Route leads, trigger emails, and notify your team — all automated."
        screenshot={<AutomationScreenshot />}
        onCTA={() => setModalOpen(true)}
      />

      <FeatureCards
        features={[
          { icon: Workflow, title: 'Visual Workflow Builder', description: 'Drag-and-drop canvas. Connect triggers to actions in minutes.' },
          { icon: Users, title: 'Intelligent Lead Routing', description: 'Auto-assign leads based on territory, size, or round-robin distribution.' },
          { icon: Mail, title: 'Email Sequences', description: 'Multi-step sequences that pause when contacts reply.' },
          { icon: Zap, title: 'Conditional Logic', description: 'If/else branching. Wait for actions. Full logic tree support.' },
        ]}
      />

      <CTASection
        title="Put your sales process on autopilot."
        description="Start free. Build your first workflow in minutes. No code required."
        onCTA={() => setModalOpen(true)}
      />
    </PageContainer>
  );
}
