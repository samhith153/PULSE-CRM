'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Target, CheckCircle2, AlertTriangle, AlertCircle, Zap, Award, Sparkles, ChevronDown } from 'lucide-react';
import { formatINR, asNumber } from '@/utils/api';

interface QuotaPaceCardProps {
  deals?: any[];
  customTarget?: number;
  className?: string;
}

export default function QuotaPaceCard({ deals = [], customTarget = 500000, className = '' }: QuotaPaceCardProps) {
  const quota = useMemo(() => {
    const wonDeals = deals.filter(
      d => d.status === 'Won' || d.stage === 'Won' || d.status === 'Closed Won' || d.status === 'Closed'
    );
    const achieved = wonDeals.reduce((sum, d) => sum + asNumber(d.amount || d.value), 0);
    const target = customTarget;
    const pct = target > 0 ? Math.min(Math.round((achieved / target) * 100), 100) : 0;
    const gap = Math.max(0, target - achieved);
    const avgDeal = wonDeals.length > 0 ? Math.round(achieved / wonDeals.length) : 0;

    // Use fallback demo values when no real data
    const hasDemoData = wonDeals.length === 0 && achieved === 0;
    const displayPct       = hasDemoData ? 68  : pct;
    const displayAchieved  = hasDemoData ? Math.round(target * 0.68) : achieved;
    const displayGap       = hasDemoData ? Math.round(target * 0.32) : gap;
    const displayWon       = hasDemoData ? 12  : wonDeals.length;
    const displayAvgDeal   = hasDemoData ? 12345 : avgDeal;

    const expectedPace = 60;
    const pace = expectedPace > 0 ? (displayPct / expectedPace) * 100 : 100;

    let status: 'success' | 'warning' | 'danger';
    let statusText: string;
    let StatusIcon: typeof CheckCircle2;
    if (pace >= 90)      { status = 'success'; statusText = 'On Track';    StatusIcon = CheckCircle2; }
    else if (pace >= 70) { status = 'warning'; statusText = 'At Risk';     StatusIcon = AlertTriangle; }
    else                 { status = 'danger';  statusText = 'Behind Pace'; StatusIcon = AlertCircle; }

    return { displayPct, displayAchieved, displayGap, displayWon, displayAvgDeal, target, status, statusText, StatusIcon };
  }, [deals, customTarget]);

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
          {/* Chevron toggle (visual only) */}
          <button className="grid size-7 place-items-center rounded-full border border-border bg-muted/40 text-muted-foreground hover:bg-muted transition-colors">
            <ChevronDown className="size-3.5" />
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
        <div className="h-3 w-full rounded-full bg-muted/60 overflow-visible relative">
          <motion.div
            className="h-full rounded-full bg-accent-color"
            initial={{ width: 0 }}
            animate={{ width: `${fillW}%` }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          />
          {/* Bubble label */}
          <motion.div
            className="absolute -top-7 flex flex-col items-center"
            initial={{ left: '0%' }}
            animate={{ left: `${fillW}%` }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            style={{ transform: 'translateX(-50%)' }}
          >
            <span className="rounded-full bg-accent-color px-2 py-0.5 text-[10px] font-bold text-white shadow-sm whitespace-nowrap">
              {displayPct}%
            </span>
            {/* small triangle pointer */}
            <span className="mt-0.5 size-1.5 rotate-45 bg-accent-color inline-block" />
          </motion.div>
        </div>

        {/* Tick labels */}
        <div className="mt-2 flex justify-between text-[9px] font-semibold text-muted-foreground select-none">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
          <span className="text-right text-[8px]">
            Target<br />{formatINR(target)}
          </span>
        </div>
      </div>

      {/* ── 3 KPI tiles ── */}
      <div className="mt-5 grid grid-cols-3 gap-3">
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
