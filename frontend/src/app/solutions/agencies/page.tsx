'use client';
import React from 'react';
import { Briefcase, Users, Target, Zap } from 'lucide-react';
import { PageContainer, HeroWithScreenshot, FeatureCards, CTASection } from '@/components/shared/PageTemplates';

const AgencyScreenshot = () => (
  <div style={{ padding: '20px', background: '#f8fafc' }}>
    <div style={{ background: '#fff', borderRadius: 12, padding: '16px', border: '1px solid #e2e8f0' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Client Pipelines</div>
      {['Client A', 'Client B', 'Client C'].map((client, i) => (
        <div key={i} style={{ padding: '12px', background: '#f8fafc', borderRadius: 8, marginBottom: 8, border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{client}</div>
            <div style={{ fontSize: 12, fontWeight: 900, color: '#7c3aed' }}>₹{[12, 8, 15][i]}L</div>
          </div>
          <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>{[8, 5, 12][i]} active deals</div>
        </div>
      ))}
    </div>
  </div>
);

export default function AgenciesPage() {
  return (
    <PageContainer>
      <HeroWithScreenshot
        badge="Solutions · Agencies"
        badgeIcon={Briefcase}
        title={<>Manage multiple clients.<br /><span style={{ color: '#7c3aed' }}>One clean dashboard.</span></>}
        description="Separate pipelines per organization. Full RBAC per org. REST API for automated client onboarding. Built on multi-tenant architecture with complete data isolation."
        screenshot={<AgencyScreenshot />}
      />

      <FeatureCards
        features={[
          { icon: Users, title: 'Multi-org isolation', description: 'Every organization has its own scoped data via organization_id on all 11 tables. Complete isolation.' },
          { icon: Target, title: 'RBAC per organization', description: 'Assign Admin, Manager, or Sales Rep roles independently within each org you manage.' },
          { icon: Zap, title: 'REST API access', description: 'Automate client onboarding and data import using the 40+ REST endpoints with JWT authentication.' },
        ]}
      />

      <CTASection
        title="Built for multi-org management."
        description="Org-level isolation, RBAC, and full API access — ready for any client setup."
      />
    </PageContainer>
  );
}
