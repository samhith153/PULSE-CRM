'use client';
import React, { useState } from 'react';
import Navbar from '@/components/navigation/Navbar';
import PageModal from '@/components/shared/PageModal';
import { Check, ChevronDown } from 'lucide-react';

/* ── plan data ─────────────────────────────────────── */
const PLANS = [
  {
    id: 'starter',
    tier: 'STARTER',
    price: '₹29',
    period: '/mo',
    sub: 'Up to 5 users',
    highlight: false,
    cta: 'Get Started Free',
    features: [
      'Core CRM pipeline',
      'Email sync (1 inbox)',
      'Basic reporting',
      'Mobile app',
      '5GB storage',
      'Email support',
    ],
  },
  {
    id: 'growth',
    tier: 'GROWTH',
    price: '₹79',
    period: '/mo',
    sub: 'Up to 25 users',
    highlight: true,
    badge: 'Most Popular',
    cta: 'Get Started Free',
    features: [
      'Everything in Starter',
      'AI Copilot & scoring',
      'Advanced analytics',
      'Unlimited pipelines',
      'Team leaderboards',
      'Priority support',
      'API access',
    ],
  },
  {
    id: 'enterprise',
    tier: 'ENTERPRISE',
    price: 'Custom',
    period: '',
    sub: 'Unlimited users',
    highlight: false,
    cta: 'Contact Sales',
    features: [
      'Everything in Growth',
      'SSO & SAML',
      'Dedicated CSM',
      'Custom integrations',
      'SLA guarantee',
      'On-prem option',
      'Audit logs & SOC 2',
    ],
  },
];

const FAQS = [
  {
    q: 'Can I import my existing CRM data?',
    a: 'Yes — use CSV import or the REST API to migrate contacts, companies, and deals from Salesforce, HubSpot, Zoho, or any other CRM. Free migration assistance is included on all paid plans.',
  },
  {
    q: 'What happens after the 14-day trial?',
    a: 'Your account moves to read-only mode. All your data is preserved for 30 days so you can export it or upgrade to a paid plan at any time.',
  },
  {
    q: 'Is the AI Copilot included on all plans?',
    a: 'Basic AI scoring is available on Starter. Full AI Copilot with unlimited GPT-4o queries, email drafting, and deal summaries is available on Growth and Enterprise.',
  },
  {
    q: 'Can I change plans at any time?',
    a: 'Yes. Upgrade or downgrade at any time from your account settings. Upgrades take effect immediately. Downgrades apply at the end of your billing cycle.',
  },
  {
    q: 'Do you offer discounts for nonprofits or startups?',
    a: 'Yes — contact our team at sales@pulsecrm.io for nonprofit and early-stage startup pricing. We offer 50% discounts for qualifying organizations.',
  },
  {
    q: 'Is my data secure?',
    a: 'All plans use AES-256 encryption at rest and TLS 1.3 in transit. JWT authentication and bcrypt password hashing are standard across every plan. SOC 2 compliance applies to Enterprise.',
  },
];

