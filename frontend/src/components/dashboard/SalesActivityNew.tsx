'use client';

import { ChevronDown } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { asNumber, type Decimal } from '@/utils/api';

interface DealsBySourceItem {
  source: string;
  count: number;
  percentage: Decimal;
  revenue: Decimal;
}

const SOURCE_COLORS = [
  'var(--lime)',
  'var(--brand-soft)',
  'var(--brand)',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
];

export function SalesActivityNew({ dealsBySource }: { dealsBySource: DealsBySourceItem[] }) {
  const totalDeals = dealsBySource.reduce((sum, item) => sum + item.count, 0);

  const chartData = dealsBySource.map((item, i) => ({
    name: item.source || 'Unknown',
    value: item.count,
    color: SOURCE_COLORS[i % SOURCE_COLORS.length],
  }));

  const currency = (n: number) =>
    n.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

  return (
    <section className="card-surface p-6">
      <div className="flex items-center gap-3">
        <h2 className="text-[19px] font-bold tracking-tight">Deals by Source</h2>
        <button className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-muted px-4 py-2 text-[13px] font-semibold">
          Monthly <ChevronDown className="size-3.5" />
        </button>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <div className="relative h-[230px] flex-1">
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-muted-foreground">No source data</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
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
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-2">
            <p className="text-[34px] font-extrabold tracking-tight">{totalDeals.toLocaleString('en-IN')}</p>
            <p className="text-xs text-muted-foreground">Total deals</p>
          </div>
        </div>

        <ul className="w-[160px] space-y-5">
          {chartData.map((d) => (
            <li key={d.name}>
              <p className="text-[26px] font-extrabold leading-none tracking-tight">{d.value}</p>
              <p className="mt-1.5 flex items-center gap-2 text-[13px] text-muted-foreground">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                {d.name}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
