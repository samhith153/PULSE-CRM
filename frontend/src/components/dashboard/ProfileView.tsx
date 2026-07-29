'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  User,
  Target,
  Award,
  TrendingUp,
  Mail,
  Phone,
  Building2,
  Calendar,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { getCurrentUser, getSalesRepDashboard, asNumber, formatINR, formatPct, SalesRepDashboardData } from '@/utils/api';

interface ProfileShape {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  department?: string | null;
  avatar_url?: string | null;
  roles: string[];
  created_at: string;
}

export default function ProfileView({ userRole = 'manager' }: { userRole?: string }) {
  const [profile, setProfile] = useState<ProfileShape | null>(null);
  const [kpi, setKpi] = useState<SalesRepDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([getCurrentUser(), getSalesRepDashboard('quarter')])
      .then(([u, k]) => {
        if (cancelled) return;
        setProfile(u as unknown as ProfileShape);
        setKpi(k);
        setError(null);
      })
      .catch((e) => { if (!cancelled) setError(e?.message || 'Failed to load profile'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400 text-xs font-semibold">
        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading profile…
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="py-24 text-center text-rose-600 text-xs font-semibold">{error || 'No profile data.'}</div>
    );
  }

  const roleLabel = (profile.roles?.[0] || userRole || 'rep').replace('_', ' ');
  const dept = profile.department || (profile.roles?.includes('admin') ? 'Operations & Governance' : profile.roles?.includes('manager') ? 'Sales Management' : 'Sales');
  const achieved = asNumber(kpi?.summary?.total_revenue);
  const quota = asNumber(kpi?.revenue_stat?.total) || achieved || 1;
  const progressPercent = Math.min(100, Math.round((achieved / (quota || 1)) * 100));
  const joined = profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—';

  return (
    <div className="space-y-6">
      <div className="bg-white border border-brand-border-purple/20 rounded-xl p-6 shadow-sm/5">
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-5">
          <div className="h-20 w-20 rounded-full overflow-hidden border border-brand-border-purple/35 shrink-0 shadow-md bg-slate-100 flex items-center justify-center">
            {profile.avatar_url ? (
              <Image src={profile.avatar_url} alt={profile.full_name} width={80} height={80} className="h-full w-full object-cover" unoptimized />
            ) : (
              <User className="h-8 w-8 text-slate-400" />
            )}
          </div>

          <div className="flex-1 text-center sm:text-left min-w-0">
            <h2 className="font-sans text-2xl text-brand-heading font-bold">{profile.full_name}</h2>
            <p className="text-xs text-brand-accent font-extrabold mt-0.5">{roleLabel} — {dept}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 text-[11px] font-semibold text-brand-text/75">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-slate-400" />
                <span>{profile.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-slate-400" />
                <span>{profile.phone || '—'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-slate-400" />
                <span>{dept}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span>Joined {joined}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-7 bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 space-y-4">
          <h3 className="font-extrabold text-brand-heading text-sm flex items-center">
            <Target className="h-4.5 w-4.5 mr-2 text-brand-accent" />
            <span>Quarter Target Progress</span>
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
              <span>Achieved: {formatINR(achieved)}</span>
              <span>Target: {formatINR(quota)}</span>
            </div>
          </div>

          <div className="mt-4 p-3.5 bg-brand-sidebar-hover/15 border border-brand-border-purple/25 rounded-xl text-[10px] font-bold text-brand-heading flex items-start space-x-2">
            <Award className="h-4.5 w-4.5 text-brand-accent shrink-0 mt-0.5" />
            <div>
              <span>Live KPIs pulled from your sales-rep dashboard. Win rate {formatPct(asNumber(kpi?.summary?.win_rate))} this period.</span>
            </div>
          </div>
        </div>

        <div className="col-span-12 md:col-span-5 bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 space-y-4">
          <h3 className="font-extrabold text-brand-heading text-sm">Quarterly summary</h3>

          <div className="space-y-3.5">
            <div className="flex justify-between items-center p-2.5 border border-brand-border-purple/15 rounded-lg bg-slate-50/50">
              <span className="text-[10px] font-extrabold text-brand-text/60 uppercase">Deals closed</span>
              <span className="text-xs font-extrabold text-brand-heading tabular-nums">{asNumber(kpi?.summary?.won_deals)}</span>
            </div>

            <div className="flex justify-between items-center p-2.5 border border-brand-border-purple/15 rounded-lg bg-slate-50/50">
              <span className="text-[10px] font-extrabold text-brand-text/60 uppercase">Win Rate ratio</span>
              <span className="text-xs font-extrabold text-brand-heading tabular-nums">{formatPct(asNumber(kpi?.summary?.win_rate))}</span>
            </div>

            <div className="flex justify-between items-center p-2.5 border border-brand-border-purple/15 rounded-lg bg-slate-50/50">
              <span className="text-[10px] font-extrabold text-brand-text/60 uppercase">Avg. cycle time</span>
              <span className="text-xs font-extrabold text-brand-heading tabular-nums">{asNumber(kpi?.summary?.average_sales_cycle)} days</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
