'use client';

import React, { useEffect, useState } from 'react';
import {
  IndianRupee, Award, Target, UserCheck, Clock,
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Mail, Phone, Calendar, CheckSquare, StickyNote,
  BarChart3, PieChart, Activity, Users, FileText,
  Zap, Briefcase, AlertTriangle, Flame,
} from 'lucide-react';
import { getSalesRepDashboard, SalesRepDashboardData, asNumber, formatINR, formatPct } from '@/utils/api';

interface Props {
  onLoaded?: () => void;
  onTabChange?: (tab: string) => void;
  timeFilter?: string;
}

const STAGE_COLORS: Record<string, string> = {
  'New Lead': '#6366f1',
  'Contacted': '#f59e0b',
  'Qualified': '#10b981',
  'Proposal Sent': '#3b82f6',
  'Negotiation': '#8b5cf6',
  'Closed Won': '#22c55e',
  'Closed Lost': '#ef4444',
};

export default function SalesRepDashboardView({ onLoaded, onTabChange, timeFilter = 'month' }: Props) {
  const [data, setData] = useState<SalesRepDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const period = timeFilter === 'all' ? 'quarter' : (timeFilter as 'week' | 'month' | 'quarter' | 'year');
    getSalesRepDashboard(period)
      .then((d) => { if (!cancelled) { setData(d); setError(null); } })
      .catch((e) => { if (!cancelled) setError(e?.message || 'Failed to load dashboard'); })
      .finally(() => { if (!cancelled) { setLoading(false); onLoaded?.(); } });
    return () => { cancelled = true; };
  }, [timeFilter, onLoaded]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white border border-brand-border-purple/15 rounded-xl p-5 h-32" />
          ))}
        </div>
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8 bg-white border border-brand-border-purple/15 rounded-xl h-80" />
          <div className="col-span-12 lg:col-span-4 bg-white border border-brand-border-purple/15 rounded-xl h-80" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white border border-brand-border-purple/20 rounded-xl p-10 text-center">
        <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto mb-3" />
        <p className="text-sm font-bold text-brand-heading">{error || 'No data available'}</p>
        <p className="text-xs text-slate-400 mt-1">Try changing the date range or refreshing.</p>
      </div>
    );
  }

  const s = data.summary;
  const rev = data.revenue_stat;
  const won = data.won_deals_stat;
  const win = data.win_rate_stat;
  const avgDeal = data.avg_deal_size_stat;
  const cycle = data.avg_sales_cycle_stat;
  const km = data.key_metrics;
  const ao = data.activity_overview;

  const kpis = [
    { label: 'Total Revenue', value: formatINR(rev.total), change: asNumber(rev.growth_pct), icon: IndianRupee, color: 'text-emerald-600' },
    { label: 'Won Deals', value: String(won.count), change: asNumber(won.growth_pct), icon: Award, color: 'text-blue-600' },
    { label: 'Win Rate', value: `${asNumber(win.win_rate).toFixed(1)}%`, change: asNumber(win.growth_pct), icon: Target, color: 'text-purple-600' },
    { label: 'Avg Deal Size', value: formatINR(avgDeal.avg_deal_value), change: asNumber(avgDeal.growth_pct), icon: UserCheck, color: 'text-amber-600' },
    { label: 'Sales Cycle', value: `${Math.round(asNumber(cycle.avg_days))}d`, change: -asNumber(cycle.difference_days), icon: Clock, color: 'text-rose-600' },
  ];

  const activities = [
    { label: 'Emails', value: ao.emails_sent, growth: asNumber(ao.emails_growth_pct), icon: Mail, color: 'bg-blue-50 text-blue-600' },
    { label: 'Calls', value: ao.calls_made, growth: asNumber(ao.calls_growth_pct), icon: Phone, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Meetings', value: ao.meetings_held, growth: asNumber(ao.meetings_growth_pct), icon: Calendar, color: 'bg-purple-50 text-purple-600' },
    { label: 'Tasks', value: ao.tasks_completed, growth: asNumber(ao.tasks_growth_pct), icon: CheckSquare, color: 'bg-amber-50 text-amber-600' },
    { label: 'Notes', value: ao.notes_added, growth: 0, icon: StickyNote, color: 'bg-slate-100 text-slate-600' },
  ];

  const maxRevenue = Math.max(...data.revenue_trend.map((p) => asNumber(p.revenue)), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-sans text-brand-heading tracking-tight font-bold">
            My Dashboard
          </h1>
          <p className="text-xs md:text-sm text-brand-text/75 mt-2 leading-relaxed max-w-2xl font-medium tracking-wide">
            Your personal sales performance overview with real-time KPIs and activity metrics.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-5">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          const positive = kpi.change >= 0;
          return (
            <div key={i} className="bg-white border border-brand-border-purple/20 rounded-xl p-4 shadow-sm/5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-brand-heading uppercase tracking-wider">{kpi.label}</span>
                <div className={`h-7 w-7 rounded-lg flex items-center justify-center border border-brand-border-purple/20 ${kpi.color} bg-white`}>
                  <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                </div>
              </div>
              <div className="mt-2.5">
                <span className="text-xl font-extrabold text-brand-text tracking-tight tabular-nums">{kpi.value}</span>
              </div>
              <div className="mt-2 pt-2 border-t border-brand-border-purple/10 flex items-center gap-1">
                {positive ? <ArrowUpRight className="h-3 w-3 text-emerald-500" /> : <ArrowDownRight className="h-3 w-3 text-rose-500" />}
                <span className={`text-[10px] font-bold ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatPct(kpi.change)}
                </span>
                <span className="text-[9px] text-slate-400 font-semibold">vs prev period</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Revenue Trend */}
        <div className="col-span-12 lg:col-span-8 bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-brand-heading text-sm flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-brand-accent" />
              Revenue Trend
            </h3>
            <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">12 months</span>
          </div>
          {data.revenue_trend.length > 0 ? (
            <div className="h-56">
              <svg className="w-full h-full" viewBox={`0 0 ${data.revenue_trend.length * 60} 220`} preserveAspectRatio="none">
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {data.revenue_trend.map((p, i) => {
                  const x = i * 60 + 30;
                  const h = (asNumber(p.revenue) / maxRevenue) * 180;
                  return (
                    <g key={i}>
                      <rect x={x - 14} y={200 - h} width={28} height={h} rx={4} fill="#6366f1" opacity={0.85} />
                      <text x={x} y={215} textAnchor="middle" className="fill-slate-400" fontSize={9} fontWeight={600}>
                        {p.period.slice(0, 3)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-xs text-slate-400">No revenue data</div>
          )}
        </div>

        {/* Key Metrics */}
        <div className="col-span-12 lg:col-span-4 bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5">
          <h3 className="font-extrabold text-brand-heading text-sm mb-4 flex items-center">
            <Zap className="h-4 w-4 mr-2 text-brand-accent" />
            Key Metrics
          </h3>
          <div className="space-y-3.5">
            {[
              { label: 'Open Deals', value: km.open_deals, icon: Briefcase, color: 'text-blue-600' },
              { label: 'Pipeline Value', value: formatINR(km.pipeline_value), icon: IndianRupee, color: 'text-emerald-600' },
              { label: 'Deals Created', value: km.deals_created, icon: TrendingUp, color: 'text-purple-600' },
              { label: 'Deals Lost', value: km.deals_lost, icon: AlertTriangle, color: 'text-rose-600' },
              { label: 'Activities Logged', value: km.activities_logged, icon: Activity, color: 'text-amber-600' },
            ].map((m, i) => {
              const Icon = m.icon;
              return (
                <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50/80 rounded-lg border border-brand-border-purple/10">
                  <div className="flex items-center gap-2.5">
                    <div className={`h-7 w-7 rounded-md flex items-center justify-center ${m.color} bg-white border border-brand-border-purple/15`}>
                      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </div>
                    <span className="text-[11px] font-bold text-brand-heading">{m.label}</span>
                  </div>
                  <span className="text-sm font-extrabold text-brand-text tabular-nums">{m.value}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Deals by Stage */}
        <div className="col-span-12 lg:col-span-6 bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5">
          <h3 className="font-extrabold text-brand-heading text-sm mb-4 flex items-center">
            <BarChart3 className="h-4 w-4 mr-2 text-brand-accent" />
            Deals by Stage
          </h3>
          {data.deals_by_stage.length > 0 ? (
            <div className="space-y-3">
              {data.deals_by_stage.map((d, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-brand-heading">{d.stage}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-500">{d.count} deals</span>
                      <span className="text-[10px] font-bold text-brand-accent">{asNumber(d.percentage).toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${asNumber(d.percentage)}%`, backgroundColor: STAGE_COLORS[d.stage] || '#6366f1' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-xs text-slate-400">No stage data</div>
          )}
        </div>

        {/* Deals by Source */}
        <div className="col-span-12 lg:col-span-6 bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5">
          <h3 className="font-extrabold text-brand-heading text-sm mb-4 flex items-center">
            <PieChart className="h-4 w-4 mr-2 text-brand-accent" />
            Deals by Source
          </h3>
          {data.deals_by_source.length > 0 ? (
            <div className="space-y-3">
              {data.deals_by_source.map((d, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50/80 rounded-lg border border-brand-border-purple/10">
                  <div className="flex items-center gap-2.5">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ['#6366f1', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'][i % 5] }} />
                    <span className="text-[11px] font-bold text-brand-heading">{d.source}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-slate-500">{d.count} deals</span>
                    <span className="text-xs font-extrabold text-brand-text tabular-nums">{formatINR(d.revenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-xs text-slate-400">No source data</div>
          )}
        </div>

        {/* Activity Overview */}
        <div className="col-span-12 lg:col-span-5 bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5">
          <h3 className="font-extrabold text-brand-heading text-sm mb-4 flex items-center">
            <Activity className="h-4 w-4 mr-2 text-brand-accent" />
            Activity Overview
          </h3>
          <div className="space-y-3">
            {activities.map((a, i) => {
              const Icon = a.icon;
              const positive = a.growth >= 0;
              return (
                <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50/80 rounded-lg border border-brand-border-purple/10">
                  <div className="flex items-center gap-2.5">
                    <div className={`h-7 w-7 rounded-md flex items-center justify-center ${a.color} border border-brand-border-purple/15`}>
                      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </div>
                    <span className="text-[11px] font-bold text-brand-heading">{a.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-brand-text tabular-nums">{a.value}</span>
                    {a.growth !== 0 && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${positive ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}`}>
                        {positive ? '+' : ''}{a.growth.toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity Heatmap */}
        <div className="col-span-12 lg:col-span-7 bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5">
          <h3 className="font-extrabold text-brand-heading text-sm mb-4 flex items-center">
            <Flame className="h-4 w-4 mr-2 text-brand-accent" />
            Activity Heatmap
            <span className="ml-2 text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">90 days</span>
          </h3>
          {data.activity_heatmap.length > 0 ? (
            <div className="flex flex-wrap gap-[3px]">
              {(() => {
                const dateMap = new Map<string, number>();
                data.activity_heatmap.forEach((h) => {
                  dateMap.set(h.date, (dateMap.get(h.date) || 0) + h.count);
                });
                const maxCount = Math.max(...Array.from(dateMap.values()), 1);
                const cells: React.ReactNode[] = [];
                const now = new Date();
                for (let i = 89; i >= 0; i--) {
                  const d = new Date(now);
                  d.setDate(d.getDate() - i);
                  const key = d.toISOString().slice(0, 10);
                  const count = dateMap.get(key) || 0;
                  const intensity = count === 0 ? 'bg-slate-100' : count / maxCount < 0.33 ? 'bg-indigo-200' : count / maxCount < 0.66 ? 'bg-indigo-400' : 'bg-indigo-600';
                  cells.push(
                    <div
                      key={key}
                      className={`w-3 h-3 rounded-[2px] ${intensity} transition-colors`}
                      title={`${key}: ${count} activities`}
                    />
                  );
                }
                return cells;
              })()}
            </div>
          ) : (
            <div className="h-24 flex items-center justify-center text-xs text-slate-400">No heatmap data</div>
          )}
        </div>

        {/* Team Performance */}
        {data.team_performance.length > 0 && (
          <div className="col-span-12 bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5">
            <h3 className="font-extrabold text-brand-heading text-sm mb-4 flex items-center">
              <Users className="h-4 w-4 mr-2 text-brand-accent" />
              Team Performance
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-brand-border-purple/15">
                    <th className="pb-2 text-[10px] font-extrabold text-brand-heading uppercase tracking-wider">Rep</th>
                    <th className="pb-2 text-[10px] font-extrabold text-brand-heading uppercase tracking-wider text-right">Revenue</th>
                    <th className="pb-2 text-[10px] font-extrabold text-brand-heading uppercase tracking-wider text-right">Won Deals</th>
                    <th className="pb-2 text-[10px] font-extrabold text-brand-heading uppercase tracking-wider text-right">Win Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {data.team_performance.map((row, i) => (
                    <tr key={i} className="border-b border-brand-border-purple/5 last:border-0 hover:bg-slate-50/50 transition-colors">
                      <td className="py-2.5 text-[11px] font-bold text-brand-heading">{row.full_name}</td>
                      <td className="py-2.5 text-[11px] font-extrabold text-brand-text text-right tabular-nums">{formatINR(row.revenue)}</td>
                      <td className="py-2.5 text-[11px] font-bold text-brand-text text-right tabular-nums">{row.won_deals}</td>
                      <td className="py-2.5 text-[11px] font-bold text-right tabular-nums">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${asNumber(row.win_rate) >= 50 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                          {asNumber(row.win_rate).toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recent Reports */}
        {data.recent_reports.length > 0 && (
          <div className="col-span-12 lg:col-span-6 bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5">
            <h3 className="font-extrabold text-brand-heading text-sm mb-4 flex items-center">
              <FileText className="h-4 w-4 mr-2 text-brand-accent" />
              Recent Reports
            </h3>
            <div className="space-y-2.5">
              {data.recent_reports.map((r, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50/80 rounded-lg border border-brand-border-purple/10">
                  <div>
                    <p className="text-[11px] font-bold text-brand-heading">{r.report_name}</p>
                    <p className="text-[9px] text-slate-400 font-semibold mt-0.5">
                      {r.report_type} {r.created_by ? `by ${r.created_by}` : ''} &middot; {new Date(r.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Report Templates */}
        {data.report_templates.length > 0 && (
          <div className="col-span-12 lg:col-span-6 bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5">
            <h3 className="font-extrabold text-brand-heading text-sm mb-4 flex items-center">
              <BarChart3 className="h-4 w-4 mr-2 text-brand-accent" />
              Report Templates
            </h3>
            <div className="space-y-2.5">
              {data.report_templates.map((t, i) => (
                <div key={i} className="p-2.5 bg-slate-50/80 rounded-lg border border-brand-border-purple/10">
                  <p className="text-[11px] font-bold text-brand-heading">{t.name}</p>
                  <p className="text-[9px] text-slate-400 font-semibold mt-0.5">{t.description}</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {t.primary_metrics.slice(0, 3).map((m, j) => (
                      <span key={j} className="text-[8px] font-bold bg-brand-accent/10 text-brand-accent px-1.5 py-0.5 rounded-full">{m}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
