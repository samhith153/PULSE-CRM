'use client';

import React from 'react';
import { 
  FolderOpen, 
  IndianRupee, 
  PlusCircle, 
  MinusCircle, 
  Activity, 
  FileSpreadsheet,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface RightPanelProps {
  onNewReportClick: () => void;
  recentReports: Array<{ id: number; title: string; time: string }>;
  loading?: boolean;
}

const getReportStyles = (title: string, index: number) => {
  const t = title.toLowerCase();
  let Icon = FileSpreadsheet;
  let bgClass = 'bg-accent-color/10 text-accent-color border border-accent-color/15';

  if (t.includes('funnel') || t.includes('conversion')) {
    Icon = BarChart3;
    bgClass = 'bg-accent-color/10 text-accent-color border border-accent-color/15';
  } else if (t.includes('projection') || t.includes('forecast') || t.includes('revenue')) {
    Icon = TrendingUp;
    bgClass = 'bg-status-success-text/10 text-status-success-text border border-status-success-text/15';
  } else if (t.includes('segment') || t.includes('share') || t.includes('source') || t.includes('size')) {
    Icon = PieChart;
    bgClass = 'bg-accent-color/10 text-accent-color border border-accent-color/15';
  }

  return { Icon, bgClass };
};

export default function RightPanel({ onNewReportClick, recentReports, loading = false }: RightPanelProps) {

  const metrics = [
    {
      title: "Open deals",
      count: 68,
      desc: "Value: ₹2.12M",
      icon: FolderOpen,
      color: "text-accent-color",
      bg: "bg-accent-color/10 border border-accent-color/20"
    },
    {
      title: "Total pipeline value",
      count: "₹5.67M",
      desc: "vs last month",
      change: "+22%",
      isPositive: true,
      icon: IndianRupee,
      color: "text-accent-color",
      bg: "bg-accent-color/10 border border-accent-color/20"
    },
    {
      title: "Deals created",
      count: 45,
      desc: "vs last month",
      change: "+15%",
      isPositive: true,
      icon: PlusCircle,
      color: "text-accent-color",
      bg: "bg-accent-color/10 border border-accent-color/20"
    },
    {
      title: "Deals lost",
      count: 4,
      desc: "vs last month",
      change: "-20%",
      isPositive: false,
      icon: MinusCircle,
      color: "text-accent-color",
      bg: "bg-accent-color/10 border border-accent-color/20"
    },
    {
      title: "Activities logged",
      count: 521,
      desc: "vs last month",
      change: "+17%",
      isPositive: true,
      icon: Activity,
      color: "text-accent-color",
      bg: "bg-accent-color/10 border border-accent-color/20"
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6 animate-pulse">
        <div className="bg-surface-1 border border-border-default rounded-2xl p-5 h-[280px]" />
        <div className="bg-surface-1 border border-border-default rounded-2xl p-5 h-[280px]" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">

      {/* Key Metrics Summary */}
      <div className="bg-surface-1 border border-border-default rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-nav transition duration-300">
        <h3 className="font-bold text-text-primary text-sm mb-4">Key metrics summary</h3>
        
        <div className="space-y-2">
          {metrics.map((metric, idx) => {
            const Icon = metric.icon;
            return (
              <div 
                key={idx} 
                className="flex items-center gap-3 rounded-xl bg-surface-2 px-3 py-2.5 transition duration-200 border border-transparent hover:border-border-default"
              >
                {/* Icon (text-accent-color, 14px/16px) */}
                <div className="size-8 rounded-lg bg-surface-0 text-accent-color flex items-center justify-center border border-border-default shrink-0">
                  <Icon className="h-4 w-4" strokeWidth={2} />
                </div>
                
                {/* Flex-1 Label */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-text-primary truncate">{metric.title}</h4>
                  <p className="text-[10px] text-text-muted truncate leading-none mt-0.5">{metric.desc}</p>
                </div>
                
                {/* Right-aligned Value */}
                <div className="text-right shrink-0">
                  <span className="text-xs font-semibold text-text-primary tabular-nums block">{metric.count}</span>
                  {metric.change && (
                    <span className={`inline-flex items-center text-[9px] font-bold tabular-nums ${
                      metric.isPositive ? 'text-accent-color' : 'text-destructive'
                    }`}>
                      {metric.isPositive ? <TrendingUp className="h-2.5 w-2.5 mr-0.5" strokeWidth={2} /> : <TrendingDown className="h-2.5 w-2.5 mr-0.5" strokeWidth={2} />}
                      {metric.change}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-surface-1 border border-border-default rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-nav transition duration-300">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-text-primary text-sm">Recent reports</h3>
          {/* Avatar Stack implied collaboration detail */}
          <div className="flex items-center -space-x-1.5 overflow-hidden select-none" title="3 teammates active on these templates">
            <div className="inline-block h-4.5 w-4.5 rounded-full ring-2 ring-card overflow-hidden bg-accent-color/10 flex items-center justify-center">
              <span className="text-[8px] font-bold text-accent-color">S</span>
            </div>
            <div className="inline-block h-4.5 w-4.5 rounded-full ring-2 ring-card overflow-hidden bg-accent-color/10 flex items-center justify-center">
              <span className="text-[8px] font-bold text-accent-color">A</span>
            </div>
            <div className="inline-block h-4.5 w-4.5 rounded-full ring-2 ring-card overflow-hidden bg-status-success-text/10 flex items-center justify-center">
              <span className="text-[8px] font-bold text-status-success-text">K</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          {recentReports.map((report, idx) => {
            const { Icon, bgClass } = getReportStyles(report.title, idx);
            const isFirst = idx === 0;
            return (
              <motion.div 
                key={report.id} 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: idx * 0.06 }}
                className={cn(
                  "flex items-center gap-3 rounded-xl bg-surface-2 px-3 py-2.5 transition duration-200 border cursor-pointer hover:-translate-y-0.5 hover:shadow-nav hover:bg-surface-2/70",
                  isFirst ? "border-accent-color/30 bg-accent-color/5 shadow-[inset_3px_0_0_0_var(--accent-color)] pl-4" : "border-transparent hover:border-border-default"
                )}
              >
                <div className={cn("size-8 rounded-lg flex items-center justify-center shrink-0", bgClass)}>
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-text-primary truncate leading-none">{report.title}</h4>
                    {isFirst && (
                      <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-accent-color text-surface-0 uppercase tracking-wide leading-none select-none">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-text-muted mt-1 truncate leading-none">{report.time}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-border-default text-center">
          <a 
            href="#" 
            className="inline-flex items-center justify-center gap-2 rounded-full text-xs font-bold transition duration-200 cursor-pointer border border-border-default bg-surface-0 hover:bg-surface-2 text-ink px-4 py-2 h-9"
          >
            <span>View all reports</span>
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
          </a>
        </div>
      </div>

    </div>
  );
}
