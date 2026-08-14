'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Target, CheckCircle2, AlertTriangle, AlertCircle, Zap, Award, Sparkles, ChevronDown } from 'lucide-react';
import { formatINR, asNumber } from '@/utils/api';

interface QuotaPaceCardProps {
  deals?: any[];
  quotaPace?: {
    closed_won_revenue: number | string;
    target_revenue: number | string;
    attained_percentage: number | string;
    pace_status: string;
  } | null;
  className?: string;
}

export default function QuotaPaceCard({ deals = [], quotaPace = null, className = '' }: QuotaPaceCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [barHovered, setBarHovered] = useState(false);
  const quota = useMemo(() => {
    // Use backend quota_pace data when available
    if (quotaPace) {
      const achieved = asNumber(quotaPace.closed_won_revenue);
      const target = asNumber(quotaPace.target_revenue);
      const pct = Math.min(Math.round(Number(quotaPace.attained_percentage)), 100);
      const gap = Math.max(0, target - achieved);
      const wonDeals = deals.filter(
        d => d.status === 'Won' || d.stage === 'Won' || d.status === 'Closed Won' || d.status === 'Closed'
      );
      const avgDeal = wonDeals.length > 0 ? Math.round(achieved / wonDeals.length) : 0;

      // Map backend pace_status to display status
      let status: 'success' | 'warning' | 'danger';
      let statusText: string;
      let StatusIcon: typeof CheckCircle2;
      const paceStr = (quotaPace.pace_status || '').toLowerCase();
      if (paceStr.includes('ahead') || paceStr.includes('on pace')) {
        status = 'success'; statusText = 'On Track'; StatusIcon = CheckCircle2;
      } else if (paceStr.includes('behind')) {
        status = 'danger'; statusText = 'Behind Pace'; StatusIcon = AlertCircle;
      } else {
        status = 'warning'; statusText = 'At Risk'; StatusIcon = AlertTriangle;
      }

      return { displayPct: pct, displayAchieved: achieved, displayGap: gap, displayWon: wonDeals.length, displayAvgDeal: avgDeal, target, status, statusText, StatusIcon };
    }

    // Fallback: calculate from deals when no backend data
    const wonDeals = deals.filter(
      d => d.status === 'Won' || d.stage === 'Won' || d.status === 'Closed Won' || d.status === 'Closed'
    );
    const achieved = wonDeals.reduce((sum, d) => sum + asNumber(d.amount || d.value), 0);
    const target = 0;
    const pct = 0;
    const gap = 0;
    const avgDeal = 0;

    return { displayPct: pct, displayAchieved: achieved, displayGap: gap, displayWon: wonDeals.length, displayAvgDeal: avgDeal, target, status: 'danger' as const, statusText: 'No Data', StatusIcon: AlertCircle };
  }, [deals, quotaPace]);

  const {
    displayPct, displayAchieved, displayGap, displayWon, displayAvgDeal,
    target, status, statusText, StatusIcon,
  } = quota;

  const fillW = Math.min(Math.max(displayPct, 0), 100);

  const statusClasses = {
    success: { badge: 'bg-[#E6F6EA] text-[#3DA35D] border-[#3DA35D]/20', dot: 'bg-[#3DA35D]' },
    warning: { badge: 'bg-[#FBF2DD] text-[#B8860B] border-[#B8860B]/20', dot: 'bg-[#B8860B]' },
    danger:  { badge: 'bg-[#FDEAEA] text-[#E5484D] border-[#E5484D]/20', dot: 'bg-[#E5484D]' },
  }[status];

  const tiles = [
    { label: 'Gap to Goal',    value: formatINR(displayGap),   icon: Zap,      color: 'text-accent-color' },
    { label: 'Deals Won',      value: `${displayWon}`,         icon: Award,    color: 'text-accent-color' },
    { label: 'Avg Deal Size',  value: formatINR(displayAvgDeal), icon: Sparkles, color: 'text-accent-color' },
  ];

  return (
    <div className={`bg-card border border-border rounded-2xl p-5 shadow-sm ${className}`}>

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-accent-color/10 border border-accent-color/15">
            <Target className="size-4 text-accent-color" strokeWidth={2.2} />
          </span>
          <div>
            <h2 className="text-[15px] font-bold text-foreground leading-tight">Quota Pace</h2>
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">
              Revenue &amp; Goal Tracking
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status badge */}
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold ${statusClasses.badge}`}>
            <span className={`size-1.5 rounded-full ${statusClasses.dot} ${status === 'success' ? 'animate-pulse' : ''}`} />
            <StatusIcon className="size-3" />
            {statusText}
          </span>
          {/* Chevron toggle */}
          <button
            onClick={() => setExpanded(e => !e)}
            className="grid size-7 place-items-center rounded-full border border-border bg-muted/40 text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <ChevronDown className={`size-3.5 transition-transform duration-200 ${expanded ? '' : '-rotate-90'}`} />
          </button>
        </div>
      </div>

      {/* ── Big percentage + target ── */}
      <div className="flex items-end gap-3 mb-5">
        <span className="text-[42px] font-extrabold leading-none tabular-nums text-accent-color">
          {displayPct}%
        </span>
        <span className="text-[13px] text-muted-foreground font-medium mb-1">
          of {formatINR(target)} target
        </span>
      </div>

      {/* ── Progress bar ── */}
      <div className="relative mb-2">
        {/* Track */}
        <div
          className="h-3 w-full rounded-full bg-muted/60 overflow-visible relative cursor-pointer"
          onMouseEnter={() => setBarHovered(true)}
          onMouseLeave={() => setBarHovered(false)}
        >
          <motion.div
            className="h-full rounded-full bg-accent-color"
            initial={{ width: 0 }}
            animate={{ width: `${fillW}%` }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          />
          {/* Bubble label — only visible on hover */}
          <motion.div
            className="absolute -top-7 flex flex-col items-center pointer-events-none"
            initial={{ left: '0%' }}
            animate={{ left: `${fillW}%` }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            style={{ transform: 'translateX(-50%)' }}
          >
            <motion.span
              className="rounded-full bg-accent-color px-2 py-0.5 text-[10px] font-bold text-white shadow-sm whitespace-nowrap"
              animate={{ opacity: barHovered ? 1 : 0, y: barHovered ? 0 : 4 }}
              transition={{ duration: 0.2 }}
            >
              {displayPct}%
            </motion.span>
            {/* small triangle pointer */}
            <motion.span
              className="mt-0.5 size-1.5 rotate-45 bg-accent-color inline-block"
              animate={{ opacity: barHovered ? 1 : 0 }}
              transition={{ duration: 0.2 }}
            />
          </motion.div>
        </div>

        {/* Tick labels */}
        <div className="mt-2 flex justify-between text-[9px] font-semibold text-muted-foreground select-none">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span className="text-right">100%<br /><span className="text-[8px]">Target {formatINR(target)}</span></span>
        </div>
      </div>

      {/* ── 3 KPI tiles ── */}
      <div className={`mt-5 grid grid-cols-3 gap-3 transition-all duration-300 overflow-hidden ${expanded ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0 mt-0'}`}>
        {tiles.map(t => {
          const Icon = t.icon;
          return (
            <div key={t.label} className="rounded-xl border border-border bg-muted/20 p-3.5">
              <p className={`flex items-center gap-1 text-[10px] font-semibold ${t.color} mb-2`}>
                <Icon className="size-3" />
                {t.label}
              </p>
              <p className="text-[15px] font-extrabold text-foreground tabular-nums">{t.value}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
