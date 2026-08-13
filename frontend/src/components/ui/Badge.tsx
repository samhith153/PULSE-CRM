import React from 'react';
import { cn } from '@/lib/utils';

/* ─── Badge — ui.md §18 ───
 * Pill badge: --radius-full, 4px/10px padding, 12px/600 text.
 * Colored dot (6px) to the left of the label when `dot` is true.
 */

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'default';
type BadgeSize = 'sm' | 'md';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  /** Show colored dot indicator */
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-status-success-bg text-status-success-text',
  warning: 'bg-status-warning-bg text-status-warning-text',
  danger:  'bg-status-danger-bg text-status-danger-text',
  info:    'bg-status-info-bg text-status-info-text',
  default: 'bg-surface-2 text-text-secondary',
};

const dotColors: Record<BadgeVariant, string> = {
  success: 'bg-status-success-text',
  warning: 'bg-status-warning-text',
  danger:  'bg-status-danger-text',
  info:    'bg-status-info-text',
  default: 'bg-text-muted',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
};

export function Badge({
  variant = 'default',
  size = 'sm',
  dot = false,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold leading-none',
        'border border-transparent',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

/* ─── PipelineStageBadge — §15 fixed stage colors ─── */
type PipelineStage =
  | 'new' | 'contacted' | 'qualified' | 'proposal'
  | 'negotiation' | 'won' | 'lost';

const stageColors: Record<PipelineStage, { text: string; bg: string; dot: string }> = {
  new:         { text: 'text-stage-new',         bg: 'bg-stage-new/15',         dot: 'bg-stage-new' },
  contacted:   { text: 'text-stage-contacted',   bg: 'bg-stage-contacted/15',   dot: 'bg-stage-contacted' },
  qualified:   { text: 'text-stage-qualified',   bg: 'bg-stage-qualified/15',   dot: 'bg-stage-qualified' },
  proposal:    { text: 'text-stage-proposal',    bg: 'bg-stage-proposal-bg',    dot: 'bg-stage-proposal' },
  negotiation: { text: 'text-stage-negotiation', bg: 'bg-stage-negotiation-bg', dot: 'bg-stage-negotiation' },
  won:         { text: 'text-stage-won',         bg: 'bg-stage-won-bg',         dot: 'bg-stage-won' },
  lost:        { text: 'text-stage-lost',        bg: 'bg-stage-lost-bg',        dot: 'bg-stage-lost' },
};

interface PipelineStageBadgeProps extends Omit<BadgeProps, 'variant'> {
  stage: PipelineStage;
}

export function PipelineStageBadge({ stage, className, children, ...props }: PipelineStageBadgeProps) {
  const colors = stageColors[stage];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold text-xs leading-none',
        'px-2.5 py-1 border border-transparent',
        colors.text,
        colors.bg,
        className
      )}
      {...props}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', colors.dot)} aria-hidden="true" />
      {children}
    </span>
  );
}

/* ─── PriorityBadge — §18 priority colors ─── */
type Priority = 'critical' | 'high' | 'medium' | 'low';

const priorityStyles: Record<Priority, { text: string; bg: string }> = {
  critical: { text: 'text-priority-critical', bg: 'bg-status-danger-bg' },
  high:     { text: 'text-priority-high',     bg: 'bg-priority-high-bg' },
  medium:   { text: 'text-priority-medium',   bg: 'bg-status-warning-bg' },
  low:      { text: 'text-priority-low',      bg: 'bg-priority-low-bg' },
};

interface PriorityBadgeProps extends Omit<BadgeProps, 'variant'> {
  priority: Priority;
}

export function PriorityBadge({ priority, className, children, ...props }: PriorityBadgeProps) {
  const styles = priorityStyles[priority];
  return (
    <Badge
      className={cn(styles.text, styles.bg, className)}
      {...props}
    >
      {children}
    </Badge>
  );
}
