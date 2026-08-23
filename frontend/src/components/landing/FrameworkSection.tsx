"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, RefreshCw } from "lucide-react";
import { useReveal } from "@/hooks/use-reveal";
import { cn } from "@/lib/utils";

type Step = {
  letter: string;
  title: string;
  kicker: string;
  category: string;
  tagline: string;
  body: string;
  bullets: string[];
};

const STEPS: Step[] = [
  {
    letter: "P",
    title: "Prospect",
    kicker: "Discover",
    category: "Discover",
    tagline: "Find and capture every buying signal",
    body: "Pulse pulls leads from every channel you sell through — forms, inbox, chat, imports and partner feeds — and de-duplicates them into one clean pipeline. Nothing sits in a spreadsheet waiting to be noticed.",
    bullets: [
      "Unified capture across web, email and chat",
      "Automatic de-duplication and enrichment",
      "Intent signals from site and product usage",
      "Territory and round-robin assignment",
    ],
  },
  {
    letter: "U",
    title: "Understand",
    kicker: "Qualify",
    category: "Qualify",
    tagline: "Know who they are before the first call",
    body: "Every new contact is enriched with firmographics, tech stack and past touchpoints, then matched against your ideal customer profile. Reps open a record already knowing the story.",
    bullets: [
      "Firmographic and technographic enrichment",
      "ICP fit matching with reasons shown",
      "Full timeline of prior touchpoints",
      "Auto-summarised call and email notes",
    ],
  },
  {
    letter: "L",
    title: "Lead Score",
    kicker: "Prioritize",
    category: "Prioritize",
    tagline: "Score, rank, and route every lead",
    body: "Pulse grades each lead on fit and intent using 40+ signals, then keeps the score live as behaviour changes. Reps always work the top of a list that reorders itself.",
    bullets: [
      "AI-driven score based on 40+ signals",
      "Automatic hot, warm and cold tagging",
      "Score changes trigger rep alerts",
      "Custom scoring rules per industry",
    ],
  },
  {
    letter: "S",
    title: "Sequence",
    kicker: "Engage",
    category: "Engage",
    tagline: "Outreach that runs itself, in your voice",
    body: "Multi-step sequences adapt to each lead's score and stage, pausing the moment someone replies. Follow-ups, reminders and stage moves happen without anyone remembering to do them.",
    bullets: [
      "Adaptive multi-channel sequences",
      "AI-drafted replies in your tone",
      "Auto-pause on reply or meeting booked",
      "Next-best-action prompts per deal",
    ],
  },
  {
    letter: "E",
    title: "Evaluate",
    kicker: "Close",
    category: "Close",
    tagline: "See what wins, then do more of it",
    body: "Every closed deal feeds back into the model. Pulse shows which motions convert, where revenue leaks, and which reps need coaching — so next week's scoring is sharper than this week's.",
    bullets: [
      "Win/loss attribution by motion",
      "Pipeline leak and stall detection",
      "Rep coaching insights from real calls",
      "Scoring model retrained continuously",
    ],
  },
];

const DURATION = 4800;

