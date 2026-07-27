'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { PageContainer } from '@/components/shared/PageTemplates';
import { Wrench, CheckCircle } from 'lucide-react';

const STEPS = [
  { num: '01', title: 'Start the database', desc: 'cd docker && docker-compose up db -d\nPostgreSQL starts on port 5432. No cloud setup needed.' },
  { num: '02', title: 'Activate the virtual environment', desc: 'cd backend && python -m venv .venv\n.venv\\Scripts\\activate  (Windows) or source .venv/bin/activate (Mac/Linux)' },
  { num: '03', title: 'Install dependencies', desc: 'pip install -r requirements.txt\nInstalls FastAPI, SQLAlchemy 2.0, Alembic, passlib, python-jose, and all other dependencies.' },
  { num: '04', title: 'Run database migrations', desc: 'alembic upgrade head\nCreates all 11 tables with FK constraints, indexes, UUID PKs, and soft-delete columns.' },
  { num: '05', title: 'Seed the database', desc: 'python -m scripts.seed\nSeeds 33 permissions, 3 roles, 1 org, 4 users, 5 companies, 5 contacts, and demo leads.' },
  { num: '06', title: 'Start the server', desc: 'uvicorn app.main:app --reload --port 8000\nSwagger UI → http://localhost:8000/docs\nReDoc → http://localhost:8000/redoc' },
  { num: '07', title: 'Log in with test credentials', desc: 'Admin: admin@kalnet-pulse.com / Admin@123456\nManager: sarah.johnson@kalnet-demo.com / Demo@123456\nSales Rep: mike.chen@kalnet-demo.com / Demo@123456' },
  { num: '08', title: 'Run the test suite', desc: 'cd backend && pytest\nRuns all 89 tests against in-memory SQLite. No Docker needed for tests.' },
];

export default function ImplementationGuidePage() {
  return (
    <PageContainer>
      <section style={{ marginTop: 64, padding: '80px 48px', background: 'linear-gradient(180deg, #f5f3ff 0%, #fff 100%)' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', background: '#f5f3ff', border: '1px solid #ede9fe', borderRadius: 100, marginBottom: 20 }}>
            <Wrench size={13} color="#7c3aed" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Implementation</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ fontSize: 'clamp(36px,5vw,56px)', fontWeight: 900, color: '#0f172a', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 16 }}>
            Local Setup Guide
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ fontSize: 18, color: '#475569', lineHeight: 1.7, maxWidth: 640, margin: '0 auto 48px' }}>
            Get the FastAPI backend running with seeded data and a working Swagger UI in under 5 minutes.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{ display: 'inline-flex', gap: 24, padding: '14px 24px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
            {[
              { label: 'Python', value: '3.11+' },
              { label: 'Framework', value: 'FastAPI' },
              { label: 'Database', value: 'PostgreSQL' },
              { label: 'ORM', value: 'SQLAlchemy 2.0' },
            ].map((item, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>{item.label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{item.value}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <section style={{ padding: '60px 48px 80px', background: '#fff' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          {STEPS.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              style={{ display: 'flex', gap: 24, alignItems: 'flex-start', marginBottom: 32 }}>
              <div style={{ fontSize: 42, fontWeight: 900, color: '#ede9fe', lineHeight: 1, minWidth: 68, flexShrink: 0 }}>{step.num}</div>
              <div style={{ flex: 1, paddingTop: 4, borderBottom: i < STEPS.length - 1 ? '1px solid #f1f5f9' : 'none', paddingBottom: 28 }}>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 10, letterSpacing: '-0.02em' }}>{step.title}</h3>
                <div style={{ background: '#f8fafc', borderRadius: 8, padding: '14px 16px', border: '1px solid #e2e8f0' }}>
                  {step.desc.split('\n').map((line, j) => (
                    <div key={j} style={{ fontFamily: 'monospace', fontSize: 13, color: j === 0 ? '#7c3aed' : '#475569', fontWeight: j === 0 ? 700 : 400, marginBottom: j < step.desc.split('\n').length - 1 ? 6 : 0 }}>{line}</div>
                  ))}
                </div>
              </div>
              <CheckCircle size={20} color="#7c3aed" style={{ marginTop: 8, flexShrink: 0 }} />
            </motion.div>
          ))}
        </div>
      </section>
    </PageContainer>
  );
}
