'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, TrendingUp, TrendingDown, Users, Target, Zap, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
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
import ChartTooltip from './ChartTooltip';
import { useChartTooltip } from '@/hooks/use-chart-tooltip';

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

/* ── Custom SVG Bar Chart ───────────────────────────────────────────── */
function SVBarChart({ data, height = 260 }: { data: { name: string; value: number }[]; height?: number }) {
  const { containerRef, tip, show, hide } = useChartTooltip<{ name: string; value: number }>();
  const maxValue = Math.max(...data.map(d => d.value), 1);
  return (
    <div ref={containerRef} style={{ height }} className="relative flex items-end justify-between gap-2 border-b border-border-default px-2 pb-2">
      {data.map((d, i) => {
        const barHeight = Math.max(8, (d.value / maxValue) * (height - 40));
        return (
          <div key={d.name} className="flex flex-1 flex-col items-center cursor-default"
            onMouseEnter={(e) => show(e, d)}
            onMouseMove={(e) => show(e, d)}
            onMouseLeave={hide}>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: barHeight }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: i * 0.05 }}
              className="w-full max-w-[48px] rounded-t-lg"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span className="mt-2 text-[10px] font-semibold text-text-muted truncate max-w-[60px] text-center">{d.name}</span>
          </div>
        );
      })}
      {tip && (
        <ChartTooltip x={tip.x} y={tip.y} title={tip.data.name}
          rows={[{ label: 'Value', value: fmtCurrency(tip.data.value), color: COLORS[0] }]} />
      )}
    </div>
  );
}

/* ── Custom SVG Horizontal Bar Chart ────────────────────────────────── */
function SVHorizontalBarChart({ data, height = 260 }: { data: { name: string; value: number }[]; height?: number }) {
  const { containerRef, tip, show, hide } = useChartTooltip<{ name: string; value: number }>();
  const maxValue = Math.max(...data.map(d => d.value), 1);
  return (
    <div ref={containerRef} style={{ height }} className="relative flex flex-col justify-between overflow-hidden">
      {data.map((d, i) => (
        <div key={d.name} className="flex items-center gap-3 cursor-default"
          onMouseEnter={(e) => show(e, d)}
          onMouseMove={(e) => show(e, d)}
          onMouseLeave={hide}>
          <span className="w-[80px] text-[11px] font-semibold text-text-muted truncate text-right">{d.name}</span>
          <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(d.value / maxValue) * 100}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: i * 0.05 }}
              className="h-full rounded-full"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
          </div>
          <span className="w-[50px] text-[11px] font-bold text-text-primary tabular-nums text-right">{d.value.toFixed(1)}%</span>
        </div>
      ))}
      {tip && (
        <ChartTooltip x={tip.x} y={tip.y} title={tip.data.name}
          rows={[{ label: 'Share', value: `${tip.data.value.toFixed(1)}%`, color: COLORS[0] }]} />
      )}
    </div>
  );
}

/* ── Custom SVG Grouped Bar Chart ───────────────────────────────────── */
function SVGroupedBarChart({ data, height = 260 }: { data: { name: string; calls: number; emails: number; meetings: number; tasks: number }[]; height?: number }) {
  const { containerRef, tip, show, hide } = useChartTooltip<{ name: string; key: string; value: number; color: string }>();
  const allValues = data.flatMap(d => [d.calls, d.emails, d.meetings, d.tasks]);
  const maxValue = Math.max(...allValues, 1);
  const barColors = ['var(--status-success-text)', 'var(--accent-color)', 'var(--status-warning-text)', 'var(--chart-5)'];
  const barKeys = ['Calls', 'Emails', 'Meetings', 'Tasks'];

  return (
    <div ref={containerRef} style={{ height }} className="relative flex items-end justify-between gap-2 border-b border-border-default px-2 pb-2">
      {data.map((d, i) => {
        const values = [d.calls, d.emails, d.meetings, d.tasks];
        return (
          <div key={d.name} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-end justify-center gap-0.5" style={{ height: height - 40 }}>
              {values.map((v, j) => (
                <motion.div
                  key={j}
                  initial={{ height: 0 }}
                  animate={{ height: `${(v / maxValue) * 100}%` }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: i * 0.03 + j * 0.02 }}
                  className="w-2 rounded-t-sm cursor-pointer"
                  style={{ backgroundColor: barColors[j] }}
                  onMouseEnter={(e) => show(e, { name: d.name, key: barKeys[j], value: v, color: barColors[j] })}
                  onMouseMove={(e) => show(e, { name: d.name, key: barKeys[j], value: v, color: barColors[j] })}
                  onMouseLeave={hide}
                />
              ))}
            </div>
            <span className="mt-2 text-[10px] font-semibold text-text-muted truncate max-w-[60px] text-center">{d.name}</span>
          </div>
        );
      })}
      {tip && (
        <ChartTooltip x={tip.x} y={tip.y} title={`${tip.data.name} · ${tip.data.key}`}
          rows={[{ label: tip.data.key, value: String(tip.data.value), color: tip.data.color }]} />
      )}
    </div>
  );
}

