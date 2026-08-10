'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, ArrowUpRight, ArrowDownRight,
  ChevronDown, MoreHorizontal,
  PhoneCall, Users, Target, Zap, Award, TrendingUp,
  CheckCircle2, Clock, AlertTriangle, Calendar,
  LayoutDashboard, Loader2, RefreshCw,
  CheckCheck, Mail, MailOpen,
  Flame, AlarmClock, Star, Circle,
  ListChecks, Video, ExternalLink,
} from 'lucide-react';
import {
  getDashboardMe, getSalesRepDashboard, getSalesRepAIInsights,
  getLeads, getDeals,
  DashboardOverviewData, SalesRepDashboardData, SalesRepAIInsightsData,
  asNumber, formatINR, formatNum, formatPct, Decimal,
} from '@/utils/api';
import { useReveal, useCountUp } from '@/hooks/use-reveal';

/* ─── types ─────────────────────────────────────────────────────────── */
interface SalesRepDashboardViewProps {
  onTabChange: (tab: string) => void;
}

/* ─── tiny helpers ───────────────────────────────────────────────────── */
function pct(v: Decimal) { return `${asNumber(v).toFixed(1)}%`; }

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function relDay(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = d.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0);
  const days = diff / 86_400_000;
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  if (days > 0) return `In ${days} days`;
  return `${Math.abs(days)}d ago`;
}

/* ─── Sparkline ──────────────────────────────────────────────────────── */
function Spark({ pts, color }: { pts: number[]; color: string }) {
  if (pts.length < 2) return null;
  const max = Math.max(...pts, 1);
  const min = Math.min(...pts, 0);
  const r = max - min || 1;
  const coords = pts.map((v, i) => ({
    x: (i / (pts.length - 1)) * 100,
    y: 32 - ((v - min) / r) * 26 + 2,
  }));
  let path = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const a = coords[i], b = coords[i + 1];
    const cx1 = a.x + (b.x - a.x) / 3, cy1 = a.y;
    const cx2 = a.x + 2 * (b.x - a.x) / 3, cy2 = b.y;
    path += ` C ${cx1.toFixed(1)} ${cy1.toFixed(1)},${cx2.toFixed(1)} ${cy2.toFixed(1)},${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
  }
  const area = `${path} L 100 36 L 0 36 Z`;
  return (
    <svg viewBox="0 0 100 36" preserveAspectRatio="none" className="h-9 w-full" aria-hidden>
      <defs>
        <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path d={area} fill={`url(#sg-${color.replace('#', '')})`}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} />
      <motion.path d={path} fill="none" stroke={color} strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, ease: 'easeOut' }} />
    </svg>
  );
}

/* ─── Animated counter tile ──────────────────────────────────────────── */
function CountTile({ value, active }: { value: number; active: boolean }) {
  const n = useCountUp(value, active, 900);
  return <span>{Math.round(n).toLocaleString('en-IN')}</span>;
}

