"use client";

import { useEffect, useState } from "react";
import { useReveal } from "@/hooks/use-reveal";

const browserbase = "/landing/logos/browserbase.svg";
const inngest = "/landing/logos/inngest.svg";
const davidAi = "/landing/logos/david-ai.svg";
const braintrust = "/landing/logos/braintrust.svg";
const durable = "/landing/logos/durable.svg";
const openRouter = "/landing/logos/open-router.svg";
const higgsfield = "/landing/logos/higgsfield.svg";
const upstash = "/landing/logos/upstash.svg";
const samaya = "/landing/logos/samaya.svg";
const consensus = "/landing/logos/consensus.svg";
const cartesia = "/landing/logos/cartesia.svg";

type Logo = { src: string; alt: string };
type Segment = Logo[];

const segments: Segment[] = [
  [
    { src: browserbase, alt: "Browserbase" },
    { src: inngest, alt: "Inngest" },
    { src: davidAi, alt: "David AI" },
  ],
  [
    { src: braintrust, alt: "Braintrust" },
    { src: durable, alt: "Durable" },
    { src: openRouter, alt: "OpenRouter" },
  ],
  [
    { src: higgsfield, alt: "Higgsfield" },
    { src: upstash, alt: "Upstash" },
    { src: samaya, alt: "Samaya AI" },
  ],
  [
    { src: consensus, alt: "Consensus" },
    { src: cartesia, alt: "Cartesia" },
  ],
];

const WAVE_BASE_MS = 2200;
const WAVE_STAGGER_MS = 200;
const ROTATION_INTERVAL_MS = 6000;

function LogoSegment({ logos, offset }: { logos: Logo[]; offset: number }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    let interval: number | undefined;
    const start = window.setTimeout(() => {
      setIndex((i) => i + 1);
      interval = window.setInterval(
        () => setIndex((i) => i + 1),
        ROTATION_INTERVAL_MS,
      );
    }, WAVE_BASE_MS + offset * WAVE_STAGGER_MS);
    return () => {
      window.clearTimeout(start);
      if (interval) window.clearInterval(interval);
    };
  }, [offset, paused]);

  const current = logos[index % logos.length];

  return (
    <div
      className="group relative flex h-20 items-center justify-center overflow-hidden px-6 md:h-24"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={current.alt}
        src={current.src}
        alt={current.alt}
        loading="lazy"
        className="absolute h-6 w-auto max-w-[80%] object-contain opacity-40 grayscale brightness-0 invert transition-[opacity,filter] duration-300 group-hover:opacity-90 md:h-7"
        style={{ animation: "logo-slot-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) both" }}
      />
    </div>
  );
}

export function LogoClusters() {
  const { ref, visible } = useReveal<HTMLDivElement>(0.1);

  return (
    <section className="border-y border-white/[0.06] bg-[#05070d]">
      <div
        ref={ref}
        className="reveal mx-auto grid max-w-[1400px] grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
        data-visible={visible}
      >
        <div className="col-span-2 flex h-16 items-center px-6 sm:col-span-1 md:h-24 md:px-8">
          <p className="font-mono text-[10.5px] leading-relaxed font-medium tracking-[0.2em] text-pl-dim">
            TRUSTED BY FAST-GROWING TEAMS
          </p>
        </div>
        {segments.map((logos, i) => (
          <LogoSegment
            key={logos[0].alt}
            logos={logos}
            offset={i}
          />
        ))}
      </div>
    </section>
  );
}
