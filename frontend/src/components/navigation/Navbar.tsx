'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, ChevronDown, Menu, X, ArrowRight } from 'lucide-react';
import MegaDrawer from './MegaDrawer';

type DrawerType = 'product' | 'solutions' | 'pricing' | 'resources' | null;

interface NavbarProps {
  onOpenModal: () => void;
}

const NAV_ITEMS: { label: string; drawer: DrawerType }[] = [
  { label: 'Product',   drawer: 'product' },
  { label: 'Solutions', drawer: 'solutions' },
  { label: 'Pricing',   drawer: 'pricing' },
  { label: 'Resources', drawer: 'resources' },
];

export default function Navbar({ onOpenModal }: NavbarProps) {
  const [activeDrawer, setActiveDrawer] = useState<DrawerType>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();
  const navRef = useRef<HTMLElement>(null);

  // Shadow on scroll
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Close drawer on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveDrawer(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleDrawer = (drawer: DrawerType) => {
    setActiveDrawer(prev => (prev === drawer ? null : drawer));
  };

  const closeDrawer = () => setActiveDrawer(null);

  return (
    <>
      <header
        ref={navRef}
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
        }}>

          {/* ── LOGO ── */}
          <button
            onClick={() => { closeDrawer(); router.push('/'); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'none', border: 'none', cursor: 'pointer',
              textDecoration: 'none', padding: 0, flexShrink: 0,
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
            <span style={{ fontSize: 9, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.14em', marginLeft: 4 }}>
              AI REVENUE ENGINE
            </span>
          </button>

          {/* ── DESKTOP NAV ── */}
          <nav aria-label="Main navigation" style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {NAV_ITEMS.map(item => {
              const isActive = activeDrawer === item.drawer;
              return (
                <button
                  key={item.label}
                  onClick={() => toggleDrawer(item.drawer)}
                  aria-expanded={isActive}
                  aria-haspopup="true"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '7px 14px', borderRadius: 8, border: 'none',
                    background: isActive ? '#f5f3ff' : 'transparent',
                    fontSize: 14, fontWeight: 600,
                    color: isActive ? '#7c3aed' : '#374151',
                    cursor: 'pointer', transition: 'all 0.15s ease',
                    fontFamily: 'inherit', outline: 'none',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      (e.currentTarget as HTMLButtonElement).style.background = '#f9fafb';
                      (e.currentTarget as HTMLButtonElement).style.color = '#0f172a';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                      (e.currentTarget as HTMLButtonElement).style.color = '#374151';
                    }
                  }}
                >
                  {item.label}
                  <ChevronDown
                    size={13}
                    color={isActive ? '#7c3aed' : '#9ca3af'}
                    style={{
                      transform: isActive ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                    }}
                  />
                </button>
              );
            })}

          </nav>

          {/* ── AUTH BUTTONS ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => { closeDrawer(); onOpenModal(); }}
              style={{
                padding: '7px 16px', borderRadius: 8, border: 'none',
                background: 'transparent', fontSize: 14, fontWeight: 600,
                color: '#374151', cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#7c3aed'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#374151'; }}
            >
              Log In
            </button>
            <button
              onClick={() => { closeDrawer(); onOpenModal(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '9px 20px', borderRadius: 100, border: 'none',
                background: '#7c3aed', color: '#fff',
                fontSize: 14, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(124,58,237,0.35)',
                fontFamily: 'inherit', transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#6d28d9'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(124,58,237,0.45)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#7c3aed'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 14px rgba(124,58,237,0.35)'; }}
            >
              Get Started <ArrowRight size={14} />
            </button>

            {/* Mobile hamburger */}
            <button
              onClick={() => { setMobileOpen(o => !o); closeDrawer(); }}
              aria-label={mobileOpen ? 'Close mobile menu' : 'Open mobile menu'}
              style={{
                display: 'none', // hidden on desktop — shown on mobile via CSS in globals
                padding: 6, background: 'none', border: 'none', cursor: 'pointer',
              }}
              className="mobile-menu-btn"
            >
              {mobileOpen ? <X size={22} color="#374151" /> : <Menu size={22} color="#374151" />}
            </button>
          </div>
        </div>

        {/* Active drawer indicator underline */}
        {activeDrawer && (
          <div style={{
            position: 'absolute', bottom: -1, left: 0, right: 0, height: 2,
            background: 'linear-gradient(90deg, transparent, #7c3aed 30%, #7c3aed 70%, transparent)',
            opacity: 0.6,
          }} />
        )}
      </header>

      {/* ── MEGA DRAWER ── */}
      <MegaDrawer
        activeDrawer={activeDrawer}
        onClose={closeDrawer}
        onOpenModal={() => { closeDrawer(); onOpenModal(); }}
      />

      {/* Mobile slide-over menu */}
      {mobileOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1001,
          background: '#fff', overflowY: 'auto',
          padding: '80px 24px 32px',
          fontFamily: "'Inter', system-ui, sans-serif",
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[...NAV_ITEMS.map(i => i.label), 'About'].map(label => (
              <button
                key={label}
                onClick={() => { setMobileOpen(false); onOpenModal(); }}
                style={{
                  padding: '14px 16px', borderRadius: 12, border: 'none',
                  background: 'transparent', textAlign: 'left',
                  fontSize: 18, fontWeight: 700, color: '#0f172a',
                  cursor: 'pointer', fontFamily: 'inherit',
                  borderBottom: '1px solid #f1f5f9',
                }}
              >
                {label}
              </button>
            ))}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
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
        </div>
      )}
    </>
  );
}
