'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ClipboardList,
  Calendar,
  PhoneCall,
  AlertTriangle,
  CheckCircle2,
  Mail,
  Inbox,
  ArrowUpRight,
} from 'lucide-react';
import { getCrmActivities, type DashboardOverviewData } from '@/utils/api';

interface ActivitySummaryCardProps {
  onTabChange?: (tab: string) => void;
  dashboardData?: DashboardOverviewData | null;
}

export default function ActivitySummaryCard({ onTabChange, dashboardData }: ActivitySummaryCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [crmCounts, setCrmCounts] = useState({ tasks: 0, meetings: 0, calls: 0, emails: 0, overdue: 0, completed: 0 });

  // Fetch counts from CRM activities API
  useEffect(() => {
    let mounted = true;
    const fetchCounts = async () => {
      try {
        const [tasksRes, meetingsRes, callsRes, emailsRes, overdueRes, completedRes] = await Promise.all([
          getCrmActivities({ view: 'task', page_size: 1 }).catch(() => ({ data: [], meta: { total: 0 } })),
          getCrmActivities({ view: 'meeting', page_size: 1 }).catch(() => ({ data: [], meta: { total: 0 } })),
          getCrmActivities({ view: 'call', page_size: 1 }).catch(() => ({ data: [], meta: { total: 0 } })),
          getCrmActivities({ view: 'email', page_size: 1 }).catch(() => ({ data: [], meta: { total: 0 } })),
          getCrmActivities({ view: 'task', quick_tab: 'overdue', page_size: 1 }).catch(() => ({ data: [], meta: { total: 0 } })),
          getCrmActivities({ view: 'task', status: 'completed', page_size: 1 }).catch(() => ({ data: [], meta: { total: 0 } })),
        ]);
        if (mounted) {
          setCrmCounts({
            tasks: tasksRes?.meta?.total ?? 0,
            meetings: meetingsRes?.meta?.total ?? 0,
            calls: callsRes?.meta?.total ?? 0,
            emails: emailsRes?.meta?.total ?? 0,
            overdue: overdueRes?.meta?.total ?? 0,
            completed: completedRes?.meta?.total ?? 0,
          });
        }
      } catch {
        // counts stay at 0
      }
      if (mounted) setLoading(false);
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 60_000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  // Prefer dashboardData (live today counts) for tasks and meetings
  const todayTasks       = dashboardData?.open_tasks?.filter(t => t.status !== 'completed').length ?? 0;
  const upcomingMeetings = dashboardData?.meetings_today?.length ?? 0;
  // Use CRM API counts for things not in dashboardData
  const pendingCalls     = crmCounts.calls;
  const overdueTasks     = dashboardData?.open_tasks?.filter(t => t.status === 'overdue').length ?? crmCounts.overdue;
  const completedItems   = crmCounts.completed;
  const emailsSent       = crmCounts.emails; // approximate

  const totalActive = todayTasks + upcomingMeetings + pendingCalls + overdueTasks + emailsSent;
  const completionPct = totalActive + completedItems > 0
    ? Math.round((completedItems / (totalActive + completedItems)) * 100)
    : 0;

  const leftStats = [
    { label: "Today's Tasks",    count: todayTasks,       icon: ClipboardList, filter: 'today-tasks',      color: 'text-accent-color', bg: 'bg-accent-color/10 border-accent-color/20' },
    { label: 'Upcoming Meetings', count: upcomingMeetings, icon: Calendar,      filter: 'upcoming-meetings', color: 'text-accent-color',   bg: 'bg-accent-color/10 border-accent-color/20' },
    { label: 'Pending Calls',    count: pendingCalls,     icon: PhoneCall,     filter: 'pending-calls',    color: 'text-accent-color',   bg: 'bg-accent-color/10 border-accent-color/20' },
    { label: 'Overdue Tasks',    count: overdueTasks,     icon: AlertTriangle, filter: 'overdue-tasks',    color: 'text-status-danger',     bg: 'bg-status-danger/10 border-status-danger/20' },
  ];

  const rightStats = [
    { label: 'Completed Items',  count: completedItems,   icon: CheckCircle2,  filter: 'completed',        color: 'text-status-success',  bg: 'bg-status-success/10 border-status-success/20' },
    { label: 'Emails Sent',      count: emailsSent,       icon: Mail,          filter: 'emails-sent',      color: 'text-status-warning',    bg: 'bg-status-warning/10 border-status-warning/20' },
  ];

  const allStats = [...leftStats, ...rightStats];
  const maxCount = Math.max(...allStats.map(s => s.count), 1);

  if (loading && !dashboardData) {
    return (
      <div className="bg-surface-1/95 backdrop-blur-md border border-border-default/80 dark:border-border-default/60 rounded-2xl p-5 shadow-sm w-full relative overflow-hidden">
        <div className="flex items-center gap-3 pb-3.5 mb-3.5 border-b border-border-default/60">
          <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/15 animate-pulse" />
          <div className="space-y-1.5">
            <div className="h-4 w-40 rounded bg-surface-2 animate-pulse" />
            <div className="h-2.5 w-28 rounded bg-surface-2/60 animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="h-7 w-7 rounded-lg bg-surface-2" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-2.5 w-full rounded bg-surface-2" />
                  <div className="h-1 w-full rounded-full bg-surface-2/40">
                    <div className="h-1 w-1/3 rounded-full bg-primary/20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="h-7 w-7 rounded-lg bg-surface-2" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-2.5 w-full rounded bg-surface-2" />
                  <div className="h-1 w-full rounded-full bg-surface-2/40">
                    <div className="h-1 w-1/4 rounded-full bg-primary/20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-1/95 backdrop-blur-md border border-border-default/80 dark:border-border-default/60 hover:border-primary/30 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition duration-300 w-full relative overflow-hidden group">
      {/* Background ambient radial aura pulse */}
      <div className="absolute -top-14 -right-14 w-40 h-40 rounded-full bg-primary/5 blur-3xl pointer-events-none group-hover:bg-primary/10 transition duration-500" />

      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-border-default/60 relative">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary border border-primary/15 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
            <ClipboardList size={18} />
          </div>
          <div>
            <h3 className="font-extrabold text-text-primary text-sm tracking-tight select-none">Today&apos;s Work Summary</h3>
            <p className="text-[10px] text-text-muted font-bold mt-0.5 uppercase tracking-wider">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
            </p>
          </div>
        </div>

        {/* Overall completion pill */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider select-none">Completion</p>
            <p className={`text-lg font-black tabular-nums leading-tight ${completionPct >= 60 ? 'text-status-success' : completionPct >= 30 ? 'text-status-warning' : 'text-status-danger'}`}>
              {completionPct}%
            </p>
          </div>
          <button
            onClick={() => onTabChange?.('activities')}
            className="flex items-center gap-1 text-[11px] font-bold text-accent-color hover:text-accent-color/80 border border-accent-color/20 bg-accent-color/5 hover:bg-accent-color/10 rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer select-none"
          >
            <span>View All</span>
            <ArrowUpRight size={11} />
          </button>
        </div>
      </div>

      {/* Stats Grid — two columns side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border/40">

        {/* Left column */}
        <div className="px-[var(--space-4)] py-[var(--space-3)] space-y-[var(--space-2)]">
          <p className="text-[9px] font-extrabold text-text-muted/60 uppercase tracking-widest mb-[var(--space-2)] select-none">Tasks &amp; Meetings</p>
          {leftStats.map((item) => {
            const Icon = item.icon;
            const barWidth = Math.max((item.count / maxCount) * 100, item.count > 0 ? 6 : 0);
            return (
              <button
                key={item.filter}
                onClick={() => {
                  if (item.filter === 'today-tasks') {
                    router.push('?tab=today-tasks&type=task');
                    onTabChange?.('activities');
                  } else if (item.filter === 'overdue-tasks') {
                    router.push('?tab=overdue-tasks&type=task');
                    onTabChange?.('activities');
                  } else if (item.filter === 'pending-calls') {
                    router.push('?tab=pending-calls&type=call');
                    onTabChange?.('activities');
                  } else if (item.filter === 'upcoming-meetings') {
                    onTabChange?.('calendar');
                  } else {
                    onTabChange?.('activities');
                  }
                }}
                className="w-full flex items-center gap-3 group cursor-pointer hover:bg-surface-2/25 rounded-xl px-2 py-1.5 -mx-2 transition-colors duration-150"
              >
                {/* Icon */}
                <div className={`h-7 w-7 rounded-lg flex items-center justify-center border shrink-0 ${item.bg} ${item.color}`}>
                  <Icon size={12} strokeWidth={2.25} />
                </div>
                {/* Label + bar */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-text-muted group-hover:text-text-primary transition-colors truncate select-none">{item.label}</span>
                    <span className={`text-xs font-black tabular-nums shrink-0 ml-2 ${item.color}`}>{item.count}</span>
                  </div>
                  {/* Mini progress bar */}
                  <div className="h-1 rounded-full bg-border/40 w-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-[width] duration-500 ${
                        item.color === 'text-accent-color' ? 'bg-accent-color' :
                        item.color === 'text-status-danger'     ? 'bg-status-danger' :
                        'bg-border'
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right column */}
        <div className="px-[var(--space-4)] py-[var(--space-3)] space-y-[var(--space-2)]">
          <p className="text-[9px] font-extrabold text-text-muted/60 uppercase tracking-widest mb-[var(--space-2)] select-none">Emails &amp; Completed</p>
          {rightStats.map((item) => {
            const Icon = item.icon;
            const barWidth = Math.max((item.count / maxCount) * 100, item.count > 0 ? 6 : 0);
            return (
              <button
                key={item.filter}
                onClick={() => {
                  if (item.filter === 'emails-sent') {
                    onTabChange?.('emails');
                  } else if (item.filter === 'completed') {
                    router.push('?tab=completed');
                    onTabChange?.('activities');
                  } else {
                    onTabChange?.('activities');
                  }
                }}
                className="w-full flex items-center gap-3 group cursor-pointer hover:bg-surface-2/25 rounded-xl px-2 py-1.5 -mx-2 transition-colors duration-150"
              >
                <div className={`h-7 w-7 rounded-lg flex items-center justify-center border shrink-0 ${item.bg} ${item.color}`}>
                  <Icon size={12} strokeWidth={2.25} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-text-muted group-hover:text-text-primary transition-colors truncate select-none">{item.label}</span>
                    <span className={`text-xs font-black tabular-nums shrink-0 ml-2 ${item.color}`}>{item.count}</span>
                  </div>
                  <div className="h-1 rounded-full bg-border/40 w-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-[width] duration-500 ${
                        item.color === 'text-status-success' ? 'bg-status-success' :
                        item.color === 'text-status-warning'   ? 'bg-status-warning' :
                        'bg-border'
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}

          {/* Completion ring summary */}
          <div className="mt-[var(--space-3)] pt-[var(--space-2)] border-t border-border-default/40 flex items-center justify-between">
            <span className="text-[10px] font-bold text-text-muted select-none">Total completed today</span>
            <span className="text-sm font-black text-status-success tabular-nums">{completedItems} / {totalActive + completedItems}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
