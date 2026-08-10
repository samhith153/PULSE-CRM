'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, TrendingUp, TrendingDown, Users, Target, BarChart3, Activity, Zap, AlertTriangle, ChevronDown, Building2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, FunnelChart, Funnel, LabelList,
} from 'recharts';
import {
  getSalesPerformanceReport,
  getPipelineAnalyticsReport,
  getTeamPerformanceReport,
  getActivityAnalyticsReport,
  getLeadAnalyticsReport,
  getDealAnalyticsReport,
  getAdminDashboard,
  type SalesPerformanceReport,
  type PipelineAnalyticsReport,
  type TeamPerformanceReport,
  type ActivityAnalyticsReport,
  type LeadAnalyticsReport,
  type DealAnalyticsReport,
  type AdminDashboardData,
} from '@/utils/api';

const COLORS = ['var(--lime)', 'var(--brand-soft)', 'var(--brand)', 'var(--status-warning-text)', 'var(--accent-color)', 'var(--chart-5)', 'var(--chart-5)', 'var(--status-success-text)'];

function fmt(n: number) {
  if (n >= 1e7) return `${(n / 1e7).toFixed(1)}Cr`;
  if (n >= 1e5) return `${(n / 1e5).toFixed(1)}L`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString('en-IN');
}

function fmtCurrency(n: number) {
  return n.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
}

function fmtPct(n: number) { return `${Number(n || 0).toFixed(1)}%`; }

