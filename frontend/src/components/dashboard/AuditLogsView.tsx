'use client';

import React, { useState } from 'react';
import { 
  Activity, 
  Search, 
  Filter, 
  Download,
  Shield,
  ClipboardList,
  User,
  AlertTriangle,
  AlertOctagon,
  Crosshair,
  ArrowUpDown,
  Copy,
  Calendar,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronDown
} from 'lucide-react';

interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  actorInitials: string;
  actorColor: string;
  action: string;
  target: string;
  ipAddress: string;
  status: 'AUTHORIZED' | 'WARNING' | 'BLOCKED';
}

const WaveChart = ({ color }: { color: string }) => (
  <svg className="absolute bottom-0 right-0 w-32 h-10 opacity-30 pointer-events-none" viewBox="0 0 100 50" preserveAspectRatio="none">
    <path d="M0,50 L20,40 L40,45 L60,20 L80,30 L100,10 L100,50 Z" fill="none" stroke={color} strokeWidth="3" />
    <path d="M0,50 L20,40 L40,45 L60,20 L80,30 L100,10 L100,50 Z" fill={`url(#grad-${color.replace('#', '')})`} stroke="none" />
    <defs>
      <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity="0.5" />
        <stop offset="100%" stopColor={color} stopOpacity="0" />
      </linearGradient>
    </defs>
  </svg>
);

