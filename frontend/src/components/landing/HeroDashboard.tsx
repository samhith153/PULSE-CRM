import {
  Users,
  MessagesSquare,
  Briefcase,
  ArrowUpRight,
  CheckSquare,
  Mail,
  Phone,
  CalendarCheck,
  Sparkles,
  ChevronDown,
  Plus,
} from "lucide-react";

const stats = [
  { icon: Users, label: "New leads", value: "642", delta: "18%" },
  { icon: MessagesSquare, label: "Conversations", value: "387", delta: "12%" },
  { icon: Briefcase, label: "Deals created", value: "89", delta: "25%" },
];

const activities = [
  { icon: CheckSquare, label: "Tasks completed", value: 24 },
  { icon: Mail, label: "Emails sent", value: 128 },
  { icon: Phone, label: "Calls made", value: 42 },
  { icon: CalendarCheck, label: "Meetings booked", value: 18 },
];

const points = [
  [0, 78],
  [14, 52],
  [28, 48],
  [42, 36],
  [56, 40],
  [70, 26],
  [84, 22],
  [100, 8],
];

export function HeroDashboard() {
  const path = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");

  return (
    <div className="rise-in w-full rounded-3xl border border-primary-foreground/15 bg-primary-foreground/10 p-4 shadow-float backdrop-blur-md md:p-6">
      {/* header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-primary-foreground">Good morning, Om 👋</p>
          <p className="mt-1 text-sm text-primary-foreground/70">
            Here&apos;s what&apos;s happening with your pipeline today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-lg border border-primary-foreground/15 bg-primary-foreground/10 px-3 py-1.5 text-xs text-primary-foreground/85">
            This week <ChevronDown size={13} />
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg bg-brand-purple px-3 py-1.5 text-xs font-medium text-primary-foreground">
            <Plus size={13} /> Add new
          </span>
        </div>
      </div>

      {/* stat tiles */}
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-primary-foreground/12 bg-primary-foreground/8 p-4"
          >
            <div className="grid size-9 place-items-center rounded-xl bg-primary-foreground/15 text-primary-foreground">
              <s.icon size={16} />
            </div>
            <p className="mt-3 text-xs text-primary-foreground/70">{s.label}</p>
            <p className="text-2xl font-semibold text-primary-foreground">{s.value}</p>
            <p className="mt-1 flex items-center gap-1 text-[11px] text-brand-cyan">
              <ArrowUpRight size={12} /> {s.delta}
              <span className="text-primary-foreground/55">vs last week</span>
            </p>
          </div>
        ))}
      </div>

      {/* chart + activities */}
      <div className="mt-3 grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-primary-foreground/12 bg-primary-foreground/8 p-4">
          <p className="text-xs text-primary-foreground/70">Pipeline value</p>
          <p className="text-2xl font-semibold text-primary-foreground">₹2,78,600</p>
          <p className="text-[11px] text-primary-foreground/55">Total pipeline value</p>
          <svg
            viewBox="0 0 100 90"
            preserveAspectRatio="none"
            className="mt-3 h-28 w-full overflow-visible"
            aria-hidden
          >
            <path
              d={`${path} L100,90 L0,90 Z`}
              fill="currentColor"
              className="text-primary-foreground/12"
            />
            <path
              d={path}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
              className="text-primary-foreground"
            />
            {points.map(([x, y]) => (
              <circle key={x} cx={x} cy={y} r="1.6" className="fill-current text-brand-cyan" />
            ))}
          </svg>
          <div className="mt-2 flex justify-between text-[10px] text-primary-foreground/55">
            <span>May 12</span>
            <span>May 14</span>
            <span>May 16</span>
            <span>May 18</span>
          </div>
        </div>

        <div className="rounded-2xl border border-primary-foreground/12 bg-primary-foreground/8 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-primary-foreground">Top activities</p>
            <span className="text-[11px] text-primary-foreground/60">View all</span>
          </div>
          <ul className="mt-3 space-y-2">
            {activities.map((a) => (
              <li
                key={a.label}
                className="flex items-center gap-2 rounded-xl bg-primary-foreground/8 px-3 py-2"
              >
                <a.icon size={14} className="text-brand-cyan" />
                <span className="flex-1 text-xs text-primary-foreground/85">{a.label}</span>
                <span className="text-xs font-semibold text-primary-foreground">{a.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* AI insight */}
      <div className="mt-3 flex flex-wrap items-center gap-3 rounded-2xl border border-primary-foreground/12 bg-brand-purple/40 p-4">
        <div className="grid size-9 place-items-center rounded-xl bg-primary-foreground/15 text-primary-foreground">
          <Sparkles size={16} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-primary-foreground">AI insight</p>
          <p className="text-xs text-primary-foreground/75">
            You have 14 deals at risk. Review them now.
          </p>
        </div>
        <span className="arrow-nudge inline-flex items-center gap-1 rounded-full bg-primary-foreground/15 px-4 py-2 text-xs font-medium text-primary-foreground">
          Review deals <ArrowUpRight size={13} />
        </span>
      </div>
    </div>
  );
}
