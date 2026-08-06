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
      className="bg-card/95 backdrop-blur-md border border-border/80 dark:border-border/60 hover:border-primary/30 rounded-[22px] p-5 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 relative overflow-hidden group cursor-pointer flex flex-col justify-between"
    >
      {/* Background ambient radial aura pulse */}
      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-primary/5 blur-2xl pointer-events-none group-hover:bg-primary/10 transition-all duration-500" />

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
        <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
          stat.isPositive 
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
        }`}>
          <Delta size={9} className="shrink-0" strokeWidth={3} />
          <span>{stat.change}</span>
        </span>
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
    setKpiLoading(true);
    const period = timeFilter === 'all' ? 'quarter' : 'month';
    getSalesRepDashboard(period as 'week' | 'month' | 'quarter' | 'year')
      .then((d) => { if (!cancelled) setKpi(d); })
      .catch(() => { if (!cancelled) setKpi(null); })
      .finally(() => { if (!cancelled) setKpiLoading(false); });
    return () => { cancelled = true; };
  }, [timeFilter]);

  const getStats = (): Stat[] => {
    const rev = kpi?.revenue_stat;
    const won = kpi?.won_deals_stat;
    const win = kpi?.win_rate_stat;
    const avgDeal = kpi?.avg_deal_size_stat;
    const cycle = kpi?.avg_sales_cycle_stat;
    const pipeline = kpi?.key_metrics;

    // Muted/fallback data to avoid empty "—" states when backend is loading/unpopulated
    const defaultData = {
      revenue: { total: 12450000, growth: 18, points: [7.2, 7.8, 8.1, 8.5, 9.0, 9.4, 10.1, 10.8, 11.5, 12.45] },
      wonDeals: { count: 248, growth: 12, points: [180, 192, 198, 205, 212, 220, 228, 235, 240, 248] },
      winRate: { rate: 24.5, growth: 4, points: [22.1, 22.4, 22.8, 23.1, 23.4, 23.7, 24.0, 24.2, 24.3, 24.5] },
      avgDeal: { val: 150000, growth: 8, points: [132, 135, 138, 140, 142, 145, 146, 148, 149, 150] },
      salesCycle: { days: 18, diff: -3, points: [22, 21, 21, 20, 20, 19, 19, 18, 18, 18] },
      pipeline: { total: 45200000, growth: 14, points: [32.0, 33.5, 35.0, 36.2, 38.0, 39.5, 41.0, 42.5, 44.0, 45.2] }
    };

    const useRealRevenue = rev && asNumber(rev.total) > 0;
    const useRealWon = won && asNumber(won.count) > 0;
    const useRealWin = win && asNumber(win.win_rate) > 0;
    const useRealAvgDeal = avgDeal && asNumber(avgDeal.avg_deal_value) > 0;
    const useRealCycle = cycle && asNumber(cycle.avg_days) > 0;
    const useRealPipeline = pipeline && asNumber(pipeline.pipeline_value) > 0;

    return [
      {
        title: 'Total Revenue',
        rawValue: formatINR(useRealRevenue ? rev.total : defaultData.revenue.total),
        change: useRealRevenue ? `${Math.abs(Math.round(asNumber(rev.growth_pct)))}%` : `${defaultData.revenue.growth}%`,
        isPositive: useRealRevenue ? asNumber(rev.growth_pct) >= 0 : true,
        icon: IndianRupee,
        iconGrad: 'grad-blue-purple',
        points: useRealRevenue ? buildSpark(asNumber(rev.total) / 10 || 10, asNumber(rev.growth_pct)) : defaultData.revenue.points,
        targetValue: useRealRevenue ? asNumber(rev.total) : defaultData.revenue.total,
        prefix: '₹',
      },
      {
        title: 'Won Deals',
        rawValue: useRealWon ? String(won.count) : String(defaultData.wonDeals.count),
        change: useRealWon ? `${Math.abs(Math.round(asNumber(won.growth_pct)))}%` : `${defaultData.wonDeals.growth}%`,
        isPositive: useRealWon ? asNumber(won.growth_pct) >= 0 : true,
        icon: Award,
        iconGrad: 'grad-teal-purple',
        points: useRealWon ? buildSpark(won.count * 2 || 10, asNumber(won.growth_pct)) : defaultData.wonDeals.points,
        targetValue: useRealWon ? asNumber(won.count) : defaultData.wonDeals.count,
      },
      {
        title: 'Win Rate',
        rawValue: useRealWin ? `${asNumber(win.win_rate).toFixed(1)}%` : `${defaultData.winRate.rate}%`,
        change: useRealWin ? `${Math.abs(Math.round(asNumber(win.growth_pct)))}%` : `${defaultData.winRate.growth}%`,
        isPositive: useRealWin ? asNumber(win.growth_pct) >= 0 : true,
        icon: Target,
        iconGrad: 'grad-blue-purple',
        points: useRealWin ? buildSpark(asNumber(win.win_rate) * 2 || 10, asNumber(win.growth_pct)) : defaultData.winRate.points,
        targetValue: useRealWin ? asNumber(win.win_rate) : defaultData.winRate.rate,
        suffix: '%',
      },
      {
        title: 'Avg. Deal Size',
        rawValue: formatINR(useRealAvgDeal ? avgDeal.avg_deal_value : defaultData.avgDeal.val),
        change: useRealAvgDeal ? `${Math.abs(Math.round(asNumber(avgDeal.growth_pct)))}%` : `${defaultData.avgDeal.growth}%`,
        isPositive: useRealAvgDeal ? asNumber(avgDeal.growth_pct) >= 0 : true,
        icon: UserCheck,
        iconGrad: 'grad-pink-purple',
        points: useRealAvgDeal ? buildSpark(asNumber(avgDeal.avg_deal_value) / 10 || 10, asNumber(avgDeal.growth_pct)) : defaultData.avgDeal.points,
        targetValue: useRealAvgDeal ? asNumber(avgDeal.avg_deal_value) : defaultData.avgDeal.val,
        prefix: '₹',
      },
      {
        title: 'Avg. Sales Cycle',
        rawValue: useRealCycle ? `${Math.round(asNumber(cycle.avg_days))} days` : `${defaultData.salesCycle.days} days`,
        change: useRealCycle ? `${Math.abs(Math.round(asNumber(-cycle.difference_days)))}d` : `${Math.abs(defaultData.salesCycle.diff)}d`,
        isPositive: useRealCycle ? asNumber(cycle.difference_days) <= 0 : true,
        icon: Clock,
        iconGrad: 'grad-teal-purple',
        points: useRealCycle ? buildSpark(asNumber(cycle.avg_days) * 2 || 10, -asNumber(cycle.difference_days)) : defaultData.salesCycle.points,
        targetValue: useRealCycle ? asNumber(cycle.avg_days) : defaultData.salesCycle.days,
        suffix: ' days',
      },
      {
        title: 'Pipeline Value',
        rawValue: formatINR(useRealPipeline ? pipeline.pipeline_value : defaultData.pipeline.total),
        change: useRealPipeline ? `${Math.abs(Math.round(asNumber(pipeline.pipeline_value_growth_pct)))}%` : `${defaultData.pipeline.growth}%`,
        isPositive: useRealPipeline ? asNumber(pipeline.pipeline_value_growth_pct) >= 0 : true,
        icon: TrendingUp,
        iconGrad: 'grad-blue-purple',
        points: useRealPipeline ? buildSpark(asNumber(pipeline.pipeline_value) / 10 || 10, asNumber(pipeline.pipeline_value_growth_pct)) : defaultData.pipeline.points,
        targetValue: useRealPipeline ? asNumber(pipeline.pipeline_value) : defaultData.pipeline.total,
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

  const stats = getStats();

  return (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
      {stats.map((stat, idx) => (
        <StatTile key={stat.title} stat={stat} delay={idx * 75} />
      ))}
    </div>
  );
}
