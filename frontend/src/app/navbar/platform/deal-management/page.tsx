'use client';
import React from 'react';
import { DollarSign, Target, TrendingUp } from 'lucide-react';
import { PageContainer, HeroWithScreenshot, Statistics, CTASection } from '@/components/shared/PageTemplates';

const DealScreenshot = () => (
  <div style={{ padding: '20px', background: '#f8fafc' }}>
    <div style={{ background: '#EFF6FF', borderRadius: 12, padding: '20px', border: '1px solid #DBEAFE' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ height: 40, width: 40, borderRadius: 10, background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <DollarSign size={20} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1D4ED8' }}>Deal Management</div>
          <div style={{ fontSize: 11, color: '#2563EB' }}>Create · Track · Close</div>
        </div>
      </div>
      <div style={{ background: '#fff', borderRadius: 10, padding: '14px', border: '1px solid #DBEAFE' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>TechCorp Enterprise License</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Stage: Proposal</div>
          </div>
          <div style={{ padding: '4px 10px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, fontSize: 11, fontWeight: 700, color: '#059669' }}>$85,000</div>
        </div>
        <div style={{ fontSize: 11, color: '#64748b' }}>Expected close: Dec 2026</div>
      </div>
    </div>
  </div>
);

export default function DealManagementPage() {
  return (
    <PageContainer>
      <HeroWithScreenshot
        badge="Platform · Sales Workflow"
        badgeIcon={DollarSign}
        title={<>Create, manage, and<br /><span style={{ color: '#2563EB' }}>close opportunities.</span></>}
        description="Track sales opportunities from first contact to closed-won. Manage deal value, stage, and all related activities in one place."
        screenshot={<DealScreenshot />}
      />

      <Statistics
        stats={[
          { value: 'Complete', label: 'Deal Tracking', description: 'Value, stage, timeline, and activities' },
          { value: 'Linked', label: 'Contact Association', description: 'Connect deals to contacts and companies' },
          { value: 'Forecasted', label: 'Revenue Prediction', description: 'Predict when deals will close' },
        ]}
      />

      <CTASection
        title="Close more deals with better tracking."
        description="Manage every sales opportunity with complete context and history."
      />
    </PageContainer>
  );
}
