"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
);
const GithubIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
);

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const handleOAuth = async (provider: "google" | "github") => {
    setLoading(provider);
    await signIn(provider, { callbackUrl: "/" });
  };

  return (
    <div style={{ minHeight: "calc(100vh - 64px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", background: "var(--bg-primary)" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.5px", marginBottom: "0.5rem" }}>Create an account</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>Start moderating your platform for free</p>
        </div>

        <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: 16, padding: "2.5rem" }}>
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.75rem" }}>
            {([
              { id: "google" as const, icon: <GoogleIcon />, label: "Google" },
              { id: "github" as const, icon: <GithubIcon />, label: "GitHub" },
            ]).map(({ id, icon, label }) => (
              <button
                key={id}
                onClick={() => handleOAuth(id)}
                disabled={loading === id}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem", padding: "0.75rem", border: "1px solid var(--border-subtle)", borderRadius: 8, background: "transparent", color: "var(--text-primary)", fontWeight: 500, fontSize: "0.9rem", cursor: "pointer", transition: "background 0.2s", fontFamily: "inherit", opacity: loading === id ? 0.6 : 1 }}
                onMouseOver={e => { if (loading !== id) e.currentTarget.style.background = "var(--bg-elevated)"; }}
                onMouseOut={e => (e.currentTarget.style.background = "transparent")}
              >
                {icon} {loading === id ? "Redirecting..." : label}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.75rem" }}>
            <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>or sign up with email</span>
            <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Full Name</label>
              <input type="text" placeholder="Jane Doe" value={name} onChange={e => setName(e.target.value)} className="input-minimal" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Email address</label>
              <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} className="input-minimal" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Password</label>
              <input type="password" placeholder="Min. 8 characters" value={password} onChange={e => setPassword(e.target.value)} className="input-minimal" />
            </div>
            <label style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", cursor: "pointer" }}>
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ marginTop: 2, accentColor: "var(--accent-primary)", width: 16, height: 16, cursor: "pointer" }} />
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                I agree to the{" "}
                <Link href="#" style={{ color: "var(--text-primary)", fontWeight: 600, textDecoration: "none" }}>Terms of Service</Link>
                {" "}and{" "}
                <Link href="#" style={{ color: "var(--text-primary)", fontWeight: 600, textDecoration: "none" }}>Privacy Policy</Link>
              </span>
            </label>
          </div>

          <button className="btn-core" style={{ width: "100%", marginTop: "1.75rem" }} disabled={!agreed || !!loading}>
            Create Account
          </button>

          <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.875rem", color: "var(--text-muted)" }}>
            Already have an account?{" "}
            <Link href="/signin" style={{ color: "var(--text-primary)", fontWeight: 600, textDecoration: "none" }}>Sign In →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
