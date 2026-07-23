'use client';

import React, { useState } from 'react';
import {
  Activity, ArrowRight, CheckCircle2, ChevronDown, ChevronRight,
  Loader2, Mail, Sparkles, Users, Zap, Award, Shield,
  BarChart2, RefreshCw, Headphones, TrendingUp, Settings,
  Globe, X, LayoutDashboard
} from 'lucide-react';

interface PulseLandingPageProps {
  onLogin: (role: 'representative' | 'manager' | 'admin') => void;
}

export default function PulseLandingPage({ onLogin }: PulseLandingPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'representative' | 'manager' | 'admin'>('manager');

  const handleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsModalOpen(false);
      onLogin(selectedRole);
    }, 1200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin();
  };

  const stats = [
    { label: 'Active Business Seats', value: '14,820+', sub: '+10.4% quarterly growth', icon: Users },
    { label: 'Deals Closed Natively', value: '432,050+', sub: '$124M total pipeline value', icon: Award },
    { label: 'AI Prediction Accuracy', value: '98.4%', sub: '1.2s avg response latency', icon: Sparkles },
    { label: 'Pipeline Velocity Boost', value: '3.4x', sub: 'Saves 8.2 hrs / rep / week', icon: Zap },
  ];

  const platformFeatures = [
    { icon: Shield, title: 'Secure & Reliable', desc: 'Enterprise-grade security you can trust.', bg: 'bg-violet-50', color: 'text-violet-600' },
    { icon: RefreshCw, title: 'Easy Integration', desc: 'Integrates seamlessly with your favourite tools.', bg: 'bg-blue-50', color: 'text-blue-600' },
    { icon: Headphones, title: 'Dedicated Support', desc: '24/7 expert support when you need it.', bg: 'bg-emerald-50', color: 'text-emerald-600' },
    { icon: TrendingUp, title: 'Always Improving', desc: 'Regular updates with new features.', bg: 'bg-orange-50', color: 'text-orange-600' },
  ];

  const orbitItems = [
    { label: 'Email Sync', icon: Mail, angle: 0 },
    { label: 'AI Copilot', icon: Sparkles, angle: 72 },
    { label: 'Reports', icon: BarChart2, angle: 144 },
    { label: 'Pipeline', icon: TrendingUp, angle: 216 },
    { label: 'Contacts', icon: Users, angle: 288 },
  ];

  const footerLinks = {
    Product: ['Features', 'Pricing', 'Integrations', 'Changelog'],
    Company: ['About Us', 'Careers', 'Blog', 'Contact'],
    Resources: ['Help Center', 'Guides', 'Webinars', 'API Docs'],
  };

  return (
    <div style={{ all: 'initial', display: 'block', fontFamily: 'Inter, system-ui, sans-serif' }}>
    <div className="min-h-screen w-full bg-white text-slate-900 overflow-x-hidden" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>

      {/* ── NAVBAR ─────────────────────────────────────── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, backgroundColor: 'rgba(255,255,255,0.97)', borderBottom: '1px solid #f1f5f9', backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 40px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <div style={{ height: 34, width: 34, borderRadius: 10, background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(124,58,237,0.35)' }}>
              <Activity size={16} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>Pulse</span>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#7c3aed', letterSpacing: '-0.02em' }}>CRM</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.12em', marginLeft: 4 }}>AI Revenue Engine</span>
          </div>

          {/* Nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {['Product', 'Solutions', 'Pricing', 'Resources'].map((item) => (
              <button key={item} style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '6px 12px', borderRadius: 8, border: 'none', background: 'transparent', fontSize: 14, fontWeight: 600, color: '#475569', cursor: 'pointer' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#f8fafc'; (e.currentTarget as HTMLButtonElement).style.color = '#0f172a'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#475569'; }}>
                {item}
                <ChevronDown size={12} color="#94a3b8" />
              </button>
            ))}
          </nav>

          {/* Auth */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setIsModalOpen(true)} style={{ fontSize: 14, fontWeight: 600, color: '#475569', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 12px' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#7c3aed'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#475569'; }}>
              Log In
            </button>
            <button onClick={() => setIsModalOpen(true)} style={{ padding: '8px 22px', background: '#7c3aed', color: '#fff', fontSize: 14, fontWeight: 700, borderRadius: 100, border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#6d28d9'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#7c3aed'; }}>
              Register
            </button>
          </div>
        </div>
      </header>

      {/* ── ANNOUNCEMENT ───────────────────────────────── */}
      <div style={{ background: '#f5f3ff', borderBottom: '1px solid #ede9fe', padding: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <span style={{ height: 6, width: 6, borderRadius: '50%', background: '#7c3aed', display: 'inline-block', animation: 'pulse 2s infinite' }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: '#5b21b6' }}>✦ Pulse CRM 2.0 is now live</span>
        <a href="#" onClick={() => setIsModalOpen(true)} style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: 3 }}>
          Learn more <ArrowRight size={11} />
        </a>
      </div>


      {/* ── HERO ───────────────────────────────────────── */}
      <section style={{ background: 'linear-gradient(135deg, #faf5ff 0%, #ffffff 50%, #ffffff 100%)', padding: '80px 40px 64px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: 400, height: 400, background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>

          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 100, width: 'fit-content' }}>
              <span style={{ height: 6, width: 6, borderRadius: '50%', background: '#7c3aed', display: 'inline-block' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#5b21b6' }}>Pulse CRM 2.0 is now live</span>
              <ChevronRight size={12} color="#7c3aed" />
            </div>

            <h1 style={{ fontSize: 60, fontWeight: 900, color: '#0f172a', lineHeight: 1.06, letterSpacing: '-0.03em', margin: 0 }}>
              The intelligent CRM<br />
              built for{' '}
              <span style={{ color: '#7c3aed' }}>high-growth</span>
              <br />teams.
            </h1>

            <p style={{ fontSize: 18, color: '#64748b', fontWeight: 500, lineHeight: 1.7, maxWidth: 480, margin: 0 }}>
              Pulse unifies deal pipelines, automated email syncing, rep leaderboards, and real-time AI copilot assistance into one intuitive, high-performance workspace.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button onClick={() => setIsModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 28px', background: '#7c3aed', color: '#fff', fontSize: 14, fontWeight: 700, borderRadius: 100, border: 'none', cursor: 'pointer', boxShadow: '0 8px 24px rgba(124,58,237,0.35)' }}>
                Start 14-Day Free Trial <ArrowRight size={16} />
              </button>
              <button onClick={() => setIsModalOpen(true)} style={{ padding: '14px 28px', background: '#fff', color: '#374151', fontSize: 14, fontWeight: 700, borderRadius: 100, border: '1.5px solid #e2e8f0', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                Book Live Demo
              </button>
            </div>

            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {['14-day free trial', 'No credit card required', '2-minute setup'].map((t) => (
                <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#64748b' }}>
                  <CheckCircle2 size={15} color="#7c3aed" />
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Right – Dashboard Mockup */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 20, boxShadow: '0 24px 64px rgba(0,0,0,0.12)', border: '1px solid #f1f5f9', overflow: 'hidden' }}>
              {/* top bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ height: 24, width: 24, borderRadius: 7, background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Activity size={12} color="#fff" strokeWidth={2.5} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#1e293b' }}>Pulse CRM</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ height: 14, width: 14, borderRadius: '50%', background: '#e2e8f0' }} />
                  <div style={{ height: 14, width: 14, borderRadius: '50%', background: '#e2e8f0' }} />
                  <div style={{ height: 24, width: 24, borderRadius: '50%', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={11} color="#7c3aed" />
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex' }}>
                {/* sidebar */}
                <div style={{ width: 110, background: '#f8fafc', borderRight: '1px solid #f1f5f9', padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {[
                    { icon: LayoutDashboard, label: 'Dashboard', active: true },
                    { icon: Zap, label: 'Leads' },
                    { icon: Users, label: 'Contacts' },
                    { icon: Activity, label: 'Activities' },
                    { icon: BarChart2, label: 'Reports' },
                    { icon: Sparkles, label: 'AI Copilot' },
                    { icon: Settings, label: 'Settings' },
                  ].map(({ icon: Icon, label, active }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 8, background: active ? '#7c3aed' : 'transparent', cursor: 'pointer' }}>
                      <Icon size={11} color={active ? '#fff' : '#94a3b8'} />
                      <span style={{ fontSize: 9.5, fontWeight: 600, color: active ? '#fff' : '#94a3b8' }}>{label}</span>
                    </div>
                  ))}
                </div>
                {/* content */}
                <div style={{ flex: 1, padding: 12, background: '#fff' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#1e293b', margin: '0 0 2px' }}>Welcome back, Team! 👋</p>
                  <p style={{ fontSize: 9, color: '#94a3b8', margin: '0 0 12px' }}>Here's what's happening with your pipeline today.</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                    {[
                      { label: 'New Deals', val: '128', sub: '+24%', c: '#059669' },
                      { label: 'Emails Sent', val: '842', sub: '+14%', c: '#2563eb' },
                      { label: 'Deals Closed', val: '$98.4K', sub: '+31%', c: '#7c3aed' },
                    ].map((s) => (
                      <div key={s.label} style={{ background: '#f8fafc', borderRadius: 10, padding: 8, border: '1px solid #f1f5f9' }}>
                        <p style={{ fontSize: 7.5, color: '#94a3b8', fontWeight: 600, margin: '0 0 3px' }}>{s.label}</p>
                        <p style={{ fontSize: 14, fontWeight: 900, color: '#1e293b', margin: '0 0 2px' }}>{s.val}</p>
                        <p style={{ fontSize: 8, fontWeight: 700, color: s.c, margin: 0 }}>{s.sub} this week</p>
                      </div>
                    ))}
                  </div>
                  {/* chart */}
                  <div style={{ background: '#f8fafc', borderRadius: 10, padding: 10, border: '1px solid #f1f5f9', marginBottom: 8 }}>
                    <p style={{ fontSize: 8, fontWeight: 700, color: '#64748b', margin: '0 0 8px' }}>Pipeline Overview</p>
                    <svg viewBox="0 0 200 50" style={{ width: '100%', height: 40 }}>
                      <defs>
                        <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path d="M0,45 C30,38 60,28 90,20 C120,12 150,18 180,8 L200,5 L200,50 L0,50Z" fill="url(#cg)" />
                      <path d="M0,45 C30,38 60,28 90,20 C120,12 150,18 180,8 L200,5" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                  {/* AI badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f5f3ff', borderRadius: 10, padding: '8px 10px', border: '1px solid #ede9fe' }}>
                    <Sparkles size={12} color="#7c3aed" />
                    <div>
                      <p style={{ fontSize: 9, fontWeight: 700, color: '#5b21b6', margin: '0 0 1px' }}>AI Copilot</p>
                      <p style={{ fontSize: 8, color: '#7c3aed', margin: 0 }}>Deal insights ready</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ── TRUSTED BY ─────────────────────────────────── */}
      <section style={{ background: '#f8fafc', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', padding: '40px 40px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 24 }}>
            Trusted by fast-growing sales teams &amp; enterprise organizations
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 48 }}>
            {['TechCorp', 'Sparta Creative', 'Empirio Logistics', 'Acme Systems', 'Initech Global'].map((c) => (
              <span key={c} style={{ fontSize: 15, fontWeight: 800, color: '#94a3b8', letterSpacing: '-0.01em', cursor: 'default' }}>{c}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ──────────────────────────────────────── */}
      <section style={{ background: '#fff', padding: '64px 40px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} style={{ padding: 24, borderRadius: 20, border: '1px solid #f1f5f9', background: '#fff', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', maxWidth: 100, margin: 0, lineHeight: 1.4 }}>{s.label}</p>
                  <div style={{ height: 36, width: 36, borderRadius: 12, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={16} color="#7c3aed" />
                  </div>
                </div>
                <p style={{ fontSize: 38, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', margin: '0 0 4px' }}>{s.value}</p>
                <p style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500, margin: 0 }}>{s.sub}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── PLATFORM ───────────────────────────────────── */}
      <section style={{ background: '#fafafa', padding: '96px 40px', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
          {/* left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>All-in-one platform</p>
            <h2 style={{ fontSize: 48, fontWeight: 900, color: '#0f172a', lineHeight: 1.1, letterSpacing: '-0.02em', margin: 0 }}>
              A complete platform<br />to power your<br />
              <span style={{ color: '#7c3aed' }}>revenue engine</span>
            </h2>
            <p style={{ fontSize: 16, color: '#64748b', fontWeight: 500, lineHeight: 1.7, maxWidth: 420, margin: 0 }}>
              Consolidate your tools into one cohesive solution. Pulse connects every stage of your customer journey from lead intake to deal closing.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {['Unify your sales tools', 'Automate repetitive tasks', 'Get real-time insights', 'Close more deals, faster'].map((item) => (
                <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 600, color: '#374151' }}>
                  <CheckCircle2 size={16} color="#7c3aed" />
                  {item}
                </li>
              ))}
            </ul>
            <button onClick={() => setIsModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 100, fontSize: 14, fontWeight: 700, color: '#374151', cursor: 'pointer', width: 'fit-content', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              Explore all features <ArrowRight size={15} color="#7c3aed" />
            </button>
          </div>

          {/* right – orbit */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: 320, height: 320 }}>
              {/* ring */}
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px dashed #ddd6fe' }} />
              {/* center */}
              <div style={{ position: 'absolute', top: '30%', left: '30%', right: '30%', bottom: '30%', borderRadius: '50%', background: '#7c3aed', boxShadow: '0 16px 40px rgba(124,58,237,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={40} color="#fff" strokeWidth={1.8} />
              </div>
              {/* orbit nodes */}
              {orbitItems.map(({ label, icon: Icon, angle }) => {
                const rad = (angle - 90) * (Math.PI / 180);
                const r = 138;
                const cx = 160, cy = 160;
                const x = cx + r * Math.cos(rad) - 28;
                const y = cy + r * Math.sin(rad) - 28;
                return (
                  <div key={label} style={{ position: 'absolute', left: x, top: y, width: 56, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ height: 48, width: 48, borderRadius: 16, background: '#fff', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={20} color="#7c3aed" />
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap' }}>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>


      {/* ── CTA BANNER ─────────────────────────────────── */}
      <section style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)', padding: '64px 40px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -80, left: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, right: -60, width: 260, height: 260, borderRadius: '50%', background: 'rgba(0,0,0,0.1)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 40, flexWrap: 'wrap', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ height: 56, width: 56, borderRadius: 18, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Zap size={28} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 0 4px' }}>Ready to transform your sales?</h3>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', fontWeight: 500, margin: 0 }}>Join thousands of teams already growing with Pulse CRM.</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <button onClick={() => setIsModalOpen(true)} style={{ padding: '13px 28px', background: '#fff', color: '#6d28d9', fontSize: 14, fontWeight: 800, borderRadius: 100, border: 'none', cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
              Start Free Trial
            </button>
            <button onClick={() => setIsModalOpen(true)} style={{ padding: '13px 28px', background: 'rgba(255,255,255,0.12)', color: '#fff', fontSize: 14, fontWeight: 700, borderRadius: 100, border: '1.5px solid rgba(255,255,255,0.35)', cursor: 'pointer' }}>
              Book Demo
            </button>
          </div>
        </div>
      </section>

      {/* ── FEATURES BAR ───────────────────────────────── */}
      <section style={{ background: '#fff', borderTop: '1px solid #f1f5f9', padding: '48px 40px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32 }}>
          {platformFeatures.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ height: 38, width: 38, borderRadius: 12, background: f.bg === 'bg-violet-50' ? '#f5f3ff' : f.bg === 'bg-blue-50' ? '#eff6ff' : f.bg === 'bg-emerald-50' ? '#ecfdf5' : '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={16} color={f.color === 'text-violet-600' ? '#7c3aed' : f.color === 'text-blue-600' ? '#2563eb' : f.color === 'text-emerald-600' ? '#059669' : '#ea580c'} />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 4px' }}>{f.title}</p>
                  <p style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500, margin: 0, lineHeight: 1.5 }}>{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>


      {/* ── FOOTER ─────────────────────────────────────── */}
      <footer style={{ background: '#fff', borderTop: '1px solid #f1f5f9', padding: '56px 40px 32px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr', gap: 40, marginBottom: 40 }}>
            {/* brand */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ height: 32, width: 32, borderRadius: 10, background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={15} color="#fff" strokeWidth={2.5} />
                </div>
                <span style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>Pulse <span style={{ color: '#7c3aed' }}>CRM</span></span>
              </div>
              <p style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500, lineHeight: 1.6, maxWidth: 220, margin: 0 }}>The intelligent CRM built for high-growth teams.</p>
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  <path key="fb" d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />,
                  <path key="tw" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />,
                  <><path key="li1" d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" /><rect key="li2" x="2" y="9" width="4" height="12" /><circle key="li3" cx="4" cy="4" r="2" /></>,
                ].map((icon, i) => (
                  <a key={i} href="#" style={{ height: 32, width: 32, borderRadius: 9, background: '#f8fafc', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#94a3b8', textDecoration: 'none' }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 14, height: 14 }}>{icon}</svg>
                  </a>
                ))}
              </div>
            </div>

            {/* link cols */}
            {Object.entries(footerLinks).map(([section, links]) => (
              <div key={section} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>{section}</p>
                {links.map((link) => (
                  <a key={link} href="#" style={{ fontSize: 13, color: '#64748b', fontWeight: 500, textDecoration: 'none' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#0f172a'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#64748b'; }}>
                    {link}
                  </a>
                ))}
              </div>
            ))}

            {/* newsletter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Stay updated</p>
              <p style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500, lineHeight: 1.6, margin: 0 }}>Get the latest updates and insights delivered to your inbox.</p>
              <div style={{ display: 'flex' }}>
                <input type="email" placeholder="Enter your email" style={{ flex: 1, fontSize: 12, padding: '9px 14px', border: '1.5px solid #e2e8f0', borderRight: 'none', borderRadius: '10px 0 0 10px', outline: 'none', color: '#374151', background: '#fff' }} />
                <button onClick={() => setIsModalOpen(true)} style={{ padding: '9px 14px', background: '#7c3aed', border: 'none', borderRadius: '0 10px 10px 0', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <ArrowRight size={14} color="#fff" />
                </button>
              </div>
            </div>
          </div>

          {/* bottom bar */}
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <p style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500, margin: 0 }}>© 2024 Pulse CRM. All rights reserved.</p>
            <div style={{ display: 'flex', gap: 24 }}>
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((t) => (
                <a key={t} href="#" style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, textDecoration: 'none' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#374151'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#94a3b8'; }}>
                  {t}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>


      {/* ── LOGIN MODAL ─────────────────────────────────── */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)' }} onClick={() => setIsModalOpen(false)} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 440, background: '#fff', borderRadius: 24, boxShadow: '0 32px 80px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
            {/* header */}
            <div style={{ padding: '24px 24px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ height: 36, width: 36, borderRadius: 11, background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={16} color="#fff" strokeWidth={2.5} />
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: '0 0 2px' }}>Welcome to Pulse CRM</p>
                  <p style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500, margin: 0 }}>Sign in to your workspace</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ height: 32, width: 32, borderRadius: 8, background: 'transparent', border: '1px solid #f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#f8fafc'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
                <X size={15} />
              </button>
            </div>

            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* role */}
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Select your role</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  {([
                    { value: 'admin' as const, label: 'Admin', icon: Shield, desc: 'Full access' },
                    { value: 'manager' as const, label: 'Manager', icon: BarChart2, desc: 'Team view' },
                    { value: 'representative' as const, label: 'Sales Rep', icon: TrendingUp, desc: 'My pipeline' },
                  ]).map(({ value, label, icon: Icon, desc }) => (
                    <button key={value} onClick={() => setSelectedRole(value)} style={{ padding: '12px 8px', borderRadius: 14, border: `2px solid ${selectedRole === value ? '#7c3aed' : '#e2e8f0'}`, background: selectedRole === value ? '#f5f3ff' : '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <Icon size={18} color={selectedRole === value ? '#7c3aed' : '#94a3b8'} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: selectedRole === value ? '#5b21b6' : '#374151' }}>{label}</span>
                      <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>{desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* form */}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Email address</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com"
                    style={{ width: '100%', padding: '11px 16px', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 14, color: '#374151', outline: 'none', boxSizing: 'border-box', background: '#fff' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                    style={{ width: '100%', padding: '11px 16px', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 14, color: '#374151', outline: 'none', boxSizing: 'border-box', background: '#fff' }} />
                </div>
                <button type="submit" disabled={isLoading} style={{ width: '100%', padding: '13px', background: '#7c3aed', color: '#fff', fontSize: 14, fontWeight: 800, borderRadius: 12, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 6px 20px rgba(124,58,237,0.35)' }}>
                  {isLoading ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /><span>Signing in...</span></> : <><span>Sign In</span><ArrowRight size={15} /></>}
                </button>
              </form>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, height: 1, background: '#f1f5f9' }} />
                <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>or continue with</span>
                <div style={{ flex: 1, height: 1, background: '#f1f5f9' }} />
              </div>

              <button onClick={handleLogin} disabled={isLoading} style={{ width: '100%', padding: '12px', background: '#fff', color: '#374151', fontSize: 14, fontWeight: 700, borderRadius: 12, border: '1.5px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <Globe size={15} color="#94a3b8" />
                Continue with Google
              </button>

              <p style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', fontWeight: 500, margin: 0 }}>
                Don't have an account?{' '}
                <button onClick={handleLogin} style={{ color: '#7c3aed', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}>
                  Start free trial
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
    </div>
  );
}
