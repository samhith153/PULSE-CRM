'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { toast } from '@/lib/toast';
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
  X,
  Pencil,
  Check,
} from 'lucide-react';
import { getCurrentUser, getSalesRepDashboard, asNumber, formatINR, formatPct, SalesRepDashboardData, uploadAvatar, deleteAvatar, resolveImageUrl, updateUser } from '@/utils/api';

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
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: '', phone: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([getCurrentUser({ silent: true }), getSalesRepDashboard('quarter', { silent: true })])
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
      window.dispatchEvent(new Event('pulse-profile-updated'));
    } catch (err) {
      console.error('Avatar upload failed:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAvatarRemove = async () => {
    setUploading(true);
    try {
      await deleteAvatar();
      const fresh = await getCurrentUser();
      setProfile(fresh as unknown as ProfileShape);
      window.dispatchEvent(new Event('pulse-profile-updated'));
    } catch (err) {
      console.error('Avatar remove failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const startEditing = () => {
    setEditForm({
      full_name: profile.full_name || '',
      phone: profile.phone || '',
    });
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setEditForm({ full_name: '', phone: '' });
  };

  const saveProfile = async () => {
    if (!editForm.full_name.trim()) {
      toast.error('Name cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      await updateUser(profile.id, {
        full_name: editForm.full_name.trim(),
        phone: editForm.phone.trim() || undefined,
      });
      const fresh = await getCurrentUser();
      setProfile(fresh as unknown as ProfileShape);
      setEditing(false);
      window.dispatchEvent(new Event('pulse-profile-updated'));
      toast.success('Profile updated.');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-5">
          <div className="relative shrink-0">
            <div className="h-20 w-20 rounded-full overflow-hidden border border-border bg-secondary flex items-center justify-center relative group cursor-pointer" onClick={() => !uploading && fileInputRef.current?.click()}>
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
            {profile.avatar_url && !uploading && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleAvatarRemove(); }}
                className="absolute -top-1 -right-1 z-10 size-5 rounded-full bg-destructive text-white flex items-center justify-center hover:bg-destructive/80 transition-colors cursor-pointer"
                aria-label="Remove avatar"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left min-w-0">
            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm((f) => ({ ...f, full_name: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple"
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="flex space-x-2 pt-1">
                  <button
                    onClick={saveProfile}
                    disabled={saving}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-white bg-brand-purple rounded-lg hover:bg-brand-purple/90 disabled:opacity-50 cursor-pointer"
                  >
                    {saving ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
                    Save
                  </button>
                  <button
                    onClick={cancelEditing}
                    disabled={saving}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-muted-foreground bg-secondary border border-border rounded-lg hover:bg-secondary/80 disabled:opacity-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center space-x-2">
                  <h2 className="font-sans text-2xl text-foreground font-bold">{profile.full_name}</h2>
                  <button
                    onClick={startEditing}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                    aria-label="Edit profile"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
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
              </>
            )}
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

