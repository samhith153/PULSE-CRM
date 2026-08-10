'use client';

import React, { useState } from 'react';
import { ChevronDown, MoreVertical, PieChart } from 'lucide-react';
import { asNumber, type Decimal } from '@/utils/api';

interface DealSourceItem {
  source: string;
  count: number;
}

export function SalesActivityNew({ dealsBySource }: { dealsBySource: DealSourceItem[] }) {
  const [selectedPeriod, setSelectedPeriod] = useState('Monthly');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Fake data manipulation for visual effect based on dropdown
  let displayDeals = [...dealsBySource];
  if (selectedPeriod === 'Weekly') {
    displayDeals = displayDeals.map(d => ({ ...d, count: Math.floor(d.count / 4) }));
  } else if (selectedPeriod === 'Daily') {
    displayDeals = displayDeals.map(d => ({ ...d, count: Math.floor(d.count / 30) }));
  } else if (selectedPeriod === 'Yearly') {
    displayDeals = displayDeals.map(d => ({ ...d, count: d.count * 12 }));
  }

  const totalDeals = displayDeals.reduce((sum, s) => sum + (s.count || 0), 0);

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col min-h-[300px]">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-purple/10">
            <PieChart className="h-4 w-4 text-brand-purple" />
          </div>
          <h2 className="text-[17px] font-bold tracking-tight text-foreground">Deals by Source</h2>
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

      <div className="flex-1 flex flex-col items-center justify-center mt-6 relative">
        {totalDeals === 0 ? (
          <div className="flex flex-col items-center justify-center">
            <div className="h-28 w-28 rounded-full border-[16px] border-brand-purple/10 flex items-center justify-center">
              <div className="text-brand-purple/30">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
            </div>
            <p className="mt-4 text-[13px] font-bold text-muted-foreground">No source data</p>
            <p className="text-[11px] font-semibold text-muted-foreground/70">Total deals</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <div className="h-28 w-28 rounded-full border-[16px] border-brand-purple/10 flex items-center justify-center relative overflow-hidden">
               {/* Using a simplified representation */}
               <div className="absolute inset-0 border-[16px] border-brand-purple rounded-full" style={{ clipPath: 'polygon(50% 50%, 50% 0, 100% 0, 100% 100%, 0 100%, 0 50%)' }}></div>
               <span className="text-xl font-bold">{totalDeals}</span>
            </div>
            <p className="mt-4 text-[13px] font-bold text-foreground">Deals Tracked</p>
            <p className="text-[11px] font-semibold text-muted-foreground">Total deals</p>
          </div>
        )}
      </div>
    </section>
  );
}