/* ── Custom SVG Donut Chart ─────────────────────────────────────────── */
function SVDonutChart({ data, height = 200 }: { data: { name: string; value: number }[]; height?: number }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const total = data.reduce((s, d) => s + d.value, 0);
  const CIRC = 2 * Math.PI * 56;
  const segments = data.map((d, i) => {
    const dash = total > 0 ? (d.value / total) * CIRC : 0;
    const before = data.slice(0, i).reduce((s, x) => s + x.value, 0);
    const offset = total > 0 ? -(before / total) * CIRC : 0;
    return { ...d, dash, offset, color: COLORS[i % COLORS.length] };
  });

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ height, width: height }}>
        <svg className="size-full -rotate-90" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r="56" fill="none" stroke="var(--surface-2)" strokeWidth="14" />
          {segments.map((seg, i) => (
            <motion.circle
              key={i}
              cx="80" cy="80" r="56"
              fill="none"
              stroke={seg.color}
              strokeWidth={hovered === i ? 18 : 14}
              strokeDasharray={`${seg.dash} ${CIRC}`}
              strokeDashoffset={seg.offset}
              initial={{ strokeDashoffset: CIRC }}
              animate={{ strokeDashoffset: seg.offset }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: i * 0.05 }}
              className="cursor-pointer transition duration-200"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-lg font-bold text-text-primary tabular-nums leading-none">
            {hovered !== null ? segments[hovered].value : total}
          </span>
          <span className="mt-1 text-[9px] font-bold text-text-muted uppercase tracking-wider leading-none">
            {hovered !== null ? segments[hovered].name : 'Total'}
          </span>
        </div>
      </div>
      <div className="w-full space-y-1.5">
        {segments.map((seg, i) => (
          <div
            key={i}
            className={`flex items-center justify-between rounded-lg py-1 px-2 transition-colors cursor-pointer ${hovered === i ? 'bg-surface-2' : ''}`}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="flex items-center gap-2">
              <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: seg.color }} />
              <span className="text-xs text-text-muted">{seg.name}</span>
            </div>
            <span className="text-xs font-semibold text-text-primary tabular-nums">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

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

function KPICard({ label, value, sub, positive, highlight }: { label: string; value: string; sub?: string; positive?: boolean; highlight?: boolean }) {
  return (
    <div className={highlight
      ? "relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent-color to-purple-600 p-5 text-white shadow-lg"
      : "rounded-2xl border border-border-default bg-surface-1 p-5"
    }>
      {highlight && <span className="pointer-events-none absolute -right-8 -top-8 size-36 rounded-full bg-white/10" />}
      <p className={highlight ? "text-xs font-semibold text-white/70" : "text-xs text-text-muted"}>{label}</p>
      <p className={`mt-1 text-[22px] font-extrabold tracking-tight ${highlight ? 'text-white' : ''}`}>{value}</p>
      {sub && (
        <span className={highlight
          ? "mt-1.5 inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white border border-white/20"
          : `mt-1 inline-flex items-center gap-1 text-[11px] font-semibold ${positive ? 'text-status-success-text' : 'text-status-danger-text'}`
        }>
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
          <div className="relative inline-flex items-center">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="h-9 min-w-[150px] appearance-none rounded-lg bg-surface-1 border border-border-default pl-4 pr-9 text-xs font-semibold text-text-primary shadow-sm cursor-pointer whitespace-nowrap focus:outline-none focus:ring-1 focus:ring-accent-color/25"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 size-3.5 text-text-muted" />
          </div>
        </div>
      </div>

      {/* ── Org Overview ─────────────────────────────────────────── */}
      {adminData?.summary && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <KPICard label="Total Users" value={String(adminData.summary.users?.total || 0)} sub={`${adminData.summary.users?.active || 0} active`} positive highlight />
          <KPICard label="Total Companies" value={String(adminData.summary.companies?.total || 0)} sub={`${adminData.summary.companies?.added_this_month || 0} this month`} positive />
          <KPICard label="Total Contacts" value={String(adminData.summary.contacts?.total || 0)} sub={`${adminData.summary.contacts?.new_this_month || 0} new`} positive />
          <KPICard label="Total Leads" value={String(adminData.summary.leads?.total || 0)} sub={`${Number(adminData.summary.leads?.conversion_rate || 0).toFixed(1)}% conversion`} positive />
        </div>
      )}

      {/* ── Sales Performance ─────────────────────────────────────── */}
      <SectionCard title="Sales Performance" icon={TrendingUp}>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {/* Revenue by Rep */}
          <div>
            <h3 className="text-sm font-bold mb-3">Revenue by Rep</h3>
            {salesPerf?.revenue_by_rep && salesPerf.revenue_by_rep.length > 0 ? (
              <SVBarChart
                data={salesPerf.revenue_by_rep.map(r => ({ name: r.rep_name.split(' ')[0], value: Number(r.revenue) }))}
                height={260}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-[180px] bg-muted/30 rounded-xl border border-dashed border-border-default">
                <TrendingUp className="size-8 text-text-muted/40 mb-2" />
                <p className="text-sm text-text-muted">No revenue data available</p>
                <p className="text-xs text-text-muted/60 mt-1">Data will appear once deals are closed</p>
              </div>
            )}
          </div>

          {/* Win Rate by Rep */}
          <div>
            <h3 className="text-sm font-bold mb-3">Win Rate by Rep</h3>
            {salesPerf?.win_rate_by_rep && salesPerf.win_rate_by_rep.length > 0 ? (
              <SVHorizontalBarChart
                data={salesPerf.win_rate_by_rep.map(r => ({ name: r.rep_name.split(' ')[0], value: Number(r.win_rate) }))}
                height={260}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-[180px] bg-muted/30 rounded-xl border border-dashed border-border-default">
                <TrendingUp className="size-8 text-text-muted/40 mb-2" />
                <p className="text-sm text-text-muted">No win rate data available</p>
                <p className="text-xs text-text-muted/60 mt-1">Data will appear once deals are closed</p>
              </div>
            )}
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

      {/* ── Team Performance ──────────────────────────────────────── */}
      <SectionCard title="Team Performance" icon={Users}>
        {/* Leaderboard */}
        {teamPerf?.leaderboard && teamPerf.leaderboard.length > 0 ? (
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
                {teamPerf.leaderboard.map(entry => (
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
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[140px] bg-muted/30 rounded-xl border border-dashed border-border-default">
            <Users className="size-8 text-text-muted/40 mb-2" />
            <p className="text-sm text-text-muted">No team performance data available</p>
            <p className="text-xs text-text-muted/60 mt-1">Data will appear once team members close deals</p>
          </div>
        )}

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

      {/* ── Conversion Funnel ────────────────────────────────────── */}
      <SectionCard title="Conversion Funnel" icon={Zap}>
        {leads?.conversion_funnel && leads.conversion_funnel.length > 0 ? (
          <div className="space-y-2">
            {leads.conversion_funnel.map((s, i) => {
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
        ) : (
          <p className="text-sm text-text-muted">No funnel data available</p>
        )}
      </SectionCard>
    </div>
  );
}
