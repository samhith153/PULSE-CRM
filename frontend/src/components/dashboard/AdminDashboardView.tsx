'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Menu,
  ArrowRight,
  Wallet,
  Building2,
  UserPlus,
  Users,
} from 'lucide-react';
import { getAdminDashboard, asNumber, formatINR, formatNum, formatPct, AdminDashboardData } from '@/utils/api';

function sparkPath(values: number[], w = 120, h = 36): string {
  if (values.length === 0) return '';
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  return values
    .map((v, i) => {
      const x = (i / Math.max(values.length - 1, 1)) * w;
      const y = h - ((v - min) / range) * (h - 8) - 4;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
}

export default function AdminDashboardView() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredMonthIdx, setHoveredMonthIdx] = useState<number | null>(null);
  const [hoveredTrafficIdx, setHoveredTrafficIdx] = useState<number | null>(null);
  const [hoveredKpiIdx, setHoveredKpiIdx] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAdminDashboard()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load admin dashboard');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const s = data?.summary;
  const monthly = data?.monthly_sales ?? [];
  const revenueSeries = monthly.map((m) => asNumber(m.revenue));
  const leadsSeries = monthly.map((m) => m.leads_created);

  const kpiCards = s
    ? [
        {
          title: 'Revenue (Month)',
          value: formatINR(s.revenue.this_month),
          change: formatPct(s.revenue.growth_pct),
          isPositive: asNumber(s.revenue.growth_pct) >= 0,
          sparkline: sparkPath(revenueSeries),
          color: '#10b981',
          icon: Wallet,
        },
        {
          title: 'Active Users',
          value: formatNum(s.users.active),
          change: `+${s.users.new_this_month} new`,
          isPositive: s.users.new_this_month >= 0,
          sparkline: sparkPath(monthly.map((m) => m.leads_created)),
          color: '#7957fb',
          icon: Users,
        },
        {
          title: 'Companies',
          value: formatNum(s.companies.total),
          change: formatPct(s.companies.monthly_growth_pct),
          isPositive: asNumber(s.companies.monthly_growth_pct) >= 0,
          sparkline: sparkPath(monthly.map((m) => m.leads_converted)),
          color: '#3b82f6',
          icon: Building2,
        },
        {
          title: 'New Leads (Mo)',
          value: formatNum(s.leads.new_this_month),
          change: formatPct(s.leads.monthly_growth_pct),
          isPositive: asNumber(s.leads.monthly_growth_pct) >= 0,
          sparkline: sparkPath(leadsSeries),
          color: asNumber(s.leads.monthly_growth_pct) >= 0 ? '#10b981' : '#ef4444',
          icon: UserPlus,
        },
      ]
    : [];

  // Chart scaling
  const onlineData = revenueSeries.length ? revenueSeries : [0];
  const inStoreData = leadsSeries.length ? leadsSeries : [0];
  const maxOnline = Math.max(...onlineData, 1);
  const maxInStore = Math.max(...inStoreData, 1);
  const maxVal = Math.max(maxOnline, maxInStore);
  const months = monthly.map((m) =>
    new Date(`${m.month}-01`).toLocaleDateString('en-IN', { month: 'short', timeZone: 'UTC' })
  );
  const monthsLabel = months.length ? months : ['—'];

  const getY = (val: number, localMax: number) => 190 - (val / Math.max(localMax, 1)) * 125;

  const buildSmoothPath = (data: number[], localMax: number) => {
    const points = data.map((val, i) => ({ x: 50 + i * 46, y: 190 - (val / Math.max(localMax, 1)) * 125 }));
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

  const buildAreaPath = (data: number[], localMax: number) => {
    const line = buildSmoothPath(data, localMax);
    const lastX = 50 + (data.length - 1) * 46;
    return `${line} L ${lastX} 190 L 50 190 Z`;
  };

  const rawChannels =
    (data?.lead_sources ?? []).map((src) => ({
      name: src.source || 'Unknown',
      pct: `${Math.round(asNumber(src.percentage))}%`,
      raw: asNumber(src.percentage),
      color: ['#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6'][data!.lead_sources.indexOf(src) % 5],
    })) ?? [];

  const CIRCUMFERENCE = 2 * Math.PI * 60;
  let currentAccumulatedPercent = 0;
  const trafficChannels = rawChannels.map((item) => {
    const dashLength = ((item.raw || 0) / 100) * CIRCUMFERENCE;
    const strokeDasharray = `${dashLength} ${CIRCUMFERENCE}`;
    const strokeDashoffset = -((currentAccumulatedPercent / 100) * CIRCUMFERENCE);
    currentAccumulatedPercent += item.raw || 0;
    return { ...item, strokeDasharray, strokeDashoffset };
  });

  const overviewMetrics = s
    ? [
        { label: 'Total Revenue (Yr)', value: formatINR(s.revenue.this_year), icon: Wallet, iconBg: 'bg-emerald-50 text-emerald-600' },
        { label: 'Won Leads', value: formatNum(s.leads.converted), icon: UserPlus, iconBg: 'bg-amber-50 text-amber-600' },
        { label: 'Contacts', value: formatNum(s.contacts.total), icon: Users, iconBg: 'bg-indigo-50 text-indigo-600' },
        { label: 'Tasks Pending', value: formatNum(s.tasks.pending), icon: Building2, iconBg: 'bg-cyan-50 text-cyan-600' },
      ]
    : [];

  const topCompanies = data?.top_companies ?? [];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-9 w-64 bg-slate-100 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border rounded-2xl p-5 h-32 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-white border rounded-2xl p-6 h-80 animate-pulse" />
          <div className="lg:col-span-4 bg-white border rounded-2xl p-6 h-80 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-rose-700">
        <p className="font-bold">Couldn’t load admin dashboard</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-sans text-brand-heading tracking-tight font-bold">Admin Dashboard</h1>
        <p className="text-xs md:text-sm text-brand-text/75 mt-1 font-medium tracking-wide">
          Organization health, revenue performance, lead funnel, and top performers.
        </p>
      </div>

      {/* 1. TOP ROW: 4 KPI Cards with Sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((kpi, idx) => {
          const isCardHovered = hoveredKpiIdx === idx;
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredKpiIdx(idx)}
              onMouseLeave={() => setHoveredKpiIdx(null)}
              className={`bg-white border rounded-2xl p-5 shadow-2xs transition-all duration-300 flex flex-col justify-between select-none relative overflow-hidden cursor-pointer ${
                isCardHovered ? 'border-indigo-300 shadow-md -translate-y-1' : 'border-slate-200/90'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 block">{kpi.title}</span>
                <Icon className="h-4 w-4 text-slate-400" />
              </div>
              <h2 className="text-3xl font-black text-indigo-900 text-center mt-1 font-sans tracking-tight">{kpi.value}</h2>
              <div className="flex items-end justify-between mt-4">
                <div className="flex items-center space-x-1">
                  {kpi.isPositive ? (
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
                  )}
                  <span className={`text-xs font-bold ${kpi.isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>{kpi.change}</span>
                </div>
                <div className="w-24 h-8 shrink-0 overflow-hidden flex items-center justify-end">
                  <svg className="w-full h-full p-0.5" viewBox="0 0 120 36" preserveAspectRatio="none">
                    <path d={kpi.sparkline} fill="none" stroke={kpi.color} strokeWidth={isCardHovered ? '3' : '2.5'} strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-200" />
                  </svg>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. MIDDLE ROW: Revenue & Leads chart + Lead Source donut */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs flex flex-col justify-between hover:shadow-md transition-all duration-300 relative">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-extrabold text-slate-900 text-base">Revenue &amp; Lead Generation</h3>
              <div className="flex items-center space-x-6 text-xs font-semibold">
                <div className="flex items-center space-x-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <span className="text-slate-600">Revenue</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                  <span className="text-slate-600">Leads</span>
                </div>
                <button className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer border-0 bg-transparent">
                  <Menu className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="h-64 w-full relative mt-4 select-none">
              <svg className="w-full h-full" viewBox="0 0 540 220" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="onlineFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="storeFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {[30, 70, 110, 150, 190].map((y, i) => (
                  <g key={i}>
                    <line x1="40" y1={y} x2="520" y2={y} stroke="#f1f5f9" strokeWidth="1" />
                  </g>
                ))}

                <path d={buildAreaPath(onlineData, maxOnline)} fill="url(#onlineFill)" />
                <path d={buildAreaPath(inStoreData, maxInStore)} fill="url(#storeFill)" />
                <path d={buildSmoothPath(onlineData, maxOnline)} fill="none" stroke="#f59e0b" strokeWidth="2.5" />
                <path d={buildSmoothPath(inStoreData, maxInStore)} fill="none" stroke="#f43f5e" strokeWidth="2.5" />

                {monthsLabel.map((m, i) => {
                  const cx = 50 + i * 46;
                  const isHovered = hoveredMonthIdx === i;
                  const onlineY = getY(onlineData[i] ?? 0, maxOnline);
                  const storeY = getY(inStoreData[i] ?? 0, maxInStore);
                  return (
                    <g key={i}>
                      {isHovered && <line x1={cx} y1={20} x2={cx} y2={190} stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3" />}
                      <circle cx={cx} cy={onlineY} r={isHovered ? '5.5' : '3'} fill="#ffffff" stroke="#f59e0b" strokeWidth={isHovered ? '3' : '2'} className="transition-all duration-150" />
                      <circle cx={cx} cy={storeY} r={isHovered ? '5.5' : '3'} fill="#ffffff" stroke="#f43f5e" strokeWidth={isHovered ? '3' : '2'} className="transition-all duration-150" />
                      <text x={cx} y="210" textAnchor="middle" className={`text-[9.5px] font-bold font-sans transition-colors ${isHovered ? 'fill-indigo-600 font-extrabold' : 'fill-slate-400'}`}>{m}</text>
                      <rect x={cx - 20} y={10} width={40} height={195} fill="transparent" className="cursor-pointer" onMouseEnter={() => setHoveredMonthIdx(i)} onMouseLeave={() => setHoveredMonthIdx(null)} />
                    </g>
                  );
                })}
              </svg>

              {hoveredMonthIdx !== null && monthly[hoveredMonthIdx] && (
                <div
                  className="absolute bg-slate-900 border border-slate-800 rounded-xl p-3 text-white shadow-2xl text-xs space-y-1.5 transition-all duration-150 z-30 pointer-events-none transform -translate-x-1/2 -translate-y-full"
                  style={{ left: `${((50 + hoveredMonthIdx * 46) / 540) * 100}%`, top: `${Math.min(getY(onlineData[hoveredMonthIdx] ?? 0, maxOnline), getY(inStoreData[hoveredMonthIdx] ?? 0, maxInStore)) / 220 * 100 - 4}%` }}
                >
                  <span className="font-extrabold text-[10px] text-slate-300 uppercase tracking-wider block border-b border-slate-800 pb-1">
                    {monthsLabel[hoveredMonthIdx]} Performance
                  </span>
                  <div className="space-y-1 pt-0.5 text-[11px]">
                    <div className="flex justify-between items-center gap-4">
                      <span className="text-slate-400 flex items-center space-x-1.5 font-medium"><span className="h-2 w-2 rounded-full bg-amber-500 inline-block" /><span>Revenue:</span></span>
                      <span className="font-extrabold text-amber-400">{formatINR(monthly[hoveredMonthIdx].revenue)}</span>
                    </div>
                    <div className="flex justify-between items-center gap-4">
                      <span className="text-slate-400 flex items-center space-x-1.5 font-medium"><span className="h-2 w-2 rounded-full bg-rose-500 inline-block" /><span>Leads:</span></span>
                      <span className="font-extrabold text-rose-400">{monthly[hoveredMonthIdx].leads_created}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

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
        </div>

        <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs flex flex-col justify-between hover:shadow-md transition-all duration-300">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base mb-4">Lead Sources</h3>
            <div className="relative h-48 w-48 mx-auto mt-2 flex items-center justify-center select-none">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
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
                      strokeWidth={isHovered ? '24' : '18'}
                      strokeDasharray={c.strokeDasharray}
                      strokeDashoffset={c.strokeDashoffset}
                      className="cursor-pointer transition-all duration-200"
                      onMouseEnter={() => setHoveredTrafficIdx(idx)}
                      onMouseLeave={() => setHoveredTrafficIdx(null)}
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-2xl font-black text-slate-900 leading-none font-sans">
                  {hoveredTrafficIdx !== null && rawChannels[hoveredTrafficIdx] ? rawChannels[hoveredTrafficIdx].pct : `${rawChannels.length}`}
                </span>
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mt-1 truncate max-w-[100px]">
                  {hoveredTrafficIdx !== null && rawChannels[hoveredTrafficIdx] ? rawChannels[hoveredTrafficIdx].name : 'Sources'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 text-center mt-6 pt-4 border-t border-slate-100 select-none">
              {trafficChannels.map((c, idx) => {
                const isHovered = hoveredTrafficIdx === idx;
                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredTrafficIdx(idx)}
                    onMouseLeave={() => setHoveredTrafficIdx(null)}
                    className={`flex items-center justify-between px-2 py-1 rounded-xl transition-all cursor-pointer ${isHovered ? 'bg-slate-100 shadow-2xs scale-105' : ''}`}
                  >
                    <div className="flex items-center space-x-1.5 text-[10px] font-semibold text-slate-500">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="truncate">{c.name}</span>
                    </div>
                    <span className="text-[11px] font-black text-slate-900">{c.pct}</span>
                  </div>
                );
              })}
              {trafficChannels.length === 0 && <span className="text-xs text-slate-400">No lead source data yet.</span>}
            </div>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM ROW: Top Companies table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs hover:shadow-md transition-all duration-300">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-extrabold text-slate-900 text-base">Top Companies</h3>
          <span className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer transition-colors">
            View All Companies &rarr;
          </span>
        </div>
        <div className="overflow-x-auto select-none">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-extrabold text-black uppercase tracking-wider border-b border-slate-100 pb-3">
                <th className="py-3 px-4">COMPANY</th>
                <th className="py-3 px-4">REVENUE</th>
                <th className="py-3 px-4">LEADS</th>
                <th className="py-3 px-4">CONTACTS</th>
                <th className="py-3 px-4 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {topCompanies.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">No company data available yet.</td>
                </tr>
              )}
              {topCompanies.map((row, idx) => (
                <tr key={row.company_id || idx} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-3">
                      <div className={`h-9 w-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm shrink-0 shadow-2xs`}>
                        {row.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block text-xs">{row.name}</span>
                        <span className="text-[10px] text-slate-400 font-medium block mt-0.5">Top account</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4"><span className="font-bold text-slate-900 tabular-nums block">{formatINR(row.revenue)}</span></td>
                  <td className="py-3.5 px-4"><span className="font-bold text-slate-900 tabular-nums block">{formatNum(row.lead_count)}</span></td>
                  <td className="py-3.5 px-4"><span className="font-bold text-slate-900 tabular-nums block">{formatNum(row.contact_count)}</span></td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="h-8 w-8 rounded-full bg-indigo-500 text-white hover:bg-indigo-600 transition-colors flex items-center justify-center shadow-xs cursor-pointer border-0">
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
