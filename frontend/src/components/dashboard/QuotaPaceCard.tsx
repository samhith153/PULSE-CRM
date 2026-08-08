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
        "reveal relative overflow-hidden bg-linear-to-br from-brand-pale via-card to-card p-6 card-surface",
        inView && "is-in",
        className
      )}
    >
      {/* Design Kit ambient glow */}
      <span className="pointer-events-none absolute -right-16 -top-24 size-64 rounded-full bg-brand/10 blur-2xl" />

      <div className="relative flex flex-wrap items-start gap-4">
        {/* Header Icon */}
        <span className="grid size-11 place-items-center rounded-2xl bg-brand-pale text-brand-deep ring-1 ring-brand-soft/70">
          <Target className="size-[20px]" strokeWidth={2.2} />
        </span>
        
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[19px] font-bold tracking-tight">Quota Pace</h2>
            <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Q3 Target
            </span>
          </div>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Revenue &amp; goal tracking
          </p>
        </div>

        {/* Status Badge - Design Kit style */}
        <div className="ml-auto flex items-center gap-2">
          <span className={cn(
            "inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-bold",
            status === 'success' && "bg-mint text-mint-foreground",
            status === 'warning' && "bg-lime-soft text-foreground",
            status === 'danger' && "bg-rose-soft text-rose-foreground"
          )}>
            {status === 'success' && (
              <span className="size-2 animate-pulse rounded-full bg-mint-foreground" />
            )}
            <Icon size={14} />
            {Math.round(pct)}%
          </span>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="grid size-9 place-items-center rounded-full bg-card ring-1 ring-border hover:bg-secondary transition-colors"
            title="Toggle details"
          >
            <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", showDetails && "rotate-180")} />
          </button>
        </div>
      </div>

      {/* Main Stats Row - Design Kit style */}
      <div className="relative mt-7 flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <p className="text-[38px] font-extrabold leading-none tracking-tight text-brand tabular-nums">
            {Math.round(pct)}%
          </p>
          <p className="text-sm font-medium text-muted-foreground">of {formatINR(target)} target</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Achieved
          </p>
          <p className="text-[17px] font-extrabold tabular-nums">{formatINR(achieved)}</p>
        </div>
      </div>

      {/* Progress Bar - Design Kit style with gradient */}
      <div className="relative mt-5">
        <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${inView ? fillWidth : 0}%` }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            className="h-full rounded-full bg-linear-to-r from-brand-deep via-brand to-lime"
          />
        </div>
        {/* Scrubber handle */}
        <span
          className="absolute -top-1 size-5 rounded-full border-[3px] border-card bg-brand-deep shadow-[0_6px_14px_-6px_var(--brand)] transition-all duration-1400 ease-out"
          style={{ left: `calc(${inView ? fillWidth : 0}% - 10px)` }}
        />
        {/* Scale ticks */}
        <div className="mt-3 flex justify-between text-[11px] font-semibold text-muted-foreground">
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
              className="rounded-2xl bg-card p-4 ring-1 ring-border transition-transform duration-300 hover:-translate-y-1"
            >
              <p className={cn("flex items-center gap-2 text-[13px] font-semibold text-muted-foreground", t.tone)}>
                <Icon className="size-4" />
                {t.label}
              </p>
              <p className="mt-2 text-[18px] font-extrabold tabular-nums">{t.value}</p>
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
            className="mt-4 pt-4 border-t border-border/60 text-xs space-y-2"
          >
            <div className="flex items-center justify-between text-muted-foreground font-semibold text-[11px]">
              <span>Pace Benchmark:</span>
              <span className="text-foreground font-extrabold">{quota.expectedPacePct}% expected at this point</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground font-semibold text-[11px]">
              <span>Target Surplus / Deficit:</span>
              <span className={cn(
                "font-black",
                status === 'success' ? "text-mint-foreground" : "text-rose-foreground"
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
