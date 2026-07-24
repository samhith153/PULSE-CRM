'use client';
import React, { useState } from 'react';
import { Users, Sparkles, Mail, Target, TrendingUp, Zap } from 'lucide-react';
import { PageContainer, HeroWithScreenshot, Statistics, CTASection } from '@/components/shared/PageTemplates';
import { motion } from 'framer-motion';

const RepScreenshot = () => (
  <div style={{ padding: '20px', background: '#f8fafc' }}>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: '16px', border: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Your Deals Today</div>
        {['Acme Corp', 'Wayne Ent.', 'Pied Piper'].map((name, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px', background: '#f8fafc', borderRadius: 8, marginBottom: 8 }}>
            <div style={{ height: 32, width: 32, borderRadius: 8, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: '#7c3aed' }}>
              {[94, 73, 61][i]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>{name}</div>
              <div style={{ fontSize: 10, color: '#64748b' }}>Negotiation · {[28, 18, 8][i]}d</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ background: '#f5f3ff', borderRadius: 12, padding: '16px', border: '1px solid #ede9fe' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#5b21b6', marginBottom: 10 }}>✦ AI Priority for Today</div>
        <div style={{ fontSize: 11, color: '#374151', lineHeight: 1.6, marginBottom: 10 }}>
          Call <strong>Acme Corp</strong> — no contact in 6 days. Deal at risk.
        </div>
        <button style={{ padding: '6px 12px', background: '#7c3aed', color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 6, border: 'none', cursor: 'pointer' }}>
          Draft Email
        </button>
      </div>
    </div>
  </div>
);

export default function SalesRepsPage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <PageContainer>
      <HeroWithScreenshot
        badge="Solutions · Sales Representatives"
        badgeIcon={Users}
        title={<>Close more deals.<br /><span style={{ color: '#7c3aed' }}>In less time. Every day.</span></>}
        description="AI-drafted emails, AI lead scores, and a crystal-clear pipeline mean you spend your day selling — not updating spreadsheets."
        screenshot={<RepScreenshot />}
        onCTA={() => setModalOpen(true)}
      />

      {/* Feature Highlight */}
      <section style={{ padding: '80px 48px', background: '#fff' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ fontSize: 36, fontWeight: 900, color: '#0f172a', textAlign: 'center', marginBottom: 48, letterSpacing: '-0.02em' }}>
            Built for how reps actually work
          </motion.h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {[
              { icon: Target, title: 'AI-Prioritised Deals', desc: 'AI ranks your deals by urgency every morning.' },
              { icon: Sparkles, title: 'One-Click Email Drafts', desc: 'AI reads deal context and drafts personalized emails.' },
              { icon: Mail, title: 'Email Tracking', desc: 'See who opened your proposal and when.' },
              { icon: TrendingUp, title: 'Deal Timeline', desc: 'Full context in seconds before every call.' },
              { icon: Zap, title: 'One-Tap Logging', desc: 'Log calls and notes in seconds from any device.' },
              { icon: Users, title: 'Live Leaderboard', desc: 'See where you rank in real-time.' },
            ].map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  style={{ padding: 24, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                  <div style={{ height: 40, width: 40, borderRadius: 10, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <Icon size={18} color="#7c3aed" />
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>{feature.title}</h3>
                  <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>{feature.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <Statistics
        stats={[
          { value: '2.1×', label: 'More Deals Closed', description: 'Reps with AI close twice as many deals' },
          { value: '45min', label: 'Admin Saved Daily', description: 'Automated logging eliminates busywork' },
          { value: '8.2h', label: 'Saved Per Week', description: 'Total time savings from automation' },
        ]}
      />

      <CTASection
        title="Give your reps an unfair advantage."
        description="Start free. Full AI Copilot, Visual Pipeline, and Email Intelligence from day one."
        onCTA={() => setModalOpen(true)}
      />
    </PageContainer>
  );
}
