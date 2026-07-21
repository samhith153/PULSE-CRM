'use client';

import React from 'react';
import { IndianRupee, Award, Target, UserCheck, Clock } from 'lucide-react';

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
  const generatePath = (points: number[]) => {
    const width = 120;
    const height = 40;
    const maxVal = Math.max(...points);
    const minVal = Math.min(...points);
    const range = maxVal - minVal || 1;
    
    return points.map((p, idx) => {
      const x = (idx / (points.length - 1)) * width;
      const y = height - ((p - minVal) / range) * (height - 12) - 6;
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');
  };

  const getStats = (): Stat[] => {
    const prefix = timeFilter === 'all' ? 'All-time' : 'vs. Apr 12 – Apr 18';
    
    return [
      {
        title: "Total revenue",
        value: timeFilter === 'sales' ? "₹1.20M" : "₹3.85M",
        change: "+26%",
        isPositive: true,
        dateRange: prefix,
        icon: IndianRupee,
        points: [30, 35, 32, 45, 42, 50, 48, 55, 60, 68]
      },
      {
        title: "Won deals",
        value: timeFilter === 'sales' ? "12" : "23",
        change: "+21%",
        isPositive: true,
        dateRange: prefix,
        icon: Award,
        points: [15, 18, 17, 20, 19, 22, 21, 23, 22, 23]
      },
      {
        title: "Win rate",
        value: "32.0%",
        change: "+4%",
        isPositive: true,
        dateRange: prefix,
        icon: Target,
        points: [28, 29, 29, 31, 30, 31, 32, 32, 31, 32]
      },
      {
        title: "Avg. deal size",
        value: "₹32.2K",
        change: "+14%",
        isPositive: true,
        dateRange: prefix,
        icon: UserCheck,
        points: [27, 28, 29, 28, 30, 31, 30, 32, 31, 32.2]
      },
      {
        title: "Avg. sales cycle",
        value: "28 days",
        change: "+3d",
        isPositive: false,
        dateRange: prefix,
        icon: Clock,
        points: [25, 26, 25, 27, 26, 27, 28, 28, 27, 28]
      }
    ];
  };

  const stats = getStats();

  if (loading) {
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
            className="bg-white border border-brand-border-purple/20 rounded-xl p-4.5 shadow-sm/5 hover:shadow-md hover:-translate-y-0.5 hover:border-brand-border-purple/40 transition-all duration-300 flex flex-col justify-between min-h-[130px] overflow-hidden"
          >
            {/* Header info - Title and Icon side-by-side */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-brand-heading uppercase tracking-wider truncate">
                {stat.title}
              </span>
              <div className="h-7 w-7 rounded-lg bg-brand-sidebar-hover/20 text-brand-heading flex items-center justify-center border border-brand-border-purple/20 shrink-0">
                <Icon className="h-4 w-4" strokeWidth={1.75} />
              </div>
            </div>

            {/* Stat value & trend - Responsive sizing to prevent wrapping overflow */}
            <div className="mt-3 flex items-baseline justify-between gap-1 flex-wrap">
              <span className="text-2xl sm:text-3xl font-extrabold text-brand-text tracking-tight font-sans tabular-nums leading-none">
                {stat.value}
              </span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 self-center leading-none ${
                stat.isPositive 
                  ? 'text-emerald-700 bg-emerald-50 border border-emerald-100/50' 
                  : 'text-rose-700 bg-rose-50 border border-rose-100/50'
              }`}>
                {stat.change}
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
                    stroke={stat.isPositive ? "#7e71f9" : "#79a7e8"}
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
