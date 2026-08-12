'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users,
  Loader2,
  RefreshCw,
  UserCog,
  UserRound,
  Mail,
  Search,
  UserPlus,
  ShieldCheck,
  Info,
  Check,
  ChevronDown,
} from 'lucide-react';
import { getUsers, getManagers, assignUserManager, UserData } from '@/utils/api';
import { useCurrentUser, userInitials } from '@/hooks/useCurrentUser';
import { toast } from '@/lib/toast';

export default function TeamsView() {
  const { user: currentUser } = useCurrentUser();
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyRepIds, setBusyRepIds] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');

  const isAdmin = currentUser?.roles?.includes('admin') ?? false;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch every user in the org (paginated) so we can build all teams.
      const collected: UserData[] = [];
      let page = 1;
      const pageSize = 100;
      for (;;) {
        const res = await getUsers(page, pageSize);
        const items = Array.isArray(res) ? res : (res?.data ?? []);
        collected.push(...items);
        const total = (res as any)?.total ?? collected.length;
        if (items.length === 0 || collected.length >= total) break;
        page += 1;
      }

      // Merge in the manager endpoint as a fallback (e.g. managers without
      // roles visible on the first pages are still included in pickers).
      let managers: UserData[] = [];
      try {
        managers = await getManagers();
      } catch {
        managers = [];
      }
      const byId = new Map(collected.map(u => [u.id, u]));
      managers.forEach(m => {
        if (!byId.has(m.id)) {
          byId.set(m.id, m);
          collected.push(m);
        }
      });

      setAllUsers(collected);
    } catch {
      toast.error('Failed to load users. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const managers = useMemo(
    () => allUsers.filter(u => u.roles?.includes('manager')),
    [allUsers]
  );
  const reps = useMemo(
    () => allUsers.filter(u => u.roles?.includes('sales_rep')),
    [allUsers]
  );

  const q = search.trim().toLowerCase();
  const visibleReps = useMemo(
    () => (q ? reps.filter(r => r.full_name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)) : reps),
    [reps, q]
  );

  const managerIds = useMemo(() => new Set(managers.map(m => m.id)), [managers]);
  const unassigned = useMemo(
    // Orphaned reps (manager_id points to a removed/inactive/non-manager user)
    // are surfaced here too, so they can always be reassigned.
    () => visibleReps.filter(r => !r.manager_id || !managerIds.has(r.manager_id)),
    [visibleReps, managerIds]
  );
  const teams = useMemo(
    () => managers
      .map(m => ({ manager: m, members: visibleReps.filter(r => r.manager_id === m.id) }))
      .filter(t => t.members.length > 0 || !q)
      .sort((a, b) => b.members.length - a.members.length),
    [managers, visibleReps, q]
  );

  const assignedCount = reps.filter(r => r.manager_id).length;
  const unassignedCount = reps.filter(r => !r.manager_id).length;
  const activeManagers = managers.filter(m => m.is_active).length;

  /** Assign / reassign / remove a rep's manager via a single select. */
  const handleAssign = async (repId: string, managerId: string) => {
    // Skip no-op changes (avoids a pointless API call and the 409 guard toast).
    const current = allUsers.find(u => u.id === repId);
    if (current && (current.manager_id ?? '') === managerId) return;
    setBusyRepIds(prev => ({ ...prev, [repId]: true }));
    try {
      const updated = await assignUserManager(repId, managerId || null);
      setAllUsers(prev => prev.map(u =>
        u.id === repId
          ? {
              ...u,
              manager_id: updated.manager_id ?? null,
              manager_name: updated.manager_name ?? null,
            }
          : u
      ));
      toast.success(managerId ? 'Sales rep assigned to the manager\'s team.' : 'Sales rep removed from the team.');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update assignment.');
    } finally {
      setBusyRepIds(prev => {
        const next = { ...prev };
        delete next[repId];
        return next;
      });
    }
  };

  const managerSelect = (rep: UserData, className = '') => (
    <div className={`relative ${className}`}>
      <select
        value={rep.manager_id ?? ''}
        disabled={busyRepIds[rep.id]}
        onChange={e => handleAssign(rep.id, e.target.value)}
        className="w-full appearance-none rounded-lg border border-border-default bg-surface-2 py-1.5 pl-2.5 pr-7 text-xs font-semibold text-text-primary focus:border-accent-color focus:outline-none disabled:opacity-50 transition-colors cursor-pointer"
        title="Change assigned manager"
      >
        <option value="">— No manager —</option>
        {managers
          .slice()
          .sort((a, b) => a.full_name.localeCompare(b.full_name))
          .map(m => (
            <option key={m.id} value={m.id}>
              {m.full_name}
            </option>
          ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-text-muted" />
    </div>
  );

  const statusBadge = (active: boolean) => (
    <span className={`px-2 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide ${
      active ? 'bg-accent-color/15 text-accent-color' : 'bg-status-danger/10 text-status-danger'
    }`}>
      {active ? 'Active' : 'Disabled'}
    </span>
  );

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center py-24 text-xs font-semibold text-text-muted">
        This page is available to administrators only.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-sans text-text-primary tracking-tight font-bold">
            Team Assignments
          </h1>
          <p className="text-xs md:text-sm text-text-muted mt-1 font-medium tracking-wide">
            Manage the full manager &rarr; sales representative hierarchy from one place. Assign, reassign, or remove reps from any team.
          </p>
        </div>
        <button
          onClick={loadData}
          className="inline-flex items-center space-x-1.5 px-3 py-2 border border-border-default hover:bg-surface-2 rounded-lg text-xs font-bold text-text-muted transition cursor-pointer self-start"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-surface-1 border border-border-default rounded-2xl p-4 space-y-1">
          <div className="flex items-center space-x-1.5 text-text-muted">
            <UserCog className="h-3.5 w-3.5 text-accent-color" />
            <span className="text-[10px] font-semibold uppercase tracking-wide">Managers</span>
          </div>
          <h4 className="text-base font-semibold text-text-primary tabular-nums">{managers.length}</h4>
          <span className="text-[9px] text-text-muted font-bold block">{activeManagers} active managers</span>
        </div>
        <div className="bg-surface-1 border border-border-default rounded-2xl p-4 space-y-1">
          <div className="flex items-center space-x-1.5 text-text-muted">
            <UserRound className="h-3.5 w-3.5 text-accent-color" />
            <span className="text-[10px] font-semibold uppercase tracking-wide">Sales Reps</span>
          </div>
          <h4 className="text-base font-semibold text-text-primary tabular-nums">{reps.length}</h4>
          <span className="text-[9px] text-text-muted font-bold block">In organization</span>
        </div>
        <div className="bg-surface-1 border border-border-default rounded-2xl p-4 space-y-1">
          <div className="flex items-center space-x-1.5 text-text-muted">
            <Check className="h-3.5 w-3.5 text-accent-color" />
            <span className="text-[10px] font-semibold uppercase tracking-wide">Assigned</span>
          </div>
          <h4 className="text-base font-semibold text-text-primary tabular-nums">{assignedCount}</h4>
          <span className="text-[9px] text-text-muted font-bold block">On a team</span>
        </div>
        <div className="bg-surface-1 border border-border-default rounded-2xl p-4 space-y-1">
          <div className="flex items-center space-x-1.5 text-text-muted">
            <UserPlus className="h-3.5 w-3.5 text-status-warning" />
            <span className="text-[10px] font-semibold uppercase tracking-wide">Unassigned</span>
          </div>
          <h4 className="text-base font-semibold text-text-primary tabular-nums">{unassignedCount}</h4>
          <span className="text-[9px] text-text-muted font-bold block">No manager yet</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Filter reps by name or email..."
          className="w-full pl-9 pr-3 py-2 border border-border-default rounded-lg text-xs bg-surface-1 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-color transition-colors"
        />
      </div>

      {loading && allUsers.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-text-muted text-xs font-medium">
          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          Loading teams...
        </div>
      ) : (
        <>
          {/* Manager team cards */}
          <div className="space-y-4">
            <h3 className="font-semibold text-text-primary text-sm flex items-center">
              <UserCog className="h-4.5 w-4.5 mr-2 text-accent-color" />
              <span>Manager Teams</span>
              {managers.length === 0 && !loading && (
                <span className="ml-2 text-[10px] font-medium text-text-muted">(create manager-role users on the Users page first)</span>
              )}
            </h3>

            {teams.length === 0 ? (
              <div className="bg-surface-1 border border-border-default rounded-2xl p-8 text-center">
                <div className="h-12 w-12 mx-auto rounded-full bg-surface-2 border border-border-default flex items-center justify-center mb-3">
                  <Users className="h-5 w-5 text-text-muted" />
                </div>
                <p className="text-xs font-semibold text-text-primary">No teams to show</p>
                <p className="text-[10px] text-text-muted font-medium mt-1 max-w-sm mx-auto leading-relaxed">
                  {managers.length === 0
                    ? 'Create users with the Manager role first, then assign sales reps to them from this page.'
                    : 'Assign a sales rep from the Unassigned section below to build a team.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {teams.map(({ manager, members }) => (
                  <div key={manager.id} className="bg-surface-1 border border-border-default rounded-2xl p-5 space-y-3">
                    {/* Manager header */}
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 shrink-0 rounded-full bg-surface-2 border border-border-default flex items-center justify-center text-xs font-bold text-accent-color select-none">
                        {userInitials(manager.full_name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-text-primary truncate flex items-center gap-1.5">
                          {manager.full_name}
                          <ShieldCheck className="h-3.5 w-3.5 text-accent-color shrink-0" />
                        </p>
                        <p className="text-[10px] text-text-muted font-medium truncate flex items-center gap-1">
                          <Mail className="h-3 w-3 shrink-0" />
                          {manager.email}
                        </p>
                      </div>
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        members.length > 0 ? 'bg-accent-color/10 text-accent-color' : 'bg-surface-2 text-text-muted'
                      }`}>
                        {members.length} rep{members.length === 1 ? '' : 's'}
                      </span>
                    </div>

                    {/* Members */}
                    {members.length === 0 ? (
                      <p className="text-[10px] text-text-muted font-medium py-3 text-center border border-dashed border-border-default rounded-xl">
                        No reps assigned yet — use the select in the Unassigned section below.
                      </p>
                    ) : (
                      <ul className="divide-y divide-border-subtle">
                        {members.map(rep => (
                          <li key={rep.id} className="flex items-center gap-3 py-2.5">
                            <div className="h-7 w-7 shrink-0 rounded-full bg-surface-2 border border-border-default flex items-center justify-center text-[10px] font-bold text-accent-color select-none">
                              {userInitials(rep.full_name)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-text-primary truncate">{rep.full_name}</p>
                              <p className="text-[9px] text-text-muted font-medium truncate">{rep.email}</p>
                            </div>
                            {statusBadge(rep.is_active)}
                            <div className="w-36 shrink-0">
                              {managerSelect(rep)}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Unassigned reps pool */}
          <div className="bg-surface-1 border border-border-default rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-text-primary text-sm flex items-center">
                <UserPlus className="h-4.5 w-4.5 mr-2 text-status-warning" />
                <span>Unassigned Sales Reps</span>
                {unassigned.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-status-warning/10 text-status-warning rounded text-[9px] font-semibold">
                    {unassigned.length}
                  </span>
                )}
              </h3>
              {q && reps.length !== visibleReps.length && (
                <span className="text-[10px] text-text-muted font-medium">
                  Showing {visibleReps.length} of {reps.length} reps
                </span>
              )}
            </div>

            {unassigned.length === 0 ? (
              <div className="flex items-start space-x-2 py-4">
                <Info className="h-3.5 w-3.5 text-text-muted mt-0.5 shrink-0" />
                <p className="text-[10px] text-text-muted font-medium leading-relaxed">
                  {reps.length === 0
                    ? 'No sales representatives exist yet. Create a sales-rep user from the Users page — you can assign their manager right in the create form.'
                    : 'Every sales rep is on a team. Reps can also be reassigned from the select next to their name on a manager card.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border-default text-[11px] uppercase font-black tracking-wider text-text-primary bg-muted/40">
                      <th className="py-2.5">Sales Rep</th>
                      <th className="py-2.5">Email</th>
                      <th className="py-2.5">Status</th>
                      <th className="py-2.5 w-48">Assign To Manager</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-xs font-semibold text-text-primary">
                    {unassigned.map(rep => (
                      <tr key={rep.id} className="hover:bg-surface-2 transition-colors">
                        <td className="py-3">
                          <div className="flex items-center space-x-2.5">
                            <div className="h-7 w-7 rounded-full bg-surface-2 border border-border-default flex items-center justify-center text-[10px] font-bold text-accent-color select-none">
                              {userInitials(rep.full_name)}
                            </div>
                            <span className="font-semibold">{rep.full_name}</span>
                          </div>
                        </td>
                        <td className="py-3 text-text-muted">{rep.email}</td>
                        <td className="py-3">{statusBadge(rep.is_active)}</td>
                        <td className="py-3">
                          <div className="relative">
                            <select
                              value=""
                              disabled={busyRepIds[rep.id] || managers.length === 0}
                              onChange={e => handleAssign(rep.id, e.target.value)}
                              className="w-full appearance-none rounded-lg border border-border-default bg-surface-2 py-1.5 pl-2.5 pr-7 text-xs font-semibold text-text-primary focus:border-accent-color focus:outline-none disabled:opacity-50 transition-colors cursor-pointer"
                            >
                              <option value="">{managers.length === 0 ? '— No managers —' : '— Select manager —'}</option>
                              {managers
                                .slice()
                                .sort((a, b) => a.full_name.localeCompare(b.full_name))
                                .map(m => (
                                  <option key={m.id} value={m.id}>
                                    {m.full_name}
                                  </option>
                                ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-text-muted" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
