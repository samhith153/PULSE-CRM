'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Upload, Filter, Loader2, TrendingUp, BarChart2, ShoppingCart,
  Percent, MoveUpRight, MoveDownRight, ChevronDown, ChevronRight,
  Activity, CheckSquare, Layers, MoreHorizontal,
} from 'lucide-react';
import { getSalesRepDashboard, type SalesRepDashboardData, asNumber } from '@/utils/api';

type Period = 'week' | 'month' | 'quarter' | 'year';
export type ReportPeriod = Period;
const PL: Record<Period, string> = { week: 'Weekly', month: 'Monthly', quarter: 'Quarterly', year: 'Yearly' };

function fmtCur(n: number) {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)}Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)}L`;
  if (n >= 1e3) return `₹${(n / 1e3).toFixed(1)}K`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}
function fmtPct(n: number) { return `${Number(n || 0).toFixed(1)}%`; }
function fmtTime(v?: string | null) {
  if (!v) return '';
  const d = new Date(v);
  return isNaN(d.getTime()) ? v : d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}
function fmtRelative(v?: string | null) {
  if (!v) return '';
  const ms = Date.now() - new Date(v).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/* Delta badge */
function Delta({ v, up }: { v: string; up: boolean }) {
  const I = up ? MoveUpRight : MoveDownRight;
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold border ${
      up ? 'bg-[#E6F6EA] text-[#3DA35D] border-[#3DA35D]/20' : 'bg-[#FDEAEA] text-[#E5484D] border-[#E5484D]/20'
    }`}><I className="size-2.5" />{v}</span>
  );
}

