'use client';
import React, { useState } from 'react';
import { Target, BarChart2, Shield, Workflow } from 'lucide-react';
import { PageContainer, HeroWithScreenshot, FeatureCards, CTASection } from '@/components/shared/PageTemplates';

const RevOpsScreenshot = () => (
  <div style={{ padding: '20px', background: '#f8fafc' }}>
    <div style={{ background: '#fff', borderRadius: 12, padding: '20px', border: '1px solid #e2e8f0' }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>RevOps Dashboard</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { label: 'Pipeline Health', value: '92%', color: '#059669' },
          { label: 'Data Quality', value: '88%', color: '#2563eb' },
          { label: 'System Uptime', value: '99.9%', color: '#7c3aed' },
        ].map((metric, i) => (
          <div key={i} style={{ padding: '16px', background: `${metric.color}08`, borderRadius: 10, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: metric.color }}>{metric.value}</div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginTop: 4 }}>{metric.label}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function RevOpsPage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <PageContainer>
      <HeroWithScreenshot
        badge="Solutions · RevOps Teams"
        badgeIcon={Target}
        title={<>One system.<br /><span style={{ color: '#7c3aed' }}>Every team aligned.</span></>}
        description="RBAC, integrations, cross-functional reporting, and data governance built for RevOps teams."
        screenshot={<RevOpsScreenshot />}
        onCTA={() => setModalOpen(true)}
      />

      <FeatureCards
        features={[
          { icon: Shield, title: 'Granular RBAC', description: '33 permissions across all CRM resources for precise control.' },
          { icon: BarChart2, title: 'Cross-Functional Reports', description: 'Sales, marketing, CS data unified in one dashboard.' },
          { icon: Workflow, title: 'Integration Ready', description: 'REST API, webhooks, Zapier, native connectors.' },
          { icon: Target, title: 'Data Governance', description: 'Audit logs, field validation, duplicate detection.' },
        ]}
      />

      <CTASection
        title="Built for RevOps at scale."
        description="14-day free trial. Full access to RBAC, integrations, and reporting."
        onCTA={() => setModalOpen(true)}
      />
    </PageContainer>
  );
}
