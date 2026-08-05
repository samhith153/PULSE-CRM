'use client';

import React, { useEffect, useState } from 'react';
import {
  IndianRupee,
  Award,
  Target,
  UserCheck,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
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

  // Map to SVG coords: x 0→100, y 2→36 (leave margin top+bottom)
  const coords = points.map((p, i) => ({
    x: (i / (n - 1)) * 100,
    y: 36 - ((p - min) / range) * 34 + 2,
  }));

  const linePath = coords
    .map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`)
    .join(' ');

  const areaPath =
    `${linePath} L${coords[n - 1].x.toFixed(1)},40 L${coords[0].x.toFixed(1)},40 Z`;

  const strokeColor = positive
    ? 'var(--brand-purple)'
    : 'var(--destructive)';
  const fillColor = positive
    ? 'var(--brand-purple)'
    : 'var(--destructive)';

  return (
    <svg
      viewBox="0 0 100 40"
      preserveAspectRatio="none"
      className="h-8 w-full"
      aria-hidden
    >
      {/* 12% opacity filled area under line */}
      <path d={areaPath} fill={fillColor} fillOpacity="0.12" stroke="none" />
      {/* Main line — 2px, non-scaling */}
      <path
        d={linePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
      {/* brand-cyan data-point dots */}
      {coords.map((c, i) => (
        <circle
          key={i}
          cx={c.x.toFixed(1)}
          cy={c.y.toFixed(1)}
          r="1.6"
          fill="var(--brand-cyan)"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}

/* ─── Single stat tile ──────────────────────────────────────────────── */
/**
 * Layout per spec §4 "Stat tile":
 *   Row 1: icon tile (size-9 rounded-xl bg-secondary) top-left
 *   Row 2: label (text-xs muted-foreground uppercase tracking-wide)
 *   Row 3: animated value (text-2xl font-semibold)
 *   Row 4: delta row — ArrowUpRight brand-cyan / ArrowDownRight destructive, "vs last week" muted
 *   Row 5: sparkline (area chart, brand-purple fill+stroke, brand-cyan dots)
 *
 * Card: bg-card border border-border rounded-2xl p-4, NO shadow.
 * Hover: -translate-y-0.5 + shadow-nav (spec §3 — floated things only).
 * Reveal: staggered via transitionDelay prop, driven by data-visible="true".
 */
function StatTile({ stat, delay = 0 }: { stat: Stat; delay?: number }) {
  const { ref, value, visible } = useCountUp(stat.targetValue);
  const Delta = stat.isPositive ? ArrowUpRight : ArrowDownRight;
  const deltaColor = stat.isPositive ? 'text-brand-cyan' : 'text-destructive';

  const displayValue =
    stat.targetValue === 0
      ? stat.rawValue
      : `${stat.prefix ?? ''}${value.toLocaleString()}${stat.suffix ?? ''}`;

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      data-visible={visible}
      style={{ transitionDelay: `${delay}ms` }}
      className="reveal flex flex-col gap-2.5 rounded-2xl border border-border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-nav"
    >
      {/* Row 1 — Icon tile */}
      <div className={`grid size-9 shrink-0 place-items-center rounded-xl bg-secondary text-brand-purple`}>
        <stat.icon size={16} strokeWidth={2} />
      </div>

      {/* Row 2 — Label */}
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground leading-none">
        {stat.title}
      </p>

      {/* Row 3 — Animated value */}
      <p className="text-2xl font-semibold leading-none text-foreground tabular-nums">
        {displayValue}
      </p>

      {/* Row 4 — Delta */}
      <p className={`flex items-center gap-1 text-[11px] font-bold whitespace-nowrap ${deltaColor}`}>
        <Delta size={12} className="shrink-0" strokeWidth={2.5} />
        <span>{stat.change}</span>
        <span className="font-medium text-muted-foreground">vs last week</span>
      </p>

      {/* Row 5 — Sparkline */}
      <div className="mt-0.5">
        <Spark points={stat.points} positive={stat.isPositive} />
      </div>
    </div>
  );
}

/* ─── Skeleton card ─────────────────────────────────────────────────── */
function SkeletonTile() {
  return (
    <div className="flex flex-col gap-2.5 rounded-2xl border border-border bg-card p-4 animate-pulse">
      <div className="size-9 rounded-xl bg-secondary" />
      <div className="h-2.5 w-20 rounded bg-secondary" />
      <div className="h-7 w-28 rounded-lg bg-secondary" />
      <div className="h-2.5 w-24 rounded bg-secondary" />
      <div className="mt-0.5 h-8 w-full rounded bg-secondary" />
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

    return [
      {
        title: 'Total Revenue',
        rawValue: rev ? formatINR(rev.total) : '—',
        change: rev ? `${Math.abs(Math.round(asNumber(rev.growth_pct)))}%` : '—',
        isPositive: rev ? asNumber(rev.growth_pct) >= 0 : true,
        icon: IndianRupee,
        iconGrad: 'grad-blue-purple',
        points: rev ? buildSpark(asNumber(rev.total) / 10 || 10, asNumber(rev.growth_pct)) : [3, 5, 4, 6, 7, 9, 11, 13, 12, 14],
        targetValue: rev ? asNumber(rev.total) : 0,
        prefix: '₹',
      },
      {
        title: 'Won Deals',
        rawValue: won ? String(won.count) : '—',
        change: won ? `${Math.abs(Math.round(asNumber(won.growth_pct)))}%` : '—',
        isPositive: won ? asNumber(won.growth_pct) >= 0 : true,
        icon: Award,
        iconGrad: 'grad-teal-purple',
        points: won ? buildSpark(won.count * 2 || 10, asNumber(won.growth_pct)) : [2, 3, 3, 5, 4, 6, 7, 8, 7, 9],
        targetValue: won ? asNumber(won.count) : 0,
      },
      {
        title: 'Win Rate',
        rawValue: win ? `${asNumber(win.win_rate).toFixed(1)}%` : '—',
        change: win ? `${Math.abs(Math.round(asNumber(win.growth_pct)))}%` : '—',
        isPositive: win ? asNumber(win.growth_pct) >= 0 : true,
        icon: Target,
        iconGrad: 'grad-blue-purple',
        points: win ? buildSpark(asNumber(win.win_rate) * 2 || 10, asNumber(win.growth_pct)) : [4, 4, 5, 5, 6, 6, 7, 8, 7, 8],
        targetValue: win ? asNumber(win.win_rate) : 0,
        suffix: '%',
      },
      {
        title: 'Avg. Deal Size',
        rawValue: avgDeal ? formatINR(avgDeal.avg_deal_value) : '—',
        change: avgDeal ? `${Math.abs(Math.round(asNumber(avgDeal.growth_pct)))}%` : '—',
        isPositive: avgDeal ? asNumber(avgDeal.growth_pct) >= 0 : true,
        icon: UserCheck,
        iconGrad: 'grad-pink-purple',
        points: avgDeal ? buildSpark(asNumber(avgDeal.avg_deal_value) / 10 || 10, asNumber(avgDeal.growth_pct)) : [5, 6, 5, 7, 8, 8, 9, 10, 9, 11],
        targetValue: avgDeal ? asNumber(avgDeal.avg_deal_value) : 0,
        prefix: '₹',
      },
      {
        title: 'Avg. Sales Cycle',
        rawValue: cycle ? `${Math.round(asNumber(cycle.avg_days))} days` : '—',
        change: cycle ? `${Math.abs(Math.round(asNumber(-cycle.difference_days)))}d` : '—',
        isPositive: cycle ? asNumber(cycle.difference_days) <= 0 : false,
        icon: Clock,
        iconGrad: 'grad-teal-purple',
        points: cycle ? buildSpark(asNumber(cycle.avg_days) * 2 || 10, -asNumber(cycle.difference_days)) : [9, 8, 8, 7, 6, 6, 5, 5, 4, 4],
        targetValue: cycle ? asNumber(cycle.avg_days) : 0,
        suffix: ' d',
      },
    ];
  };

  const showSkeleton = loading || kpiLoading;

  if (showSkeleton) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonTile key={i} />
        ))}
      </div>
    );
  }

  const stats = getStats();

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {stats.map((stat, idx) => (
        <StatTile key={stat.title} stat={stat} delay={idx * 75} />
      ))}
    </div>
  );
}
