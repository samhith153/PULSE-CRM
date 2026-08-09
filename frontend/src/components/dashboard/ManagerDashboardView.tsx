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
    return `Γé╣${(amount / 10000000).toFixed(2)}Cr`;
  }

  if (Math.abs(amount) >= 100000) {
    return `Γé╣${(amount / 100000).toFixed(2)}L`;
  }

  if (Math.abs(amount) >= 1000) {
    return `Γé╣${(amount / 1000).toFixed(1)}K`;
  }

  return `Γé╣${Math.round(amount).toLocaleString('en-IN')}`;
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
/* Reusable UI                                                                */
/* -------------------------------------------------------------------------- */

function DashboardCard({
  children,
  className = '',
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const clickable = Boolean(onClick);

  return (
    <div
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(event) => {
        if (
          clickable &&
          (event.key === 'Enter' || event.key === ' ')
        ) {
          event.preventDefault();
          onClick?.();
        }
      }}
      className={[
        'rounded-2xl border border-border bg-card shadow-sm',
        'transition-all duration-200',
        clickable
          ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/30'
          : '',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  action,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">
            {title}
          </h2>

          {subtitle && (
            <p className="mt-1 text-xs text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {action}
    </div>
  );
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
      <div className="space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-20 rounded-2xl bg-muted" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-32 rounded-2xl border bg-card"
              />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            <div className="h-80 rounded-2xl border bg-card xl:col-span-2" />
            <div className="h-80 rounded-2xl border bg-card" />
          </div>

          <div className="h-72 rounded-2xl border bg-card" />

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
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
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>

          <h2 className="mt-4 text-lg font-semibold text-red-800">
            Unable to load Manager Dashboard
          </h2>

          <p className="mt-2 text-sm text-red-600">
            {error}
          </p>

          <button
            type="button"
            onClick={loadDashboard}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="rounded-2xl border bg-card p-8 text-center">
          <p className="font-semibold">
            No manager dashboard data available
          </p>

          <button
            type="button"
            onClick={loadDashboard}
            className="mt-4 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
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
    <div className="space-y-6 pb-8">

      {/* ================================================================== */}
      {/* HEADER                                                             */}
      {/* ================================================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Welcome back, Manager
            </h1>

            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
              Manager
            </span>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Sales performance &amp; team command center
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={period}
            onChange={(e) =>
              setPeriod(e.target.value as ManagerDashboardPeriod)
            }
            className="rounded-xl border bg-card px-3.5 py-2 text-xs font-medium shadow-sm outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>

          <select
            value={repId}
            onChange={(e) => setRepId(e.target.value)}
            className="rounded-xl border bg-card px-3.5 py-2 text-xs font-medium shadow-sm outline-none focus:ring-2 focus:ring-primary/20"
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
            className="inline-flex items-center gap-2 rounded-xl border bg-card px-3.5 py-2 text-xs font-medium shadow-sm"
          >
            All Pipelines
          </button>

          <button
            type="button"
            onClick={loadDashboard}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border bg-card px-3.5 py-2 text-xs font-semibold shadow-sm transition hover:bg-muted disabled:opacity-50"
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
      {/* KPI CARDS                                                          */}
      {/* ================================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">

        {/* Team Revenue */}
        <DashboardCard
          onClick={() => onTabChange?.('reports')}
          className="p-5"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">
              Team Revenue
            </p>

            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>

          <p className="mt-4 text-2xl font-bold tracking-tight">
            {formatCurrency(data.summary.team_revenue)}
          </p>

          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            {toNumber(data.revenue_stats.monthly_growth_pct) >= 0 ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}

            {formatPercent(data.revenue_stats.monthly_growth_pct)}
            <span>growth</span>
          </div>
        </DashboardCard>

        {/* Pipeline */}
        <DashboardCard
          onClick={() => onTabChange?.('pipeline')}
          className="p-5"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">
              Pipeline Value
            </p>

            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </div>

          <p className="mt-4 text-2xl font-bold tracking-tight">
            {formatCurrency(data.summary.pipeline_value)}
          </p>

          <p className="mt-2 text-xs text-muted-foreground">
            {data.pipeline_health.total_deals} active deals
          </p>
        </DashboardCard>

        {/* Forecast */}
        <DashboardCard
          onClick={() => onTabChange?.('forecast')}
          className="p-5"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">
              Forecast
            </p>

            <Gauge className="h-4 w-4 text-muted-foreground" />
          </div>

          <p className="mt-4 text-2xl font-bold tracking-tight">
            {formatCurrency(data.forecast.projected_revenue)}
          </p>

          <p className="mt-2 text-xs text-muted-foreground">
            {formatPercent(data.forecast.confidence_score)} confidence
          </p>
        </DashboardCard>

        {/* Quota */}
        <DashboardCard
          onClick={() => onTabChange?.('team performance')}
          className="p-5"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">
              Quota Attainment
            </p>

            <Target className="h-4 w-4 text-muted-foreground" />
          </div>

          <p className="mt-4 text-2xl font-bold tracking-tight">
            {formatPercent(data.revenue_stats.achievement_pct)}
          </p>

          <p className="mt-2 text-xs text-muted-foreground">
            Target {formatCurrency(data.revenue_stats.team_target)}
          </p>
        </DashboardCard>

        {/* Win Rate */}
        <DashboardCard
          onClick={() => onTabChange?.('team performance')}
          className="p-5"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">
              Win Rate
            </p>

            <Trophy className="h-4 w-4 text-muted-foreground" />
          </div>

          <p className="mt-4 text-2xl font-bold tracking-tight">
            {formatPercent(data.summary.win_rate)}
          </p>

          <p className="mt-2 text-xs text-muted-foreground">
            Conversion {formatPercent(data.summary.conversion_rate)}
          </p>
        </DashboardCard>
      </div>

      {/* ================================================================== */}
      {/* REVENUE + FORECAST                                                */}
      {/* ================================================================== */}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">

        {/* Revenue vs Target */}
        <DashboardCard className="p-6 xl:col-span-2">
          <SectionHeader
            icon={TrendingUp}
            title="Revenue vs Target"
            subtitle="Monthly team revenue performance"
            action={
              <button
                type="button"
                onClick={() => onTabChange?.('reports')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                View Report
                <ChevronRight className="h-3 w-3" />
              </button>
            }
          />

          <div className="mt-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-3xl font-bold tracking-tight">
                {formatCurrency(data.summary.team_revenue)}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Current revenue
              </p>
            </div>

            <div className="text-right">
              <p className="text-sm font-semibold">
                Target {formatCurrency(data.revenue_stats.team_target)}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                {formatPercent(data.revenue_stats.achievement_pct)} achieved
              </p>
            </div>
          </div>

          {data.monthly_revenue_trend.length > 0 ? (
            <>
              <div className="mt-8 flex h-52 items-end gap-2 border-b border-border px-2">
                {data.monthly_revenue_trend.map((month) => {
                  const revenue = toNumber(month.revenue);
                  const target = toNumber(month.target);

                  const revenueHeight =
                    revenue > 0
                      ? Math.max(
                          5,
                          (revenue / revenueTrendMax) * 100
                        )
                      : 3;

                  const targetHeight =
                    target > 0
                      ? Math.max(
                          5,
                          (target / revenueTrendMax) * 100
                        )
                      : 3;

                  return (
                    <div
                      key={month.month}
                      className="flex h-full flex-1 items-end justify-center gap-1"
                      title={`${month.month} ΓÇó Revenue ${formatCurrency(
                        revenue
                      )} ΓÇó Target ${formatCurrency(target)}`}
                    >
                      <div
                        className="w-2 rounded-t bg-primary"
                        style={{
                          height: `${revenueHeight}%`,
                        }}
                      />

                      <div
                        className="w-2 rounded-t bg-muted-foreground/20"
                        style={{
                          height: `${targetHeight}%`,
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 flex justify-between text-[10px] text-muted-foreground">
                {data.monthly_revenue_trend.map((month) => (
                  <span key={month.month}>
                    {new Date(
                      `${month.month}-01`
                    ).toLocaleDateString('en-US', {
                      month: 'short',
                    })}
                  </span>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-5 text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  Revenue
                </span>

                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/20" />
                  Target
                </span>
              </div>
            </>
          ) : (
            <div className="mt-8 flex h-52 items-center justify-center rounded-xl border border-dashed">
              <p className="text-sm text-muted-foreground">
                No monthly revenue data available.
              </p>
            </div>
          )}
        </DashboardCard>

        {/* Forecast Health */}
        <DashboardCard className="p-6">
          <SectionHeader
            icon={Gauge}
            title="Forecast Health"
            subtitle="Current quarter outlook"
            action={
              <button
                type="button"
                onClick={() => onTabChange?.('forecast')}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Open
              </button>
            }
          />

          <div className="mt-6">
            <p className="text-xs text-muted-foreground">
              Expected Revenue
            </p>

            <p className="mt-1 text-3xl font-bold tracking-tight">
              {formatCurrency(data.forecast.projected_revenue)}
            </p>
          </div>

          <div className="mt-7 space-y-5">

            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Confidence
                </span>

                <span className="text-xs font-semibold">
                  {formatPercent(data.forecast.confidence_score)}
                </span>
              </div>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        0,
                        toNumber(data.forecast.confidence_score)
                      )
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <span className="text-xs text-muted-foreground">
                Forecast Accuracy
              </span>

              <span className="text-sm font-semibold">
                {formatPercent(data.forecast.forecast_accuracy)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Quarter Projection
              </span>

              <span className="text-sm font-semibold">
                {formatCurrency(
                  data.forecast.expected_quarter_revenue
                )}
              </span>
            </div>
          </div>
        </DashboardCard>
      </div>

      {/* ================================================================== */}
      {/* PIPELINE HEALTH                                                    */}
      {/* ================================================================== */}

      <DashboardCard className="p-6">
        <SectionHeader
          icon={BarChart3}
          title="Pipeline Health"
          subtitle="Deal distribution across pipeline stages"
          action={
            <button
              type="button"
              onClick={() => onTabChange?.('pipeline')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              View Pipeline
              <ChevronRight className="h-3 w-3" />
            </button>
          }
        />

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {data.pipeline_health.stage_distribution.map(
            (stage) => (
              <div
                key={stage.stage}
                className="rounded-xl border bg-muted/20 p-4 transition hover:bg-muted/40"
              >
                <p className="truncate text-xs font-semibold">
                  {stage.stage}
                </p>

                <p className="mt-3 text-xl font-bold">
                  {stage.deal_count}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  {formatCurrency(stage.total_value)}
                </p>

                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          0,
                          toNumber(stage.percentage)
                        )
                      )}%`,
                    }}
                  />
                </div>

                <p className="mt-2 text-[10px] text-muted-foreground">
                  {formatPercent(stage.percentage)}
                </p>
              </div>
            )
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 border-t pt-5 sm:grid-cols-3">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Active Deals
            </p>

            <p className="mt-1 text-lg font-bold">
              {data.pipeline_health.total_deals}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Pipeline Value
            </p>

            <p className="mt-1 text-lg font-bold">
              {formatCurrency(
                data.pipeline_health.active_pipeline_value
              )}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Health Score
            </p>

            <p className="mt-1 text-lg font-bold">
              {formatPercent(
                data.pipeline_health.health_score
              )}
            </p>
          </div>
        </div>
      </DashboardCard>

      {/* ================================================================== */}
      {/* TEAM PERFORMANCE + RISK                                           */}
      {/* ================================================================== */}
<div className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-2">

  {/* Team Performance */}
  <DashboardCard className="flex h-[460px] flex-col overflow-hidden p-6">
    <SectionHeader
      icon={Users}
      title="Team Performance"
      subtitle="Quota attainment across the sales team"
      action={
        <button
          type="button"
          onClick={() => onTabChange?.('team performance')}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          View Team
          <ChevronRight className="h-3 w-3" />
        </button>
      }
    />

    <div className="mt-6 min-h-0 flex-1 overflow-y-auto pr-2">
      <div className="space-y-5">
        {sortedReps.map((rep) => {
          const attainment = toNumber(
            rep.quota_achievement_pct
          );

          return (
            <div key={rep.user_id}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                    {getInitials(rep.full_name)}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold">
                      {rep.full_name}
                    </p>

                    <p className="text-[10px] text-muted-foreground">
                      Revenue {formatCurrency(rep.revenue_generated)}
                    </p>
                  </div>
                </div>

                <span className="shrink-0 text-xs font-bold">
                  {formatPercent(attainment)}
                </span>
              </div>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(0, attainment)
                    )}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </DashboardCard>


  {/* Deals At Risk */}
  <DashboardCard className="flex h-[460px] flex-col overflow-hidden p-6">
    <SectionHeader
      icon={AlertTriangle}
      title="Deals at Risk"
      subtitle="High-value opportunities requiring attention"
      action={
        <button
          type="button"
          onClick={() => onTabChange?.('pipeline')}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          View Pipeline
          <ChevronRight className="h-3 w-3" />
        </button>
      }
    />

    <div className="mt-6 min-h-0 flex-1 overflow-y-auto pr-2">
      <div className="space-y-3">
        {visibleRisks.map((deal) => (
          <div
              key={deal.deal_id}
              onClick={() => onDealClick?.(deal.deal_id)}
              className="cursor-pointer rounded-xl border p-4 transition hover:-translate-y-0.5 hover:bg-muted/30 hover:shadow-sm"
            >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold">
                  {deal.deal_name}
                </p>

                <p className="mt-1 truncate text-[10px] text-muted-foreground">
                  {deal.company || 'No company'}
                </p>
              </div>

              <p className="shrink-0 text-sm font-bold">
                {formatCurrency(deal.deal_value)}
              </p>
            </div>

            <div className="mt-3 flex items-end justify-between gap-4">
              <div>
                <p className="text-[9px] uppercase tracking-wide text-muted-foreground">
                  Owner
                </p>

                <p className="mt-0.5 text-[10px] font-medium">
                  {deal.owner_name || 'Unassigned'}
                </p>
              </div>

              <div className="text-right">
                <p className="text-[9px] uppercase tracking-wide text-muted-foreground">
                  Risk
                </p>

                <p className="mt-0.5 max-w-[220px] text-[10px] font-medium text-amber-600">
                  {deal.risk_reason}
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between border-t pt-3">
              <span className="text-[10px] text-muted-foreground">
                {deal.days_since_last_activity} days since last activity
              </span>

              <button
            type="button"
            onClick={() => onDealClick?.(deal.deal_id)}
            className="rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold hover:bg-muted"
          >
            Open Deal
          </button>
            </div>
          </div>
        ))}

        {visibleRisks.length === 0 && (
          <div className="rounded-xl border border-dashed p-8 text-center">
            <Trophy className="mx-auto h-5 w-5 text-muted-foreground" />

            <p className="mt-2 text-xs font-semibold">
              No deals at risk
            </p>
          </div>
        )}
      </div>
    </div>
  </DashboardCard>

</div>
      {/* ================================================================== */}
      {/* ACTION QUEUE + ACTIVITY                                           */}
      {/* ================================================================== */}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">

        {/* Manager Action Queue */}
        <DashboardCard className="flex h-[400px] flex-col overflow-hidden p-6">
          <SectionHeader
            icon={Bell}
            title="Manager Action Queue"
            subtitle="System-generated items that may need attention"
            action={
              <button
                type="button"
                onClick={() => onTabChange?.('activities')}
                className="text-xs font-semibold text-primary hover:underline"
              >
                View Activity
              </button>
            }
          />

          <div className="mt-6 min-h-0 flex-1 space-y-3 overflow-y-auto pr-2">
            {visibleAlerts.map((alert, index) => {
              const severity = String(
                alert.severity || ''
              ).toLowerCase();

              const isHigh =
                severity === 'high' ||
                severity === 'critical';

              return (
                <div
                    key={`${alert.timestamp}-${index}`}
                    onClick={() => onTabChange?.('activities')}
                    className={[
                      'cursor-pointer flex items-start gap-3 rounded-xl border p-4 transition hover:shadow-sm',
                      isHigh
                        ? 'border-red-200 bg-red-50/50 hover:bg-red-50'
                        : 'border-amber-200 bg-amber-50/40 hover:bg-amber-50',
                    ].join(' ')}
                  >
                  <div
                    className={[
                      'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                      isHigh
                        ? 'bg-red-100 text-red-600'
                        : 'bg-amber-100 text-amber-600',
                    ].join(' ')}
                  >
                    {isHigh ? (
                      <AlertTriangle className="h-4 w-4" />
                    ) : (
                      <Bell className="h-4 w-4" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold leading-5">
                      {alert.message}
                    </p>

                    <p className="mt-1 text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
                      {alert.severity} ┬╖{' '}
                      {formatUpdatedAt(alert.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })}

            {visibleAlerts.length === 0 && (
              <div className="rounded-xl border border-dashed p-8 text-center">
                <Bell className="mx-auto h-5 w-5 text-muted-foreground" />

                <p className="mt-2 text-xs font-semibold">
                  No manager alerts
                </p>

                <p className="mt-1 text-[10px] text-muted-foreground">
                  Everything looks good right now.
                </p>
              </div>
            )}
          </div>

          {data.deals_at_risk.length > 0 && (
            <button
              type="button"
              onClick={() => onTabChange?.('pipeline')}
              className="mt-4 flex w-full items-center justify-between rounded-xl bg-muted/50 px-4 py-3 text-left hover:bg-muted"
            >
              <div>
                <p className="text-xs font-semibold">
                  {data.deals_at_risk.length} deals require review
                </p>

                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  Open pipeline to review risk
                </p>
              </div>

              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </DashboardCard>

        {/* Recent Team Activity */}
        <DashboardCard className="flex h-[400px] flex-col overflow-hidden p-6">
          <SectionHeader
            icon={Activity}
            title="Recent Team Activity"
            subtitle="Latest CRM activity across your sales team"
            action={
              <button
                type="button"
                onClick={() => onTabChange?.('activities')}
                className="text-xs font-semibold text-primary hover:underline"
              >
                View All
              </button>
            }
          />

          <div className="mt-6 min-h-0 flex-1 space-y-1 overflow-y-auto pr-2">
            {visibleActivities.map((activity) => (
              <button
                key={activity.id}
                type="button"
                onClick={() => onTabChange?.('activities')}
                className="flex w-full items-start gap-3 rounded-xl px-2 py-3 text-left transition hover:bg-muted/50"
              >
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Activity className="h-3.5 w-3.5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold">
                    {activity.title || activity.action}
                  </p>

                  <p className="mt-1 truncate text-[10px] capitalize text-muted-foreground">
                    {activity.action.replace(/_/g, ' ')}
                    {' ┬╖ '}
                    {activity.entity_type.replace(/_/g, ' ')}
                  </p>

                  <p className="mt-1 text-[9px] text-muted-foreground">
                    {formatUpdatedAt(activity.created_at)}
                    {activity.created_by
                      ? ` ┬╖ ${activity.created_by}`
                      : ''}
                  </p>
                </div>

                <ChevronRight className="mt-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </button>
            ))}

            {visibleActivities.length === 0 && (
              <div className="rounded-xl border border-dashed p-8 text-center">
                <Activity className="mx-auto h-5 w-5 text-muted-foreground" />

                <p className="mt-2 text-xs font-semibold">
                  No recent team activity
                </p>

                <p className="mt-1 text-[10px] text-muted-foreground">
                  New CRM activity will appear here.
                </p>
              </div>
            )}
          </div>
        </DashboardCard>
      </div>

      {/* ================================================================== */}
      {/* BOTTOM METRICS                                                     */}
      {/* ================================================================== */}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

        <DashboardCard
          onClick={() => onTabChange?.('team performance')}
          className="p-5"
        >
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Team Members
          </p>

          <p className="mt-2 text-xl font-bold">
            {data.team_metrics.total_members}
          </p>

          <p className="mt-1 text-[10px] text-muted-foreground">
            {data.team_metrics.active_reps} active reps
          </p>
        </DashboardCard>

        <DashboardCard
          onClick={() => onTabChange?.('pipeline')}
          className="p-5"
        >
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Avg Deal Size
          </p>

          <p className="mt-2 text-xl font-bold">
            {formatCurrency(data.team_metrics.avg_deal_size)}
          </p>

          <p className="mt-1 text-[10px] text-muted-foreground">
            Across active team pipeline
          </p>
        </DashboardCard>

        <DashboardCard
          onClick={() => onTabChange?.('team performance')}
          className="p-5"
        >
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Sales Cycle
          </p>

          <p className="mt-2 text-xl font-bold">
            {toNumber(
              data.team_metrics.avg_sales_cycle_days
            ).toFixed(0)}{' '}
            days
          </p>

          <p className="mt-1 text-[10px] text-muted-foreground">
            Average team cycle
          </p>
        </DashboardCard>

        <DashboardCard
          onClick={() => onTabChange?.('forecast')}
          className="p-5"
        >
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Forecast Accuracy
          </p>

          <p className="mt-2 text-xl font-bold">
            {formatPercent(data.team_metrics.forecast_accuracy)}
          </p>

          <p className="mt-1 text-[10px] text-muted-foreground">
            Current forecast performance
          </p>
        </DashboardCard>
      </div>
    </div>
  );
}