'use client';

import React, { useState } from 'react';
import { 
  Activity, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ShieldAlert, 
  Lock,
  Download
} from 'lucide-react';

interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  ipAddress: string;
  status: 'Authorized' | 'Warning' | 'Blocked';
}

export default function AuditLogsView() {
  const [searchQuery, setSearchQuery] = useState('');
  
  const [logs] = useState<AuditLog[]>([
    { id: "A731", timestamp: "2026-07-19 11:42:01", actor: "System Admin", action: "Updated Permission Matrix", target: "Sales Manager Role mapping", ipAddress: "192.168.1.42", status: "Authorized" },
    { id: "A730", timestamp: "2026-07-19 11:21:44", actor: "Sarah Johnson", action: "User Login", target: "Representative Workspace Session", ipAddress: "192.168.1.58", status: "Authorized" },
    { id: "A729", timestamp: "2026-07-19 10:05:12", actor: "System Admin", action: "Provisioned User profile", target: "alex.johnson@pulse.crm", ipAddress: "192.168.1.42", status: "Authorized" },
    { id: "A728", timestamp: "2026-07-19 09:12:00", actor: "Unknown User", action: "Failed login attempt", target: "admin@pulse.crm credentials", ipAddress: "203.0.113.88", status: "Warning" },
    { id: "A727", timestamp: "2026-07-19 08:31:05", actor: "Alex Johnson", action: "Triggered Model Retrain", target: "Lead Scoring Engine v4.2.1", ipAddress: "192.168.1.99", status: "Authorized" },
    { id: "A726", timestamp: "2026-07-18 23:45:12", actor: "Forbidden IP", action: "API endpoint query attempt", target: "/users endpoint restrictions", ipAddress: "198.51.100.12", status: "Blocked" }
  ]);

  const filteredLogs = logs.filter(log => 
    log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.target.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
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

        <button className="inline-flex items-center space-x-1.5 px-3.5 py-2 border border-border-default hover:bg-surface-2 text-xs font-bold rounded-lg text-text-primary transition-colors cursor-pointer self-start sm:self-center">
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
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 border border-border-default rounded-lg text-xs bg-surface-2/60 text-text-primary focus:outline-none focus:border-brand-accent transition-colors"
          />
        </div>

        <button className="inline-flex items-center space-x-1 px-3.5 py-1.5 border border-border-default hover:border-border-default bg-surface-1 rounded-lg text-xs font-bold text-text-muted transition-colors cursor-pointer w-full md:w-auto justify-center">
          <Filter className="h-3.5 w-3.5 text-text-muted" />
          <span>Filter Status</span>
        </button>
      </div>

      {/* Logs Table */}
      <div className="bg-surface-1 border border-border-default rounded-2xl p-5 space-y-4">
        <h3 className="font-semibold text-text-primary text-sm flex items-center">
          <Activity className="h-4.5 w-4.5 mr-2 text-accent-color" />
          <span>Root Authorization Audits</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-default text-[10px] uppercase font-semibold text-text-primary">
                <th className="px-4 py-3.5">Audit ID</th>
                <th className="px-4 py-3.5">Timestamp</th>
                <th className="px-4 py-3.5">Actor</th>
                <th className="px-4 py-3.5">Action Executed</th>
                <th className="px-4 py-3.5">Target Scope</th>
                <th className="px-4 py-3.5">IP Address</th>
                <th className="px-4 py-3.5 text-right">Access Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs font-semibold text-text-primary">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-surface-2 transition-colors">
                  <td className="px-4 py-3.5 font-semibold text-text-muted uppercase text-[10px] tracking-wide whitespace-nowrap">{log.id}</td>
                  <td className="px-4 py-3.5 text-text-muted tabular-nums whitespace-nowrap">{log.timestamp}</td>
                  <td className="px-4 py-3.5 font-semibold whitespace-nowrap">{log.actor}</td>
                  <td className="px-4 py-3.5 max-w-[200px] truncate" title={log.action}>{log.action}</td>
                  <td className="px-4 py-3.5 text-text-muted max-w-[250px] truncate" title={log.target}>{log.target}</td>
                  <td className="px-4 py-3.5 text-text-muted tabular-nums whitespace-nowrap">{log.ipAddress}</td>
                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded font-semibold uppercase tracking-wide text-[8px] ${
                      log.status === 'Authorized' 
                        ? 'bg-accent-color/15 text-accent-color' 
                        : log.status === 'Warning'
                        ? 'bg-status-warning-bg text-status-warning-text'
                        : 'bg-destructive/10 text-destructive'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-text-muted font-bold">
                    No audit records matched your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

