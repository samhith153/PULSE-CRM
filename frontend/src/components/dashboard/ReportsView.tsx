'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  IndianRupee,
  Award,
  Target,
  Clock,
  Users,
  BarChart3,
  PieChart,
  Info,
  ArrowUpRight,
  Percent,
  Activity,
  Layers,
  ChevronDown,
  Lightbulb,
  Loader2,
} from 'lucide-react';
import { getAdminDashboard, asNumber, formatINR, formatNum, formatPct, AdminDashboardData } from '@/utils/api';

interface KPI {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  timeframe: string;
  icon: React.ComponentType<{ className?: string }>;
}

export default function ReportsView() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leaderboardMetric, setLeaderboardMetric] = useState<'revenue' | 'deals'>('revenue');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAdminDashboard()
      .then((d) => { if (!cancelled) { setData(d); setError(null); } })
      .catch((e) => { if (!cancelled) setError(e?.message || 'Failed to load reports'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400 text-xs font-semibold">
        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading reports…
      </div>
    );
  }

  if (error || !data) {
    return <div className="py-24 text-center text-rose-600 text-xs font-semibold">{error || 'No report data.'}</div>;
  }

  const s = data.summary;
  const totalLeads = asNumber(s.leads?.total);
  const converted = asNumber(s.leads?.converted);
  const lost = Math.max(0, totalLeads - converted);
  const winRate = asNumber(s.leads?.conversion_rate) || (totalLeads ? (converted / totalLeads) * 100 : 0);

  const kpis: KPI[] = [
    { title: 'Total Revenue Won', value: formatINR(s.revenue?.this_year), change: formatPct(asNumber(s.revenue?.growth_pct)), isPositive: asNumber(s.revenue?.growth_pct) >= 0, timeframe: 'this year', icon: IndianRupee },
    { title: 'New Leads Created', value: `${formatNum(totalLeads)} leads`, change: formatPct(asNumber(s.leads?.monthly_growth_pct)), isPositive: asNumber(s.leads?.monthly_growth_pct) >= 0, timeframe: 'vs last month', icon: Users },
    { title: 'Lead Conversion', value: `${winRate.toFixed(1)}%`, change: formatPct(winRate), isPositive: winRate >= 0, timeframe: 'overall', icon: Target },
    { title: 'Avg Sales Cycle', value: '—', change: 'live data n/a', isPositive: true, timeframe: 'from deals', icon: Clock },
  ];

  const funnelStages = data.lead_funnel?.length
    ? data.lead_funnel
    : [
        { stage: 'Leads', count: totalLeads, percentage: 100, conversion_rate: '100' },
        { stage: 'Converted', count: converted, percentage: totalLeads ? (converted / totalLeads) * 100 : 0, conversion_rate: totalLeads ? (converted / totalLeads) * 100 : 0 },
        { stage: 'Lost', count: lost, percentage: totalLeads ? (lost / totalLeads) * 100 : 0, conversion_rate: totalLeads ? (lost / totalLeads) * 100 : 0 },
      ];

  const reps = (data.top_sales_reps ?? []).map((r) => ({
    name: r.full_name,
    revenue: asNumber(r.revenue),
    revenueStr: formatINR(r.revenue),
    deals: asNumber(r.deals_closed),
    activities: 0,
  }));
  const maxRevenue = Math.max(1, ...reps.map((r) => r.revenue));
  const maxDeals = Math.max(1, ...reps.map((r) => r.deals));

  const totalConversion = winRate;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-sans text-brand-heading tracking-tight font-bold">
          Business Strategy Reports
        </h1>
        <p className="text-xs md:text-sm text-brand-text/75 mt-2 leading-relaxed max-w-2xl font-medium tracking-wide">
          Operational metrics pulled live from your organization's CRM data. Drill down into conversion funnels and revenue attribution.
        </p>
      </div>

      {/* 1. High-Level Summary Cards (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-white border border-brand-border-purple/20 rounded-xl p-4 shadow-sm/5 hover:shadow-md hover:-translate-y-0.5 hover:border-brand-border-purple/40 transition-all duration-300 flex flex-col justify-between min-h-[130px]"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold text-brand-heading uppercase tracking-wider truncate">
                    {kpi.title}
                  </span>
                  <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded self-start mt-1 leading-none ${kpi.isPositive ? 'text-emerald-700 bg-emerald-50 border border-emerald-100/50' : 'text-rose-700 bg-rose-50 border border-rose-100/50'}`}>
                    {kpi.change}
                  </span>
                </div>
                <div className="h-8 w-8 rounded-lg bg-brand-sidebar-hover/20 text-brand-heading flex items-center justify-center border border-brand-border-purple/20 shrink-0">
                  <Icon className="h-4.5 w-4.5" />
                </div>
              </div>
              <div className="mt-2.5">
                <span className="text-xl sm:text-2xl font-extrabold text-brand-text tracking-tight font-sans tabular-nums leading-none block">
                  {kpi.value}
                </span>
              </div>
              <div className="mt-2.5 pt-2.5 border-t border-slate-100 text-[9px] text-brand-text/60 font-semibold">
                {kpi.timeframe}
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Sales & Revenue Reports section */}
      <section className="space-y-6">
        <h2 className="text-sm font-extrabold text-brand-heading uppercase tracking-wider border-b border-brand-border-purple/15 pb-2 flex items-center gap-2">
          <TrendingUp className="h-4.5 w-4.5" />
          <span>📊 Sales & Revenue Reports</span>
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue by Rep (Bar) */}
          <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 lg:col-span-2 flex flex-col justify-between hover:border-brand-border-purple/40 hover:shadow-md transition-all duration-300">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-brand-heading text-sm">Revenue by Sales Rep</h3>
              <PieChart className="h-4.5 w-4.5 text-slate-400" />
            </div>

            <div className="space-y-4 mt-2">
              {reps.length === 0 && <p className="text-center text-slate-400 text-xs font-semibold py-6">No rep revenue data yet.</p>}
              {reps.map((rep, idx) => {
                const val = leaderboardMetric === 'revenue' ? rep.revenue : rep.deals;
                const max = leaderboardMetric === 'revenue' ? maxRevenue : maxDeals;
                const label = leaderboardMetric === 'revenue' ? rep.revenueStr : `${rep.deals} deals`;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-brand-text">
                      <span className="truncate max-w-[160px]">{rep.name}</span>
                      <span className="tabular-nums text-[10px] text-brand-heading font-extrabold">{label}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-accent rounded-full transition-all duration-300" style={{ width: `${(val / max) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lead Source / Funnel summary card */}
          <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 flex flex-col justify-between hover:border-brand-border-purple/40 hover:shadow-md transition-all duration-300">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-brand-heading text-sm">Funnel Summary</h3>
              <Info className="h-3.5 w-3.5 text-slate-400" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-[11px] font-bold text-brand-text/80"><span>Total Leads</span><span className="tabular-nums">{formatNum(totalLeads)}</span></div>
              <div className="flex justify-between text-[11px] font-bold text-brand-text/80"><span>Converted</span><span className="tabular-nums">{formatNum(converted)}</span></div>
              <div className="flex justify-between text-[11px] font-bold text-brand-text/80"><span>Won Deals</span><span className="tabular-nums">{converted}</span></div>
              <div className="flex justify-between text-[11px] font-bold text-brand-text/80"><span>Lost Deals</span><span className="tabular-nums">{lost}</span></div>
              <div className="pt-2 border-t border-slate-100 flex justify-between text-[11px] font-extrabold text-brand-heading"><span>Overall Win Rate</span><span className="tabular-nums">{winRate.toFixed(1)}%</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Activity & Pipeline Reports section */}
      <section className="space-y-6">
        <h2 className="text-sm font-extrabold text-brand-heading uppercase tracking-wider border-b border-brand-border-purple/15 pb-2 flex items-center gap-2">
          <Activity className="h-4.5 w-4.5" />
          <span>📈 Activity & Pipeline Reports</span>
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pipeline Conversion Funnel */}
          <div className="bg-white border border-brand-border-purple/20 rounded-xl p-6 shadow-sm/5 lg:col-span-2 hover:border-brand-border-purple/40 hover:shadow-md transition-all duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-extrabold text-brand-heading text-base">Pipeline Conversion Funnel</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Stage-by-stage progression and conversion efficiency</p>
              </div>
              <div className="flex items-center space-x-4 bg-slate-50 border border-slate-200/80 px-4 py-2 rounded-xl">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Conversion</span>
                  <span className="text-xs text-slate-600 font-semibold">{converted} of {formatNum(totalLeads)} Converted</span>
                </div>
                <div className="text-right pl-3 border-l border-slate-200">
                  <span className="text-lg font-black text-indigo-600 block leading-none">{totalConversion.toFixed(1)}%</span>
                  <span className="text-[9px] font-bold text-emerald-600">Live</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {funnelStages.map((stage, idx) => (
                <div key={idx} className="bg-slate-50/80 border border-slate-200/70 rounded-xl p-3 flex flex-col justify-between space-y-3 hover:border-indigo-200 hover:bg-white transition-all shadow-2xs min-h-[90px]">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0 bg-brand-accent" />
                      <span className="text-[9.5px] font-bold text-slate-400">Step {idx + 1}</span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-900 leading-snug tracking-tight block">{stage.stage}</span>
                  </div>
                  <div>
                    <div className="flex items-baseline justify-between pt-1">
                      <span className="text-xs font-extrabold text-slate-900 tabular-nums">{asNumber(stage.count)} deals</span>
                      <span className="text-[9.5px] font-extrabold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 tabular-nums">{asNumber(stage.percentage).toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200/70 rounded-full overflow-hidden mt-1.5">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${asNumber(stage.percentage)}%`, backgroundColor: '#7c3aed' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team Leaderboard */}
          <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 flex flex-col justify-between hover:border-brand-border-purple/40 hover:shadow-md transition-all duration-300">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-brand-heading text-sm">Team Leaderboard</h3>
                <div className="flex space-x-1 p-0.5 bg-slate-100 rounded-lg text-[9px] font-extrabold uppercase">
                  <button onClick={() => setLeaderboardMetric('revenue')} className={`px-2 py-0.5 rounded cursor-pointer ${leaderboardMetric === 'revenue' ? 'bg-white text-brand-heading shadow-sm' : 'text-slate-400'}`}>Rev</button>
                  <button onClick={() => setLeaderboardMetric('deals')} className={`px-2 py-0.5 rounded cursor-pointer ${leaderboardMetric === 'deals' ? 'bg-white text-brand-heading shadow-sm' : 'text-slate-400'}`}>Deals</button>
                </div>
              </div>

              <div className="space-y-3.5 mt-4">
                {reps.length === 0 && <p className="text-center text-slate-400 text-xs font-semibold py-6">No leaderboard data yet.</p>}
                {reps.map((rep, idx) => {
                  const val = leaderboardMetric === 'revenue' ? rep.revenue : rep.deals;
                  const max = leaderboardMetric === 'revenue' ? maxRevenue : maxDeals;
                  const label = leaderboardMetric === 'revenue' ? rep.revenueStr : `${rep.deals} deals`;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-brand-text">
                        <span className="truncate max-w-[140px]">{rep.name}</span>
                        <span className="tabular-nums text-[10px] text-brand-heading font-extrabold">{label}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-accent rounded-full transition-all duration-300" style={{ width: `${(val / max) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-center">
              <span className="text-[10px] font-bold text-slate-400">Live from top sales reps</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
