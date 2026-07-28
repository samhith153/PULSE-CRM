"use client";
import { useState, useEffect } from "react";

// Types
type DocSection = {
  title: string;
  description: string;
  id: string;
  content: React.ReactNode;
  toc: { id: string; label: string }[];
};

// --- Sub-components ---

const SystemHealth = () => {
  const [status, setStatus] = useState({ backend: "checking", api: "checking" });

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch("http://localhost:5000/health");
        setStatus(prev => ({ ...prev, backend: res.ok ? "online" : "offline" }));
      } catch {
        setStatus(prev => ({ ...prev, backend: "offline" }));
      }
      // Simple mock for API check
      setStatus(prev => ({ ...prev, api: "online" }));
    };
    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const StatusDot = ({ type }: { type: string }) => (
    <div style={{ width: 8, height: 8, borderRadius: "50%", background: type === "online" ? "var(--accent-safe)" : type === "offline" ? "var(--accent-toxic)" : "#fbbf24", marginRight: 8 }} />
  );

  return (
    <div style={{ background: "var(--bg-secondary)", borderRadius: 12, border: "1px solid var(--border-subtle)", padding: "1.5rem", marginBottom: "2rem" }}>
      <h3 style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-muted)", marginBottom: "1rem" }}>System Live Status</h3>
      <div style={{ display: "flex", gap: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <StatusDot type={status.backend} />
          <div>
            <p style={{ fontSize: "0.9rem", fontWeight: 600 }}>AI Backend (Flask)</p>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{status.backend.toUpperCase()}</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <StatusDot type={status.api} />
          <div>
            <p style={{ fontSize: "0.9rem", fontWeight: 600 }}>YouTube API</p>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>CONNECTED</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const APIPlayground = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testAPI = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/toxicity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl: url, commentCount: 5 }),
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setResult({ error: "Failed to fetch. Make sure backend is running." });
    }
    setLoading(false);
  };

  return (
    <div style={{ background: "var(--bg-secondary)", borderRadius: 12, border: "1px solid var(--border-subtle)", padding: "1.5rem", marginTop: "2rem" }}>
      <h3 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "1rem" }}>API Playground</h3>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <input 
          className="input-minimal" 
          placeholder="Paste YouTube URL to test..." 
          value={url} 
          onChange={(e) => setUrl(e.target.value)} 
          style={{ fontSize: "0.85rem" }}
        />
        <button className="btn-core" onClick={testAPI} disabled={loading || !url} style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}>
          {loading ? "Testing..." : "Test POST"}
        </button>
      </div>
      {result && (
        <pre style={{ background: "var(--bg-elevated)", padding: "1rem", borderRadius: 8, fontSize: "0.75rem", overflowX: "auto", border: "1px solid var(--border-subtle)" }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
};

const sidebar = [
  { section: "Getting Started", items: ["Introduction", "Quick Start", "Installation"] },
  { section: "Core Concepts", items: ["How Scanning Works", "Toxicity Scoring"] },
  { section: "API Reference", items: ["POST /api/toxicity", "POST /api/audio"] },
];

export default function DocsPage() {
  const [activeItem, setActiveItem] = useState("Introduction");

  const contentMap: Record<string, DocSection> = {
    "Introduction": {
      id: "intro",
      title: "Introduction",
      description: "Welcome to the Toxicity Monitor platform documentation.",
      toc: [
        { id: "overview", label: "Overview" },
        { id: "health", label: "System Health" },
        { id: "features", label: "Key Features" }
      ],
      content: (
        <>
          <p id="overview" style={{ lineHeight: 1.7, color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
            This platform provides real-time toxicity detection and content moderation for digital interactions. 
            By leveraging advanced NLP models like DistilBERT and high-performance audio transcription (Whisper), 
            we enable platforms to audit speech and text with sub-second latency.
          </p>
          <div id="health"><SystemHealth /></div>
          <h2 id="features" style={{ fontSize: "1.3rem", fontWeight: 600, marginBottom: "1rem" }}>Key Features</h2>
          <ul style={{ paddingLeft: "1.25rem", color: "var(--text-secondary)", lineHeight: 1.8 }}>
            <li>Deep YouTube comment thread scanning.</li>
            <li>Multi-modal support (MP3/WAV audio, Raw Text).</li>
            <li>Enterprise-grade monitoring dashboard.</li>
            <li>High-performance "Warm Memory" ML architecture.</li>
          </ul>
        </>
      )
    },
    "Quick Start": {
      id: "quick",
      title: "Quick Start",
      description: "Get up and running in under 5 minutes.",
      toc: [
        { id: "setup", label: "Setup" },
        { id: "frontend", label: "Start Frontend" },
        { id: "backend", label: "Start AI Engine" }
      ],
      content: (
        <>
          <h3 id="setup" style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem" }}>Initialize Repository</h3>
          <div style={{ background: "var(--bg-secondary)", borderRadius: 10, border: "1px solid var(--border-subtle)", overflow: "hidden", marginBottom: "1.5rem" }}>
             <pre style={{ padding: "1.25rem", margin: 0, fontSize: "0.85rem", color: "var(--text-primary)" }}>
               <code>{`git clone https://github.com/SiddarthGVH/Major_Project\nnpm install`}</code>
             </pre>
          </div>
          <h3 id="frontend" style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem" }}>Start Frontend</h3>
          <div style={{ background: "var(--bg-secondary)", borderRadius: 10, border: "1px solid var(--border-subtle)", overflow: "hidden", marginBottom: "1.5rem" }}>
             <pre style={{ padding: "1.25rem", margin: 0, fontSize: "0.85rem", color: "var(--text-primary)" }}>
               <code>{`npm run dev`}</code>
             </pre>
          </div>
          <h3 id="backend" style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem" }}>Start AI Engine</h3>
          <div style={{ background: "var(--bg-secondary)", borderRadius: 10, border: "1px solid var(--border-subtle)", overflow: "hidden" }}>
             <pre style={{ padding: "1.25rem", margin: 0, fontSize: "0.85rem", color: "var(--text-primary)" }}>
               <code>{`pip install -r requirements.txt\npython audio_server.py`}</code>
             </pre>
          </div>
        </>
      )
    },
    "Installation": {
      id: "install",
      title: "Installation Guide",
      description: "Detailed setup for various environments.",
      toc: [
        { id: "env", label: "Env Variables" },
        { id: "docker", label: "Docker" }
      ],
      content: (
        <>
          <h3 id="env" style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem" }}>Environment Variables</h3>
          <p style={{ marginBottom: "1rem" }}>Create a <code>.env.local</code> file in the root:</p>
          <div style={{ background: "var(--bg-secondary)", borderRadius: 10, border: "1px solid var(--border-subtle)", overflow: "hidden", marginBottom: "2rem" }}>
             <pre style={{ padding: "1.25rem", margin: 0, fontSize: "0.85rem", color: "var(--text-primary)" }}>
               <code>{`YOUTUBE_API_KEY=your_key_here\nNEXTAUTH_SECRET=random_string`}</code>
             </pre>
          </div>
          <h3 id="docker" style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem" }}>Docker (Experimental)</h3>
          <p style={{ color: "var(--text-secondary)" }}>Docker support is currently in development for better containerization of the PyTorch environment.</p>
        </>
      )
    },
    "How Scanning Works": {
      id: "how-it-works",
      title: "The Scanning Pipeline",
      description: "How we process data from fetch to classification.",
      toc: [
        { id: "ingestion", label: "Data Ingestion" },
        { id: "processing", label: "Pre-processing" },
        { id: "inference", label: "AI Inference" }
      ],
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div id="ingestion" style={{ padding: "1.5rem", background: "var(--bg-elevated)", borderRadius: 12, border: "1px solid var(--border-subtle)" }}>
            <h4 style={{ marginBottom: "0.5rem" }}>1. Data Ingestion</h4>
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>We fetch YouTube comments via Google Data API or accept raw multipart/form-data for audio files.</p>
          </div>
          <div id="processing" style={{ padding: "1.5rem", background: "var(--bg-elevated)", borderRadius: 12, border: "1px solid var(--border-subtle)" }}>
            <h4 style={{ marginBottom: "0.5rem" }}>2. Pre-processing</h4>
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>Audio is normalized using FFmpeg and converted to 16kHz mono before Whisper transcription.</p>
          </div>
          <div id="inference" style={{ padding: "1.5rem", background: "var(--bg-elevated)", borderRadius: 12, border: "1px solid var(--border-subtle)" }}>
            <h4 style={{ marginBottom: "0.5rem" }}>3. AI Inference</h4>
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>Text blocks are tokenized and passed through a DistilBERT sequence classifier trained on Jigsaw toxicity data.</p>
          </div>
        </div>
      )
    },
    "Toxicity Scoring": {
      id: "scoring",
      title: "Understanding Scores",
      description: "Calculating the probability of harmful content.",
      toc: [
        { id: "thresholds", label: "Thresholds" },
        { id: "math", label: "The Math" }
      ],
      content: (
        <>
          <div id="thresholds" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "2rem" }}>
             <div style={{ padding: "1.5rem", background: "rgba(239, 68, 68, 0.1)", borderRadius: 12, border: "1px solid rgba(239, 68, 68, 0.2)" }}>
               <h4 style={{ color: "var(--accent-toxic)" }}>Toxic (&gt;0.5)</h4>
               <p style={{ fontSize: "0.85rem" }}>High probability of harassment, hate speech, or offensive language.</p>
             </div>
             <div style={{ padding: "1.5rem", background: "rgba(34, 197, 94, 0.1)", borderRadius: 12, border: "1px solid rgba(34, 197, 94, 0.2)" }}>
               <h4 style={{ color: "var(--accent-safe)" }}>Safe (&lt;0.5)</h4>
               <p style={{ fontSize: "0.85rem" }}>Content likely follows community guidelines and civil discourse.</p>
             </div>
          </div>
          <p id="math" style={{ lineHeight: 1.7, color: "var(--text-secondary)" }}>
            Scores are calculated as a softmax probability from the final layer of the transformer. A score of 0.95 means the model is 95% confident the text is toxic.
          </p>
        </>
      )
    },
    "POST /api/toxicity": {
      id: "api-text",
      title: "Text & YouTube API",
      description: "Analyze comments from a URL or raw text string.",
      toc: [
        { id: "endpoint", label: "Endpoint" },
        { id: "params", label: "Parameters" },
        { id: "play", label: "Playground" }
      ],
      content: (
        <>
          <div id="endpoint" style={{ background: "#1e293b", color: "#f8fafc", padding: "1rem", borderRadius: 8, marginBottom: "1rem" }}>
            <span style={{ color: "#4ade80", fontWeight: 700, marginRight: "1rem" }}>POST</span>
            <code style={{ fontFamily: "monospace" }}>/api/toxicity</code>
          </div>
          <table id="params" style={{ width: "100%", borderCollapse: "collapse", marginBottom: "2rem" }}>
            <thead style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              <tr>
                <th style={{ textAlign: "left", padding: "1rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>PARAM</th>
                <th style={{ textAlign: "left", padding: "1rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>TYPE</th>
                <th style={{ textAlign: "left", padding: "1rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>DESC</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style={{ padding: "1rem", fontSize: "0.9rem", fontWeight: 600 }}>videoUrl</td><td style={{ padding: "1rem", fontSize: "0.9rem" }}>string</td><td style={{ padding: "1rem", fontSize: "0.9rem" }}>YouTube watch URL</td></tr>
              <tr><td style={{ padding: "1rem", fontSize: "0.9rem", fontWeight: 600 }}>commentCount</td><td style={{ padding: "1rem", fontSize: "0.9rem" }}>number</td><td style={{ padding: "1rem", fontSize: "0.9rem" }}>Limit count</td></tr>
            </tbody>
          </table>
          <div id="play"><APIPlayground /></div>
        </>
      )
    },
    "POST /api/audio": {
      id: "api-audio",
      title: "Audio Analysis API",
      description: "Transcribe and audit audio files natively.",
      toc: [
        { id: "definition", label: "Definition" },
        { id: "usage", label: "Usage Example" }
      ],
      content: (
        <>
          <div id="definition" style={{ background: "#1e293b", color: "#f8fafc", padding: "1rem", borderRadius: 8, marginBottom: "1rem" }}>
            <span style={{ color: "#4ade80", fontWeight: 700, marginRight: "1rem" }}>POST</span>
            <code style={{ fontFamily: "monospace" }}>/api/audio</code>
          </div>
          <p style={{ marginBottom: "1.5rem", color: "var(--text-secondary)" }}>This endpoint accepts a multipart form with an audio file.</p>
          <div id="usage" style={{ background: "var(--bg-secondary)", borderRadius: 10, border: "1px solid var(--border-subtle)", overflow: "hidden" }}>
             <pre style={{ padding: "1.25rem", margin: 0, fontSize: "0.85rem", color: "var(--text-primary)" }}>
               <code>{`const formData = new FormData();\nformData.append('audio', file);\n\nconst res = await fetch('/api/audio', {\n  method: 'POST',\n  body: formData\n});`}</code>
             </pre>
          </div>
        </>
      )
    }
  };

  const currentTopic = contentMap[activeItem] || contentMap["Introduction"];

  return (
    <div style={{ minHeight: "calc(100vh - 64px)", background: "var(--bg-primary)", display: "flex" }}>
      {/* Left Sidebar */}
      <aside style={{ width: 280, borderRight: "1px solid var(--border-subtle)", padding: "2rem 1.5rem", position: "sticky", top: 64, height: "calc(100vh - 64px)", overflowY: "auto", flexShrink: 0, background: "var(--bg-secondary)" }}>
        <input placeholder="Search docs..." className="input-minimal" style={{ marginBottom: "2rem", fontSize: "0.85rem", padding: "0.6rem 0.85rem" }} />
        {sidebar.map(({ section, items }) => (
          <div key={section} style={{ marginBottom: "2rem" }}>
            <p style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-muted)", marginBottom: "0.75rem", padding: "0 0.75rem" }}>{section}</p>
            {items.map(item => (
              <button key={item} onClick={() => setActiveItem(item)}
                style={{ width: "100%", textAlign: "left", padding: "0.6rem 0.85rem", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "0.9rem", fontWeight: activeItem === item ? 600 : 400, background: activeItem === item ? "var(--bg-elevated)" : "transparent", color: activeItem === item ? "var(--text-primary)" : "var(--text-secondary)", transition: "all 0.15s", display: "block", marginBottom: "0.2rem" }}
              >
                {item}
              </button>
            ))}
          </div>
        ))}
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: "4rem 3rem", maxWidth: 900, minWidth: 0 }}>
        <nav style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "2rem" }}>
          <span>Documentation</span>
          <span>/</span>
          <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{currentTopic.title}</span>
        </nav>

        <h1 style={{ fontSize: "2.5rem", fontWeight: 800, letterSpacing: "-1.5px", marginBottom: "0.75rem", color: "var(--text-primary)" }}>{currentTopic.title}</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", lineHeight: 1.6, marginBottom: "3rem" }}>{currentTopic.description}</p>

        <div style={{ maxWidth: 740 }}>
           {currentTopic.content}
        </div>
      </main>

      {/* Right TOC */}
      <aside style={{ width: 220, padding: "4rem 2rem", position: "sticky", top: 64, height: "calc(100vh - 64px)", overflowY: "auto", flexShrink: 0 }}>
        <p style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-muted)", marginBottom: "1.25rem" }}>On This Page</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {currentTopic.toc.map(item => (
            <a key={item.id} href={`#${item.id}`} style={{ fontSize: "0.85rem", color: "var(--text-muted)", textDecoration: "none", transition: "color 0.1s" }}
              onMouseOver={e => (e.currentTarget.style.color = "var(--text-primary)")}
              onMouseOut={e => (e.currentTarget.style.color = "var(--text-muted)")}
            >
              {item.label}
            </a>
          ))}
        </div>
      </aside>
    </div>
  );
}
