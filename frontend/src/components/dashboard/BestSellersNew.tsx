import { MoreVertical, MoveUpRight } from 'lucide-react';
import { asNumber, type Decimal } from '@/utils/api';

interface DealsByStageItem {
  stage: string;
  count: number;
  percentage: Decimal;
  conversion_rate: Decimal;
}

const STAGE_COLORS: Record<string, string> = {
  'Lead': 'bg-sky-100 text-sky-700',
  'Qualified': 'bg-violet-100 text-violet-700',
  'Proposal': 'bg-amber-100 text-amber-700',
  'Negotiation': 'bg-orange-100 text-orange-700',
  'Closed Won': 'bg-emerald-100 text-emerald-700',
  'Closed Lost': 'bg-rose-100 text-rose-700',
  'Discovery': 'bg-cyan-100 text-cyan-700',
};

function getStageColor(stage: string): string {
  return STAGE_COLORS[stage] || 'bg-gray-100 text-gray-700';
}

function getInitials(stage: string): string {
  return stage.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export function BestSellersNew({ dealsByStage }: { dealsByStage: DealsByStageItem[] }) {
  return (
    <section className="card-surface p-6">
      <div className="flex items-center gap-3">
        <h2 className="text-[19px] font-bold tracking-tight">Deals by Stage</h2>
        <button
          aria-label="More options"
          className="ml-auto grid size-9 place-items-center rounded-full"
        >
          <MoreVertical className="size-4 text-muted-foreground" />
        </button>
      </div>

      <table className="mt-5 w-full border-collapse text-left">
        <thead>
          <tr className="bg-muted text-xs text-muted-foreground">
            <th className="rounded-l-xl px-4 py-3 font-medium">Stage</th>
            <th className="px-4 py-3 text-center font-medium">Deals</th>
            <th className="rounded-r-xl px-4 py-3 text-right font-medium">Conversion</th>
          </tr>
        </thead>
        <tbody>
          {dealsByStage.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-4 py-8 text-center text-sm text-muted-foreground">
                No stage data available
              </td>
            </tr>
          ) : (
            dealsByStage.map((s) => (
              <tr key={s.stage} className="border-b border-border last:border-0">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <span className={`grid size-10 place-items-center rounded-full text-xs font-bold ${getStageColor(s.stage)}`}>
                      {getInitials(s.stage)}
                    </span>
                    <div className="leading-tight">
                      <p className="text-[15px] font-bold">{s.stage}</p>
                      <p className="text-xs text-muted-foreground">{s.count} deals</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className="inline-flex items-center gap-1 rounded-full bg-mint px-2 py-1 text-[11px] font-semibold text-mint-foreground">
                    <MoveUpRight className="size-3" />
                    {s.count}
                  </span>
                </td>
                <td className="px-4 py-4 text-right text-[15px] font-semibold">
                  {asNumber(s.percentage)?.toFixed(1) || '0.0'}%
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </section>
  );
}
