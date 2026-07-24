'use client';
import React, { useState } from 'react';
import { BarChart2, Users, TrendingUp, Target } from 'lucide-react';
import { PageContainer, HeroWithScreenshot, FeatureCards, CTASection } from '@/components/shared/PageTemplates';

const ManagerScreenshot = () => (
  <div style={{ padding: '20px', background: '#f8fafc' }}>
    <div style={{ background: '#fff', borderRadius: 12, padding: '20px', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Team Revenue', value: '₹98.4L', color: '#7c3aed' },
          { label: 'Win Rate', value: '64%', color: '#059669' },
          { label: 'Avg Deal Size', value: '₹1.72L', color: '#2563eb' },
        ].map((kpi, i) => (
          <div key={i} style={{ padding: '12px', background: `${kpi.color}08`, borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: kpi.color }}>{kpi.value}</div>
            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, marginTop: 4 }}>{kpi.label}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>Team Pipeline — Live</div>
      <div style={{ height: 60, background: '#f8fafc', borderRadius: 8, display: 'flex', alignItems: 'flex-end', gap: 3, padding: '8px' }}>
        {[45, 60, 55, 75, 70, 85].map((h, i) => (
          <div key={i} style={{ flex: 1, height: `${h}%`, background: '#7c3aed', borderRadius: '3px 3px 0 0', opacity: 0.6 + (i * 0.08) }} />
        ))}
      </div>
    </div>
  </div>
);

export default function SalesManagersPage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <PageContainer>
      <HeroWithScreenshot
        badge="Solutions · Sales Managers"
        badgeIcon={BarChart2}
        title={<>Full visibility.<br /><span style={{ color: '#7c3aed' }}>Zero blind spots.</span></>}
        description="See every deal, track every rep, forecast every quarter — all from one dashboard that updates in real-time."
        screenshot={<ManagerScreenshot />}
        onCTA={() => setModalOpen(true)}
      />

      <FeatureCards
        features={[
          { icon: BarChart2, title: 'Team Performance Dashboard', description: 'Live KPIs: revenue, win rate, deal velocity, activity score.' },
          { icon: Users, title: 'Rep Leaderboards', description: 'Rank reps by closed revenue, deals won, and activity score.' },
          { icon: TrendingUp, title: 'Pipeline Forecasting', description: 'Weighted probability model predicts quarterly revenue.' },
          { icon: Target, title: 'Deal Risk Alerts', description: 'AI flags at-risk deals so you can intervene early.' },
        ]}
      />

      <CTASection
        title="Manage with confidence."
        description="14-day free trial. Full access to team dashboards, forecasting, and leaderboards."
        onCTA={() => setModalOpen(true)}
      />
    </PageContainer>
  );
}
