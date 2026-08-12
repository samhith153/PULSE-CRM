import { Link2 } from "lucide-react";

const groups = [
  { title: "Product", links: ["Lead Scoring", "AI Copilot", "Automation", "Insights", "Pricing"] },
  { title: "Company", links: ["About", "Careers", "Newsroom", "Partners", "Contact"] },
  { title: "Resources", links: ["Docs", "Guides", "Changelog", "Community", "Status"] },
  { title: "Legal", links: ["Privacy", "Terms", "Security", "DPA", "Cookies"] },
];

const socials = [
  { name: "Twitter", icon: Link2 },
  { name: "LinkedIn", icon: Link2 },
  { name: "GitHub", icon: Link2 },
  { name: "YouTube", icon: Link2 },
];

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden bg-ink text-primary-foreground">
      <div aria-hidden className="pointer-events-none absolute inset-0 footer-grid" />
      <div aria-hidden className="pointer-events-none absolute inset-0 footer-grid-fine" />
      <div className="relative mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {groups.map((g) => (
            <div key={g.title}>
              <p className="text-sm font-semibold">{g.title}</p>
              <ul className="mt-4 space-y-3">
                {g.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="text-sm text-primary-foreground/60 transition-colors hover:text-primary-foreground"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div aria-hidden className="pointer-events-none mt-16 select-none">
          <span className="footer-wordmark block text-center text-[22vw] font-extrabold leading-[0.78] tracking-tight">
            Pulse
          </span>
        </div>

        <div className="mt-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-6 border-t border-primary-foreground/10 pt-8 sm:flex sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <span className="flex items-center gap-1 text-lg font-bold">
              Pulse
              <span className="grad-blue-purple mt-2 size-1.5 shrink-0 rounded-full" />
            </span>
            <span className="truncate text-xs text-primary-foreground/50">
              © {new Date().getFullYear()} Pulse CRM, Inc.
            </span>
          </div>
          <div className="flex shrink-0 gap-2">
            {socials.map((social) => (
              <a
                key={social.name}
                href="#"
                aria-label={social.name}
                className="grid size-9 place-items-center rounded-full border border-primary-foreground/15 text-primary-foreground/70 transition-all duration-200 hover:-translate-y-0.5 hover:text-primary-foreground"
              >
                <social.icon size={15} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
