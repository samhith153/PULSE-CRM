'use client';

import React, { useState } from 'react';
import { Info, ChevronDown, BarChart2 } from 'lucide-react';
import { useReveal } from '@/hooks/use-reveal';
import { motion, AnimatePresence } from 'framer-motion';

interface ChartsProps {
  loading?: boolean;
  empty?: boolean;
}

export default function Charts({ loading = false, empty = false }: ChartsProps) {
  const { ref: chartRef, visible: chartVisible } = useReveal<HTMLDivElement>();
  const [revenueHoveredPoint, setRevenueHoveredPoint] = useState<{ x: number; y: number; label: string; value: string } | null>({
    x: 56,
    y: 40,
    label: "May 13, 2025",
    value: "₹2.45M"
  });

  const [hoveredSourceIdx, setHoveredSourceIdx] = useState<number | null>(null);
  const [hoveredSizeIdx, setHoveredSizeIdx] = useState<number | null>(null);

  // Revenue Over Time Line Chart coordinates
  const coords = [
    { x: 0, y: 82, val: "₹0.8M", label: "May 1, 2025" },
    { x: 14, y: 70, val: "₹1.2M", label: "May 4, 2025" },
    { x: 28, y: 62, val: "₹1.5M", label: "May 7, 2025" },
    { x: 42, y: 50, val: "₹1.8M", label: "May 10, 2025" },
    { x: 56, y: 40, val: "₹2.45M", label: "May 13, 2025" },
    { x: 70, y: 30, val: "₹2.9M", label: "May 16, 2025" },
    { x: 84, y: 24, val: "₹3.3M", label: "May 18, 2025" },
    { x: 100, y: 8, val: "₹3.85M", label: "May 20, 2025" }
  ];

  // Stage funnel bars: premium brand-purple accent with varying opacity levels
  const pipelineStages = [
    { name: "Leads", count: 120, bg: "bg-brand-purple" },
    { name: "Qualified", count: 86, bg: "bg-brand-purple/85" },
    { name: "Proposal Sent", count: 40, bg: "bg-brand-purple/70" },
    { name: "Negotiation", count: 28, bg: "bg-brand-purple/55" },
    { name: "Won", count: 23, bg: "bg-brand-purple/40" }
  ];

  const maxStageCount = Math.max(...pipelineStages.map((s) => s.count));

  // Source chart percentages using new accents
  const sources = [
    { name: "Website", pct: 45, color: "var(--brand-purple)", val: "₹1.73M" },
    { name: "Referral", pct: 25, color: "var(--brand-cyan)", val: "₹0.96M" },
    { name: "Email", pct: 15, color: "var(--brand-blue)", val: "₹0.58M" },
    { name: "Social Media", pct: 10, color: "var(--chart-4)", val: "₹0.39M" },
    { name: "Other", pct: 5, color: "var(--chart-5)", val: "₹0.19M" }
  ];

  // Company size percentages using new accents
  const companySizes = [
    { name: "1-10 emp", pct: 15, color: "var(--brand-blue)" },
    { name: "11-50 emp", pct: 25, color: "var(--brand-purple)" },
    { name: "51-200 emp", pct: 30, color: "var(--brand-cyan)" },
    { name: "201-1000 emp", pct: 20, color: "var(--chart-4)" },
    { name: "1000+ emp", pct: 10, color: "var(--chart-5)" }
  ];

  // Helper to generate path for curved lines
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

  const linePathStr = curvePath(coords);
  const areaPathStr = `${linePathStr} L 100 90 L 0 90 Z`;

  // Helper to generate segments for donut charts
  const CIRC = 2 * Math.PI * 56;
  const getSegments = (data: Array<{ pct: number }>) => {
    let acc = 0;
    return data.map((d) => {
      const dash = (d.pct / 100) * CIRC;
      const offset = -(acc / 100) * CIRC;
      acc += d.pct;
      return { dash, offset };
    });
  };

  const sourceSegments = getSegments(sources);
  const sizeSegments = getSegments(companySizes);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-card border border-border rounded-2xl p-5 h-76 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border border-border rounded-2xl p-5 h-76 animate-pulse" />
          <div className="bg-card border border-border rounded-2xl p-5 h-76 animate-pulse" />
          <div className="bg-card border border-border rounded-2xl p-5 h-76 animate-pulse" />
        </div>
      </div>
    );
  }

  if (empty) {
    return (
      <div className="bg-card border border-border rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
        <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center border border-border text-brand-purple">
          <BarChart2 className="h-6 w-6" strokeWidth={1.5} />
        </div>
        <h4 className="text-sm font-bold text-foreground mt-4">No report data available</h4>
        <p className="text-xs text-muted-foreground mt-1.5 max-w-sm leading-relaxed">
          There are no analytics records matching your selection. Try adjusting the date range filters or selecting a different pipeline.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6" ref={chartRef as any}>
      {/* 1. Hero Revenue Line Chart (Spans full horizontal container width) */}
      <div 
        data-visible={chartVisible}
        className="reveal bg-card border border-border rounded-2xl p-6 flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-nav transition-all duration-300 w-full relative"
      >
        <div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-foreground">
                Revenue over time
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Closed-won revenue, rolling 18 days
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground">
              This month <ChevronDown size={13} />
            </span>
          </div>

          <div className="mt-6 grid grid-cols-[auto_minmax(0,1fr)] gap-4">
            {/* Axis labels y-axis */}
            <div className="flex flex-col justify-between py-1 text-[10px] text-muted-foreground">
              {["₹4M", "₹3M", "₹2M", "₹1M", "₹0"].map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
            <div>
              <svg
                viewBox="0 0 100 90"
                preserveAspectRatio="none"
                className="h-44 w-full overflow-visible"
                aria-hidden
              >
                <defs>
                  <linearGradient id="revenueBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand-blue)" />
                    <stop offset="100%" stopColor="var(--brand-purple)" />
                  </linearGradient>
                  <linearGradient id="revenueBarHoverGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand-cyan)" />
                    <stop offset="100%" stopColor="var(--brand-purple)" />
                  </linearGradient>
                </defs>
                {[0, 22.5, 45, 67.5, 90].map((y) => (
                  <line
                    key={y}
                    x1="0"
                    x2="100"
                    y1={y}
                    y2={y}
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    strokeOpacity={0.4}
                    vectorEffect="non-scaling-stroke"
                    className="text-border"
                  />
                ))}
                {/* Column Bars */}
                {coords.map((c, idx) => {
                  const isHovered = revenueHoveredPoint?.x === c.x;
                  return (
                    <motion.rect
                      key={idx}
                      x={c.x * 0.88 + 3}
                      y={c.y}
                      width="5.5"
                      height={90 - c.y}
                      rx="1.5"
                      fill={isHovered ? "url(#revenueBarHoverGrad)" : "url(#revenueBarGrad)"}
                      className="cursor-pointer transition-all duration-200"
                      whileHover={{ scaleY: 1.03, originY: 1 }}
                      initial={{ scaleY: 0, originY: 1 }}
                      animate={chartVisible ? { scaleY: 1 } : { scaleY: 0 }}
                      transition={{ duration: 0.6, ease: "easeOut", delay: idx * 0.05 }}
                      onMouseEnter={() => setRevenueHoveredPoint({ x: c.x, y: c.y, label: c.label, value: c.val })}
                    />
                  );
                })}
              </svg>
              <div className="mt-2.5 flex justify-between text-[10px] text-muted-foreground">
                {coords.map((pt, idx) => (
                  <span key={idx} className="cursor-pointer hover:text-foreground transition-colors" onMouseEnter={() => setRevenueHoveredPoint({ x: pt.x, y: pt.y, label: pt.label, value: pt.val })}>{pt.label.split(',')[0]}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Hover Tooltip */}
        <AnimatePresence>
          {revenueHoveredPoint && (
            <motion.div 
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 bg-popover border border-border rounded-xl shadow-float p-3 text-xs flex gap-4 z-20"
            >
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Date</p>
                <p className="font-semibold text-foreground mt-0.5">{revenueHoveredPoint.label}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-brand-purple">Revenue</p>
                <p className="font-semibold text-foreground mt-0.5">{revenueHoveredPoint.value}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2. Lower Grid (3 Columns: Stage Funnel, Source Donut, Company Size Donut) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Deals by Pipeline Stage Funnel Chart */}
        <div 
          className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-nav transition-all duration-300"
        >
          <div>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-foreground">
                Deals by stage
              </h2>
              <span className="inline-flex shrink-0 items-center gap-0.5 rounded-lg border border-border bg-background px-2 py-1 text-[10px] font-semibold text-muted-foreground">
                Month <ChevronDown size={10} />
              </span>
            </div>

            {/* Funnel Layout */}
            <ul className="mt-5 space-y-3.5">
              {pipelineStages.map((stage, index) => {
                const convPct = Math.round((stage.count / pipelineStages[0].count) * 100);
                return (
                  <li key={stage.name} className="grid grid-cols-[5.5rem_minmax(0,1fr)_1.5rem] items-center gap-2 group/item">
                    <div className="min-w-0">
                      <span className="truncate text-[10px] font-bold text-foreground/80 block leading-tight">{stage.name}</span>
                      <span className="text-[8px] text-muted-foreground/60 font-semibold">{convPct}% conv</span>
                    </div>
                    <span className="h-5 overflow-hidden rounded-full bg-secondary block relative cursor-pointer">
                      <motion.span 
                        initial={{ width: "0%" }}
                        animate={chartVisible ? { width: `${(stage.count / maxStageCount) * 100}%` } : { width: "0%" }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: index * 0.07 }}
                        className={`grid h-full place-items-center rounded-full text-[9px] font-bold text-primary-foreground ${stage.bg} group-hover/item:opacity-90`}
                      >
                        {stage.count >= 20 && stage.count}
                      </motion.span>
                    </span>
                    <span className="text-right text-[10px] font-bold text-muted-foreground tabular-nums">{stage.count}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-border/20 pt-3">
            <span className="text-[11px] font-medium text-muted-foreground">Avg Conversion</span>
            <span className="text-xs font-bold text-foreground">19.2%</span>
          </div>
        </div>

        {/* Deals by Source Donut Chart */}
        <div className="bg-card border border-border rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-nav transition-all duration-300 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-1.5">
                <h3 className="font-bold text-foreground text-sm">Deals by source</h3>
                <span title="Percentage of deals initiated per source channel">
                  <Info className="h-3 w-3 text-muted-foreground cursor-help" strokeWidth={1.75} />
                </span>
              </div>
              <div className="relative">
                <select className="appearance-none bg-secondary border border-border text-foreground focus:border-brand-purple rounded-lg px-2.5 py-1 pr-6 text-[10px] font-bold focus:outline-none cursor-pointer">
                  <option>Month</option>
                  <option>All</option>
                </select>
                <ChevronDown className="absolute right-1.5 top-1.5 h-3 w-3 text-muted-foreground pointer-events-none" strokeWidth={1.75} />
              </div>
            </div>

            <div className="flex flex-col items-center mt-4">
              {/* SVG Ring Donut */}
              <div className="relative h-28 w-28 flex items-center justify-center shrink-0">
                <svg className="size-full -rotate-90" viewBox="0 0 160 160">
                  <circle cx="80" cy="80" r="56" fill="none" stroke="var(--secondary)" strokeWidth="14" />
                  {sources.map((seg, idx) => (
                    <motion.circle
                      key={idx}
                      cx="80" cy="80" r="56"
                      fill="none"
                      stroke={seg.color}
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
                  <span className="text-sm font-bold text-foreground leading-none font-sans tabular-nums">
                    {hoveredSourceIdx !== null ? sources[hoveredSourceIdx].val : "₹3.85M"}
                  </span>
                  <span className="text-[8px] text-muted-foreground font-bold tracking-wider uppercase mt-1 leading-none">
                    {hoveredSourceIdx !== null ? sources[hoveredSourceIdx].name : "Total"}
                  </span>
                </div>
              </div>

              {/* Legend */}
              <div className="mt-5 space-y-1 w-full border-t border-border/20 pt-3">
                {sources.map((src, idx) => (
                  <div 
                    key={idx} 
                    className={`flex items-center justify-between p-0.5 rounded transition-colors ${
                      hoveredSourceIdx === idx ? 'bg-secondary' : ''
                    }`}
                    onMouseEnter={() => setHoveredSourceIdx(idx)}
                    onMouseLeave={() => setHoveredSourceIdx(null)}
                  >
                    <div className="flex items-center space-x-1.5 min-w-0">
                      <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: src.color }} />
                      <span className="text-[10px] font-semibold text-muted-foreground truncate">{src.name}</span>
                    </div>
                    <span className="text-[10px] font-bold text-foreground tabular-nums">{src.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Revenue by Company Size Donut Chart */}
        <div className="bg-card border border-border rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-nav transition-all duration-300 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-foreground text-sm">Company size</h3>
              <div className="relative">
                <select className="appearance-none bg-secondary border border-border text-foreground focus:border-brand-purple rounded-lg px-2.5 py-1 pr-6 text-[10px] font-bold focus:outline-none cursor-pointer">
                  <option>Quarter</option>
                  <option>Year</option>
                </select>
                <ChevronDown className="absolute right-1.5 top-1.5 h-3 w-3 text-muted-foreground pointer-events-none" strokeWidth={1.75} />
              </div>
            </div>

            <div className="flex flex-col items-center mt-4">
              {/* SVG Ring Donut */}
              <div className="relative h-28 w-28 flex items-center justify-center shrink-0">
                <svg className="size-full -rotate-90" viewBox="0 0 160 160">
                  <circle cx="80" cy="80" r="56" fill="none" stroke="var(--secondary)" strokeWidth="14" />
                  {companySizes.map((seg, idx) => (
                    <motion.circle
                      key={idx}
                      cx="80" cy="80" r="56"
                      fill="none"
                      stroke={seg.color}
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
                  <span className="text-sm font-bold text-foreground leading-none font-sans tabular-nums">
                    {hoveredSizeIdx !== null ? `${companySizes[hoveredSizeIdx].pct}%` : "₹3.85M"}
                  </span>
                  <span className="text-[8px] text-muted-foreground font-bold tracking-wider uppercase mt-1 leading-none">
                    {hoveredSizeIdx !== null ? companySizes[hoveredSizeIdx].name.split(' ')[0] : "Total"}
                  </span>
                </div>
              </div>

              {/* Legend */}
              <div className="mt-5 space-y-1 w-full border-t border-border/20 pt-3">
                {companySizes.map((sz, idx) => (
                  <div 
                    key={idx} 
                    className={`flex items-center justify-between p-0.5 rounded transition-colors ${
                      hoveredSizeIdx === idx ? 'bg-secondary' : ''
                    }`}
                    onMouseEnter={() => setHoveredSizeIdx(idx)}
                    onMouseLeave={() => setHoveredSizeIdx(null)}
                  >
                    <div className="flex items-center space-x-1.5 min-w-0">
                      <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: sz.color }} />
                      <span className="text-[10px] font-semibold text-muted-foreground truncate">{sz.name}</span>
                    </div>
                    <span className="text-[10px] font-bold text-foreground tabular-nums">{sz.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