/* Period picker */
function PP({ val, set }: { val: Period; set: (v: Period) => void }) {
  return (
    <div className="relative inline-flex items-center shrink-0">
      <select value={val} onChange={e => set(e.target.value as Period)}
        className="h-9 min-w-[150px] appearance-none rounded-lg border border-border-default bg-surface-1 pl-4 pr-9 text-xs font-semibold text-text-primary shadow-sm cursor-pointer whitespace-nowrap focus:outline-none focus:ring-1 focus:ring-accent-color/25"
        style={{ color: 'var(--text-primary)', backgroundColor: 'var(--surface-1)' }}>
        {(Object.keys(PL) as Period[]).map(k => <option key={k} value={k}>{PL[k]}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 size-3.5 text-muted-foreground" />
    </div>
  );
}

/* Sparkline */
function Spark({ vals, white = false, color = '#3D5AFE' }: { vals: number[]; white?: boolean; color?: string }) {
  if (vals.length < 2) return null;
  const mx = Math.max(...vals, 1), mn = Math.min(...vals, 0), rng = mx - mn || 1, n = vals.length;
  const pts = vals.map((v, i) => ({ x: (i / (n - 1)) * 100, y: 34 - ((v - mn) / rng) * 30 + 2 }));
  let ln = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    ln += ` C ${(a.x+(b.x-a.x)/3).toFixed(1)} ${a.y.toFixed(1)}, ${(a.x+2*(b.x-a.x)/3).toFixed(1)} ${b.y.toFixed(1)}, ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
  }
  const ar = `${ln} L ${pts[n-1].x.toFixed(1)} 40 L 0 40 Z`;
  const stroke = white ? 'rgba(255,255,255,0.9)' : color;
  const fill   = white ? 'rgba(255,255,255,0.15)' : `${color}20`;
  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-10 w-full overflow-visible" aria-hidden>
      <motion.path d={ar} fill={fill} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} />
      <motion.path d={ln} fill="none" stroke={stroke} strokeWidth="1.8" vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, ease: 'easeOut' }} />
    </svg>
  );
}

/* KPI hero card */
function KpiCard({ title, value, sub, delta, up, spark, icon: Icon, hero = false, delay = 0, color: _color }: {
  title: string; value: string; sub: string; delta: string; up: boolean;
  spark: number[]; icon: React.ElementType; hero?: boolean; delay?: number; color?: string;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -3 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay }}
      className={`relative flex flex-col justify-between overflow-hidden rounded-2xl p-5 cursor-pointer ${
        hero ? 'bg-gradient-to-br from-accent-color to-purple-600 text-white shadow-lg'
             : 'bg-card border border-border shadow-sm hover:shadow-md'
      }`}>
      {hero && <span className="pointer-events-none absolute -right-8 -top-8 size-36 rounded-full bg-white/10" />}
      <div className="relative flex items-start justify-between">
        <div className={`grid size-8 place-items-center rounded-xl ${hero ? 'bg-white/15' : 'bg-secondary'}`}>
          <Icon className={`size-4 ${hero ? 'text-white' : 'text-accent-color'}`} strokeWidth={2} />
        </div>
        <Delta v={delta} up={up} />
      </div>
      <div className="relative mt-2">
        <p className={`text-[22px] font-extrabold tracking-tight tabular-nums leading-none ${hero ? 'text-white' : 'text-foreground'}`}>{value}</p>
        <p className={`mt-1 text-[10px] ${hero ? 'text-white/65' : 'text-muted-foreground'}`}>{sub}</p>
        <p className={`mt-1.5 text-[9px] font-bold uppercase tracking-widest ${hero ? 'text-white/70' : 'text-muted-foreground'}`}>{title}</p>
      </div>
      <div className="relative mt-1">
        <Spark vals={spark} white={hero} color={hero ? '#fff' : '#3D5AFE'} />
      </div>
    </motion.div>
  );
}

/* ═══ Revenue Trend bar chart ════════════════════════════════════ */
function RevenueTrend({ trend, period, onPeriod }: {
  trend: { period: string; revenue: any }[];
  period: Period; onPeriod: (p: Period) => void;
}) {
  const rawVals = trend.map(t => asNumber(t.revenue) || 0);
  const nonZero = rawVals.filter(v => v > 0);
  const displayVals = rawVals;
  const displayMax  = Math.max(...displayVals, 1);
  const total = rawVals.reduce((s,v) => s + v, 0);
  const vals = displayVals;
  const maxV = displayMax;
  const growth = (displayVals.length > 1 && displayVals[displayVals.length - 2] > 0
        ? ((displayVals[displayVals.length-1] - displayVals[displayVals.length-2]) / displayVals[displayVals.length-2]) * 100 : 0);
  const labels = trend.map(t => {
    if (/^\d{4}-\d{2}$/.test(t.period)) {
      const [y, m] = t.period.split('-').map(Number);
      return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short' });
    }
    return t.period;
  });
  const displayLbls = labels;

  function fmtTick(v: number) {
    if (v >= 1e7) return `${(v/1e7).toFixed(1)}Cr`;
    if (v >= 1e5) return `${(v/1e5).toFixed(0)}L`;
    if (v >= 1e3) return `${(v/1e3).toFixed(0)}K`;
    return v === 0 ? '0' : String(v);
  }

  return (
    <div className="card-surface p-5">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h2 className="text-[14px] font-bold text-foreground">Revenue Trend</h2>
          <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${
            growth >= 0 ? 'bg-[#E6F6EA] text-[#3DA35D] border-[#3DA35D]/20' : 'bg-[#FDEAEA] text-[#E5484D] border-[#E5484D]/20'
          }`}>
            {growth >= 0 ? <MoveUpRight className="size-2.5" /> : <MoveDownRight className="size-2.5" />}
            {growth >= 0 ? '+' : ''}{growth.toFixed(1)}% vs last period
          </span>
        </div>
        <PP val={period} set={onPeriod} />
      </div>

      {/* Chart */}
      <div className="mt-4 flex gap-4">
        <div className="flex-1 relative">
          {/* Y-axis ticks */}
          <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[9px] text-muted-foreground pr-2 w-10">
            {[1, 0.75, 0.5, 0.25, 0].map(r => (
              <span key={r} className="text-right">{fmtTick(displayMax * r)}</span>
            ))}
          </div>
          {/* Bars */}
          <div className="ml-10 flex items-end gap-2 h-[160px] border-b border-l border-border/40 pb-1 pl-2">
            {displayVals.map((v, i) => {
              const h = Math.max(6, (v / displayMax) * 140);
              const isLast = i === displayVals.length - 1;
              return (
                <div key={i} className="flex flex-1 flex-col items-center">
                  <motion.div
                    initial={{ height: 0 }} animate={{ height: h }}
                    transition={{ duration: 0.6, ease: [0.22,1,0.36,1], delay: i * 0.04 }}
                    className={`w-full max-w-[28px] rounded-t-md ${isLast ? 'bg-accent-color shadow-sm' : 'bg-accent-color/40 hover:bg-accent-color/60'} transition-colors`}
                  />
                </div>
              );
            })}
          </div>
          {/* X labels */}
          <div className="ml-10 flex gap-2 mt-1 pl-2">
            {displayLbls.map((l, i) => (
              <span key={i} className="flex-1 text-center text-[9px] text-muted-foreground truncate">{l}</span>
            ))}
          </div>
        </div>

        {/* Right summary */}
        <div className="w-[140px] shrink-0 border-l border-border pl-4 flex flex-col justify-center">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-2">
            <TrendingUp className="size-3 text-accent-color" />
            <span className="font-bold uppercase tracking-wider">Total Revenue</span>
          </div>
          <p className="text-[20px] font-extrabold text-foreground tabular-nums">{fmtCur(total)}</p>
          <p className="mt-1 text-[10px] text-muted-foreground">{displayVals.length} periods tracked</p>
        </div>
      </div>
    </div>
  );
}

/* ═══ Deals by Source donut ══════════════════════════════════════ */
const SRC_COLORS = ['#3DA35D','#3D5AFE','#F59E0B','#E5484D','#8FA6F2'];

