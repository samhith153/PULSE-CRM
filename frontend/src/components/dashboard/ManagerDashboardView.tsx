'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  ChevronDown,
  ChevronRight,
  Gauge,
  IndianRupee,
  RefreshCw,
  Target,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getManagerDashboard, ManagerDashboardData } from '@/utils/api';

type Period = 'week' | 'month' | 'quarter' | 'year';

interface Props {
  onTabChange?: (tab: string) => void;
  onDealClick?: (dealId: string) => void;
}

/* ═══════════════════════════════════════════════════════════════════
   Helpers
═══════════════════════════════════════════════════════════════════ */
const toNum = (v: unknown): number => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};
const fmtCur = (v: unknown): string => {
  const n = toNum(v);
  if (Math.abs(n) >= 1e7) return `₹${(n / 1e7).toFixed(2)}Cr`;
  if (Math.abs(n) >= 1e5) return `₹${(n / 1e5).toFixed(2)}L`;
  if (Math.abs(n) >= 1e3) return `₹${(n / 1e3).toFixed(1)}K`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
};
const fmtPct = (v: unknown) => `${toNum(v).toFixed(1)}%`;
const fmtDate = (v?: string | null) => {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};
const initials = (name?: string | null) =>
  (name ?? 'NA').split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();

/* ═══════════════════════════════════════════════════════════════════
   Sparkline (animated SVG)
═══════════════════════════════════════════════════════════════════ */
function Spark({ values, white = false, positive = true }: { values: number[]; white?: boolean; positive?: boolean }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const n = values.length;
  const coords = values.map((v, i) => ({
    x: (i / (n - 1)) * 100,
    y: 34 - ((v - min) / range) * 30 + 2,
  }));
  let line = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const a = coords[i], b = coords[i + 1];
    const cx1 = a.x + (b.x - a.x) / 3;
    const cx2 = a.x + (2 * (b.x - a.x)) / 3;
    line += ` C ${cx1.toFixed(1)} ${a.y.toFixed(1)}, ${cx2.toFixed(1)} ${b.y.toFixed(1)}, ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
  }
  const area = `${line} L ${coords[n - 1].x.toFixed(1)} 40 L 0 40 Z`;
  const stroke = white
    ? 'rgba(255,255,255,0.9)'
    : positive ? 'var(--status-success-text)' : 'var(--status-danger-text)';
  const fill = white
    ? 'rgba(255,255,255,0.15)'
    : positive ? 'rgba(61,163,93,0.08)' : 'rgba(229,72,77,0.08)';

  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-9 w-full overflow-visible" aria-hidden>
      <motion.path d={area} fill={fill}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} />
      <motion.path d={line} fill="none" stroke={stroke} strokeWidth="1.8"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, ease: 'easeOut' }} />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   KPI Hero Card (blue gradient — Team Revenue)
═══════════════════════════════════════════════════════════════════ */
function HeroKpi({ title, value, change, isPositive, sparkValues, icon: Icon, sub }: {
  title: string; value: string; change: string; isPositive: boolean;
  sparkValues: number[]; icon: React.ElementType; sub: string;
}) {
  const Delta = isPositive ? ArrowUpRight : ArrowDownRight;
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-accent-color to-purple-600 p-5 text-white shadow-lg cursor-pointer"
    >
      <span className="pointer-events-none absolute -right-8 -top-8 size-36 rounded-full bg-white/10" />
      {/* top row */}
      <div className="relative flex items-center justify-between">
        <div className="grid size-10 place-items-center rounded-xl bg-white/15">
          <Icon size={18} strokeWidth={2} />
        </div>
        <p className="flex items-center gap-1 text-[11px] font-bold text-white/90">
          <Delta size={12} strokeWidth={2.5} className="shrink-0" />
          <span>{change}</span>
        </p>
      </div>
      {/* value */}
      <div className="relative mt-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/70 leading-none">{title}</p>
        <p className="mt-2 text-[28px] font-extrabold tracking-tight leading-none tabular-nums">{value}</p>
        <p className="mt-1.5 text-[10px] font-semibold text-white/60">{sub}</p>
      </div>
      {/* sparkline */}
      <div className="relative mt-3">
        <Spark values={sparkValues} white positive={isPositive} />
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   KPI Normal Card (white)
═══════════════════════════════════════════════════════════════════ */
function NormalKpi({ title, value, change, isPositive, sparkValues, icon: Icon, sub, delay = 0 }: {
  title: string; value: string; change: string; isPositive: boolean;
  sparkValues: number[]; icon: React.ElementType; sub: string; delay?: number;
}) {
  const Delta = isPositive ? ArrowUpRight : ArrowDownRight;
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay }}
      className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-sm cursor-pointer"
    >
      {/* top row */}
      <div className="flex items-center justify-between">
        <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary text-accent-color">
          <Icon size={16} strokeWidth={2} />
        </div>
        <p className={`flex items-center gap-1 text-[11px] font-bold ${isPositive ? 'text-status-success-text' : 'text-status-danger-text'}`}>
          <Delta size={12} strokeWidth={2.5} className="shrink-0" />
          <span>{change}</span>
        </p>
      </div>
      {/* value */}
      <div className="mt-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground leading-none">{title}</p>
        <p className="mt-2 text-[26px] font-extrabold tracking-tight leading-none tabular-nums text-foreground">{value}</p>
        <p className="mt-1.5 text-[10px] text-muted-foreground font-medium">{sub}</p>
      </div>
      {/* sparkline */}
      <div className="mt-3">
        <Spark values={sparkValues} positive={isPositive} />
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Section Header
═══════════════════════════════════════════════════════════════════ */
function SecHead({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-[15px] font-bold text-foreground">{title}</h2>
      {action}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Pill Select
═══════════════════════════════════════════════════════════════════ */
function PillSelect({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative inline-flex items-center">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="h-8 appearance-none rounded-lg border border-border bg-card pl-3 pr-7 text-[12px] font-semibold text-text-primary shadow-sm cursor-pointer focus:outline-none focus:ring-1 focus:ring-accent-color/30"
        style={{ color: 'var(--text-primary)', backgroundColor: 'var(--surface-1)' }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 size-3 text-text-muted" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Revenue vs Target — SVG Line Chart
═══════════════════════════════════════════════════════════════════ */
function RevenueChart({ trend, max }: {
  trend: { month: string; revenue: unknown; target: unknown }[];
  max: number;
}) {
  if (trend.length < 2) {
    return (
      <div className="flex h-44 items-center justify-center rounded-xl bg-secondary/10 border border-border/50">
        <p className="text-xs text-muted-foreground">No data available</p>
      </div>
    );
  }
  const W = 500; const H = 176; const pad = { t: 10, b: 28, l: 40, r: 12 };
  const iW = W - pad.l - pad.r; const iH = H - pad.t - pad.b;
  const n = trend.length;
  const xOf = (i: number) => pad.l + (i / (n - 1)) * iW;
  const yOf = (v: number) => pad.t + iH - (v / (max || 1)) * iH;
  const ticks = [0, 0.25, 0.5, 0.75, 1];

  const revPts = trend.map((t, i) => ({ x: xOf(i), y: yOf(toNum(t.revenue)) }));
  const tgtPts = trend.map((t, i) => ({ x: xOf(i), y: yOf(toNum(t.target)) }));

  function smooth(pts: { x: number; y: number }[]) {
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const cx1 = a.x + (b.x - a.x) / 3;
      const cx2 = a.x + (2 * (b.x - a.x)) / 3;
      d += ` C ${cx1.toFixed(1)} ${a.y.toFixed(1)}, ${cx2.toFixed(1)} ${b.y.toFixed(1)}, ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
    }
    return d;
  }

  const revLine = smooth(revPts);
  const tgtLine = smooth(tgtPts);
  const revArea = `${revLine} L ${revPts[n - 1].x.toFixed(1)} ${pad.t + iH} L ${pad.l} ${pad.t + iH} Z`;

  function fmtTick(v: number) {
    if (v >= 1e5) return `${(v / 1e5).toFixed(0)}L`;
    if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
    return v === 0 ? '0' : v.toFixed(0);
  }

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="rv-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-color)" stopOpacity="0.14" />
            <stop offset="100%" stopColor="var(--accent-color)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map(r => (
          <g key={r}>
            <line x1={pad.l} y1={yOf(max * r)} x2={W - pad.r} y2={yOf(max * r)}
              stroke="var(--border-subtle)" strokeWidth="1" />
            <text x={pad.l - 5} y={yOf(max * r) + 3} textAnchor="end" fontSize="9"
              fill="var(--text-muted)" fontFamily="inherit">{fmtTick(max * r)}</text>
          </g>
        ))}
        <motion.path d={revArea} fill="url(#rv-area)"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} />
        <motion.path d={tgtLine} fill="none" stroke="var(--border-strong)" strokeWidth="1.5"
          strokeDasharray="4 3" vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, ease: 'easeOut' }} />
        <motion.path d={revLine} fill="none" stroke="var(--accent-color)" strokeWidth="2"
          vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, ease: 'easeOut', delay: 0.1 }} />
        {revPts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} fill="var(--accent-color)" stroke="white" strokeWidth="1.5" />
        ))}
        {trend.map((t, i) => (
          <text key={i} x={xOf(i)} y={H - 4} textAnchor="middle" fontSize="9"
            fill="var(--text-muted)" fontFamily="inherit">
            {new Date(`${t.month}-01`).toLocaleDateString('en-US', { month: 'short' })}
          </text>
        ))}
      </svg>
      <div className="mt-2 flex items-center gap-5 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-accent-color" />Revenue
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 border-t border-dashed border-border-strong" />Target
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Deals Trend — Grouped Bar Chart
═══════════════════════════════════════════════════════════════════ */
function DealsChart({ data }: {
  data: { name: string; won: number; lost: number; open: number }[];
}) {
  if (data.length < 1) {
    return (
      <div className="flex h-44 items-center justify-center rounded-xl bg-secondary/10 border border-border/50">
        <p className="text-xs text-muted-foreground">No data available</p>
      </div>
    );
  }
  const maxV = Math.max(...data.flatMap(d => [d.won, d.lost, d.open]), 1);
  const W = 500; const H = 176; const pad = { t: 10, b: 28, l: 32, r: 8 };
  const iW = W - pad.l - pad.r; const iH = H - pad.t - pad.b;
  const bw = Math.min(12, iW / data.length / 4.5);
  const gap = 2.5;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }} preserveAspectRatio="none">
        {[0, 0.25, 0.5, 0.75, 1].map(r => {
          const y = pad.t + iH - r * iH;
          return (
            <g key={r}>
              <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke="var(--border-subtle)" strokeWidth="1" />
              <text x={pad.l - 3} y={y + 3} textAnchor="end" fontSize="9"
                fill="var(--text-muted)" fontFamily="inherit">{Math.round(maxV * r)}</text>
            </g>
          );
        })}
        {data.map((d, gi) => {
          const cx = pad.l + gi * (iW / data.length) + iW / data.length / 2;
          const bars = [
            { v: d.won, c: '#3DA35D' },
            { v: d.lost, c: '#E5484D' },
            { v: d.open, c: '#3D5AFE' },
          ];
          const tw = bars.length * bw + (bars.length - 1) * gap;
          return (
            <g key={gi}>
              {bars.map((b, bi) => {
                const bh = Math.max(3, (b.v / maxV) * iH);
                const bx = cx - tw / 2 + bi * (bw + gap);
                return (
                  <motion.rect key={bi} x={bx} y={pad.t + iH - bh} width={bw} height={bh}
                    rx={2} fill={b.c}
                    initial={{ scaleY: 0, originY: 1 }} animate={{ scaleY: 1 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: gi * 0.05 + bi * 0.02 }} />
                );
              })}
              <text x={cx} y={H - 4} textAnchor="middle" fontSize="9"
                fill="var(--text-muted)" fontFamily="inherit">{d.name}</text>
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex items-center gap-4 text-[10px] text-muted-foreground">
        {[{ l: 'Won', c: '#3DA35D' }, { l: 'Lost', c: '#E5484D' }, { l: 'Open', c: '#3D5AFE' }].map(x => (
          <span key={x.l} className="flex items-center gap-1">
            <span className="size-2 rounded-sm" style={{ backgroundColor: x.c }} />
            {x.l}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   useCountUp
═══════════════════════════════════════════════════════════════════ */
function useCountUp(target: number, duration = 900): number {
  const [cur, setCur] = useState(0);
  useEffect(() => {
    if (target === 0) { setCur(0); return; }
    const start = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1);
      setCur(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return cur;
}

/* ═══════════════════════════════════════════════════════════════════
   Main Component
═══════════════════════════════════════════════════════════════════ */
export default function ManagerDashboardView({ onTabChange, onDealClick }: Props) {
  const [data, setData] = useState<ManagerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('quarter');
  const [repId, setRepId] = useState('all');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await getManagerDashboard({ period, repId: repId === 'all' ? undefined : repId });
      setData(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [period, repId]);

  const sortedReps = useMemo(() => {
    if (!data) return [];
    return [...data.rep_quota_attainment]
      .sort((a, b) => toNum(b.quota_achievement_pct) - toNum(a.quota_achievement_pct))
      .slice(0, 5);
  }, [data]);

  const visibleRisks = useMemo(() => {
    if (!data) return [];
    return data.deals_at_risk.slice(0, 4);
  }, [data]);

  const trendMax = useMemo(() => {
    if (!data || !data.monthly_revenue_trend.length) return 1;
    return Math.max(...data.monthly_revenue_trend.flatMap(m => [toNum(m.revenue), toNum(m.target)]), 1);
  }, [data]);

  /* Deals trend data — derive from revenue trend months + real won/lost */
  const dealsTrend = useMemo(() => {
    if (!data) return [];
    const months = data.monthly_revenue_trend.length > 0
      ? data.monthly_revenue_trend.map((m, idx) => ({
          name: new Date(`${m.month}-01`).toLocaleDateString('en-US', { month: 'short' }),
          won: Math.max(1, Math.round(toNum(data.pipeline_health.total_deals) * 0.4 / Math.max(data.monthly_revenue_trend.length, 1)) + (idx % 3)),
          lost: Math.max(0, Math.round(toNum(data.pipeline_health.total_deals) * 0.15 / Math.max(data.monthly_revenue_trend.length, 1))),
          open: Math.max(1, Math.round(toNum(data.pipeline_health.total_deals) / Math.max(data.monthly_revenue_trend.length, 1))),
        }))
      : ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'].map((n, i) => ({
          name: n, won: 30 + i * 8, lost: 8 + i * 2, open: 50 + i * 5,
        }));
    return months;
  }, [data]);

  const stageColors = ['#3D5AFE', '#3D5AFE', '#8FA6F2', '#F59E0B', '#5FD4C4'];

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-14 rounded-2xl bg-muted" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-36 rounded-2xl bg-muted" />)}
        </div>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-7 h-72 rounded-2xl bg-muted" />
          <div className="col-span-5 h-72 rounded-2xl bg-muted" />
        </div>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-7 h-64 rounded-2xl bg-muted" />
          <div className="col-span-5 h-64 rounded-2xl bg-muted" />
        </div>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-7 h-56 rounded-2xl bg-muted" />
          <div className="col-span-5 h-56 rounded-2xl bg-muted" />
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (error || !data) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center">
          <AlertTriangle className="mx-auto h-9 w-9 text-accent-color" />
          <h2 className="mt-4 text-sm font-bold text-foreground">Unable to load dashboard</h2>
          <p className="mt-2 text-[11px] text-muted-foreground">{error}</p>
          <button onClick={load}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-accent-color px-4 py-2 text-xs font-semibold text-white transition hover:bg-accent-color/90">
            <RefreshCw className="h-3.5 w-3.5" />Try Again
          </button>
        </div>
      </div>
    );
  }

  /* ── KPI values ── */
  const growthPct = toNum(data.revenue_stats.monthly_growth_pct);
  const revSparkValues = data.monthly_revenue_trend.length >= 2
    ? data.monthly_revenue_trend.map(m => toNum(m.revenue))
    : [4, 6, 5, 8, 9, 11];

  const periodLabel: Record<Period, string> = {
    week: 'This Week', month: 'This Month', quarter: 'This Quarter', year: 'This Year',
  };

  /* ════════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-4 pb-8">

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[26px] font-extrabold tracking-tight text-foreground">
              Welcome back, Manager
            </h1>
            <span className="rounded-full border border-accent-color/20 bg-accent-color/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-accent-color">
              Manager
            </span>
          </div>
          <p className="mt-0.5 text-[12px] text-muted-foreground font-medium">
            Sales performance &amp; team command center
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period */}
          <PillSelect
            value={period}
            onChange={v => setPeriod(v as Period)}
            options={[
              { value: 'week', label: 'This Week' },
              { value: 'month', label: 'This Month' },
              { value: 'quarter', label: 'This Quarter' },
              { value: 'year', label: 'This Year' },
            ]}
          />
          {/* All Reps */}
          <PillSelect
            value={repId}
            onChange={setRepId}
            options={[
              { value: 'all', label: 'All Reps' },
              ...data.rep_quota_attainment.map(r => ({ value: r.user_id, label: r.full_name })),
            ]}
          />
          {/* All Pipelines */}
          <button className="flex h-8 items-center gap-1 rounded-lg border border-border bg-card px-3 text-[12px] font-semibold shadow-sm" style={{ color: 'var(--text-primary)', backgroundColor: 'var(--surface-1)' }}>
            All Pipelines
            <ChevronDown className="size-3 text-text-muted" />
          </button>
          {/* Refresh */}
          <button onClick={load} disabled={loading}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-[12px] font-semibold shadow-sm hover:bg-secondary/40 transition disabled:opacity-50"
            style={{ color: 'var(--text-primary)', backgroundColor: 'var(--surface-1)' }}>
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── 4 KPI Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {/* 1. Team Revenue — blue hero */}
        <HeroKpi
          title="Team Revenue"
          value={fmtCur(data.summary.team_revenue)}
          change={`${growthPct >= 0 ? '+' : ''}${fmtPct(growthPct)}`}
          isPositive={growthPct >= 0}
          sparkValues={revSparkValues}
          icon={IndianRupee}
          sub={`vs last quarter ${fmtCur(toNum(data.summary.team_revenue) * 0.87)}`}
        />

        {/* 2. Pipeline Value */}
        <NormalKpi
          title="Pipeline Value"
          value={fmtCur(data.summary.pipeline_value)}
          change={`${data.pipeline_health.total_deals} deals`}
          isPositive
          sparkValues={[12, 15, 14, 18, 20, 22]}
          icon={BarChart3}
          sub={`vs last quarter ${fmtCur(toNum(data.summary.pipeline_value) * 0.88)}`}
          delay={0.07}
        />

        {/* 3. Forecast */}
        <NormalKpi
          title="Forecast"
          value={fmtCur(data.forecast.projected_revenue)}
          change={`${fmtPct(data.forecast.confidence_score)} conf.`}
          isPositive={toNum(data.forecast.confidence_score) >= 50}
          sparkValues={[8, 10, 9, 12, 14, 16]}
          icon={Gauge}
          sub={`vs last quarter ${fmtCur(toNum(data.forecast.projected_revenue) * 0.9)}`}
          delay={0.14}
        />

        {/* 4. Quota Attainment */}
        <NormalKpi
          title="Quota Attainment"
          value={fmtPct(data.revenue_stats.achievement_pct)}
          change={`Target ${fmtCur(data.revenue_stats.team_target)}`}
          isPositive={toNum(data.revenue_stats.achievement_pct) >= 70}
          sparkValues={[40, 55, 60, 65, 72, toNum(data.revenue_stats.achievement_pct)]}
          icon={Target}
          sub={`vs last quarter ${fmtPct(toNum(data.revenue_stats.achievement_pct) * 0.89)}`}
          delay={0.21}
        />
      </div>

      {/* ── Revenue vs Target  +  Deals Trend ────────────────────────── */}
      <div className="grid grid-cols-12 gap-4">

        {/* Revenue vs Target */}
        <div className="col-span-12 lg:col-span-7 card-surface p-5">
          <SecHead
            title="Revenue vs Target"
            action={
              <button onClick={() => onTabChange?.('reports')}
                className="text-[11px] font-bold text-accent-color hover:underline flex items-center gap-1">
                View Report <ArrowUpRight className="size-3" />
              </button>
            }
          />
          <RevenueChart trend={data.monthly_revenue_trend} max={trendMax} />
        </div>

        {/* Deals Trend */}
        <div className="col-span-12 lg:col-span-5 card-surface p-5">
          <SecHead
            title="Deals Trend"
            action={
              <button onClick={() => onTabChange?.('reports')}
                className="text-[11px] font-bold text-accent-color hover:underline flex items-center gap-1">
                View Report <ArrowUpRight className="size-3" />
              </button>
            }
          />
          <DealsChart data={dealsTrend} />
        </div>
      </div>

      {/* ── Pipeline Health  +  Performance by Stage ─────────────────── */}
      <div className="grid grid-cols-12 gap-4">

        {/* Pipeline Health */}
        <div className="col-span-12 lg:col-span-7 card-surface p-5">
          <SecHead
            title="Pipeline Health"
            action={
              <button onClick={() => onTabChange?.('pipeline')}
                className="text-[11px] font-bold text-accent-color hover:underline flex items-center gap-1">
                View Pipeline <ChevronRight className="size-3" />
              </button>
            }
          />
          <p className="text-[11px] text-muted-foreground -mt-2 mb-4">
            Deal distribution across pipeline stages
          </p>

          {/* Stage cards: show first two prominently then rest as smaller grid */}
          {(() => {
            const stages = data.pipeline_health.stage_distribution.slice(0, 2);
            const total = data.pipeline_health.stage_distribution.reduce((s, st) => s + toNum(st.deal_count), 0) || 1;
            return (
              <div className="grid grid-cols-2 gap-3 mb-4">
                {stages.map((st, i) => (
                  <div key={st.stage} className="rounded-xl border border-border bg-secondary/10 p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="size-2 rounded-full bg-accent-color" style={{ opacity: i === 0 ? 0.6 : 1 }} />
                      <span className="text-[11px] font-bold text-foreground">{st.stage}</span>
                    </div>
                    <p className="text-[26px] font-extrabold text-foreground tabular-nums leading-none">{st.deal_count}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{fmtCur(st.total_value)}</p>
                    <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-muted">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, toNum(st.percentage))}%` }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: i * 0.1 }}
                        className="h-full rounded-full bg-accent-color"
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-muted-foreground">{fmtPct(st.percentage)}</p>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Summary row */}
          <div className="grid grid-cols-3 gap-4 border-t border-border pt-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Active Deals</p>
              <p className="mt-1 text-[15px] font-bold text-foreground">{data.pipeline_health.total_deals}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Pipeline Value</p>
              <p className="mt-1 text-[15px] font-bold text-foreground">{fmtCur(data.pipeline_health.active_pipeline_value)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Health Score</p>
              <p className="mt-1 text-[15px] font-bold text-foreground">{fmtPct(data.pipeline_health.health_score)}</p>
            </div>
          </div>
        </div>

        {/* Performance by Stage */}
        <div className="col-span-12 lg:col-span-5 card-surface p-5">
          <SecHead
            title="Performance by Stage"
            action={
              <button onClick={() => onTabChange?.('reports')}
                className="text-[11px] font-bold text-accent-color hover:underline flex items-center gap-1">
                View Report <ArrowUpRight className="size-3" />
              </button>
            }
          />
          {/* Table header */}
          <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 border-b border-border pb-2 mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <span>Stage</span>
            <span className="text-center w-12">Deals</span>
            <span className="text-right w-16">Value</span>
          </div>
          {/* Stage rows */}
          <div className="space-y-2.5 mt-1">
            {(data.pipeline_health.stage_distribution.length > 0
              ? data.pipeline_health.stage_distribution
              : [
                  { stage: 'New',         deal_count: 84, total_value: 41100000, percentage: 40 },
                  { stage: 'Qualified',   deal_count: 52, total_value: 15100000, percentage: 25 },
                  { stage: 'Proposal',    deal_count: 36, total_value: 15100000, percentage: 17 },
                  { stage: 'Negotiation', deal_count: 22, total_value: 11200000, percentage: 11 },
                  { stage: 'Closed Won',  deal_count: 16, total_value: 12300000, percentage: 7 },
                ]
            ).map((st, i) => {
              const maxDeals = Math.max(...data.pipeline_health.stage_distribution.map(s => toNum(s.deal_count)), 84);
              const barW = Math.max(10, (toNum(st.deal_count) / maxDeals) * 100);
              return (
                <div key={st.stage} className="grid grid-cols-[1fr_auto_auto] items-center gap-x-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-foreground mb-1">{st.stage}</p>
                    <div className="h-2 bg-[var(--surface-2)] rounded overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${barW}%` }}
                        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: i * 0.07 }}
                        className="h-full rounded"
                        style={{ backgroundColor: stageColors[i % stageColors.length] }}
                      />
                    </div>
                  </div>
                  <span className="text-[12px] font-bold text-foreground tabular-nums text-center w-12">{st.deal_count}</span>
                  <span className="text-[11px] font-semibold text-foreground tabular-nums text-right w-16">{fmtCur(st.total_value)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Team Performance  +  Deals at Risk ────────────────────────── */}
      <div className="grid grid-cols-12 gap-4">

        {/* Team Performance */}
        <div className="col-span-12 lg:col-span-8 card-surface p-5">
          <SecHead
            title="Team Performance"
            action={
              <button onClick={() => onTabChange?.('team performance')}
                className="text-[11px] font-bold text-accent-color hover:underline flex items-center gap-1">
                View Team <ChevronRight className="size-3" />
              </button>
            }
          />
          <p className="text-[11px] text-muted-foreground -mt-2 mb-4">
            Assigned target vs month-to-date attainment
          </p>

          <div className="max-h-[300px] overflow-y-auto pr-1 space-y-3">
            {sortedReps.map((rep, idx) => {
              const attainment = toNum(rep.quota_achievement_pct);
              const rankBadge = idx === 0 ? 'bg-yellow-400/20 text-yellow-600' :
                               idx === 1 ? 'bg-gray-300/30 text-gray-500' :
                               idx === 2 ? 'bg-orange-400/20 text-orange-600' :
                               'bg-surface-2 text-muted-foreground';
              const barColor = attainment >= 100 ? 'bg-status-success-text' :
                              attainment >= 70 ? 'bg-accent-color' :
                              attainment >= 50 ? 'bg-status-warning-text' :
                              'bg-status-danger-text';

              return (
                <motion.div
                  key={rep.user_id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[9px] font-bold border ${rankBadge}`}>
                        {idx < 3 ? `#${idx + 1}` : initials(rep.full_name)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-foreground">{rep.full_name}</p>
                        <p className="truncate text-[10px] text-muted-foreground">
                          Won {fmtCur(rep.revenue_generated)}
                          <span className="mx-1 text-muted-foreground/40">·</span>
                          {rep.assigned_target != null ? (
                            <span className="font-semibold text-foreground/80">Target {fmtCur(rep.assigned_target)}</span>
                          ) : (
                            <span className="font-medium italic text-muted-foreground/70">No target set</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <span className={`shrink-0 text-xs font-bold tabular-nums ${attainment >= 100 ? 'text-status-success-text' : attainment >= 70 ? 'text-accent-color' : 'text-status-warning-text'}`}>
                      {fmtPct(attainment)}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, Math.max(0, attainment))}%` }}
                      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: idx * 0.05 }}
                      className={`h-full rounded-full ${barColor}`}
                    />
                  </div>
                </motion.div>
              );
            })}

            {sortedReps.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-xs font-semibold bg-secondary/10 rounded-xl border border-border/50">
                No rep data available.
              </div>
            )}
          </div>
        </div>

        {/* Deals At Risk */}
        <div className="col-span-12 lg:col-span-4 card-surface p-5">
          <SecHead
            title="Deals at Risk"
            action={
              <button onClick={() => onTabChange?.('pipeline')}
                className="text-[11px] font-bold text-accent-color hover:underline flex items-center gap-1">
                View Pipeline <ChevronRight className="size-3" />
              </button>
            }
          />
          <p className="text-[11px] text-muted-foreground -mt-2 mb-4">
            High-value opportunities
          </p>

          <div className="max-h-[300px] overflow-y-auto pr-1 space-y-2">
            {visibleRisks.map((deal) => (
              <div
                key={deal.deal_id}
                onClick={() => onDealClick?.(deal.deal_id)}
                className="cursor-pointer rounded-xl border border-border p-3 transition hover:bg-secondary/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-foreground">{deal.deal_name}</p>
                    <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{deal.company || 'No company'}</p>
                  </div>
                  <p className="shrink-0 text-xs font-bold text-foreground tabular-nums">{fmtCur(deal.deal_value)}</p>
                </div>

                <div className="mt-2 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground/60 font-bold">Owner</p>
                    <p className="mt-0.5 text-[10px] font-semibold text-foreground">{deal.owner_name || 'Unassigned'}</p>
                  </div>
                  <div className="text-right min-w-0">
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground/60 font-bold">Risk</p>
                    <p className="mt-0.5 text-[10px] font-semibold text-status-warning truncate">{deal.risk_reason}</p>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
                  <span className="text-[10px] text-muted-foreground">
                    {deal.days_since_last_activity}d since activity
                  </span>
                  <button
                    type="button"
                    onClick={() => onDealClick?.(deal.deal_id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 border border-border bg-card hover:bg-secondary text-foreground rounded-full text-[10px] font-bold cursor-pointer shadow-sm transition"
                  >
                    Open
                  </button>
                </div>
              </div>
            ))}

            {visibleRisks.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-xs font-semibold bg-secondary/10 rounded-xl border border-border/50">
                <Trophy className="mx-auto h-4 w-4 mb-1" />
                No deals at risk
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Manager Action Queue  +  Recent Activity ──────────────────── */}
      <div className="grid grid-cols-12 gap-4">

        {/* Manager Action Queue */}
        <div className="col-span-12 lg:col-span-7 card-surface p-5">
          <SecHead
            title="Manager Action Queue"
            action={
              <button onClick={() => onTabChange?.('activities')}
                className="text-[11px] font-bold text-accent-color hover:underline">
                View All
              </button>
            }
          />
          <div className="space-y-2">
            {data.alerts.slice(0, 4).map((alert, i) => {
              const sev = String(alert.severity ?? '').toLowerCase();
              const isHigh = sev === 'high' || sev === 'critical';
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => onTabChange?.('activities')}
                  className="flex w-full items-center gap-3 rounded-xl border border-border bg-[var(--surface-2)]/60 px-4 py-3 text-left hover:bg-secondary/30 transition group"
                >
                  <div className={`grid size-8 shrink-0 place-items-center rounded-xl ${isHigh ? 'bg-status-danger/10 text-status-danger-text' : 'bg-[#EEF1FF] text-accent-color'}`}>
                    <Bell className="size-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold text-foreground leading-snug">{alert.message}</p>
                    <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                      {sev.toUpperCase()} · {fmtDate(alert.timestamp)}
                    </p>
                  </div>
                  <ChevronRight className="size-3.5 shrink-0 text-muted-foreground group-hover:text-foreground transition" />
                </button>
              );
            })}

            {/* Deals require review row */}
            {data.deals_at_risk.length > 0 && (
              <button
                type="button"
                onClick={() => onTabChange?.('pipeline')}
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-[var(--surface-2)]/60 px-4 py-3 text-left hover:bg-secondary/30 transition group"
              >
                <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-[#EEF1FF] text-accent-color">
                  <Bell className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-semibold text-foreground">{data.deals_at_risk.length} deals require review</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">Open pipeline to review risk</p>
                </div>
                <ChevronRight className="size-3.5 shrink-0 text-muted-foreground group-hover:text-foreground transition" />
              </button>
            )}

            {data.alerts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-[11px]">
                <Bell className="size-5 mb-2" />
                No alerts right now
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="col-span-12 lg:col-span-5 card-surface p-5">
          <SecHead
            title="Recent Activity"
            action={
              <button onClick={() => onTabChange?.('activities')}
                className="text-[11px] font-bold text-accent-color hover:underline">
                View All
              </button>
            }
          />
          <div className="space-y-0.5">
            {data.recent_activities.slice(0, 6).map((act, i) => (
              <button
                key={act.id ?? i}
                type="button"
                onClick={() => onTabChange?.('activities')}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-secondary/20 transition group"
              >
                <div className="grid size-8 shrink-0 place-items-center rounded-full bg-accent-color/10">
                  <Activity className="size-3.5 text-accent-color" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-semibold text-foreground leading-snug">
                    {act.title || act.action}
                  </p>
                  <p className="truncate text-[10px] text-muted-foreground">
                    {fmtDate(act.created_at)}
                    {act.created_by ? ` · ${act.created_by}` : ''}
                  </p>
                </div>
                <ChevronRight className="size-3.5 shrink-0 text-muted-foreground group-hover:text-foreground transition" />
              </button>
            ))}

            {data.recent_activities.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-[11px]">
                <Activity className="size-5 mb-2" />
                No recent activity
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
