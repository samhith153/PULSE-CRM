'use client';
import React from 'react';
import { Zap, Target, TrendingUp, Activity, ArrowRight } from 'lucide-react';
import { PageContainer, HeroWithScreenshot, FeatureCards, CTASection } from '@/components/shared/PageTemplates';
import { motion } from 'framer-motion';

const NextActionScreenshot = () => (
  <div style={{ padding: '20px', background: '#f8fafc' }}>
    <div style={{ background: '#fff', borderRadius: 12, padding: '20px', border: '1px solid #e2e8f0' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Next-Best-Action · Acme Corp</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { action: 'Schedule demo', weight: 0.82, factor: 'score', color: '#2563EB' },
          { action: 'Send follow-up', weight: 0.64, factor: 'urgency', color: '#2563eb' },
          { action: 'Send proposal', weight: 0.41, factor: 'reply status', color: '#059669' },
        ].map((item, i) => (
          <div key={i} style={{ padding: '12px', background: i === 0 ? '#EFF6FF' : '#f8fafc', borderRadius: 10, border: `1px solid ${i === 0 ? '#DBEAFE' : '#e2e8f0'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{item.action}</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: item.color }}>w={item.weight}</div>
            </div>
            <div style={{ fontSize: 11, color: '#64748b' }}>Top factor: <strong>{item.factor}</strong></div>
            {i === 0 && <div style={{ marginTop: 8, padding: '6px 10px', background: '#2563EB', borderRadius: 6, fontSize: 11, fontWeight: 600, color: '#fff', display: 'inline-block' }}>Recommended ✓</div>}
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function AutomationPage() {
  return (
    <PageContainer>
      <HeroWithScreenshot
        badge="Product · Next-Best-Action"
        badgeIcon={Zap}
        title={<>Always know your<br /><span style={{ color: '#2563EB' }}>next move.</span></>}
        description="Pulse's recommendation engine scores every possible action for a lead and surfaces the one with the highest weighted priority — based on lead score, urgency, and reply status. No guesswork, no black box."
        screenshot={<NextActionScreenshot />}
      />

      <section style={{ padding: '80px 48px', background: '#fff' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ fontSize: 36, fontWeight: 900, color: '#0f172a', textAlign: 'center', marginBottom: 48, letterSpacing: '-0.02em' }}>
            How the recommendation engine works
          </motion.h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 48 }}>
            {[
              { icon: Target, title: 'Score each candidate action', desc: 'For each valid action at the current pipeline stage, the engine computes: weight = w_s × score + w_u × urgency + w_r × reply_factor' },
              { icon: TrendingUp, title: 'Pick the highest weight', desc: 'The action with the highest weighted score wins. The top contributing factor (score, urgency, or reply) becomes the plain-English reason.' },
              { icon: Activity, title: 'Stage-aware filtering', desc: 'Actions are filtered by pipeline stage. "Schedule demo" only appears for Qualified or Demo Scheduled leads. "Escalate" only for Negotiation.' },
            ].map(({ icon: Icon, title, desc }, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                style={{ padding: 24, background: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0' }}>
                <div style={{ height: 44, width: 44, borderRadius: 12, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <Icon size={20} color="#2563EB" />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>{title}</h3>
                <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>{desc}</p>
              </motion.div>
            ))}
          </div>
          <div style={{ background: '#EFF6FF', borderRadius: 16, padding: '28px 32px', border: '1px solid #DBEAFE' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#2563EB', marginBottom: 12 }}>5 Built-in Actions</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {['Send follow-up', 'Schedule demo', 'Send proposal', 'Mark as stale', 'Escalate to manager'].map((a, i) => (
                <div key={i} style={{ padding: '8px 16px', background: '#fff', borderRadius: 8, border: '1px solid #DBEAFE', fontSize: 13, fontWeight: 600, color: '#2563EB', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ArrowRight size={13} /> {a}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <FeatureCards
        features={[
          { icon: Zap, title: 'Deterministic reasoning', description: 'Reasons are derived mathematically from the top contributing factor — never invented.' },
          { icon: Target, title: 'Stage-aware actions', description: 'Only actions valid for the current FSM stage are considered as candidates.' },
          { icon: TrendingUp, title: 'Score + urgency + reply', description: 'Three signals combined: lead score, days since last activity, and whether a reply was received.' },
          { icon: Activity, title: 'API-ready at /api/v1/ai', description: 'Call the recommendation endpoint with a lead ID to get structured next-best-action JSON.' },
        ]}
      />

      <CTASection
        title="Always know your next move."
        description="Every lead gets a recommended action with a transparent, explainable reason."
      />
    </PageContainer>
  );
}
