import { TrendingUp, Sparkles, Zap } from "lucide-react";

const cards = [
  { name: "Northwind Labs", score: 92, tag: "Hot", delay: "0ms" },
  { name: "Vector Health", score: 78, tag: "Warm", delay: "1200ms" },
  { name: "Cartesia Inc.", score: 64, tag: "Nurture", delay: "2400ms" },
];

export function AuthVisual() {
  return (
    <div className="mesh-hero relative h-full w-full">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="mesh-blob drift-a -top-32 -left-24 size-[38rem] bg-brand-purple" />
        <div className="mesh-blob drift-b top-1/4 left-1/3 size-[34rem] bg-brand-blue" />
        <div className="mesh-blob drift-c -right-24 -bottom-40 size-[32rem] bg-brand-cyan" />
      </div>

      <div className="relative flex h-full flex-col justify-center gap-6 px-10 py-16 lg:px-14">
        <div className="max-w-sm">
          <p className="text-xs font-semibold tracking-[0.2em] text-primary-foreground/80 uppercase">
            Pulse CRM
          </p>
          <h2 className="mt-4 text-3xl leading-tight font-bold tracking-tight text-primary-foreground">
            Every lead scored the second it lands.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-primary-foreground/80">
            Pulse watches your pipeline in real time and tells your reps exactly what to do next.
          </p>
        </div>

        <div className="mt-2 max-w-md space-y-3">
          {cards.map((c) => (
            <div
              key={c.name}
              className="shimmer relative overflow-hidden rounded-2xl border border-primary-foreground/15 bg-primary-foreground/10 p-4 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-full bg-primary-foreground/15 text-primary-foreground">
                    <TrendingUp size={15} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-primary-foreground">{c.name}</p>
                    <p className="text-[11px] text-primary-foreground/70">Score updated just now</p>
                  </div>
                </div>
                <span className="rounded-full bg-primary-foreground/15 px-2.5 py-1 text-[11px] font-semibold text-primary-foreground">
                  {c.tag}
                </span>
              </div>
              <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-primary-foreground/20">
                <div
                  className="h-full rounded-full bg-primary-foreground/80"
                  style={{ width: `${c.score}%` }}
                />
                <div
                  className="scan-bar absolute inset-y-0 left-0 w-1/3 rounded-full bg-primary-foreground/25"
                  style={{ animationDelay: c.delay }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex max-w-md items-center gap-3 rounded-2xl border border-primary-foreground/15 bg-primary-foreground/10 p-4 backdrop-blur-sm">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-foreground/15 text-primary-foreground">
            <Sparkles size={15} />
          </span>
          <p className="text-xs leading-relaxed text-primary-foreground/85">
            <span className="font-semibold text-primary-foreground">Next best action:</span> call
            Northwind Labs before 4pm — engagement peaked today.
          </p>
          <Zap size={14} className="ml-auto shrink-0 text-primary-foreground/70" />
        </div>
      </div>
    </div>
  );
}