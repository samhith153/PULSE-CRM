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
  ArrowRight
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

  // Compute counts
  const todayStr = new Date().toISOString().slice(0, 10);

  // 1. Today's Tasks (type === 'task' and status === 'Pending' and due date is today)
  const todayTasks = activities.filter(a => 
    a.type === 'task' && 
    a.status === 'Pending' && 
    a.dueDate?.slice(0, 10) === todayStr
  ).length;

  // 2. Upcoming Meetings (type === 'meeting' and status === 'Scheduled' and date is >= today)
  const upcomingMeetings = activities.filter(a => 
    a.type === 'meeting' && 
    a.status === 'Scheduled' && 
    a.dueDate?.slice(0, 10) >= todayStr
  ).length;

  // 3. Pending Calls (type === 'call' and status === 'Pending')
  const pendingCalls = activities.filter(a => 
    a.type === 'call' && 
    a.status === 'Pending'
  ).length;

  // 4. Overdue Tasks (type === 'task' and status === 'Overdue')
  const overdueTasks = activities.filter(a => 
    a.type === 'task' && 
    a.status === 'Overdue'
  ).length;

  // 5. Completed Activities (status === 'Completed')
  const completedActivities = activities.filter(a => 
    a.status === 'Completed'
  ).length;

  // 6. Emails Sent (type === 'email' and details.from is from sarah.johnson)
  const emailsSent = activities.filter(a => 
    a.type === 'email' && 
    a.details.from?.includes('sarah.johnson')
  ).length;

  // 7. Emails Received (type === 'email' and details.to is to sarah.johnson)
  const emailsReceived = activities.filter(a => 
    a.type === 'email' && 
    a.details.to?.includes('sarah.johnson')
  ).length;

  const handleStatClick = (tabFilter: string) => {
    // Navigate using Next.js router
    router.push(`/activities?tab=${tabFilter}`);
  };

  const statItems = [
    { label: "Today's Tasks", count: todayTasks, icon: ClipboardList, filter: "today-tasks", color: "text-brand-purple bg-brand-purple/10 border-brand-purple/20" },
    { label: "Upcoming Meetings", count: upcomingMeetings, icon: Calendar, filter: "upcoming-meetings", color: "text-brand-blue bg-brand-blue/10 border-brand-blue/20" },
    { label: "Pending Calls", count: pendingCalls, icon: PhoneCall, filter: "pending-calls", color: "text-brand-cyan bg-brand-cyan/10 border-brand-cyan/20" },
    { label: "Overdue Tasks", count: overdueTasks, icon: AlertTriangle, filter: "overdue-tasks", color: "text-rose-500 bg-rose-500/10 border-rose-500/20" },
    { label: "Completed Items", count: completedActivities, icon: CheckCircle2, filter: "completed", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
    { label: "Emails Sent", count: emailsSent, icon: Mail, filter: "emails-sent", color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
    { label: "Emails Received", count: emailsReceived, icon: Inbox, filter: "emails-received", color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20" },
  ];

  return (
    <div className="bg-card border border-border rounded-2xl p-[var(--space-4)] shadow-card flex flex-col justify-between">
      <div className="flex items-center justify-between border-b border-border pb-[var(--space-2)] mb-[var(--space-3)]">
        <div>
          <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5 select-none">
            <ClipboardList className="h-4.5 w-4.5 text-brand-purple" />
            <span>Today's Work Summary</span>
          </h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">Quick counts of outstanding calendar obligations, follow-ups, and inbox status.</p>
        </div>
        <button
          onClick={() => router.push('/activities')}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-purple hover:underline cursor-pointer"
        >
          <span>View Activities</span>
          <ArrowRight size={12} />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-[var(--space-2)]">
        {statItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={index}
              onClick={() => handleStatClick(item.filter)}
              className="flex flex-col justify-between items-start p-3 bg-secondary/15 hover:bg-secondary/40 border border-border/80 hover:border-brand-purple/20 rounded-xl transition-all duration-200 text-left h-24 group cursor-pointer"
            >
              <div className="flex justify-between items-center w-full">
                <div className={`h-7 w-7 rounded-lg flex items-center justify-center border ${item.color}`}>
                  <Icon size={13} strokeWidth={2.25} />
                </div>
              </div>
              <div>
                <h4 className="text-[9px] font-extrabold text-muted-foreground/80 uppercase tracking-wide group-hover:text-foreground transition-colors leading-tight">
                  {item.label}
                </h4>
                <p className="text-xl font-black text-foreground tracking-tight tabular-nums mt-1 leading-none">
                  {item.count}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
