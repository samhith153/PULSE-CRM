"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CalendarClock,
  Eye,
  FileText,
  Mail,
  MessageSquare,
  Phone,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NeuralCore } from "./NeuralCore";

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

const SIGNAL_POOL = [
  { icon: Mail, label: "Email reply", detail: "asked for pricing" },
  { icon: Eye, label: "Pricing page", detail: "viewed 4× today" },
  { icon: MessageSquare, label: "Chat started", detail: "integration question" },
  { icon: CalendarClock, label: "Meeting booked", detail: "Thu · 2:00 PM" },
  { icon: FileText, label: "Proposal opened", detail: "read 3m 12s" },
  { icon: Phone, label: "Call answered", detail: "9 min duration" },
];

type QueueLead = { name: string; company: string; score: number; action: string };

const QUEUE: QueueLead[] = [
  { name: "Maya Reyes", company: "Northwind Logistics", score: 92, action: "Call now" },
  { name: "Tom Beckett", company: "Kadence Retail", score: 76, action: "Send proposal" },
  { name: "Ana Ruiz", company: "Orbital Systems", score: 61, action: "Book demo" },
  { name: "Jonas Petit", company: "Vertex Health", score: 38, action: "Nurture" },
];

const AI_STATUS = [
  "Collecting signals…",
  "Parsing thread context…",
  "Weighting intent…",
  "Matching ICP fit…",
];

function band(score: number) {
  if (score >= 80) return { label: "HOT", color: "#ff6b4a" };
  if (score >= 55) return { label: "WARM", color: "#ffb454" };
  return { label: "COOL", color: "#4da3ff" };
}

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2);
}

