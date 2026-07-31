'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Search,
  Filter,
  ShieldAlert,
  Lock,
  Download,
  Loader2,
} from 'lucide-react';
import { getActivities, type ActivityTimelineItem } from '@/utils/api';

interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  ipAddress: string;
  status: 'Authorized' | 'Warning' | 'Blocked';
}

function toStatus(activity: ActivityTimelineItem): AuditLog['status'] {
  const payloadStatus = String(activity.payload?.status ?? activity.payload?.access_status ?? '').toLowerCase();
  if (payloadStatus.includes('block') || payloadStatus.includes('deny') || payloadStatus.includes('fail')) return 'Blocked';
  if (payloadStatus.includes('warn') || payloadStatus.includes('risk')) return 'Warning';
  return 'Authorized';
}

function toAuditLog(activity: ActivityTimelineItem): AuditLog {
  const payload = activity.payload ?? {};
  return {
    id: activity.id.slice(0, 8).toUpperCase(),
    timestamp: new Date(activity.created_at).toLocaleString(),
    actor: activity.created_by || 'System',
    action: activity.title || activity.action,
    target: typeof payload.target === 'string' ? payload.target : `${activity.entity_type}:${activity.entity_id}`,
    ipAddress: typeof payload.ip_address === 'string' ? payload.ip_address : '-',
    status: toStatus(activity),
  };
}

export default function AuditLogsView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AuditLog['status']>('all');
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    getActivities({ page_size: 100 })
      .then((res) => {
        if (!mounted) return;
        setLogs((res.data ?? []).map(toAuditLog));
      })
      .catch((e) => mounted && setError(e?.message || 'Failed to load audit logs.'))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  const filteredLogs = useMemo(() => logs.filter(log => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = log.actor.toLowerCase().includes(query) ||
      log.action.toLowerCase().includes(query) ||
      log.target.toLowerCase().includes(query);
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [logs, searchQuery, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-sans text-brand-heading tracking-tight font-bold">Audit Trails & Logs</h1>
          <p className="text-xs md:text-sm text-brand-text/75 mt-1 font-medium tracking-wide">Track live authorization, security, and CRM activity records from the backend.</p>
        </div>

        <button className="inline-flex items-center space-x-1.5 px-3.5 py-2 border border-slate-205 hover:bg-slate-50 text-xs font-bold rounded-lg text-brand-text transition-colors cursor-pointer shadow-sm self-start sm:self-center">
          <Download className="h-4 w-4 text-slate-400" />
          <span>Export Logs</span>
        </button>
      </div>

      <div className="bg-white border border-brand-border-purple/20 rounded-xl p-4 shadow-sm/5 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400"><Search className="h-4 w-4" /></div>
          <input type="text" placeholder="Filter logs by actor, action, or target..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs bg-slate-50/60 text-brand-text focus:outline-none focus:border-brand-accent transition-colors" />
        </div>

        <div className="inline-flex items-center gap-1.5 w-full md:w-auto">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="w-full md:w-auto px-3.5 py-1.5 border border-brand-border-purple/35 bg-white rounded-lg text-xs font-bold text-brand-text/80 transition-colors cursor-pointer shadow-sm">
            <option value="all">All Statuses</option>
            <option value="Authorized">Authorized</option>
            <option value="Warning">Warning</option>
            <option value="Blocked">Blocked</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 space-y-4">
        <h3 className="font-extrabold text-brand-heading text-sm flex items-center">
          <Activity className="h-4.5 w-4.5 mr-2 text-brand-accent" />
          <span>Root Authorization Audits</span>
        </h3>

        {error && <div className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-700">{error}</div>}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] uppercase font-extrabold text-black">
                <th className="px-4 py-3.5">Audit ID</th>
                <th className="px-4 py-3.5">Timestamp</th>
                <th className="px-4 py-3.5">Actor</th>
                <th className="px-4 py-3.5">Action Executed</th>
                <th className="px-4 py-3.5">Target Scope</th>
                <th className="px-4 py-3.5">IP Address</th>
                <th className="px-4 py-3.5 text-right">Access Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-brand-text">
              {loading ? (
                <tr><td colSpan={7} className="py-8 text-center text-slate-400 font-bold"><Loader2 className="h-4 w-4 animate-spin inline mr-2" />Loading live audit logs...</td></tr>
              ) : filteredLogs.length > 0 ? filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3.5 font-extrabold text-slate-450 uppercase text-[10px] tracking-wide whitespace-nowrap">{log.id}</td>
                  <td className="px-4 py-3.5 text-slate-450 tabular-nums whitespace-nowrap">{log.timestamp}</td>
                  <td className="px-4 py-3.5 font-extrabold whitespace-nowrap">{log.actor}</td>
                  <td className="px-4 py-3.5 max-w-[200px] truncate" title={log.action}>{log.action}</td>
                  <td className="px-4 py-3.5 text-slate-500 max-w-[250px] truncate" title={log.target}>{log.target}</td>
                  <td className="px-4 py-3.5 text-slate-450 tabular-nums whitespace-nowrap">{log.ipAddress}</td>
                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-extrabold uppercase tracking-wide text-[8px] ${log.status === 'Authorized' ? 'bg-emerald-50 text-emerald-700' : log.status === 'Warning' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>
                      {log.status === 'Authorized' ? <Lock className="h-2.5 w-2.5" /> : <ShieldAlert className="h-2.5 w-2.5" />}
                      {log.status}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={7} className="py-8 text-center text-slate-400 font-bold">No audit records matched your filter criteria.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
