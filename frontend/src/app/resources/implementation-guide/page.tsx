'use client';
import React, { useState } from 'react';
import Navbar from '@/components/navigation/Navbar';
import PageModal from '@/components/shared/PageModal';
import { Wrench, CheckCircle, ArrowRight, AlertTriangle, Users, Database, Shield, Settings, Sparkles, Code } from 'lucide-react';

const IMPLEMENTATION_STEPS = [
  {
    phase: 'Phase 1: Foundation',
    duration: '1-2 weeks',
    steps: [
      { title: 'Infrastructure Setup', desc: 'Configure database, environment variables, and hosting', icon: Database },
      { title: 'Authentication & Security', desc: 'Set up JWT authentication, RLS policies, and role permissions', icon: Shield },
      { title: 'Organization Structure', desc: 'Define organization hierarchy and user roles', icon: Users },
    ],
  },
  {
    phase: 'Phase 2: Core CRM',
    duration: '2-3 weeks',
    steps: [
      { title: 'Data Model Implementation', desc: 'Companies, contacts, leads, deals, and activities', icon: Database },
      { title: 'Pipeline Configuration', desc: 'Set up deal stages, custom fields, and workflows', icon: Settings },
      { title: 'User Interface', desc: 'Deploy frontend with navigation and core modules', icon: Code },
    ],
  },
  {
    phase: 'Phase 3: Advanced Features',
    duration: '2-3 weeks',
    steps: [
      { title: 'AI Copilot Integration', desc: 'Implement lead scoring and AI-powered insights', icon: Sparkles },
      { title: 'Email Integration', desc: 'Connect email providers and sync conversations', icon: Settings },
      { title: 'Reports & Analytics', desc: 'Build dashboards, forecasting, and team metrics', icon: Settings },
    ],
  },
];

const BEST_PRACTICES = [
  {
    title: 'Database Design',
    items: [
      'Use row-level security (RLS) for multi-tenant data isolation',
      'Index foreign keys and frequently queried columns',
      'Implement soft deletes with deleted_at timestamps',
      'Use UUID primary keys for distributed systems',
    ],
  },
  {
    title: 'Authentication & Security',
    items: [
      'Implement JWT with refresh tokens',
      'Use bcrypt for password hashing (rounds >= 10)',
      'Enable HTTPS/TLS for all API endpoints',
      'Apply principle of least privilege for permissions',
    ],
  },
  {
    title: 'API Development',
    items: [
      'Version your API endpoints (e.g., /api/v1/)',
      'Implement rate limiting and request throttling',
      'Use proper HTTP status codes and error messages',
      'Document all endpoints with OpenAPI/Swagger',
    ],
  },
  {
    title: 'Frontend Architecture',
    items: [
      'Use Next.js App Router for optimal performance',
      'Implement client-side caching with React Query',
      'Follow component composition patterns',
      'Use TypeScript for type safety',
    ],
  },
];

const FAQS = [
  {
    q: 'What are the system requirements for deploying Pulse CRM?',
    a: 'Backend: Python 3.11+, PostgreSQL 14+, Redis (optional for caching). Frontend: Node.js 18+, Next.js 14+. We recommend at least 2 CPU cores and 4GB RAM for production deployments.',
  },
  {
    q: 'How long does a typical implementation take?',
    a: 'A full implementation takes 5-8 weeks depending on customization needs. Basic setup can be completed in 1-2 weeks, with core CRM features in 2-3 additional weeks.',
  },
  {
    q: 'Can I customize the data model for my business needs?',
    a: 'Yes. Pulse CRM supports custom fields on all major entities (companies, contacts, leads, deals). You can add custom tables and relationships as needed.',
  },
  {
    q: 'What deployment options are supported?',
    a: 'Self-hosted on your infrastructure, cloud deployment (AWS, GCP, Azure), or containerized with Docker/Kubernetes. We provide deployment guides for each option.',
  },
  {
    q: 'How do I migrate data from my existing CRM?',
    a: 'We provide CSV import tools and API endpoints for bulk data migration. For Salesforce, HubSpot, or other major CRMs, we offer migration scripts and assistance.',
  },
  {
    q: 'Is training included in the implementation?',
    a: 'Implementation guides include comprehensive documentation. Enterprise plans include dedicated training sessions and implementation support from our team.',
  },
];

