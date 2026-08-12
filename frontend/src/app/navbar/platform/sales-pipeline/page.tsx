'use client';
import React from 'react';
import { GitBranch, TrendingUp, CheckCircle } from 'lucide-react';
import { PageContainer, HeroWithScreenshot, Statistics, CTASection } from '@/components/shared/PageTemplates';

const PipelineScreenshot = () => (
  <div style={{ padding: '20px', background: '#f8fafc' }}>
    <div style={{ background: '#EFF6FF', borderRadius: 12, padding: '20px', border: '1px solid #DBEAFE' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ height: 40, width: 40, borderRadius: 10, background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <GitBranch size={20} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1D4ED8' }}>Sales Pipeline</div>
          <div style={{ fontSize: 11, color: '#2563EB' }}>Visual · Trackable · Predictable</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {['New', 'Qualified', 'Proposal', 'Won'].map((stage, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 8, padding: '10px 8px', border: '1px solid #DBEAFE', textAlign: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>{stage.toUpperCase()}</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#2563EB' }}>{[12, 8, 5, 3][i]}</div>
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
        badge="Platform · Sales Workflow"
        badgeIcon={GitBranch}
        title={<>Track opportunities<br /><span style={{ color: '#2563EB' }}>through every stage.</span></>}
        description="Visualize your sales process with a clear pipeline view. Track deals as they move from new to won, and identify bottlenecks."
        screenshot={<PipelineScreenshot />}
      />

      <Statistics
        stats={[
          { value: 'FSM-based', label: 'Stage Management', description: 'New → Qualified → Proposal → Won/Lost' },
          { value: 'Visual', label: 'Pipeline View', description: 'See all opportunities at a glance' },
          { value: 'Forecasting', label: 'Revenue Prediction', description: 'Predict revenue based on pipeline' },
        ]}
      />

      <CTASection
        title="Never lose sight of your sales process."
        description="Track every opportunity through your pipeline with complete visibility."
      />
    </PageContainer>
  );
}
