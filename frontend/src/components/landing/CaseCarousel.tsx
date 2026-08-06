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
    stat: "₹2.4M added pipeline",
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
    <section className="overflow-hidden bg-background py-24 md:py-32">
      <div ref={ref} className="mx-auto max-w-7xl px-6">
        <div className="reveal" data-visible={visible}>
          <h2 className="min-w-0 text-3xl leading-tight font-bold tracking-tight md:text-[2.5rem]">
            Teams closing more with Pulse
          </h2>
        </div>
      </div>

      <div
        className="reveal group mt-10 [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]"
        data-visible={visible}
        style={{ transitionDelay: "100ms" }}
      >
        <div className="marquee-track flex gap-6 group-hover:[animation-play-state:paused] motion-reduce:[animation-play-state:paused]">
          {loop.map((c, i) => (
            <article
              key={`${c.company}-${i}`}
              className="w-[86vw] shrink-0 rounded-3xl border border-border bg-surface-warm p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-float sm:w-[46vw] lg:w-[26rem]"
            >
              <p className="grad-blue-purple bg-clip-text text-2xl font-bold text-transparent">
                {c.stat}
              </p>
              <p className="mt-5 text-base leading-relaxed text-ink">"{c.quote}"</p>
              <div className="mt-8 border-t border-border pt-5">
                <p className="text-sm font-semibold">{c.company}</p>
                <p className="text-sm text-muted-foreground">{c.rep}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

