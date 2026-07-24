'use client';
import React from 'react';
import FeaturePage, { FPData } from '@/components/shared/FeaturePage';
import { BarChart2, TrendingUp, Users, Target, Zap, Activity } from 'lucide-react';

const AnalyticsMockup = () => (
  <div>
    {/* KPI row */}
    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
      {[
        { l:'Revenue (Q4)', v:'₹98.4L', d:'+31% vs Q3', c:'#7c3aed', bg:'#f5f3ff' },
        { l:'Closed Deals', v:'57', d:'+18 vs Q3', c:'#059669', bg:'#f0fdf4' },
        { l:'Win Rate', v:'64%', d:'+8pp vs Q3', c:'#2563eb', bg:'#eff6ff' },
        { l:'Avg Deal Size', v:'₹1.72L', d:'+12% vs Q3', c:'#d97706', bg:'#fffbeb' },
      ].map(s=>(
        <div key={s.l} style={{ padding:'16px 18px', background:s.bg, borderRadius:12, border:`1px solid ${s.c}20` }}>
          <p style={{ fontSize:11, color:'#64748b', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em', margin:'0 0 8px' }}>{s.l}</p>
          <p style={{ fontSize:26, fontWeight:900, color:s.c, margin:'0 0 4px', letterSpacing:'-0.03em' }}>{s.v}</p>
          <p style={{ fontSize:11, fontWeight:700, color:'#22c55e', margin:0 }}>↑ {s.d}</p>
        </div>
      ))}
    </div>
    {/* Charts row */}
    <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:14, marginBottom:14 }}>
      {/* Revenue chart */}
      <div style={{ padding:'18px', background:'#f8fafc', borderRadius:12, border:'1px solid #e2e8f0' }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
          <p style={{ fontSize:13, fontWeight:700, color:'#0f172a', margin:0 }}>Monthly Revenue Trend</p>
          <span style={{ fontSize:11, color:'#64748b' }}>Jan – Dec 2025</span>
        </div>
        <svg viewBox="0 0 400 80" style={{ width:'100%', height:80 }}>
          <defs>
            <linearGradient id="rg1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.18"/>
              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.02"/>
            </linearGradient>
          </defs>
          <path d="M0,70 C30,62 60,55 90,45 C120,35 150,50 180,38 C210,26 240,40 270,28 C300,16 330,20 360,10 C380,5 390,4 400,3 L400,80 L0,80Z" fill="url(#rg1)"/>
          <path d="M0,70 C30,62 60,55 90,45 C120,35 150,50 180,38 C210,26 240,40 270,28 C300,16 330,20 360,10 C380,5 390,4 400,3" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round"/>
          {[[0,70],[90,45],[180,38],[270,28],[360,10],[400,3]].map(([x,y],i)=>(
            <circle key={i} cx={x} cy={y} r="3.5" fill="#7c3aed"/>
          ))}
        </svg>
      </div>
      {/* Funnel */}
      <div style={{ padding:'18px', background:'#f8fafc', borderRadius:12, border:'1px solid #e2e8f0' }}>
        <p style={{ fontSize:13, fontWeight:700, color:'#0f172a', margin:'0 0 12px' }}>Funnel Conversion</p>
        {[
          { stage:'Leads', val:342, pct:100, color:'#7c3aed' },
          { stage:'Qualified', val:198, pct:58, color:'#6d28d9' },
          { stage:'Proposal', val:124, pct:36, color:'#5b21b6' },
          { stage:'Negotiation', val:78, pct:23, color:'#4c1d95' },
          { stage:'Won', val:57, pct:17, color:'#3b0764' },
        ].map(s=>(
          <div key={s.stage} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:7 }}>
            <span style={{ fontSize:10, color:'#64748b', width:72, flexShrink:0 }}>{s.stage}</span>
            <div style={{ flex:1, height:14, background:'#e2e8f0', borderRadius:4, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${s.pct}%`, background:s.color, borderRadius:4, display:'flex', alignItems:'center', justifyContent:'flex-end', paddingRight:4 }}>
                <span style={{ fontSize:9, color:'#fff', fontWeight:700 }}>{s.val}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
    {/* Leaderboard */}
    <div style={{ padding:'18px', background:'#f8fafc', borderRadius:12, border:'1px solid #e2e8f0' }}>
      <p style={{ fontSize:13, fontWeight:700, color:'#0f172a', margin:'0 0 14px' }}>Rep Leaderboard — Q4 2025</p>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10 }}>
        {[
          { rank:'🥇', name:'Alex R.', rev:'₹24.1L', deals:14, win:'71%' },
          { rank:'🥈', name:'Jordan L.', rev:'₹19.8L', deals:11, win:'68%' },
          { rank:'🥉', name:'Sam T.', rev:'₹17.2L', deals:10, win:'62%' },
          { rank:'4', name:'Casey M.', rev:'₹14.5L', deals:8, win:'58%' },
          { rank:'5', name:'Riley K.', rev:'₹12.8L', deals:7, win:'54%' },
        ].map(r=>(
          <div key={r.name} style={{ padding:'12px', background:'#fff', borderRadius:10, border:'1px solid #e2e8f0', textAlign:'center' }}>
            <div style={{ fontSize:18, marginBottom:6 }}>{r.rank}</div>
            <p style={{ fontSize:13, fontWeight:700, color:'#0f172a', margin:'0 0 4px' }}>{r.name}</p>
            <p style={{ fontSize:14, fontWeight:900, color:'#7c3aed', margin:'0 0 2px' }}>{r.rev}</p>
            <p style={{ fontSize:11, color:'#64748b', margin:0 }}>{r.deals} deals · {r.win} WR</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const data: FPData = {
  badge:'Product · Revenue Analytics',
  badgeIcon: BarChart2,
  heroTitle: <>Real-time revenue data,<br /><span style={{ color:'#7c3aed' }}>not last week's exports.</span></>,
  heroDesc:'Pulse CRM Revenue Analytics gives managers and reps live dashboards with pipeline metrics, funnel conversion rates, rep performance leaderboards, and AI-powered forecasting — all auto-updated as deals move.',
  overviewTitle:'Every revenue metric, live and accurate',
  overviewDesc:'Pulse pulls data directly from your live pipeline — no manual exports, no scheduled refreshes. Every chart, table, and forecast reflects the current state of your deals right now.',
  capabilities:[
    { icon:BarChart2, title:'Pipeline Telemetry Dashboard', desc:'See total value, deal count, average age, and conversion rates for every stage of your pipeline. The dashboard auto-refreshes on every deal update.' },
    { icon:TrendingUp, title:'Revenue Forecasting', desc:'Weighted forecast for the current quarter is calculated from deal probability × deal value at each stage, giving managers a realistic, accurate revenue projection.' },
    { icon:Activity, title:'Funnel Conversion Analysis', desc:'Visualise how many leads convert at each stage — Leads → Qualified → Proposal → Negotiation → Won. Identify where deals are dropping off and act.' },
    { icon:Users, title:'Rep Performance Leaderboards', desc:'Rank every sales rep by closed revenue, win rate, deal count, and activity score. Updated in real-time so reps see their own position on the board.' },
    { icon:Target, title:'Activity Heatmaps', desc:'See when your team is most active — calls, emails, notes — mapped by day and hour. Identify peak productivity windows and days with low engagement.' },
    { icon:Zap, title:'Custom Report Builder', desc:'Build saved reports with custom date ranges, rep filters, stage filters, and metric combinations. Export as CSV or schedule weekly email delivery to stakeholders.' },
  ],
  howItWorksTitle:'How Revenue Analytics works in Pulse CRM',
  steps:[
    { step:'01', title:'Data is captured automatically', desc:'Every deal movement, activity log, email, call, and note is captured and stored in the Pulse relational database. There is no manual data entry required to populate analytics — it all happens as your reps work.' },
    { step:'02', title:'Dashboard aggregates live data', desc:'The Analytics dashboard runs SQL aggregations on the live Pulse database via the /api/v1/dashboard endpoint. KPIs like total pipeline value, win rate, and average deal age are computed fresh on every page load.' },
    { step:'03', title:'Forecasts use weighted probability', desc:'Revenue forecasting multiplies each deal\'s current value by the probability weight of its pipeline stage. The sum across all active deals gives an expected revenue figure for the current period.' },
    { step:'04', title:'Leaderboards rank by real output', desc:'Rep leaderboards are generated from the Deals and Activities tables, ranked by closed value, deals won, win rate, and recent activity score. Managers can toggle time periods (this week, month, quarter, year).' },
    { step:'05', title:'Custom reports are saved and shareable', desc:'The report builder lets admins and managers create named report configurations with filters and metrics. Reports are saved to the user\'s account and can be shared with other team members or exported on demand.' },
  ],
  statsTitle:'What Revenue Analytics delivers',
  statsDesc:'Pulse Analytics users report stronger forecast accuracy and faster identification of pipeline issues compared to spreadsheet-based reporting.',
  stats:[
    { stat:'94%', label:'Forecast accuracy', desc:'Weighted probability model predicts quarterly revenue within 6% of actuals' },
    { stat:'< 1s', label:'Dashboard load time', desc:'Live aggregations from the Pulse database returned in under one second' },
    { stat:'40+', label:'API endpoints', desc:'Full REST API access to all analytics data for custom integrations' },
    { stat:'100%', label:'Real-time data', desc:'Every chart updates the moment a deal stage or activity changes' },
  ],
  mockupTitle:'Revenue Analytics dashboard — live in Pulse CRM',
  mockup:<AnalyticsMockup />,
  ctaTitle:'See your revenue clearly for the first time.',
  ctaDesc:'14-day free trial. Full access to dashboards, forecasting, leaderboards, and the custom report builder from day one.',
};

export default function RevenueAnalyticsPage() { return <FeaturePage data={data} />; }
