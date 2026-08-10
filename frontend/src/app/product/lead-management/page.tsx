'use client';
import React from 'react';
import { Target, UserCheck, Activity, Filter, BarChart2, Zap } from 'lucide-react';
import { PageContainer, HeroWithScreenshot, FeatureCards, CTASection } from '@/components/shared/PageTemplates';
import { motion } from 'framer-motion';

const LeadManagementScreenshot = () => (
  <div style={{ padding: '20px', background: '#f8fafc' }}>
    <div style={{ background: '#fff', borderRadius: 12, padding: '16px', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Lead Pipeline</div>
        <div style={{ fontSize: 11, padding: '4px 10px', background: '#EFF6FF', border: '1px solid #DBEAFE', borderRadius: 6, fontWeight: 700, color: '#2563EB' }}>24 Active</div>
      </div>
      {/* Stage columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
        {[
          { stage: 'New', count: 8, color: '#e0e7ff', text: '#4338ca' },
          { stage: 'Contacted', count: 6, color: '#BFDBFE', text: '#1D4ED8' },
          { stage: 'Qualified', count: 5, color: '#93C5FD', text: '#2563EB' },
          { stage: 'Proposal', count: 5, color: '#fef3c7', text: '#d97706' },
        ].map((col, i) => (
          <div key={i} style={{ background: col.color, borderRadius: 8, padding: '10px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: col.text, marginBottom: 4 }}>{col.stage}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: col.text }}>{col.count}</div>
          </div>
        ))}
      </div>
      {/* Lead rows */}
      {[
        { name: 'Acme Corp', stage: 'Qualified', score: 81, badge: 'High', badgeColor: '#d97706', badgeBg: '#fef3c7' },
        { name: 'TechNova Ltd', stage: 'Contacted', score: 64, badge: 'Medium', badgeColor: '#2563eb', badgeBg: '#eff6ff' },
        { name: 'Globex Inc', stage: 'New', score: 42, badge: 'Low', badgeColor: '#64748b', badgeBg: '#f8fafc' },
      ].map((lead, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#f8fafc', borderRadius: 8, marginBottom: 6, border: '1px solid #e2e8f0' }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: '#EFF6FF', border: '1px solid #DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Target size={13} color="#2563EB" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{lead.name}</div>
            <div style={{ fontSize: 10, color: '#64748b' }}>{lead.stage}</div>
          </div>
          <div style={{ padding: '3px 8px', background: lead.badgeBg, borderRadius: 6, fontSize: 10, fontWeight: 700, color: lead.badgeColor }}>{lead.badge}</div>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#2563EB', minWidth: 28, textAlign: 'right' }}>{lead.score}</div>
        </div>
      ))}
    </div>
  </div>
);

export default function LeadManagementPage() {
  return (
    <PageContainer>
      <HeroWithScreenshot
        badge="Product · Lead Management"
        badgeIcon={Target}
        title={<>Every lead, scored<br /><span style={{ color: '#2563EB' }}>and prioritised.</span></>}
        description="Capture, qualify, and track every lead through a structured FSM pipeline. Each lead gets an AI score (0–100) based on fit and engagement signals — so your team always knows who to call next."
        screenshot={<LeadManagementScreenshot />}
      />

      {/* 3 Core Capabilities */}
      <section style={{ padding: '80px 48px', background: '#fff' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            style={{ fontSize: 36, fontWeight: 900, color: '#0f172a', textAlign: 'center', marginBottom: 12, letterSpacing: '-0.02em' }}>
            Everything your team needs to close more leads
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{ fontSize: 17, color: '#64748b', textAlign: 'center', maxWidth: 600, margin: '0 auto 52px', lineHeight: 1.7 }}>
            From first capture to closed deal — Pulse gives every rep the structure and signals they need.
          </motion.p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28 }}>
            {[
              {
                icon: Target,
                title: 'Capture & Qualify',
                desc: 'Bring new leads into a structured workspace. Assign owners, set sources, and qualify based on fit criteria — all from one organised view.',
              },
              {
                icon: UserCheck,
                title: 'AI-Scored Priority',
                desc: 'Every lead gets a 0–100 score (60% Fit + 40% Engagement). Tiers — Critical, High, Medium, Low — tell reps exactly who to focus on today.',
              },
              {
                icon: Activity,
                title: 'Pipeline & Follow-up Tracking',
                desc: 'Follow every lead through New → Contacted → Qualified → Proposal → Negotiation → Won. Every stage change is logged. Nothing falls through the cracks.',
              },
            ].map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                whileHover={{ y: -8, boxShadow: '0 20px 48px rgba(124,58,237,0.15)' }}
                style={{ padding: 32, background: '#f8fafc', borderRadius: 20, border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'box-shadow 0.3s' }}>
                <motion.div
                  whileHover={{ rotate: 8, scale: 1.1 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                  style={{ height: 52, width: 52, borderRadius: 14, background: '#EFF6FF', border: '1px solid #DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <Icon size={24} color="#2563EB" />
                </motion.div>
                <h3 style={{ fontSize: 19, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>{title}</h3>
                <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.65 }}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Detail section */}
      <section style={{ padding: '80px 48px', background: '#fff' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}>
            <h2 style={{ fontSize: 36, fontWeight: 900, color: '#0f172a', marginBottom: 16, letterSpacing: '-0.02em' }}>Built for real sales workflows</h2>
            <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.7, marginBottom: 24 }}>
              Pulse lead management isn't just a list — it's a structured FSM pipeline. Reps can only move leads forward in valid transitions. Managers see the full picture. Every action is logged.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { icon: Filter, text: 'Filter by owner, status, source, or AI tier' },
                { icon: UserCheck, text: 'Assign leads to reps with ownership tracking' },
                { icon: BarChart2, text: 'Per-lead analytics: score history, stage duration' },
                { icon: Zap, text: 'Next-best-action recommended for every lead' },
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ height: 36, width: 36, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={16} color="#2563EB" />
                  </div>
                  <span style={{ fontSize: 15, color: '#0f172a', fontWeight: 500 }}>{text}</span>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #fff 100%)', padding: 32, borderRadius: 20, border: '1px solid #DBEAFE' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#2563EB', marginBottom: 16 }}>Lead Score Breakdown</div>
            {[
              { label: 'Fit Score (60%)', value: 74, color: '#2563EB' },
              { label: 'Engagement Score (40%)', value: 88, color: '#059669' },
              { label: 'Overall Score', value: 81, color: '#0f172a', bold: true },
            ].map((item, i) => (
              <div key={i} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: item.bold ? 800 : 600, color: item.bold ? '#0f172a' : '#64748b' }}>{item.label}</span>
                  <span style={{ fontSize: 16, fontWeight: 900, color: item.color }}>{item.value}</span>
                </div>
                <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3 }}>
                  <div style={{ height: 6, width: `${item.value}%`, background: item.color, borderRadius: 3, transition: 'width 1s ease' }} />
                </div>
              </div>
            ))}
            <div style={{ marginTop: 20, padding: '12px 16px', background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Priority Tier</span>
              <span style={{ padding: '4px 12px', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 8, fontSize: 12, fontWeight: 800, color: '#d97706' }}>HIGH</span>
            </div>
          </motion.div>
        </div>
      </section>

      <FeatureCards
        features={[
          { icon: Target, title: 'AI-powered lead scoring', description: 'Every lead scored 0–100 using fit and engagement signals. Transparent reasons — no black box.' },
          { icon: Filter, title: 'Smart filtering & segmentation', description: 'Filter by score tier, pipeline stage, owner, source, or custom attributes.' },
          { icon: Activity, title: 'Full activity timeline', description: 'Every call, email, note, and stage change is logged with timestamp and user.' },
          { icon: Zap, title: 'Next-best-action engine', description: 'The recommendation engine surfaces the single best action for each lead — weighted by score, urgency, and reply status.' },
        ]}
      />

      <CTASection
        title="Turn every lead into an opportunity."
        description="14-day free trial. Full access to scoring, pipeline, and activity tracking."
      />
    </PageContainer>
  );
}
