import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ShieldCheck,
  Monitor,
  Link2,
  Mail,
  Webhook,
  BadgeCheck,
  Fingerprint,
} from "lucide-react";
import { useReveal } from "@/hooks/use-reveal";

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
      className={`reveal group relative flex flex-col overflow-hidden rounded-2xl border border-primary-foreground/10 bg-primary-foreground/[0.04] p-6 backdrop-blur-sm transition-colors duration-300 hover:border-primary-foreground/20 ${className}`}
      data-visible={visible}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="mb-5 flex-1">{children}</div>
      <h3 className="text-base font-semibold tracking-tight text-primary-foreground">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-primary-foreground/55">{desc}</p>
    </div>
  );
}

/** interval that respects reduced motion */
function useLoop(fn: () => void, ms: number) {
  const saved = useRef(fn);
  saved.current = fn;
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => saved.current(), ms);
    return () => clearInterval(id);
  }, [ms]);
}

/* ---------------- 1. Lead scoring ---------------- */

function LeadScoring() {
  const [score, setScore] = useState(18);
  useLoop(() => setScore((s) => (s >= 96 ? 12 : s + 3)), 90);
  const band = score > 74 ? "Hot" : score > 42 ? "Warm" : "Cold";
  const bandClass =
    score > 74
      ? "grad-orange-pink text-primary-foreground"
      : score > 42
        ? "grad-pink-purple text-primary-foreground"
        : "bg-primary-foreground/10 text-primary-foreground/70";

  return (
    <div className="rounded-xl border border-primary-foreground/10 bg-ink/60 p-4">
      <div className="flex items-center gap-3">
        <span className="grad-blue-purple grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold text-primary-foreground">
          MR
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-primary-foreground">Maya Reyes</p>
          <p className="truncate text-xs text-primary-foreground/45">VP Ops · Northwind</p>
        </div>
        <span
          className={`ml-auto shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${bandClass}`}
        >
          {band}
        </span>
      </div>
      <div className="mt-4 flex items-end justify-between">
        <span className="font-mono text-3xl leading-none font-bold text-primary-foreground tabular-nums">
          {score}
        </span>
        <span className="text-xs text-primary-foreground/45">fit + intent</span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-primary-foreground/10">
        <div
          className="grad-teal-purple h-full rounded-full transition-[width] duration-100 ease-linear"
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

/* ---------------- 2. Duplicate & spam feed ---------------- */

const feedPool = [
  { email: "duplicate_lead@email.com", action: "Merged", tone: "text-brand-cyan" },
  { email: "spam_entry@throwaway.com", action: "Blocked", tone: "text-primary-foreground/50" },
  { email: "j.doe+alias@acme.co", action: "Merged", tone: "text-brand-cyan" },
  { email: "no-reply@mailinator.com", action: "Blocked", tone: "text-primary-foreground/50" },
  { email: "sales@vertexlabs.io", action: "Verified", tone: "text-brand-cyan" },
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
  // real timestamps only after hydration, so SSR and client markup match
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
    <div className="h-[132px] overflow-hidden rounded-xl border border-primary-foreground/10 bg-ink/60 p-3 font-mono text-[11px]">
      <div className="flex flex-col gap-2">
        {rows.map((r) => (
          <div key={r.id} className="rise-in flex items-center gap-2">
            <span className="shrink-0 text-primary-foreground/30">{r.t}</span>
            <span className="truncate text-primary-foreground/75">{r.email}</span>
            <span className={`ml-auto shrink-0 font-semibold ${r.tone}`}>{r.action}</span>
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
    <div className="shimmer relative grid grid-cols-2 gap-2 overflow-hidden rounded-xl border border-primary-foreground/10 bg-ink/60 p-4">
      {badges.map((b) => (
        <div
          key={b}
          className="flex items-center gap-2 rounded-lg border border-primary-foreground/10 px-2.5 py-2"
        >
          <BadgeCheck size={14} className="shrink-0 text-brand-cyan" />
          <span className="truncate text-[11px] font-medium text-primary-foreground/80">{b}</span>
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
    <div className="rounded-xl border border-primary-foreground/10 bg-ink/60 p-4">
      <div className="flex items-center gap-3">
        <Monitor size={16} className="shrink-0 text-primary-foreground/70" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-primary-foreground">MacBook Pro · Chrome</p>
          <p className="truncate text-xs text-primary-foreground/45">Austin, TX · active now</p>
        </div>
        <span key={pulse} className="ml-auto size-2 shrink-0 animate-ping rounded-full bg-brand-cyan" />
      </div>
      <button className="arrow-nudge mt-4 inline-flex items-center gap-1.5 rounded-full border border-primary-foreground/15 px-3 py-1.5 text-xs font-medium text-primary-foreground/80 transition-colors hover:bg-primary-foreground/10">
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
    <div className="flex flex-col gap-2 rounded-xl border border-primary-foreground/10 bg-ink/60 p-4">
      {items.map((label, i) => (
        <div
          key={label}
          className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium transition-all duration-300 ${
            active === i
              ? "-translate-y-0.5 border-primary-foreground/35 bg-primary-foreground/10 text-primary-foreground shadow-nav"
              : "border-primary-foreground/10 text-primary-foreground/55"
          }`}
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
    <div className="flex items-center gap-4 rounded-xl border border-primary-foreground/10 bg-ink/60 p-4">
      <span className="grad-teal-purple grid size-11 shrink-0 place-items-center rounded-xl">
        <ShieldCheck size={19} className="text-primary-foreground" />
      </span>
      <div className="min-w-0">
        <p className="font-mono text-xl font-bold text-primary-foreground tabular-nums">
          {n.toLocaleString()}
        </p>
        <p className="truncate text-xs text-primary-foreground/45">fake leads filtered this month</p>
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
    <div className="rounded-xl border border-primary-foreground/10 bg-ink/60 p-4">
      <p className="text-xs text-primary-foreground/45">Verifying lead contact</p>
      <div className="mt-3 flex gap-2">
        {digits.map((d, i) => (
          <span
            key={i}
            className={`grid h-10 flex-1 place-items-center rounded-lg border font-mono text-sm font-semibold transition-all duration-200 ${
              i < filled
                ? "border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground"
                : "border-primary-foreground/10 text-primary-foreground/20"
            }`}
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
    <div className="flex flex-col gap-2 rounded-xl border border-primary-foreground/10 bg-ink/60 p-4">
      <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-primary-foreground/10 px-3 py-2 text-xs text-primary-foreground/75">
        Can you resend the proposal?
      </div>
      <div
        className={`grad-blue-purple ml-auto flex max-w-[85%] items-center gap-2 rounded-2xl rounded-br-sm px-3 py-2 text-xs text-primary-foreground transition-all duration-500 ${
          step >= 1 ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        <Link2 size={13} className="shrink-0" />
        <span className="truncate">pulse.crm/l/8fa2 — one-click open</span>
      </div>
      <p
        className={`ml-auto text-[11px] text-primary-foreground/40 transition-opacity duration-500 ${
          step >= 2 ? "opacity-100" : "opacity-0"
        }`}
      >
        Opened · 12s ago
      </p>
    </div>
  );
}

/* ---------------- 9. API & webhooks ---------------- */

function ApiCard() {
  return (
    <div className="rounded-xl border border-primary-foreground/10 bg-ink/60 p-4">
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-primary-foreground/15 text-[11px] font-bold text-primary-foreground">
          P
        </span>
        <span className="relative h-px flex-1 bg-primary-foreground/15">
          <span className="wire-dot absolute top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-brand-cyan" />
        </span>
        <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-primary-foreground/15 text-primary-foreground/70">
          <Webhook size={15} />
        </span>
      </div>
      <pre className="mt-4 overflow-hidden rounded-lg bg-primary-foreground/[0.06] p-3 font-mono text-[11px] leading-relaxed text-primary-foreground/70">
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
    <section className="relative overflow-hidden bg-ink py-24 md:py-32">
      <div aria-hidden className="circuit-bg pointer-events-none absolute inset-0 opacity-[0.13]" />
      <div ref={ref} className="relative mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-6 sm:flex sm:justify-between">
          <div className="min-w-0 max-w-2xl">
            <span
              className="reveal inline-flex rounded-full border border-primary-foreground/15 px-3 py-1 text-xs font-medium text-primary-foreground/70"
              data-visible={visible}
            >
              Lead Management
            </span>
            <h2
              className="reveal mt-5 text-3xl leading-tight font-bold tracking-tight text-primary-foreground md:text-[2.5rem]"
              data-visible={visible}
              style={{ transitionDelay: "60ms" }}
            >
              Everything you need to convert leads
            </h2>
            <p
              className="reveal mt-4 text-base text-primary-foreground/60"
              data-visible={visible}
              style={{ transitionDelay: "120ms" }}
            >
              Capture, clean, verify and route every lead automatically — so reps only ever touch
              pipeline that's worth their time.
            </p>
          </div>
          <a
            href="#"
            className="arrow-nudge reveal inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-primary-foreground"
            data-visible={visible}
            style={{ transitionDelay: "160ms" }}
          >
            See all features <ArrowRight size={15} />
          </a>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-6">
          <Card
            title="Smart Lead Scoring"
            desc="Fit and intent scored in real time, with bands that update as signals arrive."
            className="lg:col-span-3"
            visible={visible}
            delay={0}
          >
            <LeadScoring />
          </Card>
          <Card
            title="Duplicate & Spam Detection"
            desc="Merges duplicates and blocks junk before it ever reaches a rep."
            className="lg:col-span-3"
            visible={visible}
            delay={80}
          >
            <SpamFeed />
          </Card>
          <Card
            title="Data Security & Compliance"
            desc="Enterprise-grade controls audited end to end."
            className="lg:col-span-2"
            visible={visible}
            delay={160}
          >
            <Compliance />
          </Card>
          <Card
            title="Rep Activity & Session Monitoring"
            desc="See who's active, on what device, from where."
            className="lg:col-span-2"
            visible={visible}
            delay={240}
          >
            <SessionCard />
          </Card>
          <Card
            title="One-Click Rep Login"
            desc="SSO your team already uses, zero password resets."
            className="lg:col-span-2"
            visible={visible}
            delay={320}
          >
            <OneClickLogin />
          </Card>
          <Card
            title="Bot & Fake Lead Filtering"
            desc="Automated traffic never makes it into pipeline."
            className="lg:col-span-2"
            visible={visible}
            delay={400}
          >
            <BotFilter />
          </Card>
          <Card
            title="Email & SMS Verification"
            desc="Confirm every contact detail the moment a lead lands."
            className="lg:col-span-2"
            visible={visible}
            delay={480}
          >
            <OtpCard />
          </Card>
          <Card
            title="Magic Link Follow-ups"
            desc="One-tap links that open the right deal context instantly."
            className="lg:col-span-2"
            visible={visible}
            delay={560}
          >
            <MagicLink />
          </Card>
          <Card
            title="API & Webhooks"
            desc="Stream leads and events between Pulse and your stack."
            className="lg:col-span-3"
            visible={visible}
            delay={640}
          >
            <ApiCard />
          </Card>
          <Card
            title="Bulk List Hygiene"
            desc="Bulk-verify imported lists without burning sender reputation."
            className="lg:col-span-3"
            visible={visible}
            delay={720}
          >
            <div className="flex items-center gap-3 rounded-xl border border-primary-foreground/10 bg-ink/60 p-4">
              <Mail size={16} className="shrink-0 text-primary-foreground/70" />
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-primary-foreground/10">
                <span className="scan-bar grad-blue-purple block h-full w-1/3 rounded-full" />
              </div>
              <span className="shrink-0 font-mono text-xs text-primary-foreground/60">98.4%</span>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
