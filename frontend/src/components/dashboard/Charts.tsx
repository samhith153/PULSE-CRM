'use client';

import React, { useState } from 'react';
import { Info, ChevronDown, BarChart2 } from 'lucide-react';
import { useReveal } from '@/hooks/use-reveal';
import { motion, AnimatePresence } from 'framer-motion';

interface RevenuePoint {
  label: string;
  value: number;
}

interface FunnelStage {
  name: string;
  count: number;
}

interface SourceData {
  name: string;
  pct: number;
  value: number;
}

interface SizeData {
  name: string;
  pct: number;
}

interface ChartsProps {
  loading?: boolean;
  empty?: boolean;
  revenueData?: RevenuePoint[];
  funnelData?: FunnelStage[];
  sourceData?: SourceData[];
  sizeData?: SizeData[];
}

const CHART_COLORS = [
  'var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)',
  'var(--chart-4)', 'var(--chart-5)', 'var(--chart-6)',
];

const STAGE_BG = [
  'bg-accent-color', 'bg-accent-color/85', 'bg-accent-color/70',
  'bg-accent-color/55', 'bg-accent-color/40',
];

function fmtCurrency(n: number): string {
  if (n >= 1_000_000) return `₹${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(1)}K`;
  return `₹${n}`;
}

export default function Charts({
  loading = false,
  empty = false,
  revenueData = [],
  funnelData = [],
  sourceData = [],
  sizeData = [],
}: ChartsProps) {
  const { ref: chartRef, visible: chartVisible } = useReveal<HTMLDivElement>();
  const [revenueHoveredPoint, setRevenueHoveredPoint] = useState<{ x: number; y: number; label: string; value: string } | null>(null);
  const [hoveredSourceIdx, setHoveredSourceIdx] = useState<number | null>(null);
  const [hoveredSizeIdx, setHoveredSizeIdx] = useState<number | null>(null);

  const hasRevenue = revenueData.length > 0;
  const hasFunnel = funnelData.length > 0;
  const hasSources = sourceData.length > 0;
  const hasSizes = sizeData.length > 0;

  const hasAnyData = hasRevenue || hasFunnel || hasSources || hasSizes;

  const CIRC = 2 * Math.PI * 56;

  const curvePath = (pointsList: { x: number; y: number }[]) => {
    if (pointsList.length === 0) return '';
    let path = `M ${pointsList[0].x.toFixed(1)} ${pointsList[0].y.toFixed(1)}`;
    for (let i = 0; i < pointsList.length - 1; i++) {
      const p0 = pointsList[i];
      const p1 = pointsList[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 3;
      const cpY1 = p0.y;
      const cpX2 = p0.x + 2 * (p1.x - p0.x) / 3;
      const cpY2 = p1.y;
      path += ` C ${cpX1.toFixed(1)} ${cpY1.toFixed(1)}, ${cpX2.toFixed(1)} ${cpY2.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
    }
    return path;
  };

  const getSegments = (data: Array<{ pct: number }>) => {
    let acc = 0;
    return data.map((d) => {
      const dash = (d.pct / 100) * CIRC;
      const offset = -(acc / 100) * CIRC;
      acc += d.pct;
      return { dash, offset };
    });
  };

  const maxRevenue = hasRevenue ? Math.max(...revenueData.map(r => r.value)) : 1;
  const revenueCoords = revenueData.map((r, i) => ({
    x: (i / Math.max(revenueData.length - 1, 1)) * 100,
    y: 90 - (r.value / maxRevenue) * 80,
    val: fmtCurrency(r.value),
    label: r.label,
  }));

  const linePathStr = curvePath(revenueCoords);
  const areaPathStr = `${linePathStr} L 100 90 L 0 90 Z`;

  const maxStageCount = hasFunnel ? Math.max(...funnelData.map(s => s.count)) : 1;

  const sourceSegments = getSegments(sourceData);
  const sizeSegments = getSegments(sizeData);

  const totalSourceValue = sourceData.reduce((sum, s) => sum + s.value, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-card border border-border-default rounded-2xl p-5 h-76 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border border-border-default rounded-2xl p-5 h-76 animate-pulse" />
          <div className="bg-card border border-border-default rounded-2xl p-5 h-76 animate-pulse" />
          <div className="bg-card border border-border-default rounded-2xl p-5 h-76 animate-pulse" />
        </div>
      </div>
    );
  }

  if (empty || !hasAnyData) {
    return (
      <div className="bg-surface-1 border border-border-default-default rounded-[20px] p-12 text-center flex flex-col items-center justify-center min-h-[300px] shadow-card">
        <div className="h-12 w-12 rounded-full bg-surface-2 flex items-center justify-center border border-border-default-default text-accent-color">
          <BarChart2 className="h-6 w-6" strokeWidth={1.5} />
        </div>
        <h4 className="text-sm font-bold text-text-primary mt-4">No report data available</h4>
        <p className="text-xs text-text-muted mt-1.5 max-w-sm leading-relaxed">
          There are no analytics records matching your selection. Try adjusting the date range filters or selecting a different pipeline.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6" ref={chartRef as any}>
      {/* Revenue Over Time */}
      {hasRevenue && (
        <div
          data-visible={chartVisible}
          className="reveal bg-card border border-border-default rounded-2xl p-6 flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-nav transition-all duration-300 w-full relative"
        >
          <div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold tracking-tight text-text-primary">Revenue over time</h2>
                <p className="mt-0.5 text-xs text-text-muted">Closed-won revenue, rolling period</p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border-default bg-background px-3 py-1.5 text-xs text-text-muted">
                This month <ChevronDown size={13} />
              </span>
            </div>
            <div className="mt-6 grid grid-cols-[auto_minmax(0,1fr)] gap-4">
              <div className="flex flex-col justify-between py-1 text-[10px] text-text-muted">
                {[fmtCurrency(maxRevenue), fmtCurrency(maxRevenue * 0.75), fmtCurrency(maxRevenue * 0.5), fmtCurrency(maxRevenue * 0.25), '₹0'].map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
              <div>
                <svg viewBox="0 0 100 90" preserveAspectRatio="none" className="h-44 w-full overflow-visible" aria-hidden>
                  <defs>
                    <linearGradient id="revenueBarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity="0.6" />
                    </linearGradient>
                    <linearGradient id="revenueBarHoverGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-2)" />
                      <stop offset="100%" stopColor="var(--chart-1)" />
                    </linearGradient>
                  </defs>
                  {[0, 22.5, 45, 67.5, 90].map((y) => (
                    <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" strokeOpacity={0.4} vectorEffect="non-scaling-stroke" className="text-border" />
                  ))}
                  {revenueCoords.map((c, idx) => {
                    const isHovered = revenueHoveredPoint?.x === c.x;
                    return (
                      <motion.rect
                        key={idx}
                        x={c.x * 0.88 + 3}
                        y={c.y}
                        width="5.5"
                        height={90 - c.y}
                        rx="1.5"
                        fill={isHovered ? 'url(#revenueBarHoverGrad)' : 'url(#revenueBarGrad)'}
                        className="cursor-pointer transition-all duration-200"
                        whileHover={{ scaleY: 1.03, originY: 1 }}
                        initial={{ scaleY: 0, originY: 1 }}
                        animate={chartVisible ? { scaleY: 1 } : { scaleY: 0 }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: idx * 0.05 }}
                        onMouseEnter={() => setRevenueHoveredPoint({ x: c.x, y: c.y, label: c.label, value: c.val })}
                      />
                    );
                  })}
                </svg>
                <div className="mt-2.5 flex justify-between text-[10px] text-text-muted">
                  {revenueCoords.map((pt, idx) => (
                    <span key={idx} className="cursor-pointer hover:text-text-primary transition-colors" onMouseEnter={() => setRevenueHoveredPoint(pt)}>
                      {pt.label.length > 6 ? pt.label.slice(0, 6) : pt.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <AnimatePresence>
            {revenueHoveredPoint && (
              <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }} transition={{ duration: 0.15 }} className="absolute top-4 left-1/2 -translate-x-1/2 bg-popover border border-border-default rounded-xl shadow-float p-3 text-xs flex gap-4 z-20">
                <div>
                  <p className="text-[10px] uppercase font-bold text-text-muted">Date</p>
                  <p className="font-semibold text-text-primary mt-0.5">{revenueHoveredPoint.label}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-accent-color">Revenue</p>
                  <p className="font-semibold text-text-primary mt-0.5">{revenueHoveredPoint.value}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Lower Grid: Funnel, Source Donut, Size Donut */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Funnel */}
        {hasFunnel && (
          <div className="bg-card border border-border-default rounded-2xl p-5 flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-nav transition-all duration-300">
            <div>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-text-primary">Deals by stage</h2>
                <span className="inline-flex shrink-0 items-center gap-0.5 rounded-lg border border-border-default bg-background px-2 py-1 text-[10px] font-semibold text-text-muted">Month <ChevronDown size={10} /></span>
              </div>
              <ul className="mt-5 space-y-3.5">
                {funnelData.map((stage, index) => {
                  const convPct = Math.round((stage.count / funnelData[0].count) * 100);
                  return (
                    <li key={stage.name} className="grid grid-cols-[5.5rem_minmax(0,1fr)_1.5rem] items-center gap-2 group/item">
                      <div className="min-w-0">
                        <span className="truncate text-[10px] font-bold text-text-primary/80 block leading-tight">{stage.name}</span>
                        <span className="text-[8px] text-text-muted/60 font-semibold">{convPct}% conv</span>
                      </div>
                      <span className="h-5 overflow-hidden rounded-full bg-surface-2 block relative cursor-pointer">
                        <motion.span
                          initial={{ width: '0%' }}
                          animate={chartVisible ? { width: `${(stage.count / maxStageCount) * 100}%` } : { width: '0%' }}
                          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: index * 0.07 }}
                          className={`grid h-full place-items-center rounded-full text-[9px] font-bold text-primary-foreground ${STAGE_BG[index] || STAGE_BG[STAGE_BG.length - 1]} group-hover/item:opacity-90`}
                        >
                          {stage.count >= 20 && stage.count}
                        </motion.span>
                      </span>
                      <span className="text-right text-[10px] font-bold text-text-muted tabular-nums">{stage.count}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}

        {/* Source Donut */}
        {hasSources && (
          <div className="bg-card border border-border-default rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-nav transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-1.5">
                  <h3 className="font-bold text-text-primary text-sm">Deals by source</h3>
                  <span title="Percentage of deals initiated per source channel"><Info className="h-3 w-3 text-text-muted cursor-help" strokeWidth={1.75} /></span>
                </div>
              </div>
              <div className="flex flex-col items-center mt-4">
                <div className="relative h-28 w-28 flex items-center justify-center shrink-0">
                  <svg className="size-full -rotate-90" viewBox="0 0 160 160">
                    <circle cx="80" cy="80" r="56" fill="none" stroke="var(--secondary)" strokeWidth="14" />
                    {sourceData.map((seg, idx) => (
                      <motion.circle
                        key={idx}
                        cx="80" cy="80" r="56"
                        fill="none"
                        stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                        strokeWidth={hoveredSourceIdx === idx ? 18 : 14}
                        strokeDasharray={`${sourceSegments[idx].dash} ${CIRC}`}
                        strokeDashoffset={sourceSegments[idx].offset}
                        initial={{ strokeDashoffset: CIRC }}
                        animate={chartVisible ? { strokeDashoffset: sourceSegments[idx].offset } : { strokeDashoffset: CIRC }}
                        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: idx * 0.05 }}
                        className="cursor-pointer transition-all duration-200"
                        onMouseEnter={() => setHoveredSourceIdx(idx)}
                        onMouseLeave={() => setHoveredSourceIdx(null)}
                      />
                    ))}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="text-sm font-bold text-text-primary leading-none font-sans tabular-nums">
                      {hoveredSourceIdx !== null ? fmtCurrency(sourceData[hoveredSourceIdx].value) : fmtCurrency(totalSourceValue)}
                    </span>
                    <span className="text-[8px] text-text-muted font-bold tracking-wider uppercase mt-1 leading-none">
                      {hoveredSourceIdx !== null ? sourceData[hoveredSourceIdx].name : 'Total'}
                    </span>
                  </div>
                </div>
                <div className="mt-5 space-y-1 w-full border-t border-border-default/20 pt-3">
                  {sourceData.map((src, idx) => (
                    <div key={idx} className={`flex items-center justify-between p-0.5 rounded transition-colors ${hoveredSourceIdx === idx ? 'bg-surface-2' : ''}`} onMouseEnter={() => setHoveredSourceIdx(idx)} onMouseLeave={() => setHoveredSourceIdx(null)}>
                      <div className="flex items-center space-x-1.5 min-w-0">
                        <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                        <span className="text-[10px] font-semibold text-text-muted truncate">{src.name}</span>
                      </div>
                      <span className="text-[10px] font-bold text-text-primary tabular-nums">{src.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Company Size Donut */}
        {hasSizes && (
          <div className="bg-card border border-border-default rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-nav transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-text-primary text-sm">Company size</h3>
              </div>
              <div className="flex flex-col items-center mt-4">
                <div className="relative h-28 w-28 flex items-center justify-center shrink-0">
                  <svg className="size-full -rotate-90" viewBox="0 0 160 160">
                    <circle cx="80" cy="80" r="56" fill="none" stroke="var(--secondary)" strokeWidth="14" />
                    {sizeData.map((seg, idx) => (
                      <motion.circle
                        key={idx}
                        cx="80" cy="80" r="56"
                        fill="none"
                        stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                        strokeWidth={hoveredSizeIdx === idx ? 18 : 14}
                        strokeDasharray={`${sizeSegments[idx].dash} ${CIRC}`}
                        strokeDashoffset={sizeSegments[idx].offset}
                        initial={{ strokeDashoffset: CIRC }}
                        animate={chartVisible ? { strokeDashoffset: sizeSegments[idx].offset } : { strokeDashoffset: CIRC }}
                        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: idx * 0.05 }}
                        className="cursor-pointer transition-all duration-200"
                        onMouseEnter={() => setHoveredSizeIdx(idx)}
                        onMouseLeave={() => setHoveredSizeIdx(null)}
                      />
                    ))}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="text-sm font-bold text-text-primary leading-none font-sans tabular-nums">
                      {hoveredSizeIdx !== null ? `${sizeData[hoveredSizeIdx].pct}%` : ''}
                    </span>
                    <span className="text-[8px] text-text-muted font-bold tracking-wider uppercase mt-1 leading-none">
                      {hoveredSizeIdx !== null ? sizeData[hoveredSizeIdx].name.split(' ')[0] : ''}
                    </span>
                  </div>
                </div>
                <div className="mt-5 space-y-1 w-full border-t border-border-default/20 pt-3">
                  {sizeData.map((sz, idx) => (
                    <div key={idx} className={`flex items-center justify-between p-0.5 rounded transition-colors ${hoveredSizeIdx === idx ? 'bg-surface-2' : ''}`} onMouseEnter={() => setHoveredSizeIdx(idx)} onMouseLeave={() => setHoveredSizeIdx(null)}>
                      <div className="flex items-center space-x-1.5 min-w-0">
                        <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                        <span className="text-[10px] font-semibold text-text-muted truncate">{sz.name}</span>
                      </div>
                      <span className="text-[10px] font-bold text-text-primary tabular-nums">{sz.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
