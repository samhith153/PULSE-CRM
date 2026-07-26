'use client';
import React, { useState, createContext, useContext } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/navigation/Navbar';
import AuthModal from '@/components/shared/AuthModal';
import { ArrowRight, CheckCircle } from 'lucide-react';

/* ─── Modal Context ──────────────────────────────────── */
type ModalMode = 'signin' | 'signup';
const ModalContext = createContext<{ openModal: (mode?: ModalMode) => void } | null>(null);

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    return { openModal: () => {} };
  }
  return context;
}

/* ─── Page Container ──────────────────────────────── */
export function PageContainer({ children }: { children: React.ReactNode }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('signup');

  return (
    <ModalContext.Provider value={{ openModal: (mode) => { setModalMode(mode || 'signin'); setModalOpen(true); } }}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{ fontFamily: "'Inter',system-ui,sans-serif", background: '#fff', minHeight: '100vh', color: '#0f172a' }}>
        <Navbar onOpenModal={() => { setModalMode('signin'); setModalOpen(true); }} onOpenSignUp={() => { setModalMode('signup'); setModalOpen(true); }} />
        <AuthModal key={modalMode} defaultMode={modalMode} isOpen={modalOpen} onClose={() => setModalOpen(false)} />
        {children}
        <footer style={{ padding: '36px 48px', background: '#0f172a', color: '#475569', textAlign: 'center' }}>
          <p style={{ fontSize: 14 }}>© 2026 Pulse CRM Inc. All rights reserved. Powered by <span style={{ color: '#94a3b8', fontWeight: 600 }}>Kalnet</span>.</p>
        </footer>
      </motion.div>
    </ModalContext.Provider>
  );
}

/* ─── Hero with Screenshot ────────────────────────── */
export function HeroWithScreenshot({
  badge,
  badgeIcon: BadgeIcon,
  title,
  description,
  screenshot,
  onCTA,
}: {
  badge: string;
  badgeIcon?: React.ElementType;
  title: React.ReactNode;
  description: string;
  screenshot: React.ReactNode;
  onCTA?: () => void;
}) {
  const { openModal } = useModal();
  const handleCTA = onCTA || openModal;

  return (
    <section style={{ marginTop: 64, padding: '80px 48px', background: 'linear-gradient(180deg, #f5f3ff 0%, #fff 100%)', position: 'relative', overflow: 'hidden' }}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.1 }}
        transition={{ duration: 1 }}
        style={{ position: 'absolute', top: -100, right: -100, width: 600, height: 600, background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center', position: 'relative' }}>
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}>
          {BadgeIcon && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', background: '#f5f3ff', border: '1px solid #ede9fe', borderRadius: 100, marginBottom: 20 }}>
              <BadgeIcon size={13} color="#7c3aed" />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{badge}</span>
            </div>
          )}
          <h1 style={{ fontSize: 'clamp(36px,5vw,56px)', fontWeight: 900, color: '#0f172a', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 20 }}>{title}</h1>
          <p style={{ fontSize: 18, color: '#475569', lineHeight: 1.7, marginBottom: 32 }}>{description}</p>
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCTA}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', background: '#7c3aed', color: '#fff', fontSize: 15, fontWeight: 700, borderRadius: 100, border: 'none', cursor: 'pointer', boxShadow: '0 8px 24px rgba(124,58,237,0.4)' }}>
            Start Free Trial <ArrowRight size={16} />
          </motion.button>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          whileHover={{ y: -8 }}
          style={{ background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.12)' }}>
          {screenshot}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Feature Cards Grid ──────────────────────────── */
export function FeatureCards({ features }: { features: Array<{ icon: React.ElementType; title: string; description: string }> }) {
  return (
    <section style={{ padding: '80px 48px', background: '#fff' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1 } }
          }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={i}
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  visible: { opacity: 1, y: 0 }
                }}
                whileHover={{ y: -8, boxShadow: '0 12px 32px rgba(124, 58, 237, 0.15)' }}
                style={{ padding: 32, background: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'box-shadow 0.3s' }}>
                <motion.div
                  whileHover={{ rotate: 10, scale: 1.1 }}
                  style={{ height: 48, width: 48, borderRadius: 12, background: '#f5f3ff', border: '1px solid #ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Icon size={22} color="#7c3aed" />
                </motion.div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>{feature.title}</h3>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>{feature.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Statistics Section ──────────────────────────── */
export function Statistics({ stats }: { stats: Array<{ value: string; label: string; description: string }> }) {
  return (
    <section style={{ padding: '80px 48px', background: 'linear-gradient(135deg, #f5f3ff 0%, #fff 100%)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.15 } }
          }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              variants={{
                hidden: { opacity: 0, scale: 0.8 },
                visible: { opacity: 1, scale: 1 }
              }}
              whileHover={{ y: -8 }}
              style={{ padding: 40, background: '#fff', borderRadius: 20, border: '1px solid #ede9fe', textAlign: 'center', boxShadow: '0 4px 16px rgba(124,58,237,0.08)' }}>
              <div style={{ fontSize: 48, fontWeight: 900, color: '#0f172a', marginBottom: 12, letterSpacing: '-0.03em' }}>{stat.value}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>{stat.label}</div>
              <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{stat.description}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── CTA Section ──────────────────────────────────── */
export function CTASection({ title, description, onCTA }: { title: string; description: string; onCTA?: () => void }) {
  const { openModal } = useModal();
  const handleCTA = onCTA || openModal;

  return (
    <section style={{ padding: '100px 48px', background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 0.1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        style={{ position: 'absolute', top: -100, left: -100, width: 600, height: 600, background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ maxWidth: 700, margin: '0 auto', position: 'relative' }}>
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ fontSize: 44, fontWeight: 900, color: '#fff', marginBottom: 16, lineHeight: 1.15, letterSpacing: '-0.03em' }}>{title}</motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{ fontSize: 18, color: 'rgba(255,255,255,.9)', marginBottom: 36, lineHeight: 1.6 }}>{description}</motion.p>
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCTA}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '16px 32px', background: '#fff', color: '#7c3aed', fontSize: 16, fontWeight: 700, borderRadius: 100, border: 'none', cursor: 'pointer', boxShadow: '0 12px 32px rgba(0,0,0,.15)' }}>
          Start Free Trial <ArrowRight size={18} />
        </motion.button>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 28, flexWrap: 'wrap' }}>
          {['14-day free trial', 'No credit card required', '2-minute setup'].map(t => (
            <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,.85)' }}>
              <CheckCircle size={14} color="rgba(255,255,255,.9)" />{t}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
