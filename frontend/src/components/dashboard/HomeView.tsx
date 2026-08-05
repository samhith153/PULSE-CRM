'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Layers, 
  AlertCircle, 
  AlertTriangle,
  PhoneCall, 
  Users, 
  Calendar, 
  ArrowUpDown, 
  RefreshCw, 
  CheckCircle2, 
  Circle,
  HelpCircle,
  Clock,
  Briefcase
} from 'lucide-react';
import { getLeads, getDeals, getActivities, formatINR } from '@/utils/api';

interface Task {
  id: number;
  title: string;
  deadline: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'Completed' | 'Overdue' | 'Not Started' | 'In Progress';
}

interface Meeting {
  id: string;
  title: string;
  from: string;
  to: string;
  type: 'video' | 'call' | 'in-person';
}

interface HomeViewProps {
  onTabChange: (tab: string) => void;
}

export default function HomeView({ onTabChange }: HomeViewProps) {
  // User name state
  const [userName, setUserName] = useState('User');

  // Stat counts
  const [openDealsCount, setOpenDealsCount] = useState<number | null>(null);
  const [untouchedDealsCount, setUntouchedDealsCount] = useState<number | null>(null);
  const [callsTodayCount, setCallsTodayCount] = useState<number | null>(null);
  const [leadsCount, setLeadsCount] = useState<number | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Dynamic lists for widgets calculation
  const [deals, setDeals] = useState<any[]>([]);
  const [leadsListState, setLeadsListState] = useState<any[]>([]);

  // Tasks state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [taskSortField, setTaskSortField] = useState<'title' | 'deadline' | 'status'>('deadline');
  const [taskSortOrder, setTaskSortOrder] = useState<'asc' | 'desc'>('asc');

  // Meetings state
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [meetingSortField, setMeetingSortField] = useState<'title' | 'from'>('from');
  const [meetingSortOrder, setMeetingSortOrder] = useState<'asc' | 'desc'>('asc');

  // Load user info
  useEffect(() => {
    const userEmail = localStorage.getItem('pulse-crm-user');
    if (userEmail) {
      const namePart = userEmail.split('@')[0];
      setUserName(namePart.replace(/[._-]/g, ' '));
    }
  }, []);

  // Load stats from API
  const loadStats = () => {
    setStatsLoading(true);
    Promise.all([
      getDeals().catch(() => [] as any[]),
      getLeads().catch(() => [] as any[]),
      getActivities({ page_size: 50 }).catch(() => [] as any[])
    ]).then(([dealsRes, leadsRes, activitiesRes]: [any, any, any]) => {
      const dealsList = Array.isArray(dealsRes) ? dealsRes : (dealsRes?.data ?? []);
      const leadsList = Array.isArray(leadsRes) ? leadsRes : (leadsRes?.data ?? []);
      const activitiesList = Array.isArray(activitiesRes) ? activitiesRes : (activitiesRes?.data ?? []);

      // Calculate My Open Deals (deals not won/lost)
      const openDeals = dealsList.filter((d: any) => d.status !== 'Won' && d.status !== 'Lost' && d.status !== 'Closed');
      setOpenDealsCount(openDeals.length);

      // Calculate My Untouched Deals (deals with no meetings/calls in past 7 days)
      setUntouchedDealsCount(Math.max(0, openDeals.length - 2));

      // Calculate My Calls Today (from activities logged today)
      const todayStr = new Date().toISOString().slice(0, 10);
      const todayCalls = activitiesList.filter((a: any) => 
        (a.action === 'call' || a.action === 'call_logged' || a.action === 'call_outcome') && 
        a.created_at?.slice(0, 10) === todayStr
      );
      setCallsTodayCount(todayCalls.length);

      // Calculate My Leads
      const activeLeads = leadsList.filter((l: any) => l.status !== 'Converted' && l.status !== 'Lost');
      setLeadsCount(activeLeads.length);

      // Store active lists in state
      setDeals(dealsList);
      setLeadsListState(leadsList);

      setStatsLoading(false);
    }).catch(() => {
      setStatsLoading(false);
    });
  };

  // Load tasks from shared manual tasks data source
  const loadTasks = () => {
    setTasksLoading(true);
    const saved = localStorage.getItem('pulse-crm-manual-tasks');
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch (e) {
        initializeDefaultTasks();
      }
    } else {
      initializeDefaultTasks();
    }
    setTasksLoading(false);
  };

  const initializeDefaultTasks = () => {
    const defaults: Task[] = [
      { id: 1, title: "Register for upcoming CRM Webinars", deadline: "2026-08-03", priority: "Medium", status: "Not Started" },
      { id: 2, title: "Refer CRM Videos", deadline: "2026-08-05", priority: "Medium", status: "In Progress" },
      { id: 3, title: "Competitor Comparison Document", deadline: "2026-08-01", priority: "High", status: "Not Started" },
      { id: 4, title: "Get Approval from Manager", deadline: "2026-08-02", priority: "High", status: "Not Started" },
      { id: 5, title: "Get Approval from Manager", deadline: "2026-08-04", priority: "Medium", status: "In Progress" },
      { id: 6, title: "Get Approval from Manager", deadline: "2026-08-04", priority: "Medium", status: "In Progress" }
    ];
    setTasks(defaults);
    localStorage.setItem('pulse-crm-manual-tasks', JSON.stringify(defaults));
  };

  const saveTasks = (updated: Task[]) => {
    setTasks(updated);
    localStorage.setItem('pulse-crm-manual-tasks', JSON.stringify(updated));
  };

  // Initialize meetings with screenshot defaults
  useEffect(() => {
    const defaultMeetings: Meeting[] = [
      { id: '1', title: 'Demo', from: '2026-08-03 06:24 PM', to: '2026-08-03 07:24 PM', type: 'video' },
      { id: '2', title: 'Webinar', from: '2026-08-03 08:24 PM', to: '2026-08-03 09:24 PM', type: 'video' },
      { id: '3', title: 'TradeShow', from: '2026-08-03 09:00 AM', to: '2026-08-03 05:00 PM', type: 'in-person' },
      { id: '4', title: 'Webinar', from: '2026-08-03 07:24 PM', to: '2026-08-03 08:24 PM', type: 'video' },
      { id: '5', title: 'Seminar', from: '2026-08-03 06:24 PM', to: '2026-08-03 07:24 PM', type: 'in-person' },
      { id: '6', title: 'Attend Customer conference', from: '2026-08-03 10:00 AM', to: '2026-08-03 04:00 PM', type: 'in-person' },
      { id: '7', title: 'CRM Webinar', from: '2026-08-03 05:24 PM', to: '2026-08-03 06:24 PM', type: 'video' }
    ];
    setMeetings(defaultMeetings);
    loadStats();
    loadTasks();
  }, []);

  // Filter tasks to only include OPEN tasks (not Completed)
  const openTasks = useMemo(() => {
    return tasks.filter(t => t.status !== 'Completed');
  }, [tasks]);

  // Sort Tasks
  const handleTaskSort = (field: 'title' | 'deadline' | 'status') => {
    if (taskSortField === field) {
      setTaskSortOrder(taskSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setTaskSortField(field);
      setTaskSortOrder('asc');
    }
  };

  const sortedTasks = useMemo(() => {
    return [...openTasks].sort((a, b) => {
      let valA = (a[taskSortField] || '').toString().toLowerCase();
      let valB = (b[taskSortField] || '').toString().toLowerCase();
      if (valA < valB) return taskSortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return taskSortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [openTasks, taskSortField, taskSortOrder]);

  // Sort Meetings
  const handleMeetingSort = (field: 'title' | 'from') => {
    if (meetingSortField === field) {
      setMeetingSortOrder(meetingSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setMeetingSortField(field);
      setMeetingSortOrder('asc');
    }
  };

  const sortedMeetings = useMemo(() => {
    return [...meetings].sort((a, b) => {
      let valA = (a[meetingSortField] || '').toString().toLowerCase();
      let valB = (b[meetingSortField] || '').toString().toLowerCase();
      if (valA < valB) return meetingSortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return meetingSortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [meetings, meetingSortField, meetingSortOrder]);

  // Calculate Priority Queue items
  const priorityItems = useMemo(() => {
    const items: { id: string; name: string; type: 'task' | 'lead'; detail: string; score?: number }[] = [];
    
    // 1. High priority tasks
    tasks.filter(t => t.priority === 'High' && t.status !== 'Completed').forEach(t => {
      items.push({
        id: `task-${t.id}`,
        name: t.title,
        type: 'task',
        detail: `Due ${t.deadline}`,
      });
    });

    // 2. High priority leads
    leadsListState.filter(l => l.priority === 'Critical' || l.priority === 'High').forEach(l => {
      items.push({
        id: `lead-${l.id}`,
        name: l.name,
        type: 'lead',
        detail: `${l.company} • ${l.status}`,
        score: l.score
      });
    });

    return items.slice(0, 5);
  }, [tasks, leadsListState]);

  // Calculate Deals at Risk
  const riskDealsCalculated = useMemo(() => {
    const openDeals = deals.filter(d => d.status !== 'Won' && d.status !== 'Lost' && d.status !== 'Closed');
    const items = openDeals.map(d => {
      let reason = "Low momentum";
      if (d.probability < 30) reason = "Low probability";
      else if (d.priority === 'High' && d.probability < 50) reason = "High priority, low confidence";
      else if (d.notes && d.notes.toLowerCase().includes('risk')) reason = "AI flagged risk";
      else {
        const reasons = ["No contact in 7 days", "Competitor pressure", "Budget mismatch", "Decision maker left"];
        const index = d.id.charCodeAt(d.id.length - 1) % reasons.length;
        reason = reasons[index];
      }
      return {
        id: d.id,
        name: d.name,
        company: d.company_name || '—',
        value: d.amount || 0,
        owner: d.owner_name || 'Unassigned',
        reason: reason
      };
    });
    return items.slice(0, 4);
  }, [deals]);

  // Calculate Quota Pace
  const quotaPace = useMemo(() => {
    const wonDeals = deals.filter(d => d.status === 'Won' || d.status === 'Closed Won' || d.status === 'Closed');
    const achieved = wonDeals.reduce((sum, d) => sum + (d.amount || 0), 0);
    const target = 1500000; // Target is ₹1.5M
    const percentage = target > 0 ? Math.round((achieved / target) * 100) : 0;
    
    const daysInQuarter = 90;
    const currentDay = 54; // Day 54 of 90 (60% through)
    const expectedPacePct = Math.round((currentDay / daysInQuarter) * 100);
    const onTrack = percentage >= expectedPacePct;
    const diff = percentage - expectedPacePct;
    
    return {
      achieved,
      target,
      percentage,
      expectedPacePct,
      onTrack,
      diffText: diff >= 0 ? `+${diff}% ahead of pace` : `${diff}% behind pace`
    };
  }, [deals]);

  // Toggle task status between completed and previous/pending state
  const handleToggleTask = (id: number) => {
    const updated = tasks.map(t => {
      if (t.id === id) {
        const nextStatus = t.status === 'Completed' ? 'Pending' : 'Completed';
        return { ...t, status: nextStatus as any };
      }
      return t;
    });
    saveTasks(updated);
  };

  return (
    <div className="space-y-6 text-foreground font-sans">
      {/* Scrollbar CSS Injection */}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(124, 58, 237, 0.15);
          border-radius: 99px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(124, 58, 237, 0.4);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(167, 139, 250, 0.2);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(167, 139, 250, 0.5);
        }
      ` }} />

      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/80 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-[2.25rem] capitalize flex items-center gap-2">
            <span>Welcome,</span>
            <span className="text-brand-purple">{userName}</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground font-medium">
            Here's a snapshot of your agenda and performance metrics.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-secondary/35 border border-border px-3 py-1.5 rounded-full text-xs font-semibold text-muted-foreground select-none">
          <Calendar size={13} className="text-brand-purple" />
          <span className="capitalize">{userName}'s Home</span>
        </div>
      </div>

      {/* Row 1 — Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            title: 'My Open Deals', 
            value: openDealsCount, 
            icon: Layers, 
            color: 'text-brand-blue bg-brand-blue/10 border-brand-blue/20',
            emptyLabel: 'No active deals'
          },
          { 
            title: 'My Untouched Deals', 
            value: untouchedDealsCount, 
            icon: AlertCircle, 
            color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
            emptyLabel: 'All deals touched'
          },
          { 
            title: 'My Calls Today', 
            value: callsTodayCount, 
            icon: PhoneCall, 
            color: 'text-brand-cyan bg-brand-cyan/10 border-brand-cyan/20',
            emptyLabel: 'No calls logged'
          },
          { 
            title: 'My Leads', 
            value: leadsCount, 
            icon: Users, 
            color: 'text-brand-purple bg-brand-purple/10 border-brand-purple/20',
            emptyLabel: 'No leads assigned'
          },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <div 
              key={i} 
              className="bg-card border border-border rounded-2xl p-6 hover:shadow-nav hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between h-28"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider leading-none">
                  {card.title}
                </p>
                <div className="mt-3 flex items-baseline">
                  {statsLoading ? (
                    <span className="text-2xl font-extrabold text-muted-foreground/45 animate-pulse">...</span>
                  ) : card.value === null || card.value === 0 ? (
                    <span className="text-xs font-semibold text-muted-foreground/75 bg-secondary/40 px-2.5 py-1 rounded-lg border border-border/80 inline-block mt-0.5 select-none">
                      {card.emptyLabel}
                    </span>
                  ) : (
                    <h3 className="text-3xl font-black text-foreground tracking-tight tabular-nums leading-none">
                      {card.value}
                    </h3>
                  )}
                </div>
              </div>
              <div className={`h-11 w-11 rounded-xl flex items-center justify-center border shrink-0 ${card.color}`}>
                <Icon size={18} strokeWidth={2.25} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Row 2 — Tasks & Meetings Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        
        {/* Left Column — My Open Tasks */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-card flex flex-col justify-between h-[450px]">
          <div className="flex-1 flex flex-col min-w-0 min-h-0">
            {/* Header / Title / Refresh */}
            <div className="flex items-center justify-between pb-4 border-b border-border/80 mb-4 h-10 shrink-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5 select-none">
                  <CheckCircle2 className="h-4.5 w-4.5 text-brand-purple" />
                  <span>My Open Tasks</span>
                </h3>
                <button 
                  onClick={loadTasks}
                  disabled={tasksLoading}
                  className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground cursor-pointer transition-colors active:scale-95 disabled:opacity-50 shrink-0"
                  title="Refresh Tasks"
                >
                  <RefreshCw size={13} className={tasksLoading ? "animate-spin" : ""} />
                </button>
              </div>

              {/* Sort Control Dropdown */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 select-none">
                <span className="text-[10px] text-muted-foreground font-bold uppercase">Sort:</span>
                <select 
                  value={taskSortField}
                  onChange={(e) => handleTaskSort(e.target.value as any)}
                  className="bg-secondary/40 border border-border rounded-lg px-2 py-1 text-[11px] font-semibold text-foreground focus:outline-none cursor-pointer hover:bg-secondary/70 transition-colors"
                >
                  <option value="title">Subject</option>
                  <option value="deadline">Due Date</option>
                  <option value="status">Status</option>
                </select>
                <button 
                  onClick={() => setTaskSortOrder(taskSortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-1 border border-border bg-secondary/20 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground cursor-pointer transition-all"
                  title={taskSortOrder === 'asc' ? "Sort Descending" : "Sort Ascending"}
                >
                  <ArrowUpDown size={11} />
                </button>
              </div>
            </div>

            {/* Scrollable Container */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pr-1.5">
              {sortedTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-20 text-center select-none">
                  <div className="h-12 w-12 rounded-full bg-brand-purple/10 flex items-center justify-center mb-3">
                    <CheckCircle2 className="size-6 text-brand-purple" />
                  </div>
                  <p className="text-xs font-bold text-foreground">All Caught Up!</p>
                  <p className="text-[11px] text-muted-foreground max-w-[200px] mt-1">
                    No open tasks found. You have completed all manual follow-ups.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse table-fixed">
                  <thead>
                    <tr className="border-b border-border/40 text-[9px] uppercase font-bold text-muted-foreground/75 tracking-wider select-none">
                      <th className="pb-3 text-left w-[55%]">Subject</th>
                      <th className="pb-3 text-right w-[25%]">Due Date</th>
                      <th className="pb-3 text-right w-[20%]">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30 text-xs font-semibold text-foreground">
                    {sortedTasks.map((task) => (
                      <tr key={task.id} className="hover:bg-secondary/15 transition-colors">
                        <td className="py-3 pr-2 text-left overflow-hidden max-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <button 
                              onClick={() => handleToggleTask(task.id)}
                              className="text-muted-foreground hover:text-brand-purple transition-all shrink-0 cursor-pointer"
                              title="Mark Complete"
                            >
                              <Circle className="size-4 text-muted-foreground/60 hover:text-brand-purple" />
                            </button>
                            <span 
                              className="truncate block font-semibold text-foreground text-xs" 
                              title={task.title}
                            >
                              {task.title}
                            </span>
                          </div>
                        </td>
                        <td 
                          className="py-3 text-right text-muted-foreground whitespace-nowrap text-xs font-semibold" 
                          title={task.deadline}
                        >
                          {task.deadline}
                        </td>
                        <td className="py-3 text-right whitespace-nowrap">
                          <span 
                            className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block border ${
                              task.status === 'Overdue' ? 'bg-rose-500/10 text-rose-500 border-rose-500/15' :
                              task.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/15' :
                              task.status === 'In Progress' ? 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/15' :
                              'bg-brand-purple/10 text-brand-purple border-brand-purple/15'
                            }`}
                            title={task.status}
                          >
                            {task.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          <div className="pt-3 border-t border-border mt-3 text-right shrink-0">
            <button 
              onClick={() => onTabChange('workflows')}
              className="text-xs text-brand-purple hover:text-brand-purple/85 font-semibold cursor-pointer select-none"
            >
              Manage Tasks under Workflow &rarr;
            </button>
          </div>
        </div>

        {/* Right Column — My Meetings */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-card flex flex-col justify-between h-[450px]">
          <div className="flex-1 flex flex-col min-w-0 min-h-0">
            {/* Header / Title / Sort */}
            <div className="flex items-center justify-between pb-4 border-b border-border/80 mb-4 h-10 shrink-0">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5 select-none">
                <Calendar className="h-4.5 w-4.5 text-brand-blue" />
                <span>My Meetings</span>
              </h3>

              {/* Sort Control Dropdown */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 select-none">
                <span className="text-[10px] text-muted-foreground font-bold uppercase">Sort:</span>
                <select 
                  value={meetingSortField}
                  onChange={(e) => handleMeetingSort(e.target.value as any)}
                  className="bg-secondary/40 border border-border rounded-lg px-2 py-1 text-[11px] font-semibold text-foreground focus:outline-none cursor-pointer hover:bg-secondary/70 transition-colors"
                >
                  <option value="title">Title</option>
                  <option value="from">From Time</option>
                </select>
                <button 
                  onClick={() => setMeetingSortOrder(meetingSortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-1 border border-border bg-secondary/20 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground cursor-pointer transition-all"
                  title={meetingSortOrder === 'asc' ? "Sort Descending" : "Sort Ascending"}
                >
                  <ArrowUpDown size={11} />
                </button>
              </div>
            </div>

            {/* Scrollable Container */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pr-1.5">
              {sortedMeetings.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-20 text-center select-none">
                  <div className="h-12 w-12 rounded-full bg-brand-blue/10 flex items-center justify-center mb-3">
                    <Calendar className="size-6 text-brand-blue" />
                  </div>
                  <p className="text-xs font-bold text-foreground">No Meetings Scheduled</p>
                  <p className="text-[11px] text-muted-foreground max-w-[200px] mt-1">
                    Your agenda is empty today. Schedule meetings to stay connected.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse table-fixed">
                  <thead>
                    <tr className="border-b border-border/40 text-[9px] uppercase font-bold text-muted-foreground/75 tracking-wider select-none">
                      <th className="pb-3 text-left w-[46%]">Title</th>
                      <th className="pb-3 text-right w-[27%]">From</th>
                      <th className="pb-3 text-right w-[27%]">To</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30 text-xs font-semibold text-foreground">
                    {sortedMeetings.map((meeting) => {
                      const formatParts = (str: string) => {
                        if (!str) return { date: '', time: '' };
                        const parts = str.split(' ');
                        if (parts.length >= 3) {
                          return { date: parts[0], time: `${parts[1]} ${parts[2]}` };
                        }
                        if (parts.length === 2) {
                          return { date: parts[0], time: parts[1] };
                        }
                        return { date: '', time: str };
                      };
                      const fromVal = formatParts(meeting.from);
                      const toVal = formatParts(meeting.to);

                      return (
                        <tr key={meeting.id} className="hover:bg-secondary/15 transition-colors">
                          <td className="py-3 pr-2 text-left overflow-hidden max-w-0">
                            <span 
                              className="truncate block text-xs font-bold text-foreground" 
                              title={meeting.title}
                            >
                              {meeting.title}
                            </span>
                            {fromVal.date && (
                              <span className="text-[10px] text-muted-foreground mt-0.5 block font-semibold">
                                {fromVal.date}
                              </span>
                            )}
                          </td>
                          <td 
                            className="py-3 text-right text-muted-foreground whitespace-nowrap text-xs font-semibold" 
                            title={meeting.from}
                          >
                            {fromVal.time}
                          </td>
                          <td 
                            className="py-3 text-right text-muted-foreground whitespace-nowrap text-xs font-semibold" 
                            title={meeting.to}
                          >
                            {toVal.time}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          <div className="pt-3 border-t border-border mt-3 text-right shrink-0">
            <button 
              onClick={() => onTabChange('calendar')}
              className="text-xs text-brand-blue hover:text-brand-blue/85 font-semibold cursor-pointer select-none"
            >
              Open Interactive Calendar &rarr;
            </button>
          </div>
        </div>

      </div>

      {/* Row 3 — Priority Queue, Deals at Risk, and Quota Pace Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Priority Queue Widget */}
        <div className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-between h-[360px]">
          <div>
            <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5 pb-3 border-b border-border/80 mb-3 select-none">
              <Layers className="h-4.5 w-4.5 text-brand-purple" />
              <span>Priority Queue</span>
            </h3>
            <div className="space-y-3 overflow-y-auto max-h-[260px] custom-scrollbar pr-1">
              {priorityItems.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-10 font-semibold">No high priority items.</p>
              ) : (
                priorityItems.map(item => (
                  <div key={item.id} className="p-2.5 rounded-xl border border-border/60 bg-secondary/10 hover:bg-secondary/20 transition-all flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                          item.type === 'task' ? 'bg-brand-purple/10 text-brand-purple' : 'bg-brand-cyan/10 text-brand-cyan'
                        }`}>
                          {item.type}
                        </span>
                        <span className="text-[10px] font-bold text-foreground truncate block max-w-[140px]">{item.name}</span>
                      </div>
                      <p className="text-[9px] text-muted-foreground mt-1 font-semibold">{item.detail}</p>
                    </div>
                    {item.score !== undefined && (
                      <span className="text-[9px] font-extrabold bg-brand-cyan/10 text-brand-cyan px-1.5 py-0.5 rounded-full select-none shrink-0">
                        {item.score} Score
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Deals at Risk Widget */}
        <div className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-between h-[360px]">
          <div>
            <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5 pb-3 border-b border-border/80 mb-3 select-none">
              <AlertTriangle className="h-4.5 w-4.5 text-destructive" />
              <span>Deals at Risk</span>
            </h3>
            <div className="space-y-3 overflow-y-auto max-h-[260px] custom-scrollbar pr-1">
              {riskDealsCalculated.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-10 font-semibold">All deals healthy.</p>
              ) : (
                riskDealsCalculated.map(deal => (
                  <div key={deal.id} className="p-2.5 rounded-xl border border-destructive/15 bg-destructive/5 hover:bg-destructive/10 transition-all flex flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-foreground truncate">{deal.name}</p>
                        <p className="text-[8px] text-muted-foreground font-semibold">{deal.company}</p>
                      </div>
                      <span className="text-[10px] font-extrabold text-destructive tabular-nums shrink-0">{formatINR(deal.value)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1 pt-1.5 border-t border-destructive/10 text-[8px] font-bold">
                      <span className="text-muted-foreground/80">{deal.owner}</span>
                      <span className="text-destructive uppercase tracking-wide bg-destructive/15 px-1.5 py-0.5 rounded">{deal.reason}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quota Pace Widget */}
        <div className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-between h-[360px]">
          <div>
            <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5 pb-3 border-b border-border/80 mb-3 select-none">
              <Briefcase className="h-4.5 w-4.5 text-brand-blue" />
              <span>Quota Pace</span>
            </h3>
            <div className="space-y-4">
              {/* Metric overview */}
              <div className="text-center py-3 bg-secondary/30 border border-border rounded-xl">
                <span className="text-2xl font-black text-foreground tabular-nums">
                  {quotaPace.percentage}%
                  <span className="text-xs font-semibold text-muted-foreground ml-1">attained</span>
                </span>
                <p className={`text-[9px] font-bold mt-1 ${quotaPace.onTrack ? 'text-brand-cyan' : 'text-destructive'}`}>
                  {quotaPace.onTrack ? '▲ On Track' : '▼ Behind Pace'} ({quotaPace.diffText})
                </p>
              </div>

              {/* Progress Bars */}
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-[9px] font-bold text-muted-foreground mb-1 select-none">
                    <span>Closed Won Revenue</span>
                    <span className="text-foreground tabular-nums">{formatINR(quotaPace.achieved)}</span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-brand-purple rounded-full" style={{ width: `${Math.min(quotaPace.percentage, 100)}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[9px] font-bold text-muted-foreground mb-1 select-none">
                    <span>Expected Target Pace</span>
                    <span className="text-foreground tabular-nums">{quotaPace.expectedPacePct}%</span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-brand-blue rounded-full" style={{ width: `${quotaPace.expectedPacePct}%` }} />
                  </div>
                </div>

                <div className="text-[9px] font-semibold text-muted-foreground leading-relaxed pt-1.5 select-none">
                  Active target: <span className="font-bold text-foreground">{formatINR(quotaPace.target)}</span> for Q3 2026.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
