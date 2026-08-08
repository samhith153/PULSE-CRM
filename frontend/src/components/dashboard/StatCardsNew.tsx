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
        negative ? 'bg-rose-soft text-rose-foreground' : 'bg-mint text-mint-foreground',
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
            ? 'bg-card text-brand ring-1 ring-brand-soft/70'
            : 'bg-card text-foreground ring-1 ring-border',
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
  n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

export default function StatCardsNew() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {/* Total Profit — highlighted */}
      <StatCard
        index={0}
        filledBadge
        className="overflow-hidden bg-brand text-primary-foreground"
      >
        {(inView) => (
          <>
            <span className="shimmer" />
            <span className="pointer-events-none absolute -right-10 -top-16 size-48 rounded-full bg-white/10" />
            <span className="pointer-events-none absolute -bottom-24 -left-8 size-56 rounded-full bg-white/5" />
            <p className="relative text-[15px] font-semibold text-primary-foreground/90">
              Total Profit
            </p>
            <div className="relative mt-8 flex items-center gap-2">
              <CountUp
                value={14813.1}
                active={inView}
                format={(n) => currency(n, 2)}
                className="text-[26px] font-extrabold tracking-tight tabular-nums"
              />
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-1 text-[11px] font-semibold">
                <MoveUpRight className="size-3" />
                +3.9%
              </span>
            </div>
            <p className="relative mt-3 text-xs text-primary-foreground/75">
              vs last month $12.534.00
            </p>
          </>
        )}
      </StatCard>

      {/* Total Insight */}
      <StatCard index={1} className="card-surface">
        {(inView) => (
          <>
            <p className="text-[15px] font-semibold">Total Insight</p>
            <div className="mt-8 flex items-center gap-2">
              <CountUp
                value={122380}
                active={inView}
                format={(n) => currency(n)}
                className="text-[26px] font-extrabold tracking-tight tabular-nums"
              />
              <Delta value="+4.2%" />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">vs last month $119.53</p>
          </>
        )}
      </StatCard>

      {/* Organic Sales */}
      <StatCard index={2} className="card-surface">
        {(inView) => (
          <>
            <p className="text-[15px] font-semibold">Organic Sales</p>
            <div className="mt-8 flex items-center gap-2">
              <CountUp
                value={98.1}
                active={inView}
                format={(n) => `$${n.toFixed(1).replace('.', ',')}M`}
                className="text-[26px] font-extrabold tracking-tight tabular-nums"
              />
              <Delta value="-2.8%" negative />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">vs last month $2.8M</p>
          </>
        )}
      </StatCard>

      {/* Gross Margin */}
      <StatCard index={3} className="card-surface overflow-hidden">
        {(inView) => (
          <>
            <p className="text-[15px] font-semibold">Gross Margin</p>
            <div className="mt-8 flex items-center gap-2">
              <CountUp
                value={72}
                active={inView}
                format={(n) => `${Math.round(n)}%`}
                className="text-[26px] font-extrabold tracking-tight tabular-nums text-brand"
              />
              <Delta value="+4.2%" />
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
