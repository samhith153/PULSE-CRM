'use client';

import React from 'react';
import { 
  ChevronDown, 
  ArrowUpRight, 
  Mail, 
  Phone, 
  Calendar, 
  CheckSquare, 
  FileText 
} from 'lucide-react';

interface WidgetsProps {
  loading?: boolean;
  showLeaderboard?: boolean;
  showProductivity?: boolean;
  onTabChange?: (tab: string) => void;
}

export default function Widgets({ 
  loading = false,
  showLeaderboard = true,
  showProductivity = true,
  onTabChange
}: WidgetsProps) {
  const teamMembers = [
    {
      name: "Alex Johnson",
      deals: 8,
      revenue: "₹1.25M",
      revenueRaw: 1250000,
      winRate: "40.0%",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&fit=crop&q=80"
    },
    {
      name: "Sarah Johnson",
      deals: 6,
      revenue: "₹980K",
      revenueRaw: 980000,
      winRate: "33.0%",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&fit=crop&q=80"
    },
    {
      name: "David Wilson",
      deals: 5,
      revenue: "₹750K",
      revenueRaw: 750000,
      winRate: "29.0%",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&fit=crop&q=80"
    },
    {
      name: "Lisa Martinez",
      deals: 3,
      revenue: "₹480K",
      revenueRaw: 480000,
      winRate: "25.0%",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&fit=crop&q=80"
    },
    {
      name: "Michael Brown",
      deals: 2,
      revenue: "₹360K",
      revenueRaw: 360000,
      winRate: "20.0%",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&fit=crop&q=80"
    }
  ];

  const activities = [
    { name: "Emails Sent", count: 245, change: "+18%", icon: Mail, color: "text-brand-accent", bg: "bg-brand-accent/10 border border-brand-accent/20" },
    { name: "Calls Made", count: 120, change: "+12%", icon: Phone, color: "text-brand-accent", bg: "bg-brand-accent/10 border border-brand-accent/20" },
    { name: "Meetings Held", count: 32, change: "+14%", icon: Calendar, color: "text-brand-accent", bg: "bg-brand-accent/10 border border-brand-accent/20" },
    { name: "Tasks Completed", count: 68, change: "+15%", icon: CheckSquare, color: "text-brand-accent", bg: "bg-brand-accent/10 border border-brand-accent/20" },
    { name: "Notes Added", count: 56, change: "+20%", icon: FileText, color: "text-brand-accent", bg: "bg-brand-accent/10 border border-brand-accent/20" }
  ];

  const maxRevenue = 1250000;

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
        <div className="bg-white border border-brand-border-purple/15 rounded-xl p-5 h-64 lg:col-span-2" />
        <div className="bg-white border border-brand-border-purple/15 rounded-xl p-5 h-64" />
      </div>
    );
  }

  if (!showLeaderboard && !showProductivity) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Team Performance Leaderboard */}
      {showLeaderboard && (
        <div className={`bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 ${showProductivity ? 'lg:col-span-2' : 'lg:col-span-3'} flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-md hover:border-brand-border-purple/40 transition-all duration-300`}>
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-brand-heading text-sm">Team performance</h3>
            <div className="relative">
              <select className="appearance-none bg-slate-50 border border-brand-border-purple/35 text-brand-text focus:border-brand-accent rounded-lg px-2.5 py-1 pr-7 text-[10px] font-bold focus:outline-none cursor-pointer">
                <option>This Month</option>
                <option>This Quarter</option>
              </select>
              <ChevronDown className="absolute right-2 top-2.5 h-3 w-3 text-slate-500 pointer-events-none" strokeWidth={1.75} />
            </div>
          </div>

          {/* Leaderboard Table with Refined Borders */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-border-purple/20 text-[9px] uppercase font-bold text-brand-heading">
                  <th className="pb-2 font-bold tracking-wider">Team Member</th>
                  <th className="pb-2 font-bold tracking-wider text-center">Deals Won</th>
                  <th className="pb-2 font-bold tracking-wider">Revenue</th>
                  <th className="pb-2 font-bold tracking-wider text-right">Win Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border-purple/15 text-[11px] font-semibold text-brand-text/75">
                {teamMembers.map((member, index) => {
                  const barWidth = `${(member.revenueRaw / maxRevenue) * 100}%`;
                  return (
                    <tr key={index} className="hover:bg-slate-50/20 transition-colors">
                      {/* Member Info */}
                      <td className="py-2.5 flex items-center space-x-2.5">
                        <div className="h-6.5 w-6.5 rounded-full overflow-hidden shrink-0 border border-brand-border-purple/20">
                          <img src={member.avatar} alt={member.name} className="h-full w-full object-cover" />
                        </div>
                        <span className="font-bold text-brand-text truncate max-w-[120px]">{member.name}</span>
                      </td>
                      {/* Deals Won in Tabular Numbers */}
                      <td className="py-2.5 text-center text-brand-text/70 tabular-nums">{member.deals}</td>
                      {/* Revenue with Unified Purple Accent Bar */}
                      <td className="py-2.5 min-w-[180px]">
                        <div className="flex items-center space-x-3">
                          <span className="w-10 text-brand-text tabular-nums">{member.revenue}</span>
                          <div className="flex-1 h-1.5 bg-brand-sidebar-hover/20 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full bg-brand-accent" 
                              style={{ width: barWidth }} 
                            />
                          </div>
                        </div>
                      </td>
                      {/* Win Rate in Tabular Numbers */}
                      <td className="py-2.5 text-right text-brand-text tabular-nums">{member.winRate}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Link */}
        <div className="mt-4 pt-3 border-t border-brand-border-purple/15 text-center">
          <button 
            onClick={() => onTabChange?.('reports')}
            className="inline-flex items-center space-x-1 text-xs font-bold text-brand-accent hover:text-brand-accent-hover transition-colors bg-transparent border-0 cursor-pointer"
          >
            <span>View full leaderboard</span>
            <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
          </button>
        </div>
        </div>
      )}

      {/* Activity Overview */}
      {showProductivity && (
        <div className={`bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 ${showLeaderboard ? 'lg:col-span-1' : 'lg:col-span-3'} flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-md hover:border-brand-border-purple/40 transition-all duration-300`}>
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-brand-heading text-sm">Activity overview</h3>
            <div className="relative">
              <select className="appearance-none bg-slate-55/60 border border-brand-border-purple/35 text-brand-text focus:border-brand-accent rounded-lg px-2.5 py-1 pr-7 text-[10px] font-bold focus:outline-none cursor-pointer">
                <option>This Week</option>
                <option>This Month</option>
              </select>
              <ChevronDown className="absolute right-2 top-2.5 h-3 w-3 text-slate-500 pointer-events-none" strokeWidth={1.75} />
            </div>
          </div>

          {/* Activity items with neutral icon treatments */}
          <div className="mt-4 space-y-2">
            {activities.map((act, index) => {
              const Icon = act.icon;
              return (
                <div key={index} className="flex items-center justify-between py-1 hover:bg-slate-50/50 rounded-lg px-1.5 transition-colors">
                  <div className="flex items-center space-x-2.5">
                    <div className={`h-7 w-7 rounded-lg ${act.bg} flex items-center justify-center`}>
                      <Icon className={`h-3.5 w-3.5 ${act.color}`} strokeWidth={1.75} />
                    </div>
                    <span className="text-[11px] font-semibold text-brand-text/75">{act.name}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-[11px] font-bold">
                    <span className="text-brand-text tabular-nums">{act.count}</span>
                    <span className="text-emerald-700 bg-emerald-50/80 border border-emerald-100/50 px-1 rounded text-[9px] font-bold tabular-nums">
                      {act.change}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Link */}
        <div className="mt-4 pt-3 border-t border-brand-border-purple/15 text-center">
          <button 
            onClick={() => onTabChange?.('reports')}
            className="inline-flex items-center space-x-1 text-xs font-bold text-brand-accent hover:text-brand-accent-hover transition-colors bg-transparent border-0 cursor-pointer"
          >
            <span>View all reports</span>
            <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
          </button>
        </div>
        </div>
      )}

    </div>
  );
}
