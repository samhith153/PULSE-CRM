'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Target, 
  AlertTriangle, 
  Users, 
  ArrowUpRight, 
  Activity, 
  BellRing, 
  ShieldAlert,
  Sparkles,
  Award,
  BarChart3,
  Layers,
  Calendar,
  Clock,
  ArrowRight,
  TrendingDown,
  Info,
  CheckCircle2
} from 'lucide-react';
import { getLeads, getDeals, getActivities } from '@/utils/api';

interface ManagerDashboardViewProps {
  onTabChange?: (tab: string) => void;
}

export default function ManagerDashboardView({ onTabChange }: ManagerDashboardViewProps) {
  const [hoveredQuotaIdx, setHoveredQuotaIdx] = useState<number | null>(null);
  const [hoveredMonthIdx, setHoveredMonthIdx] = useState<number | null>(null);

  const [leads, setLeads] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getLeads(),
      getDeals(),
      getActivities({ page_size: 100 })
    ]).then(([leadsData, dealsData, activitiesData]) => {
      setLeads(leadsData || []);
      setDeals(dealsData || []);
      setActivities(activitiesData?.data || activitiesData || []);
      setLoading(false);
    }).catch(err => {
      console.error("Failed to load manager dashboard:", err);
      setLoading(false);
    });
  }, []);

  const getStageProbability = (stage: string) => {
    const s = stage?.toLowerCase() || '';
    if (s === 'won') return 1.0;
    if (s === 'negotiation') return 0.75;
    if (s === 'proposal') return 0.50;
    if (s === 'qualified') return 0.25;
    if (s === 'new') return 0.10;
    return 0.0;
  };

  // 1. Calculations
  const wonDeals = deals.filter(d => d.stage === 'Won' || d.status === 'Won' || d.status === 'won');
  const wonRevenue = wonDeals.reduce((sum, d) => sum + (Number(d.value || d.amount) || 0), 0);
  const totalTarget = 3000000; // baseline team target

  let forecastRevenue = 0;
  let activePipeline = 0;

  deals.forEach(d => {
    const val = Number(d.value || d.amount) || 0;
    const stage = d.stage?.toLowerCase() || d.status?.toLowerCase() || '';
    forecastRevenue += val * getStageProbability(stage);
    if (stage !== 'won' && stage !== 'lost') {
      activePipeline += val;
    }
  });

  // Quota attainment progress
  const quotaProgress = totalTarget > 0 ? Math.round((wonRevenue / totalTarget) * 100) : 0;

  // 2. Risk Deals: Active deals with no recent activities or score under 50
  const riskDeals = deals
    .filter(d => {
      const isWon = d.stage === 'Won' || d.status === 'Won' || d.status === 'won';
      const isLost = d.stage === 'Lost' || d.status === 'Lost' || d.status === 'lost';
      if (isWon || isLost) return false;
      
      // If we match lead score
      let score = 50;
      if (d.lead_id) {
        const match = leads.find(l => String(l.id) === String(d.lead_id));
        if (match) score = match.score || 50;
      }
      return score < 50;
    })
    .slice(0, 2)
    .map((d, idx) => {
      return {
        id: idx + 1,
        title: d.title || 'Enterprise Expansion Project',
        company: d.company || 'Prospect Co',
        value: d.value || d.amount ? `₹${Number(d.value || d.amount).toLocaleString('en-IN')}` : '₹80,000',
        rep: d.owner || 'Representative',
        risk: 'Low engagement score',
        avatar: `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&fit=crop&q=80`
      };
    });

  // 3. Leaderboard list
  const repMap: Record<string, { won: number; deals: number }> = {};
  deals.forEach(d => {
    const owner = d.owner || 'Unknown Rep';
    if (!repMap[owner]) {
      repMap[owner] = { won: 0, deals: 0 };
    }
    const isWon = d.stage === 'Won' || d.status === 'Won' || d.status === 'won';
    if (isWon) {
      repMap[owner].won += Number(d.value || d.amount) || 0;
      repMap[owner].deals += 1;
    }
  });

  const repQuotaTarget = 1000000;
  const leaderboards = Object.entries(repMap).map(([name, data], idx) => {
    const progress = repQuotaTarget > 0 ? Math.min(Math.round((data.won / repQuotaTarget) * 100), 100) : 0;
    return {
      rank: 0,
      name,
      won: data.won,
      target: repQuotaTarget,
      wonFormatted: `₹${data.won.toLocaleString('en-IN')}`,
      targetFormatted: `₹${(repQuotaTarget / 1000000).toFixed(1)}M`,
      deals: data.deals,
      progress,
      avatar: `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&fit=crop&q=80`
    };
  }).sort((a, b) => b.won - a.won);

  leaderboards.forEach((item, idx) => {
    item.rank = idx + 1;
  });

  // 4. Pipeline Stages breakdown
  const stageCounts: Record<string, { count: number; value: number }> = {
    "Prospecting": { count: 0, value: 0 },
    "Qualification": { count: 0, value: 0 },
    "Proposal Sent": { count: 0, value: 0 },
    "Negotiation": { count: 0, value: 0 },
    "Closed Won": { count: 0, value: 0 }
  };

  deals.forEach(d => {
    const stage = d.stage || d.status || 'New';
    const val = Number(d.value || d.amount) || 0;

    let key = "Prospecting";
    if (stage === 'New' || stage === 'new') key = "Prospecting";
    else if (stage === 'Qualified' || stage === 'qualified') key = "Qualification";
    else if (stage === 'Proposal' || stage === 'proposal') key = "Proposal Sent";
    else if (stage === 'Negotiation' || stage === 'negotiation') key = "Negotiation";
    else if (stage === 'Won' || stage === 'won') key = "Closed Won";

    if (key in stageCounts) {
      stageCounts[key].count += 1;
      stageCounts[key].value += val;
    }
  });

  const maxStageVal = Math.max(...Object.values(stageCounts).map(v => v.value), 1);
  const colorPal = ["bg-purple-600", "bg-indigo-500", "bg-blue-500", "bg-sky-500", "bg-emerald-500"];
  const textPal = ["text-purple-600", "text-indigo-500", "text-blue-500", "text-sky-500", "text-emerald-500"];

  const pipelineStages = Object.entries(stageCounts).map(([name, data], idx) => ({
    name,
    value: `₹${(data.value / 1000000).toFixed(2)}M`,
    count: data.count,
    pct: Math.round((data.value / maxStageVal) * 100),
    color: colorPal[idx % colorPal.length],
    textColor: textPal[idx % textPal.length],
    lightBg: "bg-slate-50"
  }));

  // 5. Monthly Revenue Trend vs Target
  const now = new Date();
  const monthlyRevenueMap: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString('en-US', { month: 'short' });
    monthlyRevenueMap[label] = 0;
  }
  wonDeals.forEach(d => {
    const date = new Date(d.closed_at || d.created_at);
    const label = date.toLocaleDateString('en-US', { month: 'short' });
    if (label in monthlyRevenueMap) {
      monthlyRevenueMap[label] += (Number(d.value || d.amount) || 0);
    }
  });

  const monthlyForecast = Object.entries(monthlyRevenueMap).map(([month, expected], idx) => {
    const x = 50 + idx * 100;
    // Map actual value into SVG coordinate (between 20 and 120)
    const valInM = expected / 1000000;
    const maxInM = 4.0;
    const y = 130 - (valInM / maxInM) * 100;
    return {
      month,
      actual: Number(valInM.toFixed(2)),
      target: 2.0 + idx * 0.2, // baseline target values
      x,
      y: Math.max(Math.min(y, 130), 20)
    };
  });

  // 6. Command Alerts & Signals
  const alerts = [
    { id: 1, text: `${riskDeals.length} high-value deals have low engagement score index metrics.`, type: "warning", time: "Action Required" },
    { id: 2, text: `Monthly team quota is currently at ${quotaProgress}% completion against baseline target.`, type: "success", time: "On Track" }
  ];

  // 7. Team Activity Log Feed
  const recentActivities = activities.slice(0, 3).map((act: any) => {
    const createdDate = new Date(act.created_at || Date.now());
    const diffMs = Math.abs(new Date().getTime() - createdDate.getTime());
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    let timeStr = `${diffDays}d ago`;
    if (diffDays === 0) {
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      timeStr = diffHrs === 0 ? 'Just now' : `${diffHrs}h ago`;
    }

    return {
      time: timeStr,
      actor: act.created_by || 'Sales Rep',
      action: act.description || `logged timeline event '${act.title}'`,
      avatar: `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&fit=crop&q=80`
    };
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white border border-brand-border-purple/20 rounded-xl p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent"></div>
        <p className="text-xs text-brand-text/60 mt-4 font-bold">Synchronizing manager operations control center...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Premium Dashboard Banner */}
      <div className="bg-gradient-to-r from-brand-accent/5 to-brand-secondary-accent/15 border border-brand-border-purple/30 rounded-2xl p-6 shadow-sm/5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 h-40 w-40 bg-brand-accent/5 rounded-full filter blur-2xl pointer-events-none" />
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 rounded-2xl bg-brand-accent flex items-center justify-center text-white shrink-0 shadow-md">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-3xl font-sans text-brand-heading tracking-tight font-extrabold">
                Sales Operations Hub
              </h1>
              <span className="flex items-center h-2 w-2 rounded-full bg-emerald-500 animate-pulse mt-1" title="Live" />
            </div>
            <p className="text-xs md:text-sm text-brand-text/75 mt-1 font-medium tracking-wide">
              Welcome back. Your team is driving active quotas. Completion is currently at {quotaProgress}%.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0 self-start md:self-auto bg-white/60 backdrop-blur-md border border-brand-border-purple/20 px-3.5 py-2 rounded-xl text-xs font-bold text-brand-text/80 shadow-sm/5">
          <Calendar className="h-4 w-4 text-brand-accent mr-1.5" />
          <span className="tabular-nums">Fiscal Period: H1 {now.getFullYear()}</span>
        </div>
      </div>

      {/* KPI Core Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Team Revenue Progress */}
        <div className="bg-white border border-brand-border-purple/20 border-l-4 border-l-emerald-500 rounded-2xl p-5 shadow-sm/5 flex flex-col justify-between min-h-[135px] hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-extrabold text-brand-text/60 uppercase tracking-wider">Team Revenue Won</span>
            <span className="text-[9px] font-extrabold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100/50 tabular-nums">
              {quotaProgress}% Quota
            </span>
          </div>
          <div className="mt-2.5">
            <h4 className="text-2xl font-black text-brand-heading">₹{wonRevenue.toLocaleString('en-IN')}</h4>
            <p className="text-[9px] text-slate-455 mt-1 font-bold">
              Target Quota: ₹{totalTarget.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="mt-3">
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full animate-in duration-500" style={{ width: `${Math.min(quotaProgress, 100)}%` }} />
            </div>
            <div className="flex justify-between text-[8px] font-extrabold text-slate-400 mt-1 uppercase">
              <span>Progress</span>
              <span>{quotaProgress}% achieved</span>
            </div>
          </div>
        </div>

        {/* Expected Revenue Forecast */}
        <div className="bg-white border border-brand-border-purple/20 border-l-4 border-l-brand-accent rounded-2xl p-5 shadow-sm/5 flex flex-col justify-between min-h-[135px] hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-extrabold text-brand-text/60 uppercase tracking-wider">Forecast Projection</span>
            <Target className="h-4 w-4 text-brand-accent" />
          </div>
          <div className="mt-2.5">
            <h4 className="text-2xl font-black text-brand-heading">₹{Math.round(forecastRevenue).toLocaleString('en-IN')}</h4>
            <p className="text-[9px] text-slate-455 mt-1 font-bold">
              Weighted Pipeline Forecast
            </p>
          </div>
          <div className="mt-3">
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-brand-accent rounded-full animate-in duration-500" style={{ width: '85%' }} />
            </div>
            <div className="flex justify-between text-[8px] font-extrabold text-slate-400 mt-1 uppercase">
              <span>Weighted Projection</span>
              <span>85% AI reliability</span>
            </div>
          </div>
        </div>

        {/* Pipeline Volume */}
        <div className="bg-white border border-brand-border-purple/20 border-l-4 border-l-indigo-500 rounded-2xl p-5 shadow-sm/5 flex flex-col justify-between min-h-[135px] hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-extrabold text-brand-text/60 uppercase tracking-wider">Pipeline Health</span>
            <span className="text-[9px] font-extrabold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100/50">
              Active
            </span>
          </div>
          <div className="mt-2.5">
            <h4 className="text-2xl font-black text-brand-heading">₹{activePipeline.toLocaleString('en-IN')}</h4>
            <p className="text-[9px] text-slate-455 mt-1 font-bold">
              Active Open Deals Funnel
            </p>
          </div>
          <div className="mt-3">
            <div className="flex space-x-1.5 h-2 rounded-full overflow-hidden">
              <div className="h-full bg-purple-600 rounded-l" style={{ width: '35%' }} title="Qualified" />
              <div className="h-full bg-indigo-500" style={{ width: '35%' }} title="Proposal" />
              <div className="h-full bg-sky-400 rounded-r" style={{ width: '30%' }} title="Negotiation" />
            </div>
            <div className="flex justify-between text-[8px] font-extrabold text-slate-400 mt-1 uppercase">
              <span>Distribution</span>
              <span>Open Pipe Value breakdown</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Manager Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Chart 1: Team Quota vs Attainment Bar Chart */}
        <div className="col-span-12 lg:col-span-7 bg-white border border-brand-border-purple/20 rounded-2xl p-5 shadow-sm/5 flex flex-col justify-between hover:shadow-md transition-all duration-300">
          <div>
            <div className="flex items-center justify-between border-b border-slate-55 pb-3 mb-4">
              <h3 className="font-extrabold text-brand-heading text-sm flex items-center">
                <BarChart3 className="h-4.5 w-4.5 mr-2 text-brand-accent" />
                <span>Rep Sales Quota Attainment</span>
              </h3>
              <span className="text-[9px] font-extrabold bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase tracking-wider">Current Quarter</span>
            </div>

            {/* Bar Chart Visual */}
            <div className="space-y-4 pt-1">
              {leaderboards.length > 0 ? (
                leaderboards.map((rep, idx) => {
                  const pct = Math.round((rep.won / rep.target) * 100);
                  return (
                    <div 
                      key={rep.name}
                      onMouseEnter={() => setHoveredQuotaIdx(idx)}
                      onMouseLeave={() => setHoveredQuotaIdx(null)}
                      className="space-y-1.5 cursor-pointer p-2.5 rounded-xl transition-all hover:bg-slate-50/70 border border-transparent hover:border-brand-border-purple/15"
                    >
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-brand-text flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-brand-accent/10 border border-brand-border-purple/20 flex items-center justify-center text-[9px] font-black text-brand-accent shrink-0">
                            {rep.rank}
                          </span>
                          <img src={rep.avatar} alt={rep.name} className="h-5.5 w-5.5 rounded-full object-cover border border-slate-200" />
                          <span className="truncate max-w-[130px]">{rep.name}</span>
                        </span>
                        <div className="flex items-center space-x-2 tabular-nums">
                          <span className="text-brand-heading font-black">{rep.wonFormatted}</span>
                          <span className="text-slate-400 text-[10px] font-normal">/ {rep.targetFormatted}</span>
                          <span className={`text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-md ${
                            pct >= 90 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/50' : 'bg-purple-50 text-purple-700 border border-brand-border-purple/15'
                          }`}>
                            {pct}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden relative">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            hoveredQuotaIdx === idx ? 'bg-purple-600 shadow-sm' : 'bg-brand-accent'
                          }`} 
                          style={{ width: `${Math.min(pct, 100)}%` }} 
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400 font-bold py-8 text-center">No representative quotas set.</p>
              )}
            </div>
          </div>

          <div className="border-t border-brand-border-purple/15 pt-3.5 mt-4 flex items-center justify-between text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
            <span>Average Quota Target: <strong className="text-brand-heading font-black">₹{(repQuotaTarget/1000).toFixed(0)}K</strong></span>
            <button 
              onClick={() => onTabChange?.('team performance')}
              className="text-brand-accent hover:text-brand-accent-hover font-black flex items-center space-x-1 cursor-pointer bg-transparent border-0 uppercase"
            >
              <span>Rep Details</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Chart 2: Pipeline Stage Breakdown */}
        <div className="col-span-12 lg:col-span-5 bg-white border border-brand-border-purple/20 rounded-2xl p-5 shadow-sm/5 flex flex-col justify-between hover:shadow-md transition-all duration-300">
          <div>
            <div className="flex items-center justify-between border-b border-slate-55 pb-3 mb-4">
              <h3 className="font-extrabold text-brand-heading text-sm flex items-center">
                <Layers className="h-4.5 w-4.5 mr-2 text-indigo-500" />
                <span>Pipeline Stage Breakdown</span>
              </h3>
              <span className="text-[9px] font-extrabold bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase tracking-wider">Value</span>
            </div>

            <div className="space-y-3.5 pt-1">
              {pipelineStages.map((stage) => (
                <div key={stage.name} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-brand-text flex items-center">
                      <span className={`h-2.5 w-2.5 rounded-full mr-2 shrink-0 ${stage.color}`} />
                      {stage.name}
                    </span>
                    <div className="flex items-center space-x-2.5 tabular-nums text-[10px]">
                      <span className="text-slate-400 font-bold">{stage.count} deals</span>
                      <span className="text-brand-heading font-black">{stage.value}</span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${stage.color}`} 
                      style={{ width: `${stage.pct}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-brand-border-purple/15 pt-3.5 mt-4 flex justify-between items-center text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
            <span>Win Rate Ratio: <strong className="text-emerald-600 font-black">{((wonCount / (wonCount + lostCount || 1)) * 100).toFixed(1)}%</strong></span>
            <button 
              onClick={() => onTabChange?.('leads')}
              className="text-brand-accent hover:text-brand-accent-hover font-black flex items-center space-x-1 cursor-pointer bg-transparent border-0 uppercase"
            >
              <span>View Funnel</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Chart 3: Monthly Revenue & Target Trend Line Chart */}
      <div className="bg-white border border-brand-border-purple/20 rounded-2xl p-5 shadow-sm/5 flex flex-col justify-between hover:shadow-md transition-all duration-300">
        <div>
          <div className="flex items-center justify-between border-b border-slate-55 pb-3 mb-4">
            <h3 className="font-extrabold text-brand-heading text-sm flex items-center">
              <TrendingUp className="h-4.5 w-4.5 mr-2 text-emerald-500" />
              <span>Monthly Revenue Trend vs Target</span>
            </h3>
            <div className="flex items-center space-x-4 text-[10px] font-black uppercase">
              <div className="flex items-center space-x-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-brand-accent inline-block" />
                <span className="text-brand-text">Actual Won (₹M)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300 inline-block" />
                <span className="text-slate-455">Target Quota (₹M)</span>
              </div>
            </div>
          </div>

          {/* Visual SVG Line Chart */}
          <div className="relative h-28 w-full pt-1">
            <svg 
              className="w-full h-full overflow-visible" 
              viewBox="0 0 600 140" 
              preserveAspectRatio="none"
              onMouseLeave={() => setHoveredMonthIdx(null)}
            >
              {/* Grid Lines */}
              <line x1="0" y1="20" x2="600" y2="20" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="60" x2="600" y2="60" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="100" x2="600" y2="100" stroke="#f1f5f9" strokeWidth="1" />

              {/* Target Quota Dashed Line */}
              <path 
                d="M 50 100 L 150 95 L 250 80 L 350 75 L 450 65 L 550 50" 
                fill="none" 
                stroke="#cbd5e1" 
                strokeWidth="2" 
                strokeDasharray="4 4" 
              />

              {/* Actual Revenue Gradient Area */}
              <path 
                d={`M 50 130 ${monthlyForecast.map(pt => `L ${pt.x} ${pt.y}`).join(' ')} L 550 130 Z`} 
                fill="url(#managerGradient)" 
                opacity="0.12" 
              />

              {/* Actual Revenue Line */}
              <path 
                d={monthlyForecast.map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ')} 
                fill="none" 
                stroke="#7957fb" 
                strokeWidth="3.25" 
                strokeLinecap="round" 
              />

              {/* Data Points */}
              {monthlyForecast.map((pt, idx) => {
                const isHovered = hoveredMonthIdx === idx;
                return (
                  <g key={pt.month} className="pointer-events-none">
                    <circle 
                      cx={pt.x} 
                      cy={pt.y} 
                      r={isHovered ? "6" : "3.5"} 
                      fill={isHovered ? "#ffffff" : "#7957fb"} 
                      stroke="#7957fb" 
                      strokeWidth={isHovered ? "3.5" : "1.5"} 
                      className="transition-all duration-150"
                    />
                  </g>
                );
              })}

              {/* Tooltip Overlay */}
              {hoveredMonthIdx !== null && (
                <g className="pointer-events-none">
                  <line
                    x1={monthlyForecast[hoveredMonthIdx].x}
                    y1={monthlyForecast[hoveredMonthIdx].y}
                    x2={monthlyForecast[hoveredMonthIdx].x}
                    y2="130"
                    stroke="#7957fb"
                    strokeWidth="1"
                    strokeDasharray="3,3"
                  />
                  <circle
                    cx={monthlyForecast[hoveredMonthIdx].x}
                    cy={monthlyForecast[hoveredMonthIdx].y}
                    r="10"
                    fill="#7957fb"
                    fillOpacity="0.15"
                    className="animate-ping"
                  />
                  <foreignObject
                    x={monthlyForecast[hoveredMonthIdx].x - 55}
                    y={monthlyForecast[hoveredMonthIdx].y - 65}
                    width="110"
                    height="60"
                  >
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-center shadow-lg select-none animate-in fade-in zoom-in-95 duration-150">
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{monthlyForecast[hoveredMonthIdx].month}</p>
                      <p className="text-[10px] font-black text-white tabular-nums">Actual: ₹{monthlyForecast[hoveredMonthIdx].actual}M</p>
                      <p className="text-[9px] font-bold text-slate-400 tabular-nums">Target: ₹{monthlyForecast[hoveredMonthIdx].target}M</p>
                    </div>
                  </foreignObject>
                </g>
              )}

              {/* Transparent Interceptors for Column-Based Hovering */}
              {monthlyForecast.map((pt, idx) => (
                <rect
                  key={`hover-interceptor-month-${idx}`}
                  x={pt.x - 50}
                  y="0"
                  width="100"
                  height="140"
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredMonthIdx(idx)}
                />
              ))}

              <defs>
                <linearGradient id="managerGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7957fb" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#7957fb" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>

            {/* X-Axis Labels */}
            <div className="flex justify-between px-10 text-[9px] font-extrabold text-slate-400 mt-2">
              {monthlyForecast.map((pt) => (
                <span key={pt.month}>{pt.month}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard & Risk Deals splits */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Leaderboard Ranking (Col 7) */}
        <div className="col-span-12 lg:col-span-7 bg-white border border-brand-border-purple/20 rounded-2xl p-5 shadow-sm/5 flex flex-col justify-between hover:shadow-md transition-all duration-300">
          <div>
            <div className="flex items-center justify-between border-b border-slate-55 pb-3 mb-4">
              <h3 className="font-extrabold text-brand-heading text-sm flex items-center">
                <Award className="h-4.5 w-4.5 mr-2 text-brand-accent" />
                <span>Top Performing Sales Representatives</span>
              </h3>
              <span className="text-[9px] font-extrabold bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase tracking-wider">Quota Attainment</span>
            </div>

            <div className="space-y-3">
              {leaderboards.length > 0 ? (
                leaderboards.slice(0, 4).map((rep) => (
                  <div key={rep.rank} className="flex items-center justify-between p-3 border border-brand-border-purple/15 rounded-xl bg-slate-50/50 hover:bg-slate-50/80 transition-colors">
                    <div className="flex items-center space-x-3">
                      <span className="text-xs font-black text-brand-accent w-4">#{rep.rank}</span>
                      <img src={rep.avatar} alt={rep.name} className="h-8 w-8 rounded-full object-cover border border-slate-200" />
                      <div>
                        <p className="text-xs font-extrabold text-brand-text">{rep.name}</p>
                        <p className="text-[9px] text-slate-400 font-bold mt-0.5">Deals Closed: {rep.deals}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-extrabold text-brand-heading tabular-nums">{rep.wonFormatted}</p>
                      <div className="w-24 bg-slate-150 h-1.5 rounded-full overflow-hidden mt-1.5 ml-auto">
                        <div className="h-full bg-brand-accent rounded-full" style={{ width: `${rep.progress}%` }} />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-450 font-bold py-8 text-center">No representative records.</p>
              )}
            </div>
          </div>
          
          <div className="border-t border-brand-border-purple/15 pt-3 mt-4 flex justify-end">
            <button 
              onClick={() => onTabChange?.('team performance')}
              className="text-xs font-bold text-brand-accent hover:text-brand-accent-hover transition-colors flex items-center space-x-1 cursor-pointer bg-transparent border-0 uppercase"
            >
              <span>View full leaderboard</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Risk Deals (Col 5) */}
        <div className="col-span-12 lg:col-span-5 bg-white border border-brand-border-purple/20 rounded-2xl p-5 shadow-sm/5 flex flex-col justify-between hover:shadow-md transition-all duration-300">
          <div>
            <div className="flex items-center justify-between border-b border-slate-55 pb-3 mb-4">
              <h3 className="font-extrabold text-brand-heading text-sm flex items-center">
                <AlertTriangle className="h-4.5 w-4.5 mr-2 text-rose-500" />
                <span>Deals At Risk</span>
              </h3>
              <span className="text-[9px] font-extrabold bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-100/50 uppercase tracking-wider">Escalated</span>
            </div>

            <div className="space-y-3">
              {riskDeals.length > 0 ? (
                riskDeals.map((deal) => (
                  <div key={deal.id} className="p-3 border border-rose-150 rounded-xl bg-rose-50/15 hover:bg-rose-50/25 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-extrabold text-brand-text leading-tight">{deal.title}</h4>
                        <p className="text-[10px] text-brand-accent font-bold mt-1">{deal.company}</p>
                      </div>
                      <span className="text-xs font-black text-rose-600 tabular-nums shrink-0">{deal.value}</span>
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-rose-100/50 text-[10px] font-semibold text-slate-455">
                      <span className="flex items-center gap-1.5">
                        <img src={deal.avatar} alt={deal.rep} className="h-4.5 w-4.5 rounded-full object-cover border border-slate-100" />
                        Owner: {deal.rep}
                      </span>
                      <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-black uppercase tracking-wider text-[8px]">
                        {deal.risk}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-450 font-bold py-10 text-center">No active pipeline at risk.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Command Alerts & Signals */}
      <div className="bg-white border border-brand-border-purple/20 rounded-2xl p-5 shadow-sm/5 space-y-4 hover:shadow-md transition-all duration-300">
        <h3 className="font-extrabold text-brand-heading text-xs uppercase tracking-wider flex items-center border-b border-slate-55 pb-2.5">
          <BellRing className="h-4.5 w-4.5 mr-2 text-brand-accent" />
          <span>Manager Command Alerts & Signals</span>
        </h3>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div 
              key={alert.id} 
              className={`p-3.5 rounded-xl border text-xs font-bold flex items-start justify-between space-x-2.5 ${
                alert.type === 'warning' 
                  ? 'bg-rose-50/80 border-rose-100 text-rose-900' 
                  : alert.type === 'success'
                  ? 'bg-emerald-50/80 border-emerald-100 text-emerald-900'
                  : 'bg-indigo-50/50 border-brand-border-purple/25 text-brand-text'
              }`}
            >
              <div className="flex items-start space-x-2.5">
                {alert.type === 'warning' ? (
                  <ShieldAlert className="h-4.5 w-4.5 shrink-0 mt-0.5 text-rose-600" />
                ) : alert.type === 'success' ? (
                  <CheckCircle2 className="h-4.5 w-4.5 shrink-0 mt-0.5 text-emerald-600" />
                ) : (
                  <Sparkles className="h-4.5 w-4.5 shrink-0 mt-0.5 text-indigo-500" />
                )}
                <span>{alert.text}</span>
              </div>
              <span className={`text-[8.5px] font-black uppercase tracking-wider shrink-0 px-2 py-0.5 rounded border ${
                alert.type === 'warning' ? 'bg-rose-100/50 border-rose-200 text-rose-700' :
                alert.type === 'success' ? 'bg-emerald-100/50 border-emerald-200 text-emerald-700' :
                'bg-indigo-100/50 border-brand-border-purple/20 text-indigo-700'
              }`}>{alert.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Team Activity Logs Feed */}
      <div className="bg-white border border-brand-border-purple/20 rounded-2xl p-5 shadow-sm/5 hover:shadow-md transition-all duration-300">
        <h3 className="font-extrabold text-brand-heading text-xs uppercase tracking-wider mb-4 flex items-center border-b border-slate-55 pb-2.5">
          <Activity className="h-4.5 w-4.5 mr-2 text-brand-accent" />
          <span>Recent Team Activity Log</span>
        </h3>
        <div className="divide-y divide-slate-100">
          {recentActivities.length > 0 ? (
            recentActivities.map((act, idx) => (
              <div key={idx} className="py-3 flex items-start space-x-3.5 text-xs font-semibold first:pt-0 last:pb-0">
                <img src={act.avatar} alt={act.actor} className="h-7 w-7 rounded-full object-cover border border-slate-200 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-brand-text/90 leading-relaxed">
                    <span className="font-black text-brand-text">{act.actor}</span> {act.action}
                  </p>
                  <span className="text-[9.5px] text-slate-455 font-extrabold flex items-center mt-1">
                    <Clock className="h-3 w-3 mr-1 text-slate-400" />
                    {act.time}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-450 font-bold py-6 text-center">No recent logs found.</p>
          )}
        </div>

        <div className="border-t border-brand-border-purple/15 mt-4 pt-3 flex justify-end">
          <button 
            onClick={() => onTabChange?.('reports')}
            className="text-xs font-bold text-brand-accent hover:text-brand-accent-hover transition-colors flex items-center space-x-1 cursor-pointer bg-transparent border-0 uppercase"
          >
            <span>View all reports</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
