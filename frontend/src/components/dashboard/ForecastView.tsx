'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Target, 
  Calendar, 
  ShieldCheck, 
  Sparkles, 
  ArrowUpRight, 
  Percent,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import {
  getManagerForecast,
  asNumber,
  type ManagerForecastData,
} from '@/utils/api';

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtINR(v: string | number | null | undefined): string {
  const n = asNumber(v);
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)}Cr`;
  if (n >= 1_00_000)    return `₹${(n / 1_00_000).toFixed(2)}L`;
  if (n >= 1_000)       return `₹${(n / 1_000).toFixed(1)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function fmtNum(v: string | number | null | undefined): string {
  const n = asNumber(v);
  return n.toLocaleString('en-IN');
}

// ── Skeleton ───────────────────────────────────────────────────────────────

function SkeletonBlock({ h = 'h-5', w = 'w-full' }: { h?: string; w?: string }) {
  return <div className={`${h} ${w} bg-slate-100 rounded animate-pulse`} />;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function ForecastView() {
  const [data, setData]       = useState<ManagerForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getManagerForecast('monthly')
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load forecast'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  // ── Derived values (safe defaults when data is null) ─────────────────────

  const confidenceScore  = data?.confidence_score.score ?? 0;
  const confidenceDesc   = data?.confidence_score.description ?? 'No forecast data available.';
  const expectedRevenue  = asNumber(data?.expected_revenue.expected_revenue);
  const quarterLabel     = data?.expected_revenue.quarter ?? '—';
  const bestCase         = asNumber(data?.best_case_pipeline.best_case_pipeline);
  const coverageRatio    = asNumber(data?.pipeline_coverage.coverage_ratio);
  const coverageStatus   = data?.pipeline_coverage.coverage_status ?? '—';
  const targetAchPct     = asNumber(data?.expected_revenue.target_achievement_pct);
  const quarterTarget    = asNumber(data?.quarterly_projection?.[0]?.quota_target ?? 0);

  const monthlyForecast  = (data?.monthly_forecast ?? []).map((m) => ({
    month:    m.month,
    expected: asNumber(m.expected),
    bestCase: asNumber(m.maximum),
    pipeline: asNumber(m.pipeline),
  }));

  const quarterlyForecast = (data?.quarterly_projection ?? []).map((q) => ({
    quarter:   q.quarter,
    committed: asNumber(q.expected_closed_revenue),
    bestCase:  asNumber(q.best_case_close),
    pipeline:  asNumber(q.open_pipeline),
    quota:     asNumber(q.quota_target),
    pct:       Math.round(asNumber(q.target_achievement_pct)),
  }));

  // Dynamic maxVal from actual data (fallback 1 to avoid /0)
  const allValues = monthlyForecast.flatMap((m) => [m.expected, m.bestCase, m.pipeline]);
  const maxVal = allValues.length > 0 ? Math.max(...allValues, 1) : 1;

  // ── Loading state ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-sans text-brand-heading tracking-tight font-bold">
            Sales Forecast
          </h1>
          <p className="text-xs md:text-sm text-brand-text/75 mt-1 font-medium tracking-wide">
            Projections of revenue targets and confidence tiers generated from active pipeline pipelines.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-7 bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 space-y-4">
            <SkeletonBlock h="h-8" w="w-48" />
            <SkeletonBlock h="h-4" />
            <SkeletonBlock h="h-4" w="w-3/4" />
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
              <SkeletonBlock h="h-6" />
              <SkeletonBlock h="h-6" />
            </div>
          </div>
          <div className="col-span-12 md:col-span-5 bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 flex flex-col items-center space-y-4">
            <SkeletonBlock h="h-4" w="w-32" />
            <div className="w-32 h-32 rounded-full bg-slate-100 animate-pulse" />
            <SkeletonBlock h="h-10" />
          </div>
        </div>
        <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 space-y-4">
          <SkeletonBlock h="h-5" w="w-48" />
          {[1, 2, 3].map((i) => <SkeletonBlock key={i} h="h-8" />)}
        </div>
        <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 space-y-4">
          <SkeletonBlock h="h-5" w="w-48" />
          <SkeletonBlock h="h-24" />
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-sans text-brand-heading tracking-tight font-bold">Sales Forecast</h1>
          <p className="text-xs md:text-sm text-brand-text/75 mt-1 font-medium tracking-wide">
            Projections of revenue targets and confidence tiers generated from active pipeline pipelines.
          </p>
        </div>
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-rose-700">
          <p className="font-bold text-sm">Couldn't load forecast data</p>
          <p className="text-xs mt-1">{error}</p>
        </div>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-sans text-brand-heading tracking-tight font-bold">
          Sales Forecast
        </h1>
        <p className="text-xs md:text-sm text-brand-text/75 mt-1 font-medium tracking-wide">
          Projections of revenue targets and confidence tiers generated from active pipeline pipelines.
        </p>
      </div>

      {/* Headline Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Expected Revenue (Col 7) */}
        <div className="col-span-12 md:col-span-7 bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-extrabold text-brand-text/60 uppercase block">Expected Revenue</span>
              <h2 className="text-3xl font-bold text-brand-heading mt-1">{fmtINR(expectedRevenue)}</h2>
            </div>
            <span className="text-[9px] font-extrabold bg-brand-accent/10 text-brand-accent px-2 py-0.5 rounded uppercase tracking-wider">
              {quarterLabel} Projected
            </span>
          </div>

          <p className="text-xs text-brand-text/75 leading-relaxed font-semibold">
            Based on active deals, historical conversion rates, and representative quota velocity.
            {quarterTarget > 0
              ? ` The team is projected to reach ${targetAchPct.toFixed(1)}% of the ${quarterLabel} quota of ${fmtINR(quarterTarget)}.`
              : ' No pipeline data available.'}
          </p>

          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase">Best Case Pipeline</span>
              <p className="text-sm font-extrabold text-brand-text mt-0.5">
                {bestCase > 0 ? fmtINR(bestCase) : '₹0'}
              </p>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase">Active Pipe Coverage</span>
              <p className="text-sm font-extrabold text-brand-text mt-0.5">
                {coverageRatio > 0 ? `${coverageRatio.toFixed(2)}x Target` : 'No pipeline data available'}
              </p>
            </div>
          </div>
        </div>

        {/* Confidence Score Gauge (Col 5) */}
        <div className="col-span-12 md:col-span-5 bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 flex flex-col items-center justify-between text-center space-y-4">
          <div className="w-full flex justify-between items-center text-left">
            <span className="text-[10px] font-extrabold text-brand-text/60 uppercase">AI Confidence Score</span>
            <HelpCircle className="h-4 w-4 text-slate-400 cursor-pointer" />
          </div>

          <div className="relative flex items-center justify-center">
            {/* Visual Ring */}
            <svg className="w-32 h-32 transform -rotate-90">
              <circle cx="64" cy="64" r="50" stroke="#f1f5f9" strokeWidth="10" fill="transparent" />
              <circle 
                cx="64" 
                cy="64" 
                r="50" 
                stroke="var(--brand-accent)" 
                strokeWidth="10" 
                fill="transparent" 
                strokeDasharray={314}
                strokeDashoffset={314 - (314 * confidenceScore) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-2xl font-black text-brand-heading tabular-nums">{confidenceScore}%</span>
              <span className="text-[9px] font-bold text-slate-450 block uppercase tracking-wider">Reliability</span>
            </div>
          </div>

          <div className="w-full p-2.5 bg-brand-sidebar-hover/10 border border-brand-border-purple/15 rounded-xl">
            <p className="text-[10px] font-bold text-brand-text/80">
              {confidenceDesc}
            </p>
          </div>
        </div>
      </div>

      {/* Monthly Forecast Breakdown */}
      <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 space-y-4">
        <h3 className="font-extrabold text-brand-heading text-sm flex items-center">
          <Calendar className="h-4.5 w-4.5 mr-2 text-brand-accent" />
          <span>Monthly Forecast Breakdown</span>
        </h3>

        {monthlyForecast.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No forecast data available.</p>
        ) : (
          <div className="space-y-4">
            {monthlyForecast.map((item, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-brand-text">
                  <span className="font-extrabold">{item.month}</span>
                  <span className="tabular-nums font-extrabold text-brand-heading">
                    Expected: {fmtINR(item.expected)} / Max: {fmtINR(item.bestCase)}
                  </span>
                </div>
                <div className="relative h-6 w-full bg-slate-100 rounded-lg overflow-hidden flex items-center px-2.5">
                  {/* Expected bar */}
                  <div 
                    className="absolute left-0 top-0 bottom-0 bg-brand-accent/35 border-r border-brand-accent/50 transition-all duration-300"
                    style={{ width: `${Math.min((item.expected / maxVal) * 100, 100)}%` }}
                  />
                  {/* Best Case bar */}
                  <div 
                    className="absolute left-0 top-0 bottom-0 bg-brand-secondary-accent/15 border-r border-brand-secondary-accent/30 transition-all duration-300"
                    style={{ width: `${Math.min((item.bestCase / maxVal) * 100, 100)}%` }}
                  />
                  {/* Pipeline line marker */}
                  <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-brand-border-purple/80 z-10"
                    style={{ left: `${Math.min((item.pipeline / maxVal) * 100, 100)}%` }}
                    title={`Pipeline coverage: ${fmtINR(item.pipeline)}`}
                  />
                  <span className="z-20 text-[9px] font-extrabold text-brand-heading flex items-center">
                    Pipeline: {fmtINR(item.pipeline)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quarterly Forecast Grid */}
      <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 space-y-4">
        <h3 className="font-extrabold text-brand-heading text-sm flex items-center">
          <TrendingUp className="h-4.5 w-4.5 mr-2 text-brand-accent" />
          <span>Quarterly Projections Matrix</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] uppercase font-extrabold text-black">
                <th className="py-2.5">Quarter</th>
                <th className="py-2.5 text-right">Quota Target</th>
                <th className="py-2.5 text-right">Expected Closed</th>
                <th className="py-2.5 text-right">Best Case Close</th>
                <th className="py-2.5 text-right">Open Pipeline</th>
                <th className="py-2.5 text-right">Target Achievement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-brand-text">
              {quarterlyForecast.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-xs text-slate-400">
                    No pipeline data available.
                  </td>
                </tr>
              ) : (
                quarterlyForecast.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 font-extrabold">{item.quarter}</td>
                    <td className="py-3 text-right tabular-nums">{fmtINR(item.quota)}</td>
                    <td className="py-3 text-right tabular-nums font-extrabold text-brand-heading">{fmtINR(item.committed)}</td>
                    <td className="py-3 text-right tabular-nums">{fmtINR(item.bestCase)}</td>
                    <td className="py-3 text-right tabular-nums text-slate-500">{fmtINR(item.pipeline)}</td>
                    <td className="py-3 text-right">
                      <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-extrabold tabular-nums">
                        {item.pct}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
