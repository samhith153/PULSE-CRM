'use client';

import React from 'react';
import {
  TrendingUp,
  MoveUpRight,
  MoveDownRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  asNumber,
  type Decimal,
} from '@/utils/api';
import type { ReportPeriod } from './ReportsView';

interface RevenueTrendItem {
  period: string;
  revenue: Decimal;
}

interface SalesReportNewProps {
  revenueTrend: RevenueTrendItem[];
  period: ReportPeriod;
  onPeriodChange: (period: ReportPeriod) => void;
}

const PERIOD_LABELS: Record<ReportPeriod, string> = {
  week: 'Weekly',
  month: 'Monthly',
  quarter: 'Quarterly',
  year: 'Yearly',
};

function formatPeriodLabel(period: string): string {
  if (/^\d{4}-\d{2}$/.test(period)) {
    const [year, month] = period.split('-').map(Number);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
    }).format(new Date(year, month - 1, 1));
  }
  return period;
}

export function SalesReportNew({
  revenueTrend,
  period,
  onPeriodChange,
}: SalesReportNewProps) {
  const chartData = revenueTrend.map((item) => ({
    label: formatPeriodLabel(item.period),
    revenue: asNumber(item.revenue) || 0,
  }));

  const totalRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0);

  const previousValue = chartData.length > 1 ? chartData[chartData.length - 2]?.revenue || 0 : 0;
  const currentValue = chartData.length > 0 ? chartData[chartData.length - 1]?.revenue || 0 : 0;

  const growthPct =
    previousValue > 0
      ? ((currentValue - previousValue) / previousValue) * 100
      : 0;

  const currency = (n: number) =>
    n.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    });

  return (
    <section className="card-surface p-6 bg-card border border-border rounded-2xl shadow-sm space-y-5">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-foreground">
            Revenue Trend
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {growthPct >= 0 ? (
              <MoveUpRight className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <MoveDownRight className="h-3.5 w-3.5 text-rose-500" />
            )}
            <span className={`font-semibold ${growthPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {growthPct >= 0 ? '+' : ''}{growthPct.toFixed(1)}%
            </span>
            <span>vs last period</span>
          </div>
        </div>

        <select
          value={period}
          onChange={(e) => onPeriodChange(e.target.value as ReportPeriod)}
          className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground outline-none focus:ring-1 focus:ring-brand-purple/20 cursor-pointer"
        >
          <option value="week">Weekly</option>
          <option value="month">Monthly</option>
          <option value="quarter">Quarterly</option>
          <option value="year">Yearly</option>
        </select>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 items-stretch">
        {/* Chart area */}
        <div className="flex-1 h-[260px] min-w-0">
          {chartData.length === 0 ? (
            <div className="flex h-full items-center justify-center border border-dashed border-border rounded-xl">
              <p className="text-sm text-muted-foreground">
                No revenue data available
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--brand-purple)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--brand-purple)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => {
                    if (val >= 1e7) return `${(val / 1e7).toFixed(0)}Cr`;
                    if (val >= 1e5) return `${(val / 1e5).toFixed(0)}L`;
                    if (val >= 1e3) return `${(val / 1e3).toFixed(0)}K`;
                    return val;
                  }}
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                />
                <Tooltip
                  formatter={(value: any) => [currency(Number(value)), 'Revenue']}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    background: 'var(--card)',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--brand-purple)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#revenueGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Total Summary side box */}
        <div className="xl:w-[200px] border border-border bg-secondary/15 rounded-xl p-4 flex flex-col justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-lg bg-brand-purple/10 text-brand-purple">
              <TrendingUp className="size-4" />
            </div>
            <p className="text-xs font-semibold text-muted-foreground leading-snug">
              Total Revenue
              <br />
              {PERIOD_LABELS[period]}
            </p>
          </div>

          <div className="mt-4 xl:mt-0 space-y-1">
            <p className="text-3xl font-bold tracking-tight text-foreground">
              {currency(totalRevenue)}
            </p>
            <p className="text-xs text-muted-foreground">
              {chartData.length} periods logged
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}