"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Briefcase,
  Building2,
  CalendarClock,
  ChevronDown,
  Code2,
  Cpu,
  FileText,
  GitBranch,
  GitMerge,
  Globe,
  HelpCircle,
  Mail,
  Menu,
  PenTool,
  Search,
  ShieldCheck,
  Sparkles,
  Terminal,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = ["Platform", "Products", "Pricing", "Resources"];

type MenuItem = { title: string; desc: string; route?: string; icon: React.ComponentType<any> };
type MenuColumn = { heading: string; items: MenuItem[] };
type MenuConfig = {
  columns?: MenuColumn[];
  promo: {
    image?: string;
    heading: string;
    desc: string;
    link: string;
    cta?: boolean;
    route?: string;
  };
};

/* Menu content mirrors the site-wide information architecture exactly. */
const menus: Record<string, MenuConfig> = {
  Platform: {
    columns: [
      {
        heading: "CRM CORE",
        items: [
          { title: "Lead Management", desc: "Capture, qualify, and manage every lead from one place.", icon: UserRound },
          { title: "Contact Management", desc: "Keep customer contacts and communication history organized.", icon: UsersRound },
          { title: "Company Management", desc: "Manage organizations and customer information in one place.", icon: Building2 },
        ],
      },
      {
        heading: "SALES WORKFLOW",
        items: [
          { title: "Sales Pipeline", desc: "Track opportunities through every stage of your sales process.", icon: GitBranch },
          { title: "Deal Management", desc: "Create, manage, and close sales opportunities.", icon: Briefcase },
          { title: "Tasks & Follow-ups", desc: "Keep sales activities and follow-ups on schedule.", icon: CalendarClock },
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
          { title: "AI Copilot", desc: "Rule-based lead scoring (0–100) + Groq/Llama email analysis.", route: "/product/ai-copilot", icon: Sparkles },
          { title: "Email Intelligence", desc: "Gmail OAuth sync, thread logging & AI-powered analysis.", route: "/product/email-intelligence", icon: Mail },
          { title: "Revenue Analytics", desc: "Live dashboards, pipeline value, rep leaderboards & forecasts.", route: "/product/revenue-analytics", icon: BarChart3 },
          { title: "Automation", desc: "Next-best-action engine — weighted by score, urgency & reply.", route: "/product/automation", icon: Cpu },
        ],
      },
      {
        heading: "PIPELINE & SECURITY",
        items: [
          { title: "Visual Pipeline", desc: "FSM deal stages: New → Qualified → Proposal → Won/Lost.", route: "/product/visual-pipeline", icon: GitMerge },
          { title: "Lead Management", desc: "Capture, score, qualify and track every lead in one place.", route: "/product/lead-management", icon: UserRound },
          { title: "Security & RBAC", desc: "3 roles, 33 permissions, JWT auth & bcrypt passwords.", route: "/product/security-rbac", icon: ShieldCheck },
        ],
      },
    ],
    promo: {
      image: "/landing/promo-teams.jpg",
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
          { title: "Documentation", desc: "Setup guides, architecture overview & configuration", route: "/resources/documentation", icon: FileText },
          { title: "Implementation Guide", desc: "Docker setup, migrations, seed data & test credentials", route: "/resources/implementation-guide", icon: Terminal },
          { title: "API Reference", desc: "40+ REST endpoints with Swagger UI at /docs and /redoc", route: "/resources/api-reference", icon: Code2 },
        ],
      },
      {
        heading: "CONNECT",
        items: [
          { title: "Blog", desc: "AI scoring deep-dives, CRM architecture & sales strategy", route: "/resources/blog", icon: PenTool },
          { title: "Community", desc: "Connect with developers and sales teams building on Pulse", route: "/resources/community", icon: Globe },
          { title: "Support", desc: "Get help from our team — bugs, integrations, or setup", route: "/resources/support", icon: HelpCircle },
        ],
      },
    ],
    promo: {
      image: "/landing/promo-resources.jpg",
      heading: "Get Support & Resources",
      desc: "Documentation, community, and help — everything you need to succeed.",
      link: "View all resources →",
      route: "/resources/documentation",
    },
  },
};

