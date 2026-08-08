'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
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
    const totalDeals = stages.reduce((sum, s) => sum + s.deal_count, 0) || 1;
    return stages.map((s, i) => ({
      ...s,
      pct: Math.round((s.deal_count / totalDeals) * 100),
      convRate: i > 0 && stages[i - 1].deal_count > 0
        ? Math.round((s.deal_count / stages[i - 1].deal_count) * 100)
        : 100,
    }));
  }, [stages]);

  const gradients = [
    'from-indigo-500/15 to-indigo-600/5 border-indigo-500/20',
    'from-violet-500/15 to-violet-600/5 border-violet-500/20',
    'from-purple-500/15 to-purple-600/5 border-purple-500/20',
    'from-fuchsia-500/15 to-fuchsia-600/5 border-fuchsia-500/20',
    'from-emerald-500/15 to-emerald-600/5 border-emerald-500/20',
  ];

  const textColors = [
    'text-indigo-600 dark:text-indigo-400',
    'text-violet-600 dark:text-violet-400',
    'text-purple-600 dark:text-purple-400',
    'text-fuchsia-600 dark:text-fuchsia-400',
    'text-emerald-600 dark:text-emerald-400',
  ];

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        No pipeline stage data available
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {data.map((stage, idx) => (
        <motion.div
          key={stage.stage}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: idx * 0.08 }}
          className={`bg-gradient-to-br ${gradients[idx % gradients.length]} border rounded-xl p-4 flex flex-col items-center text-center gap-2 hover:scale-[1.03] transition-transform`}
        >
          <span className={`text-2xl font-extrabold tabular-nums ${textColors[idx % textColors.length]}`}>
            {stage.deal_count}
          </span>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider leading-tight">
            {stage.stage}
          </span>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="font-semibold text-foreground tabular-nums">{stage.pct}%</span>
            {idx > 0 && (
              <span className="text-emerald-500 font-bold tabular-nums">
                {stage.convRate}% conv
              </span>
            )}
          </div>
          {asNumber(stage.total_value) > 0 && (
            <span className="text-[10px] font-bold text-muted-foreground tabular-nums">
              ₹{(asNumber(stage.total_value) / 100000).toFixed(1)}L
            </span>
          )}
        </motion.div>
      ))}
    </div>
  );
}
