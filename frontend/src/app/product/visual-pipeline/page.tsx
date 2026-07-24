'use client';
import React from 'react';
import FeaturePage, { FPData } from '@/components/shared/FeaturePage';
import { TrendingUp, Target, BarChart2, Users, Zap, CheckCircle, ArrowRight, Activity, Sparkles } from 'lucide-react';

/* ── live dashboard mockup ── */
const PipelineMockup = () => (
  <div>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
      <div>
        <p style={{ fontSize:18, fontWeight:800, color:'#0f172a', margin:0 }}>Deal Pipeline — Q4 2025</p>
        <p style={{ fontSize:13, color:'#64748b', margin:'4px 0 0' }}>5 stages · 128 active deals · ₹48.2L total value</p>
      </div>
      <div style={{ display:'flex', gap:8 }}>
        {['All Reps','This Quarter'].map(l=>(
          <span key={l} style={{ padding:'6px 14px', background:'#f1f5f9', borderRadius:8, fontSize:12, fontWeight:600, color:'#475569', cursor:'pointer' }}>{l}</span>
        ))}
      </div>
    </div>
    <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12 }}>
      {[
        { stage:'New', color:'#7c3aed', bg:'#f5f3ff', border:'#ede9fe', deals:[
          { name:'Acme Corp', val:'₹3.2L', days:2, prob:20 },
          { name:'Initech Ltd', val:'₹1.8L', days:4, prob:15 },
          { name:'Stark Ind.', val:'₹5.1L', days:1, prob:25 },
        ]},
        { stage:'Discovery', color:'#2563eb', bg:'#eff6ff', border:'#dbeafe', deals:[
          { name:'Wayne Ent.', val:'₹7.4L', days:8, prob:40 },
          { name:'Umbrella Co.', val:'₹2.9L', days:12, prob:35 },
        ]},
        { stage:'Proposal', color:'#0891b2', bg:'#ecfeff', border:'#cffafe', deals:[
          { name:'Oscorp Inc.', val:'₹9.0L', days:18, prob:60 },
          { name:'Pied Piper', val:'₹4.3L', days:21, prob:55 },
          { name:'Hooli Corp', val:'₹6.7L', days:14, prob:65 },
        ]},
        { stage:'Negotiation', color:'#d97706', bg:'#fffbeb', border:'#fde68a', deals:[
          { name:'Weyland Co.', val:'₹14.2L', days:28, prob:80 },
          { name:'Cyberdyne', val:'₹8.8L', days:31, prob:75 },
        ]},
        { stage:'Closed Won', color:'#059669', bg:'#f0fdf4', border:'#bbf7d0', deals:[
          { name:'Soylent Corp', val:'₹11.0L', days:45, prob:100 },
          { name:'Rekall Inc.', val:'₹6.5L', days:38, prob:100 },
        ]},
      ].map(col=>(
        <div key={col.stage} style={{ minHeight:300 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 12px', background:col.bg, borderRadius:10, border:`1px solid ${col.border}`, marginBottom:8 }}>
            <span style={{ fontSize:11, fontWeight:700, color:col.color, textTransform:'uppercase', letterSpacing:'0.05em' }}>{col.stage}</span>
            <span style={{ fontSize:11, fontWeight:700, color:col.color, background:'#fff', padding:'2px 7px', borderRadius:20, border:`1px solid ${col.border}` }}>{col.deals.length}</span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
            {col.deals.map(d=>(
              <div key={d.name} style={{ padding:'10px 12px', background:'#fff', borderRadius:10, border:'1px solid #e2e8f0', cursor:'pointer', transition:'box-shadow .15s' }}>
                <p style={{ fontSize:12, fontWeight:700, color:'#0f172a', margin:'0 0 4px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{d.name}</p>
                <p style={{ fontSize:13, fontWeight:800, color:col.color, margin:'0 0 6px' }}>{d.val}</p>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:10, color:'#94a3b8' }}>{d.days}d</span>
                  <div style={{ flex:1, height:3, background:'#f1f5f9', borderRadius:2, margin:'0 8px', overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${d.prob}%`, background:col.color, borderRadius:2, transition:'width .4s' }} />
                  </div>
                  <span style={{ fontSize:10, fontWeight:700, color:col.color }}>{d.prob}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginTop:24, paddingTop:24, borderTop:'1px solid #f1f5f9' }}>
      {[{l:'Total Pipeline',v:'₹48.2L',c:'#7c3aed'},{l:'Avg Deal Age',v:'18 days',c:'#2563eb'},{l:'Win Rate',v:'64%',c:'#059669'},{l:'Forecast (Q4)',v:'₹31.5L',c:'#d97706'}].map(s=>(
        <div key={s.l} style={{ textAlign:'center', padding:'12px', background:'#f8fafc', borderRadius:10 }}>
          <div style={{ fontSize:22, fontWeight:900, color:s.c }}>{s.v}</div>
          <div style={{ fontSize:11, color:'#64748b', fontWeight:600, marginTop:3 }}>{s.l}</div>
        </div>
      ))}
    </div>
  </div>
);

const data: FPData = {
  badge:'Product · Visual Pipeline',
  badgeIcon: TrendingUp,
  heroTitle: <>The deal pipeline your<br /><span style={{ color:'#7c3aed' }}>team will actually use.</span></>,
  heroDesc:'Manage every deal from first contact to closed-won on a real-time kanban board built on a finite state machine. Stage transitions are validated, every move is logged, and forecasts update automatically.',
  overviewTitle:'Every deal, every stage, at a glance',
  overviewDesc:'Pulse CRM Visual Pipeline gives your team a shared, real-time view of revenue. Drag deals between stages, see probability scores, and spot bottlenecks before they cost you quota.',
  capabilities:[
    { icon:TrendingUp, title:'Drag-and-Drop Kanban Board', desc:'Move deals between New → Discovery → Proposal → Negotiation → Closed Won with a single drag. Every update is saved in real-time and synced across your team.' },
    { icon:Target, title:'FSM-Validated Stage Transitions', desc:'Pulse\'s finite state machine architecture ensures deals can only move to valid next stages — no skipping ahead, no invalid states that break your process.' },
    { icon:BarChart2, title:'Deal Probability & Weighting', desc:'Each stage carries a configurable probability weight. Pipeline value is automatically computed using weighted sums so your forecast is always accurate.' },
    { icon:Zap, title:'Age Tracking & Stale Deal Alerts', desc:'Every deal shows how many days it has spent in its current stage. AI Copilot flags deals that have sat too long and recommends action.' },
    { icon:Users, title:'Rep Assignment & Ownership', desc:'Assign deals to specific sales reps with one click. Ownership is tracked end-to-end, enabling rep-level pipeline metrics and leaderboards.' },
    { icon:Activity, title:'Full Activity Timeline', desc:'Every stage change, note, email, call, and task is logged in the deal\'s activity timeline so your team always has full context at a glance.' },
  ],
  howItWorksTitle:'How Visual Pipeline works in Pulse CRM',
  steps:[
    { step:'01', title:'Leads qualify into deals', desc:'When a lead moves to "Qualified" status in the Leads module, Pulse automatically creates a linked Deal record with contact info, company, expected value, and close date pre-filled. No double data entry.' },
    { step:'02', title:'Reps work the board', desc:'Sales reps drag deal cards across the kanban columns. Each move triggers the FSM validator, logs a timeline entry, and — if configured — fires an automation (e.g., send proposal email template or create follow-up task).' },
    { step:'03', title:'AI Copilot surfaces insights', desc:'As deals age or engagement drops, the AI Copilot generates real-time risk scores. Deals flagged as "at risk" appear with a warning indicator so managers can intervene before a deal goes cold.' },
    { step:'04', title:'Managers track and forecast', desc:'The Pipeline Overview dashboard shows total value by stage, conversion rates, average deal age, and a weighted revenue forecast for the current quarter — updated every time a deal moves.' },
    { step:'05', title:'Closed Won or Lost with context', desc:'Closing a deal as "Won" adds its value to the revenue dashboard and triggers a win notification. "Lost" deals prompt for a reason code (Price / Competitor / No Decision / etc.) for win-loss analysis.' },
  ],
  statsTitle:'Real results from Pulse Pipeline users',
  statsDesc:'Teams using Pulse Visual Pipeline report dramatically faster deal velocity and better forecast accuracy compared to spreadsheet-based tracking.',
  stats:[
    { stat:'3.4×', label:'Faster deal velocity', desc:'Compared to manual spreadsheet-based CRM workflows' },
    { stat:'68%', label:'Less admin time', desc:'Automated stage logging saves 8.2 hours per rep per week' },
    { stat:'94%', label:'Forecast accuracy', desc:'Weighted probability scoring predicts Q4 revenue within 6%' },
    { stat:'128', label:'Avg active deals', desc:'Managed simultaneously per team across all pipeline stages' },
  ],
  mockupTitle:'Live deal pipeline — exactly as it appears in Pulse CRM',
  mockup:<PipelineMockup />,
  ctaTitle:'Start closing deals faster today.',
  ctaDesc:'Try Pulse CRM free for 14 days. Full access to Visual Pipeline, AI Copilot, and every other module. No credit card required.',
};

export default function VisualPipelinePage() {
  return <FeaturePage data={data} />;
}
