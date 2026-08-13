'use client';

import {
  ChevronDown,
  TrendingUp,
  MoveUpRight,
  MoveDownRight,
} from 'lucide-react';

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

const STAGE_COLORS = [
  'bg-lime',
  'bg-brand-soft',
  'bg-brand',
  'bg-linear-to-b from-brand-soft to-lime-soft',
];

const PERIOD_LABELS: Record<ReportPeriod, string> = {
  week: 'Weekly',
  month: 'Monthly',
  quarter: 'Quarterly',
  year: 'Yearly',
};

/**
 * Converts API period values into readable labels.
 *
 * 2026-01 -> Jan
 * 2026-02 -> Feb
 * 2026-03 -> Mar
 *
 * Other values are left unchanged.
 */
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
  const maxRevenue = revenueTrend.reduce(
    (max, item) =>
      Math.max(max, asNumber(item.revenue) || 0),
    0
  );

  const bars = revenueTrend.map((item, i) => {
    const value = asNumber(item.revenue) || 0;

    const height =
      maxRevenue > 0
        ? Math.max(
            30,
            (value / maxRevenue) * 130
          )
        : 30;

    return {
      label: formatPeriodLabel(item.period),
      originalPeriod: item.period,
      height,
      className:
        STAGE_COLORS[
          i % STAGE_COLORS.length
        ],
      value,
      active:
        i === revenueTrend.length - 1,
    };
  });

  const totalRevenue = bars.reduce(
    (sum, b) => sum + b.value,
    0
  );

  const previousValue =
    bars.length > 1
      ? bars[bars.length - 2]?.value || 0
      : 0;

  const currentValue =
    bars.length > 0
      ? bars[bars.length - 1]?.value || 0
      : 0;

  const growthPct =
    previousValue > 0
      ? ((currentValue - previousValue) /
          previousValue) *
        100
      : 0;

  const currency = (n: number) =>
    n.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    });

  return (
    <section className="bg-card border border-border rounded-2xl p-[var(--space-4)] space-y-[var(--space-3)] shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Revenue Trend
          </h3>

          <span
            className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
              growthPct >= 0
                ? 'bg-status-success-bg text-status-success-text border-status-success-text/15'
                : 'bg-status-danger-bg text-status-danger-text border-status-danger-text/15'
            }`}
          >
            {growthPct >= 0 ? (
              <MoveUpRight className="size-2.5" />
            ) : (
              <MoveDownRight className="size-2.5" />
            )}

            {growthPct >= 0 ? '+' : ''}
            {growthPct.toFixed(1)}%

            <span className="ml-1 font-normal opacity-90">
              vs last period
            </span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={period}
              onChange={(e) => {
                const nextPeriod =
                  e.target.value as ReportPeriod;

                console.log(
                  '📅 PERIOD CHANGED:',
                  nextPeriod
                );

                onPeriodChange(nextPeriod);
              }}
              className="cursor-pointer appearance-none bg-transparent pr-6 text-[12px] font-semibold text-muted-foreground outline-none focus:text-foreground"
            >
              <option value="week">
                Weekly
              </option>

              <option value="month">
                Monthly
              </option>

              <option value="quarter">
                Quarterly
              </option>

              <option value="year">
                Yearly
              </option>
            </select>

            <ChevronDown className="pointer-events-none absolute right-0 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-end">
        {/* Chart Canvas Wrapper */}
        <div className="relative flex-1 h-[220px] border-b border-border/40 select-none">
          
          {/* Background Grid Lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none select-none pb-[38px] pt-8">
            <div className="border-t border-border/30 w-full flex justify-between text-[9px] text-muted-foreground pt-0.5">
              <span>{currency(maxRevenue)}</span>
            </div>
            <div className="border-t border-dashed border-border/20 w-full flex justify-between text-[9px] text-muted-foreground pt-0.5">
              <span>{currency(maxRevenue / 2)}</span>
            </div>
            <div className="border-t border-border/30 w-full flex justify-between text-[9px] text-muted-foreground pt-0.5">
              <span>0</span>
            </div>
          </div>

          {/* Bars Container */}
          <div className="absolute inset-0 flex items-end gap-3 overflow-x-auto custom-scrollbar pb-[38px] pt-10 z-10">
            {bars.length === 0 ? (
              <p className="py-8 text-sm text-muted-foreground w-full text-center">
                No revenue data available
              </p>
            ) : (
              bars.map((b, index) => {
                const gradientClass = b.active 
                  ? 'bg-gradient-to-t from-accent-color/40 to-accent-color shadow-[0_4px_12px_rgba(59,130,246,0.25)] border-accent-color/60' 
                  : 'bg-gradient-to-t from-secondary to-muted-foreground/15 hover:from-accent-color/15 hover:to-accent-color/35 hover:border-accent-color/30 border-border/60';
                
                return (
                  <div
                    key={b.originalPeriod}
                    className="group flex flex-col items-center shrink-0 min-w-[70px] sm:flex-1 relative"
                  >
                    <div
                      className={`relative flex w-full max-w-[32px] items-end justify-center rounded-t-lg border transition-all duration-300 ${gradientClass}`}
                      style={{
                        height: b.height,
                      }}
                    >
                      {/* Floating Tooltip */}
                      <span className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity duration-200 select-none pointer-events-none bg-card border border-border px-1.5 py-0.5 rounded-md shadow-md text-[9px] font-bold text-foreground whitespace-nowrap z-20">
                        {currency(b.value)}
                      </span>
                    </div>

                    {/* Period Label */}
                    <span
                      className={`absolute top-full mt-2 text-[10px] font-bold tracking-tight transition-colors ${
                        b.active
                          ? 'text-accent-color'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {b.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="sm:w-[190px] shrink-0 border-l border-border/40 sm:pl-5 pt-4 sm:pt-0">
          <div className="flex items-start gap-2 select-none">
            <TrendingUp className="mt-0.5 size-4 text-accent-color" />

            <p className="text-[11px] font-bold leading-none uppercase tracking-wider text-muted-foreground">
              Total revenue
              <br />
              <span className="text-[10px] font-semibold text-muted-foreground/80 lowercase italic">
                {PERIOD_LABELS[period].toLowerCase()}
              </span>
            </p>
          </div>

          <p className="mt-5 text-[28px] font-bold tracking-tight text-foreground tabular-nums">
            {currency(totalRevenue)}
          </p>

          <p className="mt-1.5 text-[10px] font-bold text-muted-foreground select-none">
            {bars.length} periods tracked
          </p>
        </div>
      </div>
    </section>
  );
}