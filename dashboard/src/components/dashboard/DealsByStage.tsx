import { ChevronDown } from "lucide-react";
import { useReveal } from "@/hooks/use-reveal";
import { useDealsByStage } from "@/hooks/use-api";
import { Skeleton } from "@/components/ui/skeleton";

interface DealStageData {
  name: string;
  value: number;
  color?: string;
}

const defaultStages: DealStageData[] = [
  { name: "New", value: 120, tone: "bg-brand-blue" },
  { name: "Qualified", value: 86, tone: "bg-brand-cyan" },
  { name: "Proposal", value: 40, tone: "bg-brand-purple" },
  { name: "Negotiation", value: 28, tone: "bg-brand-blue/70" },
  { name: "Won", value: 23, tone: "bg-brand-purple/80" },
  { name: "Lost", value: 14, tone: "bg-muted-foreground/40" },
];

interface DealsByStageProps {
  isLoading?: boolean;
}

export function DealsByStage({ isLoading = false }: DealsByStageProps) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  const { data: apiData } = useDealsByStage();
  
  // Use API data if available, otherwise use defaults
  const stages = isLoading || !apiData || apiData.length === 0 
    ? defaultStages 
    : apiData.map((stage) => ({
        name: stage.name,
        value: stage.value,
        tone: stage.color || "bg-brand-purple",
      }));

  const max = Math.max(...stages.map((s) => s.value), 1);

  return (
    <div
      ref={ref}
      data-visible={visible}
      className="reveal flex flex-col rounded-2xl border border-border bg-card p-6"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <h2 className="truncate text-base font-semibold tracking-tight text-foreground">
          Deals by stage
        </h2>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground">
          This month <ChevronDown size={13} />
        </span>
      </div>

      {isLoading ? (
        <ul className="mt-5 flex-1 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="grid grid-cols-[6.5rem_minmax(0,1fr)_2.5rem] items-center gap-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-4 w-8" />
            </li>
          ))}
        </ul>
      ) : (
        <>
          <ul className="mt-5 flex-1 space-y-3">
            {stages.map((s, i) => (
              <li key={s.name} className="grid grid-cols-[6.5rem_minmax(0,1fr)_2.5rem] items-center gap-3">
                <span className="truncate text-xs font-medium text-foreground">{s.name}</span>
                <span className="h-6 overflow-hidden rounded-full bg-secondary">
                  <span
                    className={`grid h-full place-items-center rounded-full text-[11px] font-semibold text-primary-foreground transition-[width] duration-700 ease-out ${s.tone}`}
                    style={{
                      width: visible ? `${(s.value / max) * 100}%` : "0%",
                      transitionDelay: `${i * 70}ms`,
                    }}
                  >
                    {s.value}
                  </span>
                </span>
                <span className="text-right text-xs text-muted-foreground">{s.value}</span>
              </li>
            ))}
          </ul>

          <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
            <span className="text-sm text-muted-foreground">Conversion rate</span>
            <span className="text-sm font-semibold text-foreground">
              {stages.find((s) => s.name === "Won")?.value 
                ? `${((stages.find((s) => s.name === "Won")!.value / 
                    (stages.reduce((sum, s) => sum + s.value, 0) || 1)) * 100).toFixed(1)}%`
                : "0.0%"}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
