'use client';

import { ChevronDown } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'On Process', value: 45, color: 'var(--lime)' },
  { name: 'Canceled', value: 23, color: 'var(--brand-soft)' },
  { name: 'Delivered', value: 32, color: 'var(--brand)' },
];

export function SalesActivityNew() {
  return (
    <section className="card-surface p-6">
      <div className="flex items-center gap-3">
        <h2 className="text-[19px] font-bold tracking-tight">Sales Activity</h2>
        <button className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-muted px-4 py-2 text-[13px] font-semibold">
          Monthly <ChevronDown className="size-3.5" />
        </button>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <div className="relative h-[230px] flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
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
                {data.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-2">
            <p className="text-[34px] font-extrabold tracking-tight">786K</p>
            <p className="text-xs text-muted-foreground">Total sell count</p>
          </div>
        </div>

        <ul className="w-[130px] space-y-5">
          {data.map((d) => (
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
