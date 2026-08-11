'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp, ArrowDown, Award } from 'lucide-react';
import { asNumber } from '@/utils/api';

interface Stage {
  stage: string;
  deal_count: number;
  total_value: any;
  percentage: any;
}

interface Props {
  stages?: Stage[];
}

export default function ManagerFunnelStageCard({ stages = [] }: Props) {
  const data = useMemo(() => {
    if (!stages.length) return [];
    const maxCount = Math.max(...stages.map(s => s.deal_count), 1);
    return stages.map((s, i) => {
      const convRate = i > 0 && stages[i - 1].deal_count > 0
        ? Math.round((s.deal_count / stages[i - 1].deal_count) * 100)
        : 100;
      const dropOff = i > 0 ? 100 - convRate : 0;
      return {
        stage: s.stage,
        count: s.deal_count,
        value: asNumber(s.total_value),
        barPct: Math.max((s.deal_count / maxCount) * 100, 5),
        convRate,
        dropOff,
        isLast: i === stages.length - 1
      };
    });
  }, [stages]);

  const stepColors = [
    { accent: 'text-accent-color', bg: 'bg-accent-color', ring: 'ring-accent-color/20', bar: 'from-accent-color to-accent-color/70', badge: 'bg-accent-color/10 text-accent-color dark:text-accent-color border-accent-color/20' },
    { accent: 'text-accent-color', bg: 'bg-accent-color', ring: 'ring-accent-color/20', bar: 'from-accent-color to-accent-color/70', badge: 'bg-accent-color/10 text-accent-color dark:text-accent-color border-accent-color/20' },
    { accent: 'text-accent-color', bg: 'bg-accent-color', ring: 'ring-accent-color/20', bar: 'from-accent-color to-accent-color/70', badge: 'bg-accent-color/10 text-accent-color dark:text-accent-color border-accent-color/20' },
    { accent: 'text-accent-color', bg: 'bg-accent-color', ring: 'ring-accent-color/20', bar: 'from-accent-color to-accent-color/70', badge: 'bg-accent-color/10 text-accent-color dark:text-accent-color border-accent-color/20' },
    { accent: 'text-status-success-text', bg: 'bg-status-success-bg', ring: 'ring-status-success-bg/20', bar: 'from-status-success-bg to-status-success-bg/70', badge: 'bg-status-success-bg/10 text-status-success-text dark:text-status-success-text border-status-success-bg/20' },
  ];

  if (!data.length) {
    return (
      <div className="bg-surface-1 border border-border-default/60 rounded-2xl p-6 flex items-center justify-center h-48 text-text-muted text-sm font-semibold">
        No pipeline stage data available
      </div>
    );
  }

  return (
    <div className="bg-surface-1/95 backdrop-blur-md border border-border-default/70 hover:border-accent-color/30 rounded-2xl p-6 shadow-[0_1px_2px_0_rgba(15,23,42,0.05),0_18px_44px_-20px_rgba(79,70,229,0.18)] hover:shadow-[0_26px_58px_-20px_rgba(79,70,229,0.32)] transition-all duration-300 relative overflow-hidden group">
      <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-accent-color/4 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-border-default/50">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-status-success-bg/10 text-status-success-text border border-status-success-bg/15 flex items-center justify-center shadow-inner">
            <Award size={18} />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-text-primary tracking-tight">Conversion Progression</h4>
            <p className="text-[10px] text-text-muted uppercase font-extrabold tracking-wider mt-0.5">Stage-by-Stage Breakdown</p>
          </div>
        </div>
        <div className="text-xs font-bold text-text-muted tabular-nums">
          {data.length} stages
        </div>
      </div>

      {/* Stage steps */}
      <div className="space-y-0">
        {data.map((stage, idx) => {
          const sc = stepColors[idx % stepColors.length];
          return (
            <div key={stage.stage}>
              <motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.07, duration: 0.4 }}
                className="flex items-start gap-4"
              >
                {/* Left: Step indicator + connector */}
                <div className="flex flex-col items-center shrink-0">
                  <div className={`w-8 h-8 rounded-full ${sc.bg} ring-4 ${sc.ring} flex items-center justify-center text-white text-[10px] font-extrabold shadow-sm`}>
                    {idx + 1}
                  </div>
                  {!stage.isLast && (
                    <div className="w-0.5 grow my-1 bg-border/50 min-h-[20px]" />
                  )}
                </div>

                {/* Right: Stage details */}
                <div className={`flex-1 pb-${stage.isLast ? 0 : 3}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-extrabold text-text-primary capitalize">{stage.stage}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-text-primary tabular-nums">
                        {stage.count} <span className="text-text-muted font-semibold text-[10px]">deals</span>
                      </span>
                      {stage.value > 0 && (
                        <span className="text-[10px] font-bold text-text-muted tabular-nums">
                          ₹{(stage.value / 100000).toFixed(1)}L
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 rounded-full bg-muted/50 overflow-hidden mb-2">
                    <motion.div
                      className={`h-full rounded-full bg-gradient-to-r ${sc.bar}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${stage.barPct}%` }}
                      transition={{ duration: 0.6, delay: idx * 0.07 + 0.2, ease: 'easeOut' }}
                    />
                  </div>

                  {/* Conversion badge */}
                  {idx > 0 && (
                    <div className="flex items-center gap-2">
                      {stage.convRate >= 60 ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${sc.badge}`}>
                          <TrendingUp size={9} />
                          {stage.convRate}% conv.
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-status-danger-bg/10 text-status-danger-text border border-status-danger-bg/20">
                          <TrendingDown size={9} />
                          {stage.convRate}% conv.
                        </span>
                      )}
                      {stage.dropOff > 0 && (
                        <span className="text-[10px] text-text-muted font-semibold">
                          −{stage.dropOff}% dropped
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Between-stage drop-off indicator */}
              {!stage.isLast && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.07 + 0.35 }}
                  className="flex items-center gap-2 pl-10 py-0.5"
                >
                  <ArrowDown size={12} className="text-text-muted/40 shrink-0" />
                  <span className="text-[9px] text-text-muted/50 font-semibold uppercase tracking-wide">
                    next stage
                  </span>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
