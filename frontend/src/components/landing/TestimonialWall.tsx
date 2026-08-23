"use client";

import type { CSSProperties } from "react";
import { useReveal } from "@/hooks/use-reveal";
import { cn } from "@/lib/utils";

const heroQuotes = [
  {
    quote:
      "Pulse rewrote how our team prioritises. Reps stopped guessing which leads to call and our close rate climbed 34% in a single quarter.",
    name: "Dana Whitfield",
    title: "VP of Sales, Northwind",
    tone: "#00e599",
  },
  {
    quote:
      "The scoring model is the first one my reps actually trust. Lead quality complaints went to zero and pipeline hygiene fixed itself.",
    name: "Marcus Lee",
    title: "Chief Revenue Officer, Kadence",
    tone: "#4da3ff",
  },
  {
    quote:
      "We onboarded 40 reps in a week. Follow-ups run themselves now, so the team spends its day in conversations instead of the CRM.",
    name: "Priya Raman",
    title: "Head of Revenue Operations, Orbital",
    tone: "#ffb454",
  },
];

type Wall = { quote: string; name: string; handle: string; tone: string };

const columns: Wall[][] = [
  [
    {
      quote:
        "Duplicate leads used to eat an hour a day. Pulse merges them before anyone notices they existed.",
      name: "Alex Moreno",
      handle: "@alexsells",
      tone: "#ff6b4a",
    },
    {
      quote: "Our SDRs book 22% more meetings since switching. That's the whole review.",
      name: "Sam Okafor",
      handle: "@sokafor",
      tone: "#00e599",
    },
    {
      quote:
        "The activity view finally gave me coaching signal instead of vanity dashboards. I can see exactly where a deal stalled and step in the same day.",
      name: "Nina Castellanos",
      handle: "@ninacrm",
      tone: "#4da3ff",
    },
  ],
  [
    {
      quote:
        "Every inbound lead is scored before the rep opens the tab. It changed the shape of our morning.",
      name: "Jonas Petit",
      handle: "@jonaspetit",
      tone: "#ffb454",
    },
    {
      quote: "Cleanest CRM migration I've run in twelve years of sales ops.",
      name: "Rachel Byrne",
      handle: "@rbyrne_ops",
      tone: "#00e599",
    },
    {
      quote:
        "Magic link follow-ups get replies. Plain and simple — our response rate nearly doubled.",
      name: "Tobias Kern",
      handle: "@tkern",
      tone: "#ff6b4a",
    },
  ],
  [
    {
      quote:
        "Spam and bot leads dropped off a cliff. My reps stopped dialling fake numbers, which is worth the subscription on its own.",
      name: "Grace Adeyemi",
      handle: "@graceadeyemi",
      tone: "#4da3ff",
    },
    {
      quote: "Forecasts are within 4% now. Leadership stopped asking me to re-check the numbers.",
      name: "Ellis Fontaine",
      handle: "@ellisf",
      tone: "#ffb454",
    },
    {
      quote: "Ramp time for new reps went from six weeks to two.",
      name: "Hana Sato",
      handle: "@hanasato",
      tone: "#00e599",
    },
  ],
];

function Avatar({ name, tone, size = "size-11" }: { name: string; tone: string; size?: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);
  return (
    <span
      className={cn(size, "grid shrink-0 place-items-center rounded-full font-mono text-xs font-bold text-[#03130c]")}
      style={{ background: tone }}
      aria-hidden
    >
      {initials}
    </span>
  );
}

function WallCard({ t }: { t: Wall }) {
  return (
    <figure className="pl-card p-5">
      <blockquote className="text-sm leading-relaxed text-white/80">&ldquo;{t.quote}&rdquo;</blockquote>
      <figcaption className="mt-4 flex items-center gap-2.5">
        <Avatar name={t.name} tone={t.tone} size="size-8" />
        <span className="text-xs">
          <span className="block font-semibold text-white">{t.name}</span>
          <span className="block text-pl-muted">{t.handle}</span>
        </span>
      </figcaption>
    </figure>
  );
}

export function TestimonialWall() {
  const { ref: headRef, visible: headVisible } = useReveal<HTMLDivElement>(0.15);
  const { ref: wallRef, visible: wallVisible } = useReveal<HTMLDivElement>(0.05);

  return (
    <section className="overflow-hidden border-y border-white/[0.06] bg-[#05070d] py-24 md:py-32">
      <div className="mx-auto grid max-w-7xl gap-16 px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start lg:gap-12">
        <div ref={headRef} className="reveal lg:sticky lg:top-28" data-visible={headVisible}>
          <p className="font-mono text-[11px] font-semibold tracking-[0.26em] text-pl-dim">
            SIGNALS FROM THE FIELD
          </p>
          <h2 className="pl-display mt-4 text-3xl font-bold tracking-tight text-white md:text-[2.75rem]">
            Trusted around the world
          </h2>
          <p className="mt-4 max-w-md text-base text-pl-muted">
            Join the sales teams and leaders who trust Pulse to score, route and close every lead.
          </p>

          <div className="mt-10 space-y-10">
            {heroQuotes.map((q, i) => (
              <figure
                key={q.name}
                className="reveal"
                data-visible={headVisible}
                style={{ transitionDelay: `${120 + i * 160}ms` }}
              >
                <span
                  className="block h-px w-12"
                  style={{ background: q.tone, boxShadow: `0 0 12px ${q.tone}` }}
                  aria-hidden
                />
                <blockquote className="mt-4 text-base leading-relaxed text-white/85">
                  {q.quote}
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <Avatar name={q.name} tone={q.tone} />
                  <span className="text-sm">
                    <span className="block font-semibold text-white">{q.name}</span>
                    <span className="block text-pl-muted">{q.title}</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>

        <div
          ref={wallRef}
          className="reveal group relative h-[560px] overflow-hidden md:h-[720px]"
          data-visible={wallVisible}
          style={{
            maskImage: "linear-gradient(to bottom, transparent, black 10%, black 88%, transparent)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent, black 10%, black 88%, transparent)",
          }}
        >
          <div className="grid grid-cols-1 items-start gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {columns.slice(0, 3).map((col, ci) => {
              const loop = [...col, ...col];
              return (
                <div
                  key={ci}
                  className={cn(
                    "marquee-col flex flex-col gap-5 group-hover:[animation-play-state:paused] motion-reduce:[animation-play-state:paused]",
                    ci === 1 && "sm:-mt-10",
                    ci === 2 && "hidden xl:flex",
                  )}
                  style={
                    {
                      "--col-dur": ci === 1 ? "30s" : ci === 2 ? "35s" : "24s",
                      animationDelay: `${ci * -6}s`,
                      animationDirection: ci === 1 ? "reverse" : "normal",
                    } as CSSProperties
                  }
                >
                  {loop.map((t, ri) => (
                    <WallCard key={`${t.name}-${ri}`} t={t} />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
