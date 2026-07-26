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
            if (id === 'stats' && !hasAnimated) {
              setHasAnimated(true);
              setStatCounts({ users: 0, tables: 0, permissions: 0, tests: 0 });
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
    { label: 'Email Sync', icon: Mail, color: '#7c3aed', description: 'Sync Gmail and Outlook emails automatically. Track opens, clicks, and reply rates in real-time.' },
    { label: 'AI Copilot', icon: Sparkles, color: '#7c3aed', description: 'Get AI-powered lead scoring and recommendations. Automate email drafts and deal summaries.' },
    { label: 'Reports', icon: BarChart2, color: '#2563eb', description: 'Real-time dashboards with pipeline analytics. Track team performance and forecast revenue.' },
    { label: 'Pipeline', icon: Filter, color: '#16a34a', description: 'Visual deal stages with drag-and-drop. Move deals from lead to close with clear workflows.' },
    { label: 'Leaderboard', icon: Trophy, color: '#ea580c', description: 'Track top performers and celebrate wins. Motivate your team with gamified sales metrics.' },
    { label: 'Contacts', icon: Users, color: '#0d9488', description: 'Centralize all customer data in one place. Track interactions, notes, and relationship history.' },
  ];

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
    'Product': ['Features', 'API', 'Security', 'Changelog', 'Integrations'],
    'Company': ['About', 'Blog', 'Careers', 'Press', 'Partners'],
    'Support': ['Docs', 'Status', 'Community', 'Contact', 'API Reference'],
    'Legal': ['Privacy', 'Terms', 'GDPR', 'Cookies', 'Licenses'],
  };

  const stagger = (delay: number) => ({ initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6, delay } });

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #0f172a, #1e293b, #0f172a)', color: '#e2e8f0' }}>
      <Navbar onLogin={onLogin} onOpenAuth={openSignUp} />

      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 80 }}
            style={{
              background: t.type === 'success' ? '#065f46' : '#7f1d1d',
              color: '#fef2f2',
              padding: '12px 20px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
              fontSize: '14px',
              fontWeight: 500,
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {t.type === 'success' ? <CheckCircle2 size={18} /> : <X size={18} />}
            {t.message}
          </motion.div>
        ))}
      </div>

      {/* HERO */}
      <section className="relative overflow-hidden pt-24 pb-20 md:pt-36 md:pb-28 px-4">
        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-6" style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)', color: '#a78bfa' }}>
              <Sparkles size={14} />
              v1.0.0 — 89 tests passing · 11 tables · 33 permissions
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-6" style={{ color: '#f1f5f9' }}>
              Close Deals Faster<br />
              <span style={{ background: 'linear-gradient(135deg, #a78bfa, #6366f1, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>with AI-Powered CRM</span>
            </h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10" style={{ color: C.darkText }}>
              From lead scoring to pipeline management to GPT-4o summaries — Pulse CRM
              is your all-in-one sales platform. Open-source. RESTful. Enterprise-ready.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={openSignUp}
                className="px-8 py-3.5 rounded-xl text-base font-semibold inline-flex items-center gap-2 shadow-lg"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#fff', border: '1px solid rgba(124,58,237,0.3)' }}
              >
                Get Started Free
                <ArrowRight size={18} />
              </motion.button>
              <motion.a
                whileHover={{ scale: 1.03 }}
                href="https://github.com/Kalnet-Pulse/Pulse-CRM"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3.5 rounded-xl text-base font-semibold inline-flex items-center gap-2"
                style={{ background: 'rgba(255,255,255,0.05)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <Star size={18} />
                Star on GitHub
              </motion.a>
            </div>
          </motion.div>
        </div>

        {/* 3D Orbit Visualization */}
        <div className="relative max-w-5xl mx-auto mt-20 md:mt-28 px-4">
          <div className="relative flex items-center justify-center" style={{ minHeight: '420px' }}>
            {/* Central Core */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4, type: 'spring' }}
              className="absolute z-10 flex flex-col items-center justify-center rounded-full"
              style={{
                width: '130px', height: '130px',
                background: 'radial-gradient(circle at 30% 30%, rgba(124,58,237,0.25), rgba(99,102,241,0.12))',
                border: '2px solid rgba(124,58,237,0.25)',
                boxShadow: '0 0 60px rgba(124,58,237,0.15)',
              }}
            >
              <Settings size={28} style={{ color: '#a78bfa' }} />
              <span className="text-xs font-semibold mt-1" style={{ color: '#c4b5fd' }}>PULSE CRM</span>
            </motion.div>

            {/* Orbit Ring */}
            <svg className="absolute" width="400" height="400" viewBox="0 0 400 400" style={{ opacity: 0.3 }}>
              <circle cx="200" cy="200" r="160" fill="none" stroke="rgba(124,58,237,0.15)" strokeWidth="1.5" strokeDasharray="6 6" />
              <circle cx="200" cy="200" r="190" fill="none" stroke="rgba(99,102,241,0.1)" strokeWidth="1" strokeDasharray="4 8" />
            </svg>

            {/* Orbiting Nodes */}
            {orbitNodes.map((node, i) => {
              const angle = (i * 60 + orbitAngle) * (Math.PI / 180);
              const rx = 160, ry = 100;
              const x = 200 + rx * Math.cos(angle) - 30;
              const y = 200 + ry * Math.sin(angle) - 30;
              const isActive = activeOrbitNode === node.label;
              return (
                <motion.div
                  key={node.label}
                  className="absolute cursor-pointer"
                  style={{ left: `${(x / 400) * 100}%`, top: `${(y / 400) * 100}%`, width: '56px', height: '56px' }}
                  onMouseEnter={() => setActiveOrbitNode(node.label)}
                  onMouseLeave={() => setActiveOrbitNode(null)}
                  whileHover={{ scale: 1.15 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                >
                  <div
                    className="flex items-center justify-center rounded-full w-full h-full"
                    style={{
                      background: isActive ? 'linear-gradient(135deg, #7c3aed, #6366f1)' : 'rgba(255,255,255,0.06)',
                      border: `2px solid ${isActive ? '#7c3aed' : 'rgba(255,255,255,0.08)'}`,
                      boxShadow: isActive ? '0 0 24px rgba(124,58,237,0.3)' : 'none',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <node.icon size={20} style={{ color: isActive ? '#fff' : node.color }} />
                  </div>
                  {/* Tooltip */}
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute z-20 w-52 p-3 rounded-xl text-xs"
                      style={{
                        background: '#1e293b',
                        border: '1px solid rgba(124,58,237,0.2)',
                        color: '#e2e8f0',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        top: '64px',
                        boxShadow: '0 12px 30px rgba(0,0,0,0.4)',
                      }}
                    >
                      <p className="font-semibold mb-1" style={{ color: '#a78bfa' }}>{node.label}</p>
                      <p style={{ color: C.darkText }}>{node.description}</p>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section data-reveal="stats" className="py-14 md:py-20 px-4" style={{ background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {stats.map(s => {
            const isVisible = visibleSections.has('stats');
            return (
              <motion.div
                key={s.key}
                initial={{ opacity: 0, y: 20 }}
                animate={isVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5 }}
                className="text-center p-4 rounded-xl"
                style={{ border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <s.icon size={28} className="mx-auto mb-2" style={{ color: '#a78bfa' }} />
                <div className="text-3xl md:text-4xl font-bold" style={{ color: '#f1f5f9' }}>
                  {statCounts[s.key as keyof typeof statCounts]}+
                </div>
                <div className="text-sm mt-1 font-medium" style={{ color: '#a78bfa' }}>{s.label}</div>
                <div className="text-xs mt-1" style={{ color: C.darkText }}>{s.sub}</div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* FEATURES GRID */}
      <section data-reveal="features" className="py-14 md:py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div {...stagger(0)} className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4" style={{ color: '#f1f5f9' }}>
              Everything you need to <span style={{ color: '#a78bfa' }}>sell smarter</span>
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: C.darkText }}>
              From lead capture to closed won — Pulse CRM provides enterprise features without the enterprise complexity.
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                {...stagger(0.1 * i)}
                className="p-6 rounded-2xl transition-all duration-300"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                whileHover={{ y: -4, borderColor: 'rgba(124,58,237,0.2)', boxShadow: '0 12px 30px rgba(0,0,0,0.15)' }}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: f.bg }}>
                  <f.icon size={22} style={{ color: f.fg }} />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: '#e2e8f0' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: C.darkText }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section data-reveal="howitworks" className="py-14 md:py-24 px-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="max-w-5xl mx-auto">
          <motion.div {...stagger(0)} className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4" style={{ color: '#f1f5f9' }}>
              From lead to <span style={{ color: '#a78bfa' }}>closed won</span>
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: C.darkText }}>
              Three simple steps to transform leads into revenue.
            </p>
          </motion.div>
          <div className="relative grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <motion.div key={s.num} {...stagger(0.15 * i)} className="relative text-center p-6">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(99,102,241,0.1))', border: '1px solid rgba(124,58,237,0.15)' }}>
                  <s.icon size={28} style={{ color: '#a78bfa' }} />
                </div>
                <div className="text-3xl font-bold mb-2" style={{ color: 'rgba(124,58,237,0.3)' }}>{s.num}</div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: '#e2e8f0' }}>{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: C.darkText }}>{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section data-reveal="testimonials" className="py-14 md:py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div {...stagger(0)} className="text-center mb-14">
            <h2 className="text-3xl md:text-5xl font-bold mb-4" style={{ color: '#f1f5f9' }}>
              Trusted by <span style={{ color: '#a78bfa' }}>sales teams</span>
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                {...stagger(0.15 * i)}
                className="p-6 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: t.color, color: '#fff' }}>{t.initials}</div>
                  <div>
                    <div className="font-semibold text-sm" style={{ color: '#e2e8f0' }}>{t.name}</div>
                    <div className="text-xs" style={{ color: C.darkText }}>{t.role}</div>
                  </div>
                </div>
                <p className="text-sm leading-relaxed italic" style={{ color: C.darkText }}>"{t.quote}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST BADGES */}
      <section data-reveal="trust" className="py-12 md:py-20 px-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {trustBadges.map((b, i) => (
            <motion.div key={b.title} {...stagger(0.1 * i)} className="text-center p-4 rounded-xl" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
              <b.icon size={24} className="mx-auto mb-2" style={{ color: '#a78bfa' }} />
              <div className="font-semibold text-sm" style={{ color: '#e2e8f0' }}>{b.title}</div>
              <div className="text-xs mt-1" style={{ color: C.darkText }}>{b.desc}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section data-reveal="cta" className="py-14 md:py-24 px-4">
        <motion.div {...stagger(0)} className="max-w-2xl mx-auto text-center p-10 rounded-3xl" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.10), rgba(99,102,241,0.05))', border: '1px solid rgba(124,58,237,0.12)' }}>
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#f1f5f9' }}>
            Ready to transform your sales process?
          </h2>
          <p className="mb-8" style={{ color: C.darkText }}>
            Join teams that close deals faster with AI-powered CRM.
          </p>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={openSignUp}
            className="px-8 py-3.5 rounded-xl text-base font-semibold inline-flex items-center gap-2 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#fff', border: '1px solid rgba(124,58,237,0.3)' }}
          >
            Start Free Trial
            <ChevronRight size={18} />
          </motion.button>
        </motion.div>
      </section>

      {/* NEWSLETTER */}
      <section data-reveal="newsletter" className="py-10 px-4" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="max-w-md mx-auto text-center">
          <p className="text-sm font-medium mb-3" style={{ color: '#a78bfa' }}>Stay up to date</p>
          <form onSubmit={handleNewsletter} className="flex gap-2">
            <input
              type="email"
              value={newsEmail}
              onChange={e => setNewsEmail(e.target.value)}
              placeholder="you@company.com"
              className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.08)' }}
            />
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#fff' }}
            >
              Subscribe
            </motion.button>
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 px-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold mb-3" style={{ color: '#e2e8f0' }}>{category}</h4>
              <ul className="space-y-2">
                {links.map(link => (
                  <li key={link}>
                    <a href="#" className="text-sm transition-colors" style={{ color: C.darkText }} onMouseEnter={e => (e.currentTarget.style.color = '#a78bfa')} onMouseLeave={e => (e.currentTarget.style.color = C.darkText)}>{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="text-center text-xs" style={{ color: C.darkText }}>
          &copy; {new Date().getFullYear()} KALNET PULSE CRM. MIT License. Built with FastAPI, PostgreSQL, Next.js, and GPT-4o.
        </div>
      </footer>

      {/* AUTH MODAL */}
      {isModalOpen && (
        <AuthModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onLogin={onLogin}
        />
      )}
    </div>
  );
}
