import { CheckSquare, Mail, Phone, CalendarCheck, Sparkles, ArrowUpRight } from "lucide-react";
import { useReveal } from "@/hooks/use-reveal";

const activities = [
  { icon: CheckSquare, label: "Tasks completed", value: 24 },
  { icon: Mail, label: "Emails sent", value: 128 },
  { icon: Phone, label: "Calls made", value: 42 },
  { icon: CalendarCheck, label: "Meetings booked", value: 18 },
];

export function ActivityPanel() {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      data-visible={visible}
      className="reveal rounded-2xl border border-border bg-card p-6"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <h2 className="truncate text-base font-semibold tracking-tight text-foreground">
          Top activities
        </h2>
        <button className="arrow-nudge inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          View all <ArrowUpRight size={12} />
        </button>
      </div>
      <ul className="mt-4 space-y-2">
        {activities.map((a) => (
          <li
            key={a.label}
            className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-2.5 transition-colors hover:bg-accent"
          >
            <a.icon size={14} className="shrink-0 text-brand-purple" />
            <span className="min-w-0 flex-1 truncate text-xs text-foreground">{a.label}</span>
            <span className="text-xs font-semibold text-foreground">{a.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function InsightBanner() {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      data-visible={visible}
      className="reveal mesh-hero rounded-2xl p-6 shadow-float"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-80">
        <div className="mesh-blob drift-a -top-24 -left-10 size-72 bg-brand-purple" />
        <div className="mesh-blob drift-c -right-10 -bottom-24 size-64 bg-brand-cyan" />
      </div>
      <div className="relative grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 sm:flex sm:items-center">
        <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-foreground/15 text-primary-foreground">
          <Sparkles size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-primary-foreground">AI insight</p>
          <p className="text-xs text-primary-foreground/75">
            14 deals worth ₹1.2M are quietly slipping. Review them before Friday.
          </p>
        </div>
        <button className="arrow-nudge col-span-2 inline-flex items-center justify-center gap-1 rounded-full bg-primary-foreground/15 px-4 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary-foreground/25 sm:col-span-1">
          Review deals <ArrowUpRight size={13} />
        </button>
      </div>
    </div>
  );
}
