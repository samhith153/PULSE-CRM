'use client';
import React, { useState } from 'react';
import Navbar from '@/components/navigation/Navbar';
import PageModal from '@/components/shared/PageModal';
import { Code, ArrowRight, CheckCircle } from 'lucide-react';

const ENDPOINTS = [
  { method: 'GET',    path: '/api/v1/dashboard',           desc: 'Return KPI metrics for the current user role',        tag: 'Dashboard' },
  { method: 'GET',    path: '/api/v1/companies',           desc: 'List all companies (paginated, filterable)',          tag: 'Companies' },
  { method: 'POST',   path: '/api/v1/companies',           desc: 'Create a new company record',                         tag: 'Companies' },
  { method: 'GET',    path: '/api/v1/companies/{id}',      desc: 'Retrieve a single company by ID',                     tag: 'Companies' },
  { method: 'PUT',    path: '/api/v1/companies/{id}',      desc: 'Update a company record',                             tag: 'Companies' },
  { method: 'DELETE', path: '/api/v1/companies/{id}',      desc: 'Soft-delete a company record',                        tag: 'Companies' },
  { method: 'GET',    path: '/api/v1/contacts',            desc: 'List all contacts (paginated, filterable)',           tag: 'Contacts' },
  { method: 'POST',   path: '/api/v1/contacts',            desc: 'Create a new contact record',                         tag: 'Contacts' },
  { method: 'GET',    path: '/api/v1/contacts/{id}',       desc: 'Retrieve a single contact by ID',                     tag: 'Contacts' },
  { method: 'PUT',    path: '/api/v1/contacts/{id}',       desc: 'Update a contact record',                             tag: 'Contacts' },
  { method: 'DELETE', path: '/api/v1/contacts/{id}',       desc: 'Soft-delete a contact record',                        tag: 'Contacts' },
  { method: 'GET',    path: '/api/v1/leads',               desc: 'List all leads with AI scores',                       tag: 'Leads' },
  { method: 'POST',   path: '/api/v1/leads',               desc: 'Create a lead and trigger AI scoring',                tag: 'Leads' },
  { method: 'PUT',    path: '/api/v1/leads/{id}',          desc: 'Update lead information',                             tag: 'Leads' },
  { method: 'POST',   path: '/api/v1/leads/{id}/convert',  desc: 'Convert lead to deal',                                tag: 'Leads' },
  { method: 'GET',    path: '/api/v1/deals',               desc: 'List all deals in the pipeline',                      tag: 'Deals' },
  { method: 'POST',   path: '/api/v1/deals',               desc: 'Create a new deal at a pipeline stage',               tag: 'Deals' },
  { method: 'GET',    path: '/api/v1/deals/{id}',          desc: 'Retrieve deal details with activities',               tag: 'Deals' },
  { method: 'PATCH',  path: '/api/v1/deals/{id}/stage',    desc: 'Move deal to next pipeline stage',                    tag: 'Deals' },
  { method: 'PUT',    path: '/api/v1/deals/{id}',          desc: 'Update deal information',                             tag: 'Deals' },
  { method: 'GET',    path: '/api/v1/activities',          desc: 'List all logged activities (calls, notes, tasks)',    tag: 'Activities' },
  { method: 'POST',   path: '/api/v1/activities',          desc: 'Log a new activity against a deal or contact',        tag: 'Activities' },
  { method: 'PUT',    path: '/api/v1/activities/{id}',     desc: 'Update activity information',                         tag: 'Activities' },
  { method: 'DELETE', path: '/api/v1/activities/{id}',     desc: 'Delete an activity record',                           tag: 'Activities' },
  { method: 'GET',    path: '/api/v1/ai/score/{lead_id}',  desc: 'Retrieve the AI score for a lead',                    tag: 'AI' },
  { method: 'POST',   path: '/api/v1/ai/summarise',        desc: 'Generate a GPT-4o deal summary',                      tag: 'AI' },
  { method: 'POST',   path: '/api/v1/ai/draft-email',      desc: 'Generate a personalized email draft',                 tag: 'AI' },
  { method: 'POST',   path: '/api/v1/ai/analyze-deal',     desc: 'Get AI insights and risk analysis for deal',          tag: 'AI' },
  { method: 'GET',    path: '/api/v1/emails',              desc: 'List all synced emails for the current user',         tag: 'Emails' },
  { method: 'POST',   path: '/api/v1/emails/sync',         desc: 'Trigger email inbox sync for the current user',       tag: 'Emails' },
  { method: 'POST',   path: '/api/v1/emails/send',         desc: 'Send email from CRM interface',                       tag: 'Emails' },
  { method: 'GET',    path: '/api/v1/reports/pipeline',    desc: 'Get pipeline analytics and forecasts',                tag: 'Reports' },
  { method: 'GET',    path: '/api/v1/reports/performance', desc: 'Get team performance metrics',                        tag: 'Reports' },
  { method: 'GET',    path: '/api/v1/reports/forecast',    desc: 'Get revenue forecast data',                           tag: 'Reports' },
  { method: 'GET',    path: '/api/v1/users',               desc: 'List all users in organization',                      tag: 'Users' },
  { method: 'POST',   path: '/api/v1/users',               desc: 'Create a new user account',                           tag: 'Users' },
  { method: 'PUT',    path: '/api/v1/users/{id}',          desc: 'Update user profile and settings',                    tag: 'Users' },
  { method: 'GET',    path: '/api/v1/organizations',       desc: 'List organizations (admin only)',                     tag: 'Admin' },
  { method: 'GET',    path: '/api/v1/roles',               desc: 'List all roles and permissions',                      tag: 'Admin' },
  { method: 'POST',   path: '/api/v1/roles',               desc: 'Create custom role with permissions',                 tag: 'Admin' },
  { method: 'GET',    path: '/api/v1/audit-logs',          desc: 'Retrieve audit log entries (admin only)',             tag: 'Admin' },
];