/* Smoothly counts between values (rAF). */
function useCountTo(target: number, duration = 850) {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

/* ------------------------------------------------------------------ */
/* Score dial                                                          */
/* ------------------------------------------------------------------ */

function ScoreDial({ score }: { score: number }) {
  const R = 56;
  const C = 2 * Math.PI * R;
  const shown = useCountTo(score);
  const b = band(score);
  return (
    <div className="relative grid size-[150px] place-items-center">
      <svg viewBox="0 0 140 140" className="absolute inset-0 size-full -rotate-90">
        <circle cx="70" cy="70" r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="7" />
        <circle
          cx="70"
          cy="70"
          r={R}
          fill="none"
          stroke={b.color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C - (C * score) / 100}
          style={{
            transition: "stroke-dashoffset 0.9s cubic-bezier(0.22,1,0.36,1), stroke 0.4s ease",
            filter: `drop-shadow(0 0 10px ${b.color}66)`,
          }}
        />
      </svg>
      <div className="text-center">
        <div className="font-mono text-[2.6rem] font-bold leading-none tracking-tight text-white tabular-nums">
          {shown}
        </div>
        <div
          className="mt-1 font-mono text-[10px] font-semibold tracking-[0.24em]"
          style={{ color: b.color }}
        >
          {b.label}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Signal console                                                      */
/* ------------------------------------------------------------------ */

type FeedItem = { id: number; pool: number; secs: number };

let feedSeq = 100;

export function SignalConsole() {
  const reduceMotion = useReducedMotion();
  const hiddenRef = useRef(false);
  const lastPickRef = useRef(0);

  const [feed, setFeed] = useState<FeedItem[]>([
    { id: 1, pool: 1, secs: 12 },
    { id: 2, pool: 4, secs: 19 },
    { id: 3, pool: 0, secs: 31 },
    { id: 4, pool: 2, secs: 47 },
  ]);
  const [statusIdx, setStatusIdx] = useState(0);
  const [selected, setSelected] = useState(0);
  const [processed, setProcessed] = useState(12408);

  /* Pause all loops while the tab is hidden. */
  useEffect(() => {
    const onVis = () => {
      hiddenRef.current = document.hidden;
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  /* Incoming signal feed. */
  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => {
      if (hiddenRef.current) return;
      setFeed((rows) => {
        const aged = rows.map((r) => ({ ...r, secs: r.secs + 2 }));
        const next: FeedItem = { id: ++feedSeq, pool: feedSeq % SIGNAL_POOL.length, secs: 0 };
        return [next, ...aged.slice(0, 4)];
      });
    }, 2000);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  /* AI status ticker. */
  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => {
      if (!hiddenRef.current) setStatusIdx((i) => (i + 1) % AI_STATUS.length);
    }, 1100);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  /* Auto-cycle the priority pick unless the visitor took over recently. */
  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => {
      if (hiddenRef.current) return;
      if (Date.now() - lastPickRef.current > 7500) {
        setSelected((s) => (s + 1) % QUEUE.length);
      }
    }, 5200);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  /* Throughput counter. */
  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => {
      if (!hiddenRef.current) setProcessed((n) => n + 3);
    }, 1600);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  const lead = QUEUE[selected];
  const b = band(lead.score);

  const pick = (i: number) => {
    setSelected(i);
    lastPickRef.current = Date.now();
  };

  return (
    <div className="pl-card overflow-hidden bg-[#070b12]/90 shadow-[0_50px_140px_-40px_rgba(0,0,0,0.9)] backdrop-blur-xl">
      {/* Console chrome */}
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-2.5 sm:px-5">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-pl-mint opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-pl-mint" />
        </span>
        <span className="font-mono text-[10.5px] font-semibold tracking-[0.22em] text-pl-muted">
          SIGNAL&nbsp;CONSOLE
        </span>
        <span className="ml-auto hidden font-mono text-[10.5px] tracking-wider text-pl-dim sm:inline">
          {processed.toLocaleString()} signals today
        </span>
        <span className="rounded-full border border-pl-mint/25 bg-pl-mint/[0.07] px-2.5 py-1 font-mono text-[10px] font-semibold tracking-[0.16em] text-pl-mint">
          ENGINE ONLINE
        </span>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_minmax(0,17rem)]">
        {/* ── Incoming signals ── */}
        <div className="border-b border-white/[0.06] p-4 sm:p-5 lg:border-b-0 lg:border-r">
          <p className="font-mono text-[10px] font-semibold tracking-[0.24em] text-pl-dim">
            INCOMING SIGNALS
          </p>
          <div className="mt-3.5 flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {feed.map((row) => {
                const s = SIGNAL_POOL[row.pool];
                const Icon = s.icon;
                return (
                  <motion.div
                    key={row.id}
                    layout
                    initial={reduceMotion ? false : { opacity: 0, y: -14, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={reduceMotion ? undefined : { opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="flex items-center gap-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02] px-2.5 py-2"
                  >
                    <span className="grid size-7 shrink-0 place-items-center rounded-lg border border-pl-blue/20 bg-pl-blue/[0.08] text-pl-blue">
                      <Icon size={13} />
                    </span>
                    <span className="min-w-0 flex-1 leading-tight">
                      <span className="block truncate text-xs font-medium text-white/90">{s.label}</span>
                      <span className="block truncate text-[11px] text-pl-muted">{s.detail}</span>
                    </span>
                    <span className="shrink-0 font-mono text-[10px] text-pl-dim">
                      {row.secs === 0 ? "now" : `${row.secs}s`}
                    </span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* ── AI core ── */}
        <div className="relative flex flex-col items-center justify-center border-b border-white/[0.06] px-6 py-8 lg:border-b-0 lg:border-r">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-3xl"
            style={{ background: "radial-gradient(closest-side, rgba(0,229,153,0.28), transparent)" }}
          />
          {/* orbiting signal chips */}
          <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
            {[Mail, Eye, MessageSquare].map((Icon, i) => (
              <span
                key={i}
                className="pl-orbit absolute grid size-8 place-items-center rounded-lg border border-white/10 bg-[#0b1019]/90 text-pl-muted"
                style={
                  {
                    "--pl-r": "118px",
                    "--pl-dur": `${16 + i * 5}s`,
                    animationDelay: `${i * -6}s`,
                  } as CSSProperties
                }
              >
                <Icon size={13} />
              </span>
            ))}
          </div>

          <div className="relative grid size-[215px] place-items-center sm:size-[235px]">
            {/* CSS aura — visible before/without WebGL */}
            <div aria-hidden className="absolute inset-0">
              <span className="pl-spin-slow absolute inset-1 rounded-full border border-dashed border-pl-mint/25" />
              <span className="pl-spin-rev absolute inset-7 rounded-full border border-pl-blue/20" />
              <span
                className="pl-glow-breathe absolute inset-10 rounded-full blur-xl"
                style={{ background: "radial-gradient(closest-side, rgba(0,229,153,0.35), transparent)" }}
              />
            </div>
            <NeuralCore className="absolute -inset-5 cursor-grab active:cursor-grabbing" />
            <div className="pointer-events-none relative rounded-full bg-[#070b12]/60 p-1.5 backdrop-blur-[2px]">
              <ScoreDial score={lead.score} />
            </div>
          </div>

          <div className="mt-5 flex h-5 items-center justify-center">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={statusIdx}
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
                transition={{ duration: 0.3 }}
                className="font-mono text-[11px] tracking-wide text-pl-muted"
              >
                {AI_STATUS[statusIdx]}
              </motion.span>
            </AnimatePresence>
          </div>
          <p className="mt-2 font-mono text-[10px] tracking-[0.2em] text-pl-dim">
            SCORING&nbsp;·&nbsp;
            <span className="text-pl-mint">PULSE-AI</span>&nbsp;v3
          </p>
        </div>

        {/* ── Priority queue ── */}
        <div className="p-4 sm:p-5">
          <p className="font-mono text-[10px] font-semibold tracking-[0.24em] text-pl-dim">
            PRIORITY QUEUE
          </p>
          <div className="mt-3.5 flex flex-col gap-1.5" role="listbox" aria-label="Prioritized leads">
            {QUEUE.map((q, i) => {
              const qb = band(q.score);
              const isActive = i === selected;
              return (
                <button
                  key={q.name}
                  role="option"
                  aria-selected={isActive}
                  onClick={() => pick(i)}
                  className={cn(
                    "w-full rounded-xl border px-3 py-2.5 text-left transition-all duration-300",
                    isActive
                      ? "border-white/[0.14] bg-white/[0.05]"
                      : "border-transparent hover:bg-white/[0.03]",
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        "grid size-8 shrink-0 place-items-center rounded-lg font-mono text-[11px] font-bold transition-colors",
                        isActive ? "text-[#03130c]" : "bg-white/[0.06] text-white/80",
                      )}
                      style={isActive ? { background: qb.color } : undefined}
                    >
                      {initials(q.name)}
                    </span>
                    <span className="min-w-0 flex-1 leading-tight">
                      <span className="block truncate text-[13px] font-semibold text-white">{q.name}</span>
                      <span className="block truncate text-[11px] text-pl-muted">{q.company}</span>
                    </span>
                    <span
                      className="shrink-0 font-mono text-sm font-bold tabular-nums"
                      style={{ color: qb.color }}
                    >
                      {q.score}
                    </span>
                  </span>
                  <span className="mt-1.5 flex items-center gap-1.5 pl-[42px]">
                    <Zap size={11} style={{ color: isActive ? qb.color : "#5a6478" }} />
                    <span
                      className={cn(
                        "text-[11px] font-medium transition-colors",
                        isActive ? "text-white/90" : "text-pl-dim",
                      )}
                    >
                      {q.action}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Next-best-action footer */}
      <div className="flex items-center gap-3 border-t border-white/[0.06] bg-white/[0.02] px-4 py-3 sm:px-5">
        <span
          className="size-1.5 shrink-0 rounded-full"
          style={{ background: b.color, boxShadow: `0 0 10px ${b.color}` }}
        />
        <span className="truncate font-mono text-[11px] tracking-wider text-pl-muted">
          NEXT BEST ACTION
        </span>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={lead.name}
            initial={reduceMotion ? false : { opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, x: -8 }}
            transition={{ duration: 0.28 }}
            className="ml-auto flex min-w-0 items-center gap-2 truncate text-[13px] font-semibold text-white"
          >
            <span className="truncate">
              {lead.action} · {lead.name}
            </span>
            <ArrowRight size={14} style={{ color: b.color }} className="shrink-0" />
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}
