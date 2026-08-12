import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, Search, X, ArrowUpRight, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { pillVariants } from "./PillButton";
const promoImage = "/landing/promo-mega.jpg";
const promoTeams = "/landing/promo-teams.jpg";
const promoResources = "/landing/promo-resources.jpg";
import { cn } from "@/lib/utils";

const navLinks = ["Platform", "Products", "Pricing", "Resources"];

type MenuItem = { title: string; desc: string; route?: string };
type MenuColumn = { heading: string; items: MenuItem[] };
type MenuConfig = {
  columns?: MenuColumn[];
  promo: { image?: string; heading: string; desc: string; link: string; cta?: boolean; route?: string };
};

const menus: Record<string, MenuConfig> = {
  Platform: {
    columns: [
      {
        heading: "CRM CORE",
        items: [
          { title: "Lead Management", desc: "Capture, qualify, and manage every lead from one place." },
          { title: "Contact Management", desc: "Keep customer contacts and communication history organized." },
          { title: "Company Management", desc: "Manage organizations and customer information in one place." },
        ],
      },
      {
        heading: "SALES WORKFLOW",
        items: [
          { title: "Sales Pipeline", desc: "Track opportunities through every stage of your sales process." },
          { title: "Deal Management", desc: "Create, manage, and close sales opportunities." },
          { title: "Tasks & Follow-ups", desc: "Keep sales activities and follow-ups on schedule." },
        ],
      },
    ],
    promo: {
      heading: "Pulse CRM",
      desc: "Bring leads, contacts, companies, deals, and sales activities together in one workspace.",
      link: "Explore Pulse CRM →",
    },
  },
  Products: {
    columns: [
      {
        heading: "AI & INTELLIGENCE",
        items: [
          { title: "AI Copilot", desc: "Rule-based lead scoring (0–100) + Groq/Llama email analysis.", route: "/product/ai-copilot" },
          { title: "Email Intelligence", desc: "Gmail OAuth sync, thread logging & AI-powered analysis.", route: "/product/email-intelligence" },
          { title: "Revenue Analytics", desc: "Live dashboards, pipeline value, rep leaderboards & forecasts.", route: "/product/revenue-analytics" },
          { title: "Automation", desc: "Next-best-action engine — weighted by score, urgency & reply.", route: "/product/automation" },
        ],
      },
      {
        heading: "PIPELINE & SECURITY",
        items: [
          { title: "Visual Pipeline", desc: "FSM deal stages: New → Qualified → Proposal → Won/Lost.", route: "/product/visual-pipeline" },
          { title: "Lead Management", desc: "Capture, score, qualify and track every lead in one place.", route: "/product/lead-management" },
          { title: "Security & RBAC", desc: "3 roles, 33 permissions, JWT auth & bcrypt passwords.", route: "/product/security-rbac" },
        ],
      },
    ],
    promo: {
      image: promoTeams,
      heading: "Explore all 7 Products",
      desc: "AI scoring, email intelligence, visual pipeline, RBAC security and more — all built in.",
      link: "Get Started →",
      cta: true,
      route: "/signup",
    },
  },
  Resources: {
    columns: [
      {
        heading: "LEARN",
        items: [
          { title: "Documentation", desc: "Setup guides, architecture overview & configuration", route: "/resources/documentation" },
          { title: "Implementation Guide", desc: "Docker setup, migrations, seed data & test credentials", route: "/resources/implementation-guide" },
          { title: "API Reference", desc: "40+ REST endpoints with Swagger UI at /docs and /redoc", route: "/resources/api-reference" },
        ],
      },
      {
        heading: "CONNECT",
        items: [
          { title: "Blog", desc: "AI scoring deep-dives, CRM architecture & sales strategy", route: "/resources/blog" },
          { title: "Community", desc: "Connect with developers and sales teams building on Pulse", route: "/resources/community" },
          { title: "Support", desc: "Get help from our team — bugs, integrations, or setup", route: "/resources/support" },
        ],
      },
    ],
    promo: {
      image: promoResources,
      heading: "Get Support & Resources",
      desc: "Documentation, community, and help — everything you need to succeed.",
      link: "View all resources →",
      route: "/resources/documentation",
    },
  },
};

