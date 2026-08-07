import { createFileRoute } from "@tanstack/react-router";
import { IndianRupee, Trophy, Target, Wallet, Clock } from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { StatCard, type Stat } from "@/components/dashboard/StatCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { DealsByStage } from "@/components/dashboard/DealsByStage";
import { ActivityPanel, InsightBanner } from "@/components/dashboard/Panels";
import { useDashboardData } from "@/hooks/use-api";
import { Skeleton } from "@/components/ui/skeleton";

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

function DashboardPage() {
  const { data, isLoading, error } = useDashboardData();

  // Transform API data to Stat format
  const stats: Stat[] = isLoading
    ? []
    : [
        {
          label: "Total revenue",
          icon: IndianRupee,
          value: data?.stats.total_revenue || 0,
          prefix: "₹",
          delta: data?.stats.revenue_delta || 0,
          spark: data?.revenue?.slice(-7).map((r) => r.value) || [],
        },
        {
          label: "Won deals",
          icon: Trophy,
          value: data?.stats.won_deals || 0,
          delta: data?.stats.won_deals_delta || 0,
          spark: [],
        },
        {
          label: "Win rate",
          icon: Target,
          value: data?.stats.win_rate || 0,
          suffix: "%",
          delta: data?.stats.win_rate_delta || 0,
          spark: [],
        },
        {
          label: "Avg. deal size",
          icon: Wallet,
          value: data?.stats.avg_deal_size || 0,
          prefix: "₹",
          delta: data?.stats.avg_deal_size_delta || 0,
          spark: [],
        },
        {
          label: "Avg. sales cycle",
          icon: Clock,
          value: data?.stats.avg_sales_cycle || 0,
          suffix: " d",
          delta: data?.stats.avg_sales_cycle_delta || 0,
          spark: [],
        },
      ];

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
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-40 rounded-2xl" />
                  ))
                : stats.map((s, i) => <StatCard key={s.label} stat={s} delay={i * 70} />)}
            </div>

            <div className="grid gap-3 xl:grid-cols-[1.4fr_1fr]">
              <RevenueChart data={data?.revenue || []} isLoading={isLoading} />
              <DealsByStage isLoading={isLoading} />
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
