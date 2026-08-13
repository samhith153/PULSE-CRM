'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageContainer } from '@/components/shared/PageTemplates';
import { Check, ChevronDown, Star } from 'lucide-react';
import { motion } from 'framer-motion';

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
      'Dedicated onboarding',
      'Custom integrations',
      'Multi-org management',
      'Priority support',
      'Self-hosted option',
      'Custom data retention',
    ],
  },
];

const FAQS = [
  {
    q: 'Can I import my existing CRM data?',
    a: 'Yes — use CSV import or the REST API at /api/v1/contacts, /api/v1/companies, and /api/v1/leads to migrate your data. All endpoints accept JSON payloads and are documented in the Swagger UI at /docs.',
  },
  {
    q: 'What happens after the 14-day trial?',
    a: 'Your account moves to read-only mode. All your data is preserved for 30 days so you can export it or upgrade to a paid plan at any time.',
  },
  {
    q: 'Is the AI scoring included on all plans?',
    a: 'Basic rule-based lead scoring (0–100) is available on Starter. The full AI stack — Groq/Llama 3.3 email summarisation, intent detection, draft replies, and next-best-action recommendations — is available on Growth and Enterprise.',
  },
  {
    q: 'Can I change plans at any time?',
    a: 'Yes. Upgrade or downgrade at any time from your account settings. Upgrades take effect immediately. Downgrades apply at the end of your billing cycle.',
  },
  {
    q: 'Do you offer discounts for nonprofits or startups?',
    a: 'Yes — contact our team for nonprofit and early-stage startup pricing. We offer discounts for qualifying organizations.',
  },
  {
    q: 'Is my data secure?',
    a: 'All plans use JWT authentication with access + refresh tokens. Passwords are bcrypt-hashed via passlib. Every resource has soft-delete and organization-level multi-tenant isolation. Data is never hard-deleted.',
  },
];

export default function PricingPage() {
  return (
    <PageContainer>
      <PricingContent />
    </PageContainer>
  );
}

