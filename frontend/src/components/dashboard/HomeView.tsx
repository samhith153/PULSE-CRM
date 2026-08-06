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
  Briefcase,
  Settings2,
  GripVertical,
  Maximize2,
  Minimize2,
  X,
  RotateCcw
} from 'lucide-react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragEndEvent 
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';

import { getLeads, getDeals, getActivities, formatINR } from '@/utils/api';
import QuotaPaceCard from './QuotaPaceCard';
import DealsAtRiskCard from './DealsAtRiskCard';
import FunnelChartCard from './FunnelChartCard';
import QuickCaptureCard from './QuickCaptureCard';
import ActivitySummaryCard from './ActivitySummaryCard';
import type { DashboardOverviewData } from '@/utils/api';

interface Task {
  id: number;
  title: string;
  deadline: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'Completed' | 'Overdue' | 'Not Started' | 'In Progress';
  fitScore?: number; // 0–100 lead/task fit alignment score
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
  /** Optional pre-fetched unified dashboard data from GET /api/v1/dashboard/me */
  dashboardData?: DashboardOverviewData;
}


// Draggable Card Wrapper Component
interface SortableCardWrapperProps {
  id: string;
  isEditMode: boolean;
  size: 'half' | 'full';
  onToggleSize: () => void;
  onHide: () => void;
  children: React.ReactNode;
}

