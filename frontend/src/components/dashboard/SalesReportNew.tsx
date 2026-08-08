import { ChevronDown, MoreVertical, TrendingUp, MoveUpRight } from 'lucide-react';

const bars = [
  { label: 'Profit', height: 130, className: 'bg-lime', badge: '+9.9%' },
  { label: 'Insight', height: 96, className: 'bg-brand-soft', badge: '+9.9%' },
  { label: 'Sale', height: 172, className: 'bg-brand', badge: '+9.9%', active: true },
  {
    label: 'Target',
    height: 110,
    className: 'bg-linear-to-b from-brand-soft to-lime-soft',
    badge: '+9.9%',
  },
];

export function SalesReportNew() {
  return (
    <section className="card-surface p-6">
      <div className="flex items-start gap-3">
        <div>
          <h2 className="text-[19px] font-bold tracking-tight">Sales Report Area</h2>
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-mint px-2 py-1 text-[11px] font-semibold text-mint-foreground">
              <MoveUpRight className="size-3" />
              +4.2%
            </span>
            <span className="text-xs text-muted-foreground">vs last years</span>
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
          {bars.map((b) => (
            <div key={b.label} className="flex flex-1 flex-col items-center">
              <div
                className={`relative flex w-full max-w-[62px] items-start justify-center rounded-2xl ${b.className}`}
                style={{ height: b.height }}
              >
                <span className="mt-2 inline-flex items-center gap-0.5 rounded-full bg-card/90 px-1.5 py-1 text-[10px] font-semibold text-foreground">
                  <MoveUpRight className="size-2.5" />
                  {b.badge}
                </span>
              </div>
              <span
                className={`mt-3 text-[13px] font-semibold ${b.active ? 'text-brand' : 'text-muted-foreground'}`}
              >
                {b.label}
              </span>
            </div>
          ))}
        </div>

        <div className="sm:w-[190px]">
          <div className="flex items-start gap-2">
            <TrendingUp className="mt-1 size-5 text-brand" />
            <p className="text-[13px] font-medium leading-snug text-muted-foreground">
              Target overflow
              <br />
              by $378 profit
            </p>
          </div>
          <p className="mt-8 text-[30px] font-extrabold tracking-tight">$2780</p>
          <p className="mt-1 text-xs text-muted-foreground">Per unit sales</p>
        </div>
      </div>
    </section>
  );
}
