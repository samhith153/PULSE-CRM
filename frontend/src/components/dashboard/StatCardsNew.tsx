'use client';

import { ArrowUpRight, MoveUpRight, MoveDownRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useCountUp, useReveal } from '@/hooks/use-reveal';

function Delta({ value, negative }: { value: string; negative?: boolean }) {
  const Icon = negative ? MoveDownRight : MoveUpRight;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold',
        negative ? 'bg-status-danger/10 text-rose-foreground' : 'bg-mint text-mint-foreground',
      )}
    >
      <Icon className="size-3" />
      {value}
    </span>
  );
}

function NotchBadge({ filled, inView }: { filled: boolean; inView: boolean }) {
  return (
    <span className="pointer-events-none absolute right-5 top-5 z-[2] translate-x-1/2 -translate-y-1/2">
      <span
        className={cn(
          'reveal-badge grid size-10 place-items-center rounded-full',
          inView && 'is-in',
          filled
            ? 'bg-surface-1 text-brand ring-1 ring-brand-soft/70'
            : 'bg-surface-1 text-text-primary ring-1 ring-border',
        )}
        style={{ transitionDelay: inView ? '150ms' : '0ms' }}
      >
        <ArrowUpRight className="badge-arrow size-[18px]" strokeWidth={2.4} />
      </span>
    </span>
  );
}

type StatCardProps = {
  index: number;
  className?: string;
  filledBadge?: boolean;
  children: (inView: boolean) => React.ReactNode;
};

function StatCard({ index, className, filledBadge, children }: StatCardProps) {
  const { ref, inView } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className="stat-shell relative h-full"
      style={{ transitionDelay: `${index * 90}ms` }}
    >
      <div
        className={cn('stat-card reveal h-full p-5 pt-8', inView && 'is-in', className)}
        style={{ transitionDelay: `${index * 90}ms` }}
      >
        {children(inView)}
      </div>

      <NotchBadge filled={!!filledBadge} inView={inView} />
    </div>
  );
}

function CountUp({
  value,
  active,
  format,
  className,
}: {
  value: number;
  active: boolean;
  format: (n: number) => string;
  className?: string;
}) {
  const current = useCountUp(value, active);
  return <p className={className}>{format(current)}</p>;
}

const currency = (n: number, decimals = 0) =>
  n.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

function formatDelta(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? '+100%' : '0%';
  const pct = ((current - previous) / previous) * 100;
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}

interface StatCardsNewProps {
  revenue: number;
  revenueGrowth: number;
  wonDeals: number;
  dealsGrowth: number;
  winRate: number;
  winRateGrowth: number;
  avgDealSize: number;
  avgDealGrowth: number;
}