function SectionCard({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <section className="bg-surface-1 border border-border-default rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="grid size-9 place-items-center rounded-xl bg-brand-soft/20">
          <Icon className="size-4.5 text-accent-color" />
        </div>
        <h2 className="text-[17px] font-bold tracking-tight">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function KPICard({ label, value, sub, positive }: { label: string; value: string; sub?: string; positive?: boolean }) {
  return (
    <div className="rounded-xl bg-muted/50 p-4">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="mt-1 text-[22px] font-extrabold tracking-tight">{value}</p>
      {sub && (
        <span className={`mt-1 inline-flex items-center gap-1 text-[11px] font-semibold ${positive ? 'text-status-success-text' : 'text-status-danger-text'}`}>
          {positive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
          {sub}
        </span>
      )}
    </div>
  );
}

export default function AdminReportsView() {
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('quarter');
  const [loading, setLoading] = useState(true);
  const [salesPerf, setSalesPerf] = useState<SalesPerformanceReport | null>(null);
  const [pipeline, setPipeline] = useState<PipelineAnalyticsReport | null>(null);
  const [teamPerf, setTeamPerf] = useState<TeamPerformanceReport | null>(null);
  const [activity, setActivity] = useState<ActivityAnalyticsReport | null>(null);
  const [leads, setLeads] = useState<LeadAnalyticsReport | null>(null);
  const [deals, setDeals] = useState<DealAnalyticsReport | null>(null);
  const [adminData, setAdminData] = useState<AdminDashboardData | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sp, pp, tp, al, ld, dl, ad] = await Promise.all([
        getSalesPerformanceReport({ period }),
        getPipelineAnalyticsReport({ period }),
        getTeamPerformanceReport({ period }),
        getActivityAnalyticsReport({ period }),
        getLeadAnalyticsReport({ period }),
        getDealAnalyticsReport({ period }),
        getAdminDashboard(),
      ]);
      setSalesPerf(sp);
      setPipeline(pp);
      setTeamPerf(tp);
      setActivity(al);
      setLeads(ld);
      setDeals(dl);
      setAdminData(ad);
    } catch (e) {
      console.error('Failed to load reports', e);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 text-accent-color animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <h1 className="text-[30px] font-extrabold tracking-tight">Reports & Analytics</h1>
          <p className="mt-1 text-sm text-text-muted">Organization-wide performance overview.</p>
        </div>
        <div className="ml-auto">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="rounded-full bg-surface-1 border border-border-default px-4 py-2 text-[13px] font-semibold"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* ── Org Overview ─────────────────────────────────────────── */}
      {adminData?.summary && (
        <SectionCard title="Organization Overview" icon={Building2}>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <KPICard label="Total Users" value={String(adminData.summary.users?.total || 0)} sub={`${adminData.summary.users?.active || 0} active`} positive />
            <KPICard label="Total Companies" value={String(adminData.summary.companies?.total || 0)} sub={`${adminData.summary.companies?.added_this_month || 0} this month`} positive />
            <KPICard label="Total Contacts" value={String(adminData.summary.contacts?.total || 0)} sub={`${adminData.summary.contacts?.new_this_month || 0} new`} positive />
            <KPICard label="Total Leads" value={String(adminData.summary.leads?.total || 0)} sub={`${Number(adminData.summary.leads?.conversion_rate || 0).toFixed(1)}% conversion`} positive />
          </div>
        </SectionCard>
      )}

      {/* ── KPIs ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KPICard label="Total Revenue" value={fmtCurrency(salesPerf?.total_revenue || 0)} sub={`${fmtPct(salesPerf?.team_win_rate || 0)} win rate`} positive />
        <KPICard label="Pipeline Value" value={fmtCurrency(pipeline?.pipeline_by_stage?.reduce((s, p) => s + Number(p.total_value || 0), 0) || 0)} sub={`${pipeline?.pipeline_by_stage?.reduce((s, p) => s + p.deal_count, 0) || 0} deals`} positive />
        <KPICard label="Total Leads" value={String(leads?.total_leads || 0)} sub={`${fmtPct(leads?.overall_conversion_rate || 0)} conversion`} positive />
        <KPICard label="Activity Score" value={String(activity?.activity_summary?.total || 0)} sub={`${activity?.completed_vs_overdue?.completed || 0} completed`} positive />
      </div>

      {/* ── Sales Performance ─────────────────────────────────────── */}
      <SectionCard title="Sales Performance" icon={TrendingUp}>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {/* Revenue by Rep */}
          <div>
            <h3 className="text-sm font-bold mb-3">Revenue by Rep</h3>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesPerf?.revenue_by_rep?.map(r => ({ name: r.rep_name.split(' ')[0], revenue: Number(r.revenue) })) || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmt(v)} />
                  <Tooltip formatter={(v: any) => fmtCurrency(Number(v))} />
                  <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                    {(salesPerf?.revenue_by_rep || []).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Win Rate by Rep */}
          <div>
            <h3 className="text-sm font-bold mb-3">Win Rate by Rep</h3>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesPerf?.win_rate_by_rep?.map(r => ({ name: r.rep_name.split(' ')[0], winRate: Number(r.win_rate) })) || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis type="number" tick={{ fontSize: 11 }} unit="%" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip formatter={(v: any) => `${Number(v).toFixed(1)}%`} />
                  <Bar dataKey="winRate" radius={[0, 6, 6, 0]}>
                    {(salesPerf?.win_rate_by_rep || []).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Quota Achievement */}
        <div className="mt-5">
          <h3 className="text-sm font-bold mb-3">Quota Achievement</h3>
          <div className="space-y-3">
            {salesPerf?.quota_attainment?.map(q => (
              <div key={q.rep_id} className="flex items-center gap-3">
                <span className="w-[120px] text-sm font-semibold truncate">{q.rep_name}</span>
                <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden relative">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(Number(q.achievement_pct) || 0, 100)}%`,
                      background: Number(q.achievement_pct) >= 100 ? 'var(--status-success-text)' : Number(q.achievement_pct) >= 70 ? 'var(--status-warning-text)' : 'var(--status-danger-text)',
                    }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold">
                    {fmtPct(q.achievement_pct)} — {fmtCurrency(Number(q.actual))} / {fmtCurrency(Number(q.target))}
                  </span>
                </div>
              </div>
            ))}
            {(!salesPerf?.quota_attainment || salesPerf.quota_attainment.length === 0) && (
              <p className="text-sm text-text-muted">No quota data available</p>
            )}
          </div>
        </div>
      </SectionCard>

      {/* ── Pipeline Analytics ────────────────────────────────────── */}
      <SectionCard title="Pipeline Analytics" icon={BarChart3}>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {/* Pipeline by Stage */}
          <div>
            <h3 className="text-sm font-bold mb-3">Pipeline by Stage</h3>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipeline?.pipeline_by_stage?.map(s => ({ name: s.stage, deals: s.deal_count, value: Number(s.total_value) })) || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" name="Value" radius={[6, 6, 0, 0]}>
                    {(pipeline?.pipeline_by_stage || []).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pipeline Aging */}
          <div>
            <h3 className="text-sm font-bold mb-3">Pipeline Aging</h3>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipeline?.pipeline_aging?.map(a => ({ name: a.bucket, count: a.count, value: Number(a.value) })) || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Deals" radius={[6, 6, 0, 0]} fill="var(--brand)">
                    {(pipeline?.pipeline_aging || []).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Stage Conversion */}
        {pipeline?.stage_conversion && pipeline.stage_conversion.length > 0 && (
          <div className="mt-5">
            <h3 className="text-sm font-bold mb-3">Stage Conversion</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted text-xs text-text-muted">
                    <th className="rounded-l-xl px-4 py-2 text-left font-medium">From</th>
                    <th className="px-4 py-2 text-left font-medium">To</th>
                    <th className="px-4 py-2 text-center font-medium">Count</th>
                    <th className="rounded-r-xl px-4 py-2 text-right font-medium">Conversion %</th>
                  </tr>
                </thead>
                <tbody>
                  {pipeline.stage_conversion.slice(0, 6).map((c, i) => (
                    <tr key={i} className="border-b border-border-default last:border-0">
                      <td className="px-4 py-2.5">{c.from_stage}</td>
                      <td className="px-4 py-2.5">{c.to_stage}</td>
                      <td className="px-4 py-2.5 text-center font-semibold">{c.count}</td>
                      <td className="px-4 py-2.5 text-right font-semibold">{fmtPct(Number(c.conversion_pct))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </SectionCard>

      {/* ── Team Performance ──────────────────────────────────────── */}
      <SectionCard title="Team Performance" icon={Users}>
        {/* Leaderboard */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted text-xs text-text-muted">
                <th className="rounded-l-xl px-4 py-2 text-left font-medium">Rank</th>
                <th className="px-4 py-2 text-left font-medium">Rep</th>
                <th className="px-4 py-2 text-right font-medium">Revenue</th>
                <th className="px-4 py-2 text-center font-medium">Won</th>
                <th className="px-4 py-2 text-center font-medium">Win Rate</th>
                <th className="rounded-r-xl px-4 py-2 text-right font-medium">Quota %</th>
              </tr>
            </thead>
            <tbody>
              {teamPerf?.leaderboard?.map(entry => (
                <tr key={entry.rep_id} className="border-b border-border-default last:border-0">
                  <td className="px-4 py-3">
                    <span className="grid size-7 place-items-center rounded-full bg-brand-soft/20 text-[11px] font-bold text-accent-color">
                      {entry.rank}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold">{entry.rep_name}</td>
                  <td className="px-4 py-3 text-right font-semibold">{fmtCurrency(Number(entry.revenue))}</td>
                  <td className="px-4 py-3 text-center">{entry.deals_won}</td>
                  <td className="px-4 py-3 text-center">{fmtPct(Number(entry.win_rate))}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${Number(entry.quota_pct) >= 100 ? 'bg-status-success-bg text-status-success-text' : Number(entry.quota_pct) >= 70 ? 'bg-status-warning-bg text-status-warning-text' : 'bg-status-danger-bg text-status-danger-text'}`}>
                      {fmtPct(Number(entry.quota_pct))}
                    </span>
                  </td>
                </tr>
              ))}
              {(!teamPerf?.leaderboard || teamPerf.leaderboard.length === 0) && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-text-muted">No team data available</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Performance vs Prior */}
        {teamPerf?.performance_vs_prior && teamPerf.performance_vs_prior.length > 0 && (
          <div className="mt-5 grid grid-cols-2 gap-4">
            {teamPerf.performance_vs_prior.map(p => (
              <div key={p.metric} className="rounded-xl bg-muted/50 p-4">
                <p className="text-xs text-text-muted">{p.metric}</p>
                <p className="mt-1 text-[22px] font-extrabold">{fmt(Number(p.current))}</p>
                <span className={`mt-1 inline-flex items-center gap-1 text-[11px] font-semibold ${Number(p.change_pct) >= 0 ? 'text-status-success-text' : 'text-status-danger-text'}`}>
                  {Number(p.change_pct) >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                  {fmtPct(Number(p.change_pct))} vs prior
                </span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* ── Activity Analytics ────────────────────────────────────── */}
      <SectionCard title="Activity Analytics" icon={Activity}>
        <div className="grid grid-cols-5 gap-4 mb-5">
          {[
            { label: 'Calls', value: activity?.activity_summary?.calls || 0 },
            { label: 'Emails', value: activity?.activity_summary?.emails || 0 },
            { label: 'Meetings', value: activity?.activity_summary?.meetings || 0 },
            { label: 'Tasks', value: activity?.activity_summary?.tasks || 0 },
            { label: 'Notes', value: activity?.activity_summary?.notes || 0 },
          ].map(a => (
            <div key={a.label} className="rounded-xl bg-muted/50 p-3 text-center">
              <p className="text-[22px] font-extrabold">{a.value}</p>
              <p className="text-xs text-text-muted">{a.label}</p>
            </div>
          ))}
        </div>

        {/* Activity by Rep */}
        <div className="h-[260px] mb-5">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={activity?.activity_by_rep?.slice(0, 8).map(r => ({
              name: r.rep_name.split(' ')[0], calls: r.calls, emails: r.emails, meetings: r.meetings, tasks: r.tasks,
            })) || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="calls" fill="var(--status-success-text)" radius={[2, 2, 0, 0]} />
              <Bar dataKey="emails" fill="var(--accent-color)" radius={[2, 2, 0, 0]} />
              <Bar dataKey="meetings" fill="var(--status-warning-text)" radius={[2, 2, 0, 0]} />
              <Bar dataKey="tasks" fill="var(--chart-5)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Completed vs Overdue */}
        {activity?.completed_vs_overdue && (
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl bg-status-success-bg p-4 text-center">
              <p className="text-[22px] font-extrabold text-status-success-text">{activity.completed_vs_overdue.completed}</p>
              <p className="text-xs text-status-success-text">Completed</p>
            </div>
            <div className="rounded-xl bg-status-danger-bg p-4 text-center">
              <p className="text-[22px] font-extrabold text-status-danger-text">{activity.completed_vs_overdue.overdue}</p>
              <p className="text-xs text-status-danger-text">Overdue</p>
            </div>
            <div className="rounded-xl bg-status-warning-bg p-4 text-center">
              <p className="text-[22px] font-extrabold text-status-warning-text">{activity.completed_vs_overdue.pending}</p>
              <p className="text-xs text-status-warning-text">Pending</p>
            </div>
          </div>
        )}
      </SectionCard>

      {/* ── Lead Analytics ────────────────────────────────────────── */}
      <SectionCard title="Lead Analytics" icon={Zap}>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {/* Source Performance */}
          <div>
            <h3 className="text-sm font-bold mb-3">Lead Source Performance</h3>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leads?.source_performance?.map(s => ({ name: s.source, leads: s.total, converted: s.converted })) || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="leads" name="Total Leads" radius={[6, 6, 0, 0]} fill="var(--brand-soft)" />
                  <Bar dataKey="converted" name="Converted" radius={[6, 6, 0, 0]} fill="var(--lime)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Conversion Funnel */}
          <div>
            <h3 className="text-sm font-bold mb-3">Conversion Funnel</h3>
            <div className="space-y-2">
              {leads?.conversion_funnel?.map((s, i) => {
                const maxCount = Math.max(...(leads.conversion_funnel?.map(f => f.count) || [1]));
                const width = maxCount > 0 ? Math.max(20, (s.count / maxCount) * 100) : 20;
                return (
                  <div key={s.stage} className="flex items-center gap-3">
                    <span className="w-[110px] text-xs font-semibold capitalize">{s.stage.replace('_', ' ')}</span>
                    <div className="flex-1 h-8 bg-muted rounded-lg overflow-hidden relative">
                      <div
                        className="h-full rounded-lg"
                        style={{ width: `${width}%`, background: COLORS[i % COLORS.length] }}
                      />
                      <span className="absolute inset-0 flex items-center px-3 text-[11px] font-bold">
                        {s.count} ({fmtPct(Number(s.percentage))})
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Lead Aging */}
        {leads?.lead_aging && leads.lead_aging.length > 0 && (
          <div className="mt-5">
            <h3 className="text-sm font-bold mb-3">Lead Aging</h3>
            <div className="flex gap-3">
              {leads.lead_aging.map(a => (
                <div key={a.bucket} className="flex-1 rounded-xl bg-muted/50 p-3 text-center">
                  <p className="text-[20px] font-extrabold">{a.count}</p>
                  <p className="text-xs text-text-muted">{a.bucket}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </SectionCard>

      {/* ── Deal Analytics ────────────────────────────────────────── */}
      <SectionCard title="Deal Analytics" icon={AlertTriangle}>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {/* Deal KPIs */}
          <div className="grid grid-cols-2 gap-4">
            <KPICard label="Won Deals" value={String(deals?.total_won || 0)} sub={fmtCurrency(deals?.total_won_value || 0)} positive />
            <KPICard label="Lost Deals" value={String(deals?.total_lost || 0)} sub={fmtCurrency(deals?.total_lost_value || 0)} positive={false} />
            <KPICard label="Avg Deal Size" value={fmtCurrency(deals?.avg_deal_size?.current || 0)} sub={`${fmtPct(deals?.avg_deal_size?.change_pct || 0)} change`} positive={Number(deals?.avg_deal_size?.change_pct || 0) >= 0} />
            <KPICard label="Closing Soon" value={String(deals?.deals_closing_soon?.length || 0)} sub="Next 14 days" positive />
          </div>

          {/* Lost Reason Analysis */}
          <div>
            <h3 className="text-sm font-bold mb-3">Lost Reason Analysis</h3>
            {deals?.lost_reason_analysis && deals.lost_reason_analysis.length > 0 ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deals.lost_reason_analysis.map(r => ({ name: r.reason, value: r.count }))}
                      dataKey="value"
                      startAngle={210}
                      endAngle={-30}
                      innerRadius="55%"
                      outerRadius="90%"
                      paddingAngle={3}
                      cornerRadius={10}
                      stroke="none"
                    >
                      {deals.lost_reason_analysis.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-text-muted">No lost deal data</p>
            )}
          </div>
        </div>

        {/* At-Risk Deals */}
        {deals?.at_risk_deals && deals.at_risk_deals.length > 0 && (
          <div className="mt-5">
            <h3 className="text-sm font-bold mb-3">At-Risk Deals</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted text-xs text-text-muted">
                    <th className="rounded-l-xl px-4 py-2 text-left font-medium">Deal</th>
                    <th className="px-4 py-2 text-left font-medium">Owner</th>
                    <th className="px-4 py-2 text-left font-medium">Stage</th>
                    <th className="px-4 py-2 text-right font-medium">Value</th>
                    <th className="rounded-r-xl px-4 py-2 text-left font-medium">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {deals.at_risk_deals.slice(0, 5).map(d => (
                    <tr key={d.deal_id} className="border-b border-border-default last:border-0">
                      <td className="px-4 py-2.5 font-semibold">{d.deal_name}</td>
                      <td className="px-4 py-2.5">{d.owner_name}</td>
                      <td className="px-4 py-2.5">{d.stage}</td>
                      <td className="px-4 py-2.5 text-right font-semibold">{fmtCurrency(Number(d.value))}</td>
                      <td className="px-4 py-2.5 text-status-danger-text text-xs font-semibold">{d.risk_reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
