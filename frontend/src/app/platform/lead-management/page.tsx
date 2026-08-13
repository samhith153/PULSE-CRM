'use client';
import React from 'react';
import { Target, Zap, BarChart2, ArrowRight, Filter, Users, Mail } from 'lucide-react';
import { PageContainer, HeroWithScreenshot, FeatureCards, CTASection } from '@/components/shared/PageTemplates';
import { motion } from 'framer-motion';

const LeadScreenshot = () => (
  <div style={{ padding: '20px', background: '#f8fafc' }}>
    <div style={{ background: '#fff', borderRadius: 12, padding: '16px', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Active Leads</div>
        <div style={{ fontSize: 10, color: '#64748b' }}>Score 0-100</div>
      </div>
      {[
        { name: 'Sarah Chen', company: 'TechCorp', score: 92, status: 'Hot', email: 'sarah@techcorp.com' },
        { name: 'James Wilson', company: 'Acme Inc', score: 78, status: 'Warm', email: 'james@acme.com' },
        { name: 'Maria Garcia', company: 'StartUp Labs', score: 65, status: 'Nurture', email: 'maria@startuplabs.io' },
      ].map((lead, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < 2 ? '1px solid #f1f5f9' : 'none' }}>
          <div style={{ width: 32, height: 32, borderRadius: 16, background: i === 0 ? '#dcfce7' : i === 1 ? '#fef9c3' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: i === 0 ? '#16a34a' : i === 1 ? '#ca8a04' : '#64748b' }}>
            {lead.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>{lead.name}</div>
            <div style={{ fontSize: 10, color: '#64748b' }}>{lead.company}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: lead.score >= 80 ? '#16a34a' : lead.score >= 60 ? '#ca8a04' : '#64748b' }}>{lead.score}</div>
            <div style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: lead.status === 'Hot' ? '#dcfce7' : lead.status === 'Warm' ? '#fef9c3' : '#f1f5f9', color: lead.status === 'Hot' ? '#16a34a' : lead.status === 'Warm' ? '#ca8a04' : '#64748b', fontWeight: 600 }}>{lead.status}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default function LeadManagementPage() {
  return (
    <PageContainer>
      <HeroWithScreenshot
        badge="Platform"
        badgeIcon={Target}
        title={<>Capture, score, and convert <span style={{ color: '#2563EB' }}>every lead</span></>}
        description="AI-powered lead scoring (0-100) with automatic qualification. Track every lead from first touch to conversion with intelligent prioritization."
        screenshot={<LeadScreenshot />}
      />
      <FeatureCards features={[
        { icon: Target, title: 'AI Lead Scoring', description: 'Rule-based scoring engine evaluates deal value, email engagement, meeting activity, and recency to prioritize your pipeline.' },
        { icon: Filter, title: 'Smart Qualification', description: 'Automatic lead qualification based on configurable rules. Hot, Warm, and Nurture tiers keep your team focused on what matters.' },
        { icon: BarChart2, title: 'Conversion Analytics', description: 'Track conversion rates across every stage. Identify bottlenecks and optimize your sales process with real-time data.' },
        { icon: Mail, title: 'Email Integration', description: 'Gmail OAuth sync captures every interaction. Thread logging and AI-powered analysis give you complete lead context.' },
        { icon: Users, title: 'Team Assignment', description: 'Auto-assign leads based on territory, workload, or round-robin. Ensure no lead falls through the cracks.' },
        { icon: Zap, title: 'Activity Tracking', description: 'Every call, email, and meeting is automatically logged. Never miss a follow-up with intelligent reminders.' },
      ]} />
      <CTASection
        title="Ready to convert more leads?"
        description="Start capturing and scoring leads with AI-powered prioritization."
      />
    </PageContainer>
  );
}
