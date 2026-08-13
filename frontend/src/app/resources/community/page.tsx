'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { PageContainer } from '@/components/shared/PageTemplates';
import {
  Users, MessageCircle, Lightbulb, Bug, BookOpen,
  ArrowRight, Star,
} from 'lucide-react';

/* ── tiny Discord SVG (not in lucide) ─────────────── */
function DiscordIcon({ size = 20, color = '#5865f2' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.033.055a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
    </svg>
  );
}

/* ── tiny GitHub SVG (not in this lucide version) ─── */
function GithubIcon({ size = 20, color = '#0f172a' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
    </svg>
  );
}

/* ── Animated counter ──────────────────────────────── */
function AnimCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        let start = 0;
        const steps = 50;
        const inc = target / steps;
        const id = setInterval(() => {
          start += inc;
          if (start >= target) { setVal(target); clearInterval(id); }
          else setVal(Math.floor(start));
        }, 30);
      }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);

  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

/* ── Quick action cards data ───────────────────────── */
const ACTIONS = [
  { icon: MessageCircle, label: 'Ask Questions',  desc: 'Get help from the community.',      color: '#2563EB', bg: '#EFF6FF', border: '#DBEAFE' },
  { icon: Lightbulb,     label: 'Share Ideas',    desc: 'Suggest new features.',              color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  { icon: Bug,           label: 'Report Bugs',    desc: 'Help improve Pulse CRM.',            color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  { icon: BookOpen,      label: 'Browse Guides',  desc: 'Learn best practices.',              color: '#059669', bg: '#ecfdf5', border: '#d1fae5' },
];

/* ── Community resources data ──────────────────────── */
const RESOURCES = [
  { icon: GithubIcon,  label: 'GitHub',        desc: 'Source code & issues',     cta: 'Open Repo',      color: '#0f172a', bg: '#f8fafc', border: '#e2e8f0', href: 'https://github.com' },
  { icon: DiscordIcon,label: 'Discord',       desc: 'Join the discussion',       cta: 'Join Discord',   color: '#5865f2', bg: '#eef0ff', border: '#c7d2fe', href: 'https://discord.com' },
  { icon: BookOpen,   label: 'Documentation', desc: 'User guides & tutorials',   cta: 'Read Docs',      color: '#2563EB', bg: '#EFF6FF', border: '#DBEAFE', href: '/resources/documentation' },
];

/* ── Stats data ────────────────────────────────────── */
const STATS = [
  { target: 12000, suffix: '+', label: 'Members' },
  { target: 850,   suffix: '+', label: 'Discussions' },
  { target: 120,   suffix: '+', label: 'Guides' },
  { target: 4.9,   suffix: '★', label: 'Community Rating', isDecimal: true },
];

/* ── Community Illustration ────────────────────────── */
function CommunityIllustration() {
  const card = (label: string, sub: string, icon: React.ReactNode, accent: string, accentBg: string) => (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8ecf0', boxShadow: '0 4px 16px rgba(0,0,0,0.07)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, minWidth: 150 }}>
      <div style={{ height: 36, width: 36, borderRadius: 10, background: accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
      <div>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#111827', margin: 0 }}>{label}</p>
        <p style={{ fontSize: 10.5, color: '#9ca3af', margin: 0 }}>{sub}</p>
      </div>
    </div>
  );

  const arrow = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '0 4px' }}>
      <div style={{ width: 1, height: 18, borderLeft: '2px dashed #BFDBFE' }} />
      <div style={{ width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '7px solid #2563EB' }} />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, userSelect: 'none' }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        {card('You', 'Pulse CRM user', <Users size={17} color="#2563EB" />, '#2563EB', '#EFF6FF')}
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}>{arrow()}</motion.div>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}>
        <div style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1E3A8A 100%)', borderRadius: 16, padding: '16px 24px', boxShadow: '0 12px 32px rgba(37,99,235,0.35)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ height: 38, width: 38, borderRadius: 10, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={19} color="#fff" />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 800, color: '#fff', margin: 0 }}>Community</p>
            <p style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.75)', margin: 0 }}>12K+ members</p>
          </div>
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>{arrow()}</motion.div>
      {/* Three solution cards */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }} style={{ display: 'flex', gap: 10 }}>
        {card('Answers', 'Get help fast', <MessageCircle size={15} color="#2563eb" />, '#2563eb', '#eff6ff')}
        {card('Solutions', 'Best practices', <Star size={15} color="#d97706" />, '#d97706', '#fffbeb')}
      </motion.div>
    </div>
  );
}

