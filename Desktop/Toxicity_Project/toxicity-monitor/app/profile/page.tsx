"use client";
import { useState } from "react";

const sections = ["General", "Security", "Notifications"];

const activity = [
  { action: "Scanned YouTube video", detail: "Detected 3 toxic comments (14.3%)", time: "2 hours ago", toxic: true },
  { action: "Audio file analyzed", detail: "Audio flagged: SAFE (2.1% confidence)", time: "Yesterday", toxic: false },
  { action: "Scanned YouTube video", detail: "34 comments — 0 violations found", time: "2 days ago", toxic: false },
  { action: "Account created", detail: "Welcome to ToxicityMonitor!", time: "Mar 24, 2026", toxic: false },
];

export default function ProfilePage() {
  const [activeSection, setActiveSection] = useState("General");
  const [name, setName] = useState("Siddarth GVH");
  const [email, setEmail] = useState("siddarth@example.com");
  const [bio, setBio] = useState("ML researcher & platform safety engineer.");

  return (
    <div style={{ minHeight: "calc(100vh - 64px)", background: "var(--bg-primary)", padding: "3rem 2rem" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ marginBottom: "2.5rem" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.5px" }}>Account Settings</h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "0.4rem", fontSize: "0.95rem" }}>Manage your profile, security, and notification preferences.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: "2rem", alignItems: "start" }}>
          {/* Sidebar */}
          <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: 12, padding: "1rem", position: "sticky", top: 84 }}>
            {sections.map(s => (
              <button key={s} onClick={() => setActiveSection(s)}
                style={{ width: "100%", textAlign: "left", padding: "0.75rem 1rem", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "0.9rem", fontWeight: activeSection === s ? 600 : 400, background: activeSection === s ? "var(--bg-elevated)" : "transparent", color: activeSection === s ? "var(--text-primary)" : "var(--text-secondary)", transition: "all 0.15s", marginBottom: "0.25rem" }}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Main Content */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {/* Profile Card */}
            <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: 16, padding: "2.5rem" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "2rem", paddingBottom: "1rem", borderBottom: "1px solid var(--border-subtle)" }}>
                {activeSection === "General" ? "Profile Information" : activeSection === "Security" ? "Security Settings" : "Notification Preferences"}
              </h2>

              {activeSection === "General" && (
                <>
                  {/* Avatar */}
                  <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginBottom: "2rem" }}>
                    <div style={{ width: 80, height: 80, borderRadius: "50%", background: "var(--bg-elevated)", border: "2px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", fontWeight: 700, color: "var(--text-secondary)", flexShrink: 0 }}>
                      {name.charAt(0)}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: "1.1rem" }}>{name}</p>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.2rem" }}>{email}</p>
                      <button style={{ marginTop: "0.6rem", padding: "0.35rem 0.75rem", border: "1px solid var(--border-subtle)", borderRadius: 6, background: "transparent", color: "var(--text-secondary)", fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit" }}>Change Avatar</button>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Full Name</label>
                        <input value={name} onChange={e => setName(e.target.value)} className="input-minimal" />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Email Address</label>
                        <input value={email} onChange={e => setEmail(e.target.value)} type="email" className="input-minimal" />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Short Bio</label>
                      <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} className="input-minimal" style={{ resize: "vertical" as const }} />
                    </div>
                  </div>

                  <div style={{ marginTop: "1.75rem", display: "flex", gap: "0.75rem" }}>
                    <button className="btn-core">Save Changes</button>
                    <button className="btn-secondary">Cancel</button>
                  </div>
                </>
              )}

              {activeSection === "Security" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  {["Current Password", "New Password", "Confirm New Password"].map(label => (
                    <div key={label}>
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>{label}</label>
                      <input type="password" placeholder="••••••••" className="input-minimal" />
                    </div>
                  ))}
                  <button className="btn-core" style={{ alignSelf: "flex-start", marginTop: "0.5rem" }}>Update Password</button>
                </div>
              )}

              {activeSection === "Notifications" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  {["Email me on scan completion", "Notify on high toxicity threshold (>50%)", "Weekly summary digest", "Product updates and announcements"].map(label => (
                    <label key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", borderRadius: 8, border: "1px solid var(--border-subtle)", cursor: "pointer" }}>
                      <span style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>{label}</span>
                      <input type="checkbox" defaultChecked style={{ accentColor: "var(--accent-primary)", width: 16, height: 16, cursor: "pointer" }} />
                    </label>
                  ))}
                  <button className="btn-core" style={{ alignSelf: "flex-start" }}>Save Preferences</button>
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: 16, overflow: "hidden" }}>
              <div style={{ padding: "1.5rem 2rem", borderBottom: "1px solid var(--border-subtle)" }}>
                <h2 style={{ fontSize: "1rem", fontWeight: 600 }}>Recent Activity</h2>
              </div>
              <div style={{ padding: "1rem" }}>
                {activity.map((a, i) => (
                  <div key={i} style={{ display: "flex", gap: "1rem", padding: "1rem", borderRadius: 8, alignItems: "flex-start" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: a.toxic ? "var(--accent-toxic)" : "var(--accent-safe)", flexShrink: 0, marginTop: 6 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 500, fontSize: "0.9rem" }}>{a.action}</p>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: "0.2rem" }}>{a.detail}</p>
                    </div>
                    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", whiteSpace: "nowrap", flexShrink: 0 }}>{a.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
