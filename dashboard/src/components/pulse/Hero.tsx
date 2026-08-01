import { Play, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { pillVariants } from "./PillButton";
import { HeroDashboard } from "./HeroDashboard";

export function Hero() {
  return (
    <section className="mesh-hero">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="mesh-blob drift-a -top-32 -left-24 size-[46rem] bg-brand-purple" />
        <div className="mesh-blob drift-b top-10 left-1/3 size-[42rem] bg-brand-blue" />
        <div className="mesh-blob drift-c -right-24 -bottom-40 size-[40rem] bg-brand-cyan" />
        <div className="mesh-blob drift-b top-1/2 left-2/3 size-[30rem] bg-brand-purple opacity-60" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-24 md:py-32 lg:grid-cols-[1fr_1.15fr]">
        <div>
        <p
          className="rise-in text-xs font-semibold tracking-[0.2em] text-primary-foreground/80 uppercase"
          style={{ animationDelay: "40ms" }}
        >
          Pulse CRM
        </p>
        <h1
          className="rise-in mt-6 max-w-3xl text-[2.4rem] leading-[1.05] font-bold tracking-tight text-primary-foreground md:text-6xl"
          style={{ animationDelay: "120ms" }}
        >
          The AI platform built
          <br className="hidden sm:block" /> for reps who close more deals
        </h1>
        <p
          className="rise-in mt-6 max-w-[500px] text-base leading-relaxed text-primary-foreground/85 md:text-lg"
          style={{ animationDelay: "220ms" }}
        >
          Capture every lead, score it in seconds, and let Pulse tell your team exactly what to do
          next — before the deal goes cold.
        </p>
        <div className="rise-in mt-10 flex flex-wrap gap-3" style={{ animationDelay: "320ms" }}>
          <Link
            to="/dashboard"
            className={pillVariants({ size: "lg", variant: "dark" })}
          >
            <span className="grid size-6 place-items-center rounded-full bg-primary-foreground/15">
              <Play size={11} className="translate-x-px fill-current" />
            </span>
            Watch demo
          </Link>
          <Link
            to="/signup"
            className={pillVariants({ size: "lg", variant: "light", className: "arrow-nudge" })}
          >
            Explore Pulse <ArrowRight size={16} />
          </Link>
        </div>
        </div>

        <div className="rise-in" style={{ animationDelay: "420ms" }}>
          <HeroDashboard />
        </div>
      </div>
    </section>
  );
}