export default function ImplementationGuidePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div style={{ fontFamily: "'Inter',system-ui,sans-serif", background: '#fff', minHeight: '100vh' }}>
      <PageModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      <Navbar onOpenModal={() => setModalOpen(true)} />

      {/* Hero Section */}
      <section style={{ marginTop: 64, padding: '72px 48px 56px', background: 'linear-gradient(180deg,#f5f3ff 0%,#fff 100%)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', background: '#f5f3ff', border: '1px solid #ede9fe', borderRadius: 100, marginBottom: 20 }}>
            <Wrench size={13} color="#7c3aed" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Implementation Guide</span>
          </div>
          <h1 style={{ fontSize: 'clamp(38px,5vw,58px)', fontWeight: 900, color: '#0f172a', lineHeight: 1.08, letterSpacing: '-0.035em', marginBottom: 16 }}>
            Deploy Pulse CRM in 5-8 Weeks
          </h1>
          <p style={{ fontSize: 19, color: '#475569', lineHeight: 1.7, maxWidth: 680, marginBottom: 32 }}>
            A comprehensive step-by-step guide to implementing Pulse CRM for your organization. From infrastructure setup to advanced AI features.
          </p>
        </div>
      </section>

      {/* Implementation Phases */}
      <section style={{ padding: '60px 48px 40px', background: '#fff' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <h2 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', marginBottom: 32, letterSpacing: '-0.02em' }}>
            Implementation Roadmap
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {IMPLEMENTATION_STEPS.map((phase, idx) => (
              <div key={idx} style={{ background: '#f8fafc', borderRadius: 16, padding: 32, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                  <div style={{ height: 44, width: 44, borderRadius: 12, background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: '#fff' }}>
                    {idx + 1}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 }}>{phase.phase}</h3>
                    <p style={{ fontSize: 14, color: '#64748b', margin: '2px 0 0', fontWeight: 600 }}>{phase.duration}</p>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                  {phase.steps.map((step, i) => {
                    const Icon = step.icon;
                    return (
                      <div key={i} style={{ background: '#fff', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                          <Icon size={20} color="#7c3aed" />
                          <h4 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>{step.title}</h4>
                        </div>
                        <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Best Practices */}
      <section style={{ padding: '60px 48px', background: '#f8fafc' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <h2 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', marginBottom: 32, letterSpacing: '-0.02em' }}>
            Best Practices
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {BEST_PRACTICES.map((category, idx) => (
              <div key={idx} style={{ background: '#fff', borderRadius: 16, padding: 28, border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>{category.title}</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {category.items.map((item, i) => (
                    <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <CheckCircle size={16} color="#059669" style={{ flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontSize: 14, color: '#475569', lineHeight: 1.6 }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Prerequisites */}
      <section style={{ padding: '60px 48px', background: '#fff' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 16, padding: 32 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <AlertTriangle size={24} color="#d97706" style={{ flexShrink: 0 }} />
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#78350f', margin: '0 0 12px' }}>Prerequisites</h3>
                <div style={{ fontSize: 14, color: '#92400e', lineHeight: 1.7 }}>
                  <p style={{ margin: '0 0 12px' }}>Before starting your Pulse CRM implementation, ensure you have:</p>
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    <li>PostgreSQL 14+ database instance with superuser access</li>
                    <li>Python 3.11+ and Node.js 18+ development environments</li>
                    <li>SSL certificates for production deployment</li>
                    <li>Email service credentials (SMTP or SendGrid)</li>
                    <li>Cloud hosting account (AWS, GCP, Azure, or similar)</li>
                    <li>Basic knowledge of SQL, REST APIs, and React</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section style={{ padding: '60px 48px 80px', background: '#f8fafc' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', textAlign: 'center', marginBottom: 40, letterSpacing: '-0.02em' }}>
            Implementation FAQs
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FAQS.map((faq, i) => (
              <div key={i} style={{
                background: '#fff',
                border: '1.5px solid',
                borderColor: openFaq === i ? '#c4b5fd' : '#e2e8f0',
                borderRadius: 14,
                overflow: 'hidden',
                transition: 'border-color 0.15s',
              }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    padding: '18px 22px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', lineHeight: 1.4 }}>{faq.q}</span>
                  <ArrowRight
                    size={17}
                    color="#94a3b8"
                    style={{
                      flexShrink: 0,
                      transition: 'transform 0.2s',
                      transform: openFaq === i ? 'rotate(90deg)' : 'rotate(0)',
                    }}
                  />
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 22px 18px' }}>
                    <div style={{ height: 1, background: '#ede9fe', marginBottom: 14 }} />
                    <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.75, margin: 0 }}>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: '80px 48px', background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)', textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{ fontSize: 38, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 14 }}>
            Need Implementation Support?
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.85)', marginBottom: 32 }}>
            Our team can help you deploy and configure Pulse CRM for your organization.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            style={{
              padding: '14px 32px',
              background: '#ffffff',
              color: '#7c3aed',
              fontSize: 15,
              fontWeight: 700,
              borderRadius: 100,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              transition: 'transform 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.03)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
          >
            Contact Support Team →
          </button>
        </div>
      </section>

      <footer style={{ padding: '36px 48px', background: '#0f172a', color: '#475569', textAlign: 'center' }}>
        <p style={{ fontSize: 14 }}>© 2026 Pulse CRM Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}
