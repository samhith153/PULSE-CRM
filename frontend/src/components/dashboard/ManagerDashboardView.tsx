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
  Layers,
  Calendar,
  Clock,
  ArrowRight,
  TrendingDown,
  Info,
  CheckCircle2
} from 'lucide-react';

interface ManagerDashboardViewProps {
  onTabChange?: (tab: string) => void;
}

export default function ManagerDashboardView({ onTabChange }: ManagerDashboardViewProps) {
  const [hoveredQuotaIdx, setHoveredQuotaIdx] = useState<number | null>(null);
  const [hoveredMonthIdx, setHoveredMonthIdx] = useState<number | null>(null);

  const alerts = [
    { id: 1, text: "3 high-value enterprise deals have no follow-up activity scheduled for > 5 days.", type: "warning", time: "Action Required" },
    { id: 2, text: "Stark Industries deal (₹230,000) stage probability updated to 85% by Sarah.", type: "info", time: "2h ago" },
    { id: 3, text: "Monthly team quota is currently at 76% completion with 12 days remaining.", type: "success", time: "On Track" }
  ];

  const teamRevenue = {
    won: 2380000,
    target: 3000000,
    pipeline: 4850000,
    growth: "+18.4%"
  };

  const riskDeals = [
    { id: 1, title: "Database Cloud Migration", company: "TechCorp Inc.", value: "₹120,000", rep: "Sarah Johnson", risk: "No contact in 7 days", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&fit=crop&q=80" },
    { id: 2, title: "Compliance Suite Expansion", company: "MedSaaS Solutions", value: "₹85,000", rep: "Alex Johnson", risk: "Legal Review delayed", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&fit=crop&q=80" }
  ];

  const leaderboards = [
    { rank: 1, name: "Sarah Johnson", won: 1180000, target: 1250000, wonFormatted: "₹1,180,000", targetFormatted: "₹1.25M", deals: 8, progress: 94, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&fit=crop&q=80" },
    { rank: 2, name: "Alex Johnson", won: 920000, target: 1000000, wonFormatted: "₹920,000", targetFormatted: "₹1.00M", deals: 6, progress: 92, avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&fit=crop&q=80" },
    { rank: 3, name: "David Wilson", won: 750050, target: 900000, wonFormatted: "₹750,050", targetFormatted: "₹0.90M", deals: 4, progress: 83, avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&fit=crop&q=80" },
    { rank: 4, name: "Jessica Taylor", won: 640000, target: 800000, wonFormatted: "₹640,000", targetFormatted: "₹0.80M", deals: 5, progress: 80, avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&fit=crop&q=80" }
  ];

  const pipelineStages = [
    { name: "Prospecting", value: "₹1.45M", count: 34, pct: 100, color: "bg-purple-600", textColor: "text-purple-600", lightBg: "bg-purple-50" },
    { name: "Qualification", value: "₹1.12M", count: 26, pct: 82, color: "bg-indigo-500", textColor: "text-indigo-500", lightBg: "bg-indigo-50" },
    { name: "Proposal Sent", value: "₹980K", count: 18, pct: 64, color: "bg-blue-500", textColor: "text-blue-500", lightBg: "bg-blue-50" },
    { name: "Negotiation", value: "₹720K", count: 12, pct: 45, color: "bg-sky-500", textColor: "text-sky-500", lightBg: "bg-sky-50" },
    { name: "Closed Won", value: "₹2.38M", count: 23, pct: 32, color: "bg-emerald-500", textColor: "text-emerald-500", lightBg: "bg-emerald-50" }
  ];

  const monthlyForecast = [
    { month: "Jan", actual: 1.8, target: 2.0, x: 50, y: 110 },
    { month: "Feb", actual: 2.1, target: 2.1, x: 150, y: 95 },
    { month: "Mar", actual: 2.5, target: 2.4, x: 250, y: 75 },
    { month: "Apr", actual: 2.2, target: 2.5, x: 350, y: 90 },
    { month: "May", actual: 2.8, target: 2.7, x: 450, y: 60 },
    { month: "Jun", actual: 3.45, target: 3.0, x: 550, y: 30 }
  ];

  const activities = [
    { time: "10 mins ago", actor: "Sarah Johnson", action: "moved deal 'TechCorp Cloud' to Proposal stage", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&fit=crop&q=80" },
    { time: "45 mins ago", actor: "Alex Johnson", action: "logged outbound client call with Helena Troy", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&fit=crop&q=80" },
    { time: "2 hours ago", actor: "David Wilson", action: "scheduled demo meeting with Empiric Logistics", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&fit=crop&q=80" }
  ];

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
              Hello Alex. Your team is on track to hit Q2 forecast. Quota completion is at 79.3%.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0 self-start md:self-auto bg-white/60 backdrop-blur-md border border-brand-border-purple/20 px-3.5 py-2 rounded-xl text-xs font-bold text-brand-text/80 shadow-sm/5">
          <Calendar className="h-4 w-4 text-brand-accent mr-1.5" />
          <span className="tabular-nums">Fiscal Period: H1 2025</span>
        </div>
      </div>

      {/* KPI Core Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Team Revenue Progress */}
        <div className="bg-white border border-brand-border-purple/20 border-l-4 border-l-emerald-500 rounded-2xl p-5 shadow-sm/5 flex flex-col justify-between min-h-[135px] hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-extrabold text-brand-text/60 uppercase tracking-wider">Team Revenue Won</span>
            <span className="text-[9px] font-extrabold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100/50 tabular-nums">
              {teamRevenue.growth}
            </span>
          </div>
          <div className="mt-2.5">
            <h4 className="text-2xl font-black text-brand-heading">₹{teamRevenue.won.toLocaleString()}</h4>
            <p className="text-[9px] text-slate-450 mt-1 font-bold">
              Target Quota: ₹{teamRevenue.target.toLocaleString()}
            </p>
          </div>
          <div className="mt-3">
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(teamRevenue.won / teamRevenue.target) * 100}%` }} />
            </div>
            <div className="flex justify-between text-[8px] font-extrabold text-slate-400 mt-1 uppercase">
              <span>Progress</span>
              <span>{Math.round((teamRevenue.won / teamRevenue.target) * 100)}% achieved</span>
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
            <h4 className="text-2xl font-black text-brand-heading">₹3,450,000</h4>
            <p className="text-[9px] text-slate-450 mt-1 font-bold">
              Projected for Q3 Ending (Confidence 88%)
            </p>
          </div>
          <div className="mt-3">
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-brand-accent rounded-full" style={{ width: '88%' }} />
            </div>
            <div className="flex justify-between text-[8px] font-extrabold text-slate-400 mt-1 uppercase">
              <span>Weighted Projection</span>
              <span>88% accuracy</span>
            </div>
          </div>
        </div>

        {/* Pipeline Health */}
        <div className="bg-white border border-brand-border-purple/20 border-l-4 border-l-indigo-500 rounded-2xl p-5 shadow-sm/5 flex flex-col justify-between min-h-[135px] hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-extrabold text-brand-text/60 uppercase tracking-wider">Pipeline Health</span>
            <span className="text-[9px] font-extrabold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100/50">
              Strong
            </span>
          </div>
          <div className="mt-2.5">
            <h4 className="text-2xl font-black text-brand-heading">₹{teamRevenue.pipeline.toLocaleString()}</h4>
            <p className="text-[9px] text-slate-450 mt-1 font-bold">
              Active Deals Funnel Volume
            </p>
          </div>
          <div className="mt-3">
            <div className="flex space-x-1.5 h-2 rounded-full overflow-hidden">
              <div className="h-full bg-purple-600 rounded-l" style={{ width: '40%' }} title="Qualified" />
              <div className="h-full bg-indigo-500" style={{ width: '30%' }} title="Proposal" />
              <div className="h-full bg-sky-400 rounded-r" style={{ width: '30%' }} title="Negotiation" />
            </div>
            <div className="flex justify-between text-[8px] font-extrabold text-slate-400 mt-1 uppercase">
              <span>Distribution</span>
              <span>40% Qual | 30% Prop | 30% Neg</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Manager Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Chart 1: Team Quota vs Attainment Bar Chart */}
        <div className="col-span-12 lg:col-span-7 bg-white border border-brand-border-purple/20 rounded-2xl p-5 shadow-sm/5 flex flex-col justify-between hover:shadow-md transition-all duration-300">
          <div>
            <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-4">
              <h3 className="font-extrabold text-brand-heading text-sm flex items-center">
                <BarChart3 className="h-4.5 w-4.5 mr-2 text-brand-accent" />
                <span>Rep Sales Quota Attainment</span>
              </h3>
              <span className="text-[9px] font-extrabold bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase tracking-wider">Current Quarter</span>
            </div>

            {/* Bar Chart Visual */}
            <div className="space-y-4 pt-1">
              {leaderboards.map((rep, idx) => {
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
                        <img src={rep.avatar} alt={rep.name} className="h-5.5 w-5.5 rounded-full object-cover border border-slate-200 animate-in fade-in duration-200" />
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
              })}
            </div>
          </div>

          <div className="border-t border-brand-border-purple/15 pt-3.5 mt-4 flex items-center justify-between text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
            <span>Average Quota Attainment: <strong className="text-brand-heading font-black">87.8%</strong></span>
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
            <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-4">
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
            <span>Stage Conversion: <strong className="text-emerald-600 font-black">22.4%</strong></span>
            <button 
              onClick={() => onTabChange?.('leads')}
              className="text-brand-accent hover:text-brand-accent-hover font-black flex items-center space-x-1 cursor-pointer bg-transparent border-0 uppercase"
            >
              <span>View Funnel</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Chart 3: Monthly Revenue & Target Trend Line Chart */}
        <div className="col-span-12 bg-white border border-brand-border-purple/20 rounded-2xl p-5 shadow-sm/5 flex flex-col justify-between hover:shadow-md transition-all duration-300">
          <div>
            <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-4">
              <h3 className="font-extrabold text-brand-heading text-sm flex items-center">
                <TrendingUp className="h-4.5 w-4.5 mr-2 text-emerald-500" />
                <span>Monthly Revenue Trend vs Target (H1 2025)</span>
              </h3>
              <div className="flex items-center space-x-4 text-[10px] font-black uppercase">
                <div className="flex items-center space-x-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-brand-accent inline-block" />
                  <span className="text-brand-text">Actual Won (₹M)</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300 inline-block" />
                  <span className="text-slate-450">Target Quota (₹M)</span>
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
                  d="M 50 110 L 150 95 L 250 75 L 350 90 L 450 60 L 550 30 L 550 130 L 50 130 Z" 
                  fill="url(#managerGradient)" 
                  opacity="0.12" 
                />

                {/* Actual Revenue Line */}
                <path 
                  d="M 50 110 L 150 95 L 250 75 L 350 90 L 450 60 L 550 30" 
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
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{monthlyForecast[hoveredMonthIdx].month} 2025</p>
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
                  <span key={pt.month}>{pt.month} 2025</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard & Risk Deals splits */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Leaderboard Ranking (Col 7) */}
        <div className="col-span-12 lg:col-span-7 bg-white border border-brand-border-purple/20 rounded-2xl p-5 shadow-sm/5 flex flex-col justify-between hover:shadow-md transition-all duration-300">
          <div>
            <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-4">
              <h3 className="font-extrabold text-brand-heading text-sm flex items-center">
                <Award className="h-4.5 w-4.5 mr-2 text-brand-accent" />
                <span>Top Performing Sales Representatives</span>
              </h3>
              <span className="text-[9px] font-extrabold bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase tracking-wider">Quota Attainment</span>
            </div>

            <div className="space-y-3">
              {leaderboards.map((rep) => (
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
              ))}
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
            <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-4">
              <h3 className="font-extrabold text-brand-heading text-sm flex items-center">
                <AlertTriangle className="h-4.5 w-4.5 mr-2 text-rose-500" />
                <span>Deals At Risk</span>
              </h3>
              <span className="text-[9px] font-extrabold bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-100/50 uppercase tracking-wider">Escalated</span>
            </div>

            <div className="space-y-3">
              {riskDeals.map((deal) => (
                <div key={deal.id} className="p-3 border border-rose-150 rounded-xl bg-rose-50/15 hover:bg-rose-50/25 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-extrabold text-brand-text leading-tight">{deal.title}</h4>
                      <p className="text-[10px] text-brand-accent font-bold mt-1">{deal.company}</p>
                    </div>
                    <span className="text-xs font-black text-rose-600 tabular-nums shrink-0">{deal.value}</span>
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-rose-100/50 text-[10px] font-semibold text-slate-450">
                    <span className="flex items-center gap-1.5">
                      <img src={deal.avatar} alt={deal.rep} className="h-4.5 w-4.5 rounded-full object-cover border border-slate-100" />
                      Owner: {deal.rep}
                    </span>
                    <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-black uppercase tracking-wider text-[8px]">
                      {deal.risk}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Moved Down: Manager Alerts & Signals */}
      <div className="bg-white border border-brand-border-purple/20 rounded-2xl p-5 shadow-sm/5 space-y-4 hover:shadow-md transition-all duration-300">
        <h3 className="font-extrabold text-brand-heading text-xs uppercase tracking-wider flex items-center border-b border-slate-50 pb-2.5">
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
        <h3 className="font-extrabold text-brand-heading text-xs uppercase tracking-wider mb-4 flex items-center border-b border-slate-50 pb-2.5">
          <Activity className="h-4.5 w-4.5 mr-2 text-brand-accent" />
          <span>Recent Team Activity Log</span>
        </h3>
        <div className="divide-y divide-slate-100">
          {activities.map((act, idx) => (
            <div key={idx} className="py-3 flex items-start space-x-3.5 text-xs font-semibold first:pt-0 last:pb-0">
              <img src={act.avatar} alt={act.actor} className="h-7 w-7 rounded-full object-cover border border-slate-200 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-brand-text/90 leading-relaxed">
                  <span className="font-black text-brand-text">{act.actor}</span> {act.action}
                </p>
                <span className="text-[9.5px] text-slate-450 font-extrabold flex items-center mt-1">
                  <Clock className="h-3 w-3 mr-1 text-slate-400" />
                  {act.time}
                </span>
              </div>
            </div>
          ))}
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
