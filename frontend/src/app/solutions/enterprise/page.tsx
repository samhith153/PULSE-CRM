'use client';
import React from 'react';
import { Building2, Shield, Users, Database } from 'lucide-react';
import { PageContainer, HeroWithScreenshot, FeatureCards, CTASection } from '@/components/shared/PageTemplates';

const EnterpriseScreenshot = () => (
  <div style={{ padding: '20px', background: '#f8fafc' }}>
    <div style={{ background: '#fff', borderRadius: 12, padding: '20px', border: '1px solid #e2e8f0' }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Multi-Tenant Architecture</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {[
          { icon: '🏢', label: 'Organization isolation', desc: 'Every resource scoped to org ID' },
          { icon: '🔐', label: 'JWT + RBAC', desc: '3 roles, 33 permissions' },
          { icon: '🗄️', label: 'PostgreSQL + Alembic', desc: '11 tables, async SQLAlchemy 2.0' },
          { icon: '🧪', label: '89 passing tests', desc: 'Full pytest suite, all green' },
        ].map((feature, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px', background: '#f8fafc', borderRadius: 8 }}>
            <span style={{ fontSize: 22 }}>{feature.icon}</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{feature.label}</div>
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{feature.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function EnterprisePage() {
  return (
    <PageContainer>
      <HeroWithScreenshot
        badge="Solutions · Enterprise"
        badgeIcon={Building2}
        title={<>Built for multi-tenant<br /><span style={{ color: '#7c3aed' }}>enterprise deployments.</span></>}
        description="Pulse is built on FastAPI + PostgreSQL with full multi-tenancy via organization_id scoping on every table. RBAC enforced at the route level. Async SQLAlchemy 2.0 for high-throughput workloads. 89 passing tests. Docker-ready for self-hosted deployments."
        screenshot={<EnterpriseScreenshot />}
      />

      <FeatureCards
        features={[
          { icon: Shield, title: 'Route-level RBAC', description: '33 granular permissions enforced via FastAPI Depends(). No logic leaks into services.' },
          { icon: Users, title: 'Multi-tenant isolation', description: 'organization_id on all 11 tables. Cross-tenant data access is structurally blocked.' },
          { icon: Database, title: 'Async PostgreSQL', description: 'SQLAlchemy 2.0 async with Alembic migrations. Clean schema with FK constraints and indexes.' },
          { icon: Building2, title: 'Self-hosted via Docker', description: 'docker-compose.yml included. Spin up PostgreSQL + FastAPI backend in one command.' },
        ]}
      />

      <CTASection
        title="Production-ready from day one."
        description="Multi-tenant, async, fully tested, and Docker-ready for your infrastructure."
      />
    </PageContainer>
  );
}
