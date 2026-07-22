'use client';

import React from 'react';
import { 
  Award, 
  TrendingUp, 
  Phone, 
  Calendar, 
  Layers, 
  Percent, 
  Users,
  ChevronUp,
  Star
} from 'lucide-react';

export default function TeamPerformanceView() {
  const teamStats = [
    { rank: 1, name: "Sarah Johnson", revenue: 1180000, calls: 245, meetings: 42, deals: 8, winRate: 78, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&fit=crop&q=80" },
    { rank: 2, name: "Alex Johnson", revenue: 920000, calls: 198, meetings: 38, deals: 6, winRate: 72, avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&fit=crop&q=80" },
    { rank: 3, name: "David Wilson", revenue: 750050, calls: 165, meetings: 29, deals: 4, winRate: 64, avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&fit=crop&q=80" },
    { rank: 4, name: "Lisa Martinez", revenue: 480000, calls: 120, meetings: 21, deals: 3, winRate: 58, avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&fit=crop&q=80" },
    { rank: 5, name: "Michael Brown", revenue: 360000, calls: 95, meetings: 15, deals: 2, winRate: 50, avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&fit=crop&q=80" }
  ];

  const teamAverages = {
    revenue: 738010,
    calls: 164,
    meetings: 29,
    deals: 4.6,
    winRate: 64.4
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-sans text-brand-heading tracking-tight font-bold">
          Team Performance
        </h1>
        <p className="text-xs md:text-sm text-brand-text/75 mt-1 font-medium tracking-wide">
          Compare revenue attribution, contact metrics, and overall close rates across representatives.
        </p>
      </div>

      {/* Aggregate metrics grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: "Avg Revenue / Rep", val: "₹738,010", sub: "Monthly", icon: TrendingUp },
          { label: "Avg Outbound Calls", val: "164 Calls", sub: "Per Rep", icon: Phone },
          { label: "Avg Meetings Set", val: "29 Demos", sub: "Per Rep", icon: Calendar },
          { label: "Avg Deals / Rep", val: "4.6 Deals", sub: "Won Status", icon: Layers },
          { label: "Avg Win Rate", val: "64.4%", sub: "Target SLA", icon: Percent }
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="bg-white border border-brand-border-purple/20 rounded-xl p-4 shadow-sm/5 space-y-1">
              <div className="flex items-center space-x-1.5 text-slate-450">
                <Icon className="h-3.5 w-3.5 text-brand-accent" />
                <span className="text-[10px] font-extrabold uppercase tracking-wide">{item.label}</span>
              </div>
              <h4 className="text-base font-extrabold text-brand-heading">{item.val}</h4>
              <span className="text-[9px] text-slate-400 font-bold block">{item.sub}</span>
            </div>
          );
        })}
      </div>

      {/* Main Leaderboard Table */}
      <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-brand-heading text-sm flex items-center">
            <Award className="h-4.5 w-4.5 mr-2 text-brand-accent" />
            <span>Sales Representative Rankings</span>
          </h3>
          <span className="text-[9px] font-extrabold bg-brand-sidebar-hover/30 text-brand-text px-2 py-1 rounded">
            All Metrics (Current Quarter)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] uppercase font-extrabold text-slate-400">
                <th className="py-2.5">Rank</th>
                <th className="py-2.5">Salesperson</th>
                <th className="py-2.5 text-right">Revenue Won</th>
                <th className="py-2.5 text-right">Outbound Calls</th>
                <th className="py-2.5 text-right">Client Meetings</th>
                <th className="py-2.5 text-right">Deals Won</th>
                <th className="py-2.5 text-right">Win Rate</th>
                <th className="py-2.5 text-right">Performance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-brand-text">
              {teamStats.map((rep) => {
                const getStatus = (winRate: number) => {
                  if (winRate >= 70) return { label: 'Top Performer', color: 'bg-emerald-50 text-emerald-700' };
                  if (winRate >= 60) return { label: 'On Target', color: 'bg-blue-50 text-blue-700' };
                  return { label: 'Nurture Required', color: 'bg-rose-50 text-rose-700' };
                };
                const status = getStatus(rep.winRate);
                
                return (
                  <tr key={rep.rank} className="hover:bg-slate-50/50">
                    <td className="py-3">
                      <div className="flex items-center space-x-1">
                        <span className={`h-5 w-5 rounded-full flex items-center justify-center font-black ${
                          rep.rank === 1 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {rep.rank}
                        </span>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center space-x-2.5">
                        <img src={rep.avatar} alt={rep.name} className="h-6 w-6 rounded-full border border-slate-100 object-cover" />
                        <span className="font-extrabold">{rep.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-right tabular-nums font-extrabold text-brand-heading">
                      ₹{rep.revenue.toLocaleString()}
                    </td>
                    <td className="py-3 text-right tabular-nums">{rep.calls}</td>
                    <td className="py-3 text-right tabular-nums">{rep.meetings}</td>
                    <td className="py-3 text-right tabular-nums">{rep.deals}</td>
                    <td className="py-3 text-right tabular-nums">{rep.winRate}%</td>
                    <td className="py-3 text-right">
                      <span className={`px-2 py-0.5 rounded font-extrabold uppercase tracking-wide text-[9px] ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
