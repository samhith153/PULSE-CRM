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
  Activity,
  Database,
  ShieldAlert,
  Key,
  Zap,
  Plug,
  ShieldCheck,
  CreditCard,
  UserCheck,
  AlertTriangle,
  RefreshCw,
  FileSpreadsheet,
} from 'lucide-react';
import {
  getAdminDashboard,
  asNumber,
  formatINR,
  formatNum,
  formatPct,
  AdminDashboardData,
} from '@/utils/api';
import { useReveal, useCountUp } from '@/hooks/use-reveal';
import { motion, AnimatePresence } from 'framer-motion';

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

  // Create cubic bezier curve through points for smooth monotone look
  let linePath = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[i];
    const p1 = coords[i + 1];
    const cpX1 = p0.x + (p1.x - p0.x) / 3;
    const cpY1 = p0.y;
    const cpX2 = p0.x + 2 * (p1.x - p0.x) / 3;
    const cpY2 = p1.y;
    linePath += ` C ${cpX1.toFixed(1)} ${cpY1.toFixed(1)}, ${cpX2.toFixed(1)} ${cpY2.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
  }

  const areaPath = `${linePath} L ${coords[n-1].x.toFixed(1)} 40 L 0 40 Z`;
  const strokeColor = positive ? 'var(--brand-cyan)' : 'var(--destructive)';

  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-8 w-full overflow-visible" aria-hidden>
      <motion.path 
        d={areaPath} 
        fill={strokeColor} 
        fillOpacity="0.08" 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      />
      <motion.path 
        d={linePath} 
        fill="none" 
        stroke={strokeColor} 
        strokeWidth="1.5" 
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
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
  targetValue: number;
  prefix?: string;
  suffix?: string;
}

function StatTile({ tile, delay = 0 }: { tile: KpiTile; delay?: number }) {
  const { ref, value, visible } = useCountUp(tile.targetValue, 1000);
  const Delta = tile.isPositive ? ArrowUpRight : ArrowDownRight;

  const displayVal = tile.targetValue === 0 
    ? tile.value 
    : `${tile.prefix ?? ''}${value.toLocaleString()}${tile.suffix ?? ''}`;

  return (
    <motion.div
      ref={ref as React.RefObject<HTMLDivElement>}
      initial={{ opacity: 0, y: 15 }}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
      whileHover={{ y: -4, boxShadow: 'var(--shadow-card-hover)' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: delay / 1000 }}
      className="flex flex-col gap-[var(--space-2)] rounded-2xl border border-border bg-card p-[var(--space-4)] shadow-card transition-colors duration-200 cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary text-brand-purple">
          <tile.icon size={16} strokeWidth={2} />
        </div>
        <p className={`flex items-center gap-1 text-[11px] font-bold ${tile.isPositive ? 'text-brand-cyan' : 'text-destructive'}`}>
          <Delta size={12} strokeWidth={2.5} className="shrink-0" />
          <span>{tile.change}</span>
        </p>
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground leading-none">
        {tile.title}
      </p>
      <p className="text-2xl font-semibold text-foreground tabular-nums leading-none">
        {displayVal}
      </p>
      <span className="text-[10px] text-muted-foreground/60 font-semibold mt-0.5">vs last month</span>
      <div className="mt-2">
        <Spark values={tile.values} positive={tile.isPositive} />
      </div>
    </motion.div>
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

  const curvePath = (coords: { x: number; y: number }[]) => {
    if (coords.length === 0) return '';
    let path = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i];
      const p1 = coords[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 3;
      const cpY1 = p0.y;
      const cpX2 = p0.x + 2 * (p1.x - p0.x) / 3;
      const cpY2 = p1.y;
      path += ` C ${cpX1.toFixed(1)} ${cpY1.toFixed(1)}, ${cpX2.toFixed(1)} ${cpY2.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
    }
    return path;
  };

  const revPathStr = curvePath(revCoords);
  const revAreaStr = `${revPathStr} L 100 90 L 0 90 Z`;

  const leadPathStr = curvePath(leadCoords);
  const leadAreaStr = `${leadPathStr} L 100 90 L 0 90 Z`;

  return (
    <div className="mt-4 relative">
      <svg
        viewBox="0 0 100 90"
        preserveAspectRatio="none"
        className="h-48 w-full overflow-visible"
        aria-hidden
      >
        <defs>
          <linearGradient id="adminRevGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--brand-purple)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--brand-purple)" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="adminLeadGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--brand-cyan)" stopOpacity="0.12" />
            <stop offset="100%" stopColor="var(--brand-cyan)" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 22, 44, 66, 88].map((y) => (
          <line key={y} x1="0" x2="100" y1={y} y2={y}
            stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" strokeOpacity={0.4} vectorEffect="non-scaling-stroke"
            className="text-border" />
        ))}

        {/* Revenue area */}
        <motion.path
          d={revAreaStr}
          fill="url(#adminRevGrad)"
          initial={{ opacity: 0 }}
          animate={visible ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.8 }}
        />
        {/* Revenue line */}
        <motion.path
          d={revPathStr}
          fill="none"
          stroke="var(--brand-purple)"
          strokeWidth="2.5"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0 }}
          animate={visible ? { pathLength: 1 } : { pathLength: 0 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        />

        {/* Leads area */}
        <motion.path
          d={leadAreaStr}
          fill="url(#adminLeadGrad)"
          initial={{ opacity: 0 }}
          animate={visible ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        />
        {/* Leads line */}
        <motion.path
          d={leadPathStr}
          fill="none"
          stroke="var(--brand-cyan)"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0 }}
          animate={visible ? { pathLength: 1 } : { pathLength: 0 }}
          transition={{ duration: 1.2, ease: "easeInOut", delay: 0.2 }}
        />

        {/* Data points + hover zones */}
        {revCoords.map((c, i) => (
          <g key={i}>
            <circle cx={c.x.toFixed(1)} cy={c.y.toFixed(1)} r={hovered===i ? '2.5' : '1.8'}
              fill="var(--brand-cyan)" stroke="var(--background)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" className="transition-all duration-150" />
            <rect
              x={`${c.x - 4}`} y="0" width="8" height="90"
              fill="transparent" className="cursor-pointer"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
          </g>
        ))}
      </svg>

      <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
        {monthly.map((m) => (
          <span key={m.month}>
            {new Date(`${m.month}-01`).toLocaleDateString('en-IN', { month: 'short', timeZone: 'UTC' })}
          </span>
        ))}
      </div>

      {/* Hover tooltip */}
      <AnimatePresence>
        {hovered !== null && (
          <motion.div 
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-2 left-1/2 -translate-x-1/2 bg-popover border border-border rounded-xl shadow-float p-3 text-xs flex gap-4 z-20"
          >
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Month</p>
              <p className="font-semibold text-foreground mt-0.5">
                {new Date(`${monthly[hovered].month}-01`).toLocaleDateString('en-IN', { month: 'short', year: 'numeric', timeZone: 'UTC' })}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-brand-purple">Revenue</p>
              <p className="font-semibold text-foreground mt-0.5">{formatINR(asNumber(monthly[hovered].revenue))}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-brand-cyan">Leads</p>
              <p className="font-semibold text-foreground mt-0.5">{monthly[hovered].leads_created}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
          <circle cx="80" cy="80" r="56" fill="none" stroke="var(--secondary)" strokeWidth="14" />
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
              className="cursor-pointer transition-all duration-200"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-xl font-bold text-foreground tabular-nums leading-none">
            {hovered !== null ? `${segments[hovered].pct}%` : `100%`}
          </span>
          <span className="mt-1 text-[9px] font-bold text-muted-foreground uppercase tracking-wider leading-none">
            {hovered !== null ? segments[hovered].name : 'Sources'}
          </span>
        </div>
      </div>
      <div className="w-full space-y-1.5">
        {segments.map((seg, i) => (
          <div
            key={i}
            className={`flex items-center justify-between rounded-lg py-[var(--space-1)] px-[var(--space-2)] transition-colors cursor-pointer ${hovered === i ? 'bg-secondary' : ''}`}
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
  const chartVisible = true;

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
      <div className="space-y-[var(--space-5)] animate-pulse">
        <div className="h-8 w-56 rounded-xl bg-secondary" />
        <div className="grid gap-[var(--space-4)] sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-36 rounded-2xl border border-border bg-card" />
          ))}
        </div>
        <div className="grid gap-[var(--space-4)] lg:grid-cols-[1.4fr_1fr]">
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
      targetValue: asNumber(s.revenue.this_month),
      prefix: '₹',
    },
    {
      title: 'Active Users',
      value: formatNum(s.users.active),
      change: `+${s.users.new_this_month} new`,
      isPositive: s.users.new_this_month >= 0,
      values: leadSeries.length ? leadSeries : [2, 3, 4, 4, 5, 6],
      icon: Users,
      targetValue: asNumber(s.users.active),
    },
    {
      title: 'Companies',
      value: formatNum(s.companies.total),
      change: formatPct(s.companies.monthly_growth_pct),
      isPositive: asNumber(s.companies.monthly_growth_pct) >= 0,
      values: monthly.map((m) => m.leads_converted).length ? monthly.map((m) => m.leads_converted) : [3, 4, 4, 5, 6, 7],
      icon: Building2,
      targetValue: asNumber(s.companies.total),
    },
    {
      title: 'New Leads',
      value: formatNum(s.leads.new_this_month),
      change: formatPct(s.leads.monthly_growth_pct),
      isPositive: asNumber(s.leads.monthly_growth_pct) >= 0,
      values: leadSeries.length ? leadSeries : [5, 7, 6, 9, 8, 11],
      icon: UserPlus,
      targetValue: asNumber(s.leads.new_this_month),
    },
  ];

  const sourceData = data.lead_sources.map((src) => ({
    name: src.source || 'Unknown',
    pct: Math.round(asNumber(src.percentage)),
  }));

  const topCompanies = data.top_companies ?? [];

  return (
    <div className="space-y-[var(--space-5)]">

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
      <div className="grid gap-[var(--space-4)] sm:grid-cols-2 lg:grid-cols-4">
        {kpiTiles.map((tile, idx) => (
          <StatTile key={tile.title} tile={tile} delay={idx * 75} />
        ))}
      </div>

      {/* Revenue chart + Lead Sources */}
      <div className="grid gap-[var(--space-4)] lg:grid-cols-[1.4fr_1fr]">
        {/* Revenue over time */}
        <div className="rounded-2xl border border-border bg-card p-[var(--space-4)] hover:-translate-y-0.5 hover:shadow-nav transition-all duration-200">
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
          <div className="mt-5 grid grid-cols-2 gap-[var(--space-3)] border-t border-border pt-[var(--space-4)] sm:grid-cols-4">
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
        <div className="rounded-2xl border border-border bg-card p-[var(--space-4)] hover:-translate-y-0.5 hover:shadow-nav transition-all duration-200">
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

      {/* Admin Operations & Systems Command Center */}
      <div className="space-y-6 mt-8">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            System Administration &amp; Control Center
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Monitor CRM health, data cleanliness, security events, seat licensing, and custom workflows.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Card 1: User & Role Management */}
          <motion.div
            whileHover={{ y: -4, boxShadow: 'var(--shadow-card-hover)' }}
            className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-card transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="grid size-9 place-items-center rounded-xl bg-secondary text-brand-purple">
                <UserCheck size={18} />
              </div>
              <span className="rounded-full bg-brand-purple/10 px-2.5 py-0.5 text-[10px] font-semibold text-brand-purple uppercase tracking-wider">
                Access
              </span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">User &amp; Role Management</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Active seats and role mapping</p>
            </div>
            
            <div className="space-y-3 mt-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Active Seats</span>
                <span className="font-semibold text-foreground tabular-nums">{s.users.active} / {s.users.total || 10}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                <div 
                  className="h-full rounded-full bg-brand-purple transition-all duration-500"
                  style={{ width: `${Math.min(100, (s.users.active / (s.users.total || 10)) * 100)}%` }}
                />
              </div>
              <div className="border-t border-border/40 pt-3 flex justify-between items-center text-[10px] text-muted-foreground/80">
                <span>Invites Pending: <strong className="text-brand-purple font-semibold">3</strong></span>
                <span>Roles: Admin (1), Mgr (2), Rep (3)</span>
              </div>
            </div>
          </motion.div>

          {/* Card 2: System Health */}
          <motion.div
            whileHover={{ y: -4, boxShadow: 'var(--shadow-card-hover)' }}
            className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-card transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="grid size-9 place-items-center rounded-xl bg-secondary text-brand-cyan">
                <Activity size={18} />
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-brand-cyan/10 px-2.5 py-0.5 text-[10px] font-semibold text-brand-cyan uppercase tracking-wider">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-cyan opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-cyan"></span>
                </span>
                99.98%
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">System Health</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Uptime &amp; backend error logs</p>
            </div>
            
            <div className="space-y-2.5 text-xs mt-1">
              <div className="flex items-center justify-between pb-1.5 border-b border-border/40">
                <span className="text-muted-foreground">API Gateway</span>
                <span className="font-semibold text-brand-cyan">Operational</span>
              </div>
              <div className="flex items-center justify-between pb-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Async Workers</span>
                <span className="font-semibold text-brand-cyan">100% Load OK</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Telephony API</span>
                <span className="font-semibold text-amber-500">Degraded (110ms)</span>
              </div>
              <div className="border-t border-border/40 mt-1.5 pt-3 flex items-center justify-between text-[10px] text-muted-foreground/80">
                <span>Logs (24h): <strong className="text-foreground">0 Critical</strong></span>
                <span className="text-amber-500 font-semibold">2 Warnings</span>
              </div>
            </div>
          </motion.div>

          {/* Card 3: Data Quality */}
          <motion.div
            whileHover={{ y: -4, boxShadow: 'var(--shadow-card-hover)' }}
            className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-card transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="grid size-9 place-items-center rounded-xl bg-secondary text-emerald-500">
                <Database size={18} />
              </div>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-500 uppercase tracking-wider">
                92.4% Health
              </span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Data Quality</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Duplicate records &amp; missing fields</p>
            </div>
            
            <div className="space-y-2.5 text-xs mt-1">
              <div className="flex items-center justify-between pb-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Duplicates Detected</span>
                <span className="font-semibold text-amber-500 tabular-nums">14 contacts</span>
              </div>
              <div className="flex items-center justify-between pb-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Incomplete Fields</span>
                <span className="font-semibold text-foreground tabular-nums">32 fields</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Orphaned Leads</span>
                <span className="font-semibold text-destructive tabular-nums">18 leads</span>
              </div>
              <div className="border-t border-border/40 mt-1.5 pt-3 flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">Check interval: <strong className="text-foreground">Daily</strong></span>
                <span className="text-brand-purple hover:underline font-semibold flex items-center gap-0.5">Deduplicate &rarr;</span>
              </div>
            </div>
          </motion.div>

          {/* Card 4: License & Seat Usage */}
          <motion.div
            whileHover={{ y: -4, boxShadow: 'var(--shadow-card-hover)' }}
            className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-card transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="grid size-9 place-items-center rounded-xl bg-secondary text-amber-500">
                <CreditCard size={18} />
              </div>
              <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-amber-500 uppercase tracking-wider">
                Enterprise
              </span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">License &amp; Seat Usage</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Seat purchases and storage limits</p>
            </div>
            
            <div className="space-y-3 mt-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Storage Used</span>
                <span className="font-semibold text-foreground tabular-nums">4.2 GB / 10 GB</span>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                <div 
                  className="h-full rounded-full bg-amber-500"
                  style={{ width: '42%' }}
                />
              </div>
              <div className="border-t border-border/40 pt-3 flex justify-between items-center text-[10px] text-muted-foreground/80">
                <span>Seats: <strong className="text-foreground">{s.users.active} / {s.users.total || 10} used</strong></span>
                <span className="text-destructive font-semibold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-ping"></span>
                  Nearing Limit
                </span>
              </div>
            </div>
          </motion.div>

          {/* Card 6: Audit Log (Wider grid span for clean layout) */}
          <motion.div
            whileHover={{ y: -4, boxShadow: 'var(--shadow-card-hover)' }}
            className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-card transition-all cursor-pointer sm:col-span-2 lg:col-span-2"
          >
            <div className="flex items-center justify-between">
              <div className="grid size-9 place-items-center rounded-xl bg-secondary text-rose-500">
                <ShieldCheck size={18} />
              </div>
              <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-rose-500 uppercase tracking-wider">
                Security &amp; Audit
              </span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Audit Log</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Administrative actions and data compliance logs</p>
            </div>
            
            <div className="space-y-3 mt-1 text-xs">
              <div className="flex items-center justify-between gap-4 border-b border-border/40 pb-2">
                <div className="min-w-0 flex items-center gap-3">
                  <span className="font-semibold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded text-[10px]">EXPORT</span>
                  <p className="truncate text-foreground font-medium"><strong className="text-foreground">Admin</strong> exported 50 leads to CSV</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-muted-foreground font-medium">20m ago</p>
                  <p className="text-[9px] text-muted-foreground/60">IP: 192.168.1.45</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between gap-4 border-b border-border/40 pb-2">
                <div className="min-w-0 flex items-center gap-3">
                  <span className="font-semibold text-brand-purple bg-brand-purple/10 px-2 py-0.5 rounded text-[10px]">ROLE_UPD</span>
                  <p className="truncate text-foreground font-medium"><strong className="text-foreground">Sarah.J</strong> updated role of Mike.C to Manager</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-muted-foreground font-medium">2h ago</p>
                  <p className="text-[9px] text-muted-foreground/60">Console Admin</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex items-center gap-3">
                  <span className="font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded text-[10px]">BULK_DEL</span>
                  <p className="truncate text-foreground font-medium"><strong className="text-foreground">System</strong> bulk-deleted 18 dead leads</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-muted-foreground font-medium">5h ago</p>
                  <p className="text-[9px] text-muted-foreground/60">Clean sweep job</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 5: Integration Status */}
          <motion.div
            whileHover={{ y: -4, boxShadow: 'var(--shadow-card-hover)' }}
            className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-card transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="grid size-9 place-items-center rounded-xl bg-secondary text-blue-500">
                <Plug size={18} />
              </div>
              <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-blue-500 uppercase tracking-wider">
                4 Active
              </span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Integration Status</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Third-party connections &amp; syncs</p>
            </div>
            
            <div className="space-y-2.5 text-xs mt-1">
              <div className="flex items-center justify-between pb-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Email Sync</span>
                <span className="font-medium text-brand-cyan flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan"></span>
                  Active (3m ago)
                </span>
              </div>
              <div className="flex items-center justify-between pb-1.5 border-b border-border/40">
                <span className="text-muted-foreground">WhatsApp Business</span>
                <span className="font-medium text-brand-cyan flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan"></span>
                  Synced (12m ago)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">HubSpot Sync</span>
                <span className="font-semibold text-destructive flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse"></span>
                  Failed (Auth)
                </span>
              </div>
              <div className="border-t border-border/40 mt-1.5 pt-3 text-[10px] text-destructive/80 font-medium">
                Action: Reconnect HubSpot Integration
              </div>
            </div>
          </motion.div>

          {/* Card 7: Custom Field & Workflow Usage */}
          <motion.div
            whileHover={{ y: -4, boxShadow: 'var(--shadow-card-hover)' }}
            className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-card transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="grid size-9 place-items-center rounded-xl bg-secondary text-orange-500">
                <Zap size={18} />
              </div>
              <span className="rounded-full bg-orange-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-orange-500 uppercase tracking-wider">
                Usage
              </span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Custom Fields &amp; Workflows</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Automation and custom schema utility</p>
            </div>
            
            <div className="space-y-2.5 text-xs mt-1">
              <div className="flex items-center justify-between pb-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Custom Fields</span>
                <span className="font-semibold text-foreground">14 active <span className="text-muted-foreground/60 font-normal text-[10px] ml-1">(8 idle)</span></span>
              </div>
              <div className="flex items-center justify-between pb-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Automations</span>
                <span className="font-semibold text-foreground">6 active <span className="text-muted-foreground/60 font-normal text-[10px] ml-1">(2 idle)</span></span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Lead Scoring</span>
                <span className="font-semibold text-brand-cyan">92% Utilized</span>
              </div>
              <div className="border-t border-border/40 mt-1.5 pt-3 text-[10px] text-amber-500/90 font-medium">
                Tip: Archive 8 unused fields to save system load.
              </div>
            </div>
          </motion.div>

          {/* Card 8: Security Alerts */}
          <motion.div
            whileHover={{ y: -4, boxShadow: 'var(--shadow-card-hover)' }}
            className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-card transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="grid size-9 place-items-center rounded-xl bg-secondary text-amber-500">
                <ShieldAlert size={18} />
              </div>
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-500 uppercase tracking-wider">
                Secure
              </span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Security Alerts</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Threat detection &amp; credential tracking</p>
            </div>
            
            <div className="space-y-2.5 text-xs mt-1">
              <div className="flex items-center justify-between pb-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Failed Logins (24h)</span>
                <span className="font-semibold text-emerald-500">0 attempts</span>
              </div>
              <div className="flex items-center justify-between pb-1.5 border-b border-border/40">
                <span className="text-muted-foreground">API Key Usage</span>
                <span className="font-semibold text-foreground">2 active keys</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Unusual Exports</span>
                <span className="font-semibold text-emerald-500">None</span>
              </div>
              <div className="border-t border-border/40 mt-1.5 pt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Threat monitoring online
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Top companies table */}
      <div className="rounded-2xl border border-border bg-card p-[var(--space-4)] hover:-translate-y-0.5 hover:shadow-nav transition-all duration-200">
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
                  <th key={h} className="pb-[var(--space-2)] px-[var(--space-3)] text-[10px] font-semibold uppercase tracking-widest text-muted-foreground pr-4 last:pr-0">
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
                  <td className="py-[var(--space-2)] px-[var(--space-3)] pr-4">
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
                  <td className="py-[var(--space-2)] px-[var(--space-3)] pr-4 text-sm font-semibold text-foreground tabular-nums">{formatINR(row.revenue)}</td>
                  <td className="py-[var(--space-2)] px-[var(--space-3)] pr-4 text-sm text-foreground tabular-nums">{formatNum(row.lead_count)}</td>
                  <td className="py-[var(--space-2)] px-[var(--space-3)] pr-4 text-sm text-foreground tabular-nums">{formatNum(row.contact_count)}</td>
                  <td className="py-[var(--space-2)] px-[var(--space-3)] text-right">
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