/* ─── KPI card ───────────────────────────────────────────────────────── */
interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  sub: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  linkLabel: string;
  linkColor: string;
  onClick: () => void;
  delay?: number;
}
function KpiCard({ label, value, sub, icon: Icon, iconBg, iconColor, linkLabel, linkColor, onClick, delay = 0 }: KpiCardProps) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 16 }} animate={visible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.35, delay: delay / 1000, ease: [0.22, 1, 0.36, 1] }}
      className="bg-card border rounded-2xl p-5 flex flex-col gap-3 hover:shadow-md transition-shadow cursor-pointer"
      style={{ borderColor: 'var(--border-default)' }}
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${iconBg}`}>
          <Icon className={`h-4 w-4 ${iconColor}`} strokeWidth={2} />
        </div>
      </div>
      <div className="text-3xl font-bold text-foreground leading-none">{value}</div>
      <p className="text-xs text-muted-foreground font-medium">{sub}</p>
      <button onClick={onClick}
        className={`text-xs font-bold flex items-center gap-1 mt-auto cursor-pointer ${linkColor}`}>
        {linkLabel} <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}

/* ─── Pipeline funnel bar ────────────────────────────────────────────── */
const FUNNEL_COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#10b981', '#0ea5e9'];
function FunnelBar({ stage, count, pctVal, color, maxCount, delay = 0 }:
  { stage: string; count: number; pctVal: number; color: string; maxCount: number; delay?: number }) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  const barH = Math.max(40, Math.round((count / maxCount) * 160));
  return (
    <div ref={ref} className="flex flex-col items-center gap-2 flex-1 min-w-0">
      <div className="w-full flex items-end justify-center" style={{ height: 180 }}>
        <motion.div
          initial={{ height: 0 }} animate={visible ? { height: barH } : {}}
          transition={{ duration: 0.7, delay: delay / 1000, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[80px] rounded-t-xl flex items-end justify-center pb-2"
          style={{ backgroundColor: color + '22', border: `1.5px solid ${color}44` }}
        >
          <span className="text-xs font-bold" style={{ color }}>{pct(pctVal)}</span>
        </motion.div>
      </div>
      <p className="text-2xl font-bold text-foreground tabular-nums">{count}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-center">{stage}</p>
    </div>
  );
}

/* ─── Revenue area chart ─────────────────────────────────────────────── */
function RevenueLeadsChart({ trend }: { trend: SalesRepDashboardData['revenue_trend'] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const n = trend.length;
  if (n < 2) return <div className="h-44 flex items-center justify-center text-sm text-muted-foreground">No data yet.</div>;

  const revs = trend.map(t => asNumber(t.revenue));
  const maxR = Math.max(...revs, 1);

  const coords = revs.map((v, i) => ({ x: (i / (n - 1)) * 100, y: 80 - (v / maxR) * 72 + 4 }));
  const curvePath = (pts: { x: number; y: number }[]) => {
    let p = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      p += ` C ${(a.x + (b.x - a.x) / 3).toFixed(1)} ${a.y.toFixed(1)},${(a.x + 2 * (b.x - a.x) / 3).toFixed(1)} ${b.y.toFixed(1)},${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
    }
    return p;
  };
  const linePath = curvePath(coords);
  const areaPath = `${linePath} L 100 86 L 0 86 Z`;

  return (
    <div className="mt-4 relative">
      <svg viewBox="0 0 100 86" preserveAspectRatio="none" className="h-44 w-full overflow-visible" aria-hidden>
        <defs>
          <linearGradient id="rlGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[20, 40, 60, 80].map(y => (
          <line key={y} x1="0" x2="100" y1={y} y2={y}
            stroke="currentColor" strokeWidth="0.5" strokeDasharray="1.5 3" strokeOpacity="0.2"
            vectorEffect="non-scaling-stroke" className="text-border" />
        ))}
        {hovered !== null && (
          <line x1={coords[hovered].x.toFixed(1)} x2={coords[hovered].x.toFixed(1)}
            y1="2" y2="84" stroke="#3b82f6" strokeWidth="0.8" strokeDasharray="2 2"
            strokeOpacity="0.5" vectorEffect="non-scaling-stroke" />
        )}
        <motion.path d={areaPath} fill="url(#rlGrad)"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }} />
        <motion.path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, ease: 'easeInOut' }} />
        {coords.map((c, i) => (
          <circle key={i} cx={c.x.toFixed(1)} cy={c.y.toFixed(1)}
            r={hovered === i ? '2.8' : '1.6'}
            fill={hovered === i ? '#3b82f6' : '#60a5fa'} stroke="white"
            strokeWidth={hovered === i ? '1.8' : '1.2'} vectorEffect="non-scaling-stroke"
            style={{ transition: 'all 0.15s' }} />
        ))}
        {coords.map((c, i) => (
          <rect key={`hz-${i}`} x={`${Math.max(0, c.x - 5)}`} y="0" width="10" height="86"
            fill="transparent" className="cursor-pointer"
            onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} />
        ))}
      </svg>
      <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground font-medium">
        {trend.map(t => (
          <span key={t.period}>{new Date(`${t.period}-01`).toLocaleDateString('en-IN', { month: 'short', timeZone: 'UTC' })}</span>
        ))}
      </div>
      <AnimatePresence>
        {hovered !== null && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            className="absolute -top-2 left-1/2 -translate-x-1/2 bg-popover border rounded-xl shadow-xl p-3 min-w-[140px] pointer-events-none z-10"
            style={{ borderColor: 'var(--border-default)' }}
          >
            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">
              {new Date(`${trend[hovered].period}-01`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
            </p>
            <p className="text-sm font-bold text-foreground">{formatINR(trend[hovered].revenue)}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Lead sources donut ─────────────────────────────────────────────── */
const SRC_COLORS = ['#3b82f6', '#6366f1', '#10b981', '#f59e0b', '#ef4444'];
function SourceDonut({ data }: { data: SalesRepDashboardData['deals_by_source'] }) {
  const [hov, setHov] = useState<number | null>(null);
  const CIRC = 2 * Math.PI * 52;
  let acc = 0;
  const segs = data.map((d, i) => {
    const p = asNumber(d.percentage);
    const dash = (p / 100) * CIRC;
    const offset = -(acc / 100) * CIRC;
    acc += p;
    return { ...d, dash, offset, color: SRC_COLORS[i % SRC_COLORS.length], p };
  });
  return (
    <div className="flex items-center gap-6">
      <div className="relative size-32 shrink-0">
        <svg className="size-full -rotate-90" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r="52" fill="none" stroke="var(--secondary)" strokeWidth="14" />
          {segs.map((s, i) => (
            <motion.circle key={i} cx="70" cy="70" r="52" fill="none"
              stroke={s.color} strokeWidth={hov === i ? 18 : 14}
              strokeDasharray={`${s.dash} ${CIRC}`} strokeDashoffset={s.offset}
              initial={{ strokeDashoffset: CIRC }} animate={{ strokeDashoffset: s.offset }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: i * 0.06 }}
              className="cursor-pointer transition-all duration-150"
              onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-lg font-bold text-foreground tabular-nums">
            {hov !== null ? `${segs[hov].p.toFixed(0)}%` : '100%'}
          </span>
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">
            {hov !== null ? segs[hov].source : 'Sources'}
          </span>
        </div>
      </div>
      <div className="flex-1 space-y-2">
        {segs.map((s, i) => (
          <div key={i} className={`flex items-center justify-between text-xs rounded-lg px-2 py-1 transition-colors cursor-pointer ${hov === i ? 'bg-secondary' : ''}`}
            onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}>
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-muted-foreground font-medium">{s.source || 'Unknown'}</span>
            </div>
            <span className="font-bold text-foreground tabular-nums">{s.p.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════ */
export default function SalesRepDashboardView({ onTabChange }: SalesRepDashboardViewProps) {
  /* ── state ── */
  const [me, setMe]           = useState<DashboardOverviewData | null>(null);
  const [rep, setRep]         = useState<SalesRepDashboardData | null>(null);
  const [ai, setAi]           = useState<SalesRepAIInsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod]   = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [quotaOpen, setQuotaOpen]     = useState(true);
  const [riskFilter, setRiskFilter]   = useState<'all' | 'critical' | 'too_value'>('all');
  const [refreshing, setRefreshing]   = useState(false);

  /* ── fetch ── */
  const load = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const [meData, repData, aiData] = await Promise.allSettled([
        getDashboardMe({ silent: true }),
        getSalesRepDashboard(period, { silent: true }),
        getSalesRepAIInsights(),
      ]);
      if (meData.status === 'fulfilled' && meData.value)  setMe(meData.value);
      if (repData.status === 'fulfilled' && repData.value) setRep(repData.value);
      if (aiData.status === 'fulfilled' && aiData.value)   setAi(aiData.value);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  /* ── derived ── */
  const kpis        = me?.kpis;
  const quota       = me?.quota_pace;
  const tasks       = me?.open_tasks ?? [];
  const meetings    = me?.meetings_today ?? [];
  const atRisk      = me?.deals_at_risk ?? [];
  const priorities  = ai?.daily_priorities ?? [];
  const trend       = rep?.revenue_trend ?? [];
  const bySource    = rep?.deals_by_source ?? [];
  const byStage     = rep?.deals_by_stage ?? [];
  const keyM        = rep?.key_metrics;

  const quotaPct    = asNumber(quota?.attained_percentage);
  const wonRevenue  = asNumber(quota?.closed_won_revenue);
  const target      = asNumber(quota?.target_revenue);
  const avgDeal     = asNumber(rep?.avg_deal_size_stat?.avg_deal_value);
  const wonCount    = rep?.won_deals_stat?.count ?? 0;

  const revSeries   = trend.map(t => asNumber(t.revenue));
  const gapToGoal   = Math.max(0, target - wonRevenue);

  const completedTasks = tasks.filter(t => t.status === 'completed' || t.status === 'done').length;
  const totalTasks     = tasks.length;

  const todayTasks     = tasks.filter(t => t.status !== 'completed' && t.status !== 'done');
  const meetings_count = meetings.length;

  const maxStageCount  = byStage.length ? Math.max(...byStage.map(s => s.count), 1) : 1;

  const filteredRisk = atRisk.filter(d => {
    if (riskFilter === 'critical') return d.stalled_days >= 14;
    if (riskFilter === 'too_value') return asNumber(d.value) >= 500000;
    return true;
  });

  /* ── loading skeleton ── */
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 rounded-2xl bg-secondary" />
        <div className="grid grid-cols-4 gap-4">
          {[0,1,2,3].map(i => <div key={i} className="h-36 rounded-2xl bg-secondary" />)}
        </div>
        <div className="h-44 rounded-2xl bg-secondary" />
        <div className="grid grid-cols-2 gap-6">
          <div className="h-72 rounded-2xl bg-secondary" />
          <div className="h-72 rounded-2xl bg-secondary" />
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-6">

      {/* ── Welcome banner ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-[24px] border p-6"
        style={{
          borderColor: 'var(--border-default)',
          background: 'linear-gradient(135deg, var(--card) 0%, var(--secondary) 50%, color-mix(in srgb, var(--accent-muted) 40%, var(--card)) 100%)',
        }}
      >
        {/* decorative blobs */}
        <span className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full opacity-10"
          style={{ background: 'var(--brand-purple)' }} />
        <span className="pointer-events-none absolute right-32 -bottom-8 size-32 rounded-full opacity-5"
          style={{ background: 'var(--brand-blue)' }} />

        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground mb-1">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <h1 className="text-2xl font-bold text-foreground">
              Welcome back, <span style={{ color: 'var(--brand-purple)' }}>Sales Representative</span> 👋
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Here's a snapshot of your agenda and performance metrics.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              className="flex items-center gap-2 rounded-xl border bg-card/80 px-4 py-2 text-sm font-semibold text-foreground hover:bg-card transition-colors shadow-sm cursor-pointer"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
              Customize Layout
            </button>
            <button
              onClick={() => onTabChange('home')}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors cursor-pointer"
              style={{ background: 'var(--brand-purple)' }}
            >
              <Target className="h-4 w-4" />
              Sales Rep Home
            </button>
            <button
              onClick={() => load(true)}
              disabled={refreshing}
              title="Refresh"
              className="flex h-9 w-9 items-center justify-center rounded-xl border bg-card/80 text-muted-foreground hover:bg-card transition-colors cursor-pointer"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── 4 KPI cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Today's Work Summary mini-card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl border p-5 flex flex-col gap-3 bg-card hover:shadow-md transition-shadow"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Today's Work Summary</p>
            <div className="size-8 rounded-full flex items-center justify-center" style={{ background: 'var(--accent-muted)' }}>
              <ListChecks className="h-4 w-4" style={{ color: 'var(--accent-color)' }} />
            </div>
          </div>
          {/* Donut */}
          <div className="flex items-center gap-4">
            <div className="relative size-16 shrink-0">
              <svg className="size-full -rotate-90" viewBox="0 0 60 60">
                <circle cx="30" cy="30" r="22" fill="none" stroke="var(--secondary)" strokeWidth="8" />
                <motion.circle cx="30" cy="30" r="22" fill="none"
                  stroke="var(--brand-purple)" strokeWidth="8"
                  strokeDasharray={`${((completedTasks / Math.max(totalTasks, 1)) * 138).toFixed(1)} 138`}
                  strokeDashoffset="0"
                  initial={{ strokeDasharray: '0 138' }}
                  animate={{ strokeDasharray: `${((completedTasks / Math.max(totalTasks, 1)) * 138).toFixed(1)} 138` }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-bold text-foreground">
                  {totalTasks === 0 ? '—' : `${Math.round((completedTasks / totalTasks) * 100)}%`}
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Completion</p>
              <p className="text-2xl font-bold text-foreground tabular-nums">{Math.round((completedTasks / Math.max(totalTasks, 1)) * 100)}%</p>
            </div>
          </div>
          <button onClick={() => onTabChange('tasks')}
            className="text-xs font-bold flex items-center gap-1 cursor-pointer mt-auto"
            style={{ color: 'var(--accent-color)' }}>
            View all tasks <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </motion.div>

        {/* My Untouched Deals */}
        <KpiCard
          label="My Untouched Deals"
          value={<CountTile value={kpis?.untouched_deals ?? 0} active />}
          sub="Needs follow-up today"
          icon={Target}
          iconBg="bg-orange-100 dark:bg-orange-500/15"
          iconColor="text-orange-500"
          linkLabel="View all deals"
          linkColor="text-orange-500 hover:text-orange-600"
          onClick={() => onTabChange('deals')}
          delay={75}
        />

        {/* My Calls Today */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl border p-5 flex flex-col gap-3 bg-card hover:shadow-md transition-shadow"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">My Calls Today</p>
            <div className="size-8 rounded-full bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center">
              <PhoneCall className="h-4 w-4 text-emerald-500" />
            </div>
          </div>
          {(kpis?.calls_today ?? 0) === 0 ? (
            <div className="flex items-center gap-2 py-2">
              <div className="size-7 rounded-full bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center shrink-0">
                <PhoneCall className="h-3.5 w-3.5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">No calls logged</p>
                <p className="text-xs text-muted-foreground">Log your first call now!</p>
              </div>
            </div>
          ) : (
            <p className="text-3xl font-bold text-foreground tabular-nums">{kpis?.calls_today}</p>
          )}
          <button onClick={() => onTabChange('activities')}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer mt-auto">
            Log a call <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </motion.div>

        {/* My Leads */}
        <KpiCard
          label="My Leads"
          value={<CountTile value={kpis?.leads_assigned ?? 0} active />}
          sub="View this week"
          icon={Users}
          iconBg="dark:bg-brand-purple/15" iconColor=""
          linkLabel="View all leads"
          linkColor="hover:opacity-80"
          onClick={() => onTabChange('leads')}
          delay={225}
        />
      </div>

      {/* ── Quota Pace ── */}
      <div className="rounded-[24px] border bg-card p-6" style={{ borderColor: 'var(--border-default)' }}>
        {/* header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-muted)' }}>
              <Target className="h-5 w-5" style={{ color: 'var(--accent-color)' }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-foreground">Quota Pace</h2>
                <span className="text-[9px] font-bold bg-secondary text-muted-foreground px-2 py-0.5 rounded uppercase tracking-wider">
                  {period.toUpperCase()} TARGET
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">Revenue &amp; Goal Tracking</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* period switcher */}
            {(['week','month','quarter','year'] as const).map(p => (
              <button key={p}
                onClick={() => setPeriod(p)}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide cursor-pointer transition-colors ${
                  period === p ? 'text-white' : 'bg-secondary text-muted-foreground hover:bg-muted'
                }`}
                style={period === p ? { background: 'var(--brand-purple)' } : {}}
              >{p}</button>
            ))}
            {/* live badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-bold text-emerald-600">{quotaPct.toFixed(0)}%</span>
            </div>
            <button
              onClick={() => setQuotaOpen(o => !o)}
              className="size-8 rounded-lg border bg-secondary flex items-center justify-center hover:bg-muted cursor-pointer"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${quotaOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {quotaOpen && (
            <motion.div
              key="quota-body"
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              {/* big number */}
              <div className="mt-5 flex items-end justify-between flex-wrap gap-3">
                <div>
                  <span className="text-5xl font-black tabular-nums" style={{ color: 'var(--brand-purple)' }}>
                    {quotaPct.toFixed(0)}%
                  </span>
                  <span className="ml-3 text-sm text-muted-foreground font-semibold">
                    of {formatINR(target)} target
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Achieved</p>
                  <p className="text-xl font-bold text-foreground tabular-nums">{formatINR(wonRevenue)}</p>
                </div>
              </div>

              {/* progress bar */}
              <div className="relative mt-4 mb-1.5">
                <div className="h-3 rounded-full overflow-hidden bg-secondary">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, var(--brand-purple), var(--brand-blue))' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(quotaPct, 100)}%` }}
                    transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
                <motion.div
                  className="absolute top-1/2 -translate-y-1/2 size-4 rounded-full border-2 border-white shadow-md"
                  style={{ background: 'var(--brand-blue)' }}
                  initial={{ left: 0 }}
                  animate={{ left: `calc(${Math.min(quotaPct, 100)}% - 8px)` }}
                  transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-semibold text-muted-foreground mb-6">
                {['0%','25%','50%','75%','100%'].map(l => <span key={l}>{l}</span>)}
              </div>

              {/* sub-metric cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { icon: Zap,       color: '#10b981', label: 'Gap to Goal',  val: formatINR(gapToGoal),          pts: revSeries },
                  { icon: Award,     color: 'var(--brand-purple)', label: 'Deals Won',   val: `${wonCount} deals`, pts: revSeries.map((_, i) => i) },
                  { icon: TrendingUp,color: 'var(--brand-blue)', label: 'Avg Deal Size', val: formatINR(avgDeal),  pts: revSeries },
                ].map(({ icon: Ico, color, label, val, pts }) => (
                  <div key={label} className="rounded-xl border p-4" style={{ borderColor: 'var(--border-subtle)', background: 'var(--surface-2)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Ico className="h-4 w-4" style={{ color }} />
                        <span className="text-xs font-bold" style={{ color }}>{label}</span>
                      </div>
                      <MoreHorizontal className="h-4 w-4 text-muted-foreground cursor-pointer" />
                    </div>
                    <p className="text-2xl font-black text-foreground tabular-nums mb-2">{val}</p>
                    <Spark pts={pts.length >= 2 ? pts : [1,2,3,4,5,6]} color={color.startsWith('var') ? '#8b5cf6' : color} />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Today's Work Summary (full) ── */}
      <div className="rounded-[24px] border bg-card p-5" style={{ borderColor: 'var(--border-default)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ListChecks className="h-5 w-5" style={{ color: 'var(--accent-color)' }} />
            <h2 className="text-base font-bold text-foreground">Today's Work Summary</h2>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold text-muted-foreground">
            <span>COMPLETION</span>
            <span className="font-black text-foreground">{Math.round((completedTasks / Math.max(totalTasks, 1)) * 100)}%</span>
            <button onClick={() => onTabChange('tasks')} className="text-xs font-bold flex items-center gap-1 cursor-pointer hover:underline" style={{ color: 'var(--accent-color)' }}>
              View All <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Tasks & Meetings */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Tasks &amp; Meetings</p>
            {[
              { icon: CheckCircle2, label: "Today's Tasks",      val: todayTasks.filter(t => t.source !== 'meeting').length,    color: 'text-blue-500', barColor: '#3b82f6' },
              { icon: Calendar,     label: 'Upcoming Meetings',  val: meetings_count,                                           color: 'text-cyan-500', barColor: '#06b6d4' },
              { icon: PhoneCall,    label: 'Pending Calls',      val: kpis?.calls_today ?? 0,                                   color: 'text-emerald-500', barColor: '#10b981' },
              { icon: AlarmClock,   label: 'Overdue Tasks',      val: todayTasks.filter(t => t.due_date && new Date(t.due_date) < new Date()).length, color: 'text-rose-500', barColor: '#ef4444' },
            ].map(({ icon: Ico, label, val, color, barColor }) => (
              <div key={label} className="flex items-center gap-3 rounded-xl px-3 py-2 bg-secondary/60 border" style={{ borderColor: 'var(--border-subtle)' }}>
                <Ico className={`h-4 w-4 shrink-0 ${color}`} />
                <span className="text-sm text-muted-foreground flex-1">{label}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(val * 20, 100)}%`, background: barColor }} />
                  </div>
                  <span className={`text-sm font-bold ${color} tabular-nums w-5 text-right`}>{val}</span>
                </div>
              </div>
            ))}
          </div>

            {/* Emails completed */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Emails &amp; Completed</p>
              {[
                { icon: CheckCheck, label: 'Completed Items', val: completedTasks,               color: 'text-emerald-500', barColor: '#10b981' },
                { icon: Mail,       label: 'Emails Sent',     val: 0,                            color: 'text-orange-500',  barColor: '#f97316' },
                { icon: MailOpen,   label: 'Emails Received', val: 0,                            color: 'text-blue-500',    barColor: '#3b82f6' },
              ].map(({ icon: Ico, label, val, color, barColor }) => (
                <div key={label} className="flex items-center gap-3 rounded-xl px-3 py-2 bg-secondary/60 border" style={{ borderColor: 'var(--border-subtle)' }}>
                  <Ico className={`h-4 w-4 shrink-0 ${color}`} />
                  <span className="text-sm text-muted-foreground flex-1">{label}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(val * 20, 100)}%`, background: barColor }} />
                    </div>
                    <span className={`text-sm font-bold ${color} tabular-nums w-5 text-right`}>{val}</span>
                  </div>
                </div>
              ))}
              <div className="mt-2 px-3 py-1.5 rounded-xl text-xs text-muted-foreground font-semibold border" style={{ borderColor: 'var(--border-subtle)', background: 'var(--surface-2)' }}>
                Total completed today&nbsp;
                <span className="font-black text-foreground">{completedTasks} / {totalTasks}</span>
              </div>
            </div>
          </div>
        </div>

      {/* ── Today's Priority & Deals at Risk ── */}
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        {/* Today's Priority */}
        <div className="rounded-[24px] border bg-card p-5" style={{ borderColor: 'var(--border-default)' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <h2 className="text-base font-bold text-foreground">Today's Priority</h2>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full text-white" style={{ background: 'var(--brand-purple)' }}>
              {priorities.length}
            </span>
          </div>
          {priorities.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 h-40 text-sm text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 opacity-60" />
              All caught up for today!
            </div>
          ) : (
            <div className="space-y-3">
              {priorities.slice(0, 3).map((p, i) => (
                <motion.div key={p.priority_id}
                  initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.08 }}
                  className="rounded-xl border p-3.5" style={{ borderColor: 'var(--border-subtle)', background: 'var(--surface-2)' }}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Star className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <span className="text-xs font-bold text-muted-foreground">{p.related_lead ?? p.related_company ?? '—'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {p.due_date && (
                        <span className="text-[10px] font-semibold text-muted-foreground">{relDay(p.due_date)}</span>
                      )}
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                        p.priority_level === 'high' ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/15' :
                        p.priority_level === 'medium' ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/15' :
                        'bg-secondary text-muted-foreground'
                      }`}>{p.priority_level}</span>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-foreground leading-snug">{p.title}</p>
                  {p.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</p>
                  )}
                  {p.deal_value > 0 && (
                    <p className="text-xs font-bold mt-2" style={{ color: 'var(--brand-cyan)' }}>{formatINR(p.deal_value)}</p>
                  )}
                  <div className="flex gap-2 mt-3">
                    <button className="flex-1 text-xs font-semibold py-1.5 rounded-lg bg-secondary border cursor-pointer hover:bg-muted transition-colors" style={{ borderColor: 'var(--border-default)' }}>Done</button>
                    <button className="flex-1 text-xs font-semibold py-1.5 rounded-lg bg-secondary border cursor-pointer hover:bg-muted transition-colors" style={{ borderColor: 'var(--border-default)' }}>Snooze</button>
                    <button className="flex-1 text-xs font-semibold py-1.5 rounded-lg text-white cursor-pointer transition-colors" style={{ background: 'var(--brand-purple)' }}>Open</button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Deals at Risk */}
        <div className="rounded-[24px] border bg-card p-5" style={{ borderColor: 'var(--border-default)' }}>
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h2 className="text-base font-bold text-foreground">Deals at Risk</h2>
            <span className="text-[10px] text-muted-foreground font-medium">High-value opportunities requiring action</span>
          </div>
          <span className="text-sm font-bold tabular-nums text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-500/20">
            ₹ {formatINR(atRisk.reduce((s, d) => s + asNumber(d.value), 0))}
          </span>
        </div>

        {/* filter tabs */}
        <div className="flex items-center gap-2 mb-4">
          {([['all','All'], ['critical','Critical'], ['too_value','Top Value']] as const).map(([k, label]) => (
            <button key={k}
              onClick={() => setRiskFilter(k as typeof riskFilter)}
              className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                riskFilter === k
                  ? 'text-white border-transparent'
                  : 'bg-secondary border-border text-muted-foreground hover:bg-muted'
              }`}
              style={riskFilter === k ? { background: 'var(--brand-purple)', borderColor: 'transparent' } : {}}
            >
              {label}
              {k === 'critical' && <span className="ml-1.5 text-[9px]">⚠</span>}
              {k === 'too_value' && <span className="ml-1.5 text-[9px]">💰</span>}
            </button>
          ))}
          <span className="ml-auto text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Sorted by urgency</span>
        </div>

        {filteredRisk.length === 0 ? (
          <div className="flex items-center justify-center h-20 rounded-xl border border-dashed text-sm text-muted-foreground" style={{ borderColor: 'var(--border-default)' }}>
            {atRisk.length === 0 ? 'No deals at risk right now.' : 'No deals match this filter.'}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRisk.slice(0, 5).map((d, i) => {
              const isCritical = d.stalled_days >= 14;
              const isHighVal  = asNumber(d.value) >= 500000;
              return (
                <motion.div key={d.deal_id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.06 }}
                  className="flex items-center justify-between gap-4 rounded-xl border p-3.5 hover:bg-secondary/40 transition-colors"
                  style={{ borderColor: 'var(--border-subtle)', background: 'var(--surface-2)' }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-foreground truncate">{d.deal_title}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      {d.company_name && <span>{d.company_name}</span>}
                      <span className="text-muted-foreground/60">•</span>
                      <span>{d.stalled_days}d stalled</span>
                      <span className="text-muted-foreground/60">•</span>
                      <span>{d.probability != null ? `${d.probability}%` : ''} probability</span>
                      {d.risk_reason && (
                        <>
                          <span className="text-muted-foreground/60">•</span>
                          <span className="italic">{d.risk_reason}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-bold text-foreground tabular-nums">{formatINR(d.value)}</span>
                    <span className={`text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-wide ${
                      isCritical ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/15' :
                      isHighVal  ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/15' :
                      'bg-secondary text-muted-foreground'
                    }`}>
                      {isCritical ? 'HIGH RISK' : isHighVal ? 'HIGH VALUE' : 'MEDIUM RISK'}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
        <button onClick={() => onTabChange('deals')}
          className="mt-4 text-xs font-bold flex items-center gap-1 cursor-pointer hover:underline"
          style={{ color: 'var(--accent-color)' }}>
          View all at risk deals <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
      </div>

      {/* ── Pipeline Funnel Analysis ── */}
      <div className="rounded-[24px] border bg-card p-5" style={{ borderColor: 'var(--border-default)' }}>
        <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
          <div>
            <h2 className="text-base font-bold text-foreground">Pipeline Funnel Analysis</h2>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest mt-0.5">Conversion &amp; Drop-offs</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground font-semibold">↗ Top Relative Conversion</span>
          </div>
        </div>

        {byStage.length === 0 ? (
          <div className="h-44 flex items-center justify-center text-sm text-muted-foreground">No pipeline data yet.</div>
        ) : (
          <div className="flex items-end gap-3 mt-4">
            {byStage.map((s, i) => (
              <FunnelBar key={s.stage}
                stage={s.stage} count={s.count}
                pctVal={asNumber(s.percentage)}
                color={FUNNEL_COLORS[i % FUNNEL_COLORS.length]}
                maxCount={maxStageCount}
                delay={i * 80}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Revenue trend + Lead sources ── */}
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">

        {/* Revenue & Leads Over Time */}
        <div className="rounded-[24px] border bg-card p-5" style={{ borderColor: 'var(--border-default)' }}>
          <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
            <div>
              <h2 className="text-base font-bold text-foreground">Revenue &amp; Leads Over Time</h2>
            </div>
            <div className="flex items-center gap-2">
              {(['week','month','quarter','year'] as const).map(p => (
                <button key={p}
                  onClick={() => setPeriod(p)}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide cursor-pointer transition-colors ${
                    period === p ? 'text-white' : 'bg-secondary text-muted-foreground hover:bg-muted'
                  }`}
                  style={period === p ? { background: 'var(--brand-purple)' } : {}}
                >{p === 'year' ? 'This Year' : p.charAt(0).toUpperCase() + p.slice(1)}</button>
              ))}
            </div>
          </div>

          {/* legend */}
          <div className="flex items-center gap-4 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-blue-500 shrink-0" />
              <span className="text-[11px] font-semibold text-muted-foreground">Revenue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-[11px] font-semibold text-muted-foreground">Leads</span>
            </div>
          </div>

          <RevenueLeadsChart trend={trend} />

          {/* summary row */}
          <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-4" style={{ borderColor: 'var(--border-subtle)' }}>
            {[
              { label: 'Total Revenue', val: formatINR(rep?.revenue_stat?.total ?? 0), delta: formatPct(rep?.revenue_stat?.growth_pct), positive: asNumber(rep?.revenue_stat?.growth_pct) >= 0 },
              { label: 'Total Leads',   val: formatNum(kpis?.leads_assigned ?? 0),    delta: '— vs last year', positive: true },
            ].map(({ label, val, delta, positive }) => (
              <div key={label} className="rounded-xl p-3" style={{ background: 'var(--surface-2)' }}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
                <p className="text-lg font-bold text-foreground mt-0.5 tabular-nums">{val}</p>
                <div className={`flex items-center gap-1 text-[10px] font-bold mt-0.5 ${positive ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {delta}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lead Sources */}
        <div className="rounded-[24px] border bg-card p-5" style={{ borderColor: 'var(--border-default)' }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-foreground">Lead Sources</h2>
            <button className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground hover:text-foreground cursor-pointer">
              All Time <ChevronDown className="h-3 w-3" />
            </button>
          </div>
          {bySource.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-sm text-muted-foreground">No source data yet.</div>
          ) : (
            <SourceDonut data={bySource} />
          )}
          <button onClick={() => onTabChange('reports')}
            className="mt-5 text-xs font-bold flex items-center gap-1 cursor-pointer hover:underline"
            style={{ color: 'var(--accent-color)' }}>
            View detailed report <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── Upcoming Activities + Upcoming Meetings ── */}
      <div className="grid gap-6 xl:grid-cols-2">

        {/* Upcoming Activities */}
        <div className="rounded-[24px] border bg-card p-5" style={{ borderColor: 'var(--border-default)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-foreground">Upcoming Activities</h2>
            <button onClick={() => onTabChange('calendar')}
              className="flex items-center gap-1 text-xs font-bold cursor-pointer hover:underline"
              style={{ color: 'var(--accent-color)' }}>
              View Calendar <ExternalLink className="h-3 w-3" />
            </button>
          </div>

          {todayTasks.length === 0 ? (
            <div className="flex items-center justify-center h-28 rounded-xl border border-dashed text-sm text-muted-foreground" style={{ borderColor: 'var(--border-default)' }}>
              No upcoming activities. Enjoy the quiet!
            </div>
          ) : (
            <div className="space-y-2.5">
              {todayTasks.slice(0, 5).map((t, i) => {
                const isOverdue = t.due_date && new Date(t.due_date) < new Date();
                return (
                  <motion.div key={t.id}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.07 }}
                    className="flex items-start gap-3 rounded-xl border p-3 hover:bg-secondary/40 transition-colors"
                    style={{ borderColor: 'var(--border-subtle)', background: 'var(--surface-2)' }}
                  >
                    <div className={`size-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      isOverdue ? 'bg-rose-100 dark:bg-rose-500/15' : 'bg-secondary'
                    }`}>
                      {t.source === 'call' ? (
                        <PhoneCall className={`h-3.5 w-3.5 ${isOverdue ? 'text-rose-500' : 'text-muted-foreground'}`} />
                      ) : t.source === 'meeting' ? (
                        <Video className={`h-3.5 w-3.5 ${isOverdue ? 'text-rose-500' : 'text-blue-500'}`} />
                      ) : t.source === 'email' ? (
                        <Mail className={`h-3.5 w-3.5 ${isOverdue ? 'text-rose-500' : 'text-muted-foreground'}`} />
                      ) : (
                        <Circle className={`h-3.5 w-3.5 ${isOverdue ? 'text-rose-500' : 'text-muted-foreground'}`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground leading-tight">{t.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t.source ? t.source.charAt(0).toUpperCase() + t.source.slice(1) : 'Task'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-xs font-bold ${isOverdue ? 'text-rose-500' : 'text-muted-foreground'}`}>
                        {t.due_date ? relDay(t.due_date) : '—'}
                      </p>
                      {t.due_date && (
                        <p className="text-[10px] text-muted-foreground/60">{fmtTime(t.due_date)}</p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          <button onClick={() => onTabChange('activities')}
            className="mt-4 text-xs font-bold flex items-center gap-1 cursor-pointer hover:underline"
            style={{ color: 'var(--accent-color)' }}>
            View all activities <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Upcoming Meetings */}
        <div className="rounded-[24px] border bg-card p-5" style={{ borderColor: 'var(--border-default)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-foreground">Upcoming Meetings</h2>
            <button onClick={() => onTabChange('calendar')}
              className="flex items-center gap-1 text-xs font-bold cursor-pointer hover:underline"
              style={{ color: 'var(--accent-color)' }}>
              View Calendar <ExternalLink className="h-3 w-3" />
            </button>
          </div>

          {meetings.length === 0 ? (
            <div className="flex items-center justify-center h-28 rounded-xl border border-dashed text-sm text-muted-foreground" style={{ borderColor: 'var(--border-default)' }}>
              No meetings scheduled today.
            </div>
          ) : (
            <div className="space-y-2.5">
              {meetings.slice(0, 5).map((m, i) => (
                <motion.div key={m.id}
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.07 }}
                  className="flex items-start gap-3 rounded-xl border p-3 hover:bg-secondary/40 transition-colors"
                  style={{ borderColor: 'var(--border-subtle)', background: 'var(--surface-2)' }}
                >
                  <div className="size-8 rounded-full bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center shrink-0 mt-0.5">
                    <Video className="h-3.5 w-3.5 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground leading-tight">{m.title}</p>
                    {m.contact_name && (
                      <p className="text-xs text-muted-foreground mt-0.5">{m.contact_name}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-muted-foreground">{fmtDate(m.start_time)}</p>
                    <p className="text-[10px] text-muted-foreground/60">{fmtTime(m.start_time)}</p>
                    {m.zoom_link && (
                      <a href={m.zoom_link} target="_blank" rel="noreferrer"
                        className="text-[10px] font-bold text-blue-500 hover:underline flex items-center gap-0.5 justify-end mt-0.5">
                        Join <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <button onClick={() => onTabChange('calendar')}
            className="mt-4 text-xs font-bold flex items-center gap-1 cursor-pointer hover:underline"
            style={{ color: 'var(--accent-color)' }}>
            View all meetings <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

    </div>
  );
}
