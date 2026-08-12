import React from 'react';
import { cn } from '@/lib/utils';

/* ─── Skeleton — ui.md §29 ───
 * Loading state: --surface-secondary shimmer, geometry-matched.
 * Never a generic spinner except inside buttons.
 */

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Width (Tailwind class or arbitrary value) */
  width?: string;
  /** Height (Tailwind class or arbitrary value) */
  height?: string;
}

export function Skeleton({ className, width, height, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg bg-surface-2',
        'before:absolute before:inset-0',
        'before:-translate-x-full before:animate-[shimmer-sweep_2s_ease-in-out_infinite]',
        'before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent',
        'dark:before:via-white/10',
        className
      )}
      style={{ width, height }}
      {...props}
    />
  );
}

/* ─── SkeletonText — multiple text lines ─── */
interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="12px"
          width={i === lines - 1 ? '60%' : '100%'}
          className="rounded"
        />
      ))}
    </div>
  );
}

/* ─── SkeletonCircle — for avatars ─── */
interface SkeletonCircleProps {
  size?: number;
  className?: string;
}

export function SkeletonCircle({ size = 36, className }: SkeletonCircleProps) {
  return (
    <Skeleton
      width={`${size}px`}
      height={`${size}px`}
      className={cn('rounded-full', className)}
    />
  );
}

/* ─── SkeletonCard — full card placeholder ─── */
interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div
      className={cn(
        'rounded-[20px] border border-border-default bg-surface-1 p-6 shadow-card',
        className
      )}
    >
      <div className="flex items-center gap-3 mb-4">
        <SkeletonCircle size={32} />
        <Skeleton height="14px" width="120px" className="rounded" />
      </div>
      <SkeletonText lines={3} />
      <div className="mt-4 flex gap-2">
        <Skeleton height="24px" width="60px" className="rounded-full" />
        <Skeleton height="24px" width="80px" className="rounded-full" />
      </div>
    </div>
  );
}

/* ─── SkeletonTable — table row placeholder ─── */
interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function SkeletonTable({ rows = 5, columns = 4, className }: SkeletonTableProps) {
  return (
    <div className={cn('rounded-[20px] border border-border-default bg-surface-1 shadow-card overflow-hidden', className)}>
      {/* Header */}
      <div className="flex gap-4 px-6 py-3 bg-surface-2">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} height="12px" width={`${100 / columns}%`} className="rounded" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className={cn(
            'flex gap-4 px-6 py-4',
            rowIdx < rows - 1 && 'border-b border-border-subtle'
          )}
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <Skeleton
              key={colIdx}
              height="14px"
              width={colIdx === 0 ? '40%' : `${60 / (columns - 1)}%`}
              className="rounded"
            />
          ))}
        </div>
      ))}
    </div>
  );
}
