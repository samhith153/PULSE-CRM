'use client';
import React from 'react';
import { Rocket, ArrowRight, BarChart2, Users, DollarSign, Target, TrendingUp } from 'lucide-react';
import { PageContainer, HeroWithScreenshot, FeatureCards, CTASection } from '@/components/shared/PageTemplates';

const PipelineScreenshot = () => (
  <div style={{ padding: '20px', background: '#f8fafc' }}>
    <div style={{ background: '#fff', borderRadius: 12, padding: '16px', border: '1px solid #e2e8f0' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Sales Pipeline</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, alignItems: 'center' }}>
        {['New', 'Contacted', 'Qualified', 'Proposal', 'Won'].map((stage, i) => (
          <React.Fragment key={stage}>
            <div style={{ flex: 1, textAlign: 'center', padding: '8px 4px', background: i === 2 ? '#f5f3ff' : '#f8fafc', borderRadius: 8, border: `1px solid ${i === 2 ? '#ede9fe' : '#e2e8f0'}` }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: i === 2 ? '#7c3aed' : '#64748b', textTransform: 'uppercase' }}>{stage}</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', marginTop: 2 }}>{[15, 10, 8, 5, 12][i]}</div>
            </div>
            {i < 4 && <ArrowRight size={10} color="#cbd5e1" style={{ flexShrink: 0 }} />}
          </React.Fragment>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {[
          { name: 'Enterprise Deal', value: '$250K', stage: 'Proposal' },
          { name: 'SaaS Contract', value: '$45K', stage: 'Qualified' },
          { name: 'Partnership', value: '$120K', stage: 'Won' },
        ].map((deal, i) => (
          <div key={i} style={{ padding: '10px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{deal.name}</div>
            <div style={{ fontSize: 10, color: '#64748b' }}>{deal.stage}</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#7c3aed', marginTop: 4 }}>{deal.value}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function SalesPipelinePage() {
  return (
    <PageContainer>
      <HeroWithScreenshot
        badge="Platform"
        badgeIcon={Rocket}
        title={<>Track opportunities through <span style={{ color: '#2563EB' }}>every stage</span></>}
        description="Visual sales pipeline with drag-and-drop stages. Track deal value, probability, and expected close dates for accurate forecasting."
        screenshot={<PipelineScreenshot />}
      />
      <FeatureCards features={[
        { icon: Rocket, title: 'Visual Pipeline', description: 'Kanban-style pipeline with customizable stages. Drag and drop deals as they progress through your sales process.' },
        { icon: DollarSign, title: 'Deal Value Tracking', description: 'Track deal amounts, weighted values, and expected revenue at each pipeline stage.' },
        { icon: Target, title: 'Win Probability', description: 'AI-calculated win probability based on deal stage, age, and historical conversion rates.' },
        { icon: TrendingUp, title: 'Pipeline Analytics', description: 'Conversion rates, average deal size, and sales velocity metrics for accurate forecasting.' },
        { icon: Users, title: 'Rep Assignment', description: 'Assign deals to sales reps with workload balancing. Track individual and team performance.' },
        { icon: BarChart2, title: 'Revenue Forecasting', description: 'AI-powered revenue predictions based on pipeline health and historical patterns.' },
      ]} />
      <CTASection
        title="Visualize your sales pipeline"
        description="Start tracking deals through every stage of your sales process."
      />
    </PageContainer>
  );
}
