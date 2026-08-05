'use client';

import React, { useMemo } from 'react';
import { formatINR, asNumber } from '@/utils/api';
import { AlertCircle, CheckCircle2, AlertTriangle, Target } from 'lucide-react';

interface QuotaPaceCardProps {
  deals?: any[];
}

export default function QuotaPaceCard({ deals = [] }: QuotaPaceCardProps) {
  const quota = useMemo(() => {
    // Sum amount of won deals
    const wonDeals = deals.filter(
      (d) => d.status === 'Won' || d.stage === 'Won' || d.status === 'Closed Won' || d.status === 'Closed'
    );
    const achieved = wonDeals.reduce((sum, d) => sum + asNumber(d.amount || d.value), 0);
    
    // Default target of ₹50L (5,000,000)
    const target = 5000000;
    const percentage = target > 0 ? Math.round((achieved / target) * 100) : 0;

    // Define Q3 / Month expected pace: say 60% through the period
    const expectedPacePct = 60;
    
    // Threshold calculation: achieved percent relative to expected pace
    const paceRatio = expectedPacePct > 0 ? (percentage / expectedPacePct) * 100 : 100;

    let status: 'success' | 'warning' | 'danger' = 'success';
    let statusText = 'On track';
    let Icon = CheckCircle2;
    let colorClass = 'text-emerald-600 dark:text-emerald-400';
    let barGradient = 'linear-gradient(90deg, #34d399 0%, #059669 100%)';
    let glowColor = 'shadow-[0_0_12px_rgba(16,185,129,0.35)]';
    let bgClass = 'bg-emerald-500/10 border-emerald-500/20';

    if (paceRatio >= 90) {
      status = 'success';
      statusText = `On Track • ${percentage}%`;
      Icon = CheckCircle2;
      colorClass = 'text-emerald-600 dark:text-emerald-400';
      barGradient = 'linear-gradient(90deg, #34d399 0%, #059669 100%)';
      glowColor = 'shadow-[0_0_12px_rgba(16,185,129,0.35)]';
      bgClass = 'bg-emerald-500/10 border-emerald-500/20';
    } else if (paceRatio >= 70) {
      status = 'warning';
      statusText = `At Risk • ${percentage}%`;
      Icon = AlertTriangle;
      colorClass = 'text-amber-600 dark:text-amber-400';
      barGradient = 'linear-gradient(90deg, #fbbf24 0%, #d97706 100%)';
      glowColor = 'shadow-[0_0_12px_rgba(245,158,11,0.35)]';
      bgClass = 'bg-amber-500/10 border-amber-500/20';
    } else {
      status = 'danger';
      statusText = `Behind Pace • ${percentage}%`;
      Icon = AlertCircle;
      colorClass = 'text-rose-600 dark:text-rose-400';
      barGradient = 'linear-gradient(90deg, #f87171 0%, #dc2626 100%)';
      glowColor = 'shadow-[0_0_12px_rgba(239,68,68,0.35)]';
      bgClass = 'bg-rose-500/10 border-rose-500/20';
    }

    return {
      achieved,
      target,
      percentage,
      expectedPacePct,
      statusText,
      Icon,
      colorClass,
      barGradient,
      glowColor,
      bgClass,
    };
  }, [deals]);

  const { achieved, target, percentage, statusText, Icon, colorClass, barGradient, glowColor, bgClass } = quota;

  return (
    <div className="bg-card border border-border/80 rounded-2xl p-[var(--space-4)] shadow-sm hover:shadow-md hover:border-brand-purple/20 transition-all duration-300 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-[var(--space-2)] mb-[var(--space-3)]">
        <div className="flex items-center space-x-2">
          <div className="h-7 w-7 rounded-lg bg-brand-purple/10 flex items-center justify-center text-brand-purple">
            <Target size={15} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground font-sans">Quota Pace</h4>
            <p className="text-[10px] text-muted-foreground uppercase font-extrabold tracking-wider mt-0.5 font-sans">Target Achievement</p>
          </div>
        </div>

        <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${bgClass} ${colorClass} select-none`}>
          <Icon size={12} />
          <span>{statusText}</span>
        </div>
      </div>

      <div className="space-y-[var(--space-2)]">
        {/* Progress bar container */}
        <div className="relative pt-1.5 pb-0.5">
          <div className="h-3 w-full bg-secondary dark:bg-slate-800 rounded-full">
            <div 
              className={`h-full rounded-full transition-all duration-500 ease-out ${glowColor}`} 
              style={{ width: `${Math.min(percentage, 100)}%`, background: barGradient }}
            />
          </div>
          {/* Expected pace line indicator */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 z-10 flex flex-col items-center pointer-events-none" 
            style={{ left: `${quota.expectedPacePct}%` }}
            title={`Expected Target Pace: ${quota.expectedPacePct}%`}
          >
            <span className="h-2.5 w-2.5 rounded-full bg-brand-purple border-2 border-background dark:border-card shrink-0 -mt-0.5" />
            <div className="w-[1px] flex-1 border-l border-dashed border-brand-purple/80" />
          </div>
        </div>

        {/* Readouts */}
        <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground font-sans select-none">
          <div>
            Achieved: <span className="font-bold text-foreground tabular-nums">{formatINR(achieved)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>Target: <span className="font-bold text-foreground tabular-nums">{formatINR(target)}</span></span>
            <span className="text-[10px] text-muted-foreground/60 font-medium">({quota.expectedPacePct}% expected pace marker)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
