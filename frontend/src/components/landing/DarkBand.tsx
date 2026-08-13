import { ArrowRight } from "lucide-react";
import { PillButton } from "./PillButton";
import { useCountUp, useReveal } from "@/hooks/use-reveal";

function Stat({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  const n = useCountUp(value, visible);
  return (
    <div ref={ref} className="reveal" data-visible={visible}>
      <div className="text-4xl font-bold tracking-tight text-primary-foreground md:text-5xl">
        {n.toLocaleString()}
        {suffix}
      </div>
      <p className="mt-2 text-sm text-primary-foreground/65">{label}</p>
    </div>
  );
}

export function DarkBand() {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <section className="bg-ink-band py-24 md:py-32">
      <div ref={ref} className="reveal mx-auto max-w-3xl px-6 text-center" data-visible={visible}>
        <h2 className="text-3xl leading-tight font-bold tracking-tight text-primary-foreground md:text-[2.75rem]">
          Your pipeline already knows who's going to buy
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base text-primary-foreground/70">
          Pulse reads every signal across your CRM and surfaces the deals worth your next hour.
        </p>
        <PillButton size="lg" variant="light" className="arrow-nudge mt-8">
          See it on your data <ArrowRight size={16} />
        </PillButton>
      </div>

      <div className="mx-auto mt-20 grid max-w-5xl grid-cols-1 gap-10 px-6 text-center sm:grid-cols-3">
        <Stat value={10000} suffix="+" label="Leads scored daily" />
        <Stat value={40} suffix="%" label="Average lift in close rate" />
        <Stat value={6} suffix="hrs" label="Saved per rep, per week" />
      </div>
    </section>
  );
}
