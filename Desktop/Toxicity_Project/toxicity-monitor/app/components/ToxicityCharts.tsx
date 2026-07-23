"use client";
import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, RadialBarChart, RadialBar, Legend
} from "recharts";

type CommentResult = { text: string; label: string; score: number; isToxic: boolean; };
interface Props { comments: CommentResult[]; }

export default function ToxicityCharts({ comments }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return <div style={{ height: "600px" }} />;

  // --- DATA PREP ---
  
  // 1. Distribution (Histogram)
  const ranges = [
    { name: "Safe", min: 0, max: 0.2, count: 0, color: "#10b981" },
    { name: "Low", min: 0.2, max: 0.4, count: 0, color: "#34d399" },
    { name: "Med", min: 0.4, max: 0.6, count: 0, color: "#fbbf24" },
    { name: "High", min: 0.6, max: 0.8, count: 0, color: "#f87171" },
    { name: "Extreme", min: 0.8, max: 1.0, count: 0, color: "#ef4444" },
  ];
  comments.forEach(c => {
    const r = ranges.find(r => c.score >= r.min && c.score < r.max) || ranges[ranges.length-1];
    r.count++;
  });

  // 2. Trendline
  const trendData = comments.map((c, i) => ({ index: i + 1, score: Math.round(c.score * 100) }));

  // 3. Composition (Donut)
  const toxicCount = comments.filter(c => c.isToxic).length;
  const safeCount = comments.length - toxicCount;
  const pieData = [
    { name: "Safe Environment", value: safeCount, color: "#10b981" },
    { name: "Flagged Content", value: toxicCount, color: "#ef4444" }
  ];

  // 4. Overall Risk (Radial)
  const avgScore = Math.round((comments.reduce((acc, c) => acc + c.score, 0) / comments.length) * 100) || 0;
  const radialData = [{ name: 'Risk', value: avgScore, fill: avgScore > 40 ? '#ef4444' : '#10b981' }];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", padding: "10px", borderRadius: "8px", boxShadow: "var(--shadow-md)" }}>
          <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{`${payload[0].value}${payload[0].name === 'Risk' ? '%' : ''}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "2rem", marginBottom: "3rem" }}>
      
      {/* 1. Content Composition (Donut) */}
      <div className="enterprise-card" style={{ padding: "2rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <h3 style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-muted)", marginBottom: "1rem", alignSelf: "flex-start" }}>Composition Analysis</h3>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value">
                {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Overall Risk Level (Radial) */}
      <div className="enterprise-card" style={{ padding: "2rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <h3 style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-muted)", marginBottom: "1rem", alignSelf: "flex-start" }}>Aggregated Risk Meter</h3>
        <div style={{ width: "100%", height: 300, position: "relative" }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart cx="50%" cy="50%" innerRadius="80%" outerRadius="100%" barSize={20} data={radialData} startAngle={180} endAngle={0}>
              <RadialBar background dataKey="value" cornerRadius={10} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div style={{ position: "absolute", top: "65%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
            <div style={{ fontSize: "2.5rem", fontWeight: "700", color: radialData[0].fill }}>{avgScore}%</div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Overall Risk</div>
          </div>
        </div>
      </div>

      {/* 3. Toxicity Distribution (Bar) */}
      <div className="enterprise-card" style={{ padding: "2rem" }}>
        <h3 style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-muted)", marginBottom: "1.5rem" }}>Toxicity Distribution</h3>
        <div style={{ width: "100%", height: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ranges}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: "var(--bg-elevated)", opacity: 0.4 }} content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {ranges.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Analysis Trendline (Area) */}
      <div className="enterprise-card" style={{ padding: "2rem" }}>
        <h3 style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-muted)", marginBottom: "1.5rem" }}>Toxicity Heat Timeline</h3>
        <div style={{ width: "100%", height: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--text-primary)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--text-primary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis dataKey="index" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} hide />
              <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="score" stroke="var(--text-primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
