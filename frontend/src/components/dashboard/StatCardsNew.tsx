'use client';

import React from 'react';
import { MoveUpRight, MoveDownRight, Wallet, Handshake, Target, BarChart2, ArrowUpRight } from 'lucide-react';

const currency = (n: number, decimals = 2) =>
  n.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

function formatDelta(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? '+100%' : '0%';
  const pct = ((current - previous) / previous) * 100;
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}

interface StatCardsNewProps {
  revenue: number;
  revenueGrowth: number;
  wonDeals: number;
  dealsGrowth: number;
  winRate: number;
  winRateGrowth: number;
  avgDealSize: number;
  avgDealGrowth: number;
}

export default function StatCardsNew({
  revenue,
  revenueGrowth,
  wonDeals,
  dealsGrowth,
  winRate,
  winRateGrowth,
  avgDealSize,
  avgDealGrowth,
}: StatCardsNewProps) {
  const winRateDelta = formatDelta(winRate, winRate - winRateGrowth);
  const avgDealDelta = formatDelta(avgDealSize, avgDealSize - avgDealGrowth);
  const wonDealsDelta = formatDelta(wonDeals, wonDeals - dealsGrowth);
  const revDelta = formatDelta(revenue, revenue - revenueGrowth);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
      {/* Total Revenue Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-purple to-brand-blue p-6 text-white shadow-sm flex flex-col justify-between min-h-[160px]">
        <div className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
          <ArrowUpRight className="h-4 w-4 text-white" />
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
            <Wallet className="h-6 w-6 text-white" />
          </div>
          <span className="text-sm font-semibold text-white/90">Total Revenue</span>
        </div>
        
        <div className="mt-4">
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold tabular-nums">{currency(revenue, 2)}</span>
            <span className="mb-1 flex items-center gap-1 rounded bg-white/20 px-1.5 py-0.5 text-xs font-semibold text-white">
              {revenueGrowth >= 0 ? <MoveUpRight className="h-3 w-3" /> : <MoveDownRight className="h-3 w-3" />}
              {revDelta}
            </span>
          </div>
          <p className="mt-1.5 text-xs text-white/70 font-medium">vs last month {currency(revenue - revenueGrowth, 2)}</p>
        </div>

        {/* Decorative Wave */}
        <svg className="absolute bottom-0 left-0 w-full h-1/2 opacity-30 pointer-events-none" viewBox="0 0 100 50" preserveAspectRatio="none">
          <path d="M0,50 L0,20 C20,30 40,0 60,10 C80,20 100,5 100,5 L100,50 Z" fill="white" />
        </svg>
      </div>

      {/* Won Deals Card */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between min-h-[160px]">
        <div className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-border">
          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500">
            <Handshake className="h-6 w-6 text-white" />
          </div>
          <span className="text-sm font-semibold text-foreground">Won Deals</span>
        </div>
        
        <div className="mt-4">
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold tabular-nums">{Math.round(wonDeals)}</span>
            <span className={`mb-1 flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-semibold ${dealsGrowth >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {dealsGrowth >= 0 ? <MoveUpRight className="h-3 w-3" /> : <MoveDownRight className="h-3 w-3" />}
              {wonDealsDelta}
            </span>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground font-medium">vs last month {Math.max(0, wonDeals - Math.round(dealsGrowth))} deals</p>
        </div>

        {/* Decorative Line Chart */}
        <svg className="absolute bottom-0 right-0 w-2/3 h-1/3 opacity-20 pointer-events-none" viewBox="0 0 100 50" preserveAspectRatio="none">
          <path d="M0,50 L20,30 L40,40 L60,10 L80,20 L100,5 L100,50 Z" fill="none" stroke="#10b981" strokeWidth="3" />
          <path d="M0,50 L20,30 L40,40 L60,10 L80,20 L100,5 L100,50 Z" fill="url(#gradGreen)" stroke="none" />
          <defs>
            <linearGradient id="gradGreen" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Win Rate Card */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between min-h-[160px]">
        <div className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-border">
          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600">
            <Target className="h-6 w-6 text-white" />
          </div>
          <span className="text-sm font-semibold text-foreground">Win Rate</span>
        </div>
        
        <div className="mt-4">
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold tabular-nums">{winRate.toFixed(1)}%</span>
            <span className={`mb-1 flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-semibold ${winRateGrowth >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {winRateGrowth >= 0 ? <MoveUpRight className="h-3 w-3" /> : <MoveDownRight className="h-3 w-3" />}
              {winRateDelta}
            </span>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground font-medium">vs last month {(winRate - winRateGrowth).toFixed(1)}%</p>
        </div>

        {/* Decorative Line Chart */}
        <svg className="absolute bottom-0 right-0 w-2/3 h-1/3 opacity-20 pointer-events-none" viewBox="0 0 100 50" preserveAspectRatio="none">
          <path d="M0,50 L20,40 L40,45 L60,20 L80,30 L100,5 L100,50 Z" fill="none" stroke="#2563eb" strokeWidth="3" />
          <path d="M0,50 L20,40 L40,45 L60,20 L80,30 L100,5 L100,50 Z" fill="url(#gradBlue)" stroke="none" />
          <defs>
            <linearGradient id="gradBlue" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Avg Deal Size Card */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between min-h-[160px]">
        <div className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-border">
          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500">
            <BarChart2 className="h-6 w-6 text-white" />
          </div>
          <span className="text-sm font-semibold text-foreground">Avg Deal Size</span>
        </div>
        
        <div className="mt-4">
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold tabular-nums">{currency(avgDealSize, 0)}</span>
            <span className={`mb-1 flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-semibold ${avgDealGrowth >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {avgDealGrowth >= 0 ? <MoveUpRight className="h-3 w-3" /> : <MoveDownRight className="h-3 w-3" />}
              {avgDealDelta}
            </span>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground font-medium">vs last month {currency(avgDealSize - avgDealGrowth, 0)}</p>
        </div>

        {/* Decorative Line Chart */}
        <svg className="absolute bottom-0 right-0 w-2/3 h-1/3 opacity-20 pointer-events-none" viewBox="0 0 100 50" preserveAspectRatio="none">
          <path d="M0,50 L20,35 L40,15 L60,25 L80,10 L100,20 L100,50 Z" fill="none" stroke="#f59e0b" strokeWidth="3" />
          <path d="M0,50 L20,35 L40,15 L60,25 L80,10 L100,20 L100,50 Z" fill="url(#gradOrange)" stroke="none" />
          <defs>
            <linearGradient id="gradOrange" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}
