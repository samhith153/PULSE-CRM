import type { CSSProperties } from "react";
import { PillButton } from "./PillButton";
import { useReveal } from "@/hooks/use-reveal";

const heroQuotes = [
  {
    quote:
      "Pulse rewrote how our team prioritises. Reps stopped guessing which leads to call and our close rate climbed 34% in a single quarter.",
    name: "Dana Whitfield",
    title: "VP of Sales, Northwind",
    grad: "grad-blue-purple",
  },
  {
    quote:
      "The scoring model is the first one my reps actually trust. Lead quality complaints went to zero and pipeline hygiene fixed itself.",
    name: "Marcus Lee",
    title: "Chief Revenue Officer, Kadence",
    grad: "grad-pink-purple",
  },
  {
    quote:
      "We onboarded 40 reps in a week. Follow-ups run themselves now, so the team spends its day in conversations instead of the CRM.",
    name: "Priya Raman",
    title: "Head of Revenue Operations, Orbital",
    grad: "grad-teal-purple",
  },
];

type Wall = { quote: string; name: string; handle: string; grad: string };

const columns: Wall[][] = [
  [
    {
      quote:
        "Duplicate leads used to eat an hour a day. Pulse merges them before anyone notices they existed.",
      name: "Alex Moreno",
      handle: "@alexsells",
      grad: "grad-orange-pink",
    },
    {
      quote: "Our SDRs book 22% more meetings since switching. That's the whole review.",
      name: "Sam Okafor",
      handle: "@sokafor",
      grad: "grad-blue-purple",
    },
    {
      quote:
        "The activity view finally gave me coaching signal instead of vanity dashboards. I can see exactly where a deal stalled and step in the same day.",
      name: "Nina Castellanos",
      handle: "@ninacrm",
      grad: "grad-teal-purple",
    },
  ],
  [
    {
      quote:
        "Every inbound lead is scored before the rep opens the tab. It changed the shape of our morning.",
      name: "Jonas Petit",
      handle: "@jonaspetit",
      grad: "grad-pink-purple",
    },
    {
      quote: "Cleanest CRM migration I've run in twelve years of sales ops.",
      name: "Rachel Byrne",
      handle: "@rbyrne_ops",
      grad: "grad-blue-purple",
    },
    {
      quote:
        "Magic link follow-ups get replies. Plain and simple — our response rate nearly doubled.",
      name: "Tobias Kern",
      handle: "@tkern",
      grad: "grad-orange-pink",
    },
  ],
  [
    {
      quote:
        "Spam and bot leads dropped off a cliff. My reps stopped dialling fake numbers, which is worth the subscription on its own.",
      name: "Grace Adeyemi",
      handle: "@graceadeyemi",
      grad: "grad-teal-purple",
    },
    {
      quote: "Forecasts are within 4% now. Leadership stopped asking me to re-check the numbers.",
      name: "Ellis Fontaine",
      handle: "@ellisf",
      grad: "grad-pink-purple",
    },
    {
      quote: "Ramp time for new reps went from six weeks to two.",
      name: "Hana Sato",
      handle: "@hanasato",
      grad: "grad-blue-purple",
    },
  ],
  [
    {
      quote: "The webhooks are boringly reliable, which is the highest compliment I give tooling.",
      name: "Devin Marsh",
      handle: "@devmarsh",
      grad: "grad-blue-purple",
    },
    {
      quote:
        "We replaced three tools with Pulse and the team asked why we hadn't done it a year ago. Adoption was immediate.",
      name: "Laila Haddad",
      handle: "@lailahaddad",
      grad: "grad-orange-pink",
    },
    {
      quote: "Best lead quality we've had since I joined. Reps are actually happy.",
      name: "Owen Pryce",
      handle: "@owenpryce",
      grad: "grad-teal-purple",
    },
  ],
];

function Avatar({ name, grad, size = "size-11" }: { name: string; grad: string; size?: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);
  return (
    <span
      className={`${grad} ${size} grid shrink-0 place-items-center rounded-full text-xs font-bold text-primary-foreground`}
      aria-hidden
    >
      {initials}
    </span>
  );
}

function WallCard({ t }: { t: Wall }) {
  return (
    <figure className="rounded-2xl border border-cream-border bg-background p-5">
      <blockquote className="text-sm leading-relaxed text-ink/80">“{t.quote}”</blockquote>
      <figcaption className="mt-4 flex items-center gap-2.5">
        <Avatar name={t.name} grad={t.grad} size="size-8" />
        <span className="text-xs">
          <span className="block font-semibold text-ink">{t.name}</span>
          <span className="block text-muted-foreground">{t.handle}</span>
        </span>
      </figcaption>
    </figure>
  );
}

export function TestimonialWall() {
  const { ref: headRef, visible: headVisible } = useReveal<HTMLDivElement>(0.15);
  const { ref: wallRef, visible: wallVisible } = useReveal<HTMLDivElement>(0.05);

  return (
    <section className="overflow-hidden bg-surface-warm py-24 md:py-32">
      <div className="mx-auto grid max-w-7xl gap-16 px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start lg:gap-12">
        <div ref={headRef} className="reveal lg:sticky lg:top-28" data-visible={headVisible}>
          <h2 className="text-3xl leading-tight font-bold tracking-tight text-ink md:text-[2.75rem]">
            Trusted around the world
          </h2>
          <p className="mt-4 max-w-md text-base text-muted-foreground">
            Join the sales teams and leaders who trust Pulse to score, route and close every lead.
          </p>
          <PillButton size="lg" className="mt-8">
            Start free trial
          </PillButton>

          <div className="mt-16 space-y-12">
            {heroQuotes.slice(0, 2).map((q, i) => (
              <figure
                key={q.name}
                className="reveal"
                data-visible={headVisible}
                style={{ transitionDelay: `${160 + i * 180}ms` }}
              >
                <span className="block text-3xl leading-none text-muted-foreground/50">“</span>
                <blockquote className="mt-2 text-base leading-relaxed text-ink/80">
                  {q.quote}
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <Avatar name={q.name} grad={q.grad} />
                  <span className="text-sm">
                    <span className="block font-semibold text-ink">{q.name}</span>
                    <span className="block text-muted-foreground">{q.title}</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>

        <div
          ref={wallRef}
          className="reveal group relative h-[560px] overflow-hidden md:h-[720px] [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_88%,transparent)]"
          data-visible={wallVisible}
        >
          <div className="grid grid-cols-1 items-start gap-5 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
            {columns.slice(0, 3).map((col, ci) => {
              const loop = [...col, ...col];
              return (
                <div
                  key={ci}
                  className={`marquee-col flex flex-col gap-5 group-hover:[animation-play-state:paused] motion-reduce:[animation-play-state:paused] ${ci === 1 ? "sm:-mt-10" : ""} ${ci === 2 ? "hidden xl:flex" : ""}`}
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

