'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Badge — Status indicators and labels following Pulse Design System
 * 
 * Variants:
 *   default  → Primary brand color
 *   secondary → Muted neutral tone
 *   outline   → Border-only style
 *   success   → Green for positive states
 *   warning   → Amber for caution states
 *   danger    → Red for error/critical states
 *   info      → Blue for informational states
 */
const badgeVariants = cva(
  [
    'inline-flex items-center justify-center gap-1 rounded-full px-2.5 py-0.5 text-[11px]',
    'font-bold uppercase tracking-wide',
    'transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
  ].join(' '),
  {
    variants: {
      variant: {
        default: 'bg-primary/10 text-primary border border-primary/20',
        secondary: 'bg-secondary text-secondary-foreground border border-border',
        outline: 'bg-transparent text-foreground border border-border',
        success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
        warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
        danger: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
        info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
      },
      size: {
        sm: 'h-5 px-2 text-[10px]',
        md: 'h-6 px-2.5 text-[11px]',
        lg: 'h-7 px-3 text-xs',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Badge.displayName = 'Badge';

export { Badge, badgeVariants };
export default Badge;
