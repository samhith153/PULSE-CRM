import { createFileRoute } from "@tanstack/react-router";
import { IndianRupee, Trophy, Target, Wallet, Clock, CalendarDays, SlidersHorizontal } from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { StatCard, type Stat } from "@/components/dashboard/StatCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { DealsByStage } from "@/components/dashboard/DealsByStage";
import { ActivityPanel, InsightBanner } from "@/components/dashboard/Panels";

const title = "Reports & analytics — Pulse CRM dashboard";
const description =
  "The Pulse CRM analytics dashboard: revenue over time, deals by stage, win rate, sales cycle and AI insights for every rep.";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

const stats: Stat[] = [
  {
    label: "Total revenue",
    icon: IndianRupee,
    value: 4280000,
    prefix: "₹",
    delta: 12.4,
    spark: [3, 5, 4, 6, 7, 9, 11],
  },
  { label: "Won deals", icon: Trophy, value: 23, delta: 8.1, spark: [2, 3, 3, 5, 4, 6, 7] },
  { label: "Win rate", icon: Target, value: 19, suffix: "%", delta: 2.6, spark: [4, 4, 5, 5, 6, 6, 7] },
  {
    label: "Avg. deal size",
    icon: Wallet,
    value: 186000,
    prefix: "₹",
    delta: 5.3,
    spark: [5, 6, 5, 7, 8, 8, 9],
  },
  {
    label: "Avg. sales cycle",
    icon: Clock,
    value: 27,
    suffix: " d",
    delta: -4.2,
    spark: [9, 8, 8, 7, 6, 6, 5],
  },
];

function DashboardPage() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-surface-warm">
        <DashboardSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <DashboardTopbar />

          <main className="min-w-0 flex-1 space-y-6 px-4 py-8 md:px-6">
            <div className="grid grid-cols-[minmax(0,1fr)] items-end gap-4 lg:flex lg:justify-between">
              <div className="min-w-0">
                <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-[2.5rem]">
                  Reports &amp; analytics
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Track performance, analyze trends, and make data-driven decisions.
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-xs font-medium text-ink">
                  <CalendarDays size={14} className="text-muted-foreground" /> May 12 – May 18, 2026
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-xs font-medium text-ink">
                  <SlidersHorizontal size={14} className="text-muted-foreground" /> Customize layout
                </span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {stats.map((s, i) => (
                <StatCard key={s.label} stat={s} delay={i * 70} />
              ))}
            </div>

            <div className="grid gap-3 xl:grid-cols-[1.4fr_1fr]">
              <RevenueChart />
              <DealsByStage />
            </div>

            <div className="grid items-start gap-3 lg:grid-cols-[1fr_1.4fr]">
              <ActivityPanel />
              <InsightBanner />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
