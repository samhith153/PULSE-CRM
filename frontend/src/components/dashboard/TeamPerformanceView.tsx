'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Award,
  TrendingUp,
  Phone,
  Calendar,
  Layers,
  Percent,
  Users,
  ChevronUp,
  Star,
  Loader2,
} from 'lucide-react';
import { getAdminDashboard, asNumber, formatINR, formatPct, AdminDashboardData } from '@/utils/api';

interface RepRow {
  rank: number;
  name: string;
  revenue: number;
  calls: number;
  meetings: number;
  deals: number;
  winRate: number;
  avatar?: string | null;
}

export default function TeamPerformanceView() {
  const [reps, setReps] = useState<RepRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAdminDashboard()
      .then((d: AdminDashboardData) => {
        if (cancelled) return;
        const rows: RepRow[] = (d?.top_sales_reps ?? []).map((r, i) => ({
          rank: i + 1,
          name: r.full_name,
          revenue: asNumber(r.revenue),
          calls: 0,
          meetings: 0,
          deals: asNumber(r.deals_closed),
          winRate: asNumber(r.conversion_rate),
          avatar: null,
        }));
        setReps(rows);
        setError(null);
      })
      .catch((e) => { if (!cancelled) setError(e?.message || 'Failed to load team performance'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const teamAverages = reps.length
    ? {
        revenue: Math.round(reps.reduce((s, r) => s + r.revenue, 0) / reps.length),
        calls: Math.round(reps.reduce((s, r) => s + r.calls, 0) / reps.length),
        meetings: Math.round(reps.reduce((s, r) => s + r.meetings, 0) / reps.length),
        deals: (reps.reduce((s, r) => s + r.deals, 0) / reps.length).toFixed(1),
        winRate: (reps.reduce((s, r) => s + r.winRate, 0) / reps.length).toFixed(1),
      }
    : { revenue: 0, calls: 0, meetings: 0, deals: '0', winRate: '0' };

  const getStatus = (winRate: number) => {
    if (winRate >= 70) return { label: 'Top Performer', color: 'bg-brand-cyan/15 text-brand-cyan' };
    if (winRate >= 60) return { label: 'On Target', color: 'bg-blue-50 text-blue-700' };
    return { label: 'Nurture Required', color: 'bg-destructive/10 text-destructive' };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-sans text-foreground tracking-tight font-bold">
          Team Performance
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground mt-1 font-medium tracking-wide">
          Compare revenue attribution, contact metrics, and overall close rates across representatives.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground text-xs font-semibold">
          <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading team performance…
        </div>
      ) : error ? (
        <div className="py-24 text-center text-destructive text-xs font-semibold">{error}</div>
      ) : reps.length === 0 ? (
        <div className="py-24 text-center text-muted-foreground text-xs font-semibold">No rep performance data available.</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { label: "Avg Revenue / Rep", val: formatINR(teamAverages.revenue), sub: "Period total", icon: TrendingUp },
              { label: "Avg Outbound Calls", val: `${teamAverages.calls} Calls`, sub: "Per Rep", icon: Phone },
              { label: "Avg Meetings Set", val: `${teamAverages.meetings} Demos`, sub: "Per Rep", icon: Calendar },
              { label: "Avg Deals / Rep", val: `${teamAverages.deals} Deals`, sub: "Won Status", icon: Layers },
              { label: "Avg Win Rate", val: `${teamAverages.winRate}%`, sub: "Target SLA", icon: Percent },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="bg-card border border-border rounded-2xl p-4 space-y-1">
                  <div className="flex items-center space-x-1.5 text-muted-foreground">
                    <Icon className="h-3.5 w-3.5 text-brand-purple" />
                    <span className="text-[10px] font-semibold uppercase tracking-wide">{item.label}</span>
                  </div>
                  <h4 className="text-base font-semibold text-foreground">{item.val}</h4>
                  <span className="text-[9px] text-muted-foreground font-bold block">{item.sub}</span>
                </div>
              );
            })}
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground text-sm flex items-center">
                <Award className="h-4.5 w-4.5 mr-2 text-brand-purple" />
                <span>Sales Representative Rankings</span>
              </h3>
              <span className="text-[9px] font-semibold bg-secondary text-foreground px-2 py-1 rounded">
                All Metrics (Current Period)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-[10px] uppercase font-semibold text-foreground">
                    <th className="py-2.5">Rank</th>
                    <th className="py-2.5">Salesperson</th>
                    <th className="py-2.5 text-right">Revenue Won</th>
                    <th className="py-2.5 text-right">Outbound Calls</th>
                    <th className="py-2.5 text-right">Client Meetings</th>
                    <th className="py-2.5 text-right">Deals Won</th>
                    <th className="py-2.5 text-right">Win Rate</th>
                    <th className="py-2.5 text-right">Performance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs font-semibold text-foreground">
                  {reps.map((rep) => {
                    const status = getStatus(rep.winRate);
                    return (
                      <tr key={rep.rank} className="hover:bg-secondary transition-colors">
                        <td className="py-3">
                          <div className="flex items-center space-x-1">
                            <span className={`h-5 w-5 rounded-full flex items-center justify-center font-semibold ${
                              rep.rank === 1 ? 'bg-amber-50 text-foreground' : 'bg-secondary text-foreground'
                            }`}>
                              {rep.rank}
                            </span>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center space-x-2.5">
                            <div className="h-6 w-6 rounded-full bg-secondary border border-border flex items-center justify-center text-[9px] font-semibold text-muted-foreground">
                              {rep.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                            </div>
                            <span className="font-semibold">{rep.name}</span>
                          </div>
                        </td>
                        <td className="py-3 text-right tabular-nums font-semibold text-foreground">
                          {formatINR(rep.revenue)}
                        </td>
                        <td className="py-3 text-right tabular-nums">{rep.calls}</td>
                        <td className="py-3 text-right tabular-nums">{rep.meetings}</td>
                        <td className="py-3 text-right tabular-nums">{rep.deals}</td>
                        <td className="py-3 text-right tabular-nums">{rep.winRate}%</td>
                        <td className="py-3 text-right">
                          <span className={`px-2 py-0.5 rounded font-semibold uppercase tracking-wide text-[9px] ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

