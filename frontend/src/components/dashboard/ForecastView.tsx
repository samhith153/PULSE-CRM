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
  HelpCircle,
  Sliders,
  IndianRupee,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getManagerForecast,
  asNumber,
  formatINR,
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

// ── Skeleton ───────────────────────────────────────────────────────────────

function SkeletonBlock({ h = 'h-5', w = 'w-full', className }: { h?: string; w?: string; className?: string }) {
  return <div className={`${h} ${w} ${className ?? ''} bg-muted/40 rounded-xl animate-pulse`} />;
}

// ── Radial Progress Ring ────────────────────────────────────────────────────

function RadialProgressRing({ progress }: { progress: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, progress));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
        <circle cx="70" cy="70" r={radius} fill="none" strokeWidth="10" className="stroke-muted/45" />
        <motion.circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          stroke="url(#forecastRingGradient)"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
        />
        <defs>
          <linearGradient id="forecastRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--accent-color)" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-3.5xl font-black text-foreground tracking-tight tabular-nums"
        >
          {Math.round(clamped)}%
        </motion.span>
        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">Confidence</span>
      </div>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export default function ForecastView() {
  const [data, setData]       = useState<ManagerForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('Q4');

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
          <SkeletonBlock h="h-9" w="w-48" />
          <SkeletonBlock h="h-4" w="w-72" className="mt-2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-7 bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-4">
            <SkeletonBlock h="h-8" w="w-48" />
            <SkeletonBlock h="h-4" />
            <SkeletonBlock h="h-4" w="w-3/4" />
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
              <SkeletonBlock h="h-6" />
              <SkeletonBlock h="h-6" />
            </div>
          </div>
          <div className="col-span-12 md:col-span-5 bg-card border border-border/60 rounded-2xl p-6 shadow-sm flex flex-col items-center space-y-4">
            <SkeletonBlock h="h-4" w="w-32" />
            <div className="w-32 h-32 rounded-full bg-muted/40 animate-pulse" />
            <SkeletonBlock h="h-10" />
          </div>
        </div>
        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-4">
          <SkeletonBlock h="h-5" w="w-48" />
          {[1, 2, 3].map((i) => <SkeletonBlock key={i} h="h-8" />)}
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-sans text-foreground tracking-tight font-black">Sales Forecast</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1 font-semibold tracking-wide">
            Interactive projections and confidence tiers modeled dynamically from active pipelines.
          </p>
        </div>
        <div className="bg-status-danger/10 border border-status-danger/20 rounded-2xl p-6 text-status-danger dark:text-status-danger">
          <p className="font-extrabold text-sm">Couldn't load forecast data</p>
          <p className="text-xs mt-1 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 select-none">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-sans text-foreground tracking-tight font-black flex items-center gap-2">
            <span>Sales Forecast</span>
            <Sparkles size={20} className="text-accent-color animate-pulse" />
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1 font-semibold tracking-wide">
            Interactive projections and confidence tiers modeled dynamically from active pipelines.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-muted/60 dark:bg-muted/30 p-1 rounded-xl border border-border/80 shadow-inner shrink-0 w-fit relative">
          {['Q3', 'Q4'].map((q) => (
            <button
              key={q}
              onClick={() => setActiveTab(q as any)}
              className={`relative px-4 py-1.5 rounded-lg text-xs font-bold transition duration-200 cursor-pointer select-none ${
                activeTab === q ? 'text-slate-900 font-extrabold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {activeTab === q && (
                <motion.div
                  layoutId="activeQuarterTab"
                  className="absolute inset-0 bg-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.12),0_1px_3px_rgba(0,0,0,0.06)] rounded-lg border border-slate-200/80"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10">{q} Projections</span>
            </button>
          ))}
        </div>
      </div>

      {/* Headline Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Expected Revenue (Col 7) */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="col-span-12 md:col-span-7 bg-card/95 backdrop-blur-md border border-border/70 hover:border-accent-color/30 rounded-2xl p-6 shadow-[0_1px_2px_0_rgba(15,23,42,0.05),0_18px_44px_-20px_rgba(79,70,229,0.18)] hover:shadow-[0_26px_58px_-20px_rgba(79,70,229,0.32)] transition-all duration-300 relative overflow-hidden group flex flex-col justify-between"
        >
          <div className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-accent-color/5 blur-3xl pointer-events-none group-hover:bg-accent-color/8 transition duration-500" />
          
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-accent-color/10 text-accent-color border border-accent-color/15 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                  <Target size={20} />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">Expected Revenue</span>
                  <h2 className="text-3xl font-black text-foreground mt-0.5 tracking-tight tabular-nums bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">{fmtINR(expectedRevenue)}</h2>
                </div>
              </div>
              <span className="text-[9px] font-bold bg-accent-color/10 text-accent-color border border-accent-color/15 px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                {quarterLabel} Projected
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
              Based on active deals, historical conversion rates, and representative quota velocity.
              {quarterTarget > 0
                ? ` The team is projected to reach ${targetAchPct.toFixed(1)}% of the ${quarterLabel} quota of ${fmtINR(quarterTarget)}.`
                : ' No pipeline data available.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-4 border-t border-border/50 mt-6 relative z-10">
            <div className="flex items-start gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-accent-color/10 text-accent-color flex items-center justify-center shrink-0 border border-accent-color/15">
                <Award size={15} />
              </div>
              <div>
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Best Case Pipeline</span>
                <p className="text-sm font-extrabold text-foreground mt-0.5 tabular-nums">
                  {bestCase > 0 ? fmtINR(bestCase) : '₹0'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-status-success/10 text-status-success flex items-center justify-center shrink-0 border border-status-success/15">
                <TrendingUp size={15} />
              </div>
              <div>
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Active Pipe Coverage</span>
                <p className="text-sm font-extrabold text-foreground mt-0.5 tabular-nums">
                  {coverageRatio > 0 ? `${coverageRatio.toFixed(2)}x Target` : 'No pipeline data available'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Confidence Score Gauge (Col 5) */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="col-span-12 md:col-span-5 bg-card/95 backdrop-blur-md border border-border/70 hover:border-accent-color/30 rounded-2xl p-6 shadow-[0_1px_2px_0_rgba(15,23,42,0.05),0_18px_44px_-20px_rgba(79,70,229,0.18)] hover:shadow-[0_26px_58px_-20px_rgba(79,70,229,0.32)] transition-all duration-300 relative overflow-hidden group flex flex-col items-center justify-between text-center"
        >
          <div className="absolute -bottom-12 -right-12 w-32 h-32 rounded-full bg-accent-color/5 blur-3xl pointer-events-none group-hover:bg-accent-color/8 transition duration-500" />
          
          <div className="w-full flex justify-between items-center text-left mb-2 relative z-10">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">AI Confidence Score</span>
            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
          </div>

          <div className="relative flex items-center justify-center py-4 my-2 shrink-0 z-10">
            <RadialProgressRing progress={confidenceScore} />
          </div>

          <div className="w-full p-3 bg-secondary/60 dark:bg-slate-900/40 border border-border/60 rounded-xl relative z-10">
            <p className="text-[10px] font-bold text-foreground/80 leading-normal">
              {confidenceDesc}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Monthly Forecast Breakdown */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-card/95 backdrop-blur-md border border-border/70 hover:border-accent-color/30 rounded-2xl p-6 shadow-[0_1px_2px_0_rgba(15,23,42,0.05),0_18px_44px_-20px_rgba(79,70,229,0.18)] hover:shadow-[0_26px_58px_-20px_rgba(79,70,229,0.32)] transition-all duration-300 relative overflow-hidden group"
      >
        <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-accent-color/4 blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 pb-4 border-b border-border/50">
          <h3 className="font-extrabold text-foreground text-sm flex items-center">
            <Calendar className="h-4.5 w-4.5 mr-2 text-accent-color" />
            <span>Monthly Projections Distribution</span>
          </h3>
          <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-accent-color" /> Expected
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-accent-color/30 border border-accent-color/25" /> Best Case
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-3 bg-accent-color rounded-full" /> Pipeline Target
            </span>
          </div>
        </div>

        {monthlyForecast.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center font-bold">No forecast data available.</p>
        ) : (
          <div className="space-y-5">
            {monthlyForecast.map((item, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-foreground">
                  <span className="font-extrabold text-sm uppercase tracking-wide">{item.month}</span>
                  <span className="tabular-nums font-black text-muted-foreground text-[11px] bg-secondary/80 px-2 py-0.5 rounded-md border border-border/40">
                    Expected: <span className="text-foreground">{fmtINR(item.expected)}</span> / Max: <span className="text-foreground">{fmtINR(item.bestCase)}</span>
                  </span>
                </div>
                <div className="relative h-7 w-full bg-secondary/60 dark:bg-slate-900/40 rounded-xl overflow-hidden flex items-center px-3 border border-border/40">
                  {/* Best Case bar */}
                  <motion.div 
                    className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-indigo-500/10 to-indigo-500/20 border-r border-accent-color/30 rounded-l-xl"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${Math.min((item.bestCase / maxVal) * 100, 100)}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                  {/* Expected bar */}
                  <motion.div 
                    className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-accent-color/20 to-accent-color/30 border-r-2 border-accent-color/60 rounded-l-xl"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${Math.min((item.expected / maxVal) * 100, 100)}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.15 }}
                  />
                  {/* Pipeline line marker */}
                  <motion.div 
                    className="absolute top-0 bottom-0 w-0.75 bg-accent-color shadow-sm z-10"
                    initial={{ scaleY: 0 }}
                    whileInView={{ scaleY: 1, left: `${Math.min((item.pipeline / maxVal) * 100, 100)}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    title={`Pipeline coverage: ${fmtINR(item.pipeline)}`}
                  />
                  <span className="z-20 text-[9px] font-black text-foreground/80 flex items-center gap-1.5 select-none bg-background/80 backdrop-blur-sm border border-border/50 px-2 py-0.5 rounded-full shadow-sm">
                    <span className="size-1.5 rounded-full bg-accent-color" />
                    Pipeline: {fmtINR(item.pipeline)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Quarterly Forecast Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-card/95 backdrop-blur-md border border-border/70 hover:border-accent-color/30 rounded-2xl p-6 shadow-[0_1px_2px_0_rgba(15,23,42,0.05),0_18px_44px_-20px_rgba(79,70,229,0.18)] hover:shadow-[0_26px_58px_-20px_rgba(79,70,229,0.32)] transition-all duration-300 relative overflow-hidden group"
      >
        <div className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full bg-accent-color/4 blur-3xl pointer-events-none" />

        <h3 className="font-extrabold text-foreground text-sm flex items-center mb-6 pb-4 border-b border-border/50">
          <TrendingUp className="h-4.5 w-4.5 mr-2 text-accent-color" />
          <span>Quarterly Forecast Projections Matrix</span>
        </h3>

        <div className="overflow-x-auto select-text">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-border/60 text-[9px] uppercase font-bold text-muted-foreground tracking-widest">
                <th className="py-3.5">Quarter</th>
                <th className="py-3.5 text-right">Quota Target</th>
                <th className="py-3.5 text-right">Expected Closed</th>
                <th className="py-3.5 text-right">Best Case Close</th>
                <th className="py-3.5 text-right">Open Pipeline</th>
                <th className="py-3.5 text-right">Target Achievement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-xs font-semibold text-foreground">
              {quarterlyForecast.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-xs text-muted-foreground font-bold">
                    No pipeline data available.
                  </td>
                </tr>
              ) : (
                quarterlyForecast.map((item, idx) => (
                  <tr key={idx} className="hover:bg-muted/40 transition-colors duration-150">
                    <td className="py-4 font-black text-sm">{item.quarter}</td>
                    <td className="py-4 text-right tabular-nums text-muted-foreground">{fmtINR(item.quota)}</td>
                    <td className="py-4 text-right tabular-nums font-black text-accent-color">{fmtINR(item.committed)}</td>
                    <td className="py-4 text-right tabular-nums">{fmtINR(item.bestCase)}</td>
                    <td className="py-4 text-right tabular-nums text-muted-foreground/80">{fmtINR(item.pipeline)}</td>
                    <td className="py-4 text-right">
                      <div className="flex items-center gap-2.5 justify-end">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border select-none ${
                          item.pct >= 100 
                            ? 'bg-status-success/10 text-status-success dark:text-status-success border-status-success/20' 
                            : item.pct >= 75 
                            ? 'bg-status-warning/10 text-status-warning dark:text-status-warning border-status-warning/20' 
                            : 'bg-status-danger/10 text-status-danger dark:text-status-danger border-status-danger/20'
                        }`}>
                          {item.pct}%
                        </span>
                        <div className="w-16 h-1.5 bg-muted/65 dark:bg-slate-900/40 rounded-full overflow-hidden shrink-0 shadow-inner">
                          <motion.div 
                            className={`h-full rounded-full ${
                              item.pct >= 100 
                                ? 'bg-status-success' 
                                : item.pct >= 75 
                                ? 'bg-status-warning' 
                                : 'bg-status-danger'
                            }`}
                            initial={{ width: 0 }}
                            whileInView={{ width: `${Math.min(item.pct, 100)}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.15 }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

