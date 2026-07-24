'use client';
import React from 'react';
import FeaturePage, { FPData } from '@/components/shared/FeaturePage';
import { Users, Sparkles, Mail, Target, TrendingUp, Zap } from 'lucide-react';

const RepMockup = () => (
  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
    <div style={{ background:'#f8fafc', borderRadius:14, border:'1px solid #e2e8f0', padding:'18px' }}>
      <p style={{ fontSize:13, fontWeight:700, color:'#0f172a', margin:'0 0 14px' }}>Your Deals Today</p>
      {[
        { name:'Acme Corp', stage:'Negotiation', val:'₹14.2L', score:94, days:28 },
        { name:'Wayne Ent.', stage:'Proposal', val:'₹7.4L', score:73, days:18 },
        { name:'Pied Piper', stage:'Discovery', val:'₹3.1L', score:61, days:8 },
      ].map(d=>(
        <div key={d.name} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'#fff', borderRadius:10, border:'1px solid #e2e8f0', marginBottom:8 }}>
          <div style={{ height:34, width:34, borderRadius:9, background:'#f5f3ff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <span style={{ fontSize:13, fontWeight:900, color:'#7c3aed' }}>{d.score}</span>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:12, fontWeight:700, color:'#0f172a', margin:'0 0 2px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{d.name}</p>
            <p style={{ fontSize:11, color:'#64748b', margin:0 }}>{d.stage} · {d.days}d · {d.val}</p>
          </div>
        </div>
      ))}
    </div>
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ background:'#f5f3ff', borderRadius:14, border:'1px solid #ede9fe', padding:'16px' }}>
        <p style={{ fontSize:12, fontWeight:700, color:'#5b21b6', margin:'0 0 8px' }}>✦ AI Priority for Today</p>
        <p style={{ fontSize:12, color:'#374151', lineHeight:1.6, margin:0 }}>Call <strong>Acme Corp</strong> — no contact in 6 days and deal is at risk. Use the drafted email as a script opener.</p>
        <button style={{ marginTop:8, padding:'5px 12px', background:'#7c3aed', color:'#fff', fontSize:11, fontWeight:700, borderRadius:6, border:'none', cursor:'pointer' }}>Draft Email</button>
      </div>
      <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e2e8f0', padding:'16px' }}>
        <p style={{ fontSize:13, fontWeight:700, color:'#0f172a', margin:'0 0 10px' }}>Tasks Due Today</p>
        {['Send proposal to Wayne Ent.','Follow up on Pied Piper intro call','Update deal value for Oscorp'].map(t=>(
          <div key={t} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 0', borderBottom:'1px solid #f1f5f9' }}>
            <div style={{ height:14, width:14, borderRadius:3, border:'1.5px solid #cbd5e1', flexShrink:0 }} />
            <span style={{ fontSize:11, color:'#475569' }}>{t}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const data: FPData = {
  badge:'Solutions · Sales Representatives',
  badgeIcon: Users,
  heroTitle: <>Close more deals.<br /><span style={{ color:'#7c3aed' }}>In less time. Every day.</span></>,
  heroDesc:'Pulse CRM is built for the rep in the field. AI-drafted emails, AI lead scores, and a crystal-clear pipeline view mean you spend your day selling — not updating spreadsheets.',
  overviewTitle:'Built for how reps actually work',
  overviewDesc:'Every Pulse CRM feature is designed to reduce admin time and sharpen rep focus. You get the right deal, the right email, and the right next step — surfaced automatically.',
  capabilities:[
    { icon:Target, title:'AI-Prioritised Deal List', desc:'Every morning, AI Copilot ranks your open deals by close probability and urgency. You always know which deal to focus on first without reviewing every card manually.' },
    { icon:Sparkles, title:'One-Click Email Drafts', desc:'AI Copilot reads your deal context and drafts a personalised follow-up email in seconds. Review, edit if needed, and send — all from the deal card without opening Gmail.' },
    { icon:Mail, title:'Email Engagement Signals', desc:'See exactly who opened your proposal, when, and how many times. Know before your follow-up call whether the prospect has read your email or ignored it.' },
    { icon:TrendingUp, title:'Deal Timeline at a Glance', desc:'Every interaction — email, call, note, stage change — appears in chronological order on the deal card. Full context in seconds before any call or meeting.' },
    { icon:Zap, title:'One-Tap Activity Logging', desc:'Log a call, add a note, or schedule a follow-up in seconds from any device. Pulse auto-links the activity to the correct deal and contact.' },
    { icon:Users, title:'Live Performance Leaderboard', desc:'See where you rank against your peers in real-time. Closed revenue, win rate, and activity score updated throughout the day to keep momentum high.' },
  ],
  howItWorksTitle:'A typical rep\'s day with Pulse CRM',
  steps:[
    { step:'01', title:'Start the day with AI priorities', desc:'Open Pulse and AI Copilot has already ranked your deals: top 3 to focus on today, at-risk deals that need attention, and leads ready to qualify. No time wasted deciding where to start.' },
    { step:'02', title:'Act on every deal in one place', desc:'For each priority deal, you can view the full email thread, see the last activity, read the AI summary, and send a follow-up email — all from the same screen without tab-switching.' },
    { step:'03', title:'Emails are automatically logged', desc:'Every email you send through Pulse — including AI-drafted ones — is automatically linked to the deal timeline. Your manager can see your activity without you writing a single update.' },
    { step:'04', title:'Move deals forward with one drag', desc:'Close a discovery call? Drag the deal from "Discovery" to "Proposal" on the kanban board. Pulse logs the stage change and triggers any relevant automation (like a proposal template email).' },
    { step:'05', title:'End the day knowing your numbers', desc:'Check your personal revenue dashboard: deals closed this month, win rate vs. last month, quota attainment percentage, and your position on the leaderboard.' },
  ],
  statsTitle:'What reps achieve with Pulse CRM',
  statsDesc:'Reps using Pulse CRM report spending more time selling and less time on CRM admin.',
  stats:[
    { stat:'2.1×', label:'More deals closed', desc:'Reps with AI email drafts and AI priority scoring close twice as many deals per month' },
    { stat:'45min', label:'Admin saved daily', desc:'Automated email logging and AI summaries eliminate manual CRM data entry' },
    { stat:'#1', label:'Rep feature request', desc:'"AI email drafts" — the most-loved Pulse feature among sales reps' },
    { stat:'8.2h', label:'Saved per week', desc:'Total time savings from automation, AI, and one-click logging combined' },
  ],
  mockupTitle:'The rep view — exactly as it appears in Pulse CRM',
  mockup:<RepMockup />,
  ctaTitle:'Give your reps an unfair advantage.',
  ctaDesc:'Start your 14-day free trial. Your reps will have full access to AI Copilot, Visual Pipeline, and Email Intelligence from the first login.',
};

export default function SalesRepsPage() { return <FeaturePage data={data} />; }
