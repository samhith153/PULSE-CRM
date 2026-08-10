'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowUpRight,
  BarChart3, Bell, ChevronRight, Gauge, RefreshCw, Target,
  TrendingUp, Trophy, Users, Calendar, ArrowRight,
} from 'lucide-react';
import { getManagerDashboard, ManagerDashboardData } from '@/utils/api';

type Period = 'week' | 'month' | 'quarter' | 'year';
interface Props { onTabChange?: (tab: string) => void; onDealClick?: (dealId: string) => void; }

/* ─── helpers ─────────────────────────────────────────────────────────── */
const toN = (v: unknown): number => { const n = Number(v ?? 0); return Number.isFinite(n) ? n : 0; };
const fmtC = (v: unknown): string => {
  const n = toN(v);
  if (Math.abs(n) >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)}Cr`;
  if (Math.abs(n) >= 1_00_000)    return `₹${(n / 1_00_000).toFixed(2)}L`;
  if (Math.abs(n) >= 1000)        return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
};
const fmtP = (v: unknown) => `${toN(v).toFixed(1)}%`;
const fmtAgo = (iso?: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};
const initials = (name?: string | null) =>
  (name ?? '?').split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();

/* ─── Sparkline ──────────────────────────────────────────────────────── */
function Spark({ pts, color }: { pts: number[]; color: string }) {
  if (pts.length < 2) return null;
  const max = Math.max(...pts, 1), min = Math.min(...pts, 0), r = max - min || 1;
  const coords = pts.map((v, i) => ({ x: (i / (pts.length - 1)) * 100, y: 32 - ((v - min) / r) * 26 + 2 }));
  let path = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const a = coords[i], b = coords[i + 1];
    path += ` C ${(a.x + (b.x - a.x) / 3).toFixed(1)} ${a.y.toFixed(1)},${(a.x + 2 * (b.x - a.x) / 3).toFixed(1)} ${b.y.toFixed(1)},${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
  }
  return (
    <svg viewBox="0 0 100 36" preserveAspectRatio="none" className="h-8 w-full mt-1" aria-hidden>
      <defs>
        <linearGradient id={`sgm-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L 100 36 L 0 36 Z`} fill={`url(#sgm-${color.replace('#', '')})`} />
      <motion.path d={path} fill="none" stroke={color} strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, ease: 'easeOut' }} />
    </svg>
  );
}

/* ─── DonutRing ──────────────────────────────────────────────────────── */
function DonutRing({ pct, color, size = 86, strokeWidth = 9 }: { pct: number; color: string; size?: number; strokeWidth?: number }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--secondary)" strokeWidth={strokeWidth} />
      <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
        strokeWidth={strokeWidth} strokeLinecap="round"
        strokeDasharray={`${circ}`}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - Math.min(pct / 100, 1) * circ }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }} />
    </svg>
  );
}

/* ─── KpiCard ────────────────────────────────────────────────────────── */
function KpiCard({ label, value, sub, icon: Icon, color, bgColor, sparkPts, growth, onClick, delay = 0 }:
  { label: string; value: string; sub: string; icon: React.ElementType; color: string; bgColor: string; sparkPts?: number[]; growth?: number; onClick?: () => void; delay?: number }) {
  const isPos = (growth ?? 0) >= 0;
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: delay / 1000, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border bg-card p-5 flex flex-col gap-2 hover:shadow-md transition-shadow cursor-pointer"
      style={{ borderColor: 'var(--border-default)' }} onClick={onClick}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
        <div className="size-8 rounded-full flex items-center justify-center" style={{ background: bgColor }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-black text-foreground tabular-nums leading-none">{value}</p>
      <div className="flex items-center gap-1.5">
        {growth !== undefined && (isPos
          ? <ArrowUpRight className="h-3 w-3 text-emerald-500" />
          : <ArrowDownRight className="h-3 w-3 text-rose-500" />)}
        <span className={`text-[10px] font-semibold ${growth === undefined ? 'text-muted-foreground' : isPos ? 'text-emerald-600' : 'text-rose-500'}`}>
          {growth !== undefined ? `${isPos ? '+' : ''}${growth.toFixed(1)}% growth` : sub}
        </span>
      </div>
      {sparkPts && <Spark pts={sparkPts} color={color} />}
    </motion.div>
  );
}

