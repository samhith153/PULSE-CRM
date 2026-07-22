'use client';

import React, { useState } from 'react';
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
  PieChart,
  DollarSign,
  Layers,
  CheckCircle2,
  Calendar
} from 'lucide-react';

interface ManagerDashboardViewProps {
  onTabChange?: (tab: string) => void;
}

export default function ManagerDashboardView({ onTabChange }: ManagerDashboardViewProps) {
  const [hoveredQuotaIdx, setHoveredQuotaIdx] = useState<number | null>(null);
  const [hoveredMonthIdx, setHoveredMonthIdx] = useState<number | null>(null);

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
    { rank: 1, name: "Sarah Johnson", won: 1180000, target: 1250000, wonFormatted: "₹1,180,000", targetFormatted: "₹1.25M", deals: 8, progress: 94 },
    { rank: 2, name: "Alex Johnson", won: 920000, target: 1000000, wonFormatted: "₹920,000", targetFormatted: "₹1.00M", deals: 6, progress: 92 },
    { rank: 3, name: "David Wilson", won: 750050, target: 900000, wonFormatted: "₹750,050", targetFormatted: "₹0.90M", deals: 4, progress: 83 },
    { rank: 4, name: "Jessica Taylor", won: 640000, target: 800000, wonFormatted: "₹640,000", targetFormatted: "₹0.80M", deals: 5, progress: 80 }
  ];

  const pipelineStages = [
    { name: "Prospecting", value: "₹1.45M", count: 34, pct: 100, color: "bg-purple-600" },
    { name: "Qualification", value: "₹1.12M", count: 26, pct: 82, color: "bg-indigo-500" },
    { name: "Proposal Sent", value: "₹980K", count: 18, pct: 64, color: "bg-blue-500" },
    { name: "Negotiation", value: "₹720K", count: 12, pct: 45, color: "bg-sky-500" },
    { name: "Closed Won", value: "₹2.38M", count: 23, pct: 32, color: "bg-emerald-500" }
  ];

  const monthlyForecast = [
    { month: "Jan", actual: 1.8, target: 2.0 },
    { month: "Feb", actual: 2.1, target: 2.1 },
    { month: "Mar", actual: 2.5, target: 2.4 },
    { month: "Apr", actual: 2.2, target: 2.5 },
    { month: "May", actual: 2.8, target: 2.7 },
    { month: "Jun", actual: 3.45, target: 3.0 }
  ];

  const activities = [
    { time: "10 mins ago", actor: "Sarah Johnson", action: "moved deal 'TechCorp Cloud' to Proposal stage" },
    { time: "45 mins ago", actor: "Alex Johnson", action: "logged outbound client call with Helena Troy" },
    { time: "2 hours ago", actor: "David Wilson", action: "scheduled demo meeting with Empiric Logistics" }
  ];

  return (
    <div className="space-y-6">
      {/* Top Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-sans text-brand-heading tracking-tight font-bold">
            Sales Manager Dashboard
          </h1>
          <p className="text-xs md:text-sm text-brand-text/75 mt-1 font-medium tracking-wide">
            Team revenue performance metrics, conversion funnels, and quota analytics.
          </p>
        </div>
      </div>

      {/* KPI Core Summary Cards */}
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
            <div className="h-full bg-purple-600" style={{ width: '40%' }} title="Qualified" />
            <div className="h-full bg-indigo-500" style={{ width: '30%' }} title="Proposal" />
            <div className="h-full bg-sky-400" style={{ width: '30%' }} title="Negotiation" />
          </div>
        </div>
      </div>

      {/* Sales Manager Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Team Quota vs Attainment Bar Chart */}
        <div className="col-span-12 lg:col-span-7 bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-brand-heading text-sm flex items-center">
              <BarChart3 className="h-4.5 w-4.5 mr-2 text-brand-accent" />
              <span>Rep Sales Quota Attainment</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Quarter</span>
          </div>

          {/* Bar Chart Visual */}
          <div className="space-y-4 pt-2">
            {leaderboards.map((rep, idx) => {
              const pct = Math.round((rep.won / rep.target) * 100);
              return (
                <div 
                  key={rep.name}
                  onMouseEnter={() => setHoveredQuotaIdx(idx)}
                  onMouseLeave={() => setHoveredQuotaIdx(null)}
                  className="space-y-1.5 cursor-pointer p-2 rounded-lg transition-colors hover:bg-slate-50"
                >
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-brand-text flex items-center">
                      <span className="w-4 text-brand-accent font-black text-[10px]">#{rep.rank}</span>
                      {rep.name}
                    </span>
                    <div className="flex items-center space-x-2 tabular-nums">
                      <span className="text-brand-heading font-extrabold">{rep.wonFormatted}</span>
                      <span className="text-slate-400 text-[10px] font-normal">/ {rep.targetFormatted}</span>
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                        pct >= 90 ? 'bg-emerald-50 text-emerald-700' : 'bg-purple-50 text-purple-700'
                      }`}>
                        {pct}%
                      </span>
                    </div>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden relative">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        hoveredQuotaIdx === idx ? 'bg-purple-600 shadow-sm' : 'bg-brand-accent'
                      }`} 
                      style={{ width: `${Math.min(pct, 100)}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-brand-border-purple/15 pt-3 flex items-center justify-between text-[11px] font-semibold text-slate-500">
            <span>Average Team Quota Attainment: <strong className="text-brand-heading">87.8%</strong></span>
            <button 
              onClick={() => onTabChange?.('team performance')}
              className="text-brand-accent hover:text-brand-accent-hover font-bold flex items-center space-x-1 cursor-pointer bg-transparent border-0"
            >
              <span>Detailed Breakdown</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Chart 2: Pipeline Conversion Funnel */}
        <div className="col-span-12 lg:col-span-5 bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-brand-heading text-sm flex items-center">
              <Layers className="h-4.5 w-4.5 mr-2 text-indigo-500" />
              <span>Pipeline Stage Breakdown</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Volume & Value</span>
          </div>

          <div className="space-y-3 pt-1">
            {pipelineStages.map((stage) => (
              <div key={stage.name} className="space-y-1">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-brand-text flex items-center">
                    <span className={`h-2 w-2 rounded-full mr-2 ${stage.color}`} />
                    {stage.name}
                  </span>
                  <div className="flex items-center space-x-2 tabular-nums text-[11px]">
                    <span className="text-slate-400 font-semibold">{stage.count} deals</span>
                    <span className="text-brand-heading font-extrabold">{stage.value}</span>
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

          <div className="border-t border-brand-border-purple/15 pt-3 flex justify-between items-center text-[11px] font-semibold text-slate-500">
            <span>Funnel Conversion Rate: <strong className="text-emerald-600 font-bold">22.4%</strong></span>
            <button 
              onClick={() => onTabChange?.('pipeline')}
              className="text-brand-accent hover:text-brand-accent-hover font-bold flex items-center space-x-1 cursor-pointer bg-transparent border-0"
            >
              <span>View Pipeline</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Chart 3: Monthly Revenue & Target Trend Line Chart */}
        <div className="col-span-12 bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-brand-heading text-sm flex items-center">
              <TrendingUp className="h-4.5 w-4.5 mr-2 text-emerald-500" />
              <span>Monthly Revenue Trend vs Target (H1 2025)</span>
            </h3>
            <div className="flex items-center space-x-4 text-xs font-bold">
              <div className="flex items-center space-x-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-brand-accent inline-block" />
                <span className="text-brand-text">Actual Won (₹M)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300 inline-block" />
                <span className="text-slate-400">Target Quota (₹M)</span>
              </div>
            </div>
          </div>

          {/* Visual SVG Line Chart */}
          <div className="relative h-48 w-full pt-4">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 600 140" preserveAspectRatio="none">
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
                d="M 50 110 L 150 95 L 250 75 L 350 90 L 450 60 L 550 30 L 550 130 L 50 130 Z" 
                fill="url(#managerGradient)" 
                opacity="0.2" 
              />

              {/* Actual Revenue Line */}
              <path 
                d="M 50 110 L 150 95 L 250 75 L 350 90 L 450 60 L 550 30" 
                fill="none" 
                stroke="#7957fb" 
                strokeWidth="3" 
                strokeLinecap="round" 
              />

              {/* Data Points */}
              {monthlyForecast.map((pt, idx) => {
                const x = 50 + idx * 100;
                const yMap: { [key: number]: number } = { 0: 110, 1: 95, 2: 75, 3: 90, 4: 60, 5: 30 };
                const y = yMap[idx];
                const isHovered = hoveredMonthIdx === idx;

                return (
                  <g key={pt.month} className="cursor-pointer" onMouseEnter={() => setHoveredMonthIdx(idx)} onMouseLeave={() => setHoveredMonthIdx(null)}>
                    <circle cx={x} cy={y} r={isHovered ? "6" : "4"} fill="#7957fb" stroke="#ffffff" strokeWidth="2" />
                    {isHovered && (
                      <g>
                        <rect x={x - 35} y={y - 30} width="70" height="22" rx="4" fill="#0f172a" opacity="0.9" />
                        <text x={x} y={y - 15} textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">
                          ₹{pt.actual}M
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              <defs>
                <linearGradient id="managerGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7957fb" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#7957fb" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>

            {/* X-Axis Labels */}
            <div className="flex justify-between px-10 text-[10px] font-extrabold text-slate-400 mt-2">
              {monthlyForecast.map((pt) => (
                <span key={pt.month}>{pt.month} 2025</span>
              ))}
            </div>
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
                  <p className="text-xs font-extrabold text-brand-heading tabular-nums">{rep.wonFormatted}</p>
                  <div className="w-24 bg-slate-150 h-1.5 rounded-full overflow-hidden mt-1.5 ml-auto">
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

      {/* Moved Down: Manager Alerts & Signals */}
      <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 space-y-3">
        <h3 className="font-extrabold text-brand-heading text-xs uppercase tracking-wider mb-1 flex items-center">
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