const METHOD_COLORS: Record<string, { bg: string; color: string }> = {
  GET:    { bg: '#eff6ff', color: '#2563eb' },
  POST:   { bg: '#f0fdf4', color: '#059669' },
  PUT:    { bg: '#fffbeb', color: '#d97706' },
  PATCH:  { bg: '#fdf4ff', color: '#9333ea' },
  DELETE: { bg: '#fef2f2', color: '#dc2626' },
};

const TAG_COLORS: Record<string, string> = {
  Dashboard: '#7c3aed', Companies: '#2563eb', Contacts: '#059669', 
  Leads: '#d97706', Deals: '#9333ea', Activities: '#0891b2',
  AI: '#ec4899', Emails: '#06b6d4', Reports: '#8b5cf6',
  Users: '#f59e0b', Admin: '#0f172a',
};

export default function APIReferencePage() {
  const [activeTag, setActiveTag] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const tags = ['All', ...Array.from(new Set(ENDPOINTS.map(e => e.tag)))];
  const filtered = activeTag === 'All' ? ENDPOINTS : ENDPOINTS.filter(e => e.tag === activeTag);

  return (
    <div style={{ fontFamily: "'Inter',system-ui,sans-serif", background: '#fff', minHeight: '100vh' }}>
      <PageModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      <Navbar onOpenModal={() => setModalOpen(true)} />
      <section style={{ marginTop: 64, padding: '72px 48px 56px', background: 'linear-gradient(180deg,#f5f3ff 0%,#fff 100%)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', background: '#f5f3ff', border: '1px solid #ede9fe', borderRadius: 100, marginBottom: 20 }}>
            <Code size={13} color="#7c3aed" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.07em' }}>REST API</span>
          </div>
          <h1 style={{ fontSize: 'clamp(38px,5vw,58px)', fontWeight: 900, color: '#0f172a', lineHeight: 1.08, letterSpacing: '-0.035em', marginBottom: 16 }}>API Reference</h1>
          <p style={{ fontSize: 19, color: '#475569', lineHeight: 1.7, maxWidth: 680, marginBottom: 32 }}>Complete REST API with 40+ endpoints for Pulse CRM. JWT bearer authentication, OpenAPI 3.0 spec, and interactive Swagger UI.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, maxWidth: 900 }}>
            {[
              { label: 'Authentication', detail: 'Bearer {token}', icon: '🔐' },
              { label: 'Base URL', detail: 'https://api.pulsecrm.io/api/v1', icon: '🌐' },
              { label: 'Content-Type', detail: 'application/json', icon: '📋' },
            ].map(b => (
              <div key={b.label} style={{ padding: '16px 20px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 16 }}>{b.icon}</span>
                  <p style={{ fontSize: 11, color: '#64748b', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{b.label}</p>
                </div>
                <code style={{ fontSize: 13, color: '#0f172a', fontFamily: 'monospace', fontWeight: 600, wordBreak: 'break-all' }}>{b.detail}</code>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '48px 48px 80px', background: '#fff' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', marginBottom: 24, letterSpacing: '-0.02em' }}>Available Endpoints</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
            {tags.map(tag => (
              <button key={tag} onClick={() => setActiveTag(tag)}
                style={{ padding: '8px 18px', borderRadius: 100, border: `1.5px solid ${activeTag === tag ? '#7c3aed' : '#e2e8f0'}`, background: activeTag === tag ? '#f5f3ff' : '#fff', color: activeTag === tag ? '#7c3aed' : '#475569', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all .15s', fontFamily: 'inherit' }}>
                {tag}
              </button>
            ))}
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 1.2fr 110px', padding: '14px 24px', background: '#fff', borderBottom: '1.5px solid #e2e8f0' }}>
              {['Method', 'Endpoint', 'Description', 'Category'].map(h => (
                <span key={h} style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</span>
              ))}
            </div>
            {filtered.map((ep, i) => {
              const mc = METHOD_COLORS[ep.method] ?? { bg: '#f8fafc', color: '#475569' };
              const tc = TAG_COLORS[ep.tag] ?? '#475569';
              return (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 1.2fr 110px', padding: '16px 24px', borderBottom: i < filtered.length - 1 ? '1px solid #e2e8f0' : 'none', alignItems: 'center', transition: 'background .12s', cursor: 'pointer', background: '#fff' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f8fafc'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#fff'; }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: mc.color, background: mc.bg, padding: '5px 10px', borderRadius: 8, width: 'fit-content', letterSpacing: '0.04em', border: `1px solid ${mc.color}22` }}>{ep.method}</span>
                  <code style={{ fontSize: 13, color: '#0f172a', fontFamily: 'monospace', fontWeight: 600 }}>{ep.path}</code>
                  <span style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{ep.desc}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: tc, background: `${tc}12`, padding: '5px 12px', borderRadius: 100, width: 'fit-content', border: `1px solid ${tc}22` }}>{ep.tag}</span>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 56, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {[
              { icon: CheckCircle, title: 'Interactive Swagger UI', desc: 'Try every endpoint live at /api/docs. No Postman setup required.', color: '#7c3aed' },
              { icon: Code, title: 'OpenAPI 3.0 Spec', desc: 'Download the full spec to generate client SDKs in any language.', color: '#2563eb' },
              { icon: ArrowRight, title: 'Webhook Events', desc: 'Subscribe to real-time events: deal.created, lead.scored, email.received.', color: '#059669' },
            ].map(({ icon: Icon, title, desc, color }, i) => (
              <div key={i} style={{ padding: 28, background: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0', transition: 'all 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
                <div style={{ height: 44, width: 44, borderRadius: 12, background: `${color}14`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Icon size={20} color={color} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 10, letterSpacing: '-0.01em' }}>{title}</h3>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.65, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer style={{ padding: '36px 48px', background: '#0f172a', color: '#475569', textAlign: 'center' }}>
        <p style={{ fontSize: 14 }}>© 2026 Pulse CRM Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}
