'use client';
import React from 'react';
import { Rocket, Zap, Database, CheckCircle2 } from 'lucide-react';
import { PageContainer, HeroWithScreenshot, Statistics, CTASection } from '@/components/shared/PageTemplates';

const StartupScreenshot = () => (
  <div style={{ padding: '20px', background: '#f8fafc', borderRadius: 12 }}>
    <div style={{ background: '#fff', borderRadius: 12, padding: '20px', border: '1px solid #e2e8f0' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Quick Start — 4 steps</div>
      {[
        { num: '01', text: 'docker-compose up db -d', done: true },
        { num: '02', text: 'alembic upgrade head', done: true },
        { num: '03', text: 'python -m scripts.seed', done: true },
        { num: '04', text: 'uvicorn app.main:app --reload', done: false },
      ].map((step, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px', background: i === 3 ? '#f5f3ff' : '#f8fafc', borderRadius: 8, marginBottom: 8, border: `1px solid ${i === 3 ? '#ede9fe' : '#e2e8f0'}` }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: step.done ? '#d1fae5' : '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {step.done ? <CheckCircle2 size={14} color="#059669" /> : <span style={{ fontSize: 10, fontWeight: 700, color: '#7c3aed' }}>{step.num}</span>}
          </div>
          <code style={{ fontSize: 12, color: '#0f172a', fontFamily: 'monospace' }}>{step.text}</code>
        </div>
      ))}
      <div style={{ marginTop: 12, padding: '10px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
        <div style={{ fontSize: 11, color: '#059669', fontWeight: 600 }}>✓ Seeded: 4 users, 5 companies, 5 contacts, 5 leads</div>
        <div style={{ fontSize: 11, color: '#059669', fontWeight: 600 }}>✓ Swagger UI ready at localhost:8000/docs</div>
      </div>
    </div>
  </div>
);

export default function StartupsPage() {
  return (
    <PageContainer>
      <HeroWithScreenshot
        badge="Solutions · Startups"
        badgeIcon={Rocket}
        title={<>Running locally<br /><span style={{ color: '#7c3aed' }}>in under 5 minutes.</span></>}
        description="Clone the repo, start Docker, run migrations, seed the database, and hit the Swagger UI. All test credentials are pre-seeded. No external services required to get started."
        screenshot={<StartupScreenshot />}
      />

      <Statistics
        stats={[
          { value: '4', label: 'Pre-seeded users', description: 'Admin, Manager, and 2 Sales Reps ready to test' },
          { value: '89', label: 'Passing tests', description: 'Full pytest suite — run with a single command' },
          { value: '40+', label: 'REST endpoints', description: 'Swagger UI at /docs, ReDoc at /redoc' },
          { value: '100%', label: 'Data portability', description: 'Export everything via CSV or REST API' },
        ]}
      />

      <CTASection
        title="Everything you need to start selling."
        description="JWT auth, RBAC, seeded data, AI scoring — all ready out of the box."
      />
    </PageContainer>
  );
}
