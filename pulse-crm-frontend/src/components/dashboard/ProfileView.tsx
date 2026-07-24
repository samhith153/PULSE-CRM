'use client';

import React from 'react';
import { 
  User, 
  Target, 
  Award, 
  TrendingUp, 
  Mail, 
  Phone, 
  Building2,
  Calendar,
  ShieldAlert
} from 'lucide-react';

export default function ProfileView() {
  const profile = {
    name: "Alex Johnson",
    role: "Sales Manager",
    department: "Enterprise Acquisition",
    email: "alex.johnson@pulse.crm",
    phone: "+1 (555) 739-1928",
    joinedDate: "October 2024",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&fit=crop&q=80"
  };

  const performance = {
    closedDeals: 18,
    winRate: "72%",
    avgCycleTime: "18 Days",
    quarterQuota: 500000,
    quarterAchieved: 380000
  };

  const progressPercent = Math.round((performance.quarterAchieved / performance.quarterQuota) * 100);

  return (
    <div className="space-y-6">
      
      {/* Profile Header card */}
      <div className="bg-white border border-brand-border-purple/20 rounded-xl p-6 shadow-sm/5">
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-5">
          <div className="h-20 w-20 rounded-full overflow-hidden border border-brand-border-purple/35 shrink-0 shadow-md">
            <img src={profile.avatar} alt={profile.name} className="h-full w-full object-cover" />
          </div>
          
          <div className="flex-1 text-center sm:text-left min-w-0">
            <h2 className="font-sans text-2xl text-brand-heading font-bold">{profile.name}</h2>
            <p className="text-xs text-brand-accent font-extrabold mt-0.5">{profile.role} — {profile.department}</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 text-[11px] font-semibold text-brand-text/75">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-slate-400" />
                <span>{profile.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-slate-400" />
                <span>{profile.phone}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-slate-400" />
                <span>{profile.department}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span>Joined {profile.joinedDate}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quota Targets & Performance split */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Quota Progress (Col 7) */}
        <div className="col-span-12 md:col-span-7 bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 space-y-4">
          <h3 className="font-extrabold text-brand-heading text-sm flex items-center">
            <Target className="h-4.5 w-4.5 mr-2 text-brand-accent" />
            <span>Q3 Target Progress</span>
          </h3>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-extrabold text-brand-heading">
              <span>Revenue Target reached</span>
              <span className="tabular-nums">{progressPercent}%</span>
            </div>
            
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-brand-accent rounded-full" style={{ width: `${progressPercent}%` }} />
            </div>
            
            <div className="flex justify-between text-[10px] font-bold text-slate-450 mt-1.5 tabular-nums">
              <span>Achieved: ${performance.quarterAchieved.toLocaleString()}</span>
              <span>Quota: ${performance.quarterQuota.toLocaleString()}</span>
            </div>
          </div>

          <div className="mt-4 p-3.5 bg-brand-sidebar-hover/15 border border-brand-border-purple/25 rounded-xl text-[10px] font-bold text-brand-heading flex items-start space-x-2">
            <Award className="h-4.5 w-4.5 text-brand-accent shrink-0 mt-0.5" />
            <div>
              <span>Top performance status active. You are on track to exceed Q3 target parameters by ₹45,000.</span>
            </div>
          </div>
        </div>

        {/* Stats Summary (Col 5) */}
        <div className="col-span-12 md:col-span-5 bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 space-y-4">
          <h3 className="font-extrabold text-brand-heading text-sm">Quarterly summary</h3>

          <div className="space-y-3.5">
            <div className="flex justify-between items-center p-2.5 border border-brand-border-purple/15 rounded-lg bg-slate-50/50">
              <span className="text-[10px] font-extrabold text-brand-text/60 uppercase">Deals closed</span>
              <span className="text-xs font-extrabold text-brand-heading tabular-nums">{performance.closedDeals}</span>
            </div>

            <div className="flex justify-between items-center p-2.5 border border-brand-border-purple/15 rounded-lg bg-slate-50/50">
              <span className="text-[10px] font-extrabold text-brand-text/60 uppercase">Win Rate ratio</span>
              <span className="text-xs font-extrabold text-brand-heading tabular-nums">{performance.winRate}</span>
            </div>

            <div className="flex justify-between items-center p-2.5 border border-brand-border-purple/15 rounded-lg bg-slate-50/50">
              <span className="text-[10px] font-extrabold text-brand-text/60 uppercase">Avg. cycle time</span>
              <span className="text-xs font-extrabold text-brand-heading tabular-nums">{performance.avgCycleTime}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
