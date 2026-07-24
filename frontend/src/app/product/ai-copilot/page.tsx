'use client';
import React from 'react';
import FeaturePage, { FPData } from '@/components/shared/FeaturePage';
import { Sparkles, Target, Mail, AlertTriangle, TrendingUp, Brain, Zap, BarChart2 } from 'lucide-react';

const AIMockup = () => (
  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
    {/* Chat panel */}
    <div style={{ background:'#f8fafc', borderRadius:14, border:'1px solid #e2e8f0', overflow:'hidden' }}>
      <div style={{ padding:'14px 18px', borderBottom:'1px solid #e2e8f0', background:'#fff', display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ height:32, width:32, borderRadius:9, background:'#7c3aed', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Sparkles size={15} color="#fff" />
        </div>
        <div>
          <p style={{ fontSize:13, fontWeight:700, color:'#0f172a', margin:0 }}>Pulse AI Copilot</p>
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            <span style={{ height:6, width:6, borderRadius:'50%', background:'#22c55e', display:'inline-block' }} />
            <span style={{ fontSize:11, color:'#64748b' }}>GPT-4o · Always on</span>
          </div>
        </div>
      </div>
      <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:10 }}>
        <div style={{ padding:'10px 14px', background:'#fff', borderRadius:10, border:'1px solid #e2e8f0', alignSelf:'flex-end', maxWidth:'85%' }}>
          <p style={{ fontSize:12, color:'#475569', margin:0 }}>Summarise the Acme Corp deal and tell me next steps.</p>
        </div>
        <div style={{ padding:'12px 14px', background:'#f5f3ff', borderRadius:10, border:'1px solid #ede9fe', maxWidth:'90%' }}>
          <p style={{ fontSize:11, fontWeight:700, color:'#5b21b6', margin:'0 0 6px' }}>✦ AI Response</p>
          <p style={{ fontSize:12, color:'#374151', lineHeight:1.6, margin:0 }}><strong>Acme Corp (₹14.2L)</strong> is at <span style={{ color:'#d97706', fontWeight:700 }}>Negotiation</span> stage — 28 days in, 80% probability. Legal reviewed the MSA last Thursday. No contact in 6 days.<br /><br /><strong>Recommended next step:</strong> Schedule a finalisation call before Thursday. Delay risk is high.</p>
        </div>
        <div style={{ padding:'10px 14px', background:'#fff', borderRadius:10, border:'1px solid #e2e8f0', alignSelf:'flex-end', maxWidth:'85%' }}>
          <p style={{ fontSize:12, color:'#475569', margin:0 }}>Draft a follow-up email for me.</p>
        </div>
        <div style={{ padding:'12px 14px', background:'#f5f3ff', borderRadius:10, border:'1px solid #ede9fe', maxWidth:'90%' }}>
          <p style={{ fontSize:11, fontWeight:700, color:'#5b21b6', margin:'0 0 6px' }}>✦ Draft Generated</p>
          <p style={{ fontSize:12, color:'#374151', lineHeight:1.6, margin:0 }}>Hi [Contact], I wanted to circle back on the Acme Corp agreement. Our legal team confirmed the revised MSA is ready. I'd love to schedule 30 minutes this week to close this out — does Thursday at 3 PM work for you?</p>
          <button style={{ marginTop:8, padding:'5px 12px', background:'#7c3aed', color:'#fff', fontSize:11, fontWeight:700, borderRadius:6, border:'none', cursor:'pointer' }}>Send Email</button>
        </div>
      </div>
    </div>
    {/* Scores panel */}
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e2e8f0', padding:'18px' }}>
        <p style={{ fontSize:13, fontWeight:700, color:'#0f172a', margin:'0 0 14px' }}>AI Lead Scores — Top Leads</p>
        {[
          { name:'Acme Corp — Alex Rivera', score:94, status:'Hot', color:'#059669', bg:'#f0fdf4' },
          { name:'Oscorp Inc. — Norman Fisk', score:87, status:'Hot', color:'#059669', bg:'#f0fdf4' },
          { name:'Wayne Ent. — Bruce Wayne', score:73, status:'Warm', color:'#d97706', bg:'#fffbeb' },
          { name:'Pied Piper — Richard H.', score:58, status:'Warm', color:'#d97706', bg:'#fffbeb' },
          { name:'Hooli Corp — Gavin B.', score:31, status:'Cold', color:'#64748b', bg:'#f8fafc' },
        ].map(l=>(
          <div key={l.name} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid #f1f5f9' }}>
            <div style={{ height:32, width:32, borderRadius:8, background:l.bg, border:`1px solid ${l.color}30`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <span style={{ fontSize:13, fontWeight:900, color:l.color }}>{l.score}</span>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:12, fontWeight:600, color:'#0f172a', margin:0, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{l.name}</p>
              <div style={{ height:4, background:'#f1f5f9', borderRadius:2, marginTop:4, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${l.score}%`, background:l.color, borderRadius:2 }} />
              </div>
            </div>
            <span style={{ fontSize:10, fontWeight:700, color:l.color, background:l.bg, padding:'2px 8px', borderRadius:20, flexShrink:0 }}>{l.status}</span>
          </div>
        ))}
      </div>
      <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e2e8f0', padding:'18px' }}>
        <p style={{ fontSize:13, fontWeight:700, color:'#0f172a', margin:'0 0 12px' }}>⚠ At-Risk Deals</p>
        {[
          { name:'Initech Ltd', reason:'No contact — 14 days', val:'₹5.1L' },
          { name:'Hooli Corp', reason:'Proposal not opened — 7 days', val:'₹6.7L' },
        ].map(d=>(
          <div key={d.name} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', background:'#fef2f2', borderRadius:10, border:'1px solid #fecaca', marginBottom:8 }}>
            <AlertTriangle size={14} color="#dc2626" />
            <div>
              <p style={{ fontSize:12, fontWeight:700, color:'#0f172a', margin:0 }}>{d.name} · {d.val}</p>
              <p style={{ fontSize:11, color:'#dc2626', margin:0 }}>{d.reason}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const data: FPData = {
  badge:'Product · AI Copilot',
  badgeIcon: Sparkles,
  heroTitle: <>Your smartest sales rep<br /><span style={{ color:'#7c3aed' }}>is built right in.</span></>,
  heroDesc:'Pulse AI Copilot uses GPT-4o to score every lead, summarise every deal, draft personalised emails, and flag at-risk opportunities — all in real time without leaving your CRM.',
  overviewTitle:'Intelligence that works while you sell',
  overviewDesc:'AI Copilot is deeply embedded across every module in Pulse CRM. It reads your deal context, contact history, and activity timeline to surface the right insight at exactly the right moment.',
  capabilities:[
    { icon:Target, title:'Lead Scoring 0–100', desc:'Every lead is automatically scored from 0 to 100 by GPT-4o based on engagement signals, company fit, email activity, and pipeline velocity. No manual scoring rules to maintain.' },
    { icon:Mail, title:'Email Draft Generation', desc:'Paste a deal or contact into the AI Copilot chat and receive a personalised follow-up email draft in seconds — written in your tone, referencing the actual deal context.' },
    { icon:Brain, title:'Deal Summarisation', desc:'Ask Copilot to summarise any deal and receive a concise brief: current stage, last activity, outstanding blockers, and a recommended next action. Perfect for manager handoffs.' },
    { icon:AlertTriangle, title:'At-Risk Deal Detection', desc:'Copilot monitors deal age and engagement patterns. When a deal goes cold — no emails opened, no contact in days — it raises an automatic risk flag on the deal card.' },
    { icon:TrendingUp, title:'Forecast Insights', desc:'Ask Copilot "Which deals will close this quarter?" and receive a ranked list with confidence scores and reasoning based on stage, probability, and rep activity history.' },
    { icon:Zap, title:'Action Recommendations', desc:'For every deal, Copilot suggests the single highest-value next action: schedule a call, send a proposal, loop in a decision maker, or push for sign-off.' },
  ],
  howItWorksTitle:'How AI Copilot works in Pulse CRM',
  steps:[
    { step:'01', title:'Copilot reads your CRM data', desc:'AI Copilot has read access to all deals, contacts, companies, emails, and activity logs relevant to the current user\'s role. It builds context from the full deal timeline — not just the last note.' },
    { step:'02', title:'You ask in plain English', desc:'The Copilot chat accepts plain English questions: "Which leads should I call today?", "Summarise the Weyland deal", "Draft a follow-up for Wayne Enterprises." No special syntax or training required.' },
    { step:'03', title:'GPT-4o generates a grounded response', desc:'Responses are generated by GPT-4o using your live CRM data as context. Every answer references actual deal values, contact names, stage history, and activity — never generic advice.' },
    { step:'04', title:'One-click actions from answers', desc:'Copilot responses include action buttons: "Send Email", "Create Task", "Schedule Meeting", "Move to Next Stage." One click executes the action and logs it in the deal timeline.' },
    { step:'05', title:'Scores and flags update continuously', desc:'Lead scores and risk flags are recalculated whenever new activity occurs — email received, stage changed, note added. Copilot\'s intelligence is always current, not a weekly batch job.' },
  ],
  statsTitle:'What AI Copilot delivers for sales teams',
  statsDesc:'Sales teams with Pulse AI Copilot enabled close more deals with less manual effort and better prediction accuracy.',
  stats:[
    { stat:'98.4%', label:'Lead score accuracy', desc:'AI predictions match actual close outcomes with 98.4% historical accuracy' },
    { stat:'2.1×', label:'More deals closed', desc:'Reps using AI email drafts and next-action suggestions close twice as many deals' },
    { stat:'< 2s', label:'Response latency', desc:'GPT-4o responses with live CRM context returned in under 2 seconds' },
    { stat:'8.2h', label:'Saved per rep weekly', desc:'Automated scoring, summarisation, and email drafts eliminate manual busywork' },
  ],
  mockupTitle:'AI Copilot — exactly as it appears in Pulse CRM',
  mockup:<AIMockup />,
  ctaTitle:'Let AI do the heavy lifting.',
  ctaDesc:'Start your free 14-day trial and experience AI Copilot across deals, leads, emails, and forecasting — no setup required.',
};

export default function AICopilotPage() { return <FeaturePage data={data} />; }
