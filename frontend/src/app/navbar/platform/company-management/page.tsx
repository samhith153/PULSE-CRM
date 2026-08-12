'use client';
import React from 'react';
import { Building2, Users, Briefcase } from 'lucide-react';
import { PageContainer, HeroWithScreenshot, Statistics, CTASection } from '@/components/shared/PageTemplates';

const CompanyScreenshot = () => (
  <div style={{ padding: '20px', background: '#f8fafc' }}>
    <div style={{ background: '#EFF6FF', borderRadius: 12, padding: '20px', border: '1px solid #DBEAFE' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ height: 40, width: 40, borderRadius: 10, background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Building2 size={20} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1D4ED8' }}>Company Management</div>
          <div style={{ fontSize: 11, color: '#2563EB' }}>Accounts · Hierarchy · Intelligence</div>
        </div>
      </div>
      <div style={{ background: '#fff', borderRadius: 10, padding: '14px', border: '1px solid #DBEAFE' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>TechCorp Industries</div>
        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>Enterprise Software · 500-1000 employees</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div style={{ fontSize: 11, color: '#64748b' }}>
            <span style={{ fontWeight: 600 }}>Contacts:</span> 12
          </div>
          <div style={{ fontSize: 11, color: '#64748b' }}>
            <span style={{ fontWeight: 600 }}>Deals:</span> 3 active
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default function CompanyManagementPage() {
  return (
    <PageContainer>
      <HeroWithScreenshot
        badge="Platform · CRM Core"
        badgeIcon={Building2}
        title={<>Manage organizations<br /><span style={{ color: '#2563EB' }}>in one place.</span></>}
        description="Track company accounts with all their contacts, deals, and activity. Understand your relationships at the organizational level."
        screenshot={<CompanyScreenshot />}
      />

      <Statistics
        stats={[
          { value: 'Centralized', label: 'Account Management', description: 'All company data in one profile' },
          { value: 'Connected', label: 'Contact Linking', description: 'All contacts linked to their companies' },
          { value: 'Complete', label: 'Account Intelligence', description: 'Size, industry, and engagement metrics' },
        ]}
      />

      <CTASection
        title="Manage accounts, not just contacts."
        description="Get a complete view of your relationships with every organization."
      />
    </PageContainer>
  );
}
