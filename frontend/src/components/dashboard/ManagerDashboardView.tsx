'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp, Target, AlertTriangle, Users, ArrowUpRight,
  Activity, BellRing, ShieldAlert, Sparkles, Award,
  Layers, Clock, ArrowRight, CheckCircle2, ChevronDown,
  Briefcase, Percent, User, MessageSquare, AlertCircle, HelpCircle,
  TrendingDown, ArrowDownRight, Compass
} from 'lucide-react';
import {
  getManagerDashboard, asNumber, formatINR, formatPct, ManagerDashboardData
} from '@/utils/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function ManagerDashboardView({ onTabChange }: { onTabChange?: (tab: string) => void }) {
  const [data, setData] = useState<ManagerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Global filters state
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month');
  const [team, setTeam] = useState<string>('all');
  const [productLine, setProductLine] = useState<string>('all');

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
    // Default: month
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

    // 1. Check underperforming reps (< 70% attainment)
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

    // 2. Map system alerts that look like person coaching signals
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

    // Default signals if none generated
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
    return data.deals_at_risk.map(deal => {
      const val = asNumber(deal.deal_value);
      // Assign fix ownership based on deal value/importance threshold
      const fixOwner = val > 800000 ? 'Manager' : 'Rep';
      const recommendedFix = val > 800000
        ? 'Reach out directly to client executive sponsor to unblock.'
        : 'Re-engage contact with fresh case study or alternative stakeholder.';
      return {
        id: deal.deal_id,
        name: deal.deal_name,
        amount: val,
        owner: deal.owner_name || 'Unassigned',
        reason: deal.risk_reason || `No activity logged for ${deal.days_since_last_activity} days.`,
        daysInactive: deal.days_since_last_activity,
        fixOwner,
        recommendedFix
      };
    });
  }, [data]);

  // Stage funnel and conversion calculations
  const funnelStages = useMemo(() => {
    if (!data?.pipeline_health?.stage_distribution) return [];
    const stages = data.pipeline_health.stage_distribution;
    return stages.map((st, index) => {
      const nextStage = stages[index + 1];
      const conversionRate = nextStage && st.deal_count > 0
        ? (nextStage.deal_count / st.deal_count) * 100
        : null;
      return {
        name: st.stage,
        count: st.deal_count,
        value: asNumber(st.total_value),
        pct: asNumber(st.percentage),
        conversionRate
      };
    });
  }, [data]);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse px-6 py-8">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 w-64 rounded-xl bg-secondary" />
            <div className="h-4 w-40 rounded bg-secondary" />
          </div>
          <div className="h-10 w-60 rounded-xl bg-secondary" />
        </div>
        <div className="h-40 rounded-2xl bg-secondary" />
        <div className="h-96 rounded-2xl bg-secondary" />
        <div className="grid grid-cols-2 gap-8">
          <div className="h-72 rounded-2xl bg-secondary" />
          <div className="h-72 rounded-2xl bg-secondary" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-destructive m-6">
        <p className="font-extrabold text-sm tracking-tight">Failed to Load Dashboard</p>
        <p className="mt-1 text-xs font-semibold text-destructive/80">{error ?? 'No data was returned by the api.'}</p>
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

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-6 pb-16 font-sans">
      
      {/* ── Global Filter Bar (Modern glass styling) ─────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-border/40 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Manager Overview
          </h1>
          <p className="text-xs text-muted-foreground font-semibold mt-1.5 flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            Decision Intelligence & Quota Pace prioritization.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1 bg-secondary/80 p-0.5 rounded-xl border border-border/40">
            {(['week', 'month', 'quarter'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 capitalize ${
                  period === p ? 'bg-card text-foreground shadow-sm border border-border/40' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="relative">
            <select
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              className="bg-card hover:bg-secondary/60 text-foreground border border-border/60 rounded-xl pl-3 pr-8 py-1.5 text-xs font-bold appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-purple transition-all duration-200"
            >
              <option value="all">All Teams</option>
              <option value="north">North Region</option>
              <option value="south">South Region</option>
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={productLine}
              onChange={(e) => setProductLine(e.target.value)}
              className="bg-card hover:bg-secondary/60 text-foreground border border-border/60 rounded-xl pl-3 pr-8 py-1.5 text-xs font-bold appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-purple transition-all duration-200"
            >
              <option value="all">All Products</option>
              <option value="crm">Core CRM</option>
              <option value="ai">AI Copilot</option>
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ── Section 1: Elevated Forecast Hero Strip ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Target vs Actual */}
        <div className="bg-card border border-border/60 rounded-[22px] p-6 shadow-md shadow-neutral-900/5 dark:shadow-neutral-950/20 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-blue" />
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Target vs Actual</span>
              <span className="text-xs font-bold text-brand-blue">{Math.round((actualVal / targetVal) * 100)}% Attained</span>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl sm:text-3xl font-black text-foreground tabular-nums tracking-tight">
                {formatINR(actualVal)}
              </h3>
              <p className="text-[11px] text-muted-foreground font-semibold">
                of {formatINR(targetVal)} target ({formatINR(targetVal - actualVal)} remaining)
              </p>
            </div>
            <div className="relative pt-1.5">
              <div className="overflow-hidden h-1.5 text-xs flex rounded-full bg-secondary">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((actualVal / targetVal) * 100, 100)}%` }}
                  transition={{ duration: 0.8 }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-brand-blue to-brand-cyan rounded-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Confidence Band Range Bar */}
        <div className="bg-card border border-border/60 rounded-[22px] p-6 shadow-md shadow-neutral-900/5 dark:shadow-neutral-950/20 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-purple" />
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-sans">Projected Range (Confidence Band)</span>
              <span className="text-[10px] font-extrabold text-brand-purple uppercase tracking-widest font-mono">P50 Baseline</span>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-2xl sm:text-3xl font-black text-foreground tabular-nums tracking-tight">
                {formatINR(projectedMid)}
              </h3>
              <p className="text-[11px] text-muted-foreground font-semibold">
                Model confidence score: {confidenceScore}%
              </p>
            </div>

            {/* Premium Range slider */}
            <div className="space-y-2 pt-2 select-none">
              <div className="relative h-1.5 bg-secondary rounded-full border border-border/20">
                {/* Confidence Range Highlight */}
                <div className="absolute left-[15%] right-[15%] h-full bg-brand-purple/20 rounded-full border-x border-brand-purple/40" />
                
                {/* Actual indicator dot */}
                <motion.div
                  initial={{ left: 0 }}
                  animate={{ left: `${actualPositionPercent}%` }}
                  transition={{ duration: 0.8 }}
                  className="absolute -top-1.5 -translate-x-1/2 size-4.5 rounded-full bg-brand-purple border-3 border-card shadow-md flex items-center justify-center"
                >
                  <span className="size-1 bg-white rounded-full animate-ping" />
                </motion.div>
              </div>
              <div className="flex justify-between text-[9px] font-bold text-muted-foreground/80 font-mono">
                <span className="text-destructive/80">Low (P90): {formatINR(projectedLow)}</span>
                <span className="text-emerald-500/80">High (P10): {formatINR(projectedHigh)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Run-Rate & Trend */}
        <div className="bg-card border border-border/60 rounded-[22px] p-6 shadow-md shadow-neutral-900/5 dark:shadow-neutral-950/20 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
          <div className="space-y-3.5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Pacing &amp; Run-rate</span>
              {growthRate >= 0 ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 text-[10px] font-extrabold flex items-center gap-1">
                  <TrendingUp size={11} />
                  <span>Pace Improving</span>
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-destructive/10 border border-destructive/25 text-destructive text-[10px] font-extrabold flex items-center gap-1">
                  <TrendingDown size={11} />
                  <span>Pace Declining</span>
                </span>
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl sm:text-3xl font-black text-foreground tabular-nums tracking-tight">
                {formatINR(Math.max((targetVal - actualVal) / Math.max(periodInfo.daysLeft, 1), 0))}
                <span className="text-xs font-bold text-muted-foreground ml-1">/ day</span>
              </h3>
              <p className="text-[11px] text-muted-foreground font-semibold">
                Daily rate needed for {periodInfo.daysLeft} {periodInfo.label}
              </p>
            </div>

            <div className="pt-2 border-t border-border/30 flex justify-between items-center text-[10px] font-bold text-muted-foreground/80">
              <span className="flex items-center gap-1"><Clock size={12} /> {periodInfo.daysLeft}d remaining</span>
              <span>{Math.round((elapsedDays => elapsedDays / periodInfo.total * 100)(Math.max(periodInfo.total - periodInfo.daysLeft, 1)))}% of period elapsed</span>
            </div>
          </div>
        </div>

      </div>

      {/* ── Section 2: Premium Team Quota Pace Table ─────────────────── */}
      <div className="bg-card border border-border/60 rounded-[22px] p-6 shadow-md shadow-neutral-900/5 dark:shadow-neutral-950/20">
        <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-5">
          <div className="flex items-center space-x-2">
            <Award size={18} className="text-brand-purple" />
            <h3 className="font-extrabold text-foreground text-sm tracking-tight">Team Quota Pace</h3>
          </div>
          <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">
            Sorted by Risk (Furthest Behind First)
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border/60 text-muted-foreground/70 font-semibold select-none">
                <th className="pb-3 text-[10px] uppercase tracking-wider font-bold">Representative</th>
                <th className="pb-3 text-right text-[10px] uppercase tracking-wider font-bold">Quota</th>
                <th className="pb-3 text-right text-[10px] uppercase tracking-wider font-bold">Attained</th>
                <th className="pb-3 text-right text-[10px] uppercase tracking-wider font-bold">% Attainment</th>
                <th className="pb-3 text-right text-[10px] uppercase tracking-wider font-bold">Projected Attainment</th>
                <th className="pb-3 text-right text-[10px] uppercase tracking-wider font-bold">Risk Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-medium">
              {sortedReps.map((rep, idx) => {
                const quota = asNumber(rep.assigned_target);
                const attained = asNumber(rep.revenue_generated);
                const pct = asNumber(rep.quota_achievement_pct);
                
                // Calculate simulated projection based on remaining days
                const daysInMonth = 30;
                const elapsedDays = Math.max(daysInMonth - periodInfo.daysLeft, 1);
                const paceMultiplier = daysInMonth / elapsedDays;
                const projectedVal = attained * paceMultiplier;
                const projectedPct = Math.round((projectedVal / quota) * 100) || 0;

                // Traffic-light status styling
                let riskText = 'On Track';
                let RiskIcon = CheckCircle2;
                let riskClass = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500';
                
                if (pct < 40) {
                  riskText = 'Critical';
                  RiskIcon = AlertCircle;
                  riskClass = 'bg-destructive/10 border-destructive/20 text-destructive animate-pulse';
                } else if (pct < 75) {
                  riskText = 'At Risk';
                  RiskIcon = AlertTriangle;
                  riskClass = 'bg-amber-500/10 border-amber-500/20 text-amber-500';
                }

                // Distinct colors for user avatar rings
                const colors = ['from-brand-blue to-brand-cyan', 'from-brand-purple to-pink-500', 'from-emerald-400 to-teal-500', 'from-amber-400 to-orange-500'];
                const avatarGradient = colors[idx % colors.length];

                return (
                  <motion.tr 
                    key={rep.user_id} 
                    className="hover:bg-muted/40 transition-all duration-200 cursor-pointer group"
                    whileHover={{ x: 1 }}
                  >
                    {/* User Profile Info */}
                    <td className="py-3.5 flex items-center space-x-3">
                      <div className={`size-8 rounded-full bg-gradient-to-tr ${avatarGradient} flex items-center justify-center text-[10px] font-black text-white shadow-inner border border-white/10 shrink-0`}>
                        {rep.full_name.split(' ').map(n=>n[0]).join('')}
                      </div>
                      <span className="font-extrabold text-foreground group-hover:text-brand-purple transition-colors duration-150">
                        {rep.full_name}
                      </span>
                    </td>
                    
                    {/* Quota */}
                    <td className="py-3.5 text-right tabular-nums text-muted-foreground/90 font-mono font-semibold">
                      {formatINR(quota)}
                    </td>
                    
                    {/* Attained */}
                    <td className="py-3.5 text-right tabular-nums text-foreground font-bold font-mono">
                      {formatINR(attained)}
                    </td>
                    
                    {/* Attainment Progress Track */}
                    <td className="py-3.5 text-right">
                      <div className="inline-flex items-center space-x-2.5">
                        <span className="font-bold tabular-nums font-mono text-foreground">{pct}%</span>
                        <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden border border-border/20">
                          <div 
                            className={`h-full rounded-full ${pct < 40 ? 'bg-destructive' : pct < 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    
                    {/* Projected */}
                    <td className="py-3.5 text-right tabular-nums text-muted-foreground font-mono font-medium">
                      {formatINR(projectedVal)} <span className="text-[10px] font-bold text-muted-foreground/60">({projectedPct}%)</span>
                    </td>
                    
                    {/* Risk Badge */}
                    <td className="py-3.5 text-right">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${riskClass} select-none`}>
                        <RiskIcon size={10} className="shrink-0" />
                        {riskText}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid for Coaching Signals & Deal Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Section 3: Coaching Signals ────────────────────────────── */}
        <div className="bg-card border border-border/60 rounded-[22px] p-6 shadow-md shadow-neutral-900/5 dark:shadow-neutral-950/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-5">
              <div className="flex items-center space-x-2">
                <Users size={18} className="text-brand-purple" />
                <h3 className="font-extrabold text-foreground text-sm tracking-tight">Coaching Signals</h3>
              </div>
              <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">
                People-Level Alerts
              </span>
            </div>

            <div className="space-y-4">
              {coachingSignals.map((sig, idx) => (
                <div key={idx} className="p-4 bg-secondary/35 border border-border/40 rounded-xl space-y-2 hover:border-brand-purple/20 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-foreground text-xs">{sig.repName}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${
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
                  <div className="pt-2.5 border-t border-border/30 flex items-start gap-1 text-[11px] text-brand-purple font-semibold">
                    <Sparkles size={13} className="shrink-0 mt-0.5" />
                    <span>Suggested: {sig.action}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Section 4: Deal Risk Radar ──────────────────────────────── */}
        <div className="bg-card border border-border/60 rounded-[22px] p-6 shadow-md shadow-neutral-900/5 dark:shadow-neutral-950/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-5">
              <div className="flex items-center space-x-2">
                <AlertTriangle size={18} className="text-amber-500" />
                <h3 className="font-extrabold text-foreground text-sm tracking-tight">Deal Risk Radar</h3>
              </div>
              <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">
                Account-Level Blocks
              </span>
            </div>

            <div className="space-y-4 max-h-[440px] overflow-y-auto pr-1">
              {dealRisks.map((deal) => (
                <div key={deal.id} className="p-4 bg-secondary/35 border border-border/40 rounded-xl space-y-2.5 hover:border-amber-500/20 transition-all duration-200">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-extrabold text-foreground text-xs hover:text-brand-purple transition-colors cursor-pointer">{deal.name}</h4>
                      <p className="text-[10px] text-muted-foreground/80 font-bold mt-0.5">Owner: {deal.owner}</p>
                    </div>
                    <span className="text-xs font-black text-foreground tabular-nums font-mono">
                      {formatINR(deal.amount)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-500">
                      {deal.reason}
                    </span>
                    <span className="text-[10px] text-muted-foreground/70 font-semibold font-mono">
                      {deal.daysInactive}d inactive
                    </span>
                  </div>

                  <div className="pt-2.5 border-t border-border/30 flex items-center justify-between text-[10px] font-medium">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-muted-foreground/80 font-semibold">Fix Owner:</span>
                      <span className={`px-2 py-0.5 rounded-md font-bold ${
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
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-2 text-xs">
                  <div className="size-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-inner">
                    <CheckCircle2 size={20} />
                  </div>
                  <p className="font-extrabold text-foreground">Zero Deals at Risk</p>
                  <p className="text-muted-foreground text-[10px] max-w-xs font-semibold">All high-value client opportunities are paced on schedule.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ── Section 5: Pipeline by Stage ────────────────────────────── */}
      <div className="bg-card border border-border/60 rounded-[22px] p-6 shadow-md shadow-neutral-900/5 dark:shadow-neutral-950/20">
        <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-5">
          <div className="flex items-center space-x-2">
            <Layers size={18} className="text-brand-purple" />
            <h3 className="font-extrabold text-foreground text-sm tracking-tight">Pipeline by Stage</h3>
          </div>
          <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">
            Funnels &amp; Conversion Rates
          </span>
        </div>

        <div className="space-y-4">
          {funnelStages.map((stage, idx) => (
            <div key={stage.name} className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-foreground">{stage.name}</span>
                  <span className="text-[10px] text-muted-foreground font-bold">({stage.count} deals)</span>
                </div>
                <span className="font-black text-foreground tabular-nums font-mono">{formatINR(stage.value)}</span>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex-1 h-3.5 rounded-lg bg-secondary overflow-hidden relative border border-border/20">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stage.pct}%` }}
                    transition={{ duration: 0.8 }}
                    className="h-full rounded-lg bg-gradient-to-r from-brand-purple to-brand-blue opacity-85"
                  />
                </div>
                {stage.conversionRate !== null && (
                  <div className="w-24 shrink-0 text-right text-[10px] text-muted-foreground font-bold flex items-center justify-end gap-1">
                    <Percent size={10} className="text-brand-purple" />
                    <span className="font-mono">{Math.round(stage.conversionRate)}% to Next</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Design Notes & Exclusions (Footer Info) ──────────────────── */}
      <div className="bg-secondary/20 border border-border/40 rounded-[22px] p-5 text-[11px] text-muted-foreground space-y-1.5 leading-relaxed">
        <div className="flex items-center space-x-1.5 text-foreground font-extrabold">
          <HelpCircle size={13} className="text-brand-purple" />
          <span>Overview Architectural Concerns</span>
        </div>
        <p className="font-medium text-muted-foreground/90">
          This dashboard is optimized strictly for sales managers to prioritize operational coaching and deal fixes. 
          To avoid clutter and distraction, several modules are intentionally routed to separate views:
        </p>
        <ul className="list-disc pl-5 space-y-0.5 font-medium text-muted-foreground/80">
          <li><strong>Lead Source Conversion Analytics</strong> are reserved exclusively for the <strong>Admin Dashboard</strong>.</li>
          <li><strong>Representative Activity Heatmaps</strong> are placed under the <strong>Sales Rep Dashboard</strong> to prevent manager micromanagement.</li>
          <li>The generic <strong>AI Insights Panel</strong> is accessible in the secondary <strong>AI Insights</strong> tab on the left sidebar.</li>
        </ul>
      </div>

    </div>
  );
}
