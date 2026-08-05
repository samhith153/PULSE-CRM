'use client';

import React, { useMemo } from 'react';
import { formatINR, asNumber } from '@/utils/api';
import { AlertCircle, CheckCircle2, AlertTriangle, Target, TrendingUp } from 'lucide-react';

interface QuotaPaceCardProps {
  deals?: any[];
}

export default function QuotaPaceCard({ deals = [] }: QuotaPaceCardProps) {
  const quota = useMemo(() => {
    const wonDeals = deals.filter(
      (d) => d.status === 'Won' || d.stage === 'Won' || d.status === 'Closed Won' || d.status === 'Closed'
    );
    const achieved = wonDeals.reduce((sum, d) => sum + asNumber(d.amount || d.value), 0);

    const target = 5000000;
    const percentage = target > 0 ? Math.round((achieved / target) * 100) : 0;
    const expectedPacePct = 60;
    const paceRatio = expectedPacePct > 0 ? (percentage / expectedPacePct) * 100 : 100;

    let status: 'success' | 'warning' | 'danger';
    let statusText: string;
    let Icon: typeof CheckCircle2;
    let barGradient: string;
    let glowColor: string;
    let badgeBg: string;
    let badgeBorder: string;
    let badgeText: string;
    let cardAccentClass: string;
    let iconBgClass: string;
    let iconTextClass: string;
    let trackColor: string;

    if (paceRatio >= 90) {
      status = 'success';
      statusText = `On Track • ${percentage}%`;
      Icon = CheckCircle2;
      barGradient = 'linear-gradient(90deg, #10b981 0%, #34d399 60%, #6ee7b7 100%)';
      glowColor = 'rgba(16,185,129,0.45)';
      badgeBg = 'var(--status-success-bg)';
      badgeBorder = 'var(--status-success-text)';
      badgeText = 'var(--status-success-text)';
      cardAccentClass = 'border-emerald-500/25 dark:border-emerald-500/20';
      iconBgClass = 'bg-emerald-500/12';
      iconTextClass = 'text-emerald-600 dark:text-emerald-400';
      trackColor = 'rgba(16,185,129,0.12)';
    } else if (paceRatio >= 70) {
      status = 'warning';
      statusText = `At Risk • ${percentage}%`;
      Icon = AlertTriangle;
      barGradient = 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 60%, #fcd34d 100%)';
      glowColor = 'rgba(245,158,11,0.45)';
      badgeBg = 'var(--status-warning-bg)';
      badgeBorder = 'var(--status-warning-text)';
      badgeText = 'var(--status-warning-text)';
      cardAccentClass = 'border-amber-500/25 dark:border-amber-500/20';
      iconBgClass = 'bg-amber-500/12';
      iconTextClass = 'text-amber-600 dark:text-amber-400';
      trackColor = 'rgba(245,158,11,0.12)';
    } else {
      status = 'danger';
      statusText = `Behind Pace • ${percentage}%`;
      Icon = AlertCircle;
      barGradient = 'linear-gradient(90deg, #ef4444 0%, #f87171 60%, #fca5a5 100%)';
      glowColor = 'rgba(239,68,68,0.45)';
      badgeBg = 'var(--status-danger-bg)';
      badgeBorder = 'var(--status-danger-text)';
      badgeText = 'var(--status-danger-text)';
      cardAccentClass = 'border-rose-500/25 dark:border-rose-500/20';
      iconBgClass = 'bg-rose-500/12';
      iconTextClass = 'text-rose-600 dark:text-rose-400';
      trackColor = 'rgba(239,68,68,0.08)';
    }

    return {
      achieved,
      target,
      percentage,
      expectedPacePct,
      statusText,
      Icon,
      status,
      barGradient,
      glowColor,
      badgeBg,
      badgeBorder,
      badgeText,
      cardAccentClass,
      iconBgClass,
      iconTextClass,
      trackColor,
    };
  }, [deals]);

  const {
    achieved, target, percentage, statusText, Icon,
    barGradient, glowColor, badgeBg, badgeBorder, badgeText,
    cardAccentClass, iconBgClass, iconTextClass, trackColor
  } = quota;

  const fillWidth = Math.min(Math.max(percentage, 0), 100);

  return (
    <div className={`bg-card border ${cardAccentClass} rounded-2xl p-[var(--space-4)] shadow-sm hover:shadow-md transition-all duration-300 w-full overflow-hidden relative`}>

      {/* Subtle colored bleed glow top-right corner */}
      <div
        className="absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-10 pointer-events-none"
        style={{ background: barGradient, filter: 'blur(24px)' }}
      />

      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-[var(--space-2)] mb-[var(--space-4)] relative">
        <div className="flex items-center space-x-2.5">
          <div className={`h-8 w-8 rounded-xl ${iconBgClass} flex items-center justify-center ${iconTextClass}`}>
            <Target size={16} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground font-sans leading-tight">Quota Pace</h4>
            <p className="text-[10px] text-muted-foreground uppercase font-extrabold tracking-wider mt-0.5 font-sans">Target Achievement</p>
          </div>
        </div>

        {/* Status badge */}
        <div
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold select-none"
          style={{
            backgroundColor: badgeBg,
            borderColor: `color-mix(in srgb, ${badgeBorder} 35%, transparent)`,
            color: badgeText,
          }}
        >
          <Icon size={11} />
          <span>{statusText}</span>
        </div>
      </div>

      {/* Big % readout */}
      <div className="flex items-end gap-2 mb-[var(--space-3)] relative">
        <span
          className={`text-3xl font-black tabular-nums leading-none ${iconTextClass}`}
        >
          {percentage}%
        </span>
        <div className="flex items-center gap-1 mb-0.5 text-[11px] text-muted-foreground font-semibold">
          <TrendingUp size={12} />
          <span>of ₹{(target / 100000).toFixed(0)}L target</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-[var(--space-2)] relative">
        <div className="relative" style={{ height: '10px' }}>

          {/* Colored tinted track */}
          <div
            className="absolute inset-0 rounded-full"
            style={{ background: trackColor, border: `1px solid color-mix(in srgb, ${badgeBorder} 20%, transparent)` }}
          />

          {/* Animated gradient fill */}
          <div
            className="absolute top-0 left-0 h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${fillWidth}%`,
              background: barGradient,
              boxShadow: `0 0 10px ${glowColor}, 0 2px 4px ${glowColor}`,
              minWidth: fillWidth > 0 ? '6px' : '0px',
            }}
          />

          {/* Expected pace marker */}
          <div
            className="absolute z-10 pointer-events-none"
            style={{
              left: `${quota.expectedPacePct}%`,
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: 'var(--foreground)',
              border: '2.5px solid var(--card)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
            }}
            title={`Expected Pace: ${quota.expectedPacePct}%`}
          />
        </div>

        {/* Scale ticks */}
        <div className="flex justify-between px-0.5">
          {[0, 25, 50, 75, 100].map((tick) => (
            <span
              key={tick}
              className={`text-[9px] font-bold tabular-nums select-none ${tick <= fillWidth ? iconTextClass : 'text-muted-foreground/40'}`}
            >
              {tick}%
            </span>
          ))}
        </div>

        {/* Readouts */}
        <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground font-sans select-none pt-1 border-t border-border/40">
          <div>
            Achieved: <span className={`font-bold tabular-nums ${iconTextClass}`}>{formatINR(achieved)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>Target: <span className="font-bold text-foreground tabular-nums">{formatINR(target)}</span></span>
            <span className="text-[10px] text-muted-foreground/50 font-medium">
              ({quota.expectedPacePct}% pace mark)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
