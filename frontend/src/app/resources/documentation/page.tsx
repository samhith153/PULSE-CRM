'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PageContainer } from '@/components/shared/PageTemplates';
import { BookOpen, Search, ChevronRight, TrendingUp, Users, FileText, Sparkles, Mail, Shield, Settings, Activity } from 'lucide-react';

const SECTIONS = [
  { icon: Activity, title: 'Getting Started', count: 5, color: '#7c3aed' },
  { icon: Users, title: 'User Management', count: 5, color: '#2563eb' },
  { icon: FileText, title: 'Core CRM Modules', count: 5, color: '#059669' },
  { icon: Sparkles, title: 'AI Copilot', count: 5, color: '#d97706' },
  { icon: Mail, title: 'Email Integration', count: 5, color: '#9333ea' },
  { icon: TrendingUp, title: 'Reports & Analytics', count: 5, color: '#dc2626' },
  { icon: Settings, title: 'Configuration', count: 5, color: '#0891b2' },
  { icon: Shield, title: 'Security', count: 5, color: '#475569' },
];

export default function DocumentationPage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <PageContainer>
      <section style={{ marginTop: 64, padding: '80px 48px', background: 'linear-gradient(180deg, #f5f3ff 0%, #fff 100%)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', background: '#f5f3ff', border: '1px solid #ede9fe', borderRadius: 100, marginBottom: 20 }}>
            <BookOpen size={13} color="#7c3aed" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Documentation</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ fontSize: 'clamp(36px,5vw,56px)', fontWeight: 900, color: '#0f172a', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 16 }}>
            Pulse CRM Docs
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ fontSize: 18, color: '#475569', lineHeight: 1.7, maxWidth: 640, marginBottom: 32 }}>
            Everything you need to set up, configure, and master Pulse CRM.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{ display: 'flex', alignItems: 'center', gap: 0, maxWidth: 520, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '4px 4px 4px 16px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
            <Search size={16} color="#94a3b8" style={{ flexShrink: 0 }} />
            <input readOnly placeholder="Search documentation..." style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15, color: '#0f172a', padding: '10px 12px', fontFamily: 'inherit', background: 'transparent' }} />
            <button style={{ padding: '10px 18px', background: '#7c3aed', color: '#fff', fontSize: 14, fontWeight: 700, borderRadius: 9, border: 'none', cursor: 'pointer' }}>Search</button>
          </motion.div>
        </div>
      </section>

      <section style={{ padding: '60px 48px 80px', background: '#fff' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.08 } }
            }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {SECTIONS.map((sec, i) => {
              const Icon = sec.icon;
              return (
                <motion.div
                  key={i}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  whileHover={{ y: -4, boxShadow: '0 12px 28px rgba(0,0,0,0.08)' }}
                  style={{ padding: 28, background: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'box-shadow 0.3s' }}>
                  <div style={{ height: 44, width: 44, borderRadius: 12, background: `${sec.color}14`, border: `1px solid ${sec.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                    <Icon size={20} color={sec.color} />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>{sec.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: '#64748b' }}>{sec.count} articles</span>
                    <ChevronRight size={16} color={sec.color} />
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>
    </PageContainer>
  );
}
