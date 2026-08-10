'use client';

import React from 'react';
import { MoreVertical, Flag, ClipboardList } from 'lucide-react';

interface DealStageItem {
  stage: string;
  count: number;
}

export function BestSellersNew({ dealsByStage }: { dealsByStage: DealStageItem[] }) {
  const totalDeals = dealsByStage.reduce((sum, d) => sum + (d.count || 0), 0);

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm min-h-[300px] flex flex-col">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-purple/10">
            <Flag className="h-4 w-4 text-brand-purple" />
          </div>
          <h2 className="text-[17px] font-bold tracking-tight text-foreground">Deals by Stage</h2>
        </div>
        <button aria-label="More options" className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-secondary">
          <MoreVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <div className="flex-1 flex flex-col">
        {/* Table Header */}
        <div className="grid grid-cols-3 bg-secondary/50 rounded-lg py-2 px-4 mb-4">
          <div className="text-[10px] font-black tracking-wider text-muted-foreground uppercase text-left">STAGE</div>
          <div className="text-[10px] font-black tracking-wider text-muted-foreground uppercase text-center">DEALS</div>
          <div className="text-[10px] font-black tracking-wider text-muted-foreground uppercase text-right">CONVERSION</div>
        </div>

        {totalDeals === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center mb-6">
            <div className="h-12 w-12 rounded-full bg-brand-purple/10 flex items-center justify-center mb-3">
              <ClipboardList className="h-6 w-6 text-brand-purple/50" />
            </div>
            <p className="text-[13px] font-bold text-foreground">No stage data available</p>
            <p className="text-[11px] font-semibold text-muted-foreground mt-0.5">Start adding deals to see insights</p>
          </div>
        ) : (
          <div className="space-y-3 flex-1 overflow-y-auto">
            {dealsByStage.map((d, i) => (
              <div key={i} className="grid grid-cols-3 py-2 px-4 border-b border-border/50 items-center">
                <div className="text-xs font-bold text-foreground">{d.stage}</div>
                <div className="text-xs font-semibold text-muted-foreground text-center">{d.count}</div>
                <div className="text-xs font-bold text-emerald-600 text-right">0%</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
