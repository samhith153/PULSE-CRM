'use client';

import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Menu, 
  Bookmark, 
  ArrowRight, 
  Wallet, 
  Target, 
  ShoppingBag, 
  DollarSign
} from 'lucide-react';

export default function AdminDashboardView() {
  const [hoveredMonthIdx, setHoveredMonthIdx] = useState<number | null>(null);
  const [hoveredTrafficIdx, setHoveredTrafficIdx] = useState<number | null>(null);
  const [hoveredKpiIdx, setHoveredKpiIdx] = useState<number | null>(null);

  // 1. Top Row: 4 KPI Cards with Sparklines
  const kpiCards = [
    {
      title: "Sales",
      value: "₹45.5k",
      lastYear: "(₹17.4k Last Year)",
      change: "142.11%",
      isPositive: true,
      sparkline: "M 4 28 C 25 28, 40 18, 60 20 C 80 22, 95 8, 116 8",
      color: "#10b981"
    },
    {
      title: "Purchase",
      value: "₹19.5k",
      lastYear: "(₹16.4k Last Year)",
      change: "12.11%",
      isPositive: false,
      sparkline: "M 4 8 C 25 8, 40 18, 60 16 C 80 14, 95 28, 116 28",
      color: "#ef4444"
    },
    {
      title: "Return",
      value: "₹450",
      lastYear: "(₹10.4k Last Year)",
      change: "42.11%",
      isPositive: true,
      sparkline: "M 4 26 C 25 26, 40 14, 60 18 C 80 20, 95 8, 116 8",
      color: "#10b981"
    },
    {
      title: "Marketing",
      value: "₹8.5k",
      lastYear: "(₹11.4k Last Year)",
      change: "27.11%",
      isPositive: false,
      sparkline: "M 4 8 C 25 8, 40 16, 60 14 C 80 12, 95 28, 116 28",
      color: "#ef4444"
    }
  ];

  // 2. Profit & Sales Overview Data
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"];
  const onlineData = [10, 40, 95, 68, 88, 72, 110, 75, 125, 115];
  const inStoreData = [10, 65, 35, 105, 50, 85, 55, 92, 40, 50];

  // Helper to calculate Y coordinate for 0-160K range in SVG (viewBox 540x220)
  const getY = (val: number) => 190 - (val / 160) * 125;

  // Dynamic smooth path generator that guarantees line passes EXACTLY through point coordinates
  const buildSmoothPath = (data: number[]) => {
    const points = data.map((val, i) => ({
      x: 50 + i * 46,
      y: 190 - (val / 160) * 125
    }));

    if (points.length === 0) return '';
    let d = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) / 2;
      const cp1y = p0.y;
      const cp2x = p0.x + (p1.x - p0.x) / 2;
      const cp2y = p1.y;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }
    return d;
  };

  const buildAreaPath = (data: number[]) => {
    const line = buildSmoothPath(data);
    const lastX = 50 + (data.length - 1) * 46;
    return `${line} L ${lastX} 190 L 50 190 Z`;
  };

  // 3. User Traffic Donut Data (Total = 100%, 3 Distinct Colors)
  const rawChannels = [
    { name: "Direct CRM", pct: "35%", raw: 35, color: "#3b82f6" },       // Bright Royal Blue
    { name: "Inbound Web", pct: "22%", raw: 22, color: "#ec4899" },      // Vibrant Hot Pink
    { name: "Partner Referral", pct: "43%", raw: 43, color: "#10b981" }   // Emerald Green
  ];

  const CIRCUMFERENCE = 2 * Math.PI * 60; // r = 60 => ~376.991

  let currentAccumulatedPercent = 0;
  const trafficChannels = rawChannels.map(item => {
    const dashLength = (item.raw / 100) * CIRCUMFERENCE;
    const strokeDasharray = `${dashLength} ${CIRCUMFERENCE}`;
    const strokeDashoffset = -((currentAccumulatedPercent / 100) * CIRCUMFERENCE);
    currentAccumulatedPercent += item.raw;
    return {
      ...item,
      strokeDasharray,
      strokeDashoffset
    };
  });

  // 4. Overview Bottom Summary Bar Metrics
  const overviewMetrics = [
    { label: "Account Balance", value: "₹800", icon: Wallet, iconBg: "bg-emerald-50 text-emerald-600" },
    { label: "Ads Earning", value: "₹400", icon: Target, iconBg: "bg-amber-50 text-amber-600" },
    { label: "Sales", value: "₹900", icon: ShoppingBag, iconBg: "bg-indigo-50 text-indigo-600" },
    { label: "Total Earning", value: "₹80", icon: DollarSign, iconBg: "bg-cyan-50 text-cyan-600" }
  ];

  // 5. Recent Deals / New Arrivals Table Data
  const newArrivals = [
    {
      id: 1,
      product: "Enterprise DB License",
      subtitle: "Pharetra, Nulla, Nec, Aliquet",
      iconBg: "bg-amber-100 text-amber-700",
      price: "Paid ₹45,800k",
      deposit: "Paid ₹45k",
      agentName: "Sophia",
      agentSub: "Pharetra",
      status: "Approved",
      statusClass: "bg-indigo-50 text-indigo-600 border-indigo-200"
    },
    {
      id: 2,
      product: "Real-time AI Co-pilot Seats",
      subtitle: "Pharetra, Nulla, Nec, Aliquet",
      iconBg: "bg-pink-100 text-pink-700",
      price: "Paid ₹45,800k",
      deposit: "Paid ₹45k",
      agentName: "Sophia",
      agentSub: "Pharetra",
      status: "In Progress",
      statusClass: "bg-amber-50 text-amber-600 border-amber-200"
    },
    {
      id: 3,
      product: "Compliance & Security SLAs",
      subtitle: "Pharetra, Nulla, Nec, Aliquet",
      iconBg: "bg-cyan-100 text-cyan-700",
      price: "Paid ₹45,800k",
      deposit: "Paid ₹45k",
      agentName: "Sophia",
      agentSub: "Pharetra",
      status: "Success",
      statusClass: "bg-emerald-50 text-emerald-600 border-emerald-200"
    },
    {
      id: 4,
      product: "SSO Migration Portal",
      subtitle: "Pharetra, Nulla, Nec, Aliquet",
      iconBg: "bg-slate-200 text-slate-700",
      price: "Paid ₹45,800k",
      deposit: "Paid ₹45k",
      agentName: "Sophia",
      agentSub: "Pharetra",
      status: "Rejected",
      statusClass: "bg-rose-50 text-rose-600 border-rose-200"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-sans text-brand-heading tracking-tight font-bold">
          Admin Dashboard
        </h1>
        <p className="text-xs md:text-sm text-brand-text/75 mt-1 font-medium tracking-wide">
          Monitor system diagnostics, revenue performance, channel distribution, and transaction logs.
        </p>
      </div>

      {/* 1. TOP ROW: 4 KPI Cards with Sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((kpi, idx) => {
          const isCardHovered = hoveredKpiIdx === idx;
          return (
            <div 
              key={idx} 
              onMouseEnter={() => setHoveredKpiIdx(idx)}
              onMouseLeave={() => setHoveredKpiIdx(null)}
              className={`bg-white border rounded-2xl p-5 shadow-2xs transition-all duration-300 flex flex-col justify-between select-none relative overflow-hidden cursor-pointer ${
                isCardHovered ? 'border-indigo-300 shadow-md -translate-y-1' : 'border-slate-200/90'
              }`}
            >
              <div>
                <span className="text-xs font-semibold text-slate-500 block text-center">
                  {kpi.title}
                </span>
                <h2 className="text-3xl font-black text-indigo-900 text-center mt-1 font-sans tracking-tight">
                  {kpi.value}
                </h2>
                <span className="text-[10px] text-slate-400 font-medium block text-center mt-0.5">
                  {kpi.lastYear}
                </span>
              </div>

              {/* Sparkline & Percentage Badge Row */}
              <div className="flex items-end justify-between mt-4">
                <div className="flex items-center space-x-1">
                  {kpi.isPositive ? (
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
                  )}
                  <span className={`text-xs font-bold ${kpi.isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {kpi.change}
                  </span>
                </div>

                {/* Sparkline SVG Container */}
                <div className="w-24 h-8 shrink-0 overflow-hidden flex items-center justify-end">
                  <svg className="w-full h-full p-0.5" viewBox="0 0 120 36" preserveAspectRatio="none">
                    <path 
                      d={kpi.sparkline} 
                      fill="none" 
                      stroke={kpi.color} 
                      strokeWidth={isCardHovered ? "3" : "2.5"} 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      className="transition-all duration-200"
                    />
                  </svg>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. MIDDLE ROW: 2/3 Profit & Sales Overview Chart + 1/3 User Traffic Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left (8 Cols): Profit & Sales Overview */}
        <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs flex flex-col justify-between hover:shadow-md transition-all duration-300 relative">
          <div>
            {/* Title & Legend Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-extrabold text-slate-900 text-base">Profit &amp; Sales Overview</h3>
              <div className="flex items-center space-x-6 text-xs font-semibold">
                <div className="flex items-center space-x-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <span className="text-slate-600">Online</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                  <span className="text-slate-600">In Store</span>
                </div>
                <button className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer border-0 bg-transparent">
                  <Menu className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Main Multi-Curve Area Chart */}
            <div className="h-64 w-full relative mt-4 select-none">
              <svg className="w-full h-full" viewBox="0 0 540 220" preserveAspectRatio="none">
                <defs>
                  {/* Fill Gradients */}
                  <linearGradient id="onlineFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="storeFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Y-Axis Gridlines & Labels */}
                {[
                  { y: 30, label: "160K" },
                  { y: 70, label: "120K" },
                  { y: 110, label: "80K" },
                  { y: 150, label: "40K" },
                  { y: 190, label: "0K" }
                ].map((g, i) => (
                  <g key={i}>
                    <line x1="40" y1={g.y} x2="520" y2={g.y} stroke="#f1f5f9" strokeWidth="1" />
                    <text x="5" y={g.y + 4} className="text-[9px] font-bold fill-slate-400 font-sans">{g.label}</text>
                  </g>
                ))}

                {/* Dual Area Fill Curves */}
                <path 
                  d={buildAreaPath(onlineData)} 
                  fill="url(#onlineFill)" 
                />
                <path 
                  d={buildAreaPath(inStoreData)} 
                  fill="url(#storeFill)" 
                />

                {/* Stroke Lines */}
                <path 
                  d={buildSmoothPath(onlineData)} 
                  fill="none" 
                  stroke="#f59e0b" 
                  strokeWidth="2.5" 
                />
                <path 
                  d={buildSmoothPath(inStoreData)} 
                  fill="none" 
                  stroke="#f43f5e" 
                  strokeWidth="2.5" 
                />

                {/* Active Hover Column Highlights & Dots */}
                {months.map((m, i) => {
                  const cx = 50 + i * 46;
                  const isHovered = hoveredMonthIdx === i;
                  const onlineY = getY(onlineData[i]);
                  const storeY = getY(inStoreData[i]);

                  return (
                    <g key={i}>
                      {/* Vertical Hover Line Guide */}
                      {isHovered && (
                        <line 
                          x1={cx} 
                          y1={20} 
                          x2={cx} 
                          y2={190} 
                          stroke="#cbd5e1" 
                          strokeWidth="1.5" 
                          strokeDasharray="3 3" 
                        />
                      )}

                      {/* Online Dot Point */}
                      <circle 
                        cx={cx} 
                        cy={onlineY} 
                        r={isHovered ? "5.5" : "3"} 
                        fill="#ffffff" 
                        stroke="#f59e0b" 
                        strokeWidth={isHovered ? "3" : "2"} 
                        className="transition-all duration-150"
                      />

                      {/* In Store Dot Point */}
                      <circle 
                        cx={cx} 
                        cy={storeY} 
                        r={isHovered ? "5.5" : "3"} 
                        fill="#ffffff" 
                        stroke="#f43f5e" 
                        strokeWidth={isHovered ? "3" : "2"} 
                        className="transition-all duration-150"
                      />

                      {/* X-Axis Month Labels */}
                      <text 
                        x={cx} 
                        y="210" 
                        textAnchor="middle" 
                        className={`text-[9.5px] font-bold font-sans transition-colors ${
                          isHovered ? 'fill-indigo-600 font-extrabold' : 'fill-slate-400'
                        }`}
                      >
                        {m}
                      </text>

                      {/* Full Column Hit Target Overlay */}
                      <rect 
                        x={cx - 20} 
                        y={10} 
                        width={40} 
                        height={195} 
                        fill="transparent" 
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredMonthIdx(i)}
                        onMouseLeave={() => setHoveredMonthIdx(null)}
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Dynamic Non-Blocking Hover Tooltip */}
              {hoveredMonthIdx !== null && (
                <div 
                  className="absolute bg-slate-900 border border-slate-800 rounded-xl p-3 text-white shadow-2xl text-xs space-y-1.5 transition-all duration-150 z-30 pointer-events-none transform -translate-x-1/2 -translate-y-full"
                  style={{ 
                    left: `${((50 + hoveredMonthIdx * 46) / 540) * 100}%`, 
                    top: `${Math.min(getY(onlineData[hoveredMonthIdx]), getY(inStoreData[hoveredMonthIdx])) / 220 * 100 - 4}%`
                  }}
                >
                  <span className="font-extrabold text-[10px] text-slate-300 uppercase tracking-wider block border-b border-slate-800 pb-1">
                    {months[hoveredMonthIdx]} Performance
                  </span>
                  <div className="space-y-1 pt-0.5 text-[11px]">
                    <div className="flex justify-between items-center gap-4">
                      <span className="text-slate-400 flex items-center space-x-1.5 font-medium">
                        <span className="h-2 w-2 rounded-full bg-amber-500 inline-block"/>
                        <span>Online:</span>
                      </span>
                      <span className="font-extrabold text-amber-400">
                        ₹{onlineData[hoveredMonthIdx]}.0k
                      </span>
                    </div>
                    <div className="flex justify-between items-center gap-4">
                      <span className="text-slate-400 flex items-center space-x-1.5 font-medium">
                        <span className="h-2 w-2 rounded-full bg-rose-500 inline-block"/>
                        <span>In Store:</span>
                      </span>
                      <span className="font-extrabold text-rose-400">
                        ₹{inStoreData[hoveredMonthIdx]}.0k
                      </span>
                    </div>
                    <div className="border-t border-slate-800 pt-1 flex justify-between items-center gap-4">
                      <span className="text-slate-300 font-bold">Total:</span>
                      <span className="font-black text-white">
                        ₹{onlineData[hoveredMonthIdx] + inStoreData[hoveredMonthIdx]}.0k
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Summary Bar Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
            {overviewMetrics.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="flex items-center space-x-3">
                  <div className={`h-9 w-9 rounded-xl ${item.iconBg} flex items-center justify-center shrink-0`}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <span className="text-sm font-black text-slate-900 block leading-none">{item.value}</span>
                    <span className="text-[10px] font-semibold text-slate-400 mt-1 block">{item.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right (4 Cols): User Traffic Donut Chart */}
        <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs flex flex-col justify-between hover:shadow-md transition-all duration-300">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base mb-4">User Traffic</h3>
            
            {/* Donut Ring Graphic */}
            <div className="relative h-48 w-48 mx-auto mt-2 flex items-center justify-center select-none">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                {/* Background Ring Track */}
                <circle cx="80" cy="80" r="60" fill="none" stroke="#f1f5f9" strokeWidth="18" />

                {trafficChannels.map((c, idx) => {
                  const isHovered = hoveredTrafficIdx === idx;
                  return (
                    <circle 
                      key={idx}
                      cx="80" 
                      cy="80" 
                      r="60" 
                      fill="none" 
                      stroke={c.color} 
                      strokeWidth={isHovered ? "24" : "18"} 
                      strokeDasharray={c.strokeDasharray} 
                      strokeDashoffset={c.strokeDashoffset}
                      className="cursor-pointer transition-all duration-200"
                      onMouseEnter={() => setHoveredTrafficIdx(idx)}
                      onMouseLeave={() => setHoveredTrafficIdx(null)}
                    />
                  );
                })}
              </svg>
              
              {/* Central Dynamic Donut Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-2xl font-black text-slate-900 leading-none font-sans">
                  {hoveredTrafficIdx !== null ? trafficChannels[hoveredTrafficIdx].pct : "100%"}
                </span>
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mt-1 truncate max-w-[100px]">
                  {hoveredTrafficIdx !== null ? trafficChannels[hoveredTrafficIdx].name : "Total Traffic"}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Percentage Channel Stats Row */}
          <div className="grid grid-cols-3 gap-2 text-center mt-6 pt-4 border-t border-slate-100 select-none">
            {trafficChannels.map((c, idx) => {
              const isHovered = hoveredTrafficIdx === idx;
              return (
                <div 
                  key={idx} 
                  onMouseEnter={() => setHoveredTrafficIdx(idx)}
                  onMouseLeave={() => setHoveredTrafficIdx(null)}
                  className={`space-y-1 p-1.5 rounded-xl transition-all cursor-pointer ${
                    isHovered ? 'bg-slate-100 shadow-2xs scale-105' : ''
                  }`}
                >
                  <span className="text-xl font-black text-slate-900 block leading-none">{c.pct}</span>
                  <div className="flex items-center justify-center space-x-1 text-[10px] font-semibold text-slate-500">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                    <span className="truncate">{c.name}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* 3. BOTTOM ROW: Full-Width Data Table ("New Arrivals / Recent Deals") */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs hover:shadow-md transition-all duration-300">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-extrabold text-slate-900 text-base">New Arrivals</h3>
          <span className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer transition-colors">
            View All Transactions &rarr;
          </span>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto select-none">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-3">
                <th className="py-3 px-4">PRODUCTS</th>
                <th className="py-3 px-4">PRICE</th>
                <th className="py-3 px-4">DEPOSIT</th>
                <th className="py-3 px-4">AGENT</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {newArrivals.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition-colors group">
                  
                  {/* Products */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-3">
                      <div className={`h-9 w-9 rounded-xl ${row.iconBg} flex items-center justify-center font-black text-sm shrink-0 shadow-2xs`}>
                        {row.product.charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block text-xs">{row.product}</span>
                        <span className="text-[10px] text-slate-400 font-medium block mt-0.5">{row.subtitle}</span>
                      </div>
                    </div>
                  </td>

                  {/* Price */}
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900 tabular-nums block">{row.price}</span>
                  </td>

                  {/* Deposit */}
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900 tabular-nums block">{row.deposit}</span>
                  </td>

                  {/* Agent */}
                  <td className="py-3.5 px-4">
                    <div>
                      <span className="text-slate-400 font-normal text-[10px] block">Sophia</span>
                      <span className="font-bold text-slate-900 block">{row.agentSub}</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-extrabold border inline-block ${row.statusClass}`}>
                      {row.status}
                    </span>
                  </td>

                  {/* Action Buttons */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="h-8 w-8 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center justify-center shadow-xs cursor-pointer border-0">
                        <Bookmark className="h-3.5 w-3.5 fill-current" />
                      </button>
                      <button className="h-8 w-8 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center justify-center shadow-xs cursor-pointer border-0">
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