function PricingContent() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const router = useRouter();

  return (
    <div>
      {/* ── HERO ── */}
      <section style={{
        padding: '70px 32px 80px',
        background: 'linear-gradient(180deg, #EFF6FF 0%, #fff 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background elements */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.1 }}
          transition={{ duration: 1 }}
          style={{
            position: 'absolute', top: -120, right: -120, width: 600, height: 600,
            background: 'radial-gradient(circle, #2563EB 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.05 }}
          transition={{ duration: 1.5, delay: 0.3 }}
          style={{
            position: 'absolute', bottom: -100, left: -100, width: 500, height: 500,
            background: 'radial-gradient(circle, #1D4ED8 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 16px', background: '#EFF6FF', border: '1px solid #DBEAFE',
              borderRadius: 100, marginBottom: 20,
            }}>
            <Star size={13} color="#2563EB" />
            <span style={{
              fontSize: 12, fontWeight: 700, color: '#2563EB',
              textTransform: 'uppercase', letterSpacing: '0.07em',
            }}>
              Simple Pricing
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{
              fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 900, color: '#0f172a',
              letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 16,
            }}>
            Simple pricing for every sales team
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{
              fontSize: 18, color: '#64748b', lineHeight: 1.7,
              maxWidth: 580, margin: '0 auto 40px',
            }}>
            Every plan includes a 14-day free trial. No credit card required. Scale as you grow.
          </motion.p>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            style={{
              display: 'flex', gap: 32, justifyContent: 'center',
              flexWrap: 'wrap', alignItems: 'center',
            }}>
            {[
              '14-day free trial',
              'No credit card required', 
              'Cancel anytime'
            ].map((text, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 14, fontWeight: 600, color: '#475569',
              }}>
                <Check size={16} color="#059669" strokeWidth={2.5} />
                {text}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── PRICING PLANS ── */}
      <section style={{ padding: '60px 48px 80px', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 24,
            maxWidth: 1020,
            margin: '0 auto',
          }}>
            {PLANS.map((plan, i) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                whileHover={{ y: -8 }}
                style={{
                  position: 'relative',
                  background: plan.highlight 
                    ? 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)'
                    : '#fff',
                  border: plan.highlight 
                    ? 'none' 
                    : '1.5px solid #e2e8f0',
                  borderRadius: 20,
                  padding: plan.highlight ? 40 : 36,
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: plan.highlight
                    ? '0 20px 48px rgba(37,99,235,0.25), 0 0 0 1px rgba(37,99,235,0.1)'
                    : '0 4px 24px rgba(0,0,0,0.05)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  zIndex: plan.highlight ? 2 : 1,
                }}>

                {/* Most Popular badge */}
                {plan.badge && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: 'spring' }}
                    style={{
                      position: 'absolute', top: -12, left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: '#fff',
                      fontSize: 11, fontWeight: 800,
                      padding: '6px 20px',
                      borderRadius: 100,
                      boxShadow: '0 8px 24px rgba(245,158,11,0.4)',
                      letterSpacing: '0.02em',
                    }}>
                    {plan.badge}
                  </motion.div>
                )}

                {/* Tier label */}
                <p style={{
                  fontSize: 12, fontWeight: 700,
                  color: plan.highlight ? 'rgba(255,255,255,0.8)' : '#2563EB',
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  marginBottom: 12,
                }}>
                  {plan.tier}
                </p>

                {/* Price */}
                <div style={{
                  display: 'flex', alignItems: 'flex-end', gap: 4,
                  marginBottom: 8,
                }}>
                  <span style={{
                    fontSize: plan.price === 'Custom' ? 40 : 48,
                    fontWeight: 900,
                    color: plan.highlight ? '#fff' : '#0f172a',
                    letterSpacing: '-0.03em',
                    lineHeight: 1,
                  }}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span style={{
                      fontSize: 16,
                      color: plan.highlight ? 'rgba(255,255,255,0.7)' : '#64748b',
                      fontWeight: 600,
                      paddingBottom: 4,
                    }}>
                      {plan.period}
                    </span>
                  )}
                </div>

                {/* Users subtitle */}
                <p style={{
                  fontSize: 14, fontWeight: 600,
                  color: plan.highlight ? 'rgba(255,255,255,0.8)' : '#64748b',
                  marginBottom: 32,
                }}>
                  {plan.sub}
                </p>

                {/* Features list */}
                <ul style={{
                  listStyle: 'none', padding: 0, margin: '0 0 32px',
                  display: 'flex', flexDirection: 'column', gap: 14,
                  flex: 1,
                }}>
                  {plan.features.map(feature => (
                    <li key={feature} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                    }}>
                      <div style={{
                        height: 20, width: 20, borderRadius: '50%',
                        background: plan.highlight 
                          ? 'rgba(255,255,255,0.2)' 
                          : '#EFF6FF',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <Check 
                          size={12} 
                          color={plan.highlight ? '#fff' : '#2563EB'} 
                          strokeWidth={3} 
                        />
                      </div>
                      <span style={{
                        fontSize: 15, fontWeight: 500,
                        color: plan.highlight ? '#fff' : '#374151',
                        lineHeight: 1.5,
                      }}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/signup')}
                  style={{
                    width: '100%',
                    padding: '16px 24px',
                    borderRadius: 12,
                    border: 'none',
                    background: plan.highlight ? '#fff' : '#2563EB',
                    color: plan.highlight ? '#2563EB' : '#fff',
                    fontSize: 15, fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s ease',
                    boxShadow: plan.highlight
                      ? '0 8px 24px rgba(0,0,0,0.12)'
                      : '0 8px 24px rgba(37,99,235,0.25)',
                  }}>
                  {plan.cta}
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ SECTION ── */}
      <section style={{ padding: '80px 48px', background: '#f8fafc' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{
              fontSize: 40, fontWeight: 900, color: '#0f172a',
              letterSpacing: '-0.02em', marginBottom: 12,
            }}>
              Frequently asked questions
            </h2>
            <p style={{
              fontSize: 16, color: '#64748b', marginBottom: 8,
            }}>
              Still have questions?{' '}
              <a 
                href="mailto:sales@pulsecrm.io"
                style={{
                  color: '#2563EB', fontWeight: 600, textDecoration: 'none',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.textDecoration = 'underline'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.textDecoration = 'none'; }}>
                Email our sales team →
              </a>
            </p>
          </motion.div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FAQS.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                style={{
                  background: '#fff',
                  border: '1.5px solid',
                  borderColor: openFaq === i ? '#BFDBFE' : '#e2e8f0',
                  borderRadius: 16,
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                  boxShadow: openFaq === i 
                    ? '0 8px 24px rgba(37,99,235,0.1)' 
                    : '0 2px 8px rgba(0,0,0,0.04)',
                }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '20px 24px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textAlign: 'left',
                  }}>
                  <span style={{
                    fontSize: 16, fontWeight: 700, color: '#0f172a',
                    lineHeight: 1.4,
                  }}>
                    {faq.q}
                  </span>
                  <ChevronDown
                    size={20}
                    color="#64748b"
                    style={{
                      flexShrink: 0,
                      transition: 'transform 0.2s ease',
                      transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                  />
                </button>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ overflow: 'hidden' }}>
                    <div style={{ padding: '0 24px 20px' }}>
                      <div style={{
                        height: 1, background: '#e2e8f0', marginBottom: 16,
                      }} />
                      <p style={{
                        fontSize: 15, color: '#475569', lineHeight: 1.7,
                        margin: 0,
                      }}>
                        {faq.a}
                      </p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{
        padding: '100px 48px',
        background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background elements */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 0.1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          style={{
            position: 'absolute', top: -100, left: -100, width: 600, height: 600,
            background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
        
        <div style={{ maxWidth: 700, margin: '0 auto', position: 'relative' }}>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{
              fontSize: 44, fontWeight: 900, color: '#fff',
              letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 16,
            }}>
            Ready to close more deals?
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{
              fontSize: 18, color: 'rgba(255,255,255,0.9)',
              marginBottom: 36, lineHeight: 1.6,
            }}>
            Start your free 14-day trial today. No credit card required. Full access from day one.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{
              display: 'flex', gap: 16, justifyContent: 'center',
              flexWrap: 'wrap',
            }}>
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/signup')}
              style={{
                padding: '16px 32px',
                background: '#fff',
                color: '#2563EB',
                fontSize: 16, fontWeight: 700,
                borderRadius: 100,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
                fontFamily: 'inherit',
              }}>
              Start Free Trial →
            </motion.button>
          </motion.div>
          
          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            style={{
              display: 'flex', gap: 24, justifyContent: 'center',
              marginTop: 28, flexWrap: 'wrap',
            }}>
            {[
              '14-day free trial',
              'No credit card required',
              '2-minute setup'
            ].map(text => (
              <span key={text} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 13, fontWeight: 500,
                color: 'rgba(255,255,255,0.85)',
              }}>
                <Check size={14} color="rgba(255,255,255,0.9)" />
                {text}
              </span>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
