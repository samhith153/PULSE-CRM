'use client';

import React, { useState } from 'react';
import { ChevronDown, MoreVertical, TrendingUp, MoveUpRight, MoveDownRight } from 'lucide-react';
import { asNumber, type Decimal } from '@/utils/api';

interface RevenueTrendItem {
  period: string;
  revenue: Decimal;
}

export function SalesReportNew({ revenueTrend }: { revenueTrend: RevenueTrendItem[] }) {
  const [selectedPeriod, setSelectedPeriod] = useState('Monthly');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Fake data manipulation for visual effect based on dropdown
  let displayTrend = [...revenueTrend];
  if (selectedPeriod === 'Weekly') {
    displayTrend = displayTrend.slice(-4);
  } else if (selectedPeriod === 'Daily') {
    displayTrend = displayTrend.slice(-7);
  } else if (selectedPeriod === 'Yearly') {
    displayTrend = displayTrend.slice(-12);
  }

  const bars = displayTrend.map((item, i) => {
    const value = asNumber(item.revenue) || 0;
    return {
      label: item.period,
      value,
      active: i === displayTrend.length - 1,
    };
  });

  const totalRevenue = bars.reduce((sum, b) => sum + b.value, 0);
  const lastMonth = bars.length > 1 ? bars[bars.length - 2]?.value : 0;
  const currentMonth = bars.length > 0 ? bars[bars.length - 1]?.value : 0;
  const growthPct = lastMonth > 0 ? ((currentMonth - lastMonth) / lastMonth * 100) : 0;

  const currency = (n: number) =>
    n.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-purple/10">
            <TrendingUp className="h-4 w-4 text-brand-purple" />
          </div>
          <h2 className="text-[17px] font-bold tracking-tight text-foreground">Revenue Trend</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary cursor-pointer"
            >
              {selectedPeriod} <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-1 z-30 w-32 bg-card border border-border rounded-lg shadow-lg py-1">
                {['Daily', 'Weekly', 'Monthly', 'Yearly'].map(p => (
                  <button
                    key={p}
                    onClick={() => { setSelectedPeriod(p); setIsDropdownOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs font-semibold hover:bg-secondary text-foreground cursor-pointer"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button aria-label="More options" className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-secondary">
            <MoreVertical className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>
      <div className="mt-1 pl-10 flex items-center gap-2 mb-6">
        <span className={`inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-bold text-emerald-600`}>
          <MoveUpRight className="h-3 w-3" />
          +{growthPct.toFixed(1)}%
        </span>
        <span className="text-[11px] font-semibold text-muted-foreground">vs last period</span>
      </div>

      <div className="mt-8 flex flex-col gap-8 sm:flex-row sm:items-end w-full overflow-hidden">
        <div 
          className="flex flex-1 items-end justify-between relative h-[110px] w-full min-w-0 overflow-x-auto pb-2" 
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <style dangerouslySetInnerHTML={{__html: `div::-webkit-scrollbar { display: none; }`}} />
          {/* Background horizontal line connecting the circles */}
          <div className="absolute top-[40px] left-0 right-0 h-px bg-border/60 z-0"></div>
          
          {bars.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center w-full z-10">No revenue data available</p>
          ) : (
            bars.map((b, i) => {
              const isLast = i === bars.length - 1;
              const isZero = b.value === 0;
              return (
                <div key={`${b.label}-${i}`} className="flex flex-col items-center justify-end h-full z-10 min-w-[48px] px-2 relative group">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 bg-card ${isLast ? 'border-brand-purple text-brand-purple' : isZero ? 'border-emerald-500 text-foreground' : 'border-emerald-500 text-foreground'}`}>
                    <span className="text-[10px] font-bold tabular-nums">₹0</span>
                  </div>
                  <span className={`mt-3 text-center text-[10px] font-bold ${isLast ? 'text-brand-purple' : 'text-muted-foreground'}`}>
                    {b.label.split('-')[0]}<br/>{b.label.split('-')[1] || ''}
                  </span>
                </div>
              );
            })
          )}
        </div>

        <div className="sm:w-[150px] shrink-0 border-l border-border pl-6 flex flex-col justify-center">
          <div className="flex items-start gap-2">
            <TrendingUp className="mt-0.5 h-4 w-4 text-brand-purple shrink-0" />
            <p className="text-[11px] font-semibold leading-tight text-muted-foreground">
              Total revenue<br />this period
            </p>
          </div>
          <p className="mt-2 text-2xl font-extrabold tracking-tight text-foreground truncate" title={currency(totalRevenue)}>
            {currency(totalRevenue)}
          </p>
          <p className="mt-1 text-[11px] font-semibold text-muted-foreground">{bars.length} periods</p>
        </div>
      </div>
    </section>
  );
}