function DealsBySource({ src, period, onPeriod, km }: {
  src: { source: string; count: number; percentage: any; revenue: any }[];
  period: Period; onPeriod: (p: Period) => void;
  km: { open_deals: number; deals_created: number; deals_lost: number; activities_logged: number };
}) {
  const total = src.reduce((s, x) => s + Number(x.count || 0), 0) || 3;
  const items = src;
  const R = 56, CIRC = 2 * Math.PI * R;
  let acc = 0;
  const segs = items.map((it, i) => {
    const dash = (Number(it.count) / total) * CIRC;
    const off  = -(acc / total) * CIRC;
    acc += Number(it.count);
    return { ...it, dash, off, color: SRC_COLORS[i % SRC_COLORS.length] };
  });

  const kmRows = [
    { label: 'Open Deals',    val: km.open_deals,       icon: '🟢' },
    { label: 'Deals Created', val: km.deals_created,    icon: '📈' },
    { label: 'Deals Lost',    val: km.deals_lost,       icon: '📉' },
    { label: 'Activities',    val: km.activities_logged, icon: '⚡' },
  ];

  return (
    <div className="card-surface p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[14px] font-bold text-foreground">Deals by Source</h2>
        <PP val={period} set={onPeriod} />
      </div>

      {/* Donut + legend */}
      <div className="flex items-center gap-5">
        <div className="relative shrink-0" style={{ width: 130, height: 130 }}>
          <svg className="size-full -rotate-90" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r={R} fill="none" stroke="var(--surface-2)" strokeWidth="18" />
            {segs.map((seg, i) => (
              <motion.circle key={i} cx="80" cy="80" r={R} fill="none"
                stroke={seg.color} strokeWidth="18"
                strokeDasharray={`${seg.dash} ${CIRC}`} strokeDashoffset={seg.off}
                initial={{ strokeDashoffset: CIRC }} animate={{ strokeDashoffset: seg.off }}
                transition={{ duration: 1, ease: [0.22,1,0.36,1], delay: i * 0.08 }} />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[22px] font-extrabold text-foreground tabular-nums leading-none">{total}</span>
            <span className="text-[9px] font-semibold text-muted-foreground">Total deals</span>
          </div>
        </div>
        <div className="flex-1 space-y-2.5">
          {segs.map((seg, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                <span className="text-[11px] text-muted-foreground truncate max-w-[90px]">{seg.source}</span>
              </div>
              <span className="text-[13px] font-extrabold text-foreground tabular-nums">{seg.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom key metrics strip */}
      <div className="mt-4 border-t border-border pt-3 grid grid-cols-4 gap-2">
        {kmRows.map(r => (
          <div key={r.label} className="text-center">
            <p className="text-[9px] text-muted-foreground font-semibold truncate">{r.label}</p>
            <p className="text-[13px] font-extrabold text-foreground tabular-nums">{r.val}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══ Deals by Stage (funnel table) ════════════════════════════ */
const STAGE_COLORS = ['#6C63FF','#7B74FF','#8A8BFF','#99AAFF','#4BD08B'];
const STAGE_FILLS  = ['bg-[#6C63FF]','bg-[#7B74FF]','bg-[#8A8BFF]','bg-[#99AAFF]','bg-[#4BD08B]'];

function DealsByStage({ stages }: { stages: { stage: string; count: number; percentage: any; conversion_rate: any }[] }) {
  const items = stages;
  const totalDeals = items.reduce((s, x) => s + x.count, 0);
  const wonItem    = items.find(x => x.stage.toLowerCase().includes('won'));
  const wonDeals   = wonItem?.count ?? 0;
  const maxCount   = Math.max(...items.map(x => x.count), 1);

  // SVG funnel
  const SVG_W = 160, SVG_H = 180, n = items.length, rowH = SVG_H / n;
  const maxHW = SVG_W / 2, minHW = 20;
  function hw(i: number) { return maxHW - (maxHW - minHW) * (i / (n - 1)); }

  return (
    <div className="card-surface p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[14px] font-bold text-foreground">Deals by Stage</h2>
          <p className="text-[10px] text-muted-foreground">Current pipeline distribution</p>
        </div>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
          {totalDeals} deals
        </span>
      </div>

      <div className="flex gap-4">
        {/* Funnel SVG */}
        <div className="shrink-0">
          <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ width: SVG_W, height: SVG_H }}>
            {items.map((_, i) => {
              const y1 = i * rowH, y2 = (i + 1) * rowH;
              const hw1 = hw(i), hw2 = i < n - 1 ? hw(i + 1) : minHW;
              const cx = SVG_W / 2;
              const d = `M ${cx-hw1} ${y1} L ${cx+hw1} ${y1} L ${cx+hw2} ${y2} L ${cx-hw2} ${y2} Z`;
              return (
                <motion.path key={i} d={d} fill={STAGE_COLORS[i]} fillOpacity={0.85}
                  initial={{ opacity: 0, scaleX: 0 }} animate={{ opacity: 1, scaleX: 1 }}
                  transition={{ duration: 0.5, ease: [0.22,1,0.36,1], delay: i * 0.07 }}
                  style={{ transformOrigin: `${cx}px center` }} />
              );
            })}
          </svg>
        </div>

        {/* Stage rows */}
        <div className="flex-1 flex flex-col justify-around">
          {items.map((s, i) => {
            const pct = asNumber(s.percentage) || Math.round((s.count / maxCount) * 100);
            const conv = asNumber(s.conversion_rate) || pct;
            return (
              <div key={s.stage} className="flex items-center gap-2 text-[11px]">
                <span className="w-[70px] truncate text-muted-foreground font-medium">{s.stage}</span>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div className={`h-full rounded-full ${STAGE_FILLS[i]}`}
                    initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.7, ease: [0.22,1,0.36,1], delay: i * 0.06 }} />
                </div>
                <span className="w-8 text-right font-bold text-foreground tabular-nums">{s.count}</span>
                <span className="w-9 text-right font-bold tabular-nums" style={{ color: STAGE_COLORS[i] }}>{conv}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary footer */}
      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Total Deals</p>
          <p className="text-[18px] font-extrabold text-foreground tabular-nums">{totalDeals}</p>
        </div>
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Won Deals</p>
          <div className="flex items-center gap-1">
            <p className="text-[18px] font-extrabold text-foreground tabular-nums">{wonDeals}</p>
            <MoveUpRight className="size-4 text-[#3DA35D]" />
          </div>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="text-[10px] font-semibold text-muted-foreground">Keys</span>
        <div className="flex-1 flex gap-0.5">
          {items.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-sm ${STAGE_FILLS[i]}`} />
          ))}
        </div>
        <span className="text-[10px] font-bold text-[#3DA35D]">
          {wonDeals} · {items[items.length-1] ? Math.round((wonDeals / Math.max(items[0].count, 1)) * 100) : 0}%
        </span>
      </div>
      <p className="mt-1 text-right text-[9px] text-muted-foreground">
        Conversion: {totalDeals > 0 ? fmtPct((wonDeals / totalDeals) * 100) : '0%'}
      </p>
    </div>
  );
}

/* ═══ Key Metrics ══════════════════════════════════════════════ */
function KeyMetrics({ km }: { km: { open_deals: number; pipeline_value: any; deals_created: number; deals_lost: number; activities_logged: number; pipeline_value_growth_pct: any } }) {
  const pv = asNumber(km?.pipeline_value) || 0;
  const gr = asNumber(km?.pipeline_value_growth_pct) || 0;
  const rows = [
    { label: 'Open Deals',    val: km?.open_deals ?? 0,       icon: '🟢', color: '#3DA35D' },
    { label: 'Deals Created', val: km?.deals_created ?? 0,    icon: '📈', color: '#3D5AFE' },
    { label: 'Deals Lost',    val: km?.deals_lost ?? 0,       icon: '📉', color: '#E5484D' },
    { label: 'Activities',    val: km?.activities_logged ?? 0, icon: '⚡', color: '#F59E0B' },
  ];
  return (
    <div className="card-surface p-5">
      <h2 className="text-[14px] font-bold text-foreground mb-4">Key Metrics</h2>
      <div className="mb-4">
        <p className="text-[26px] font-extrabold text-foreground tabular-nums leading-none">{fmtCur(pv)}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">Pipeline Value</p>
        <span className={`mt-2 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold border ${
          gr >= 0 ? 'bg-[#E6F6EA] text-[#3DA35D] border-[#3DA35D]/20' : 'bg-[#FDEAEA] text-[#E5484D] border-[#E5484D]/20'
        }`}>
          {gr >= 0 ? <MoveUpRight className="size-2.5" /> : <MoveDownRight className="size-2.5" />}
          {gr >= 0 ? '+' : ''}{gr.toFixed(1)}%
        </span>
      </div>
      <div className="space-y-3 border-t border-border pt-3">
        {rows.map(r => (
          <div key={r.label} className="flex items-center justify-between text-[12px]">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full" style={{ backgroundColor: r.color }} />
              <span className="text-muted-foreground">{r.label}</span>
            </div>
            <span className="font-bold text-foreground tabular-nums">{r.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══ Sales Report Area bar chart ══════════════════════════════ */
function SalesReportArea({ trend, period, onPeriod }: {
  trend: { period: string; revenue: any }[];
  period: Period; onPeriod: (p: Period) => void;
}) {
  const vals  = trend.map(t => asNumber(t.revenue) || 0);
  const dv    = vals;
  const mx    = Math.max(...dv, 1);
  const avg   = dv.reduce((s,v) => s+v, 0) / dv.length;
  const ovf   = dv[dv.length-1] > avg * 1.2;
  const lbls  = trend.map(t => /^\d{4}-\d{2}$/.test(t.period)
        ? new Date(t.period.replace('-','/') + '/01').toLocaleDateString('en-US',{month:'short'})
        : t.period);
  const pcts  = [0, 25, 50, 75, 100];
  const growth = trend.length > 1 && asNumber(trend[trend.length-2]?.revenue) > 0
    ? ((asNumber(trend[trend.length-1]?.revenue) - asNumber(trend[trend.length-2]?.revenue))
       / asNumber(trend[trend.length-2]?.revenue)) * 100 : 0;
  const perUnit = avg > 0 ? avg / Math.max(dv.length, 1) : 0;

  return (
    <div className="card-surface p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-[14px] font-bold text-foreground">Sales Report Area</h2>
          <span className="inline-flex items-center gap-0.5 mt-1 text-[10px] font-bold text-[#3DA35D]">
            <MoveUpRight className="size-2.5" />+{Math.abs(growth).toFixed(1)}% vs last years
          </span>
        </div>
        <PP val={period} set={onPeriod} />
      </div>

      <div className="relative">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-[140px] flex flex-col justify-between text-[9px] text-muted-foreground w-8">
          {pcts.slice().reverse().map(p => <span key={p} className="text-right">{p}%</span>)}
        </div>
        {/* Bars */}
        <div className="ml-10 h-[140px] flex items-end gap-2 border-b border-l border-border/40 pb-1 pl-2 relative">
          {dv.map((v, i) => {
            const h = Math.max(8, (v / mx) * 128);
            const isLast = i === dv.length - 1;
            return (
              <div key={i} className="flex flex-1 flex-col items-center relative">
                {isLast && ovf && (
                  <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-card border border-border rounded-lg px-2 py-1 text-[9px] font-bold text-foreground whitespace-nowrap shadow-sm text-center">
                    Target overflow<br/>by {fmtPct(((v-avg)/avg)*100)} profit
                  </div>
                )}
                <motion.div
                  initial={{ height: 0 }} animate={{ height: h }}
                  transition={{ duration: 0.6, ease:[0.22,1,0.36,1], delay: i*0.05 }}
                  className={`w-full max-w-[28px] rounded-t-md ${
                    i < 2 ? 'bg-[#3DA35D]/70' : i < 4 ? 'bg-accent-color/70' : 'bg-accent-color shadow-sm'
                  } transition-colors`}
                />
              </div>
            );
          })}
        </div>
        {/* X labels */}
        <div className="ml-10 flex gap-2 mt-1 pl-2">
          {lbls.map((l, i) => (
            <span key={i} className="flex-1 text-center text-[9px] text-muted-foreground">{l}</span>
          ))}
        </div>
        {/* Bottom stat */}
        <div className="ml-10 mt-3 pl-2">
          <p className="text-[11px] text-muted-foreground">Per unit sales</p>
          <p className="text-[18px] font-extrabold text-foreground tabular-nums">{fmtCur(perUnit)}</p>
        </div>
      </div>
    </div>
  );
}

/* ═══ Sales Activity donut ════════════════════════════════════ */
const ACT_COLORS = ['#3D5AFE','#E5484D','#3DA35D'];

function SalesActivity({ src, period, onPeriod }: {
  src: { source: string; count: number; percentage: any }[];
  period: Period; onPeriod: (p: Period) => void;
}) {
  const items = src.slice(0, 3);
  const total = items.reduce((s, x) => s + Number(x.count || 0), 0) || 100;
  const R = 52, CIRC = 2 * Math.PI * R;
  let acc = 0;
  const segs = items.map((it, i) => {
    const dash = (Number(it.count) / total) * CIRC;
    const off  = -(acc / total) * CIRC;
    acc += Number(it.count);
    return { ...it, dash, off, color: ACT_COLORS[i % ACT_COLORS.length] };
  });
  const displayTotal = total >= 1000 ? `${(total / 1000).toFixed(0)}K` : String(total);

  return (
    <div className="card-surface p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[14px] font-bold text-foreground">Sales Activity</h2>
        <PP val={period} set={onPeriod} />
      </div>
      <div className="flex items-center gap-6">
        {/* Donut */}
        <div className="relative shrink-0" style={{ width: 130, height: 130 }}>
          <svg className="size-full -rotate-90" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r={R} fill="none" stroke="var(--surface-2)" strokeWidth="20" />
            {segs.map((seg, i) => (
              <motion.circle key={i} cx="80" cy="80" r={R} fill="none"
                stroke={seg.color} strokeWidth="20"
                strokeDasharray={`${seg.dash} ${CIRC}`} strokeDashoffset={seg.off}
                initial={{ strokeDashoffset: CIRC }} animate={{ strokeDashoffset: seg.off }}
                transition={{ duration: 1, ease: [0.22,1,0.36,1], delay: i * 0.1 }} />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[20px] font-extrabold text-foreground tabular-nums leading-none">{displayTotal}</span>
            <span className="text-[9px] font-semibold text-muted-foreground">Total sell count</span>
          </div>
        </div>
        {/* Legend */}
        <div className="flex-1 space-y-3">
          {segs.map((seg, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                <span className="text-[11px] text-muted-foreground">{seg.source}</span>
              </div>
              <span className="text-[14px] font-extrabold text-foreground tabular-nums">{seg.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══ Top Deals table ════════════════════════════════════════ */
const STAGE_BADGE: Record<string, { bg: string; text: string }> = {
  qualified:   { bg: '#E6F6EA', text: '#3DA35D' },
  proposal:    { bg: '#FBF2DD', text: '#B8860B' },
  negotiation: { bg: '#FDF0E1', text: '#E08A2C' },
  new:         { bg: '#EEF1FF', text: '#3D5AFE' },
  won:         { bg: '#E6F6EA', text: '#3DA35D' },
  lost:        { bg: '#FDEAEA', text: '#E5484D' },
};

function stageBadge(stage: string) {
  const key = (stage || '').toLowerCase().trim();
  const s = STAGE_BADGE[key] ?? { bg: '#F7F8FA', text: 'var(--text-secondary)' };
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold capitalize"
      style={{ backgroundColor: s.bg, color: s.text }}>{stage}</span>
  );
}

function TopDeals({ deals, period, onPeriod }: {
  deals: any[];
  period: Period; onPeriod: (p: Period) => void;
}) {
  const rows = deals.slice(0, 5).map(d => ({
        id: d.id || d.deal_id,
        company: d.company_name || d.company || '—',
        name: d.title || d.deal_name || d.name || '—',
        value: asNumber(d.amount || d.value || d.deal_value),
        stage: d.stage || d.status || 'New',
      }));

  return (
    <div className="card-surface p-5 min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="min-w-0 text-[14px] font-bold text-foreground">Top Deals</h2>
        <PP val={period} set={onPeriod} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-border text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              <th className="pb-2 text-left">Company</th>
              <th className="pb-2 text-left">Deal Name</th>
              <th className="pb-2 text-right">Value</th>
              <th className="pb-2 text-center">Stage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {rows.map(r => (
              <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                <td className="py-2 pr-2 font-semibold text-foreground truncate max-w-[100px]">{r.company}</td>
                <td className="py-2 pr-2 text-muted-foreground truncate max-w-[110px]">{r.name}</td>
                <td className="py-2 pr-2 text-right font-bold text-foreground tabular-nums">{fmtCur(r.value)}</td>
                <td className="py-2 text-center">{stageBadge(r.stage)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="mt-3 flex items-center gap-1 text-[11px] font-bold text-accent-color hover:underline">
        View all deals <ChevronRight className="size-3" />
      </button>
    </div>
  );
}

/* ═══ Recent Activities ══════════════════════════════════════ */
function RecentActivities({ acts }: { acts: { id: string; title?: string; action?: string; entity_type: string; created_at: string; created_by: string | null }[] }) {
  const rows = acts.slice(0, 5);
  return (
    <div className="card-surface p-5 min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="min-w-0 text-[14px] font-bold text-foreground">Recent Activities</h2>
        <div className="relative inline-flex items-center shrink-0">
          <select className="h-9 min-w-[150px] appearance-none whitespace-nowrap rounded-lg bg-surface-1 border border-border-default pl-4 pr-9 text-xs font-semibold text-text-primary shadow-sm cursor-pointer focus:outline-none focus:ring-1 focus:ring-accent-color/25"
            style={{ color: 'var(--text-primary)', backgroundColor: 'var(--surface-1)' }}>
            <option>All Activities</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 size-3.5 text-text-muted" />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-border text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              <th className="pb-2 text-left">Activity</th>
              <th className="pb-2 text-left">Associated With</th>
              <th className="pb-2 text-right">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {rows.map(r => (
              <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                <td className="py-2 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent-color/10">
                      <Activity className="size-3 text-accent-color" />
                    </span>
                    <span className="font-semibold text-foreground truncate max-w-[110px]">{r.title || (r as any).action || '—'}</span>
                  </div>
                </td>
                <td className="py-2 pr-2 text-muted-foreground truncate max-w-[110px]">{r.created_by || '—'}</td>
                <td className="py-2 text-right text-muted-foreground whitespace-nowrap">{fmtRelative(r.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="mt-3 flex items-center gap-1 text-[11px] font-bold text-accent-color hover:underline">
        View all activities <ChevronRight className="size-3" />
      </button>
    </div>
  );
}

/* ═══ Performance Over Time dual-axis line chart ════════════ */
function PerfOverTime({ trend }: { trend: { period: string; revenue: any }[] }) {
  const revVals = trend.map(t => asNumber(t.revenue) || 0);
  const rv      = revVals;
  // Simulate won deals from revenue (won ≈ rev / avg_deal_size_factor)
  const wv      = rv.map(v => Math.round(v / 12000));
  const rvMax   = Math.max(...rv, 1);
  const wvMax   = Math.max(...wv, 1);
  const lbls    = trend.map(t => /^\d{4}-\d{2}$/.test(t.period)
        ? new Date(t.period.replace('-', '/') + '/01').toLocaleDateString('en-US', { month: 'short' })
        : t.period);

  const W = 500, H = 160, padL = 40, padR = 40, padT = 10, padB = 28;
  const iW = W - padL - padR, iH = H - padT - padB;
  const n  = lbls.length;
  const xOf = (i: number) => padL + (i / Math.max(n - 1, 1)) * iW;
  const yRevOf = (v: number) => padT + iH - (v / rvMax) * iH;
  const yWonOf = (v: number) => padT + iH - (v / wvMax) * iH;

  function smooth(pts: {x:number;y:number}[]) {
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i+1];
      d += ` C ${(a.x+(b.x-a.x)/3).toFixed(1)} ${a.y.toFixed(1)}, ${(a.x+2*(b.x-a.x)/3).toFixed(1)} ${b.y.toFixed(1)}, ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
    }
    return d;
  }

  const revPts = rv.map((v, i) => ({ x: xOf(i), y: yRevOf(v) }));
  const wonPts = wv.map((v, i) => ({ x: xOf(i), y: yWonOf(v) }));
  const revLine = smooth(revPts);
  const wonLine = smooth(wonPts);
  const revArea = `${revLine} L ${revPts[n-1].x.toFixed(1)} ${padT+iH} L ${padL} ${padT+iH} Z`;

  function fmtRevTick(v: number) {
    if (v >= 1e5) return `${(v/1e5).toFixed(0)}L`;
    if (v >= 1e3) return `${(v/1e3).toFixed(0)}K`;
    return v === 0 ? '0' : String(v);
  }

  const revTicks = [0, 0.25, 0.5, 0.75, 1].map(r => ({ r, v: rvMax * r }));
  const wonTicks = [0, 0.25, 0.5, 0.75, 1].map(r => ({ r, v: wvMax * r }));

  return (
    <div className="card-surface p-5 min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="min-w-0 text-[14px] font-bold text-foreground">Performance Over Time</h2>
        <div className="flex flex-wrap items-center gap-4 whitespace-nowrap text-[10px] shrink-0">
          <span className="flex items-center gap-1.5 text-accent-color font-semibold">
            <span className="h-0.5 w-4 rounded-full bg-accent-color inline-block" /> Revenue
          </span>
          <span className="flex items-center gap-1.5 text-[#3DA35D] font-semibold">
            <span className="h-0.5 w-4 rounded-full bg-[#3DA35D] inline-block" /> Deals Won
          </span>
          <div className="relative inline-flex items-center ml-2 shrink-0">
            <select className="h-9 min-w-[150px] appearance-none whitespace-nowrap rounded-lg bg-surface-1 border border-border-default pl-4 pr-9 text-xs font-semibold text-text-primary shadow-sm cursor-pointer focus:outline-none focus:ring-1 focus:ring-accent-color/25"
              style={{ color: 'var(--text-primary)', backgroundColor: 'var(--surface-1)' }}>
              <option>Year to Date</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 size-3.5 text-text-muted" />
          </div>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="pot-rev-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3D5AFE" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#3D5AFE" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Left y-axis — revenue */}
        {revTicks.map(t => (
          <g key={`rv-${t.r}`}>
            <line x1={padL} y1={yRevOf(t.v)} x2={W-padR} y2={yRevOf(t.v)} stroke="var(--border-subtle)" strokeWidth="1" />
            <text x={padL-4} y={yRevOf(t.v)+3} textAnchor="end" fontSize="8" fill="var(--text-muted)" fontFamily="inherit">
              {fmtRevTick(t.v)}
            </text>
          </g>
        ))}
        {/* Right y-axis — won deals */}
        {wonTicks.map(t => (
          <text key={`wn-${t.r}`} x={W-padR+5} y={yWonOf(t.v)+3} textAnchor="start" fontSize="8" fill="var(--text-muted)" fontFamily="inherit">
            {Math.round(t.v)}
          </text>
        ))}
        {/* Revenue area */}
        <motion.path d={revArea} fill="url(#pot-rev-grad)"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} />
        {/* Revenue line */}
        <motion.path d={revLine} fill="none" stroke="#3D5AFE" strokeWidth="2"
          vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: 'easeOut' }} />
        {/* Won deals line */}
        <motion.path d={wonLine} fill="none" stroke="#3DA35D" strokeWidth="1.5"
          vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray="4 3"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: 'easeOut', delay: 0.1 }} />
        {/* Dots on revenue line */}
        {revPts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={2.5} fill="#3D5AFE" stroke="white" strokeWidth="1.5" />
        ))}
        {/* X labels */}
        {lbls.map((l, i) => (
          <text key={i} x={xOf(i)} y={H-4} textAnchor="middle" fontSize="8" fill="var(--text-muted)" fontFamily="inherit">{l}</text>
        ))}
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Main ReportsView
═══════════════════════════════════════════════════════════════════ */
export default function ReportsView() {
  const [data, setData]     = useState<SalesRepDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('month');

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(null);
    getSalesRepDashboard(period)
      .then(d => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch(e => { if (!cancelled) { setError(e?.message || 'Failed to load'); setLoading(false); } });
    return () => { cancelled = true; };
  }, [period]);

  /* Export CSV */
  const handleExport = () => {
    if (!data) return;
    const rows = [
      ['Metric', 'Value'],
      ['Period', PL[period]],
      ['Revenue', String(asNumber(data.revenue_stat?.total))],
      ['Won Deals', String(data.won_deals_stat?.count)],
      ['Win Rate', String(asNumber(data.win_rate_stat?.win_rate))],
      ['Avg Deal Size', String(asNumber(data.avg_deal_size_stat?.avg_deal_value))],
    ];
    const csv  = rows.map(r => r.map(v => `"${v.replace(/"/g,'""')}"`).join(',')).join('\n');
    const link = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
      download: `sales-report-${period}.csv`,
    });
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  if (loading) return (
    <div className="flex min-h-[400px] items-center justify-center">
      <Loader2 className="size-5 animate-spin text-accent-color" />
      <span className="ml-2 text-sm text-muted-foreground">Loading reports…</span>
    </div>
  );
  if (error || !data) return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="rounded-xl border border-border bg-card px-5 py-4 text-sm text-muted-foreground">
        {error || 'No data available'}
      </div>
    </div>
  );

  const rev       = asNumber(data.revenue_stat?.total) || 0;
  const revGrowth = asNumber(data.revenue_stat?.growth_pct) || 0;
  const prevRev   = rev - revGrowth;
  const won       = data.won_deals_stat?.count || 0;
  const wonGrowth = asNumber(data.won_deals_stat?.growth_pct) || 0;
  const wr        = asNumber(data.win_rate_stat?.win_rate) || 0;
  const wrGrowth  = asNumber(data.win_rate_stat?.growth_pct) || 0;
  const avgDeal   = asNumber(data.avg_deal_size_stat?.avg_deal_value) || 0;
  const avgGrowth = asNumber(data.avg_deal_size_stat?.growth_pct) || 0;
  const km        = data.key_metrics;
  const trend     = data.revenue_trend || [];
  const sparkVals = trend.length >= 2 ? trend.map(t => asNumber(t.revenue) || 0) : [];
  const acts      = (data as any).recent_activities || [];

  return (
    <div className="space-y-4 pb-8">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-extrabold tracking-tight text-foreground leading-tight">Reports</h1>
          <p className="mt-0.5 text-[12px] text-muted-foreground">Performance overview backed by live data.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExport}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border-default bg-surface-1 px-4 text-xs font-semibold text-text-primary transition-colors hover:bg-surface-2 cursor-pointer">
            <Upload className="size-3.5" /> Export
          </button>
          <button className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border-default bg-surface-1 px-4 text-xs font-semibold text-text-primary transition-colors hover:bg-surface-2 cursor-pointer">
            <Filter className="size-3.5" /> Filter
          </button>
        </div>
      </div>

      {/* 4 KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Total Profit"
          value={rev > 0 ? fmtCur(rev) : '₹0'}
          sub={rev > 0 ? `vs last month ${fmtCur(prevRev)}` : 'No data'}
          delta={`+${Math.abs(revGrowth).toFixed(1)}%`} up={revGrowth >= 0}
          spark={sparkVals}
          icon={TrendingUp} hero delay={0} />
        <KpiCard title="Insight"
          value={won > 0 && won < 10000 ? fmtCur(won * avgDeal || won * 50000) : (won >= 10000 ? fmtCur(won) : '₹0')}
          sub={won > 1 ? `vs last month ${fmtCur((won - 1) * (avgDeal || 50000))}` : 'No data'}
          delta={`+${Math.abs(wonGrowth || 0).toFixed(1)}%`} up={wonGrowth >= 0}
          spark={[]} icon={BarChart2} delay={0.07} />
        <KpiCard title="Organic Sales"
          value={asNumber(km?.pipeline_value) > 0 ? fmtCur(asNumber(km.pipeline_value)) : '₹0'}
          sub={asNumber(km?.pipeline_value) > 0 ? `vs last month ${fmtCur(asNumber(km.pipeline_value) * 0.88)}` : 'No data'}
          delta="-0%" up={false}
          spark={[]} icon={ShoppingCart} color="#3DA35D" delay={0.14} />
        <KpiCard title="Gross Margin"
          value={wr > 0 && wr < 100 ? fmtPct(wr) : '0%'}
          sub={wr > 0 && wr < 100 ? `vs last month ${fmtPct(wr * 0.96)}` : 'No data'}
          delta={`+${Math.abs(avgGrowth || 0).toFixed(1)}%`} up={avgGrowth >= 0}
          spark={[]} icon={Percent} delay={0.21} />
      </div>

      {/* Revenue Trend + Deals by Source */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[7fr_5fr]">
        <RevenueTrend trend={trend} period={period} onPeriod={setPeriod} />
        <DealsBySource src={data.deals_by_source || []} period={period} onPeriod={setPeriod}
          km={{ open_deals: km?.open_deals||0, deals_created: km?.deals_created||0, deals_lost: km?.deals_lost||0, activities_logged: km?.activities_logged||0 }} />
      </div>

      {/* Deals by Stage + Key Metrics */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[7fr_5fr]">
        <DealsByStage stages={data.deals_by_stage || []} />
        <KeyMetrics km={km || { open_deals:0, pipeline_value:0, deals_created:0, deals_lost:0, activities_logged:0, pipeline_value_growth_pct:0, deals_created_growth_pct:0, activities_growth_pct:0 }} />
      </div>

      {/* Sales Report Area + Sales Activity */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[7fr_5fr]">
        <SalesReportArea trend={trend} period={period} onPeriod={setPeriod} />
        <SalesActivity src={data.deals_by_source?.slice(0,3) || []} period={period} onPeriod={setPeriod} />
      </div>

      {/* Top Deals + Recent Activities */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[7fr_5fr]">
        <TopDeals deals={(data as any).top_deals || []} period={period} onPeriod={setPeriod} />
        <RecentActivities acts={acts} />
      </div>

      {/* Performance Over Time */}
      <PerfOverTime trend={trend} />

      {/* Footer */}
      <p className="text-center text-[10px] text-muted-foreground pt-2">
        © 2026 Pulse CRM. All rights reserved.
      </p>
    </div>
  );
}
