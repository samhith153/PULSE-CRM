"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Fingerprint,
  Link2,
  Mail,
  Monitor,
  ShieldCheck,
  Webhook,
} from "lucide-react";
import { useReveal } from "@/hooks/use-reveal";
import { cn } from "@/lib/utils";

/* ---------------- shared card shell ---------------- */

function Card({
  title,
  desc,
  className = "",
  children,
  delay = 0,
  visible,
}: {
  title: string;
  desc: string;
  className?: string;
  children: React.ReactNode;
  delay?: number;
  visible: boolean;
}) {
  return (
    <div
      className={cn(
        "pl-card pl-card-hover reveal group relative flex flex-col overflow-hidden p-6",
        className,
      )}
      data-visible={visible}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-[-20%] size-56 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: "radial-gradient(closest-side, rgba(0,229,153,0.16), transparent)" }}
      />
      <div className="mb-5 flex-1">{children}</div>
      <h3 className="text-base font-semibold tracking-tight text-white">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-pl-muted">{desc}</p>
    </div>
  );
}

/** interval that respects reduced motion */
function useLoop(fn: () => void, ms: number) {
  const saved = useRef(fn);
  useEffect(() => {
    saved.current = fn;
  });
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => saved.current(), ms);
    return () => clearInterval(id);
  }, [ms]);
}

const demoPanel =
  "rounded-xl border border-white/[0.07] bg-[#070b13] p-4";

/* ---------------- 1. Lead scoring ---------------- */

