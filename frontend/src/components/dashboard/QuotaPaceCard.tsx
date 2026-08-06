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

interface QuotaPaceCardProps {
  deals?: any[];
  customTarget?: number;
  className?: string;
}

export default function QuotaPaceCard({ deals = [], customTarget = 5000000, className = "" }: QuotaPaceCardProps) {
  const [showDetails, setShowDetails] = useState(false);

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
    let themeColorHex: string;

    if (paceRatio >= 90) {
      status = 'success';
      statusText = `On Track • ${percentage}%`;
      Icon = CheckCircle2;
      barGradient = 'linear-gradient(90deg, #10b981 0%, #34d399 60%, #6ee7b7 100%)';
      glowColor = 'rgba(16,185,129,0.45)';
      badgeBg = 'var(--status-success-bg)';
      badgeBorder = 'var(--status-success-text)';
      badgeText = 'var(--status-success-text)';
      cardAccentClass = 'border-emerald-500/30 dark:border-emerald-500/20 hover:border-emerald-500/50';
      iconBgClass = 'bg-emerald-500/12';
      iconTextClass = 'text-emerald-600 dark:text-emerald-400';
      trackColor = 'rgba(16,185,129,0.12)';
      themeColorHex = '#10b981';
    } else if (paceRatio >= 70) {
      status = 'warning';
      statusText = `At Risk • ${percentage}%`;
      Icon = AlertTriangle;
      barGradient = 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 60%, #fcd34d 100%)';
      glowColor = 'rgba(245,158,11,0.45)';
      badgeBg = 'var(--status-warning-bg)';
      badgeBorder = 'var(--status-warning-text)';
      badgeText = 'var(--status-warning-text)';
      cardAccentClass = 'border-amber-500/30 dark:border-amber-500/20 hover:border-amber-500/50';
      iconBgClass = 'bg-amber-500/12';
      iconTextClass = 'text-amber-600 dark:text-amber-400';
      trackColor = 'rgba(245,158,11,0.12)';
      themeColorHex = '#f59e0b';
    } else {
      status = 'danger';
      statusText = `Behind Pace • ${percentage}%`;
      Icon = AlertCircle;
      barGradient = 'linear-gradient(90deg, #d97706 0%, #f59e0b 60%, #fbbf24 100%)';
      glowColor = 'rgba(217,119,6,0.35)';
      badgeBg = 'var(--status-warning-bg)';
      badgeBorder = 'var(--status-warning-text)';
      badgeText = 'var(--status-warning-text)';
      cardAccentClass = 'border-amber-500/25 dark:border-amber-500/20 hover:border-amber-500/40';
      iconBgClass = 'bg-amber-500/12';
      iconTextClass = 'text-amber-700 dark:text-amber-400';
      trackColor = 'rgba(245,158,11,0.1)';
      themeColorHex = '#f59e0b';
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
      barGradient,
      glowColor,
      badgeBg,
      badgeBorder,
      badgeText,
      cardAccentClass,
      iconBgClass,
      iconTextClass,
      trackColor,
      themeColorHex,
      gap,
      avgDealSize,
    };
  }, [deals, customTarget]);

  const {
    wonDealsCount, achieved, target, percentage, statusText, Icon, status,
    barGradient, glowColor, badgeBg, badgeBorder, badgeText,
    cardAccentClass, iconBgClass, iconTextClass, trackColor, themeColorHex,
    gap, avgDealSize
  } = quota;

  const fillWidth = Math.min(Math.max(percentage, 0), 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`bg-card/95 backdrop-blur-md border ${cardAccentClass} rounded-[22px] p-6 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 w-full overflow-hidden relative group ${className}`}
    >
      {/* Background radial glow effect matching status */}
      <div
        className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-15 pointer-events-none group-hover:opacity-25 transition-opacity duration-500"
        style={{ background: barGradient, filter: 'blur(36px)' }}
      />
      <div
        className="absolute -bottom-16 -left-16 w-44 h-44 rounded-full opacity-10 pointer-events-none"
        style={{ background: barGradient, filter: 'blur(32px)' }}
      />

      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-[var(--space-2)] mb-[var(--space-4)] relative">
        <div className="flex items-center space-x-3">
          <motion.div
            whileHover={{ scale: 1.08, rotate: 5 }}
            className={`h-10 w-10 rounded-2xl ${iconBgClass} flex items-center justify-center ${iconTextClass} border border-border/40 shadow-inner`}
          >
            <Target size={20} />
          </motion.div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-black text-foreground tracking-tight">Quota Pace</h4>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-muted text-muted-foreground border border-border/40">
                Q3 Target
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-0.5">
              Revenue & Goal Tracking
            </p>
          </div>
        </div>

        {/* Status badge with animated pulsing radar dot */}
        <div className="flex items-center gap-2">
          <motion.div
            whileHover={{ scale: 1.03 }}
            className="flex items-center space-x-2 px-3 py-1 rounded-full border text-xs font-extrabold select-none shadow-xs"
            style={{
              backgroundColor: badgeBg,
              borderColor: `color-mix(in srgb, ${badgeBorder} 40%, transparent)`,
              color: badgeText,
            }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: themeColorHex }} />
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: themeColorHex }} />
            </span>
            <Icon size={13} />
            <span>{statusText}</span>
          </motion.div>

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-1 rounded-lg hover:bg-muted/80 text-muted-foreground transition-colors"
            title="Toggle details"
          >
            {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Main Stats Row */}
      <div className="flex items-baseline justify-between mb-3 relative">
        <div className="flex items-baseline gap-2.5">
          <motion.span
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className={`text-4xl font-black tabular-nums leading-none tracking-tight ${iconTextClass}`}
          >
            {percentage}%
          </motion.span>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold">
            <TrendingUp size={14} className={iconTextClass} />
            <span>of {formatINR(target)} target</span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-muted-foreground uppercase font-extrabold tracking-wider block">
            Achieved
          </span>
          <span className={`text-sm font-black tabular-nums ${iconTextClass}`}>
            {formatINR(achieved)}
          </span>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="space-y-2 relative mb-4">
        <div className="relative h-3.5 w-full rounded-full bg-muted/60 border border-border/50 p-0.5 overflow-hidden shadow-inner">
          {/* Tinted Track background */}
          <div
            className="absolute inset-0 rounded-full"
            style={{ background: trackColor }}
          />

          {/* Animated gradient fill */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${fillWidth}%` }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="h-full rounded-full relative overflow-hidden"
            style={{
              background: barGradient,
              boxShadow: `0 0 12px ${glowColor}, 0 2px 4px ${glowColor}`,
              minWidth: fillWidth > 0 ? '8px' : '0px',
            }}
          >
            {/* Shimmer sweep animation overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"
                 style={{
                   backgroundSize: '200% 100%',
                   animation: 'shimmerSweep 2.5s infinite linear'
                 }}
            />
          </motion.div>

          {/* Expected pace marker */}
          <div
            className="absolute z-20 pointer-events-none transition-all duration-500"
            style={{
              left: `${quota.expectedPacePct}%`,
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
            title={`Expected Pace Benchmark: ${quota.expectedPacePct}%`}
          >
            <div className="w-3.5 h-3.5 rounded-full bg-foreground border-2 border-card shadow-md flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-card" />
            </div>
          </div>
        </div>

        {/* Milestone Scale Ticks */}
        <div className="flex justify-between px-1">
          {[0, 25, 50, 75, 100].map((tick) => {
            const isPassed = tick <= fillWidth;
            return (
              <span
                key={tick}
                className={`text-[10px] font-extrabold tabular-nums transition-colors duration-300 ${
                  isPassed ? iconTextClass : 'text-muted-foreground/40'
                }`}
              >
                {tick}%
              </span>
            );
          })}
        </div>
      </div>

      {/* Mini KPI Cards Grid */}
      <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-border/50">
        <div className="p-2.5 rounded-xl bg-muted/40 border border-border/40 hover:bg-muted/70 transition-colors">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground mb-0.5">
            <Zap size={11} className="text-amber-500" />
            <span>Gap to Goal</span>
          </div>
          <p className="text-xs font-black text-foreground tabular-nums truncate">
            {gap === 0 ? 'Goal Hit! 🎉' : formatINR(gap)}
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-muted/40 border border-border/40 hover:bg-muted/70 transition-colors">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground mb-0.5">
            <Award size={11} className="text-brand-purple" />
            <span>Deals Won</span>
          </div>
          <p className="text-xs font-black text-foreground tabular-nums truncate">
            {wonDealsCount} deal{wonDealsCount !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-muted/40 border border-border/40 hover:bg-muted/70 transition-colors">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground mb-0.5">
            <Sparkles size={11} className="text-emerald-500" />
            <span>Avg Deal Size</span>
          </div>
          <p className="text-xs font-black text-foreground tabular-nums truncate">
            {avgDealSize > 0 ? formatINR(avgDealSize) : '—'}
          </p>
        </div>
      </div>

      {/* Expanded Breakdown Drawer */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-3 pt-3 border-t border-border/60 text-xs space-y-2"
          >
            <div className="flex items-center justify-between text-muted-foreground font-semibold text-[11px]">
              <span>Pace Benchmark:</span>
              <span className="text-foreground font-extrabold">{quota.expectedPacePct}% expected at this point in quarter</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground font-semibold text-[11px]">
              <span>Target Surplus / Deficit:</span>
              <span className={`font-black ${status === 'success' ? 'text-emerald-500' : 'text-rose-500'}`}>
                {status === 'success' ? '+' : '-'}{formatINR(Math.abs(achieved - (target * (quota.expectedPacePct / 100))))}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
