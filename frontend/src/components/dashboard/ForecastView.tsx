'use client';

import React, { useState } from 'react';
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

export default function ForecastView() {
  const [confidenceScore, setConfidenceScore] = useState(88);
  const expectedRevenue = 3450000;
  
  const monthlyForecast = [
    { month: "May 2025", expected: 1100000, bestCase: 1300000, pipeline: 1800000 },
    { month: "June 2025", expected: 1250000, bestCase: 1550000, pipeline: 2100000 },
    { month: "July 2025", expected: 1100000, bestCase: 1400000, pipeline: 1950000 }
  ];

  const quarterlyForecast = [
    { quarter: "Q3 2025", committed: 3450000, bestCase: 4250000, pipeline: 5850000, quota: 3000000 },
    { quarter: "Q4 2025", committed: 3900000, bestCase: 4800000, pipeline: 6500000, quota: 3500000 }
  ];

  const maxVal = 7000000;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-sans text-foreground tracking-tight font-bold">
          Sales Forecast
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground mt-1 font-medium tracking-wide">
          Projections of revenue targets and confidence tiers generated from active pipeline pipelines.
        </p>
      </div>

      {/* Headline Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Expected Revenue (Col 7) */}
        <div className="col-span-12 md:col-span-7 bg-card border border-border rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Expected Revenue</span>
              <h2 className="text-3xl font-bold text-foreground mt-1">₹{expectedRevenue.toLocaleString()}</h2>
            </div>
            <span className="text-[9px] font-semibold bg-brand-purple/10 text-brand-purple px-2 py-0.5 rounded uppercase tracking-wider">
              Q3 Projected
            </span>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
            Based on active deals, historical conversion rates, and representative quota velocity. The team is projected to exceed the base Q3 quota of ₹3,000,000 by 15%.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
            <div>
              <span className="text-[9px] font-bold text-muted-foreground uppercase">Best Case Pipeline</span>
              <p className="text-sm font-semibold text-foreground mt-0.5">₹4,250,000</p>
            </div>
            <div>
              <span className="text-[9px] font-bold text-muted-foreground uppercase">Active Pipe Coverage</span>
              <p className="text-sm font-semibold text-foreground mt-0.5">1.95x Target</p>
            </div>
          </div>
        </div>

        {/* Confidence Score Gauge (Col 5) */}
        <div className="col-span-12 md:col-span-5 bg-card border border-border rounded-2xl p-5 flex flex-col items-center justify-between text-center space-y-4">
          <div className="w-full flex justify-between items-center text-left">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">AI Confidence Score</span>
            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-pointer" />
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
              <span className="text-2xl font-semibold text-foreground tabular-nums">{confidenceScore}%</span>
              <span className="text-[9px] font-bold text-muted-foreground block uppercase tracking-wider">Reliability</span>
            </div>
          </div>

          <div className="w-full p-2.5 bg-secondary border border-border rounded-xl">
            <p className="text-[10px] font-bold text-muted-foreground">
              High confidence ranking. Data points match historical Q3 close rates with low deal churn.
            </p>
          </div>
        </div>
      </div>

      {/* Monthly Forecast Breakdown */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h3 className="font-semibold text-foreground text-sm flex items-center">
          <Calendar className="h-4.5 w-4.5 mr-2 text-brand-purple" />
          <span>Monthly Forecast Breakdown</span>
        </h3>

        <div className="space-y-4">
          {monthlyForecast.map((item, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-foreground">
                <span className="font-semibold">{item.month}</span>
                <span className="tabular-nums font-semibold text-foreground">
                  Expected: ₹{item.expected.toLocaleString()} / Max: ₹{item.bestCase.toLocaleString()}
                </span>
              </div>
              <div className="relative h-6 w-full bg-secondary rounded-lg overflow-hidden flex items-center px-2.5">
                {/* Expected bar */}
                <div 
                  className="absolute left-0 top-0 bottom-0 bg-brand-purple/35 border-r border-brand-accent/50 transition-all duration-300"
                  style={{ width: `${(item.expected / maxVal) * 100}%` }}
                />
                {/* Best Case bar */}
                <div 
                  className="absolute left-0 top-0 bottom-0 bg-brand-purple/10 border-r border-border transition-all duration-300"
                  style={{ width: `${(item.bestCase / maxVal) * 100}%` }}
                />
                {/* Pipeline line marker */}
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-brand-border-purple/80 z-10"
                  style={{ left: `${(item.pipeline / maxVal) * 100}%` }}
                  title={`Pipeline coverage: ₹${item.pipeline.toLocaleString()}`}
                />
                <span className="z-20 text-[9px] font-semibold text-foreground flex items-center">
                  Pipeline: ₹{item.pipeline.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quarterly Forecast Grid */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h3 className="font-semibold text-foreground text-sm flex items-center">
          <TrendingUp className="h-4.5 w-4.5 mr-2 text-brand-purple" />
          <span>Quarterly Projections Matrix</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-[10px] uppercase font-semibold text-foreground">
                <th className="py-2.5">Quarter</th>
                <th className="py-2.5 text-right">Quota Target</th>
                <th className="py-2.5 text-right">Expected Closed</th>
                <th className="py-2.5 text-right">Best Case Close</th>
                <th className="py-2.5 text-right">Open Pipeline</th>
                <th className="py-2.5 text-right">Target Achievement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs font-semibold text-foreground">
              {quarterlyForecast.map((item, idx) => {
                const pct = Math.round((item.committed / item.quota) * 100);
                return (
                  <tr key={idx} className="hover:bg-secondary transition-colors">
                    <td className="py-3 font-semibold">{item.quarter}</td>
                    <td className="py-3 text-right tabular-nums">₹{item.quota.toLocaleString()}</td>
                    <td className="py-3 text-right tabular-nums font-semibold text-foreground">₹{item.committed.toLocaleString()}</td>
                    <td className="py-3 text-right tabular-nums">₹{item.bestCase.toLocaleString()}</td>
                    <td className="py-3 text-right tabular-nums text-muted-foreground">₹{item.pipeline.toLocaleString()}</td>
                    <td className="py-3 text-right">
                      <span className="bg-brand-cyan/15 text-brand-cyan px-2 py-0.5 rounded font-semibold tabular-nums">
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

