'use client';

import React, { useState, useMemo } from 'react';
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
  DollarSign
} from 'lucide-react';
import { motion } from 'framer-motion';

/* ── Radial progress ring ───────────────────────────────────────────── */
function RadialProgressRing({ progress, size = 120, strokeWidth = 9 }: { progress: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(progress, 100) / 100) * circumference;

  // Dynamic colors based on score
  const strokeColor = progress >= 80 ? '#10B981' : progress >= 60 ? '#F59E0B' : '#EF4444';
  const glowColor = progress >= 80 ? 'rgba(16,185,129,0.35)' : progress >= 60 ? 'rgba(245,158,11,0.35)' : 'rgba(239,68,68,0.35)';

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border-subtle)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${glowColor})` }}
        />
      </svg>
      <div className="absolute text-center flex flex-col items-center justify-center">
        <span className="text-3xl font-black text-foreground tabular-nums tracking-tight">{Math.round(progress)}%</span>
        <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-wider mt-0.5">Reliability</span>
      </div>
    </div>
  );
}

export default function ForecastView() {
  const [closeRateMultiplier, setCloseRateMultiplier] = useState(1.0); // 1.0 = 100% of historical rate
  const [activeTab, setActiveTab] = useState<'Q3' | 'Q4'>('Q3');
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  const baseExpectedRevenue = 3450000;
  const targetQuota = 3000000;

  // Calculate dynamic outputs based on interactive close rate adjustment slider
  const expectedRevenue = useMemo(() => {
    return Math.round(baseExpectedRevenue * closeRateMultiplier);
  }, [closeRateMultiplier]);

  const achievementPct = useMemo(() => {
    return Math.round((expectedRevenue / targetQuota) * 100);
  }, [expectedRevenue]);

  const confidenceScore = useMemo(() => {
    // Score varies slightly with multiplier setting to simulate risk
    const baseScore = 88;
    const dev = Math.abs(1.0 - closeRateMultiplier) * 15;
    return Math.max(Math.min(Math.round(baseScore - dev), 100), 45);
  }, [closeRateMultiplier]);
  
  const monthlyForecast = [
    { month: "May 2025", expected: 1100000, bestCase: 1300000, pipeline: 1800000, color: '#3B82F6' },
    { month: "June 2025", expected: 1250000, bestCase: 1550000, pipeline: 2100000, color: '#10B981' },
    { month: "July 2025", expected: 1100000, bestCase: 1400000, pipeline: 1950000, color: '#6366F1' }
  ];

  const quarterlyForecast = [
    { quarter: "Q3 2025", committed: 3450000, bestCase: 4250000, pipeline: 5850000, quota: 3000000 },
    { quarter: "Q4 2025", committed: 3900000, bestCase: 4800000, pipeline: 6500000, quota: 3500000 }
  ];

  const maxVal = 7000000;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-sans text-foreground tracking-tight font-black">
            Sales Forecast
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1 font-semibold tracking-wide">
            Interactive projections and confidence tiers modeled dynamically from active pipelines.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-secondary p-1 rounded-xl border border-border/60 shrink-0 w-fit">
          {['Q3', 'Q4'].map((q) => (
            <button
              key={q}
              onClick={() => setActiveTab(q as any)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeTab === q 
                  ? 'bg-card text-foreground shadow-sm border border-border/40' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {q} Projections
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* expected revenue card (Col 7) */}
        <div className="col-span-12 lg:col-span-8 bg-card border border-border/85 rounded-2xl p-[var(--space-4)] shadow-sm hover:shadow-md hover:border-brand-purple/20 transition-all duration-300 relative overflow-hidden flex flex-col justify-between">
          {/* Subtle accent glow top-right corner */}
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-brand-purple/5 filter blur-3xl pointer-events-none" />

          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Expected Revenue</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <h2 className="text-4xl font-black text-foreground tabular-nums tracking-tight">
                    ₹{expectedRevenue.toLocaleString('en-IN')}
                  </h2>
                  <span className="text-xs font-semibold text-muted-foreground">INR</span>
                </div>
              </div>

              {/* Status Badge */}
              <span className={`text-[9px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border select-none ${
                achievementPct >= 110 
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                  : achievementPct >= 90 
                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                    : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
              }`}>
                {achievementPct >= 100 ? 'Quota Exceeded' : 'Below Quota Target'}
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed font-semibold mb-6">
              Based on active deals, historical conversion rates, and representative quota velocity. The team is projected to hit <span className="text-foreground font-bold">{achievementPct}%</span> of the base target quota of ₹{targetQuota.toLocaleString('en-IN')}.
            </p>
          </div>

          {/* Interactive Simulation Panel */}
          <div className="p-4 bg-secondary/65 rounded-xl border border-border/40 mt-2 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Sliders size={12} className="text-brand-purple" />
                Forecast Scenario Modeler
              </span>
              <span className="text-[10px] font-bold text-brand-purple bg-brand-purple/10 px-2 py-0.5 rounded-full select-none">
                {(closeRateMultiplier * 100).toFixed(0)}% Close Velocity
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-[10px] text-muted-foreground font-bold">Conservative (70%)</span>
              <input
                type="range"
                min="0.7"
                max="1.3"
                step="0.05"
                value={closeRateMultiplier}
                onChange={(e) => setCloseRateMultiplier(parseFloat(e.target.value))}
                className="flex-1 h-1.5 rounded-lg bg-border appearance-none cursor-pointer accent-brand-purple"
              />
              <span className="text-[10px] text-muted-foreground font-bold">Optimistic (130%)</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/60 mt-4">
            <div>
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Best Case Estimate</span>
              <p className="text-sm font-black text-foreground mt-0.5 tabular-nums">
                ₹{(expectedRevenue * 1.2).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div>
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Estimated Pipeline Cover</span>
              <p className="text-sm font-black text-foreground mt-0.5">
                {(2.25 * closeRateMultiplier).toFixed(2)}x Target
              </p>
            </div>
          </div>
        </div>

        {/* Confidence Score Gauge (Col 4) */}
        <div className="col-span-12 lg:col-span-4 bg-card border border-border/85 rounded-2xl p-[var(--space-4)] shadow-sm hover:shadow-md hover:border-brand-purple/20 transition-all duration-300 flex flex-col items-center justify-between text-center relative overflow-hidden">
          <div className="w-full flex justify-between items-center text-left mb-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">AI Confidence Score</span>
            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
          </div>

          <div className="relative flex items-center justify-center py-4 my-2">
            <RadialProgressRing progress={confidenceScore} />
          </div>

          <div className="w-full p-3 bg-secondary/55 border border-border/60 rounded-xl">
            <p className="text-[10px] font-bold text-muted-foreground leading-normal">
              {confidenceScore >= 80 
                ? 'High confidence ranking. Pipeline indicators match historical data with minimal deal leakage.'
                : confidenceScore >= 60 
                  ? 'Moderate confidence. Elevated number of late-stage negotiation variables detected.'
                  : 'Low confidence ranking. High pipeline volatility or stalled deals detected.'}
            </p>
          </div>
        </div>
      </div>

      {/* Monthly Forecast Breakdown */}
      <div className="bg-card border border-border/85 rounded-2xl p-[var(--space-4)] shadow-sm hover:shadow-md hover:border-brand-purple/20 transition-all duration-300">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/40">
          <h3 className="font-bold text-foreground text-sm flex items-center">
            <Calendar className="h-4.5 w-4.5 mr-2 text-[var(--accent-color)]" />
            <span>Monthly Projections Distribution</span>
          </h3>
          <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[var(--accent-color)]/30" /> Expected
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[var(--accent-color)]/10" /> Best Case
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-0.5 h-3 bg-[var(--accent-color)]" /> Pipeline Target
            </span>
          </div>
        </div>

        <div className="space-y-5">
          {monthlyForecast.map((item, idx) => {
            const expVal = Math.round(item.expected * closeRateMultiplier);
            const bcVal = Math.round(item.bestCase * closeRateMultiplier);
            const isHovered = hoveredMonth === idx;

            return (
              <div 
                key={idx} 
                className={`space-y-2 p-2 rounded-xl transition-all duration-200 ${isHovered ? 'bg-secondary/40' : ''}`}
                onMouseEnter={() => setHoveredMonth(idx)}
                onMouseLeave={() => setHoveredMonth(null)}
              >
                <div className="flex justify-between items-center text-xs font-bold text-foreground">
                  <span className="font-bold text-foreground text-[11px]">{item.month}</span>
                  <span className="tabular-nums font-bold text-muted-foreground">
                    Expected: <span className="text-[var(--accent-color)]">₹{expVal.toLocaleString('en-IN')}</span> / Best Case: <span className="text-foreground">₹{bcVal.toLocaleString('en-IN')}</span>
                  </span>
                </div>
                
                <div className="relative h-7 w-full bg-secondary rounded-lg overflow-hidden flex items-center px-3 border border-border/45 shadow-inner">
                  {/* Best Case bar */}
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((bcVal / maxVal) * 100, 100)}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="absolute left-0 top-0 bottom-0 bg-[var(--accent-color)]/10 border-r border-border/60"
                  />
                  {/* Expected bar */}
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((expVal / maxVal) * 100, 100)}%` }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                    className="absolute left-0 top-0 bottom-0 bg-[var(--accent-color)]/25 border-r border-[var(--accent-color)]/40 shadow-sm"
                  />
                  {/* Pipeline line marker */}
                  <motion.div 
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="absolute top-0 bottom-0 w-0.75 bg-[var(--accent-color)] z-10 origin-bottom"
                    style={{ left: `${Math.min((item.pipeline / maxVal) * 100, 100)}%` }}
                  />
                  
                  <span className="z-20 text-[9px] font-extrabold text-foreground tabular-nums select-none tracking-wide">
                    Pipeline Cover: ₹{item.pipeline.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quarterly Forecast Grid */}
      <div className="bg-card border border-border/85 rounded-2xl p-[var(--space-4)] shadow-sm hover:shadow-md hover:border-brand-purple/20 transition-all duration-300">
        <h3 className="font-bold text-foreground text-sm flex items-center mb-4 pb-2 border-b border-border/40">
          <TrendingUp className="h-4.5 w-4.5 mr-2 text-[var(--accent-color)]" />
          <span>Quarterly Forecast Projections Matrix</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-border/60 text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
                <th className="py-3">Quarter</th>
                <th className="py-3 text-right">Quota Target</th>
                <th className="py-3 text-right">Expected Closed</th>
                <th className="py-3 text-right">Best Case Close</th>
                <th className="py-3 text-right">Open Pipeline</th>
                <th className="py-3 text-right">Target Achievement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-xs font-semibold text-foreground">
              {quarterlyForecast.map((item, idx) => {
                // Adjust committed based on close rate multiplier for the active tab
                const isCurrentTab = (idx === 0 && activeTab === 'Q3') || (idx === 1 && activeTab === 'Q4');
                const calculatedCommitted = isCurrentTab ? expectedRevenue : item.committed;
                const pct = Math.round((calculatedCommitted / item.quota) * 100);

                return (
                  <tr key={idx} className={`transition-colors duration-150 ${isCurrentTab ? 'bg-secondary/20 hover:bg-secondary/35' : 'hover:bg-secondary/15'}`}>
                    <td className="py-3.5 font-bold flex items-center gap-2">
                      {item.quarter}
                      {isCurrentTab && (
                        <span className="size-1.5 rounded-full bg-brand-purple animate-ping" />
                      )}
                    </td>
                    <td className="py-3.5 text-right tabular-nums">₹{item.quota.toLocaleString('en-IN')}</td>
                    <td className="py-3.5 text-right tabular-nums font-bold text-foreground">₹{calculatedCommitted.toLocaleString('en-IN')}</td>
                    <td className="py-3.5 text-right tabular-nums">₹{item.bestCase.toLocaleString('en-IN')}</td>
                    <td className="py-3.5 text-right tabular-nums text-muted-foreground">₹{item.pipeline.toLocaleString('en-IN')}</td>
                    <td className="py-3.5 text-right">
                      <span className={`border px-2.5 py-0.5 rounded-full font-bold tabular-nums text-[10px] ${
                        pct >= 110 
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                          : pct >= 90 
                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                            : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                      }`}>
                        {pct}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
