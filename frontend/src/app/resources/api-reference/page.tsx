'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PageContainer } from '@/components/shared/PageTemplates';
import { Code, CheckCircle } from 'lucide-react';

const ENDPOINTS = [
  { method: 'GET', path: '/api/v1/dashboard', desc: 'KPI metrics for current user', tag: 'Dashboard' },
  { method: 'GET', path: '/api/v1/companies', desc: 'List all companies (paginated)', tag: 'Companies' },
  { method: 'POST', path: '/api/v1/companies', desc: 'Create a new company', tag: 'Companies' },
  { method: 'GET', path: '/api/v1/contacts', desc: 'List all contacts (paginated)', tag: 'Contacts' },
  { method: 'POST', path: '/api/v1/contacts', desc: 'Create a new contact', tag: 'Contacts' },
  { method: 'GET', path: '/api/v1/leads', desc: 'List leads with AI scores', tag: 'Leads' },
  { method: 'POST', path: '/api/v1/leads', desc: 'Create lead and trigger AI', tag: 'Leads' },
  { method: 'GET', path: '/api/v1/deals', desc: 'List all pipeline deals', tag: 'Deals' },
  { method: 'POST', path: '/api/v1/deals', desc: 'Create new deal', tag: 'Deals' },
  { method: 'GET', path: '/api/v1/activities', desc: 'List logged activities', tag: 'Activities' },
  { method: 'POST', path: '/api/v1/ai/score/{id}', desc: 'Get AI lead score', tag: 'AI' },
  { method: 'POST', path: '/api/v1/ai/draft-email', desc: 'Generate email draft', tag: 'AI' },
];

const METHOD_COLORS: Record<string, { bg: string; color: string }> = {
  GET: { bg: '#eff6ff', color: '#2563eb' },
  POST: { bg: '#f0fdf4', color: '#059669' },
  PUT: { bg: '#fffbeb', color: '#d97706' },
  DELETE: { bg: '#fef2f2', color: '#dc2626' },
};

export default function APIReferencePage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <PageContainer>
      <section style={{ marginTop: 64, padding: '80px 48px', background: 'linear-gradient(180deg, #f5f3ff 0%, #fff 100%)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', background: '#f5f3ff', border: '1px solid #ede9fe', borderRadius: 100, marginBottom: 20 }}>
            <Code size={13} color="#7c3aed" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.07em' }}>REST API</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ fontSize: 'clamp(36px,5vw,56px)', fontWeight: 900, color: '#0f172a', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 16 }}>
            API Reference
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ fontSize: 18, color: '#475569', lineHeight: 1.7, maxWidth: 640, marginBottom: 32 }}>
            40+ REST endpoints. JWT authentication. OpenAPI 3.0 spec.
          </motion.p>
        </div>
      </section>

      <section style={{ padding: '60px 48px 80px', background: '#fff' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
            {ENDPOINTS.map((ep, i) => {
              const mc = METHOD_COLORS[ep.method] ?? { bg: '#f8fafc', color: '#475569' };
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ background: '#fff' }}
                  style={{ display: 'grid', gridTemplateColumns: '90px 1fr 1.2fr', padding: '16px 24px', borderBottom: i < ENDPOINTS.length - 1 ? '1px solid #e2e8f0' : 'none', alignItems: 'center', cursor: 'pointer', background: '#fff', transition: 'background 0.2s' }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: mc.color, background: mc.bg, padding: '5px 10px', borderRadius: 8, width: 'fit-content', letterSpacing: '0.04em', border: `1px solid ${mc.color}22` }}>{ep.method}</span>
                  <code style={{ fontSize: 13, color: '#0f172a', fontFamily: 'monospace', fontWeight: 600 }}>{ep.path}</code>
                  <span style={{ fontSize: 13, color: '#64748b' }}>{ep.desc}</span>
                </motion.div>
              );
            })}
          </div>

          <div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {[
              { icon: CheckCircle, title: 'Interactive Swagger', desc: 'Try endpoints live at /api/docs' },
              { icon: Code, title: 'OpenAPI 3.0 Spec', desc: 'Download spec to generate SDKs' },
              { icon: CheckCircle, title: 'Webhook Events', desc: 'Real-time event subscriptions' },
            ].map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                whileHover={{ y: -4 }}
                style={{ padding: 24, background: '#f8fafc', borderRadius: 14, border: '1px solid #e2e8f0' }}>
                <div style={{ height: 40, width: 40, borderRadius: 10, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <Icon size={18} color="#7c3aed" />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>{title}</h3>
                <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </PageContainer>
  );
}