function LeadScoring() {
  const [score, setScore] = useState(18);
  useLoop(() => setScore((s) => (s >= 96 ? 12 : s + 3)), 90);
  const band = score > 74 ? "HOT" : score > 42 ? "WARM" : "COOL";
  const bandColor = score > 74 ? "#ff6b4a" : score > 42 ? "#ffb454" : "#4da3ff";
  const bandClass = score > 74 ? "bg-pl-hot/15 text-pl-hot" : score > 42 ? "bg-pl-amber/15 text-pl-amber" : "bg-pl-blue/15 text-pl-blue";

  return (
    <div className={demoPanel}>
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-pl-mint to-pl-blue font-mono text-xs font-bold text-[#03130c]">
          MR
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">Maya Reyes</p>
          <p className="truncate text-xs text-pl-dim">VP Ops · Northwind</p>
        </div>
        <span className={cn("ml-auto shrink-0 rounded-full px-2.5 py-1 font-mono text-[10px] font-bold tracking-widest", bandClass)}>
          {band}
        </span>
      </div>
      <div className="mt-4 flex items-end justify-between">
        <span className="font-mono text-3xl leading-none font-bold text-white tabular-nums">
          {score}
        </span>
        <span className="font-mono text-[10px] tracking-[0.18em] text-pl-dim">FIT + INTENT</span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-pl-mint to-pl-blue transition-[width] duration-100 ease-linear"
          style={{ width: `${score}%`, boxShadow: `0 0 12px ${bandColor}55` }}
        />
      </div>
    </div>
  );
}

/* ---------------- 2. Duplicate & spam feed ---------------- */

const feedPool = [
  { email: "duplicate_lead@email.com", action: "Merged", tone: "text-pl-mint" },
  { email: "spam_entry@throwaway.com", action: "Blocked", tone: "text-pl-dim" },
  { email: "j.doe+alias@acme.co", action: "Merged", tone: "text-pl-mint" },
  { email: "no-reply@mailinator.com", action: "Blocked", tone: "text-pl-dim" },
  { email: "sales@vertexlabs.io", action: "Verified", tone: "text-pl-mint" },
];

function stamp(offset: number) {
  const d = new Date(Date.now() - offset * 7000);
  return d.toTimeString().slice(0, 8);
}

function SpamFeed() {
  const [rows, setRows] = useState(() =>
    Array.from({ length: 4 }, (_, i) => ({ ...feedPool[i % feedPool.length], id: i, t: "--:--:--" })),
  );
  const next = useRef(4);
  /* real timestamps only after hydration, so SSR and client markup match */
  useEffect(() => {
    setRows((r) => r.map((row, i) => ({ ...row, t: stamp(r.length - 1 - i) })));
  }, []);
  useLoop(() => {
    setRows((r) => {
      const id = next.current++;
      return [...r.slice(1), { ...feedPool[id % feedPool.length], id, t: stamp(0) }];
    });
  }, 1600);

  return (
    <div className={cn(demoPanel, "h-[132px] overflow-hidden font-mono text-[11px]")}>
      <div className="flex flex-col gap-2.5">
        {rows.map((r) => (
          <div key={r.id} className="rise-in flex items-center gap-2">
            <span className="shrink-0 text-white/25">{r.t}</span>
            <span className="truncate text-white/75">{r.email}</span>
            <span className={cn("ml-auto shrink-0 font-semibold", r.tone)}>{r.action}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- 3. Compliance ---------------- */

function Compliance() {
  const badges = ["SOC 2 Type II", "GDPR", "CCPA", "ISO 27001"];
  return (
    <div className={cn(demoPanel, "grid grid-cols-2 gap-2")}>
      {badges.map((b) => (
        <div key={b} className="flex items-center gap-2 rounded-lg border border-white/[0.06] px-2.5 py-2">
          <BadgeCheck size={14} className="shrink-0 text-pl-mint" />
          <span className="truncate text-[11px] font-medium text-white/80">{b}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------------- 4. Session monitoring ---------------- */

function SessionCard() {
  const [pulse, setPulse] = useState(0);
  useLoop(() => setPulse((p) => p + 1), 2600);
  return (
    <div className={demoPanel}>
      <div className="flex items-center gap-3">
        <Monitor size={16} className="shrink-0 text-white/60" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">MacBook Pro · Chrome</p>
          <p className="truncate text-xs text-pl-dim">Austin, TX · active now</p>
        </div>
        <span key={pulse} className="ml-auto size-2 shrink-0 animate-ping rounded-full bg-pl-mint" />
      </div>
      <button className="arrow-nudge mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/[0.12] px-3 py-1.5 text-xs font-medium text-white/80 transition-colors hover:bg-white/[0.05]">
        View activity <ArrowRight size={13} />
      </button>
    </div>
  );
}

/* ---------------- 5. One-click login ---------------- */

function OneClickLogin() {
  const [active, setActive] = useState(0);
  useLoop(() => setActive((a) => (a + 1) % 2), 1800);
  const items = ["Continue with Google", "Continue with Microsoft"];
  return (
    <div className={cn(demoPanel, "flex flex-col gap-2")}>
      {items.map((label, i) => (
        <div
          key={label}
          className={cn(
            "flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium transition-all duration-300",
            active === i
              ? "-translate-y-0.5 border-pl-mint/30 bg-pl-mint/[0.06] text-white shadow-[0_8px_24px_-12px_rgba(0,229,153,0.4)]"
              : "border-white/[0.07] text-white/50",
          )}
        >
          <Fingerprint size={14} className="shrink-0" />
          {label}
        </div>
      ))}
    </div>
  );
}

/* ---------------- 6. Bot filtering ---------------- */

function BotFilter() {
  const [n, setN] = useState(1204);
  useLoop(() => setN((v) => v + 1), 1200);
  return (
    <div className={cn(demoPanel, "flex items-center gap-4")}>
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-pl-mint to-pl-blue text-[#03130c]">
        <ShieldCheck size={19} />
      </span>
      <div className="min-w-0">
        <p className="font-mono text-xl font-bold text-white tabular-nums">{n.toLocaleString()}</p>
        <p className="truncate text-xs text-pl-dim">fake leads filtered this month</p>
      </div>
    </div>
  );
}

/* ---------------- 7. OTP ---------------- */

function OtpCard() {
  const [tick, setTick] = useState(0);
  useLoop(() => setTick((t) => t + 1), 420);
  const filled = tick % 7;
  const digits = [4, 8, 1, 9, 2, 6];
  return (
    <div className={demoPanel}>
      <p className="text-xs text-pl-dim">Verifying lead contact</p>
      <div className="mt-3 flex gap-2">
        {digits.map((d, i) => (
          <span
            key={i}
            className={cn(
              "grid h-10 flex-1 place-items-center rounded-lg border font-mono text-sm font-semibold transition-all duration-200",
              i < filled
                ? "border-pl-mint/30 bg-pl-mint/[0.08] text-white"
                : "border-white/[0.07] text-white/20",
            )}
          >
            {i < filled ? d : "•"}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------------- 8. Magic link ---------------- */

function MagicLink() {
  const [step, setStep] = useState(0);
  useLoop(() => setStep((s) => (s + 1) % 3), 1600);
  return (
    <div className={cn(demoPanel, "flex flex-col gap-2")}>
      <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-white/[0.06] px-3 py-2 text-xs text-white/75">
        Can you resend the proposal?
      </div>
      <div
        className={cn(
          "ml-auto flex max-w-[85%] items-center gap-2 rounded-2xl rounded-br-sm bg-gradient-to-br from-pl-mint to-pl-blue px-3 py-2 text-xs font-medium text-[#03130c] transition-all duration-500",
          step >= 1 ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
        )}
      >
        <Link2 size={13} className="shrink-0" />
        <span className="truncate">pulse.crm/l/8fa2 — one-click open</span>
      </div>
      <p
        className={cn(
          "ml-auto font-mono text-[11px] text-pl-dim transition-opacity duration-500",
          step >= 2 ? "opacity-100" : "opacity-0",
        )}
      >
        Opened · 12s ago
      </p>
    </div>
  );
}

/* ---------------- 9. API & webhooks ---------------- */

function ApiCard() {
  return (
    <div className={demoPanel}>
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-white/[0.12] font-mono text-[11px] font-bold text-white">
          P
        </span>
        <span className="relative h-px flex-1 bg-white/[0.12]">
          <span className="wire-dot absolute top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-pl-mint shadow-[0_0_8px_rgba(0,229,153,0.9)]" />
        </span>
        <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-white/[0.12] text-white/60">
          <Webhook size={15} />
        </span>
      </div>
      <pre className="mt-4 overflow-hidden rounded-lg bg-white/[0.04] p-3 font-mono text-[11px] leading-relaxed text-white/60">
        {`POST /v1/leads
{ "email": "ada@vertex.io" }`}
      </pre>
    </div>
  );
}

/* ---------------- section ---------------- */

export function BentoGrid() {
  const { ref, visible } = useReveal<HTMLDivElement>(0.05);

  return (
    <section className="lead-mgmt-section relative overflow-hidden border-y border-white/[0.06] bg-[#05080f] py-24 md:py-32">
      <div aria-hidden className="pl-grid absolute inset-0 opacity-50 pl-mask-b" />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full opacity-50 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(0,229,153,0.14), rgba(77,163,255,0.08) 55%, transparent)",
        }}
      />

      <div ref={ref} className="relative mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-6 sm:flex sm:justify-between">
          <div className="min-w-0 max-w-2xl">
            <p
              className="reveal inline-flex rounded-full border border-white/[0.09] px-3 py-1 font-mono text-[10.5px] font-semibold tracking-[0.24em] text-pl-mint"
              data-visible={visible}
            >
              LEAD MANAGEMENT
            </p>
            <h2
              className="reveal pl-display mt-5 text-3xl font-bold tracking-tight text-white md:text-[2.5rem]"
              data-visible={visible}
              style={{ transitionDelay: "60ms" }}
            >
              Everything you need to convert leads
            </h2>
            <p
              className="reveal mt-4 text-base text-pl-muted"
              data-visible={visible}
              style={{ transitionDelay: "120ms" }}
            >
              Capture, clean, verify and route every lead automatically — so reps only ever touch
              pipeline that&rsquo;s worth their time.
            </p>
          </div>
          <a
            href="#"
            className="arrow-nudge reveal inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-pl-mint transition-colors hover:text-white"
            data-visible={visible}
            style={{ transitionDelay: "160ms" }}
          >
            See all features <ArrowRight size={15} />
          </a>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-6">
          <Card title="Smart Lead Scoring" desc="Fit and intent scored in real time, with bands that update as signals arrive." className="lg:col-span-3" visible={visible} delay={0}>
            <LeadScoring />
          </Card>
          <Card title="Duplicate & Spam Detection" desc="Merges duplicates and blocks junk before it ever reaches a rep." className="lg:col-span-3" visible={visible} delay={80}>
            <SpamFeed />
          </Card>
          <Card title="Data Security & Compliance" desc="Enterprise-grade controls audited end to end." className="lg:col-span-2" visible={visible} delay={160}>
            <Compliance />
          </Card>
          <Card title="Rep Activity & Session Monitoring" desc="See who's active, on what device, from where." className="lg:col-span-2" visible={visible} delay={240}>
            <SessionCard />
          </Card>
          <Card title="One-Click Rep Login" desc="SSO your team already uses, zero password resets." className="lg:col-span-2" visible={visible} delay={320}>
            <OneClickLogin />
          </Card>
          <Card title="Bot & Fake Lead Filtering" desc="Automated traffic never makes it into pipeline." className="lg:col-span-2" visible={visible} delay={400}>
            <BotFilter />
          </Card>
          <Card title="Email & SMS Verification" desc="Confirm every contact detail the moment a lead lands." className="lg:col-span-2" visible={visible} delay={480}>
            <OtpCard />
          </Card>
          <Card title="Magic Link Follow-ups" desc="One-tap links that open the right deal context instantly." className="lg:col-span-2" visible={visible} delay={560}>
            <MagicLink />
          </Card>
          <Card title="API & Webhooks" desc="Stream leads and events between Pulse and your stack." className="lg:col-span-3" visible={visible} delay={640}>
            <ApiCard />
          </Card>
          <Card title="Bulk List Hygiene" desc="Bulk-verify imported lists without burning sender reputation." className="lg:col-span-3" visible={visible} delay={720}>
            <div className={cn(demoPanel, "flex items-center gap-3")}>
              <Mail size={16} className="shrink-0 text-white/60" />
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                <span className="scan-bar block h-full w-1/3 rounded-full bg-gradient-to-r from-pl-mint to-pl-blue" />
              </div>
              <span className="shrink-0 font-mono text-xs text-pl-muted">98.4%</span>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
