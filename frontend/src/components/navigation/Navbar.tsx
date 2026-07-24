'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity, ChevronDown, Menu, X, ArrowRight,
  LayoutDashboard, Sparkles, BarChart2, Mail, Workflow, Shield,
  Target, Users, Building2, Rocket, Briefcase,
  BookOpen, Code, FileText, MessageCircle, Wrench, HelpCircle,
} from 'lucide-react';

/* ─── Types ─────────────────────────────────────────── */
type MenuKey = 'product' | 'solutions' | 'resources' | null;

interface NavbarProps {
  onOpenModal: () => void;
}

/* ─── Dropdown content definitions ──────────────────── */
const PRODUCT_ITEMS = [
  { icon: LayoutDashboard, label: 'Visual Pipeline',     desc: 'Drag-and-drop deal boards with stage tracking',  href: '/product/visual-pipeline' },
  { icon: Sparkles,        label: 'AI Copilot',          desc: 'GPT-4o lead scoring, summaries & email drafts',  href: '/product/ai-copilot' },
  { icon: BarChart2,       label: 'Revenue Analytics',   desc: 'Live forecasts, funnels & rep leaderboards',     href: '/product/revenue-analytics' },
  { icon: Mail,            label: 'Email Intelligence',  desc: 'Gmail/Outlook sync with thread timelines',       href: '/product/email-intelligence' },
  { icon: Workflow,        label: 'Automation',          desc: 'No-code workflows, routing & webhooks',          href: '/product/automation' },
  { icon: Shield,          label: 'Security & RBAC',     desc: 'SOC 2, SSO/SAML & 33 granular permissions',     href: '/product/security-rbac' },
];

const SOLUTIONS_ITEMS = [
  { icon: Users,     label: 'Sales Representatives', desc: 'Close more deals with AI-drafted emails & scoring', href: '/solutions/sales-reps' },
  { icon: BarChart2, label: 'Sales Managers',        desc: 'Full pipeline visibility & team performance',       href: '/solutions/sales-managers' },
  { icon: Building2, label: 'Enterprise',            desc: 'SSO, audit logs, SLA & unlimited seats',           href: '/solutions/enterprise' },
  { icon: Rocket,    label: 'Startups',              desc: 'Launch in 2 minutes, scale without re-platforming', href: '/solutions/startups' },
  { icon: Briefcase, label: 'Agencies',              desc: 'Multi-client pipelines with white-labelling',      href: '/solutions/agencies' },
  { icon: Target,    label: 'RevOps Teams',          desc: 'RBAC, integrations & cross-functional reporting',  href: '/solutions/revops' },
];


const RESOURCES_ITEMS = [
  { icon: BookOpen,       label: 'Documentation',       desc: 'Guides for every feature & integration',           href: '/resources/documentation' },
  { icon: Code,           label: 'API Reference',       desc: '40+ REST endpoints with interactive Swagger UI',   href: '/resources/api-reference' },
  { icon: Wrench,         label: 'Implementation Guide', desc: 'Step-by-step setup & best practices',             href: '/resources/implementation-guide' },
  { icon: FileText,       label: 'Blog',                desc: 'Sales strategy, AI in CRM & product updates',      href: '/resources/blog' },
  { icon: MessageCircle,  label: 'Community',           desc: 'Join 5,000+ sales pros in our Slack community',    href: '/resources/community' },
  { icon: HelpCircle,     label: 'Support',             desc: 'Get help from our support team',                   href: '/resources/support' },
];

type DropdownItem = { icon: React.ElementType; label: string; desc: string; href: string };
const MENU_DATA: Record<NonNullable<MenuKey>, DropdownItem[]> = {
  product:   PRODUCT_ITEMS,
  solutions: SOLUTIONS_ITEMS,
  resources: RESOURCES_ITEMS,
};

/* Dropdown nav items (have sub-menus) */
const NAV_DROPDOWN_ITEMS: { label: string; key: NonNullable<MenuKey> }[] = [
  { label: 'Product',   key: 'product' },
  { label: 'Solutions', key: 'solutions' },
  { label: 'Resources', key: 'resources' },
];