export function LandingNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [, setDir] = useState<"left" | "right">("right");
  const prevIndex = useRef(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accordion, setAccordion] = useState<string | null>(null);

  useEffect(() => {
    setOpenMenu(null);
    setMobileOpen(false);
  }, [pathname]);

  /* Platform dropdown routes — identical mapping to the site header. */
  const handlePlatformNavigation = (itemTitle: string) => {
    const platformRoutes: Record<string, string> = {
      "Lead Management": "/platform/lead-management",
      "Contact Management": "/platform/contact-management",
      "Company Management": "/platform/company-management",
      "Sales Pipeline": "/platform/sales-pipeline",
      "Deal Management": "/platform/deal-management",
      "Tasks & Follow-ups": "/platform/tasks-follow-ups",
    };
    const targetRoute = platformRoutes[itemTitle];
    if (targetRoute) router.push(targetRoute);
    setOpenMenu(null);
  };

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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && openMenu) setOpenMenu(null);
    };
    if (openMenu) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [openMenu]);

  return (
    <header className="sticky top-0 z-50">
      <div
        className={cn(
          "relative z-50 transition-all duration-300",
          scrolled
            ? "border-b border-white/[0.07] bg-[#04060b]/85 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl"
            : "border-b border-transparent bg-transparent",
        )}
        onMouseLeave={() => setOpenMenu(null)}
      >
        <div
          className={cn(
            "mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 transition-all duration-300 sm:px-6 lg:grid-cols-[auto_1fr_auto]",
            scrolled ? "h-14" : "h-[4.25rem]",
          )}
        >
          {/* Wordmark */}
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-pl-mint text-[#03130c] shadow-[0_0_24px_-6px_rgba(0,229,153,0.7)]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-4"
                aria-hidden
              >
                <path d="M2 12h4l2.5-6 3.5 12 3-8 2 2h5" />
              </svg>
            </span>
            <span className="flex items-baseline gap-1.5 text-lg font-bold tracking-tight text-white">
              Pulse
              <span className="hidden font-mono text-[10px] font-medium tracking-[0.22em] text-pl-dim sm:inline">
                CRM
              </span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center justify-center gap-1 lg:flex">
            {navLinks.map((l) => {
              const hasMenu = !!menus[l];
              if (!hasMenu) {
                const isActive =
                  l === "Pricing" ? pathname === "/pricing" : pathname === `/${l.toLowerCase()}`;
                return (
                  <Link
                    key={l}
                    href={l === "Pricing" ? "/pricing" : `/${l.toLowerCase()}`}
                    onMouseEnter={() => setOpenMenu(null)}
                    onClick={() => setOpenMenu(null)}
                    className={cn(
                      "rounded-full px-3.5 py-2 text-sm font-medium transition-colors hover:bg-white/[0.05] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-pl-mint",
                      isActive ? "text-pl-mint" : "text-white/70",
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
                  onClick={() => (openMenu === l ? setOpenMenu(null) : openWith(l))}
                  onKeyDown={(e) => e.key === "Escape" && setOpenMenu(null)}
                  aria-expanded={openMenu === l}
                  aria-haspopup="true"
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-medium transition-colors hover:bg-white/[0.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-pl-mint",
                    openMenu === l ? "text-pl-mint" : "text-white/70 hover:text-white",
                  )}
                >
                  {l}
                  <ChevronDown
                    size={14}
                    className={cn("transition-transform duration-200", openMenu === l && "rotate-180")}
                  />
                </button>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-2">
            <button
              aria-label="Search"
              className="hidden size-9 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/[0.05] hover:text-white sm:inline-flex"
            >
              <Search size={17} />
            </button>
            <Link
              href="/login"
              className="hidden items-center rounded-full px-3.5 py-2 text-sm font-medium text-white/75 transition-colors hover:text-white sm:inline-flex"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="pl-btn-primary arrow-nudge hidden h-9 items-center gap-2 rounded-full px-4 text-sm font-semibold sm:inline-flex"
            >
              Get started <ArrowUpRight size={15} />
            </Link>
            <button
              aria-label="Open menu"
              onClick={() => setMobileOpen((v) => !v)}
              className="inline-flex size-9 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/[0.05] lg:hidden"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mega menu */}
        <AnimatePresence>
          {active && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute inset-x-0 top-full hidden justify-center px-6 pt-3 lg:flex"
              onMouseEnter={() => setOpenMenu(openMenu)}
              onMouseLeave={() => setOpenMenu(null)}
            >
              <div className="flex min-h-[420px] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-white/[0.09] bg-[#080c14]/95 p-7 shadow-[0_50px_120px_-30px_rgba(0,0,0,0.95)] backdrop-blur-2xl">
                <motion.div
                  key={openMenu}
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: { opacity: 1, transition: { staggerChildren: 0.03 } },
                  }}
                  className="grid flex-1 gap-9 lg:grid-cols-[1fr_1fr_0.85fr]"
                >
                  {(active.columns ?? []).map((col, i) => (
                    <div
                      key={col.heading}
                      className={cn(
                        "flex h-full flex-col",
                        i === 1 && "lg:border-l lg:border-white/[0.07] lg:pl-9",
                      )}
                    >
                      <p className="font-mono text-[10px] font-semibold tracking-[0.26em] text-pl-dim">
                        {col.heading}
                      </p>
                      <ul className="mt-4 flex-1 space-y-1">
                        {col.items.map((item) => {
                          const IconComponent = item.icon;
                          const childContent = (
                            <div className="group flex w-full items-center gap-3.5 rounded-2xl p-2.5 text-left transition-colors duration-200 hover:bg-white/[0.04]">
                              <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-pl-mint transition-all duration-200 group-hover:-translate-y-px group-hover:border-pl-mint/30 group-hover:bg-pl-mint/[0.08]">
                                <IconComponent className="size-4" />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-sm font-semibold text-white/90 transition-colors group-hover:text-white">
                                  {item.title}
                                </span>
                                <span className="mt-0.5 block max-w-[260px] text-xs leading-normal text-pl-muted line-clamp-2">
                                  {item.desc}
                                </span>
                              </span>
                            </div>
                          );
                          return (
                            <motion.li
                              key={item.title}
                              variants={{
                                hidden: { opacity: 0, y: 5 },
                                visible: {
                                  opacity: 1,
                                  y: 0,
                                  transition: { duration: 0.2, ease: "easeOut" },
                                },
                              }}
                              className="list-none"
                            >
                              {openMenu === "Platform" ? (
                                <button onClick={() => handlePlatformNavigation(item.title)} className="block w-full">
                                  {childContent}
                                </button>
                              ) : item.route ? (
                                <button
                                  onClick={() => {
                                    router.push(item.route!);
                                    setOpenMenu(null);
                                  }}
                                  className="block w-full"
                                >
                                  {childContent}
                                </button>
                              ) : (
                                <button onClick={() => setOpenMenu(null)} className="block w-full">
                                  {childContent}
                                </button>
                              )}
                            </motion.li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}

                  {/* Promo card */}
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, x: 8 },
                      visible: {
                        opacity: 1,
                        x: 0,
                        transition: { duration: 0.2, ease: "easeOut", delay: 0.08 },
                      },
                    }}
                    className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent"
                  >
                    {active.promo.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={active.promo.image}
                        alt={active.promo.heading}
                        loading="lazy"
                        width={800}
                        height={600}
                        className="h-32 w-full shrink-0 object-cover"
                      />
                    ) : (
                      <div className="relative h-32 w-full shrink-0 overflow-hidden bg-[#0b1220]">
                        <div className="pl-grid absolute inset-0 opacity-60" />
                        <div className="absolute inset-x-6 bottom-5 top-1/2">
                          <EcgMini />
                        </div>
                      </div>
                    )}
                    <div className="flex flex-1 flex-col justify-between p-5">
                      <div>
                        <p className="text-sm font-semibold text-white">{active.promo.heading}</p>
                        <p className="mt-1.5 max-w-[250px] text-xs leading-normal text-pl-muted">
                          {active.promo.desc}
                        </p>
                      </div>
                      <div className="mt-4 shrink-0">
                        {active.promo.cta ? (
                          <Link
                            href="/signup"
                            className="pl-btn-primary arrow-nudge inline-flex h-9 items-center justify-center gap-2 rounded-full px-4 text-xs font-semibold"
                          >
                            {active.promo.link} <ArrowUpRight size={14} />
                          </Link>
                        ) : openMenu === "Platform" ? (
                          <button
                            onClick={handleExplorePulseCRM}
                            className="arrow-nudge inline-flex items-center gap-1.5 text-xs font-medium text-pl-mint transition-colors hover:text-white"
                          >
                            {active.promo.link} <ArrowRight size={14} />
                          </button>
                        ) : active.promo.route ? (
                          <button
                            onClick={() => {
                              router.push(active.promo.route!);
                              setOpenMenu(null);
                            }}
                            className="arrow-nudge inline-flex items-center gap-1.5 text-xs font-medium text-pl-mint transition-colors hover:text-white"
                          >
                            {active.promo.link} <ArrowRight size={14} />
                          </button>
                        ) : (
                          <button
                            onClick={() => setOpenMenu(null)}
                            className="arrow-nudge inline-flex items-center gap-1.5 text-xs font-medium text-pl-mint transition-colors hover:text-white"
                          >
                            {active.promo.link} <ArrowRight size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dim behind mega menu */}
      <div
        aria-hidden
        onClick={() => setOpenMenu(null)}
        className={cn(
          "fixed inset-0 z-40 hidden bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:block",
          openMenu ? "cursor-pointer opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="menu-in relative z-50 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-white/[0.07] bg-[#05070d]/95 px-5 pb-6 pt-2 backdrop-blur-xl lg:hidden">
          <ul className="divide-y divide-white/[0.06]">
            {navLinks.map((l) => {
              const menuData = menus[l];
              const isExpandable = menuData && menuData.columns;
              return (
                <li key={l}>
                  {isExpandable ? (
                    <div className="py-3">
                      <button
                        onClick={() => setAccordion((a) => (a === l ? null : l))}
                        className="flex w-full items-center justify-between py-1 text-sm font-medium text-white"
                      >
                        {l}
                        <ChevronDown
                          size={16}
                          className={cn("transition-transform duration-200", accordion === l && "rotate-180")}
                        />
                      </button>
                      {accordion === l && (
                        <div className="mt-3 space-y-1">
                          {(menuData.columns ?? []).flatMap((c) => c.items).map((item) => {
                            const IconComponent = item.icon;
                            return (
                              <button
                                key={item.title}
                                onClick={() => {
                                  if (l === "Platform") handlePlatformNavigation(item.title);
                                  else if (item.route) router.push(item.route);
                                  setMobileOpen(false);
                                  setAccordion(null);
                                }}
                                className="group flex w-full items-center gap-3.5 py-2 text-left"
                              >
                                <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-pl-mint">
                                  <IconComponent className="size-4" />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block text-sm font-semibold text-white/90">{item.title}</span>
                                  <span className="mt-0.5 block max-w-[280px] truncate text-xs text-pl-muted">
                                    {item.desc}
                                  </span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={l === "Pricing" ? "/pricing" : `/${l.toLowerCase()}`}
                      onClick={() => setMobileOpen(false)}
                      className="block py-4 text-sm font-medium text-white/90 transition-colors hover:text-pl-mint"
                    >
                      {l}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="mt-5 flex flex-col gap-2.5">
            <Link
              href="/login"
              className="rounded-full border border-white/[0.14] py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-white/[0.05]"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="pl-btn-primary arrow-nudge inline-flex h-11 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold"
            >
              Get started <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

/* Tiny decorative ECG for the Platform promo tile. */
function EcgMini() {
  return (
    <svg viewBox="0 0 200 40" preserveAspectRatio="none" className="h-full w-full" aria-hidden>
      <path
        d="M0 20 L40 20 l8 -5 l6 9 l9 -18 l10 26 l8 -14 l6 6 L200 20"
        fill="none"
        stroke="#00e599"
        strokeWidth="1.6"
        pathLength={100}
        strokeDasharray="10 90"
        className="pl-ecg-sweep"
      />
    </svg>
  );
}
