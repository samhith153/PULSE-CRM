'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * PillButton — pulse-design-system.md §4
 *
 * Variants:
 *   dark    → bg-ink text-background  (primary CTA, e.g. "New Report")
 *   light   → bg-background text-ink  (CTA on dark band)
 *   outline → border border-border bg-background text-ink  (secondary, e.g. "Customize Layout")
 *
 * Sizes: sm (h-9 px-4) · md (h-11 px-6) · lg (h-13 px-7 text-base)
 *
 * All variants get hover lift (-translate-y-0.5 + shadow-nav) except outline,
 * which uses a subtle bg swap instead.
 */
const pillVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium',
    'transition-all duration-200 will-change-transform',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'cursor-pointer',
  ].join(' '),
  {
    variants: {
      variant: {
        dark: 'bg-ink text-background hover:-translate-y-0.5 hover:shadow-nav',
        light: 'bg-background text-ink border border-transparent hover:-translate-y-0.5 hover:shadow-nav',
        outline: 'border border-border bg-background text-ink hover:bg-secondary',
      },
      size: {
        sm: 'h-9 px-4 text-xs',
        md: 'h-11 px-6',
        lg: 'h-13 px-7 text-base',
      },
    },
    defaultVariants: {
      variant: 'dark',
      size: 'md',
    },
  },
);

export interface PillButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof pillVariants> {
  asChild?: boolean;
}

const PillButton = React.forwardRef<HTMLButtonElement, PillButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(pillVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
PillButton.displayName = 'PillButton';

export { PillButton, pillVariants };
