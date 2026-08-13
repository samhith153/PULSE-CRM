'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PageContainer } from '@/components/shared/PageTemplates';
import {
  BookOpen, Search, ArrowRight,
  Rocket, Code2, Plug, ShieldCheck, Zap, HelpCircle,
  UserPlus, LayoutGrid, Upload, Sparkles,
} from 'lucide-react';

/* ─────────────────────────────────────────────────
   Category data — exactly 6 cards matching reference
───────────────────────────────────────────────── */
const CATEGORIES = [
  {
    icon: Rocket,
    title: 'Getting Started',
    desc: 'Start quickly and set up Pulse CRM',
    color: '#2563EB',
    bg: '#EFF6FF',
  },
  {
    icon: Code2,
    title: 'Core Concepts',
    desc: 'Understand key features and workflows',
    color: '#2563EB',
    bg: '#f0f4ff',
  },
  {
    icon: Plug,
    title: 'Integrations',
    desc: 'Connect with Gmail, APIs and other tools',
    color: '#059669',
    bg: '#ecfdf5',
  },
  {
    icon: ShieldCheck,
    title: 'Security',
    desc: 'Authentication, RBAC and data protection',
    color: '#f97316',
    bg: '#fff7ed',
  },
  {
    icon: Zap,
    title: 'Advanced',
    desc: 'AI scoring, automation and customizations',
    color: '#e11d48',
    bg: '#fff1f2',
  },
  {
    icon: HelpCircle,
    title: 'FAQ',
    desc: 'Find answers to common questions',
    color: '#2563EB',
    bg: '#faf5ff',
  },
];

/* ─────────────────────────────────────────────────
   Quick Start steps — exactly 4 matching reference
───────────────────────────────────────────────── */
const STEPS = [
  {
    num: 1,
    icon: UserPlus,
    title: 'Create Account',
    desc: 'Sign up and verify\nyour email',
  },
  {
    num: 2,
    icon: LayoutGrid,
    title: 'Set up Workspace',
    desc: 'Configure your team\nand preferences',
  },
  {
    num: 3,
    icon: Upload,
    title: 'Import Data',
    desc: 'Import leads, contacts\nand companies',
  },
  {
    num: 4,
    icon: Sparkles,
    title: 'Start Using',
    desc: 'Explore features and\nstart closing deals',
  },
];

