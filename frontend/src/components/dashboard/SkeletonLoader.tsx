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

  // GLASS & SHINING DESIGN SYSTEM TOKENS
  const shimmerClass = "absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/80 to-transparent dark:via-white/10";
  const bgCardClass = "bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-white/30 dark:border-slate-800/30 rounded-xl shadow-sm relative overflow-hidden animate-pulse";
  
  // Placeholders
  const linePrimary = "bg-slate-250/50 dark:bg-slate-700/40 rounded";
  const lineSecondary = "bg-slate-150/50 dark:bg-slate-800/30 rounded";
  const lineAccent = "bg-brand-accent/15 dark:bg-brand-accent/5 rounded";
  const circleClass = "bg-slate-200/50 dark:bg-slate-800/40 rounded-full shrink-0";

  switch (layout) {
    case 'landing':
      return (
        <div className="w-full min-h-screen bg-slate-50/50 dark:bg-slate-950 font-sans p-6 space-y-12 animate-pulse">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between py-4 border-b border-white/20 dark:border-slate-800/40">
            <div className="flex items-center gap-3">
              <div className={`${circleClass} h-8 w-8 !rounded-lg`} />
              <div className={`${linePrimary} h-5 w-24`} />
            </div>
            <div className="hidden md:flex gap-6">
              <div className={`${lineSecondary} h-4 w-16`} />
              <div className={`${lineSecondary} h-4 w-16`} />
              <div className={`${lineSecondary} h-4 w-16`} />
            </div>
            <div className={`${linePrimary} h-8 w-24 !rounded-lg`} />
          </div>

          {/* Hero Section Skeleton */}
          <div className="flex flex-col items-center text-center space-y-6 max-w-3xl mx-auto py-12">
            <div className={`${lineAccent} h-5 w-48`} />
            <div className={`${linePrimary} h-12 w-3/4`} />
            <div className={`${lineSecondary} h-10 w-1/2`} />
            <div className={`${lineSecondary} h-4 w-2/3`} />
            <div className="flex gap-4 pt-4">
              <div className={`${linePrimary} h-12 w-36 !rounded-xl`} />
              <div className={`${lineSecondary} h-12 w-36 !rounded-xl`} />
            </div>
          </div>

          {/* Features Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto pt-8">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className={`${bgCardClass} p-6 h-48 flex flex-col justify-between`}>
                <div className={shimmerClass} />
                <div className="space-y-4">
                  <div className={`${circleClass} h-10 w-10 !rounded-lg`} />
                  <div className={`${linePrimary} h-5 w-1/2`} />
                  <div className={`${lineSecondary} h-3 w-full`} />
                  <div className={`${lineSecondary} h-3 w-3/4`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'dashboard':
      return (
        <div className="space-y-6 w-full animate-pulse">
          {/* KPI Stat Cards Grid (4 columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className={`${bgCardClass} p-5 h-28`}>
                <div className={shimmerClass} />
                <div className="flex justify-between items-start">
                  <div className="space-y-2.5 w-2/3">
                    <div className={`${lineSecondary} h-3.5 w-1/2`} />
                    <div className={`${linePrimary} h-7 w-3/4`} />
                  </div>
                  <div className={`${circleClass} h-9 w-9 !rounded-lg`} />
                </div>
                <div className={`${lineSecondary} h-3 w-1/3 mt-3`} />
              </div>
            ))}
          </div>

          {/* Charts Rows (2 Columns) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={`${bgCardClass} p-6 lg:col-span-2 h-[340px] flex flex-col justify-between`}>
              <div className={shimmerClass} />
              <div className="flex justify-between border-b border-white/20 dark:border-slate-800 pb-3">
                <div className={`${linePrimary} h-5 w-1/4`} />
                <div className="flex gap-2">
                  <div className={`${lineSecondary} h-6 w-16`} />
                  <div className={`${lineSecondary} h-6 w-16`} />
                </div>
              </div>
              {/* Simulated bars */}
              <div className="flex items-end justify-between h-48 pt-6">
                {[40, 70, 45, 90, 60, 80, 50, 85, 30, 95].map((h, i) => (
                  <div key={i} className="bg-slate-200/40 dark:bg-slate-700/30 rounded-t w-[8%] transition-all" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>

            <div className={`${bgCardClass} p-6 h-[340px] flex flex-col justify-between`}>
              <div className={shimmerClass} />
              <div className="border-b border-white/20 dark:border-slate-800 pb-3">
                <div className={`${linePrimary} h-5 w-1/2`} />
              </div>
              {/* Simulated donut chart */}
              <div className="flex justify-center items-center h-48">
                <div className="h-32 w-32 rounded-full border-[18px] border-slate-200/30 dark:border-slate-700/20 flex items-center justify-center" />
              </div>
              <div className="flex justify-between">
                <div className={`${lineSecondary} h-3 w-1/4`} />
                <div className={`${lineSecondary} h-3 w-1/4`} />
                <div className={`${lineSecondary} h-3 w-1/4`} />
              </div>
            </div>
          </div>

          {/* Activity Heatmap Grid */}
          <div className={`${bgCardClass} p-6 h-56 flex flex-col justify-between`}>
            <div className={shimmerClass} />
            <div className={`${linePrimary} h-4 w-1/6`} />
            <div className="grid grid-cols-12 gap-2 h-32 pt-4">
              {Array.from({ length: 48 }).map((_, i) => (
                <div key={i} className="h-4 bg-slate-200/40 dark:bg-slate-700/20 rounded-sm w-full" />
              ))}
            </div>
          </div>
        </div>
      );

    case 'table':
      return (
        <div className="space-y-4 w-full">
          {/* Search + Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2 animate-pulse">
            <div className="h-10 bg-white/20 dark:bg-slate-900/30 border border-white/20 dark:border-slate-800 rounded-lg w-full sm:w-72" />
            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <div className="h-10 bg-white/20 dark:bg-slate-900/30 border border-white/20 dark:border-slate-800 rounded-lg w-24" />
              <div className={`${linePrimary} h-10 w-32 !rounded-lg`} />
            </div>
          </div>

          {/* Table Container */}
          <div className={`${bgCardClass} overflow-hidden`}>
            <div className={shimmerClass} />
            {/* Table Header */}
            <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50/50 dark:bg-slate-900/60 border-b border-white/20 dark:border-slate-800">
              <div className={`${linePrimary} h-4 w-1/2`} />
              <div className={`${linePrimary} h-4 w-1/3`} />
              <div className={`${linePrimary} h-4 w-1/3`} />
              <div className={`${linePrimary} h-4 w-1/4 justify-self-end`} />
            </div>
            {/* Table Body Rows */}
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

    case 'kanban':
      return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full h-[650px]">
          {Array.from({ length: 4 }).map((_, colIdx) => (
            <div key={colIdx} className="space-y-4 flex flex-col h-full">
              {/* Column Header */}
              <div className="flex justify-between items-center px-1">
                <div className={`${linePrimary} h-5 w-1/2 animate-pulse`} />
                <div className={`${circleClass} h-5 w-5 animate-pulse`} />
              </div>

              {/* Column Body with cards */}
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

    case 'calendar':
      return (
        <div className="space-y-4 w-full">
          {/* Calendar Header Controls */}
          <div className="flex justify-between items-center py-2">
            <div className={`${linePrimary} h-8 w-32 animate-pulse`} />
            <div className="flex gap-2">
              <div className={`${lineSecondary} h-8 w-8 animate-pulse`} />
              <div className={`${linePrimary} h-8 w-24 animate-pulse`} />
              <div className={`${lineSecondary} h-8 w-8 animate-pulse`} />
            </div>
          </div>

          {/* Grid Layout (7 days header) */}
          <div className="grid grid-cols-7 gap-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="h-6 bg-slate-100/50 dark:bg-slate-900/50 rounded flex items-center justify-center animate-pulse">
                <span className="text-[10px] font-bold text-slate-350 dark:text-slate-600">{day}</span>
              </div>
            ))}
          </div>

          {/* Grid Layout (5 weeks x 7 days) */}
          <div className="grid grid-cols-7 gap-2 h-[520px]">
            {Array.from({ length: 35 }).map((_, idx) => (
              <div key={idx} className={`${bgCardClass} p-2 h-full flex flex-col justify-between`}>
                <div className={shimmerClass} />
                <div className={`${lineSecondary} h-3 w-4`} />
                {idx % 5 === 0 && (
                  <div className="space-y-1">
                    <div className="h-4 bg-brand-accent/15 rounded w-full border-l-2 border-brand-accent" />
                    <div className={`${lineSecondary} h-4 w-3/4`} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );

    case 'form':
      return (
        <div className="space-y-6 w-full max-w-4xl mx-auto">
          {/* Header Banner */}
          <div className={`${bgCardClass} h-40`}>
            <div className={shimmerClass} />
            <div className="absolute -bottom-8 left-6 flex items-end gap-4">
              <div className={`${circleClass} h-20 w-20 border-4 border-slate-50 dark:border-slate-900`} />
              <div className="space-y-2 pb-2">
                <div className={`${linePrimary} h-5 w-32`} />
                <div className={`${lineSecondary} h-3 w-24`} />
              </div>
            </div>
          </div>

          {/* Form Columns */}
          <div className={`${bgCardClass} p-6 pt-12 space-y-6`}>
            <div className={shimmerClass} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="space-y-2">
                  <div className={`${linePrimary} h-3 w-1/4`} />
                  <div className="h-10 bg-slate-50/50 dark:bg-slate-900/30 border border-white/20 dark:border-slate-800 rounded-lg w-full" />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-white/10 dark:border-slate-800">
              <div className={`${lineSecondary} h-10 w-20 !rounded-lg`} />
              <div className={`${lineAccent} h-10 w-32 !rounded-lg`} />
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
