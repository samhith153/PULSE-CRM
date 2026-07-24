'use client';
import React from 'react';
import FeaturePage, { FPData } from '@/components/shared/FeaturePage';
import { BarChart2, TrendingUp, Users, Target, Zap, AlertTriangle } from 'lucide-react';

const ManagerMockup = () => (
  <div>
    <p style={{ fontSize:16, fontWeight:800, color:'#0f172a', margin:'0 0 18px' }}>Manager Dashboard — Q4 2025</p>
    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:18 }}>
      {[
        { l:'Team Revenue', v:'₹98.4L', d:'+31%', c:'#7c3aed', bg:'#f5f3ff' },
        { l:'Quota Attainment', v:'92%', d:'On track', c:'#059669', bg:'#f0fdf4' },
        { l:'At-Risk Deals', v:'3', d:'Need action', c:'#dc2626', bg:'#fef2f2' },
        { l:'Pipeline Coverage', v:'3.2×', d:'Healthy', c:'#2563eb', bg:'#eff6ff' },
      ].map(s=>(
        <div key={s.l} style={{ padding:'16px', background:s.bg, borderRadius:12, border:`1px solid ${s.c}20` }}>
          <p style={{ fontSize:11, color:'#64748b', fontWeight:600, margin:'0 0 6px', textTransform:'uppercase', letterSpacing:'0.04em' }}>{s.l}</p>
          <p style={{ fontSize:24, fontWeight:900, color:s.c, margin:'0 0 3px', letterSpacing:'-0.03em' }}>{s.v}</p>
          <p style={{ fontSize:11, fontWeight:700, color:'#22c55e', margin:0 }}>{s.d}</p>
        </div>
      ))}
    </div>
    <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:14 }}>
      <div style={{ background:'#f8fafc', borderRadius:14, border:'1px solid #e2e8f0', padding:'18px' }}>
        <p style={{ fontSize:13, fontWeight:700, color:'#0f172a', margin:'0 0 14px' }}>Rep Performance</p>
        {[
          { name:'Alex Rivera', quota:108, deals:14, color:'#059669' },
          { name:'Jordan Lee', quota:96, deals:11, color:'#059669' },
          { name:'Sam Taylor', quota:82, deals:10, color:'#d97706' },
          { name:'Casey Morgan', quota:74, deals:8, color:'#d97706' },
          { name:'Riley Kim', quota:58, deals:7, color:'#dc2626' },
        ].map(r=>(
          <div key={r.name} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
            <span style={{ fontSize:12, fontWeight:600, color:'#0f172a', width:100, flexShrink:0 }}>{r.name}</span>
            <div style={{ flex:1, height:8, background:'#e2e8f0', borderRadius:4, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${Math.min(r.quota,100)}%`, background:r.color, borderRadius:4 }} />
            </div>
            <span style={{ fontSize:11, fontWeight:700, color:r.color, width:40, textAlign:'right', flexShrink:0 }}>{r.quota}%</span>
            <span style={{ fontSize:11, color:'#94a3b8', width:20, flexShrink:0 }}>{r.deals}</span>
          </div>
        ))}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <div style={{ background:'#fef2f2', borderRadius:12, border:'1px solid #fecaca', padding:'14px' }}>
          <p style={{ fontSize:12, fontWeight:700, color:'#dc2626', margin:'0 0 10px' }}>⚠ Deals Needing Attention</p>
          {[
            { deal:'Hooli Corp — ₹6.7L', reason:'No activity · 18 days', rep:'Casey M.' },
            { deal:'Initech Ltd — ₹5.1L', reason:'Proposal not viewed · 9 days', rep:'Riley K.' },
            { deal:'Cyberdyne — ₹8.8L', reason:'Decision delayed twice', rep:'Sam T.' },
          ].map(d=>(
            <div key={d.deal} style={{ padding:'8px 10px', background:'#fff', borderRadius:8, border:'1px solid #fecaca', marginBottom:7 }}>
              <p style={{ fontSize:11, fontWeight:700, color:'#0f172a', margin:'0 0 2px' }}>{d.deal}</p>
              <p style={{ fontSize:10, color:'#dc2626', margin:'0 0 2px' }}>{d.reason}</p>
              <p style={{ fontSize:10, color:'#94a3b8', margin:0 }}>Rep: {d.rep}</p>
            </div>
          ))}
        </div>
        <div style={{ background:'#f5f3ff', borderRadius:12, border:'1px solid #ede9fe', padding:'14px' }}>
          <p style={{ fontSize:12, fontWeight:700, color:'#5b21b6', margin:'0 0 6px' }}>✦ AI Manager Insight</p>
          <p style={{ fontSize:12, color:'#374151', lineHeight:1.6, margin:0 }}>Team is on track for Q4 quota. Riley Kim needs pipeline support — only 2 qualified leads. Consider reassigning 1 lead from Alex Rivera.</p>
        </div>
      </div>
    </div>
  </div>
);

const data: FPData = {
  badge: 'Solutions · Sales Managers',
  badgeIcon: BarChart2,
  heroTitle: <>Full pipeline visibility.<br /><span style={{ color: '#7c3aed' }}>Zero blind spots.</span></>,
  heroDesc: 'Pulse CRM gives managers a real-time command centre: rep performance, pipeline health, at-risk deals, and AI-powered coaching insights — all in one dashboard updated the moment anything changes.',
  overviewTitle: 'Every insight a manager needs, live',
  overviewDesc: 'Stop chasing reps for pipeline updates. Pulse automatically surfaces the metrics that matter — quota attainment, deal risk, activity levels, and forecast accuracy — so you can coach effectively and forecast with confidence.',
  capabilities: [
    { icon: TrendingUp, title: 'Real-Time Pipeline Overview', desc: 'See total pipeline value, deals by stage, weighted forecast, and pipeline coverage ratio updated live as reps move deals and log activities.' },
    { icon: Users, title: 'Rep Performance Leaderboards', desc: 'Track every rep\'s quota attainment, deals closed, win rate, and activity score. Identify your top performers and reps who need coaching before it\'s too late.' },
    { icon: AlertTriangle, title: 'At-Risk Deal Alerts', desc: 'AI Copilot automatically flags deals that have gone cold — no contact in 14+ days, proposals unopened, or decision timelines repeatedly pushed. Act before the deal dies.' },
    { icon: BarChart2, title: 'Team Forecast Accuracy', desc: 'Weighted probability forecasting aggregates across your entire team. Compare forecasted vs. actual revenue for each rep to see who\'s most accurate and who over-promises.' },
    { icon: Zap, title: 'Activity Heatmaps', desc: 'See when your team is most active — calls, emails, notes, and meetings mapped by rep, day, and hour. Identify reps who are quiet and may need support or accountability.' },
    { icon: Target, title: 'AI Coaching Recommendations', desc: 'AI Copilot analyses each rep\'s pipeline and activity and generates specific coaching suggestions: which deals to focus on, which leads to reassign, and which reps are at risk of missing quota.' },
  ],
  howItWorksTitle: 'A manager\'s day with Pulse CRM',
  steps: [
    { step: '01', title: 'Morning pipeline review in 3 minutes', desc: 'Open the Manager Dashboard and see your team\'s full pipeline at a glance: total value, deals by stage, quota attainment per rep, and any at-risk flags from overnight AI analysis. No meetings required.' },
    { step: '02', title: 'Coach on facts, not feelings', desc: 'Click any rep to drill into their pipeline: every deal, every activity log, every email opened. You have the same information the rep has — so coaching conversations are grounded in data, not anecdote.' },
    { step: '03', title: 'Act on at-risk alerts immediately', desc: 'When the AI flags a deal as at-risk, you see the reason (no contact, proposal ignored, timeline slip) and the rep who owns it. Send a coaching note, reassign the deal, or draft an intervention email in one click.' },
    { step: '04', title: 'Forecast the quarter with confidence', desc: 'The weighted forecast model aggregates every deal\'s value × probability across your team. You can see best case, worst case, and commit forecast numbers for the current quarter at any time.' },
    { step: '05', title: 'Report up in seconds', desc: 'Export a one-page pipeline summary, rep performance breakdown, or quarterly forecast to PDF or CSV for your VP or board meeting. Reports are generated from live data — no manual slide preparation.' },
  ],
  statsTitle: 'What managers achieve with Pulse CRM',
  statsDesc: 'Sales managers using Pulse CRM report better forecast accuracy, more targeted coaching, and stronger team quota attainment.',
  stats: [
    { stat: '34%', label: 'Higher quota attainment', desc: 'Teams managed via Pulse hit quota more often vs. manager-less CRM usage' },
    { stat: '94%', label: 'Forecast accuracy', desc: 'Weighted probability model predicts quarterly revenue within 6% of actuals' },
    { stat: '3min', label: 'Daily pipeline review', desc: 'Full team pipeline status visible in under 3 minutes each morning' },
    { stat: '100%', label: 'Deal visibility', desc: 'Every deal, email, and activity across all reps visible in real time' },
  ],
  mockupTitle: 'Manager Dashboard — live in Pulse CRM',
  mockup: <ManagerMockup />,
  ctaTitle: 'Run a pipeline review in 3 minutes.',
  ctaDesc: 'Start your 14-day free trial. Full Manager Dashboard, rep leaderboards, at-risk alerts, and AI coaching insights from day one.',
};

export default function SalesManagersPage() { return <FeaturePage data={data} />; }
