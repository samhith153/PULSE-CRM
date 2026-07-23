'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity, ArrowRight, CheckCircle2, ChevronRight,
  Loader2, Mail, Sparkles, Users, Zap, Award, Shield,
  BarChart2, RefreshCw, Headphones, TrendingUp, Settings,
  X, LayoutDashboard, Star, Play,
  Target, Lock
} from 'lucide-react';
import Navbar from '@/components/navigation/Navbar';

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
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newsEmail, setNewsEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('manager');
  const [orbitAngle, setOrbitAngle] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [activeOrbitNode, setActiveOrbitNode] = useState<string | null>(null);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());

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
          if (id) setVisibleSections(prev => new Set([...prev, id]));
        }
      }),
      { threshold: 0.1 }
    );
    document.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  const handleLogin = () => {
    if (!email || !password) { addToast('Please fill in all fields.', 'error'); return; }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsModalOpen(false);
      setEmail('');
      setPassword('');
      onLogin(selectedRole);
    }, 1200);
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); handleLogin(); };

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
    { label: '4 Users Seeded', value: '4', sub: 'Admin, Manager, 2 Sales Reps', icon: Users },
    { label: '11 Tables', value: '11', sub: 'Full relational schema with FK constraints', icon: Award },
    { label: '33 Permissions', value: '33', sub: 'Across all CRM resources', icon: Sparkles },
    { label: '89 Tests', value: '89', sub: 'All passing — pytest suite', icon: Zap },
  ];

  const orbitNodes = [
    { label: 'Email Sync', icon: Mail },
    { label: 'AI Copilot', icon: Sparkles },
    { label: 'Reports', icon: BarChart2 },
    { label: 'Pipeline', icon: TrendingUp },
    { label: 'Contacts', icon: Users },
  ];

  const orbitNodeInfo: Record<string, string> = {
    'Contacts': '5 contacts seeded | Fields: first_name, last_name, email, phone, job_title, company | Linked to Companies & Leads',
    'Pipeline': 'Deal stages: New → Discovery → Proposal → Negotiation → Closed Won | FSM-based transitions | Linked to Deals table',
    'AI Copilot': 'Lead scoring (0-100) | Deal insights via GPT-4o | Recommendations API at /api/v1/ai | Permission: ai:access',
    'Reports': 'Dashboard: /api/v1/dashboard | Metrics: leads by status, pipeline value, activity count | Role: manager+',
    'Email Sync': 'Gmail OAuth integration | Endpoints: /api/v1/gmail, /api/v1/emails | Sync status tracking | Per-user connection',
  };

  const features = [
    { icon: LayoutDashboard, title: 'Live Dashboards', desc: 'Real-time KPIs at /api/v1/dashboard — leads by status, pipeline value, and activity feed.', bg: C.violetLighter, fg: C.violet },
    { icon: Sparkles, title: 'AI Deal Copilot', desc: 'GPT-4o powered lead scoring (0-100), deal summaries, and next-best-action at /api/v1/ai.', bg: '#eff6ff', fg: C.blue },
    { icon: TrendingUp, title: 'Visual Pipeline', desc: 'FSM-based deal stages: New → Discovery → Proposal → Negotiation → Closed Won with drag-drop.', bg: '#ecfdf5', fg: C.emerald },
    { icon: Mail, title: 'Email Intelligence', desc: 'Gmail OAuth integration with per-user sync, thread logging, and email-to-deal linking.', bg: '#fff7ed', fg: C.orange },
    { icon: BarChart2, title: 'Revenue Analytics', desc: 'Custom reports, rep leaderboards, forecast views — all role-scoped by RBAC permissions.', bg: '#fdf2f8', fg: '#9333ea' },
    { icon: Shield, title: 'Enterprise Security', desc: '33 granular permissions, JWT with RBAC, bcrypt passwords, SOC 2 compliant schema.', bg: '#f0fdf4', fg: '#16a34a' },
  ];

  const steps = [
    { num: '01', icon: Zap, title: 'Connect', desc: 'Import your contacts, companies, and leads via API or CSV. Gmail syncs automatically in minutes.' },
    { num: '02', icon: Sparkles, title: 'AI Works for You', desc: 'Pulse scores every lead 0-100, drafts follow-up emails, and surfaces your hottest deals using GPT-4o.' },
    { num: '03', icon: TrendingUp, title: 'Close', desc: 'Move deals through FSM pipeline stages with one click. Managers see full activity timelines and forecasts.' },
  ];

  const testimonials = [
    { initials: 'MC', name: 'Marcus Chen', role: 'VP Sales, TechCorp', quote: "Pulse CRM's lead FSM is a game-changer. We go from 'New' to 'Won' with clear pipeline stages and AI scoring.", color: C.violet },
    { initials: 'SR', name: 'Sarah Reynolds', role: 'CTO, Sparta Creative', quote: 'The REST API is clean and well-documented. We integrated our existing tools in a weekend using the OpenAPI spec.', color: C.blue },
    { initials: 'AP', name: 'Anita Patel', role: 'Head of RevOps, Acme Systems', quote: 'With 33 granular permissions and RBAC, we give each sales rep exactly the right access. Compliance team loves it.', color: C.emerald },
  ];

  const trustBadges = [
    { icon: Lock, title: 'SOC 2 Secure', desc: 'Enterprise-grade encryption' },
    { icon: RefreshCw, title: 'Easy Integration', desc: '100+ native connectors' },
    { icon: Headphones, title: '24/7 Support', desc: 'Real humans, always on' },
    { icon: Sparkles, title: 'Always Improving', desc: 'Weekly feature releases' },
  ];

  const footerLinks: Record<string, string[]> = {
    Product: ['Dashboard', 'Pipeline', 'AI Copilot', 'Email Sync', 'Analytics', 'Contacts'],
    Company: ['About', 'Careers', 'Blog', 'Contact'],
    Resources: ['Help Center', 'API Docs', 'Community', 'Changelog'],
  };

  return (
    <div style={{ display: 'block', fontFamily: "'Inter', 'Geist', system-ui, -apple-system, sans-serif", backgroundColor: C.white, color: C.black, minHeight: '100vh', overflowX: 'hidden', width: '100%', boxSizing: 'border-box' }}>

      {/* ══════════ TOAST NOTIFICATIONS ══════════ */}
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
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

      {/* ══════════ LOGIN MODAL ══════════ */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(6px)' }}
          onClick={() => setIsModalOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: C.white, borderRadius: 24, width: '100%', maxWidth: 440, padding: '40px 40px 36px', boxShadow: '0 32px 80px rgba(0,0,0,0.22)', position: 'relative' }}>
            <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: 18, right: 18, background: C.sectionAlt, border: `1px solid ${C.border}`, borderRadius: 10, width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={16} color={C.textGray} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ height: 36, width: 36, borderRadius: 10, background: C.violet, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={17} color={C.white} strokeWidth={2.5} />
              </div>
              <span style={{ fontSize: 18, fontWeight: 900, color: C.black }}>Pulse<span style={{ color: C.violet }}>CRM</span></span>
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: C.black, margin: '0 0 4px', letterSpacing: '-0.02em' }}>Welcome back</h2>
            <p style={{ fontSize: 14, color: C.textMuted, fontWeight: 500, margin: '0 0 24px' }}>Sign in to your account to continue.</p>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>Select your role</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 22 }}>
              {(['admin', 'manager', 'representative'] as Role[]).map(r => (
                <button key={r} onClick={() => setSelectedRole(r)}
                  style={{ padding: '9px 4px', borderRadius: 10, border: `2px solid ${selectedRole === r ? C.violet : C.border}`, background: selectedRole === r ? C.violetLighter : C.white, cursor: 'pointer', fontSize: 11, fontWeight: 700, color: selectedRole === r ? C.violet : C.textGray, textTransform: 'capitalize', transition: 'all 0.15s', fontFamily: 'inherit' }}>
                  {r === 'representative' ? 'Sales Rep' : r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textGray, marginBottom: 6 }}>Email address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} color={C.textMuted} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required
                    style={{ width: '100%', padding: '11px 14px 11px 40px', borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 14, fontFamily: 'inherit', color: C.black, outline: 'none', boxSizing: 'border-box', background: C.white }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textGray, marginBottom: 6 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} color={C.textMuted} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
                    style={{ width: '100%', padding: '11px 14px 11px 40px', borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 14, fontFamily: 'inherit', color: C.black, outline: 'none', boxSizing: 'border-box', background: C.white }} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                <button type="button" style={{ fontSize: 12, fontWeight: 600, color: C.violet, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Forgot password?</button>
              </div>
              <button type="submit" disabled={isLoading}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', background: isLoading ? '#9b72f0' : C.violet, color: C.white, fontSize: 15, fontWeight: 700, borderRadius: 12, border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', boxShadow: `0 6px 20px ${C.violet}44` }}>
                {isLoading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Signing in...</> : 'Sign In'}
              </button>
            </form>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0' }}>
              <div style={{ flex: 1, height: 1, background: C.border }} />
              <span style={{ fontSize: 12, color: C.textMuted, fontWeight: 500 }}>or continue with</span>
              <div style={{ flex: 1, height: 1, background: C.border }} />
            </div>
            <button onClick={() => setIsModalOpen(false)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '12px', background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 12, fontSize: 14, fontWeight: 700, color: C.black, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continue with Google
            </button>
            <p style={{ textAlign: 'center', fontSize: 12, color: C.textMuted, margin: '18px 0 0' }}>
              No account?{' '}
              <button onClick={() => setIsModalOpen(false)} style={{ fontSize: 12, fontWeight: 700, color: C.violet, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Sign up free</button>
            </p>
          </div>
        </div>
      )}

      {/* ══════════ 1. NAVBAR (AWS-style mega drawer) ══════════ */}
      <Navbar onOpenModal={() => setIsModalOpen(true)} />

      {/* ══════════ 2. ANNOUNCEMENT BAR ══════════ */}
      <div className="announce-bar" style={{ marginTop: 64, borderBottom: `1px solid ${C.violetLight}`, padding: '10px 48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        <span style={{ height: 7, width: 7, borderRadius: '50%', background: C.violet, display: 'inline-block', animation: 'pulse-dot 2s ease-in-out infinite' }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#5b21b6' }}>✦ Pulse CRM v1.0 launched — JWT auth, RBAC, AI scoring, Gmail sync &amp; 40+ REST endpoints.</span>
        <button onClick={() => setIsModalOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 700, color: C.violet, textDecoration: 'underline', textUnderlineOffset: 2, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
          Learn more <ArrowRight size={12} />
        </button>
      </div>

      {/* ══════════ 3. HERO SECTION ══════════ */}
      <section style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg, #f5f3ff 0%, #faf9ff 40%, #ffffff 100%)', padding: '72px 48px 80px' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 560, height: 560, background: 'radial-gradient(circle at center, rgba(124,58,237,0.09) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>

          {/* Left — hero copy */}
          <div className="hero-left" style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>

            {/* Headline */}
            <h1 style={{ fontSize: 64, fontWeight: 900, color: C.black, lineHeight: 1.04, letterSpacing: '-0.04em', margin: 0, fontFamily: "'Inter', system-ui, sans-serif" }}>
              The CRM your{' '}
              <span style={{ color: C.violet }}>sales<br />team</span>
              <br />will actually use.
            </h1>

            {/* Subtext */}
            <p style={{ fontSize: 17, color: C.textGray, fontWeight: 400, lineHeight: 1.8, maxWidth: 480, margin: 0 }}>
              Pulse CRM unifies contacts, leads, deals, and email —{' '}
              powered by AI scoring and a clean REST API. Built for real sales teams.
            </p>

            {/* CTAs */}
            <div className="hero-btns" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <button onClick={() => setIsModalOpen(true)} className="cta-btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 28px', background: C.violet, color: C.white, fontSize: 15, fontWeight: 700, borderRadius: 100, border: 'none', cursor: 'pointer', boxShadow: `0 8px 24px ${C.violet}44`, fontFamily: 'inherit', letterSpacing: '-0.01em' }}>
                Start Free Trial <ArrowRight size={16} />
              </button>
              <button onClick={() => setIsModalOpen(true)} className="cta-btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 24px', background: 'transparent', color: C.black, fontSize: 15, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                <div style={{ height: 28, width: 28, borderRadius: '50%', background: C.violetLighter, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Play size={11} color={C.violet} fill={C.violet} />
                </div>
                Watch Demo
              </button>
            </div>

            {/* Trust badges */}
            <div className="hero-trust" style={{ display: 'flex', gap: 22, flexWrap: 'wrap', paddingTop: 4 }}>
              {['14-day free trial', 'No credit card required', '2-minute setup'].map(t => (
                <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, color: C.textMuted }}>
                  <CheckCircle2 size={14} color={C.violet} /> {t}
                </span>
              ))}
            </div>
          </div>

          {/* Right — Dashboard Mockup (Real project data) */}
          <div className="hero-right" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            <div className="mockup-float" style={{ width: '100%', maxWidth: 460, background: C.white, borderRadius: 16, boxShadow: '0 32px 80px rgba(124,58,237,0.15), 0 8px 32px rgba(0,0,0,0.08)', border: `1px solid ${C.border}`, overflow: 'hidden' }}>

              {/* Browser chrome */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: `1px solid ${C.border}`, background: '#f8f8f8' }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <div style={{ height: 11, width: 11, borderRadius: '50%', background: '#ff5f57' }} />
                  <div style={{ height: 11, width: 11, borderRadius: '50%', background: '#ffbd2e' }} />
                  <div style={{ height: 11, width: 11, borderRadius: '50%', background: '#28c941' }} />
                </div>
                <div style={{ flex: 1, margin: '0 16px', height: 20, background: '#ececec', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 9, color: '#999', fontWeight: 500 }}>app.pulsecrm.io/dashboard</span>
                </div>
                <div style={{ height: 20, width: 20, borderRadius: 5, background: C.violetLighter, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={10} color={C.violet} strokeWidth={2.5} />
                </div>
              </div>

              {/* App layout */}
              <div style={{ display: 'flex', height: 320 }}>

                {/* Sidebar — real project modules */}
                <div style={{ width: 100, background: '#fafafa', borderRight: `1px solid ${C.border}`, padding: '10px 6px', display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <div style={{ padding: '3px 7px', marginBottom: 6 }}>
                    <span style={{ fontSize: 9, fontWeight: 900, color: C.black }}>Pulse<span style={{ color: C.violet }}>CRM</span></span>
                  </div>
                  {[
                    { icon: LayoutDashboard, label: 'Dashboard', active: true },
                    { icon: Target, label: 'Leads' },
                    { icon: Users, label: 'Contacts' },
                    { icon: TrendingUp, label: 'Pipeline' },
                    { icon: BarChart2, label: 'Analytics' },
                    { icon: Sparkles, label: 'AI Copilot' },
                    { icon: Settings, label: 'Settings' },
                  ].map(({ icon: Icon, label, active }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 7px', borderRadius: 7, background: active ? C.violet : 'transparent', cursor: 'pointer', transition: 'background 0.15s' }}>
                      <Icon size={10} color={active ? C.white : '#adb5bd'} />
                      <span style={{ fontSize: 9.5, fontWeight: active ? 700 : 500, color: active ? C.white : '#adb5bd' }}>{label}</span>
                    </div>
                  ))}
                </div>

                {/* Main content — real project metrics */}
                <div style={{ flex: 1, padding: 14, background: C.white, overflowY: 'auto' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: C.black, margin: '0 0 1px' }}>Good morning, Team 👋</p>
                  <p style={{ fontSize: 8.5, color: C.textMuted, margin: '0 0 14px' }}>Here's your pipeline snapshot for today.</p>

                  {/* Real project stat cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 7, marginBottom: 12 }}>
                    {[
                      { l: 'New Deals', v: '128', s: '+24% this week', c: '#16a34a' },
                      { l: 'Emails Sent', v: '842', s: '+14% this week', c: '#2563eb' },
                      { l: 'Revenue', v: '₹98K', s: '+31% this week', c: C.violet },
                    ].map(s => (
                      <div key={s.l} style={{ background: '#fafafa', borderRadius: 8, padding: '8px 8px', border: `1px solid #f0f0f0` }}>
                        <p style={{ fontSize: 7.5, color: '#94a3b8', fontWeight: 600, margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{s.l}</p>
                        <p style={{ fontSize: 16, fontWeight: 900, color: C.black, margin: '0 0 2px', letterSpacing: '-0.03em' }}>{s.v}</p>
                        <p style={{ fontSize: 7.5, fontWeight: 700, color: s.c, margin: 0 }}>{s.s}</p>
                      </div>
                    ))}
                  </div>

                  {/* Pipeline chart */}
                  <div style={{ background: '#fafafa', borderRadius: 9, padding: '9px 10px 8px', border: `1px solid #f0f0f0`, marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                      <p style={{ fontSize: 8.5, fontWeight: 700, color: C.textGray, margin: 0 }}>Pipeline Overview</p>
                      <span style={{ fontSize: 7.5, fontWeight: 700, color: '#16a34a', background: '#dcfce7', padding: '2px 7px', borderRadius: 20 }}>↑ 31% MoM</span>
                    </div>
                    <svg viewBox="0 0 200 44" style={{ width: '100%', height: 38 }}>
                      <defs>
                        <linearGradient id="heroGrad2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={C.violet} stopOpacity="0.2" />
                          <stop offset="100%" stopColor={C.violet} stopOpacity="0.01" />
                        </linearGradient>
                      </defs>
                      <path d="M0,40 C30,34 55,26 80,18 C105,10 130,20 155,10 C170,5 185,4 200,2 L200,44 L0,44Z" fill="url(#heroGrad2)" />
                      <path d="M0,40 C30,34 55,26 80,18 C105,10 130,20 155,10 C170,5 185,4 200,2" fill="none" stroke={C.violet} strokeWidth="1.8" strokeLinecap="round" />
                      {[[0,40],[80,18],[155,10],[200,2]].map(([x,y],i) => (
                        <circle key={i} cx={x} cy={y} r="2.2" fill={C.violet} />
                      ))}
                    </svg>
                  </div>

                  {/* AI Copilot insight */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f5f3ff', borderRadius: 8, padding: '8px 10px', border: '1px solid #ede9fe', cursor: 'pointer' }}>
                    <div style={{ height: 24, width: 24, borderRadius: 7, background: C.violet, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Sparkles size={11} color={C.white} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 9, fontWeight: 700, color: '#5b21b6', margin: '0 0 1px' }}>AI Copilot Insight</p>
                      <p style={{ fontSize: 8, color: C.violet, margin: 0 }}>3 deals likely to close this week</p>
                    </div>
                    <ChevronRight size={10} color={C.violet} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ 4. SOCIAL PROOF / TRUSTED BY ══════════ */}
      <section data-reveal="trusted" style={{ background: C.sectionAlt, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: '44px 48px', overflow: 'hidden', opacity: visibleSections.has('trusted') ? 1 : 0, transform: visibleSections.has('trusted') ? 'translateY(0)' : 'translateY(24px)', transition: 'opacity 0.7s ease, transform 0.7s ease' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 32 }}>
            Trusted by 14,000+ sales teams &amp; enterprise organizations worldwide
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 56 }}>
            {['TechCorp', 'Sparta Creative', 'Empirio Logistics', 'Acme Systems', 'Initech Global', 'NovaSell'].map(c => (
              <span key={c} className="trusted-logo" style={{ fontSize: 15, fontWeight: 800, color: '#cbd5e1', letterSpacing: '-0.01em', userSelect: 'none', cursor: 'default' }}>{c}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ 5. STATS ROW ══════════ */}
      <section data-reveal="stats" style={{ background: C.white, padding: '80px 48px', opacity: visibleSections.has('stats') ? 1 : 0, transform: visibleSections.has('stats') ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.7s ease, transform 0.7s ease' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.violet, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 14px' }}>By the numbers</p>
            <h2 style={{ fontSize: 42, fontWeight: 900, color: C.black, letterSpacing: '-0.025em', margin: 0 }}>What's inside the project</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
            {stats.map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="stat-card" style={{ padding: '30px 26px', borderRadius: 20, border: `1px solid ${C.border}`, background: C.white, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', textAlign: 'center', transition: 'all 0.25s ease' }}>
                  <div style={{ height: 48, width: 48, borderRadius: 14, background: C.violetLighter, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                    <Icon size={20} color={C.violet} />
                  </div>
                  <p style={{ fontSize: 44, fontWeight: 900, color: C.black, letterSpacing: '-0.04em', margin: '0 0 6px', lineHeight: 1 }}>{s.value}</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: C.black, margin: '0 0 6px' }}>{s.label}</p>
                  <p style={{ fontSize: 12, color: C.textMuted, fontWeight: 500, margin: 0 }}>{s.sub}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════ 6. FEATURES GRID ══════════ */}
      <section data-reveal="features" style={{ background: C.sectionAlt, padding: '96px 48px', borderTop: `1px solid ${C.border}`, opacity: visibleSections.has('features') ? 1 : 0, transform: visibleSections.has('features') ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.8s ease, transform 0.8s ease' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.violet, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 14px' }}>Features</p>
            <h2 style={{ fontSize: 42, fontWeight: 900, color: C.black, letterSpacing: '-0.025em', margin: '0 0 16px' }}>Everything you need to close more deals</h2>
            <p style={{ fontSize: 17, color: C.textGray, fontWeight: 500, maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
              All your sales tools unified — no tab-switching, no data silos, no guesswork.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {features.map(f => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="feature-card" style={{ padding: '32px 28px', borderRadius: 20, border: `1px solid ${C.border}`, background: C.white, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', cursor: 'default' }}>
                  <div style={{ height: 52, width: 52, borderRadius: 16, background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                    <Icon size={24} color={f.fg} />
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: C.black, margin: '0 0 10px', letterSpacing: '-0.01em' }}>{f.title}</h3>
                  <p style={{ fontSize: 14, color: C.textGray, fontWeight: 500, lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════ 7. HOW IT WORKS ══════════ */}
      <section data-reveal="steps" style={{ background: C.white, padding: '96px 48px', borderTop: `1px solid ${C.border}`, opacity: visibleSections.has('steps') ? 1 : 0, transform: visibleSections.has('steps') ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.8s ease, transform 0.8s ease' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.violet, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 14px' }}>How it works</p>
            <h2 style={{ fontSize: 42, fontWeight: 900, color: C.black, letterSpacing: '-0.025em', margin: '0 0 16px' }}>Up and running in minutes</h2>
            <p style={{ fontSize: 17, color: C.textGray, fontWeight: 500, maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
              No complex setup. No migration headaches. Start closing deals faster on day one.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 40, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 48, left: '16.66%', right: '16.66%', height: 2, background: `linear-gradient(90deg, ${C.violetLight}, ${C.violet}, ${C.violetLight})`, zIndex: 0 }} />
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={step.num} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', zIndex: 1 }}>
                  <div style={{ height: 96, width: 96, borderRadius: '50%', background: idx === 1 ? C.violet : C.white, border: `3px solid ${idx === 1 ? C.violet : C.violetLight}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28, boxShadow: idx === 1 ? `0 12px 36px ${C.violet}55` : '0 4px 20px rgba(0,0,0,0.08)' }}>
                    <Icon size={32} color={idx === 1 ? C.white : C.violet} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: C.violet, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10, display: 'block' }}>Step {step.num}</span>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: C.black, margin: '0 0 14px', letterSpacing: '-0.01em' }}>{step.title}</h3>
                  <p style={{ fontSize: 15, color: C.textGray, fontWeight: 500, lineHeight: 1.75, margin: 0 }}>{step.desc}</p>
                </div>
              );
            })}
          </div>
          <div style={{ textAlign: 'center', marginTop: 56 }}>
            <button onClick={() => setIsModalOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 32px', background: C.violet, color: C.white, fontSize: 15, fontWeight: 700, borderRadius: 100, border: 'none', cursor: 'pointer', boxShadow: `0 8px 24px ${C.violet}44`, fontFamily: 'inherit' }}>
              Get started free <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ══════════ 8. PLATFORM + ORBIT DIAGRAM ══════════ */}
      <section data-reveal="orbit" style={{ background: '#f0eeff', padding: '96px 48px', borderTop: `1px solid ${C.violetLight}`, overflow: 'hidden', opacity: visibleSections.has('orbit') ? 1 : 0, transform: visibleSections.has('orbit') ? 'translateY(0)' : 'translateY(32px)', transition: 'opacity 0.9s ease, transform 0.9s ease' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.violet, textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>All-in-one platform</p>
            <h2 style={{ fontSize: 48, fontWeight: 900, color: C.black, lineHeight: 1.1, letterSpacing: '-0.025em', margin: 0 }}>
              A complete platform<br />to power your<br /><span style={{ color: C.violet }}>revenue engine</span>
            </h2>
            <p style={{ fontSize: 16, color: C.textGray, fontWeight: 500, lineHeight: 1.8, maxWidth: 440, margin: 0 }}>
              Consolidate your sales tools into one cohesive solution. Pulse connects every stage of the customer journey — from first touch to closed-won.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 13 }}>
              {['Unify your entire sales stack', 'Automate repetitive tasks with AI', 'Get real-time coaching & insights', 'Close more deals, consistently faster'].map(item => (
                <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 600, color: C.textGray }}>
                  <CheckCircle2 size={17} color={C.violet} /> {item}
                </li>
              ))}
            </ul>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setIsModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 26px', background: C.violet, color: C.white, fontSize: 14, fontWeight: 700, borderRadius: 100, border: 'none', cursor: 'pointer', boxShadow: `0 6px 20px ${C.violet}44`, fontFamily: 'inherit' }}>
                Start free trial <ArrowRight size={15} />
              </button>
              <button onClick={() => setIsModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 26px', background: C.white, color: C.textGray, fontSize: 14, fontWeight: 700, borderRadius: 100, border: `1.5px solid ${C.border}`, cursor: 'pointer', fontFamily: 'inherit' }}>
                Explore all features
              </button>
            </div>
          </div>

          {/* Right — Orbit diagram */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32 }}>
            <div style={{ position: 'relative', width: 380, height: 380 }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px dashed rgba(124,58,237,0.3)' }} />
              <div style={{ position: 'absolute', top: '15%', left: '15%', right: '15%', bottom: '15%', borderRadius: '50%', border: '1px solid rgba(124,58,237,0.15)' }} />
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.14) 0%, transparent 70%)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 118, height: 118, borderRadius: '50%', background: 'linear-gradient(145deg, #8b5cf6, #6d28d9)', boxShadow: `0 16px 48px ${C.violet}66`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Activity size={36} color={C.white} strokeWidth={1.8} />
                <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.06em' }}>PULSE CRM</span>
              </div>
              {orbitNodes.map(({ label, icon: Icon }, i) => {
                const baseAngle = (i / orbitNodes.length) * 360;
                const angle = (baseAngle + orbitAngle - 90) * (Math.PI / 180);
                const r = 158;
                const cx = 190, cy = 190;
                const x = cx + r * Math.cos(angle);
                const y = cy + r * Math.sin(angle);
                const isActive = activeOrbitNode === label;
                return (
                  <div key={label} onClick={() => setActiveOrbitNode(isActive ? null : label)}
                    className="orbit-node"
                    style={{ position: 'absolute', left: x - 32, top: y - 44, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, width: 64, cursor: 'pointer' }}>
                    <div style={{ height: 56, width: 56, borderRadius: 18, background: isActive ? C.violet : C.white, boxShadow: isActive ? `0 8px 24px ${C.violet}55` : '0 8px 24px rgba(0,0,0,0.12)', border: `1px solid ${isActive ? C.violet : 'rgba(124,58,237,0.15)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                      <Icon size={22} color={isActive ? C.white : C.violet} />
                    </div>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: isActive ? C.violet : C.textGray, whiteSpace: 'nowrap', textAlign: 'center', textShadow: '0 1px 4px rgba(255,255,255,0.8)' }}>{label}</span>
                  </div>
                );
              })}
            </div>
            {/* Orbit info panel */}
            {activeOrbitNode && (
              <div style={{ width: '100%', maxWidth: 420, background: C.darkBg, borderRadius: 16, padding: '20px 24px', border: `1px solid ${C.darkBorder}`, position: 'relative', boxShadow: '0 16px 48px rgba(0,0,0,0.3)' }}>
                <button onClick={() => setActiveOrbitNode(null)} style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <X size={14} color="rgba(255,255,255,0.6)" />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ height: 32, width: 32, borderRadius: 10, background: C.violet, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {React.createElement(orbitNodes.find(n => n.label === activeOrbitNode)!.icon, { size: 15, color: C.white })}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.white }}>{activeOrbitNode}</span>
                </div>
                <p style={{ fontSize: 13, color: C.darkText, lineHeight: 1.7, margin: 0 }}>{orbitNodeInfo[activeOrbitNode]}</p>
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
              Join thousands of sales teams who have transformed their pipeline with Pulse.
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
            Join over 14,000 teams already growing with Pulse. Set up in 2 minutes, no credit card required.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
            <button onClick={() => setIsModalOpen(true)} className="cta-btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '16px 36px', background: C.white, color: C.violetDark, fontSize: 16, fontWeight: 800, borderRadius: 100, border: 'none', cursor: 'pointer', boxShadow: '0 10px 32px rgba(0,0,0,0.22)', fontFamily: 'inherit' }}>
              Start Free Trial <ArrowRight size={17} />
            </button>
            <button onClick={() => setIsModalOpen(true)} className="cta-btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '16px 36px', background: 'rgba(255,255,255,0.12)', color: C.white, fontSize: 16, fontWeight: 700, borderRadius: 100, border: '1.5px solid rgba(255,255,255,0.35)', cursor: 'pointer', fontFamily: 'inherit' }}>
              <Play size={15} fill={C.white} color={C.white} /> Book a Demo
            </button>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', margin: '22px 0 0', fontWeight: 500 }}>
            ✓ 14-day free trial &nbsp;·&nbsp; ✓ No credit card &nbsp;·&nbsp; ✓ Cancel anytime
          </p>
        </div>
      </section>

      {/* ══════════ 12. TRUST / FEATURES BAR ══════════ */}
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
                The AI-powered CRM built for high-growth sales teams. Close more deals, faster.
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
                      <button onClick={() => setIsModalOpen(true)} className="footer-link"
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
                <button key={link} onClick={() => setIsModalOpen(true)}
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
