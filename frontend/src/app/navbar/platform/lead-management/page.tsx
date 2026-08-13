'use client';
import React from 'react';
import { Users, Target, TrendingUp } from 'lucide-react';
import { PageContainer, HeroWithScreenshot, Statistics, CTASection } from '@/components/shared/PageTemplates';
import { motion } from 'framer-motion';

const LeadManagementScreenshot = () => (
  <div style={{ padding: '20px', background: '#f8fafc' }}>
    <div style={{ background: '#EFF6FF', borderRadius: 12, padding: '20px', border: '1px solid #DBEAFE' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ height: 40, width: 40, borderRadius: 10, background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Users size={20} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1D4ED8' }}>Lead Management</div>
          <div style={{ fontSize: 11, color: '#2563EB' }}>Capture · Qualify · Track</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ background: '#fff', borderRadius: 10, padding: '12px', border: '1px solid #DBEAFE' }}>
          <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>TOTAL LEADS</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#2563EB' }}>1,247</div>
          <div style={{ fontSize: 10, color: '#94a3b8' }}>+18% from last month</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 10, padding: '12px', border: '1px solid #DBEAFE' }}>
          <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>QUALIFIED</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#059669' }}>342</div>
          <div style={{ fontSize: 10, color: '#94a3b8' }}>Ready for outreach</div>
        </div>
      </div>
    </div>
  </div>
);

export default function LeadManagementPage() {
  return (
    <PageContainer>
      <HeroWithScreenshot
        badge="Platform · CRM Core"
        badgeIcon={Users}
        title={<>Capture, qualify, and<br /><span style={{ color: '#2563EB' }}>manage every lead.</span></>}
        description="Capture leads from multiple sources, score them automatically, and track them through your qualification process. Keep every lead organized in one place with complete activity history."
        screenshot={<LeadManagementScreenshot />}
      />

      <Statistics
        stats={[
          { value: 'Auto-scoring', label: 'Smart Qualification', description: '0-100 scoring based on fit and engagement' },
          { value: 'Multi-source', label: 'Lead Capture', description: 'Web forms, email, API integrations' },
          { value: 'Full history', label: 'Activity Tracking', description: 'Complete timeline of all interactions' },
        ]}
      />

      <CTASection
        title="Never lose track of a lead again."
        description="Capture, score, and manage every opportunity in one centralized system."
      />
    </PageContainer>
  );
}