export function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [dir, setDir] = useState<"left" | "right">("right");
  const prevIndex = useRef(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accordion, setAccordion] = useState<string | null>(null);

  // Close menus automatically on route change
  useEffect(() => {
    setOpenMenu(null);
    setMobileOpen(false);
  }, [pathname]);

  // Navigation handler for Platform dropdown items
  const handlePlatformNavigation = (itemTitle: string) => {
    const platformRoutes: Record<string, string> = {
      "Lead Management": "/platform/lead-management",
      "Contact Management": "/platform/contact-management", 
      "Company Management": "/platform/company-management",
      "Sales Pipeline": "/platform/sales-pipeline",
      "Deal Management": "/platform/deal-management",
      "Tasks & Follow-ups": "/platform/tasks-follow-ups"
    };

    const targetRoute = platformRoutes[itemTitle];
    if (targetRoute) {
      router.push(targetRoute);
    }
    setOpenMenu(null);
  };

  // Handle "Explore Pulse CRM" click
  const handleExplorePulseCRM = () => {
    router.push("/login");
    setOpenMenu(null);
  };

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && openMenu) {
        setOpenMenu(null);
      }
    };

    if (openMenu) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openMenu]);

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
          <Link href="/" className="flex min-w-0 items-center gap-1 text-xl font-bold tracking-tight">
            Pulse
            <span className="grad-blue-purple mt-2 size-2 shrink-0 rounded-full" />
          </Link>

          <nav className="hidden items-center justify-center gap-1 lg:flex">
            {navLinks.map((l) => {
              const hasMenu = !!menus[l];
              if (!hasMenu) {
                const isActive = l === "Pricing" ? pathname === "/pricing" : pathname === `/${l.toLowerCase()}`;
                return (
                  <Link
                    key={l}
                    href={l === "Pricing" ? "/pricing" : `/${l.toLowerCase()}`}
                    onMouseEnter={() => setOpenMenu(null)}
                    onClick={() => setOpenMenu(null)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-medium transition-colors hover:text-link focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2",
                      isActive ? "text-link font-semibold" : "text-ink",
                    )}
                  >
                    {l}
                  </Link>
                );
              }
              return (
                <button
                  key={l}
                  onMouseEnter={() => openWith(l)}
                  onClick={() => {
                    if (openMenu === l) {
                      setOpenMenu(null);
                    } else {
                      openWith(l);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setOpenMenu(null);
                    }
                  }}
                  aria-expanded={openMenu === l}
                  aria-haspopup="true"
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-medium transition-colors hover:text-link focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2",
                    openMenu === l ? "text-link" : "text-ink",
                  )}
                >
                  {l}
                  <ChevronDown
                    size={14}
                    className={cn(
                      "transition-transform duration-200",
                      openMenu === l && "rotate-180",
                    )}
                  />
                </button>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <button
              aria-label="Search"
              className="hidden size-9 items-center justify-center rounded-full text-ink transition-colors hover:bg-secondary sm:inline-flex"
            >
              <Search size={17} />
            </button>
            <Link
              href="/login"
              className="hidden items-center rounded-full px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:text-link sm:inline-flex"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="arrow-nudge hidden sm:inline-flex items-center justify-center gap-2 rounded-full text-sm font-semibold h-9 px-4 transition-colors shadow-sm hover:shadow-md"
              style={{ backgroundColor: '#2563EB', color: '#FFFFFF' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1D4ED8'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2563EB'; }}
            >
              Get started <ArrowUpRight size={15} color="#FFFFFF" />
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
                          {openMenu === "Platform" ? (
                            <button 
                              onClick={() => handlePlatformNavigation(item.title)}
                              className="group block text-left w-full"
                            >
                              <span className="text-sm font-semibold text-link group-hover:text-accent-hover">
                                {item.title}
                              </span>
                              <span className="mt-1 block text-sm text-muted-foreground">
                                {item.desc}
                              </span>
                            </button>
                          ) : item.route ? (
                            <button
                              onClick={() => { router.push(item.route!); setOpenMenu(null); }}
                              className="group block text-left w-full"
                            >
                              <span className="text-sm font-semibold text-link group-hover:text-accent-hover">
                                {item.title}
                              </span>
                              <span className="mt-1 block text-sm text-muted-foreground">
                                {item.desc}
                              </span>
                            </button>
                          ) : (
                            <button
                              onClick={() => setOpenMenu(null)}
                              className="group block text-left w-full"
                            >
                              <span className="text-sm font-semibold text-link group-hover:text-accent-hover">
                                {item.title}
                              </span>
                              <span className="mt-1 block text-sm text-muted-foreground">
                                {item.desc}
                              </span>
                            </button>
                          )}
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
                    <div className="h-32 w-full" style={{ background: 'linear-gradient(135deg, #2563EB, #1D4ED8)' }} />
                  )}
                  <div className="p-5">
                    <p className="text-sm font-semibold text-ink">{active.promo.heading}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{active.promo.desc}</p>
                    {active.promo.cta ? (
                      <Link
                        href="/signup"
                        className="arrow-nudge mt-4 inline-flex items-center justify-center gap-2 rounded-full text-sm font-semibold h-9 px-4 transition-colors shadow-sm"
                        style={{ backgroundColor: '#2563EB', color: '#FFFFFF' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1D4ED8'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2563EB'; }}
                      >
                        {active.promo.link} <ArrowUpRight size={15} color="#FFFFFF" />
                      </Link>
                    ) : openMenu === "Platform" ? (
                      <button
                        onClick={handleExplorePulseCRM}
                        className="arrow-nudge mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-link hover:text-accent-hover"
                      >
                        {active.promo.link} <ArrowRight size={15} />
                      </button>
                    ) : active.promo.route ? (
                      <button
                        onClick={() => { router.push(active.promo.route!); setOpenMenu(null); }}
                        className="arrow-nudge mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-link hover:text-accent-hover"
                      >
                        {active.promo.link} <ArrowRight size={15} />
                      </button>
                    ) : (
                      <button
                        onClick={() => setOpenMenu(null)}
                        className="arrow-nudge mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-link hover:text-accent-hover"
                      >
                        {active.promo.link} <ArrowRight size={15} />
                      </button>
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
        onClick={() => setOpenMenu(null)}
        className={cn(
          "fixed inset-0 z-40 hidden bg-ink/35 transition-opacity duration-300 lg:block cursor-pointer",
          openMenu ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="menu-in relative z-50 border-b border-border bg-background px-6 py-4 lg:hidden">
          <ul className="divide-y divide-border">
            {navLinks.map((l) => {
              const menuData = menus[l];
              const isExpandable = menuData && menuData.columns;
              return (
                <li key={l}>
                  {isExpandable ? (
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
                          {(l === "Platform" ? megaColumns : menuData.columns ?? [])
                            .flatMap((c) => c.items)
                            .map((item) => (
                              <button
                                key={item.title}
                                onClick={() => {
                                  if (l === "Platform") {
                                    handlePlatformNavigation(item.title);
                                  } else if (item.route) {
                                    router.push(item.route);
                                  }
                                  setMobileOpen(false);
                                  setAccordion(null);
                                }}
                                className="block w-full text-left"
                              >
                                <span className="text-sm font-semibold text-link">{item.title}</span>
                                <span className="block text-sm text-muted-foreground">
                                  {item.desc}
                                </span>
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={l === "Pricing" ? "/pricing" : `/${l.toLowerCase()}`}
                      onClick={() => setMobileOpen(false)}
                      className="block py-3 text-sm font-medium text-ink hover:text-link transition-colors"
                    >
                      {l}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="mt-4 flex flex-col gap-2">
            <Link href="/login" className="text-center text-sm font-medium text-ink py-2 rounded-full border border-border hover:bg-secondary transition-colors">
              Sign in
            </Link>
            <Link 
              href="/signup" 
              className="arrow-nudge w-full inline-flex items-center justify-center gap-2 rounded-full text-sm font-semibold h-11 px-6 transition-colors"
              style={{ backgroundColor: '#2563EB', color: '#FFFFFF' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1D4ED8'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2563EB'; }}
            >
              Get started <ArrowUpRight size={15} color="#FFFFFF" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

