import { ArrowUpRight, ArrowDownRight, TrendingUp, Trophy, Target, Activity } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useCountUp, useReveal } from '@/hooks/use-reveal';

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
  const { ref, inView } = useReveal<HTMLDivElement>();

  const winRateDelta = formatDelta(winRate, winRate - winRateGrowth);
  const avgDealDelta = formatDelta(avgDealSize, avgDealSize - avgDealGrowth);
  const wonDealsDelta = formatDelta(wonDeals, wonDeals - dealsGrowth);
  const revenueDelta = formatDelta(revenue, revenue - revenueGrowth);

  return (
    <div ref={ref} className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {/* Total Revenue */}
      <div className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-shadow relative overflow-hidden group space-y-3 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
            Total Revenue
          </p>
          <TrendingUp className="h-4 w-4 text-brand-purple" />
        </div>
        <div className="space-y-1">
          <CountUp
            value={revenue}
            active={inView}
            format={(n) => currency(n, 2)}
            className="text-2xl font-bold tracking-tight text-foreground tabular-nums"
          />
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {revenueGrowth >= 0 ? (
              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />
            )}
            <span className={`font-semibold ${revenueGrowth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {revenueDelta}
            </span>
            <span>growth</span>
          </div>
        </div>
      </div>

      {/* Won Deals */}
      <div className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-shadow relative overflow-hidden group space-y-3 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
            Won Deals
          </p>
          <Trophy className="h-4 w-4 text-brand-purple" />
        </div>
        <div className="space-y-1">
          <CountUp
            value={wonDeals}
            active={inView}
            format={(n) => `${Math.round(n)}`}
            className="text-2xl font-bold tracking-tight text-foreground tabular-nums"
          />
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {dealsGrowth >= 0 ? (
              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />
            )}
            <span className={`font-semibold ${dealsGrowth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {wonDealsDelta}
            </span>
            <span>vs last period</span>
          </div>
        </div>
      </div>

      {/* Win Rate */}
      <div className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-shadow relative overflow-hidden group space-y-3 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
            Win Rate
          </p>
          <Target className="h-4 w-4 text-brand-purple" />
        </div>
        <div className="space-y-1">
          <CountUp
            value={winRate}
            active={inView}
            format={(n) => `${n.toFixed(1)}%`}
            className="text-2xl font-bold tracking-tight text-foreground tabular-nums"
          />
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {winRateGrowth >= 0 ? (
              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />
            )}
            <span className={`font-semibold ${winRateGrowth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {winRateDelta}
            </span>
            <span>vs last period</span>
          </div>
        </div>
      </div>

      {/* Average Deal Size */}
      <div className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-shadow relative overflow-hidden group space-y-3 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
            Avg Deal Size
          </p>
          <Activity className="h-4 w-4 text-brand-purple" />
        </div>
        <div className="space-y-1">
          <CountUp
            value={avgDealSize}
            active={inView}
            format={(n) => currency(n, 0)}
            className="text-2xl font-bold tracking-tight text-foreground tabular-nums"
          />
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {avgDealGrowth >= 0 ? (
              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />
            )}
            <span className={`font-semibold ${avgDealGrowth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {avgDealDelta}
            </span>
            <span>vs last period</span>
          </div>
        </div>
      </div>
    </div>
  );
}
