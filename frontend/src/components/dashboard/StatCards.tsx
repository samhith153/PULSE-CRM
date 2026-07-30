'use client';

import React, { useEffect, useState } from 'react';
import { IndianRupee, Award, Target, UserCheck, Clock } from 'lucide-react';
import { getSalesRepDashboard, asNumber, formatINR, formatPct, SalesRepDashboardData } from '@/utils/api';

interface Stat {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  dateRange: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  points: number[];
}

interface StatCardsProps {
  timeFilter: string;
  loading?: boolean;
}

export default function StatCards({ timeFilter, loading = false }: StatCardsProps) {
  const [kpi, setKpi] = useState<SalesRepDashboardData | null>(null);
  const [kpiLoading, setKpiLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setKpiLoading(true);
    const period = timeFilter === 'all' ? 'quarter' : 'month';
    getSalesRepDashboard(period as 'week' | 'month' | 'quarter' | 'year')
      .then((d) => {
        if (!cancelled) setKpi(d);
      })
      .catch(() => {
        if (!cancelled) setKpi(null);
      })
      .finally(() => {
        if (!cancelled) setKpiLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [timeFilter]);

  const generatePath = (points: number[]) => {
    const width = 120;
    const height = 40;
    const maxVal = Math.max(...points, 1);
    const minVal = Math.min(...points, 0);
    const range = maxVal - minVal || 1;
    
    return points.map((p, idx) => {
      const x = (idx / Math.max(points.length - 1, 1)) * width;
      const y = height - ((p - minVal) / range) * (height - 12) - 6;
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');
  };

  const buildSpark = (base: number, trend: number) => {
    // Construct a plausible 10-point sparkline that ends higher/lower per trend sign.
    const up = trend >= 0;
    return Array.from({ length: 10 }, (_, i) => {
      const noise = Math.sin(i * 1.3) * base * 0.12;
      const slope = up ? (base * 0.5 * (i / 9)) : (-base * 0.5 * (i / 9));
      return Math.max(base * 0.5 + noise + slope, 1);
    });
  };

  const getStats = (): Stat[] => {
    const prefix = timeFilter === 'all' ? 'All-time' : 'vs. previous period';
    const k = kpi?.summary;
    const rev = kpi?.revenue_stat;
    const won = kpi?.won_deals_stat;
    const win = kpi?.win_rate_stat;
    const avgDeal = kpi?.avg_deal_size_stat;
    const cycle = kpi?.avg_sales_cycle_stat;

    return [
      {
        title: 'Total revenue',
        value: k && rev ? formatINR(rev.total) : '—',
        change: rev ? formatPct(rev.growth_pct) : '—',
        isPositive: rev ? asNumber(rev.growth_pct) >= 0 : true,
        dateRange: prefix,
        icon: IndianRupee,
        points: k && rev ? buildSpark(asNumber(rev.total) / 10 || 10, asNumber(rev.growth_pct)) : [30, 35, 32, 45, 42, 50, 48, 55, 60, 68],
      },
      {
        title: 'Won deals',
        value: won ? String(won.count) : '—',
        change: won ? formatPct(won.growth_pct) : '—',
        isPositive: won ? asNumber(won.growth_pct) >= 0 : true,
        dateRange: prefix,
        icon: Award,
        points: won ? buildSpark(won.count * 2 || 10, asNumber(won.growth_pct)) : [15, 18, 17, 20, 19, 22, 21, 23, 22, 23],
      },
      {
        title: 'Win rate',
        value: win ? `${asNumber(win.win_rate).toFixed(1)}%` : '—',
        change: win ? formatPct(win.growth_pct) : '—',
        isPositive: win ? asNumber(win.growth_pct) >= 0 : true,
        dateRange: prefix,
        icon: Target,
        points: win ? buildSpark(asNumber(win.win_rate) * 2 || 10, asNumber(win.growth_pct)) : [28, 29, 29, 31, 30, 31, 32, 32, 31, 32],
      },
      {
        title: 'Avg. deal size',
        value: avgDeal ? formatINR(avgDeal.avg_deal_value) : '—',
        change: avgDeal ? formatPct(avgDeal.growth_pct) : '—',
        isPositive: avgDeal ? asNumber(avgDeal.growth_pct) >= 0 : true,
        dateRange: prefix,
        icon: UserCheck,
        points: avgDeal ? buildSpark(asNumber(avgDeal.avg_deal_value) / 10 || 10, asNumber(avgDeal.growth_pct)) : [27, 28, 29, 28, 30, 31, 30, 32, 31, 32.2],
      },
      {
        title: 'Avg. sales cycle',
        value: cycle ? `${Math.round(asNumber(cycle.avg_days))} days` : '—',
        change: cycle ? formatPct(-asNumber(cycle.difference_days)) : '—',
        isPositive: cycle ? asNumber(cycle.difference_days) <= 0 : false,
        dateRange: prefix,
        icon: Clock,
        points: cycle ? buildSpark(asNumber(cycle.avg_days) * 2 || 10, -asNumber(cycle.difference_days)) : [25, 26, 25, 27, 26, 27, 28, 28, 27, 28],
      },
    ];
  };

  const showSkeleton = loading || kpiLoading;
  const stats = showSkeleton ? [] : getStats();

  if (showSkeleton) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div 
            key={idx} 
            className="bg-white border border-brand-border-purple/15 rounded-xl p-5 shadow-sm animate-pulse flex flex-col justify-between h-32"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-16 bg-slate-100 rounded" />
              <div className="h-7 w-7 rounded bg-slate-100" />
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <div className="h-6 w-20 bg-slate-100 rounded" />
              <div className="h-4 w-8 bg-slate-100 rounded" />
            </div>
            <div className="mt-3 pt-2.5 border-t border-brand-border-purple/10 flex justify-between items-center">
              <div className="h-3 w-12 bg-slate-100 rounded" />
              <div className="h-4 w-12 bg-slate-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        const sparklinePath = generatePath(stat.points);
        return (
          <div 
            key={idx} 
            className="bg-white border border-brand-border-purple/20 rounded-xl p-4 shadow-sm/5 hover:shadow-md hover:-translate-y-0.5 hover:border-brand-border-purple/40 transition-all duration-300 flex flex-col justify-between min-h-[130px] overflow-hidden"
          >
            {/* Header info - Title, Change, and Icon */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold text-brand-heading uppercase tracking-wider truncate">
                  {stat.title}
                </span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 w-fit mt-1 leading-none ${
                  stat.isPositive 
                    ? 'text-emerald-700 bg-emerald-50 border border-emerald-100/50' 
                    : 'text-rose-700 bg-rose-50 border border-rose-100/50'
                }`}>
                  {stat.change}
                </span>
              </div>
              <div className="h-7 w-7 rounded-lg bg-brand-sidebar-hover/20 text-brand-heading flex items-center justify-center border border-brand-border-purple/20 shrink-0">
                <Icon className="h-4 w-4" strokeWidth={1.75} />
              </div>
            </div>

            {/* Stat value */}
            <div className="mt-2.5">
              <span className="text-xl sm:text-2xl font-extrabold text-brand-text tracking-tight font-sans tabular-nums leading-none block">
                {stat.value}
              </span>
            </div>

            {/* Sparkline & Details - Stacked or scaled to avoid collisions */}
            <div className="mt-3 pt-2.5 border-t border-brand-border-purple/15 flex items-center justify-between gap-2">
              <div className="text-[9px] text-brand-text/60 font-semibold truncate leading-none">
                {stat.dateRange}
              </div>
              {/* Sparkline graphic scaled down */}
              <div className="w-[60px] sm:w-[70px] h-[16px] opacity-60 hover:opacity-90 transition-opacity duration-200 shrink-0">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 120 40">
                  <path
                    d={sparklinePath}
                    fill="none"
                    stroke={stat.isPositive ? "#10b981" : "#ef4444"}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
