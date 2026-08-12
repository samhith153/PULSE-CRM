'use client';

import React from 'react';

interface SkeletonLoaderProps {
  isLoading: boolean;
  children?: React.ReactNode;
  layout?: 'dashboard' | 'table' | 'kanban' | 'form' | 'calendar' | 'landing' | 'list';
  count?: number;
}

export default function SkeletonLoader({ 
  isLoading, 
  children = null, 
  layout = 'list', 
  count = 3 
}: SkeletonLoaderProps) {
  if (!isLoading) {
    return <>{children}</>;
  }

  const shimmerClass = "absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/80 to-transparent dark:via-white/10";
  const bgCardClass = "bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-white/30 dark:border-slate-800/30 rounded-xl shadow-sm relative overflow-hidden animate-pulse";
  const linePrimary = "bg-slate-250/50 dark:bg-slate-700/40 rounded";
  const lineSecondary = "bg-slate-150/50 dark:bg-slate-800/30 rounded";
  const lineAccent = "bg-brand-accent/15 dark:bg-brand-accent/5 rounded";
  const circleClass = "bg-slate-200/50 dark:bg-slate-800/40 rounded-full shrink-0";

  switch (layout) {
    case 'kanban':
      return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full h-[650px]">
          {Array.from({ length: 4 }).map((_, colIdx) => (
            <div key={colIdx} className="space-y-4 flex flex-col h-full">
              <div className="flex justify-between items-center px-1">
                <div className={`${linePrimary} h-5 w-1/2 animate-pulse`} />
                <div className={`${circleClass} h-5 w-5 animate-pulse`} />
              </div>
              <div className="bg-slate-50/30 dark:bg-slate-900/20 border border-white/20 dark:border-slate-800 rounded-xl p-3 flex-1 space-y-3 overflow-hidden">
                {Array.from({ length: colIdx % 2 === 0 ? 3 : 2 }).map((_, cardIdx) => (
                  <div key={cardIdx} className={`${bgCardClass} p-4 space-y-3.5 h-[140px]`}>
                    <div className={shimmerClass} />
                    <div className="space-y-2">
                      <div className={`${linePrimary} h-3.5 w-5/6`} />
                      <div className={`${lineSecondary} h-3 w-1/2`} />
                    </div>
                    <div className={`${linePrimary} h-3 w-1/3`} />
                    <div className="flex justify-between items-center pt-1 border-t border-white/10 dark:border-slate-800">
                      <div className={`${lineSecondary} h-6 w-16 !rounded-full`} />
                      <div className={`${circleClass} h-6 w-6`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );

    case 'table':
      return (
        <div className="space-y-4 w-full">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2 animate-pulse">
            <div className="h-10 bg-white/20 dark:bg-slate-900/30 border border-white/20 dark:border-slate-800 rounded-lg w-full sm:w-72" />
            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <div className="h-10 bg-white/20 dark:bg-slate-900/30 border border-white/20 dark:border-slate-800 rounded-lg w-24" />
              <div className={`${linePrimary} h-10 w-32 !rounded-lg`} />
            </div>
          </div>
          <div className={`${bgCardClass} overflow-hidden`}>
            <div className={shimmerClass} />
            <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50/50 dark:bg-slate-900/60 border-b border-white/20 dark:border-slate-800">
              <div className={`${linePrimary} h-4 w-1/2`} />
              <div className={`${linePrimary} h-4 w-1/3`} />
              <div className={`${linePrimary} h-4 w-1/3`} />
              <div className={`${linePrimary} h-4 w-1/4 justify-self-end`} />
            </div>
            <div className="divide-y divide-slate-100/50 dark:divide-slate-800/40">
              {Array.from({ length: count + 2 }).map((_, idx) => (
                <div key={idx} className="grid grid-cols-4 gap-4 p-5 items-center">
                  <div className="flex items-center gap-3">
                    <div className={`${circleClass} h-9 w-9`} />
                    <div className="space-y-1.5 w-full">
                      <div className={`${linePrimary} h-3.5 w-3/4`} />
                      <div className={`${lineSecondary} h-3 w-1/2`} />
                    </div>
                  </div>
                  <div className={`${linePrimary} h-3.5 w-1/2`} />
                  <div className={`${lineSecondary} h-5 w-20 !rounded-full`} />
                  <div className={`${lineSecondary} h-7 w-12 justify-self-end`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case 'list':
    default:
      return (
        <div className="space-y-4 w-full">
          {Array.from({ length: count }).map((_, idx) => (
            <div key={idx} className={`${bgCardClass} flex items-start gap-4 p-5 min-h-[100px]`}>
              <div className={shimmerClass} />
              <div className={`${circleClass} h-12 w-12`} />
              <div className="flex-1 space-y-2.5">
                <div className={`${linePrimary} h-4 w-3/4`} />
                <div className={`${lineSecondary} h-3 w-1/2`} />
                <div className={`${lineSecondary} h-3 w-1/3`} />
              </div>
            </div>
          ))}
        </div>
      );
  }
}