export function FrameworkSection() {
  const { ref, visible } = useReveal<HTMLDivElement>(0.1);
  const sectionRef = useRef<HTMLElement | null>(null);
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const [inView, setInView] = useState(false);
  const [paused, setPaused] = useState(false);

  /* pause the timer while the section is out of view */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => setInView(entries[0]?.isIntersecting ?? false),
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const running = inView && !paused;

  useEffect(() => {
    if (!running) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    let frame = 0;
    const start = performance.now() - progress * DURATION;
    const tick = (now: number) => {
      const p = Math.min((now - start) / DURATION, 1);
      setProgress(p);
      if (p >= 1) {
        setActive((i) => (i + 1) % STEPS.length);
        setProgress(0);
      } else {
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, active]);

  /* resume auto-advance a few seconds after a manual pick */
  useEffect(() => {
    if (!paused) return;
    const id = setTimeout(() => setPaused(false), 6000);
    return () => clearTimeout(id);
  }, [paused]);

  const pick = useCallback((i: number) => {
    setActive(i);
    setProgress(0);
    setPaused(true);
  }, []);

  const step = STEPS[active];

  return (
    <section
      ref={sectionRef}
      id="pulse-framework"
      className="relative overflow-hidden border-y border-white/[0.06] bg-[#060910] py-24 md:py-32"
    >
      {/* decorative diagonal watermark */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, #eaf0f6 0px, #eaf0f6 1px, transparent 1px, transparent 22px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-[-6rem] h-[28rem] w-[28rem] rotate-12 rounded-[4rem] border border-white/[0.05]"
      />

      <div ref={ref} className="relative mx-auto max-w-7xl px-6">
        {/* header */}
        <div className="reveal mx-auto max-w-2xl text-center" data-visible={visible}>
          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-pl-mint/70" aria-hidden />
            <span className="font-mono text-[11px] font-semibold tracking-[0.26em] text-pl-dim">
              THE PULSE FRAMEWORK
            </span>
            <span className="h-px w-8 bg-pl-mint/70" aria-hidden />
          </div>
          <h2 className="pl-display mt-5 text-5xl font-bold tracking-tight text-white md:text-7xl">
            PULSE
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-pl-muted">
            Five operating motions that turn cold leads into closed deals, every week.
          </p>
        </div>

        <div className="mt-14 grid items-start gap-8 lg:mt-20 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-12">
          {/* left: step list */}
          <div className="reveal relative" data-visible={visible}>
            <div
              aria-hidden
              className="absolute top-8 bottom-16 left-[3.05rem] w-px bg-white/[0.07] md:left-[3.3rem]"
            />
            <ul className="relative space-y-1">
              {STEPS.map((s, i) => {
                const isActive = i === active;
                return (
                  <li key={s.letter}>
                    <button
                      type="button"
                      onClick={() => pick(i)}
                      aria-current={isActive}
                      className={cn(
                        "relative flex w-full items-center gap-4 rounded-2xl border px-4 py-3.5 text-left transition-all duration-400 ease-out",
                        isActive
                          ? "border-white/[0.09] bg-white/[0.04]"
                          : "border-transparent hover:bg-white/[0.02]",
                      )}
                    >
                      <span className="w-6 shrink-0 font-mono text-xs tracking-widest text-pl-dim tabular-nums">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span
                        className={cn(
                          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-bold transition-all duration-400 ease-out",
                          isActive
                            ? "bg-pl-mint text-[#03130c] shadow-[0_0_28px_-6px_rgba(0,229,153,0.65)]"
                            : "border border-white/[0.1] text-white/55",
                        )}
                      >
                        {s.letter}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-base font-semibold tracking-tight text-white">
                          {s.title}
                        </span>
                        <span className="mt-0.5 block font-mono text-[10px] font-medium tracking-[0.2em] text-pl-dim uppercase">
                          {s.kicker}
                        </span>
                      </span>
                      {isActive && (
                        <span
                          aria-hidden
                          className="absolute right-4 bottom-2 left-16 h-0.5 overflow-hidden rounded-full bg-white/[0.08]"
                        >
                          <span
                            className="block h-full rounded-full bg-gradient-to-r from-pl-mint to-pl-blue"
                            style={{
                              width: `${Math.round(progress * 100)}%`,
                              transition: paused ? "width 300ms ease-out" : "none",
                            }}
                          />
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="mt-8 flex items-center gap-2 pl-4 font-mono text-[10px] font-medium tracking-[0.22em] text-pl-dim uppercase">
              <RefreshCw className="size-3.5" aria-hidden />
              The cycle repeats, every week
            </div>
          </div>

          {/* right: detail card */}
          <div className="reveal" data-visible={visible} style={{ transitionDelay: "120ms" }}>
            <div className="pl-card rounded-3xl p-7 shadow-[0_50px_120px_-45px_rgba(0,0,0,0.9)] md:p-10">
              <div key={active} className="framework-swap">
                <div className="flex items-center gap-4">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pl-mint to-pl-blue text-xl font-bold text-[#03130c]">
                    {step.letter}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-2xl font-bold tracking-tight text-white uppercase">
                      {step.title}
                    </h3>
                    <p className="mt-1 text-sm text-pl-muted">
                      {step.category} · {step.tagline}
                    </p>
                  </div>
                </div>

                <p className="mt-6 text-base leading-relaxed text-pl-muted">{step.body}</p>

                <ul className="mt-7 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                  {step.bullets.map((b) => (
                    <li key={b} className="flex gap-2.5 text-sm leading-relaxed text-white/80">
                      <span
                        aria-hidden
                        className="mt-2 size-1.5 shrink-0 rounded-[2px] bg-pl-mint"
                      />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-8 flex justify-center lg:justify-start">
              <button
                type="button"
                className="pl-btn-ghost arrow-nudge inline-flex h-11 items-center gap-2 rounded-full px-6 text-sm font-semibold"
              >
                Learn more about PULSE
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
