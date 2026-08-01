'use client';
import React from 'react';
import { Check, Zap, Star, Building2, ArrowRight } from 'lucide-react';
import DrawerFooter from '../DrawerFooter';

const plans = [
  {
    name: 'Free Trial', price: '₹0', period: '14 days', icon: Star, color: '#059669',
    badge: 'No card needed',
    features: ['5 contacts + 5 leads seeded', 'Core CRM pipeline', 'Gmail sync (1 inbox)', 'REST API access', 'Swagger UI at /docs'],
  },
  {
    name: 'Starter', price: '₹29', period: '/mo', icon: Zap, color: '#7c3aed',
    badge: null,
    features: ['Up to 5 users', 'Contacts & lead management', 'FSM pipeline (6 stages)', 'Email sync (Gmail)', 'Basic analytics', 'Email support'],
  },
  {
    name: 'Growth', price: '₹79', period: '/mo', icon: Star, color: '#7c3aed',
    badge: 'Most Popular',
    features: ['Up to 25 users', 'Everything in Starter', 'AI Copilot & lead scoring', 'Advanced reports', 'Team leaderboards', 'Activity timeline', 'Priority support', 'Full REST API'],
    highlight: true,
  },
  {
    name: 'Enterprise', price: 'Custom', period: '', icon: Building2, color: '#0f172a',
    badge: null,
    features: ['Unlimited users', 'Everything in Growth', 'SSO & SAML login', 'Dedicated CSM', 'SLA guarantee', 'Audit logs & SOC 2', 'On-premise option', 'Custom integrations'],
  },
];

const faqs = [
  { q: 'Can I import my existing CRM data?', a: 'Yes — use our CSV import or REST API to migrate contacts, companies, and deals from Salesforce, HubSpot, or Zoho.' },
  { q: 'What happens after the 14-day trial?', a: 'Choose a plan or your account moves to read-only. All your data is preserved for 30 days.' },
  { q: 'Is the API included in all plans?', a: 'Full REST API access (40+ endpoints) is included in all paid plans. The trial includes read-only access.' },
  { q: 'How does AI scoring work?', a: 'GPT-4o analyses deal context, contact engagement, and activity history to generate a 0–100 lead score automatically.' },
];

interface PricingDrawerProps {
  onClose: () => void;
  onOpenModal: () => void;
}

export default function PricingDrawer({ onClose, onOpenModal }: PricingDrawerProps) {
  return (
    <div style={{ padding: '28px 40px', overflowY: 'auto', height: '100%', display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* Heading */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f5f3ff', border: '1px solid #ede9fe', borderRadius: 100, padding: '5px 14px', marginBottom: 14 }}>
          <Zap size={12} color="#7c3aed" />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Simple Pricing</span>
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', margin: '0 0 8px', letterSpacing: '-0.03em' }}>Start free. Scale as you grow.</h2>
        <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>All plans include a 14-day free trial. No credit card required.</p>
      </div>

      {/* Pricing cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {plans.map(plan => {
          const Icon = plan.icon;
          return (
            <div key={plan.name} style={{
              padding: '24px 20px', borderRadius: 18,
              border: plan.highlight ? '2px solid #7c3aed' : '1.5px solid #e5e7eb',
              background: plan.highlight ? '#7c3aed' : '#fff',
              boxShadow: plan.highlight ? '0 12px 40px rgba(124,58,237,0.25)' : '0 2px 12px rgba(0,0,0,0.05)',
              position: 'relative',
              display: 'flex', flexDirection: 'column', gap: 16,
            }}>
              {plan.badge && (
                <div style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  background: plan.highlight ? '#fef3c7' : '#f0fdf4',
                  color: plan.highlight ? '#92400e' : '#166534',
                  fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 100, whiteSpace: 'nowrap',
                }}>
                  {plan.badge}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ height: 36, width: 36, borderRadius: 10, background: plan.highlight ? 'rgba(255,255,255,0.2)' : '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} color={plan.highlight ? '#fff' : '#7c3aed'} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 800, color: plan.highlight ? '#fff' : '#0f172a' }}>{plan.name}</span>
              </div>

              <div>
                <span style={{ fontSize: 36, fontWeight: 900, color: plan.highlight ? '#fff' : '#0f172a', letterSpacing: '-0.04em' }}>{plan.price}</span>
                {plan.period && <span style={{ fontSize: 14, color: plan.highlight ? 'rgba(255,255,255,0.7)' : '#6b7280', fontWeight: 500, marginLeft: 2 }}>{plan.period}</span>}
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {plan.features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: plan.highlight ? 'rgba(255,255,255,0.9)' : '#374151', fontWeight: 500, lineHeight: 1.4 }}>
                    <Check size={13} color={plan.highlight ? '#fff' : '#7c3aed'} style={{ marginTop: 1, flexShrink: 0 }} />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => onOpenModal()}
                style={{
                  marginTop: 'auto', padding: '11px', borderRadius: 10, border: 'none',
                  background: plan.highlight ? '#fff' : '#7c3aed',
                  color: plan.highlight ? '#7c3aed' : '#fff',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                {plan.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'} <ArrowRight size={13} />
              </button>
            </div>
          );
        })}
      </div>

      {/* FAQ */}
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: '0 0 16px', letterSpacing: '-0.01em' }}>Frequently Asked Questions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {faqs.map(faq => (
            <div key={faq.q} style={{ padding: '16px 20px', borderRadius: 12, background: '#f9fafb', border: '1px solid #f1f5f9' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>{faq.q}</p>
              <p style={{ fontSize: 12.5, color: '#6b7280', lineHeight: 1.6, margin: 0, fontWeight: 400 }}>{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      <DrawerFooter onClose={onClose} onOpenModal={onOpenModal} />
    </div>
  );
}
