"use client";

/* Brand icons were removed from lucide-react in v1.x, so these are inlined SVGs. */
function GithubIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

function LinkedinIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
    </svg>
  );
}

function XTwitterIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  );
}

function YoutubeIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

const groups = [
  { title: "Product", links: ["Lead Scoring", "AI Copilot", "Automation", "Insights", "Pricing"] },
  { title: "Company", links: ["About", "Careers", "Newsroom", "Partners", "Contact"] },
  { title: "Resources", links: ["Docs", "Guides", "Changelog", "Community", "Status"] },
  { title: "Legal", links: ["Privacy", "Terms", "Security", "DPA", "Cookies"] },
];

const socials = [XTwitterIcon, LinkedinIcon, GithubIcon, YoutubeIcon];

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-white/[0.07] bg-[#03050a]">
      <div aria-hidden className="pl-grid pointer-events-none absolute inset-0 opacity-70 pl-mask-b" />

      <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-10">
        {/* top row: brand + link groups */}
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <div>
            <span className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-lg bg-pl-mint text-[#03130c]">
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
                <span className="font-mono text-[10px] font-medium tracking-[0.22em] text-pl-dim">
                  CRM
                </span>
              </span>
            </span>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-pl-muted">
              Every customer signal, scored into action. The AI-native CRM for teams that refuse to
              let a deal go cold.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
            {groups.map((g) => (
              <div key={g.title}>
                <p className="font-mono text-[10px] font-semibold tracking-[0.24em] text-pl-dim uppercase">
                  {g.title}
                </p>
                <ul className="mt-4 space-y-3">
                  {g.links.map((l) => (
                    <li key={l}>
                      <a
                        href="#"
                        className="text-sm text-white/55 transition-colors hover:text-white"
                      >
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* giant wordmark */}
        <div aria-hidden className="pointer-events-none mt-16 select-none">
          <span className="footer-wordmark block text-center text-[22vw] leading-[0.78] font-extrabold tracking-tight">
            Pulse
          </span>
        </div>

        {/* bottom bar */}
        <div className="mt-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-6 border-t border-white/[0.07] pt-8 sm:flex sm:justify-between">
          <p className="truncate text-xs text-pl-dim">
            © {new Date().getFullYear()} Pulse CRM, Inc. All rights reserved.
          </p>
          <div className="flex shrink-0 gap-2">
            {socials.map((Icon, i) => (
              <a
                key={i}
                href="#"
                aria-label="Social link"
                className="grid size-9 place-items-center rounded-full border border-white/[0.1] text-white/60 transition-all duration-200 hover:-translate-y-0.5 hover:border-pl-mint/40 hover:text-pl-mint"
              >
                <Icon size={15} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
