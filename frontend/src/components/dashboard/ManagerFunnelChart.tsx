'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingDown } from 'lucide-react';
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

export default function ManagerFunnelChart({ stages = [] }: Props) {
  const data = useMemo(() => {
    if (!stages.length) return [];
    const maxDeals = Math.max(...stages.map(s => s.deal_count), 1);
    return stages.map((s, i) => ({
      ...s,
      widthPct: Math.max((s.deal_count / maxDeals) * 100, 8),
      dropOff: i > 0 && stages[i - 1].deal_count > 0
        ? Math.max(0, 100 - Math.round((s.deal_count / stages[i - 1].deal_count) * 100))
        : 0,
    }));
  }, [stages]);

  const colors = [
    'from-indigo-500 to-indigo-600',
    'from-violet-500 to-violet-600',
    'from-purple-500 to-purple-600',
    'from-fuchsia-500 to-fuchsia-600',
    'from-emerald-500 to-emerald-600',
  ];

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        No pipeline stage data available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((stage, idx) => (
        <motion.div
          key={stage.stage}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="flex items-center gap-3"
        >
          <div className="w-28 text-xs font-semibold text-foreground truncate text-right">
            {stage.stage}
          </div>
          <div className="flex-1 relative h-8 bg-muted/50 rounded-lg overflow-hidden">
            <motion.div
              className={`absolute inset-y-0 left-0 bg-gradient-to-r ${colors[idx % colors.length]} rounded-lg flex items-center justify-end pr-2`}
              initial={{ width: 0 }}
              animate={{ width: `${stage.widthPct}%` }}
              transition={{ duration: 0.6, delay: idx * 0.1, ease: 'easeOut' }}
            >
              <span className="text-[10px] font-bold text-white drop-shadow-sm tabular-nums">
                {stage.deal_count}
              </span>
            </motion.div>
          </div>
          <div className="w-16 text-xs font-bold text-muted-foreground text-right tabular-nums">
            {asNumber(stage.total_value) > 0
              ? `₹${(asNumber(stage.total_value) / 100000).toFixed(1)}L`
              : '-'}
          </div>
          {idx > 0 && (
            <div className="flex items-center gap-1 w-16 text-right">
              <TrendingDown size={10} className="text-rose-400" />
              <span className="text-[10px] font-bold text-rose-400 tabular-nums">
                -{stage.dropOff}%
              </span>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
