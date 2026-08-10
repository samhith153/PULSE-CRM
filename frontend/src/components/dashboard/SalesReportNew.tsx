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
            40,
            (value / maxRevenue) * 180
          )
        : 40;

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
    <section className="card-surface p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[15px] font-bold text-foreground">
            Revenue Trend
          </h3>

          <span
            className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${
              growthPct >= 0
                ? 'bg-mint text-mint-foreground'
                : 'bg-rose-soft text-rose-foreground'
            }`}
          >
            {growthPct >= 0 ? (
              <MoveUpRight className="size-2.5" />
            ) : (
              <MoveDownRight className="size-2.5" />
            )}

            {growthPct >= 0 ? '+' : ''}
            {growthPct.toFixed(1)}%

            <span className="ml-1 font-normal">
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
              className="cursor-pointer appearance-none bg-transparent pr-6 text-[12px] font-semibold text-muted-foreground outline-none"
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

      <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-end">
        <div className="flex flex-1 items-end gap-4">
          {bars.length === 0 ? (
            <p className="py-8 text-sm text-muted-foreground">
              No revenue data available
            </p>
          ) : (
            bars.map((b, index) => (
              <div
                key={b.originalPeriod}
                className="flex flex-1 flex-col items-center"
              >
                <div
                  title={`${b.originalPeriod}: ${currency(
                    b.value
                  )}`}
                  className={`relative flex w-full max-w-[62px] items-start justify-center rounded-2xl ${b.className}`}
                  style={{
                    height: b.height,
                  }}
                >
                  <span className="mt-2 inline-flex items-center gap-0.5 rounded-full bg-card/90 px-1.5 py-1 text-[10px] font-semibold text-foreground">
                    {b.value >=
                    (bars[index - 1]?.value ??
                      0) ? (
                      <MoveUpRight className="size-2.5" />
                    ) : (
                      <MoveDownRight className="size-2.5" />
                    )}

                    {currency(b.value)}
                  </span>
                </div>

                <span
                  className={`mt-3 text-[13px] font-semibold ${
                    b.active
                      ? 'text-brand'
                      : 'text-muted-foreground'
                  }`}
                >
                  {b.label}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="sm:w-[190px]">
          <div className="flex items-start gap-2">
            <TrendingUp className="mt-1 size-5 text-brand" />

            <p className="text-[13px] font-medium leading-snug text-muted-foreground">
              Total revenue
              <br />
              {PERIOD_LABELS[period].toLowerCase()}
            </p>
          </div>

          <p className="mt-8 text-[30px] font-extrabold tracking-tight">
            {currency(totalRevenue)}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            {bars.length} periods
          </p>
        </div>
      </div>
    </section>
  );
}