'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowUpRight, 
  Upload, 
  Filter, 
  MoreVertical, 
  ChevronDown, 
  TrendingUp, 
  DollarSign, 
  BarChart2, 
  Activity, 
  Globe, 
  ArrowUp, 
  ArrowDown, 
  FileText
} from 'lucide-react';
import { getAdminDashboard } from '@/utils/api';

// High-fidelity SVG Country Flags
const UsaFlag = () => (
  <svg className="w-5 h-3.5 rounded border border-border/15 shrink-0" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="20" height="14" fill="#B22234"/>
    <rect width="20" height="1.08" fill="#FFFFFF" y="1.08"/>
    <rect width="20" height="1.08" fill="#FFFFFF" y="3.24"/>
    <rect width="20" height="1.08" fill="#FFFFFF" y="5.40"/>
    <rect width="20" height="1.08" fill="#FFFFFF" y="7.56"/>
    <rect width="20" height="1.08" fill="#FFFFFF" y="9.72"/>
    <rect width="20" height="1.08" fill="#FFFFFF" y="11.88"/>
    <rect width="10" height="7.56" fill="#3C3B6E"/>
    <circle cx="2" cy="1.8" r="0.3" fill="white"/>
    <circle cx="5" cy="1.8" r="0.3" fill="white"/>
    <circle cx="8" cy="1.8" r="0.3" fill="white"/>
    <circle cx="3.5" cy="3.8" r="0.3" fill="white"/>
    <circle cx="6.5" cy="3.8" r="0.3" fill="white"/>
    <circle cx="2" cy="5.8" r="0.3" fill="white"/>
    <circle cx="5" cy="5.8" r="0.3" fill="white"/>
    <circle cx="8" cy="5.8" r="0.3" fill="white"/>
  </svg>
);

const ItalyFlag = () => (
  <svg className="w-5 h-3.5 rounded border border-border/15 shrink-0" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="6.66" height="14" fill="#009246"/>
    <rect x="6.66" width="6.68" height="14" fill="#F1F2F1"/>
    <rect x="13.34" width="6.66" height="14" fill="#CE2B37"/>
  </svg>
);

const AustraliaFlag = () => (
  <svg className="w-5 h-3.5 rounded border border-border/15 shrink-0" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="20" height="14" fill="#00008B"/>
    <path d="M0 0 L20 14 M20 0 L0 14" stroke="white" strokeWidth="2"/>
    <path d="M0 0 L20 14 M20 0 L0 14" stroke="#CC3333" strokeWidth="1"/>
    <path d="M10 0 L10 14 M0 7 L20 7" stroke="white" strokeWidth="3"/>
    <path d="M10 0 L10 14 M0 7 L20 7" stroke="#CC3333" strokeWidth="1.5"/>
    <circle cx="15" cy="3.5" r="0.8" fill="white"/>
    <circle cx="13" cy="5.5" r="0.8" fill="white"/>
    <circle cx="17" cy="5.5" r="0.8" fill="white"/>
    <circle cx="15" cy="8.5" r="0.8" fill="white"/>
    <circle cx="5" cy="10" r="1.3" fill="white"/>
  </svg>
);

// Indian Rupee Formatting Helper with Lakhs/Crores grouping & exact decimals
const formatRupee = (value: number, decimals = 0) => {
  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(decimals)} Cr`;
  }
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(decimals)} L`;
  }
  
  const parts = value.toFixed(decimals).split('.');
  let lastThree = parts[0].substring(parts[0].length - 3);
  const otherParts = parts[0].substring(0, parts[0].length - 3);
  if (otherParts !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInt = otherParts.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;
  return `₹${formattedInt}${parts[1] ? '.' + parts[1] : ''}`;
};

