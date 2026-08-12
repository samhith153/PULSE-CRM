'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatINR, asNumber } from '@/utils/api';
import {
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Target,
  TrendingUp,
  Award,
  Zap,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useReveal, useCountUp } from '@/hooks/use-reveal';

interface QuotaPaceCardProps {
  deals?: any[];
  customTarget?: number;
  className?: string;
}

/* ─── Design Kit: Quota Pace Component ─────────────────────────────── */
export default function QuotaPaceCard({ deals = [], customTarget = 5000000, className = "" }: QuotaPaceCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const { ref, inView } = useReveal<HTMLDivElement>();

  const quota = useMemo(() => {
    const wonDeals = deals.filter(
      (d) => d.status === 'Won' || d.stage === 'Won' || d.status === 'Closed Won' || d.status === 'Closed'
    );
    const achieved = wonDeals.reduce((sum, d) => sum + asNumber(d.amount || d.value), 0);
    const target = customTarget;
    const percentage = target > 0 ? Math.round((achieved / target) * 100) : 0;
    const expectedPacePct = 60;
    const paceRatio = expectedPacePct > 0 ? (percentage / expectedPacePct) * 100 : 100;
    const gap = Math.max(0, target - achieved);
    const avgDealSize = wonDeals.length > 0 ? Math.round(achieved / wonDeals.length) : 0;

    // Design Kit colors - On Pace uses mint, At Risk uses amber, Behind uses rose
    let status: 'success' | 'warning' | 'danger';
    let statusText: string;
    let Icon: typeof CheckCircle2;

    if (paceRatio >= 90) {
      status = 'success';
      statusText = `On Pace • ${percentage}%`;
      Icon = CheckCircle2;
    } else if (paceRatio >= 70) {
      status = 'warning';
      statusText = `At Risk • ${percentage}%`;
      Icon = AlertTriangle;
    } else {
      status = 'danger';
      statusText = `Behind Pace • ${percentage}%`;
      Icon = AlertCircle;
    }

    return {
      wonDealsCount: wonDeals.length,
      achieved,
      target,
      percentage,
      expectedPacePct,
      statusText,
      Icon,
      status,
      gap,
      avgDealSize,
    };
  }, [deals, customTarget]);

  const {
    wonDealsCount, achieved, target, percentage, statusText, Icon, status,
    gap, avgDealSize
  } = quota;

  const pct = useCountUp(percentage, inView);
  const fillWidth = Math.min(Math.max(percentage, 0), 100);

  // Design Kit tile data
  const tiles = [
    { label: "Gap to Goal", value: gap === 0 ? "₹0" : formatINR(gap), icon: Zap, tone: "text-lime" },
    { label: "Deals Won", value: `${wonDealsCount} deals`, icon: Award, tone: "text-brand" },
    { label: "Avg Deal Size", value: avgDealSize > 0 ? formatINR(avgDealSize) : "₹0", icon: Sparkles, tone: "text-mint-foreground" },
  ];

  return (
    <section
      ref={ref}
      className={cn(
        "reveal relative overflow-hidden bg-quota-card-bg border border-quota-card-border p-6 rounded-[22px] shadow-sm hover:shadow-md transition",
        inView && "is-in",
        className
      )}
    >
      {/* Design Kit ambient glow */}
      <span className="pointer-events-none absolute -right-16 -top-24 size-64 rounded-full bg-accent-color/5 blur-2xl" />

      <div className="relative flex flex-wrap items-start gap-4">
        {/* Header Icon */}
        <span className="grid size-10 place-items-center rounded-xl bg-accent-muted text-accent-color border border-accent-color/15 shadow-inner">
          <Target className="size-[18px]" strokeWidth={2.2} />
        </span>
        
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[17px] font-bold tracking-tight text-text-primary">Quota Pace</h2>
            <span className="bg-surface-2 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-[0.08em] text-text-secondary select-none">
              Q3 Target
            </span>
          </div>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-secondary select-none">
            Revenue &amp; goal tracking
          </p>
        </div>

        {/* Status Badge - Design Kit style */}
        <div className="ml-auto flex items-center gap-2">
          <span className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-[11px] font-bold border select-none",
            status === 'success' && "bg-status-success-bg text-status-success-text border-status-success-text/15",
            status === 'warning' && "bg-status-warning-bg text-status-warning-text border-status-warning-text/15",
            status === 'danger' && "bg-status-danger-bg text-status-danger-text border-status-danger-text/15"
          )}>
            {status === 'success' && (
              <span className="size-1.5 animate-pulse rounded-full bg-status-success-text" />
            )}
            <Icon size={12} />
            {Math.round(pct)}%
          </span>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="grid size-8 place-items-center rounded-full bg-surface-1 border border-border-default hover:bg-surface-hover transition-colors cursor-pointer"
            title="Toggle details"
          >
            <ChevronDown className={cn("size-3.5 text-text-secondary transition-transform", showDetails && "rotate-180")} />
          </button>
        </div>
      </div>

      {/* Main Stats Row - Design Kit style */}
      <div className="relative mt-7 flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <p className="text-[34px] font-extrabold leading-none tracking-tight text-accent-color tabular-nums">
            {Math.round(pct)}%
          </p>
          <p className="text-xs font-semibold text-text-secondary">of {formatINR(target)} target</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-text-secondary select-none">
            Achieved
          </p>
          <p className="text-base font-bold text-text-primary tabular-nums mt-0.5">{formatINR(achieved)}</p>
        </div>
      </div>

      {/* Progress Bar - Design Kit style with gradient */}
      <div className="relative mt-5">
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-2/70 border border-border-default/40">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${inView ? fillWidth : 0}%` }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            className="h-full rounded-full bg-gradient-to-r from-accent-color to-status-success-text"
          />
        </div>
        {/* Scrubber handle */}
        <span
          className="absolute -top-0.5 size-4 rounded-full border-[3px] border-surface-1 bg-accent-color shadow-[0_6px_14px_-6px_var(--accent-color)] transition-all duration-1400 ease-out"
          style={{ left: `calc(${inView ? fillWidth : 0}% - 8px)` }}
        />
        {/* Scale ticks */}
        <div className="mt-3 flex justify-between text-[10px] font-semibold text-text-secondary select-none">
          {["0%", "25%", "50%", "75%", "100%"].map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </div>

      {/* Mini KPI Cards - Design Kit style */}
      <div className="relative mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <div
              key={t.label}
              className="rounded-xl bg-surface-1 p-4 border border-border-default/80 transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-sm"
            >
              <p className={cn("flex items-center gap-1.5 text-[10px] font-semibold text-text-secondary select-none", t.tone)}>
                <Icon className="size-3.5" />
                {t.label}
              </p>
              <p className="mt-2.5 text-base font-bold text-text-primary tabular-nums">{t.value}</p>
            </div>
          );
        })}
      </div>

      {/* Expanded Breakdown Drawer */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-4 pt-4 border-t border-border-default/60 text-xs space-y-2"
          >
            <div className="flex items-center justify-between text-text-secondary font-semibold text-[11px]">
              <span>Pace Benchmark:</span>
              <span className="text-text-primary font-bold">{quota.expectedPacePct}% expected at this point</span>
            </div>
            <div className="flex items-center justify-between text-text-secondary font-semibold text-[11px]">
              <span>Target Surplus / Deficit:</span>
              <span className={cn(
                "font-bold",
                status === 'success' ? "text-status-success-text" : "text-status-danger-text"
              )}>
                {status === 'success' ? '+' : '-'}{formatINR(Math.abs(achieved - (target * (quota.expectedPacePct / 100))))}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
