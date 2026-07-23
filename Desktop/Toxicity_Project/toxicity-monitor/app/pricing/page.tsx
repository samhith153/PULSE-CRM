export default function PricingPage() {
  const plans = [
    { name: "Free", price: "$0", period: "forever", desc: "For individuals and hobby projects.", features: ["50 scans/month", "YouTube comment analysis", "Basic toxicity scoring", "Community support"], cta: "Get Started", highlight: false },
    { name: "Pro", price: "$15", period: "per month", desc: "For teams building safer platforms.", features: ["Unlimited scans", "Audio file analysis", "Real-time analytics dashboard", "API access (1000 req/day)", "Priority email support"], cta: "Start Free Trial", highlight: true },
    { name: "Enterprise", price: "Custom", period: "contact us", desc: "For large-scale platform moderation.", features: ["Unlimited everything", "Dedicated AI inference node", "SLA guarantee (99.9%)", "Custom model fine-tuning", "Dedicated account manager"], cta: "Contact Sales", highlight: false },
  ];

  return (
    <div style={{ minHeight: "calc(100vh - 64px)", background: "var(--bg-primary)", padding: "5rem 2rem" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <h1 style={{ fontSize: "2.75rem", fontWeight: 700, letterSpacing: "-1px", marginBottom: "1rem" }}>Simple, transparent pricing</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", maxWidth: 480, margin: "0 auto" }}>Start for free, scale when you need to. No hidden fees.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem" }}>
          {plans.map(plan => (
            <div key={plan.name} style={{ background: plan.highlight ? "var(--text-primary)" : "var(--bg-secondary)", color: plan.highlight ? "var(--bg-primary)" : "var(--text-primary)", border: "1px solid var(--border-subtle)", borderRadius: 16, padding: "2.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div>
                <p style={{ fontSize: "0.85rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", opacity: 0.6, marginBottom: "0.75rem" }}>{plan.name}</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "2.5rem", fontWeight: 700, letterSpacing: "-1px" }}>{plan.price}</span>
                  <span style={{ fontSize: "0.85rem", opacity: 0.6 }}>{plan.period}</span>
                </div>
                <p style={{ fontSize: "0.9rem", opacity: 0.7 }}>{plan.desc}</p>
              </div>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.75rem", flex: 1 }}>
                {plan.features.map(f => (
                  <li key={f} style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.9rem" }}>
                    <span style={{ color: plan.highlight ? "var(--bg-primary)" : "var(--accent-safe)" }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <button style={{ padding: "0.875rem", borderRadius: 8, border: plan.highlight ? "none" : "1px solid var(--border-subtle)", background: plan.highlight ? "var(--bg-primary)" : "transparent", color: plan.highlight ? "var(--text-primary)" : "var(--text-primary)", fontWeight: 600, fontSize: "0.95rem", cursor: "pointer", fontFamily: "inherit", transition: "opacity 0.2s" }}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