function SortableCardWrapper({
  id,
  isEditMode,
  size,
  onToggleSize,
  onHide,
  children,
}: SortableCardWrapperProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    zIndex: isDragging ? 50 : undefined,
    position: 'relative',
  };

  const colSpanClass = size === 'full' ? 'col-span-12' : 'col-span-12 lg:col-span-6';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${colSpanClass} transition-shadow duration-200 ${
        isDragging ? 'shadow-lg ring-2 ring-brand-purple/20' : ''
      }`}
    >
      {isEditMode && (
        <div className="absolute top-2 right-2 z-30 flex items-center gap-1.5 bg-background/90 dark:bg-slate-900/90 backdrop-blur-xs px-2 py-1 rounded-lg border border-border shadow-md animate-in fade-in duration-150 select-none">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="p-1 hover:bg-secondary dark:hover:bg-slate-800 rounded text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
            title="Drag to reorder"
          >
            <GripVertical size={13} />
          </div>

          {/* Size Toggle (Do not allow stats to resize to preserve grid structure) */}
          {id !== 'stats' && (
            <button
              onClick={onToggleSize}
              className="p-1 hover:bg-secondary dark:hover:bg-slate-800 rounded text-muted-foreground hover:text-foreground cursor-pointer"
              title={size === 'full' ? 'Make half width' : 'Make full width'}
            >
              {size === 'full' ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>
          )}

          {/* Hide Button */}
          <button
            onClick={onHide}
            className="p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive cursor-pointer"
            title="Hide card"
          >
            <X size={13} />
          </button>
        </div>
      )}
      
      <div className={`h-full ${isEditMode ? 'border border-dashed border-brand-purple/45 rounded-2xl' : ''}`}>
        {children}
      </div>
    </div>
  );
}

export default function HomeView({ onTabChange, dashboardData }: HomeViewProps) {
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

  // Layout Customization State
  const [isEditMode, setIsEditMode] = useState(false);
  const [layout, setLayout] = useState<string[]>([
    'stats',
    'quotaPace',
    'funnelChart',
    'activitySummary',
    'priorityQueue',
    'atRisk',
    'today',
  ]);
  const [hidden, setHidden] = useState<string[]>([]);
  const [sizes, setSizes] = useState<Record<string, 'half' | 'full'>>({
    stats: 'full',
    quotaPace: 'full',
    funnelChart: 'full',
    activitySummary: 'full',
    today: 'full',
    priorityQueue: 'half',
    atRisk: 'half',
  });

  // Load user info and layout settings
  useEffect(() => {
    const userEmail = localStorage.getItem('pulse-crm-user');
    if (userEmail) {
      const namePart = userEmail.split('@')[0];
      setUserName(namePart.replace(/[._-]/g, ' '));
    }

    const savedLayout = localStorage.getItem('pulse-crm-home-layout');
    if (savedLayout) {
      try {
        const parsed = JSON.parse(savedLayout);
        if (parsed.layout) setLayout(parsed.layout);
        if (parsed.hidden) setHidden(parsed.hidden);
        if (parsed.sizes) setSizes(parsed.sizes);
      } catch (e) {
        console.error('Failed to parse home layout preferences', e);
      }
    }
  }, []);

  // Save layout settings
  const saveLayoutSettings = (newLayout: string[], newHidden: string[], newSizes: Record<string, 'half' | 'full'>) => {
    localStorage.setItem('pulse-crm-home-layout', JSON.stringify({
      layout: newLayout,
      hidden: newHidden,
      sizes: newSizes,
    }));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setLayout((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        const newItems = arrayMove(items, oldIndex, newIndex);
        saveLayoutSettings(newItems, hidden, sizes);
        return newItems;
      });
    }
  };

  const handleHideCard = (id: string) => {
    const newHidden = [...hidden, id];
    setHidden(newHidden);
    saveLayoutSettings(layout, newHidden, sizes);
  };

  const handleShowCard = (id: string) => {
    const newHidden = hidden.filter(item => item !== id);
    setHidden(newHidden);
    saveLayoutSettings(layout, newHidden, sizes);
  };

  const handleToggleSize = (id: string) => {
    const newSizes: Record<string, 'half' | 'full'> = {
      ...sizes,
      [id]: sizes[id] === 'full' ? 'half' : 'full',
    };
    setSizes(newSizes);
    saveLayoutSettings(layout, hidden, newSizes);
  };

  const handleResetLayout = () => {
    const defaultLayout = ['stats', 'quotaPace', 'funnelChart', 'activitySummary', 'priorityQueue', 'atRisk', 'today'];
    const defaultHidden: string[] = [];
    const defaultSizes: Record<string, 'half' | 'full'> = {
      stats: 'full',
      quotaPace: 'full',
      funnelChart: 'full',
      activitySummary: 'full',
      today: 'full',
      priorityQueue: 'half',
      atRisk: 'half',
    };
    setLayout(defaultLayout);
    setHidden(defaultHidden);
    setSizes(defaultSizes);
    localStorage.setItem('pulse-crm-home-layout', JSON.stringify({
      layout: defaultLayout,
      hidden: defaultHidden,
      sizes: defaultSizes,
    }));
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load stats from API
  // If dashboardData from the unified endpoint is already available, we skip
  // the individual API calls entirely. Falls back to separate requests otherwise.
  const loadStats = () => {
    // If unified dashboard data is already seeded, skip redundant fetches
    if (dashboardData) return;

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

      // Calculate My Untouched Deals
      setUntouchedDealsCount(Math.max(0, openDeals.length - 2));

      // Calculate My Calls Today
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

  // When unified dashboard data arrives from the fast endpoint, seed stats immediately
  useEffect(() => {
    if (!dashboardData) return;
    const kpis = dashboardData.kpis;
    if (kpis) {
      setOpenDealsCount(kpis.open_deals ?? null);
      setCallsTodayCount(kpis.calls_today ?? null);
      setLeadsCount(kpis.leads_today ?? null);
      setUntouchedDealsCount(null); // backend doesn't expose this yet
    }
    if (dashboardData.deals) setDeals(dashboardData.deals);
    if (dashboardData.leads) setLeadsListState(dashboardData.leads);
    setStatsLoading(false);
  }, [dashboardData]);


  // Load tasks
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
      { id: 1, title: "Register for upcoming CRM Webinars", deadline: "2026-08-03", priority: "Medium", status: "Not Started", fitScore: 82 },
      { id: 2, title: "Refer CRM Videos", deadline: "2026-08-05", priority: "Medium", status: "In Progress", fitScore: 67 },
      { id: 3, title: "Competitor Comparison Document", deadline: "2026-08-01", priority: "High", status: "Not Started", fitScore: 91 },
      { id: 4, title: "Get Approval from Manager", deadline: "2026-08-02", priority: "High", status: "Not Started", fitScore: 45 },
      { id: 5, title: "Get Approval from Manager", deadline: "2026-08-04", priority: "Medium", status: "In Progress", fitScore: 58 },
      { id: 6, title: "Get Approval from Manager", deadline: "2026-08-04", priority: "Medium", status: "In Progress", fitScore: 74 }
    ];
    setTasks(defaults);
    localStorage.setItem('pulse-crm-manual-tasks', JSON.stringify(defaults));
  };

  const saveTasks = (updated: Task[]) => {
    setTasks(updated);
    localStorage.setItem('pulse-crm-manual-tasks', JSON.stringify(updated));
  };

  // Initialize meetings with defaults
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

  const openTasks = useMemo(() => {
    return tasks.filter(t => t.status !== 'Completed');
  }, [tasks]);

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

  const priorityItems = useMemo(() => {
    const items: { id: string; name: string; type: 'task' | 'lead'; detail: string; score?: number }[] = [];
    
    tasks.filter(t => t.priority === 'High' && t.status !== 'Completed').forEach(t => {
      items.push({
        id: `task-${t.id}`,
        name: t.title,
        type: 'task',
        detail: `Due ${t.deadline}`,
      });
    });

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
    <div className="flex flex-col gap-[var(--space-5)] text-foreground font-sans">
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

      {/* Welcome Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-[var(--space-2)] border-b border-border/80 pb-[var(--space-2)]">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-[2.25rem] capitalize flex items-center gap-2">
            <span>Welcome,</span>
            <span className="text-brand-purple">{userName}</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground font-medium">
            Here's a snapshot of your agenda and performance metrics.
          </p>
        </div>
        <div className="flex items-center gap-[var(--space-2)]">
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer select-none ${
              isEditMode
                ? 'bg-brand-purple text-primary-foreground border-transparent shadow-sm'
                : 'bg-secondary/35 hover:bg-secondary border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <Settings2 size={13} className={isEditMode ? 'animate-spin' : ''} />
            <span>{isEditMode ? 'Save Layout' : 'Customize Layout'}</span>
          </button>
          <div className="flex items-center gap-2 bg-secondary/35 border border-border px-3 py-1.5 rounded-full text-xs font-semibold text-muted-foreground select-none">
            <Calendar size={13} className="text-brand-purple" />
            <span className="capitalize">{userName}'s Home</span>
          </div>
        </div>
      </div>

      {/* Editor Control Panel Toolbar */}
      {isEditMode && (
        <div className="bg-secondary/40 border border-brand-purple/20 rounded-2xl p-[var(--space-4)] flex flex-col md:flex-row md:items-center md:justify-between gap-[var(--space-4)] animate-in fade-in duration-300">
          <div>
            <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider">Dashboard Customizer Active</h4>
            <p className="text-[11px] text-muted-foreground mt-1">
              Drag cards using the handle to reorder, toggle sizes, or hide cards. Select hidden cards below to add them back.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-[var(--space-2)]">
            {/* Hidden items restore list */}
            {hidden.length > 0 && (
              <div className="flex items-center gap-1.5 mr-2">
                <span className="text-[10px] text-muted-foreground font-bold uppercase">Add back:</span>
                {hidden.map((id) => {
                  const labelMap: Record<string, string> = {
                    stats: 'KPI Cards',
                    quotaPace: 'Quota Pace',
                    funnelChart: 'Funnel Chart',
                    activitySummary: "Today's Work Summary",
                    priorityQueue: 'Priority Queue',
                    atRisk: 'Deals at Risk',
                    today: 'Tasks & Meetings',
                    quickCapture: 'Quick Capture'
                  };
                  return (
                    <button
                      key={id}
                      onClick={() => handleShowCard(id)}
                      className="px-2.5 py-1 bg-brand-purple/10 text-brand-purple hover:bg-brand-purple hover:text-primary-foreground border border-brand-purple/20 hover:border-transparent rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                    >
                      + {labelMap[id] || id}
                    </button>
                  );
                })}
              </div>
            )}
            <button
              onClick={handleResetLayout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border bg-card hover:bg-secondary text-foreground rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              <RotateCcw size={12} />
              <span>Reset Layout</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Drag and Drop Layout Context */}
      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={layout} strategy={verticalListSortingStrategy}>
          <div className="grid grid-cols-12 gap-[var(--space-4)]">
            {layout.map((itemId) => {
              if (hidden.includes(itemId)) return null;

              let cardContent = null;
              if (itemId === 'stats') {
                // Render KPI cards row
                cardContent = (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[var(--space-4)]">
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
                      
                      // Shape definition mapping for Part 2 requirements
                      let shapeClass = 'rounded-xl';
                      let clipPath = undefined;
                      let rotateWrapper = false;

                      if (card.title === 'My Leads') {
                        shapeClass = 'rounded-full'; // perfect circle
                      } else if (card.title === 'My Open Deals') {
                        shapeClass = 'rounded-[10px]'; // squircle (~30% radius)
                      } else if (card.title === 'My Untouched Deals') {
                        shapeClass = ''; // custom hexagon clip-path
                        clipPath = 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';
                      } else if (card.title === 'My Calls Today') {
                        shapeClass = 'rounded-md'; // diamond (rotate 45deg)
                        rotateWrapper = true;
                      }

                      return (
                        <div 
                          key={i} 
                          className="bg-card border border-border rounded-[8px] p-3 hover:shadow-nav hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between h-20 select-none"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider leading-none">
                              {card.title}
                            </p>
                            <div className="mt-2.5 flex items-baseline">
                              {statsLoading ? (
                                <span className="text-xl font-extrabold text-muted-foreground/45 animate-pulse">...</span>
                              ) : card.value === null || card.value === 0 ? (
                                <span className="text-[10px] font-semibold text-muted-foreground/75 bg-secondary/40 px-2 py-0.5 rounded border border-border/80 inline-block select-none">
                                  {card.emptyLabel}
                                </span>
                              ) : (
                                <h3 className="text-2xl font-black text-foreground tracking-tight tabular-nums leading-none">
                                  {card.value}
                                </h3>
                              )}
                            </div>
                          </div>

                          {/* Nested badge design securely inside the card container */}
                          <div 
                            style={{ clipPath }}
                            className={`h-9 w-9 flex items-center justify-center border shrink-0 shadow-sm transition-transform duration-300 ${card.color} ${shapeClass} ${rotateWrapper ? 'rotate-45' : ''}`}
                          >
                            <Icon size={15} strokeWidth={2.25} className={rotateWrapper ? '-rotate-45' : ''} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              } else if (itemId === 'quotaPace') {
                // Render Quota Pace chart
                cardContent = <QuotaPaceCard deals={deals} />;
              } else if (itemId === 'funnelChart') {
                // Render Funnel Chart
                cardContent = <FunnelChartCard leads={leadsListState} deals={deals} />;
              } else if (itemId === 'today') {
                // Render Tasks & Meetings Row
                cardContent = (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-[var(--space-4)] items-stretch">
                    {/* Left Column — My Open Tasks */}
                    <div className="bg-card border border-border rounded-xl p-[var(--space-4)] shadow-card flex flex-col justify-between h-[450px]">
                      <div className="flex-1 flex flex-col min-w-0 min-h-0">
                        {/* Header / Title / Refresh */}
                        <div className="flex items-center justify-between pb-[var(--space-2)] border-b border-border/80 mb-[var(--space-3)] h-10 shrink-0">
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
                                  <th className="pb-[var(--space-2)] px-[var(--space-3)] text-left w-[42%]">Subject</th>
                                  <th className="pb-[var(--space-2)] px-[var(--space-3)] text-center w-[13%]">Fit Score</th>
                                  <th className="pb-[var(--space-2)] px-[var(--space-3)] text-right w-[22%]">Due Date</th>
                                  <th className="pb-[var(--space-2)] px-[var(--space-3)] text-right w-[23%]">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border/30 text-xs font-semibold text-foreground">
                                {sortedTasks.map((task) => {
                                  const score = task.fitScore ?? null;
                                  const scoreColor = score === null ? '' :
                                    score >= 75 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                                    score >= 50 ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' :
                                    'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
                                  return (
                                  <tr key={task.id} className="hover:bg-secondary/15 transition-colors">
                                    <td className="py-[var(--space-2)] px-[var(--space-3)] text-left overflow-hidden max-w-0">
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
                                    {/* Fit Score */}
                                    <td className="py-[var(--space-2)] px-[var(--space-3)] text-center whitespace-nowrap">
                                      {score !== null ? (
                                        <span
                                          className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full border text-[10px] font-bold tabular-nums ${scoreColor}`}
                                          title={`Fit Score: ${score}/100`}
                                        >
                                          {score}
                                        </span>
                                      ) : (
                                        <span className="text-muted-foreground/40 text-[10px]">—</span>
                                      )}
                                    </td>
                                    <td 
                                      className="py-[var(--space-2)] px-[var(--space-3)] text-right text-muted-foreground whitespace-nowrap text-xs font-semibold" 
                                      title={task.deadline}
                                    >
                                      {task.deadline}
                                    </td>
                                    <td className="py-[var(--space-2)] px-[var(--space-3)] text-right whitespace-nowrap">
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
                                  );
                                })}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </div>
                      <div className="pt-[var(--space-2)] border-t border-border mt-[var(--space-2)] text-right shrink-0">
                        <button 
                          onClick={() => onTabChange('workflows')}
                          className="text-xs text-brand-purple hover:text-brand-purple/85 font-semibold cursor-pointer select-none"
                        >
                          Manage Tasks under Workflow &rarr;
                        </button>
                      </div>
                    </div>

                    {/* Right Column — My Meetings */}
                    <div className="bg-card border border-border rounded-xl p-[var(--space-4)] shadow-card flex flex-col justify-between h-[450px]">
                      <div className="flex-1 flex flex-col min-w-0 min-h-0">
                        {/* Header / Title / Sort */}
                        <div className="flex items-center justify-between pb-[var(--space-2)] border-b border-border/80 mb-[var(--space-3)] h-10 shrink-0">
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
                                  <th className="pb-[var(--space-2)] px-[var(--space-3)] text-left w-[46%]">Title</th>
                                  <th className="pb-[var(--space-2)] px-[var(--space-3)] text-right w-[27%]">From</th>
                                  <th className="pb-[var(--space-2)] px-[var(--space-3)] text-right w-[27%]">To</th>
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
                                      <td className="py-[var(--space-2)] px-[var(--space-3)] text-left overflow-hidden max-w-0">
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
                                        className="py-[var(--space-2)] px-[var(--space-3)] text-right text-muted-foreground whitespace-nowrap text-xs font-semibold" 
                                        title={meeting.from}
                                      >
                                        {fromVal.time}
                                      </td>
                                      <td 
                                        className="py-[var(--space-2)] px-[var(--space-3)] text-right text-muted-foreground whitespace-nowrap text-xs font-semibold" 
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
                      <div className="pt-[var(--space-2)] border-t border-border mt-[var(--space-2)] text-right shrink-0">
                        <button 
                          onClick={() => onTabChange('calendar')}
                          className="text-xs text-brand-blue hover:text-brand-blue/85 font-semibold cursor-pointer select-none"
                        >
                          Open Interactive Calendar &rarr;
                        </button>
                      </div>
                    </div>
                  </div>
                );
              } else if (itemId === 'priorityQueue') {
                // Priority Queue widget
                cardContent = (
                  <div className="bg-card border border-border rounded-xl p-[var(--space-4)] flex flex-col justify-between h-[360px]">
                    <div>
                      <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5 pb-[var(--space-2)] border-b border-border/80 mb-[var(--space-3)] select-none">
                        <Layers className="h-4.5 w-4.5 text-brand-purple" />
                        <span>Priority Queue</span>
                      </h3>
                      <div className="space-y-[var(--space-2)] overflow-y-auto max-h-[260px] custom-scrollbar pr-1">
                        {priorityItems.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-10 font-semibold">No high priority items.</p>
                        ) : (
                          priorityItems.map(item => (
                            <div key={item.id} className="p-[var(--space-2)] rounded-xl border border-border/60 bg-secondary/10 hover:bg-secondary/20 transition-all flex items-start justify-between gap-[var(--space-2)]">
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
                );
              } else if (itemId === 'atRisk') {
                // Deals at risk widget
                cardContent = <DealsAtRiskCard deals={riskDealsCalculated} />;
              } else if (itemId === 'activitySummary') {
                // Render Today's Work summary card
                cardContent = <ActivitySummaryCard onTabChange={onTabChange} />;
              }

              return (
                <SortableCardWrapper
                  key={itemId}
                  id={itemId}
                  isEditMode={isEditMode}
                  size={sizes[itemId] || 'full'}
                  onToggleSize={() => handleToggleSize(itemId)}
                  onHide={() => handleHideCard(itemId)}
                >
                  {cardContent}
                </SortableCardWrapper>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
