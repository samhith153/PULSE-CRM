'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  IndianRupee,
  Award,
  Target,
  UserCheck,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
} from 'lucide-react';
import {
  getSalesRepDashboard,
  asNumber,
  formatINR,
  SalesRepDashboardData,
} from '@/utils/api';
import { useCountUp } from '@/hooks/use-reveal';

/* ─── Types ────────────────────────────────────────────────────────── */

interface Stat {
  title: string;
  rawValue: string;        // shown when target === 0
  change: string;          // e.g. "12%"
  isPositive: boolean;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number; size?: number }>;
  points: number[];        // 8-10 values for the sparkline
  targetValue: number;     // drives useCountUp; 0 means show rawValue as-is
  prefix?: string;
  suffix?: string;
  // Gradient class applied to the icon tile background
  iconGrad: string;
}

interface StatCardsProps {
  timeFilter: string;
  loading?: boolean;
}

/* ─── Sparkline (Area chart per §4 spec) ──────────────────────────── */
/**
 * Inline SVG sparkline: brand-purple/brand-cyan stroke, 12% fill area below line.
 * viewBox "0 0 100 40" — compact height for KPI card layout.
 * Stroke uses vectorEffect="non-scaling-stroke" so it stays 2px at any size.
 */
function Spark({
  points,
  positive,
}: {
  points: number[];
  positive: boolean;
}) {
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const n = points.length;

  if (n === 0) {
    return (
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-8 w-full" aria-hidden>
        <line x1="0" y1="34" x2="100" y2="34" stroke="var(--border-default)" strokeWidth="1" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
      </svg>
    );
  }

  // Map to SVG coords: x 0→100, y 2→30 (leave margin top+bottom)
  const coords = points.map((p, i) => ({
    x: (i / (n - 1)) * 100,
    y: 30 - ((p - min) / range) * 26 + 2,
  }));

  // Spline smoothing using quadratic midpoint interpolation
  let linePath = '';
  if (n > 0) {
    linePath = `M ${coords[0].x.toFixed(1)},${coords[0].y.toFixed(1)}`;
    for (let i = 0; i < n - 1; i++) {
      const cpX = (coords[i].x + coords[i + 1].x) / 2;
      linePath += ` Q ${coords[i].x.toFixed(1)},${coords[i].y.toFixed(1)} ${cpX.toFixed(1)},${((coords[i].y + coords[i + 1].y) / 2).toFixed(1)}`;
    }
    linePath += ` L ${coords[n - 1].x.toFixed(1)},${coords[n - 1].y.toFixed(1)}`;
  }

  const areaPath =
    `${linePath} L ${coords[n - 1].x.toFixed(1)},40 L ${coords[0].x.toFixed(1)},40 Z`;

  const strokeColor = positive ? 'var(--brand-cyan)' : 'var(--destructive)';
  const fillColor = strokeColor;

  return (
    <svg
      viewBox="0 0 100 40"
      preserveAspectRatio="none"
      className="h-8 w-full overflow-visible"
      aria-hidden
    >
      {/* 8% opacity filled area under line */}
      <path d={areaPath} fill={fillColor} fillOpacity="0.08" stroke="none" />
      
      {/* Main line — 1.5px thick, smooth vector spline */}
      <path
        d={linePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />

      {/* Pulsing live dot at latest coordinates */}
      {n > 0 && (
        <>
          <circle
            cx={coords[n - 1].x.toFixed(1)}
            cy={coords[n - 1].y.toFixed(1)}
            r="3.5"
            fill={strokeColor}
            className="animate-ping opacity-60"
          />
          <circle
            cx={coords[n - 1].x.toFixed(1)}
            cy={coords[n - 1].y.toFixed(1)}
            r="1.8"
            fill={strokeColor}
          />
        </>
      )}
    </svg>
  );
}

/* ─── Single stat tile ──────────────────────────────────────────────── */
function StatTile({ stat, delay = 0 }: { stat: Stat; delay?: number }) {
  const { ref, value, visible } = useCountUp(stat.targetValue, 1000);
  const [showDelta, setShowDelta] = useState(false);

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => setShowDelta(true), 900);
      return () => clearTimeout(timer);
    } else {
      setShowDelta(false);
    }
  }, [visible, stat.targetValue]);

  const Delta = stat.isPositive ? ArrowUpRight : ArrowDownRight;

  const displayValue =
    stat.targetValue === 0
      ? stat.rawValue
      : `${stat.prefix ?? ''}${value.toLocaleString()}${stat.suffix ?? ''}`;

  return (
    <motion.div
      ref={ref as React.RefObject<HTMLDivElement>}
      initial={{ opacity: 0, y: 20 }}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: delay / 1000 }}
      className="bg-card/95 backdrop-blur-md border border-border/80 dark:border-border/60 hover:border-primary/30 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition duration-300 relative overflow-hidden group cursor-pointer flex flex-col justify-between"
    >
      {/* Background ambient radial aura pulse */}
      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-primary/5 blur-2xl pointer-events-none group-hover:bg-primary/10 transition duration-500" />

      {/* Row 1 — Icon + Label */}
      <div className="flex items-center justify-between pb-2 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary border border-primary/15 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
            <stat.icon size={16} strokeWidth={2} />
          </div>
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground leading-none">
            {stat.title}
          </p>
        </div>

        {/* Trend pill badge */}
        {stat.change !== '—' && (
          <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
            stat.isPositive 
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
          }`}>
            <Delta size={9} className="shrink-0" strokeWidth={3} />
            <span>{stat.change}</span>
          </span>
        )}
      </div>

      {/* Row 2 — Main Value */}
      <div className="my-2">
        <p className="text-2xl sm:text-3xl font-black leading-none text-foreground tracking-tight tabular-nums truncate" title={displayValue}>
          {displayValue}
        </p>
      </div>

      {/* Row 3 — Sparkline */}
      <div className="pt-2 border-t border-border/30 flex items-center justify-between gap-2">
        <div className="flex-1">
          <Spark points={stat.points} positive={stat.isPositive} />
        </div>
        <span className="text-[9px] font-bold text-muted-foreground/60 shrink-0">vs last week</span>
      </div>
    </motion.div>
  );
}

/* ─── Skeleton card ─────────────────────────────────────────────────── */
function SkeletonTile() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 md:p-6 animate-pulse">
      <div className="flex items-center gap-2">
        <div className="size-4 rounded bg-secondary" />
        <div className="h-2.5 w-20 rounded bg-secondary" />
      </div>
      <div className="h-9 w-28 rounded-lg bg-secondary mt-1.5" />
      <div className="h-2.5 w-24 rounded bg-secondary mt-1" />
      <div className="mt-3.5 pt-1 border-t border-border/20">
        <div className="h-8 w-full rounded bg-secondary" />
      </div>
    </div>
  );
}

/* ─── Empty state (no data yet) ────────────────────────────────────── */
function KpiEmptyState() {
  return (
    <div className="col-span-full rounded-2xl border border-dashed border-border bg-card/50 p-10 flex flex-col items-center justify-center text-center gap-3">
      <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground">
        <TrendingUp size={22} strokeWidth={1.75} />
      </div>
      <p className="text-sm font-semibold text-foreground">No performance data yet</p>
      <p className="text-xs text-muted-foreground max-w-sm">
        Add deals, leads, and activities to your workspace — revenue, win rate, pipeline,
        and more will appear here automatically.
      </p>
    </div>
  );
}

/* ─── Data helpers ──────────────────────────────────────────────────── */
function buildSpark(base: number, trend: number): number[] {
  return Array.from({ length: 10 }, (_, i) => {
    const noise = Math.sin(i * 1.3) * base * 0.12;
    const slope = trend >= 0 ? base * 0.5 * (i / 9) : -base * 0.5 * (i / 9);
    return Math.max(base * 0.5 + noise + slope, 1);
  });
}

/* ─── Main component ─────────────────────────────────────────────────── */
export default function StatCards({
  timeFilter,
  loading = false,
}: StatCardsProps) {
  const [kpi, setKpi] = useState<SalesRepDashboardData | null>(null);
  const [kpiLoading, setKpiLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchKpi = () => {
      setKpiLoading(true);
      const period = timeFilter === 'all' ? 'quarter' : 'month';
      getSalesRepDashboard(period as 'week' | 'month' | 'quarter' | 'year', { silent: true })
        .then((d) => { if (!cancelled) setKpi(d); })
        .catch(() => { if (!cancelled) setKpi(null); })
        .finally(() => { if (!cancelled) setKpiLoading(false); });
    };
    fetchKpi();

    // Re-fetch when leads are created/deleted/updated
    const handleRefresh = () => fetchKpi();
    window.addEventListener('pulse-leads-changed', handleRefresh);
    return () => {
      cancelled = true;
      window.removeEventListener('pulse-leads-changed', handleRefresh);
    };
  }, [timeFilter]);

  const getStats = (): Stat[] => {
    const rev = kpi?.revenue_stat;
    const won = kpi?.won_deals_stat;
    const win = kpi?.win_rate_stat;
    const avgDeal = kpi?.avg_deal_size_stat;
    const cycle = kpi?.avg_sales_cycle_stat;
    const pipeline = kpi?.key_metrics;

    return [
      {
        title: 'Total Revenue',
        rawValue: formatINR(rev?.total),
        change: rev ? `${Math.abs(Math.round(asNumber(rev.growth_pct)))}%` : '—',
        isPositive: rev ? asNumber(rev.growth_pct) >= 0 : true,
        icon: IndianRupee,
        iconGrad: 'grad-blue-purple',
        points: rev ? buildSpark(asNumber(rev.total) / 10 || 10, asNumber(rev.growth_pct)) : [],
        targetValue: asNumber(rev?.total),
        prefix: '₹',
      },
      {
        title: 'Won Deals',
        rawValue: won ? String(won.count) : '0',
        change: won ? `${Math.abs(Math.round(asNumber(won.growth_pct)))}%` : '—',
        isPositive: won ? asNumber(won.growth_pct) >= 0 : true,
        icon: Award,
        iconGrad: 'grad-teal-purple',
        points: won ? buildSpark(won.count * 2 || 10, asNumber(won.growth_pct)) : [],
        targetValue: asNumber(won?.count),
      },
      {
        title: 'Win Rate',
        rawValue: win ? `${asNumber(win.win_rate).toFixed(1)}%` : '0%',
        change: win ? `${Math.abs(Math.round(asNumber(win.growth_pct)))}%` : '—',
        isPositive: win ? asNumber(win.growth_pct) >= 0 : true,
        icon: Target,
        iconGrad: 'grad-blue-purple',
        points: win ? buildSpark(asNumber(win.win_rate) * 2 || 10, asNumber(win.growth_pct)) : [],
        targetValue: asNumber(win?.win_rate),
        suffix: '%',
      },
      {
        title: 'Avg. Deal Size',
        rawValue: formatINR(avgDeal?.avg_deal_value),
        change: avgDeal ? `${Math.abs(Math.round(asNumber(avgDeal.growth_pct)))}%` : '—',
        isPositive: avgDeal ? asNumber(avgDeal.growth_pct) >= 0 : true,
        icon: UserCheck,
        iconGrad: 'grad-pink-purple',
        points: avgDeal ? buildSpark(asNumber(avgDeal.avg_deal_value) / 10 || 10, asNumber(avgDeal.growth_pct)) : [],
        targetValue: asNumber(avgDeal?.avg_deal_value),
        prefix: '₹',
      },
      {
        title: 'Avg. Sales Cycle',
        rawValue: cycle ? `${Math.round(asNumber(cycle.avg_days))} days` : '0 days',
        change: cycle ? `${Math.abs(Math.round(asNumber(-cycle.difference_days)))}d` : '—',
        isPositive: cycle ? asNumber(cycle.difference_days) <= 0 : true,
        icon: Clock,
        iconGrad: 'grad-teal-purple',
        points: cycle ? buildSpark(asNumber(cycle.avg_days) * 2 || 10, -asNumber(cycle.difference_days)) : [],
        targetValue: asNumber(cycle?.avg_days),
        suffix: ' days',
      },
      {
        title: 'Pipeline Value',
        rawValue: formatINR(pipeline?.pipeline_value),
        change: pipeline ? `${Math.abs(Math.round(asNumber(pipeline.pipeline_value_growth_pct)))}%` : '—',
        isPositive: pipeline ? asNumber(pipeline.pipeline_value_growth_pct) >= 0 : true,
        icon: TrendingUp,
        iconGrad: 'grad-blue-purple',
        points: pipeline ? buildSpark(asNumber(pipeline.pipeline_value) / 10 || 10, asNumber(pipeline.pipeline_value_growth_pct)) : [],
        targetValue: asNumber(pipeline?.pipeline_value),
        prefix: '₹',
      },
    ];
  };

  const showSkeleton = loading || kpiLoading;

  if (showSkeleton) {
    return (
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonTile key={i} />
        ))}
      </div>
    );
  }

  const hasData = !!(
    kpi?.revenue_stat ||
    kpi?.won_deals_stat ||
    kpi?.win_rate_stat ||
    kpi?.avg_deal_size_stat ||
    kpi?.avg_sales_cycle_stat ||
    kpi?.key_metrics
  );

  if (!hasData) return <KpiEmptyState />;

  const stats = getStats();

  return (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
      {stats.map((stat, idx) => (
        <StatTile key={stat.title} stat={stat} delay={idx * 75} />
      ))}
    </div>
  );
}
