"use client";

import { useReveal } from "@/hooks/use-reveal";

const cases = [
  {
    company: "Northwind Logistics",
    rep: "Dana Whitfield, VP Sales",
    stat: "+40% close rate",
    quote:
      "Pulse told us which accounts were actually moving. We stopped spraying follow-ups and started closing.",
  },
  {
    company: "Vertex Health",
    rep: "Marco Ruiz, Sales Director",
    stat: "3x faster triage",
    quote:
      "Scoring happens before a rep touches the lead. Our first-response time went from a day to minutes.",
  },
  {
    company: "Lumen Software",
    rep: "Priya Nandra, RevOps Lead",
    stat: "$2.1M added pipeline",
    quote:
      "The recommendations surfaced deals we'd written off. Two of them became our largest renewals.",
  },
  {
    company: "Kadence Retail",
    rep: "Tom Beckett, Head of Growth",
    stat: "6 hrs saved / rep",
    quote:
      "Automation handles the admin trail. My team spends their week in conversations, not in fields.",
  },
];

export function CaseCarousel() {
  const { ref, visible } = useReveal<HTMLDivElement>(0.1);
  const loop = [...cases, ...cases];

  return (
    <section className="overflow-hidden py-24 md:py-32">
      <div ref={ref} className="mx-auto max-w-7xl px-6">
        <div className="reveal flex flex-wrap items-end justify-between gap-4" data-visible={visible}>
          <h2 className="pl-display min-w-0 text-3xl font-bold tracking-tight text-white md:text-[2.5rem]">
            Teams closing more with Pulse
          </h2>
          <p className="font-mono text-[11px] font-semibold tracking-[0.24em] text-pl-dim">
            FIELD RESULTS · REAL PIPELINES
          </p>
        </div>
      </div>

      <div
        className="pl-mask-x reveal group mt-12"
        data-visible={visible}
        style={{ transitionDelay: "100ms" }}
      >
        <div className="marquee-track flex gap-6 group-hover:[animation-play-state:paused] motion-reduce:[animation-play-state:paused]">
          {loop.map((c, i) => (
            <article
              key={`${c.company}-${i}`}
              className="pl-card pl-card-hover w-[86vw] shrink-0 p-7 sm:w-[46vw] lg:w-[26rem]"
            >
              <p className="pl-grad-text font-mono text-xl font-bold tracking-tight">{c.stat}</p>
              <p className="mt-5 min-h-[7rem] text-[15px] leading-relaxed text-white/85">
                &ldquo;{c.quote}&rdquo;
              </p>
              <div className="mt-6 flex items-center gap-3 border-t border-white/[0.07] pt-5">
                <span className="grid size-9 place-items-center rounded-lg border border-white/[0.09] bg-white/[0.03] font-mono text-xs font-bold text-pl-mint">
                  {c.company.slice(0, 1)}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-white">{c.company}</span>
                  <span className="block text-xs text-pl-muted">{c.rep}</span>
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
