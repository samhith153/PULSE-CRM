'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { PageContainer } from '@/components/shared/PageTemplates';
import {
  Zap, Target, TrendingUp,
  UserPlus, ClipboardList, Star, CalendarCheck, ArrowRightLeft, BarChart3,
  Users, User, Building2, Activity, Sparkles, DollarSign,
  CheckCircle, Filter, Mail,
} from 'lucide-react';
import { useState } from 'react';

/* ─── Lead Flow steps ───────────────────────────── */
const FLOW_STEPS = [
  { icon: UserPlus,       num: 1, title: 'Lead Capture',      desc: 'Leads enter from web forms, imports, emails, or integrations.' },
  { icon: ClipboardList,  num: 2, title: 'Lead Enrichment',   desc: 'CRM enriches lead data and removes duplicates.' },
  { icon: Star,           num: 3, title: 'AI Lead Scoring',   desc: 'AI analyzes behavior and assigns a lead score.' },
  { icon: CalendarCheck,  num: 4, title: 'Assign & Follow-up',desc: 'Leads are assigned to users and follow-ups are scheduled.' },
  { icon: CheckCircle,    num: 5, title: 'Convert to Deal',   desc: 'Qualified leads are converted into deals and tracked.' },
];

/* ─── Daily workflow cards ──────────────────────── */
const WORKFLOW = [
  { icon: UserPlus,       num: '1', title: 'Create / Import',    desc: 'Add leads manually or import from files, forms, or integrations.' },
  { icon: Filter,         num: '2', title: 'View & Filter',      desc: 'Use filters and smart views to find the right leads quickly.' },
  { icon: Star,           num: '3', title: 'Check AI Score',     desc: 'AI score helps prioritize leads with high conversion potential.' },
  { icon: Mail,           num: '4', title: 'Engage & Follow-up', desc: 'Log calls, emails, notes and schedule follow-ups.' },
  { icon: ArrowRightLeft, num: '5', title: 'Convert',            desc: 'Convert qualified leads into deals with one click.' },
  { icon: BarChart3,      num: '6', title: 'Track Performance',  desc: 'Monitor lead and conversion performance on dashboards.' },
];

/* ─── Core modules ──────────────────────────────── */
const MODULES = [
  { icon: Users,     title: 'Leads',      desc: 'Capture, manage and track all incoming leads.',       color: '#7c3aed', bg: '#f5f3ff' },
  { icon: User,      title: 'Contacts',   desc: 'Store and manage contact information.',                color: '#2563eb', bg: '#eff6ff' },
  { icon: Building2, title: 'Companies',  desc: 'Organize leads by company accounts.',                  color: '#059669', bg: '#ecfdf5' },
  { icon: Activity,  title: 'Activities', desc: 'Track calls, emails, tasks and meetings.',              color: '#d97706', bg: '#fffbeb' },
  { icon: Sparkles,  title: 'AI Scoring', desc: 'AI scores and ranks leads automatically.',              color: '#9333ea', bg: '#faf5ff' },
  { icon: DollarSign,title: 'Deals',      desc: "Convert leads and track deals in the pipeline.",        color: '#dc2626', bg: '#fef2f2' },
];

/* ─── Pipeline stages for hero illustration ─────── */
const PIPELINE = [
  { label: 'New',       count: 12, color: '#7c3aed', bg: '#f5f3ff' },
  { label: 'Contacted', count: 8,  color: '#2563eb', bg: '#eff6ff' },
  { label: 'Qualified', count: 5,  color: '#059669', bg: '#ecfdf5' },
  { label: 'Proposal',  count: 3,  color: '#d97706', bg: '#fffbeb' },
  { label: 'Won',       count: 2,  color: '#16a34a', bg: '#f0fdf4' },
];

