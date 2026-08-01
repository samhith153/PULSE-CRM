'use client';
import React from 'react';
import { Sparkles, Target, TrendingUp, Activity } from 'lucide-react';
import { PageContainer, HeroWithScreenshot, Statistics, CTASection } from '@/components/shared/PageTemplates';
import { motion } from 'framer-motion';

const AIScoringScreenshot = () => (
  <div style={{ padding: '20px', background: '#f8fafc' }}>
    <div style={{ background: '#f5f3ff', borderRadius: 12, padding: '20px', border: '1px solid #ede9fe' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ height: 40, width: 40, borderRadius: 10, background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Sparkles size={20} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#5b21b6' }}>AI Scoring Engine</div>
          <div style={{ fontSize: 11, color: '#7c3aed' }}>Rule-based · Transparent · 0–100</div>
        </div>
      </div>
      {/* Score breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div style={{ background: '#fff', borderRadius: 10, padding: '12px', border: '1px solid #ede9fe' }}>
          <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>FIT SCORE (60%)</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#7c3aed' }}>78</div>
          <div style={{ fontSize: 10, color: '#94a3b8' }}>Industry + size + software gap</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 10, padding: '12px', border: '1px solid #ede9fe' }}>
          <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>ENGAGEMENT (40%)</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#059669' }}>85</div>
          <div style={{ fontSize: 10, color: '#94a3b8' }}>Intent + response time + trend</div>
        </div>
      </div>
      <div style={{ background: '#fff', borderRadius: 10, padding: '12px', border: '1px solid #ede9fe' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#7c3aed' }}>OVERALL SCORE · HIGH TIER</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#0f172a' }}>81</div>
          </div>
          <div style={{ padding: '6px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#059669' }}>High Priority</div>
        </div>
        <div style={{ fontSize: 11, color: '#64748b', marginTop: 8 }}>Reason: High engagement score — strong intent signals detected</div>
      </div>
    </div>
  </div>
);

export default function AICopilotPage() {
  return (
    <PageContainer>
      <HeroWithScreenshot
        badge="Product · AI Scoring & Copilot"
        badgeIcon={Sparkles}
        title={<>Transparent scoring.<br /><span style={{ color: '#7c3aed' }}>No black box.</span></>}
        description="Pulse scores every lead 0–100 using a deterministic rule-based engine — Fit (60%) + Engagement (40%). Every score comes with a human-readable reason. Groq/Llama 3.3 analyses email threads to extract intent and sentiment that feeds directly into scoring."
        screenshot={<AIScoringScreenshot />}
      />

      <section style={{ padding: '80px 48px', background: '#fff' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}>
            <h2 style={{ fontSize: 36, fontWeight: 900, color: '#0f172a', marginBottom: 16, letterSpacing: '-0.02em' }}>How the scoring engine works</h2>
            <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.7, marginBottom: 24 }}>
              The engine combines two weighted scores. Fit measures how well a lead matches your ideal customer profile. Engagement measures activity and intent signals. Both are combined (0.6×Fit + 0.4×Engagement) and classified into Critical / High / Medium / Low tiers.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { icon: Target, text: 'Fit factors: company size, industry, software gap, operational fit' },
                { icon: Activity, text: 'Engagement factors: intent, buying stage, response time, trend' },
                { icon: TrendingUp, text: 'Overall = 0.6 × Fit + 0.4 × Engagement → tier-bounded' },
                { icon: Sparkles, text: 'Groq/Llama 3.3 extracts intent_word from email threads' },
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ height: 36, width: 36, borderRadius: 8, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={16} color="#7c3aed" />
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
            style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #fff 100%)', padding: 32, borderRadius: 16, border: '1px solid #ede9fe' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#7c3aed', marginBottom: 16 }}>Priority Tiers</div>
            {[
              { tier: 'Critical', range: '90–100', condition: 'Fit ≥ 70 AND Engagement ≥ 70', color: '#dc2626' },
              { tier: 'High',     range: '70–89',  condition: 'Strong fit OR strong engagement', color: '#d97706' },
              { tier: 'Medium',   range: '40–69',  condition: 'Moderate signals on either side', color: '#2563eb' },
              { tier: 'Low',      range: '0–39',   condition: 'Weak fit and weak engagement', color: '#94a3b8' },
            ].map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: '#fff', borderRadius: 10, marginBottom: 10, border: '1px solid #e2e8f0' }}>
                <div style={{ padding: '4px 10px', background: `${t.color}15`, borderRadius: 6, fontSize: 12, fontWeight: 800, color: t.color, minWidth: 70, textAlign: 'center' }}>{t.tier}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{t.range}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{t.condition}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <Statistics
        stats={[
          { value: '0–100', label: 'Transparent Score', description: 'Every score has an explainable reason' },
          { value: '4 tiers', label: 'Priority Classification', description: 'Critical / High / Medium / Low' },
          { value: 'Groq', label: 'LLM Email Analysis', description: 'Llama 3.3-70B for thread summarisation' },
        ]}
      />

      <CTASection
        title="Scores you can explain to your team."
        description="No black box. Every lead score shows exactly which factors drove it."
      />
    </PageContainer>
  );
}