export default function StatCardsNew({
  revenue,
  revenueGrowth,
  wonDeals,
  dealsGrowth,
  winRate,
  winRateGrowth,
  avgDealSize,
  avgDealGrowth,
}: StatCardsNewProps) {
  const winRateDelta = formatDelta(winRate, winRate - winRateGrowth);
  const avgDealDelta = formatDelta(avgDealSize, avgDealSize - avgDealGrowth);
  const wonDealsDelta = formatDelta(wonDeals, wonDeals - dealsGrowth);

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {/* Total Revenue — highlighted */}
      <StatCard
        index={0}
        filledBadge
        className="overflow-hidden bg-brand text-surface-0"
      >
        {(inView) => (
          <>
            <span className="shimmer" />
            <span className="pointer-events-none absolute -right-10 -top-16 size-48 rounded-full bg-white/10" />
            <span className="pointer-events-none absolute -bottom-24 -left-8 size-56 rounded-full bg-white/5" />
            <p className="relative text-[15px] font-semibold text-surface-0/90">
              Total Revenue
            </p>
            <div className="relative mt-8 flex items-center gap-2">
              <CountUp
                value={revenue}
                active={inView}
                format={(n) => currency(n, 2)}
                className="text-[26px] font-extrabold tracking-tight tabular-nums"
              />
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-1 text-[11px] font-semibold">
                {revenueGrowth >= 0 ? (
                  <MoveUpRight className="size-3" />
                ) : (
                  <MoveDownRight className="size-3" />
                )}
                {formatDelta(revenue, revenue - revenueGrowth)}
              </span>
            </div>
            <p className="relative mt-3 text-xs text-surface-0/75">
              vs last month {currency(revenue - revenueGrowth, 2)}
            </p>
          </>
        )}
      </StatCard>

      {/* Won Deals */}
      <StatCard index={1} className="card-surface">
        {(inView) => (
          <>
            <p className="text-[15px] font-semibold">Won Deals</p>
            <div className="mt-8 flex items-center gap-2">
              <CountUp
                value={wonDeals}
                active={inView}
                format={(n) => `${Math.round(n)}`}
                className="text-[26px] font-extrabold tracking-tight tabular-nums"
              />
              <Delta value={wonDealsDelta} />
            </div>
            <p className="mt-3 text-xs text-text-muted">
              vs last month {Math.max(0, wonDeals - Math.round(dealsGrowth))} deals
            </p>
          </>
        )}
      </StatCard>

      {/* Win Rate */}
      <StatCard index={2} className="card-surface">
        {(inView) => (
          <>
            <p className="text-[15px] font-semibold">Win Rate</p>
            <div className="mt-8 flex items-center gap-2">
              <CountUp
                value={winRate}
                active={inView}
                format={(n) => `${n.toFixed(1)}%`}
                className="text-[26px] font-extrabold tracking-tight tabular-nums"
              />
              <Delta value={winRateDelta} />
            </div>
            <p className="mt-3 text-xs text-text-muted">
              vs last month {(winRate - winRateGrowth).toFixed(1)}%
            </p>
          </>
        )}
      </StatCard>

      {/* Average Deal Size */}
      <StatCard index={3} className="card-surface overflow-hidden">
        {(inView) => (
          <>
            <p className="text-[15px] font-semibold">Avg Deal Size</p>
            <div className="mt-8 flex items-center gap-2">
              <CountUp
                value={avgDealSize}
                active={inView}
                format={(n) => currency(n, 0)}
                className="text-[26px] font-extrabold tracking-tight tabular-nums text-brand"
              />
              <Delta value={avgDealDelta} />
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[62px]">
              <svg
                viewBox="0 0 320 80"
                preserveAspectRatio="none"
                className="absolute inset-0 h-full w-full"
              >
                <defs>
                  <linearGradient id="marginFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="var(--lime)" stopOpacity="0.14" />
                  </linearGradient>
                </defs>
                <path
                  d="M0 62 C 14 58 22 40 34 42 C 46 44 52 62 64 60 C 76 58 82 30 96 34 C 110 38 114 56 128 52 C 142 48 148 22 162 26 C 176 30 180 50 194 46 C 208 42 214 18 228 22 C 242 26 248 44 262 40 C 276 36 282 14 296 16 C 306 17 312 24 320 20 L320 80 L0 80 Z"
                  fill="url(#marginFill)"
                  className={cn('spark-fill', inView && 'is-in')}
                />
                <path
                  d="M0 62 C 14 58 22 40 34 42 C 46 44 52 62 64 60 C 76 58 82 30 96 34 C 110 38 114 56 128 52 C 142 48 148 22 162 26 C 176 30 180 50 194 46 C 208 42 214 18 228 22 C 242 26 248 44 262 40 C 276 36 282 14 296 16 C 306 17 312 24 320 20"
                  fill="none"
                  stroke="var(--brand-deep)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  className={cn('spark-line', inView && 'is-in')}
                  style={{ '--spark-len': 420 } as React.CSSProperties}
                />
              </svg>
            </div>
          </>
        )}
      </StatCard>
    </div>
  );
}
