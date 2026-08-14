'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, HelpCircle } from 'lucide-react';
import { formatINR } from '@/utils/api';

interface FunnelChartCardProps {
  leads?: any[];
  deals?: any[];
  className?: string;
}

/* ──────────────────────────────────────────────────────────────────
   Funnel stage colours (light → dark, top → bottom)
────────────────────────────────────────────────────────────────── */
const STAGE_FILLS = [
  '#6C63FF',   // New Leads    — deep violet
  '#7B74FF',   // Contacted    — violet
  '#8A8BFF',   // Qualified    — blue-violet
  '#99AAFF',   // Proposals    — periwinkle
  '#4BD08B',   // Won          — green
];

export default function FunnelChartCard({ leads = [], deals = [], className = '' }: FunnelChartCardProps) {
  /* ── Compute stage data ── */
  const [hoveredStage, setHoveredStage] = useState<number | null>(null);
  const svgContainerRef = React.useRef<HTMLDivElement>(null);

  const stages = useMemo(() => {
    const activeLeads = leads.filter(l => l.status !== 'Lost' && l.status !== 'Converted');
    const newLeads    = activeLeads.filter(l => l.status === 'new').length;
    const contacted   = activeLeads.filter(l => l.status === 'contacted').length;
    const qualified   = deals.filter(d => d.stage === 'Qualified').length + activeLeads.filter(l => l.status === 'qualified').length;
    const proposals   = deals.filter(d => d.stage === 'Proposal' || d.stage === 'Negotiation').length + activeLeads.filter(l => l.status === 'proposal_sent').length;
    const won         = deals.filter(d => d.stage === 'Won' || d.status === 'Closed Won').length + leads.filter(l => l.status === 'won').length;

    const raw = [newLeads, contacted, qualified, proposals, won];

    const names = ['New Leads', 'Contacted', 'Qualified', 'Proposals', 'Won'];
    const top   = raw[0] || 1;

    return names.map((name, i) => ({
      name,
      count: raw[i],
      pct: Math.round((raw[i] / top) * 100),
      conversionFromPrev: i > 0 ? Math.round((raw[i] / Math.max(raw[i - 1], 1)) * 100) : 100,
    }));
  }, [leads, deals]);

  /* ── SVG funnel geometry ──
     Each stage is a symmetric trapezoid.
     maxW = full card width track, minW = narrowest (Won).
     We produce 5 stacked trapezoids — each sharing top edge with prev bottom.
  ── */
  const SVG_W  = 220;   // viewBox width for the funnel shape
  const SVG_H  = 250;   // viewBox height
  const ROWS   = stages.length;
  const ROW_H  = SVG_H / ROWS;  // 50 per row
  const MAX_HW = SVG_W / 2;     // half-width at top  = 110
  const MIN_HW = 28;            // half-width at bottom

  function halfWidth(i: number) {
    // linearly taper from MAX_HW at i=0 to MIN_HW at i=ROWS-1
    return MAX_HW - (MAX_HW - MIN_HW) * (i / (ROWS - 1));
  }

  const paths = stages.map((_, i) => {
    const y1 = i * ROW_H;
    const y2 = (i + 1) * ROW_H;
    const hw1 = halfWidth(i);
    const hw2 = halfWidth(i + 1);
    const cx  = SVG_W / 2;
    return `M ${cx - hw1} ${y1} L ${cx + hw1} ${y1} L ${cx + hw2} ${y2} L ${cx - hw2} ${y2} Z`;
  });

  return (
    <div className={`bg-card border border-border rounded-2xl p-5 shadow-sm ${className}`}>

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-accent-color/10 border border-accent-color/15">
            <Layers className="size-4 text-accent-color" strokeWidth={2} />
          </span>
          <div>
            <h2 className="text-[15px] font-bold text-foreground leading-tight">Pipeline Funnel Analysis</h2>
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">
              Conversion &amp; Drop-Offs
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
          <HelpCircle className="size-3" />
          Top Relative Conversion
        </span>
      </div>

      {/* ── Main layout: stage rows ── */}
      <div className="flex items-stretch gap-4">

        {/* Stage labels column */}
        <div className="flex flex-col justify-around w-[90px] shrink-0">
          {stages.map((s, i) => (
            <div key={s.name} className="flex items-center h-[50px]">
              <span
                className="text-[11px] font-semibold text-foreground truncate"
                style={{ color: i === ROWS - 1 ? '#4BD08B' : undefined }}
              >
                {s.name}
              </span>
            </div>
          ))}
        </div>

        {/* SVG funnel + HTML tooltip overlay */}
        <div className="flex-1 min-w-0 relative" ref={svgContainerRef}>
          <svg
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            className="w-full h-auto"
            style={{ maxHeight: 260 }}
            preserveAspectRatio="xMidYMid meet"
          >
            {paths.map((d, i) => (
              <motion.path
                key={i}
                d={d}
                fill={STAGE_FILLS[i]}
                fillOpacity={hoveredStage === i ? 1 : 0.9}
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 }}
                style={{ transformOrigin: `${SVG_W / 2}px center`, cursor: 'pointer' }}
                onMouseEnter={() => setHoveredStage(i)}
                onMouseLeave={() => setHoveredStage(null)}
              />
            ))}
            {/* Connector dots on right edge */}
            {stages.map((_, i) => {
              const cx = SVG_W / 2;
              const hw = halfWidth(i);
              const y  = i * ROW_H + ROW_H / 2;
              return (
                <circle
                  key={`dot-${i}`}
                  cx={cx + hw - 2}
                  cy={y}
                  r={3}
                  fill="white"
                  fillOpacity={hoveredStage === i ? 1 : 0.7}
                />
              );
            })}
          </svg>

          {/* HTML tooltip — rendered outside SVG so it never intercepts mouse events */}
          <AnimatePresence>
            {hoveredStage !== null && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.15 }}
                className="absolute pointer-events-none z-10"
                style={{
                  left: '50%',
                  top: `${((hoveredStage * ROW_H + ROW_H / 2) / SVG_H) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className="rounded-lg bg-[#1a1a2e] border border-white/15 px-3 py-2 shadow-xl min-w-[120px] text-center">
                  <p className="text-[11px] font-bold text-white leading-tight">{stages[hoveredStage].name}</p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                    {stages[hoveredStage].count} deals ({stages[hoveredStage].pct}%)
                  </p>
                  {hoveredStage > 0 && (
                    <p className="text-[9px] font-semibold mt-0.5" style={{ color: '#6C63FF' }}>
                      {stages[hoveredStage].conversionFromPrev}% from prev
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Count + % column */}
        <div className="flex flex-col justify-around w-[70px] shrink-0 text-right">
          {stages.map((s, i) => (
            <div key={s.name} className="flex flex-col items-end justify-center h-[50px]">
              <span className="text-[13px] font-extrabold text-foreground tabular-nums">{s.count}</span>
              <span
                className="text-[11px] font-bold tabular-nums"
                style={{ color: STAGE_FILLS[i] }}
              >
                {s.pct}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
