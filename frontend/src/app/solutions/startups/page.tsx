'use client';
import FeaturePage, { FPData } from '@/components/shared/FeaturePage';
import { Rocket, Zap, TrendingUp, Users, Sparkles, Banknote } from 'lucide-react';

const data: FPData = {
  badge: 'Solutions · Startups',
  badgeIcon: Rocket,
  heroTitle: <>Launch in 2 minutes.<br /><span style={{ color: '#7c3aed' }}>Scale without re-platforming.</span></>,
  heroDesc: 'Pulse CRM is built for fast-moving startups. Sign up, import your first 100 contacts from a CSV, and close your first deal — all in under 10 minutes. No consultants. No onboarding calls.',
  overviewTitle: 'Start small, scale seamlessly',
  overviewDesc: 'Pulse CRM grows with you. Start on Starter (₹29/mo for 5 users) and upgrade to Growth or Enterprise as you scale — same platform, same data, zero migration needed.',
  capabilities: [
    { icon: Zap, title: '2-Minute Setup', desc: 'Create account, import contacts via CSV, invite your team — done. No complex onboarding, no implementation project, no delays.' },
    { icon: Banknote, title: 'Affordable Pricing', desc: 'Starter plan: ₹29/mo for 5 users. Growth plan: ₹79/mo for 25 users. No hidden fees, no per-contact pricing, no surprise bills.' },
    { icon: TrendingUp, title: 'Scale Without Migration', desc: 'Upgrade from Starter to Growth to Enterprise without changing platforms. Same URL, same data, same workflows — just more seats and features.' },
    { icon: Sparkles, title: 'AI from Day One', desc: 'Even Starter includes AI lead scoring and basic Copilot access. No "AI add-on" upsells — intelligence is baked into every plan.' },
    { icon: Users, title: 'Built for Remote Teams', desc: 'Mobile-first design, real-time sync, and async collaboration features built for distributed startup teams working across time zones.' },
    { icon: Rocket, title: 'Usage-Based Growth', desc: 'Pay only for active users. Add seats monthly as you hire. Cancel anytime with full data export via API or CSV.' },
  ],
  howItWorksTitle: 'Go from signup to first deal in 10 minutes',
  steps: [
    { step: '01', title: 'Sign up & import contacts', desc: 'Create your account at app.pulsecrm.io, upload a CSV with your first 100 contacts, and invite your cofounders. Takes 2 minutes.' },
    { step: '02', title: 'Create your first deal', desc: 'Click "+ New Deal", fill in the contact name, deal value, and expected close date. Pulse auto-creates the deal card in the "New" pipeline stage.' },
    { step: '03', title: 'Let AI score & prioritise', desc: 'AI Copilot scores every lead 0–100 based on engagement and fit. Focus on high-score leads first without manually triaging your list.' },
    { step: '04', title: 'Move deals forward', desc: 'Drag deals across the kanban board as you progress: New → Discovery → Proposal → Negotiation → Closed Won. Every move is logged automatically.' },
    { step: '05', title: 'Scale as you grow', desc: 'Hit 5 users? Upgrade to Growth (₹79/mo, 25 users) with one click. All your data, workflows, and automations carry over instantly.' },
  ],
  statsTitle: 'Built for startup speed',
  statsDesc: 'Startups on Pulse CRM close their first deal faster and scale their CRM without migrating platforms.',
  stats: [
    { stat: '< 2min', label: 'Time to first deal', desc: 'From signup to creating your first deal card' },
    { stat: '₹29', label: 'Starting price', desc: 'Per month for 5 users · 14-day free trial' },
    { stat: 'Zero', label: 'Migration needed', desc: 'Upgrade from Starter to Enterprise without changing platforms' },
    { stat: '100%', label: 'Data portability', desc: 'Export all your CRM data via CSV or REST API anytime' },
  ],
  mockupTitle: 'Startup-friendly setup wizard',
  mockup: <div style={{ padding: '80px 40px', background: 'linear-gradient(135deg,#f5f3ff 0%,#fff 100%)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #ede9fe' }}>
    <div style={{ textAlign: 'center' }}>
      <Rocket size={52} color="#7c3aed" style={{ marginBottom: 16 }} />
      <p style={{ fontSize: 16, fontWeight: 600, color: '#64748b' }}>Import your first 100 contacts</p>
      <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 4 }}>CSV upload · Auto-mapping · AI scoring enabled</p>
    </div>
  </div>,
  ctaTitle: 'Start closing deals today. Not next quarter.',
  ctaDesc: 'Sign up free, import your contacts, and create your first deal in under 10 minutes. No consultants. No onboarding calls.',
};

export default function StartupsPage() { return <FeaturePage data={data} />; }
