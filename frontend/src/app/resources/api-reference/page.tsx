'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { PageContainer } from '@/components/shared/PageTemplates';
import {
  Code2, Users, User, IndianRupee,
  CalendarCheck, Sparkles, Building2, Copy, Check,
  Activity,
} from 'lucide-react';
import { useState } from 'react';

/* ─────────────────────────────────────────────────
   "What you can do" feature cards
───────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: Users,
    title: 'Manage Leads',
    desc: 'Create, update and track leads.',
    color: '#7c3aed',
    bg: '#f5f3ff',
  },
  {
    icon: Building2,
    title: 'Companies',
    desc: 'Manage customer companies.',
    color: '#7c3aed',
    bg: '#f5f3ff',
  },
  {
    icon: User,
    title: 'Contacts',
    desc: 'Store and organize contacts.',
    color: '#7c3aed',
    bg: '#f5f3ff',
  },
  {
    icon: IndianRupee,
    title: 'Deals',
    desc: 'Track sales opportunities.',
    color: '#7c3aed',
    bg: '#f5f3ff',
  },
  {
    icon: CalendarCheck,
    title: 'Activities',
    desc: 'Manage follow-ups and meetings.',
    color: '#7c3aed',
    bg: '#f5f3ff',
  },
  {
    icon: Sparkles,
    title: 'AI Scoring',
    desc: 'Get AI lead scores and insights.',
    color: '#7c3aed',
    bg: '#f5f3ff',
  },
];

/* ─────────────────────────────────────────────────
   Quick Start steps
───────────────────────────────────────────────── */
const QUICK_STEPS = [
  {
    num: 1,
    title: 'Generate API Token',
    desc: 'Go to Settings → API & Integrations and generate your API token.',
    code: 'pk_live_************************',
  },
  {
    num: 2,
    title: 'Copy Base URL',
    desc: 'All API requests should be made to the base URL below.',
    code: 'https://api.pulsecrm.com',
  },
  {
    num: 3,
    title: 'Make Your First Request',
    desc: 'Start with a simple request to check your connection.',
    code: 'GET /api/v1/health',
  },
];

/* ─────────────────────────────────────────────────
   API Flow Illustration (hero right side)
───────────────────────────────────────────────── */
function ApiIllustration() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 0,
      width: '100%',
      padding: '8px 0',
    }}>

      {/* Your App card */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        style={{
          width: 110, minHeight: 110,
          background: '#fff',
          borderRadius: 16,
          border: '1px solid #e8ecf0',
          boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 10, padding: 16,
        }}
      >
        <div style={{
          height: 44, width: 44, borderRadius: 12,
          background: '#f5f3ff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Code2 size={22} color="#7c3aed" strokeWidth={1.8} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Your App</span>
      </motion.div>

      {/* Arrow: Request */}
      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ delay: 0.55, duration: 0.4 }}
        style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 2,
          width: 80, flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 10, fontWeight: 600, color: '#7c3aed', letterSpacing: '0.04em' }}>Request</span>
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', position: 'relative' }}>
          {/* dashed line */}
          <div style={{
            flex: 1, height: 1,
            borderTop: '2px dashed #c4b5fd',
          }} />
          {/* arrowhead */}
          <div style={{
            width: 0, height: 0,
            borderTop: '5px solid transparent',
            borderBottom: '5px solid transparent',
            borderLeft: '7px solid #7c3aed',
          }} />
        </div>
      </motion.div>

      {/* Pulse CRM API — centre hero card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        style={{
          width: 110, minHeight: 130,
          background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
          borderRadius: 20,
          boxShadow: '0 12px 36px rgba(124,58,237,0.45)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 10, padding: 16,
          zIndex: 2,
        }}
      >
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: [0.43, 0.13, 0.23, 0.96] }}
        >
          <Activity size={32} color="#fff" strokeWidth={2} />
        </motion.div>
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: 11.5, fontWeight: 800, color: '#fff', display: 'block', lineHeight: 1.3 }}>
            Pulse <span style={{ color: '#c4b5fd' }}>CRM</span>
          </span>
          <span style={{ fontSize: 11.5, fontWeight: 800, color: '#fff', display: 'block' }}>API</span>
        </div>
      </motion.div>

      {/* Arrow: Response */}
      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ delay: 0.55, duration: 0.4 }}
        style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 2,
          width: 80, flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 10, fontWeight: 600, color: '#10b981', letterSpacing: '0.04em' }}>Response</span>
        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          {/* arrowhead pointing left-to-right toward response card */}
          <div style={{
            width: 0, height: 0,
            borderTop: '5px solid transparent',
            borderBottom: '5px solid transparent',
            borderLeft: '7px solid #10b981',
          }} />
          <div style={{
            flex: 1, height: 1,
            borderTop: '2px dashed #6ee7b7',
          }} />
        </div>
      </motion.div>

      {/* Response card */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        style={{
          width: 110, minHeight: 110,
          background: '#fff',
          borderRadius: 16,
          border: '1px solid #e8ecf0',
          boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 10, padding: 16,
        }}
      >
        <div style={{
          height: 44, width: 44, borderRadius: 12,
          background: '#ecfdf5',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, fontWeight: 700, color: '#10b981',
          fontFamily: 'monospace',
        }}>
          {'{ }'}
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Response</span>
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Feature Card
───────────────────────────────────────────────── */
function FeatureCard({ feat, index }: { feat: typeof FEATURES[0]; index: number }) {
  const [hovered, setHovered] = useState(false);
  const Icon = feat.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.32, delay: index * 0.06 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '22px 18px 20px',
        background: '#ffffff',
        borderRadius: 16,
        border: `1px solid ${hovered ? '#ddd6fe' : '#eaecef'}`,
        cursor: 'pointer',
        transition: 'all 0.18s ease',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hovered
          ? '0 10px 28px rgba(124,58,237,0.10)'
          : '0 1px 4px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{
        height: 40, width: 40, borderRadius: 10,
        background: feat.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 14,
      }}>
        <Icon size={18} color={feat.color} strokeWidth={1.8} />
      </div>
      <p style={{
        fontSize: 13.5, fontWeight: 700, color: '#111827',
        marginBottom: 5, letterSpacing: '-0.01em',
      }}>
        {feat.title}
      </p>
      <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.55 }}>
        {feat.desc}
      </p>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────
   Copy button (inline)
