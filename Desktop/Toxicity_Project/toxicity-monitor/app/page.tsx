"use client";

import { useState, useEffect } from "react";
import ToxicityCharts from "./components/ToxicityCharts";

// --- Minimal Enterprise SVGs ---
const ShieldIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
);
const VideoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg>
);
const MicIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>
);
const YoutubeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
);
const CheckCircle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
);
const AlertTriangle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
);
const ActivityIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
);
const SunIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="4.22" x2="19.78" y2="5.64"></line></svg>
);
const MoonIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
);

type CommentResult = { text: string; label: string; score: number; isToxic: boolean; };
type AnalysisData = { overallToxicity: number; totalComments: number; toxicComments: number; comments: CommentResult[]; };

export default function Home() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [hasStarted, setHasStarted] = useState(false);
  const [url, setUrl] = useState("");
  const [commentCount, setCommentCount] = useState(20);
  const [mode, setMode] = useState<"video" | "audio">("video");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioResult, setAudioResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<AnalysisData | null>(null);

  // Syncing Theme Selection with Global Document State
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const handleAudioScan = async () => {
    if (!audioFile) return;
    setLoading(true); setError(""); setAudioResult(null);
    const formData = new FormData(); formData.append("file", audioFile);
    try {
      const res = await fetch("/api/audio", { method: "POST", body: formData });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Audio analysis failed");
      setAudioResult(result);
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  const handleScan = async () => {
    if (!url.trim()) return;
    setLoading(true); setError(""); setData(null);
    try {
      const res = await fetch("/api/toxicity", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ videoUrl: url, commentCount }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Analysis failed");
      setData(result);
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  const CircularProgress = ({ value, toxic }: { value: number, toxic: boolean }) => {
    const radius = 55;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;
    const color = toxic ? "var(--accent-toxic)" : "var(--accent-safe)";

    return (
      <div style={{ position: "relative", width: "160px", height: "160px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg fill="none" width="160" height="160" viewBox="0 0 130 130" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="65" cy="65" r={radius} stroke="var(--bg-primary)" strokeWidth="10" />
          <circle cx="65" cy="65" r={radius} stroke={color} strokeWidth="10" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)" }} />
        </svg>
        <span style={{ position: "absolute", fontSize: "2.5rem", fontWeight: "700", color: "var(--text-primary)", letterSpacing: "-1px" }}>{value}<span style={{ fontSize: "1.2rem", color: "var(--text-secondary)" }}>%</span></span>
      </div>
    );
  };

  return (
    <main className="container animate-fade-in" style={{ padding: "3rem 2rem", minHeight: "100vh" }}>
      <header style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "4rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "1.5rem" }}>
        <div style={{ color: "var(--text-primary)" }}><ShieldIcon /></div>
        <h1 style={{ fontSize: "1.25rem", fontWeight: "600", letterSpacing: "-0.5px" }}>Toxicity Monitor</h1>
        
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px" }}>Workspace Engine</span>
          <button 
             onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} 
             className="btn-secondary" 
             style={{ padding: "0.5rem", borderColor: "transparent" }} 
             title="Toggle Theme"
          >
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
          </button>
        </div>
      </header>

      {!hasStarted ? (
        <section style={{ maxWidth: "700px", margin: "6rem auto", textAlign: "center" }} className="animate-fade-in">
          <div style={{ display: "inline-block", color: "var(--text-secondary)", padding: "0.4rem 1rem", borderRadius: "99px", fontSize: "0.80rem", fontWeight: "600", marginBottom: "2rem", border: "1px solid var(--border-subtle)" }}>
            Toxicity Monitor AI
          </div>
          <h2 style={{ fontSize: "3.5rem", fontWeight: "700", lineHeight: "1.1", marginBottom: "1.5rem", letterSpacing: "-1.5px" }}>
            Keep your platform completely safe.
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.15rem", marginBottom: "3rem", maxWidth: "550px", margin: "0 auto 3rem", lineHeight: "1.6" }}>
            Automatically scan YouTube conversation threads and uploaded voice messages to instantly identify toxic language and hate speech.
          </p>
          <button className="btn-core" style={{ padding: "1rem 2.5rem", fontSize: "1.05rem" }} onClick={() => setHasStarted(true)}>
            Start Scanning
          </button>
        </section>
      ) : (
        <div className="animate-fade-in">
          {(!data && !audioResult) ? (
            <section style={{ maxWidth: "550px", margin: "0 auto", marginTop: "2rem" }}>
              <div className="enterprise-card">
                
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem", padding: "0.35rem", background: "var(--bg-primary)", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
                  <button className={`btn-secondary ${mode === "video" ? "active" : ""}`} style={{ flex: 1, border: "none" }} onClick={() => setMode("video")}>
                    <VideoIcon /> Source URL
                  </button>
                  <button className={`btn-secondary ${mode === "audio" ? "active" : ""}`} style={{ flex: 1, border: "none" }} onClick={() => setMode("audio")}>
                    <MicIcon /> Audio Upload
                  </button>
                </div>

                {mode === "video" ? (
                  <div key="video-mode" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.5rem" }}>
                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "500", color: "var(--text-secondary)" }}>Target Origin</label>
                        <a 
                          href="https://www.youtube.com" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ fontSize: "0.75rem", color: "var(--text-primary)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.25rem", fontWeight: "600" }}
                        >
                          <YoutubeIcon /> Open YouTube
                        </a>
                      </div>
                      <input
                        key="url-input"
                        type="text"
                        placeholder="Paste YouTube Video URL"
                        className="input-minimal"
                        value={url || ""}
                        onChange={(e) => setUrl(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                    
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                        <label style={{ fontSize: "0.85rem", fontWeight: "500", color: "var(--text-secondary)" }}>Evaluation Scope</label>
                        <span style={{ fontSize: "0.85rem", color: "var(--text-primary)", fontWeight: "600" }}>{commentCount} Nodes</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="100"
                        step="5"
                        value={commentCount || 20}
                        onChange={(e) => setCommentCount(Number(e.target.value))}
                        disabled={loading}
                        style={{ width: "100%", cursor: "pointer", opacity: 0.8 }}
                      />
                    </div>
                    <div style={{ marginTop: "1rem" }}>
                      <button className="btn-core" style={{ width: "100%" }} onClick={handleScan} disabled={loading || !url.trim()}>
                        {loading && <ActivityIcon />} {loading ? "Aggregating Dataset..." : "Execute Scan"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div key="audio-mode" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "500", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Audio Packet</label>
                      <input 
                        key="file-input" 
                        type="file" 
                        accept="audio/*,.mp3,.wav,.m4a" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file && !file.type.startsWith("audio/") && !file.name.match(/\.(mp3|wav|m4a|ogg|flac)$/i)) {
                            setError("Strict requirement: Must be a valid audio file format.");
                            setAudioFile(null);
                            e.target.value = "";
                          } else {
                            setError("");
                            setAudioFile(file || null);
                          }
                        }} 
                        disabled={loading} 
                        className="input-minimal" 
                        style={{ cursor: "pointer", color: "var(--text-secondary)" }} 
                      />
                    </div>
                    <div style={{ marginTop: "1rem" }}>
                      <button className="btn-core" style={{ width: "100%" }} onClick={handleAudioScan} disabled={loading || !audioFile}>
                        {loading && <ActivityIcon />} {loading ? "Routing through Neural Engine..." : "Initiate Audit"}
                      </button>
                    </div>
                  </div>
                )}

                {loading && (
                   <div style={{ marginTop: "1.5rem", padding: "1rem", background: "var(--bg-primary)", borderRadius: "8px", display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--text-secondary)", fontSize: "0.85rem", border: "1px solid var(--border-subtle)" }}>
                     <ActivityIcon /> Accessing pre-trained ML node weights...
                   </div>
                )}

                {error && (
                  <div style={{ marginTop: "1.5rem", padding: "1rem", borderRadius: "8px", background: "rgba(239, 68, 68, 0.05)", color: "var(--accent-toxic)", border: "1px solid rgba(239, 68, 68, 0.2)", fontSize: "0.85rem" }}>
                    <strong>System Interruption:</strong> {error}
                  </div>
                )}
              </div>
            </section>

          ) : (
            <>
              {data && (
                <section className="animate-fade-in" style={{ padding: "0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.5rem" }}>
                    <div>
                      <h2 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "0.25rem", letterSpacing: "-0.5px" }}>Auditing Report</h2>
                      <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>DistilBERT Sequence Classification active.</p>
                    </div>
                    <button className="btn-secondary" onClick={() => setData(null)}>Start New Session</button>
                  </div>



                  <div style={{ display: "grid", gridTemplateColumns: "1fr 2.5fr", gap: "2rem", alignItems: "start" }}>
                    <div className="enterprise-card" style={{ display: "flex", flexDirection: "column", gap: "2rem", padding: "2.5rem 2rem" }}>
                      <div>
                        <h3 style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-muted)", marginBottom: "2rem", textAlign: "center" }}>Overall Metric</h3>
                        <div style={{ display: "flex", justifyContent: "center" }}>
                          <CircularProgress value={data.overallToxicity} toxic={data.overallToxicity > 20} />
                        </div>
                      </div>
                      <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "2rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", textAlign: "center" }}>
                        <div>
                          <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", marginBottom: "0.25rem", letterSpacing: "0.5px" }}>Processed</div>
                          <div style={{ fontSize: "1.75rem", fontWeight: "600" }}>{data.totalComments}</div>
                        </div>
                        <div>
                          <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", marginBottom: "0.25rem", letterSpacing: "0.5px" }}>Violations</div>
                          <div style={{ fontSize: "1.75rem", fontWeight: "600", color: data.toxicComments > 0 ? "var(--accent-toxic)" : "var(--text-primary)" }}>{data.toxicComments}</div>
                        </div>
                      </div>
                    </div>

                    <div className="enterprise-card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                      <div style={{ padding: "1.25rem 2rem", borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-primary)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h3 style={{ fontSize: "0.9rem", fontWeight: "500", color: "var(--text-secondary)" }}>Parsed Conversation Log</h3>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Confidence Accuracy Array</span>
                      </div>
                      <div style={{ padding: "0 2rem", maxHeight: "650px", overflowY: "auto" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "1.5rem 0" }}>
                          {data.comments.map((c, i) => (
                            <div key={i} className={`comment-card ${c.isToxic ? "toxic" : "safe"}`} style={{ animationDelay: `${i * 0.05}s`, opacity: 0, animation: "fadeIn 0.3s forwards" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                                <span className={`badge ${c.isToxic ? "badge-toxic" : "badge-safe"}`}>
                                  {c.isToxic ? <><AlertTriangle /> <span style={{ marginLeft: "4px" }}>Flagged Content</span></> : <><CheckCircle /> <span style={{ marginLeft: "4px" }}>Approved</span></>}
                                </span>
                                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "monospace", letterSpacing: "0.5px" }}>
                                  SCORE: {(c.score * 100).toFixed(1)}%
                                </span>
                              </div>
                              <p style={{ color: "var(--text-primary)", fontSize: "0.95rem", lineHeight: "1.6" }}>{c.text}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: "2rem" }}>
                    <ToxicityCharts comments={data.comments} />
                  </div>

                  <div className="enterprise-card" style={{ marginTop: "2rem", padding: "2rem", borderTop: "4px solid var(--border-subtle)" }}>
                    <h3 style={{ fontSize: "0.9rem", fontWeight: "600", marginBottom: "1.5rem", color: "var(--text-primary)" }}>Data Visualization Guide</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "2.5rem" }}>
                      <div>
                        <h4 style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-muted)", marginBottom: "0.75rem" }}>Composition (Donut)</h4>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                          Quickly see the ratio of <strong>Safe</strong> vs <strong>Flagged</strong> content. Ideal for high-level moderation oversight.
                        </p>
                      </div>
                      <div>
                        <h4 style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-muted)", marginBottom: "0.75rem" }}>Risk Meter (Radial)</h4>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                          The "mean toxicity" level. A standardized probability score for the entire session at a glance.
                        </p>
                      </div>
                      <div>
                        <h4 style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-muted)", marginBottom: "0.75rem" }}>Distribution (Bar)</h4>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                          Segments content into hazard brackets. <strong>0-40%</strong> is safe; <strong>80-100%</strong> requires immediate attention.
                        </p>
                      </div>
                      <div>
                        <h4 style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-muted)", marginBottom: "0.75rem" }}>Timeline (Area)</h4>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                          Follow the conversation's "heat." Peaks represent aggressive clusters where discussions turned hostile.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {audioResult && (
                <section className="animate-fade-in" style={{ padding: "0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.5rem" }}>
                    <div>
                      <h2 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "0.25rem", letterSpacing: "-0.5px" }}>Audio Audit Report</h2>
                      <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Backend handled via persistent PyTorch engine.</p>
                    </div>
                    <button className="btn-secondary" onClick={() => setAudioResult(null)}>Start New Session</button>
                  </div>

                  <div className="enterprise-card" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "3rem", padding: "3rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", paddingRight: "3rem", borderRight: "1px solid var(--border-subtle)" }}>
                      <h3 style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-muted)" }}>Extracted Transcription</h3>
                      <div style={{ color: "var(--text-primary)", fontSize: "1.2rem", lineHeight: "1.7", fontWeight: "300" }}>
                        "{audioResult.transcription}"
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", justifyContent: "center" }}>
                      <div>
                        <h3 style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-muted)", marginBottom: "0.75rem" }}>Engine Verdict</h3>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", fontSize: "1.25rem", fontWeight: "600", padding: "0.5rem 1rem", borderRadius: "8px", background: audioResult.prediction === 'TOXIC' ? "rgba(239, 68, 68, 0.1)" : "rgba(16, 185, 129, 0.1)", color: audioResult.prediction === 'TOXIC' ? "var(--accent-toxic)" : "var(--accent-safe)", border: `1px solid ${audioResult.prediction === 'TOXIC' ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.2)"}` }}>
                          {audioResult.prediction === 'TOXIC' ? <><AlertTriangle /> FLAG</> : <><CheckCircle /> SAFE</>}
                        </div>
                      </div>

                      <div>
                        <h3 style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-muted)", marginBottom: "0.5rem" }}>Toxicity Confidence Vector</h3>
                        <div style={{ fontSize: "2.5rem", fontWeight: "700", color: "var(--text-primary)", fontFamily: "monospace", letterSpacing: "-1px" }}>
                          {(audioResult.toxicity_score * 100).toFixed(1)}<span style={{ fontSize: "1.25rem", color: "var(--text-muted)" }}>%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {audioResult.segments && (
                    <div style={{ marginTop: "2rem" }}>
                      <ToxicityCharts comments={audioResult.segments} />
                    </div>
                  )}

                  <div className="enterprise-card" style={{ marginTop: "2rem", padding: "2rem", borderTop: "4px solid var(--border-subtle)" }}>
                    <h3 style={{ fontSize: "0.9rem", fontWeight: "600", marginBottom: "1.5rem", color: "var(--text-primary)" }}>Audio Visualization Guide</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "2.5rem" }}>
                      <div>
                        <h4 style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-muted)", marginBottom: "0.75rem" }}>Composition (Donut)</h4>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                          Breakdown of <strong>Safe Speech</strong> vs <strong>Detected Violations</strong> across transcript segments.
                        </p>
                      </div>
                      <div>
                        <h4 style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-muted)", marginBottom: "0.75rem" }}>Overall Risk</h4>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                          Mean probability of toxicity for the entire duration of the audio clip.
                        </p>
                      </div>
                      <div>
                        <h4 style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-muted)", marginBottom: "0.75rem" }}>Segment Distribution</h4>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                          Visualizes how many individual time blocks fall into each safety bracket.
                        </p>
                      </div>
                      <div>
                        <h4 style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-muted)", marginBottom: "0.75rem" }}>Toxicity Timeline</h4>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                          Identify exactly when hostile language occurred relative to the audio start time.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      )}
    </main>
  );
}
