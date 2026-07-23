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
          <h1 className="text-3xl font-sans text-brand-heading tracking-tight font-bold">
            Audit Trails & Logs
          </h1>
          <p className="text-xs md:text-sm text-brand-text/75 mt-1 font-medium tracking-wide">
            Track root level events, authorization access parameters, and security breach signals.
          </p>
        </div>

        <button className="inline-flex items-center space-x-1.5 px-3.5 py-2 border border-slate-205 hover:bg-slate-50 text-xs font-bold rounded-lg text-brand-text transition-colors cursor-pointer shadow-sm self-start sm:self-center">
          <Download className="h-4 w-4 text-slate-400" />
          <span>Export Logs</span>
        </button>
      </div>

      {/* Filter panel */}
      <div className="bg-white border border-brand-border-purple/20 rounded-xl p-4 shadow-sm/5 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input 
            type="text" 
            placeholder="Filter logs by actor, action, or target..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs bg-slate-50/60 text-brand-text focus:outline-none focus:border-brand-accent transition-colors"
          />
        </div>

        <button className="inline-flex items-center space-x-1 px-3.5 py-1.5 border border-brand-border-purple/35 hover:border-brand-border-purple bg-white rounded-lg text-xs font-bold text-brand-text/80 transition-colors cursor-pointer shadow-sm w-full md:w-auto justify-center">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <span>Filter Status</span>
        </button>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 space-y-4">
        <h3 className="font-extrabold text-brand-heading text-sm flex items-center">
          <Activity className="h-4.5 w-4.5 mr-2 text-brand-accent" />
          <span>Root Authorization Audits</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] uppercase font-extrabold text-slate-400">
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
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3.5 font-extrabold text-slate-450 uppercase text-[10px] tracking-wide whitespace-nowrap">{log.id}</td>
                  <td className="px-4 py-3.5 text-slate-450 tabular-nums whitespace-nowrap">{log.timestamp}</td>
                  <td className="px-4 py-3.5 font-extrabold whitespace-nowrap">{log.actor}</td>
                  <td className="px-4 py-3.5 max-w-[200px] truncate" title={log.action}>{log.action}</td>
                  <td className="px-4 py-3.5 text-slate-500 max-w-[250px] truncate" title={log.target}>{log.target}</td>
                  <td className="px-4 py-3.5 text-slate-450 tabular-nums whitespace-nowrap">{log.ipAddress}</td>
                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded font-extrabold uppercase tracking-wide text-[8px] ${
                      log.status === 'Authorized' 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : log.status === 'Warning'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-bold">
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
