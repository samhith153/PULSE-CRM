'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PageContainer } from '@/components/shared/PageTemplates';
import { Wrench, CheckCircle } from 'lucide-react';

const STEPS = [
  { num: '01', title: 'Create Account', desc: 'Sign up at app.pulsecrm.io with your work email.' },
  { num: '02', title: 'Import Contacts', desc: 'Upload CSV or connect Gmail to sync contacts automatically.' },
  { num: '03', title: 'Invite Team', desc: 'Add team members and assign roles (Admin, Manager, Rep).' },
  { num: '04', title: 'Configure Pipeline', desc: 'Customize deal stages to match your sales process.' },
  { num: '05', title: 'Connect Email', desc: 'Link Gmail/Outlook for automatic email tracking and syncing.' },
  { num: '06', title: 'Start Selling', desc: 'Create your first deal and let AI Copilot guide you.' },
];

export default function ImplementationGuidePage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <PageContainer>
      <section style={{ marginTop: 64, padding: '80px 48px', background: 'linear-gradient(180deg, #f5f3ff 0%, #fff 100%)' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', background: '#f5f3ff', border: '1px solid #ede9fe', borderRadius: 100, marginBottom: 20 }}>
            <Wrench size={13} color="#7c3aed" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Implementation</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ fontSize: 'clamp(36px,5vw,56px)', fontWeight: 900, color: '#0f172a', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 16 }}>
            Get Started in 10 Minutes
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ fontSize: 18, color: '#475569', lineHeight: 1.7, maxWidth: 640, margin: '0 auto 48px' }}>
            Step-by-step guide to set up Pulse CRM and close your first deal.
          </motion.p>
        </div>
      </section>

      <section style={{ padding: '60px 48px 80px', background: '#fff' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          {STEPS.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              style={{ display: 'flex', gap: 24, alignItems: 'flex-start', marginBottom: 32 }}>
              <div style={{ fontSize: 48, fontWeight: 900, color: '#ede9fe', lineHeight: 1, minWidth: 80 }}>{step.num}</div>
              <div style={{ flex: 1, paddingTop: 8 }}>
                <h3 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 10, letterSpacing: '-0.02em' }}>{step.title}</h3>
                <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.7 }}>{step.desc}</p>
              </div>
              <CheckCircle size={24} color="#7c3aed" style={{ marginTop: 12, flexShrink: 0 }} />
            </motion.div>
          ))}
        </div>
      </section>
    </PageContainer>
  );
}