/* ─── Dropdown panel ─────────────────────────────────── */
function Dropdown({ items, onNavigate }: { items: DropdownItem[]; onNavigate: (href: string) => void }) {
  return (
    <div
      role="menu"
      style={{
        position: 'absolute',
        top: 'calc(100% + 10px)',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 480,
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: 16,
        boxShadow: '0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(124,58,237,0.08)',
        padding: '10px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 4,
        zIndex: 1100,
        animation: 'dropdownIn 0.18s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      {items.map(({ icon: Icon, label, desc, href }) => (
        <button
          key={label}
          role="menuitem"
          onClick={() => onNavigate(href)}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 11,
            padding: '11px 12px',
            borderRadius: 10,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            textAlign: 'left',
            fontFamily: "'Inter', system-ui, sans-serif",
            transition: 'background 0.12s ease',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f5f3ff'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          <div style={{
            height: 34, width: 34, borderRadius: 9,
            background: '#f5f3ff', border: '1px solid #ede9fe',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, marginTop: 1,
          }}>
            <Icon size={15} color="#7c3aed" strokeWidth={2} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 2, lineHeight: 1.3 }}>{label}</div>
            <div style={{ fontSize: 11.5, color: '#64748b', lineHeight: 1.45, fontWeight: 400 }}>{desc}</div>
          </div>
        </button>
      ))}
    </div>
  );
}

