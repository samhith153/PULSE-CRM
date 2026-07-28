import Link from "next/link";

export default function CommunityPage() {
  const links = [
    { title: "GitHub Repository", desc: "Browse the source code, open issues, and contribute pull requests.", href: "https://github.com/SiddarthGVH/Major_Project", label: "View on GitHub →" },
    { title: "Discussion Board", desc: "Ask questions, share detection results, and help fellow developers.", href: "#", label: "Join Discussion →" },
    { title: "Changelog", desc: "Stay up to date with the latest features, fixes, and improvements.", href: "#", label: "Read Changelog →" },
    { title: "Feature Requests", desc: "Vote on community-suggested improvements and submit your own ideas.", href: "#", label: "Request a Feature →" },
  ];

  return (
    <div style={{ minHeight: "calc(100vh - 64px)", background: "var(--bg-primary)", padding: "5rem 2rem" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <h1 style={{ fontSize: "2.75rem", fontWeight: 700, letterSpacing: "-1px", marginBottom: "1rem" }}>Join the Community</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", maxWidth: 480, margin: "0 auto" }}>Toxicity Monitor is open source. Contribute, discuss, and grow with us.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          {links.map(l => (
            <div key={l.title} style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: 16, padding: "2rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 600 }}>{l.title}</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6, flex: 1 }}>{l.desc}</p>
              <a href={l.href} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)", textDecoration: "none" }}>{l.label}</a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