/* ─────────────────────────────────────────────────
   Doc illustration (hero right side)
───────────────────────────────────────────────── */
function DocIllustration() {
  return (
    <div style={{ position: 'relative', width: '100%', minHeight: 300 }}>
      {/* Floating purple book badge */}
      <motion.div
        animate={{ y: [-5, 5, -5] }}
        transition={{ duration: 3, repeat: Infinity, ease: [0.43, 0.13, 0.23, 0.96] }}
        style={{
          position: 'absolute', top: -16, right: -8, zIndex: 10,
          width: 60, height: 60, borderRadius: 16,
          background: 'linear-gradient(135deg, #2563EB 0%, #1E3A8A 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 10px 28px rgba(37,99,235,0.45)',
        }}
      >
        <BookOpen size={26} color="#fff" strokeWidth={1.8} />
      </motion.div>

      {/* Browser mockup card */}
      <div style={{
        background: '#fff',
        borderRadius: 18,
        border: '1px solid #e2e8f0',
        boxShadow: '0 16px 56px rgba(0,0,0,0.09)',
        overflow: 'hidden',
      }}>
        {/* Chrome bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '9px 14px',
          borderBottom: '1px solid #f1f5f9',
          background: '#f8fafc',
        }}>
          <div style={{ height: 8, width: 8, borderRadius: '50%', background: '#ff5f57' }} />
          <div style={{ height: 8, width: 8, borderRadius: '50%', background: '#ffbd2e' }} />
          <div style={{ height: 8, width: 8, borderRadius: '50%', background: '#28c941' }} />
          <div style={{
            flex: 1, marginLeft: 8, height: 15, borderRadius: 4,
            background: '#ececec', display: 'flex', alignItems: 'center', paddingLeft: 7,
          }}>
            <span style={{ fontSize: 7.5, color: '#999' }}>docs.pulsecrm.io</span>
          </div>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', height: 210 }}>
          {/* Sidebar */}
          <div style={{
            width: 100, borderRight: '1px solid #f1f5f9',
            padding: '12px 10px', background: '#fafafa',
          }}>
            <div style={{ height: 7, background: '#DBEAFE', borderRadius: 3, marginBottom: 9, width: '75%' }} />
            {[78, 62, 88, 68, 52, 72].map((w, i) => (
              <div key={i} style={{
                height: 6, borderRadius: 3, marginBottom: 7,
                width: `${w}%`,
                background: i === 2 ? '#2563EB' : '#e2e8f0',
              }} />
            ))}
          </div>

          {/* Main */}
          <div style={{ flex: 1, padding: '12px 14px' }}>
            <div style={{ height: 9, background: '#0f172a', borderRadius: 3, width: '55%', marginBottom: 9 }} />
            {[100, 82, 92, 68].map((w, i) => (
              <div key={i} style={{
                height: 5, background: '#e2e8f0', borderRadius: 3,
                width: `${w}%`, marginBottom: 6,
              }} />
            ))}
            {/* Code block */}
            <div style={{
              marginTop: 12, background: '#1e1b4b', borderRadius: 7,
              padding: '9px 10px',
            }}>
              {['#2563EB', '#a5b4fc', '#e2e8f0'].map((c, i) => (
                <div key={i} style={{
                  height: 5, background: c, opacity: 0.75, borderRadius: 3,
                  width: ['68%', '88%', '48%'][i], marginBottom: i < 2 ? 5 : 0,
                }} />
              ))}
            </div>
            {/* Tag chip */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              marginTop: 10, padding: '3px 7px',
              background: '#EFF6FF', border: '1px solid #DBEAFE', borderRadius: 5,
            }}>
              <div style={{ height: 4, width: 4, borderRadius: '50%', background: '#2563EB' }} />
              <div style={{ height: 4, width: 32, background: '#BFDBFE', borderRadius: 3 }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Category Card — matches reference exactly
   White card, icon top-left, title, desc, arrow bottom-right
───────────────────────────────────────────────── */
function CategoryCard({ cat, index }: { cat: typeof CATEGORIES[0]; index: number }) {
  const [hovered, setHovered] = useState(false);
  const Icon = cat.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.32, delay: index * 0.05 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '20px 18px 18px',
        background: '#ffffff',
        borderRadius: 14,
        border: `1px solid ${hovered ? '#e0d9ff' : '#eaecef'}`,
        cursor: 'pointer',
        transition: 'all 0.18s ease',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered
          ? '0 8px 24px rgba(37,99,235,0.10)'
          : '0 1px 4px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 160,
      }}
    >
      {/* Icon */}
      <div style={{
        height: 36, width: 36, borderRadius: 9,
        background: cat.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 13,
        flexShrink: 0,
      }}>
        <Icon size={17} color={cat.color} strokeWidth={1.8} />
      </div>

      {/* Title */}
      <p style={{
        fontSize: 13.5, fontWeight: 700, color: '#111827',
        marginBottom: 5, letterSpacing: '-0.01em', lineHeight: 1.3,
      }}>
        {cat.title}
      </p>

      {/* Description */}
      <p style={{
        fontSize: 12, color: '#6b7280', lineHeight: 1.55,
        flex: 1,
      }}>
        {cat.desc}
      </p>

      {/* Arrow — bottom right */}
      <div style={{
        display: 'flex', justifyContent: 'flex-end',
        marginTop: 14,
      }}>
        <div style={{
          height: 22, width: 22, borderRadius: '50%',
          border: `1.5px solid ${hovered ? '#2563EB' : '#d1d5db'}`,
          background: hovered ? '#2563EB' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.18s ease',
        }}>
          {/* Custom tiny chevron for perfect sizing */}
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M3.5 2L6.5 5L3.5 8"
              stroke={hovered ? '#fff' : '#9ca3af'}
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────
   Quick Start Step — matches reference exactly
   Purple filled circle with number (left) +
   light purple circle with icon (right) +
   dashed line connector between steps
───────────────────────────────────────────────── */
function QuickStep({
  step, isLast,
}: {
  step: typeof STEPS[0];
  isLast: boolean;
}) {
  const Icon = step.icon;

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      position: 'relative',
    }}>
      {/* Dashed connector to next step */}
      {!isLast && (
        <div style={{
          position: 'absolute',
          /* centre on the icon row (top ~26px) */
          top: 26,
          /* start from right edge of this step's icon area */
          left: '58%',
          width: '84%',
          height: 0,
          borderTop: '2px dashed #BFDBFE',
          zIndex: 0,
        }} />
      )}

      {/* Number circle + Icon circle row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        marginBottom: 14, position: 'relative', zIndex: 1,
      }}>
        {/* Filled purple number circle */}
        <div style={{
          height: 28, width: 28, borderRadius: '50%',
          background: '#2563EB',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 800, color: '#fff',
          boxShadow: '0 3px 10px rgba(37,99,235,0.38)',
          flexShrink: 0,
        }}>
          {step.num}
        </div>

        {/* Light purple icon circle */}
        <div style={{
          height: 48, width: 48, borderRadius: '50%',
          background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
          border: '1.5px solid #ddd6fe',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 3px 12px rgba(37,99,235,0.12)',
          flexShrink: 0,
        }}>
          <Icon size={20} color="#2563EB" strokeWidth={1.7} />
        </div>
      </div>

      {/* Title */}
      <p style={{
        fontSize: 13, fontWeight: 700, color: '#111827',
        textAlign: 'center', marginBottom: 4, letterSpacing: '-0.01em',
        whiteSpace: 'nowrap',
      }}>
        {step.title}
      </p>

      {/* Description — preserve newlines */}
      <p style={{
        fontSize: 11.5, color: '#9ca3af', textAlign: 'center',
        lineHeight: 1.55, whiteSpace: 'pre-line',
      }}>
        {step.desc}
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Page
───────────────────────────────────────────────── */
export default function DocumentationPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    if (searchQuery.trim()) {
      alert(`Searching for: "${searchQuery}"`);
    } else {
      alert('Please enter a search term');
    }
  };

  return (
    <PageContainer>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section style={{
        marginTop: 64,
        padding: '80px 48px 90px',
        background: 'linear-gradient(160deg, #EFF6FF 0%, #F8FAFC 55%, #fff 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -120, right: -120, width: 500, height: 500,
          background: 'radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -80, left: -80, width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        <div style={{
          maxWidth: 1200, margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 64,
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
                background: '#EFF6FF',
                border: '1.5px solid #DBEAFE',
                borderRadius: 100,
                marginBottom: 22,
              }}
            >
              <BookOpen size={12} color="#2563EB" />
              <span style={{
                fontSize: 11, fontWeight: 800, color: '#2563EB',
                textTransform: 'uppercase', letterSpacing: '0.09em',
              }}>
                Documentation
              </span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              style={{
                fontSize: 'clamp(36px, 4.5vw, 54px)',
                fontWeight: 900, lineHeight: 1.1,
                letterSpacing: '-0.03em', color: '#0f172a',
                marginBottom: 18,
              }}
            >
              Everything you need to{' '}
              <br />build with{' '}
              <span style={{
                background: 'linear-gradient(135deg, #2563EB 0%, #9333ea 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Pulse CRM
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                fontSize: 16, color: '#64748b',
                lineHeight: 1.75, maxWidth: 480, marginBottom: 36,
              }}
            >
              Clear guides, references, and tutorials to help you set up,
              integrate, and scale with confidence.
            </motion.p>

            {/* Search bar */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              style={{
                display: 'flex', alignItems: 'center',
                maxWidth: 500,
                background: '#fff',
                border: '1.5px solid #e2e8f0',
                borderRadius: 14,
                padding: '6px 6px 6px 18px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
              }}
            >
              <Search size={15} color="#94a3b8" style={{ flexShrink: 0 }} />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Search documentation..."
                style={{
                  flex: 1, border: 'none', outline: 'none',
                  fontSize: 14, color: '#0f172a',
                  padding: '10px 14px',
                  fontFamily: 'inherit',
                  background: 'transparent',
                }}
              />
              <span style={{
                fontSize: 11, color: '#94a3b8', fontWeight: 500,
                padding: '2px 8px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 6,
                marginRight: 8,
              }}>
                ⌘ K
              </span>
              <button
                onClick={handleSearch}
                style={{
                  padding: '10px 22px',
                  background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                  color: '#fff', fontSize: 14, fontWeight: 700,
                  borderRadius: 10, border: 'none', cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
                  transition: 'all 0.18s ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.03)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
              >
                Search
              </button>
            </motion.div>
          </motion.div>

          {/* Right — illustration */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.7 }}
          >
            <DocIllustration />
          </motion.div>
        </div>
      </section>

      {/* ── BROWSE BY CATEGORY ───────────────────────────────────── */}
      <section style={{
        padding: '56px 48px 64px',
        background: '#f8f9fb',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>

          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            style={{ marginBottom: 28 }}
          >
            <h2 style={{
              fontSize: 20, fontWeight: 800, color: '#111827',
              letterSpacing: '-0.02em', marginBottom: 4,
            }}>
              Browse by category
            </h2>
            <p style={{ fontSize: 13, color: '#9ca3af' }}>
              Everything organized for you — pick a topic and dive in.
            </p>
          </motion.div>

          {/* 6-column card row */}
          <div
            className="doc-cat-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: 12,
            }}
          >
            {CATEGORIES.map((cat, i) => (
              <CategoryCard key={i} cat={cat} index={i} />
            ))}
          </div>

          <style>{`
            @media (max-width: 1100px) { .doc-cat-grid { grid-template-columns: repeat(3, 1fr) !important; } }
            @media (max-width: 720px)  { .doc-cat-grid { grid-template-columns: repeat(2, 1fr) !important; } }
            @media (max-width: 460px)  { .doc-cat-grid { grid-template-columns: 1fr !important; } }
          `}</style>
        </div>
      </section>

      {/* ── QUICK START ──────────────────────────────────────────── */}
      <section style={{
        padding: '0 48px 72px',
        background: '#f8f9fb',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            style={{
              background: '#fff',
              borderRadius: 20,
              border: '1px solid #eaecef',
              padding: '36px 40px 40px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
            }}
          >
            {/* Header row */}
            <div style={{
              display: 'flex', alignItems: 'flex-start',
              justifyContent: 'space-between', flexWrap: 'wrap',
              gap: 12, marginBottom: 40,
            }}>
              <div>
                <h2 style={{
                  fontSize: 20, fontWeight: 800, color: '#111827',
                  letterSpacing: '-0.02em', marginBottom: 4,
                }}>
                  Quick Start
                </h2>
                <p style={{ fontSize: 13, color: '#9ca3af' }}>
                  Get Pulse CRM up and running in under 5 minutes.
                </p>
              </div>
              <a
                href="#"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  fontSize: 13, fontWeight: 700, color: '#2563EB',
                  textDecoration: 'none',
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.75'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
              >
                View Quick Start Guide <ArrowRight size={13} />
              </a>
            </div>

            {/* 4-step timeline */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 0,
            }}>
              {STEPS.map((step, i) => (
                <QuickStep key={i} step={step} isLast={i === STEPS.length - 1} />
              ))}
            </div>
          </motion.div>
        </div>
      </section>

    </PageContainer>
  );
}
