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
  TrendingDown
} from 'lucide-react';

interface RightPanelProps {
  onNewReportClick: () => void;
  recentReports: Array<{ id: number; title: string; time: string }>;
  loading?: boolean;
}

export default function RightPanel({ onNewReportClick, recentReports, loading = false }: RightPanelProps) {

  const metrics = [
    {
      title: "Open deals",
      count: 68,
      desc: "Value: â‚¹2.12M",
      icon: FolderOpen,
      color: "text-brand-purple",
      bg: "bg-brand-purple/10 border border-brand-purple/20"
    },
    {
      title: "Total pipeline value",
      count: "â‚¹5.67M",
      desc: "vs last month",
      change: "+22%",
      isPositive: true,
      icon: IndianRupee,
      color: "text-brand-purple",
      bg: "bg-brand-purple/10 border border-brand-purple/20"
    },
    {
      title: "Deals created",
      count: 45,
      desc: "vs last month",
      change: "+15%",
      isPositive: true,
      icon: PlusCircle,
      color: "text-brand-purple",
      bg: "bg-brand-purple/10 border border-brand-purple/20"
    },
    {
      title: "Deals lost",
      count: 4,
      desc: "vs last month",
      change: "-20%",
      isPositive: false,
      icon: MinusCircle,
      color: "text-brand-purple",
      bg: "bg-brand-purple/10 border border-brand-purple/20"
    },
    {
      title: "Activities logged",
      count: 521,
      desc: "vs last month",
      change: "+17%",
      isPositive: true,
      icon: Activity,
      color: "text-brand-purple",
      bg: "bg-brand-purple/10 border border-brand-purple/20"
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
        <div className="bg-card border border-border rounded-2xl p-5 h-72" />
        <div className="bg-card border border-border rounded-2xl p-5 h-72" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

      {/* Key Metrics Summary */}
      <div className="bg-card border border-border rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-nav transition-all duration-300">
        <h3 className="font-bold text-foreground text-sm mb-4">Key metrics summary</h3>
        
        <div className="space-y-2">
          {metrics.map((metric, idx) => {
            const Icon = metric.icon;
            return (
              <div 
                key={idx} 
                className="flex items-center gap-3 rounded-xl bg-secondary px-3 py-2.5 transition-all duration-200 border border-transparent hover:border-border"
              >
                {/* Icon (text-brand-purple, 14px/16px) */}
                <div className="size-8 rounded-lg bg-background text-brand-purple flex items-center justify-center border border-border shrink-0">
                  <Icon className="h-4 w-4" strokeWidth={2} />
                </div>
                
                {/* Flex-1 Label */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-foreground truncate">{metric.title}</h4>
                  <p className="text-[10px] text-muted-foreground truncate leading-none mt-0.5">{metric.desc}</p>
                </div>
                
                {/* Right-aligned Value */}
                <div className="text-right shrink-0">
                  <span className="text-xs font-semibold text-foreground tabular-nums block">{metric.count}</span>
                  {metric.change && (
                    <span className={`inline-flex items-center text-[9px] font-bold tabular-nums ${
                      metric.isPositive ? 'text-brand-cyan' : 'text-destructive'
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
      <div className="bg-card border border-border rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-nav transition-all duration-300">
        <h3 className="font-bold text-foreground text-sm mb-4">Recent reports</h3>
        
        <div className="space-y-2">
          {recentReports.map((report) => (
            <div 
              key={report.id} 
              className="flex items-center gap-3 rounded-xl bg-secondary px-3 py-2.5 transition-all duration-200 border border-transparent hover:border-border"
            >
              <div className="size-8 rounded-lg bg-background text-brand-purple flex items-center justify-center border border-border shrink-0">
                <FileSpreadsheet className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-foreground truncate leading-none">{report.title}</h4>
                <p className="text-[10px] text-muted-foreground mt-1 truncate leading-none">{report.time}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-border text-center">
          <a 
            href="#" 
            className="inline-flex items-center justify-center gap-2 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer border border-border bg-background hover:bg-secondary text-ink px-4 py-2 h-9"
          >
            <span>View all reports</span>
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
          </a>
        </div>
      </div>

    </div>
  );
}

