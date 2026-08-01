import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCountUp } from "@/hooks/use-reveal";
import { cn } from "@/lib/utils";

export type Stat = {
  label: string;
  icon: LucideIcon;
  value: number;
  prefix?: string;
  suffix?: string;
  delta: number;
  spark: number[];
};

function Spark({ points, positive }: { points: number[]; positive: boolean }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const d = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * 100;
      const y = 24 - ((p - min) / (max - min || 1)) * 20 - 2;
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="h-6 w-full" aria-hidden>
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
        className={positive ? "text-brand-cyan" : "text-destructive"}
      />
    </svg>
  );
}

export function StatCard({ stat, delay = 0 }: { stat: Stat; delay?: number }) {
  const { ref, value, visible } = useCountUp(stat.value);
  const positive = stat.delta >= 0;
  const Delta = positive ? ArrowUpRight : ArrowDownRight;

  return (
    <div
      ref={ref}
      data-visible={visible}
      style={{ transitionDelay: `${delay}ms` }}
      className="reveal rounded-2xl border border-border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-nav"
    >
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2.5">
        <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary text-brand-purple">
          <stat.icon size={16} />
        </div>
        <p className="text-[11px] leading-tight tracking-wide text-muted-foreground uppercase">
          {stat.label}
        </p>
      </div>
      <p className="mt-3 text-2xl font-semibold text-foreground">
        {stat.prefix}
        {value.toLocaleString()}
        {stat.suffix}
      </p>
      <p
        className={cn(
          "mt-2 flex items-center gap-1 text-[11px] whitespace-nowrap",
          positive ? "text-brand-cyan" : "text-destructive",
        )}
      >
        <Delta size={12} className="shrink-0" />
        {Math.abs(stat.delta)}%
        <span className="text-muted-foreground">vs last week</span>
      </p>
      <div className="mt-3 border-t border-border pt-2">
        <Spark points={stat.spark} positive={positive} />
      </div>

    </div>
  );
}