export default function PricingPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#f3f0ff', minHeight: '100vh' }}>
      <Navbar onOpenModal={() => setModalOpen(true)} />
      <PageModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />

      {/* ── HEADER ── */}
      <section style={{ paddingTop: 120, paddingBottom: 64, textAlign: 'center', background: '#f3f0ff' }}>
        <p style={{
          fontSize: 11, fontWeight: 800, color: '#7c3aed',
          letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 16,
        }}>
          SIMPLE PRICING
        </p>
        <h1 style={{
          fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 900, color: '#0f172a',
          letterSpacing: '-0.035em', lineHeight: 1.1, margin: '0 0 20px',
        }}>
          Start free. Scale as you grow.
        </h1>
        <p style={{ fontSize: 17, color: '#64748b', lineHeight: 1.65, maxWidth: 480, margin: '0 auto' }}>
          Every plan includes a 14-day free trial. No credit card required.
        </p>
      </section>

      {/* ── PLAN CARDS ── */}
      <section style={{
        padding: '0 24px 80px',
        background: '#f3f0ff',
        display: 'flex',
        justifyContent: 'center',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 340px))',
          gap: 0,
          maxWidth: 1020,
          width: '100%',
          alignItems: 'stretch',
        }}>
          {PLANS.map((plan, i) => (
            <div key={plan.id}
              style={{
                position: 'relative',
                background: plan.highlight ? '#7c3aed' : '#ffffff',
                borderRadius: plan.highlight ? 20 : i === 0 ? '16px 0 0 16px' : '0 16px 16px 0',
                border: plan.highlight ? 'none' : '1px solid #e2e8f0',
                padding: plan.highlight ? '40px 36px' : '36px 32px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: plan.highlight
                  ? '0 24px 60px rgba(124,58,237,0.35), 0 0 0 1px rgba(124,58,237,0.1)'
                  : 'none',
                zIndex: plan.highlight ? 2 : 1,
                marginTop: plan.highlight ? -16 : 0,
                marginBottom: plan.highlight ? -16 : 0,
                transform: plan.highlight ? 'scale(1.02)' : 'none',
              }}>

              {/* Most Popular badge */}
              {plan.badge && (
                <div style={{
                  position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                  background: '#fbbf24', color: '#0f172a',
                  fontSize: 11, fontWeight: 800, padding: '5px 16px',
                  borderRadius: 100, whiteSpace: 'nowrap',
                  boxShadow: '0 4px 14px rgba(251,191,36,0.4)',
                  letterSpacing: '0.02em',
                }}>
                  Most Popular
                </div>
              )}

              {/* Tier label */}
              <p style={{
                fontSize: 11, fontWeight: 800,
                color: plan.highlight ? 'rgba(255,255,255,0.75)' : '#94a3b8',
                letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 12px',
              }}>
                {plan.tier}
              </p>

              {/* Price */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, marginBottom: 6 }}>
                <span style={{
                  fontSize: plan.price === 'Custom' ? 44 : 56,
                  fontWeight: 900,
                  color: plan.highlight ? '#ffffff' : '#0f172a',
                  letterSpacing: '-0.04em',
                  lineHeight: 1,
                }}>
                  {plan.price}
                </span>
                {plan.period && (
                  <span style={{
                    fontSize: 15, color: plan.highlight ? 'rgba(255,255,255,0.7)' : '#94a3b8',
                    fontWeight: 500, paddingBottom: 6,
                  }}>
                    {plan.period}
                  </span>
                )}
              </div>

              {/* Users sub-label */}
              <p style={{
                fontSize: 13, fontWeight: 600,
                color: plan.highlight ? 'rgba(255,255,255,0.7)' : '#64748b',
                margin: '0 0 28px',
              }}>
                {plan.sub}
              </p>

              {/* Feature list */}
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                {plan.features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      height: 18, width: 18, borderRadius: '50%',
                      background: plan.highlight ? 'rgba(255,255,255,0.2)' : '#f0eeff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Check size={11} color={plan.highlight ? '#ffffff' : '#7c3aed'} strokeWidth={3} />
                    </div>
                    <span style={{
                      fontSize: 14, fontWeight: 500,
                      color: plan.highlight ? '#ffffff' : '#374151',
                    }}>
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA button */}
              <button
                onClick={() => setModalOpen(true)}
                style={{
                  width: '100%', padding: '14px',
                  borderRadius: 12, border: 'none',
                  background: plan.highlight ? '#ffffff' : '#7c3aed',
                  color: plan.highlight ? '#7c3aed' : '#ffffff',
                  fontSize: 14, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.15s ease',
                  boxShadow: plan.highlight
                    ? '0 4px 16px rgba(0,0,0,0.12)'
                    : '0 4px 14px rgba(124,58,237,0.3)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = plan.highlight
                    ? '0 8px 24px rgba(0,0,0,0.18)'
                    : '0 8px 24px rgba(124,58,237,0.45)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLElement).style.boxShadow = plan.highlight
                    ? '0 4px 16px rgba(0,0,0,0.12)'
                    : '0 4px 14px rgba(124,58,237,0.3)';
                }}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── TRUST STRIP ── */}
      <section style={{ background: '#ffffff', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: '32px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 40 }}>
          {[
            { val: '14-day', label: 'free trial on every plan' },
            { val: 'No card', label: 'required to start' },
            { val: 'Cancel', label: 'anytime, no lock-in' },
            { val: 'Free', label: 'data migration help' },
          ].map(t => (
            <div key={t.val} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#7c3aed', letterSpacing: '-0.02em' }}>{t.val}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500, marginTop: 2 }}>{t.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: '80px 24px 100px', background: '#ffffff' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{
            fontSize: 34, fontWeight: 900, color: '#0f172a',
            letterSpacing: '-0.025em', textAlign: 'center', marginBottom: 8,
          }}>
            Frequently asked questions
          </h2>
          <p style={{ fontSize: 15, color: '#64748b', textAlign: 'center', marginBottom: 48 }}>
            Still have questions?{' '}
            <a href="mailto:sales@pulsecrm.io" style={{ color: '#7c3aed', fontWeight: 600, textDecoration: 'none' }}>
              Email our sales team →
            </a>
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {FAQS.map((faq, i) => (
              <div key={i} style={{
                border: '1.5px solid',
                borderColor: openFaq === i ? '#c4b5fd' : '#e2e8f0',
                borderRadius: 14, overflow: 'hidden',
                transition: 'border-color 0.15s',
                background: openFaq === i ? '#faf8ff' : '#ffffff',
              }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', gap: 16,
                    padding: '18px 22px', background: 'transparent',
                    border: 'none', cursor: 'pointer',
                    fontFamily: 'inherit', textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', lineHeight: 1.4 }}>
                    {faq.q}
                  </span>
                  <ChevronDown
                    size={17} color="#94a3b8" style={{ flexShrink: 0, transition: 'transform 0.2s', transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0)' }}
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

      {/* ── BOTTOM CTA ── */}
      <section style={{
        padding: '80px 24px',
        background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{
            fontSize: 38, fontWeight: 900, color: '#ffffff',
            letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 14,
          }}>
            Ready to close more deals?
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.85)', marginBottom: 32 }}>
            Start your free 14-day trial today. No credit card. Full access from day one.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setModalOpen(true)}
              style={{
                padding: '14px 32px', background: '#ffffff', color: '#7c3aed',
                fontSize: 15, fontWeight: 700, borderRadius: 100, border: 'none',
                cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                transition: 'transform 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.03)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
            >
              Start Free Trial →
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: '32px 24px', background: '#0f172a', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: '#475569', margin: 0 }}>
          © 2026 Pulse CRM Inc. All rights reserved. Powered by{' '}
          <span style={{ color: '#94a3b8', fontWeight: 600 }}>Kalnet</span>.
        </p>
      </footer>
    </div>
  );
}