/* ─── Main Navbar ────────────────────────────────────── */
export default function Navbar({ onOpenModal }: NavbarProps) {
  const [activeMenu, setActiveMenu] = useState<MenuKey>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<MenuKey>(null);
  const router = useRouter();
  const headerRef = useRef<HTMLElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Shadow on scroll */
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  /* Close on outside click */
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  /* Lock body scroll when mobile menu open */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  /* ESC key closes everything */
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') { setActiveMenu(null); setMobileOpen(false); }
  }, []);
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  /* Hover with tiny delay to prevent accidental closes */
  const openMenu = (key: NonNullable<MenuKey>) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setActiveMenu(key);
  };
  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setActiveMenu(null), 120);
  };
  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  const navigate = (href: string) => {
    setActiveMenu(null);
    setMobileOpen(false);
    router.push(href);
  };

  return (
    <>
      {/* ── keyframe injection ── */}
      <style>{`
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-6px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes mobileSlideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .nav-link-btn:hover { background: #f9fafb !important; color: #0f172a !important; }
        .nav-link-btn.active { background: #f5f3ff !important; color: #7c3aed !important; }
        .mobile-menu-btn { display: none !important; }
        @media (max-width: 900px) {
          .desktop-nav  { display: none !important; }
          .desktop-auth { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
        @media (max-width: 520px) {
          .logo-tagline { display: none !important; }
        }
      `}</style>

      <header
        ref={headerRef}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
          height: 64,
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid #e5e7eb',
          boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.08)' : 'none',
          transition: 'box-shadow 0.25s ease',
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        <div style={{
          maxWidth: 1380, margin: '0 auto',
          padding: '0 32px', height: 64,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'relative',
        }}>

          {/* ── Logo ── */}
          <button
            onClick={() => navigate('/')}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 0, flexShrink: 0,
            }}
          >
            <div style={{
              height: 36, width: 36, borderRadius: 10, background: '#7c3aed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(124,58,237,0.35)',
            }}>
              <Activity size={17} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: 19, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em' }}>Pulse</span>
            <span style={{ fontSize: 19, fontWeight: 900, color: '#7c3aed', letterSpacing: '-0.03em', marginLeft: -4 }}>CRM</span>
            <span className="logo-tagline" style={{ fontSize: 9, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.14em', marginLeft: 4 }}>
              AI REVENUE ENGINE
            </span>
          </button>

          {/* ── Desktop Nav ── */}
          <nav className="desktop-nav" aria-label="Main navigation"
            style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {NAV_DROPDOWN_ITEMS.map(item => {
              const isActive = activeMenu === item.key;
              return (
                <div key={item.key} style={{ position: 'relative' }}
                  onMouseEnter={() => openMenu(item.key)}
                  onMouseLeave={scheduleClose}
                >
                  <button
                    className={`nav-link-btn${isActive ? ' active' : ''}`}
                    aria-expanded={isActive}
                    aria-haspopup="true"
                    onClick={() => setActiveMenu(prev => prev === item.key ? null : item.key)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '7px 14px', borderRadius: 8, border: 'none',
                      background: isActive ? '#f5f3ff' : 'transparent',
                      fontSize: 14, fontWeight: 600,
                      color: isActive ? '#7c3aed' : '#374151',
                      cursor: 'pointer', fontFamily: 'inherit',
                      transition: 'all 0.15s ease', outline: 'none',
                    }}
                  >
                    {item.label}
                    <ChevronDown size={13}
                      color={isActive ? '#7c3aed' : '#9ca3af'}
                      style={{ transform: isActive ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
                    />
                  </button>

                  {/* Dropdown */}
                  {isActive && (
                    <div onMouseEnter={cancelClose} onMouseLeave={scheduleClose}>
                      <Dropdown items={MENU_DATA[item.key]} onNavigate={navigate} />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Pricing — direct link, no dropdown */}
            <button
              className="nav-link-btn"
              onClick={() => navigate('/pricing')}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '7px 14px', borderRadius: 8, border: 'none',
                background: 'transparent', fontSize: 14, fontWeight: 600,
                color: '#374151', cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.15s ease', outline: 'none',
              }}
            >
              Pricing
            </button>
          </nav>

          {/* ── Desktop Auth ── */}
          <div className="desktop-auth" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={onOpenModal}
              style={{
                padding: '7px 16px', borderRadius: 8, border: 'none',
                background: 'transparent', fontSize: 14, fontWeight: 600,
                color: '#374151', cursor: 'pointer', fontFamily: 'inherit',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#7c3aed'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#374151'; }}
            >
              Log In
            </button>
            <button
              onClick={onOpenModal}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '9px 20px', borderRadius: 100, border: 'none',
                background: '#7c3aed', color: '#fff',
                fontSize: 14, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(124,58,237,0.35)',
                fontFamily: 'inherit', transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = '#6d28d9';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(124,58,237,0.45)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = '#7c3aed';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(124,58,237,0.35)';
              }}
            >
              Get Started <ArrowRight size={14} />
            </button>
          </div>

          {/* ── Mobile hamburger ── */}
          <button
            className="mobile-menu-btn"
            onClick={() => { setMobileOpen(o => !o); setActiveMenu(null); }}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            style={{
              padding: 6, background: 'none', border: 'none',
              cursor: 'pointer', display: 'none', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {mobileOpen ? <X size={22} color="#374151" /> : <Menu size={22} color="#374151" />}
          </button>
        </div>

        {/* Subtle violet underline when dropdown open */}
        {activeMenu && (
          <div style={{
            position: 'absolute', bottom: -1, left: 0, right: 0, height: 2,
            background: 'linear-gradient(90deg, transparent, #7c3aed 30%, #7c3aed 70%, transparent)',
            opacity: 0.5,
            pointerEvents: 'none',
          }} />
        )}
      </header>

      {/* ── Mobile full-screen menu ── */}
      {mobileOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1001,
          background: '#fff', overflowY: 'auto',
          padding: '80px 0 32px',
          fontFamily: "'Inter', system-ui, sans-serif",
          animation: 'mobileSlideIn 0.2s ease',
        }}>
          {NAV_DROPDOWN_ITEMS.map(item => {
            const isExpanded = mobileExpanded === item.key;
            return (
              <div key={item.key} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <button
                  onClick={() => setMobileExpanded(prev => prev === item.key ? null : item.key)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', padding: '16px 24px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  <span style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>{item.label}</span>
                  <ChevronDown size={16} color="#94a3b8"
                    style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>

                {isExpanded && (
                  <div style={{ padding: '4px 16px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {MENU_DATA[item.key].map(({ icon: Icon, label, desc, href }) => (
                      <button
                        key={label}
                        onClick={() => navigate(href)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '10px 12px', borderRadius: 10, border: 'none',
                          background: 'transparent', cursor: 'pointer',
                          textAlign: 'left', fontFamily: 'inherit',
                          transition: 'background 0.12s',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f5f3ff'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                      >
                        <div style={{
                          height: 32, width: 32, borderRadius: 8, background: '#f5f3ff',
                          border: '1px solid #ede9fe', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', flexShrink: 0,
                        }}>
                          <Icon size={14} color="#7c3aed" />
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{label}</div>
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>{desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <div style={{ borderBottom: '1px solid #f1f5f9' }}>
            <button
              onClick={() => navigate('/pricing')}
              style={{
                width: '100%', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', padding: '16px 24px',
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <span style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Pricing</span>
              <ArrowRight size={16} color="#94a3b8" />
            </button>
          </div>

          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={() => { setMobileOpen(false); onOpenModal(); }}
              style={{
                padding: '14px', borderRadius: 12, border: '1.5px solid #e5e7eb',
                background: '#fff', fontSize: 15, fontWeight: 700, color: '#374151',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Log In
            </button>
            <button
              onClick={() => { setMobileOpen(false); onOpenModal(); }}
              style={{
                padding: '14px', borderRadius: 12, border: 'none',
                background: '#7c3aed', fontSize: 15, fontWeight: 700, color: '#fff',
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 6px 20px rgba(124,58,237,0.35)',
              }}
            >
              Get Started Free →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
