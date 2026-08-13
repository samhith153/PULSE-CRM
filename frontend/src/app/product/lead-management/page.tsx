'use client';
import React from 'react';
import { Target, Zap, BarChart2, ArrowRight, Filter, Users, Mail, TrendingUp } from 'lucide-react';
import { PageContainer, HeroWithScreenshot, FeatureCards, CTASection } from '@/components/shared/PageTemplates';
import { motion } from 'framer-motion';

const LeadScreenshot = () => (
  <div style={{ padding: '20px', background: '#f8fafc' }}>
    <div style={{ background: '#fff', borderRadius: 12, padding: '16px', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Lead Scoring Engine</div>
        <div style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: '#dcfce7', color: '#16a34a', fontWeight: 600 }}>Active</div>
      </div>
      {[
        { name: 'Enterprise Lead', score: 94, factors: 'Deal Value +40, Email Opens +25, Meeting +29', trend: '+12' },
        { name: 'SaaS Prospect', score: 71, factors: 'Deal Value +15, Email Opens +30, Recency +26', trend: '+5' },
        { name: 'Cold Contact', score: 28, factors: 'Deal Value +5, Email Opens +8, Recency +15', trend: '-3' },
      ].map((lead, i) => (
        <div key={i} style={{ padding: '10px 0', borderBottom: i < 2 ? '1px solid #f1f5f9' : 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>{lead.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: lead.score >= 80 ? '#16a34a' : lead.score >= 50 ? '#ca8a04' : '#dc2626' }}>{lead.score}</div>
              <div style={{ fontSize: 9, color: lead.trend.startsWith('+') ? '#16a34a' : '#dc2626', fontWeight: 600 }}>{lead.trend}</div>
            </div>
          </div>
          <div style={{ fontSize: 9, color: '#94a3b8' }}>{lead.factors}</div>
          <div style={{ marginTop: 4, height: 4, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${lead.score}%`, background: lead.score >= 80 ? '#16a34a' : lead.score >= 50 ? '#ca8a04' : '#dc2626', borderRadius: 2 }} />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default function LeadManagementProductPage() {
  return (
    <PageContainer>
      <HeroWithScreenshot
        badge="Product"
        badgeIcon={Target}
        title={<>AI-powered lead <span style={{ color: '#2563EB' }}>scoring & management</span></>}
        description="Rule-based scoring engine (0-100) that evaluates deal value, email engagement, meeting activity, and recency to prioritize your pipeline. Capture, score, qualify and track every lead."
        screenshot={<LeadScreenshot />}
      />
      <FeatureCards features={[
        { icon: Target, title: '0-100 Scoring Engine', description: 'Weighted algorithm combines deal value (15%), email opens (15%), meetings (20%), rep workload (10%), and contact recency (10%) for accurate scoring.' },
        { icon: Filter, title: 'Auto-Qualification', description: 'Leads automatically tiered into Hot (80+), Warm (50-79), and Nurture (<50) based on AI score. Priority queue surfaces the hottest leads first.' },
        { icon: Zap, title: 'Next-Best-Action', description: 'AI recommends the optimal next action weighted by score, urgency, and reply status. Know exactly what to do next for each lead.' },
        { icon: BarChart2, title: 'Score Trend Tracking', description: 'Track score changes over time. Identify accelerating and decaying leads to prioritize outreach timing.' },
        { icon: Mail, title: 'Email Signal Capture', description: 'Email opens, replies, and thread length feed directly into the scoring engine. Every interaction moves the needle.' },
        { icon: TrendingUp, title: 'Pipeline Analytics', description: 'Conversion rates by score tier, average lead velocity, and scoring accuracy metrics for continuous optimization.' },
      ]} />
      <CTASection
        title="Score every lead automatically"
        description="Start prioritizing your pipeline with AI-powered lead scoring."
      />
    </PageContainer>
  );
}
