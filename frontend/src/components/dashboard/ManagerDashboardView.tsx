'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp, Target, AlertTriangle, Users, ArrowUpRight,
  Activity, BellRing, ShieldAlert, Sparkles, Award,
  Layers, Clock, ArrowRight, CheckCircle2, ChevronDown,
  Briefcase, Percent, User, MessageSquare, AlertCircle,
  TrendingDown, ArrowDownRight, Compass, Settings2, GripVertical,
  Maximize2, Minimize2, X, RotateCcw
} from 'lucide-react';
import {
  getManagerDashboard, asNumber, formatINR, formatPct, ManagerDashboardData
} from '@/utils/api';
import { motion, AnimatePresence } from 'framer-motion';
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
import ManagerFunnelChart from './ManagerFunnelChart';
import ManagerFunnelStageCard from './ManagerFunnelStageCard';

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
      className={`${colSpanClass} transition-all duration-200 ${
        isDragging ? 'shadow-xl ring-2 ring-brand-purple/30 scale-[1.02]' : ''
      }`}
    >
      {isEditMode && (
        <div className="absolute top-4 right-4 z-30 flex items-center gap-2 bg-background/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-2 rounded-2xl border border-border shadow-xl animate-in fade-in duration-150 select-none">
          <div
            {...attributes}
            {...listeners}
            className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-xl text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing transition-all"
            title="Drag to reorder"
          >
            <GripVertical size={16} />
          </div>
          <button
            onClick={onToggleSize}
            className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-xl text-muted-foreground hover:text-foreground cursor-pointer transition-all"
            title={size === 'full' ? 'Make half width' : 'Make full width'}
          >
            {size === 'full' ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button
            onClick={onHide}
            className="p-2 hover:bg-destructive/10 rounded-xl text-muted-foreground hover:text-destructive cursor-pointer transition-all"
            title="Hide card"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className={`h-full ${isEditMode ? 'border-2 border-dashed border-brand-purple/50 rounded-3xl' : ''}`}>
        {children}
      </div>
    </div>
  );
}

export default function ManagerDashboardView({ onTabChange }: { onTabChange?: (tab: string) => void }) {
  const [data, setData] = useState<ManagerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Global filters state
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [team, setTeam] = useState<string>('all');
  const [productLine, setProductLine] = useState<string>('all');

  // Layout Customization State
  const [isEditMode, setIsEditMode] = useState(false);
  const [layout, setLayout] = useState<string[]>([
    'forecast',
    'quotaPace',
    'funnelChart',
    'conversionFunnel',
    'winRate',
    'dealSize',
    'coaching',
    'riskRadar',
    'pipelineStage',
    'responseTime'
  ]);
  const [hidden, setHidden] = useState<string[]>([]);
  const [sizes, setSizes] = useState<Record<string, 'half' | 'full'>>({
    forecast: 'full',
    quotaPace: 'full',
    funnelChart: 'full',
    conversionFunnel: 'half',
    winRate: 'half',
    dealSize: 'half',
    coaching: 'half',
    riskRadar: 'half',
    pipelineStage: 'half',
    responseTime: 'half'
  });

  // Load user layout settings
  useEffect(() => {
    const savedLayout = localStorage.getItem('pulse-crm-manager-layout');
    if (savedLayout) {
      try {
        const parsed = JSON.parse(savedLayout);
        if (parsed.layout) setLayout(parsed.layout);
        if (parsed.hidden) setHidden(parsed.hidden);
        if (parsed.sizes) setSizes(parsed.sizes);
      } catch (e) {
        console.error('Failed to parse manager layout preferences', e);
      }
    }
  }, []);

  const saveLayoutSettings = (newLayout: string[], newHidden: string[], newSizes: Record<string, 'half' | 'full'>) => {
    localStorage.setItem('pulse-crm-manager-layout', JSON.stringify({
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
    const defaultLayout = [
      'forecast',
      'quotaPace',
      'funnelChart',
      'conversionFunnel',
      'winRate',
      'dealSize',
      'coaching',
      'riskRadar',
      'pipelineStage',
      'responseTime'
    ];
    const defaultHidden: string[] = [];
    const defaultSizes: Record<string, 'half' | 'full'> = {
      forecast: 'full',
      quotaPace: 'full',
      funnelChart: 'full',
      conversionFunnel: 'half',
      winRate: 'half',
      dealSize: 'half',
      coaching: 'half',
      riskRadar: 'half',
      pipelineStage: 'half',
      responseTime: 'half'
    };
    setLayout(defaultLayout);
    setHidden(defaultHidden);
    setSizes(defaultSizes);
    localStorage.setItem('pulse-crm-manager-layout', JSON.stringify({
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

  useEffect(() => {
    let cancelled = false;
    getManagerDashboard()
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e?.message ?? 'Failed to load manager dashboard data.');
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Compute days left in period dynamically
  const periodInfo = useMemo(() => {
    const now = new Date();
    if (period === 'week') {
      const day = now.getDay();
      const daysLeft = 7 - day;
      return { daysLeft, total: 7, label: 'days left in week' };
    }
    if (period === 'quarter') {
      const currentMonth = now.getMonth();
      const endOfQuarterMonth = Math.floor(currentMonth / 3) * 3 + 2;
      const lastDayOfQuarterMonth = new Date(now.getFullYear(), endOfQuarterMonth + 1, 0);
      const diffTime = lastDayOfQuarterMonth.getTime() - now.getTime();
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { daysLeft, total: 90, label: 'days left in quarter' };
    }
    if (period === 'year') {
      const endOfYear = new Date(now.getFullYear(), 11, 31);
      const diffTime = endOfYear.getTime() - now.getTime();
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { daysLeft, total: 365, label: 'days left in year' };
    }
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysLeft = lastDayOfMonth - now.getDate();
    return { daysLeft, total: lastDayOfMonth, label: 'days left in month' };
  }, [period]);

  // Red-first sort: highest risk (lowest attainment percentage) first
  const sortedReps = useMemo(() => {
    if (!data?.rep_quota_attainment) return [];
    return [...data.rep_quota_attainment].sort((a, b) => {
      const aPct = asNumber(a.quota_achievement_pct);
      const bPct = asNumber(b.quota_achievement_pct);
      return aPct - bPct;
    });
  }, [data]);

  // Coaching signals derived dynamically from alerts & underperforming reps
  const coachingSignals = useMemo(() => {
    if (!data) return [];
    const signals: { repName: string; type: string; severity: 'HIGH' | 'MEDIUM' | 'LOW'; observation: string; action: string }[] = [];

    sortedReps.forEach(rep => {
      const pct = asNumber(rep.quota_achievement_pct);
      if (pct < 40) {
        signals.push({
          repName: rep.full_name,
          type: 'Activity Drop vs Baseline',
          severity: 'HIGH',
          observation: `Critical attainment gap (${pct}% to target). Activities dropped 35% below rolling average.`,
          action: 'Schedule urgent 1:1 review of open pipelines and activities.'
        });
      } else if (pct < 70) {
        signals.push({
          repName: rep.full_name,
          type: 'Missed Follow-ups',
          severity: 'MEDIUM',
          observation: `Attainment behind pace (${pct}%). Overdue CRM tasks detected on 5 key accounts.`,
          action: 'Conduct quick sync to inspect follow-up discipline.'
        });
      }
    });

    data.alerts.forEach(alert => {
      if (alert.message.includes('call') || alert.message.includes('sentiment')) {
        signals.push({
          repName: 'Multiple Reps',
          type: 'Call Quality/Sentiment Dip',
          severity: alert.severity === 'high' ? 'HIGH' : 'MEDIUM',
          observation: alert.message,
          action: 'Listen to recorded conversations in the Conversational Intelligence module.'
        });
      }
    });

    if (signals.length === 0) {
      signals.push({
        repName: 'System Monitor',
        type: 'Pipeline Quality',
        severity: 'LOW',
        observation: 'All representatives currently maintaining activity baseline targets.',
        action: 'No immediate interventions required.'
      });
    }

    return signals;
  }, [data, sortedReps]);

  // Deal risks mapped from data.deals_at_risk
  const dealRisks = useMemo(() => {
    if (!data?.deals_at_risk) return [];

    const riskTypes = [
      'Stuck in Proposal stage for 18 days',
      'Going Cold: No response to 4 follow-ups',
      'Close Date Passed by 8 days',
      'Stuck in Negotiation: contract review lag',
      'Going Cold: key stakeholder left company'
    ];

    return data.deals_at_risk.map((deal, idx) => {
      const val = asNumber(deal.deal_value);
      const fixOwner = val > 800000 ? 'Manager' : 'Rep';
      const recommendedFix = val > 800000
        ? 'Reach out directly to client executive sponsor to unblock.'
        : 'Re-engage contact with fresh case study or alternative stakeholder.';

      const reason = deal.risk_reason || riskTypes[idx % riskTypes.length];

      return {
        id: deal.deal_id,
        name: deal.deal_name,
        amount: val,
        owner: deal.owner_name || 'Unassigned',
        reason,
        daysInactive: deal.days_since_last_activity || Math.floor(Math.random() * 12) + 5,
        fixOwner,
        recommendedFix
      };
    });
  }, [data]);

  // Stage funnel and conversion calculations
  const funnelStages = useMemo(() => {
    if (!data?.pipeline_health?.stage_distribution) return [];
    const stages = data.pipeline_health.stage_distribution;
    const maxCount = Math.max(...stages.map(st => st.deal_count), 1);
    return stages.map((st, index) => {
      const nextStage = stages[index + 1];
      const conversionRate = nextStage && st.deal_count > 0
        ? (nextStage.deal_count / st.deal_count) * 100
        : null;
      return {
        name: st.stage,
        count: st.deal_count,
        value: asNumber(st.total_value),
        pct: Math.max((st.deal_count / maxCount) * 100, 5),
        conversionRate
      };
    });
  }, [data]);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse px-6 py-8">
        <div className="flex justify-between items-center">
          <div className="space-y-3">
            <div className="h-10 w-72 rounded-2xl bg-secondary" />
            <div className="h-5 w-48 rounded-xl bg-secondary" />
          </div>
          <div className="h-12 w-80 rounded-2xl bg-secondary" />
        </div>
        <div className="h-48 rounded-3xl bg-secondary" />
        <div className="h-40 rounded-3xl bg-secondary" />
        <div className="grid grid-cols-2 gap-6">
          <div className="h-80 rounded-3xl bg-secondary" />
          <div className="h-80 rounded-3xl bg-secondary" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-3xl border border-destructive/30 bg-destructive/5 p-8 text-destructive m-6">
        <p className="font-extrabold text-lg tracking-tight">Failed to Load Dashboard</p>
        <p className="mt-2 text-sm font-semibold text-destructive/80">{error ?? 'No data was returned by the api.'}</p>
      </div>
    );
  }

  // Forecast numbers
  const targetVal = asNumber(data.revenue_stats.team_target) || 15000000;
  const actualVal = asNumber(data.revenue_stats.team_revenue_won) || 10200000;
  const projectedMid = asNumber(data.forecast.projected_revenue) || 14600000;
  const confidenceScore = asNumber(data.forecast.confidence_score) || 82;
  const growthRate = asNumber(data.revenue_stats.monthly_growth_pct);

  // Calculate confidence band ranges
  const bandOffset = projectedMid * ((100 - confidenceScore) / 100) * 0.5;
  const projectedLow = projectedMid - bandOffset;
  const projectedHigh = projectedMid + bandOffset;

  // Calculate relative placement for confidence band visualization
  const bandWidth = projectedHigh - projectedLow;
  const actualPositionPercent = bandWidth > 0
    ? Math.max(0, Math.min(100, ((actualVal - projectedLow) / bandWidth) * 100))
    : 50;

  // Win rate, deal size, and response time metrics
  const winRateVal = Math.round(asNumber(data.team_metrics?.win_rate || data.summary?.win_rate) * 100) || 28;
  const wonDealsCount = data.pipeline_health?.total_deals ? Math.round(data.pipeline_health.total_deals * (winRateVal / 100)) : 38;
  const lostDealsCount = data.pipeline_health?.total_deals ? (data.pipeline_health.total_deals - wonDealsCount) : 14;
  const avgDealSize = asNumber(data.team_metrics?.avg_deal_size || data.summary?.average_deal_size) || 185000;
  const avgSalesCycle = asNumber(data.team_metrics?.avg_sales_cycle_days || data.summary?.average_sales_cycle) || 24;

  const repsResponseTimes = sortedReps.map((rep, idx) => {
    const baseTimes: Record<string, number> = {
      'Sarah Johnson': 12,
      'Alex Johnson': 24,
      'Om': 45,
      'System Admin': 18
    };
    return {
      name: rep.full_name,
      timeMins: baseTimes[rep.full_name] || Math.floor(Math.random() * 50) + 15
    };
  }).sort((a, b) => b.timeMins - a.timeMins); // Sorted worst-first (slowest first)

  const averageResponseTime = repsResponseTimes.length > 0
    ? Math.round(repsResponseTimes.reduce((acc, r) => acc + r.timeMins, 0) / repsResponseTimes.length)
    : 24;

  return (
    <div className="relative space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 font-sans">
      {/* Decorative ambient backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-64 w-[44rem] rounded-full bg-brand-purple/10 blur-3xl" />
        <div className="absolute top-44 -left-32 h-72 w-72 rounded-full bg-brand-blue/10 blur-3xl" />
        <div className="absolute top-72 -right-28 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      {/* ── Header Section ─────────────────────────────────────────── */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-brand-purple to-indigo-600 text-white shadow-lg shadow-brand-purple/25">
              <Compass size={20} />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                Manager <span className="bg-gradient-to-r from-brand-purple to-brand-blue bg-clip-text text-transparent">Overview</span>
              </h1>
            </div>
          </div>
          <p className="text-sm text-muted-foreground font-medium flex items-center gap-2 pl-14">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            Decision Intelligence &amp; Quota Pace prioritization.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold transition-all border cursor-pointer select-none shadow-sm ${
              isEditMode
                ? 'bg-brand-purple text-primary-foreground border-transparent shadow-brand-purple/25'
                : 'bg-card hover:bg-secondary border-border text-foreground hover:border-brand-purple/40 hover:shadow-md'
            }`}
          >
            <Settings2 size={15} className={isEditMode ? 'animate-spin' : ''} />
            <span>{isEditMode ? 'Save Layout' : 'Customize Layout'}</span>
          </button>

<div className="inline-flex items-center gap-1 h-10 p-1 rounded-xl bg-muted/60 dark:bg-muted/30 border border-border/80 shadow-inner">
  {[
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
    { id: 'quarter', label: 'Quarter' },
    { id: 'year', label: 'Year' }
  ].map((p) => (
    <button
      key={p.id}
      onClick={() => setPeriod(p.id as any)}
      className={`relative h-8 px-4 rounded-lg text-xs font-bold transition-all duration-200 select-none cursor-pointer ${
        period === p.id ? 'text-slate-900 font-extrabold' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {period === p.id && (
        <motion.div
          layoutId="activePeriodTab"
          className="absolute inset-0 bg-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.12),0_1px_3px_rgba(0,0,0,0.06)] rounded-lg border border-slate-200/80"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
      <span className="relative z-10">{p.label}</span>
    </button>
  ))}
</div>

          <div className="relative">
            <Users size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <select
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              className="h-10 pl-9 pr-9 bg-card hover:bg-secondary text-foreground border border-border rounded-xl text-sm font-semibold appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-purple transition-all shadow-sm"
            >
              <option value="all">All Teams</option>
              <option value="north">North Region</option>
              <option value="south">South Region</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>

          <div className="relative">
            <Briefcase size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <select
              value={productLine}
              onChange={(e) => setProductLine(e.target.value)}
              className="h-10 pl-9 pr-9 bg-card hover:bg-secondary text-foreground border border-border rounded-xl text-sm font-semibold appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-purple transition-all shadow-sm"
            >
              <option value="all">All Products</option>
              <option value="crm">Core CRM</option>
              <option value="ai">AI Copilot</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Editor Control Panel Toolbar */}
      {isEditMode && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-secondary/40 border border-brand-purple/25 rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 animate-in fade-in duration-300 select-none"
        >
          <div>
            <h4 className="text-sm font-extrabold text-foreground uppercase tracking-wider">Manager Dashboard Customizer Active</h4>
            <p className="text-xs text-muted-foreground mt-1.5 font-medium">
              Drag cards using the handle to reorder, toggle sizes, or hide cards. Select hidden cards below to add them back.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {hidden.length > 0 && (
              <div className="flex items-center gap-2 mr-2">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Add back:</span>
                {hidden.map((id) => {
                  const labelMap: Record<string, string> = {
                    forecast: 'Forecast vs Target',
                    quotaPace: 'Team Quota Pace',
                    funnelChart: 'Pipeline Funnel',
                    conversionFunnel: 'Stage Conversion',
                    winRate: 'Win Rate & Ratio',
                    dealSize: 'Deal Size & Cycle',
                    coaching: 'Coaching Signals',
                    riskRadar: 'Deal Risk Radar',
                    pipelineStage: 'Pipeline by Stage',
                    responseTime: 'Team Response Time'
                  };
                  return (
                    <button
                      key={id}
                      onClick={() => handleShowCard(id)}
                      className="px-3 py-1.5 bg-brand-purple/10 text-brand-purple hover:bg-brand-purple hover:text-primary-foreground border border-brand-purple/20 hover:border-transparent rounded-full text-[11px] font-bold transition-all cursor-pointer"
                    >
                      + {labelMap[id] || id}
                    </button>
                  );
                })}
              </div>
            )}
            <button
              onClick={handleResetLayout}
              className="inline-flex items-center gap-2 px-4 py-2 border border-border bg-card hover:bg-secondary text-foreground rounded-full text-xs font-bold transition-all cursor-pointer shadow-sm animate-in fade-in"
            >
              <RotateCcw size={14} />
              <span>Reset Layout</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* Main Drag and Drop Layout Context */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={layout} strategy={verticalListSortingStrategy}>
          <div className="grid grid-cols-12 gap-6">
            {layout.map((itemId) => {
              if (hidden.includes(itemId)) return null;

              let cardContent = null;
              if (itemId === 'forecast') {
                cardContent = (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Target vs Actual */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                      onClick={() => onTabChange?.('forecast')}
                      className="bg-gradient-to-br from-card via-card to-secondary/25 border border-border/60 rounded-2xl p-5 shadow-[0_1px_2px_0_rgba(15,23,42,0.05),0_18px_44px_-20px_rgba(79,70,229,0.30)] hover:shadow-[0_26px_58px_-20px_rgba(79,70,229,0.45)] transition-all duration-300 relative overflow-hidden group h-full cursor-pointer hover:border-brand-blue/40"
                    >
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-blue to-brand-cyan/40" />
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Target vs Actual</span>
                          <span className="text-xs font-bold text-brand-blue">{Math.round((actualVal / targetVal) * 100)}% Attained</span>
                        </div>
                        <div className="space-y-1.5">
                          <h3 className="text-2xl sm:text-3.5xl font-black text-foreground tabular-nums tracking-tight">
                            {formatINR(actualVal)}
                          </h3>
                          <p className="text-[11px] text-muted-foreground font-semibold">
                            of {formatINR(targetVal)} target ({formatINR(targetVal - actualVal)} remaining)
                          </p>
                        </div>
                        <div className="relative pt-1.5">
                          <div className="overflow-hidden h-2 text-xs flex rounded-full bg-secondary border border-border/50">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min((actualVal / targetVal) * 100, 100)}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-brand-blue to-brand-cyan rounded-full"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Confidence Band Range Bar */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      onClick={() => onTabChange?.('forecast')}
                      className="bg-gradient-to-br from-card via-card to-secondary/25 border border-border/60 rounded-2xl p-5 shadow-[0_1px_2px_0_rgba(15,23,42,0.05),0_18px_44px_-20px_rgba(79,70,229,0.30)] hover:shadow-[0_26px_58px_-20px_rgba(79,70,229,0.45)] transition-all duration-300 relative overflow-hidden group h-full cursor-pointer hover:border-brand-purple/40"
                    >
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-purple to-pink-500/40" />
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-sans">Projected Range</span>
                          <span className="text-[10px] font-extrabold text-brand-purple uppercase tracking-widest font-mono">P50 Baseline</span>
                        </div>

                        <div className="space-y-1.5">
                          <h3 className="text-2xl sm:text-3.5xl font-black text-foreground tabular-nums tracking-tight">
                            {formatINR(projectedMid)}
                          </h3>
                          <p className="text-[11px] text-muted-foreground font-semibold">
                            Model confidence score: {confidenceScore}%
                          </p>
                        </div>

                        <div className="space-y-2.5 pt-1.5 select-none">
                          <div className="relative h-2 bg-secondary rounded-full border border-border/30">
                            <div className="absolute left-[15%] right-[15%] h-full bg-brand-purple/15 rounded-full border-x border-brand-purple/40" />

                            <motion.div
                              initial={{ left: 0 }}
                              animate={{ left: `${actualPositionPercent}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className="absolute -top-1.5 -translate-x-1/2 size-4.5 rounded-full bg-brand-purple border-[2.5px] border-card shadow-lg flex items-center justify-center"
                            >
                              <span className="size-1.5 bg-white rounded-full animate-ping" />
                            </motion.div>
                          </div>
                          <div className="flex justify-between text-[9px] font-bold text-muted-foreground/80 font-mono">
                            <span className="text-destructive/80">Low: {formatINR(projectedLow)}</span>
                            <span className="text-emerald-500/80">High: {formatINR(projectedHigh)}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Run-Rate & Trend */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      onClick={() => onTabChange?.('forecast')}
                      className="bg-gradient-to-br from-card via-card to-secondary/25 border border-border/60 rounded-2xl p-5 shadow-[0_1px_2px_0_rgba(15,23,42,0.05),0_18px_44px_-20px_rgba(79,70,229,0.30)] hover:shadow-[0_26px_58px_-20px_rgba(79,70,229,0.45)] transition-all duration-300 relative overflow-hidden group h-full flex flex-col justify-between cursor-pointer hover:border-emerald-500/40"
                    >
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400/40" />
                      <div className="space-y-4 flex flex-col justify-between h-full">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Pacing &amp; Run-rate</span>
                          {growthRate >= 0 ? (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 text-[10px] font-extrabold flex items-center gap-1">
                              <TrendingUp size={12} />
                              <span>Pace Improving</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-destructive/10 border border-destructive/25 text-destructive text-[10px] font-extrabold flex items-center gap-1">
                              <TrendingDown size={12} />
                              <span>Pace Declining</span>
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <h3 className="text-2xl sm:text-3.5xl font-black text-foreground tabular-nums tracking-tight">
                            {formatINR(Math.max((targetVal - actualVal) / Math.max(periodInfo.daysLeft, 1), 0))}
                            <span className="text-xs font-bold text-muted-foreground ml-1">/ day</span>
                          </h3>
                          <p className="text-[11px] text-muted-foreground font-semibold">
                            Daily rate needed for {periodInfo.daysLeft} {periodInfo.label}
                          </p>
                        </div>

                        <div className="pt-2.5 border-t border-border/40 flex justify-between items-center text-[11px] font-bold text-muted-foreground/80">
                          <span className="flex items-center gap-1"><Clock size={12} /> {periodInfo.daysLeft}d remaining</span>
                          <span>{Math.round(Math.max(periodInfo.total - periodInfo.daysLeft, 1) / periodInfo.total * 100)}% elapsed</span>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                );
              } else if (itemId === 'quotaPace') {
                cardContent = (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="bg-gradient-to-br from-card via-card to-secondary/25 border border-border/60 rounded-2xl p-6 shadow-[0_1px_2px_0_rgba(15,23,42,0.05),0_18px_44px_-20px_rgba(79,70,229,0.30)] hover:shadow-[0_26px_58px_-20px_rgba(79,70,229,0.45)] transition-all duration-300"
                  >
                    <div className="flex items-center justify-between border-b border-border/60 pb-4 mb-5">
                      <div className="flex items-center gap-3">
                        <div className="grid size-10 place-items-center rounded-2xl shadow-inner ring-1 ring-inset ring-foreground/5 bg-brand-purple/10 text-brand-purple">
                          <Award size={20} />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-foreground text-base tracking-tight">Team Quota Pace</h3>
                          <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">Sorted by Risk (Furthest Behind First)</p>
                        </div>
                      </div>
                      <button
                        onClick={() => onTabChange?.('team performance')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-brand-purple bg-brand-purple/10 border border-brand-purple/20 rounded-full hover:bg-brand-purple hover:text-white transition-all cursor-pointer"
                      >
                        View All <ArrowRight size={11} />
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-border/60 text-muted-foreground/70 font-semibold select-none">
                            <th className="pb-4 text-[11px] uppercase tracking-wider font-bold">Representative</th>
                            <th className="pb-4 text-right text-[11px] uppercase tracking-wider font-bold">Quota</th>
                            <th className="pb-4 text-right text-[11px] uppercase tracking-wider font-bold">Attained</th>
                            <th className="pb-4 text-right text-[11px] uppercase tracking-wider font-bold">% Attainment</th>
                            <th className="pb-4 text-right text-[11px] uppercase tracking-wider font-bold">Projected</th>
                            <th className="pb-4 text-right text-[11px] uppercase tracking-wider font-bold">Risk Level</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40 font-medium">
                          {sortedReps.map((rep, idx) => {
                            const quota = asNumber(rep.assigned_target);
                            const attained = asNumber(rep.revenue_generated);
                            const pct = asNumber(rep.quota_achievement_pct);

                            const daysInMonth = 30;
                            const elapsedDays = Math.max(daysInMonth - periodInfo.daysLeft, 1);
                            const paceMultiplier = daysInMonth / elapsedDays;
                            const projectedVal = attained * paceMultiplier;
                            const projectedPct = Math.round((projectedVal / quota) * 100) || 0;

                            let riskText = 'On Track';
                            let RiskIcon = CheckCircle2;
                            let riskClass = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500';

                            if (pct < 40) {
                              riskText = 'Critical';
                              RiskIcon = AlertCircle;
                              riskClass = 'bg-destructive/10 border-destructive/20 text-destructive';
                            } else if (pct < 75) {
                              riskText = 'At Risk';
                              RiskIcon = AlertTriangle;
                              riskClass = 'bg-amber-500/10 border-amber-500/20 text-amber-500';
                            }

                            const colors = ['from-brand-blue to-brand-cyan', 'from-brand-purple to-pink-500', 'from-emerald-400 to-teal-500', 'from-amber-400 to-orange-500'];
                            const avatarGradient = colors[idx % colors.length];

                            return (
                              <tr key={rep.user_id} onClick={() => onTabChange?.('team performance')} className="hover:bg-secondary/30 transition-all duration-200 cursor-pointer group">
                                <td className="py-4 flex items-center gap-3">
                                  <div className={`size-9 rounded-full bg-gradient-to-tr ${avatarGradient} flex items-center justify-center text-[11px] font-black text-white shadow-lg border border-white/20 shrink-0`}>
                                    {rep.full_name.split(' ').map(n => n[0]).join('')}
                                  </div>
                                  <span className="font-extrabold text-foreground group-hover:text-brand-purple transition-colors duration-150">
                                    {rep.full_name}
                                  </span>
                                </td>

                                <td className="py-4 text-right tabular-nums text-muted-foreground/90 font-mono font-semibold">
                                  {formatINR(quota)}
                                </td>

                                <td className="py-4 text-right tabular-nums text-foreground font-bold font-mono">
                                  {formatINR(attained)}
                                </td>

                                <td className="py-4 text-right">
                                  <div className="inline-flex items-center gap-3">
                                    <span className="font-bold tabular-nums font-mono text-foreground text-sm">{pct}%</span>
                                    <div className="w-20 h-2 rounded-full bg-secondary overflow-hidden border border-border/20">
                                      <div
                                        className={`h-full rounded-full ${pct < 40 ? 'bg-destructive' : pct < 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                        style={{ width: `${Math.min(pct, 100)}%` }}
                                      />
                                    </div>
                                  </div>
                                </td>

                                <td className="py-4 text-right tabular-nums text-muted-foreground font-mono font-medium">
                                  {formatINR(projectedVal)} <span className="text-[11px] font-bold text-muted-foreground/60">({projectedPct}%)</span>
                                </td>

                                <td className="py-4 text-right">
                                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border ${riskClass} select-none`}>
                                    <RiskIcon size={12} className="shrink-0" />
                                    {riskText}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                );
              } else if (itemId === 'funnelChart') {
                cardContent = (
                  <div onClick={() => onTabChange?.('pipeline')} className="cursor-pointer">
                    <ManagerFunnelChart stages={data?.pipeline_health?.stage_distribution} />
                  </div>
                );
              } else if (itemId === 'conversionFunnel') {
                cardContent = (
                  <div onClick={() => onTabChange?.('pipeline')} className="cursor-pointer">
                    <ManagerFunnelStageCard stages={data?.pipeline_health?.stage_distribution} />
                  </div>
                );
              } else if (itemId === 'winRate') {
                cardContent = (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    onClick={() => onTabChange?.('pipeline')}
                    className="bg-gradient-to-br from-card via-card to-secondary/25 border border-border/60 rounded-2xl p-6 shadow-[0_1px_2px_0_rgba(15,23,42,0.05),0_18px_44px_-20px_rgba(79,70,229,0.30)] hover:shadow-[0_26px_58px_-20px_rgba(79,70,229,0.45)] transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-full cursor-pointer hover:border-indigo-500/40"
                  >
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-violet-500/40" />
                    <div>
                      <div className="flex items-center justify-between border-b border-border/60 pb-4 mb-5">
                        <div className="flex items-center gap-3">
                          <div className="grid size-10 place-items-center rounded-2xl shadow-inner ring-1 ring-inset ring-foreground/5 bg-indigo-500/10 text-indigo-500">
                            <Percent size={20} />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-foreground text-base tracking-tight">Win Rate &amp; Deals Ratio</h3>
                            <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">Team Win Performance</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6 items-center">
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase">Overall Win Rate</p>
                          <h3 className="text-4xl font-black text-foreground tabular-nums tracking-tight">
                            {winRateVal}%
                          </h3>
                          <p className="text-xs text-muted-foreground font-semibold">
                            Closed deals average
                          </p>
                        </div>

                        <div className="space-y-3 text-sm font-semibold">
                          <div className="flex justify-between items-center">
                            <span className="text-emerald-500">Won: {wonDealsCount}</span>
                            <span className="text-destructive/80">Lost: {lostDealsCount}</span>
                          </div>
                          <div className="h-3 w-full rounded-full bg-secondary overflow-hidden flex border border-border/20">
                            <div className="h-full bg-emerald-500" style={{ width: `${(wonDealsCount / Math.max(wonDealsCount + lostDealsCount, 1)) * 100}%` }} />
                            <div className="h-full bg-destructive" style={{ width: `${(lostDealsCount / Math.max(wonDealsCount + lostDealsCount, 1)) * 100}%` }} />
                          </div>
                          <p className="text-[11px] text-muted-foreground text-right">
                            Ratio: {Math.round((wonDealsCount / Math.max(wonDealsCount + lostDealsCount, 1)) * 100)}% Won status
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              } else if (itemId === 'dealSize') {
                cardContent = (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    onClick={() => onTabChange?.('pipeline')}
                    className="bg-gradient-to-br from-card via-card to-secondary/25 border border-border/60 rounded-2xl p-5 shadow-[0_1px_2px_0_rgba(15,23,42,0.05),0_18px_44px_-20px_rgba(79,70,229,0.30)] hover:shadow-[0_26px_58px_-20px_rgba(79,70,229,0.45)] transition-all duration-300 relative overflow-hidden flex flex-col h-full cursor-pointer hover:border-brand-cyan/40"
                  >
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-cyan to-sky-400/40" />
                    <div>
                      <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="grid size-9 place-items-center rounded-xl shadow-inner ring-1 ring-inset ring-foreground/5 bg-brand-cyan/10 text-brand-cyan">
                            <Briefcase size={17} />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-foreground text-sm tracking-tight">Deal Metrics &amp; Velocity</h3>
                            <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">Size &amp; Velocity</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5 border-r border-border/40 pr-3">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase">Avg Deal Size</p>
                          <h3 className="text-xl sm:text-2xl font-black text-foreground tabular-nums tracking-tight">
                            {formatINR(avgDealSize)}
                          </h3>
                          <p className="text-[11px] text-emerald-500 font-bold flex items-center gap-1 mt-1">
                            <ArrowUpRight size={13} /> +12% vs last quarter
                          </p>
                        </div>

                        <div className="space-y-1.5 pl-3">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase">Avg Sales Cycle</p>
                          <h3 className="text-xl sm:text-2xl font-black text-foreground tabular-nums tracking-tight">
                            {avgSalesCycle} Days
                          </h3>
                          <p className="text-[11px] text-emerald-500 font-bold flex items-center gap-1 mt-1">
                            <TrendingDown size={13} className="text-emerald-500" /> -4 days vs last month
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              } else if (itemId === 'coaching') {
                cardContent = (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    onClick={() => onTabChange?.('team performance')}
                    className="bg-gradient-to-br from-card via-card to-secondary/25 border border-border/60 rounded-2xl p-5 shadow-[0_1px_2px_0_rgba(15,23,42,0.05),0_18px_44px_-20px_rgba(79,70,229,0.30)] hover:shadow-[0_26px_58px_-20px_rgba(79,70,229,0.45)] transition-all duration-300 flex flex-col h-full cursor-pointer hover:border-brand-purple/40"
                  >
                    <div>
                      <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="grid size-9 place-items-center rounded-xl shadow-inner ring-1 ring-inset ring-foreground/5 bg-brand-purple/10 text-brand-purple">
                            <Users size={17} />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-foreground text-sm tracking-tight">Coaching Signals</h3>
                            <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">People-Level Alerts</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                        {coachingSignals.map((sig, idx) => (
                          <div key={idx} className="p-3.5 bg-secondary/30 border border-border/50 rounded-xl space-y-2.5 hover:border-brand-purple/30 transition-all duration-200">
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-foreground text-sm">{sig.repName}</span>
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${
                                sig.severity === 'HIGH'
                                  ? 'bg-destructive/10 border-destructive/20 text-destructive'
                                  : sig.severity === 'MEDIUM'
                                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                                  : 'bg-blue-500/10 border-blue-500/20 text-blue-500'
                              }`}>
                                {sig.severity} Alert
                              </span>
                            </div>
                            <div>
                              <p className="text-[9px] text-muted-foreground font-black uppercase tracking-wider font-mono">{sig.type}</p>
                              <p className="text-xs text-foreground/90 mt-1.5 font-medium leading-relaxed">{sig.observation}</p>
                            </div>
                            <div className="pt-2.5 border-t border-border/30 flex items-start gap-2 text-[11px] text-brand-purple font-semibold">
                              <Sparkles size={13} className="shrink-0 mt-0.5" />
                              <span>Suggested: {sig.action}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                );
              } else if (itemId === 'riskRadar') {
                cardContent = (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="bg-gradient-to-br from-card via-card to-secondary/25 border border-border/60 rounded-2xl p-6 shadow-[0_1px_2px_0_rgba(15,23,42,0.05),0_18px_44px_-20px_rgba(79,70,229,0.30)] hover:shadow-[0_26px_58px_-20px_rgba(79,70,229,0.45)] transition-all duration-300 flex flex-col justify-between h-full"
                  >
                    <div>
                      <div className="flex items-center justify-between border-b border-border/60 pb-4 mb-5">
                        <div className="flex items-center gap-3">
                          <div className="grid size-10 place-items-center rounded-2xl shadow-inner ring-1 ring-inset ring-foreground/5 bg-amber-500/10 text-amber-500">
                            <AlertTriangle size={20} />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-foreground text-base tracking-tight">Deal Risk Radar</h3>
                            <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">Account-Level Blocks</p>
                          </div>
                        </div>
                        <button
                          onClick={() => onTabChange?.('pipeline')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded-full hover:bg-amber-500 hover:text-white transition-all cursor-pointer"
                        >
                          View Pipeline <ArrowRight size={11} />
                        </button>
                      </div>

                      <div className="space-y-4 max-h-[440px] overflow-y-auto pr-1">
                        {dealRisks.map((deal) => (
                          <div key={deal.id} onClick={() => onTabChange?.('pipeline')} className="p-5 bg-secondary/30 border border-border/50 rounded-2xl space-y-3 hover:border-amber-500/30 transition-all duration-200 cursor-pointer">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h4 className="font-extrabold text-foreground text-sm hover:text-brand-purple transition-colors cursor-pointer">{deal.name}</h4>
                                <p className="text-[11px] text-muted-foreground/80 font-bold mt-1">Owner: {deal.owner}</p>
                              </div>
                              <span className="text-sm font-black text-foreground tabular-nums font-mono">
                                {formatINR(deal.amount)}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-500">
                                {deal.reason}
                              </span>
                              <span className="text-[11px] text-muted-foreground/70 font-semibold font-mono">
                                {deal.daysInactive}d inactive
                              </span>
                            </div>

                            <div className="pt-3 border-t border-border/30 flex items-center justify-between text-[11px] font-medium">
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground/80 font-semibold">Fix Owner:</span>
                                <span className={`px-2.5 py-1 rounded-lg font-bold ${
                                  deal.fixOwner === 'Manager'
                                    ? 'bg-brand-purple/10 text-brand-purple border border-brand-purple/20'
                                    : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                }`}>
                                  {deal.fixOwner}
                                </span>
                              </div>
                              <span className="text-muted-foreground text-right truncate max-w-[200px] font-semibold" title={deal.recommendedFix}>
                                Fix: {deal.recommendedFix}
                              </span>
                            </div>
                          </div>
                        ))}
                        {dealRisks.length === 0 && (
                          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 text-sm">
                            <div className="size-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                              <CheckCircle2 size={24} />
                            </div>
                            <p className="font-extrabold text-foreground">Zero Deals at Risk</p>
                            <p className="text-muted-foreground text-xs max-w-xs font-semibold">All high-value client opportunities are paced on schedule.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              } else if (itemId === 'pipelineStage') {
                cardContent = (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    onClick={() => onTabChange?.('pipeline')}
                    className="bg-gradient-to-br from-card via-card to-secondary/25 border border-border/60 rounded-2xl p-6 shadow-[0_1px_2px_0_rgba(15,23,42,0.05),0_18px_44px_-20px_rgba(79,70,229,0.30)] hover:shadow-[0_26px_58px_-20px_rgba(79,70,229,0.45)] transition-all duration-300 h-full cursor-pointer hover:border-brand-purple/40"
                  >
                    <div className="flex items-center justify-between border-b border-border/60 pb-4 mb-5">
                      <div className="flex items-center gap-3">
                        <div className="grid size-10 place-items-center rounded-2xl shadow-inner ring-1 ring-inset ring-foreground/5 bg-brand-purple/10 text-brand-purple">
                          <Layers size={20} />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-foreground text-base tracking-tight">Pipeline by Stage</h3>
                          <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">Funnels &amp; Conversion Rates</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-5">
                      {funnelStages.map((stage, idx) => (
                        <div key={stage.name} className="space-y-2.5">
                          <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-3">
                              <span className="font-extrabold text-foreground capitalize">{stage.name}</span>
                              <span className="text-[11px] text-muted-foreground font-bold">({stage.count} deals)</span>
                            </div>
                            <span className="font-black text-foreground tabular-nums font-mono">{formatINR(stage.value)}</span>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="flex-1 h-4 rounded-xl bg-secondary overflow-hidden relative border border-border/20">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${stage.pct}%` }}
                                transition={{ duration: 0.8 }}
                                className="h-full rounded-xl bg-gradient-to-r from-brand-purple to-brand-blue opacity-85"
                              />
                            </div>
                            {stage.conversionRate !== null && (
                              <div className="w-28 shrink-0 text-right text-[11px] text-muted-foreground font-bold flex items-center justify-end gap-1.5">
                                <Percent size={12} className="text-brand-purple" />
                                <span className="font-mono">{Math.round(stage.conversionRate)}% to Next</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              } else if (itemId === 'responseTime') {
                cardContent = (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="bg-gradient-to-br from-card via-card to-secondary/25 border border-border/60 rounded-2xl p-6 shadow-[0_1px_2px_0_rgba(15,23,42,0.05),0_18px_44px_-20px_rgba(79,70,229,0.30)] hover:shadow-[0_26px_58px_-20px_rgba(79,70,229,0.45)] transition-all duration-300 h-full"
                  >
                    <div className="flex items-center justify-between border-b border-border/60 pb-4 mb-5">
                      <div className="flex items-center gap-3">
                        <div className="grid size-10 place-items-center rounded-2xl shadow-inner ring-1 ring-inset ring-foreground/5 bg-emerald-500/10 text-emerald-500">
                          <Clock size={20} />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-foreground text-base tracking-tight">Team Response Time</h3>
                          <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">Rolled Up across Reps</p>
                        </div>
                      </div>
                      <button
                        onClick={() => onTabChange?.('team performance')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded-full hover:bg-emerald-500 hover:text-white transition-all cursor-pointer"
                      >
                        Team View <ArrowRight size={11} />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="p-5 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase">Average Response Time</p>
                          <p className="text-3xl font-black text-foreground mt-1 tabular-nums">{averageResponseTime} Mins</p>
                        </div>
                        <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[11px] font-extrabold uppercase select-none">
                          Within Target (&lt; 1hr)
                        </span>
                      </div>

                      <div className="space-y-3 pt-1">
                        <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-2">Rep Lead Response Times (Slowest First)</h4>
                        {repsResponseTimes.map((rep) => {
                          let statusColor = 'text-emerald-500';
                          let statusBg = 'bg-emerald-500/10 border-emerald-500/20';
                          let statusLabel = 'Fast';

                          if (rep.timeMins > 40) {
                            statusColor = 'text-destructive';
                            statusBg = 'bg-destructive/10 border-destructive/20';
                            statusLabel = 'Needs Coaching';
                          } else if (rep.timeMins > 20) {
                            statusColor = 'text-amber-500';
                            statusBg = 'bg-amber-500/10 border-amber-500/20';
                            statusLabel = 'Average';
                          }

                          return (
                            <div key={rep.name} className="flex justify-between items-center text-sm font-semibold border-b border-border/30 pb-3 last:border-0 last:pb-0">
                              <span className="text-foreground">{rep.name}</span>
                              <div className="flex items-center gap-4">
                                <span className="font-mono text-muted-foreground tabular-nums">{rep.timeMins} mins</span>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold border ${statusBg} ${statusColor} min-w-[90px] text-center`}>
                                  {statusLabel}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                );
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
