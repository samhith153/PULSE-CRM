'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Loader2,
  RefreshCw,
  Ban,
  UserCheck,
  Mail,
  Clock,
  ShieldCheck,
  UserRound,
  Info,
} from 'lucide-react';
import { getMyTeam, UserData, activateUser, deactivateUser } from '@/utils/api';
import { useCurrentUser, userInitials } from '@/hooks/useCurrentUser';
import { toast } from '@/lib/toast';

export default function MyTeamView() {
  const { user: currentUser } = useCurrentUser();
  const [reps, setReps] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadTeam = useCallback(async () => {
    setLoading(true);
    try {
      setReps(await getMyTeam());
    } catch {
      toast.error('Failed to load your team.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTeam(); }, [loadTeam]);

  const handleToggleStatus = async (rep: UserData) => {
    setTogglingId(rep.id);
    try {
      if (rep.is_active) {
        await deactivateUser(rep.id);
        toast.success(`"${rep.full_name}" deactivated.`);
      } else {
        await activateUser(rep.id);
        toast.success(`"${rep.full_name}" activated.`);
      }
      loadTeam();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update rep status.');
    } finally {
      setTogglingId(null);
    }
  };

  const activeCount = reps.filter(r => r.is_active).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-sans text-text-primary tracking-tight font-bold">
            My Team
          </h1>
          <p className="text-xs md:text-sm text-text-muted mt-1 font-medium tracking-wide">
            Sales representatives assigned to you by your administrator. You can view and manage only your own team.
          </p>
        </div>
        <button
          onClick={loadTeam}
          className="inline-flex items-center space-x-1.5 px-3 py-2 border border-border-default hover:bg-surface-2 rounded-lg text-xs font-bold text-text-muted transition cursor-pointer self-start"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Team summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-1 border border-border-default rounded-2xl p-4 space-y-1">
          <div className="flex items-center space-x-1.5 text-text-muted">
            <Users className="h-3.5 w-3.5 text-accent-color" />
            <span className="text-[10px] font-semibold uppercase tracking-wide">Team Size</span>
          </div>
          <h4 className="text-base font-semibold text-text-primary tabular-nums">{reps.length}</h4>
          <span className="text-[9px] text-text-muted font-bold block">Assigned sales reps</span>
        </div>
        <div className="bg-surface-1 border border-border-default rounded-2xl p-4 space-y-1">
          <div className="flex items-center space-x-1.5 text-text-muted">
            <UserCheck className="h-3.5 w-3.5 text-accent-color" />
            <span className="text-[10px] font-semibold uppercase tracking-wide">Active Reps</span>
          </div>
          <h4 className="text-base font-semibold text-text-primary tabular-nums">{activeCount}</h4>
          <span className="text-[9px] text-text-muted font-bold block">Currently enabled</span>
        </div>
        <div className="bg-surface-1 border border-border-default rounded-2xl p-4 space-y-1">
          <div className="flex items-center space-x-1.5 text-text-muted">
            <ShieldCheck className="h-3.5 w-3.5 text-accent-color" />
            <span className="text-[10px] font-semibold uppercase tracking-wide">Your Role</span>
          </div>
          <h4 className="text-base font-semibold text-text-primary truncate">
            {currentUser?.full_name || 'Sales Manager'}
          </h4>
          <span className="text-[9px] text-text-muted font-bold block">Responsible for this team</span>
        </div>
      </div>

      {/* Team members table */}
      <div className="bg-surface-1 border border-border-default rounded-2xl p-5 space-y-4">
        <h3 className="font-semibold text-text-primary text-sm flex items-center">
          <UserRound className="h-4.5 w-4.5 mr-2 text-accent-color" />
          <span>Assigned Sales Representatives</span>
          {loading && <Loader2 className="h-3.5 w-3.5 ml-2 animate-spin text-text-muted" />}
        </h3>

        {loading && reps.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-text-muted text-xs font-medium">
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Loading your team...
          </div>
        ) : reps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="h-12 w-12 rounded-full bg-surface-2 border border-border-default flex items-center justify-center mb-3">
              <Users className="h-5 w-5 text-text-muted" />
            </div>
            <p className="text-xs font-semibold text-text-primary">No sales representatives assigned yet</p>
            <p className="text-[10px] text-text-muted font-medium mt-1 max-w-sm leading-relaxed">
              Ask your administrator to assign sales representatives to you from the Users page. Once assigned, they will appear here and in your dashboard metrics.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-default text-[11px] uppercase font-black tracking-wider text-text-primary bg-muted/40">
                  <th className="py-2.5">Sales Representative</th>
                  <th className="py-2.5">Email</th>
                  <th className="py-2.5">Role</th>
                  <th className="py-2.5">Status</th>
                  <th className="py-2.5">Last Login</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs font-semibold text-text-primary">
                {reps.map((rep) => (
                  <tr key={rep.id} className="hover:bg-surface-2 transition-colors">
                    <td className="py-3">
                      <div className="flex items-center space-x-2.5">
                        <div className="h-7 w-7 rounded-full bg-surface-2 border border-border-default flex items-center justify-center text-[10px] font-bold text-accent-color select-none">
                          {userInitials(rep.full_name)}
                        </div>
                        <span className="font-semibold">{rep.full_name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-text-muted">
                      <span className="inline-flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {rep.email}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="bg-surface-2 text-text-primary px-2 py-0.5 rounded text-[9px] font-semibold">
                        Sales Representative
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide ${
                        rep.is_active
                          ? 'bg-accent-color/15 text-accent-color'
                          : 'bg-status-danger/10 text-status-danger'
                      }`}>
                        {rep.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-3 text-text-muted tabular-nums">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {rep.last_login_at
                          ? new Date(rep.last_login_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : 'Never'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleToggleStatus(rep)}
                        disabled={togglingId === rep.id}
                        className={`inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer disabled:opacity-50 ${
                          rep.is_active
                            ? 'border-border-default text-text-muted hover:text-status-danger hover:border-status-danger/40'
                            : 'border-border-default text-text-muted hover:text-accent-color hover:border-accent-color/40'
                        }`}
                        title={rep.is_active ? 'Disable rep' : 'Enable rep'}
                      >
                        {togglingId === rep.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : rep.is_active ? (
                          <Ban className="h-3 w-3" />
                        ) : (
                          <UserCheck className="h-3 w-3" />
                        )}
                        <span>{rep.is_active ? 'Disable' : 'Enable'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reps.length > 0 && (
          <div className="flex items-start space-x-2 pt-2 border-t border-border-default">
            <Info className="h-3.5 w-3.5 text-text-muted mt-0.5 shrink-0" />
            <p className="text-[10px] text-text-muted font-medium leading-relaxed">
              You are responsible for tracking and managing the sales activities of this team. Team-wide metrics on your dashboard are scoped to these representatives only.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
