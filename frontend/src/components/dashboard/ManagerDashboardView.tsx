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
  RefreshCw,
  Target,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react';
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
                className="h-32 rounded-2xl border bg-card"
              />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-[var(--space-4)] xl:grid-cols-3">
            <div className="h-80 rounded-2xl border bg-card xl:col-span-2" />
            <div className="h-80 rounded-2xl border bg-card" />
          </div>

          <div className="h-72 rounded-2xl border bg-card" />

          <div className="grid grid-cols-1 gap-[var(--space-4)] xl:grid-cols-2">
            <div className="h-80 rounded-2xl border bg-card" />
            <div className="h-80 rounded-2xl border bg-card" />
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
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-brand-purple" />

          <h2 className="mt-4 text-sm font-semibold text-foreground">
            Unable to load Manager Dashboard
          </h2>

          <p className="mt-2 text-[10px] text-muted-foreground">
            {error}
          </p>

          <button
            type="button"
            onClick={loadDashboard}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-purple px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-brand-purple/90"
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
        <div className="text-center py-8 text-muted-foreground text-xs font-semibold bg-secondary/10 rounded-2xl border border-border/50 px-8">
          <p>No manager dashboard data available</p>

          <button
            type="button"
            onClick={loadDashboard}
            className="mt-4 rounded-lg border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary/40 transition"
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

      <div className="flex flex-col gap-[var(--space-4)] lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-sans font-bold tracking-tight text-foreground">
              Welcome back, Manager
            </h1>

            <span className="rounded-full bg-brand-purple/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-brand-purple border border-brand-purple/15">
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
            className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground outline-none focus:ring-1 focus:ring-brand-purple/20"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>

          <select
            value={repId}
            onChange={(e) => setRepId(e.target.value)}
            className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground outline-none focus:ring-1 focus:ring-brand-purple/20"
          >
            <option value="all">All Reps</option>

            {data.rep_quota_attainment.map((rep) => (
              <option key={rep.user_id} value={rep.user_id}>
                {rep.full_name}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground"
          >
            All Pipelines
          </button>

          <button
            type="button"
            onClick={loadDashboard}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-secondary/40 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${
                loading ? 'animate-spin' : ''
              }`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* ================================================================== */}
      {/* KPI CARDS — 5-column grid                                          */}
      {/* ================================================================== */}

      <div className="grid grid-cols-1 gap-[var(--space-4)] sm:grid-cols-2 xl:grid-cols-5">

        {/* Team Revenue */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onTabChange?.('reports')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTabChange?.('reports'); } }}
          className="bg-card border border-border rounded-2xl p-[var(--space-4)] space-y-[var(--space-3)]"
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
              Team Revenue
            </p>
            <TrendingUp className="h-4 w-4 text-brand-purple" />
          </div>

          <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
            {formatCurrency(data.summary.team_revenue)}
          </p>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {toNumber(data.revenue_stats.monthly_growth_pct) >= 0 ? (
              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />
            )}
            <span className={`font-semibold ${toNumber(data.revenue_stats.monthly_growth_pct) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatPercent(data.revenue_stats.monthly_growth_pct)}
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
          className="bg-card border border-border rounded-2xl p-[var(--space-4)] space-y-[var(--space-3)]"
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
              Pipeline Value
            </p>
            <BarChart3 className="h-4 w-4 text-brand-purple" />
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
          className="bg-card border border-border rounded-2xl p-[var(--space-4)] space-y-[var(--space-3)]"
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
              Forecast
            </p>
            <Gauge className="h-4 w-4 text-brand-purple" />
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
          className="bg-card border border-border rounded-2xl p-[var(--space-4)] space-y-[var(--space-3)]"
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
              Quota Attainment
            </p>
            <Target className="h-4 w-4 text-brand-purple" />
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
          className="bg-card border border-border rounded-2xl p-[var(--space-4)] space-y-[var(--space-3)]"
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
              Win Rate
            </p>
            <Trophy className="h-4 w-4 text-brand-purple" />
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
        <div className="col-span-12 lg:col-span-8 bg-card border border-border rounded-2xl p-[var(--space-4)] space-y-[var(--space-3)]">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-brand-purple" />
              <div>
                <h3 className="font-semibold text-foreground text-sm">Revenue vs Target</h3>
                <p className="text-[10px] text-muted-foreground">Monthly team revenue performance</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onTabChange?.('reports')}
              className="text-[10px] font-bold text-brand-purple hover:underline"
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
                {data.monthly_revenue_trend.map((month) => {
                  const revenue = toNumber(month.revenue);
                  const target = toNumber(month.target);

                  const revenueHeight =
                    revenue > 0
                      ? Math.max(5, (revenue / revenueTrendMax) * 100)
                      : 3;

                  const targetHeight =
                    target > 0
                      ? Math.max(5, (target / revenueTrendMax) * 100)
                      : 3;

                  return (
                    <div
                      key={month.month}
                      className="flex h-full flex-1 items-end justify-center gap-1"
                      title={`${month.month} \u2014 Revenue ${formatCurrency(revenue)} \u2014 Target ${formatCurrency(target)}`}
                    >
                      <div
                        className="w-2 rounded-t bg-brand-purple"
                        style={{ height: `${revenueHeight}%` }}
                      />
                      <div
                        className="w-2 rounded-t bg-muted-foreground/20"
                        style={{ height: `${targetHeight}%` }}
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
                  <span className="h-2 w-2 rounded-full bg-brand-purple" />
                  Revenue
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/20" />
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
        <div className="col-span-12 lg:col-span-4 bg-card border border-border rounded-2xl p-[var(--space-4)] space-y-[var(--space-3)]">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-brand-purple" />
              <div>
                <h3 className="font-semibold text-foreground text-sm">Forecast Health</h3>
                <p className="text-[10px] text-muted-foreground">Current quarter outlook</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onTabChange?.('forecast')}
              className="text-[10px] font-bold text-brand-purple hover:underline"
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
                  className="h-full rounded-full bg-brand-purple"
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

      <div className="bg-card border border-border rounded-2xl p-[var(--space-4)] space-y-[var(--space-3)]">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-brand-purple" />
            <div>
              <h3 className="font-semibold text-foreground text-sm">Pipeline Health</h3>
              <p className="text-[10px] text-muted-foreground">Deal distribution across pipeline stages</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onTabChange?.('pipeline')}
            className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-purple hover:underline"
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
                  className="h-full rounded-full bg-brand-purple"
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
        <div className="col-span-12 lg:col-span-8 bg-card border border-border rounded-2xl p-[var(--space-4)] space-y-[var(--space-3)]">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-brand-purple" />
              <div>
                <h3 className="font-semibold text-foreground text-sm">Team Performance</h3>
                <p className="text-[10px] text-muted-foreground">Quota attainment across the sales team</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onTabChange?.('team performance')}
              className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-purple hover:underline"
            >
              View Team
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          <div className="max-h-[300px] overflow-y-auto pr-1 space-y-[var(--space-3)]">
            {sortedReps.map((rep) => {
              const attainment = toNumber(rep.quota_achievement_pct);

              return (
                <div key={rep.user_id}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-purple/10 text-[9px] font-bold text-brand-purple border border-brand-purple/15">
                        {getInitials(rep.full_name)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-foreground">{rep.full_name}</p>
                        <p className="text-[10px] text-muted-foreground">Revenue {formatCurrency(rep.revenue_generated)}</p>
                      </div>
                    </div>
                    <span className="shrink-0 text-xs font-bold tabular-nums text-brand-purple">
                      {formatPercent(attainment)}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-brand-purple"
                      style={{ width: `${Math.min(100, Math.max(0, attainment))}%` }}
                    />
                  </div>
                </div>
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
        <div className="col-span-12 lg:col-span-4 bg-card border border-border rounded-2xl p-[var(--space-4)] space-y-[var(--space-3)]">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <div>
                <h3 className="font-semibold text-foreground text-sm">Deals at Risk</h3>
                <p className="text-[10px] text-muted-foreground">High-value opportunities</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onTabChange?.('pipeline')}
              className="text-[10px] font-bold text-brand-purple hover:underline"
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
                    <p className="mt-0.5 text-[10px] font-semibold text-amber-600 truncate">{deal.risk_reason}</p>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
                  <span className="text-[10px] text-muted-foreground">
                    {deal.days_since_last_activity}d since activity
                  </span>
                  <button
                    type="button"
                    onClick={() => onDealClick?.(deal.deal_id)}
                    className="rounded-lg border border-border px-2 py-1 text-[9px] font-bold text-foreground hover:bg-secondary/40 transition"
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
        <div className="col-span-12 lg:col-span-8 bg-card border border-border rounded-2xl p-[var(--space-4)] space-y-[var(--space-3)]">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-brand-purple" />
              <div>
                <h3 className="font-semibold text-foreground text-sm">Manager Action Queue</h3>
                <p className="text-[10px] text-muted-foreground">System-generated items that may need attention</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onTabChange?.('activities')}
              className="text-[10px] font-bold text-brand-purple hover:underline"
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
                    isHigh ? 'border-rose-200 bg-rose-50/50' : 'border-amber-200 bg-amber-50/40',
                  ].join(' ')}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={[
                        'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg',
                        isHigh ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600',
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
        <div className="col-span-12 lg:col-span-4 bg-card border border-border rounded-2xl p-[var(--space-4)] space-y-[var(--space-3)]">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-brand-purple" />
              <div>
                <h3 className="font-semibold text-foreground text-sm">Recent Activity</h3>
                <p className="text-[10px] text-muted-foreground">Latest CRM activity</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onTabChange?.('activities')}
              className="text-[10px] font-bold text-brand-purple hover:underline"
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
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-purple/10 text-brand-purple">
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
          className="bg-card border border-border rounded-2xl p-[var(--space-4)] space-y-[var(--space-3)]"
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
          className="bg-card border border-border rounded-2xl p-[var(--space-4)] space-y-[var(--space-3)]"
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
          className="bg-card border border-border rounded-2xl p-[var(--space-4)] space-y-[var(--space-3)]"
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
          className="bg-card border border-border rounded-2xl p-[var(--space-4)] space-y-[var(--space-3)]"
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Forecast Accuracy</p>
          <p className="text-xl font-bold text-foreground tabular-nums">{formatPercent(data.team_metrics.forecast_accuracy)}</p>
          <p className="text-[10px] text-muted-foreground">Current forecast performance</p>
        </div>
      </div>
    </div>
  );
}
