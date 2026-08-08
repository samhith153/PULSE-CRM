import { MoreVertical } from 'lucide-react';

const countries = [
  { flag: '🇺🇸', name: 'USA', value: '27%' },
  { flag: '🇦🇺', name: 'Australia', value: '14%' },
  { flag: '🇮🇹', name: 'Italy', value: '35%' },
  { flag: '🇯🇵', name: 'Japan', value: '24%' },
];

export function OrdersByCountryNew() {
  return (
    <section className="card-surface relative overflow-hidden p-6">
      <div className="flex items-center gap-3">
        <h2 className="text-[19px] font-bold tracking-tight">Most Order by Country</h2>
        <button
          aria-label="More options"
          className="ml-auto grid size-9 place-items-center rounded-full"
        >
          <MoreVertical className="size-4 text-muted-foreground" />
        </button>
      </div>

      <div className="relative mt-4">
        {/* dotted world-map texture */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -bottom-6 top-6 opacity-60"
          style={{
            backgroundImage: 'radial-gradient(var(--brand-soft) 1.6px, transparent 1.6px)',
            backgroundSize: '14px 14px',
            maskImage:
              'radial-gradient(120% 80% at 40% 50%, black 30%, transparent 75%)',
            WebkitMaskImage:
              'radial-gradient(120% 80% at 40% 50%, black 30%, transparent 75%)',
          }}
        />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-[32px] font-extrabold tracking-tight text-brand">$4256</p>
            <p className="mt-1 text-xs text-muted-foreground">International Transaction</p>
            <span className="mt-8 flex size-3 items-center justify-center rounded-full bg-destructive/25">
              <span className="size-1.5 rounded-full bg-destructive" />
            </span>
          </div>

          <ul className="w-[190px] space-y-3 rounded-2xl bg-card/90 p-4 shadow-[0_8px_24px_-16px_rgba(20,20,40,0.35)] backdrop-blur">
            {countries.map((c) => (
              <li key={c.name} className="flex items-center gap-3 text-[13px]">
                <span className="text-base leading-none">{c.flag}</span>
                <span className="font-semibold">{c.name}</span>
                <span className="ml-auto text-muted-foreground">{c.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
