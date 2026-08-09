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

interface DealsByStageItem {
  stage: string;
  count: number;
  percentage: Decimal;
  conversion_rate: Decimal;
}

interface BestSellersNewProps {
  dealsByStage: DealsByStageItem[];
}

const STAGE_CONFIG: Record<
  string,
  {
    label: string;
    className: string;
  }
> = {
  lead: {
    label: 'Lead',
    className: 'bg-brand-soft',
  },

  open: {
    label: 'Open',
    className: 'bg-brand',
  },

  qualified: {
    label: 'Qualified',
    className: 'bg-lime',
  },

  proposal: {
    label: 'Proposal',
    className: 'bg-brand-soft',
  },

  negotiation: {
    label: 'Negotiation',
    className: 'bg-brand',
  },

  won: {
    label: 'Won',
    className: 'bg-lime',
  },

  lost: {
    label: 'Lost',
    className: 'bg-rose-soft',
  },
};

function getStageConfig(stage: string) {
  const normalized = stage
    .toLowerCase()
    .trim();

  return (
    STAGE_CONFIG[normalized] || {
      label:
        stage.charAt(0).toUpperCase() +
        stage.slice(1),
      className: 'bg-brand-soft',
    }
  );
}

export function BestSellersNew({
  dealsByStage,
}: BestSellersNewProps) {
  const totalDeals =
    dealsByStage.reduce(
      (sum, item) =>
        sum + Number(item.count || 0),
      0
    );

  const totalPercentage =
    dealsByStage.reduce(
      (sum, item) =>
        sum +
        (asNumber(item.percentage) || 0),
      0
    );

  const wonStage =
    dealsByStage.find(
      (item) =>
        item.stage?.toLowerCase() ===
        'won'
    );

  const wonDeals =
    Number(wonStage?.count || 0);

  const winRate =
    totalDeals > 0
      ? (wonDeals / totalDeals) * 100
      : 0;

  const sortedStages = [
    ...dealsByStage,
  ].sort(
    (a, b) =>
      Number(b.count || 0) -
      Number(a.count || 0)
  );

  return (
    <section className="card-surface p-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-[15px] font-bold text-foreground">
            Deals by Stage
          </h3>

          <p className="mt-1 text-xs text-muted-foreground">
            Current pipeline distribution
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
            {totalDeals} deals
          </span>

          <ChevronDown className="size-4 text-muted-foreground" />
        </div>
      </div>

      {/* Summary */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border/70 bg-background p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Total Deals
          </p>

          <p className="mt-2 text-2xl font-extrabold tracking-tight">
            {totalDeals}
          </p>
        </div>

        <div className="rounded-xl border border-border/70 bg-background p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Won Deals
          </p>

          <div className="mt-2 flex items-center gap-2">
            <p className="text-2xl font-extrabold tracking-tight">
              {wonDeals}
            </p>

            {wonDeals > 0 ? (
              <MoveUpRight className="size-4 text-brand" />
            ) : (
              <MoveDownRight className="size-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </div>

      {/* Stage distribution */}
      <div className="mt-6">
        {sortedStages.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <TrendingUp className="mx-auto size-6 text-muted-foreground" />

            <p className="mt-2 text-sm font-semibold text-foreground">
              No deal data
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Deal stage information will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedStages.map((item) => {
              const count =
                Number(item.count || 0);

              const percentage =
                asNumber(item.percentage) ||
                0;

              const config =
                getStageConfig(item.stage);

              const conversionRate =
                asNumber(
                  item.conversion_rate
                ) || 0;

              return (
                <div
                  key={item.stage}
                  className="space-y-2"
                  title={`${config.label}: ${count} deals • ${percentage.toFixed(
                    1
                  )}% • Conversion ${conversionRate.toFixed(
                    1
                  )}%`}
                >
                  {/* Label row */}
                  <div className="flex items-center justify-between">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className={`size-2.5 shrink-0 rounded-full ${config.className}`}
                      />

                      <span className="truncate text-[13px] font-semibold text-foreground">
                        {config.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-bold text-foreground">
                        {count}
                      </span>

                      <span className="text-[11px] text-muted-foreground">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${config.className}`}
                      style={{
                        width: `${Math.min(
                          Math.max(
                            percentage,
                            count > 0
                              ? 3
                              : 0
                          ),
                          100
                        )}%`,
                      }}
                    />
                  </div>

                  {/* Conversion */}
                  <div className="flex justify-end">
                    <span className="text-[10px] text-muted-foreground">
                      Conversion:{' '}
                      {conversionRate.toFixed(
                        1
                      )}
                      %
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {sortedStages.length > 0 && (
        <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
          <div>
            <p className="text-[11px] text-muted-foreground">
              Pipeline distribution
            </p>

            <p className="mt-0.5 text-xs font-semibold text-foreground">
              {totalPercentage > 0
                ? `${totalPercentage.toFixed(
                    0
                  )}% accounted`
                : 'No distribution data'}
            </p>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-semibold text-brand">
            <TrendingUp className="size-3.5" />
            Live data
          </div>
        </div>
      )}
    </section>
  );
}