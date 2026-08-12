'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  CalendarDays,
  ChevronRight,
  Gauge,
  IndianRupee,
  RefreshCw,
  Target,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getManagerDashboard,
  ManagerDashboardData,
} from '@/utils/api';

type ManagerDashboardPeriod = 'week' | 'month' | 'quarter' | 'year';

interface ManagerDashboardViewProps {
  onTabChange?: (tab: string) => void;
  onDealClick?: (dealId: string) => void;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const toNumber = (value: unknown): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCurrency = (value: unknown): string => {
  const amount = toNumber(value);

  if (Math.abs(amount) >= 10000000) {
    return `\u20B9${(amount / 10000000).toFixed(2)}Cr`;
  }

  if (Math.abs(amount) >= 100000) {
    return `\u20B9${(amount / 100000).toFixed(2)}L`;
  }

  if (Math.abs(amount) >= 1000) {
    return `\u20B9${(amount / 1000).toFixed(1)}K`;
  }

  return `\u20B9${Math.round(amount).toLocaleString('en-IN')}`;
};

const formatPercent = (value: unknown): string =>
  `${toNumber(value).toFixed(1)}%`;

const formatUpdatedAt = (value?: string | null): string => {
  if (!value) return 'Time unavailable';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Time unavailable';
  }

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getInitials = (name?: string | null): string => {
  if (!name) return 'NA';

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
};

/* -------------------------------------------------------------------------- */
/* Sparkline (SVG area chart pattern)                                         */
/* -------------------------------------------------------------------------- */

function Spark({ values, positive }: { values: number[]; positive: boolean }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const n = values.length;
  const coords = values.map((v, i) => ({
    x: (i / (n - 1)) * 100,
    y: 34 - ((v - min) / range) * 30 + 2,
  }));

  let linePath = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[i];
    const p1 = coords[i + 1];
    const cpX1 = p0.x + (p1.x - p0.x) / 3;
    const cpY1 = p0.y;
    const cpX2 = p0.x + (2 * (p1.x - p0.x)) / 3;
    const cpY2 = p1.y;
    linePath += ` C ${cpX1.toFixed(1)} ${cpY1.toFixed(1)}, ${cpX2.toFixed(1)} ${cpY2.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
  }

  const areaPath = `${linePath} L ${coords[n - 1].x.toFixed(1)} 40 L 0 40 Z`;
  const strokeColor = positive ? 'var(--status-success-text)' : 'var(--status-danger-text)';

  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-8 w-full overflow-visible" aria-hidden>
      <motion.path
        d={areaPath}
        fill={strokeColor}
        fillOpacity="0.08"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      />
      <motion.path
        d={linePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* KPI stat tile                                                              */
/* -------------------------------------------------------------------------- */

interface KpiTile {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  values: number[];
  icon: React.ElementType;
  targetValue: number;
  prefix?: string;
  suffix?: string;
}

function StatTile({ tile, delay = 0, isHero = false }: { tile: KpiTile; delay?: number; isHero?: boolean }) {
  const value = useCountUp(tile.targetValue, true, 1000);
  const Delta = tile.isPositive ? ArrowUpRight : ArrowDownRight;

  const displayVal = tile.targetValue === 0
    ? tile.value
    : `${tile.prefix ?? ''}${value.toLocaleString()}${tile.suffix ?? ''}`;

  if (isHero) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: delay / 1000 }}
        className="flex flex-col justify-between rounded-2xl bg-gradient-to-br from-accent-color to-purple-600 p-[var(--space-5)] text-white shadow-lg cursor-pointer sm:col-span-2 xl:col-span-2"
      >
        <div className="flex items-center justify-between">
          <div className="grid size-10 place-items-center rounded-xl bg-white/15">
            <tile.icon size={18} strokeWidth={2} />
          </div>
          <p className="flex items-center gap-1 text-[11px] font-bold text-white/90">
            <Delta size={12} strokeWidth={2.5} className="shrink-0" />
            <span>{tile.change}</span>
          </p>
        </div>
        <div className="mt-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/70 leading-none">
            {tile.title}
          </p>
          <p className="mt-2 text-[28px] font-extrabold tracking-tight leading-none tabular-nums">
            {displayVal}
          </p>
          <p className="mt-1.5 text-[10px] text-white/60 font-semibold">vs last month</p>
        </div>
        <div className="mt-3">
          <Spark values={tile.values} positive={tile.isPositive} />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: delay / 1000 }}
      className="flex flex-col gap-[var(--space-2)] rounded-2xl border border-border-default bg-surface-1 p-[var(--space-4)] shadow-card transition-colors duration-200 cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-accent-color">
          <tile.icon size={16} strokeWidth={2} />
        </div>
        <p className={`flex items-center gap-1 text-[11px] font-bold ${tile.isPositive ? 'text-status-success-text' : 'text-status-danger-text'}`}>
          <Delta size={12} strokeWidth={2.5} className="shrink-0" />
          <span>{tile.change}</span>
        </p>
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted leading-none">
        {tile.title}
      </p>
      <p className="text-2xl font-semibold text-text-primary tabular-nums leading-none">
        {displayVal}
      </p>
      <span className="text-[10px] text-text-muted/60 font-semibold mt-0.5">vs last month</span>
      <div className="mt-2">
        <Spark values={tile.values} positive={tile.isPositive} />
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* useCountUp hook (simple implementation)                                    */
/* -------------------------------------------------------------------------- */

function useCountUp(target: number, active: boolean, duration = 1000): number {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!active || target === 0) {
      setCurrent(target);
      return;
    }
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, active, duration]);

  return current;
}

/* -------------------------------------------------------------------------- */
/* Main component                                                             */
/* -------------------------------------------------------------------------- */

export default function ManagerDashboardView({
  onTabChange,
  onDealClick,
}: ManagerDashboardViewProps) {
  const [data, setData] = useState<ManagerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] =
    useState<ManagerDashboardPeriod>('quarter');
  const [repId, setRepId] = useState<string>('all');

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const dashboardData = await getManagerDashboard({
        period,
        repId: repId === 'all' ? undefined : repId,
      });

      setData(dashboardData);
    } catch (err) {
      console.error('Failed to load manager dashboard:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load manager dashboard.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [period, repId]);

  /* ---------------------------------------------------------------------- */
  /* Derived data                                                           */
  /* ---------------------------------------------------------------------- */

  const sortedReps = useMemo(() => {
    if (!data) return [];

    return [...data.rep_quota_attainment]
      .sort(
        (a, b) =>
          toNumber(b.quota_achievement_pct) -
          toNumber(a.quota_achievement_pct)
      )
      .slice(0, 5);
  }, [data]);

  const visibleActivities = useMemo(() => {
    if (!data) return [];

    return data.recent_activities.slice(0, 6);
  }, [data]);

  const visibleRisks = useMemo(() => {
    if (!data) return [];

    return data.deals_at_risk.slice(0, 4);
  }, [data]);

  const visibleAlerts = useMemo(() => {
    if (!data) return [];

    return data.alerts.slice(0, 4);
  }, [data]);

  const revenueTrendMax = useMemo(() => {
    if (!data || data.monthly_revenue_trend.length === 0) {
      return 1;
    }

    return Math.max(
      ...data.monthly_revenue_trend.flatMap((month) => [
        toNumber(month.revenue),
        toNumber(month.target),
      ]),
      1
    );
  }, [data]);

  /* ---------------------------------------------------------------------- */
  /* Loading                                                                */
  /* ---------------------------------------------------------------------- */

  if (loading) {
    return (
      <div className="space-y-[var(--space-5)]">
        <div className="animate-pulse space-y-[var(--space-5)]">
          <div className="h-20 rounded-2xl bg-muted" />

          <div className="grid grid-cols-1 gap-[var(--space-4)] sm:grid-cols-2 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-32 rounded-2xl border bg-surface-1"
              />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-[var(--space-4)] xl:grid-cols-3">
            <div className="h-80 rounded-2xl border bg-surface-1 xl:col-span-2" />
            <div className="h-80 rounded-2xl border bg-surface-1" />
          </div>

          <div className="h-72 rounded-2xl border bg-surface-1" />

          <div className="grid grid-cols-1 gap-[var(--space-4)] xl:grid-cols-2">
            <div className="h-80 rounded-2xl border bg-surface-1" />
            <div className="h-80 rounded-2xl border bg-surface-1" />
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Error                                                                  */
  /* ---------------------------------------------------------------------- */

  if (error) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-border-default bg-surface-1 p-8 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-accent-color" />

          <h2 className="mt-4 text-sm font-semibold text-text-primary">
            Unable to load Manager Dashboard
          </h2>

          <p className="mt-2 text-[10px] text-text-muted">
            {error}
          </p>

          <button
            type="button"
            onClick={loadDashboard}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-accent-color px-4 py-2 text-xs font-semibold text-surface-0 transition hover:bg-accent-color/90"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="text-center py-8 text-text-muted text-xs font-semibold bg-surface-2/10 rounded-2xl border border-border-default/50 px-8">
          <p>No manager dashboard data available</p>

          <button
            type="button"
            onClick={loadDashboard}
            className="mt-4 rounded-lg border border-border-default px-4 py-2 text-xs font-semibold text-text-primary hover:bg-surface-2/40 transition"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Dashboard                                                              */
  /* ---------------------------------------------------------------------- */

  return (
    <div className="space-y-[var(--space-5)]">

      {/* ================================================================== */}
      {/* HEADER                                                             */}
      {/* ================================================================== */}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-sans font-bold tracking-tight text-foreground">
              Welcome back, Manager
            </h1>

            <span className="rounded-full bg-accent-color/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-accent-color border border-accent-color/15">
              Manager
            </span>
          </div>

          <p className="mt-1 text-xs md:text-sm text-muted-foreground font-medium tracking-wide">
            Sales performance &amp; team command center
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={period}
            onChange={(e) =>
              setPeriod(e.target.value as ManagerDashboardPeriod)
            }
            className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground outline-none focus:ring-1 focus:ring-accent-color/20 cursor-pointer"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>

          <button
            type="button"
            onClick={loadDashboard}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-border bg-card hover:bg-secondary text-foreground rounded-full text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${
                loading ? 'animate-spin' : ''
              }`}
            />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ================================================================== */}
      {/* KPI CARDS — with sparklines + gradient hero                        */}
      {/* ================================================================== */}

      <div className="grid grid-cols-1 gap-[var(--space-4)] sm:grid-cols-2 xl:grid-cols-5">
        {/* Team Revenue */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onTabChange?.('reports')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTabChange?.('reports'); } }}
          className="relative overflow-hidden bg-primary text-primary-foreground border border-white/10 rounded-2xl p-[var(--space-4)] space-y-[var(--space-3)] shadow-sm cursor-pointer hover:bg-primary/90 transition-all"
        >
          <span className="shimmer" />
          <span className="pointer-events-none absolute -right-10 -top-16 size-48 rounded-full bg-white/10" />
          <span className="pointer-events-none absolute -bottom-24 -left-8 size-56 rounded-full bg-white/5" />

          <div className="relative flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary-foreground/90">
              Team Revenue
            </p>
            <TrendingUp className="h-4 w-4 text-primary-foreground/80" />
          </div>

          <p className="relative text-2xl font-bold tracking-tight text-primary-foreground tabular-nums">
            {formatCurrency(data.summary.team_revenue)}
          </p>

          <div className="relative flex items-center gap-1.5 text-xs text-primary-foreground/75">
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary-foreground/20 text-primary-foreground border border-primary-foreground/10">
              {toNumber(data.revenue_stats.monthly_growth_pct) >= 0 ? (
                <ArrowUpRight className="size-3 shrink-0" strokeWidth={2.5} />
              ) : (
                <ArrowDownRight className="size-3 shrink-0" strokeWidth={2.5} />
              )}
              <span>{formatPercent(data.revenue_stats.monthly_growth_pct)}</span>
            </span>
            <span>growth</span>
          </div>
        </div>

        {/* Pipeline Value */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onTabChange?.('pipeline')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTabChange?.('pipeline'); } }}
          className="bg-card border border-border rounded-2xl p-[var(--space-4)] space-y-[var(--space-3)] shadow-sm cursor-pointer hover:bg-surface-hover transition-all"
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
              Pipeline Value
            </p>
            <BarChart3 className="h-4 w-4 text-accent-color" />
          </div>

          <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
            {formatCurrency(data.summary.pipeline_value)}
          </p>

          <p className="text-[10px] text-muted-foreground">
            {data.pipeline_health.total_deals} active deals
          </p>
        </div>

        {/* Forecast */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onTabChange?.('forecast')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTabChange?.('forecast'); } }}
          className="bg-card border border-border rounded-2xl p-[var(--space-4)] space-y-[var(--space-3)] shadow-sm cursor-pointer hover:bg-surface-hover transition-all"
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
              Forecast
            </p>
            <Gauge className="h-4 w-4 text-accent-color" />
          </div>

          <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
            {formatCurrency(data.forecast.projected_revenue)}
          </p>

          <p className="text-[10px] text-muted-foreground">
            {formatPercent(data.forecast.confidence_score)} confidence
          </p>
        </div>

        {/* Quota Attainment */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onTabChange?.('team performance')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTabChange?.('team performance'); } }}
          className="bg-card border border-border rounded-2xl p-[var(--space-4)] space-y-[var(--space-3)] shadow-sm cursor-pointer hover:bg-surface-hover transition-all"
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
              Quota Attainment
            </p>
            <Target className="h-4 w-4 text-accent-color" />
          </div>

          <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
            {formatPercent(data.revenue_stats.achievement_pct)}
          </p>

          <p className="text-[10px] text-muted-foreground">
            Target {formatCurrency(data.revenue_stats.team_target)}
          </p>
        </div>

        {/* Win Rate */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onTabChange?.('team performance')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTabChange?.('team performance'); } }}
          className="bg-card border border-border rounded-2xl p-[var(--space-4)] space-y-[var(--space-3)] shadow-sm cursor-pointer hover:bg-surface-hover transition-all"
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
              Win Rate
            </p>
            <Trophy className="h-4 w-4 text-accent-color" />
          </div>

          <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
            {formatPercent(data.summary.win_rate)}
          </p>

          <p className="text-[10px] text-muted-foreground">
            Conversion {formatPercent(data.summary.conversion_rate)}
          </p>
        </div>
      </div>

      {/* ================================================================== */}
      {/* REVENUE CHART + FORECAST — 8/4 grid                                */}
      {/* ================================================================== */}

      <div className="grid grid-cols-12 gap-[var(--space-4)]">

        {/* Revenue vs Target */}
        <div className="col-span-12 lg:col-span-8 bg-card border border-border rounded-2xl p-[var(--space-4)] space-y-[var(--space-3)] shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent-color" />
              <div>
                <h3 className="font-semibold text-foreground text-sm">Revenue vs Target</h3>
                <p className="text-[10px] text-muted-foreground">Monthly team revenue performance</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onTabChange?.('reports')}
              className="text-[10px] font-bold text-accent-color hover:underline"
            >
              View Report
            </button>
          </div>

          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-3xl font-sans font-bold tracking-tight text-foreground">
                {formatCurrency(data.summary.team_revenue)}
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground">Current revenue</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-foreground">
                Target {formatCurrency(data.revenue_stats.team_target)}
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {formatPercent(data.revenue_stats.achievement_pct)} achieved
              </p>
            </div>
          </div>

          {data.monthly_revenue_trend.length > 0 ? (
            <>
              <div className="mt-4 flex h-52 items-end gap-2 border-b border-border px-2">
                {data.monthly_revenue_trend.map((month, idx) => {
                  const revenue = toNumber(month.revenue);
                  const target = toNumber(month.target);
                  const revenueHeight = revenue > 0 ? Math.max(8, (revenue / revenueTrendMax) * 100) : 4;
                  const targetHeight = target > 0 ? Math.max(8, (target / revenueTrendMax) * 100) : 4;
                  const isLast = idx === data.monthly_revenue_trend.length - 1;

                  return (
                    <div
                      key={month.month}
                      className="group flex h-full flex-1 items-end justify-center gap-1.5"
                      title={`${month.month} — Revenue ${formatCurrency(revenue)} — Target ${formatCurrency(target)}`}
                    >
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${revenueHeight}%` }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: idx * 0.05 }}
                        className={`w-3 rounded-t-lg ${isLast ? 'bg-accent-color shadow-md' : 'bg-accent-color/70'}`}
                      />
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${targetHeight}%` }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: idx * 0.05 + 0.1 }}
                        className={`w-3 rounded-t-lg ${isLast ? 'bg-purple-400/60' : 'bg-purple-400/30'}`}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                {data.monthly_revenue_trend.map((month) => (
                  <span key={month.month}>
                    {new Date(`${month.month}-01`).toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                ))}
              </div>

              <div className="mt-3 flex items-center gap-5 text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-accent-color" />
                  Revenue
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-purple-400/60" />
                  Target
                </span>
              </div>
            </>
          ) : (
            <div className="mt-8 flex h-52 items-center justify-center bg-secondary/10 rounded-xl border border-border/50">
              <p className="text-xs font-semibold text-muted-foreground">
                No monthly revenue data available.
              </p>
            </div>
          )}
        </div>

        {/* Forecast Health */}
        <div className="col-span-12 lg:col-span-4 bg-card border border-border rounded-2xl p-[var(--space-4)] space-y-[var(--space-3)] shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-accent-color" />
              <div>
                <h3 className="font-semibold text-foreground text-sm">Forecast Health</h3>
                <p className="text-[10px] text-muted-foreground">Current quarter outlook</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onTabChange?.('forecast')}
              className="text-[10px] font-bold text-accent-color hover:underline"
            >
              Open
            </button>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
              Expected Revenue
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-foreground tabular-nums">
              {formatCurrency(data.forecast.projected_revenue)}
            </p>
          </div>

          <div className="space-y-[var(--space-3)]">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Confidence</span>
                <span className="text-xs font-bold text-foreground">{formatPercent(data.forecast.confidence_score)}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-accent-color"
                  style={{ width: `${Math.min(100, Math.max(0, toNumber(data.forecast.confidence_score)))}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Forecast Accuracy</span>
              <span className="text-xs font-bold text-foreground">{formatPercent(data.forecast.forecast_accuracy)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Quarter Projection</span>
              <span className="text-xs font-bold text-foreground">{formatCurrency(data.forecast.expected_quarter_revenue)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* PIPELINE HEALTH — full width                                       */}
      {/* ================================================================== */}

      <div className="bg-card border border-border rounded-2xl p-[var(--space-4)] space-y-[var(--space-3)] shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-accent-color" />
            <div>
              <h3 className="font-semibold text-foreground text-sm">Pipeline Health</h3>
              <p className="text-[10px] text-muted-foreground">Deal distribution across pipeline stages</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onTabChange?.('pipeline')}
            className="inline-flex items-center gap-1 text-[10px] font-bold text-accent-color hover:underline"
          >
            View Pipeline
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {data.pipeline_health.stage_distribution.map((stage) => (
            <div
              key={stage.stage}
              className="rounded-xl border border-border bg-secondary/10 p-[var(--space-3)] transition hover:bg-secondary/20"
            >
              <p className="truncate text-xs font-bold text-foreground">
                {stage.stage}
              </p>
              <p className="mt-2 text-xl font-bold text-foreground tabular-nums">
                {stage.deal_count}
              </p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                {formatCurrency(stage.total_value)}
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-accent-color"
                  style={{ width: `${Math.min(100, Math.max(0, toNumber(stage.percentage)))}%` }}
                />
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {formatPercent(stage.percentage)}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 border-t border-border pt-3 sm:grid-cols-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Active Deals</p>
            <p className="mt-1 text-lg font-bold text-foreground">{data.pipeline_health.total_deals}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Pipeline Value</p>
            <p className="mt-1 text-lg font-bold text-foreground">{formatCurrency(data.pipeline_health.active_pipeline_value)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Health Score</p>
            <p className="mt-1 text-lg font-bold text-foreground">{formatPercent(data.pipeline_health.health_score)}</p>
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* TEAM PERFORMANCE + DEALS AT RISK — 8/4 grid                       */}
      {/* ================================================================== */}

      <div className="grid grid-cols-12 gap-[var(--space-4)]">

        {/* Team Performance */}
        <div className="col-span-12 lg:col-span-8 bg-card border border-border rounded-2xl p-[var(--space-4)] space-y-[var(--space-3)] shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-accent-color" />
              <div>
                <h3 className="font-semibold text-foreground text-sm">Team Performance</h3>
                <p className="text-[10px] text-muted-foreground">Quota attainment across the sales team</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onTabChange?.('team performance')}
              className="inline-flex items-center gap-1 text-[10px] font-bold text-accent-color hover:underline"
            >
              View Team
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          <div className="max-h-[300px] overflow-y-auto pr-1 space-y-[var(--space-3)]">
            {sortedReps.map((rep, idx) => {
              const attainment = toNumber(rep.quota_achievement_pct);
              const rankBadge = idx === 0 ? 'bg-yellow-400/20 text-yellow-600' :
                               idx === 1 ? 'bg-gray-300/30 text-gray-500' :
                               idx === 2 ? 'bg-orange-400/20 text-orange-600' :
                               'bg-surface-2 text-text-muted';
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
                        {idx < 3 ? `#${idx + 1}` : getInitials(rep.full_name)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-foreground">{rep.full_name}</p>
                        <p className="text-[10px] text-muted-foreground">Revenue {formatCurrency(rep.revenue_generated)}</p>
                      </div>
                    </div>
                    <span className={`shrink-0 text-xs font-bold tabular-nums ${attainment >= 100 ? 'text-status-success-text' : attainment >= 70 ? 'text-accent-color' : 'text-status-warning-text'}`}>
                      {formatPercent(attainment)}
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
        <div className="col-span-12 lg:col-span-4 bg-card border border-border rounded-2xl p-[var(--space-4)] space-y-[var(--space-3)] shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-status-warning" />
              <div>
                <h3 className="font-semibold text-foreground text-sm">Deals at Risk</h3>
                <p className="text-[10px] text-muted-foreground">High-value opportunities</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onTabChange?.('pipeline')}
              className="text-[10px] font-bold text-accent-color hover:underline"
            >
              View Pipeline
            </button>
          </div>

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
                  <p className="shrink-0 text-xs font-bold text-foreground tabular-nums">{formatCurrency(deal.deal_value)}</p>
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

      {/* ================================================================== */}
      {/* ACTION QUEUE + ACTIVITY — 8/4 grid                                 */}
      {/* ================================================================== */}

      <div className="grid grid-cols-12 gap-[var(--space-4)]">

        {/* Manager Action Queue */}
        <div className="col-span-12 lg:col-span-8 bg-card border border-border rounded-2xl p-[var(--space-4)] space-y-[var(--space-3)] shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-accent-color" />
              <div>
                <h3 className="font-semibold text-foreground text-sm">Manager Action Queue</h3>
                <p className="text-[10px] text-muted-foreground">System-generated items that may need attention</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onTabChange?.('activities')}
              className="text-[10px] font-bold text-accent-color hover:underline"
            >
              View Activity
            </button>
          </div>

          <div className="max-h-[300px] overflow-y-auto pr-1 space-y-2">
            {visibleAlerts.map((alert, index) => {
              const severity = String(alert.severity || '').toLowerCase();
              const isHigh = severity === 'high' || severity === 'critical';

              return (
                <div
                  key={`${alert.timestamp}-${index}`}
                  onClick={() => onTabChange?.('activities')}
                  className={[
                    'cursor-pointer rounded-xl border p-3 transition hover:bg-secondary/20',
                    isHigh ? 'border-status-danger/20 bg-status-danger/10' : 'border-status-warning/20 bg-status-warning/10',
                  ].join(' ')}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={[
                        'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg',
                        isHigh ? 'bg-status-danger/10 text-status-danger' : 'bg-status-warning/10 text-status-warning',
                      ].join(' ')}
                    >
                      {isHigh ? <AlertTriangle className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground leading-5">{alert.message}</p>
                      <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60">
                        {alert.severity} \u00B7 {formatUpdatedAt(alert.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {visibleAlerts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-xs font-semibold bg-secondary/10 rounded-xl border border-border/50">
                <Bell className="mx-auto h-4 w-4 mb-1" />
                No manager alerts
                <p className="mt-1 text-[10px] text-muted-foreground">Everything looks good right now.</p>
              </div>
            )}
          </div>

          {data.deals_at_risk.length > 0 && (
            <button
              type="button"
              onClick={() => onTabChange?.('pipeline')}
              className="w-full flex items-center justify-between rounded-xl bg-secondary/10 border border-border/50 px-3 py-2.5 text-left hover:bg-secondary/20 transition"
            >
              <div>
                <p className="text-xs font-bold text-foreground">{data.deals_at_risk.length} deals require review</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">Open pipeline to review risk</p>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Recent Team Activity */}
        <div className="col-span-12 lg:col-span-4 bg-card border border-border rounded-2xl p-[var(--space-4)] space-y-[var(--space-3)] shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-accent-color" />
              <div>
                <h3 className="font-semibold text-foreground text-sm">Recent Activity</h3>
                <p className="text-[10px] text-muted-foreground">Latest CRM activity</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onTabChange?.('activities')}
              className="text-[10px] font-bold text-accent-color hover:underline"
            >
              View All
            </button>
          </div>

          <div className="max-h-[300px] overflow-y-auto pr-1">
            {visibleActivities.map((activity) => (
              <button
                key={activity.id}
                type="button"
                onClick={() => onTabChange?.('activities')}
                className="flex w-full items-start gap-2.5 rounded-xl px-2 py-2.5 text-left transition hover:bg-secondary/20"
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-color/10 text-accent-color">
                  <Activity className="h-3 w-3" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-foreground">{activity.title || activity.action}</p>
                  <p className="mt-0.5 truncate text-[10px] capitalize text-muted-foreground">
                    {activity.action.replace(/_/g, ' ')} \u00B7 {activity.entity_type.replace(/_/g, ' ')}
                  </p>
                  <p className="mt-0.5 text-[9px] text-muted-foreground">
                    {formatUpdatedAt(activity.created_at)}
                    {activity.created_by ? ` \u00B7 ${activity.created_by}` : ''}
                  </p>
                </div>
                <ChevronRight className="mt-1 h-3 w-3 shrink-0 text-muted-foreground" />
              </button>
            ))}

            {visibleActivities.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-xs font-semibold bg-secondary/10 rounded-xl border border-border/50">
                <Activity className="mx-auto h-4 w-4 mb-1" />
                No recent team activity
                <p className="mt-1 text-[10px] text-muted-foreground">New CRM activity will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* BOTTOM METRICS — 4-column grid                                     */}
      {/* ================================================================== */}

      <div className="grid grid-cols-2 gap-[var(--space-4)] lg:grid-cols-4">

        <div
          role="button"
          tabIndex={0}
          onClick={() => onTabChange?.('team performance')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTabChange?.('team performance'); } }}
          className="bg-card border border-border rounded-2xl p-[var(--space-4)] space-y-[var(--space-3)] shadow-sm"
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Team Members</p>
          <p className="text-xl font-bold text-foreground tabular-nums">{data.team_metrics.total_members}</p>
          <p className="text-[10px] text-muted-foreground">{data.team_metrics.active_reps} active reps</p>
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={() => onTabChange?.('pipeline')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTabChange?.('pipeline'); } }}
          className="bg-card border border-border rounded-2xl p-[var(--space-4)] space-y-[var(--space-3)] shadow-sm"
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Avg Deal Size</p>
          <p className="text-xl font-bold text-foreground tabular-nums">{formatCurrency(data.team_metrics.avg_deal_size)}</p>
          <p className="text-[10px] text-muted-foreground">Across active pipeline</p>
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={() => onTabChange?.('team performance')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTabChange?.('team performance'); } }}
          className="bg-card border border-border rounded-2xl p-[var(--space-4)] space-y-[var(--space-3)] shadow-sm"
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Sales Cycle</p>
          <p className="text-xl font-bold text-foreground tabular-nums">
            {toNumber(data.team_metrics.avg_sales_cycle_days).toFixed(0)} days
          </p>
          <p className="text-[10px] text-muted-foreground">Average team cycle</p>
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={() => onTabChange?.('forecast')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTabChange?.('forecast'); } }}
          className="bg-card border border-border rounded-2xl p-[var(--space-4)] space-y-[var(--space-3)] shadow-sm"
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Forecast Accuracy</p>
          <p className="text-xl font-bold text-foreground tabular-nums">{formatPercent(data.team_metrics.forecast_accuracy)}</p>
          <p className="text-[10px] text-muted-foreground">Current forecast performance</p>
        </div>
      </div>
    </div>
  );
}
