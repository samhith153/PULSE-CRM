'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Camera,
} from 'lucide-react';
import { getCurrentUser, getSalesRepDashboard, asNumber, formatINR, formatPct, SalesRepDashboardData, uploadAvatar, resolveImageUrl } from '@/utils/api';

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
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      <div className="flex items-center justify-center py-24 text-muted-foreground text-xs font-semibold">
        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading profile...
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="py-24 text-center text-destructive text-xs font-semibold">{error || 'No profile data.'}</div>
    );
  }

  const roleLabel = (profile.roles?.[0] || userRole || 'rep').replace('_', ' ');
  const dept = profile.department || (profile.roles?.includes('admin') ? 'Operations & Governance' : profile.roles?.includes('manager') ? 'Sales Management' : 'Sales');
  const achieved = asNumber(kpi?.summary?.total_revenue);
  const quota = asNumber(kpi?.revenue_stat?.total) || achieved || 1;
  const progressPercent = Math.min(100, Math.round((achieved / (quota || 1)) * 100));
  const joined = profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '–';

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadAvatar(file);
      const fresh = await getCurrentUser();
      setProfile(fresh as unknown as ProfileShape);
    } catch (err) {
      console.error('Avatar upload failed:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-5">
          <div className="h-20 w-20 rounded-full overflow-hidden border border-border shrink-0 bg-secondary flex items-center justify-center relative group cursor-pointer" onClick={() => !uploading && fileInputRef.current?.click()}>
            {profile.avatar_url ? (
              <Image src={resolveImageUrl(profile.avatar_url)} alt={profile.full_name} width={80} height={80} className="h-full w-full object-cover" unoptimized />
            ) : (
              <User className="h-8 w-8 text-muted-foreground" />
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
              {uploading ? (
                <Loader2 className="h-5 w-5 text-white animate-spin" />
              ) : (
                <Camera className="h-5 w-5 text-white" />
              )}
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarUpload}
          />

          <div className="flex-1 text-center sm:text-left min-w-0">
            <h2 className="font-sans text-2xl text-foreground font-bold">{profile.full_name}</h2>
            <p className="text-xs text-brand-purple font-semibold mt-0.5">{roleLabel} – {dept}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 text-[11px] font-semibold text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{profile.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{profile.phone || '–'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>{dept}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Joined {joined}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-7 bg-card border border-border rounded-2xl p-5 space-y-4">
          <h3 className="font-semibold text-foreground text-sm flex items-center">
            <Target className="h-4.5 w-4.5 mr-2 text-brand-purple" />
            <span>Quarter Target Progress</span>
          </h3>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-foreground">
              <span>Revenue Target reached</span>
              <span className="tabular-nums">{progressPercent}%</span>
            </div>

            <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-brand-purple rounded-full" style={{ width: `${progressPercent}%` }} />
            </div>

            <div className="flex justify-between text-[10px] font-semibold text-muted-foreground mt-1.5 tabular-nums">
              <span>Achieved: {formatINR(achieved)}</span>
              <span>Target: {formatINR(quota)}</span>
            </div>
          </div>

          <div className="mt-4 p-3.5 bg-secondary border border-border rounded-xl text-[10px] font-semibold text-foreground flex items-start space-x-2">
            <Award className="h-4.5 w-4.5 text-brand-purple shrink-0 mt-0.5" />
            <div>
              <span>Live KPIs pulled from your sales-rep dashboard. Win rate {formatPct(asNumber(kpi?.summary?.win_rate))} this period.</span>
            </div>
          </div>
        </div>

        <div className="col-span-12 md:col-span-5 bg-card border border-border rounded-2xl p-5 space-y-4">
          <h3 className="font-semibold text-foreground text-sm">Quarterly summary</h3>

          <div className="space-y-3.5">
            <div className="flex justify-between items-center p-2.5 border border-border rounded-lg bg-secondary">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">Deals closed</span>
              <span className="text-xs font-semibold text-foreground tabular-nums">{asNumber(kpi?.summary?.won_deals)}</span>
            </div>

            <div className="flex justify-between items-center p-2.5 border border-border rounded-lg bg-secondary">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">Win Rate ratio</span>
              <span className="text-xs font-semibold text-foreground tabular-nums">{formatPct(asNumber(kpi?.summary?.win_rate))}</span>
            </div>

            <div className="flex justify-between items-center p-2.5 border border-border rounded-lg bg-secondary">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">Avg. cycle time</span>
              <span className="text-xs font-semibold text-foreground tabular-nums">{asNumber(kpi?.summary?.average_sales_cycle)} days</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

