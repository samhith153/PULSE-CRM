import React from 'react';
import { cn } from '@/lib/utils';

/* ─── StandardCard — ui.md §8 ───
 * White surface, --radius-lg (20px), --shadow-card, xl (24px) padding.
 * Base primitive — all card variants extend this pattern.
 */

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Remove padding for cards that manage their own internal layout */
  noPadding?: boolean;
  /** Remove shadow for inline/cardless contexts */
  noShadow?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, noPadding = false, noShadow = false, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'bg-surface-1 rounded-[20px] border border-border-default',
        !noPadding && 'p-6',
        !noShadow && 'shadow-card',
        'transition-shadow duration-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
Card.displayName = 'Card';

/* ─── CardHeader — title row with optional right control ─── */
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Right-aligned control (dropdown, menu icon, etc.) */
  action?: React.ReactNode;
}

export function CardHeader({ className, action, children, ...props }: CardHeaderProps) {
  return (
    <div
      className={cn('flex items-center justify-between mb-4', className)}
      {...props}
    >
      <div className="min-w-0">{children}</div>
      {action && <div className="shrink-0 ml-3">{action}</div>}
    </div>
  );
}

/* ─── CardTitle — 16px/600 per §8 ─── */
export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-base font-semibold text-text-primary leading-tight', className)}
      {...props}
    >
      {children}
    </h3>
  );
}

/* ─── CardDescription — 14px/400 muted ─── */
export function CardDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-sm text-text-secondary mt-1', className)}
      {...props}
    >
      {children}
    </p>
  );
}
