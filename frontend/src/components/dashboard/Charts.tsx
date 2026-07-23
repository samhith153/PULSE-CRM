'use client';

import React, { useState } from 'react';
import { Info, ChevronDown, BarChart2 } from 'lucide-react';

interface ChartsProps {
  loading?: boolean;
  empty?: boolean;
}

export default function Charts({ loading = false, empty = false }: ChartsProps) {
  const [revenueHoveredPoint, setRevenueHoveredPoint] = useState<{ x: number; y: number; label: string; value: string } | null>({
    x: 350,
    y: 90,
    label: "May 13, 2025",
    value: "₹2.45M"
  });

  const [hoveredSourceIdx, setHoveredSourceIdx] = useState<number | null>(null);
  const [hoveredSizeIdx, setHoveredSizeIdx] = useState<number | null>(null);

  // Revenue Over Time Line Chart coordinates
  const revenuePoints = [
    { name: "May 1", value: "₹0.8M", raw: 0.8, x: 50, y: 170 },
    { name: "May 4", value: "₹1.2M", raw: 1.2, x: 125, y: 150 },
    { name: "May 7", value: "₹1.5M", raw: 1.5, x: 200, y: 135 },
    { name: "May 10", value: "₹1.8M", raw: 1.8, x: 275, y: 120 },
    { name: "May 13", value: "₹2.45M", raw: 2.45, x: 350, y: 90 },
    { name: "May 16", value: "₹2.9M", raw: 2.9, x: 425, y: 70 },
    { name: "May 18", value: "₹3.85M", raw: 3.85, x: 500, y: 30 }
  ];

  // Pipeline stages data: Styled using Medium Blue, Light Blue and Medium Purple for Won stage
  const pipelineStages = [
    { name: "New", count: 120, width: "w-full", bg: "bg-brand-blue" },
    { name: "Qualified", count: 86, width: "w-[85%]", bg: "bg-brand-light-blue" },
    { name: "Proposal", count: 40, width: "w-[65%]", bg: "bg-brand-blue/80" },
    { name: "Negotiation", count: 28, width: "w-[45%]", bg: "bg-brand-light-blue/80" },
    { name: "Won", count: 23, width: "w-[30%]", bg: "bg-brand-accent animate-pulse-slow" }, // Active Won highlighted in Medium Purple
    { name: "Lost", count: 14, width: "w-[20%]", bg: "bg-brand-light-blue/40" }
  ];

  // Source chart percentages using new accents
  const sources = [
    { name: "Website", pct: 45, color: "#7957fb", offset: 0, val: "₹1.73M" }, // Medium Purple
    { name: "Referral", pct: 25, color: "#7e71f9", offset: 45, val: "₹0.96M" }, // Soft Purple
    { name: "Email", pct: 15, color: "#7e8cf1", offset: 70, val: "₹0.58M" }, // Periwinkle
    { name: "Social Media", pct: 10, color: "#79a7e8", offset: 85, val: "₹0.39M" }, // Medium Blue
    { name: "Other", pct: 5, color: "#6ec2de", offset: 95, val: "₹0.19M" } // Light Blue
  ];

  // Company size percentages using new accents
  const companySizes = [
    { name: "1 - 10 employees", pct: 15, color: "#6ec2de", offset: 0 }, // Light Blue
    { name: "11 - 50 employees", pct: 25, color: "#7957fb", offset: 15 }, // Medium Purple
    { name: "51 - 200 employees", pct: 30, color: "#7e71f9", offset: 40 }, // Soft Purple
    { name: "201 - 1000 employees", pct: 20, color: "#79a7e8", offset: 70 }, // Medium Blue
    { name: "1000+ employees", pct: 10, color: "#7e8cf1", offset: 90 } // Periwinkle
  ];

  // Helper to draw donut ring segments
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

  const sourceSegments = getDonutSegments(sources);
  const sizeSegments = getDonutSegments(companySizes);

  // loading skeleton rendering
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-150/65 rounded-xl p-5 shadow-sm/5 lg:col-span-2 h-76 animate-pulse" />
          <div className="bg-white border border-slate-150/65 rounded-xl p-5 shadow-sm/5 h-76 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-150/65 rounded-xl p-5 shadow-sm/5 h-56 animate-pulse" />
          <div className="bg-white border border-slate-150/65 rounded-xl p-5 shadow-sm/5 h-56 animate-pulse" />
        </div>
      </div>
    );
  }

  // empty state rendering
  if (empty) {
    return (
      <div className="bg-white border border-brand-border-purple/20 rounded-xl p-12 text-center shadow-sm/5 flex flex-col items-center justify-center min-h-[300px]">
        <div className="h-12 w-12 rounded-full bg-brand-sidebar-hover/10 flex items-center justify-center border border-brand-border-purple/20 text-brand-heading">
          <BarChart2 className="h-6 w-6" strokeWidth={1.5} />
        </div>
        <h4 className="text-sm font-bold text-brand-heading mt-4">No report data available</h4>
        <p className="text-xs text-slate-400 mt-1.5 max-w-sm leading-relaxed">
          There are no analytics records matching your selection. Try adjusting the date range filters or selecting a different pipeline.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upper Grid (2 Columns: Revenue Line & Pipeline Stages) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Revenue Over Time Line Chart */}
        <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 lg:col-span-2 flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-md hover:border-brand-border-purple/40 transition-all duration-300">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-brand-heading text-sm">Revenue over time</h3>
                <span title="Historical cumulative revenue tracking">
                  <Info className="h-3.5 w-3.5 text-slate-400 cursor-help" strokeWidth={1.75} />
                </span>
              </div>
              <div className="relative">
                <select className="appearance-none bg-slate-50 border border-brand-border-purple/35 text-brand-text focus:border-brand-accent rounded-lg px-2.5 py-1 pr-7 text-[10px] font-bold focus:outline-none transition-all cursor-pointer">
                  <option>This Month</option>
                  <option>Last Month</option>
                  <option>This Quarter</option>
                </select>
                <ChevronDown className="absolute right-2 top-2 h-3 w-3 text-slate-500 pointer-events-none" strokeWidth={1.75} />
              </div>
            </div>

            {/* SVG Line Graph - Visually Lighter */}
            <div className="relative h-56 w-full mt-4">
              <svg className="w-full h-full" viewBox="0 0 550 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="revenue-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7e71f9" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#7e71f9" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                
                {/* Thin, subtle 1px gridlines in light Periwinkle */}
                <line x1="40" y1="30" x2="520" y2="30" stroke="#7e8cf1" strokeOpacity="0.15" strokeWidth="1" />
                <line x1="40" y1="70" x2="520" y2="70" stroke="#7e8cf1" strokeOpacity="0.15" strokeWidth="1" />
                <line x1="40" y1="110" x2="520" y2="110" stroke="#7e8cf1" strokeOpacity="0.15" strokeWidth="1" />
                <line x1="40" y1="150" x2="520" y2="150" stroke="#7e8cf1" strokeOpacity="0.15" strokeWidth="1" />
                
                {/* Axis labels y-axis */}
                <text x="15" y="34" className="text-[9px] font-bold fill-slate-400 font-sans tabular-nums">₹4M</text>
                <text x="15" y="74" className="text-[9px] font-bold fill-slate-400 font-sans tabular-nums">₹3M</text>
                <text x="15" y="114" className="text-[9px] font-bold fill-slate-400 font-sans tabular-nums">₹2M</text>
                <text x="15" y="154" className="text-[9px] font-bold fill-slate-400 font-sans tabular-nums">₹1M</text>
                <text x="25" y="190" className="text-[9px] font-bold fill-slate-400 font-sans tabular-nums">₹0</text>

                {/* Filled gradient area underneath path */}
                <path
                  d={`M 50 190 L 50 170 Q 87 160 125 150 T 200 135 T 275 120 T 350 90 T 425 70 T 500 30 L 500 190 Z`}
                  fill="url(#revenue-gradient)"
                />

                {/* Refined line curve - 2px thickness */}
                <path
                  d="M 50 170 Q 87 160 125 150 T 200 135 T 275 120 T 350 90 T 425 70 T 500 30"
                  fill="none"
                  stroke="#7957fb"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                {/* Data points - Only hovered and tiny points for others */}
                {revenuePoints.map((pt, idx) => {
                  const isHovered = revenueHoveredPoint && revenueHoveredPoint.x === pt.x;
                  return (
                    <g key={idx}>
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? "5" : "2"}
                        fill={isHovered ? "#FFFFFF" : "#7957fb"}
                        stroke="#7957fb"
                        strokeWidth={isHovered ? "3.5" : "0"}
                        className="cursor-pointer transition-all duration-150"
                        onMouseEnter={() => {
                          setRevenueHoveredPoint({
                            x: pt.x,
                            y: pt.y,
                            label: pt.name + ", 2025",
                            value: pt.value
                          });
                        }}
                      />
                      <text
                        x={pt.x}
                        y="190"
                        textAnchor="middle"
                        className="text-[9px] font-bold fill-slate-400 font-sans"
                      >
                        {pt.name}
                      </text>
                    </g>
                  );
                })}

                {/* Tooltip Overlay */}
                {revenueHoveredPoint && (
                  <g>
                    <line
                      x1={revenueHoveredPoint.x}
                      y1={revenueHoveredPoint.y}
                      x2={revenueHoveredPoint.x}
                      y2="175"
                      stroke="#7957fb"
                      strokeWidth="1"
                      strokeDasharray="3,3"
                    />
                    <foreignObject
                      x={revenueHoveredPoint.x - 60}
                      y={revenueHoveredPoint.y - 60}
                      width="120"
                      height="50"
                    >
                      <div className="bg-slate-900 border border-slate-850 rounded-lg p-1.5 shadow-lg text-center select-none">
                        <p className="text-[8px] font-bold text-slate-400">{revenueHoveredPoint.label}</p>
                        <p className="text-xs font-extrabold text-white tabular-nums leading-tight">{revenueHoveredPoint.value}</p>
                      </div>
                    </foreignObject>
                  </g>
                )}
              </svg>
            </div>
          </div>
        </div>

        {/* Deals by Pipeline Stage Funnel Chart */}
        <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-md hover:border-brand-border-purple/40 transition-all duration-300">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-brand-heading text-sm">Deals by stage</h3>
              <div className="relative">
                <select className="appearance-none bg-slate-50 border border-brand-border-purple/35 text-brand-text focus:border-brand-accent rounded-lg px-2.5 py-1 pr-7 text-[10px] font-bold focus:outline-none cursor-pointer">
                  <option>This Month</option>
                  <option>Last Month</option>
                </select>
                <ChevronDown className="absolute right-2 top-2 h-3 w-3 text-slate-500 pointer-events-none" strokeWidth={1.75} />
              </div>
            </div>

            {/* Funnel Layout - Premium Monochrome with Blue accent highlight */}
            <div className="space-y-1.5 mt-4">
              {pipelineStages.map((stage, index) => (
                <div key={index} className="flex items-center justify-between text-[11px] font-semibold">
                  <span className="w-20 text-brand-heading truncate">{stage.name}</span>
                  <div className="flex-1 flex justify-center px-1.5">
                    <div 
                      className={`h-6.5 ${stage.width} ${stage.bg} hover:opacity-90 transition-all rounded-md flex items-center justify-center ${stage.name === 'Won' ? 'text-white' : 'text-brand-text'} text-[10px] font-extrabold shadow-sm/5 relative group`}
                    >
                      <span className="tabular-nums">{stage.count}</span>
                      <div className="absolute bottom-full mb-1 bg-slate-900 text-white text-[9px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                        {stage.name}: {stage.count} deals
                      </div>
                    </div>
                  </div>
                  <span className="w-8 text-right text-brand-text tabular-nums">{stage.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs font-bold text-slate-400">
            <span>Conversion rate</span>
            <span className="text-brand-text tabular-nums">19.0%</span>
          </div>
        </div>
      </div>

      {/* Lower Grid (2 Columns: Source & Company Size) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Deals by Source donut */}
        <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 hover:-translate-y-0.5 hover:shadow-md hover:border-brand-border-purple/40 transition-all duration-300">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-brand-heading text-sm">Deals by source</h3>
              <span title="Percentage of deals initiated per source channel">
                <Info className="h-3.5 w-3.5 text-slate-400 cursor-help" strokeWidth={1.75} />
              </span>
            </div>
            <div className="relative">
              <select className="appearance-none bg-slate-50 border border-brand-border-purple/35 text-brand-text focus:border-brand-accent rounded-lg px-2.5 py-1 pr-7 text-[10px] font-bold focus:outline-none cursor-pointer">
                <option>This Month</option>
                <option>All Time</option>
              </select>
              <ChevronDown className="absolute right-2 top-2 h-3 w-3 text-slate-500 pointer-events-none" strokeWidth={1.75} />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around mt-4">
            {/* SVG Ring Donut */}
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
                    onMouseEnter={() => setHoveredSourceIdx(idx)}
                    onMouseLeave={() => setHoveredSourceIdx(null)}
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-lg font-extrabold text-brand-text leading-none font-sans tabular-nums">
                  {hoveredSourceIdx !== null ? sources[hoveredSourceIdx].val : "₹3.85M"}
                </span>
                <span className="text-[9px] text-brand-text/65 font-bold tracking-wider uppercase mt-1 leading-none">
                  {hoveredSourceIdx !== null ? sources[hoveredSourceIdx].name : "Total"}
                </span>
              </div>
            </div>

            {/* Muted legend matching modern SaaS */}
            <div className="mt-4 sm:mt-0 space-y-1.5 flex-1 max-w-xs pl-0 sm:pl-6 w-full">
              {sources.map((src, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-center justify-between p-1 rounded-lg transition-colors ${
                    hoveredSourceIdx === idx ? 'bg-slate-50' : ''
                  }`}
                  onMouseEnter={() => setHoveredSourceIdx(idx)}
                  onMouseLeave={() => setHoveredSourceIdx(null)}
                >
                  <div className="flex items-center space-x-2">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: src.color }} />
                    <span className="text-xs font-semibold text-brand-text/75">{src.name}</span>
                  </div>
                  <span className="text-xs font-bold text-brand-text tabular-nums">{src.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Revenue by Company Size donut */}
        <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 hover:-translate-y-0.5 hover:shadow-md hover:border-brand-border-purple/40 transition-all duration-300">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-brand-heading text-sm">Revenue by company size</h3>
            <div className="relative">
              <select className="appearance-none bg-slate-50 border border-brand-border-purple/35 text-brand-text focus:border-brand-accent rounded-lg px-2.5 py-1 pr-7 text-[10px] font-bold focus:outline-none cursor-pointer">
                <option>This Quarter</option>
                <option>This Year</option>
              </select>
              <ChevronDown className="absolute right-2 top-2 h-3 w-3 text-slate-500 pointer-events-none" strokeWidth={1.75} />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around mt-4">
            {/* SVG Ring Donut */}
            <div className="relative h-36 w-36 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-45" viewBox="0 0 160 160">
                {sizeSegments.map((seg, idx) => (
                  <path
                    key={idx}
                    d={seg.path}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="14"
                    className="transition-all duration-200 cursor-pointer hover:stroke-[16]"
                    onMouseEnter={() => setHoveredSizeIdx(idx)}
                    onMouseLeave={() => setHoveredSizeIdx(null)}
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-lg font-extrabold text-brand-text leading-none font-sans tabular-nums">
                  {hoveredSizeIdx !== null ? `${companySizes[hoveredSizeIdx].pct}%` : "₹3.85M"}
                </span>
                <span className="text-[9px] text-brand-text/65 font-bold tracking-wider uppercase mt-1 leading-none">
                  {hoveredSizeIdx !== null ? companySizes[hoveredSizeIdx].name.split(' ')[0] : "Total"}
                </span>
              </div>
            </div>

            {/* Muted Legend */}
            <div className="mt-4 sm:mt-0 space-y-1.5 flex-1 max-w-xs pl-0 sm:pl-6 w-full">
              {companySizes.map((sz, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-center justify-between p-1 rounded-lg transition-colors ${
                    hoveredSizeIdx === idx ? 'bg-slate-50' : ''
                  }`}
                  onMouseEnter={() => setHoveredSizeIdx(idx)}
                  onMouseLeave={() => setHoveredSizeIdx(null)}
                >
                  <div className="flex items-center space-x-2">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: sz.color }} />
                    <span className="text-xs font-semibold text-brand-text/75">{sz.name}</span>
                  </div>
                  <span className="text-xs font-bold text-brand-text tabular-nums">{sz.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
