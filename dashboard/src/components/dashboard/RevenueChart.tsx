import { ChevronDown } from "lucide-react";
import { useReveal } from "@/hooks/use-reveal";
import type { RevenuePoint } from "@/lib/api";

interface RevenueChartProps {
  data?: RevenuePoint[];
  isLoading?: boolean;
}

const defaultPoints: [number, number][] = [
  [0, 82],
  [14, 70],
  [28, 62],
  [42, 50],
  [56, 40],
  [70, 30],
  [84, 24],
  [100, 8],
];

const labels = ["May 1", "May 4", "May 7", "May 10", "May 13", "May 16", "May 18"];

export function RevenueChart({ data = [], isLoading = false }: RevenueChartProps) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  
  // Use API data if available, otherwise use defaults for visualization
  const points: [number, number][] = isLoading || data.length === 0 
    ? defaultPoints
    : data.map((d, i) => {
        const x = (i / (data.length - 1 || 1)) * 100;
        const maxValue = Math.max(...data.map((p) => p.value));
        const y = 90 - ((d.value / (maxValue || 1)) * 82);
        return [x, y];
      });
  
  const path = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");

  return (
    <div
      ref={ref}
      data-visible={visible}
      className="reveal rounded-2xl border border-border bg-card p-6"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold tracking-tight text-foreground">
            Revenue over time
          </h2>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            Closed-won revenue, rolling 18 days
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground">
          This month <ChevronDown size={13} />
        </span>
      </div>

      <div className="mt-6 grid grid-cols-[auto_minmax(0,1fr)] gap-3">
        <div className="flex flex-col justify-between py-1 text-[10px] text-muted-foreground">
          {["₹4M", "₹3M", "₹2M", "₹1M", "₹0"].map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
        <div>
          <svg
            viewBox="0 0 100 90"
            preserveAspectRatio="none"
            className="h-48 w-full overflow-visible"
            aria-hidden
          >
            {[0, 22.5, 45, 67.5, 90].map((y) => (
              <line
                key={y}
                x1="0"
                x2="100"
                y1={y}
                y2={y}
                stroke="currentColor"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
                className="text-border"
              />
            ))}
            <path
              d={`${path} L100,90 L0,90 Z`}
              fill="currentColor"
              className="text-brand-purple/12"
            />
            <path
              d={path}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
              className="text-brand-purple"
            />
            {points.map(([x, y]) => (
              <circle key={x} cx={x} cy={y} r="1.6" className="fill-current text-brand-cyan" />
            ))}
          </svg>
          <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
            {isLoading || data.length === 0 ? labels : data.map((d) => d.date).slice(0, labels.length)}
          </div>
        </div>
      </div>
    </div>
  );
}