/* ── Page ──────────────────────────────────────────── */
export default function CommunityPage() {
  const router = useRouter();

  return (
    <PageContainer>

      {/* ── HERO ────────────────────────────────────── */}
      <section style={{ marginTop: 64, padding: '80px 48px 88px', background: 'linear-gradient(160deg,#EFF6FF 0%,#F8FAFC 55%,#fff 100%)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -120, right: -120, width: 500, height: 500, background: 'radial-gradient(circle,rgba(37,99,235,0.07) 0%,transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -60, width: 400, height: 400, background: 'radial-gradient(circle,rgba(139,92,246,0.05) 0%,transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center', position: 'relative' }}>

          {/* Left */}
          <motion.div initial={{ opacity: 0, x: -28 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
            {/* Badge */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 14px', background: '#EFF6FF', border: '1.5px solid #DBEAFE', borderRadius: 100, marginBottom: 22 }}>
              <Users size={12} color="#2563EB" />
              <span style={{ fontSize: 11, fontWeight: 800, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.09em' }}>Community</span>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
              style={{ fontSize: 'clamp(34px,4.2vw,52px)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em', color: '#0f172a', marginBottom: 18 }}>
              Join the{' '}
              <span style={{ background: 'linear-gradient(135deg,#2563EB 0%,#9333ea 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Pulse CRM
              </span>
              <br />Community
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              style={{ fontSize: 16, color: '#64748b', lineHeight: 1.75, maxWidth: 440, marginBottom: 36 }}>
              Connect with other users, share ideas, report issues, and discover best practices.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <motion.button
                whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}
                onClick={() => router.push('/login')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 26px', background: 'linear-gradient(135deg,#2563EB 0%,#1D4ED8 100%)', color: '#fff', fontSize: 14, fontWeight: 700, borderRadius: 100, border: 'none', cursor: 'pointer', boxShadow: '0 8px 24px rgba(37,99,235,0.38)', fontFamily: 'inherit' }}>
                Join Community <ArrowRight size={15} />
              </motion.button>
              <motion.a
                whileHover={{ scale: 1.04, y: -2 }}
                href="/resources/documentation"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 26px', background: '#fff', color: '#0f172a', fontSize: 14, fontWeight: 700, borderRadius: 100, border: '1.5px solid #e2e8f0', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', textDecoration: 'none', fontFamily: 'inherit' }}>
                View Documentation
              </motion.a>
            </motion.div>
          </motion.div>

          {/* Right — illustration */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.6 }}
            style={{ display: 'flex', justifyContent: 'center' }}>
            <CommunityIllustration />
          </motion.div>
        </div>
      </section>

      {/* ── QUICK ACTIONS ───────────────────────────── */}
      <section style={{ padding: '72px 48px 80px', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ marginBottom: 36, textAlign: 'center' }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', marginBottom: 6 }}>What would you like to do?</h2>
            <p style={{ fontSize: 13.5, color: '#9ca3af' }}>Pick where you want to start.</p>
          </motion.div>

          <div className="community-actions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
            {ACTIONS.map((a, i) => {
              const Icon = a.icon;
              return (
                <ActionCard key={i} item={a} index={i} Icon={Icon} />
              );
            })}
          </div>

          <style>{`
            @media(max-width:900px){.community-actions-grid{grid-template-columns:repeat(2,1fr)!important;}}
            @media(max-width:500px){.community-actions-grid{grid-template-columns:1fr!important;}}
          `}</style>
        </div>
      </section>

      {/* ── COMMUNITY RESOURCES ─────────────────────── */}
      <section style={{ padding: '0 48px 80px', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ marginBottom: 32, textAlign: 'center' }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', marginBottom: 6 }}>Community Resources</h2>
            <p style={{ fontSize: 13.5, color: '#9ca3af' }}>Everything you need in one place.</p>
          </motion.div>

          <div className="community-res-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {RESOURCES.map((r, i) => (
              <ResourceCard key={i} item={r} index={i} />
            ))}
          </div>

          <style>{`
            @media(max-width:720px){.community-res-grid{grid-template-columns:1fr!important;}}
          `}</style>
        </div>
      </section>

      {/* ── COMMUNITY STATS ─────────────────────────── */}
      <section style={{ padding: '0 48px 88px', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ background: 'linear-gradient(135deg,#EFF6FF 0%,#F8FAFC 100%)', borderRadius: 24, border: '1.5px solid #DBEAFE', padding: '40px 48px', boxShadow: '0 4px 24px rgba(37,99,235,0.07)' }}>
            <div className="community-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0 }}>
              {STATS.map((s, i) => (
                <StatCard key={i} stat={s} index={i} isLast={i === STATS.length - 1} />
              ))}
            </div>
            <style>{`
              @media(max-width:720px){.community-stats-grid{grid-template-columns:repeat(2,1fr)!important;}}
              @media(max-width:400px){.community-stats-grid{grid-template-columns:1fr!important;}}
            `}</style>
          </div>
        </div>
      </section>

    </PageContainer>
  );
}

/* ── Sub-components defined after export to avoid hoisting issues ── */

function ActionCard({ item, index, Icon }: { item: typeof ACTIONS[0]; index: number; Icon: React.ElementType }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.32, delay: index * 0.07 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: '#fff', borderRadius: 20, border: `1.5px solid ${hovered ? item.border : '#eaecef'}`, padding: '26px 22px 22px', cursor: 'pointer', transition: 'all 0.2s ease', transform: hovered ? 'translateY(-4px)' : 'translateY(0)', boxShadow: hovered ? `0 14px 36px ${item.color}14` : '0 2px 8px rgba(0,0,0,0.04)' }}
    >
      <div style={{ height: 46, width: 46, borderRadius: 13, background: hovered ? item.color : item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, transition: 'all 0.2s ease', boxShadow: hovered ? `0 6px 18px ${item.color}30` : 'none' }}>
        <Icon size={20} color={hovered ? '#fff' : item.color} strokeWidth={1.8} />
      </div>
      <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 6, letterSpacing: '-0.01em' }}>{item.label}</p>
      <p style={{ fontSize: 12.5, color: '#6b7280', lineHeight: 1.55, marginBottom: 18 }}>{item.desc}</p>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ height: 24, width: 24, borderRadius: '50%', background: hovered ? item.color : 'transparent', border: `1.5px solid ${hovered ? item.color : '#d1d5db'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }}>
          <ArrowRight size={11} color={hovered ? '#fff' : '#9ca3af'} />
        </div>
      </div>
    </motion.div>
  );
}

function ResourceCard({ item, index }: { item: typeof RESOURCES[0]; index: number }) {
  const [hovered, setHovered] = useState(false);
  const IconComp = item.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.32, delay: index * 0.08 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: '#fff', borderRadius: 20, border: `1.5px solid ${hovered ? item.border : '#eaecef'}`, padding: '28px 24px 22px', cursor: 'pointer', transition: 'all 0.2s ease', transform: hovered ? 'translateY(-3px)' : 'translateY(0)', boxShadow: hovered ? `0 12px 32px ${item.color}14` : '0 2px 8px rgba(0,0,0,0.04)' }}
    >
      <div style={{ height: 48, width: 48, borderRadius: 14, background: item.bg, border: `1px solid ${item.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
        <IconComp size={22} color={item.color} />
      </div>
      <p style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 6 }}>{item.label}</p>
      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 22, lineHeight: 1.55 }}>{item.desc}</p>
      <a href={item.href}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: item.color, textDecoration: 'none', padding: '7px 16px', background: item.bg, border: `1px solid ${item.border}`, borderRadius: 100, transition: 'all 0.18s ease' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.8'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}>
        {item.cta} <ArrowRight size={12} />
      </a>
    </motion.div>
  );
}

function StatCard({ stat, index, isLast }: { stat: typeof STATS[0]; index: number; isLast: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.32, delay: index * 0.07 }}
      style={{ textAlign: 'center', padding: '8px 16px', borderRight: isLast ? 'none' : '1px solid #DBEAFE' }}
    >
      <p style={{ fontSize: 'clamp(28px,3.5vw,40px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 4, lineHeight: 1 }}>
        {stat.isDecimal
          ? <span>{stat.target}{stat.suffix}</span>
          : <AnimCounter target={stat.target} suffix={stat.suffix} />
        }
      </p>
      <p style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>{stat.label}</p>
    </motion.div>
  );
}
