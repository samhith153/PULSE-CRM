'use client';
import React from 'react';
import { TrendingUp, Target, BarChart2, Zap, ArrowRight } from 'lucide-react';
import { PageContainer, HeroWithScreenshot, FeatureCards, CTASection } from '@/components/shared/PageTemplates';
import { motion } from 'framer-motion';

const PipelineScreenshot = () => (
  <div style={{ padding: '20px', background: '#f8fafc' }}>
    <div style={{ background: '#fff', borderRadius: 12, padding: '16px', border: '1px solid #e2e8f0' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>FSM Pipeline Stages</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, alignItems: 'center' }}>
        {['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won'].map((stage, i) => (
          <React.Fragment key={stage}>
            <div style={{ flex: 1, textAlign: 'center', padding: '8px 4px', background: i === 2 ? '#f5f3ff' : '#f8fafc', borderRadius: 8, border: `1px solid ${i === 2 ? '#ede9fe' : '#e2e8f0'}` }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: i === 2 ? '#7c3aed' : '#64748b', textTransform: 'uppercase' }}>{stage}</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', marginTop: 2 }}>{[12, 8, 6, 4, 3, 9][i]}</div>
            </div>
            {i < 5 && <ArrowRight size={10} color="#cbd5e1" style={{ flexShrink: 0 }} />}
          </React.Fragment>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {[
          { name: 'Acme Corp', stage: 'Negotiation', score: 94 },
          { name: 'TechNova', stage: 'Proposal', score: 78 },
          { name: 'Globex Inc', stage: 'Qualified', score: 61 },
        ].map((deal, i) => (
          <div key={i} style={{ padding: '10px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{deal.name}</div>
            <div style={{ fontSize: 10, color: '#64748b' }}>{deal.stage}</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#7c3aed', marginTop: 4 }}>Score: {deal.score}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function VisualPipelinePage() {
  return (
    <PageContainer>
      <HeroWithScreenshot
        badge="Product · Visual Pipeline"
        badgeIcon={TrendingUp}
        title={<>FSM-based stages.<br /><span style={{ color: '#7c3aed' }}>Every transition tracked.</span></>}
        description="Deals follow a strict finite state machine: New → Contacted → Qualified → Proposal Sent → Negotiation → Won / Lost. Every stage change is logged to the activity timeline. Managers see the full history. Reps see only their own deals."
        screenshot={<PipelineScreenshot />}
      />

      <section style={{ padding: '80px 48px', background: '#fff' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ fontSize: 36, fontWeight: 900, color: '#0f172a', textAlign: 'center', marginBottom: 48, letterSpacing: '-0.02em' }}>
            The full deal lifecycle
          </motion.h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto', marginBottom: 48 }}>
            {[
              { stage: 'New', color: '#e0e7ff', text: '#4338ca', desc: 'Lead created, uncontacted' },
              { stage: 'Contacted', color: '#ddd6fe', text: '#6d28d9', desc: 'First outreach made' },
              { stage: 'Qualified', color: '#c4b5fd', text: '#7c3aed', desc: 'Budget/authority confirmed' },
              { stage: 'Proposal Sent', color: '#fef3c7', text: '#d97706', desc: 'Proposal delivered' },
              { stage: 'Negotiation', color: '#fed7aa', text: '#ea580c', desc: 'Terms being discussed' },
              { stage: 'Won / Lost', color: '#d1fae5', text: '#059669', desc: 'Deal closed' },
            ].map((s, i) => (
              <React.Fragment key={s.stage}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  style={{ flex: 1, minWidth: 100, textAlign: 'center', padding: '16px 8px', background: s.color, borderRadius: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: s.text }}>{s.stage}</div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>{s.desc}</div>
                </motion.div>
                {i < 5 && <ArrowRight size={14} color="#cbd5e1" style={{ flexShrink: 0, margin: '0 2px' }} />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      <FeatureCards
        features={[
          { icon: Target, title: 'Strict FSM enforcement', description: 'Stage transitions are validated server-side. Invalid jumps are rejected by the API.' },
          { icon: BarChart2, title: 'AI score on every deal', description: 'Each deal card shows its AI score (0–100) based on fit and engagement signals.' },
          { icon: Zap, title: 'Activity timeline', description: 'Every stage change, call, email, and note is logged with timestamp and user.' },
          { icon: TrendingUp, title: 'RBAC-scoped views', description: 'Sales reps see their own deals. Managers and admins see the full team pipeline.' },
        ]}
      />

      <CTASection
        title="A pipeline that enforces your process."
        description="FSM stages, AI scoring, and activity timelines — all in one view."
      />
    </PageContainer>
  );
}
