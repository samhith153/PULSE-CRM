'use client';
import React from 'react';
import { Users, Phone, Mail, Calendar, ArrowRight, Building2, Clock } from 'lucide-react';
import { PageContainer, HeroWithScreenshot, FeatureCards, CTASection } from '@/components/shared/PageTemplates';

const ContactScreenshot = () => (
  <div style={{ padding: '20px', background: '#f8fafc' }}>
    <div style={{ background: '#fff', borderRadius: 12, padding: '16px', border: '1px solid #e2e8f0' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Contact Directory</div>
      {[
        { name: 'Alex Johnson', role: 'CTO', company: 'TechCorp', lastContact: '2h ago', phone: '+1 555-0101' },
        { name: 'Priya Sharma', role: 'VP Sales', company: 'Acme Inc', lastContact: '1d ago', phone: '+1 555-0102' },
        { name: 'David Kim', role: 'Director', company: 'StartUp Labs', lastContact: '3d ago', phone: '+1 555-0103' },
      ].map((c, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < 2 ? '1px solid #f1f5f9' : 'none' }}>
          <div style={{ width: 36, height: 36, borderRadius: 18, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#2563EB' }}>
            {c.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>{c.name}</div>
            <div style={{ fontSize: 10, color: '#64748b' }}>{c.role} at {c.company}</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 10, color: '#94a3b8' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end' }}><Clock size={9} /> {c.lastContact}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default function ContactManagementPage() {
  return (
    <PageContainer>
      <HeroWithScreenshot
        badge="Platform"
        badgeIcon={Users}
        title={<>Keep every contact <span style={{ color: '#2563EB' }}>organized</span></>}
        description="Centralized contact management with full communication history. Never lose context — every call, email, and meeting is linked to the contact."
        screenshot={<ContactScreenshot />}
      />
      <FeatureCards features={[
        { icon: Users, title: '360° Contact Profiles', description: 'Complete contact profiles with role, company, communication history, and AI-generated insights.' },
        { icon: Mail, title: 'Email Sync', description: 'Gmail integration captures every email thread automatically. Search and filter conversations by contact.' },
        { icon: Phone, title: 'Call Logging', description: 'Log calls with notes, duration, and follow-up tasks. Automatic logging from your phone system.' },
        { icon: Calendar, title: 'Meeting History', description: 'Track all meetings with contacts. Calendar integration syncs events and action items automatically.' },
        { icon: Building2, title: 'Company Links', description: 'Link contacts to companies and deals. See the full organizational picture at a glance.' },
        { icon: Clock, title: 'Activity Timeline', description: 'Chronological timeline of every interaction. See the complete relationship history in one view.' },
      ]} />
      <CTASection
        title="Never lose contact context again"
        description="Start building your centralized contact database today."
      />
    </PageContainer>
  );
}
