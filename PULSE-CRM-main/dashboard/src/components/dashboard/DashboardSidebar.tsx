import {
  LayoutDashboard,
  Users,
  Contact,
  Building2,
  Briefcase,
  Activity,
  Mail,
  Link2,
  Workflow,
  Sparkles,
  BarChart3,
  Settings,
  ChevronsUpDown,
  Zap,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const groups = [
  {
    label: null,
    items: [
      { title: "Dashboard", hint: "Your analytical home base", icon: LayoutDashboard, active: true },
    ],
  },
  {
    label: "Productivity",
    items: [
      { title: "Leads", icon: Users },
      { title: "Contacts", icon: Contact },
      { title: "Companies", icon: Building2 },
      { title: "Deals", icon: Briefcase },
      { title: "Activities", icon: Activity },
      { title: "Emails", icon: Mail },
      { title: "Integrations", icon: Link2 },
    ],
  },
  {
    label: "Automations & intelligence",
    items: [
      { title: "Workflows", icon: Workflow },
      { title: "AI Insights", icon: Sparkles },
    ],
  },
  {
    label: "Data & analytics",
    items: [
      { title: "Reports", icon: BarChart3 },
      { title: "Settings", icon: Settings },
    ],
  },
];

export function DashboardSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-sidebar-border">
      <SidebarHeader className="px-3 py-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="grad-blue-purple grid size-9 shrink-0 place-items-center rounded-xl text-primary-foreground">
            <Zap size={17} />
          </div>
          {!collapsed && (
            <span className="truncate text-lg font-bold tracking-tight text-sidebar-foreground">
              PULSE
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-1">
        {groups.map((group, gi) => (
          <SidebarGroup key={group.label ?? gi}>
            {group.label && !collapsed && (
              <SidebarGroupLabel className="text-[11px] tracking-wide uppercase">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={"active" in item && Boolean(item.active)}
                      tooltip={item.title}
                      className={cn(
                        "relative h-auto rounded-xl py-2",
                        "active" in item &&
                          item.active &&
                          "bg-sidebar-accent before:absolute before:top-2 before:bottom-2 before:left-0 before:w-[2px] before:rounded-full before:bg-brand-purple",
                      )}
                    >
                      <item.icon
                        className={cn(
                          "size-4 shrink-0",
                          "active" in item && item.active
                            ? "text-brand-purple"
                            : "text-muted-foreground",
                        )}
                      />
                      {!collapsed && (
                        <span className="flex min-w-0 flex-col">
                          <span
                            className={cn(
                              "truncate text-sm",
                              "active" in item && item.active
                                ? "font-semibold text-brand-purple"
                                : "font-medium text-sidebar-foreground",
                            )}
                          >
                            {item.title}
                          </span>
                          {"hint" in item && item.hint && (
                            <span className="truncate text-[11px] text-muted-foreground">
                              {item.hint}
                            </span>
                          )}
                        </span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5">
          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold text-ink">
            SJ
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-sidebar-foreground">
                  Sarah Johnson
                </p>
                <p className="truncate text-[11px] text-muted-foreground">Sales Representative</p>
              </div>
              <ChevronsUpDown size={14} className="shrink-0 text-muted-foreground" />
            </>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
