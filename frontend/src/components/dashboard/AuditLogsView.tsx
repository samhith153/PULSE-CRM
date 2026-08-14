'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Activity, 
  Search, 
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { toast } from '@/lib/toast';
import { getAutomationEvents } from '@/utils/api';
import type { AutomationEvent } from '@/utils/api';

interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  ipAddress: string;
  status: 'Authorized' | 'Warning' | 'Blocked';
}

function titleCase(value: string): string {
  return value.replace(/[._-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso || '—';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function deriveStatus(event: AutomationEvent): AuditLog['status'] {
  const t = `${event.event_type} ${event.event_name || ''} ${event.payload?.status || event.payload?.outcome || ''}`.toLowerCase();
  if (t.includes('block') || t.includes('denied') || t.includes('forbid')) return 'Blocked';
  if (t.includes('fail') || t.includes('attempt') || t.includes('unauthoriz') || t.includes('suspicious')) return 'Warning';
  return 'Authorized';
}

function eventToAuditLog(event: AutomationEvent): AuditLog {
  const payload = event.payload || {};
  const ipAddress = String(payload?.ip_address ?? payload?.ip ?? payload?.source_ip ?? event.source ?? '');
  const actor = String(payload?.user_name || payload?.email || (event.actor_id ? `User ${event.actor_id.slice(0, 8)}` : 'System'));
  const target = titleCase(String(event.aggregate_type || payload?.target || 'System'));
  return {
    id: `A${event.id.slice(0, 6).toUpperCase()}`,
    timestamp: formatTimestamp(event.occurred_at || event.created_at),
    actor,
    action: titleCase(event.event_name || event.event_type),
    target,
    ipAddress: ipAddress || '—',
    status: deriveStatus(event)
  };
}

export default function AuditLogsView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Authorized' | 'Warning' | 'Blocked'>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<'timestamp' | 'id' | 'actor' | 'status'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadAuditLogs = () => {
      getAutomationEvents(100)
        .then((res) => {
          if (cancelled) return;
          setLogs((res?.items ?? []).map(eventToAuditLog));
          setLogsLoading(false);
        })
        .catch(() => {
          if (cancelled) return;
          setLogs([]);
          setLogsLoading(false);
        });
    };

    loadAuditLogs();
    const interval = setInterval(loadAuditLogs, 15000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [logs, sortField, sortOrder]);

  const filteredLogs = useMemo(() => {
    return sortedLogs.filter(log => {
      const matchesSearch = log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.target.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || log.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [sortedLogs, searchQuery, statusFilter]);

  const itemsPerPage = 5;
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / itemsPerPage));
  
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, currentPage]);

  const handleExportCSV = () => {
    const csvHeaders = ['Audit ID', 'Timestamp', 'Actor', 'Action Executed', 'Target Scope', 'IP Address', 'Access Status'];
    const csvRows = filteredLogs.map(log => [
      log.id,
      log.timestamp,
      log.actor,
      log.action,
      log.target,
      log.ipAddress,
      log.status
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [csvHeaders.join(','), ...csvRows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pulse_audit_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Audit logs exported successfully.');
  };

  const renderSortIcon = (field: typeof sortField) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? <ChevronUp className="size-3 inline-block ml-1 text-accent-color" /> : <ChevronDown className="size-3 inline-block ml-1 text-accent-color" />;
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-sans text-text-primary tracking-tight font-bold">
            Audit Trails & Logs
          </h1>
          <p className="text-xs md:text-sm text-text-muted mt-1 font-medium tracking-wide">
            Track root level events, authorization access parameters, and security breach signals.
          </p>
        </div>

        <button 
          onClick={handleExportCSV}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 border border-border-default hover:bg-surface-2 text-xs font-bold rounded-lg text-text-primary transition-colors cursor-pointer self-start sm:self-center bg-surface-1"
        >
          <Download className="h-4 w-4 text-text-muted" />
          <span>Export Logs</span>
        </button>
      </div>

      {/* Filter panel */}
      <div className="bg-surface-1 border border-border-default rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-text-muted">
            <Search className="h-4 w-4" />
          </div>
          <input 
            type="text" 
            placeholder="Filter logs by actor, action, or target..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-1.5 border border-border-default rounded-lg text-xs bg-surface-2/60 text-text-primary focus:outline-none focus:border-accent-color transition-colors font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto shrink-0 select-none">
          <span className="text-[10px] uppercase font-bold text-text-muted">Status:</span>
          <select 
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as any); setCurrentPage(1); }}
            className="rounded-lg border border-border-default bg-surface-1 px-3 py-1.5 text-xs font-bold text-text-primary outline-none cursor-pointer focus:ring-1 focus:ring-accent-color/20"
          >
            <option value="All">All Statuses</option>
            <option value="Authorized">Authorized</option>
            <option value="Warning">Warning</option>
            <option value="Blocked">Blocked</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-surface-1 border border-border-default rounded-2xl p-5 space-y-4 shadow-sm">
        <h3 className="font-semibold text-text-primary text-sm flex items-center">
          <Activity className="h-4.5 w-4.5 mr-2 text-accent-color" />
          <span>Root Authorization Audits</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-default text-[10px] uppercase font-bold text-text-primary">
                <th 
                  onClick={() => handleSort('id')}
                  className="px-4 py-3.5 cursor-pointer hover:text-accent-color transition-colors select-none"
                >
                  Audit ID {renderSortIcon('id')}
                </th>
                <th 
                  onClick={() => handleSort('timestamp')}
                  className="px-4 py-3.5 cursor-pointer hover:text-accent-color transition-colors select-none"
                >
                  Timestamp {renderSortIcon('timestamp')}
                </th>
                <th 
                  onClick={() => handleSort('actor')}
                  className="px-4 py-3.5 cursor-pointer hover:text-accent-color transition-colors select-none"
                >
                  Actor {renderSortIcon('actor')}
                </th>
                <th className="px-4 py-3.5">Action Executed</th>
                <th className="px-4 py-3.5">Target Scope</th>
                <th className="px-4 py-3.5">IP Address</th>
                <th 
                  onClick={() => handleSort('status')}
                  className="px-4 py-3.5 text-right cursor-pointer hover:text-accent-color transition-colors select-none"
                >
                  Access Status {renderSortIcon('status')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-xs font-semibold text-text-primary">
              {paginatedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-surface-2 transition-colors">
                  <td className="px-4 py-3.5 font-bold text-text-muted uppercase text-[10px] tracking-wide whitespace-nowrap">{log.id}</td>
                  <td className="px-4 py-3.5 text-text-muted tabular-nums whitespace-nowrap">{log.timestamp}</td>
                  <td className="px-4 py-3.5 font-bold whitespace-nowrap">{log.actor}</td>
                  <td className="px-4 py-3.5 max-w-[200px] truncate" title={log.action}>{log.action}</td>
                  <td className="px-4 py-3.5 text-text-secondary max-w-[250px] truncate" title={log.target}>{log.target}</td>
                  <td className="px-4 py-3.5 text-text-muted tabular-nums whitespace-nowrap">{log.ipAddress}</td>
                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded font-extrabold uppercase tracking-wide text-[8px] border ${
                      log.status === 'Authorized' 
                        ? 'bg-accent-color/10 border-accent-color/15 text-accent-color' 
                        : log.status === 'Warning'
                        ? 'bg-status-warning-bg border-status-warning-text/15 text-status-warning-text'
                        : 'bg-status-danger-bg border-status-danger-text/15 text-status-danger-text'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
              {logsLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-text-muted font-bold">
                    Loading audit events...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-text-muted font-bold">
                    No audit records matched your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        {filteredLogs.length > 0 && (
          <div className="flex items-center justify-between pt-4 border-t border-border-default/60 text-xs font-semibold text-text-secondary">
            <span>
              Showing <strong className="text-text-primary">{(currentPage - 1) * itemsPerPage + 1}</strong> to <strong className="text-text-primary">{Math.min(currentPage * itemsPerPage, filteredLogs.length)}</strong> of <strong className="text-text-primary">{filteredLogs.length}</strong> logs
            </span>
            <div className="flex items-center gap-1.5 select-none">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 border border-border-default hover:bg-surface-2 rounded-lg text-text-muted cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-text-primary text-[11px] font-bold px-2">{currentPage} / {totalPages}</span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 border border-border-default hover:bg-surface-2 rounded-lg text-text-muted cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
