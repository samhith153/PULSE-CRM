'use client';
import React, { useState } from 'react';
import Navbar from '@/components/navigation/Navbar';
import PageModal from '@/components/shared/PageModal';
import { BookOpen, Search, ArrowRight, ChevronRight, CheckCircle, FileText, Settings, Workflow, Mail, Shield, Sparkles, TrendingUp, Users } from 'lucide-react';

const SECTIONS = [
  { icon: TrendingUp, title: 'Getting Started', pages: ['Quick Start Guide', 'Setting Up Your Organization', 'Importing Your Data', 'Configuring Roles & Permissions', 'Team Onboarding'], color: '#7c3aed' },
  { icon: Users, title: 'User & Organization Management', pages: ['User Management', 'Organization Settings', 'Role-Based Access Control', 'Permission System', 'Multi-Tenant Architecture'], color: '#2563eb' },
  { icon: FileText, title: 'Core CRM Modules', pages: ['Company Management', 'Contact Management', 'Lead Management', 'Deal Pipeline', 'Activity Tracking'], color: '#059669' },
  { icon: Sparkles, title: 'AI Copilot', pages: ['AI Lead Scoring', 'Deal Intelligence', 'Automated Insights', 'Predictive Analytics', 'AI-Powered Recommendations'], color: '#d97706' },
  { icon: Mail, title: 'Email Integration', pages: ['Email Sync Setup', 'Thread Management', 'Email Templates', 'Tracking & Analytics', 'Inbox Integration'], color: '#9333ea' },
  { icon: TrendingUp, title: 'Reports & Analytics', pages: ['Dashboard Overview', 'Pipeline Reports', 'Sales Forecasting', 'Team Performance', 'Custom Reports'], color: '#dc2626' },
  { icon: Settings, title: 'Configuration & Settings', pages: ['System Settings', 'Pipeline Configuration', 'Custom Fields', 'Workflow Automation', 'Integration Settings'], color: '#0891b2' },
  { icon: Shield, title: 'Security & Compliance', pages: ['Authentication & JWT', 'Row-Level Security', 'Audit Logs', 'Data Encryption', 'SOC 2 Compliance'], color: '#475569' },
];

export default function DocumentationPage() {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <div style={{ fontFamily: "'Inter',system-ui,sans-serif", background: '#fff', minHeight: '100vh' }}>
      <PageModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      <Navbar onOpenModal={() => setModalOpen(true)} />
      <section style={{ marginTop: 64, padding: '72px 48px 56px', background: 'linear-gradient(180deg,#f5f3ff 0%,#fff 100%)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', background: '#f5f3ff', border: '1px solid #ede9fe', borderRadius: 100, marginBottom: 20 }}>
            <BookOpen size={13} color="#7c3aed" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Documentation</span>
          </div>
          <h1 style={{ fontSize: 'clamp(38px,5vw,58px)', fontWeight: 900, color: '#0f172a', lineHeight: 1.08, letterSpacing: '-0.035em', marginBottom: 16 }}>Pulse CRM Documentation</h1>
          <p style={{ fontSize: 19, color: '#475569', lineHeight: 1.7, maxWidth: 640, marginBottom: 32 }}>Everything you need to set up, configure, and get the most out of Pulse CRM — for reps, managers, admins, and developers.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, maxWidth: 520, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '4px 4px 4px 16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <Search size={16} color="#94a3b8" style={{ flexShrink: 0 }} />
            <input readOnly placeholder="Search documentation…" style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15, color: '#0f172a', padding: '10px 12px', fontFamily: 'inherit', background: 'transparent' }} />
            <button style={{ padding: '10px 18px', background: '#7c3aed', color: '#fff', fontSize: 14, fontWeight: 700, borderRadius: 9, border: 'none', cursor: 'pointer' }}>Search</button>
          </div>
        </div>
      </section>

      <section style={{ padding: '60px 48px 80px', background: '#fff' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 }}>
            {SECTIONS.map((sec, i) => {
              const Icon = sec.icon;
              return (
                <div key={i} style={{ padding: 28, background: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'box-shadow .15s, transform .15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(0,0,0,.08)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
                  <div style={{ height: 44, width: 44, borderRadius: 12, background: `${sec.color}14`, border: `1px solid ${sec.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                    <Icon size={20} color={sec.color} />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>{sec.title}</h3>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {sec.pages.map(page => (
                      <li key={page} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569', fontWeight: 500 }}>
                        <ChevronRight size={13} color={sec.color} style={{ flexShrink: 0 }} />
                        {page}
                      </li>
                    ))}
                  </ul>
                  <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: sec.color }}>
                    Browse {sec.title} <ArrowRight size={13} />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 60, padding: '40px', background: 'linear-gradient(135deg,#f5f3ff 0%,#fff 100%)', borderRadius: 20, border: '1px solid #ede9fe', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 32 }}>
            {[
              { icon: CheckCircle, title: 'Comprehensive Guides', desc: 'Detailed documentation for every Pulse CRM module with step-by-step instructions.' },
              { icon: FileText, title: 'API Documentation', desc: 'Complete REST API reference with authentication, endpoints, and examples.' },
              { icon: BookOpen, title: 'Best Practices', desc: 'Learn optimal workflows, security patterns, and performance optimization techniques.' },
            ].map(({ icon: Icon, title, desc }, i) => (
              <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ height: 40, width: 40, borderRadius: 10, background: '#f5f3ff', border: '1px solid #ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={18} color="#7c3aed" />
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>{title}</p>
                  <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, margin: 0 }}>{desc}</p>
                </div>
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
