'use client';
import React, { useState } from 'react';
import { Sparkles, Mail, Target, Brain } from 'lucide-react';
import { PageContainer, HeroWithScreenshot, Statistics, CTASection } from '@/components/shared/PageTemplates';
import { motion } from 'framer-motion';

const AICopilotScreenshot = () => (
  <div style={{ padding: '20px', background: '#f8fafc' }}>
    <div style={{ background: '#f5f3ff', borderRadius: 12, padding: '20px', border: '1px solid #ede9fe' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ height: 40, width: 40, borderRadius: 10, background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Sparkles size={20} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#5b21b6' }}>AI Copilot</div>
          <div style={{ fontSize: 11, color: '#7c3aed' }}>GPT-4o · Ready to assist</div>
        </div>
      </div>
      <div style={{ background: '#fff', borderRadius: 10, padding: '14px', marginBottom: 10, border: '1px solid #ede9fe' }}>
        <div style={{ fontSize: 12, color: '#374151', marginBottom: 8 }}>Summarise the Acme Corp deal and suggest next steps.</div>
      </div>
      <div style={{ background: '#fff', borderRadius: 10, padding: '14px', border: '1px solid #ede9fe' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', marginBottom: 6 }}>✦ AI Response</div>
        <div style={{ fontSize: 11, color: '#374151', lineHeight: 1.6 }}>
          <strong>Acme Corp (₹14.2L)</strong> is at Negotiation stage — 28 days in, 80% probability. 
          No contact in 6 days. <strong>Recommended:</strong> Schedule finalisation call before Thursday.
        </div>
      </div>
    </div>
  </div>
);

export default function AICopilotPage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <PageContainer>
      <HeroWithScreenshot
        badge="Product · AI Copilot"
        badgeIcon={Sparkles}
        title={<>Your smartest rep<br /><span style={{ color: '#7c3aed' }}>is built right in.</span></>}
        description="AI scores every lead, drafts personalized emails, and flags at-risk deals — all powered by GPT-4o."
        screenshot={<AICopilotScreenshot />}
        onCTA={() => setModalOpen(true)}
      />

      {/* Feature Highlight */}
      <section style={{ padding: '80px 48px', background: '#fff' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}>
            <h2 style={{ fontSize: 36, fontWeight: 900, color: '#0f172a', marginBottom: 16, letterSpacing: '-0.02em' }}>Intelligence that sells for you</h2>
            <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.7, marginBottom: 24 }}>
              AI Copilot reads your entire deal history, contact interactions, and email threads to give you the exact next step — every time.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { icon: Target, text: 'Lead scoring 0-100 with 98.4% accuracy' },
                { icon: Mail, text: 'Email drafts generated in seconds' },
                { icon: Brain, text: 'Deal summaries with risk analysis' },
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
            <div style={{ fontSize: 13, fontWeight: 700, color: '#7c3aed', marginBottom: 16 }}>Top Scored Leads Today</div>
            {[
              { name: 'Acme Corp', score: 94, stage: 'Hot' },
              { name: 'Wayne Ent.', score: 87, stage: 'Hot' },
              { name: 'Oscorp Inc.', score: 73, stage: 'Warm' },
            ].map((lead, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: '#fff', borderRadius: 10, marginBottom: 10, border: '1px solid #e2e8f0' }}>
                <div style={{ height: 40, width: 40, borderRadius: 8, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: '#7c3aed' }}>
                  {lead.score}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{lead.name}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{lead.stage}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <Statistics
        stats={[
          { value: '98.4%', label: 'Lead Score Accuracy', description: 'AI predictions match actual outcomes' },
          { value: '2.1×', label: 'More Deals Closed', description: 'Reps using AI drafts close 2x more' },
          { value: '< 2s', label: 'Response Time', description: 'GPT-4o answers with live CRM context' },
        ]}
      />

      <CTASection
        title="Let AI do the heavy lifting."
        description="Start your free 14-day trial with full AI Copilot access from day one."
        onCTA={() => setModalOpen(true)}
      />
    </PageContainer>
  );
}
