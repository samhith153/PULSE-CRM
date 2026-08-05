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

    let status: 'success' | 'warning' | 'danger';
    let statusText: string;
    let Icon: typeof CheckCircle2;
    // CSS variable strings for inline styles
    let barColor: string;
    let badgeBg: string;
    let badgeBorder: string;
    let badgeText: string;

    if (paceRatio >= 90) {
      status = 'success';
      statusText = `On Track • ${percentage}%`;
      Icon = CheckCircle2;
      barColor = 'var(--status-success-text)';
      badgeBg = 'var(--status-success-bg)';
      badgeBorder = 'var(--status-success-text)';
      badgeText = 'var(--status-success-text)';
    } else if (paceRatio >= 70) {
      status = 'warning';
      statusText = `At Risk • ${percentage}%`;
      Icon = AlertTriangle;
      barColor = 'var(--status-warning-text)';
      badgeBg = 'var(--status-warning-bg)';
      badgeBorder = 'var(--status-warning-text)';
      badgeText = 'var(--status-warning-text)';
    } else {
      status = 'danger';
      statusText = `Behind Pace • ${percentage}%`;
      Icon = AlertCircle;
      barColor = 'var(--status-danger-text)';
      badgeBg = 'var(--status-danger-bg)';
      badgeBorder = 'var(--status-danger-text)';
      badgeText = 'var(--status-danger-text)';
    }

    return {
      achieved,
      target,
      percentage,
      expectedPacePct,
      statusText,
      Icon,
      status,
      barColor,
      badgeBg,
      badgeBorder,
      badgeText,
    };
  }, [deals]);

  const { achieved, target, percentage, statusText, Icon, barColor, badgeBg, badgeBorder, badgeText } = quota;

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

        {/* Status badge — color synced with bar fill */}
        <div
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold select-none"
          style={{
            backgroundColor: badgeBg,
            borderColor: `color-mix(in srgb, ${badgeBorder} 30%, transparent)`,
            color: badgeText,
          }}
        >
          <Icon size={12} />
          <span>{statusText}</span>
        </div>
      </div>

      <div className="space-y-[var(--space-2)]">
        {/* Progress bar */}
        <div className="relative" style={{ height: '8px' }}>
          {/* Track — neutral gray, full width */}
          <div
            className="absolute inset-0 rounded-full"
            style={{ background: 'var(--border-default)' }}
          />

          {/* Fill — proportional to achieved %, status-colored */}
          <div
            className="absolute top-0 left-0 h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${Math.min(Math.max(percentage, 0), 100)}%`,
              background: barColor,
              boxShadow: `0 0 8px color-mix(in srgb, ${barColor} 40%, transparent)`,
              minWidth: percentage > 0 ? '4px' : '0px',
            }}
          />

          {/* Expected pace marker dot — --text-primary so it sits clearly above both track and fill */}
          <div
            className="absolute z-10 pointer-events-none"
            style={{
              left: `${quota.expectedPacePct}%`,
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: 'var(--text-primary)',
              border: '2px solid var(--surface-1)',
            }}
            title={`Expected Target Pace: ${quota.expectedPacePct}%`}
          />
        </div>

        {/* Readouts */}
        <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground font-sans select-none">
          <div>
            Achieved: <span className="font-bold text-foreground tabular-nums">{formatINR(achieved)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>Target: <span className="font-bold text-foreground tabular-nums">{formatINR(target)}</span></span>
            <span
              className="text-[10px] font-medium"
              style={{ color: 'var(--text-primary)', opacity: 0.5 }}
            >
              ({quota.expectedPacePct}% expected pace)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
