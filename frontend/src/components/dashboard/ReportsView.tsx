'use client';

import React, { useState } from 'react';
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
  ChevronDown
} from 'lucide-react';

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

  // 1. High-Level Summary Cards (KPIs)
  const kpis: KPI[] = [
    { title: "Total Revenue Won", value: "₹3,852,000", change: "+26.4%", isPositive: true, timeframe: "vs last month", icon: IndianRupee },
    { title: "New Leads Created", value: "145 leads", change: "+18.2%", isPositive: true, timeframe: "vs last month", icon: Users },
    { title: "Win Rate", value: "32.4%", change: "+4.1%", isPositive: true, timeframe: "vs last month", icon: Target },
    { title: "Average Sales Cycle", value: "24.5 Days", change: "-3.2 days", isPositive: true, timeframe: "vs last month", icon: Clock }
  ];

  // 2. Sales Forecast Chart Data (Jan - Jun)
  // expected vs actual goal
  const forecastData = [
    { month: "Jan", expected: 320000, goal: 350000 },
    { month: "Feb", expected: 410000, goal: 400000 },
    { month: "Mar", expected: 480000, goal: 450000 },
    { month: "Apr", expected: 510000, goal: 500000 },
    { month: "May", expected: 640000, goal: 580000 },
    { month: "Jun", expected: 720000, goal: 650000 }
  ];
  const maxForecastValue = 800000;

  // 3. Revenue by Product/Service
  const productData = [
    { name: "Enterprise DB Cloud Licenses", value: "₹1,733,400", pct: 45, color: "#7957fb" },
    { name: "Real-time AI Co-pilot Seats", value: "₹963,000", pct: 25, color: "#7e71f9" },
    { name: "Compliance & Security SLAs", value: "₹577,800", pct: 15, color: "#7e8cf1" },
    { name: "Professional Migration Services", value: "₹385,200", pct: 10, color: "#79a7e8" },
    { name: "SSO Integration Gateways", value: "₹192,600", pct: 5, color: "#6ec2de" }
  ];

  // 4. Win/Loss Analysis by Reason Codes
  const reasonData = [
    { reason: "Price too high", won: 12, lost: 34, colorWon: "#7957fb", colorLost: "#f43f5e" },
    { reason: "Lost to competitor", won: 18, lost: 28, colorWon: "#7e71f9", colorLost: "#fda4af" },
    { reason: "Feature gap", won: 8, lost: 22, colorWon: "#7e8cf1", colorLost: "#ffe4e6" },
    { reason: "Timing/Budget freeze", won: 14, lost: 15, colorWon: "#79a7e8", colorLost: "#cbd5e1" }
  ];
  const maxReasonValue = 40;

  // 5. Pipeline Funnel Chart Data
  const funnelStages = [
    { name: "Qualified Prospects", count: 120, pct: 100, dropoff: "0%", bg: "bg-brand-blue", color: "#79a7e8" },
    { name: "Requirement Analysis", count: 86, pct: 71, dropoff: "-29%", bg: "bg-brand-light-blue", color: "#6ec2de" },
    { name: "Proposal Sent", count: 40, pct: 33, dropoff: "-53%", bg: "bg-brand-blue/80", color: "#7e8cf1" },
    { name: "Negotiation Stage", count: 28, pct: 23, dropoff: "-30%", bg: "bg-brand-light-blue/85", color: "#7e71f9" },
    { name: "Deals Won", count: 23, pct: 19, dropoff: "-17%", bg: "bg-brand-accent text-white", color: "#7957fb" }
  ];

  // 6. Ranks Sales Reps (Leaderboard Metric Toggles)
  const repPerformance = [
    { name: "Alex Johnson", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&fit=crop&q=80", revenue: 1250000, revenueStr: "₹1.25M", deals: 8, activities: 245 },
    { name: "Sarah Johnson", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&fit=crop&q=80", revenue: 980000, revenueStr: "₹980K", deals: 6, activities: 198 },
    { name: "David Wilson", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&fit=crop&q=80", revenue: 750000, revenueStr: "₹750K", deals: 5, activities: 165 },
    { name: "Lisa Martinez", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&fit=crop&q=80", revenue: 480000, revenueStr: "₹480K", deals: 3, activities: 120 },
    { name: "Michael Brown", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&fit=crop&q=80", revenue: 360000, revenueStr: "₹360K", deals: 2, activities: 95 }
  ];
  const maxLeaderboardVals = {
    revenue: 1250000,
    deals: 8,
    activities: 245
  };

  // 7. Lead Source Performance
  const leadSources = [
    { name: "LinkedIn Ads", pct: 40, color: "#7957fb", count: 58 },
    { name: "SEO Organic Search", pct: 25, color: "#7e71f9", count: 36 },
    { name: "Referrals Channel", pct: 20, color: "#7e8cf1", count: 29 },
    { name: "Cold Outbound", pct: 15, color: "#79a7e8", count: 22 }
  ];

  // Helper to draw SVG donut segments
  const getDonutSegments = (data: Array<{ pct: number; color: string }>, radius = 50) => {
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
              className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 hover:shadow-md hover:-translate-y-0.5 hover:border-brand-border-purple/40 transition-all duration-300 flex flex-col justify-between h-32"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-brand-heading uppercase tracking-wider">
                  {kpi.title}
                </span>
                <div className="h-8 w-8 rounded-lg bg-brand-sidebar-hover/20 text-brand-heading flex items-center justify-center border border-brand-border-purple/20 shrink-0">
                  <Icon className="h-4.5 w-4.5" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline justify-between gap-1 flex-wrap">
                <span className="text-2xl font-extrabold text-brand-text tracking-tight font-sans tabular-nums leading-none">
                  {kpi.value}
                </span>
                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded text-emerald-700 bg-emerald-50 border border-emerald-100/50 self-center leading-none">
                  {kpi.change}
                </span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-50 text-[9px] text-brand-text/60 font-semibold">
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
                  <text x="10" y="34" className="text-[9px] font-bold fill-slate-400 font-sans">₹800K</text>
                  <text x="10" y="69" className="text-[9px] font-bold fill-slate-400 font-sans">₹600K</text>
                  <text x="10" y="104" className="text-[9px] font-bold fill-slate-400 font-sans">₹400K</text>
                  <text x="10" y="139" className="text-[9px] font-bold fill-slate-400 font-sans">₹200K</text>
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
              const wonPct = (d.won / maxReasonValue) * 100;
              const lostPct = (d.lost / maxReasonValue) * 100;

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
        </div>
      </section>
    </div>
  );
}