/* ─── CRM Dashboard Illustration ───────────────── */
function DashboardIllustration() {
  return (
    <div style={{
      background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0',
      boxShadow: '0 16px 56px rgba(0,0,0,0.09)', overflow: 'hidden',
    }}>
      {/* Chrome bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 14px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
        <div style={{ height: 8, width: 8, borderRadius: '50%', background: '#ff5f57' }} />
        <div style={{ height: 8, width: 8, borderRadius: '50%', background: '#ffbd2e' }} />
        <div style={{ height: 8, width: 8, borderRadius: '50%', background: '#28c941' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 8 }}>
          <div style={{ height: 16, width: 16, borderRadius: 4, background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={9} color="#fff" />
          </div>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#0f172a' }}>Pulse CRM</span>
        </div>
      </div>
      {/* Body */}
      <div style={{ display: 'flex', height: 240 }}>
        {/* Sidebar */}
        <div style={{ width: 36, background: '#fafafa', borderRight: '1px solid #f1f5f9', padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          {[Users, Building2, User, Activity, BarChart3].map((Icon, i) => (
            <div key={i} style={{ height: 20, width: 20, borderRadius: 5, background: i === 0 ? '#ede9fe' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={11} color={i === 0 ? '#7c3aed' : '#cbd5e1'} />
            </div>
          ))}
        </div>
        {/* Main */}
        <div style={{ flex: 1, padding: '14px 16px', overflow: 'hidden' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>Lead Pipeline</p>
          {/* Pipeline stages */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, alignItems: 'center' }}>
            {PIPELINE.map((s, i) => (
              <React.Fragment key={i}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 8, fontWeight: 600, color: s.color, marginBottom: 3, whiteSpace: 'nowrap' }}>{s.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{s.count}</div>
                </div>
                {i < PIPELINE.length - 1 && <div style={{ fontSize: 9, color: '#cbd5e1', flexShrink: 0 }}>›</div>}
              </React.Fragment>
            ))}
          </div>
          {/* Two panels */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {/* Lead details */}
            <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px' }}>
              <p style={{ fontSize: 8, fontWeight: 700, color: '#64748b', marginBottom: 7 }}>Lead Details</p>
              {[70, 55, 80, 45].map((w, i) => (
                <div key={i} style={{ height: 5, background: '#e2e8f0', borderRadius: 3, width: `${w}%`, marginBottom: 5 }} />
              ))}
            </div>
            {/* AI Score */}
            <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <p style={{ fontSize: 8, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>AI Score</p>
              <div style={{ height: 44, width: 44, borderRadius: '50%', border: '3px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
                <span style={{ fontSize: 14, fontWeight: 900, color: '#10b981' }}>85</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Lead Flow section — cards + overlay connector line ── */
function LeadFlowRow() {
  return (
    /*
     * Outer wrapper: relative so the absolute connector line is scoped here.
     * The line sits at top=12 (vertically centred on the 24px badges which
     * are centred at top=0 of the card row, i.e. card marginTop=0).
     * Each card has marginTop=12 so the badges peek above the card top edge.
     */
    <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 10 }}>

      {/* ── single continuous dashed line across the full badge row ── */}
      {/* We draw it at top=12 = centre of the 24px badge */}
      <div style={{
        position: 'absolute',
        top: 12,           /* centre of badge (badge height 24 / 2 = 12) */
        left: '10%',       /* start after the first badge centre  */
        right: '10%',      /* end before the last badge centre    */
        height: 0,
        borderTop: '2px dashed #c4b5fd',
        zIndex: 0,
        pointerEvents: 'none',
      }} />

      {FLOW_STEPS.map((step, i) => {
        const Icon = step.icon;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: i * 0.08 }}
            style={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {/* Purple number badge — floats above card, centred */}
            <div style={{
              height: 24, width: 24, borderRadius: '50%',
              background: '#7c3aed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 800, color: '#fff',
              boxShadow: '0 2px 10px rgba(124,58,237,0.45)',
              marginBottom: 10,
              zIndex: 2,
              flexShrink: 0,
            }}>
              {step.num}
            </div>

            {/* White card — sits below the badge */}
            <div style={{
              width: '100%',
              background: '#fff',
              borderRadius: 16,
              border: '1px solid #eaecef',
              padding: '20px 14px 18px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
              textAlign: 'center',
            }}>
              {/* Icon circle */}
              <div style={{
                height: 56, width: 56, borderRadius: '50%',
                background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
                border: '1.5px solid #ddd6fe',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 14px',
              }}>
                <Icon size={24} color="#7c3aed" strokeWidth={1.6} />
              </div>

              <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 6, letterSpacing: '-0.01em' }}>
                {step.title}
              </p>
              <p style={{ fontSize: 11.5, color: '#6b7280', lineHeight: 1.55 }}>
                {step.desc}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ─── Workflow Card ─────────────────────────────── */
function WorkflowCard({ item, index }: { item: typeof WORKFLOW[0]; index: number }) {
  const [hovered, setHovered] = useState(false);
  const Icon = item.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.32, delay: index * 0.06 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: '#fff', borderRadius: 16, border: `1px solid ${hovered ? '#ddd6fe' : '#eaecef'}`, padding: '20px 16px 18px', cursor: 'pointer', transition: 'all 0.18s ease', transform: hovered ? 'translateY(-3px)' : 'translateY(0)', boxShadow: hovered ? '0 10px 28px rgba(124,58,237,0.10)' : '0 1px 4px rgba(0,0,0,0.04)' }}
    >
      <div style={{ height: 40, width: 40, borderRadius: 10, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
        <Icon size={18} color="#7c3aed" strokeWidth={1.8} />
      </div>
      <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 5, letterSpacing: '-0.01em' }}>
        <span style={{ color: '#7c3aed', marginRight: 4 }}>{item.num}.</span>{item.title}
      </p>
      <p style={{ fontSize: 11.5, color: '#6b7280', lineHeight: 1.55 }}>{item.desc}</p>
    </motion.div>
  );
}

/* ─── Module Card ───────────────────────────────── */
function ModuleCard({ mod, index }: { mod: typeof MODULES[0]; index: number }) {
  const [hovered, setHovered] = useState(false);
  const Icon = mod.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.32, delay: index * 0.06 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: '#fff', borderRadius: 16, border: `1px solid ${hovered ? mod.bg : '#eaecef'}`, padding: '22px 18px 20px', cursor: 'pointer', transition: 'all 0.18s ease', transform: hovered ? 'translateY(-3px)' : 'translateY(0)', boxShadow: hovered ? `0 10px 28px ${mod.color}18` : '0 1px 4px rgba(0,0,0,0.04)' }}
    >
      <div style={{ height: 42, width: 42, borderRadius: 11, background: mod.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        <Icon size={19} color={mod.color} strokeWidth={1.8} />
      </div>
      <p style={{ fontSize: 13.5, fontWeight: 700, color: '#111827', marginBottom: 5 }}>{mod.title}</p>
      <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.55 }}>{mod.desc}</p>
    </motion.div>
  );
}

/* ─── Page ──────────────────────────────────────── */
export default function ImplementationGuidePage() {
  return (
    <PageContainer>

      {/* ── HERO ─────────────────────────────────── */}
      <section style={{
        marginTop: 64,
        padding: '72px 48px 80px',
        background: 'linear-gradient(160deg, #f5f3ff 0%, #faf9ff 60%, #fff 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -100, right: -100, width: 480, height: 480, background: 'radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 360, height: 360, background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'center', position: 'relative' }}>

          {/* Left */}
          <motion.div initial={{ opacity: 0, x: -28 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
            {/* Badge */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 14px', background: '#f5f3ff', border: '1.5px solid #ede9fe', borderRadius: 100, marginBottom: 22 }}>
              <Zap size={11} color="#7c3aed" />
              <span style={{ fontSize: 11, fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.09em' }}>Implementation Guide</span>
            </motion.div>

            {/* Heading */}
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
              style={{ fontSize: 'clamp(34px, 4.2vw, 52px)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em', color: '#0f172a', marginBottom: 18 }}>
              How{' '}
              <span style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Leads
              </span>{' '}
              Work<br />in Pulse CRM
            </motion.h1>

            {/* Subtitle */}
            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              style={{ fontSize: 15.5, color: '#64748b', lineHeight: 1.75, maxWidth: 440, marginBottom: 28 }}>
              From lead capture to conversion — understand how leads move through Pulse CRM and drive sales.
            </motion.p>

            {/* Feature pills */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}
              style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              {[{ icon: Zap, label: 'Simple Flow' }, { icon: Target, label: 'Smart Scoring' }, { icon: TrendingUp, label: 'Real Results' }].map(({ icon: Icon, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: '#7c3aed' }}>
                  <Icon size={13} color="#7c3aed" /> {label}
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right — dashboard illustration */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}>
            <DashboardIllustration />
          </motion.div>
        </div>
      </section>

      {/* ── LEAD FLOW OVERVIEW ───────────────────── */}
      <section style={{ padding: '60px 48px 68px', background: '#f8f9fb' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }} style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', marginBottom: 5 }}>Lead Flow Overview</h2>
            <p style={{ fontSize: 13, color: '#9ca3af' }}>See how a lead is captured, scored, and moved through the pipeline.</p>
          </motion.div>

          <LeadFlowRow />

          <style>{`
            @media (max-width: 900px) {
              .flow-grid { flex-direction: column !important; gap: 16px !important; }
              .flow-grid > div { width: 100% !important; }
            }
          `}</style>
        </div>
      </section>

      {/* ── HOW USERS WORK WITH LEADS ────────────── */}
      <section style={{ padding: '60px 48px 68px', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }} style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', marginBottom: 5 }}>How Users Work with Leads</h2>
            <p style={{ fontSize: 13, color: '#9ca3af' }}>Everyday steps users take to manage and convert leads.</p>
          </motion.div>

          <div className="wf-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
            {WORKFLOW.map((item, i) => (
              <WorkflowCard key={i} item={item} index={i} />
            ))}
          </div>

          <style>{`
            @media (max-width: 1100px) { .wf-grid { grid-template-columns: repeat(3, 1fr) !important; } }
            @media (max-width: 720px)  { .wf-grid { grid-template-columns: repeat(2, 1fr) !important; } }
            @media (max-width: 460px)  { .wf-grid { grid-template-columns: 1fr !important; } }
          `}</style>
        </div>
      </section>

      {/* ── CORE MODULES INVOLVED ────────────────── */}
      <section style={{ padding: '60px 48px 72px', background: '#f8f9fb' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }} style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', marginBottom: 5 }}>Core Modules Involved</h2>
            <p style={{ fontSize: 13, color: '#9ca3af' }}>Key modules that power the lead management process.</p>
          </motion.div>

          <div className="mod-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
            {MODULES.map((mod, i) => (
              <ModuleCard key={i} mod={mod} index={i} />
            ))}
          </div>

          <style>{`
            @media (max-width: 1100px) { .mod-grid { grid-template-columns: repeat(3, 1fr) !important; } }
            @media (max-width: 720px)  { .mod-grid { grid-template-columns: repeat(2, 1fr) !important; } }
            @media (max-width: 460px)  { .mod-grid { grid-template-columns: 1fr !important; } }
          `}</style>
        </div>
      </section>

    </PageContainer>
  );
}
