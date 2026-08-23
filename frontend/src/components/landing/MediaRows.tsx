"use client";

import { ArrowRight, Flame, Sparkles } from "lucide-react";
import { useReveal } from "@/hooks/use-reveal";
import { cn } from "@/lib/utils";

const leadsImage = "/landing/product-leads.jpg";
const pipelineImage = "/landing/product-pipeline.jpg";

type Row = {
  eyebrow: string;
  title: string;
  desc: string;
  image: string;
  alt: string;
  urlLabel: string;
  reversed?: boolean;
  badge: { icon: "flame" | "spark"; title: string; sub: string };
};

const rows: Row[] = [
  {
    eyebrow: "LEAD CAPTURE",
    title: "Never lose a lead between the form and the follow-up",
    desc: "Pulse captures leads from every channel, enriches them with firmographic data, and scores them before your rep opens the tab. No manual triage, no cold inbox.",
    image: leadsImage,
    alt: "Pulse lead scoring dashboard",
    urlLabel: "app.pulse.crm/leads",
    badge: { icon: "flame", title: "Score 94 · HOT", sub: "Maya Reyes · just now" },
  },
  {
    eyebrow: "AI COPILOT",
    title: "Recommendations that read the deal, not the template",
    desc: "Every opportunity gets a live read on risk, momentum and the exact next move — grounded in what actually closed for teams like yours.",
    image: pipelineImage,
    alt: "Pulse pipeline board with AI recommendations",
    urlLabel: "app.pulse.crm/pipeline",
    reversed: true,
    badge: { icon: "spark", title: "Next best action ready", sub: "Send proposal · Vertex Health" },
  },
];

function BrowserFrame({ row }: { row: Row }) {
  return (
    <div className="group relative">
      {/* glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-6 rounded-[2rem] opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 40%, rgba(0,229,153,0.14), rgba(77,163,255,0.07) 55%, transparent)",
        }}
      />
      <div className="pl-card relative overflow-hidden rounded-2xl shadow-[0_50px_120px_-45px_rgba(0,0,0,0.95)]">
        {/* chrome bar */}
        <div className="flex items-center gap-3 border-b border-white/[0.06] bg-[#0a0f18] px-4 py-2.5">
          <span className="flex gap-1.5" aria-hidden>
            <span className="size-2.5 rounded-full bg-white/[0.12]" />
            <span className="size-2.5 rounded-full bg-white/[0.12]" />
            <span className="size-2.5 rounded-full bg-white/[0.12]" />
          </span>
          <span className="mx-auto flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-white/[0.03] px-3 py-1 font-mono text-[10.5px] tracking-wide text-pl-dim">
            <span className="size-1.5 rounded-full bg-pl-mint/80" />
            {row.urlLabel}
          </span>
          <span className="w-10" aria-hidden />
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={row.image}
          alt={row.alt}
          loading="lazy"
          width={1200}
          height={912}
          className="w-full transition-transform duration-700 ease-out group-hover:scale-[1.015]"
        />
      </div>

      {/* floating status badge */}
      <div
        aria-hidden
        className={cn(
          "pl-card pl-float-y absolute -bottom-5 hidden w-max items-center gap-2.5 px-4 py-3 backdrop-blur-md sm:flex",
          row.reversed ? "-right-4 lg:-right-8" : "-left-4 lg:-left-8",
        )}
      >
        <span
          className={cn(
            "grid size-8 place-items-center rounded-lg",
            row.badge.icon === "flame"
              ? "bg-pl-hot/15 text-pl-hot"
              : "bg-pl-mint/15 text-pl-mint",
          )}
        >
          {row.badge.icon === "flame" ? <Flame size={15} /> : <Sparkles size={15} />}
        </span>
        <span className="leading-tight">
          <span className="block text-[13px] font-semibold text-white">{row.badge.title}</span>
          <span className="block text-[11px] text-pl-muted">{row.badge.sub}</span>
        </span>
      </div>
    </div>
  );
}

function MediaRow({ row }: { row: Row }) {
  const { ref, visible } = useReveal<HTMLDivElement>(0.15);
  return (
    <div ref={ref} className="mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-2 lg:gap-20">
      <div className={cn("reveal min-w-0", row.reversed && "lg:order-2")} data-visible={visible}>
        <p className="flex items-center gap-2.5 font-mono text-[11px] font-semibold tracking-[0.26em] text-pl-mint">
          <span className="h-px w-6 bg-pl-mint/60" aria-hidden />
          {row.eyebrow}
        </p>
        <h3 className="pl-display mt-4 text-3xl font-bold tracking-tight text-white md:text-[2.25rem] md:leading-[1.15]">
          {row.title}
        </h3>
        <p className="mt-5 max-w-lg text-base leading-relaxed text-pl-muted">{row.desc}</p>
        <a
          href="#"
          className="arrow-nudge mt-7 inline-flex items-center gap-1.5 text-sm font-medium text-pl-mint transition-colors hover:text-white"
        >
          Learn more <ArrowRight size={15} />
        </a>
      </div>
      <div
        className={cn("relative min-w-0", row.reversed && "lg:order-1")}
        style={
          visible && !(typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches)
            ? { animation: "rise-in 0.7s cubic-bezier(0.22,1,0.36,1) 0.12s both" }
            : undefined
        }
      >
        <BrowserFrame row={row} />
      </div>
    </div>
  );
}

export function MediaRows() {
  return (
    <section className="space-y-24 py-24 md:space-y-36 md:py-32">
      {rows.map((r) => (
        <MediaRow key={r.title} row={r} />
      ))}
    </section>
  );
}
