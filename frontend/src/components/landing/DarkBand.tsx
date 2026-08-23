"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useCountUp, useReveal } from "@/hooks/use-reveal";

function Stat({
  value,
  suffix,
  label,
  delay = 0,
}: {
  value: number;
  suffix: string;
  label: string;
  delay?: number;
}) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  const n = useCountUp(value, visible);
  return (
    <div ref={ref} className="reveal" data-visible={visible} style={{ transitionDelay: `${delay}ms` }}>
      <div className="font-mono text-4xl font-bold tracking-tight text-white tabular-nums md:text-5xl">
        {n.toLocaleString()}
        <span className="text-pl-mint">{suffix}</span>
      </div>
      <p className="mt-2.5 text-sm text-pl-muted">{label}</p>
    </div>
  );
}

export function DarkBand() {
  const { ref, visible } = useReveal<HTMLDivElement>();

  return (
    <section className="relative overflow-hidden border-y border-white/[0.06] bg-[#060910] py-24 md:py-28">
      <div aria-hidden className="pl-grid absolute inset-0 opacity-40 pl-mask-b" />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-[52rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(0,229,153,0.22), rgba(77,163,255,0.1) 60%, transparent)",
        }}
      />

      <div
        ref={ref}
        className="reveal relative mx-auto max-w-3xl px-6 text-center"
        data-visible={visible}
      >
        <p className="font-mono text-[11px] font-semibold tracking-[0.26em] text-pl-dim">
          PROOF IN PIPELINE
        </p>
        <h2 className="pl-display mt-5 text-3xl font-bold tracking-tight text-white md:text-[2.75rem]">
          Your pipeline already knows who&rsquo;s going to buy
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base text-pl-muted">
          Pulse reads every signal across your CRM and surfaces the deals worth your next hour.
        </p>
        <Link
          href="/signup"
          className="pl-btn-ghost arrow-nudge mt-8 inline-flex h-12 items-center gap-2 rounded-full px-6 text-sm font-semibold"
        >
          See it on your data <ArrowRight size={16} />
        </Link>
      </div>

      <div className="relative mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-10 px-6 text-center sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-white/[0.07]">
        <Stat value={10000} suffix="+" label="Leads scored daily" delay={0} />
        <Stat value={40} suffix="%" label="Average lift in close rate" delay={90} />
        <Stat value={6} suffix="hrs" label="Saved per rep, per week" delay={180} />
      </div>
    </section>
  );
}
