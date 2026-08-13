'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Layers, HelpCircle } from 'lucide-react';
import { asNumber, formatINR } from '@/utils/api';

interface Stage {
  stage: string;
  deal_count: number;
  total_value: any;
  percentage: any;
}

interface Props {
  stages?: Stage[];
}

export default function ManagerFunnelChart({ stages = [] }: Props) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const data = useMemo(() => {
    if (!stages.length) return [];
    return stages.map(s => ({
      stage: s.stage || '',
      count: s.deal_count || 0,
      value: asNumber(s.total_value) || 0
    }));
  }, [stages]);

  const maxVal = data[0]?.count || 1;

  const funnelStages = useMemo(() => {
    return data.map((item, idx) => {
      const pctOfFirst = maxVal > 0 ? Math.round((item.count / maxVal) * 100) : 0;
      let dropOff = 0;
      if (idx > 0) {
        const prevCount = data[idx - 1].count;
        dropOff = prevCount > 0 ? Math.max(0, 100 - Math.round((item.count / prevCount) * 100)) : 0;
      }
      return { ...item, pctOfFirst, dropOff };
    });
  }, [data, maxVal]);

  const segmentWidth = funnelStages.length > 0 ? 1000 / funnelStages.length : 200;

  const heights = useMemo(() => {
    const arr: number[] = [];
    const startH = 200, endH = 42;
    for (let i = 0; i <= funnelStages.length; i++) {
      arr.push(startH - (i * (startH - endH) / Math.max(funnelStages.length, 1)));
    }
    return arr;
  }, [funnelStages.length]);

  const paths = useMemo(() => {
    return funnelStages.map((_, i) => {
      const xStart = i * segmentWidth;
      const xEnd = (i + 1) * segmentWidth;
      const hStart = heights[i];
      const hEnd = heights[i + 1];
      const centerY = 140;
      const yTopStart = centerY - hStart / 2;
      const yBottomStart = centerY + hStart / 2;
      const yTopEnd = centerY - hEnd / 2;
      const yBottomEnd = centerY + hEnd / 2;
      const cp = segmentWidth * 0.5;
      return `M ${xStart} ${yTopStart} C ${xStart + cp} ${yTopStart}, ${xEnd - cp} ${yTopEnd}, ${xEnd} ${yTopEnd} L ${xEnd} ${yBottomEnd} C ${xEnd - cp} ${yBottomEnd}, ${xStart + cp} ${yBottomStart}, ${xStart} ${yBottomStart} Z`;
    });
  }, [funnelStages, segmentWidth, heights]);

  const stageColors = [
    { fill: 'fill-indigo-100 dark:fill-indigo-950', badge: 'bg-accent-color/10 text-accent-color dark:text-accent-color border border-accent-color/20', glow: 'rgba(99,102,241,0.25)' },
    { fill: 'fill-violet-200 dark:fill-violet-900', badge: 'bg-violet-500/10 text-violet-600 dark:text-violet-300 border border-violet-500/20', glow: 'rgba(139,92,246,0.35)' },
    { fill: 'fill-purple-300 dark:fill-purple-800', badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20', glow: 'rgba(168,85,247,0.45)' },
    { fill: 'fill-fuchsia-400 dark:fill-fuchsia-700', badge: 'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-300 border border-fuchsia-500/20', glow: 'rgba(217,70,239,0.55)' },
    { fill: 'fill-emerald-400 dark:fill-emerald-700', badge: 'bg-status-success/10 text-status-success dark:text-status-success border border-status-success/20', glow: 'rgba(16,185,129,0.55)' },
  ];

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  if (!data.length) {
    return (
      <div className="bg-surface-1 border border-border-default/60 rounded-2xl p-6 flex items-center justify-center h-48 text-text-muted text-sm font-semibold">
        No pipeline stage data available
      </div>
    );
  }

  return (
    <div className="bg-surface-1/95 backdrop-blur-md border border-border-default/70 hover:border-accent-color/30 rounded-2xl p-6 shadow-[0_1px_2px_0_rgba(15,23,42,0.05),0_18px_44px_-20px_rgba(79,70,229,0.18)] hover:shadow-[0_26px_58px_-20px_rgba(79,70,229,0.32)] transition-all duration-300 relative overflow-hidden group">
      <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-accent-color/5 blur-3xl pointer-events-none group-hover:bg-accent-color/8 transition duration-500" />

      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-border-default/50">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-accent-color/10 text-accent-color border border-accent-color/15 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
            <Layers size={18} />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-text-primary tracking-tight">Pipeline Funnel</h4>
            <p className="text-[10px] text-text-muted uppercase font-extrabold tracking-wider mt-0.5">Stage Conversion & Drop-offs</p>
          </div>
        </div>
        <div className="text-[10px] text-text-muted font-bold flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50 border border-border-default/40 cursor-help select-none">
          <HelpCircle size={11} />
          <span>Relative conversion</span>
        </div>
      </div>

      <div className="relative w-full select-none">
        <svg
          viewBox="0 0 1000 280"
          className="w-full h-auto cursor-pointer"
          style={{ overflow: 'visible' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {funnelStages.map((stage, idx) => {
            const isHovered = hoveredIndex === idx;
            const sc = stageColors[idx % stageColors.length];
            return (
              <g key={idx} onMouseEnter={() => setHoveredIndex(idx)}>
                <motion.path
                  d={paths[idx]}
                  className={`transition-all duration-300 ${sc.fill}`}
                  style={{
                    filter: isHovered ? `drop-shadow(0 8px 16px ${sc.glow})` : 'none',
                    transformOrigin: `${idx * segmentWidth + segmentWidth / 2}px 140px`
                  }}
                  animate={{ scale: isHovered ? 1.02 : 1 }}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.08, duration: 0.4 }}
                />
                {/* Count top */}
                <motion.text x={idx * segmentWidth + segmentWidth / 2} y={22} textAnchor="middle" dominantBaseline="middle" fontSize="14" fontWeight="800" fontFamily="sans-serif" className="fill-foreground tabular-nums" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: idx * 0.08 + 0.2 }}>
                  {stage.count}
                </motion.text>
                {/* Stage label bottom */}
                <motion.text x={idx * segmentWidth + segmentWidth / 2} y={264} textAnchor="middle" dominantBaseline="middle" fontSize="9" fontWeight="700" fontFamily="sans-serif" className="fill-muted-foreground" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: idx * 0.08 + 0.2 }}>
                  {stage.stage}
                </motion.text>
              </g>
            );
          })}
        </svg>

        {/* Percentage badges */}
        <div className="absolute pointer-events-none" style={{ inset: 0 }}>
          {funnelStages.map((stage, idx) => {
            const leftPercent = (idx * segmentWidth + segmentWidth / 2) / 10;
            const sc = stageColors[idx % stageColors.length];
            return (
              <div key={idx} className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ left: `${leftPercent}%`, top: '50%' }}>
                <motion.span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-sm ${sc.badge}`} initial={{ scale: 0, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }} transition={{ delay: idx * 0.08 + 0.3, type: 'spring', stiffness: 120 }}>
                  {stage.pctOfFirst}%
                </motion.span>
              </div>
            );
          })}
        </div>

        {/* Tooltip */}
        {hoveredIndex !== null && (
          <div
            className="absolute z-20 bg-slate-900 text-slate-100 text-xs rounded-xl p-3 shadow-2xl pointer-events-none flex flex-col gap-1.5 animate-in fade-in zoom-in-95 duration-150 min-w-[160px]"
            style={{
              left: Math.min(Math.max((hoveredIndex * segmentWidth + segmentWidth / 2) / 10 * (window?.innerWidth || 1000) / 100 - 80, 0), 800),
              top: tooltipPos.y > 120 ? tooltipPos.y - 130 : tooltipPos.y + 24
            }}
          >
            <div className="font-extrabold text-[11px] uppercase tracking-wider border-b border-white/10 pb-1 mb-0.5 text-slate-200 capitalize">
              {funnelStages[hoveredIndex].stage}
            </div>
            <div className="flex justify-between gap-6 text-slate-400"><span>Deals:</span><span className="font-bold text-white tabular-nums">{funnelStages[hoveredIndex].count}</span></div>
            <div className="flex justify-between gap-6 text-slate-400"><span>Value:</span><span className="font-bold text-white tabular-nums">{formatINR(funnelStages[hoveredIndex].value)}</span></div>
            <div className="flex justify-between gap-6 text-slate-400"><span>Relative:</span><span className="font-bold text-white tabular-nums">{funnelStages[hoveredIndex].pctOfFirst}%</span></div>
            {hoveredIndex > 0 && (
              <div className="flex justify-between gap-6 text-slate-400 border-t border-white/5 pt-1 mt-0.5"><span>Drop-off:</span><span className="font-bold text-status-danger tabular-nums">−{funnelStages[hoveredIndex].dropOff}%</span></div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