export default function ReportsView() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leaderboardMetric, setLeaderboardMetric] = useState<'revenue' | 'deals'>('revenue');

  // SVG circular segments parameters for Sales Activity Arc Chart
  // Radius = 45. Arc Circumference = 2 * PI * 45 = 282.7. 
  // We model a 180-deg semi-circular gauge (Total Arc Length = 141.3px).
  // Values: Delivered = 32% (45.2px), Canceled = 23% (32.5px), On Process = 45% (63.6px)
  const arcLength = 141.3;
  const strokeDelivered = 45.2;
  const strokeCanceled = 32.5;
  const strokeOnProcess = 63.6;

  // Offsets calculated:
  const offsetOnProcess = 0;
  const offsetCanceled = -strokeOnProcess;
  const offsetDelivered = -(strokeOnProcess + strokeCanceled);

  // Raw mock values in INR
  const totalProfit = 14813.10;
  const totalProfitPrev = 12534.00;
  const totalInsight = 122380;
  const totalInsightPrev = 119.53;
  const organicSales = 98100000; // 98.1 Million => 9.81 Crores
  const organicSalesPrev = 2800000; // 2.8 Million => 28 Lakhs
  const targetOverflow = 378.00;
  const perUnitSales = 2780.00;
  const internationalTransaction = 4256.00;

  return (
    <div className="space-y-6 text-foreground font-sans">
      {/* Scrollbar CSS Injection */}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(124, 58, 237, 0.15);
          border-radius: 99px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(124, 58, 237, 0.4);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(167, 139, 250, 0.2);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(167, 139, 250, 0.5);
        }
      ` }} />

      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/80 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-[2.25rem] leading-none">
            Dashboard
          </h1>
          <p className="mt-2 text-sm font-semibold text-muted-foreground">
            Here's your overview of your business sales.
          </p>
        </div>
        <div className="flex items-center gap-3 select-none">
          <button className="flex items-center gap-2 bg-card hover:bg-secondary/40 border border-border px-4 py-2 rounded-xl text-xs font-bold text-foreground transition-all shadow-sm cursor-pointer">
            <Upload size={14} className="rotate-180 text-muted-foreground" />
            <span>Export</span>
          </button>
          <button className="flex items-center gap-2 bg-card hover:bg-secondary/40 border border-border px-4 py-2 rounded-xl text-xs font-bold text-foreground transition-all shadow-sm cursor-pointer">
            <Filter size={14} className="text-muted-foreground" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Row 1 — 4 Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Total Profit */}
        <div className="bg-gradient-to-br from-blue-600 to-brand-purple text-primary-foreground border border-blue-700/20 rounded-2xl p-6 relative overflow-hidden h-36 flex flex-col justify-between shadow-lg shadow-blue-500/10 group">
          {/* Subtle Grid Lines Overlay */}
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
          
          {/* Rounded Top-Right Corner Cut-out */}
          <div className="absolute top-0 right-0 bg-background dark:bg-zinc-950 w-14 h-14 rounded-bl-2xl flex items-center justify-center z-10 transition-all select-none">
            <div className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow transition-transform group-hover:scale-105 duration-350 cursor-pointer">
              <ArrowUpRight className="size-4.5" />
            </div>
          </div>

          <div className="min-w-0 pr-10">
            <p className="text-[11px] font-bold text-white/80 uppercase tracking-wider select-none">
              Total Profit
            </p>
            <div className="mt-4 flex items-baseline gap-2">
              <h3 className="text-2xl md:text-3xl font-black tracking-tight leading-none" title={formatRupee(totalProfit)}>
                {formatRupee(totalProfit)}
              </h3>
              <span className="bg-white/20 text-white border border-white/10 px-2 py-0.5 rounded text-[10px] font-extrabold flex items-center gap-0.5 select-none shrink-0">
                <ArrowUp className="size-2.5" /> 3.9%
              </span>
            </div>
          </div>
          <p className="text-[11px] font-bold text-white/60 select-none">
            vs last month {formatRupee(totalProfitPrev)}
          </p>
        </div>

        {/* Card 2: Total Insight */}
        <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden h-36 flex flex-col justify-between hover:shadow-nav hover:-translate-y-0.5 transition-all duration-300 group">
          <div className="absolute top-4 right-4 text-muted-foreground/40 group-hover:text-foreground transition-colors pointer-events-none select-none">
            <ArrowUpRight className="size-4.5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider select-none">
              Total Insight
            </p>
            <div className="mt-4 flex items-baseline gap-2">
              <h3 className="text-2xl md:text-3xl font-black text-foreground tracking-tight leading-none" title={formatRupee(totalInsight)}>
                {formatRupee(totalInsight)}
              </h3>
              <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/15 px-2 py-0.5 rounded text-[10px] font-extrabold flex items-center gap-0.5 select-none shrink-0">
                <ArrowUp className="size-2.5" /> 4.2%
              </span>
            </div>
          </div>
          <p className="text-[11px] font-bold text-muted-foreground/80 select-none">
            vs last month {formatRupee(totalInsightPrev)}
          </p>
        </div>

        {/* Card 3: Organic Sales */}
        <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden h-36 flex flex-col justify-between hover:shadow-nav hover:-translate-y-0.5 transition-all duration-300 group">
          <div className="absolute top-4 right-4 text-muted-foreground/40 group-hover:text-foreground transition-colors pointer-events-none select-none">
            <ArrowUpRight className="size-4.5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider select-none">
              Organic Sales
            </p>
            <div className="mt-4 flex items-baseline gap-2">
              <h3 className="text-2xl md:text-3xl font-black text-foreground tracking-tight leading-none" title={formatRupee(organicSales)}>
                {formatRupee(organicSales)}
              </h3>
              <span className="bg-rose-500/10 text-rose-500 border border-rose-500/15 px-2 py-0.5 rounded text-[10px] font-extrabold flex items-center gap-0.5 select-none shrink-0">
                <ArrowDown className="size-2.5" /> 2.8%
              </span>
            </div>
          </div>
          <p className="text-[11px] font-bold text-muted-foreground/80 select-none">
            vs last month {formatRupee(organicSalesPrev)}
          </p>
        </div>

        {/* Card 4: Gross Margin */}
        <div className="bg-card border border-border rounded-2xl pt-6 px-6 pb-0 relative overflow-hidden h-36 flex flex-col justify-between hover:shadow-nav hover:-translate-y-0.5 transition-all duration-300 group">
          <div className="absolute top-4 right-4 text-muted-foreground/40 group-hover:text-foreground transition-colors pointer-events-none select-none">
            <ArrowUpRight className="size-4.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider select-none">
              Gross Margin
            </p>
            <div className="mt-3 flex items-baseline gap-2">
              <h3 className="text-2xl md:text-3xl font-black text-foreground tracking-tight leading-none">
                72%
              </h3>
              <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/15 px-2 py-0.5 rounded text-[10px] font-extrabold flex items-center gap-0.5 select-none shrink-0">
                <ArrowUp className="size-2.5" /> 4.2%
              </span>
            </div>
          </div>
          
          {/* Bottom Custom Wavy Graphic Path */}
          <div className="w-full shrink-0 -mx-6 mt-1 select-none">
            <svg className="w-[calc(100%+3rem)] h-11 overflow-visible" viewBox="0 0 200 40" preserveAspectRatio="none">
              <defs>
                <linearGradient id="margin-chart-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M 0 35 Q 25 15, 50 30 T 100 20 T 150 35 T 200 12 L 200 40 L 0 40 Z" fill="url(#margin-chart-gradient)" />
              <path d="M 0 35 Q 25 15, 50 30 T 100 20 T 150 35 T 200 12" stroke="#3b82f6" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </svg>
          </div>
        </div>

      </div>

      {/* Row 2 — Sales Report Area & Sales Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6 items-stretch">
        
        {/* Sales Report Area */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-card flex flex-col justify-between h-[390px]">
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border/80 mb-4 h-10 shrink-0">
              <div className="min-w-0">
                <h3 className="font-bold text-foreground text-sm tracking-tight select-none">
                  Sales Report Area
                </h3>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 select-none">
                <select 
                  value={salesReportTimeframe}
                  onChange={(e) => setSalesReportTimeframe(e.target.value)}
                  className="bg-secondary/40 border border-border rounded-lg px-2.5 py-1 text-[11px] font-bold text-foreground focus:outline-none cursor-pointer hover:bg-secondary/70 transition-colors"
                >
                  <option>Monthly</option>
                  <option>Weekly</option>
                  <option>Yearly</option>
                </select>
                <button className="p-1 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground cursor-pointer">
                  <MoreVertical size={14} />
                </button>
              </div>
            </div>

            {/* Subtitle Badge */}
            <div className="mb-4 shrink-0 select-none">
              <span className="bg-blue-500/10 text-blue-500 border border-blue-500/15 px-2.5 py-1 rounded-lg text-[10px] font-extrabold inline-block">
                +4.2% vs last years
              </span>
            </div>

            {/* Content: Bar chart on left, summary stat on right */}
            <div className="flex-1 grid grid-cols-[1.7fr_1fr] gap-6 items-end min-h-0">
              {/* Custom High-Quality Bar Chart */}
              <div className="h-full flex items-end justify-between px-2 pb-2 select-none border-b border-border/40 gap-4">
                {[
                  { name: 'Profit', height: 'h-[60%]', color: 'bg-lime-400' },
                  { name: 'Insight', height: 'h-[40%]', color: 'bg-purple-300' },
                  { name: 'Sale', height: 'h-[85%]', color: 'bg-blue-600' },
                  { name: 'Target', height: 'h-[50%]', color: 'bg-gradient-to-t from-teal-400 to-sky-300' }
                ].map((bar, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <span className="bg-secondary/70 border border-border text-[9px] font-black text-foreground px-1.5 py-0.5 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                      +9.9%
                    </span>
                    <div className={`${bar.height} ${bar.color} w-full rounded-lg hover:brightness-105 hover:-translate-y-0.5 transition-all duration-300 shadow-sm`} />
                    <span className="text-[10px] font-bold text-muted-foreground mt-1">
                      {bar.name}
                    </span>
                  </div>
                ))}
              </div>

              {/* Target overflow per unit sales statistics */}
              <div className="flex flex-col justify-end h-full pb-2">
                {/* Target overflow trend indicator */}
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/15 p-2 rounded-xl mb-4 select-none">
                  <svg className="w-8 h-6 text-emerald-500 overflow-visible shrink-0" viewBox="0 0 30 20" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M 2 18 Q 8 10, 14 14 T 26 4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M 20 4 L 26 4 L 26 10" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="text-[10px] font-bold text-emerald-600 leading-tight">
                    Target overflow by {formatRupee(targetOverflow)} profit
                  </p>
                </div>

                {/* Per unit sales value */}
                <div className="min-w-0">
                  <h4 className="text-2xl md:text-3xl font-black text-foreground tracking-tight leading-none" title={formatRupee(perUnitSales)}>
                    {formatRupee(perUnitSales)}
                  </h4>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mt-1.5">
                    Per unit sales
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Sales Activity */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-card flex flex-col justify-between h-[390px]">
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border/80 mb-4 h-10 shrink-0">
              <h3 className="font-bold text-foreground text-sm tracking-tight select-none">
                Sales Activity
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 select-none">
                <select 
                  value={salesActivityTimeframe}
                  onChange={(e) => setSalesActivityTimeframe(e.target.value)}
                  className="bg-secondary/40 border border-border rounded-lg px-2.5 py-1 text-[11px] font-bold text-foreground focus:outline-none cursor-pointer hover:bg-secondary/70 transition-colors"
                >
                  <option>Monthly</option>
                  <option>Weekly</option>
                  <option>Yearly</option>
                </select>
              </div>
            </div>

            {/* Custom Circular Donut Arc and Metrics */}
            <div className="flex-1 grid grid-cols-[1.1fr_1fr] gap-4 items-center min-h-0">
              {/* Semi-circular Ring Chart */}
              <div className="relative flex items-center justify-center h-full select-none">
                {/* SVG Gauge */}
                <svg className="w-36 h-36 overflow-visible" viewBox="0 0 120 120">
                  {/* Background Arc */}
                  <circle 
                    cx="60" 
                    cy="60" 
                    r="45" 
                    stroke="var(--border-strong)" 
                    strokeWidth="10" 
                    fill="none" 
                    strokeLinecap="round"
                    strokeDasharray={`${arcLength} 282.7`}
                    transform="rotate(-180 60 60)"
                    className="opacity-55"
                  />
                  {/* Delivered - Royal Blue */}
                  <circle 
                    cx="60" 
                    cy="60" 
                    r="45" 
                    stroke="#2563eb" 
                    strokeWidth="10" 
                    fill="none" 
                    strokeLinecap="round"
                    strokeDasharray={`${strokeDelivered} 282.7`}
                    strokeDashoffset={offsetDelivered}
                    transform="rotate(-180 60 60)"
                  />
                  {/* Canceled - Light Blue */}
                  <circle 
                    cx="60" 
                    cy="60" 
                    r="45" 
                    stroke="#60a5fa" 
                    strokeWidth="10" 
                    fill="none" 
                    strokeLinecap="round"
                    strokeDasharray={`${strokeCanceled} 282.7`}
                    strokeDashoffset={offsetCanceled}
                    transform="rotate(-180 60 60)"
                  />
                  {/* On Process - Green */}
                  <circle 
                    cx="60" 
                    cy="60" 
                    r="45" 
                    stroke="#84cc16" 
                    strokeWidth="10" 
                    fill="none" 
                    strokeLinecap="round"
                    strokeDasharray={`${strokeOnProcess} 282.7`}
                    strokeDashoffset={offsetOnProcess}
                    transform="rotate(-180 60 60)"
                  />
                </svg>

                {/* Center text container */}
                <div className="absolute text-center mt-[-10px]">
                  <h4 className="text-2xl font-black text-foreground tracking-tight leading-none">
                    786K
                  </h4>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-1">
                    Total sell count
                  </p>
                </div>
              </div>

              {/* Status Legends List */}
              <div className="space-y-4 pr-1 select-none">
                {[
                  { label: 'On Process', value: '45', colorBg: 'bg-lime-500' },
                  { label: 'Canceled', value: '23', colorBg: 'bg-blue-400' },
                  { label: 'Delivered', value: '32', colorBg: 'bg-blue-600' }
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col">
                    <h5 className="text-xl font-black text-foreground leading-none">
                      {item.value}
                    </h5>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${item.colorBg}`} />
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        {item.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Row 3 — Best Sellers & Most Order by Country */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        
        {/* Best Sellers */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-card flex flex-col justify-between h-[340px]">
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border/80 mb-4 h-10 shrink-0">
              <h3 className="font-bold text-foreground text-sm tracking-tight select-none">
                Best Sellers
              </h3>
              <button className="p-1 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground cursor-pointer select-none">
                <MoreVertical size={14} />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pr-1">
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="border-b border-border/40 text-[9px] uppercase font-bold text-muted-foreground/75 tracking-wider select-none">
                    <th className="pb-3 text-left w-[50%]">Seller</th>
                    <th className="pb-3 text-right w-[25%]">Stats</th>
                    <th className="pb-3 text-right w-[25%]">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30 text-xs font-semibold text-foreground">
                  {[
                    { name: 'Pisang Kepok', rate: 24, stats: '+4.2%', total: 2423.00, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&h=80&q=80' },
                    { name: 'Adipati Dolken', rate: 18, stats: '+3.1%', total: 1890.00, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&h=80&q=80' },
                    { name: 'Siti Nurhaliza', rate: 32, stats: '+5.0%', total: 3120.00, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&h=80&q=80' }
                  ].map((seller, idx) => (
                    <tr key={idx} className="hover:bg-secondary/15 transition-colors">
                      <td className="py-2.5 pr-2 text-left overflow-hidden">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img 
                            src={seller.avatar} 
                            alt={seller.name} 
                            className="h-8.5 w-8.5 rounded-full object-cover shrink-0 border border-border/40"
                          />
                          <div className="min-w-0">
                            <span className="truncate block font-bold text-foreground text-xs" title={seller.name}>
                              {seller.name}
                            </span>
                            <span className="text-[10px] font-bold text-muted-foreground/80 block mt-0.5 leading-none" title={formatRupee(seller.rate)}>
                              {formatRupee(seller.rate)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 text-right whitespace-nowrap">
                        <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/15 px-2 py-0.5 rounded text-[10px] font-extrabold select-none">
                          {seller.stats}
                        </span>
                      </td>
                      <td className="py-2.5 text-right text-foreground whitespace-nowrap text-xs font-bold" title={formatRupee(seller.total)}>
                        {formatRupee(seller.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>

        {/* Most Order by Country */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-card flex flex-col justify-between h-[340px]">
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border/80 mb-4 h-10 shrink-0">
              <h3 className="font-bold text-foreground text-sm tracking-tight select-none">
                Most Order by Country
              </h3>
              <button className="p-1 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground cursor-pointer select-none">
                <MoreVertical size={14} />
              </button>
            </div>

            {/* Content layout: Left summary values, Right country bar ratios */}
            <div className="flex-1 grid grid-cols-[1fr_1fr] gap-6 items-center min-h-0">
              {/* Left stats info */}
              <div className="space-y-2">
                <h4 className="text-2xl md:text-3xl font-black text-foreground tracking-tight leading-none" title={formatRupee(internationalTransaction)}>
                  {formatRupee(internationalTransaction)}
                </h4>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider leading-relaxed">
                  International Transaction
                </p>
                {/* Globe Icon graphic */}
                <div className="h-14 w-14 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 mt-4 select-none">
                  <Globe size={24} className="animate-[spin_20s_linear_infinite]" />
                </div>
              </div>

              {/* Right Country ratios */}
              <div className="space-y-4.5 select-none">
                {[
                  { name: 'USA', pct: '27%', flag: <UsaFlag />, widthClass: 'w-[27%]', colorBg: 'bg-blue-600' },
                  { name: 'Australia', pct: '14%', flag: <AustraliaFlag />, widthClass: 'w-[14%]', colorBg: 'bg-blue-400' },
                  { name: 'Italy', pct: '35%', flag: <ItalyFlag />, widthClass: 'w-[35%]', colorBg: 'bg-lime-500' }
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <div className="flex items-center gap-2">
                        {item.flag}
                        <span className="text-foreground">{item.name}</span>
                      </div>
                      <span className="text-muted-foreground">{item.pct}</span>
                    </div>
                    {/* Ratio progress line */}
                    <div className="w-full bg-secondary/70 h-2 rounded-full overflow-hidden">
                      <div className={`${item.colorBg} ${item.widthClass} h-full rounded-full`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
