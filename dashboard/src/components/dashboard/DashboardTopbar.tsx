import { Search, Bell, Moon, Sun, Plus } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { PillButton } from "@/components/pulse/PillButton";
import { useTheme } from "@/hooks/use-theme";

export function DashboardTopbar() {
  const { dark, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-20 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur-md md:px-6">
      <SidebarTrigger className="shrink-0" />

      <div className="flex h-11 min-w-0 items-center gap-2 rounded-full border border-border bg-secondary px-4">
        <Search size={16} className="shrink-0 text-muted-foreground" />
        <input
          placeholder="Search leads, contacts, companies, deals…"
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <span className="hidden shrink-0 rounded-md bg-background px-1.5 py-0.5 text-[11px] text-muted-foreground sm:inline">
          ⌘K
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className="hidden items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground lg:inline-flex">
          Role: <span className="font-semibold text-ink">Sales Rep</span>
        </span>
        <PillButton size="sm" className="arrow-nudge hidden sm:inline-flex">
          <Plus size={14} /> New report
        </PillButton>
        <button
          onClick={toggle}
          aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
          className="grid size-9 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          {dark ? <Sun size={15} /> : <Moon size={15} />}
        </button>
        <button className="relative grid size-9 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-secondary">
          <Bell size={15} />
          <span className="absolute -top-0.5 -right-0.5 grid size-4 place-items-center rounded-full bg-brand-purple text-[9px] font-semibold text-primary-foreground">
            4
          </span>
        </button>
        <div className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold text-ink">
          SJ
        </div>
      </div>
    </header>
  );
}
