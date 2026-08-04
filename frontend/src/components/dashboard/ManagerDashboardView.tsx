'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp, Target, AlertTriangle, Users, ArrowUpRight,
  Activity, BellRing, ShieldAlert, Sparkles, Award,
  BarChart3, Layers, Clock, ArrowRight, CheckCircle2, ChevronDown,
} from 'lucide-react';
import {
  getManagerDashboard, asNumber, formatINR, formatPct, ManagerDashboardData,
} from '@/utils/api';
import { useReveal } from '@/hooks/use-reveal';

interface ManagerDashboardViewProps { onTabChange?: (tab: string) => void; }

/* ── Stage bar colors ramp (brand-blue → brand-cyan → brand-purple) ─── */
const STAGE_COLORS = [
  'bg-brand-blue',
  'bg-brand-cyan',
  'bg-brand-purple',
  'bg-brand-blue/70',
  'bg-brand-purple/70',
  'bg-muted-foreground/40',
];

/* ── KPI summary tile ────────────────────────────────────────────────── */
function KpiTile({
  title, value, sub, progress, badge, delay = 0,
}: {
  title: string; value: string; sub: string;
  progress: number; badge?: string; delay?: number;
}) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref} data-visible={visible}
      style={{ transitionDelay: `${delay}ms` }}
      className="reveal flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-nav"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{title}</p>
        {badge && (
          <span className="shrink-0 rounded-full bg-brand-purple/10 px-2 py-0.5 text-[10px] font-semibold text-brand-purple">
            {badge}
          </span>
        )}
      </div>
      <p className="text-2xl font-semibold text-foreground tabular-nums leading-none">{value}</p>
      <p className="text-xs text-muted-foreground leading-snug">{sub}</p>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-brand-purple transition-[width] duration-700 ease-out"
          style={{ width: visible ? `${Math.min(progress, 100)}%` : '0%' }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground tabular-nums">{Math.round(progress)}% complete</p>
    </div>
  );
}

