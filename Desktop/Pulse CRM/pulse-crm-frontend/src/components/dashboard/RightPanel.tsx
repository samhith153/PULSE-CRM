'use client';

import React from 'react';
import { 
  Plus, 
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
      desc: "Value: ₹2.12M",
      icon: FolderOpen,
      color: "text-brand-accent",
      bg: "bg-brand-accent/10 border border-brand-accent/20"
    },
    {
      title: "Total pipeline value",
      count: "₹5.67M",
      desc: "vs last month",
      change: "+22%",
      isPositive: true,
      icon: IndianRupee,
      color: "text-brand-accent",
      bg: "bg-brand-accent/10 border border-brand-accent/20"
    },
    {
      title: "Deals created",
      count: 45,
      desc: "vs last month",
      change: "+15%",
      isPositive: true,
      icon: PlusCircle,
      color: "text-brand-accent",
      bg: "bg-brand-accent/10 border border-brand-accent/20"
    },
    {
      title: "Deals lost",
      count: 4,
      desc: "vs last month",
      change: "-20%",
      isPositive: false,
      icon: MinusCircle,
      color: "text-brand-accent",
      bg: "bg-brand-accent/10 border border-brand-accent/20"
    },
    {
      title: "Activities logged",
      count: 521,
      desc: "vs last month",
      change: "+17%",
      isPositive: true,
      icon: Activity,
      color: "text-brand-accent",
      bg: "bg-brand-accent/10 border border-brand-accent/20"
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="bg-white border border-brand-border-purple/15 rounded-xl p-5 h-36" />
        <div className="bg-white border border-brand-border-purple/15 rounded-xl p-5 h-64" />
        <div className="bg-white border border-brand-border-purple/15 rounded-xl p-5 h-56" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Report Builder Card - Styled using main accent and soft shadows */}
      <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 hover:-translate-y-0.5 hover:shadow-md hover:border-brand-border-purple/40 transition-all duration-300">
        <h3 className="font-bold text-brand-heading text-sm">Report builder</h3>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          Create custom reports with your own metrics and filters.
        </p>
        <button
          onClick={onNewReportClick}
          className="w-full mt-4 flex items-center justify-center space-x-1.5 bg-brand-accent hover:bg-brand-accent-hover text-white py-2 px-4 rounded-lg text-xs font-bold shadow-sm/10 transition-all duration-200 cursor-pointer"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          <span>Create Custom Report</span>
        </button>
      </div>

      {/* Key Metrics Summary - Polished layout with tabular values */}
      <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 hover:-translate-y-0.5 hover:shadow-md hover:border-brand-border-purple/40 transition-all duration-300">
        <h3 className="font-bold text-brand-heading text-sm mb-4">Key metrics summary</h3>
        
        <div className="space-y-3.5">
          {metrics.map((metric, idx) => {
            const Icon = metric.icon;
            return (
              <div key={idx} className="flex items-start justify-between">
                <div className="flex space-x-2.5">
                  <div className={`h-7.5 w-7.5 rounded-lg ${metric.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                    <Icon className={`h-4 w-4 ${metric.color}`} strokeWidth={1.75} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-brand-text/75">{metric.title}</h4>
                    <p className="text-[10px] text-brand-text/60 mt-0.5 font-medium">{metric.desc}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-xs font-extrabold text-brand-text leading-tight tabular-nums">{metric.count}</p>
                  {metric.change && (
                    <span className={`inline-flex items-center text-[9px] font-bold mt-0.5 tabular-nums ${
                      metric.isPositive ? 'text-emerald-600' : 'text-rose-600'
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

      {/* Recent Reports - Polished and unified styling */}
      <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 hover:-translate-y-0.5 hover:shadow-md hover:border-brand-border-purple/40 transition-all duration-300">
        <h3 className="font-bold text-brand-heading text-sm mb-4">Recent reports</h3>
        
        <div className="space-y-2">
          {recentReports.map((report) => (
            <div 
              key={report.id} 
              className="flex items-start space-x-2.5 p-2 hover:bg-slate-50 rounded-lg transition-all duration-200 border border-transparent hover:border-brand-border-purple/15"
            >
              <div className="h-7.5 w-7.5 rounded-lg bg-brand-sidebar-hover/15 flex items-center justify-center shrink-0 text-brand-accent border border-brand-border-purple/20">
                <FileSpreadsheet className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <div className="overflow-hidden">
                <h4 className="text-xs font-bold text-brand-text truncate leading-tight">{report.title}</h4>
                <p className="text-[10px] text-brand-text/60 mt-1">{report.time}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-brand-border-purple/15 text-center">
          <a 
            href="#" 
            className="inline-flex items-center space-x-1 text-xs font-bold text-brand-accent hover:text-brand-accent-hover transition-colors"
          >
            <span>View all reports</span>
            <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
          </a>
        </div>
      </div>

    </div>
  );
}
