'use client';

import { ChevronDown } from 'lucide-react';

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

import {
  asNumber,
  type Decimal,
} from '@/utils/api';

interface DealsBySourceItem {
  source: string;
  count: number;
  percentage: Decimal;
  revenue: Decimal;
}

const SOURCE_COLORS = [
  'var(--status-success-strong)',
  'var(--accent-muted)',
  'var(--accent-color)',
  'var(--status-warning-text)',
  'var(--chart-1)',
  'var(--status-danger-text)',
  'var(--chart-5)',
];

type ReportPeriod =
  | 'week'
  | 'month'
  | 'quarter'
  | 'year';

interface SalesActivityNewProps {
  dealsBySource: DealsBySourceItem[];
  period: ReportPeriod;
  onPeriodChange: (
    period: ReportPeriod
  ) => void;
}

export function SalesActivityNew({
  dealsBySource,
  period,
  onPeriodChange,
}: SalesActivityNewProps) {
  const totalDeals = dealsBySource.reduce(
    (sum, item) =>
      sum + Number(item.count || 0),
    0
  );

  const chartData = dealsBySource.map(
    (item, i) => ({
      name: item.source || 'Unknown',
      value: Number(item.count || 0),
      revenue: asNumber(item.revenue) || 0,
      color:
        SOURCE_COLORS[
          i % SOURCE_COLORS.length
        ],
    })
  );

  const currency = (n: number) =>
    n.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    });

  return (
    <section className="bg-card border border-border rounded-2xl p-[var(--space-4)] space-y-[var(--space-3)] shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Deals by Source
        </h3>

        <div className="relative">
          <select
            value={period}
            onChange={(e) =>
              onPeriodChange(
                e.target.value as ReportPeriod
              )
            }
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

      <div className="mt-4 flex items-center gap-4">
        <div className="relative h-[230px] flex-1">
          {chartData.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-muted-foreground">
                No source data
              </p>
            </div>
          ) : (
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  startAngle={210}
                  endAngle={-30}
                  innerRadius="66%"
                  outerRadius="100%"
                  paddingAngle={3}
                  cornerRadius={10}
                  stroke="none"
                  isAnimationActive={false}
                >
                  {chartData.map((d) => (
                    <Cell
                      key={d.name}
                      fill={d.color}
                    />
                  ))}
                </Pie>

                <Tooltip
                  formatter={(value) => [
                    `${Number(value || 0)} deals`,
                    'Deals',
                  ]}
                  labelFormatter={(label) =>
                    String(label)
                  }
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    background: 'var(--card)',
                    color: 'var(--foreground)',
                    boxShadow:
                      '0 8px 24px -12px rgba(20,20,40,0.35)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-2">
            <p className="text-[34px] font-bold tracking-tight text-foreground">
              {totalDeals.toLocaleString('en-IN')}
            </p>

            <p className="text-xs text-muted-foreground">
              Total deals
            </p>
          </div>
        </div>

        <ul className="w-[160px] space-y-5">
          {chartData.map((d) => (
            <li key={d.name}>
              <p className="text-[26px] font-bold leading-none tracking-tight text-foreground">
                {d.value}
              </p>

              <p className="mt-1.5 flex items-center gap-2 text-[13px] text-muted-foreground">
                <span
                  className="size-2.5 rounded-full"
                  style={{
                    backgroundColor: d.color,
                  }}
                />

                {d.name}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}