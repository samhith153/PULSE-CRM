'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Card — Professional container component for dashboard content
 * 
 * Variants:
 *   default  → Standard card with border and subtle shadow
 *   elevated → Enhanced shadow for floating panels
 *   outlined → Border-only for nested content
 *   glass    → Translucent backdrop blur for overlays
 */
const cardVariants = cva(
  [
    'relative flex flex-col rounded-2xl',
    'transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  ].join(' '),
  {
    variants: {
      variant: {
        default: 'bg-card text-card-foreground border border-border/80 shadow-sm hover:shadow-md',
        elevated: 'bg-card text-card-foreground border border-border/60 shadow-lg hover:shadow-xl',
        outlined: 'bg-transparent text-foreground border border-border',
        glass: 'bg-background/70 backdrop-blur-xl border border-border/40 shadow-float',
      },
      padding: {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
    },
  },
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, padding }), className)}
      {...props}
    />
  ),
);
Card.displayName = 'Card';

/** CardHeader — Top section with title and description */
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col gap-1.5 pb-4 border-b border-border/40', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

/** CardTitle — Section heading */
const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-base font-semibold tracking-tight text-foreground',
      className
    )}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

/** CardDescription — Subtitle or context text */
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

/** CardContent — Main content area */
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('pt-4', className)} {...props} />
));
CardContent.displayName = 'CardContent';

/** CardFooter — Bottom action area */
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center pt-4 mt-auto border-t border-border/40', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
export default Card;
