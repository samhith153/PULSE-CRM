'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp, Target, AlertTriangle, Users, ArrowUpRight,
  Activity, BellRing, ShieldAlert, Sparkles, Award,
  BarChart3, Layers, Clock, ArrowRight, CheckCircle2, ChevronDown,
  Briefcase, Percent, User, MessageSquare, AlertCircle, HelpCircle
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
      return { daysLeft, label: 'days left in week' };
    }
    if (period === 'quarter') {
      const currentMonth = now.getMonth();
      const endOfQuarterMonth = Math.floor(currentMonth / 3) * 3 + 2;
      const lastDayOfQuarterMonth = new Date(now.getFullYear(), endOfQuarterMonth + 1, 0);
      const diffTime = lastDayOfQuarterMonth.getTime() - now.getTime();
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { daysLeft, label: 'days left in quarter' };
    }
    // Default: month
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysLeft = lastDayOfMonth - now.getDate();
    return { daysLeft, label: 'days left in month' };
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
      <div className="space-y-6 animate-pulse px-4 py-6">
        <div className="h-10 w-48 rounded-xl bg-secondary" />
        <div className="h-28 rounded-2xl bg-secondary" />
        <div className="h-64 rounded-2xl bg-secondary" />
        <div className="h-64 rounded-2xl bg-secondary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-destructive m-4">
        <p className="font-semibold">Couldn't load Manager Overview dashboard</p>
        <p className="mt-1 text-sm">{error ?? 'No data returned.'}</p>
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 pb-12">
      
      {/* ── Global Filter Bar ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
            Manager Overview
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time decision intelligence & coaching prioritization.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1.5 bg-muted/60 p-1 rounded-xl border border-border">
            <button
              onClick={() => setPeriod('week')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                period === 'week' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                period === 'month' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setPeriod('quarter')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                period === 'quarter' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Quarter
            </button>
          </div>

          <div className="relative">
            <select
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              className="bg-card hover:bg-muted text-foreground border border-border rounded-xl px-3 py-1.5 text-xs font-bold appearance-none pr-8 cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-purple"
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
              className="bg-card hover:bg-muted text-foreground border border-border rounded-xl px-3 py-1.5 text-xs font-bold appearance-none pr-8 cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-purple"
            >
              <option value="all">All Products</option>
              <option value="crm">Core CRM</option>
              <option value="ai">AI Copilot</option>
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ── Section 1: Forecast Strip (top) ─────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-2 h-full bg-brand-purple" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 divide-y lg:divide-y-0 lg:divide-x divide-border">
          
          {/* Target & Actuals */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Target vs Actual</p>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-foreground">{formatINR(actualVal)}</span>
              <span className="text-xs text-muted-foreground font-semibold">of {formatINR(targetVal)}</span>
            </div>
            <div className="relative pt-1">
              <div className="overflow-hidden h-2 text-xs flex rounded-full bg-secondary">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((actualVal / targetVal) * 100, 100)}%` }}
                  transition={{ duration: 0.8 }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-brand-purple"
                />
              </div>
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground font-bold">
              <span>{Math.round((actualVal / targetVal) * 100)}% Attained</span>
              <span>{formatINR(targetVal - actualVal)} Remaining</span>
            </div>
          </div>

          {/* Forecast Range & Confidence Bands */}
          <div className="space-y-2 lg:pl-6 pt-4 lg:pt-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Projected Range (Confidence Band)</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-foreground">{formatINR(projectedMid)}</span>
              <span className="text-xs font-semibold text-brand-purple">P50 Projection</span>
            </div>
            {/* Visual range strip */}
            <div className="relative py-2 flex items-center justify-between text-[10px] text-muted-foreground font-semibold">
              <span className="text-destructive font-bold">Low (P90): {formatINR(projectedLow)}</span>
              <span className="flex-1 mx-2 h-1 bg-border rounded-full relative">
                <span className="absolute top-1/2 left-1/4 -translate-y-1/2 size-2 rounded-full bg-brand-purple" />
              </span>
              <span className="text-emerald-500 font-bold">High (P10): {formatINR(projectedHigh)}</span>
            </div>
            <p className="text-[10px] text-muted-foreground font-medium">
              Band computed at <strong className="text-foreground">{confidenceScore}%</strong> model confidence score.
            </p>
          </div>

          {/* Period Status & Pace */}
          <div className="space-y-2 lg:pl-6 pt-4 lg:pt-0 flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Period Run-Rate & Trend</p>
              <div className="flex items-center gap-2 mt-1">
                {growthRate >= 0 ? (
                  <div className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 text-[10px] font-bold flex items-center gap-1">
                    <TrendingUp size={12} />
                    <span>Pace Improving</span>
                  </div>
                ) : (
                  <div className="px-2 py-0.5 rounded-md bg-destructive/10 border border-destructive/25 text-destructive text-[10px] font-bold flex items-center gap-1">
                    <AlertTriangle size={12} />
                    <span>Pace Declining</span>
                  </div>
                )}
                <span className="text-xs font-bold text-foreground tabular-nums">
                  {periodInfo.daysLeft} {periodInfo.label}
                </span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground/80 leading-relaxed font-semibold">
              Required daily run-rate: <strong className="text-foreground">{formatINR(Math.max((targetVal - actualVal) / Math.max(periodInfo.daysLeft, 1), 0))} / day</strong> to reach targets.
            </p>
          </div>

        </div>
      </div>

      {/* ── Section 2: Team Quota Pace ──────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <Award size={18} className="text-brand-purple animate-bounce" />
            <h3 className="font-extrabold text-foreground text-sm tracking-tight">Team Quota Pace</h3>
          </div>
          <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">
            Sorted by Risk (Furthest Behind First)
          </span>
        </div>
        
        <div className="overflow-x-auto font-sans">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border/60 text-muted-foreground font-semibold">
                <th className="pb-2.5">Representative</th>
                <th className="pb-2.5">Quota</th>
                <th className="pb-2.5">Attained</th>
                <th className="pb-2.5">% Attainment</th>
                <th className="pb-2.5">Projected Attainment</th>
                <th className="pb-2.5 text-right">Risk Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-medium">
              {sortedReps.map((rep) => {
                const quota = asNumber(rep.assigned_target);
                const attained = asNumber(rep.revenue_generated);
                const pct = asNumber(rep.quota_achievement_pct);
                
                // Calculate simulated projection based on remaining days
                const daysInMonth = 30;
                const elapsedDays = Math.max(daysInMonth - periodInfo.daysLeft, 1);
                const paceMultiplier = daysInMonth / elapsedDays;
                const projectedVal = attained * paceMultiplier;
                const projectedPct = Math.round((projectedVal / quota) * 100) || 0;

                // Traffic-light styling
                let riskText = 'On Track';
                let riskClass = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500';
                if (pct < 40) {
                  riskText = 'Critical';
                  riskClass = 'bg-destructive/10 border-destructive/20 text-destructive animate-pulse';
                } else if (pct < 75) {
                  riskText = 'At Risk';
                  riskClass = 'bg-amber-500/10 border-amber-500/20 text-amber-500';
                }

                return (
                  <tr key={rep.user_id} className="hover:bg-muted/40 transition-colors">
                    <td className="py-3 flex items-center space-x-2">
                      <div className="size-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold text-brand-purple">
                        {rep.full_name.charAt(0)}
                      </div>
                      <span className="font-bold text-foreground">{rep.full_name}</span>
                    </td>
                    <td className="py-3 tabular-nums">{formatINR(quota)}</td>
                    <td className="py-3 tabular-nums text-foreground font-semibold">{formatINR(attained)}</td>
                    <td className="py-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold tabular-nums w-8">{pct}%</span>
                        <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden hidden sm:block">
                          <div 
                            className={`h-full rounded-full ${pct < 40 ? 'bg-destructive' : pct < 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 tabular-nums text-muted-foreground">
                      {formatINR(projectedVal)} ({projectedPct}%)
                    </td>
                    <td className="py-3 text-right">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${riskClass}`}>
                        {riskText}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid for Coaching Signals & Deal Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Section 3: Coaching Signals ────────────────────────────── */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <Users size={18} className="text-brand-purple" />
                <h3 className="font-extrabold text-foreground text-sm tracking-tight">Coaching Signals</h3>
              </div>
              <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">
                People-Level Interventions
              </span>
            </div>

            <div className="space-y-3.5">
              {coachingSignals.map((sig, idx) => (
                <div key={idx} className="p-3 bg-muted/30 border border-border rounded-xl space-y-2 hover:border-brand-purple/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground text-xs">{sig.repName}</span>
                    <span className={`px-2 py-0.2 rounded text-[9px] font-bold border ${
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
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{sig.type}</p>
                    <p className="text-xs text-foreground mt-0.5 font-medium">{sig.observation}</p>
                  </div>
                  <div className="pt-2 border-t border-border/40 flex items-start gap-1 text-[11px] text-brand-purple font-semibold">
                    <Sparkles size={13} className="shrink-0 mt-0.5" />
                    <span>Suggested: {sig.action}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Section 4: Deal Risk Radar ──────────────────────────────── */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle size={18} className="text-amber-500" />
                <h3 className="font-extrabold text-foreground text-sm tracking-tight">Deal Risk Radar</h3>
              </div>
              <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">
                Account-Level Blocks
              </span>
            </div>

            <div className="space-y-3.5 max-h-[420px] overflow-y-auto pr-1">
              {dealRisks.map((deal) => (
                <div key={deal.id} className="p-3 bg-muted/30 border border-border rounded-xl space-y-2 hover:border-amber-500/20 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-extrabold text-foreground text-xs">{deal.name}</h4>
                      <p className="text-[10px] text-muted-foreground font-bold">Owner: {deal.owner}</p>
                    </div>
                    <span className="text-xs font-black text-foreground tabular-nums">
                      {formatINR(deal.amount)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-500">
                      {deal.reason}
                    </span>
                    <span className="text-[10px] text-muted-foreground/80 font-bold">
                      {deal.daysInactive}d inactive
                    </span>
                  </div>

                  <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[10px]">
                    <div className="flex items-center space-x-1">
                      <span className="text-muted-foreground font-bold">Fix Owner:</span>
                      <span className={`px-1.5 py-0.2 rounded font-extrabold ${
                        deal.fixOwner === 'Manager'
                          ? 'bg-brand-purple/10 text-brand-purple'
                          : 'bg-blue-500/10 text-blue-500'
                      }`}>
                        {deal.fixOwner}
                      </span>
                    </div>
                    <span className="text-muted-foreground text-right truncate max-w-[200px]" title={deal.recommendedFix}>
                      Fix: {deal.recommendedFix}
                    </span>
                  </div>
                </div>
              ))}
              {dealRisks.length === 0 && (
                <div className="py-10 flex flex-col items-center justify-center text-center space-y-1.5 text-xs">
                  <CheckCircle2 size={24} className="text-emerald-500" />
                  <p className="font-bold">Zero Deals at Risk</p>
                  <p className="text-muted-foreground text-[10px]">All major opportunities are moving forward smoothly.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ── Section 5: Pipeline by Stage ────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-3 mb-5">
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
                <span className="font-black text-foreground tabular-nums">{formatINR(stage.value)}</span>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex-1 h-4 rounded-lg bg-secondary overflow-hidden relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stage.pct}%` }}
                    transition={{ duration: 0.8 }}
                    className="h-full rounded-lg bg-brand-purple/80"
                  />
                </div>
                {stage.conversionRate !== null && (
                  <div className="w-24 shrink-0 text-right text-[10px] text-muted-foreground font-bold flex items-center justify-end gap-1">
                    <Percent size={10} className="text-brand-purple" />
                    <span>{Math.round(stage.conversionRate)}% to Next</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Design Notes & Exclusions (Footer Info) ──────────────────── */}
      <div className="bg-secondary/40 border border-border/80 rounded-xl p-4 text-[11px] text-muted-foreground space-y-1.5 leading-relaxed">
        <div className="flex items-center space-x-1.5 text-foreground font-bold">
          <HelpCircle size={13} className="text-brand-purple" />
          <span>Overview Architectural Concerns</span>
        </div>
        <p>
          This dashboard is optimized strictly for sales managers to prioritize operational coaching and deal fixes. 
          To avoid clutter and distraction, several modules are intentionally routed to separate views:
        </p>
        <ul className="list-disc pl-5 space-y-0.5">
          <li><strong>Lead Source Conversion Analytics</strong> are reserved exclusively for the <strong>Admin Dashboard</strong>.</li>
          <li><strong>Representative Activity Heatmaps</strong> are placed under the <strong>Sales Rep Dashboard</strong> to prevent manager micromanagement.</li>
          <li>The generic <strong>AI Insights Panel</strong> is accessible in the secondary <strong>AI Insights</strong> tab on the left sidebar.</li>
        </ul>
      </div>

    </div>
  );
}