/* ─── StageCard ──────────────────────────────────────────────────────── */
function StageCard({ label, count, value, pct, color, delay = 0 }:
  { label: string; count: number; value: string; pct: number; color: string; delay?: number }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: delay / 1000, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center gap-2 flex-1 min-w-0">
      <div className="relative">
        <DonutRing pct={pct} color={color} size={86} strokeWidth={9} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-foreground">{count}</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="text-base font-bold text-foreground tabular-nums">{value}</p>
        <p className="text-[10px] text-muted-foreground">{pct.toFixed(1)}% of total</p>
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════════════════ */
export default function ManagerDashboardView({ onTabChange, onDealClick }: Props) {
  const [data, setData] = useState<ManagerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('quarter');
  const [repId, setRepId] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (retry = 0, showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      setError(null);
      const d = await getManagerDashboard(
        { period, repId: repId === 'all' ? undefined : repId },
        { silent: true }
      );
      if (!d) {
        if (retry < 8) { setTimeout(() => load(retry + 1), 500); return; }
        setLoading(false); return;
      }
      setData(d);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('expired') || msg.includes('401')) return;
      setError(msg || 'Failed to load manager dashboard.');
    } finally { setLoading(false); setRefreshing(false); }
  }, [period, repId]);

  useEffect(() => { load(); }, [load]);

  /* derived */
  const sortedReps = useMemo(() => data
    ? [...data.rep_quota_attainment].sort((a, b) => toN(b.quota_achievement_pct) - toN(a.quota_achievement_pct)).slice(0, 6)
    : [], [data]);
  const visibleActivities = useMemo(() => data?.recent_activities.slice(0, 6) ?? [], [data]);
  const visibleRisks = useMemo(() => data?.deals_at_risk.slice(0, 5) ?? [], [data]);
  const visibleAlerts = useMemo(() => data?.alerts.slice(0, 5) ?? [], [data]);
  const revTrendPts = useMemo(() => data?.monthly_revenue_trend.map(m => toN(m.revenue)) ?? [], [data]);
  const revTrendMax = useMemo(() =>
    Math.max(...(data?.monthly_revenue_trend.flatMap(m => [toN(m.revenue), toN(m.target)]) ?? []), 1), [data]);

  /* stage splits */
  const stageStats = useMemo(() => {
    if (!data) return { lost: { count: 0, value: 0, pct: 0 }, open: { count: 0, value: 0, pct: 0 }, won: { count: 0, value: 0, pct: 0 } };
    const dist = data.pipeline_health.stage_distribution;
    const total = dist.reduce((s, d) => s + d.deal_count, 0) || 1;
    const lostD = dist.filter(d => /lost/i.test(d.stage));
    const wonD  = dist.filter(d => /won/i.test(d.stage));
    const openD = dist.filter(d => !lostD.includes(d) && !wonD.includes(d));
    const agg = (arr: typeof dist) => ({
      count: arr.reduce((s, d) => s + d.deal_count, 0),
      value: arr.reduce((s, d) => s + toN(d.total_value), 0),
      pct:  (arr.reduce((s, d) => s + d.deal_count, 0) / total) * 100,
    });
    return { lost: agg(lostD), open: agg(openD), won: agg(wonD) };
  }, [data]);

  /* ── loading skeleton ── */
  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-20 rounded-2xl bg-secondary" />
      <div className="grid grid-cols-5 gap-4">{[...Array(5)].map((_, i) => <div key={i} className="h-36 rounded-2xl bg-secondary" />)}</div>
      <div className="h-56 rounded-2xl bg-secondary" />
      <div className="grid grid-cols-2 gap-5">{[...Array(2)].map((_, i) => <div key={i} className="h-72 rounded-2xl bg-secondary" />)}</div>
    </div>
  );

  /* ── error state ── */
  if (error || !data) return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="rounded-2xl border p-8 text-center max-w-sm" style={{ borderColor: 'var(--border-default)' }}>
        <AlertTriangle className="mx-auto h-8 w-8 text-amber-500 mb-3" />
        <p className="font-semibold text-foreground">{error || 'No data available'}</p>
        <button onClick={() => load(0, true)} className="mt-4 flex items-center gap-2 mx-auto rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-muted cursor-pointer transition-colors">
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </button>
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-6 pb-8">

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl flex items-center gap-2">
            Welcome back, Manager! <span role="img" aria-label="wave">👋</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Sales performance &amp; team command center</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(['week','month','quarter','year'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`rounded-xl border px-3.5 py-2 text-xs font-semibold shadow-sm transition-colors cursor-pointer ${period === p ? 'text-white border-transparent' : 'bg-card border-border text-muted-foreground hover:bg-muted'}`}
              style={period === p ? { background: 'var(--brand-purple)' } : {}}>
              {p === 'quarter' ? 'This Quarter' : p === 'week' ? 'This Week' : p === 'month' ? 'This Month' : 'This Year'}
            </button>
          ))}
          <select value={repId} onChange={e => setRepId(e.target.value)}
            className="rounded-xl border bg-card px-3.5 py-2 text-xs font-medium shadow-sm outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
            <option value="all">All Reps</option>
            {data.rep_quota_attainment.map(r => <option key={r.user_id} value={r.user_id}>{r.full_name}</option>)}
          </select>
          <button className="rounded-xl border bg-card px-3.5 py-2 text-xs font-medium shadow-sm cursor-pointer hover:bg-muted transition-colors">All Pipelines</button>
          <button onClick={() => load(0, true)} disabled={refreshing}
            className="flex items-center gap-2 rounded-xl border bg-card px-3.5 py-2 text-xs font-semibold shadow-sm hover:bg-muted disabled:opacity-50 cursor-pointer transition-colors">
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </motion.div>

      {/* ── 5 KPI Cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Team Revenue" value={fmtC(data.summary.team_revenue)} sub="this period"
          icon={TrendingUp} color="#8b5cf6" bgColor="color-mix(in srgb, #8b5cf6 15%, transparent)"
          sparkPts={revTrendPts} growth={toN(data.revenue_stats.monthly_growth_pct)}
          onClick={() => onTabChange?.('reports')} delay={0} />
        <KpiCard label="Pipeline Value" value={fmtC(data.summary.pipeline_value)} sub={`${data.pipeline_health.total_deals} active deals`}
          icon={BarChart3} color="#3b82f6" bgColor="color-mix(in srgb, #3b82f6 15%, transparent)"
          sparkPts={revTrendPts} onClick={() => onTabChange?.('pipeline')} delay={60} />
        <KpiCard label="Forecast" value={fmtC(data.forecast.projected_revenue)} sub={`${fmtP(data.forecast.confidence_score)} confidence`}
          icon={Gauge} color="#10b981" bgColor="color-mix(in srgb, #10b981 15%, transparent)"
          sparkPts={revTrendPts} onClick={() => onTabChange?.('forecast')} delay={120} />
        <KpiCard label="Quota Attainment" value={fmtP(data.revenue_stats.achievement_pct)} sub={`Target ${fmtC(data.revenue_stats.team_target)}`}
          icon={Target} color="#f59e0b" bgColor="color-mix(in srgb, #f59e0b 15%, transparent)"
          onClick={() => onTabChange?.('team performance')} delay={180} />
        <KpiCard label="Win Rate" value={fmtP(data.summary.win_rate)} sub={`Conversion ${fmtP(data.summary.conversion_rate)}`}
          icon={Trophy} color="#ec4899" bgColor="color-mix(in srgb, #ec4899 15%, transparent)"
          onClick={() => onTabChange?.('team performance')} delay={240} />
      </div>

      {/* ── Pipeline Health ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="rounded-[24px] border bg-card p-6" style={{ borderColor: 'var(--border-default)' }}>
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl flex items-center justify-center" style={{ background: 'color-mix(in srgb, #3b82f6 15%, transparent)' }}>
              <BarChart3 className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Pipeline Health</h2>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">Deal distribution across pipeline stages</p>
            </div>
          </div>
          <button onClick={() => onTabChange?.('pipeline')}
            className="flex items-center gap-1 text-xs font-bold cursor-pointer hover:underline" style={{ color: 'var(--accent-color)' }}>
            View Pipeline <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Lost / Open / Won donut rings */}
        <div className="flex items-start justify-around gap-6 mb-6 flex-wrap">
          <StageCard label="Lost" count={stageStats.lost.count} value={fmtC(stageStats.lost.value)} pct={stageStats.lost.pct} color="#ef4444" delay={0} />
          <StageCard label="Open" count={stageStats.open.count} value={fmtC(stageStats.open.value)} pct={stageStats.open.pct} color="#3b82f6" delay={100} />
          <StageCard label="Won"  count={stageStats.won.count}  value={fmtC(stageStats.won.value)}  pct={stageStats.won.pct}  color="#10b981" delay={200} />
        </div>

        {/* All stages distribution (collapsible grid) */}
        {data.pipeline_health.stage_distribution.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-5 sm:grid-cols-3 xl:grid-cols-6">
            {data.pipeline_health.stage_distribution.map(s => (
              <div key={s.stage} className="rounded-xl p-3 transition hover:bg-muted/40" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)' }}>
                <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{s.stage}</p>
                <p className="mt-2 text-lg font-bold text-foreground">{s.deal_count}</p>
                <p className="text-[10px] text-muted-foreground">{fmtC(s.total_value)}</p>
                <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
                  <motion.div className="h-full rounded-full" style={{ background: 'var(--brand-purple)' }}
                    initial={{ width: 0 }} animate={{ width: `${Math.min(100, toN(s.percentage))}%` }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} />
                </div>
                <p className="mt-1 text-[9px] text-muted-foreground">{fmtP(s.percentage)}</p>
              </div>
            ))}
          </div>
        )}

        {/* Summary metrics */}
        <div className="grid grid-cols-2 gap-3 border-t pt-5 sm:grid-cols-3 lg:grid-cols-5" style={{ borderColor: 'var(--border-subtle)' }}>
          {[
            { label: 'Active Deals', value: String(data.pipeline_health.total_deals) },
            { label: 'Pipeline Value', value: fmtC(data.pipeline_health.active_pipeline_value) },
            { label: 'Health Score', value: fmtP(data.pipeline_health.health_score) },
            { label: 'Avg. Deal Size', value: fmtC(data.team_metrics.avg_deal_size) },
            { label: 'Sales Cycle', value: `${toN(data.team_metrics.avg_sales_cycle_days).toFixed(0)} days` },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl p-3" style={{ background: 'var(--surface-2)' }}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
              <p className="mt-1 text-base font-bold text-foreground tabular-nums">{value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Team Performance + Deals at Risk ── */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">

        {/* Team Performance */}
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="rounded-[24px] border bg-card p-6 flex flex-col" style={{ borderColor: 'var(--border-default)', minHeight: 400 }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl flex items-center justify-center" style={{ background: 'color-mix(in srgb, #8b5cf6 15%, transparent)' }}>
                <Users className="h-4 w-4 text-purple-500" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">Team Performance</h2>
                <p className="text-[10px] text-muted-foreground">Quota attainment across the sales team</p>
              </div>
            </div>
            <button onClick={() => onTabChange?.('team performance')}
              className="flex items-center gap-1 text-xs font-bold cursor-pointer hover:underline" style={{ color: 'var(--accent-color)' }}>
              View Team <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto pr-1">
            {sortedReps.map((rep, i) => {
              const att = toN(rep.quota_achievement_pct);
              const barColor = att >= 100 ? '#10b981' : att >= 75 ? '#8b5cf6' : att >= 50 ? '#f59e0b' : '#ef4444';
              return (
                <motion.div key={rep.user_id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.07 }}>
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="size-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                        style={{ background: barColor }}>
                        {initials(rep.full_name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{rep.full_name}</p>
                        <p className="text-[10px] text-muted-foreground">Revenue {fmtC(rep.revenue_generated)}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold tabular-nums shrink-0" style={{ color: barColor }}>{fmtP(att)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <motion.div className="h-full rounded-full" style={{ background: barColor }}
                      initial={{ width: 0 }} animate={{ width: `${Math.min(att, 100)}%` }}
                      transition={{ duration: 0.8, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }} />
                  </div>
                </motion.div>
              );
            })}
            {sortedReps.length === 0 && (
              <div className="flex h-32 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">No rep data.</div>
            )}
          </div>
        </motion.div>

        {/* Deals at Risk */}
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="rounded-[24px] border bg-card p-6 flex flex-col" style={{ borderColor: 'var(--border-default)', minHeight: 400 }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl flex items-center justify-center bg-amber-100 dark:bg-amber-500/15">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">Deals at Risk</h2>
                <p className="text-[10px] text-muted-foreground">High-value opportunities requiring attention</p>
              </div>
            </div>
            <button onClick={() => onTabChange?.('pipeline')}
              className="flex items-center gap-1 text-xs font-bold cursor-pointer hover:underline" style={{ color: 'var(--accent-color)' }}>
              View Pipeline <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
            {visibleRisks.map((deal, i) => (
              <motion.div key={deal.deal_id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.06 }}
                onClick={() => onDealClick?.(deal.deal_id)}
                className="rounded-xl border p-3.5 cursor-pointer hover:bg-secondary/40 transition-colors"
                style={{ borderColor: 'var(--border-subtle)', background: 'var(--surface-2)' }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{deal.deal_name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{deal.company || 'No company'}</p>
                  </div>
                  <span className="text-sm font-bold tabular-nums shrink-0">{fmtC(deal.deal_value)}</span>
                </div>
                <div className="mt-2 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[9px] uppercase tracking-wide text-muted-foreground">Owner</p>
                    <p className="text-[10px] font-medium mt-0.5">{deal.owner_name || 'Unassigned'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] uppercase tracking-wide text-muted-foreground">Risk</p>
                    <p className="text-[10px] font-bold text-amber-500 mt-0.5">{deal.risk_reason}</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between border-t pt-2" style={{ borderColor: 'var(--border-subtle)' }}>
                  <span className="text-[10px] text-muted-foreground">{deal.days_since_last_activity}d since last activity</span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-500/15">Open Deal</span>
                </div>
              </motion.div>
            ))}
            {visibleRisks.length === 0 && (
              <div className="flex h-32 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
                <Trophy className="h-5 w-5 mr-2 text-emerald-500" /> No deals at risk
              </div>
            )}
          </div>
          {data.deals_at_risk.length > 0 && (
            <button onClick={() => onTabChange?.('pipeline')}
              className="mt-3 text-xs font-bold flex items-center gap-1 cursor-pointer hover:underline" style={{ color: 'var(--accent-color)' }}>
              View All Deals <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </motion.div>
      </div>

      {/* ── Manager Action Queue + Recent Team Activity ── */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">

        {/* Manager Action Queue */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="rounded-[24px] border bg-card p-6 flex flex-col" style={{ borderColor: 'var(--border-default)', minHeight: 340 }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl flex items-center justify-center bg-rose-100 dark:bg-rose-500/15">
                <Bell className="h-4 w-4 text-rose-500" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">Manager Action Queue</h2>
                <p className="text-[10px] text-muted-foreground">System-generated items that may need attention</p>
              </div>
            </div>
            <button onClick={() => onTabChange?.('activities')}
              className="text-xs font-bold cursor-pointer hover:underline" style={{ color: 'var(--accent-color)' }}>
              View Activity
            </button>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto pr-1">
            <AnimatePresence>
              {visibleAlerts.map((alert, i) => {
                const sev = String(alert.severity || '').toLowerCase();
                const isHigh = sev === 'high' || sev === 'critical';
                const isMed  = sev === 'medium';
                return (
                  <motion.div key={`${alert.timestamp}-${i}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.06 }}
                    onClick={() => onTabChange?.('activities')}
                    className={`cursor-pointer flex items-start gap-3 rounded-xl border p-3.5 transition hover:shadow-sm ${isHigh ? 'border-red-200 dark:border-red-500/25 bg-red-50/50 dark:bg-red-500/8' : isMed ? 'border-amber-200 dark:border-amber-500/25 bg-amber-50/40 dark:bg-amber-500/8' : 'bg-secondary/40'}`}>
                    <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${isHigh ? 'bg-red-100 dark:bg-red-500/20 text-red-600' : isMed ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600' : 'bg-muted text-muted-foreground'}`}>
                      {isHigh ? <AlertTriangle className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold leading-5">{alert.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${isHigh ? 'bg-red-100 text-red-600' : isMed ? 'bg-amber-100 text-amber-600' : 'bg-secondary text-muted-foreground'}`}>{alert.severity}</span>
                        <span className="text-[9px] text-muted-foreground">{fmtAgo(alert.timestamp)}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {visibleAlerts.length === 0 && (
              <div className="flex h-28 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
                <Bell className="h-5 w-5 mr-2" /> No manager alerts
              </div>
            )}
          </div>
          {data.deals_at_risk.length > 0 && (
            <button onClick={() => onTabChange?.('pipeline')}
              className="mt-4 flex w-full items-center justify-between rounded-xl bg-muted/50 px-4 py-3 text-left hover:bg-muted transition-colors cursor-pointer">
              <div>
                <p className="text-xs font-semibold">{data.deals_at_risk.length} deals require review</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">Open pipeline to review risk</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </motion.div>

        {/* Recent Team Activity */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="rounded-[24px] border bg-card p-6 flex flex-col" style={{ borderColor: 'var(--border-default)', minHeight: 340 }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl flex items-center justify-center bg-blue-100 dark:bg-blue-500/15">
                <Activity className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">Recent Team Activity</h2>
                <p className="text-[10px] text-muted-foreground">Latest CRM activity across your sales team</p>
              </div>
            </div>
            <button onClick={() => onTabChange?.('activities')}
              className="text-xs font-bold cursor-pointer hover:underline" style={{ color: 'var(--accent-color)' }}>
              View All
            </button>
          </div>
          <div className="flex-1 space-y-1 overflow-y-auto pr-1">
            {visibleActivities.map((act, i) => (
              <motion.button key={act.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: i * 0.06 }}
                onClick={() => onTabChange?.('activities')}
                className="flex w-full items-start gap-3 rounded-xl px-2 py-3 text-left hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="mt-0.5 size-8 shrink-0 rounded-full flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--accent-color) 15%, transparent)' }}>
                  <Activity className="h-3.5 w-3.5" style={{ color: 'var(--accent-color)' }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold">{act.title || act.action}</p>
                  <p className="mt-0.5 truncate text-[10px] capitalize text-muted-foreground">
                    {act.action.replace(/_/g, ' ')} · {act.entity_type.replace(/_/g, ' ')}
                  </p>
                  <p className="mt-0.5 text-[9px] text-muted-foreground">
                    {fmtAgo(act.created_at)}{act.created_by ? ` · ${act.created_by}` : ''}
                  </p>
                </div>
                <ChevronRight className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </motion.button>
            ))}
            {visibleActivities.length === 0 && (
              <div className="flex h-28 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
                <Activity className="h-5 w-5 mr-2" /> No recent team activity
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── Revenue vs Target + Forecast Health ── */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">

        {/* Revenue vs Target */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="rounded-[24px] border bg-card p-6 xl:col-span-2" style={{ borderColor: 'var(--border-default)' }}>
          <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl flex items-center justify-center" style={{ background: 'color-mix(in srgb, #8b5cf6 15%, transparent)' }}>
                <TrendingUp className="h-4 w-4 text-purple-500" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">Revenue vs Target</h2>
                <p className="text-[10px] text-muted-foreground">Monthly team revenue performance</p>
              </div>
            </div>
            <button onClick={() => onTabChange?.('reports')}
              className="flex items-center gap-1 text-xs font-bold cursor-pointer hover:underline" style={{ color: 'var(--accent-color)' }}>
              View Report <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex items-end justify-between gap-4 my-5">
            <div>
              <p className="text-3xl font-bold tracking-tight">{fmtC(data.summary.team_revenue)}</p>
              <p className="text-xs text-muted-foreground mt-1">Current revenue</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">Target {fmtC(data.revenue_stats.team_target)}</p>
              <div className={`flex items-center gap-1 text-[10px] font-bold mt-1 justify-end ${toN(data.revenue_stats.achievement_pct) >= 100 ? 'text-emerald-600' : 'text-amber-500'}`}>
                {toN(data.revenue_stats.achievement_pct) >= 100 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {fmtP(data.revenue_stats.achievement_pct)} achieved
              </div>
            </div>
          </div>

          {data.monthly_revenue_trend.length > 0 ? (
            <>
              <div className="flex h-44 items-end gap-1.5 border-b pb-0" style={{ borderColor: 'var(--border-subtle)' }}>
                {data.monthly_revenue_trend.map(m => {
                  const rev = toN(m.revenue), tgt = toN(m.target);
                  const rH = rev > 0 ? Math.max(5, (rev / revTrendMax) * 100) : 3;
                  const tH = tgt > 0 ? Math.max(5, (tgt / revTrendMax) * 100) : 3;
                  return (
                    <div key={m.month} className="flex h-full flex-1 items-end justify-center gap-0.5">
                      <motion.div className="w-2 rounded-t" style={{ background: 'var(--brand-purple)' }}
                        initial={{ height: 0 }} animate={{ height: `${rH}%` }}
                        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} />
                      <motion.div className="w-2 rounded-t bg-muted-foreground/25"
                        initial={{ height: 0 }} animate={{ height: `${tH}%` }}
                        transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }} />
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                {data.monthly_revenue_trend.map(m => (
                  <span key={m.month}>{new Date(`${m.month}-01`).toLocaleDateString('en-US', { month: 'short' })}</span>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-5 text-xs text-muted-foreground">
                <span className="flex items-center gap-2"><span className="size-2 rounded-full" style={{ background: 'var(--brand-purple)' }} />Revenue</span>
                <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-muted-foreground/25" />Target</span>
              </div>
            </>
          ) : (
            <div className="flex h-44 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">No revenue data.</div>
          )}
        </motion.div>

        {/* Forecast Health */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="rounded-[24px] border bg-card p-6" style={{ borderColor: 'var(--border-default)' }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl flex items-center justify-center bg-emerald-100 dark:bg-emerald-500/15">
                <Gauge className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">Forecast Health</h2>
                <p className="text-[10px] text-muted-foreground">Current quarter outlook</p>
              </div>
            </div>
            <button onClick={() => onTabChange?.('forecast')}
              className="text-xs font-bold cursor-pointer hover:underline" style={{ color: 'var(--accent-color)' }}>
              Open
            </button>
          </div>

          <p className="text-xs text-muted-foreground">Expected Revenue</p>
          <p className="mt-1 text-3xl font-bold tracking-tight">{fmtC(data.forecast.projected_revenue)}</p>

          <div className="mt-6 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-muted-foreground">Confidence</span>
                <span className="text-xs font-bold">{fmtP(data.forecast.confidence_score)}</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <motion.div className="h-full rounded-full bg-emerald-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, Math.max(0, toN(data.forecast.confidence_score)))}%` }}
                  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} />
              </div>
            </div>
            <div className="space-y-3 border-t pt-4" style={{ borderColor: 'var(--border-subtle)' }}>
              {[
                { label: 'Forecast Accuracy', value: fmtP(data.forecast.forecast_accuracy) },
                { label: 'Quarter Projection', value: fmtC(data.forecast.expected_quarter_revenue) },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="text-sm font-semibold">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Bottom Team Metrics ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Team Members',     value: String(data.team_metrics.total_members), sub: `${data.team_metrics.active_reps} active reps`, icon: Users,     color: '#8b5cf6', tab: 'team performance' },
          { label: 'Avg Deal Size',    value: fmtC(data.team_metrics.avg_deal_size),   sub: 'Across active pipeline', icon: BarChart3,  color: '#3b82f6', tab: 'pipeline' },
          { label: 'Sales Cycle',      value: `${toN(data.team_metrics.avg_sales_cycle_days).toFixed(0)} days`, sub: 'Average team cycle', icon: Calendar, color: '#10b981', tab: 'team performance' },
          { label: 'Forecast Accuracy',value: fmtP(data.team_metrics.forecast_accuracy), sub: 'Current forecast perf.', icon: Target, color: '#f59e0b', tab: 'forecast' },
        ].map(({ label, value, sub, icon: Icon, color, tab }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 + i * 0.06 }}
            className="rounded-2xl border bg-card p-5 hover:shadow-md transition-shadow cursor-pointer"
            style={{ borderColor: 'var(--border-default)' }}
            onClick={() => onTabChange?.(tab)}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
              <div className="size-7 rounded-lg flex items-center justify-center" style={{ background: `color-mix(in srgb, ${color} 15%, transparent)` }}>
                <Icon className="h-3.5 w-3.5" style={{ color }} />
              </div>
            </div>
            <p className="text-xl font-bold tabular-nums">{value}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>
          </motion.div>
        ))}
      </div>

    </div>
  );
}