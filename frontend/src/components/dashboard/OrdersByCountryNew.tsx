'use client';

import { useState } from 'react';
import { MoreVertical } from 'lucide-react';

import {
  asNumber,
  type Decimal,
} from '@/utils/api';

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

export function OrdersByCountryNew({
  keyMetrics,
}: {
  keyMetrics: KeyMetrics;
}) {
  const [menuOpen, setMenuOpen] =
    useState(false);

  const openDeals =
    keyMetrics?.open_deals || 0;

  const pipelineValue =
    asNumber(
      keyMetrics?.pipeline_value
    ) || 0;

  const dealsCreated =
    keyMetrics?.deals_created || 0;

  const dealsLost =
    keyMetrics?.deals_lost || 0;

  const activitiesLogged =
    keyMetrics?.activities_logged || 0;

  const pipelineGrowth =
    asNumber(
      keyMetrics?.pipeline_value_growth_pct
    ) || 0;

  const currency = (n: number) =>
    n.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    });

  const metrics = [
    {
      label: 'Open Deals',
      value:
        openDeals.toLocaleString(
          'en-IN'
        ),
      icon: '🟢',
    },
    {
      label: 'Deals Created',
      value:
        dealsCreated.toLocaleString(
          'en-IN'
        ),
      icon: '📈',
    },
    {
      label: 'Deals Lost',
      value:
        dealsLost.toLocaleString(
          'en-IN'
        ),
      icon: '📉',
    },
    {
      label: 'Activities',
      value:
        activitiesLogged.toLocaleString(
          'en-IN'
        ),
      icon: '⚡',
    },
  ];

  const exportMetrics = () => {
    const rows = [
      ['Metric', 'Value'],
      [
        'Pipeline Value',
        String(pipelineValue),
      ],
      [
        'Pipeline Growth %',
        String(pipelineGrowth),
      ],
      [
        'Open Deals',
        String(openDeals),
      ],
      [
        'Deals Created',
        String(dealsCreated),
      ],
      [
        'Deals Lost',
        String(dealsLost),
      ],
      [
        'Activities',
        String(activitiesLogged),
      ],
    ];

    const csv = rows
      .map((row) =>
        row
          .map(
            (value) =>
              `"${value.replace(/"/g, '""')}"`
          )
          .join(',')
      )
      .join('\n');

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    });

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement('a');

    link.href = url;
    link.download =
      'key-metrics.csv';

    link.click();

    URL.revokeObjectURL(url);
    setMenuOpen(false);
  };

  return (
    <section className="bg-card border border-border rounded-2xl p-[var(--space-4)] space-y-[var(--space-3)] shadow-sm relative overflow-hidden">
      <div className="flex items-start justify-between">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Key Metrics
        </h3>

        <div className="relative">
          <button
            type="button"
            aria-label="Key metrics options"
            onClick={() =>
              setMenuOpen((open) => !open)
            }
            className="rounded-md p-1 text-muted-foreground hover:bg-secondary cursor-pointer"
          >
            <MoreVertical className="size-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-7 z-50 w-32 rounded-lg border border-border bg-card p-1 shadow-lg">
              <button
                type="button"
                onClick={exportMetrics}
                className="w-full rounded-md px-3 py-2 text-left text-xs font-medium hover:bg-secondary cursor-pointer text-foreground"
              >
                Export
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  window.location.href =
                    '/dashboard/deals';
                }}
                className="w-full rounded-md px-3 py-2 text-left text-xs font-medium hover:bg-secondary cursor-pointer text-foreground"
              >
                View
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="relative mt-4">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -bottom-6 top-6 opacity-60"
          style={{
            backgroundImage:
              'radial-gradient(var(--accent-muted) 1.6px, transparent 1.6px)',
            backgroundSize: '14px 14px',
            maskImage:
              'radial-gradient(120% 80% at 40% 50%, black 30%, transparent 75%)',
            WebkitMaskImage:
              'radial-gradient(120% 80% at 40% 50%, black 30%, transparent 75%)',
          }}
        />

        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-[32px] font-bold tracking-tight text-foreground">
              {currency(
                pipelineValue
              )}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Pipeline Value
            </p>

            <span
              className={`mt-2 inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                pipelineGrowth >= 0
                  ? 'bg-status-success-bg text-status-success-text border-status-success-text/20'
                  : 'bg-status-danger-bg text-status-danger-text border-status-danger-text/20'
              }`}
            >
              {pipelineGrowth >= 0
                ? '+'
                : ''}
              {pipelineGrowth.toFixed(
                1
              )}
              %
            </span>
          </div>

          <ul className="w-[200px] shrink-0 space-y-3 rounded-xl border border-border bg-secondary/15 p-4 select-none">
            {metrics.map((m) => (
              <li
                key={m.label}
                className="flex items-center gap-3 text-[13px] text-foreground"
              >
                <span className="text-base leading-none">
                  {m.icon}
                </span>

                <span className="font-semibold">
                  {m.label}
                </span>

                <span className="ml-auto text-muted-foreground">
                  {m.value}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}