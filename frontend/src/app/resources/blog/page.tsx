'use client';
import React, { useState } from 'react';
import Navbar from '@/components/navigation/Navbar';
import PageModal from '@/components/shared/PageModal';
import { FileText, ArrowRight, Tag } from 'lucide-react';

const POSTS = [
  { title: 'How AI Lead Scoring Works in Pulse CRM', excerpt: 'A deep dive into how GPT-4o analyses engagement signals, company fit, and deal velocity to generate a 0–100 lead score — and why accuracy reaches 98.4%.', tag: 'AI & CRM', date: 'July 10, 2025', mins: 8, color: '#7c3aed' },
  { title: 'FSM Deal Pipelines: Why State Machines Beat Custom Stages', excerpt: 'Most CRMs let you create arbitrary stages. Pulse uses a finite state machine to validate every stage transition — eliminating invalid deal states that corrupt your pipeline data.', tag: 'Engineering', date: 'July 3, 2025', mins: 6, color: '#059669' },
  { title: '33 Permissions: How Pulse CRM Built Its RBAC System', excerpt: 'A walkthrough of Pulse\'s role-based access control: how we designed 33 granular permissions across all CRM resources and enforce them at the API layer on every request.', tag: 'Security', date: 'June 27, 2025', mins: 10, color: '#dc2626' },
  { title: 'Gmail Sync Without a Browser Extension: How We Built It', excerpt: 'Pulse syncs your Gmail inbox in real-time using OAuth 2.0 and the Gmail API — without requiring a browser extension, Zapier middleware, or email forwarding rules.', tag: 'Integrations', date: 'June 19, 2025', mins: 7, color: '#2563eb' },
  { title: 'The Sales Rep Productivity Playbook for 2025', excerpt: 'How top-performing reps use AI prioritisation, email intelligence, and one-click logging to close twice as many deals without working longer hours.', tag: 'Sales Strategy', date: 'June 12, 2025', mins: 9, color: '#d97706' },
  { title: 'Why We Built Pulse CRM on PostgreSQL (and Chose SQLAlchemy)', excerpt: 'A technical look at Pulse\'s database architecture: PostgreSQL with FK constraints across 11 tables, row-level security, and why we use SQLAlchemy ORM for type-safe queries.', tag: 'Engineering', date: 'June 5, 2025', mins: 12, color: '#059669' },
  { title: 'CRM Data Migration: Moving from Salesforce to Pulse in a Weekend', excerpt: 'A step-by-step guide to exporting your Salesforce contacts, accounts, and opportunities and importing them into Pulse CRM via CSV and REST API.', tag: 'Migration', date: 'May 28, 2025', mins: 11, color: '#9333ea' },
  { title: 'Revenue Forecasting 101: How Pulse Calculates Weighted Pipeline Value', excerpt: 'Understanding the weighted forecast model: how deal value × stage probability × rep win rate produces a realistic quarterly revenue forecast without spreadsheet gymnastics.', tag: 'Analytics', date: 'May 20, 2025', mins: 7, color: '#0891b2' },
  { title: 'Building No-Code Sales Automation That Actually Works', excerpt: 'How to set up lead routing, email sequences, and deal-stage triggers in Pulse\'s Automation Builder without writing a single line of code or filing a dev ticket.', tag: 'Automation', date: 'May 12, 2025', mins: 8, color: '#7c3aed' },
];

const TAG_COLORS: Record<string, string> = {
  'AI & CRM': '#7c3aed', Engineering: '#059669', Security: '#dc2626', Integrations: '#2563eb',
  'Sales Strategy': '#d97706', Migration: '#9333ea', Analytics: '#0891b2', Automation: '#7c3aed',
};

export default function BlogPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTag, setActiveTag] = useState('All');
  const tags = ['All', ...Array.from(new Set(POSTS.map(p => p.tag)))];
  const filtered = activeTag === 'All' ? POSTS : POSTS.filter(p => p.tag === activeTag);

  return (
    <div style={{ fontFamily: "'Inter',system-ui,sans-serif", background: '#fff', minHeight: '100vh' }}>
      <PageModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      <Navbar onOpenModal={() => setModalOpen(true)} />
      <section style={{ marginTop: 64, padding: '72px 48px 56px', background: 'linear-gradient(180deg,#f5f3ff 0%,#fff 100%)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', background: '#f5f3ff', border: '1px solid #ede9fe', borderRadius: 100, marginBottom: 20 }}>
            <FileText size={13} color="#7c3aed" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Blog</span>
          </div>
          <h1 style={{ fontSize: 'clamp(38px,5vw,58px)', fontWeight: 900, color: '#0f172a', lineHeight: 1.08, letterSpacing: '-0.035em', marginBottom: 16 }}>Sales insights &amp; CRM engineering</h1>
          <p style={{ fontSize: 19, color: '#475569', lineHeight: 1.7, maxWidth: 600 }}>Deep-dives into how Pulse CRM is built, sales strategy for revenue teams, and practical guides for getting the most out of your CRM.</p>
        </div>
      </section>

      <section style={{ padding: '48px 48px 80px', background: '#fff' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 36 }}>
            {tags.map(tag => (
              <button key={tag} onClick={() => setActiveTag(tag)}
                style={{ padding: '7px 16px', borderRadius: 20, border: `1.5px solid ${activeTag === tag ? '#7c3aed' : '#e2e8f0'}`, background: activeTag === tag ? '#f5f3ff' : '#fff', color: activeTag === tag ? '#7c3aed' : '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .15s', fontFamily: 'inherit' }}>
                {tag}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 24 }}>
            {filtered.map((post, i) => {
              const tc = TAG_COLORS[post.tag] ?? '#7c3aed';
              return (
                <div key={i} style={{ background: '#fff', borderRadius: 18, border: '1px solid #e2e8f0', overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow .15s, transform .15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(0,0,0,.09)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
                  <div style={{ height: 8, background: `linear-gradient(90deg,${tc} 0%,${tc}88 100%)` }} />
                  <div style={{ padding: '24px 24px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: tc, background: `${tc}14`, padding: '3px 10px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Tag size={10} />{post.tag}
                      </span>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>{post.date} · {post.mins} min read</span>
                    </div>
                    <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', lineHeight: 1.35, marginBottom: 12, letterSpacing: '-0.01em' }}>{post.title}</h3>
                    <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.65 }}>{post.excerpt}</p>
                    <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: tc }}>
                      Read article <ArrowRight size={14} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <footer style={{ padding: '36px 48px', background: '#0f172a', color: '#475569', textAlign: 'center' }}>
        <p style={{ fontSize: 14 }}>© 2026 Pulse CRM Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}
