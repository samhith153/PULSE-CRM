import { ChevronDown, MoreVertical, TrendingUp, MoveUpRight, MoveDownRight } from 'lucide-react';
import { asNumber, type Decimal } from '@/utils/api';

interface RevenueTrendItem {
  period: string;
  revenue: Decimal;
}

const STAGE_COLORS = ['bg-lime', 'bg-brand-soft', 'bg-brand', 'bg-linear-to-b from-brand-soft to-lime-soft'];

export function SalesReportNew({ revenueTrend }: { revenueTrend: RevenueTrendItem[] }) {
  const maxRevenue = revenueTrend.reduce((max, item) => Math.max(max, asNumber(item.revenue) || 0), 0);

  const bars = revenueTrend.map((item, i) => {
    const value = asNumber(item.revenue) || 0;
    const height = maxRevenue > 0 ? Math.max(40, (value / maxRevenue) * 180) : 40;
    return {
      label: item.period,
      height,
      className: STAGE_COLORS[i % STAGE_COLORS.length],
      value,
      active: i === revenueTrend.length - 1,
    };
  });

  const totalRevenue = bars.reduce((sum, b) => sum + b.value, 0);
  const lastMonth = bars.length > 1 ? bars[bars.length - 2]?.value : 0;
  const currentMonth = bars.length > 0 ? bars[bars.length - 1]?.value : 0;
  const growthPct = lastMonth > 0 ? ((currentMonth - lastMonth) / lastMonth * 100) : 0;

  const currency = (n: number) =>
    n.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

  return (
    <section className="card-surface p-6">
      <div className="flex items-start gap-3">
        <div>
          <h2 className="text-[19px] font-bold tracking-tight">Revenue Trend</h2>
          <div className="mt-2 flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${growthPct >= 0 ? 'bg-mint text-mint-foreground' : 'bg-rose-soft text-rose-foreground'}`}>
              {growthPct >= 0 ? <MoveUpRight className="size-3" /> : <MoveDownRight className="size-3" />}
              {growthPct >= 0 ? '+' : ''}{growthPct.toFixed(1)}%
            </span>
            <span className="text-xs text-muted-foreground">vs last period</span>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 rounded-full bg-muted px-4 py-2 text-[13px] font-semibold">
            Monthly <ChevronDown className="size-3.5" />
          </button>
          <button aria-label="More options" className="grid size-9 place-items-center rounded-full">
            <MoreVertical className="size-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-end">
        <div className="flex flex-1 items-end gap-4">
          {bars.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8">No revenue data available</p>
          ) : (
            bars.map((b) => (
              <div key={b.label} className="flex flex-1 flex-col items-center">
                <div
                  className={`relative flex w-full max-w-[62px] items-start justify-center rounded-2xl ${b.className}`}
                  style={{ height: b.height }}
                >
                  <span className="mt-2 inline-flex items-center gap-0.5 rounded-full bg-card/90 px-1.5 py-1 text-[10px] font-semibold text-foreground">
                    {b.value >= (bars[bars.indexOf(b) - 1]?.value ?? 0) ? (
                      <MoveUpRight className="size-2.5" />
                    ) : (
                      <MoveDownRight className="size-2.5" />
                    )}
                    {currency(b.value)}
                  </span>
                </div>
                <span
                  className={`mt-3 text-[13px] font-semibold ${b.active ? 'text-brand' : 'text-muted-foreground'}`}
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
              this period
            </p>
          </div>
          <p className="mt-8 text-[30px] font-extrabold tracking-tight">{currency(totalRevenue)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{bars.length} periods</p>
        </div>
      </div>
    </section>
  );
}
