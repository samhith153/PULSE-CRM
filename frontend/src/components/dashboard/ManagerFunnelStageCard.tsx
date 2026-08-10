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
    { accent: 'text-indigo-500', bg: 'bg-indigo-500', ring: 'ring-indigo-500/20', bar: 'from-indigo-500 to-indigo-400', badge: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border-indigo-500/20' },
    { accent: 'text-violet-500', bg: 'bg-violet-500', ring: 'ring-violet-500/20', bar: 'from-violet-500 to-violet-400', badge: 'bg-violet-500/10 text-violet-600 dark:text-violet-300 border-violet-500/20' },
    { accent: 'text-purple-500', bg: 'bg-purple-500', ring: 'ring-purple-500/20', bar: 'from-purple-500 to-purple-400', badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/20' },
    { accent: 'text-fuchsia-500', bg: 'bg-fuchsia-500', ring: 'ring-fuchsia-500/20', bar: 'from-fuchsia-500 to-fuchsia-400', badge: 'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-300 border-fuchsia-500/20' },
    { accent: 'text-emerald-500', bg: 'bg-emerald-500', ring: 'ring-emerald-500/20', bar: 'from-emerald-500 to-emerald-400', badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/20' },
  ];

  if (!data.length) {
    return (
      <div className="bg-card border border-border/60 rounded-2xl p-6 flex items-center justify-center h-48 text-muted-foreground text-sm font-semibold">
        No pipeline stage data available
      </div>
    );
  }

  return (
    <div className="bg-card/95 backdrop-blur-md border border-border/70 hover:border-brand-purple/30 rounded-2xl p-6 shadow-[0_1px_2px_0_rgba(15,23,42,0.05),0_18px_44px_-20px_rgba(79,70,229,0.18)] hover:shadow-[0_26px_58px_-20px_rgba(79,70,229,0.32)] transition-all duration-300 relative overflow-hidden group">
      <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-brand-purple/4 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/15 flex items-center justify-center shadow-inner">
            <Award size={18} />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-foreground tracking-tight">Conversion Progression</h4>
            <p className="text-[10px] text-muted-foreground uppercase font-extrabold tracking-wider mt-0.5">Stage-by-Stage Breakdown</p>
          </div>
        </div>
        <div className="text-xs font-bold text-muted-foreground tabular-nums">
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
                    <span className="text-sm font-extrabold text-foreground capitalize">{stage.stage}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-foreground tabular-nums">
                        {stage.count} <span className="text-muted-foreground font-semibold text-[10px]">deals</span>
                      </span>
                      {stage.value > 0 && (
                        <span className="text-[10px] font-bold text-muted-foreground tabular-nums">
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
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                          <TrendingDown size={9} />
                          {stage.convRate}% conv.
                        </span>
                      )}
                      {stage.dropOff > 0 && (
                        <span className="text-[10px] text-muted-foreground font-semibold">
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
                  <ArrowDown size={12} className="text-muted-foreground/40 shrink-0" />
                  <span className="text-[9px] text-muted-foreground/50 font-semibold uppercase tracking-wide">
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
