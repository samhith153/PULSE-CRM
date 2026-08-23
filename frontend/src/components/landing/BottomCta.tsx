"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EcgLine } from "./EcgLine";
import { useReveal } from "@/hooks/use-reveal";

export function BottomCta() {
  const { ref, visible } = useReveal<HTMLDivElement>();

  return (
    <section className="relative overflow-hidden py-28 md:py-36">
      {/* backdrop */}
      <div aria-hidden className="pl-grid absolute inset-0 opacity-60 pl-mask-b" />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[26rem] w-[60rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(0,229,153,0.16), rgba(77,163,255,0.08) 55%, transparent)",
        }}
      />
      <div aria-hidden className="pl-mask-x absolute inset-x-0 top-10 h-20 opacity-30">
        <EcgLine duration={6} />
      </div>

      <div
        ref={ref}
        className="reveal relative mx-auto max-w-2xl px-6 text-center"
        data-visible={visible}
      >
        <p className="font-mono text-[11px] font-semibold tracking-[0.26em] text-pl-dim">
          READY WHEN YOU ARE
        </p>
        <h2 className="pl-display mt-5 text-3xl font-bold tracking-tight text-white md:text-[2.75rem] md:leading-[1.12]">
          Give every rep an unfair advantage
        </h2>
        <p className="mt-5 text-base text-pl-muted">
          Set up Pulse in an afternoon and watch your first scored pipeline land the same day.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup"
            className="pl-btn-primary arrow-nudge inline-flex h-12 items-center gap-2 rounded-full px-7 text-sm font-semibold"
          >
            Get started free <ArrowRight size={16} />
          </Link>
          <Link
            href="/login"
            className="pl-btn-ghost inline-flex h-12 items-center rounded-full px-7 text-sm font-semibold"
          >
            Sign in
          </Link>
        </div>
      </div>
    </section>
  );
}
