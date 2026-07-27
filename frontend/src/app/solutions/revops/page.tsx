'use client';
import React from 'react';
import { Target, BarChart2, Shield, Workflow } from 'lucide-react';
import { PageContainer, HeroWithScreenshot, FeatureCards, CTASection } from '@/components/shared/PageTemplates';

const RevOpsScreenshot = () => (
  <div style={{ padding: '20px', background: '#f8fafc' }}>
    <div style={{ background: '#fff', borderRadius: 12, padding: '20px', border: '1px solid #e2e8f0' }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>RBAC Overview</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { label: 'Total Permissions', value: '33', color: '#7c3aed' },
          { label: 'Roles', value: '3', color: '#2563eb' },
          { label: 'REST Endpoints', value: '40+', color: '#059669' },
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
  return (
    <PageContainer>
      <HeroWithScreenshot
        badge="Solutions · RevOps Teams"
        badgeIcon={Target}
        title={<>One system.<br /><span style={{ color: '#7c3aed' }}>Every team aligned.</span></>}
        description="RBAC, integrations, cross-functional reporting, and data governance built for RevOps teams."
        screenshot={<RevOpsScreenshot />}
      />

      <FeatureCards
        features={[
          { icon: Shield, title: 'Granular RBAC', description: '33 resource:action permissions enforced at every FastAPI route via require_permission() dependency.' },
          { icon: BarChart2, title: 'Role-scoped dashboards', description: 'Admins see all teams. Managers see their team. Reps see their own pipeline. All scoped in the backend.' },
          { icon: Workflow, title: 'REST API + Webhooks', description: '40+ endpoints at /api/v1. Webhooks available for real-time event subscriptions to external systems.' },
          { icon: Target, title: 'Data governance', description: 'Soft-delete on all 11 tables. Organization-level multi-tenancy. Duplicate prevention on emails and company names.' },
        ]}
      />

      <CTASection
        title="Built for RevOps at scale."
        description="14-day free trial. Full access to RBAC, integrations, and reporting."
      />
    </PageContainer>
  );
}
