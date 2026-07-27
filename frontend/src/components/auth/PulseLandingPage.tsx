'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, ArrowRight, CheckCircle2, ChevronRight,
  Loader2, Mail, Sparkles, Users, Zap, Award, Shield,
  BarChart2, RefreshCw, Headphones, TrendingUp, Settings,
  X, LayoutDashboard, Star, Filter, Trophy,
  Target, Lock
} from 'lucide-react';
import Navbar from '@/components/navigation/Navbar';
import AuthModal from '@/components/shared/AuthModal';

interface PulseLandingPageProps {
  onLogin: (role: 'representative' | 'manager' | 'admin') => void;
}

const C = {
  violet: '#7c3aed',
  violetDark: '#6d28d9',
  violetLight: '#ede9fe',
  violetLighter: '#f5f3ff',
  white: '#ffffff',
  black: '#0f172a',
  textGray: '#475569',
  textMuted: '#94a3b8',
  border: '#e2e8f0',
  sectionAlt: '#f8fafc',
  emerald: '#059669',
  blue: '#2563eb',
  orange: '#ea580c',
  darkBg: '#0f172a',
  darkBorder: 'rgba(255,255,255,0.08)',
  darkText: 'rgba(255,255,255,0.6)',
};

type Role = 'representative' | 'manager' | 'admin';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

