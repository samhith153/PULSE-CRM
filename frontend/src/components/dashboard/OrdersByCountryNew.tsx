'use client';

import React from 'react';
import { MoreVertical, Activity, MoveUpRight } from 'lucide-react';
import { asNumber } from '@/utils/api';

interface KeyMetricsData {
  pipeline_value?: number;
  open_deals?: number;
  deals_created?: number;
  deals_lost?: number;
  activities?: number;
}

export function OrdersByCountryNew({ keyMetrics }: { keyMetrics: KeyMetricsData }) {
  const pipelineValue = asNumber(keyMetrics?.pipeline_value) || 0;
  const openDeals = keyMetrics?.open_deals || 0;
  const dealsCreated = keyMetrics?.deals_created || 0;
  const dealsLost = keyMetrics?.deals_lost || 0;
  const activities = keyMetrics?.activities || 0;

  const currency = (n: number) =>
    n.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm min-h-[300px] flex flex-col relative overflow-hidden">
      <div className="flex items-start justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-purple/10">
            <Activity className="h-4 w-4 text-brand-purple" />
          </div>
          <h2 className="text-[17px] font-bold tracking-tight text-foreground">Key Metrics</h2>
        </div>
        <button aria-label="More options" className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-secondary">
          <MoreVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <div className="flex mt-6 h-full z-10">
        <div className="flex-1 flex flex-col">
          <span className="text-3xl font-extrabold tracking-tight text-brand-purple tabular-nums">{currency(pipelineValue)}</span>
          <span className="text-xs font-semibold text-muted-foreground mt-1">Pipeline Value</span>
          
          <div className="mt-3">
            <span className={`inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-bold text-emerald-600`}>
              <MoveUpRight className="h-3 w-3" />
              +0.0%
            </span>
          </div>

          <div className="flex-1 relative mt-4">
            {/* Simple dot chart mocking the Key Metrics chart in mockup */}
            <div className="absolute inset-0 flex items-end justify-between px-2 pb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-purple/40 mb-4"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-brand-purple/40 mb-6"></div>
              <div className="w-2 h-2 rounded-full bg-brand-purple mb-8 shadow-sm"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-brand-purple/40 mb-10"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-brand-purple/40 mb-6"></div>
              <div className="w-2 h-2 rounded-full bg-brand-purple mb-14 shadow-sm"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-brand-purple/40 mb-10"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-brand-purple/40 mb-20"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-brand-purple/40 mb-16"></div>
            </div>
            
            <svg className="absolute inset-0 w-full h-full opacity-30" preserveAspectRatio="none" viewBox="0 0 100 50">
              <path d="M0,45 L10,40 L20,35 L30,30 L40,40 L50,20 L60,35 L70,10 L80,25 L100,20 L100,50 L0,50 Z" fill="url(#purpleGrad)" />
              <defs>
                <linearGradient id="purpleGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="1" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        <div className="w-[140px] pl-4 border-l border-border/50 flex flex-col justify-center gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
              <span className="text-[10px] font-bold text-muted-foreground">Open Deals</span>
            </div>
            <span className="text-xs font-bold">{openDeals}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
              <span className="text-[10px] font-bold text-muted-foreground">Deals Created</span>
            </div>
            <span className="text-xs font-bold">{dealsCreated}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
              <span className="text-[10px] font-bold text-muted-foreground">Deals Lost</span>
            </div>
            <span className="text-xs font-bold">{dealsLost}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
              <span className="text-[10px] font-bold text-muted-foreground">Activities</span>
            </div>
            <span className="text-xs font-bold">{activities}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