/* ── Monthly revenue line chart ─────────────────────────────────────── */
function RevenueChart({ trend }: { trend: ManagerDashboardData['monthly_revenue_trend'] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const { ref, visible } = useReveal<HTMLDivElement>();
  const n = trend.length;
  if (n === 0) return <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">No data yet.</div>;

  const actuals = trend.map((m) => asNumber(m.revenue));
  const targets = trend.map((m) => asNumber(m.target));
  const maxVal  = Math.max(...actuals, ...targets, 1);

  const toCoords = (vals: number[]) =>
    vals.map((v, i) => ({ x: (i / (n - 1)) * 100, y: 84 - (v / maxVal) * 76 + 2 }));

  const actualCoords = toCoords(actuals);
  const targetCoords = toCoords(targets);

  const linePath = (coords: { x: number; y: number }[]) =>
    coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');

  return (
    <div ref={ref} data-visible={visible} className="reveal mt-4">
      <svg viewBox="0 0 100 90" preserveAspectRatio="none" className="h-40 w-full overflow-visible" aria-hidden>
        {[0, 22, 44, 66, 88].map((y) => (
          <line key={y} x1="0" x2="100" y1={y} y2={y}
            stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" className="text-border" />
        ))}
        {/* Target dashed */}
        <path d={linePath(targetCoords)} fill="none" stroke="currentColor" strokeWidth="1.5"
          strokeDasharray="3 2" vectorEffect="non-scaling-stroke" className="text-muted-foreground/40" />
        {/* Actual area + line */}
        <path d={`${linePath(actualCoords)} L100,90 L0,90 Z`}
          fill="var(--brand-purple)" fillOpacity="0.10" stroke="none" />
        <path d={linePath(actualCoords)} fill="none" stroke="var(--brand-purple)"
          strokeWidth="2" vectorEffect="non-scaling-stroke" />
        {actualCoords.map((c, i) => (
          <g key={i}>
            <circle cx={c.x.toFixed(1)} cy={c.y.toFixed(1)}
              r={hovered === i ? '2.5' : '1.6'} fill="var(--brand-cyan)"
              vectorEffect="non-scaling-stroke" className="transition-all duration-150" />
            <rect x={`${c.x - 4}`} y="0" width="8" height="90"
              fill="transparent" className="cursor-pointer"
              onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} />
          </g>
        ))}
      </svg>
      <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
        {trend.map((m) => <span key={m.month}>{m.month}</span>)}
      </div>
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────────────── */
export default function ManagerDashboardView({ onTabChange }: ManagerDashboardViewProps) {
  const [data, setData]       = useState<ManagerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getManagerDashboard()
      .then((d) => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch((e) => { if (!cancelled) { setError(e?.message ?? 'Failed'); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 rounded-xl bg-secondary" />
        <div className="grid gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-36 rounded-2xl border border-border bg-card" />
          ))}
        </div>
        <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
          <div className="h-72 rounded-2xl border border-border bg-card" />
          <div className="h-72 rounded-2xl border border-border bg-card" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-destructive">
        <p className="font-semibold">Couldn't load manager dashboard</p>
        <p className="mt-1 text-sm">{error ?? 'No data returned.'}</p>
      </div>
    );
  }

  const s        = data.summary;
  const pipeline = data.pipeline_health;
  const forecast = data.forecast;
  const revenue  = data.revenue_stats;
  const leaderboards = [...data.rep_quota_attainment].sort((a, b) => a.rank - b.rank);
  const riskDeals    = data.deals_at_risk;
  const alerts       = data.alerts;
  const activities   = data.recent_activities;

  const pipelineStages = pipeline.stage_distribution.map((st, i) => ({
    name:  st.stage,
    count: st.deal_count,
    value: formatINR(st.total_value),
    pct:   Math.max(Math.round(asNumber(st.percentage)), 3),
    bg:    STAGE_COLORS[i % STAGE_COLORS.length],
  }));
  const maxPct = Math.max(...pipelineStages.map((s) => s.pct), 1);

  return (
    <div className="space-y-6">

      {/* Page title — flat, no card wrapper */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-[2.75rem]">
          Sales overview
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
          Team at <strong className="font-semibold text-foreground">{formatPct(s.quota_achievement)}</strong> quota
          across <strong className="font-semibold text-foreground">{s.team_members}</strong> members.
        </p>
      </div>

      {/* 3 KPI tiles */}
      <div className="grid gap-3 md:grid-cols-3">
        <KpiTile
          title="Team Revenue Won"
          value={formatINR(revenue.team_revenue_won)}
          sub={`Target ${formatINR(revenue.team_target)}`}
          progress={asNumber(revenue.achievement_pct)}
          badge={formatPct(revenue.monthly_growth_pct)}
          delay={0}
        />
        <KpiTile
          title="Forecast Projection"
          value={formatINR(forecast.projected_revenue)}
          sub={`Confidence ${Math.round(asNumber(forecast.confidence_score))}% · Accuracy ${Math.round(asNumber(forecast.forecast_accuracy))}%`}
          progress={asNumber(forecast.confidence_score)}
          delay={75}
        />
        <KpiTile
          title="Pipeline Health"
          value={formatINR(pipeline.active_pipeline_value)}
          sub={`${pipeline.total_deals} active deals`}
          progress={asNumber(pipeline.health_score)}
          badge={asNumber(pipeline.health_score) >= 70 ? 'Strong' : 'Watch'}
          delay={150}
        />
      </div>

      {/* Quota attainment + Pipeline stage breakdown */}
      <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">

        {/* Quota attainment bars */}
        <div className="rounded-2xl border border-border bg-card p-5 hover:-translate-y-0.5 hover:shadow-nav transition-all duration-200">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight text-foreground">
              <BarChart3 size={15} className="text-brand-purple" />
              Rep quota attainment
            </h2>
            <span className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground">
              This quarter <ChevronDown size={13} />
            </span>
          </div>
          <div className="space-y-4">
            {leaderboards.map((rep) => {
              const pct = asNumber(rep.assigned_target) > 0
                ? Math.round((asNumber(rep.revenue_generated) / asNumber(rep.assigned_target)) * 100)
                : 0;
              return (
                <div key={rep.user_id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-medium text-foreground">
                      <span className="grid size-5 place-items-center rounded-full bg-secondary text-[10px] font-semibold text-brand-purple">
                        {rep.rank}
                      </span>
                      <span className="truncate max-w-[130px]">{rep.full_name}</span>
                    </span>
                    <div className="flex items-center gap-2 tabular-nums">
                      <span className="font-semibold text-foreground">{formatINR(rep.revenue_generated)}</span>
                      <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${pct >= 90 ? 'bg-brand-cyan/15 text-brand-cyan' : 'bg-brand-purple/10 text-brand-purple'}`}>
                        {pct}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-brand-purple transition-[width] duration-700 ease-out"
                      style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                </div>
              );
            })}
            {leaderboards.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">No rep data yet.</p>
            )}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
            <span className="text-xs text-muted-foreground">
              Avg attainment: <strong className="font-semibold text-foreground">
                {leaderboards.length
                  ? Math.round(leaderboards.reduce((a, r) => a + asNumber(r.quota_achievement_pct), 0) / leaderboards.length)
                  : 0}%
              </strong>
            </span>
            <button onClick={() => onTabChange?.('team performance')}
              className="flex items-center gap-1 text-xs font-medium text-brand-purple hover:underline cursor-pointer">
              Details <ArrowUpRight size={12} />
            </button>
          </div>
        </div>

        {/* Pipeline stage breakdown — rounded-full bars */}
        <div className="rounded-2xl border border-border bg-card p-5 hover:-translate-y-0.5 hover:shadow-nav transition-all duration-200">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight text-foreground">
              <Layers size={15} className="text-brand-purple" />
              Deals by stage
            </h2>
            <span className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground">
              This month <ChevronDown size={13} />
            </span>
          </div>
          <ul className="space-y-3">
            {pipelineStages.map((st, i) => (
              <li key={st.name} className="grid grid-cols-[7rem_minmax(0,1fr)_2.5rem] items-center gap-3">
                <span className="truncate text-xs font-medium text-foreground">{st.name}</span>
                <div className="h-6 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={`grid h-full place-items-center rounded-full text-[10px] font-semibold text-primary-foreground transition-[width] duration-700 ease-out ${st.bg}`}
                    style={{ width: `${(st.pct / maxPct) * 100}%`, transitionDelay: `${i * 70}ms` }}
                  >
                    {st.count}
                  </div>
                </div>
                <span className="text-right text-xs text-muted-foreground tabular-nums">{st.count}</span>
              </li>
            ))}
            {pipelineStages.length === 0 && (
              <li className="py-4 text-center text-sm text-muted-foreground">No pipeline data yet.</li>
            )}
          </ul>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
            <span className="text-xs text-muted-foreground">
              Conversion: <strong className="font-semibold text-foreground">{formatPct(s.conversion_rate)}</strong>
            </span>
            <button onClick={() => onTabChange?.('leads')}
              className="flex items-center gap-1 text-xs font-medium text-brand-purple hover:underline cursor-pointer">
              Funnel <ArrowUpRight size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Monthly revenue trend */}
      <div className="rounded-2xl border border-border bg-card p-5 hover:-translate-y-0.5 hover:shadow-nav transition-all duration-200">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight text-foreground">
            <TrendingUp size={15} className="text-brand-purple" />
            Monthly revenue vs target
          </h2>
          <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ backgroundColor: 'var(--brand-purple)' }} />
              Actual
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-muted-foreground/40" />
              Target
            </span>
          </div>
        </div>
        <RevenueChart trend={data.monthly_revenue_trend} />
      </div>

      {/* Leaderboard + Deals at risk */}
      <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">

        {/* Leaderboard */}
        <div className="rounded-2xl border border-border bg-card p-5 hover:-translate-y-0.5 hover:shadow-nav transition-all duration-200">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight text-foreground">
              <Award size={15} className="text-brand-purple" />
              Top reps
            </h2>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Quota attainment
            </span>
          </div>
          <div className="space-y-2.5">
            {leaderboards.map((rep) => (
              <div key={rep.user_id}
                className="flex items-center gap-3 rounded-xl border border-border bg-secondary/50 px-3 py-2.5 hover:bg-secondary transition-colors">
                <span className="text-xs font-semibold text-brand-purple w-4 shrink-0">#{rep.rank}</span>
                <div className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary border border-border text-[11px] font-semibold text-brand-purple">
                  {rep.full_name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-foreground">{rep.full_name}</p>
                  <p className="text-[10px] text-muted-foreground tabular-nums">{formatINR(rep.revenue_generated)}</p>
                </div>
                <div className="w-20 h-1.5 overflow-hidden rounded-full bg-border shrink-0">
                  <div className="h-full rounded-full bg-brand-purple"
                    style={{ width: `${Math.min(asNumber(rep.quota_achievement_pct), 100)}%` }} />
                </div>
              </div>
            ))}
            {leaderboards.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">No rep data yet.</p>
            )}
          </div>
          <div className="mt-4 flex justify-end border-t border-border pt-3">
            <button onClick={() => onTabChange?.('team performance')}
              className="flex items-center gap-1 text-xs font-medium text-brand-purple hover:underline cursor-pointer">
              Full leaderboard <ArrowRight size={12} />
            </button>
          </div>
        </div>

        {/* Deals at risk */}
        <div className="rounded-2xl border border-border bg-card p-5 hover:-translate-y-0.5 hover:shadow-nav transition-all duration-200">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight text-foreground">
              <AlertTriangle size={15} className="text-destructive" />
              Deals at risk
            </h2>
            <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive uppercase tracking-wide">
              Escalated
            </span>
          </div>
          <div className="space-y-2.5">
            {riskDeals.map((deal) => (
              <div key={deal.deal_id}
                className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 hover:bg-destructive/8 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-foreground">{deal.deal_name}</p>
                    <p className="text-[10px] text-brand-purple font-medium mt-0.5">{deal.company ?? '—'}</p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-destructive tabular-nums">{formatINR(deal.deal_value)}</span>
                </div>
                <div className="mt-2.5 flex items-center justify-between border-t border-destructive/15 pt-2 text-[10px]">
                  <span className="text-muted-foreground">{deal.owner_name ?? 'Unassigned'}</span>
                  <span className="rounded bg-destructive/15 px-1.5 py-0.5 font-semibold text-destructive uppercase tracking-wide">
                    {deal.risk_reason}
                  </span>
                </div>
              </div>
            ))}
            {riskDeals.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">No deals currently at risk.</p>
            )}
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="rounded-2xl border border-border bg-card p-5 hover:-translate-y-0.5 hover:shadow-nav transition-all duration-200">
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold tracking-tight text-foreground border-b border-border pb-3">
          <BellRing size={15} className="text-brand-purple" />
          Alerts &amp; signals
        </h2>
        <div className="space-y-2.5">
          {alerts.map((alert, idx) => {
            const isWarn = alert.severity === 'high' || alert.severity === 'warning';
            const isOk   = alert.severity === 'success';
            return (
              <div key={idx}
                className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-xs
                  ${isWarn ? 'border-destructive/25 bg-destructive/8 text-foreground'
                    : isOk  ? 'border-brand-cyan/25 bg-brand-cyan/8 text-foreground'
                            : 'border-border bg-secondary text-foreground'}`}
              >
                <div className="flex items-start gap-2.5">
                  {isWarn ? <ShieldAlert size={14} className="mt-0.5 shrink-0 text-destructive" />
                    : isOk ? <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-brand-cyan" />
                           : <Sparkles size={14} className="mt-0.5 shrink-0 text-brand-purple" />}
                  <span>{alert.message}</span>
                </div>
                <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums">
                  {new Date(alert.timestamp).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })}
          {alerts.length === 0 && <p className="py-2 text-sm text-muted-foreground">No active alerts.</p>}
        </div>
      </div>

      {/* Team activity */}
      <div className="rounded-2xl border border-border bg-card p-5 hover:-translate-y-0.5 hover:shadow-nav transition-all duration-200">
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold tracking-tight text-foreground border-b border-border pb-3">
          <Activity size={15} className="text-brand-purple" />
          Recent team activity
        </h2>
        <div className="divide-y divide-border">
          {activities.map((act, idx) => (
            <div key={idx} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
              <div className="grid size-7 shrink-0 place-items-center rounded-full bg-secondary text-[10px] font-semibold text-brand-purple border border-border mt-0.5">
                {act.title.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground leading-relaxed">
                  <span className="font-medium">{act.title}</span> {act.action}
                </p>
                <span className="flex items-center gap-1 mt-0.5 text-[10px] text-muted-foreground">
                  <Clock size={10} />
                  {new Date(act.created_at).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          {activities.length === 0 && <p className="py-2 text-sm text-muted-foreground">No recent activity.</p>}
        </div>
        <div className="mt-4 flex justify-end border-t border-border pt-3">
          <button onClick={() => onTabChange?.('reports')}
            className="flex items-center gap-1 text-xs font-medium text-brand-purple hover:underline cursor-pointer">
            View all reports <ArrowRight size={12} />
          </button>
        </div>
      </div>

    </div>
  );
}
