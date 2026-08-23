"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, MousePointer2, Play, Zap } from "lucide-react";
import { BrainHero } from "./BrainHero";
import { CyclingPhrase } from "./CyclingPhrase";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function Hero() {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLElement>(null);

  return (
    <section ref={ref} className="relative overflow-hidden pb-24 pt-14 md:pt-20">
      {/* Backdrop */}
      <div aria-hidden className="pl-grid pl-grid-fade absolute inset-0" />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-22rem] h-[38rem] w-[68rem] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(54,225,255,0.12), rgba(77,163,255,0.07) 55%, transparent)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6">
        {/* Copy block */}
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
            className="inline-flex items-center gap-2.5 rounded-full border border-white/[0.09] bg-white/[0.03] py-1.5 pr-4 pl-2 backdrop-blur"
          >
            <span className="flex items-center gap-1 rounded-full bg-pl-mint/10 px-2 py-0.5 font-mono text-[10px] font-semibold tracking-[0.18em] text-pl-mint">
              <Zap size={10} className="fill-pl-mint" /> LIVE
            </span>
            <span className="text-xs font-medium text-pl-muted">
              Pulse Intelligence Engine — AI scoring v3
            </span>
          </motion.div>

          <motion.h1
            initial={reduceMotion ? false : { opacity: 0, y: 34, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1, ease: EASE, delay: 0.08 }}
            className="pl-display mt-7 text-[2.65rem] leading-[1.04] font-bold text-white sm:text-6xl md:text-[4.35rem]"
          >
            Every customer signal,
            <br />
            scored into <CyclingPhrase />
          </motion.h1>

          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.3 }}
            className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-pl-muted sm:text-lg"
          >
            Pulse reads every touchpoint across your CRM, scores intent in real time, and hands
            each rep the priority list — before the deal goes cold.
          </motion.p>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.45 }}
            className="mt-9 flex flex-wrap items-center justify-center gap-3"
          >
            <Link
              href="/signup"
              className="pl-btn-primary arrow-nudge inline-flex h-12 items-center gap-2 rounded-full px-7 text-sm font-semibold"
            >
              Start free <ArrowRight size={16} />
            </Link>
            <Link
              href="/login"
              className="pl-btn-ghost inline-flex h-12 items-center gap-2.5 rounded-full px-7 text-sm font-semibold"
            >
              <span className="grid size-5 place-items-center rounded-full bg-pl-mint/15 text-pl-mint">
                <Play size={9} className="fill-current" />
              </span>
              Sign in to demo
            </Link>
          </motion.div>

          <motion.p
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.7 }}
            className="mt-6 font-mono text-[11px] tracking-[0.14em] text-pl-dim"
          >
            NO CREDIT CARD&nbsp;&nbsp;·&nbsp;&nbsp;SOC 2 TYPE II&nbsp;&nbsp;·&nbsp;&nbsp;LIVE IN AN
            AFTERNOON
          </motion.p>
        </div>

        {/* ── Neural engine stage ── */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 110, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.25, ease: EASE, delay: 0.55 }}
          className="relative mx-auto mt-10 max-w-5xl sm:mt-14"
        >
          {/* floor glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-16 bottom-0 h-44 rounded-[50%] opacity-60 blur-3xl"
            style={{
              background:
                "radial-gradient(50% 100% at 50% 100%, rgba(54,225,255,0.18), rgba(77,163,255,0.08) 55%, transparent)",
            }}
          />

          {/* Soft depth glow behind the engine */}
          <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
            <span
              className="pl-glow-breathe absolute size-52 rounded-full blur-3xl"
              style={{ background: "radial-gradient(closest-side, rgba(54,225,255,0.30), transparent)" }}
            />
            <span
              className="absolute bottom-6 left-1/2 h-24 w-[80%] -translate-x-1/2 rounded-[50%] blur-2xl"
              style={{ background: "radial-gradient(50% 100% at 50% 100%, rgba(255,154,77,0.18), transparent)" }}
            />
          </div>

          <BrainHero className="relative h-[440px] w-full cursor-grab select-none active:cursor-grabbing sm:h-[540px]" />

          {/* floating product chips */}
          <motion.div
            aria-hidden
            initial={reduceMotion ? false : { opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: EASE, delay: 1.1 }}
            className="absolute top-10 left-0 hidden lg:block"
          >
            <div className="pl-card pl-float-y pointer-events-none w-52 p-4 backdrop-blur-md">
              <p className="font-mono text-[10px] tracking-[0.2em] text-pl-dim">SIGNAL SPIKE</p>
              <p className="mt-2 flex items-baseline gap-1.5 font-mono text-xl font-bold text-white tabular-nums">
                +18<span className="text-xs font-medium text-pl-hot">pts</span>
              </p>
              <p className="mt-1 text-xs text-pl-muted">Maya Reyes · pricing ×4</p>
              <span className="mt-3 block h-1 overflow-hidden rounded-full bg-white/[0.06]">
                <span className="block h-full w-4/5 rounded-full bg-gradient-to-r from-pl-hot to-pl-amber" />
              </span>
            </div>
          </motion.div>

          <motion.div
            aria-hidden
            initial={reduceMotion ? false : { opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: EASE, delay: 1.25 }}
            className="absolute right-0 bottom-16 hidden lg:block"
          >
            <div className="pl-card pl-float-y-late pointer-events-none w-56 p-4 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-pl-mint shadow-[0_0_8px_rgba(0,229,153,0.9)]" />
                <p className="font-mono text-[10px] tracking-[0.2em] text-pl-dim">ACTION TAKEN</p>
              </div>
              <p className="mt-2 text-[13px] font-semibold text-white">Call logged · Maya Reyes</p>
              <p className="mt-1 text-xs text-pl-muted">Next review tomorrow · 9:00</p>
            </div>
          </motion.div>

          {/* drag hint */}
          <motion.p
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.6 }}
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -bottom-2 flex items-center justify-center gap-2 font-mono text-[10px] tracking-[0.26em] text-pl-dim"
          >
            <MousePointer2 size={11} /> DRAG TO EXPLORE THE ENGINE
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
