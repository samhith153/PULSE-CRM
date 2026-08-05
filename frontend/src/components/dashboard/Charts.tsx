'use client';

import React, { useState } from 'react';
import { Info, ChevronDown, BarChart2 } from 'lucide-react';
import { useReveal } from '@/hooks/use-reveal';

interface ChartsProps {
  loading?: boolean;
  empty?: boolean;
}

export default function Charts({ loading = false, empty = false }: ChartsProps) {
  const { ref: chartRef, visible: chartVisible } = useReveal<HTMLDivElement>();
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

  // Stage bars: alternate brand-blue / brand-cyan / brand-purple
  const pipelineStages = [
    { name: "New", count: 120, bg: "bg-brand-blue" },
    { name: "Qualified", count: 86, bg: "bg-brand-cyan" },
    { name: "Proposal", count: 40, bg: "bg-brand-purple" },
    { name: "Negotiation", count: 28, bg: "bg-brand-blue/70" },
    { name: "Won", count: 23, bg: "bg-brand-purple/80" },
    { name: "Lost", count: 14, bg: "bg-muted-foreground/40" }
  ];

  const maxStageCount = Math.max(...pipelineStages.map((s) => s.count));

  // Source chart percentages using new accents
  const sources = [
    { name: "Website", pct: 45, color: "var(--brand-purple)", offset: 0, val: "₹1.73M" },
    { name: "Referral", pct: 25, color: "var(--brand-cyan)", offset: 45, val: "₹0.96M" },
    { name: "Email", pct: 15, color: "var(--brand-blue)", offset: 70, val: "₹0.58M" },
    { name: "Social Media", pct: 10, color: "var(--chart-4)", offset: 85, val: "₹0.39M" },
    { name: "Other", pct: 5, color: "var(--chart-5)", offset: 95, val: "₹0.19M" }
  ];

  // Company size percentages using new accents
  const companySizes = [
    { name: "1 - 10 employees", pct: 15, color: "var(--brand-blue)", offset: 0 },
    { name: "11 - 50 employees", pct: 25, color: "var(--brand-purple)", offset: 15 },
    { name: "51 - 200 employees", pct: 30, color: "var(--brand-cyan)", offset: 40 },
    { name: "201 - 1000 employees", pct: 20, color: "var(--chart-4)", offset: 70 },
    { name: "1000+ employees", pct: 10, color: "var(--chart-5)", offset: 90 }
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-card border border-border rounded-2xl p-5 lg:col-span-2 h-76 animate-pulse" />
          <div className="bg-card border border-border rounded-2xl p-5 h-76 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-2xl p-5 h-56 animate-pulse" />
          <div className="bg-card border border-border rounded-2xl p-5 h-56 animate-pulse" />
        </div>
      </div>
    );
  }

  if (empty) {
    return (
      <div className="bg-card border border-border rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
        <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center border border-border text-brand-purple">
          <BarChart2 className="h-6 w-6" strokeWidth={1.5} />
        </div>
        <h4 className="text-sm font-bold text-foreground mt-4">No report data available</h4>
        <p className="text-xs text-muted-foreground mt-1.5 max-w-sm leading-relaxed">
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
        <div 
          ref={chartRef as any}
          data-visible={chartVisible}
          className="reveal bg-card border border-border rounded-2xl p-6 flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-nav transition-all duration-300 lg:col-span-2"
        >
          <div>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold tracking-tight text-foreground">
                  Revenue over time
                </h2>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                  Closed-won revenue, rolling 18 days
                </p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground">
                This month <ChevronDown size={13} />
              </span>
            </div>

            <div className="mt-6 grid grid-cols-[auto_minmax(0,1fr)] gap-3">
              {/* Axis labels y-axis */}
              <div className="flex flex-col justify-between py-1 text-[10px] text-muted-foreground">
                {["₹4M", "₹3M", "₹2M", "₹1M", "₹0"].map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
              <div>
                <svg
                  viewBox="0 0 100 90"
                  preserveAspectRatio="none"
                  className="h-48 w-full overflow-visible"
                  aria-hidden
                >
                  {[0, 22.5, 45, 67.5, 90].map((y) => (
                    <line
                      key={y}
                      x1="0"
                      x2="100"
                      y1={y}
                      y2={y}
                      stroke="currentColor"
                      strokeWidth="1"
                      vectorEffect="non-scaling-stroke"
                      className="text-border"
                    />
                  ))}
                  {/* Filled area */}
                  <path
                    d="M0,82 L14,70 L28,62 L42,50 L56,40 L70,30 L84,24 L100,8 L100,90 L0,90 Z"
                    fill="currentColor"
                    className="text-brand-purple/12"
                  />
                  {/* Revenue Line */}
                  <path
                    d="M0,82 L14,70 L28,62 L42,50 L56,40 L70,30 L84,24 L100,8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                    className="text-brand-purple"
                  />
                  {/* Points */}
                  {[[0, 82], [14, 70], [28, 62], [42, 50], [56, 40], [70, 30], [84, 24], [100, 8]].map(([x, y]) => (
                    <circle key={x} cx={x} cy={y} r="1.6" className="fill-current text-brand-cyan" />
                  ))}
                </svg>
                <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                  {revenuePoints.map((pt) => (
                    <span key={pt.name}>{pt.name}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Deals by Pipeline Stage Funnel Chart */}
        <div 
          ref={chartRef as any}
          data-visible={chartVisible}
          className="reveal bg-card border border-border rounded-2xl p-6 flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-nav transition-all duration-300"
        >
          <div>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <h2 className="truncate text-base font-semibold tracking-tight text-foreground">
                Deals by stage
              </h2>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground">
                This month <ChevronDown size={13} />
              </span>
            </div>

            {/* Funnel Layout */}
            <ul className="mt-5 flex-1 space-y-3">
              {pipelineStages.map((stage, index) => (
                <li key={stage.name} className="grid grid-cols-[6.5rem_minmax(0,1fr)_2.5rem] items-center gap-3">
                  <span className="truncate text-xs font-medium text-foreground">{stage.name}</span>
                  <span className="h-6 overflow-hidden rounded-full bg-secondary">
                    <span 
                      className={`grid h-full place-items-center rounded-full text-[11px] font-semibold text-primary-foreground transition-[width] duration-700 ease-out ${stage.bg}`}
                      style={{
                        width: chartVisible ? `${(stage.count / maxStageCount) * 100}%` : "0%",
                        transitionDelay: `${index * 70}ms`,
                      }}
                    >
                      {stage.count}
                    </span>
                  </span>
                  <span className="text-right text-xs text-muted-foreground">{stage.count}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
            <span className="text-sm text-muted-foreground">Conversion rate</span>
            <span className="text-sm font-semibold text-foreground">19.0%</span>
          </div>
        </div>
      </div>

      {/* Lower Grid (2 Columns: Source & Company Size) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Deals by Source donut */}
        <div className="bg-card border border-border rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-nav transition-all duration-300">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-foreground text-sm">Deals by source</h3>
              <span title="Percentage of deals initiated per source channel">
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" strokeWidth={1.75} />
              </span>
            </div>
            <div className="relative">
              <select className="appearance-none bg-secondary border border-border text-foreground focus:border-brand-purple rounded-lg px-2.5 py-1 pr-7 text-[10px] font-bold focus:outline-none cursor-pointer">
                <option>This Month</option>
                <option>All Time</option>
              </select>
              <ChevronDown className="absolute right-2 top-2 h-3 w-3 text-muted-foreground pointer-events-none" strokeWidth={1.75} />
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
                <span className="text-lg font-semibold text-foreground leading-none font-sans tabular-nums">
                  {hoveredSourceIdx !== null ? sources[hoveredSourceIdx].val : "₹3.85M"}
                </span>
                <span className="text-[9px] text-muted-foreground font-bold tracking-wider uppercase mt-1 leading-none">
                  {hoveredSourceIdx !== null ? sources[hoveredSourceIdx].name : "Total"}
                </span>
              </div>
            </div>

            {/* Muted legend */}
            <div className="mt-4 sm:mt-0 space-y-1.5 flex-1 max-w-xs pl-0 sm:pl-6 w-full">
              {sources.map((src, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-center justify-between p-1 rounded-lg transition-colors ${
                    hoveredSourceIdx === idx ? 'bg-secondary' : ''
                  }`}
                  onMouseEnter={() => setHoveredSourceIdx(idx)}
                  onMouseLeave={() => setHoveredSourceIdx(null)}
                >
                  <div className="flex items-center space-x-2">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: src.color }} />
                    <span className="text-xs font-semibold text-muted-foreground">{src.name}</span>
                  </div>
                  <span className="text-xs font-bold text-foreground tabular-nums">{src.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Revenue by Company Size donut */}
        <div className="bg-card border border-border rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-nav transition-all duration-300">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-foreground text-sm">Revenue by company size</h3>
            <div className="relative">
              <select className="appearance-none bg-secondary border border-border text-foreground focus:border-brand-purple rounded-lg px-2.5 py-1 pr-7 text-[10px] font-bold focus:outline-none cursor-pointer">
                <option>This Quarter</option>
                <option>This Year</option>
              </select>
              <ChevronDown className="absolute right-2 top-2 h-3 w-3 text-muted-foreground pointer-events-none" strokeWidth={1.75} />
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
                <span className="text-lg font-semibold text-foreground leading-none font-sans tabular-nums">
                  {hoveredSizeIdx !== null ? `${companySizes[hoveredSizeIdx].pct}%` : "₹3.85M"}
                </span>
                <span className="text-[9px] text-muted-foreground font-bold tracking-wider uppercase mt-1 leading-none">
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
                    hoveredSizeIdx === idx ? 'bg-secondary' : ''
                  }`}
                  onMouseEnter={() => setHoveredSizeIdx(idx)}
                  onMouseLeave={() => setHoveredSizeIdx(null)}
                >
                  <div className="flex items-center space-x-2">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: sz.color }} />
                    <span className="text-xs font-semibold text-muted-foreground">{sz.name}</span>
                  </div>
                  <span className="text-xs font-bold text-foreground tabular-nums">{sz.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
