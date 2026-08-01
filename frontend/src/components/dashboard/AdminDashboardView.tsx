'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Building2,
  UserPlus,
  Users,
  ChevronDown,
  ArrowRight,
} from 'lucide-react';
import {
  getAdminDashboard,
  asNumber,
  formatINR,
  formatNum,
  formatPct,
  AdminDashboardData,
} from '@/utils/api';
import { useReveal } from '@/hooks/use-reveal';

/* ── Sparkline (same Area-chart pattern as StatCards) ─────────────────── */
function Spark({ values, positive }: { values: number[]; positive: boolean }) {
  if (values.length < 2) return null;
  const max   = Math.max(...values, 1);
  const min   = Math.min(...values, 0);
  const range = max - min || 1;
  const n     = values.length;
  const coords = values.map((v, i) => ({
    x: (i / (n - 1)) * 100,
    y: 34 - ((v - min) / range) * 30 + 2,
  }));
  const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  const area = `${line} L${coords[n-1].x.toFixed(1)},40 L0,40 Z`;
  const stroke = positive ? 'var(--brand-purple)' : 'var(--destructive)';
  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-8 w-full" aria-hidden>
      <path d={area} fill={stroke} fillOpacity="0.12" stroke="none" />
      <path d={line} fill="none" stroke={stroke} strokeWidth="2" vectorEffect="non-scaling-stroke" />
      {coords.map((c, i) => (
        <circle key={i} cx={c.x.toFixed(1)} cy={c.y.toFixed(1)} r="1.6" fill="var(--brand-cyan)" vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}

/* ── KPI stat tile (spec §4 pattern) ─────────────────────────────────── */
interface KpiTile {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  values: number[];
  icon: React.ElementType;
}

function StatTile({ tile, delay = 0 }: { tile: KpiTile; delay?: number }) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  const Delta = tile.isPositive ? ArrowUpRight : ArrowDownRight;
  return (
    <div
      ref={ref}
      data-visible={visible}
      style={{ transitionDelay: `${delay}ms` }}
      className="reveal flex flex-col gap-2.5 rounded-2xl border border-border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-nav"
    >
      <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary text-brand-purple">
        <tile.icon size={16} strokeWidth={2} />
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground leading-none">
        {tile.title}
      </p>
      <p className="text-2xl font-semibold text-foreground tabular-nums leading-none">
        {tile.value}
      </p>
      <p className={`flex items-center gap-1 text-[11px] font-bold ${tile.isPositive ? 'text-brand-cyan' : 'text-destructive'}`}>
        <Delta size={12} strokeWidth={2.5} className="shrink-0" />
        <span>{tile.change}</span>
        <span className="font-medium text-muted-foreground">vs last month</span>
      </p>
      <Spark values={tile.values} positive={tile.isPositive} />
    </div>
  );
}

/* ── Revenue area chart ───────────────────────────────────────────────── */
function RevenueChart({
  monthly,
  visible,
}: {
  monthly: AdminDashboardData['monthly_sales'];
  visible: boolean;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const n = monthly.length;
  if (n === 0) return <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">No data yet.</div>;

  const revenues = monthly.map((m) => asNumber(m.revenue));
  const leads    = monthly.map((m) => m.leads_created);
  const maxRev   = Math.max(...revenues, 1);
  const maxLead  = Math.max(...leads, 1);

  const revCoords  = revenues.map((v, i) => ({ x: (i/(n-1))*100, y: 86 - (v/maxRev)*78 + 2 }));
  const leadCoords = leads.map((v, i)    => ({ x: (i/(n-1))*100, y: 86 - (v/maxLead)*78 + 2 }));

  const pathFor = (coords: { x: number; y: number }[]) =>
    coords.map((c, i) => `${i===0?'M':'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');

  const areaFor = (coords: { x: number; y: number }[]) => {
    const p = pathFor(coords);
    return `${p} L100,90 L0,90 Z`;
  };

  const revPath  = pathFor(revCoords);
  const leadPath = pathFor(leadCoords);

  return (
    <div className="mt-4">
      <svg
        viewBox="0 0 100 90"
        preserveAspectRatio="none"
        className="h-48 w-full overflow-visible"
        aria-hidden
      >
        {/* Grid lines */}
        {[0, 22, 44, 66, 88].map((y) => (
          <line key={y} x1="0" x2="100" y1={y} y2={y}
            stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke"
            className="text-border" />
        ))}
        {/* Revenue area + line */}
        <path d={areaFor(revCoords)} fill="var(--brand-purple)" fillOpacity="0.10" stroke="none" />
        <path
          d={revPath} fill="none" stroke="var(--brand-purple)" strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          strokeDasharray={visible ? 'none' : '200'}
          style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
        />
        {/* Leads area + line */}
        <path d={areaFor(leadCoords)} fill="var(--brand-cyan)" fillOpacity="0.08" stroke="none" />
        <path d={leadPath} fill="none" stroke="var(--brand-cyan)" strokeWidth="1.5"
          vectorEffect="non-scaling-stroke" strokeDasharray="3 2" />
        {/* Data points + hover zones */}
        {revCoords.map((c, i) => (
          <g key={i}>
            <circle cx={c.x.toFixed(1)} cy={c.y.toFixed(1)} r={hovered===i ? '2.5' : '1.6'}
              fill="var(--brand-cyan)" vectorEffect="non-scaling-stroke" className="transition-all duration-150" />
            <rect
              x={`${c.x - 4}`} y="0" width="8" height="90"
              fill="transparent" className="cursor-pointer"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
          </g>
        ))}
        {/* Hover tooltip via foreignObject */}
        {hovered !== null && (
          <foreignObject
            x={Math.min(revCoords[hovered].x - 12, 72)}
            y={Math.max(revCoords[hovered].y - 20, 0)}
            width="26" height="12"
          >
            <div className="rounded bg-ink px-1.5 py-0.5 text-[8px] font-semibold text-primary-foreground whitespace-nowrap">
              {formatINR(monthly[hovered].revenue)}
            </div>
          </foreignObject>
        )}
      </svg>
      <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
        {monthly.map((m) => (
          <span key={m.month}>
            {new Date(`${m.month}-01`).toLocaleDateString('en-IN', { month: 'short', timeZone: 'UTC' })}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Donut chart ─────────────────────────────────────────────────────── */
const DONUT_COLORS = [
  'var(--brand-purple)',
  'var(--brand-cyan)',
  'var(--brand-blue)',
  'var(--chart-4)',
  'var(--chart-5)',
];

function DonutChart({
  data,
}: {
  data: { name: string; pct: number }[];
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const CIRC = 2 * Math.PI * 56;
  let acc = 0;
  const segments = data.map((d, i) => {
    const dash = (d.pct / 100) * CIRC;
    const offset = -(acc / 100) * CIRC;
    acc += d.pct;
    return { ...d, dash, offset, color: DONUT_COLORS[i % DONUT_COLORS.length] };
  });

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative size-36">
        <svg className="size-full -rotate-90" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r="56" fill="none" stroke="var(--secondary)" strokeWidth="16" />
          {segments.map((seg, i) => (
            <circle
              key={i}
              cx="80" cy="80" r="56"
              fill="none"
              stroke={seg.color}
              strokeWidth={hovered === i ? 22 : 16}
              strokeDasharray={`${seg.dash} ${CIRC}`}
              strokeDashoffset={seg.offset}
              className="cursor-pointer transition-all duration-150"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-lg font-semibold text-foreground tabular-nums leading-none">
            {hovered !== null ? `${segments[hovered].pct}%` : `${data.length}`}
          </span>
          <span className="mt-0.5 text-[10px] text-muted-foreground uppercase tracking-wide leading-none">
            {hovered !== null ? segments[hovered].name : 'Sources'}
          </span>
        </div>
      </div>
      <div className="w-full space-y-1.5">
        {segments.map((seg, i) => (
          <div
            key={i}
            className={`flex items-center justify-between rounded-lg px-2 py-1 transition-colors cursor-pointer ${hovered === i ? 'bg-secondary' : ''}`}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="flex items-center gap-2">
              <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: seg.color }} />
              <span className="text-xs text-muted-foreground">{seg.name}</span>
            </div>
            <span className="text-xs font-semibold text-foreground tabular-nums">{seg.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────────────── */
export default function AdminDashboardView() {
  const [data, setData]       = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const { ref: chartRef, visible: chartVisible } = useReveal<HTMLDivElement>();

  useEffect(() => {
    let cancelled = false;
    getAdminDashboard()
      .then((d) => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch((e) => { if (!cancelled) { setError(e?.message ?? 'Failed to load'); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  /* ── Skeleton ── */
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-56 rounded-xl bg-secondary" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-36 rounded-2xl border border-border bg-card" />
          ))}
        </div>
        <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
          <div className="h-80 rounded-2xl border border-border bg-card" />
          <div className="h-80 rounded-2xl border border-border bg-card" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-destructive">
        <p className="font-semibold">Couldn't load admin dashboard</p>
        <p className="mt-1 text-sm">{error ?? 'No data returned.'}</p>
      </div>
    );
  }

  const s       = data.summary;
  const monthly = data.monthly_sales ?? [];
  const revSeries  = monthly.map((m) => asNumber(m.revenue));
  const leadSeries = monthly.map((m) => m.leads_created);

  const kpiTiles: KpiTile[] = [
    {
      title: 'Revenue (Month)',
      value: formatINR(s.revenue.this_month),
      change: formatPct(s.revenue.growth_pct),
      isPositive: asNumber(s.revenue.growth_pct) >= 0,
      values: revSeries.length ? revSeries : [4, 6, 5, 8, 9, 11],
      icon: Wallet,
    },
    {
      title: 'Active Users',
      value: formatNum(s.users.active),
      change: `+${s.users.new_this_month} new`,
      isPositive: s.users.new_this_month >= 0,
      values: leadSeries.length ? leadSeries : [2, 3, 4, 4, 5, 6],
      icon: Users,
    },
    {
      title: 'Companies',
      value: formatNum(s.companies.total),
      change: formatPct(s.companies.monthly_growth_pct),
      isPositive: asNumber(s.companies.monthly_growth_pct) >= 0,
      values: monthly.map((m) => m.leads_converted).length ? monthly.map((m) => m.leads_converted) : [3, 4, 4, 5, 6, 7],
      icon: Building2,
    },
    {
      title: 'New Leads',
      value: formatNum(s.leads.new_this_month),
      change: formatPct(s.leads.monthly_growth_pct),
      isPositive: asNumber(s.leads.monthly_growth_pct) >= 0,
      values: leadSeries.length ? leadSeries : [5, 7, 6, 9, 8, 11],
      icon: UserPlus,
    },
  ];

  const sourceData = data.lead_sources.map((src) => ({
    name: src.source || 'Unknown',
    pct: Math.round(asNumber(src.percentage)),
  }));

  const topCompanies = data.top_companies ?? [];

  return (
    <div className="space-y-6">

      {/* Page title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-[2.75rem]">
          Admin overview
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
          Organization health, revenue performance, lead funnel, and top performers.
        </p>
      </div>

      {/* KPI tiles */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpiTiles.map((tile, idx) => (
          <StatTile key={tile.title} tile={tile} delay={idx * 75} />
        ))}
      </div>

      {/* Revenue chart + Lead Sources */}
      <div
        ref={chartRef}
        data-visible={chartVisible}
        className="reveal grid gap-3 lg:grid-cols-[1.4fr_1fr]"
      >
        {/* Revenue over time */}
        <div className="rounded-2xl border border-border bg-card p-5 hover:-translate-y-0.5 hover:shadow-nav transition-all duration-200">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold tracking-tight text-foreground">
                Revenue &amp; leads over time
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground truncate">
                Closed-won revenue vs lead volume
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground">
              This year <ChevronDown size={13} />
            </span>
          </div>

          <RevenueChart monthly={monthly} visible={chartVisible} />

          {/* Summary row */}
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4 sm:grid-cols-4">
            {[
              { label: 'Revenue (yr)',   value: formatINR(s.revenue.this_year) },
              { label: 'Converted leads', value: formatNum(s.leads.converted) },
              { label: 'Contacts',       value: formatNum(s.contacts.total) },
              { label: 'Tasks pending',  value: formatNum(s.tasks.pending) },
            ].map((item) => (
              <div key={item.label} className="flex flex-col gap-0.5">
                <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
                <span className="text-sm font-semibold text-foreground tabular-nums">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Lead sources donut */}
        <div className="rounded-2xl border border-border bg-card p-5 hover:-translate-y-0.5 hover:shadow-nav transition-all duration-200">
          <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <h2 className="truncate text-base font-semibold tracking-tight text-foreground">
              Lead sources
            </h2>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground">
              All time <ChevronDown size={13} />
            </span>
          </div>
          {sourceData.length > 0 ? (
            <DonutChart data={sourceData} />
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No lead source data yet.</p>
          )}
        </div>
      </div>

      {/* Top companies table */}
      <div className="rounded-2xl border border-border bg-card p-5 hover:-translate-y-0.5 hover:shadow-nav transition-all duration-200">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight text-foreground">Top companies</h2>
          <span className="text-xs font-medium text-brand-purple cursor-pointer hover:underline">
            View all &rarr;
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border">
                {['Company', 'Revenue', 'Leads', 'Contacts', ''].map((h) => (
                  <th key={h} className="pb-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground pr-4 last:pr-0">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {topCompanies.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                    No company data available yet.
                  </td>
                </tr>
              )}
              {topCompanies.map((row, idx) => (
                <tr key={row.company_id || idx} className="group transition-colors hover:bg-secondary/50">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2.5">
                      <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-secondary text-brand-purple text-xs font-semibold">
                        {row.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{row.name}</p>
                        <p className="text-[10px] text-muted-foreground">Top account</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-sm font-semibold text-foreground tabular-nums">{formatINR(row.revenue)}</td>
                  <td className="py-3 pr-4 text-sm text-foreground tabular-nums">{formatNum(row.lead_count)}</td>
                  <td className="py-3 pr-4 text-sm text-foreground tabular-nums">{formatNum(row.contact_count)}</td>
                  <td className="py-3 text-right">
                    <button className="inline-flex size-7 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:bg-brand-purple hover:text-primary-foreground transition-colors cursor-pointer">
                      <ArrowRight size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
