'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  CheckSquare,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  Users,
  Square,
} from 'lucide-react';
import {
  getDeletedLeads,
  permanentlyDeleteLead,
  purgeDeletedLeads,
  Lead,
  PaginatedResult,
} from '@/utils/api';
import { toast } from '@/lib/toast';

/**
 * Admin Recycle Bin — lists soft-deleted (archived) leads and lets the
 * admin permanently purge them. Hard deletion is admin-only by design.
 */
export default function RecycleBinView() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [purgeBusy, setPurgeBusy] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [purgeConfirmOpen, setPurgeConfirmOpen] = useState(false);
  const [purgeConfirmCount, setPurgeConfirmCount] = useState(0);
  const [purgeConfirmHasSelection, setPurgeConfirmHasSelection] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result: PaginatedResult<Lead> = await getDeletedLeads(page, pageSize, query || undefined);
      setLeads(result.data ?? []);
      setTotal(result.total ?? 0);
    } catch (err) {
      console.error('Failed to load deleted leads:', err);
      setError(err instanceof Error ? err.message : 'Failed to load deleted leads.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, query]);

  useEffect(() => {
    load();
  }, [load]);

  const applySearch = () => {
    setPage(1);
    setQuery(search.trim());
  };

  const handleDeleteOne = async (lead: Lead) => {
    const confirmed = window.confirm(
      `Permanently delete "${lead.title || lead.company_name || 'this lead'}"? This cannot be undone.`
    );
    if (!confirmed) return;
    setBusyId(lead.id);
    try {
      await permanentlyDeleteLead(lead.id);
      toast.success('Lead permanently deleted.');
      const next = leads.filter((l) => l.id !== lead.id);
      setLeads(next);
      setTotal((t) => Math.max(0, t - 1));
      // Step back a page when the last item on a page is removed.
      if (next.length === 0 && page > 1) {
        setPage((p) => Math.max(1, p - 1));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete lead.');
    } finally {
      setBusyId(null);
    }
  };

  const openPurgeConfirm = () => {
    const hasSelection = selectedIds.size > 0;
    setPurgeConfirmHasSelection(hasSelection);
    setPurgeConfirmCount(hasSelection ? selectedIds.size : total);
    setPurgeConfirmOpen(true);
  };

  const handlePurge = async () => {
    setPurgeConfirmOpen(false);
    const hasSelection = purgeConfirmHasSelection;
    const count = purgeConfirmCount;
    setPurgeBusy(true);
    try {
      if (hasSelection) {
        let deleted = 0;
        let failed = 0;
        for (const id of selectedIds) {
          try {
            await permanentlyDeleteLead(id);
            deleted++;
          } catch {
            failed++;
          }
        }
        setSelectedIds(new Set());
        if (failed > 0) {
          toast.success(`${deleted} deleted, ${failed} failed.`);
        } else {
          toast.success(`${deleted} lead(s) permanently deleted.`);
        }
      } else {
        const result = await purgeDeletedLeads();
        toast.success(`Purged ${result.purged ?? total} soft-deleted lead(s).`);
        setLeads([]);
        setTotal(0);
      }
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete leads.');
    } finally {
      setPurgeBusy(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === leads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(leads.map((l) => l.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-[var(--space-5)]">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-sans font-bold tracking-tight text-foreground">
              Recycle Bin
            </h1>
            <span className="rounded-full bg-status-danger/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-status-danger border border-status-danger/15">
              Admin
            </span>
          </div>
          <p className="mt-1 text-xs md:text-sm text-muted-foreground font-medium tracking-wide">
            Soft-deleted leads archived by sales reps — permanently purge them here.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applySearch()}
              placeholder="Search archived leads…"
              className="h-10 w-56 rounded-lg border border-border-default bg-surface-2/60 px-8 text-xs font-medium text-text-primary outline-none transition-colors focus:border-accent-color focus:ring-1 focus:ring-accent-color/20 placeholder:text-text-muted/60"
            />
          </div>

          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border-default bg-surface-1 px-4 text-xs font-semibold text-text-primary transition-colors hover:bg-surface-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            type="button"
            onClick={openPurgeConfirm}
            disabled={purgeBusy || (total === 0 && selectedIds.size === 0)}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border-default bg-surface-1 px-4 text-xs font-semibold text-text-primary transition-colors hover:bg-surface-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {purgeBusy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            {selectedIds.size > 0 ? `Purge Selected (${selectedIds.size})` : `Purge All (${total})`}
          </button>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-1 gap-[var(--space-4)] sm:grid-cols-3">
        <div className="rounded-2xl border border-border-default bg-surface-1 p-[var(--space-4)]">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
            Archived Leads
          </p>
          <p className="mt-1.5 text-2xl font-bold text-text-primary tabular-nums">{total}</p>
          <p className="mt-0.5 text-[10px] text-text-muted">Soft-deleted, awaiting decision</p>
        </div>
        <div className="rounded-2xl border border-border-default bg-surface-1 p-[var(--space-4)]">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
            Page
          </p>
          <p className="mt-1.5 text-2xl font-bold text-text-primary tabular-nums">
            {page} / {totalPages}
          </p>
          <p className="mt-0.5 text-[10px] text-text-muted">
            {leads.length} shown per page
          </p>
        </div>
        <div className="rounded-2xl border border-status-danger/20 bg-status-danger/5 p-[var(--space-4)]">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-status-danger">
            Irreversible
          </p>
          <p className="mt-1.5 text-xs font-semibold text-text-primary leading-relaxed">
            Permanent deletion cannot be undone.
          </p>
          <p className="mt-0.5 text-[10px] text-text-muted">
            Admin-only action
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border-default bg-surface-1 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-default bg-surface-2/50 text-[10px] uppercase font-semibold text-text-muted">
                <th className="py-3 px-4 w-10">
                  <button onClick={toggleSelectAll} className="cursor-pointer" title="Select all">
                    {selectedIds.size === leads.length && leads.length > 0 ? (
                      <CheckSquare className="h-4 w-4 text-accent-color" />
                    ) : (
                      <Square className="h-4 w-4 text-text-muted" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-4">Lead</th>
                <th className="py-3 px-4">Company</th>
                <th className="py-3 px-4">Owner</th>
                <th className="py-3 px-4 hidden md:table-cell">Status</th>
                <th className="py-3 px-4 hidden lg:table-cell">Archived</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default text-xs font-semibold text-text-primary">
              {!loading &&
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-surface-2/40 transition-colors">
                    <td className="py-3 px-4">
                      <button onClick={() => toggleSelectOne(lead.id)} className="cursor-pointer" title="Select">
                        {selectedIds.has(lead.id) ? (
                          <CheckSquare className="h-4 w-4 text-accent-color" />
                        ) : (
                          <Square className="h-4 w-4 text-text-muted" />
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-text-primary truncate max-w-[220px]">
                        {lead.title || lead.contact_name || 'Untitled lead'}
                      </p>
                      {lead.contact_email && (
                        <p className="mt-0.5 text-[10px] text-text-muted truncate max-w-[220px]">
                          {lead.contact_email}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 text-text-muted">
                        <Building2 className="h-3 w-3" />
                        {lead.company_name || '—'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 text-text-muted">
                        <Users className="h-3 w-3" />
                        {lead.owner_name || 'Unassigned'}
                      </span>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-text-muted capitalize">
                        {lead.status?.replace(/_/g, ' ') || '—'}
                      </span>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell text-text-muted tabular-nums">
                      {lead.updated_at
                        ? new Date(lead.updated_at).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteOne(lead)}
                        disabled={busyId === lead.id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-status-danger/25 bg-status-danger/10 px-3 py-1.5 text-[10px] font-bold text-status-danger hover:bg-status-danger/20 transition cursor-pointer disabled:opacity-50"
                      >
                        {busyId === lead.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                        Delete Permanently
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 py-16 text-text-muted text-xs font-semibold">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading archived leads…
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <AlertTriangle className="h-8 w-8 text-status-danger" />
            <p className="text-xs font-semibold text-text-muted">{error}</p>
            <button
              type="button"
              onClick={load}
              className="rounded-lg border border-border-default px-4 py-2 text-xs font-semibold text-text-primary hover:bg-surface-2/40 transition"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && leads.length === 0 && (
          <div className="py-16 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-surface-2 text-text-muted">
              <Trash2 className="h-5 w-5" />
            </div>
            <p className="mt-3 text-xs font-semibold text-text-primary">
              Recycle bin is empty
            </p>
            <p className="mt-1 text-[10px] text-text-muted">
              Leads archived by sales reps will appear here.
            </p>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border-default px-4 py-3">
            <p className="text-[10px] text-text-muted">
              {total} archived lead(s)
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-border-default px-3 py-1.5 text-[10px] font-bold text-text-primary hover:bg-surface-2/40 transition cursor-pointer disabled:opacity-40"
              >
                Prev
              </button>
              <span className="text-[10px] font-semibold text-text-muted">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-lg border border-border-default px-3 py-1.5 text-[10px] font-bold text-text-primary hover:bg-surface-2/40 transition cursor-pointer disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Purge confirmation modal */}
      {purgeConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => setPurgeConfirmOpen(false)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border-default bg-surface-1 p-6 shadow-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-status-danger/10">
                <AlertTriangle className="h-5 w-5 text-status-danger" />
              </div>
              <div>
                <p className="text-sm font-bold text-text-primary">Confirm Purge</p>
                <p className="text-[10px] text-text-muted">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-xs font-semibold text-text-muted leading-relaxed mb-6">
              Permanently delete {purgeConfirmHasSelection ? `${purgeConfirmCount} selected` : `ALL ${purgeConfirmCount}`} soft-deleted lead(s)?
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPurgeConfirmOpen(false)}
                className="rounded-lg border border-border-default bg-surface-1 px-4 py-2 text-xs font-semibold text-text-primary hover:bg-surface-2 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePurge}
                disabled={purgeBusy}
                className="rounded-lg bg-status-danger px-4 py-2 text-xs font-bold text-text-on-primary hover:bg-status-danger/90 transition cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {purgeBusy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {purgeConfirmHasSelection ? 'Delete Selected' : 'Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
