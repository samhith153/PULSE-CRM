'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'text', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'animate-pulse rounded-lg bg-secondary',
        variant === 'circular' && 'rounded-full',
        variant === 'text' && 'h-4 w-full',
        variant === 'rectangular' && 'h-24 w-full',
        className
      )}
      {...props}
    />
  ),
);
Skeleton.displayName = 'Skeleton';

export default Skeleton;
