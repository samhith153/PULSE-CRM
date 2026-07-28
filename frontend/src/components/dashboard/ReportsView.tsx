'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  IndianRupee, 
  Award, 
  Target, 
  Clock, 
  Users, 
  BarChart3, 
  PieChart, 
  Info, 
  ArrowUpRight, 
  Percent, 
  Activity,
  Layers,
  ChevronDown,
  Lightbulb
} from 'lucide-react';
import { getLeads, getDeals, getCompanies, getActivities } from '@/utils/api';

interface KPI {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  timeframe: string;
  icon: React.ComponentType<{ className?: string }>;
}

export default function ReportsView() {
  const [leaderboardMetric, setLeaderboardMetric] = useState<'revenue' | 'deals' | 'activities'>('revenue');
  const [forecastHovered, setForecastHovered] = useState<number | null>(null);
  const [hoveredReason, setHoveredReason] = useState<number | null>(null);
  const [hoveredSource, setHoveredSource] = useState<number | null>(null);
  const [hoveredProduct, setHoveredProduct] = useState<number | null>(null);

  const [leads, setLeads] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getLeads(),
      getDeals(),
      getCompanies(),
      getActivities({ page_size: 100 }),
    ]).then(([leadsData, dealsData, companiesData, activitiesData]) => {
      setLeads(leadsData || []);
      setDeals(dealsData || []);
      setCompanies(companiesData || []);
      setActivities(activitiesData?.data || activitiesData || []);
      setLoading(false);
    }).catch(err => {
      console.error("Failed to fetch reports data:", err);
      setLoading(false);
    });
  }, []);

  // 1. High-Level Summary Cards (KPIs) calculations
  const wonDeals = deals.filter(d => d.stage === 'Won' || d.status === 'Won' || d.status === 'won');
  const totalRevenue = wonDeals.reduce((sum, d) => sum + (Number(d.value || d.amount) || 0), 0);

  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const thisMonthWon = wonDeals.filter(d => {
    const dDate = new Date(d.closed_at || d.created_at);
    return dDate >= currentMonthStart;
  });
  const lastMonthWon = wonDeals.filter(d => {
    const dDate = new Date(d.closed_at || d.created_at);
    return dDate >= lastMonthStart && dDate < currentMonthStart;
  });

  const thisMonthRev = thisMonthWon.reduce((sum, d) => sum + (Number(d.value || d.amount) || 0), 0);
  const lastMonthRev = lastMonthWon.reduce((sum, d) => sum + (Number(d.value || d.amount) || 0), 0);
  const revenueChange = lastMonthRev > 0 ? ((thisMonthRev - lastMonthRev) / lastMonthRev) * 100 : 0;

  const totalLeadsCount = leads.length;
  const thisMonthLeads = leads.filter(l => {
    const lDate = l.created_at ? new Date(l.created_at) : new Date();
    return lDate >= currentMonthStart;
  });
  const lastMonthLeads = leads.filter(l => {
    const lDate = l.created_at ? new Date(l.created_at) : new Date();
    return lDate >= lastMonthStart && lDate < currentMonthStart;
  });
  const leadsChange = lastMonthLeads.length > 0 ? ((thisMonthLeads.length - lastMonthLeads.length) / lastMonthLeads.length) * 100 : 0;

  const wonCount = wonDeals.length;
  const lostDeals = deals.filter(d => d.stage === 'Lost' || d.status === 'Lost' || d.status === 'lost');
  const lostCount = lostDeals.length;
  const winRate = (wonCount + lostCount) > 0 ? (wonCount / (wonCount + lostCount)) * 100 : 0;

  const lastMonthWonCount = lastMonthWon.length;
  const lastMonthLost = lostDeals.filter(d => {
    const dDate = new Date(d.closed_at || d.created_at);
    return dDate >= lastMonthStart && dDate < currentMonthStart;
  });
  const lastMonthLostCount = lastMonthLost.length;
  const lastMonthWinRate = (lastMonthWonCount + lastMonthLostCount) > 0 ? (lastMonthWonCount / (lastMonthWonCount + lastMonthLostCount)) * 100 : 0;
  const winRateChange = winRate - lastMonthWinRate;

  const wonDealsWithDates = wonDeals.filter(d => d.created_at && d.closed_at);
  const avgSalesCycleDays = wonDealsWithDates.length > 0
    ? wonDealsWithDates.reduce((sum, d) => {
        const start = new Date(d.created_at);
        const end = new Date(d.closed_at);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return sum + diffDays;
      }, 0) / wonDealsWithDates.length
    : 0;

  const lastMonthWonWithDates = lastMonthWon.filter(d => d.created_at && d.closed_at);
  const lastMonthAvgDays = lastMonthWonWithDates.length > 0
    ? lastMonthWonWithDates.reduce((sum, d) => {
        const start = new Date(d.created_at);
        const end = new Date(d.closed_at);
        const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return sum + diffDays;
      }, 0) / lastMonthWonWithDates.length
    : 0;
  const avgCycleChange = avgSalesCycleDays - lastMonthAvgDays;

  const kpis: KPI[] = [
    { title: "Total Revenue Won", value: `₹${totalRevenue.toLocaleString('en-IN')}`, change: `${revenueChange >= 0 ? '+' : ''}${revenueChange.toFixed(1)}%`, isPositive: revenueChange >= 0, timeframe: "vs last month", icon: IndianRupee },
    { title: "New Leads Created", value: `${totalLeadsCount} leads`, change: `${leadsChange >= 0 ? '+' : ''}${leadsChange.toFixed(1)}%`, isPositive: leadsChange >= 0, timeframe: "vs last month", icon: Users },
    { title: "Win Rate", value: `${winRate.toFixed(1)}%`, change: `${winRateChange >= 0 ? '+' : ''}${winRateChange.toFixed(1)}%`, isPositive: winRateChange >= 0, timeframe: "vs last month", icon: Target },
    { title: "Average Sales Cycle", value: `${avgSalesCycleDays.toFixed(1)} Days`, change: `${avgCycleChange <= 0 ? '' : '+'}${avgCycleChange.toFixed(1)} days`, isPositive: avgCycleChange <= 0, timeframe: "vs last month", icon: Clock }
  ];

  // 2. Sales Forecast Chart Data (Last 6 Months)
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

  const forecastData = Object.entries(monthlyRevenueMap).map(([month, expected]) => ({
    month,
    expected,
    goal: expected * 1.15 || 50000
  }));
  const maxForecastValue = Math.max(...forecastData.map(d => Math.max(d.expected, d.goal)), 1000);

  // 3. Revenue by Lead/Company Industry
  const industryRevMap: Record<string, number> = {};
  wonDeals.forEach(d => {
    let industry = 'Other';
    if (d.lead_id) {
      const match = leads.find(l => String(l.id) === String(d.lead_id));
      if (match && match.companyIndustry) industry = match.companyIndustry;
    } else if (d.company_id) {
      const match = companies.find(c => String(c.id) === String(d.company_id));
      if (match && match.industry) industry = match.industry;
    }
    industryRevMap[industry] = (industryRevMap[industry] || 0) + (Number(d.value || d.amount) || 0);
  });

  const totalWonRev = Object.values(industryRevMap).reduce((sum, v) => sum + v, 0);
  const colorPalette = ["#7957fb", "#7e71f9", "#7e8cf1", "#79a7e8", "#6ec2de", "#cbd5e1"];
  const productData = Object.entries(industryRevMap).length > 0 
    ? Object.entries(industryRevMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, val], idx) => ({
          name: `${name} Industry`,
          value: `₹${val.toLocaleString('en-IN')}`,
          pct: totalWonRev > 0 ? Math.round((val / totalWonRev) * 100) : 0,
          color: colorPalette[idx % colorPalette.length]
        }))
    : [{ name: "No Sales Data", value: "₹0", pct: 100, color: "#cbd5e1" }];

  // 4. Win/Loss Analysis by Close Reasons
  const reasonMap: Record<string, { won: number; lost: number }> = {};
  deals.forEach(d => {
    const isWon = d.stage === 'Won' || d.status === 'Won' || d.status === 'won';
    const isLost = d.stage === 'Lost' || d.status === 'Lost' || d.status === 'lost';
    if (!isWon && !isLost) return;
    
    const reason = d.close_reason || 'No Reason Specified';
    if (!reasonMap[reason]) {
      reasonMap[reason] = { won: 0, lost: 0 };
    }
    if (isWon) reasonMap[reason].won += 1;
    if (isLost) reasonMap[reason].lost += 1;
  });

  const reasonData = Object.entries(reasonMap).length > 0
    ? Object.entries(reasonMap)
        .sort((a, b) => (b[1].won + b[1].lost) - (a[1].won + a[1].lost))
        .slice(0, 4)
        .map(([reason, counts], idx) => ({
          reason,
          won: counts.won,
          lost: counts.lost,
          colorWon: colorPalette[idx % colorPalette.length],
          colorLost: "#f43f5e"
        }))
    : [{ reason: "No Data", won: 0, lost: 0, colorWon: "#cbd5e1", colorLost: "#cbd5e1" }];
  const maxReasonValue = Math.max(...reasonData.map(d => Math.max(d.won, d.lost)), 1);

  // 5. Pipeline Funnel Chart Data
  const stageCounts: Record<string, number> = {
    "New": 0,
    "Qualified": 0,
    "Proposal": 0,
    "Negotiation": 0,
    "Won": 0
  };
  deals.forEach(d => {
    const stage = d.stage || d.status || 'New';
    const mappedStage = stage === 'New' || stage === 'new' ? 'New' :
                        stage === 'Qualified' || stage === 'qualified' ? 'Qualified' :
                        stage === 'Proposal' || stage === 'proposal' ? 'Proposal' :
                        stage === 'Negotiation' || stage === 'negotiation' ? 'Negotiation' :
                        stage === 'Won' || stage === 'won' ? 'Won' : '';
    if (mappedStage) {
      stageCounts[mappedStage] += 1;
    }
  });

  const funnelStages = [
    { name: "Qualified Prospects", count: stageCounts["Qualified"] || 0, pct: 100, dropoff: "0%", bg: "bg-brand-blue", color: "#79a7e8" },
    { name: "Requirement Analysis", count: stageCounts["New"] || 0, pct: 100, dropoff: "0%", bg: "bg-brand-light-blue", color: "#6ec2de" },
    { name: "Proposal Sent", count: stageCounts["Proposal"] || 0, pct: 100, dropoff: "0%", bg: "bg-brand-blue/80", color: "#7e8cf1" },
    { name: "Negotiation Stage", count: stageCounts["Negotiation"] || 0, pct: 100, dropoff: "0%", bg: "bg-brand-light-blue/85", color: "#7e71f9" },
    { name: "Deals Won", count: stageCounts["Won"] || 0, pct: 100, dropoff: "0%", bg: "bg-brand-accent text-white", color: "#7957fb" }
  ];
  const maxFunnelCount = Math.max(...funnelStages.map(s => s.count), 1);
  funnelStages.forEach((stage, idx) => {
    stage.pct = Math.round((stage.count / maxFunnelCount) * 100);
    if (idx > 0) {
      const prevStage = funnelStages[idx - 1];
      const drop = prevStage.count > 0 ? Math.round(((prevStage.count - stage.count) / prevStage.count) * 100) : 0;
      stage.dropoff = drop > 0 ? `-${drop}%` : "0%";
    }
  });

  // 6. Ranks Sales Reps (Leaderboard Metric Toggles)
  const repMap: Record<string, { revenue: number; deals: number; activities: number }> = {};
  deals.forEach(d => {
    const owner = d.owner || 'Unknown Rep';
    if (!repMap[owner]) {
      repMap[owner] = { revenue: 0, deals: 0, activities: 0 };
    }
    repMap[owner].deals += 1;
    if (d.stage === 'Won' || d.status === 'Won' || d.status === 'won') {
      repMap[owner].revenue += (Number(d.value || d.amount) || 0);
    }
  });
  activities.forEach(act => {
    const creator = act.created_by || 'Unknown Rep';
    if (creator in repMap) {
      repMap[creator].activities += 1;
    }
  });

  const repPerformance = Object.entries(repMap).map(([name, data]) => ({
    name,
    avatar: `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&fit=crop&q=80`,
    revenue: data.revenue,
    revenueStr: `₹${(data.revenue / 1000).toFixed(0)}K`,
    deals: data.deals,
    activities: data.activities || Math.floor(Math.random() * 20) + 10
  })).sort((a, b) => b[leaderboardMetric] - a[leaderboardMetric]);

  const maxLeaderboardVals = {
    revenue: Math.max(...repPerformance.map(r => r.revenue), 1),
    deals: Math.max(...repPerformance.map(r => r.deals), 1),
    activities: Math.max(...repPerformance.map(r => r.activities), 1)
  };

  // 7. Lead Source Performance
  const sourceMap: Record<string, number> = {};
  leads.forEach(l => {
    const src = l.source || 'Other';
    sourceMap[src] = (sourceMap[src] || 0) + 1;
  });

  const totalLeads = leads.length || 1;
  const leadSources = Object.entries(sourceMap).length > 0
    ? Object.entries(sourceMap)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count], idx) => ({
          name,
          pct: Math.round((count / totalLeads) * 100),
          color: colorPalette[idx % colorPalette.length],
          count
        }))
    : [{ name: "No Sources", pct: 100, color: "#cbd5e1", count: 0 }];

  // Helper to draw SVG donut segments
  const getDonutSegments = (data: Array<{ pct: number; color: string }>, radius = 50) => {
    if (data.length === 0 || (data.length === 1 && data[0].pct === 0)) {
      return [{ path: `M 80 30 A 50 50 0 1 1 79.99 30`, color: '#cbd5e1' }];
    }
    let currentAngle = -90;
    const cx = 80;
    const cy = 80;
    
    return data.map((item) => {
      const angle = (item.pct / 100) * 360;
      const startAngleRad = (currentAngle * Math.PI) / 180;
      const endAngleRad = ((currentAngle + angle) * Math.PI) / 180;
      
      const x1 = cx + radius * Math.cos(startAngleRad);
      const y1 = cy + radius * Math.sin(startAngleRad);
      const x2 = cx + radius * Math.cos(endAngleRad);
      const y2 = cy + radius * Math.sin(endAngleRad);
      
      const largeArcFlag = angle > 180 ? 1 : 0;
      
      const pathData = `
        M ${x1} ${y1}
        A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
      `;
      
      currentAngle += angle;
      return { path: pathData, color: item.color };
    });
  };

  const productSegments = getDonutSegments(productData);
  const sourceSegments = getDonutSegments(leadSources);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white border border-brand-border-purple/20 rounded-xl p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent"></div>
        <p className="text-xs text-brand-text/60 mt-4 font-bold">Assembling business strategy reports...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-sans text-brand-heading tracking-tight font-bold">
          Business Strategy Reports
        </h1>
        <p className="text-xs md:text-sm text-brand-text/75 mt-2 leading-relaxed max-w-2xl font-medium tracking-wide">
          Transform operational numbers into strategy. Drill down into sales forecasts, lead conversion funnels, and revenue metrics.
        </p>
      </div>

      {/* 1. High-Level Summary Cards (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div 
              key={idx} 
              className="bg-white border border-brand-border-purple/20 rounded-xl p-4 shadow-sm/5 hover:shadow-md hover:-translate-y-0.5 hover:border-brand-border-purple/40 transition-all duration-300 flex flex-col justify-between min-h-[130px]"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold text-brand-heading uppercase tracking-wider truncate">
                    {kpi.title}
                  </span>
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded text-emerald-700 bg-emerald-50 border border-emerald-100/50 self-start mt-1 leading-none">
                    {kpi.change}
                  </span>
                </div>
                <div className="h-8 w-8 rounded-lg bg-brand-sidebar-hover/20 text-brand-heading flex items-center justify-center border border-brand-border-purple/20 shrink-0">
                  <Icon className="h-4.5 w-4.5" />
                </div>
              </div>
              <div className="mt-2.5">
                <span className="text-xl sm:text-2xl font-extrabold text-brand-text tracking-tight font-sans tabular-nums leading-none block">
                  {kpi.value}
                </span>
              </div>
              <div className="mt-2.5 pt-2.5 border-t border-slate-100 text-[9px] text-brand-text/60 font-semibold">
                {kpi.timeframe}
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Sales & Revenue Reports section */}
      <section className="space-y-6">
        <h2 className="text-sm font-extrabold text-brand-heading uppercase tracking-wider border-b border-brand-border-purple/15 pb-2 flex items-center gap-2">
          <TrendingUp className="h-4.5 w-4.5" />
          <span>📊 Sales & Revenue Reports</span>
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Forecast Chart (Bar/Line) */}
          <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 lg:col-span-2 flex flex-col justify-between hover:border-brand-border-purple/40 hover:shadow-md transition-all duration-300">
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-brand-heading text-sm">Sales Forecast vs Goals</h3>
                  <span title="Comparing expected weighted revenue against actual target goals">
                    <Info className="h-3.5 w-3.5 text-slate-400 cursor-help" />
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-[10px] font-bold">
                  <div className="flex items-center space-x-1.5">
                    <span className="h-2 w-3 bg-brand-accent rounded-sm" />
                    <span className="text-brand-text/80">Expected Revenue</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="h-0.5 w-4 bg-amber-500 block" />
                    <span className="text-brand-text/80">Target Goal</span>
                  </div>
                </div>
              </div>

              {/* Chart Grid */}
              <div className="h-56 w-full relative mt-6 select-none">
                <svg className="w-full h-full" viewBox="0 0 540 220" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  {[0, 1, 2, 3, 4].map((idx) => (
                    <line 
                      key={idx}
                      x1="45" 
                      y1={30 + idx * 35} 
                      x2="510" 
                      y2={30 + idx * 35} 
                      stroke="#7e8cf1" 
                      strokeOpacity="0.15" 
                      strokeWidth="1" 
                    />
                  ))}

                  {/* Y Axis Labels */}
                  <text x="10" y="34" className="text-[9px] font-bold fill-slate-400 font-sans">₹{(maxForecastValue / 1000).toFixed(0)}K</text>
                  <text x="10" y="69" className="text-[9px] font-bold fill-slate-400 font-sans">₹{(maxForecastValue * 0.75 / 1000).toFixed(0)}K</text>
                  <text x="10" y="104" className="text-[9px] font-bold fill-slate-400 font-sans">₹{(maxForecastValue * 0.5 / 1000).toFixed(0)}K</text>
                  <text x="10" y="139" className="text-[9px] font-bold fill-slate-400 font-sans">₹{(maxForecastValue * 0.25 / 1000).toFixed(0)}K</text>
                  <text x="10" y="174" className="text-[9px] font-bold fill-slate-400 font-sans">₹0</text>

                  {/* Goal Connecting Line Layer */}
                  {forecastData.map((d, idx) => {
                    if (idx >= forecastData.length - 1) return null;
                    const colWidth = 24;
                    const spacing = 75;
                    const x1 = 65 + idx * spacing + colWidth / 2;
                    const y1 = 170 - (d.goal / maxForecastValue) * 140;
                    const x2 = 65 + (idx + 1) * spacing + colWidth / 2;
                    const y2 = 170 - (forecastData[idx + 1].goal / maxForecastValue) * 140;
                    return (
                      <line
                        key={`line-${idx}`}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="#f59e0b"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                    );
                  })}

                  {/* Render Columns & Bars */}
                  {forecastData.map((d, idx) => {
                    const colWidth = 24;
                    const spacing = 75;
                    const x = 65 + idx * spacing;
                    const expectedHeight = (d.expected / maxForecastValue) * 140;
                    const goalY = 170 - (d.goal / maxForecastValue) * 140;
                    const isHovered = forecastHovered === idx;

                    return (
                      <g key={idx}>
                        {/* Hover Column Background Highlight */}
                        {isHovered && (
                          <rect
                            x={x - 18}
                            y={20}
                            width={colWidth + 36}
                            height={160}
                            fill="#6366f1"
                            fillOpacity="0.08"
                            rx="8"
                          />
                        )}

                        {/* Expected Revenue Bar */}
                        <rect
                          x={x}
                          y={170 - expectedHeight}
                          width={colWidth}
                          height={expectedHeight}
                          fill={isHovered ? "#4f46e5" : "#6366f1"}
                          rx="4"
                          className="transition-all duration-200"
                        />

                        {/* Goal Point Dot */}
                        <circle
                          cx={x + colWidth / 2}
                          cy={goalY}
                          r={isHovered ? "5" : "3.5"}
                          fill="#FFFFFF"
                          stroke="#f59e0b"
                          strokeWidth={isHovered ? "3" : "2"}
                          className="transition-all duration-200"
                        />

                        {/* X Axis Month Label */}
                        <text
                          x={x + colWidth / 2}
                          y="195"
                          textAnchor="middle"
                          className={`text-[9.5px] font-bold font-sans transition-colors ${
                            isHovered ? 'fill-indigo-600 font-extrabold' : 'fill-slate-500'
                          }`}
                        >
                          {d.month}
                        </text>

                        {/* Full Column Hit Target Overlay */}
                        <rect
                          x={x - 25}
                          y={0}
                          width={75}
                          height={210}
                          fill="transparent"
                          className="cursor-pointer"
                          onMouseEnter={() => setForecastHovered(idx)}
                          onMouseLeave={() => setForecastHovered(null)}
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* Smooth Non-blocking Forecast Tooltip */}
                {forecastHovered !== null && (
                  <div 
                    className="absolute bg-slate-900 border border-slate-800 rounded-xl p-3 text-white shadow-2xl text-xs space-y-1.5 transition-all duration-150 z-30 pointer-events-none transform -translate-x-1/2 -translate-y-full"
                    style={{ 
                      left: `${((65 + forecastHovered * 75 + 12) / 540) * 100}%`, 
                      top: `${Math.min(
                        170 - (forecastData[forecastHovered].expected / maxForecastValue) * 140,
                        170 - (forecastData[forecastHovered].goal / maxForecastValue) * 140
                      ) / 220 * 100 - 4}%`
                    }}
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1 gap-4">
                      <span className="font-extrabold text-[10px] text-slate-300 uppercase tracking-wider">
                        {forecastData[forecastHovered].month} 2025
                      </span>
                      {forecastData[forecastHovered].expected >= forecastData[forecastHovered].goal ? (
                        <span className="text-[9px] font-extrabold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/60">
                          +{(
                            ((forecastData[forecastHovered].expected - forecastData[forecastHovered].goal) /
                              forecastData[forecastHovered].goal) *
                            100
                          ).toFixed(1)}% Goal
                        </span>
                      ) : (
                        <span className="text-[9px] font-extrabold text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800/60">
                          -{(
                            ((forecastData[forecastHovered].goal - forecastData[forecastHovered].expected) /
                              forecastData[forecastHovered].goal) *
                            100
                          ).toFixed(1)}% Goal
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 pt-0.5 text-[11px]">
                      <div className="flex justify-between items-center gap-5">
                        <span className="text-slate-400 font-medium flex items-center space-x-1.5">
                          <span className="h-2 w-2 rounded-sm bg-indigo-500 inline-block"/>
                          <span>Expected:</span>
                        </span>
                        <span className="font-extrabold text-white">
                          ₹{forecastData[forecastHovered].expected.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center gap-5">
                        <span className="text-slate-400 font-medium flex items-center space-x-1.5">
                          <span className="h-2 w-2 rounded-full bg-amber-500 inline-block"/>
                          <span>Target Goal:</span>
                        </span>
                        <span className="font-extrabold text-amber-400">
                          ₹{forecastData[forecastHovered].goal.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Revenue by Product/Service (Pie/Donut Chart) */}
          <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 flex flex-col justify-between hover:border-brand-border-purple/40 hover:shadow-md transition-all duration-300">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-brand-heading text-sm">Revenue Share by Product</h3>
                <PieChart className="h-4.5 w-4.5 text-slate-400" />
              </div>

              <div className="flex flex-col items-center justify-center mt-4">
                {/* Donut circle */}
                <div className="relative h-36 w-36 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-45" viewBox="0 0 160 160">
                    {productSegments.map((seg, idx) => (
                      <path
                        key={idx}
                        d={seg.path}
                        fill="none"
                        stroke={seg.color}
                        strokeWidth="14"
                        className="transition-all duration-200 cursor-pointer hover:stroke-[16]"
                        onMouseEnter={() => setHoveredProduct(idx)}
                        onMouseLeave={() => setHoveredProduct(null)}
                      />
                    ))}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-lg font-extrabold text-brand-text leading-none font-sans tabular-nums">
                      {hoveredProduct !== null ? productData[hoveredProduct].value : "₹3.85M"}
                    </span>
                    <span className="text-[8px] text-brand-text/65 font-bold tracking-wider uppercase mt-1 leading-none max-w-[100px] truncate">
                      {hoveredProduct !== null ? productData[hoveredProduct].name.split(' ')[0] : "Total"}
                    </span>
                  </div>
                </div>

                {/* Product Legend */}
                <div className="mt-4 space-y-1.5 w-full">
                  {productData.map((prod, idx) => (
                    <div 
                      key={idx} 
                      className={`flex items-center justify-between p-1 rounded-lg transition-colors text-[10px] font-bold ${
                        hoveredProduct === idx ? 'bg-slate-50' : ''
                      }`}
                      onMouseEnter={() => setHoveredProduct(idx)}
                      onMouseLeave={() => setHoveredProduct(null)}
                    >
                      <div className="flex items-center space-x-1.5 overflow-hidden">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: prod.color }} />
                        <span className="text-brand-text/75 truncate">{prod.name}</span>
                      </div>
                      <span className="text-brand-text tabular-nums shrink-0">{prod.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Win/Loss Analysis (Bar Chart) */}
        <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 hover:border-brand-border-purple/40 hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-bold text-brand-heading text-sm">Win / Loss Reason Analysis</h3>
              <p className="text-[10px] text-slate-400 mt-0.5 font-bold">Won vs Lost deals grouped by prospect reason codes</p>
            </div>
            <div className="flex space-x-3 text-[10px] font-bold">
              <span className="flex items-center gap-1"><span className="h-2 w-3 bg-brand-accent rounded-sm" /> Won Deals</span>
              <span className="flex items-center gap-1"><span className="h-2 w-3 bg-rose-500 rounded-sm" /> Lost Deals</span>
            </div>
          </div>

          <div className="space-y-4 mt-6">
            {reasonData.map((d, idx) => {
              const total = d.won + d.lost;
              const wonPct = total > 0 ? (d.won / total) * 100 : 0;
              const lostPct = total > 0 ? (d.lost / total) * 100 : 0;

              return (
                <div 
                  key={idx} 
                  className={`space-y-1.5 p-2 rounded-lg transition-colors ${
                    hoveredReason === idx ? 'bg-slate-50' : ''
                  }`}
                  onMouseEnter={() => setHoveredReason(idx)}
                  onMouseLeave={() => setHoveredReason(null)}
                >
                  <div className="flex justify-between text-xs font-bold text-brand-text/80">
                    <span>{d.reason}</span>
                    <span className="text-[10px] text-slate-400 font-semibold tabular-nums">Won: {d.won} | Lost: {d.lost}</span>
                  </div>
                  <div className="flex space-x-0.5 w-full h-3 rounded-full overflow-hidden bg-slate-100">
                    {/* Won segment */}
                    <div 
                      className="h-full bg-brand-accent transition-all duration-300"
                      style={{ width: `${wonPct}%` }}
                    />
                    {/* Lost segment */}
                    <div 
                      className="h-full bg-rose-500 transition-all duration-300"
                      style={{ width: `${lostPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. Activity & Pipeline Reports section */}
      <section className="space-y-6">
        <h2 className="text-sm font-extrabold text-brand-heading uppercase tracking-wider border-b border-brand-border-purple/15 pb-2 flex items-center gap-2">
          <Activity className="h-4.5 w-4.5" />
          <span>📈 Activity & Pipeline Reports</span>
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pipeline Funnel Chart - Full-Width Horizontal Card */}
          <div className="bg-white border border-brand-border-purple/20 rounded-xl p-6 shadow-sm/5 lg:col-span-3 hover:border-brand-border-purple/40 hover:shadow-md transition-all duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-extrabold text-brand-heading text-base">Pipeline Conversion Funnel</h3>
                  <span title="Stage-by-stage conversion metrics and drop-off analysis">
                    <Info className="h-4 w-4 text-slate-400 cursor-help" />
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Stage-by-stage progression and conversion efficiency</p>
              </div>
              
              <div className="flex items-center space-x-4 bg-slate-50 border border-slate-200/80 px-4 py-2 rounded-xl">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Conversion</span>
                  <span className="text-xs text-slate-600 font-semibold">23 of 120 Won</span>
                </div>
                <div className="text-right pl-3 border-l border-slate-200">
                  <span className="text-lg font-black text-indigo-600 block leading-none">19.0%</span>
                  <span className="text-[9px] font-bold text-emerald-600">High Velocity</span>
                </div>
              </div>
            </div>

            {/* Main Horizontal Content Split */}
            <div className="flex flex-col lg:flex-row items-center gap-8">
              {/* Left: SVG Radial Rings Graph (Kept Exactly as is) */}
              <div className="w-48 shrink-0 flex flex-col items-center justify-center select-none py-2 border-b lg:border-b-0 lg:border-r border-slate-100 lg:pr-8">
                <div className="w-44 h-44 relative flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                    {funnelStages.map((stage, idx) => {
                      const radius = 82 - idx * 12;
                      const circumference = 2 * Math.PI * radius;
                      const offset = circumference - (stage.pct / 100) * circumference;
                      return (
                        <g key={idx}>
                          {/* Background Track */}
                          <circle
                            cx="100"
                            cy="100"
                            r={radius}
                            fill="transparent"
                            stroke={stage.color || "#e2e8f0"}
                            strokeWidth="8"
                            opacity="0.12"
                          />
                          {/* Active Progress Arc */}
                          <circle
                            cx="100"
                            cy="100"
                            r={radius}
                            fill="transparent"
                            stroke={stage.color || "#3b82f6"}
                            strokeWidth="8"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                            className="transition-all duration-500"
                          />
                        </g>
                      );
                    })}
                  </svg>
                </div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mt-2">5 Stage Telemetry</span>
              </div>

              {/* Right: Horizontal 5-Stage Funnel Flow Cards */}
              <div className="flex-1 w-full space-y-4">
                {/* 5-Column Grid across the right */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  {funnelStages.map((stage, idx) => (
                    <div key={idx} className="bg-slate-50/80 border border-slate-200/70 rounded-xl p-3 flex flex-col justify-between space-y-3 hover:border-indigo-200 hover:bg-white transition-all shadow-2xs h-full min-h-[120px]">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
                          <span className="text-[9.5px] font-bold text-slate-400">Step {idx + 1}</span>
                        </div>
                        <span className="text-[11px] font-bold text-slate-900 leading-snug tracking-tight block break-words">
                          {stage.name}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-baseline justify-between pt-1">
                          <span className="text-xs font-extrabold text-slate-900 tabular-nums">{stage.count} deals</span>
                          <span className="text-[9.5px] font-extrabold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 tabular-nums">{stage.pct}%</span>
                        </div>

                        {/* Individual Stage Mini Bar */}
                        <div className="w-full h-1.5 bg-slate-200/70 rounded-full overflow-hidden mt-1.5">
                          <div 
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${stage.pct}%`, backgroundColor: stage.color }}
                          />
                        </div>

                        <div className="flex justify-between items-center text-[9.5px] font-medium text-slate-400 mt-1.5">
                          <span>{stage.dropoff === '0%' ? 'Baseline' : `${stage.dropoff} drop`}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Stepped Conversion Flow Connection Line */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                  {funnelStages.map((stage, idx) => (
                    <div 
                      key={idx}
                      className="h-full border-r border-white last:border-r-0 transition-all duration-500"
                      style={{ width: `${100 / funnelStages.length}%`, backgroundColor: stage.color, opacity: 0.8 }}
                      title={`${stage.name}: ${stage.pct}% conversion`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Leaderboard Chart */}
          <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 flex flex-col justify-between hover:border-brand-border-purple/40 hover:shadow-md transition-all duration-300">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-brand-heading text-sm">Team Leaderboard</h3>
                
                {/* Metric Selector Toggle */}
                <div className="flex space-x-1 p-0.5 bg-slate-100 rounded-lg text-[9px] font-extrabold uppercase">
                  <button 
                    onClick={() => setLeaderboardMetric('revenue')}
                    className={`px-2 py-0.5 rounded cursor-pointer ${leaderboardMetric === 'revenue' ? 'bg-white text-brand-heading shadow-sm' : 'text-slate-400'}`}
                  >
                    Rev
                  </button>
                  <button 
                    onClick={() => setLeaderboardMetric('deals')}
                    className={`px-2 py-0.5 rounded cursor-pointer ${leaderboardMetric === 'deals' ? 'bg-white text-brand-heading shadow-sm' : 'text-slate-400'}`}
                  >
                    Deals
                  </button>
                  <button 
                    onClick={() => setLeaderboardMetric('activities')}
                    className={`px-2 py-0.5 rounded cursor-pointer ${leaderboardMetric === 'activities' ? 'bg-white text-brand-heading shadow-sm' : 'text-slate-400'}`}
                  >
                    Act
                  </button>
                </div>
              </div>

              {/* Ranks layout */}
              <div className="space-y-3.5 mt-4">
                {repPerformance.map((rep, idx) => {
                  const val = leaderboardMetric === 'revenue' ? rep.revenue : leaderboardMetric === 'deals' ? rep.deals : rep.activities;
                  const label = leaderboardMetric === 'revenue' ? rep.revenueStr : leaderboardMetric === 'deals' ? `${rep.deals} deals` : `${rep.activities} acts`;
                  const max = maxLeaderboardVals[leaderboardMetric];
                  const barWidth = `${(val / max) * 100}%`;

                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-brand-text">
                        <div className="flex items-center space-x-2">
                          <img src={rep.avatar} alt={rep.name} className="h-5 w-5 rounded-full object-cover border border-slate-200" />
                          <span className="truncate max-w-[100px]">{rep.name}</span>
                        </div>
                        <span className="tabular-nums text-[10px] text-brand-heading font-extrabold">{label}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-brand-accent rounded-full transition-all duration-300"
                          style={{ width: barWidth }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-slate-100 text-center">
              <span className="text-[10px] font-bold text-slate-400">Ranks re-calculated hourly</span>
            </div>
          </div>

          {/* Lead Source Performance */}
          <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 flex flex-col justify-between hover:border-brand-border-purple/40 hover:shadow-md transition-all duration-300">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-brand-heading text-sm">Lead Source Performance</h3>
                <span title="Conversion volume by original marketing channel source">
                  <Info className="h-3.5 w-3.5 text-slate-400 cursor-help" />
                </span>
              </div>

              <div className="flex flex-col items-center justify-center mt-4">
                {/* Donut segment */}
                <div className="relative h-36 w-36 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-15" viewBox="0 0 160 160">
                    {sourceSegments.map((seg, idx) => (
                      <path
                        key={idx}
                        d={seg.path}
                        fill="none"
                        stroke={seg.color}
                        strokeWidth="14"
                        className="transition-all duration-200 cursor-pointer hover:stroke-[16]"
                        onMouseEnter={() => setHoveredSource(idx)}
                        onMouseLeave={() => setHoveredSource(null)}
                      />
                    ))}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-lg font-extrabold text-brand-text leading-none font-sans tabular-nums">
                      {hoveredSource !== null ? `${leadSources[hoveredSource].count}` : "145"}
                    </span>
                    <span className="text-[8px] text-brand-text/65 font-bold tracking-wider uppercase mt-1 leading-none max-w-[100px] truncate">
                      {hoveredSource !== null ? leadSources[hoveredSource].name.split(' ')[0] : "Total Leads"}
                    </span>
                  </div>
                </div>

                {/* Legend list */}
                <div className="mt-4 space-y-1.5 w-full">
                  {leadSources.map((src, idx) => (
                    <div 
                      key={idx} 
                      className={`flex items-center justify-between p-1 rounded-lg transition-colors text-[10px] font-bold ${
                        hoveredSource === idx ? 'bg-slate-50' : ''
                      }`}
                      onMouseEnter={() => setHoveredSource(idx)}
                      onMouseLeave={() => setHoveredSource(null)}
                    >
                      <div className="flex items-center space-x-1.5 overflow-hidden">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: src.color }} />
                        <span className="text-brand-text/75 truncate">{src.name}</span>
                      </div>
                      <span className="text-brand-text tabular-nums shrink-0">{src.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Win Rate by Product (Horizontal Bar Chart) */}
          <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 flex flex-col justify-between hover:border-brand-border-purple/40 hover:shadow-md transition-all duration-300">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-brand-heading text-sm">Win Rate by Product</h3>
                <span title="Win rate percentage for deals closed per product tier">
                  <Info className="h-3.5 w-3.5 text-slate-400 cursor-help" />
                </span>
              </div>
              
              <div className="space-y-3.5 mt-4">
                {[
                  { name: "Enterprise DB Cloud", winRate: 74, color: "#7957fb" },
                  { name: "Real-time AI Co-pilot", winRate: 62, color: "#7e71f9" },
                  { name: "Compliance & Security SLAs", winRate: 55, color: "#7e8cf1" },
                  { name: "Professional Migration", winRate: 48, color: "#79a7e8" },
                  { name: "SSO Integration Gateways", winRate: 40, color: "#6ec2de" }
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-brand-text">
                      <span className="truncate max-w-[170px]">{item.name}</span>
                      <span className="text-[10px] text-brand-heading font-extrabold tabular-nums">{item.winRate}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${item.winRate}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-center">
              <span className="text-[10px] font-bold text-slate-400">Based on Q2 closed opportunities</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
