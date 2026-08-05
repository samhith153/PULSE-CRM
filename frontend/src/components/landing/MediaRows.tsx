import { ArrowRight } from "lucide-react";
import { useReveal } from "@/hooks/use-reveal";
import leadsImage from "../../../public/images/landing/product-leads.jpg";
import pipelineImage from "../../../public/images/landing/product-pipeline.jpg";
import { cn } from "@/lib/utils";

type Row = {
  eyebrow: string;
  title: string;
  desc: string;
  image: string;
  alt: string;
  reversed?: boolean;
};

const rows: Row[] = [
  {
    eyebrow: "Lead capture",
    title: "Never lose a lead between the form and the follow-up",
    desc: "Pulse captures leads from every channel, enriches them with firmographic data, and scores them before your rep opens the tab. No manual triage, no cold inbox.",
    image: leadsImage,
    alt: "Pulse lead scoring dashboard",
  },
  {
    eyebrow: "AI copilot",
    title: "Recommendations that read the deal, not the template",
    desc: "Every opportunity gets a live read on risk, momentum and the exact next move — grounded in what actually closed for teams like yours.",
    image: pipelineImage,
    alt: "Pulse pipeline board with AI recommendations",
    reversed: true,
  },
];

function MediaRow({ row }: { row: Row }) {
  const { ref, visible } = useReveal<HTMLDivElement>(0.15);
  return (
    <div
      ref={ref}
      className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-2 lg:gap-20"
    >
      <div
        className={cn("reveal min-w-0", row.reversed && "lg:order-2")}
        data-visible={visible}
      >
        <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
          {row.eyebrow}
        </p>
        <h3 className="mt-4 text-3xl leading-tight font-bold tracking-tight md:text-[2.25rem]">
          {row.title}
        </h3>
        <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">{row.desc}</p>
        <a
          href="#"
          className="arrow-nudge mt-7 inline-flex items-center gap-1.5 text-sm font-medium text-link"
        >
          Learn more <ArrowRight size={15} />
        </a>
      </div>
      <div
        className={cn("reveal-scale min-w-0", row.reversed && "lg:order-1")}
        data-visible={visible}
        style={{ transitionDelay: "120ms" }}
      >
        <img
          src={row.image}
          alt={row.alt}
          loading="lazy"
          width={1200}
          height={912}
          className="w-full rounded-3xl border border-border shadow-float"
        />
      </div>
    </div>
  );
}

export function MediaRows() {
  return (
    <section className="space-y-28 bg-surface-warm py-24 md:space-y-36 md:py-32">
      {rows.map((r) => (
        <MediaRow key={r.title} row={r} />
      ))}
    </section>
  );
}
