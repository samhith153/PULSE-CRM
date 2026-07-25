'use client';
import React, { useState } from 'react';
import { TrendingUp, Target, BarChart2, Zap } from 'lucide-react';
import { PageContainer, HeroWithScreenshot, FeatureCards, CTASection } from '@/components/shared/PageTemplates';

const PipelineScreenshot = () => (
  <div style={{ padding: '20px', background: '#f8fafc' }}>
    <div style={{ background: '#fff', borderRadius: 12, padding: '16px', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        {['New', 'Discovery', 'Proposal', 'Negotiation', 'Won'].map((stage, i) => (
          <div key={stage} style={{ flex: 1, textAlign: 'center', padding: '8px', background: i === 2 ? '#f5f3ff' : '#f8fafc', borderRadius: 8, border: `1px solid ${i === 2 ? '#ede9fe' : '#e2e8f0'}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: i === 2 ? '#7c3aed' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stage}</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', marginTop: 4 }}>{[8, 5, 12, 7, 24][i]}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} style={{ padding: '10px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <div style={{ height: 4, width: '60%', background: '#e2e8f0', borderRadius: 2, marginBottom: 6 }} />
            <div style={{ height: 3, width: '40%', background: '#f1f5f9', borderRadius: 2 }} />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function VisualPipelinePage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <PageContainer>
      <HeroWithScreenshot
        badge="Product · Visual Pipeline"
        badgeIcon={TrendingUp}
        title={<>Drag, drop, close.<br /><span style={{ color: '#7c3aed' }}>That simple.</span></>}
        description="Move deals across stages with a single drag. Every change is logged, forecasts update instantly, and your team stays in sync."
        screenshot={<PipelineScreenshot />}
        onCTA={() => setModalOpen(true)}
      />

      <FeatureCards
        features={[
          { icon: Target, title: 'Drag-and-Drop Kanban', description: 'Move deals between stages instantly. Real-time sync across your entire team.' },
          { icon: BarChart2, title: 'Smart Forecasting', description: 'Weighted probability scoring predicts revenue within 6% accuracy every quarter.' },
          { icon: Zap, title: 'Stage Automation', description: 'Auto-send proposals, create tasks, or notify team when deals move forward.' },
        ]}
      />

      <CTASection
        title="Start closing faster today."
        description="14-day free trial. Full access to Visual Pipeline, AI scoring, and automation."
        onCTA={() => setModalOpen(true)}
      />
    </PageContainer>
  );
}
