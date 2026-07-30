'use client';

import React from 'react';

interface SkeletonLoaderProps {
  isLoading: boolean;
  children: React.ReactNode;
  count?: number;
}

export default function SkeletonLoader({ isLoading, children, count = 3 }: SkeletonLoaderProps) {
  if (!isLoading) {
    return <>{children}</>;
  }

  return (
    <div className="space-y-4 w-full">
      {Array.from({ length: count }).map((_, idx) => (
        <div 
          key={idx} 
          className="flex items-start gap-4 p-5 bg-white border border-brand-border-purple/15 rounded-xl shadow-sm/5 relative overflow-hidden animate-pulse min-h-[100px]"
        >
          {/* Shimmer overlay */}
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-slate-100/10 to-transparent" />
          
          {/* Circular avatar placeholder */}
          <div className="h-12 w-12 rounded-full bg-slate-100 shrink-0" />
          
          {/* Text lines container */}
          <div className="flex-1 space-y-2.5">
            {/* Wide title line */}
            <div className="h-4 bg-slate-100 rounded w-3/4" />
            {/* Shorter text line 1 */}
            <div className="h-3 bg-slate-100 rounded w-1/2" />
            {/* Shorter text line 2 */}
            <div className="h-3 bg-slate-100 rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
