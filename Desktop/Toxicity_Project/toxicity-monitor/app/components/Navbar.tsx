"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "./ThemeProvider";

const ShieldIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
);
const ChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
);
const ScanIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
);
const MicIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
);
const BarChartIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
);
const BotIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>
);
const MenuIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
);
const XIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
);
const SunIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
);
const MoonIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
);

const features = [
  { icon: <ScanIcon />, title: "YouTube Comment Scanner", desc: "Deep-scan any video's comment section for hate speech in seconds." },
  { icon: <MicIcon />, title: "Audio Transcription Audit", desc: "Upload voice memos and detect toxic speech with Whisper + DistilBERT." },
  { icon: <BarChartIcon />, title: "Real-time Analytics", desc: "Interactive toxicity scores with visual confidence metrics and badges." },
  { icon: <BotIcon />, title: "Persistent AI Engine", desc: "Warm-memory PyTorch backend keeps ML models ready for sub-second results." },
];

export default function Navbar() {
  const [featOpen, setFeatOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggleTheme, mounted } = useTheme();
  const dropRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    const handleClick = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setFeatOpen(false);
    };
    window.addEventListener("scroll", handleScroll);
    document.addEventListener("mousedown", handleClick);
    return () => { window.removeEventListener("scroll", handleScroll); document.removeEventListener("mousedown", handleClick); };
  }, []);

  useEffect(() => { setMobileOpen(false); setFeatOpen(false); }, [pathname]);

  const navLinkStyle = (active: boolean): React.CSSProperties => ({
    fontSize: "0.9rem", fontWeight: 500, color: active ? "var(--text-primary)" : "var(--text-secondary)",
    textDecoration: "none", padding: "0.5rem 0.75rem", borderRadius: "6px",
    transition: "color 0.2s ease, background 0.2s ease",
    background: active ? "var(--bg-elevated)" : "transparent",
  });

  return (
    <>
      <nav style={{
        position: "sticky", top: 0, zIndex: 1000,
        background: scrolled ? "rgba(var(--bg-secondary-rgb, 24,24,27), 0.85)" : "var(--bg-secondary)",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: "1px solid var(--border-subtle)",
        transition: "all 0.3s ease",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 2rem", display: "flex", alignItems: "center", height: 64, gap: "2rem" }}>
          {/* Logo */}
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.6rem", color: "var(--text-primary)", marginRight: "1rem" }}>
            <ShieldIcon />
            <span style={{ fontWeight: 700, fontSize: "1.1rem", letterSpacing: "-0.5px" }}>ToxicityMonitor</span>
          </Link>

          {/* Desktop Nav */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", flex: 1 }} className="desktop-nav">
            {/* Features Dropdown */}
            <div ref={dropRef} style={{ position: "relative" }}>
              <button
                onClick={() => setFeatOpen(!featOpen)}
                style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.9rem", fontWeight: 500, color: "var(--text-secondary)", background: "transparent", border: "none", cursor: "pointer", padding: "0.5rem 0.75rem", borderRadius: "6px", transition: "color 0.2s", fontFamily: "inherit" }}
                onMouseOver={e => (e.currentTarget.style.color = "var(--text-primary)")}
                onMouseOut={e => { if (!featOpen) e.currentTarget.style.color = "var(--text-secondary)"; }}
              >
                Features <ChevronDown />
              </button>
              {featOpen && (
                <div style={{
                  position: "absolute", top: "calc(100% + 12px)", left: "50%", transform: "translateX(-50%)",
                  background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)",
                  borderRadius: 12, boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                  padding: "1rem", width: 380, zIndex: 100,
                  animation: "fadeIn 0.15s ease",
                }}>
                  <p style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-muted)", marginBottom: "0.75rem", padding: "0 0.5rem" }}>Platform Features</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    {features.map((f, i) => (
                      <Link key={i} href="/" style={{ display: "flex", gap: "1rem", padding: "0.85rem", borderRadius: 8, textDecoration: "none", transition: "background 0.15s" }}
                        onMouseOver={e => (e.currentTarget.style.background = "var(--bg-elevated)")}
                        onMouseOut={e => (e.currentTarget.style.background = "transparent")}
                      >
                        <div style={{ color: "var(--text-secondary)", flexShrink: 0, marginTop: 2 }}>{f.icon}</div>
                        <div>
                          <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.2rem" }}>{f.title}</div>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.4 }}>{f.desc}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Link href="/docs" style={navLinkStyle(pathname === "/docs")}>Documentation</Link>
            <Link href="/pricing" style={navLinkStyle(pathname === "/pricing")}>Pricing</Link>
            <Link href="/community" style={navLinkStyle(pathname === "/community")}>Community</Link>
          </div>

          {/* Auth & Theme */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }} className="desktop-nav">
            <button
              onClick={toggleTheme}
              style={{
                background: "transparent", border: "1px solid var(--border-subtle)", borderRadius: 6,
                padding: "0.5rem", color: "var(--text-secondary)", cursor: "pointer", transition: "all 0.2s",
                display: "flex", alignItems: "center", justifyContent: "center", width: 38, height: 38
              }}
              onMouseOver={e => (e.currentTarget.style.color = "var(--text-primary)")}
              onMouseOut={e => (e.currentTarget.style.color = "var(--text-secondary)")}
              title={mounted ? (theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode") : ""}
            >
              {mounted ? (theme === "light" ? <MoonIcon /> : <SunIcon />) : <div style={{ width: 20, height: 20 }} />}
            </button>
            <Link href="/signin" style={{ fontSize: "0.9rem", fontWeight: 500, color: "var(--text-secondary)", textDecoration: "none", padding: "0.5rem 1rem", borderRadius: 6, transition: "color 0.2s", border: "1px solid var(--border-subtle)" }}
              onMouseOver={e => (e.currentTarget.style.color = "var(--text-primary)")}
              onMouseOut={e => (e.currentTarget.style.color = "var(--text-secondary)")}
            >
              Sign In
            </Link>
            <Link href="/register" style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--btn-text)", background: "var(--accent-primary)", textDecoration: "none", padding: "0.5rem 1.1rem", borderRadius: 6, transition: "opacity 0.2s" }}
              onMouseOver={e => (e.currentTarget.style.opacity = "0.85")}
              onMouseOut={e => (e.currentTarget.style.opacity = "1")}
            >
              Register
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)}
            style={{ display: "none", background: "transparent", border: "none", color: "var(--text-primary)", cursor: "pointer", padding: "0.5rem" }}
          >
            {mobileOpen ? <XIcon /> : <MenuIcon />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div style={{ borderTop: "1px solid var(--border-subtle)", padding: "1.5rem 2rem", display: "flex", flexDirection: "column", gap: "0.5rem", background: "var(--bg-secondary)" }}>
            <p style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-muted)", marginBottom: "0.5rem" }}>Features</p>
            {features.map((f, i) => (
              <Link key={i} href="/" style={{ display: "flex", gap: "0.75rem", alignItems: "center", padding: "0.75rem", borderRadius: 8, textDecoration: "none", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                {f.icon} {f.title}
              </Link>
            ))}
            <div style={{ borderTop: "1px solid var(--border-subtle)", margin: "0.75rem 0" }} />
            <Link href="/docs" style={{ padding: "0.75rem", color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.9rem", borderRadius: 8 }}>Documentation</Link>
            <Link href="/pricing" style={{ padding: "0.75rem", color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.9rem", borderRadius: 8 }}>Pricing</Link>
            <Link href="/community" style={{ padding: "0.75rem", color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.9rem", borderRadius: 8 }}>Community</Link>
            <div style={{ borderTop: "1px solid var(--border-subtle)", margin: "0.75rem 0", display: "flex", gap: "0.75rem" }}>
              <Link href="/signin" style={{ flex: 1, padding: "0.75rem", textAlign: "center", border: "1px solid var(--border-subtle)", borderRadius: 8, textDecoration: "none", color: "var(--text-primary)", fontWeight: 500, fontSize: "0.9rem", marginTop: "0.75rem" }}>Sign In</Link>
              <Link href="/register" style={{ flex: 1, padding: "0.75rem", textAlign: "center", background: "var(--accent-primary)", borderRadius: 8, textDecoration: "none", color: "var(--btn-text)", fontWeight: 600, fontSize: "0.9rem", marginTop: "0.75rem" }}>Register</Link>
            </div>
          </div>
        )}
      </nav>

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </>
  );
}
