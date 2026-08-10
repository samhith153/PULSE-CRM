'use client';
import React from 'react';
import { Mail, RefreshCw, Link2, Sparkles } from 'lucide-react';
import { PageContainer, HeroWithScreenshot, FeatureCards, CTASection } from '@/components/shared/PageTemplates';
import { motion } from 'framer-motion';

const EmailScreenshot = () => (
  <div style={{ padding: '20px', background: '#f8fafc' }}>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 12 }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: '16px', border: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Gmail Threads</div>
        {['Acme Corp', 'TechNova Ltd', 'Globex Inc'].map((name, i) => (
          <div key={i} style={{ padding: '10px', background: i === 0 ? '#EFF6FF' : '#f8fafc', borderRadius: 8, marginBottom: 8, border: `1px solid ${i === 0 ? '#DBEAFE' : '#e2e8f0'}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>{name}</div>
            <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{[3, 1, 2][i]} email{[3,1,2][i]>1?'s':''} · synced</div>
          </div>
        ))}
      </div>
      <div style={{ background: '#fff', borderRadius: 12, padding: '16px', border: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>AI Thread Summary</div>
        <div style={{ background: '#EFF6FF', borderRadius: 8, padding: '10px', marginBottom: 8, border: '1px solid #DBEAFE' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#2563EB', marginBottom: 4 }}>GROQ · LLAMA 3.3-70B</div>
          <div style={{ fontSize: 11, color: '#374151', lineHeight: 1.5 }}>Prospect asked for demo. Positive sentiment. Intent: demo_request</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {[
            { label: 'Sentiment', value: 'positive', color: '#059669' },
            { label: 'Intent', value: 'demo', color: '#2563EB' },
            { label: 'Follow-up', value: '2 days', color: '#2563eb' },
            { label: 'Confidence', value: '0.92', color: '#d97706' },
          ].map((item, i) => (
            <div key={i} style={{ padding: '8px', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600 }}>{item.label.toUpperCase()}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: item.color }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default function EmailIntelligencePage() {
  return (
    <PageContainer>
      <HeroWithScreenshot
        badge="Product · Gmail Intelligence"
        badgeIcon={Mail}
        title={<>Gmail sync + AI<br /><span style={{ color: '#2563EB' }}>thread analysis.</span></>}
        description="Connect Gmail via OAuth2 and every email thread syncs automatically into Pulse. Groq/Llama 3.3-70B then analyses each thread to extract a one-line summary, sentiment, intent tag, confidence score, action items, a draft reply, and the recommended follow-up timing."
        screenshot={<EmailScreenshot />}
      />

      <section style={{ padding: '80px 48px', background: '#fff' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <h2 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', marginBottom: 16, letterSpacing: '-0.02em' }}>What the AI extracts from every thread</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'summary', example: '"Prospect requested a live demo for Q1"' },
                { label: 'summary_word', example: '"demo_request" (single intent tag)' },
                { label: 'sentiment', example: '"positive" / "neutral" / "negative"' },
                { label: 'intent', example: '"demo" / "buy" / "negotiate" / "decline"' },
                { label: 'confidence', example: '0.92 (0.0 → 1.0 scale)' },
                { label: 'key_points', example: '["Wants Q1 demo", "Budget confirmed"]' },
                { label: 'draft_reply', example: '"Happy to schedule — does Tuesday work?"' },
                { label: 'follow_up_timing', example: '"2_days" / "immediate" / "1_week"' },
              ].map((item, i) => (
                <div key={i} style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#2563EB' }}>{item.label}</span>
                  <span style={{ fontSize: 12, color: '#64748b' }}> → {item.example}</span>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <h2 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', marginBottom: 16, letterSpacing: '-0.02em' }}>Gmail sync details</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                'OAuth2 connect/refresh/sync/send via Gmail API',
                'Emails stored per user, grouped into threads',
                'Inbound and outbound direction tracked per message',
                'Each thread linkable to a contact or deal',
                'Brevo webhooks receive delivery/open/click/bounce events',
                'SMTP send path available without Gmail OAuth',
                'Summarisation runs as a separate FastAPI microservice (port 8003)',
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563EB', marginTop: 6, flexShrink: 0 }} />
                  <span style={{ fontSize: 14, color: '#374151', lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <FeatureCards
        features={[
          { icon: RefreshCw, title: 'Gmail OAuth2 sync', description: 'Connect once. All threads sync automatically per user, grouped and stored in PostgreSQL.' },
          { icon: Link2, title: 'Linked to leads & deals', description: 'Every thread can be attached to a contact or deal record for full context.' },
          { icon: Sparkles, title: 'Groq/Llama 3.3-70B', description: 'The summarisation microservice uses Llama 3.3-70B — not GPT. Fast and cost-effective.' },
          { icon: Mail, title: 'Brevo + SMTP fallback', description: 'Webhook events for email delivery tracking. SMTP available as a send-only path.' },
        ]}
      />

      <CTASection
        title="Every email, automatically analysed."
        description="Connect Gmail. Get AI summaries, intent tags, and draft replies for every thread."
      />
    </PageContainer>
  );
}
