'use client';

import React from 'react';
import { 
  TrendingUp, 
  Target, 
  AlertTriangle, 
  Users, 
  ArrowUpRight, 
  Activity, 
  BellRing, 
  ShieldAlert,
  Briefcase,
  Sparkles,
  Award,
  CircleDot
} from 'lucide-react';

interface ManagerDashboardViewProps {
  onTabChange?: (tab: string) => void;
}

export default function ManagerDashboardView({ onTabChange }: ManagerDashboardViewProps) {
  const alerts = [
    { id: 1, text: "3 high-value enterprise deals have no follow-up activity scheduled for > 5 days.", type: "warning" },
    { id: 2, text: "Stark Industries deal (₹230,000) stage probability updated to 85% by Sarah.", type: "info" },
    { id: 3, text: "Monthly team quota is currently at 76% completion with 12 days remaining.", type: "success" }
  ];

  const teamRevenue = {
    won: 2380000,
    target: 3000000,
    pipeline: 4850000,
    growth: "+18.4%"
  };

  const riskDeals = [
    { id: 1, title: "Database Cloud Migration", company: "TechCorp Inc.", value: "₹120,000", rep: "Sarah Johnson", risk: "No contact in 7 days" },
    { id: 2, title: "Compliance Suite Expansion", company: "MedSaaS Solutions", value: "₹85,000", rep: "Alex Johnson", risk: "Legal Review delayed" }
  ];

  const leaderboards = [
    { rank: 1, name: "Sarah Johnson", won: "₹1,180,000", deals: 8, progress: 95 },
    { rank: 2, name: "Alex Johnson", won: "₹920,000", deals: 6, progress: 85 },
    { rank: 3, name: "David Wilson", won: "₹750,050", deals: 4, progress: 75 }
  ];

  const activities = [
    { time: "10 mins ago", actor: "Sarah Johnson", action: "moved deal 'TechCorp Cloud' to Proposal stage" },
    { time: "45 mins ago", actor: "Alex Johnson", action: "logged outbound client call with Helena Troy" },
    { time: "2 hours ago", actor: "David Wilson", action: "scheduled demo meeting with Empiric Logistics" }
  ];

  return (
    <div className="space-y-6">
      {/* Top Welcome & Alerts */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-sans text-brand-heading tracking-tight font-bold">
            Manager Dashboard
          </h1>
          <p className="text-xs md:text-sm text-brand-text/75 mt-1 font-medium tracking-wide">
            Overview of team sales pipelines, targets achievement, and alert matrices.
          </p>
        </div>
      </div>

      {/* Alerts Grid */}
      <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5">
        <h3 className="font-extrabold text-brand-heading text-xs uppercase tracking-wider mb-3 flex items-center">
          <BellRing className="h-4 w-4 mr-2 text-brand-accent" />
          <span>Manager Alerts & Signals</span>
        </h3>
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div 
              key={alert.id} 
              className={`p-3 rounded-lg border text-xs font-bold flex items-start space-x-2.5 ${
                alert.type === 'warning' 
                  ? 'bg-rose-50 border-rose-100 text-rose-800' 
                  : alert.type === 'success'
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                  : 'bg-brand-sidebar-hover/15 border-brand-border-purple/25 text-brand-text'
              }`}
            >
              {alert.type === 'warning' ? (
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
              ) : (
                <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-brand-accent" />
              )}
              <span>{alert.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* KPI Core Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Team Revenue Progress */}
        <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-extrabold text-brand-text/60 uppercase">Team Revenue Won</span>
            <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded tabular-nums">
              {teamRevenue.growth}
            </span>
          </div>
          <div>
            <h4 className="text-2xl font-bold text-brand-heading">₹{teamRevenue.won.toLocaleString()}</h4>
            <p className="text-[10px] text-brand-text/70 mt-1 font-semibold">
              Target Quota: ₹{teamRevenue.target.toLocaleString()}
            </p>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-brand-accent rounded-full" style={{ width: `${(teamRevenue.won / teamRevenue.target) * 100}%` }} />
          </div>
        </div>

        {/* Expected Revenue Forecast */}
        <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-extrabold text-brand-text/60 uppercase">Forecast Projection</span>
            <Target className="h-4 w-4 text-brand-accent" />
          </div>
          <div>
            <h4 className="text-2xl font-bold text-brand-heading">₹3,450,000</h4>
            <p className="text-[10px] text-brand-text/70 mt-1 font-semibold">
              Projected for Q3 Ending (Confidence 88%)
            </p>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-brand-accent rounded-full" style={{ width: '88%' }} />
          </div>
        </div>

        {/* Pipeline Health */}
        <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-extrabold text-brand-text/60 uppercase">Pipeline Health</span>
            <span className="text-[10px] font-extrabold bg-blue-50 text-blue-750 px-2 py-0.5 rounded">
              Strong
            </span>
          </div>
          <div>
            <h4 className="text-2xl font-bold text-brand-heading">₹{teamRevenue.pipeline.toLocaleString()}</h4>
            <p className="text-[10px] text-brand-text/70 mt-1 font-semibold flex items-center">
              Active Deals Funnel Volume
            </p>
          </div>
          <div className="flex space-x-1 h-2 rounded-full overflow-hidden">
            <div className="h-full bg-brand-accent" style={{ width: '50%' }} title="Qualified" />
            <div className="h-full bg-brand-blue" style={{ width: '30%' }} title="Proposal" />
            <div className="h-full bg-slate-300" style={{ width: '20%' }} title="Negotiation" />
          </div>
        </div>
      </div>

      {/* Leaderboard & Risk Deals splits */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Leaderboard Ranking (Col 7) */}
        <div className="col-span-12 lg:col-span-7 bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 space-y-4">
          <h3 className="font-extrabold text-brand-heading text-sm flex items-center">
            <Award className="h-4.5 w-4.5 mr-2 text-brand-accent" />
            <span>Top Performing Sales Representatives</span>
          </h3>

          <div className="space-y-3">
            {leaderboards.map((rep) => (
              <div key={rep.rank} className="flex items-center justify-between p-3 border border-brand-border-purple/15 rounded-lg bg-slate-50/50 hover:bg-slate-50/80 transition-colors">
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-black text-brand-accent w-4">#{rep.rank}</span>
                  <div>
                    <p className="text-xs font-extrabold text-brand-text">{rep.name}</p>
                    <p className="text-[9px] text-slate-400 font-bold mt-0.5">Deals Closed: {rep.deals}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-extrabold text-brand-heading tabular-nums">{rep.won}</p>
                  <div className="w-24 bg-slate-105 h-1.5 rounded-full overflow-hidden mt-1.5 ml-auto">
                    <div className="h-full bg-brand-accent rounded-full" style={{ width: `${rep.progress}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="border-t border-brand-border-purple/15 pt-3 flex justify-end">
            <button 
              onClick={() => onTabChange?.('team performance')}
              className="text-xs font-bold text-brand-accent hover:text-brand-accent-hover transition-colors flex items-center space-x-1 cursor-pointer bg-transparent border-0"
            >
              <span>View full leaderboard</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Risk Deals (Col 5) */}
        <div className="col-span-12 lg:col-span-5 bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 space-y-4">
          <h3 className="font-extrabold text-brand-heading text-sm flex items-center">
            <AlertTriangle className="h-4.5 w-4.5 mr-2 text-rose-500" />
            <span>Deals At Risk</span>
          </h3>

          <div className="space-y-3">
            {riskDeals.map((deal) => (
              <div key={deal.id} className="p-3 border border-rose-100 rounded-lg bg-rose-50/20 hover:bg-rose-50/30 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-extrabold text-brand-text">{deal.title}</h4>
                    <p className="text-[10px] text-brand-accent font-bold mt-0.5">{deal.company}</p>
                  </div>
                  <span className="text-xs font-black text-rose-600 tabular-nums">{deal.value}</span>
                </div>
                <div className="flex justify-between items-center mt-3 pt-2 border-t border-rose-100/50 text-[10px]">
                  <span className="font-bold text-slate-400">Owner: {deal.rep}</span>
                  <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-black uppercase tracking-wider text-[8px]">
                    {deal.risk}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Activity Logs Feed */}
      <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5">
        <h3 className="font-extrabold text-brand-heading text-xs uppercase tracking-wider mb-4 flex items-center">
          <Activity className="h-4 w-4 mr-2 text-brand-accent" />
          <span>Recent Team Activity log</span>
        </h3>
        <div className="divide-y divide-slate-100">
          {activities.map((act, idx) => (
            <div key={idx} className="py-3 flex items-start space-x-3 text-xs font-semibold first:pt-0 last:pb-0">
              <div className="mt-0.5 h-2 w-2 rounded-full bg-brand-accent/50 shrink-0" />
              <div className="flex-1">
                <p className="text-brand-text/90">
                  <span className="font-extrabold text-brand-text">{act.actor}</span> {act.action}
                </p>
                <span className="text-[10px] text-slate-400 font-bold block mt-0.5">{act.time}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-brand-border-purple/15 mt-4 pt-3 flex justify-end">
          <button 
            onClick={() => onTabChange?.('reports')}
            className="text-xs font-bold text-brand-accent hover:text-brand-accent-hover transition-colors flex items-center space-x-1 cursor-pointer bg-transparent border-0"
          >
            <span>View all reports</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
