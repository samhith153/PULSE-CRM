'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

export default function SiteSkeleton() {
  return (
    <div className="relative flex bg-slate-50 h-screen w-screen overflow-hidden font-sans text-brand-text antialiased">
      {/* Custom Premium Shimmer Styles (Light Theme Only) */}
      <style jsx global>{`
        @keyframes shimmer-move {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        
        .premium-shimmer {
          background: linear-gradient(
            90deg,
            #f1f5f9 25%,
            #e2e8f0 37%,
            #f1f5f9 50%
          );
          background-size: 200% 100%;
          animation: shimmer-move 1.5s infinite linear;
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(0.98);
          }
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 3s infinite ease-in-out;
        }

        @keyframes github-bar {
          0% {
            width: 0%;
            left: 0%;
          }
          50% {
            width: 70%;
            left: 15%;
          }
          100% {
            width: 100%;
            left: 100%;
          }
        }

        .glowing-progress-bar {
          height: 2.5px;
          background: linear-gradient(90deg, #7957fb, #7e8cf1, #6ec2de, #7957fb);
          background-size: 300% 100%;
          position: absolute;
          top: 0;
          left: 0;
          z-index: 50;
          animation: github-bar 2s infinite ease-in-out;
          box-shadow: 0 0 8px rgba(121, 87, 251, 0.45);
        }
      `}</style>

      {/* GitHub-style progress bar at the very top */}
      <div className="glowing-progress-bar w-full" />

      {/* Sidebar Skeleton */}
      <aside className="w-64 border-r border-slate-200 bg-white h-full flex flex-col shrink-0 hidden md:flex transition-all duration-300">
        {/* Sidebar Header */}
        <div className="h-16 border-b border-slate-200 px-6 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg premium-shimmer shrink-0" />
          <div className="h-5 w-32 premium-shimmer rounded" />
        </div>

        {/* Sidebar Navigation Items */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {/* Section 1 */}
          <div className="space-y-3">
            <div className="h-3 w-24 bg-slate-100 rounded ml-2" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center space-x-3 py-2 px-3 rounded-lg">
                <div className="h-5 w-5 premium-shimmer rounded shrink-0" />
                <div className="h-4 w-32 premium-shimmer rounded" />
              </div>
            ))}
          </div>

          {/* Section 2 */}
          <div className="space-y-3">
            <div className="h-3 w-28 bg-slate-100 rounded ml-2" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3 py-2 px-3 rounded-lg">
                <div className="h-5 w-5 premium-shimmer rounded shrink-0" />
                <div className="h-4 w-28 premium-shimmer rounded" />
              </div>
            ))}
          </div>

          {/* Section 3 */}
          <div className="space-y-3">
            <div className="h-3 w-20 bg-slate-100 rounded ml-2" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3 py-2 px-3 rounded-lg">
                <div className="h-5 w-5 premium-shimmer rounded shrink-0" />
                <div className="h-4 w-36 premium-shimmer rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Footer Profile */}
        <div className="border-t border-slate-200 p-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full premium-shimmer shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-24 premium-shimmer rounded" />
            <div className="h-2.5 w-16 premium-shimmer rounded" />
          </div>
        </div>
      </aside>

      {/* Main Content Container Skeleton */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        {/* Header Skeleton */}
        <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <div className="h-8 w-8 rounded-lg premium-shimmer md:hidden shrink-0" />
            {/* Search Bar Placeholder */}
            <div className="relative max-w-md w-full hidden sm:block">
              <div className="h-9 w-full premium-shimmer rounded-lg" />
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            {/* Quick action buttons */}
            <div className="h-8 w-24 premium-shimmer rounded-lg hidden md:block" />
            <div className="h-8 w-8 premium-shimmer rounded-full" />
            <div className="h-8 w-8 premium-shimmer rounded-full" />
            <div className="h-8 w-8 premium-shimmer rounded-full" />
          </div>
        </header>

        {/* Dashboard inner scroll view */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {/* Header Block Title */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <div className="h-8 w-56 premium-shimmer rounded-lg" />
              <div className="h-4 w-96 premium-shimmer rounded max-w-full" />
            </div>
            {/* Action buttons */}
            <div className="flex space-x-2 shrink-0">
              <div className="h-8 w-36 premium-shimmer rounded-lg" />
              <div className="h-8 w-32 premium-shimmer rounded-lg" />
            </div>
          </div>

          {/* Stats Cards Skeleton (4 Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-32 flex flex-col justify-between">
                <div className="flex justify-between items-center">
                  <div className="h-4 w-20 premium-shimmer rounded" />
                  <div className="h-7 w-7 rounded-lg premium-shimmer" />
                </div>
                <div className="space-y-2">
                  <div className="h-7 w-28 premium-shimmer rounded-lg" />
                  <div className="h-3 w-16 premium-shimmer rounded" />
                </div>
              </div>
            ))}
          </div>

          {/* Charts Row Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Chart */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm lg:col-span-2 h-80 flex flex-col justify-between">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="h-4 w-32 premium-shimmer rounded" />
                <div className="h-7 w-24 premium-shimmer rounded-lg" />
              </div>
              <div className="flex-1 flex items-end justify-between px-2 pt-6 pb-2 h-44">
                {[45, 60, 30, 80, 50, 75, 90, 65, 40, 85].map((h, idx) => (
                  <div 
                    key={idx} 
                    style={{ height: `${h}%` }} 
                    className="w-7 premium-shimmer rounded transition-all duration-500" 
                  />
                ))}
              </div>
            </div>
            
            {/* Secondary Chart (Pie/Donut Skeleton) */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-80 flex flex-col justify-between animate-pulse">
              <div className="h-4 w-36 premium-shimmer rounded" />
              <div className="flex justify-center items-center py-4">
                {/* Circular indicator */}
                <div className="h-32 w-32 rounded-full border-[14px] border-slate-100 flex items-center justify-center">
                  <div className="h-8 w-16 premium-shimmer rounded" />
                </div>
              </div>
              <div className="flex justify-around">
                <div className="h-3 w-12 premium-shimmer rounded" />
                <div className="h-3 w-12 premium-shimmer rounded" />
                <div className="h-3 w-12 premium-shimmer rounded" />
              </div>
            </div>
          </div>

          {/* Bottom Grid Rows (Widgets Skeleton) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-72 space-y-4">
                <div className="h-4 w-28 premium-shimmer rounded" />
                <div className="divide-y divide-slate-100">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="flex items-center justify-between py-3">
                      <div className="flex items-center space-x-2.5">
                        <div className="h-7 w-7 rounded-full premium-shimmer" />
                        <div className="space-y-1.5">
                          <div className="h-3 w-24 premium-shimmer rounded" />
                          <div className="h-2 w-16 premium-shimmer rounded" />
                        </div>
                      </div>
                      <div className="h-3 w-12 premium-shimmer rounded" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* Center Branded Loader overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50/20 backdrop-blur-[1px] pointer-events-none">
          <div className="bg-white/95 border border-brand-border-purple/35 p-6 rounded-2xl shadow-2xl flex items-center space-x-4 max-w-sm pointer-events-auto transform translate-y-4 transition-all duration-300 animate-pulse-slow">
            <div className="relative flex items-center justify-center shrink-0">
              <div className="h-10 w-10 rounded-full border-2 border-brand-accent/20 border-t-brand-accent animate-spin" />
              <Sparkles className="absolute h-4.5 w-4.5 text-brand-accent" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-brand-heading tracking-wide">Syncing workspace...</h4>
              <p className="text-[11px] text-slate-455 mt-1 font-semibold">Configuring your pipeline and layout settings</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