export default function AuditLogsView() {
  const [searchQuery, setSearchQuery] = useState('');
  
  const [logs] = useState<AuditLog[]>([
    { id: "A731", timestamp: "Jul 19, 2026 11:42:01 AM", actor: "System Admin", actorInitials: "SA", actorColor: "bg-purple-100 text-purple-700", action: "Updated Permission Matrix", target: "Sales Manager Role mapping", ipAddress: "192.168.1.42", status: "AUTHORIZED" },
    { id: "A730", timestamp: "Jul 19, 2026 11:21:44 AM", actor: "Sarah Johnson", actorInitials: "SJ", actorColor: "bg-blue-100 text-blue-700", action: "User Login", target: "Representative Workspace Session", ipAddress: "192.168.1.58", status: "AUTHORIZED" },
    { id: "A729", timestamp: "Jul 19, 2026 10:05:12 AM", actor: "System Admin", actorInitials: "SA", actorColor: "bg-purple-100 text-purple-700", action: "Provisioned User profile", target: "alex.johnson@pulse.crm", ipAddress: "192.168.1.42", status: "AUTHORIZED" },
    { id: "A728", timestamp: "Jul 19, 2026 09:12:00 AM", actor: "Unknown User", actorInitials: "UU", actorColor: "bg-gray-200 text-gray-700", action: "Failed login attempt", target: "admin@pulse.crm credentials", ipAddress: "203.0.113.88", status: "WARNING" },
    { id: "A727", timestamp: "Jul 19, 2026 08:31:05 AM", actor: "Alex Johnson", actorInitials: "AJ", actorColor: "bg-emerald-100 text-emerald-700", action: "Triggered Model Retrain", target: "Lead Scoring Engine v4.2.1", ipAddress: "192.168.1.99", status: "AUTHORIZED" },
    { id: "A726", timestamp: "Jul 18, 2026 11:45:12 PM", actor: "Forbidden IP", actorInitials: "FI", actorColor: "bg-rose-100 text-rose-700", action: "API endpoint query attempt", target: "/users endpoint restrictions", ipAddress: "198.51.100.12", status: "BLOCKED" }
  ]);

  const filteredLogs = logs.filter(log => 
    log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.target.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-purple/10 text-brand-purple">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-sans text-foreground tracking-tight font-extrabold">
              Audit Trails & Logs
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5 font-medium tracking-wide">
              Track root level events, authorization access parameters, and security breach signals.
            </p>
          </div>
        </div>

        <button className="inline-flex items-center space-x-2 px-4 py-2 bg-card hover:bg-secondary border border-border text-sm font-bold rounded-xl text-foreground transition-colors shadow-sm">
          <Download className="h-4 w-4 text-brand-purple" />
          <span>Export Logs</span>
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-purple/10 text-brand-purple">
              <ClipboardList className="h-4 w-4" />
            </div>
            <span className="text-[11px] font-bold text-muted-foreground">Total Events</span>
          </div>
          <div className="text-2xl font-extrabold text-foreground mb-1">2,847</div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">↗ 12.5%</span>
            <span className="text-[10px] font-medium text-muted-foreground">vs last 7 days</span>
          </div>
          <WaveChart color="#8b5cf6" />
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <User className="h-4 w-4" />
            </div>
            <span className="text-[11px] font-bold text-muted-foreground">Successful Events</span>
          </div>
          <div className="text-2xl font-extrabold text-foreground mb-1">2,396</div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">↗ 10.3%</span>
            <span className="text-[10px] font-medium text-muted-foreground">vs last 7 days</span>
          </div>
          <WaveChart color="#10b981" />
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <span className="text-[11px] font-bold text-muted-foreground">Warnings</span>
          </div>
          <div className="text-2xl font-extrabold text-foreground mb-1">312</div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">↗ 8.7%</span>
            <span className="text-[10px] font-medium text-muted-foreground">vs last 7 days</span>
          </div>
          <WaveChart color="#f59e0b" />
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
              <AlertOctagon className="h-4 w-4" />
            </div>
            <span className="text-[11px] font-bold text-muted-foreground">Blocked Events</span>
          </div>
          <div className="text-2xl font-extrabold text-foreground mb-1">139</div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">↗ 15.2%</span>
            <span className="text-[10px] font-medium text-muted-foreground">vs last 7 days</span>
          </div>
          <WaveChart color="#ef4444" />
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
              <Crosshair className="h-4 w-4" />
            </div>
            <span className="text-[11px] font-bold text-muted-foreground">Active Alerts</span>
          </div>
          <div className="text-2xl font-extrabold text-foreground mb-1">7</div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">↗ 16.7%</span>
            <span className="text-[10px] font-medium text-muted-foreground">vs last 7 days</span>
          </div>
          <WaveChart color="#3b82f6" />
        </div>
      </div>

      {/* Filter panel */}
      <div className="flex flex-col md:flex-row items-center gap-3 w-full">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted-foreground">
            <Search className="h-4 w-4" />
          </div>
          <input 
            type="text" 
            placeholder="Filter logs by actor, action, or target..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 border border-border rounded-xl text-sm bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-brand-purple/30 transition-colors shadow-sm"
          />
        </div>

        <button className="inline-flex items-center gap-2 px-4 py-3 border border-border bg-card hover:bg-secondary rounded-xl text-sm font-bold text-foreground transition-colors cursor-pointer shadow-sm">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span>Filter Status</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-1" />
        </button>

        <button className="inline-flex items-center gap-2 px-4 py-3 border border-border bg-card hover:bg-secondary rounded-xl text-sm font-bold text-foreground transition-colors cursor-pointer shadow-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>Select date range</span>
          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground ml-1 opacity-50" />
        </button>

        <button className="inline-flex items-center gap-1.5 px-4 py-3 border border-border bg-card hover:bg-secondary rounded-xl text-sm font-bold text-muted-foreground transition-colors cursor-pointer shadow-sm">
          <RotateCcw className="h-4 w-4" />
          <span>Clear</span>
        </button>
      </div>

      {/* Logs Table */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5 shadow-sm">
        <h3 className="font-extrabold text-foreground text-[17px] flex items-center gap-2.5">
          <Activity className="h-5 w-5 text-brand-purple" />
          <span>Root Authorization Audits</span>
        </h3>

        <div className="overflow-x-auto rounded-xl border border-border/60">
          <table className="w-full text-left border-collapse">
            <thead className="bg-secondary/40">
              <tr className="border-b border-border text-[10px] uppercase font-black tracking-wider text-muted-foreground">
                <th className="px-5 py-4 cursor-pointer hover:text-foreground transition-colors">
                  <div className="flex items-center gap-1.5">AUDIT ID <ArrowUpDown className="w-3 h-3 opacity-50" /></div>
                </th>
                <th className="px-5 py-4 cursor-pointer hover:text-foreground transition-colors">
                  <div className="flex items-center gap-1.5">TIMESTAMP <ArrowUpDown className="w-3 h-3 opacity-50" /></div>
                </th>
                <th className="px-5 py-4">ACTOR</th>
                <th className="px-5 py-4">ACTION EXECUTED</th>
                <th className="px-5 py-4">TARGET SCOPE</th>
                <th className="px-5 py-4">IP ADDRESS</th>
                <th className="px-5 py-4 text-right">ACCESS STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-[13px] font-semibold text-foreground">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-secondary/40 transition-colors">
                  <td className="px-5 py-4 font-bold text-foreground">{log.id}</td>
                  <td className="px-5 py-4 text-muted-foreground tabular-nums whitespace-nowrap">{log.timestamp}</td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold ${log.actorColor}`}>
                        {log.actorInitials}
                      </div>
                      <span className="font-bold">{log.actor}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-bold max-w-[200px] truncate" title={log.action}>{log.action}</td>
                  <td className="px-5 py-4 text-muted-foreground font-medium max-w-[250px] truncate" title={log.target}>{log.target}</td>
                  <td className="px-5 py-4 text-muted-foreground tabular-nums whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {log.ipAddress}
                      <button className="text-muted-foreground hover:text-foreground"><Copy className="w-3 h-3" /></button>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-md font-bold uppercase tracking-wide text-[10px] ${
                      log.status === 'AUTHORIZED' 
                        ? 'bg-emerald-50 text-emerald-600' 
                        : log.status === 'WARNING'
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-rose-50 text-rose-600'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground font-bold">
                    No audit records matched your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-2 gap-4">
          <span className="text-[11px] font-semibold text-muted-foreground">
            Showing 1 to 6 of 2,847 events
          </span>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center border border-border rounded-lg bg-card overflow-hidden">
              <button className="p-2 text-muted-foreground hover:bg-secondary transition-colors" disabled>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="px-3 py-1.5 text-xs font-bold bg-brand-purple/10 text-brand-purple border-x border-border">1</button>
              <button className="px-3 py-1.5 text-xs font-bold text-muted-foreground hover:bg-secondary border-r border-border">2</button>
              <button className="px-3 py-1.5 text-xs font-bold text-muted-foreground hover:bg-secondary border-r border-border">3</button>
              <div className="px-2 py-1.5 text-xs text-muted-foreground border-r border-border">...</div>
              <button className="px-3 py-1.5 text-xs font-bold text-muted-foreground hover:bg-secondary border-r border-border">474</button>
              <button className="p-2 text-muted-foreground hover:bg-secondary transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <select className="appearance-none pl-3 pr-8 py-2 border border-border rounded-lg text-[11px] font-bold bg-card text-foreground cursor-pointer focus:outline-none">
                <option value="10">Rows per page 10</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
