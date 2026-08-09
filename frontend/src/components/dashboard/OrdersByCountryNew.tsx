import { MoreVertical } from 'lucide-react';
import { asNumber, type Decimal } from '@/utils/api';

interface KeyMetrics {
  open_deals: number;
  pipeline_value: Decimal;
  deals_created: number;
  deals_lost: number;
  activities_logged: number;
  pipeline_value_growth_pct: Decimal;
  deals_created_growth_pct: Decimal;
  activities_growth_pct: Decimal;
}

export function OrdersByCountryNew({ keyMetrics }: { keyMetrics: KeyMetrics }) {
  const openDeals = keyMetrics?.open_deals || 0;
  const pipelineValue = asNumber(keyMetrics?.pipeline_value) || 0;
  const dealsCreated = keyMetrics?.deals_created || 0;
  const dealsLost = keyMetrics?.deals_lost || 0;
  const activitiesLogged = keyMetrics?.activities_logged || 0;
  const pipelineGrowth = asNumber(keyMetrics?.pipeline_value_growth_pct) || 0;

  const currency = (n: number) =>
    n.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

  const metrics = [
    { label: 'Open Deals', value: openDeals.toLocaleString('en-IN'), icon: '🟢' },
    { label: 'Deals Created', value: dealsCreated.toLocaleString('en-IN'), icon: '📈' },
    { label: 'Deals Lost', value: dealsLost.toLocaleString('en-IN'), icon: '📉' },
    { label: 'Activities', value: activitiesLogged.toLocaleString('en-IN'), icon: '⚡' },
  ];

  return (
    <section className="card-surface relative overflow-hidden p-6">
      <div className="flex items-center gap-3">
        <h2 className="text-[19px] font-bold tracking-tight">Key Metrics</h2>
        <button
          aria-label="More options"
          className="ml-auto grid size-9 place-items-center rounded-full"
        >
          <MoreVertical className="size-4 text-muted-foreground" />
        </button>
      </div>

      <div className="relative mt-4">
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
            <p className="text-[32px] font-extrabold tracking-tight text-brand">{currency(pipelineValue)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Pipeline Value</p>
            <span className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${pipelineGrowth >= 0 ? 'bg-mint text-mint-foreground' : 'bg-rose-soft text-rose-foreground'}`}>
              {pipelineGrowth >= 0 ? '+' : ''}{pipelineGrowth.toFixed(1)}%
            </span>
          </div>

          <ul className="w-[200px] space-y-3 rounded-2xl bg-card/90 p-4 shadow-[0_8px_24px_-16px_rgba(20,20,40,0.35)] backdrop-blur">
            {metrics.map((m) => (
              <li key={m.label} className="flex items-center gap-3 text-[13px]">
                <span className="text-base leading-none">{m.icon}</span>
                <span className="font-semibold">{m.label}</span>
                <span className="ml-auto text-muted-foreground">{m.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
