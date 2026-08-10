'use client';

import React from 'react';
import { 
  X,
  Settings2,
  Layout,
  BarChartHorizontal,
  Eye, 
  EyeOff, 
  TrendingUp, 
  BarChart3, 
  Users, 
  Activity, 
  Calendar, 
  FileText 
} from 'lucide-react';

interface LayoutSettings {
  statCards: boolean;
  charts: boolean;
  leaderboard: boolean;
  productivity: boolean;
  heatmap: boolean;
  rightPanel: boolean;
  quotaPace: boolean;
  funnelChart: boolean;
}

interface DashboardCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  settings: LayoutSettings;
  onToggleSetting: (key: keyof LayoutSettings) => void;
}

export default function DashboardCustomizer({ isOpen, onClose, settings, onToggleSetting }: DashboardCustomizerProps) {
  if (!isOpen) return null;

  const widgets = [
    {
      key: 'statCards' as keyof LayoutSettings,
      name: 'KPI Performance Cards',
      desc: 'Top summary cards for deals won, pipeline value, conversions, and meetings.',
      icon: TrendingUp,
    },
    {
      key: 'charts' as keyof LayoutSettings,
      name: 'Charts & Stage Funnels',
      desc: 'Monthly revenue graph, stage funnel distribution, and customer acquisition channels.',
      icon: BarChart3,
    },
    {
      key: 'heatmap' as keyof LayoutSettings,
      name: 'Sales Activity Heatmap',
      desc: 'Visual contribution calendar plotting actions completed (emails, calls, meetings).',
      icon: Calendar,
    },
    {
      key: 'leaderboard' as keyof LayoutSettings,
      name: 'Team Performance Leaderboard',
      desc: 'Ranks sales managers and representatives by active pipeline deals and revenue.',
      icon: Users,
    },
    {
      key: 'productivity' as keyof LayoutSettings,
      name: 'Productivity Metrics',
      desc: 'Counts for emails sent, phone calls made, and tasks completed vs last month.',
      icon: Activity,
    },
    {
      key: 'rightPanel' as keyof LayoutSettings,
      name: 'Quick Reports & Key Insights',
      desc: 'Interactive report builder portal, conversion velocities, and AI priorities feed.',
      icon: FileText,
    },
    {
      key: 'quotaPace' as keyof LayoutSettings,
      name: 'Quota Pace',
      desc: 'Progress bar showing current quota achievement for the month.',
      icon: BarChartHorizontal,
    },
    {
      key: 'funnelChart' as keyof LayoutSettings,
      name: 'Funnel Chart',
      desc: 'Visual representation of pipeline stages with conversion percentages.',
      icon: Layout,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-ink/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        {/* Drawer Panel */}
        <div className="w-screen max-w-md bg-brand-bg border-l border-border text-muted-foreground flex flex-col  animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="p-5 border-b border-border flex items-center justify-between bg-secondary/50 dark:bg-ink/50">
            <div className="flex items-center space-x-2.5">
              <div className="h-9 w-9 rounded-xl bg-brand-purple/15 flex items-center justify-center border border-brand-accent/25">
                <Settings2 className="h-4.5 w-4.5 text-brand-purple" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-foreground">Customize Dashboard</h3>
                <p className="text-[10px] text-muted-foreground font-bold mt-0.5 uppercase tracking-wider">Configure Workspace Layout</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-secondary dark:hover:bg-text-primary text-muted-foreground hover:text-muted-foreground transition-colors"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Settings Items */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
              Tailor your analytics dashboard by toggling components on and off. Pulse CRM will save your preferences instantly.
            </p>

            <div className="space-y-3">
              {widgets.map((widget) => {
                const Icon = widget.icon;
                const isChecked = settings[widget.key];
                return (
                  <div 
                    key={widget.key}
                    onClick={() => onToggleSetting(widget.key)}
                    className={`p-4 border rounded-xl flex items-start justify-between gap-4 cursor-pointer transition duration-200 select-none ${
                      isChecked 
                        ? 'border-brand-accent/35 bg-brand-purple/[0.03] dark:bg-brand-purple/[0.01]' 
                        : 'border-border hover:border-border bg-secondary/20'
                    }`}
                  >
                    <div className="flex items-start space-x-3.5 min-w-0">
                      <div className={`mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border ${
                        isChecked 
                          ? 'bg-brand-purple/10 border-brand-accent/20 text-brand-purple' 
                          : 'bg-secondary dark:bg-text-primary border-border text-muted-foreground'
                      }`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-foreground">{widget.name}</h4>
                        <p className="text-[10px] text-muted-foreground mt-1 font-medium leading-normal">{widget.desc}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 transition-colors border ${
                        isChecked 
                          ? 'bg-brand-purple text-primary-foreground border-transparent' 
                          : 'bg-secondary hover:bg-secondary dark:bg-text-primary border-border text-muted-foreground hover:text-muted-foreground'
                      }`}
                      aria-label={isChecked ? "Hide widget" : "Show widget"}
                    >
                      {isChecked ? <Eye className="h-4.5 w-4.5" /> : <EyeOff className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer controls */}
          <div className="p-4 border-t border-border bg-secondary/50 dark:bg-ink/50 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-brand-purple hover:bg-brand-purple/90 text-primary-foreground rounded-lg text-xs font-bold transition  hover: cursor-pointer"
            >
              Save layout preferences
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
