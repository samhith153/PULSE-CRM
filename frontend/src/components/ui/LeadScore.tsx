import React from 'react';
import { cn } from '@/lib/utils';

/* ─── LeadScore — ui.md §17 ───
 * Radial/ring gauge: 48px in dense contexts, 96px in expanded.
 * Ring color interpolates danger → warning → success based on score tercile.
 * Center shows numeric score, no decimal.
 *
 * Composed states:
 * - Overall Score: the ring, always present
 * - Fit Score / Engagement Score: sub-bars in expanded contexts
 * - Priority: derived text badge beside the ring
 * - Trend: small arrow + delta under the score
 */

interface LeadScoreProps {
  /** Score 0-100 */
  score: number;
  /** Display size */
  size?: 'compact' | 'default' | 'expanded';
  /** Show sub-scores (fit + engagement) — expanded context only */
  showBreakdown?: boolean;
  fitScore?: number;
  engagementScore?: number;
  /** Trend delta (e.g. "+5" or "-3") */
  trend?: string;
  /** Trend direction */
  trendUp?: boolean;
  className?: string;
}

function getScoreColor(score: number): string {
  if (score >= 67) return 'var(--status-success-text)';
  if (score >= 34) return 'var(--status-warning-text)';
  return 'var(--status-danger-text)';
}

function getScoreColorClass(score: number): string {
  if (score >= 67) return 'text-status-success-text';
  if (score >= 34) return 'text-status-warning-text';
  return 'text-status-danger-text';
}

const SIZE_CONFIG = {
  compact: { diameter: 48, strokeWidth: 4, fontSize: 'text-sm', centerOffset: 24 },
  default: { diameter: 64, strokeWidth: 5, fontSize: 'text-lg', centerOffset: 32 },
  expanded: { diameter: 96, strokeWidth: 6, fontSize: 'text-2xl', centerOffset: 48 },
};

export function LeadScore({
  score,
  size = 'default',
  showBreakdown = false,
  fitScore,
  engagementScore,
  trend,
  trendUp,
  className,
}: LeadScoreProps) {
  const config = SIZE_CONFIG[size];
  const radius = (config.diameter - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(score, 0), 100) / 100;
  const offset = circumference * (1 - progress);
  const color = getScoreColor(score);

  return (
    <div className={cn('inline-flex flex-col items-center gap-1', className)}>
      <div className="relative" style={{ width: config.diameter, height: config.diameter }}>
        {/* Background ring */}
        <svg
          width={config.diameter}
          height={config.diameter}
          viewBox={`0 0 ${config.diameter} ${config.diameter}`}
          className="rotate-[-90deg]"
        >
          <circle
            cx={config.centerOffset}
            cy={config.centerOffset}
            r={radius}
            fill="none"
            stroke="var(--border-subtle)"
            strokeWidth={config.strokeWidth}
          />
          <circle
            cx={config.centerOffset}
            cy={config.centerOffset}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        {/* Center value */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={cn('font-bold tabular-nums leading-none', config.fontSize, getScoreColorClass(score))}
          >
            {Math.round(score)}
          </span>
        </div>
      </div>

      {/* Trend delta — below the ring */}
      {trend && (
        <span
          className={cn(
            'text-xs font-semibold',
            trendUp ? 'text-status-success-text' : 'text-status-danger-text'
          )}
        >
          {trendUp ? '↑' : '↓'} {trend}
        </span>
      )}

      {/* Breakdown bars — expanded context only */}
      {showBreakdown && (fitScore !== undefined || engagementScore !== undefined) && (
        <div className="w-full space-y-1.5 mt-1">
          {fitScore !== undefined && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-text-muted whitespace-nowrap">Fit</span>
              <div className="flex-1 h-1 rounded-full bg-surface-2 overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-500', getScoreColorClass(fitScore))}
                  style={{
                    width: `${fitScore}%`,
                    backgroundColor: getScoreColor(fitScore),
                  }}
                />
              </div>
              <span className="text-[11px] font-semibold tabular-nums text-text-secondary w-6 text-right">
                {fitScore}
              </span>
            </div>
          )}
          {engagementScore !== undefined && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-text-muted whitespace-nowrap">Engage</span>
              <div className="flex-1 h-1 rounded-full bg-surface-2 overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-500', getScoreColorClass(engagementScore))}
                  style={{
                    width: `${engagementScore}%`,
                    backgroundColor: getScoreColor(engagementScore),
                  }}
                />
              </div>
              <span className="text-[11px] font-semibold tabular-nums text-text-secondary w-6 text-right">
                {engagementScore}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
