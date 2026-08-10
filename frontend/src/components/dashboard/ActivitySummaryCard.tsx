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
import { getActivitiesFromStorage, Activity } from '@/utils/activityDb';

interface ActivitySummaryCardProps {
  onTabChange?: (tab: string) => void;
}

export default function ActivitySummaryCard({ onTabChange }: ActivitySummaryCardProps) {
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    setActivities(getActivitiesFromStorage());
  }, []);

  const todayStr = new Date().toISOString().slice(0, 10);

  const todayTasks       = activities.filter(a => a.type === 'task'    && a.status === 'Pending'   && a.dueDate?.slice(0, 10) === todayStr).length;
  const upcomingMeetings = activities.filter(a => a.type === 'meeting' && a.status === 'Scheduled' && a.dueDate?.slice(0, 10) >= todayStr).length;
  const pendingCalls     = activities.filter(a => a.type === 'call'    && a.status === 'Pending').length;
  const overdueTasks     = activities.filter(a => a.type === 'task'    && a.status === 'Overdue').length;
  const completedItems   = activities.filter(a => a.status === 'Completed').length;
  const emailsSent       = activities.filter(a => a.type === 'email'   && a.details.from?.includes('sarah.johnson')).length;
  const emailsReceived   = activities.filter(a => a.type === 'email'   && a.details.to?.includes('sarah.johnson')).length;

  const totalActive = todayTasks + upcomingMeetings + pendingCalls + overdueTasks + emailsSent + emailsReceived;
  const completionPct = totalActive + completedItems > 0
    ? Math.round((completedItems / (totalActive + completedItems)) * 100)
    : 0;

  const leftStats = [
    { label: "Today's Tasks",    count: todayTasks,       icon: ClipboardList, filter: 'today-tasks',      color: 'text-brand-purple', bg: 'bg-brand-purple/10 border-brand-purple/20' },
    { label: 'Upcoming Meetings', count: upcomingMeetings, icon: Calendar,      filter: 'upcoming-meetings', color: 'text-brand-blue',   bg: 'bg-brand-blue/10 border-brand-blue/20' },
    { label: 'Pending Calls',    count: pendingCalls,     icon: PhoneCall,     filter: 'pending-calls',    color: 'text-brand-cyan',   bg: 'bg-brand-cyan/10 border-brand-cyan/20' },
    { label: 'Overdue Tasks',    count: overdueTasks,     icon: AlertTriangle, filter: 'overdue-tasks',    color: 'text-rose-500',     bg: 'bg-rose-500/10 border-rose-500/20' },
  ];

  const rightStats = [
    { label: 'Completed Items',  count: completedItems,   icon: CheckCircle2,  filter: 'completed',        color: 'text-emerald-500',  bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Emails Sent',      count: emailsSent,       icon: Mail,          filter: 'emails-sent',      color: 'text-amber-500',    bg: 'bg-amber-500/10 border-amber-500/20' },
    { label: 'Emails Received',  count: emailsReceived,   icon: Inbox,         filter: 'emails-received',  color: 'text-indigo-500',   bg: 'bg-indigo-500/10 border-indigo-500/20' },
  ];

  const allStats = [...leftStats, ...rightStats];
  const maxCount = Math.max(...allStats.map(s => s.count), 1);

  return (
    <div className="bg-card/95 backdrop-blur-md border border-border/80 dark:border-border/60 hover:border-primary/30 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition duration-300 w-full relative overflow-hidden group">
      {/* Background ambient radial aura pulse */}
      <div className="absolute -top-14 -right-14 w-40 h-40 rounded-full bg-primary/5 blur-3xl pointer-events-none group-hover:bg-primary/10 transition duration-500" />

      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-border/60 relative">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary border border-primary/15 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
            <ClipboardList size={18} />
          </div>
          <div>
            <h3 className="font-extrabold text-foreground text-sm tracking-tight select-none">Today&apos;s Work Summary</h3>
            <p className="text-[10px] text-muted-foreground font-bold mt-0.5 uppercase tracking-wider">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
            </p>
          </div>
        </div>

        {/* Overall completion pill */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider select-none">Completion</p>
            <p className={`text-lg font-black tabular-nums leading-tight ${completionPct >= 60 ? 'text-emerald-500' : completionPct >= 30 ? 'text-amber-500' : 'text-rose-500'}`}>
              {completionPct}%
            </p>
          </div>
          <button
            onClick={() => onTabChange?.('activities')}
            className="flex items-center gap-1 text-[11px] font-bold text-brand-purple hover:text-brand-purple/80 border border-brand-purple/20 bg-brand-purple/5 hover:bg-brand-purple/10 rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer select-none"
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
          <p className="text-[9px] font-extrabold text-muted-foreground/60 uppercase tracking-widest mb-[var(--space-2)] select-none">Tasks &amp; Meetings</p>
          {leftStats.map((item) => {
            const Icon = item.icon;
            const barWidth = Math.max((item.count / maxCount) * 100, item.count > 0 ? 6 : 0);
            return (
              <button
                key={item.filter}
                onClick={() => {
                  if (item.filter === 'today-tasks') {
                    onTabChange?.('tasks');
                  } else if (item.filter === 'overdue-tasks') {
                    onTabChange?.('tasks');
                  } else if (item.filter === 'pending-calls') {
                    router.push('?tab=pending-calls&type=call');
                    onTabChange?.('activities');
                  } else if (item.filter === 'upcoming-meetings') {
                    onTabChange?.('calendar');
                  } else {
                    onTabChange?.('activities');
                  }
                }}
                className="w-full flex items-center gap-3 group cursor-pointer hover:bg-secondary/25 rounded-xl px-2 py-1.5 -mx-2 transition-colors duration-150"
              >
                {/* Icon */}
                <div className={`h-7 w-7 rounded-lg flex items-center justify-center border shrink-0 ${item.bg} ${item.color}`}>
                  <Icon size={12} strokeWidth={2.25} />
                </div>
                {/* Label + bar */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-muted-foreground group-hover:text-foreground transition-colors truncate select-none">{item.label}</span>
                    <span className={`text-xs font-black tabular-nums shrink-0 ml-2 ${item.color}`}>{item.count}</span>
                  </div>
                  {/* Mini progress bar */}
                  <div className="h-1 rounded-full bg-border/40 w-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-[width] duration-500 ${
                        item.color === 'text-brand-purple' ? 'bg-brand-purple' :
                        item.color === 'text-brand-blue'   ? 'bg-brand-blue' :
                        item.color === 'text-brand-cyan'   ? 'bg-brand-cyan' :
                        item.color === 'text-rose-500'     ? 'bg-rose-500' :
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
          <p className="text-[9px] font-extrabold text-muted-foreground/60 uppercase tracking-widest mb-[var(--space-2)] select-none">Emails &amp; Completed</p>
          {rightStats.map((item) => {
            const Icon = item.icon;
            const barWidth = Math.max((item.count / maxCount) * 100, item.count > 0 ? 6 : 0);
            return (
              <button
                key={item.filter}
                onClick={() => {
                  if (item.filter === 'emails-sent' || item.filter === 'emails-received') {
                    onTabChange?.('emails');
                  } else if (item.filter === 'completed') {
                    router.push('?tab=completed');
                    onTabChange?.('activities');
                  } else {
                    onTabChange?.('activities');
                  }
                }}
                className="w-full flex items-center gap-3 group cursor-pointer hover:bg-secondary/25 rounded-xl px-2 py-1.5 -mx-2 transition-colors duration-150"
              >
                <div className={`h-7 w-7 rounded-lg flex items-center justify-center border shrink-0 ${item.bg} ${item.color}`}>
                  <Icon size={12} strokeWidth={2.25} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-muted-foreground group-hover:text-foreground transition-colors truncate select-none">{item.label}</span>
                    <span className={`text-xs font-black tabular-nums shrink-0 ml-2 ${item.color}`}>{item.count}</span>
                  </div>
                  <div className="h-1 rounded-full bg-border/40 w-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-[width] duration-500 ${
                        item.color === 'text-emerald-500' ? 'bg-emerald-500' :
                        item.color === 'text-amber-500'   ? 'bg-amber-500' :
                        item.color === 'text-indigo-500'  ? 'bg-indigo-500' :
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
          <div className="mt-[var(--space-3)] pt-[var(--space-2)] border-t border-border/40 flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground select-none">Total completed today</span>
            <span className="text-sm font-black text-emerald-500 tabular-nums">{completedItems} / {totalActive + completedItems}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
