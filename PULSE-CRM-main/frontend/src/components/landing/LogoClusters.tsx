import { useEffect, useState } from "react";
import { useReveal } from "@/hooks/use-reveal";

import browserbase from "../../../public/images/landing/logos/browserbase.svg";
import inngest from "../../../public/images/landing/logos/inngest.svg";
import davidAi from "../../../public/images/landing/logos/david-ai.svg";
import braintrust from "../../../public/images/landing/logos/braintrust.svg";
import durable from "../../../public/images/landing/logos/durable.svg";
import openRouter from "../../../public/images/landing/logos/open-router.svg";
import higgsfield from "../../../public/images/landing/logos/higgsfield.svg";
import upstash from "../../../public/images/landing/logos/upstash.svg";
import samaya from "../../../public/images/landing/logos/samaya.svg";
import consensus from "../../../public/images/landing/logos/consensus.svg";
import cartesia from "../../../public/images/landing/logos/cartesia.svg";

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
      className="group relative flex h-24 items-center justify-center overflow-hidden px-6"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <img
        key={current.alt}
        src={current.src}
        alt={current.alt}
        loading="lazy"
        className="absolute h-7 w-auto max-w-[80%] object-contain opacity-45 grayscale transition-[opacity,filter] duration-300 group-hover:opacity-100 group-hover:grayscale-0 md:h-8"
        style={{ animation: "logo-slot-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) both" }}
      />
    </div>
  );
}

export function LogoClusters() {
  const { ref, visible } = useReveal<HTMLDivElement>(0.1);

  return (
    <section className="border-y border-cream-border bg-background">
      <div
        ref={ref}
        className="reveal mx-auto grid max-w-[1400px] grid-cols-2 divide-x divide-cream-border sm:grid-cols-3 lg:grid-cols-5"
        data-visible={visible}
      >
        <div className="col-span-2 flex h-24 items-center px-8 sm:col-span-1">
          <p className="max-w-[15rem] text-[0.95rem] leading-snug font-medium text-ink">
            Trusted by fast-growing companies around the world.
          </p>
        </div>
        {segments.map((logos, i) => (
          <LogoSegment key={logos[0].alt} logos={logos} offset={i} />
        ))}
      </div>
    </section>
  );
}
