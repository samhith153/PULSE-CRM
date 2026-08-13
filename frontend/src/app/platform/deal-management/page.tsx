'use client';
import React from 'react';
import { Briefcase, DollarSign, Calendar, Users, ArrowRight, TrendingUp, CheckCircle } from 'lucide-react';
import { PageContainer, HeroWithScreenshot, FeatureCards, CTASection } from '@/components/shared/PageTemplates';

const DealScreenshot = () => (
  <div style={{ padding: '20px', background: '#f8fafc' }}>
    <div style={{ background: '#fff', borderRadius: 12, padding: '16px', border: '1px solid #e2e8f0' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Active Deals</div>
      {[
        { name: 'Enterprise License', company: 'TechCorp', value: '$250,000', stage: 'Negotiation', closeDate: 'Aug 30', rep: 'Sarah' },
        { name: 'SaaS Annual Plan', company: 'Acme Inc', value: '$45,000', stage: 'Proposal', closeDate: 'Sep 15', rep: 'James' },
        { name: 'Partnership Deal', company: 'GlobalStart', value: '$120,000', stage: 'Closing', closeDate: 'Aug 20', rep: 'Maria' },
      ].map((deal, i) => (
        <div key={i} style={{ padding: '10px 0', borderBottom: i < 2 ? '1px solid #f1f5f9' : 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>{deal.name}</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#16a34a' }}>{deal.value}</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 10, color: '#64748b' }}>{deal.company} · {deal.rep}</div>
            <div style={{ fontSize: 9, padding: '2px 8px', borderRadius: 4, background: deal.stage === 'Closing' ? '#dcfce7' : deal.stage === 'Negotiation' ? '#fef9c3' : '#EFF6FF', color: deal.stage === 'Closing' ? '#16a34a' : deal.stage === 'Negotiation' ? '#ca8a04' : '#2563EB', fontWeight: 600 }}>{deal.stage}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default function DealManagementPage() {
  return (
    <PageContainer>
      <HeroWithScreenshot
        badge="Platform"
        badgeIcon={Briefcase}
        title={<>Create, manage, and <span style={{ color: '#2563EB' }}>close deals</span></>}
        description="Complete deal management from creation to close. Track value, probability, expected close dates, and assigned reps for every opportunity."
        screenshot={<DealScreenshot />}
      />
      <FeatureCards features={[
        { icon: Briefcase, title: 'Deal Lifecycle', description: 'Full deal lifecycle management — from initial opportunity to closed-won or closed-lost with reason tracking.' },
        { icon: DollarSign, title: 'Value Tracking', description: 'Track deal amounts, discounts, and final close values. Compare against forecasts for accuracy.' },
        { icon: Calendar, title: 'Close Date Management', description: 'Expected close dates with automated reminders. Pipeline forecasting based on close date accuracy.' },
        { icon: Users, title: 'Rep Assignment', description: 'Assign deals to team members with ownership tracking. Prevent deal collisions and overlap.' },
        { icon: TrendingUp, title: 'Win/Loss Analysis', description: 'Analyze win rates, deal velocity, and loss reasons to optimize your sales strategy.' },
        { icon: CheckCircle, title: 'Outcome Tracking', description: 'Track deal outcomes with detailed reason codes. Learn from every deal to improve future performance.' },
      ]} />
      <CTASection
        title="Close more deals, faster"
        description="Start managing your deal pipeline with complete visibility."
      />
    </PageContainer>
  );
}
