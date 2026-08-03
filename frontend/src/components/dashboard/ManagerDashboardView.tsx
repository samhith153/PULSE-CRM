'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Target,
  AlertTriangle,
  Users,
  ArrowUpRight,
  Activity,
  BellRing,
  ShieldAlert,
  Sparkles,
  Award,
  BarChart3,
  Layers,
  Calendar,
  Clock,
  ArrowRight,
  TrendingDown,
  Info,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { getManagerDashboard, asNumber, formatINR, formatNum, formatPct, ManagerDashboardData } from '@/utils/api';

interface ManagerDashboardViewProps {
  onTabChange?: (tab: string) => void;
  onLoaded?: () => void;
}

export default function ManagerDashboardView({ onTabChange, onLoaded }: ManagerDashboardViewProps) {
  const [data, setData] = useState<ManagerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredQuotaIdx, setHoveredQuotaIdx] = useState<number | null>(null);
  const [hoveredMonthIdx, setHoveredMonthIdx] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getManagerDashboard()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load manager dashboard');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
        onLoaded?.();
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-9 w-72 bg-slate-100 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border rounded-2xl p-5 h-32 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white border rounded-2xl p-5 h-72 animate-pulse" />
          <div className="lg:col-span-5 bg-white border rounded-2xl p-5 h-72 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-rose-700">
        <p className="font-bold">Couldn’t load manager dashboard</p>
        <p className="text-sm mt-1">{error ?? 'No data returned.'}</p>
      </div>
    );
  }

  const s = data.summary;
  const revenueStats = data.revenue_stats;
  const forecast = data.forecast;
  const pipeline = data.pipeline_health;
  const leaderboards = data.rep_quota_attainment
    .slice()
    .sort((a, b) => a.rank - b.rank)
    .map((rep) => ({
      rank: rep.rank,
      name: rep.full_name,
      won: asNumber(rep.revenue_generated),
      target: asNumber(rep.assigned_target),
      wonFormatted: formatINR(rep.revenue_generated),
      targetFormatted: formatINR(rep.assigned_target),
      deals: 0,
      progress: Math.round(asNumber(rep.quota_achievement_pct)),
      avatar: '',
    }));
  const pipelineStages = pipeline.stage_distribution.map((stage, i) => ({
    name: stage.stage,
    value: formatINR(stage.total_value),
    count: stage.deal_count,
    pct: Math.max(Math.round(asNumber(stage.percentage)), 4),
    color: ['bg-purple-600', 'bg-indigo-500', 'bg-blue-500', 'bg-sky-500', 'bg-emerald-500', 'bg-teal-500'][i % 6],
    textColor: ['text-purple-600', 'text-indigo-500', 'text-blue-500', 'text-sky-500', 'text-emerald-500', 'text-teal-500'][i % 6],
    lightBg: ['bg-purple-50', 'bg-indigo-50', 'bg-blue-50', 'bg-sky-50', 'bg-emerald-50', 'bg-teal-50'][i % 6],
  }));

  const monthlyForecast = data.monthly_revenue_trend.map((m, i) => ({
    month: m.month,
    actual: asNumber(m.revenue) / 1_00_000,
    target: asNumber(m.target) / 1_00_000,
    x: 50 + i * 100,
    y: 130 - (asNumber(m.revenue) / Math.max(...data.monthly_revenue_trend.map((x) => asNumber(x.revenue)), 1)) * 110,
  }));

  const riskDeals = data.deals_at_risk.map((d) => ({
    id: d.deal_id,
    title: d.deal_name,
    company: d.company ?? '—',
    value: formatINR(d.deal_value),
    rep: d.owner_name ?? 'Unassigned',
    risk: d.risk_reason,
    avatar: '',
  }));

  const alerts = data.alerts.map((a, i) => ({
    id: i + 1,
    text: a.message,
    type: a.severity,
    time: new Date(a.timestamp).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
  }));

  const activities = data.recent_activities.map((a) => ({
    time: new Date(a.created_at).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    actor: a.title,
    action: a.action,
    avatar: '',
  }));

  const avgQuota = leaderboards.length
    ? Math.round(leaderboards.reduce((s, l) => s + l.progress, 0) / leaderboards.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-brand-accent/5 to-brand-secondary-accent/15 border border-brand-border-purple/30 rounded-2xl p-6 shadow-sm/5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 h-40 w-40 bg-brand-accent/5 rounded-full filter blur-2xl pointer-events-none" />
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 rounded-2xl bg-brand-accent flex items-center justify-center text-white shrink-0 shadow-md">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-3xl font-sans text-brand-heading tracking-tight font-extrabold">Sales Operations Hub</h1>
              <span className="flex items-center h-2 w-2 rounded-full bg-emerald-500 animate-pulse mt-1" title="Live" />
            </div>
            <p className="text-xs md:text-sm text-brand-text/75 mt-1 font-medium tracking-wide">
              Team is at {formatPct(s.quota_achievement)} quota completion across {s.team_members} members.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 shrink-0 self-start md:self-auto bg-white/60 backdrop-blur-md border border-brand-border-purple/20 px-3.5 py-2 rounded-xl text-xs font-bold text-brand-text/80 shadow-sm/5">
          <Calendar className="h-4 w-4 text-brand-accent mr-1.5" />
          <span className="tabular-nums">Current Period</span>
        </div>
      </div>

      {/* KPI Core Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-brand-border-purple/20 border-l-4 border-l-emerald-500 rounded-2xl p-5 shadow-sm/5 flex flex-col justify-between min-h-[135px] hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-extrabold text-brand-text/60 uppercase tracking-wider">Team Revenue Won</span>
            <span className="text-[9px] font-extrabold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100/50 tabular-nums">
              {formatPct(revenueStats.monthly_growth_pct)}
            </span>
          </div>
          <div className="mt-2.5">
            <h4 className="text-2xl font-black text-brand-heading">{formatINR(revenueStats.team_revenue_won)}</h4>
            <p className="text-[9px] text-slate-450 mt-1 font-bold">Target Quota: {formatINR(revenueStats.team_target)}</p>
          </div>
          <div className="mt-3">
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(asNumber(revenueStats.achievement_pct), 100)}%` }} />
            </div>
            <div className="flex justify-between text-[8px] font-extrabold text-slate-400 mt-1 uppercase">
              <span>Progress</span>
              <span>{Math.round(asNumber(revenueStats.achievement_pct))}% achieved</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-brand-border-purple/20 border-l-4 border-l-brand-accent rounded-2xl p-5 shadow-sm/5 flex flex-col justify-between min-h-[135px] hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-extrabold text-brand-text/60 uppercase tracking-wider">Forecast Projection</span>
            <Target className="h-4 w-4 text-brand-accent" />
          </div>
          <div className="mt-2.5">
            <h4 className="text-2xl font-black text-brand-heading">{formatINR(forecast.projected_revenue)}</h4>
            <p className="text-[9px] text-slate-450 mt-1 font-bold">Confidence {Math.round(asNumber(forecast.confidence_score))}% · Accuracy {Math.round(asNumber(forecast.forecast_accuracy))}%</p>
          </div>
          <div className="mt-3">
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-brand-accent rounded-full" style={{ width: `${Math.min(asNumber(forecast.confidence_score), 100)}%` }} />
            </div>
            <div className="flex justify-between text-[8px] font-extrabold text-slate-400 mt-1 uppercase">
              <span>Weighted Projection</span>
              <span>{Math.round(asNumber(forecast.confidence_score))}% accuracy</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-brand-border-purple/20 border-l-4 border-l-indigo-500 rounded-2xl p-5 shadow-sm/5 flex flex-col justify-between min-h-[135px] hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-extrabold text-brand-text/60 uppercase tracking-wider">Pipeline Health</span>
            <span className="text-[9px] font-extrabold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100/50">{Math.round(asNumber(pipeline.health_score)) >= 70 ? 'Strong' : 'Watch'}</span>
          </div>
          <div className="mt-2.5">
            <h4 className="text-2xl font-black text-brand-heading">{formatINR(pipeline.active_pipeline_value)}</h4>
            <p className="text-[9px] text-slate-450 mt-1 font-bold">{pipeline.total_deals} Active Deals</p>
          </div>
          <div className="mt-3">
            <div className="flex space-x-1.5 h-2 rounded-full overflow-hidden">
              {pipelineStages.slice(0, 3).map((st, i) => (
                <div key={i} className={`h-full ${st.color} rounded-l`} style={{ width: `${Math.max(st.pct, 10)}%` }} title={st.name} />
              ))}
            </div>
            <div className="flex justify-between text-[8px] font-extrabold text-slate-400 mt-1 uppercase">
              <span>Distribution</span>
              <span>{pipelineStages.length} stages</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Manager Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-7 bg-white border border-brand-border-purple/20 rounded-2xl p-5 shadow-sm/5 flex flex-col justify-between hover:shadow-md transition-all duration-300">
          <div>
            <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-4">
              <h3 className="font-extrabold text-brand-heading text-sm flex items-center">
                <BarChart3 className="h-4.5 w-4.5 mr-2 text-brand-accent" />
                <span>Rep Sales Quota Attainment</span>
              </h3>
              <span className="text-[9px] font-extrabold bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase tracking-wider">Current Quarter</span>
            </div>
            <div className="space-y-4 pt-1">
              {leaderboards.map((rep, idx) => {
                const pct = rep.target > 0 ? Math.round((rep.won / rep.target) * 100) : 0;
                return (
                  <div
                    key={rep.rank}
                    onMouseEnter={() => setHoveredQuotaIdx(idx)}
                    onMouseLeave={() => setHoveredQuotaIdx(null)}
                    className="space-y-1.5 cursor-pointer p-2.5 rounded-xl transition-all hover:bg-slate-50/70 border border-transparent hover:border-brand-border-purple/15"
                  >
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-brand-text flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-brand-accent/10 border border-brand-border-purple/20 flex items-center justify-center text-[9px] font-black text-brand-accent shrink-0">{rep.rank}</span>
                        <span className="truncate max-w-[130px]">{rep.name}</span>
                      </span>
                      <div className="flex items-center space-x-2 tabular-nums">
                        <span className="text-brand-heading font-black">{rep.wonFormatted}</span>
                        <span className="text-slate-400 text-[10px] font-normal">/ {rep.targetFormatted}</span>
                        <span className={`text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-md ${pct >= 90 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/50' : 'bg-purple-50 text-purple-700 border border-brand-border-purple/15'}`}>{pct}%</span>
                      </div>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden relative">
                      <div className={`h-full rounded-full transition-all duration-500 ${hoveredQuotaIdx === idx ? 'bg-purple-600 shadow-sm' : 'bg-brand-accent'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>
                );
              })}
              {leaderboards.length === 0 && <p className="text-xs text-slate-400 py-4 text-center">No rep quota data yet.</p>}
            </div>
          </div>
          <div className="border-t border-brand-border-purple/15 pt-3.5 mt-4 flex items-center justify-between text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
            <span>Average Quota Attainment: <strong className="text-brand-heading font-black">{avgQuota}%</strong></span>
            <button onClick={() => onTabChange?.('team performance')} className="text-brand-accent hover:text-brand-accent-hover font-black flex items-center space-x-1 cursor-pointer bg-transparent border-0 uppercase"><span>Rep Details</span><ArrowUpRight className="h-3.5 w-3.5" /></button>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5 bg-white border border-brand-border-purple/20 rounded-2xl p-5 shadow-sm/5 flex flex-col justify-between hover:shadow-md transition-all duration-300">
          <div>
            <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-4">
              <h3 className="font-extrabold text-brand-heading text-sm flex items-center"><Layers className="h-4.5 w-4.5 mr-2 text-indigo-500" /><span>Pipeline Stage Breakdown</span></h3>
              <span className="text-[9px] font-extrabold bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase tracking-wider">Value</span>
            </div>
            <div className="space-y-3.5 pt-1">
              {pipelineStages.map((stage) => (
                <div key={stage.name} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-brand-text flex items-center"><span className={`h-2.5 w-2.5 rounded-full mr-2 shrink-0 ${stage.color}`} />{stage.name}</span>
                    <div className="flex items-center space-x-2.5 tabular-nums text-[10px]">
                      <span className="text-slate-400 font-bold">{stage.count} deals</span>
                      <span className="text-brand-heading font-black">{stage.value}</span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${stage.color}`} style={{ width: `${stage.pct}%` }} />
                  </div>
                </div>
              ))}
              {pipelineStages.length === 0 && <p className="text-xs text-slate-400 py-4 text-center">No pipeline data yet.</p>}
            </div>
          </div>
          <div className="border-t border-brand-border-purple/15 pt-3.5 mt-4 flex justify-between items-center text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
            <span>Stage Conversion: <strong className="text-emerald-600 font-black">{formatPct(s.conversion_rate)}</strong></span>
            <button onClick={() => onTabChange?.('leads')} className="text-brand-accent hover:text-brand-accent-hover font-black flex items-center space-x-1 cursor-pointer bg-transparent border-0 uppercase"><span>View Funnel</span><ArrowUpRight className="h-3.5 w-3.5" /></button>
          </div>
        </div>

        <div className="col-span-12 bg-white border border-brand-border-purple/20 rounded-2xl p-5 shadow-sm/5 flex flex-col justify-between hover:shadow-md transition-all duration-300">
          <div>
            <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-4">
              <h3 className="font-extrabold text-brand-heading text-sm flex items-center"><TrendingUp className="h-4.5 w-4.5 mr-2 text-emerald-500" /><span>Monthly Revenue Trend vs Target</span></h3>
              <div className="flex items-center space-x-4 text-[10px] font-black uppercase">
                <div className="flex items-center space-x-1.5"><span className="h-2.5 w-2.5 rounded-full bg-brand-accent inline-block" /><span className="text-brand-text">Actual Won (₹)</span></div>
                <div className="flex items-center space-x-1.5"><span className="h-2.5 w-2.5 rounded-full bg-slate-300 inline-block" /><span className="text-slate-450">Target Quota (₹)</span></div>
              </div>
            </div>
            {monthlyForecast.length > 0 ? (
              <div className="relative h-28 w-full pt-1">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 600 140" preserveAspectRatio="none" onMouseLeave={() => setHoveredMonthIdx(null)}>
                  <line x1="0" y1="20" x2="600" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="60" x2="600" y2="60" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="100" x2="600" y2="100" stroke="#f1f5f9" strokeWidth="1" />
                  <path d={monthlyForecast.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${130 - (p.target / Math.max(...monthlyForecast.map((x) => x.target), 1)) * 110}`).join(' ')} fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />
                  <path d={monthlyForecast.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')} fill="none" stroke="#7957fb" strokeWidth="3.25" strokeLinecap="round" />
                  {monthlyForecast.map((pt, idx) => {
                    const isHovered = hoveredMonthIdx === idx;
                    return (
                      <g key={pt.month} className="pointer-events-none">
                        <circle cx={pt.x} cy={pt.y} r={isHovered ? '6' : '3.5'} fill={isHovered ? '#ffffff' : '#7957fb'} stroke="#7957fb" strokeWidth={isHovered ? '3.5' : '1.5'} className="transition-all duration-150" />
                      </g>
                    );
                  })}
                  {hoveredMonthIdx !== null && (
                    <g className="pointer-events-none">
                      <line x1={monthlyForecast[hoveredMonthIdx].x} y1={monthlyForecast[hoveredMonthIdx].y} x2={monthlyForecast[hoveredMonthIdx].x} y2="130" stroke="#7957fb" strokeWidth="1" strokeDasharray="3,3" />
                      <foreignObject x={monthlyForecast[hoveredMonthIdx].x - 55} y={monthlyForecast[hoveredMonthIdx].y - 65} width="110" height="60">
                        <div className="bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-center shadow-lg select-none animate-in fade-in zoom-in-95 duration-150">
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{monthlyForecast[hoveredMonthIdx].month}</p>
                          <p className="text-[10px] font-black text-white tabular-nums">Actual: {formatINR(monthlyForecast[hoveredMonthIdx].actual * 1_00_000)}</p>
                          <p className="text-[9px] font-bold text-slate-400 tabular-nums">Target: {formatINR(monthlyForecast[hoveredMonthIdx].target * 1_00_000)}</p>
                        </div>
                      </foreignObject>
                    </g>
                  )}
                  {monthlyForecast.map((pt, idx) => (
                    <rect key={`hover-${idx}`} x={pt.x - 50} y="0" width="100" height="140" fill="transparent" className="cursor-pointer" onMouseEnter={() => setHoveredMonthIdx(idx)} />
                  ))}
                  <defs>
                    <linearGradient id="managerGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7957fb" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#7957fb" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="flex justify-between px-10 text-[9px] font-extrabold text-slate-400 mt-2">
                  {monthlyForecast.map((pt) => <span key={pt.month}>{pt.month}</span>)}
                </div>
              </div>
            ) : (
              <div className="h-28 flex items-center justify-center text-xs text-slate-400">No revenue trend data yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* Leaderboard & Risk Deals splits */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-7 bg-white border border-brand-border-purple/20 rounded-2xl p-5 shadow-sm/5 flex flex-col justify-between hover:shadow-md transition-all duration-300">
          <div>
            <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-4">
              <h3 className="font-extrabold text-brand-heading text-sm flex items-center"><Award className="h-4.5 w-4.5 mr-2 text-brand-accent" /><span>Top Performing Sales Representatives</span></h3>
              <span className="text-[9px] font-extrabold bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase tracking-wider">Quota Attainment</span>
            </div>
            <div className="space-y-3">
              {leaderboards.map((rep) => (
                <div key={rep.rank} className="flex items-center justify-between p-3 border border-brand-border-purple/15 rounded-xl bg-slate-50/50 hover:bg-slate-50/80 transition-colors">
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-black text-brand-accent w-4">#{rep.rank}</span>
                    <div className="h-8 w-8 rounded-full bg-brand-accent/10 border border-brand-border-purple/20 flex items-center justify-center text-[10px] font-black text-brand-accent">{rep.name.charAt(0)}</div>
                    <div>
                      <p className="text-xs font-extrabold text-brand-text">{rep.name}</p>
                      <p className="text-[9px] text-slate-400 font-bold mt-0.5">{Math.round(asNumber(data.top_reps.find((t) => t.full_name === rep.name)?.deals_closed ?? 0))} deals closed</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-extrabold text-brand-heading tabular-nums">{rep.wonFormatted}</p>
                    <div className="w-24 bg-slate-150 h-1.5 rounded-full overflow-hidden mt-1.5 ml-auto">
                      <div className="h-full bg-brand-accent rounded-full" style={{ width: `${rep.progress}%` }} />
                    </div>
                  </div>
                </div>
              ))}
              {leaderboards.length === 0 && <p className="text-xs text-slate-400 py-4 text-center">No rep data yet.</p>}
            </div>
          </div>
          <div className="border-t border-brand-border-purple/15 pt-3 mt-4 flex justify-end">
            <button onClick={() => onTabChange?.('team performance')} className="text-xs font-bold text-brand-accent hover:text-brand-accent-hover transition-colors flex items-center space-x-1 cursor-pointer bg-transparent border-0 uppercase"><span>View full leaderboard</span><ArrowUpRight className="h-3.5 w-3.5" /></button>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5 bg-white border border-brand-border-purple/20 rounded-2xl p-5 shadow-sm/5 flex flex-col justify-between hover:shadow-md transition-all duration-300">
          <div>
            <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-4">
              <h3 className="font-extrabold text-brand-heading text-sm flex items-center"><AlertTriangle className="h-4.5 w-4.5 mr-2 text-rose-500" /><span>Deals At Risk</span></h3>
              <span className="text-[9px] font-extrabold bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-100/50 uppercase tracking-wider">Escalated</span>
            </div>
            <div className="space-y-3">
              {riskDeals.map((deal) => (
                <div key={deal.id} className="p-3 border border-rose-150 rounded-xl bg-rose-50/15 hover:bg-rose-50/25 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-extrabold text-brand-text leading-tight">{deal.title}</h4>
                      <p className="text-[10px] text-brand-accent font-bold mt-1">{deal.company}</p>
                    </div>
                    <span className="text-xs font-black text-rose-600 tabular-nums shrink-0">{deal.value}</span>
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-rose-100/50 text-[10px] font-semibold text-slate-450">
                    <span className="flex items-center gap-1.5"><span className="h-4.5 w-4.5 rounded-full bg-brand-accent/10 border border-brand-border-purple/20 flex items-center justify-center text-[8px] font-black text-brand-accent">{deal.rep.charAt(0)}</span>Owner: {deal.rep}</span>
                    <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-black uppercase tracking-wider text-[8px]">{deal.risk}</span>
                  </div>
                </div>
              ))}
              {riskDeals.length === 0 && <p className="text-xs text-slate-400 py-4 text-center">No deals currently at risk.</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Manager Alerts & Signals */}
      <div className="bg-white border border-brand-border-purple/20 rounded-2xl p-5 shadow-sm/5 space-y-4 hover:shadow-md transition-all duration-300">
        <h3 className="font-extrabold text-brand-heading text-xs uppercase tracking-wider flex items-center border-b border-slate-50 pb-2.5"><BellRing className="h-4.5 w-4.5 mr-2 text-brand-accent" /><span>Manager Command Alerts &amp; Signals</span></h3>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div key={alert.id} className={`p-3.5 rounded-xl border text-xs font-bold flex items-start justify-between space-x-2.5 ${alert.type === 'high' || alert.type === 'warning' ? 'bg-rose-50/80 border-rose-100 text-rose-900' : alert.type === 'success' ? 'bg-emerald-50/80 border-emerald-100 text-emerald-900' : 'bg-indigo-50/50 border-brand-border-purple/25 text-brand-text'}`}>
              <div className="flex items-start space-x-2.5">
                {alert.type === 'high' || alert.type === 'warning' ? <ShieldAlert className="h-4.5 w-4.5 shrink-0 mt-0.5 text-rose-600" /> : alert.type === 'success' ? <CheckCircle2 className="h-4.5 w-4.5 shrink-0 mt-0.5 text-emerald-600" /> : <Sparkles className="h-4.5 w-4.5 shrink-0 mt-0.5 text-indigo-500" />}
                <span>{alert.text}</span>
              </div>
              <span className={`text-[8.5px] font-black uppercase tracking-wider shrink-0 px-2 py-0.5 rounded border ${alert.type === 'high' || alert.type === 'warning' ? 'bg-rose-100/50 border-rose-200 text-rose-700' : alert.type === 'success' ? 'bg-emerald-100/50 border-emerald-200 text-emerald-700' : 'bg-indigo-100/50 border-brand-border-purple/20 text-indigo-700'}`}>{alert.time}</span>
            </div>
          ))}
          {alerts.length === 0 && <p className="text-xs text-slate-400 py-2">No active alerts.</p>}
        </div>
      </div>

      {/* Team Activity Logs Feed */}
      <div className="bg-white border border-brand-border-purple/20 rounded-2xl p-5 shadow-sm/5 hover:shadow-md transition-all duration-300">
        <h3 className="font-extrabold text-brand-heading text-xs uppercase tracking-wider mb-4 flex items-center border-b border-slate-50 pb-2.5"><Activity className="h-4.5 w-4.5 mr-2 text-brand-accent" /><span>Recent Team Activity Log</span></h3>
        <div className="divide-y divide-slate-100">
          {activities.map((act, idx) => (
            <div key={idx} className="py-3 flex items-start space-x-3.5 text-xs font-semibold first:pt-0 last:pb-0">
              <div className="h-7 w-7 rounded-full bg-brand-accent/10 border border-brand-border-purple/20 flex items-center justify-center text-[9px] font-black text-brand-accent mt-0.5 shrink-0">{act.actor.charAt(0)}</div>
              <div className="flex-1">
                <p className="text-brand-text/90 leading-relaxed"><span className="font-black text-brand-text">{act.actor}</span> {act.action}</p>
                <span className="text-[9.5px] text-slate-450 font-extrabold flex items-center mt-1"><Clock className="h-3 w-3 mr-1 text-slate-400" />{act.time}</span>
              </div>
            </div>
          ))}
          {activities.length === 0 && <p className="text-xs text-slate-400 py-2">No recent activity.</p>}
        </div>
        <div className="border-t border-brand-border-purple/15 mt-4 pt-3 flex justify-end">
          <button onClick={() => onTabChange?.('reports')} className="text-xs font-bold text-brand-accent hover:text-brand-accent-hover transition-colors flex items-center space-x-1 cursor-pointer bg-transparent border-0 uppercase"><span>View all reports</span><ArrowRight className="h-3.5 w-3.5" /></button>
        </div>
      </div>
    </div>
  );
}
