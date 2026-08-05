import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, Search, X, ArrowUpRight, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { pillVariants } from "./PillButton";
import promoImage from "@/assets/promo-mega.jpg";
import promoTeams from "@/assets/promo-teams.jpg";
import promoSolutions from "@/assets/promo-solutions.jpg";
import promoResources from "@/assets/promo-resources.jpg";
import { cn } from "@/lib/utils";

const navLinks = ["Platform", "Products", "Solutions", "Pricing", "Resources"];

type MenuItem = { title: string; desc: string };
type MenuColumn = { heading: string; items: MenuItem[] };
type Plan = { name: string; desc: string };
type MenuConfig = {
  columns?: MenuColumn[];
  plans?: { heading: string; items: Plan[]; link: string };
  promo: { image?: string; heading: string; desc: string; link: string; cta?: boolean };
};

const menus: Record<string, MenuConfig> = {
  Platform: {
    columns: [
      {
        heading: "Capture",
        items: [
          { title: "Lead Inbox", desc: "Every inbound lead, enriched on arrival." },
          { title: "Form & Web Capture", desc: "Turn any touchpoint into a scored record." },
          { title: "Enrichment API", desc: "Firmographics attached automatically." },
        ],
      },
      {
        heading: "Close",
        items: [
          { title: "Deal Copilot", desc: "Next-best action for every open opportunity." },
          { title: "Forecast Studio", desc: "Pipeline math your CRO can actually trust." },
          { title: "Revenue Signals", desc: "Know which deals are quietly slipping." },
        ],
      },
    ],
    promo: {
      image: promoImage,
      heading: "The 2026 Revenue AI report",
      desc: "How 1,200 sales teams are scoring pipeline with AI.",
      link: "Read the report",
    },
  },
  Products: {
    columns: [
      {
        heading: "For reps",
        items: [
          { title: "Pipeline View", desc: "Visual deal tracking from first touch to close." },
          { title: "Task & Follow-up Engine", desc: "Never let a warm lead go cold again." },
          { title: "Rep Mobile App", desc: "Update deals and log calls from anywhere." },
        ],
      },
      {
        heading: "For managers",
        items: [
          { title: "Team Dashboard", desc: "Real-time visibility into every rep's pipeline." },
          { title: "Coaching Insights", desc: "Spot stalled deals before they slip away." },
          {
            title: "Territory & Lead Routing",
            desc: "Auto-assign leads to the right rep, instantly.",
          },
        ],
      },
    ],
    promo: {
      image: promoTeams,
      heading: "Pulse for Teams of 50+",
      desc: "See how larger sales orgs run their entire pipeline on one platform.",
      link: "See enterprise features",
    },
  },
  Solutions: {
    columns: [
      {
        heading: "By team size",
        items: [
          { title: "Startups & SMB", desc: "Set up in a day, no admin required." },
          { title: "Growth Teams", desc: "Scale from 5 reps to 50 without switching tools." },
          { title: "Enterprise", desc: "Custom roles, permissions, and dedicated support." },
        ],
      },
      {
        heading: "By industry",
        items: [
          { title: "Real Estate", desc: "Match leads to listings automatically." },
          { title: "SaaS & Tech", desc: "Track trials, demos, and expansion revenue." },
          { title: "Financial Services", desc: "Compliance-ready lead handling built in." },
        ],
      },
    ],
    promo: {
      image: promoSolutions,
      heading: "Why sales teams switch to Pulse",
      desc: "Real stories from teams who cut their sales cycle by 30%.",
      link: "Read customer stories",
    },
  },
  Pricing: {
    plans: {
      heading: "Plans",
      items: [
        { name: "Starter", desc: "For individual reps and small teams." },
        { name: "Growth", desc: "For scaling sales teams." },
        { name: "Enterprise", desc: "Custom pricing for large orgs." },
      ],
      link: "Compare plans",
    },
    promo: {
      heading: "Try Pulse free for 14 days",
      desc: "No credit card required. Full access to every feature.",
      link: "Start free trial",
      cta: true,
    },
  },
  Resources: {
    columns: [
      {
        heading: "Learn",
        items: [
          { title: "Help Center", desc: "Guides for getting the most out of Pulse." },
          { title: "Webinars", desc: "Live sessions with sales leaders and Pulse experts." },
          { title: "API Docs", desc: "Build custom integrations on top of Pulse." },
        ],
      },
      {
        heading: "Insights",
        items: [
          { title: "Sales Blog", desc: "Tactics, benchmarks, and playbooks." },
          {
            title: "Revenue Reports",
            desc: "Original research on what's working in sales right now.",
          },
          { title: "Customer Stories", desc: "How real teams use Pulse to close more." },
        ],
      },
    ],
    promo: {
      image: promoResources,
      heading: "State of Sales AI 2026",
      desc: "How 1,200 sales teams are using AI to shorten their sales cycle.",
      link: "Download the report",
    },
  },
};

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [dir, setDir] = useState<"left" | "right">("right");
  const prevIndex = useRef(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accordion, setAccordion] = useState<string | null>(null);

  const openWith = (label: string) => {
    if (!menus[label]) {
      setOpenMenu(null);
      return;
    }
    const next = navLinks.indexOf(label);
    setDir(next >= prevIndex.current ? "right" : "left");
    prevIndex.current = next;
    setOpenMenu(label);
  };

  const active = openMenu ? menus[openMenu] : null;
  const megaColumns = menus.Platform.columns ?? [];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50">
      {/* Main nav */}
      <div
        className={cn(
          "relative z-50 border-b border-border bg-background transition-all duration-300",
          scrolled ? "shadow-nav" : "",
        )}
        onMouseLeave={() => setOpenMenu(null)}
      >
        <div
          className={cn(
            "mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-6 transition-all duration-300 lg:grid-cols-[auto_1fr_auto]",
            scrolled ? "h-14" : "h-18",
          )}
        >
          <a href="#" className="flex min-w-0 items-center gap-1 text-xl font-bold tracking-tight">
            Pulse
            <span className="grad-blue-purple mt-2 size-2 shrink-0 rounded-full" />
          </a>

          <nav className="hidden items-center justify-center gap-1 lg:flex">
            {navLinks.map((l) => (
              <button
                key={l}
                onMouseEnter={() => openWith(l)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-medium transition-colors hover:text-link",
                  openMenu === l ? "text-link" : "text-ink",
                )}
              >
                {l}
                {menus[l] && (
                  <ChevronDown
                    size={14}
                    className={cn(
                      "transition-transform duration-200",
                      openMenu === l && "rotate-180",
                    )}
                  />
                )}
              </button>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <button
              aria-label="Search"
              className="hidden size-9 items-center justify-center rounded-full text-ink transition-colors hover:bg-secondary sm:inline-flex"
            >
              <Search size={17} />
            </button>
            <Link
              to="/signup"
              className={pillVariants({
                size: "sm",
                className: "arrow-nudge hidden sm:inline-flex",
              })}
            >
              Get started <ArrowUpRight size={15} />
            </Link>
            <button
              aria-label="Open menu"
              onClick={() => setMobileOpen((v) => !v)}
              className="inline-flex size-9 items-center justify-center rounded-full text-ink transition-colors hover:bg-secondary lg:hidden"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mega menu */}
        {active && (
          <div className="absolute inset-x-0 top-full hidden justify-center px-6 pt-3 lg:flex">
            <div className="menu-in w-full max-w-6xl overflow-hidden rounded-4xl border border-border bg-background p-8 shadow-float">
              <div
                key={openMenu}
                className={cn(
                  "grid gap-10 lg:grid-cols-[1fr_1fr_0.9fr]",
                  dir === "right" ? "panel-slide-right" : "panel-slide-left",
                )}
              >
                {active.plans && (
                  <div className="lg:col-span-2">
                    <p className="text-xs font-bold tracking-widest text-ink uppercase">
                      {active.plans.heading}
                    </p>
                    <ul className="mt-5 space-y-5">
                      {active.plans.items.map((p) => (
                        <li key={p.name}>
                          <a href="#" className="group block">
                            <span className="text-sm font-semibold text-link">{p.name}</span>
                            <span className="mt-1 block text-sm text-muted-foreground">
                              {p.desc}
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                    <a
                      href="#"
                      className="arrow-nudge mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-link"
                    >
                      {active.plans.link} <ArrowRight size={15} />
                    </a>
                  </div>
                )}
                {(active.columns ?? []).map((col, i) => (
                  <div
                    key={col.heading}
                    className={cn(i === 1 && "lg:border-l lg:border-border lg:pl-10")}
                  >
                    <p className="text-xs font-bold tracking-widest text-ink uppercase">
                      {col.heading}
                    </p>
                    <ul className="mt-5 space-y-5">
                      {col.items.map((item) => (
                        <li key={item.title}>
                          <a href="#" className="group block">
                            <span className="text-sm font-semibold text-link">{item.title}</span>
                            <span className="mt-1 block text-sm text-muted-foreground">
                              {item.desc}
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                <div className="overflow-hidden rounded-3xl bg-surface-warm">
                  {active.promo.image ? (
                    <img
                      src={active.promo.image}
                      alt={active.promo.heading}
                      loading="lazy"
                      width={800}
                      height={600}
                      className="h-32 w-full object-cover"
                    />
                  ) : (
                    <div className="grad-blue-purple h-32 w-full" />
                  )}
                  <div className="p-5">
                    <p className="text-sm font-semibold text-ink">{active.promo.heading}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{active.promo.desc}</p>
                    {active.promo.cta ? (
                      <Link
                        to="/signup"
                        className={pillVariants({
                          size: "sm",
                          className: "arrow-nudge mt-4",
                        })}
                      >
                        {active.promo.link} <ArrowUpRight size={15} />
                      </Link>
                    ) : (
                      <a
                        href="#"
                        className="arrow-nudge mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-link"
                      >
                        {active.promo.link} <ArrowRight size={15} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Page dim behind mega menu */}
      <div
        aria-hidden
        className={cn(
          "fixed inset-0 z-40 hidden bg-ink/35 transition-opacity duration-300 lg:block",
          openMenu ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="menu-in relative z-50 border-b border-border bg-background px-6 py-4 lg:hidden">
          <ul className="divide-y divide-border">
            {navLinks.map((l) => (
              <li key={l}>
                {l === "Platform" ? (
                  <div className="py-3">
                    <button
                      onClick={() => setAccordion((a) => (a === l ? null : l))}
                      className="flex w-full items-center justify-between text-sm font-medium text-ink"
                    >
                      {l}
                      <ChevronDown
                        size={16}
                        className={cn(
                          "transition-transform duration-200",
                          accordion === l && "rotate-180",
                        )}
                      />
                    </button>
                    {accordion === l && (
                      <div className="mt-3 space-y-4">
                        {megaColumns
                          .flatMap((c) => c.items)
                          .map((item) => (
                            <a key={item.title} href="#" className="block">
                              <span className="text-sm font-semibold text-link">{item.title}</span>
                              <span className="block text-sm text-muted-foreground">
                                {item.desc}
                              </span>
                            </a>
                          ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <a href="#" className="block py-3 text-sm font-medium text-ink">
                    {l}
                  </a>
                )}
              </li>
            ))}
          </ul>
          <Link to="/signup" className={pillVariants({ className: "arrow-nudge mt-4 w-full" })}>
            Get started <ArrowUpRight size={15} />
          </Link>
        </div>
      )}
    </header>
  );
}
