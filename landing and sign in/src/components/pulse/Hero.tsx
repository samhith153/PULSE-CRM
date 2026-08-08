import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { ArrowUpRight, Play, Star } from "lucide-react";
import { Link } from "@tanstack/react-router";
import heroBg from "@/assets/hero-mountains.jpg";
import { LeadCard, LeadTable, heroLeads } from "./HeroLeadCards";
import { CyclingPhrase } from "./CyclingPhrase";

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -90]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section ref={ref} className="relative overflow-hidden bg-background pb-10">
      <div className="mx-auto max-w-[1400px] px-3 pt-4 sm:px-6">
        <div className="relative overflow-hidden rounded-[2rem] ring-1 ring-border/60">
          <motion.img
            src={heroBg}
            alt="Layered misty mountain peaks"
            width={1920}
            height={1280}
            style={{ y: bgY, scale: bgScale }}
            className="absolute inset-0 size-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/40 to-background" />

          <div className="relative px-4 pt-16 pb-14 sm:pt-24">
            <motion.div
              style={{ y: copyY, opacity: copyOpacity }}
              className="mx-auto max-w-3xl text-center"
            >
              <motion.span
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-nav backdrop-blur"
              >
                <Star size={12} className="fill-brand-cyan text-brand-cyan" /> 4.8 overall reviews
              </motion.span>
              <motion.h1
                initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                className="mt-6 text-4xl leading-[1.06] font-bold tracking-tight text-ink sm:text-5xl md:text-6xl"
              >
                AI lead scoring for reps who
                <br />
                <CyclingPhrase />
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.35 }}
                className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg"
              >
                Pulse captures every lead, scores it instantly, and tells your team the next best
                action — before the deal goes cold.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.5 }}
                className="mt-9 flex flex-wrap items-center justify-center gap-3"
              >
                <Link
                  to="/signup"
                  className="group flex items-center gap-2 rounded-full bg-ink py-2 pr-2 pl-6 text-sm font-semibold text-background shadow-float transition-transform hover:-translate-y-0.5"
                >
                  Get started
                  <span className="flex size-9 items-center justify-center rounded-full bg-background/20">
                    <ArrowUpRight className="size-4 transition-transform group-hover:rotate-45" />
                  </span>
                </Link>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 rounded-full border border-border bg-card/85 px-7 py-3.5 text-sm font-semibold text-ink shadow-nav backdrop-blur transition-transform hover:-translate-y-0.5"
                >
                  <Play size={12} className="fill-current" /> Watch demo
                </Link>
              </motion.div>
            </motion.div>

            <div className="relative mx-auto mt-14 max-w-6xl">
              <motion.div
                initial={{ opacity: 0, y: 90, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 1.2, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
                className="mx-auto max-w-[36rem]"
              >
                <LeadTable />
              </motion.div>

              {heroLeads.map((lead, i) => (
                <motion.div
                  key={lead.name}
                  initial={{ opacity: 0, y: 40, x: i === 0 ? -30 : 30 }}
                  animate={{ opacity: 1, y: 0, x: 0 }}
                  transition={{ duration: 1, delay: 0.8 + i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                  className={`pointer-events-none absolute top-2 hidden lg:block ${
                    i === 0 ? "left-0" : "right-0"
                  }`}
                >
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 6 + i, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <LeadCard lead={lead} />
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
