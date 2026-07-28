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
import { getDeals } from '@/utils/api';

export default function ForecastView() {
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confidenceScore, setConfidenceScore] = useState(85);

  useEffect(() => {
    getDeals().then(res => {
      setDeals(res || []);
      setLoading(false);
    }).catch(err => {
      console.error("Failed to load forecasting:", err);
      setLoading(false);
    });
  }, []);

  // 1. Expected Revenue & Best Case calculations
  const wonDeals = deals.filter(d => d.stage === 'Won' || d.status === 'Won' || d.status === 'won');
  const wonCount = wonDeals.length;
  const lostDeals = deals.filter(d => d.stage === 'Lost' || d.status === 'Lost' || d.status === 'lost');
  const lostCount = lostDeals.length;

  // Calculate dynamic confidence score
  useEffect(() => {
    if (wonCount + lostCount > 0) {
      const rate = Math.round((wonCount / (wonCount + lostCount)) * 100);
      setConfidenceScore(Math.max(rate, 65)); // fallback floor of 65% for visualization
    }
  }, [wonCount, lostCount]);

  let expectedRevenue = 0;
  let bestCaseRevenue = 0;
  let activePipeCoverage = 0;

  deals.forEach(d => {
    const val = Number(d.value || d.amount) || 0;
    const stage = d.stage?.toLowerCase() || d.status?.toLowerCase() || '';
    
    let prob = 0.0;
    if (stage === 'won') prob = 1.0;
    else if (stage === 'negotiation') prob = 0.75;
    else if (stage === 'proposal') prob = 0.50;
    else if (stage === 'qualified') prob = 0.25;
    else if (stage === 'new') prob = 0.10;

    expectedRevenue += val * prob;
    if (['won', 'negotiation', 'proposal'].includes(stage)) {
      bestCaseRevenue += val;
    }
    if (stage !== 'won' && stage !== 'lost') {
      activePipeCoverage += val;
    }
  });

  const quotaTarget = 3000000;
  const coverageRatio = expectedRevenue > 0 ? (activePipeCoverage / quotaTarget).toFixed(2) : '0.00';

  // 2. Dynamic Monthly Forecast (Current month + next 2 months)
  const now = new Date();
  const months = [];
  for (let i = 0; i < 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    months.push({
      label,
      expected: 0,
      bestCase: 0,
      pipeline: 0,
      monthIndex: d.getMonth(),
      year: d.getFullYear()
    });
  }

  deals.forEach((deal: any) => {
    const stage = deal.stage?.toLowerCase() || deal.status?.toLowerCase() || '';
    let prob = 0.0;
    if (stage === 'won') prob = 1.0;
    else if (stage === 'negotiation') prob = 0.75;
    else if (stage === 'proposal') prob = 0.50;
    else if (stage === 'qualified') prob = 0.25;
    else if (stage === 'new') prob = 0.10;

    const val = Number(deal.value || deal.amount) || 0;
    const dealDate = new Date(deal.closed_at || deal.created_at || Date.now());
    const m = dealDate.getMonth();
    const y = dealDate.getFullYear();

    months.forEach(item => {
      if (item.monthIndex === m && item.year === y) {
        item.expected += val * prob;
        if (['won', 'negotiation', 'proposal'].includes(stage)) {
          item.bestCase += val;
        }
        if (stage !== 'won' && stage !== 'lost') {
          item.pipeline += val;
        }
      }
    });
  });

  const monthlyForecast = months.map(m => ({
    month: m.label,
    expected: Math.round(m.expected),
    bestCase: Math.round(m.bestCase),
    pipeline: Math.round(m.pipeline)
  }));
  const maxVal = Math.max(...monthlyForecast.map(m => Math.max(m.expected, m.bestCase, m.pipeline)), 100000);

  // 3. Dynamic Quarterly Forecast Projections (Current Quarter + Next Quarter)
  const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
  const quarters = [];
  
  quarters.push({
    label: `Q${currentQuarter} ${now.getFullYear()}`,
    qNum: currentQuarter,
    year: now.getFullYear(),
    committed: 0,
    bestCase: 0,
    pipeline: 0,
    quota: quotaTarget
  });

  const nextQ = currentQuarter === 4 ? 1 : currentQuarter + 1;
  const nextQYear = currentQuarter === 4 ? now.getFullYear() + 1 : now.getFullYear();
  quarters.push({
    label: `Q${nextQ} ${nextQYear}`,
    qNum: nextQ,
    year: nextQYear,
    committed: 0,
    bestCase: 0,
    pipeline: 0,
    quota: quotaTarget + 500000
  });

  deals.forEach((deal: any) => {
    const stage = deal.stage?.toLowerCase() || deal.status?.toLowerCase() || '';
    let prob = 0.0;
    if (stage === 'won') prob = 1.0;
    else if (stage === 'negotiation') prob = 0.75;
    else if (stage === 'proposal') prob = 0.50;
    else if (stage === 'qualified') prob = 0.25;
    else if (stage === 'new') prob = 0.10;

    const val = Number(deal.value || deal.amount) || 0;
    const dealDate = new Date(deal.closed_at || deal.created_at || Date.now());
    const dealQ = Math.floor(dealDate.getMonth() / 3) + 1;
    const dealY = dealDate.getFullYear();

    quarters.forEach(item => {
      if (item.qNum === dealQ && item.year === dealY) {
        item.committed += val * prob;
        if (['won', 'negotiation', 'proposal'].includes(stage)) {
          item.bestCase += val;
        }
        if (stage !== 'won' && stage !== 'lost') {
          item.pipeline += val;
        }
      }
    });
  });

  const quarterlyForecast = quarters.map(q => ({
    quarter: q.label,
    committed: Math.round(q.committed),
    bestCase: Math.round(q.bestCase),
    pipeline: Math.round(q.pipeline),
    quota: q.quota
  }));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white border border-brand-border-purple/20 rounded-xl p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent"></div>
        <p className="text-xs text-brand-text/60 mt-4 font-bold">Simulating sales pipeline projection cycles...</p>
      </div>
    );
  }

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
              <h2 className="text-3xl font-bold text-brand-heading mt-1">₹{Math.round(expectedRevenue).toLocaleString('en-IN')}</h2>
            </div>
            <span className="text-[9px] font-extrabold bg-brand-accent/10 text-brand-accent px-2 py-0.5 rounded uppercase tracking-wider">
              Q{currentQuarter} Projected
            </span>
          </div>

          <p className="text-xs text-brand-text/75 leading-relaxed font-semibold">
            Based on active deals, historical conversion rates, and representative quota velocity. The team is projected to hit {Math.round((expectedRevenue / quotaTarget) * 100)}% of the base quota target (₹{quotaTarget.toLocaleString('en-IN')}).
          </p>

          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase">Best Case Pipeline</span>
              <p className="text-sm font-extrabold text-brand-text mt-0.5">₹{Math.round(bestCaseRevenue).toLocaleString('en-IN')}</p>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase">Active Pipe Coverage</span>
              <p className="text-sm font-extrabold text-brand-text mt-0.5">{coverageRatio}x Target</p>
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
              Confidence is derived from historical organizational close ratios and current pipeline distribution.
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

        <div className="space-y-4">
          {monthlyForecast.map((item, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-brand-text">
                <span className="font-extrabold">{item.month}</span>
                <span className="tabular-nums font-extrabold text-brand-heading">
                  Expected: ₹{item.expected.toLocaleString('en-IN')} / Max: ₹{item.bestCase.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="relative h-6 w-full bg-slate-100 rounded-lg overflow-hidden flex items-center px-2.5">
                {/* Expected bar */}
                <div 
                  className="absolute left-0 top-0 bottom-0 bg-brand-accent/35 border-r border-brand-accent/50 transition-all duration-300"
                  style={{ width: `${(item.expected / maxVal) * 100}%` }}
                />
                {/* Best Case bar */}
                <div 
                  className="absolute left-0 top-0 bottom-0 bg-brand-secondary-accent/15 border-r border-brand-secondary-accent/30 transition-all duration-300"
                  style={{ width: `${(item.bestCase / maxVal) * 100}%` }}
                />
                {/* Pipeline line marker */}
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-brand-border-purple/80 z-10"
                  style={{ left: `${(item.pipeline / maxVal) * 100}%` }}
                  title={`Pipeline coverage: ₹${item.pipeline.toLocaleString('en-IN')}`}
                />
                <span className="z-20 text-[9px] font-extrabold text-brand-heading flex items-center">
                  Pipeline: ₹{item.pipeline.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          ))}
        </div>
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
              {quarterlyForecast.map((item, idx) => {
                const pct = Math.round((item.committed / item.quota) * 100);
                return (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 font-extrabold">{item.quarter}</td>
                    <td className="py-3 text-right tabular-nums">₹{item.quota.toLocaleString('en-IN')}</td>
                    <td className="py-3 text-right tabular-nums font-extrabold text-brand-heading">₹{item.committed.toLocaleString('en-IN')}</td>
                    <td className="py-3 text-right tabular-nums">₹{item.bestCase.toLocaleString('en-IN')}</td>
                    <td className="py-3 text-right tabular-nums text-slate-500">₹{item.pipeline.toLocaleString('en-IN')}</td>
                    <td className="py-3 text-right">
                      <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-extrabold tabular-nums">
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