───────────────────────────────────────────────── */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button
      onClick={handle}
      title="Copy"
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        padding: '2px 4px', display: 'flex', alignItems: 'center',
        color: copied ? '#10b981' : '#9ca3af',
        transition: 'color 0.15s',
        flexShrink: 0,
      }}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}

/* ─────────────────────────────────────────────────
   Quick Start Card
───────────────────────────────────────────────── */
function QuickCard({
  step, index, isLast,
}: {
  step: typeof QUICK_STEPS[0];
  index: number;
  isLast: boolean;
}) {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'stretch', gap: 0, minWidth: 0 }}>
      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.38, delay: index * 0.1 }}
        style={{
          flex: 1,
          background: '#fff',
          borderRadius: 16,
          border: '1px solid #eaecef',
          padding: '24px 22px 20px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          minWidth: 0,
        }}
      >
        {/* Step badge + title row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            height: 28, width: 28, borderRadius: '50%',
            background: '#7c3aed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 800, color: '#fff',
            boxShadow: '0 3px 10px rgba(124,58,237,0.38)',
            flexShrink: 0,
          }}>
            {step.num}
          </div>
          <p style={{
            fontSize: 14, fontWeight: 700, color: '#111827',
            letterSpacing: '-0.01em', margin: 0,
          }}>
            {step.title}
          </p>
        </div>

        {/* Description */}
        <p style={{ fontSize: 12.5, color: '#6b7280', lineHeight: 1.6, margin: 0 }}>
          {step.desc}
        </p>

        {/* Code field */}
        <div style={{
          display: 'flex', alignItems: 'center',
          background: '#f8f9fb',
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          padding: '8px 12px',
          marginTop: 4,
          gap: 8,
          minWidth: 0,
        }}>
          <span style={{
            fontSize: 12, fontFamily: 'monospace', color: '#374151',
            flex: 1, overflow: 'hidden', textOverflow: 'ellipsis',
            whiteSpace: 'nowrap', minWidth: 0,
          }}>
            {step.code}
          </span>
          <CopyButton text={step.code} />
        </div>
      </motion.div>

      {/* Dashed arrow connector */}
      {!isLast && (
        <div style={{
          display: 'flex', alignItems: 'center',
          width: 52, flexShrink: 0, paddingBottom: 20,
        }}>
          <div style={{ flex: 1, borderTop: '2px dashed #c4b5fd' }} />
          <div style={{
            width: 0, height: 0,
            borderTop: '5px solid transparent',
            borderBottom: '5px solid transparent',
            borderLeft: '7px solid #7c3aed',
          }} />
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Page
───────────────────────────────────────────────── */
export default function ApiReferencePage() {
  return (
    <PageContainer>

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section style={{
        marginTop: 64,
        padding: '72px 48px 80px',
        background: 'linear-gradient(160deg, #f5f3ff 0%, #faf9ff 60%, #fff 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Bg blobs */}
        <div style={{
          position: 'absolute', top: -100, right: -100, width: 480, height: 480,
          background: 'radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -60, left: -60, width: 360, height: 360,
          background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        <div style={{
          maxWidth: 1200, margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 56,
          alignItems: 'center',
          position: 'relative',
        }}>

          {/* Left */}
          <motion.div
            initial={{ opacity: 0, x: -28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '5px 14px',
                background: '#f5f3ff',
                border: '1.5px solid #ede9fe',
                borderRadius: 100,
                marginBottom: 22,
              }}
            >
              <Code2 size={11} color="#7c3aed" />
              <span style={{
                fontSize: 11, fontWeight: 800, color: '#7c3aed',
                textTransform: 'uppercase', letterSpacing: '0.09em',
              }}>
                API Reference
              </span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              style={{
                fontSize: 'clamp(34px, 4.2vw, 52px)',
                fontWeight: 900, lineHeight: 1.1,
                letterSpacing: '-0.03em', color: '#0f172a',
                marginBottom: 18,
              }}
            >
              Build with{' '}
              <span style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Pulse CRM
              </span>{' '}
              APIs
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                fontSize: 16, color: '#64748b',
                lineHeight: 1.75, maxWidth: 460,
              }}
            >
              Easily integrate, automate and extend Pulse CRM
              <br />using our powerful REST APIs.
            </motion.p>
          </motion.div>

          {/* Right — API flow illustration */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '20px 0',
            }}
          >
            <ApiIllustration />
          </motion.div>
        </div>
      </section>

      {/* ── WHAT YOU CAN DO ───────────────────────────────────────── */}
      <section style={{
        padding: '56px 48px 64px',
        background: '#f8f9fb',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            style={{ marginBottom: 28 }}
          >
            <h2 style={{
              fontSize: 20, fontWeight: 800, color: '#111827',
              letterSpacing: '-0.02em', marginBottom: 0,
            }}>
              What you can do
            </h2>
          </motion.div>

          {/* 6-column grid */}
          <div
            className="api-feat-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: 12,
            }}
          >
            {FEATURES.map((feat, i) => (
              <FeatureCard key={i} feat={feat} index={i} />
            ))}
          </div>

          <style>{`
            @media (max-width: 1100px) { .api-feat-grid { grid-template-columns: repeat(3, 1fr) !important; } }
            @media (max-width: 720px)  { .api-feat-grid { grid-template-columns: repeat(2, 1fr) !important; } }
            @media (max-width: 460px)  { .api-feat-grid { grid-template-columns: 1fr !important; } }
          `}</style>
        </div>
      </section>

      {/* ── QUICK START ───────────────────────────────────────────── */}
      <section style={{
        padding: '0 48px 72px',
        background: '#f8f9fb',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            style={{ marginBottom: 24 }}
          >
            <h2 style={{
              fontSize: 20, fontWeight: 800, color: '#111827',
              letterSpacing: '-0.02em', marginBottom: 4,
            }}>
              Quick Start
            </h2>
            <p style={{ fontSize: 13, color: '#9ca3af' }}>
              Get up and running in 3 simple steps.
            </p>
          </motion.div>

          {/* 3 cards with dashed arrow connectors */}
          <div
            className="api-qs-grid"
            style={{
              display: 'flex',
              alignItems: 'stretch',
              gap: 0,
            }}
          >
            {QUICK_STEPS.map((step, i) => (
              <QuickCard
                key={i}
                step={step}
                index={i}
                isLast={i === QUICK_STEPS.length - 1}
              />
            ))}
          </div>

          <style>{`
            @media (max-width: 780px) {
              .api-qs-grid { flex-direction: column !important; }
              .api-qs-grid > div { width: 100% !important; }
            }
          `}</style>
        </div>
      </section>

    </PageContainer>
  );
}
