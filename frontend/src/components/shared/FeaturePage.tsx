'use client';
import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView, useAnimation } from 'framer-motion';
import Navbar from '@/components/navigation/Navbar';
import { ArrowRight, CheckCircle, X, Mail, Lock, Loader2, Activity } from 'lucide-react';

/* ─── data shapes ──────────────────────────────────── */
export interface FPCapability {
  icon: React.ElementType;
  title: string;
  desc: string;
}
export interface FPStep {
  step: string;
  title: string;
  desc: string;
}
export interface FPStat {
  stat: string;
  label: string;
  desc: string;
}
export interface FPData {
  badge: string;
  badgeIcon?: React.ElementType;
  heroTitle: React.ReactNode;
  heroDesc: string;
  overviewTitle: string;
  overviewDesc: string;
  capabilities: FPCapability[];
  howItWorksTitle: string;
  steps: FPStep[];
  statsTitle: string;
  statsDesc: string;
  stats: FPStat[];
  mockupTitle: string;
  mockup: React.ReactNode;
  ctaTitle: string;
  ctaDesc: string;
  accent?: string;
  accentBg?: string;
  accentBorder?: string;
}

interface Props { data: FPData }

/* ─── Animated Counter Component ──────────────────── */
function AnimatedCounter({ value, duration = 2000 }: { value: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  
  useEffect(() => {
    if (!isInView) return;
    
    const numericValue = parseInt(value.replace(/[^\d]/g, ''));
    if (isNaN(numericValue)) return;
    
    const steps = 60;
    const increment = numericValue / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= numericValue) {
        setCount(numericValue);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [isInView, value, duration]);
  
  // Extract non-numeric parts (like %, ×, etc.)
  const suffix = value.replace(/[\d.,]/g, '');
  const hasDecimal = value.includes('.');
  
  return (
    <div ref={ref}>
      {hasDecimal ? value : `${count}${suffix}`}
    </div>
  );
}

/* ─── Inline Auth Modal ──────────────────────────── */
type Role = 'representative' | 'manager' | 'admin';

function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole]         = useState<Role>('manager');
  const [loading, setLoading]   = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); onClose(); }, 1200);
  };

  const handleGoogle = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); onClose(); }, 1200);
  };

  const ROLES: { value: Role; label: string }[] = [
    { value: 'admin',          label: 'Admin' },
    { value: 'manager',        label: 'Manager' },
    { value: 'representative', label: 'Sales Rep' },
  ];

  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(15,23,42,0.65)', backdropFilter:'blur(6px)', padding:16 }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        style={{ background:'#fff', borderRadius:24, width:'100%', maxWidth:440, padding:'40px 40px 36px', boxShadow:'0 32px 80px rgba(0,0,0,0.22)', position:'relative' }}>

        {/* close */}
        <button onClick={onClose}
          style={{ position:'absolute', top:18, right:18, background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:10, width:34, height:34, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <X size={16} color="#64748b" />
        </button>

        {/* brand */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
          <div style={{ height:36, width:36, borderRadius:10, background:'#7c3aed', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(124,58,237,0.35)' }}>
            <Activity size={17} color="#fff" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize:18, fontWeight:900, color:'#0f172a', letterSpacing:'-0.02em' }}>
            Pulse<span style={{ color:'#7c3aed' }}>CRM</span>
          </span>
        </div>

        <h2 style={{ fontSize:24, fontWeight:800, color:'#0f172a', margin:'0 0 4px', letterSpacing:'-0.02em' }}>Welcome back</h2>
        <p style={{ fontSize:14, color:'#94a3b8', fontWeight:500, margin:'0 0 24px' }}>Sign in to your account to continue.</p>

        {/* role selector */}
        <p style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em', margin:'0 0 10px' }}>Select your role</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:22 }}>
          {ROLES.map(r => (
            <button key={r.value} onClick={() => setRole(r.value)}
              style={{ padding:'9px 4px', borderRadius:10, border:`2px solid ${role === r.value ? '#7c3aed' : '#e2e8f0'}`, background: role === r.value ? '#f5f3ff' : '#fff', cursor:'pointer', fontSize:12, fontWeight:700, color: role === r.value ? '#7c3aed' : '#64748b', transition:'all .15s', fontFamily:'inherit' }}>
              {r.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {/* email */}
          <div>
            <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#475569', marginBottom:6 }}>Email address</label>
            <div style={{ position:'relative' }}>
              <Mail size={15} color="#94a3b8" style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com" required
                style={{ width:'100%', padding:'11px 14px 11px 40px', borderRadius:10, border:'1.5px solid #e2e8f0', fontSize:14, fontFamily:'inherit', color:'#0f172a', outline:'none', boxSizing:'border-box', background:'#fff', transition:'border-color .15s' }}
                onFocus={e => { (e.target as HTMLInputElement).style.borderColor = '#7c3aed'; }}
                onBlur={e => { (e.target as HTMLInputElement).style.borderColor = '#e2e8f0'; }} />
            </div>
          </div>

          {/* password */}
          <div>
            <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#475569', marginBottom:6 }}>Password</label>
            <div style={{ position:'relative' }}>
              <Lock size={15} color="#94a3b8" style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required
                style={{ width:'100%', padding:'11px 14px 11px 40px', borderRadius:10, border:'1.5px solid #e2e8f0', fontSize:14, fontFamily:'inherit', color:'#0f172a', outline:'none', boxSizing:'border-box', background:'#fff', transition:'border-color .15s' }}
                onFocus={e => { (e.target as HTMLInputElement).style.borderColor = '#7c3aed'; }}
                onBlur={e => { (e.target as HTMLInputElement).style.borderColor = '#e2e8f0'; }} />
            </div>
          </div>

          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <button type="button" style={{ fontSize:12, fontWeight:600, color:'#7c3aed', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>Forgot password?</button>
          </div>

          <button type="submit" disabled={loading}
            style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'13px', background: loading ? '#9b72f0' : '#7c3aed', color:'#fff', fontSize:15, fontWeight:700, borderRadius:12, border:'none', cursor: loading ? 'not-allowed' : 'pointer', fontFamily:'inherit', transition:'all .15s', boxShadow:'0 6px 20px rgba(124,58,237,0.35)' }}>
            {loading ? <><Loader2 size={16} style={{ animation:'spin 1s linear infinite' }} /> Signing in…</> : 'Sign In'}
          </button>
        </form>

        <div style={{ display:'flex', alignItems:'center', gap:12, margin:'18px 0' }}>
          <div style={{ flex:1, height:1, background:'#e2e8f0' }} />
          <span style={{ fontSize:12, color:'#94a3b8', fontWeight:500 }}>or continue with</span>
          <div style={{ flex:1, height:1, background:'#e2e8f0' }} />
        </div>

        <button onClick={handleGoogle} disabled={loading}
          style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:10, padding:'12px', background:'#fff', border:'1.5px solid #e2e8f0', borderRadius:12, fontSize:14, fontWeight:700, color:'#0f172a', cursor:'pointer', fontFamily:'inherit', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', transition:'all .15s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#7c3aed'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0'; }}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <p style={{ textAlign:'center', fontSize:12, color:'#94a3b8', margin:'18px 0 0' }}>
          No account?{' '}
          <button onClick={onClose} style={{ fontSize:12, fontWeight:700, color:'#7c3aed', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>Sign up free</button>
        </p>
      </div>
      <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>
    </div>
  );
}

export default function FeaturePage({ data }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const accent       = data.accent       ?? '#7c3aed';
  const accentBg     = data.accentBg     ?? '#f5f3ff';
  const accentBorder = data.accentBorder ?? '#ede9fe';
  const BadgeIcon    = data.badgeIcon;

  const openModal = () => setModalOpen(true);

  // Animation variants
  const pageTransition = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  return (
    <motion.div 
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransition}
      transition={{ duration: 0.4 }}
      style={{ fontFamily:"'Inter',system-ui,sans-serif", background:'#fff', minHeight:'100vh', color:'#0f172a' }}>
      <Navbar onOpenModal={openModal} />
      <AuthModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />

      {/* ── HERO ─────────────────────────────────────── */}
      <motion.section 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        style={{ marginTop:64, padding:'80px 48px 72px', background:`linear-gradient(180deg,${accentBg} 0%,#fff 100%)`, position:'relative', overflow:'hidden' }}>
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8 }}
          style={{ position:'absolute', top:-80, right:-80, width:560, height:560, background:`radial-gradient(circle,${accent}10 0%,transparent 65%)`, pointerEvents:'none' }} />
        <div style={{ maxWidth:1280, margin:'0 auto', position:'relative' }}>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 16px', background:accentBg, border:`1px solid ${accentBorder}`, borderRadius:100, marginBottom:22 }}>
            {BadgeIcon && <BadgeIcon size={13} color={accent} />}
            <span style={{ fontSize:12, fontWeight:700, color:accent, textTransform:'uppercase', letterSpacing:'0.07em' }}>{data.badge}</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            style={{ fontSize:'clamp(40px,5vw,62px)', fontWeight:900, color:'#0f172a', lineHeight:1.08, letterSpacing:'-0.035em', marginBottom:22, maxWidth:820 }}>
            {data.heroTitle}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            style={{ fontSize:19, color:'#475569', lineHeight:1.75, maxWidth:680, marginBottom:36 }}>{data.heroDesc}</motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
            <motion.button 
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={openModal}
              style={{ display:'flex', alignItems:'center', gap:8, padding:'14px 28px', background:accent, color:'#fff', fontSize:15, fontWeight:700, borderRadius:100, border:'none', cursor:'pointer', boxShadow:`0 8px 24px ${accent}44`, transition:'box-shadow .2s' }}>
              Start Free Trial <ArrowRight size={16} />
            </motion.button>
          </motion.div>
        </div>
      </motion.section>

      {/* ── CAPABILITIES ─────────────────────────────── */}
      <section style={{ padding:'80px 48px', background:'#fff' }}>
        <div style={{ maxWidth:1280, margin:'0 auto' }}>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            style={{ fontSize:38, fontWeight:900, color:'#0f172a', textAlign:'center', letterSpacing:'-0.025em', marginBottom:14 }}>{data.overviewTitle}</motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{ fontSize:17, color:'#64748b', textAlign:'center', maxWidth:680, margin:'0 auto 56px', lineHeight:1.75 }}>{data.overviewDesc}</motion.p>
          <motion.div 
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(290px,1fr))', gap:20 }}>
            {data.capabilities.map((c,i)=>{
              const Icon=c.icon;
              return(
                <motion.div 
                  key={i}
                  variants={fadeInUp}
                  whileHover={{ scale: 1.03, y: -4 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  style={{ padding:28, background:'#f8fafc', borderRadius:16, border:'1px solid #e2e8f0', cursor:'pointer', position:'relative', overflow:'hidden' }}>
                  <motion.div 
                    whileHover={{ rotate: 10, scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400 }}
                    style={{ height:46, width:46, borderRadius:12, background:accentBg, border:`1px solid ${accentBorder}`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
                    <Icon size={20} color={accent} />
                  </motion.div>
                  <h3 style={{ fontSize:16, fontWeight:700, color:'#0f172a', marginBottom:8 }}>{c.title}</h3>
                  <p style={{ fontSize:14, color:'#64748b', lineHeight:1.65 }}>{c.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────── */}
      <section style={{ padding:'80px 48px', background:'#F8F5FF' }}>
        <div style={{ maxWidth:1080, margin:'0 auto' }}>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            style={{ fontSize:12, fontWeight:700, color:'#7c3aed', textTransform:'uppercase', letterSpacing:'0.12em', textAlign:'center', marginBottom:14 }}>
            How it works
          </motion.p>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{ fontSize:38, fontWeight:900, color:'#0f172a', textAlign:'center', letterSpacing:'-0.025em', marginBottom:52 }}>{data.howItWorksTitle}</motion.h2>
          <div style={{ display:'flex', flexDirection:'column', gap:36 }}>
            {data.steps.map((s,i)=>(
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                style={{ display:'flex', gap:28, alignItems:'flex-start' }}>
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  style={{ fontSize:52, fontWeight:900, color:'#ede9fe', lineHeight:1, flexShrink:0, minWidth:72, fontVariantNumeric:'tabular-nums' }}>{s.step}</motion.div>
                <div style={{ paddingTop:4 }}>
                  <h3 style={{ fontSize:20, fontWeight:700, color:'#0f172a', marginBottom:10 }}>{s.title}</h3>
                  <p style={{ fontSize:15, color:'#64748b', lineHeight:1.75 }}>{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────── */}
      <section style={{ padding:'80px 48px', background:'#fff' }}>
        <div style={{ maxWidth:1280, margin:'0 auto' }}>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            style={{ fontSize:38, fontWeight:900, color:'#0f172a', textAlign:'center', letterSpacing:'-0.025em', marginBottom:14 }}>{data.statsTitle}</motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{ fontSize:17, color:'#64748b', textAlign:'center', maxWidth:680, margin:'0 auto 52px', lineHeight:1.75 }}>{data.statsDesc}</motion.p>
          <motion.div 
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:24 }}>
            {data.stats.map((s,i)=>(
              <motion.div 
                key={i}
                variants={fadeInUp}
                whileHover={{ y: -8, boxShadow: '0 12px 32px rgba(124, 58, 237, 0.15)' }}
                transition={{ type: "spring", stiffness: 300 }}
                style={{ padding:32, background:`linear-gradient(135deg,${accentBg} 0%,#fff 100%)`, borderRadius:20, border:`1px solid ${accentBorder}`, textAlign:'center', cursor:'pointer' }}>
                <div style={{ fontSize:48, fontWeight:900, color:'#0f172a', marginBottom:8, letterSpacing:'-0.03em' }}>
                  <AnimatedCounter value={s.stat} />
                </div>
                <div style={{ fontSize:16, fontWeight:700, color:'#0f172a', marginBottom:6 }}>{s.label}</div>
                <div style={{ fontSize:13, color:'#64748b', lineHeight:1.5 }}>{s.desc}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── MOCKUP / DASHBOARD ───────────────────────── */}
      <section style={{ padding:'80px 48px', background:'#f8fafc' }}>
        <div style={{ maxWidth:1280, margin:'0 auto' }}>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            style={{ fontSize:38, fontWeight:900, color:'#0f172a', textAlign:'center', letterSpacing:'-0.025em', marginBottom:52 }}>{data.mockupTitle}</motion.h2>
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            whileHover={{ y: -8 }}
            style={{ background:'#fff', borderRadius:20, border:'1px solid #e2e8f0', overflow:'hidden', boxShadow:'0 24px 64px rgba(0,0,0,.07)', transition:'box-shadow 0.3s' }}>
            {/* Browser chrome */}
            <div style={{ display:'flex', alignItems:'center', gap:6, padding:'12px 20px', borderBottom:'1px solid #f1f5f9', background:'#f8f8f8' }}>
              <div style={{ height:11, width:11, borderRadius:'50%', background:'#ff5f57' }} />
              <div style={{ height:11, width:11, borderRadius:'50%', background:'#ffbd2e' }} />
              <div style={{ height:11, width:11, borderRadius:'50%', background:'#28c941' }} />
              <div style={{ flex:1, margin:'0 16px', height:20, background:'#ececec', borderRadius:5, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontSize:9, color:'#999', fontWeight:500 }}>app.pulsecrm.io/dashboard</span>
              </div>
            </div>
            <div style={{ padding:'32px' }}>
              {data.mockup}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────── */}
      <section style={{ padding:'100px 48px', background:`linear-gradient(135deg,${accent} 0%,#5b21b6 100%)`, textAlign:'center', position:'relative', overflow:'hidden' }}>
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 0.1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          style={{ position:'absolute', top:-100, left:-100, width:600, height:600, background:'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)', pointerEvents:'none' }} />
        <div style={{ maxWidth:700, margin:'0 auto', position:'relative' }}>
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{ fontSize:44, fontWeight:900, color:'#fff', marginBottom:16, lineHeight:1.15, letterSpacing:'-0.03em' }}>{data.ctaTitle}</motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{ fontSize:18, color:'rgba(255,255,255,.88)', marginBottom:36, lineHeight:1.6 }}>{data.ctaDesc}</motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{ display:'flex', gap:16, justifyContent:'center', flexWrap:'wrap' }}>
            <motion.button 
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={openModal}
              style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'16px 32px', background:'#fff', color:accent, fontSize:16, fontWeight:700, borderRadius:100, border:'none', cursor:'pointer', boxShadow:'0 12px 32px rgba(0,0,0,.15)', transition:'box-shadow .2s' }}>
              Start Free Trial <ArrowRight size={18} />
            </motion.button>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            style={{ display:'flex', gap:24, justifyContent:'center', marginTop:28, flexWrap:'wrap' }}>
            {['14-day free trial','No credit card required','2-minute setup'].map(t=>(
              <span key={t} style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:500, color:'rgba(255,255,255,.8)' }}>
                <CheckCircle size={14} color="rgba(255,255,255,.9)" />{t}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────── */}
      <footer style={{ padding:'36px 48px', background:'#0f172a', color:'#475569', textAlign:'center' }}>
        <p style={{ fontSize:14 }}>© 2026 Pulse CRM Inc. All rights reserved. Powered by <span style={{ color:'#94a3b8', fontWeight:600 }}>Kalnet</span>.</p>
      </footer>
    </motion.div>
  );
}
