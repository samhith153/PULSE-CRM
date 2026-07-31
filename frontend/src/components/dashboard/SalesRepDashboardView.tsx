'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Target,
  Trophy,
  CheckCircle2,
  Clock,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import {
  getSalesDashboard,
  getSalesRepDashboard,
  asNumber,
  formatINR,
  formatNum,
  formatPct,
  SalesRepDashboardData,
} from '@/utils/api';

export default function SalesRepDashboardView() {
  const [data, setData] = useState<SalesRepDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    // Prefer the canonical /dashboard/sales route; if it fails (older backend),
    // fall back to the /dashboard/sales-rep alias.
    getSalesDashboard()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (cancelled) return;
        getSalesRepDashboard()
          .then((d) => {
            if (!cancelled) setData(d);
          })
          .catch((e) => {
            if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load sales dashboard');
          })
          .finally(() => {
            if (!cancelled) setLoading(false);
          });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-9 w-64 bg-slate-100 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border rounded-2xl p-5 h-32 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border rounded-2xl p-6 h-80 animate-pulse" />
          <div className="bg-white border rounded-2xl p-6 h-80 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-rose-700">
        <p className="font-bold">Couldn’t load your sales dashboard</p>
        <p className="text-sm mt-1">{error ?? 'No data returned.'}</p>
      </div>
    );
  }

  const s = data.summary;
  const revenueSeries = data.revenue_trend.map((m) => asNumber(m.revenue));
  const dealsByStage = data.deals_by_stage ?? [];
  const dealsBySource = data.deals_by_source ?? [];
  const keyMetrics = data.key_metrics;

  const kpiCards = [
    {
      title: 'Total Revenue',
      value: formatINR(s.total_revenue),
      change: formatPct(s.average_deal_size ? asNumber(s.average_deal_size) : 0),
      isPositive: asNumber(s.total_revenue) >= 0,
      icon: TrendingUp,
      color: '#10b981',
    },
    {
      title: 'Won Deals',
      value: formatNum(s.won_deals),
      change: `Win rate ${formatPct(s.win_rate)}`,
      isPositive: asNumber(s.win_rate) >= 0,
      icon: Trophy,
      color: '#7957fb',
    },
    {
      title: 'Win Rate',
      value: formatPct(s.win_rate),
      change: `Avg cycle ${asNumber(s.average_sales_cycle)}d`,
      isPositive: asNumber(s.win_rate) >= 0,
      icon: Target,
      color: '#3b82f6',
    },
    {
      title: 'Avg Deal Size',
      value: formatINR(s.average_deal_size),
      change: 'Per deal',
      isPositive: true,
      icon: CheckCircle2,
      color: '#f59e0b',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-sans text-brand-heading tracking-tight font-bold">My Sales Dashboard</h1>
        <p className="text-xs md:text-sm text-brand-text/75 mt-1 font-medium tracking-wide">
          Your revenue, deals, and activity — scoped to your pipeline.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 block">{kpi.title}</span>
                <Icon className="h-4 w-4 text-slate-400" />
              </div>
              <h2 className="text-3xl font-black text-indigo-900 text-center mt-1 font-sans tracking-tight">{kpi.value}</h2>
              <div className="flex items-end justify-between mt-4">
                <span className={`text-xs font-bold ${kpi.isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {kpi.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deals by Stage & Source */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs">
          <h3 className="font-extrabold text-slate-900 text-base mb-4">Deals by Stage</h3>
          <div className="space-y-3">
            {dealsByStage.length === 0 && <p className="text-xs text-slate-400 py-4 text-center">No deal stage data yet.</p>}
            {dealsByStage.map((stage, i) => (
              <div key={stage.stage} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-brand-text flex items-center">
                    <span className="h-2.5 w-2.5 rounded-full mr-2 shrink-0 bg-brand-accent" />
                    {stage.stage}
                  </span>
                  <span className="text-brand-heading font-black">{stage.count} deals</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-accent rounded-full" style={{ width: `${asNumber(stage.percentage)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs">
          <h3 className="font-extrabold text-slate-900 text-base mb-4">Deals by Source</h3>
          <div className="space-y-3">
            {dealsBySource.length === 0 && <p className="text-xs text-slate-400 py-4 text-center">No source data yet.</p>}
            {dealsBySource.map((src) => (
              <div key={src.source} className="flex justify-between items-center text-xs font-bold border-b border-slate-100 pb-2">
                <span className="text-brand-text">{src.source}</span>
                <span className="text-brand-heading font-black">{formatINR(src.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      {keyMetrics && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs">
          <h3 className="font-extrabold text-slate-900 text-base mb-4">Key Metrics</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="flex items-center space-x-3">
              <Clock className="h-9 w-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0" />
              <div>
                <span className="text-sm font-black text-slate-900 block leading-none">{formatNum(keyMetrics.open_deals)}</span>
                <span className="text-[10px] font-semibold text-slate-400 mt-1 block">Open Deals</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0" />
              <div>
                <span className="text-sm font-black text-slate-900 block leading-none">{formatINR(keyMetrics.pipeline_value)}</span>
                <span className="text-[10px] font-semibold text-slate-400 mt-1 block">Pipeline Value</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="h-9 w-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0" />
              <div>
                <span className="text-sm font-black text-slate-900 block leading-none">{formatNum(keyMetrics.deals_created)}</span>
                <span className="text-[10px] font-semibold text-slate-400 mt-1 block">Deals Created</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Target className="h-9 w-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0" />
              <div>
                <span className="text-sm font-black text-slate-900 block leading-none">{formatNum(keyMetrics.deals_lost)}</span>
                <span className="text-[10px] font-semibold text-slate-400 mt-1 block">Deals Lost</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <ArrowRight className="h-9 w-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0" />
              <div>
                <span className="text-sm font-black text-slate-900 block leading-none">{formatNum(keyMetrics.activities_logged)}</span>
                <span className="text-[10px] font-semibold text-slate-400 mt-1 block">Activities</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