export default function PulseLandingPage({ onLogin }: PulseLandingPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newsEmail, setNewsEmail] = useState('');
  const openSignUp = () => setIsModalOpen(true);
  const openSignIn = () => setIsModalOpen(true);
  const [orbitAngle, setOrbitAngle] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [activeOrbitNode, setActiveOrbitNode] = useState<string | null>(null);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const [statCounts, setStatCounts] = useState<Record<string, number>>({
    'users': 4,
    'tables': 11,
    'permissions': 33,
    'tests': 89
  });
  const [hasAnimated, setHasAnimated] = useState(false);

  // Orbit rotation animation
  useEffect(() => {
    const t = setInterval(() => setOrbitAngle(a => (a + 0.25) % 360), 50);
    return () => clearInterval(t);
  }, []);

  // Scroll-reveal observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = (entry.target as HTMLElement).dataset.reveal;
          if (id) {
            setVisibleSections(prev => new Set([...prev, id]));
            // Trigger count-up animation when stats section is visible
            if (id === 'stats' && !hasAnimated) {
              setHasAnimated(true);
              // Reset counts to 0 first
              setStatCounts({ users: 0, tables: 0, permissions: 0, tests: 0 });
              
              // Animate each stat with different durations
              const animateCount = (key: string, target: number, duration: number) => {
                const steps = 60;
                const increment = target / steps;
                let current = 0;
                const timer = setInterval(() => {
                  current += increment;
                  if (current >= target) {
                    setStatCounts(prev => ({ ...prev, [key]: target }));
                    clearInterval(timer);
                  } else {
                    setStatCounts(prev => ({ ...prev, [key]: Math.floor(current) }));
                  }
                }, duration / steps);
              };
              
              setTimeout(() => animateCount('users', 4, 1000), 200);
              setTimeout(() => animateCount('tables', 11, 1200), 300);
              setTimeout(() => animateCount('permissions', 33, 1400), 400);
              setTimeout(() => animateCount('tests', 89, 1600), 500);
            }
          }
        }
      }),
      { threshold: 0.1 }
    );
    document.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [hasAnimated]);

  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newsEmail)) {
      addToast('Please enter a valid email address.', 'error');
      return;
    }
    addToast("You've been subscribed! Welcome to Pulse updates.", 'success');
    setNewsEmail('');
  };

  const stats = [
    { label: '4 Users Seeded', value: 4, key: 'users', sub: 'Admin, Manager, 2 Sales Reps', icon: Users },
    { label: '11 Tables', value: 11, key: 'tables', sub: 'Full relational schema with FK constraints', icon: Award },
    { label: '33 Permissions', value: 33, key: 'permissions', sub: 'Across all CRM resources', icon: Sparkles },
    { label: '89 Tests', value: 89, key: 'tests', sub: 'All passing — pytest suite', icon: Zap },
  ];

  const orbitNodes = [
    { label: 'Gmail Sync',  icon: Mail,         color: '#7c3aed', description: 'Connect Gmail via OAuth2. Emails auto-sync per user, grouped into threads, and linked to leads and deals with inbound/outbound tracking.' },
    { label: 'AI Scoring',  icon: Sparkles,     color: '#7c3aed', description: 'Every lead gets a 0–100 score from our transparent rule-based engine. Fit (60%) + Engagement (40%) → Critical / High / Medium / Low tier.' },
    { label: 'Analytics',   icon: BarChart2,    color: '#2563eb', description: 'Role-scoped live dashboard at /api/v1/dashboard — leads by status, pipeline value, deal stages, and activity feed.' },
    { label: 'Pipeline',    icon: Filter,       color: '#16a34a', description: 'FSM deal stages: New → Contacted → Qualified → Proposal Sent → Negotiation → Won / Lost. One-click stage transitions.' },
    { label: 'Next Action', icon: Trophy,       color: '#ea580c', description: 'Rule-based recommendation engine suggests: Send follow-up, Schedule demo, Send proposal, Escalate to manager — based on score + urgency + reply status.' },
    { label: 'Contacts',    icon: Users,        color: '#0d9488', description: 'Centralise companies, contacts, and leads. Email unique per org, linked to companies, with full validation and soft-delete.' },
  ];

  const features = [
    { icon: LayoutDashboard, title: 'Live Dashboard',        desc: 'Role-scoped KPIs at /api/v1/dashboard — leads by status, pipeline value, open deals, win rate, and live activity feed.', bg: C.violetLighter, fg: C.violet },
    { icon: Sparkles,        title: 'AI Lead Scoring',       desc: 'Transparent rule-based engine scores leads 0–100 (Fit 60% + Engagement 40%) with human-readable reasons. No black box.', bg: '#eff6ff', fg: C.blue },
    { icon: TrendingUp,      title: 'FSM Deal Pipeline',     desc: 'Deals follow a strict FSM: New → Contacted → Qualified → Proposal Sent → Negotiation → Won / Lost. One-click transitions.', bg: '#ecfdf5', fg: C.emerald },
    { icon: Mail,            title: 'Gmail Intelligence',    desc: 'OAuth2 Gmail sync per user. Threads stored, linked to leads/deals. Groq/Llama 3.3 summarises each thread and detects intent.', bg: '#fff7ed', fg: C.orange },
    { icon: BarChart2,       title: 'Revenue Analytics',     desc: 'Rep leaderboards, forecast views, and pipeline overviews — all RBAC-scoped. Admins see everything; reps see their own data.', bg: '#fdf2f8', fg: '#9333ea' },
    { icon: Shield,          title: 'Enterprise Security',   desc: '3 roles, 33 granular permissions in resource:action format. JWT access + refresh tokens, bcrypt passwords, soft-delete everywhere.', bg: '#f0fdf4', fg: '#16a34a' },
  ];

  const steps = [
    { num: '01', icon: Zap, title: 'Connect', desc: 'Import your contacts, companies, and leads via API or CSV. Gmail syncs automatically in minutes.' },
    { num: '02', icon: Sparkles, title: 'AI Works for You', desc: 'Pulse scores every lead 0-100, drafts follow-up emails, and surfaces your hottest deals using GPT-4o.' },
    { num: '03', icon: TrendingUp, title: 'Close', desc: 'Move deals through FSM pipeline stages with one click. Managers see full activity timelines and forecasts.' },
  ];

  const testimonials = [
    { initials: 'MC', name: 'Marcus Chen', role: 'VP Sales, TechCorp', quote: "The FSM pipeline is exactly what we needed. Every deal has a clear stage and the AI score tells us instantly which ones to prioritise this week.", color: C.violet },
    { initials: 'SR', name: 'Sarah Reynolds', role: 'CTO, Sparta Creative', quote: 'The FastAPI backend is clean and well-structured. We had our first integration running against the Swagger UI in under an hour.', color: C.blue },
    { initials: 'AP', name: 'Anita Patel', role: 'Head of RevOps, Acme Systems', quote: 'With 33 resource-level permissions and RBAC, every rep sees only their own pipeline while managers get the full picture. Our compliance team is happy.', color: C.emerald },
  ];

  const trustBadges = [
    { icon: Lock,       title: 'JWT + RBAC',           desc: 'Access & refresh tokens, bcrypt, 33 permissions' },
    { icon: RefreshCw,  title: 'REST API Ready',        desc: '40+ endpoints, Swagger UI at /docs' },
    { icon: Headphones, title: 'Async FastAPI',         desc: 'SQLAlchemy 2.0 async + PostgreSQL' },
    { icon: Sparkles,   title: 'Groq/Llama 3.3',       desc: 'LLM email summaries + intent scoring' },
  ];

  const footerLinks: Record<string, string[]> = {
    Product: ['Dashboard', 'AI Scoring', 'Pipeline', 'Gmail Sync', 'Analytics', 'Security & RBAC'],
    Company: ['About', 'Careers', 'Blog', 'Contact'],
    Resources: ['API Docs (/docs)', 'ReDoc (/redoc)', 'Implementation Guide', 'Changelog'],
  };

  return (
    <div style={{ display: 'block', fontFamily: "'Inter', 'Geist', system-ui, -apple-system, sans-serif", backgroundColor: C.white, color: C.black, minHeight: '100vh', overflowX: 'hidden', width: '100%', boxSizing: 'border-box' }}>

      {/* ══════════ TOAST NOTIFICATIONS ══════════ */}
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10, marginTop: 0 }}>
        {toasts.map(t => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 12, background: t.type === 'success' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${t.type === 'success' ? '#bbf7d0' : '#fecaca'}`, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 280, maxWidth: 360 }}>
            {t.type === 'success' ? <CheckCircle2 size={18} color={C.emerald} /> : <X size={18} color="#dc2626" />}
            <span style={{ fontSize: 13, fontWeight: 600, color: t.type === 'success' ? '#166534' : '#991b1b', flex: 1 }}>{t.message}</span>
            <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}>
              <X size={14} color={t.type === 'success' ? '#166534' : '#991b1b'} />
            </button>
          </div>
        ))}
      </div>

      {/* ══════════ AUTH MODAL ══════════ */}
      <AuthModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} defaultMode="signup" onSuccess={() => { const r = localStorage.getItem('pulse-crm-role'); onLogin((r as any) || 'manager'); }} />

      {/* ══════════ NAVBAR ══════════ */}
      <Navbar onOpenModal={openSignIn} onOpenSignUp={openSignUp} />

      {/* ══════════ 1. HERO SECTION ══════════ */}
      <section style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(160deg, #f5f3ff 0%, #faf8ff 50%, #f0eefe 100%)', paddingTop: 120, paddingBottom: 0, marginTop: 64 }}>
        {/* Background glow blobs */}
        <div style={{ position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)', width: 700, height: 400, background: `radial-gradient(ellipse, ${C.violet}18 0%, transparent 70%)`, pointerEvents: 'none', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', top: 60, left: '15%', width: 300, height: 300, background: 'radial-gradient(circle, #a78bfa18 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', top: 60, right: '15%', width: 300, height: 300, background: 'radial-gradient(circle, #7c3aed14 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(60px)' }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 48px', position: 'relative', zIndex: 1 }}>

          {/* ── Top badge ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 16px', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', border: `1px solid ${C.violetLight}`, borderRadius: 100, boxShadow: `0 2px 12px ${C.violet}14` }}>
              <Sparkles size={13} color={C.violet} />
              <span style={{ fontSize: 12, fontWeight: 600, color: C.violet }}>The future of sales is here</span>
            </div>
          </motion.div>

          {/* ── Headline ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{ textAlign: 'center', marginBottom: 24 }}>
            <h1 style={{ fontSize: 'clamp(44px, 6vw, 76px)', fontWeight: 900, color: C.black, lineHeight: 1.08, letterSpacing: '-0.04em', margin: 0 }}>
              Close More Deals with{' '}
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '1.1em', height: '1.1em', background: `linear-gradient(135deg, ${C.violet} 0%, #9333ea 100%)`, borderRadius: '0.22em', boxShadow: `0 8px 24px ${C.violet}50`, verticalAlign: 'middle', flexShrink: 0 }}>
                  <Sparkles size={28} color="#fff" strokeWidth={2.5} />
                </span>
                <span style={{ color: C.violet }}>Smarter</span>
              </span>
              <br />
              <span style={{ color: C.violet }}>AI-Powered</span> CRM.
            </h1>
          </motion.div>

          {/* ── Subtext ── */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{ textAlign: 'center', fontSize: 18, color: C.textGray, fontWeight: 400, lineHeight: 1.7, maxWidth: 600, margin: '0 auto 40px' }}>
            Pulse CRM unifies your leads, deals, and Gmail — scored by transparent AI, managed through an FSM pipeline, and built for real sales teams.
          </motion.p>

          {/* ── CTAs ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            style={{ display: 'flex', gap: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 56 }}>
            <button
              onClick={openSignUp}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '15px 32px', background: C.violet, color: C.white, fontSize: 15, fontWeight: 700, borderRadius: 12, border: 'none', cursor: 'pointer', boxShadow: `0 8px 28px ${C.violet}55`, fontFamily: 'inherit', letterSpacing: '-0.01em', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 12px 36px ${C.violet}66`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 8px 28px ${C.violet}55`; }}>
              Start Free Trial
            </button>
            <button
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', background: 'rgba(255,255,255,0.9)', color: C.violet, fontSize: 15, fontWeight: 700, borderRadius: 12, border: `1.5px solid ${C.violetLight}`, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-0.01em', backdropFilter: 'blur(10px)', transition: 'all 0.2s', boxShadow: `0 2px 12px ${C.violet}14` }}
              onMouseEnter={e => { e.currentTarget.style.background = C.violetLighter; e.currentTarget.style.borderColor = C.violet; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.9)'; e.currentTarget.style.borderColor = C.violetLight; }}>
              <Activity size={16} color={C.violet} /> Request Demo
            </button>
          </motion.div>

          {/* ── Dashboard Mockup ── */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: 1000, background: C.white, borderRadius: '20px 20px 0 0', boxShadow: '0 -4px 0 rgba(124,58,237,0.15), 0 32px 80px rgba(124,58,237,0.18), 0 8px 32px rgba(0,0,0,0.08)', border: `1px solid ${C.border}`, borderBottom: 'none', overflow: 'hidden' }}>

              {/* App top bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', borderBottom: `1px solid ${C.border}`, background: '#fafbff' }}>
                {/* Logo + title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ height: 28, width: 28, borderRadius: 8, background: C.violet, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Activity size={14} color={C.white} strokeWidth={2.5} />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 900, color: C.black }}>Pulse<span style={{ color: C.violet }}>CRM</span></span>
                </div>
                {/* Search bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: '#f1f5f9', borderRadius: 8, minWidth: 200 }}>
                  <Filter size={13} color="#94a3b8" />
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>Search...</span>
                </div>
                {/* User */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: C.violet, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.white, fontSize: 11, fontWeight: 700 }}>AK</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.black }}>Alex K.</div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>Admin</div>
                  </div>
                </div>
              </div>

              {/* Main layout */}
              <div style={{ display: 'flex', height: 440 }}>
                {/* Sidebar */}
                <div style={{ width: 180, background: '#fafbff', borderRight: `1px solid ${C.border}`, padding: '20px 12px', flexShrink: 0 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 8px', marginBottom: 10 }}>Main Menu</div>
                  {[
                    { icon: LayoutDashboard, label: 'Dashboard', active: true },
                    { icon: Target,          label: 'Leads' },
                    { icon: Users,           label: 'Contacts' },
                    { icon: TrendingUp,      label: 'Pipeline' },
                    { icon: Activity,        label: 'Activities' },
                    { icon: BarChart2,       label: 'Analytics' },
                    { icon: Sparkles,        label: 'AI Scoring' },
                    { icon: Mail,            label: 'Email' },
                    { icon: Settings,        label: 'Settings' },
                  ].map(({ icon: Icon, label, active }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 10px', borderRadius: 8, background: active ? C.violet : 'transparent', marginBottom: 2, cursor: 'pointer' }}>
                      <Icon size={14} color={active ? C.white : '#94a3b8'} strokeWidth={2} />
                      <span style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? C.white : '#64748b' }}>{label}</span>
                    </div>
                  ))}
                </div>

                {/* Dashboard content */}
                <div style={{ flex: 1, padding: '22px 24px', background: C.white, overflowY: 'hidden' }}>
                  {/* Header */}
                  <div style={{ marginBottom: 20 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 900, color: C.black, margin: '0 0 2px', letterSpacing: '-0.02em' }}>Dashboard</h2>
                    <p style={{ fontSize: 11, color: C.textMuted, margin: 0 }}>Welcome back to Pulse CRM</p>
                  </div>

                  {/* 3 stat cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 18 }}>
                    {[
                      { label: 'Active Sales', value: '₹98,430', change: '+18%', icon: TrendingUp, color: '#7c3aed', trend: [30,40,35,52,48,62,58] },
                      { label: 'Open Deals', value: '340', change: '+12%', icon: Target, color: '#0ea5e9', trend: [40,35,45,40,50,48,55] },
                      { label: 'Win Rate', value: '76%', change: '+4%', icon: Activity, color: '#10b981', trend: [50,55,52,60,58,65,68] },
                    ].map((s, i) => {
                      const Icon = s.icon;
                      return (
                        <div key={i} style={{ background: '#fafbff', border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 16px', position: 'relative', overflow: 'hidden' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                            <div>
                              <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
                              <div style={{ fontSize: 20, fontWeight: 900, color: C.black, letterSpacing: '-0.02em' }}>{s.value}</div>
                            </div>
                            <div style={{ width: 30, height: 30, borderRadius: 8, background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Icon size={14} color={s.color} />
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#10b981' }}>{s.change}</span>
                            <span style={{ fontSize: 10, color: C.textMuted }}>vs last month</span>
                            <span style={{ fontSize: 10, color: '#64748b', marginLeft: 4, cursor: 'pointer', color: C.violet }}>See Details →</span>
                          </div>
                          <svg viewBox="0 0 80 16" style={{ position: 'absolute', bottom: 0, right: 0, width: 80, height: 16, opacity: 0.15 }}>
                            <polyline points={s.trend.map((v,j)=>`${j*(80/6)},${16-(v/68)*16}`).join(' ')} fill="none" stroke={s.color} strokeWidth="1.5" />
                          </svg>
                        </div>
                      );
                    })}
                  </div>

                  {/* Bottom 2 panels */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 14 }}>
                    {/* Analytics panel */}
                    <div style={{ background: '#fafbff', border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 16px' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.black, marginBottom: 12 }}>Powerful CRM analytics for growth.</div>
                      <div style={{ fontSize: 13, fontWeight: 900, color: C.black, marginBottom: 10 }}>Analytics</div>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 60 }}>
                        {[35,48,42,60,55,72,65,80,75,88].map((h,i) => (
                          <div key={i} style={{ flex: 1, height: `${h}%`, background: i >= 6 ? C.violet : '#ddd6fe', borderRadius: '3px 3px 0 0', opacity: i >= 6 ? 1 : 0.6 }} />
                        ))}
                      </div>
                    </div>

                    {/* Pipeline panel */}
                    <div style={{ background: '#fafbff', border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 16px' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.black, marginBottom: 12 }}>Sales Pipeline Tracking</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, justifyContent: 'center' }}>
                        <div style={{ position: 'relative', width: 90, height: 90 }}>
                          <svg viewBox="0 0 90 90" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                            <circle cx="45" cy="45" r="36" fill="none" stroke="#e2e8f0" strokeWidth="14" />
                            <circle cx="45" cy="45" r="36" fill="none" stroke={C.violet} strokeWidth="14" strokeDasharray="68 226" strokeLinecap="round" />
                            <circle cx="45" cy="45" r="36" fill="none" stroke="#8b5cf6" strokeWidth="14" strokeDasharray="54 226" strokeDashoffset="-68" strokeLinecap="round" />
                            <circle cx="45" cy="45" r="36" fill="none" stroke="#10b981" strokeWidth="14" strokeDasharray="56 226" strokeDashoffset="-122" strokeLinecap="round" />
                          </svg>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                          {[{ label: 'New', pct: '30%', color: C.violet }, { label: 'Active', pct: '24%', color: '#8b5cf6' }, { label: 'Won', pct: '25%', color: '#10b981' }].map((item, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                              <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
                              <span style={{ fontSize: 11, color: C.textGray, fontWeight: 500 }}>{item.label}</span>
                              <span style={{ fontSize: 11, fontWeight: 700, color: C.black, marginLeft: 'auto' }}>{item.pct}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════ 4. SOCIAL PROOF / TRUSTED BY ══════════ */}
      <section data-reveal="trusted" style={{ background: C.sectionAlt, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: '56px 48px', overflow: 'hidden', opacity: visibleSections.has('trusted') ? 1 : 0, transform: visibleSections.has('trusted') ? 'translateY(0)' : 'translateY(24px)', transition: 'opacity 0.7s ease, transform 0.7s ease' }}>
        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .marquee-container {
            display: flex;
            animation: marquee 30s linear infinite;
          }
          .marquee-container:hover {
            animation-play-state: paused;
          }
          .trusted-logo-item {
            animation: fadeInLogo 0.6s ease-out forwards;
            opacity: 0;
          }
          .trusted-logo-item:nth-child(1) { animation-delay: 0.1s; }
          .trusted-logo-item:nth-child(2) { animation-delay: 0.2s; }
          .trusted-logo-item:nth-child(3) { animation-delay: 0.3s; }
          .trusted-logo-item:nth-child(4) { animation-delay: 0.4s; }
          .trusted-logo-item:nth-child(5) { animation-delay: 0.5s; }
          .trusted-logo-item:nth-child(6) { animation-delay: 0.6s; }
          .trusted-logo-item:nth-child(7) { animation-delay: 0.1s; }
          .trusted-logo-item:nth-child(8) { animation-delay: 0.2s; }
          .trusted-logo-item:nth-child(9) { animation-delay: 0.3s; }
          .trusted-logo-item:nth-child(10) { animation-delay: 0.4s; }
          .trusted-logo-item:nth-child(11) { animation-delay: 0.5s; }
          .trusted-logo-item:nth-child(12) { animation-delay: 0.6s; }
          @keyframes fadeInLogo {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 48 }}>
            TRUSTED BY FAST-GROWING SALES TEAMS & ENTERPRISE ORGANIZATIONS
          </p>
          <div style={{ display: 'flex', alignItems: 'center', position: 'relative', width: '100%' }}>
            <div className="marquee-container">
              {/* First set of logos */}
              {[
                { name: 'TechCorp', icon: '📦', color: '#3b82f6' },
                { name: 'Sparta Creative', icon: '⚫', color: '#1e293b' },
                { name: 'Empirio Logistics', icon: '🔶', color: '#f97316' },
                { name: 'Acme Systems', icon: '🔺', color: '#0ea5e9' },
                { name: 'Initech Global', icon: '🟢', color: '#10b981' },
              ].map((company, i) => (
                <div key={`${company.name}-1`} className="trusted-logo-item" style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '0 48px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  <div style={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: 8, 
                    background: company.color, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: 16
                  }}>
                    {company.icon}
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#475569', letterSpacing: '-0.01em', userSelect: 'none' }}>
                    {company.name}
                  </span>
                </div>
              ))}
              {/* Duplicate set for seamless loop */}
              {[
                { name: 'TechCorp', icon: '📦', color: '#3b82f6' },
                { name: 'Sparta Creative', icon: '⚫', color: '#1e293b' },
                { name: 'Empirio Logistics', icon: '🔶', color: '#f97316' },
                { name: 'Acme Systems', icon: '🔺', color: '#0ea5e9' },
                { name: 'Initech Global', icon: '🟢', color: '#10b981' },
              ].map((company, i) => (
                <div key={`${company.name}-2`} className="trusted-logo-item" style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '0 48px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  <div style={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: 8, 
                    background: company.color, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: 16
                  }}>
                    {company.icon}
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#475569', letterSpacing: '-0.01em', userSelect: 'none' }}>
                    {company.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ 6. FEATURES GRID ══════════ */}
      <section data-reveal="features" style={{ background: C.sectionAlt, padding: '96px 48px', borderTop: `1px solid ${C.border}` }}>
        <style>{`
          .feature-card-hover {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .feature-card-hover:hover {
            transform: translateY(-8px) scale(1.02);
            box-shadow: 0 20px 60px rgba(124, 58, 237, 0.2) !important;
            border-color: #7c3aed !important;
          }
          .feature-icon-hover {
            transition: transform 0.3s ease;
          }
          .feature-card-hover:hover .feature-icon-hover {
            transform: scale(1.1) rotate(5deg);
          }
        `}</style>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "0px" }}
              transition={{ duration: 0.4 }}
              style={{ fontSize: 12, fontWeight: 700, color: C.violet, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 14px' }}>
              Features
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
              style={{ fontSize: 42, fontWeight: 900, color: C.black, letterSpacing: '-0.025em', margin: '0 0 16px' }}>
              Everything you need to close more deals
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "0px" }}
              transition={{ duration: 0.5, delay: 0.2 }}
              style={{ fontSize: 17, color: C.textGray, fontWeight: 500, maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
              Everything built and wired — scoring, pipeline, Gmail, RBAC, and analytics. No tab-switching, no data silos.
            </motion.p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {features.map((f, idx) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "0px" }}
                  transition={{ 
                    duration: 0.5, 
                    delay: idx * 0.1,
                    ease: [0.4, 0, 0.2, 1]
                  }}
                  className="feature-card-hover"
                  style={{ padding: '32px 28px', borderRadius: 20, border: `1px solid ${C.border}`, background: C.white, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', cursor: 'pointer' }}>
                  <div className="feature-icon-hover" style={{ height: 52, width: 52, borderRadius: 16, background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                    <Icon size={24} color={f.fg} />
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: C.black, margin: '0 0 10px', letterSpacing: '-0.01em' }}>{f.title}</h3>
                  <p style={{ fontSize: 14, color: C.textGray, fontWeight: 500, lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════ 7. HOW IT WORKS ══════════ */}
      <section data-reveal="steps" style={{ background: '#eeeafd', padding: '80px 48px 72px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 14px', background: 'rgba(255,255,255,0.7)', border: `1px solid ${C.violetLight}`, borderRadius: 100, marginBottom: 18 }}>
              <Zap size={12} color={C.violet} />
              <span style={{ fontSize: 11, fontWeight: 700, color: C.violet, textTransform: 'uppercase', letterSpacing: '0.1em' }}>HOW IT WORKS</span>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.08 }}
              style={{ fontSize: 52, fontWeight: 900, color: C.black, letterSpacing: '-0.04em', margin: '0 0 14px', lineHeight: 1.08 }}>
              Up and running in minutes
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
              style={{ fontSize: 17, color: C.textGray, fontWeight: 400, maxWidth: 500, margin: '0 auto', lineHeight: 1.65 }}>
              No complex setup. No migration headaches.<br />Start closing deals faster on day one.
            </motion.p>
          </div>

          {/* Main: Steps Left + Cards Right */}
          <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 60, alignItems: 'start' }}>

            {/* ── LEFT: Steps ── */}
            <div>
              {[
                { num: '01', icon: Zap, title: 'Connect', desc: 'Import contacts and leads via CSV or REST API. Link Gmail with OAuth for automatic email sync.' },
                { num: '02', icon: Sparkles, title: 'AI Works for You', desc: 'Scores every lead 0–100 using fit + engagement. Groq/Llama summarises threads and suggests next actions.' },
                { num: '03', icon: TrendingUp, title: 'Close', desc: 'Move deals through FSM pipeline stages. Role-scoped dashboards keep reps and managers aligned.' },
              ].map((step, idx) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.55, delay: idx * 0.15 }}
                    style={{ display: 'flex', gap: 14, marginBottom: idx < 2 ? 32 : 0, position: 'relative' }}>
                    {/* vertical connector line — full height through text to next circle */}
                    {idx < 2 && (
                      <div style={{
                        position: 'absolute',
                        left: 22,
                        top: 44,
                        width: 2,
                        height: 'calc(100% + 32px)',
                        background: `linear-gradient(180deg, ${C.violet}60 0%, ${C.violet}20 100%)`,
                        transform: 'translateX(-50%)'
                      }} />
                    )}
                    {/* Circular icon */}
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: C.white, border: `1.5px solid ${C.violetLight}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative', zIndex: 1, boxShadow: `0 4px 16px ${C.violet}18` }}>
                      <Icon size={20} color={C.violet} strokeWidth={2.5} />
                    </div>
                    {/* Text */}
                    <div style={{ paddingTop: 2 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: C.violet, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>STEP {step.num}</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: C.black, marginBottom: 5, letterSpacing: '-0.02em' }}>{step.title}</div>
                      <div style={{ fontSize: 13, color: C.textGray, lineHeight: 1.5, fontWeight: 400 }}>{step.desc}</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* ── RIGHT: Cards Grid ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* ROW 1: AI Score | Visual Pipeline | Revenue Analytics */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.35fr 1.2fr', gap: 16 }}>

                {/* AI Score */}
                <motion.div
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  whileHover={{ y: -4, boxShadow: '0 16px 40px rgba(0,0,0,0.12)' }}
                  style={{ background: C.white, borderRadius: 18, padding: '20px 20px 16px', border: `1px solid ${C.border}`, boxShadow: '0 4px 16px rgba(0,0,0,0.07)', cursor: 'default', transition: 'box-shadow 0.2s, transform 0.2s' }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>AI SCORE</span>
                    <Sparkles size={12} color={C.violet} />
                  </div>
                  {/* Big number */}
                  <div style={{ fontSize: 58, fontWeight: 900, color: '#10b981', lineHeight: 1, letterSpacing: '-0.05em', marginBottom: 2 }}>89</div>
                  <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500, marginBottom: 14 }}>Hot Lead</div>
                  {/* Mini sparkline */}
                  <svg viewBox="0 0 100 36" style={{ width: '100%', height: 36 }}>
                    <defs>
                      <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <polyline points="0,30 14,26 28,28 38,20 50,22 62,14 74,10 86,6 100,4" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <polygon points="0,30 14,26 28,28 38,20 50,22 62,14 74,10 86,6 100,4 100,36 0,36" fill="url(#sparkGrad)" />
                  </svg>
                </motion.div>

                {/* Visual Pipeline */}
                <motion.div
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  whileHover={{ y: -4, boxShadow: '0 16px 40px rgba(0,0,0,0.12)' }}
                  style={{ background: C.white, borderRadius: 18, padding: '20px 18px 18px', border: `1px solid ${C.border}`, boxShadow: '0 4px 16px rgba(0,0,0,0.07)', cursor: 'default' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 18 }}>
                    <LayoutDashboard size={14} color={C.violet} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>VISUAL PIPELINE</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                    {[
                      { label: 'New', count: 12, bg: '#ede9fe', active: false },
                      { label: 'Qualified', count: 8, bg: '#ede9fe', active: false },
                      { label: 'Demo', count: 5, bg: C.white, active: true },
                      { label: 'Proposal', count: 3, bg: '#fef9c3', active: false },
                      { label: 'Won', count: 7, bg: '#dcfce7', active: false },
                    ].map((s, i) => (
                      <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ height: 44, background: s.active ? C.white : s.bg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, color: s.active ? C.violet : C.black, border: s.active ? `2px solid ${C.violet}` : '2px solid transparent', boxShadow: s.active ? `0 2px 10px ${C.violet}25` : 'none', marginBottom: 6 }}>
                          {s.count}
                        </div>
                        <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Revenue Analytics */}
                <motion.div
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  whileHover={{ y: -4, boxShadow: '0 16px 40px rgba(0,0,0,0.12)' }}
                  style={{ background: C.white, borderRadius: 18, padding: '20px 18px 16px', border: `1px solid ${C.border}`, boxShadow: '0 4px 16px rgba(0,0,0,0.07)', cursor: 'default' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 16 }}>
                    <BarChart2 size={14} color={C.violet} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>REVENUE ANALYTICS</span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 3 }}>Monthly Revenue</div>
                      <div style={{ fontSize: 26, fontWeight: 900, color: C.violet, letterSpacing: '-0.03em' }}>₹1.2L</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 3 }}>Win Rate</div>
                      <div style={{ fontSize: 26, fontWeight: 900, color: '#10b981', letterSpacing: '-0.03em' }}>67%</div>
                    </div>
                  </div>
                  {/* Bar chart */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 42 }}>
                    {[30, 38, 35, 42, 45, 40, 55, 65, 70, 68].map((h, i) => (
                      <div key={i} style={{ flex: 1, background: i >= 6 ? C.violet : '#ddd6fe', borderRadius: '3px 3px 0 0', height: `${h}%`, transition: 'height 0.3s' }} />
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* ROW 2: AI Copilot | Import Contacts | Email Activity */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>

                {/* AI Copilot */}
                <motion.div
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  whileHover={{ y: -4, boxShadow: '0 16px 40px rgba(0,0,0,0.12)' }}
                  style={{ background: C.white, borderRadius: 18, padding: '20px 20px 18px', border: `1px solid ${C.border}`, boxShadow: '0 4px 16px rgba(0,0,0,0.07)', cursor: 'default' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 16 }}>
                    <Sparkles size={14} color={C.violet} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>AI COPILOT</span>
                  </div>
                  {/* Chat bubble */}
                  <div style={{ padding: '14px 16px', background: '#f8f7ff', borderRadius: 12, border: `1px solid ${C.violetLight}`, marginBottom: 14 }}>
                    <div style={{ fontSize: 13, color: C.violet, fontWeight: 600, marginBottom: 6, lineHeight: 1.4 }}>
                      "Schedule demo with Acme Corp"
                    </div>
                    <div style={{ fontSize: 12, color: '#8b5cf6', fontWeight: 500 }}>
                      Positive sentiment • High engagement
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ padding: '6px 14px', background: C.violetLighter, borderRadius: 8, fontSize: 12, fontWeight: 600, color: C.violet }}>
                      Demo Ready
                    </div>
                    <div style={{ padding: '6px 14px', background: C.violetLighter, borderRadius: 8, fontSize: 12, fontWeight: 600, color: C.violet }}>
                      High Priority
                    </div>
                  </div>
                </motion.div>

                {/* Import Contacts */}
                <motion.div
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  whileHover={{ y: -4, boxShadow: '0 16px 40px rgba(0,0,0,0.12)' }}
                  style={{ background: C.white, borderRadius: 18, padding: '20px 20px 18px', border: `1px solid ${C.border}`, boxShadow: '0 4px 16px rgba(0,0,0,0.07)', cursor: 'default' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 18 }}>
                    <Users size={14} color={C.violet} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>IMPORT CONTACTS</span>
                  </div>
                  {/* Dashed upload zone */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '22px 16px', background: '#fafbff', borderRadius: 14, border: `2px dashed ${C.violetLight}`, gap: 10 }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: C.violet, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 6px 20px ${C.violet}40` }}>
                      <ChevronRight size={22} color={C.white} strokeWidth={2.5} style={{ transform: 'rotate(-90deg)' }} />
                    </div>
                    <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>CSV, Gmail, CRM</div>
                  </div>
                </motion.div>

                {/* Email Activity */}
                <motion.div
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                  whileHover={{ y: -4, boxShadow: '0 16px 40px rgba(0,0,0,0.12)' }}
                  style={{ background: C.white, borderRadius: 18, padding: '20px 20px 18px', border: `1px solid ${C.border}`, boxShadow: '0 4px 16px rgba(0,0,0,0.07)', cursor: 'default' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 16 }}>
                    <Mail size={14} color={C.violet} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>EMAIL ACTIVITY</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                    {[
                      { sender: 'John @ Acme', time: '2m ago' },
                      { sender: 'Sarah @ TechCo', time: '1h ago' },
                      { sender: 'Mike @ StartupX', time: '3h ago' },
                    ].map((email, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
                          <span style={{ fontSize: 14, fontWeight: 600, color: C.black }}>{email.sender}</span>
                        </div>
                        <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500, flexShrink: 0 }}>{email.time}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>

              </div>
            </div>
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.8 }}
            style={{ textAlign: 'center', marginTop: 56 }}>
            <button
              onClick={openSignUp}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '15px 36px', background: C.violet, color: C.white, fontSize: 16, fontWeight: 700, borderRadius: 100, border: 'none', cursor: 'pointer', boxShadow: `0 10px 30px ${C.violet}55`, fontFamily: 'inherit', transition: 'all 0.25s', letterSpacing: '-0.01em' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 16px 40px ${C.violet}65`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 10px 30px ${C.violet}55`; }}>
              Get started free <ArrowRight size={17} strokeWidth={2.5} />
            </button>
            <div style={{ display: 'flex', gap: 36, justifyContent: 'center', marginTop: 22, flexWrap: 'wrap' }}>
              {[
                { icon: Shield, text: '14-day free trial' },
                { icon: CheckCircle2, text: 'No credit card required' },
                { icon: Zap, text: '2-minute setup' },
              ].map(item => (
                <span key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 600, color: '#64748b' }}>
                  <item.icon size={15} color={C.violet} strokeWidth={2} /> {item.text}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════ 7.5. TRUST / FEATURES BAR ══════════ */}
      <section data-reveal="trust" style={{ background: C.white, borderTop: `1px solid ${C.border}`, padding: '56px 48px', opacity: visibleSections.has('trust') ? 1 : 0, transform: visibleSections.has('trust') ? 'translateY(0)' : 'translateY(24px)', transition: 'opacity 0.7s ease, transform 0.7s ease' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32 }}>
          {trustBadges.map(b => {
            const Icon = b.icon;
            return (
              <div key={b.title} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 14, padding: '28px 20px', borderRadius: 20, border: `1px solid ${C.border}`, background: C.white, transition: 'all 0.25s ease', cursor: 'default' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.boxShadow = `0 12px 36px ${C.violet}14`; el.style.borderColor = C.violetLight; el.style.transform = 'translateY(-4px)'; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.boxShadow = 'none'; el.style.borderColor = C.border; el.style.transform = 'translateY(0)'; }}>
                <div style={{ height: 58, width: 58, borderRadius: 18, background: C.violetLighter, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={24} color={C.violet} />
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 800, color: C.black, margin: '0 0 6px' }}>{b.title}</p>
                  <p style={{ fontSize: 13, color: C.textMuted, fontWeight: 500, margin: 0 }}>{b.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ══════════ 8. PLATFORM + ORBIT DIAGRAM ══════════ */}
      <section data-reveal="orbit" style={{ 
        background: '#ffffff', 
        padding: '96px 48px 110px', 
        position: 'relative', 
        overflow: 'hidden', 
        opacity: visibleSections.has('orbit') ? 1 : 0, 
        transform: visibleSections.has('orbit') ? 'translateY(0)' : 'translateY(32px)', 
        transition: 'opacity 0.9s ease, transform 0.9s ease' 
      }}>
        {/* Leaf Illustration - Bottom Left */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, pointerEvents: 'none', zIndex: 0 }}>
          <svg width="200" height="220" viewBox="0 0 200 220" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 220C45 200 65 155 55 100C50 72 35 50 12 33C-5 20 -10 10 -10 0" stroke="#a5b4fc" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M55 100C82 78 115 83 132 105C110 127 77 122 55 100Z" fill="#c7d2fe" opacity="0.75"/>
            <path d="M38 138C66 121 93 132 104 154C82 170 55 160 38 138Z" fill="#818cf8" opacity="0.65"/>
            <path d="M22 170C44 159 66 170 72 187C55 198 33 187 22 170Z" fill="#a5b4fc" opacity="0.85"/>
            <path d="M16 72C33 50 60 50 72 72C50 88 28 83 16 72Z" fill="#818cf8" opacity="0.55"/>
            <path d="M-5 120C12 104 34 110 40 126C23 137 6 131 -5 120Z" fill="#c7d2fe" opacity="0.85"/>
          </svg>
        </div>

        {/* Leaf Illustration - Bottom Right */}
        <div style={{ position: 'absolute', bottom: 0, right: 0, pointerEvents: 'none', zIndex: 0 }}>
          <svg width="260" height="280" viewBox="0 0 260 280" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M260 280C215 225 183 150 205 65C210 43 222 22 238 0" stroke="#5eead4" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M205 150C162 129 119 156 108 188C146 210 189 183 205 150Z" fill="#0d9488" opacity="0.8"/>
            <path d="M183 86C140 70 102 97 97 130C130 146 167 119 183 86Z" fill="#14b8a6" opacity="0.7"/>
            <path d="M216 205C183 194 156 216 151 243C178 259 205 238 216 205Z" fill="#2dd4bf" opacity="0.85"/>
            <path d="M227 38C194 27 167 48 162 75C189 86 211 65 227 38Z" fill="#60a5fa" opacity="0.65"/>
            <path d="M243 118C216 102 194 118 189 140C211 151 232 135 243 118Z" fill="#3b82f6" opacity="0.55"/>
          </svg>
        </div>

        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: C.violet, textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>
              ALL-IN-ONE PLATFORM
            </p>
            <h2 style={{ fontSize: 46, fontWeight: 900, color: C.black, lineHeight: 1.15, letterSpacing: '-0.025em', margin: 0 }}>
              A complete platform<br />to power your<br /><span style={{ color: C.violet }}>sales pipeline</span>
            </h2>
            <p style={{ fontSize: 16, color: '#64748b', fontWeight: 500, lineHeight: 1.75, maxWidth: 440, margin: 0 }}>
              One FastAPI backend powers your entire revenue workflow — from lead intake to deal close, with transparent AI scoring at every step.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                'Rule-based AI scoring — no black box',
                'Gmail OAuth sync with Groq/Llama summaries',
                'FSM pipeline with real-time RBAC dashboards',
                'Close more deals with less admin work'
              ].map(item => (
                <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, fontWeight: 700, color: '#1e293b' }}>
                  <div style={{ height: 22, width: 22, borderRadius: '50%', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CheckCircle2 size={15} color={C.violet} strokeWidth={2.5} />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button 
                onClick={openSignUp} 
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: 10, 
                  padding: '14px 28px', 
                  background: C.white, 
                  color: C.violet, 
                  fontSize: 15, 
                  fontWeight: 700, 
                  borderRadius: 100, 
                  border: `1.5px solid ${C.violet}`, 
                  cursor: 'pointer', 
                  boxShadow: '0 2px 10px rgba(124, 58, 237, 0.08)', 
                  fontFamily: 'inherit',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget;
                  el.style.background = C.violetLighter;
                  el.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget;
                  el.style.background = C.white;
                  el.style.transform = 'translateY(0)';
                }}
              >
                Explore all features <ArrowRight size={16} color={C.violet} />
              </button>
            </div>
          </div>

          {/* Right — Orbit diagram */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32, position: 'relative' }}>
            <div style={{ position: 'relative', width: 440, height: 440 }}>
              
              {/* Soft purple outer glow circle behind central area */}
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 300, height: 300, borderRadius: '50%', background: 'rgba(124, 58, 237, 0.04)', pointerEvents: 'none' }} />
              
              {/* Intermediate soft ring glow */}
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 220, height: 220, borderRadius: '50%', background: 'rgba(124, 58, 237, 0.08)', pointerEvents: 'none' }} />

              {/* Dashed orbit circle passing through node centers */}
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 340, height: 340, borderRadius: '50%', border: '1.5px dashed rgba(124, 58, 237, 0.3)', pointerEvents: 'none' }} />

              {/* Center pulse logo button/circle */}
              <div style={{ 
                position: 'absolute', 
                top: '50%', 
                left: '50%', 
                transform: 'translate(-50%,-50%)', 
                width: 120, 
                height: 120, 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)', 
                boxShadow: '0 12px 36px rgba(124, 58, 237, 0.35), 0 0 0 10px rgba(255, 255, 255, 0.95), 0 0 0 18px rgba(124, 58, 237, 0.06)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                zIndex: 2
              }}>
                <Activity size={48} color={C.white} strokeWidth={2.2} />
              </div>

              {/* 6 Orbit Nodes */}
              {orbitNodes.map(({ label, icon: Icon, color, description }, i) => {
                const baseAngle = (i / orbitNodes.length) * 360;
                const angle = (baseAngle + orbitAngle - 90) * (Math.PI / 180);
                const r = 170;
                const cx = 220, cy = 220;
                const x = cx + r * Math.cos(angle);
                const y = cy + r * Math.sin(angle);
                const isActive = activeOrbitNode === label;

                return (
                  <div 
                    key={label}
                    onClick={() => setActiveOrbitNode(isActive ? null : label)}
                    style={{ 
                      position: 'absolute', 
                      left: x - 35, 
                      top: y - 35, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      cursor: 'pointer',
                      zIndex: 3,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}>
                    {/* Round Node Button */}
                    <div style={{ 
                      height: 70, 
                      width: 70, 
                      borderRadius: '50%', 
                      background: isActive ? C.violet : C.white, 
                      boxShadow: isActive ? `0 10px 28px ${C.violet}55` : '0 6px 24px rgba(15, 23, 42, 0.08)', 
                      border: `2px solid ${isActive ? C.violet : '#ffffff'}`, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      transition: 'all 0.3s ease',
                      transform: isActive ? 'scale(1.12)' : 'scale(1)'
                    }}>
                      <Icon size={26} color={isActive ? C.white : (color || C.violet)} strokeWidth={2.2} />
                    </div>
                    {/* Node Label Below */}
                    <span style={{ 
                      fontSize: 12, 
                      fontWeight: 700, 
                      color: isActive ? C.violet : '#1e293b', 
                      whiteSpace: 'nowrap', 
                      textAlign: 'center',
                      marginTop: 6,
                      transition: 'all 0.3s ease'
                    }}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Info panel when node is selected */}
            {activeOrbitNode && (
              <div style={{ 
                width: '100%', 
                maxWidth: 440, 
                background: C.white, 
                borderRadius: 18, 
                padding: '22px 26px', 
                border: `2px solid ${C.violetLight}`, 
                boxShadow: '0 12px 36px rgba(124,58,237,0.12)',
                animation: 'fadeUpStep 0.3s ease-out',
                position: 'relative',
                zIndex: 4
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ 
                      height: 38, 
                      width: 38, 
                      borderRadius: '50%', 
                      background: C.violetLighter, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      border: `1px solid ${C.violetLight}`
                    }}>
                      {React.createElement(orbitNodes.find(n => n.label === activeOrbitNode)!.icon, { 
                        size: 20, 
                        color: orbitNodes.find(n => n.label === activeOrbitNode)!.color || C.violet, 
                        strokeWidth: 2 
                      })}
                    </div>
                    <span style={{ fontSize: 16, fontWeight: 800, color: C.black }}>{activeOrbitNode}</span>
                  </div>
                  <button 
                    onClick={() => setActiveOrbitNode(null)} 
                    style={{ 
                      background: C.sectionAlt, 
                      border: `1px solid ${C.border}`, 
                      borderRadius: 8, 
                      width: 30, 
                      height: 30, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <X size={15} color={C.textGray} />
                  </button>
                </div>
                <p style={{ 
                  fontSize: 14, 
                  color: C.textGray, 
                  lineHeight: 1.65, 
                  margin: 0,
                  fontWeight: 500
                }}>
                  {orbitNodes.find(n => n.label === activeOrbitNode)!.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ══════════ 9. TESTIMONIALS ══════════ */}
      <section data-reveal="testimonials" style={{ background: C.white, padding: '96px 48px', borderTop: `1px solid ${C.border}`, opacity: visibleSections.has('testimonials') ? 1 : 0, transform: visibleSections.has('testimonials') ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.8s ease, transform 0.8s ease' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.violet, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 14px' }}>Customer stories</p>
            <h2 style={{ fontSize: 42, fontWeight: 900, color: C.black, letterSpacing: '-0.025em', margin: '0 0 16px' }}>Teams that love Pulse CRM</h2>
            <p style={{ fontSize: 17, color: C.textGray, fontWeight: 500, maxWidth: 460, margin: '0 auto', lineHeight: 1.7 }}>
              Real feedback from dev teams and sales leaders using Pulse CRM in production.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28 }}>
            {testimonials.map(t => (
              <div key={t.name} className="testimonial-card" style={{ padding: '32px 28px', borderRadius: 22, border: `1px solid ${C.border}`, background: C.white, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[1, 2, 3, 4, 5].map(n => <Star key={n} size={15} color="#f59e0b" fill="#f59e0b" />)}
                </div>
                <p style={{ fontSize: 15, color: C.textGray, fontWeight: 500, lineHeight: 1.8, margin: 0, flex: 1 }}>"{t.quote}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingTop: 4, borderTop: `1px solid ${C.border}` }}>
                  <div style={{ height: 44, width: 44, borderRadius: '50%', background: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: C.white }}>{t.initials}</span>
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: C.black, margin: '0 0 2px' }}>{t.name}</p>
                    <p style={{ fontSize: 12, color: C.textMuted, fontWeight: 500, margin: 0 }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ 11. BOTTOM CTA BANNER ══════════ */}
      <section data-reveal="cta" style={{ background: `linear-gradient(135deg, ${C.violet} 0%, ${C.violetDark} 100%)`, padding: '88px 48px', position: 'relative', overflow: 'hidden', opacity: visibleSections.has('cta') ? 1 : 0, transform: visibleSections.has('cta') ? 'scale(1)' : 'scale(0.97)', transition: 'opacity 0.8s ease, transform 0.8s ease' }}>
        <div style={{ position: 'absolute', top: -120, left: -120, width: 360, height: 360, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(0,0,0,0.1)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1280, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <div style={{ height: 68, width: 68, borderRadius: 22, background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Zap size={32} color={C.white} />
          </div>
          <h2 style={{ fontSize: 48, fontWeight: 900, color: C.white, margin: '0 0 16px', letterSpacing: '-0.025em', lineHeight: 1.1 }}>
            Start your free trial today
          </h2>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.78)', fontWeight: 500, margin: '0 auto 40px', lineHeight: 1.7, maxWidth: 520 }}>
            Score every lead, sync Gmail, manage your pipeline, and close more deals — all in one place. Set up in 2 minutes, no credit card required.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
            <button onClick={openSignUp} className="cta-btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '16px 36px', background: C.white, color: C.violetDark, fontSize: 16, fontWeight: 800, borderRadius: 100, border: 'none', cursor: 'pointer', boxShadow: '0 10px 32px rgba(0,0,0,0.22)', fontFamily: 'inherit' }}>
              Start Free Trial <ArrowRight size={17} />
            </button>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', margin: '22px 0 0', fontWeight: 500 }}>
            ✓ 14-day free trial &nbsp;·&nbsp; ✓ No credit card &nbsp;·&nbsp; ✓ Cancel anytime
          </p>
        </div>
      </section>

      {/* ══════════ 13. FOOTER — DARK ══════════ */}
      <footer style={{ background: C.darkBg, borderTop: `1px solid ${C.darkBorder}`, padding: '72px 48px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1.6fr', gap: 48, marginBottom: 56 }}>

            {/* Brand column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ height: 36, width: 36, borderRadius: 10, background: C.violet, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 14px ${C.violet}44` }}>
                  <Activity size={17} color={C.white} strokeWidth={2.5} />
                </div>
                <span style={{ fontSize: 18, fontWeight: 900, color: C.white }}>Pulse<span style={{ color: C.violet }}>CRM</span></span>
              </div>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', fontWeight: 500, lineHeight: 1.75, margin: 0, maxWidth: 280 }}>
                FastAPI + PostgreSQL CRM with transparent AI scoring, Gmail sync, and 40+ REST endpoints. Built for real sales teams.
              </p>
              {/* Real SVG social icons */}
              <div style={{ display: 'flex', gap: 10 }}>
                {/* GitHub */}
                <a href="https://github.com" target="_blank" rel="noopener noreferrer"
                  style={{ height: 38, width: 38, borderRadius: 10, border: `1px solid ${C.darkBorder}`, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', textDecoration: 'none', transition: 'all 0.15s' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = 'rgba(255,255,255,0.08)'; el.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = 'transparent'; el.style.borderColor = C.darkBorder; }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="rgba(255,255,255,0.55)">
                    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                  </svg>
                </a>
                {/* Twitter / X */}
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"
                  style={{ height: 38, width: 38, borderRadius: 10, border: `1px solid ${C.darkBorder}`, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', textDecoration: 'none', transition: 'all 0.15s' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = 'rgba(255,255,255,0.08)'; el.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = 'transparent'; el.style.borderColor = C.darkBorder; }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="rgba(255,255,255,0.55)">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                {/* LinkedIn */}
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"
                  style={{ height: 38, width: 38, borderRadius: 10, border: `1px solid ${C.darkBorder}`, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', textDecoration: 'none', transition: 'all 0.15s' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = 'rgba(255,255,255,0.08)'; el.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = 'transparent'; el.style.borderColor = C.darkBorder; }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="rgba(255,255,255,0.55)">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Link columns */}
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <p style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>{category}</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 11 }}>
                  {links.map(link => (
                    <li key={link}>
                      <button onClick={openSignUp} className="footer-link"
                        style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.55)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', textAlign: 'left' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = C.white; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.55)'; }}>
                        {link}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Newsletter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Stay Updated</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 500, lineHeight: 1.65, margin: 0 }}>
                Get weekly sales insights and Pulse product updates.
              </p>
              <form onSubmit={handleNewsletter} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input
                  type="email"
                  value={newsEmail}
                  onChange={e => setNewsEmail(e.target.value)}
                  placeholder="your@email.com"
                  style={{ padding: '11px 14px', borderRadius: 10, border: `1.5px solid rgba(255,255,255,0.12)`, fontSize: 13, fontFamily: 'inherit', color: C.white, outline: 'none', background: '#1e293b', boxSizing: 'border-box', width: '100%' }}
                />
                <button type="submit"
                  style={{ padding: '11px', background: C.violet, color: C.white, fontSize: 13, fontWeight: 700, borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                  <Mail size={14} /> Subscribe
                </button>
              </form>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 500, margin: 0 }}>
                No spam. Unsubscribe anytime.
              </p>
            </div>
          </div>

          {/* Bottom legal bar */}
          <div style={{ borderTop: `1px solid ${C.darkBorder}`, padding: '22px 0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 500, margin: 0 }}>
              © {new Date().getFullYear()} Pulse CRM, Inc. All rights reserved.
            </p>
            <div style={{ display: 'flex', gap: 20 }}>
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Security'].map(link => (
                <button key={link} onClick={openSignUp}
                  style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0, transition: 'color 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = C.white; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.4)'; }}>
                  {link}
                </button>
              ))}
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse-dot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.85); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInLeft { from { opacity: 0; transform: translateX(-28px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeInRight { from { opacity: 0; transform: translateX(28px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes gradientShift { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        @keyframes countUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes borderPulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(124,58,237,0.4); } 50% { box-shadow: 0 0 0 8px rgba(124,58,237,0); } }

        .hero-left { animation: fadeInLeft 0.8s ease both; }
        .hero-right { animation: fadeInRight 0.9s ease both; animation-delay: 0.15s; }
        .hero-badge { animation: fadeInUp 0.6s ease both; }
        .hero-h1 { animation: fadeInUp 0.7s ease both; animation-delay: 0.1s; }
        .hero-sub { animation: fadeInUp 0.7s ease both; animation-delay: 0.2s; }
        .hero-btns { animation: fadeInUp 0.7s ease both; animation-delay: 0.3s; }
        .hero-trust { animation: fadeInUp 0.7s ease both; animation-delay: 0.4s; }
        .mockup-float { animation: float 5s ease-in-out infinite; }

        .stat-card { animation: countUp 0.6s ease both; }
        .stat-card:nth-child(1) { animation-delay: 0.05s; }
        .stat-card:nth-child(2) { animation-delay: 0.15s; }
        .stat-card:nth-child(3) { animation-delay: 0.25s; }
        .stat-card:nth-child(4) { animation-delay: 0.35s; }

        .feature-card { transition: all 0.25s cubic-bezier(0.4,0,0.2,1); }
        .feature-card:hover { transform: translateY(-6px); box-shadow: 0 20px 48px rgba(124,58,237,0.12) !important; }

        .testimonial-card { transition: all 0.25s cubic-bezier(0.4,0,0.2,1); }
        .testimonial-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,0.1) !important; }

        .cta-btn-primary { transition: all 0.2s cubic-bezier(0.4,0,0.2,1); }
        .cta-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 14px 36px rgba(124,58,237,0.5) !important; }
        .cta-btn-secondary { transition: all 0.2s ease; }
        .cta-btn-secondary:hover { transform: translateY(-2px); background: rgba(255,255,255,0.2) !important; }

        .nav-btn:hover { background: #f5f3ff !important; color: #7c3aed !important; }
        .orbit-node { transition: all 0.2s cubic-bezier(0.4,0,0.2,1); }
        .orbit-node:hover { transform: scale(1.1) !important; }

        .trusted-logo { transition: all 0.2s ease; }
        .trusted-logo:hover { color: #7c3aed !important; }

        .footer-link:hover { color: #ffffff !important; padding-left: 4px; }
        .footer-link { transition: all 0.15s ease; }

        .announce-bar { background: linear-gradient(90deg, #f5f3ff, #ede9fe, #f5f3ff); background-size: 200% auto; animation: shimmer 3s linear infinite; }

        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
      `}</style>

    </div>
  );
}
