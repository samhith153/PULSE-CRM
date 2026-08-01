'use client';

import React from 'react';
import Image from 'next/image';
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
      revenue: "â‚¹1.25M",
      revenueRaw: 1250000,
      winRate: "40.0%",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&fit=crop&q=80"
    },
    {
      name: "Sarah Johnson",
      deals: 6,
      revenue: "â‚¹980K",
      revenueRaw: 980000,
      winRate: "33.0%",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&fit=crop&q=80"
    },
    {
      name: "David Wilson",
      deals: 5,
      revenue: "â‚¹750K",
      revenueRaw: 750000,
      winRate: "29.0%",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&fit=crop&q=80"
    },
    {
      name: "Lisa Martinez",
      deals: 3,
      revenue: "â‚¹480K",
      revenueRaw: 480000,
      winRate: "25.0%",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&fit=crop&q=80"
    },
    {
      name: "Michael Brown",
      deals: 2,
      revenue: "â‚¹360K",
      revenueRaw: 360000,
      winRate: "20.0%",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&fit=crop&q=80"
    }
  ];

  const activities = [
    { name: "Emails Sent", count: 245, change: "+18%", icon: Mail, color: "text-brand-purple", bg: "bg-brand-purple/10 border border-brand-purple/20" },
    { name: "Calls Made", count: 120, change: "+12%", icon: Phone, color: "text-brand-purple", bg: "bg-brand-purple/10 border border-brand-purple/20" },
    { name: "Meetings Held", count: 32, change: "+14%", icon: Calendar, color: "text-brand-purple", bg: "bg-brand-purple/10 border border-brand-purple/20" },
    { name: "Tasks Completed", count: 68, change: "+15%", icon: CheckSquare, color: "text-brand-purple", bg: "bg-brand-purple/10 border border-brand-purple/20" },
    { name: "Notes Added", count: 56, change: "+20%", icon: FileText, color: "text-brand-purple", bg: "bg-brand-purple/10 border border-brand-purple/20" }
  ];

  const maxRevenue = 1250000;

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
        <div className="bg-card border border-border rounded-2xl p-5 h-64 lg:col-span-2" />
        <div className="bg-card border border-border rounded-2xl p-5 h-64" />
      </div>
    );
  }

  if (!showLeaderboard && !showProductivity) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Team Performance Leaderboard */}
      {showLeaderboard && (
        <div className={`bg-card border border-border rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-nav transition-all duration-300 ${showProductivity ? 'lg:col-span-2' : 'lg:col-span-3'} flex flex-col justify-between`}>
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-foreground text-sm">Team performance</h3>
              <div className="relative">
                <select className="appearance-none bg-secondary border border-border text-foreground focus:border-brand-purple rounded-lg px-2.5 py-1 pr-7 text-[10px] font-bold focus:outline-none cursor-pointer">
                  <option>This Month</option>
                  <option>This Quarter</option>
                </select>
                <ChevronDown className="absolute right-2 top-2.5 h-3 w-3 text-muted-foreground pointer-events-none" strokeWidth={1.75} />
              </div>
            </div>

            {/* Leaderboard Table */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-[9px] uppercase font-bold text-foreground">
                    <th className="pb-2 font-bold tracking-wider">Team Member</th>
                    <th className="pb-2 font-bold tracking-wider text-center">Deals Won</th>
                    <th className="pb-2 font-bold tracking-wider">Revenue</th>
                    <th className="pb-2 font-bold tracking-wider text-right">Win Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-[11px] font-semibold text-muted-foreground">
                  {teamMembers.map((member, index) => {
                    const barWidth = `${(member.revenueRaw / maxRevenue) * 100}%`;
                    return (
                      <tr key={index} className="hover:bg-secondary/20 transition-colors">
                        {/* Member Info */}
                        <td className="py-2.5 flex items-center space-x-2.5">
                          <div className="h-6.5 w-6.5 rounded-full overflow-hidden shrink-0 border border-border">
                            <Image src={member.avatar} alt={member.name} width={26} height={26} className="h-full w-full object-cover" unoptimized />
                          </div>
                          <span className="font-bold text-foreground truncate max-w-[120px]">{member.name}</span>
                        </td>
                        {/* Deals Won in Tabular Numbers */}
                        <td className="py-2.5 text-center text-muted-foreground tabular-nums">{member.deals}</td>
                        {/* Revenue with Unified Accent Bar */}
                        <td className="py-2.5 min-w-[180px]">
                          <div className="flex items-center space-x-3">
                            <span className="w-10 text-foreground tabular-nums">{member.revenue}</span>
                            <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full bg-brand-purple" 
                                style={{ width: barWidth }} 
                              />
                            </div>
                          </div>
                        </td>
                        {/* Win Rate in Tabular Numbers */}
                        <td className="py-2.5 text-right text-foreground tabular-nums">{member.winRate}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Link - Outline pill style */}
          <div className="mt-4 pt-3 border-t border-border text-center">
            <button 
              onClick={() => onTabChange?.('reports')}
              className="inline-flex items-center justify-center gap-2 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer border border-border bg-background hover:bg-secondary text-ink px-4 py-2 h-9"
            >
              <span>View full leaderboard</span>
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          </div>
        </div>
      )}

      {/* Activity Overview */}
      {showProductivity && (
        <div className={`bg-card border border-border rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-nav transition-all duration-300 ${showLeaderboard ? 'lg:col-span-1' : 'lg:col-span-3'} flex flex-col justify-between`}>
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-foreground text-sm">Activity overview</h3>
              <div className="relative">
                <select className="appearance-none bg-secondary border border-border text-foreground focus:border-brand-purple rounded-lg px-2.5 py-1 pr-7 text-[10px] font-bold focus:outline-none cursor-pointer">
                  <option>This Week</option>
                  <option>This Month</option>
                </select>
                <ChevronDown className="absolute right-2 top-2.5 h-3 w-3 text-muted-foreground pointer-events-none" strokeWidth={1.75} />
              </div>
            </div>

            {/* Activity items with neutral icon treatments */}
            <div className="mt-4 space-y-2">
              {activities.map((act, index) => {
                const Icon = act.icon;
                return (
                  <div key={index} className="flex items-center justify-between py-1 hover:bg-secondary/50 rounded-lg px-1.5 transition-colors">
                    <div className="flex items-center space-x-2.5">
                      <div className={`h-7 w-7 rounded-lg ${act.bg} flex items-center justify-center`}>
                        <Icon className={`h-3.5 w-3.5 ${act.color}`} strokeWidth={1.75} />
                      </div>
                      <span className="text-[11px] font-semibold text-muted-foreground">{act.name}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-[11px] font-bold">
                      <span className="text-foreground tabular-nums">{act.count}</span>
                      <span className="text-brand-cyan bg-brand-cyan/10 border border-brand-cyan/20 px-1 rounded text-[9px] font-bold tabular-nums">
                        {act.change}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Link - Outline pill style */}
          <div className="mt-4 pt-3 border-t border-border text-center">
            <button 
              onClick={() => onTabChange?.('reports')}
              className="inline-flex items-center justify-center gap-2 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer border border-border bg-background hover:bg-secondary text-ink px-4 py-2 h-9"
            >
              <span>View all reports</span>
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

