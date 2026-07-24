'use client';
import React from 'react';
import FeaturePage, { FPData } from '@/components/shared/FeaturePage';
import { Mail, RefreshCw, Link2, FileText, Sparkles, Activity } from 'lucide-react';

const EmailMockup = () => (
  <div style={{ display:'grid', gridTemplateColumns:'1fr 1.8fr', gap:0, borderRadius:14, border:'1px solid #e2e8f0', overflow:'hidden', background:'#fff' }}>
    {/* Inbox list */}
    <div style={{ borderRight:'1px solid #e2e8f0' }}>
      <div style={{ padding:'14px 16px', borderBottom:'1px solid #e2e8f0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <p style={{ fontSize:13, fontWeight:700, color:'#0f172a', margin:0 }}>Inbox</p>
        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
          <span style={{ height:7, width:7, borderRadius:'50%', background:'#22c55e', display:'inline-block' }} />
          <span style={{ fontSize:10, color:'#64748b' }}>Gmail synced</span>
        </div>
      </div>
      {[
        { from:'Alex Rivera', sub:'Re: Proposal v3 approved', time:'2m', unread:true, deal:'Acme Corp' },
        { from:'Bruce Wayne', sub:'Following up on MSA review', time:'18m', unread:true, deal:'Wayne Ent.' },
        { from:'Norman Fisk', sub:'Demo request — enterprise', time:'1h', unread:true, deal:'Oscorp Inc.' },
        { from:'Richard Hendricks', sub:'Contract revision attached', time:'3h', unread:false, deal:'Pied Piper' },
        { from:'Gavin Belson', sub:'We need to talk pricing', time:'5h', unread:false, deal:'Hooli Corp' },
        { from:'Peter Gregory', sub:'Interested in Growth plan', time:'1d', unread:false, deal:'Raviga Cap.' },
      ].map(m=>(
        <div key={m.from} style={{ padding:'12px 16px', borderBottom:'1px solid #f1f5f9', background: m.unread ? '#fafaff' : '#fff', cursor:'pointer' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
            <span style={{ fontSize:12, fontWeight: m.unread ? 700 : 500, color:'#0f172a' }}>{m.from}</span>
            <span style={{ fontSize:10, color:'#94a3b8' }}>{m.time}</span>
          </div>
          <p style={{ fontSize:11, color:'#475569', margin:'0 0 4px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{m.sub}</p>
          <span style={{ fontSize:10, color:'#7c3aed', fontWeight:600, background:'#f5f3ff', padding:'2px 7px', borderRadius:5 }}>↗ {m.deal}</span>
        </div>
      ))}
    </div>
    {/* Thread view */}
    <div>
      <div style={{ padding:'14px 18px', borderBottom:'1px solid #e2e8f0' }}>
        <p style={{ fontSize:14, fontWeight:700, color:'#0f172a', margin:'0 0 2px' }}>Re: Proposal v3 approved</p>
        <p style={{ fontSize:12, color:'#64748b', margin:0 }}>Alex Rivera · alex@acmecorp.com · linked to <span style={{ color:'#7c3aed', fontWeight:600 }}>Acme Corp deal</span></p>
      </div>
      <div style={{ padding:'16px 18px', display:'flex', flexDirection:'column', gap:14 }}>
        {[
          { from:'Alex Rivera', time:'Today 9:04 AM', msg:'Hi Team, the legal team has signed off on the v3 proposal. We can proceed to the final MSA review. Please send over the contract template at your earliest convenience.', self:false },
          { from:'You (via Pulse)', time:'Today 9:22 AM', msg:'Hi Alex, great news! I\'ll have our legal team send over the MSA draft by EOD today. Looking forward to getting this over the line.', self:true },
          { from:'Alex Rivera', time:'Today 9:31 AM', msg:'Perfect. Also, can we schedule a 30-minute call to walk through any final terms? Thursday 3 PM works for us.', self:false },
        ].map((t,i)=>(
          <div key={i} style={{ alignSelf: t.self ? 'flex-end' : 'flex-start', maxWidth:'85%' }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
              <span style={{ fontSize:11, fontWeight:600, color:'#0f172a' }}>{t.from}</span>
              <span style={{ fontSize:10, color:'#94a3b8' }}>{t.time}</span>
            </div>
            <div style={{ padding:'10px 14px', background: t.self ? '#f5f3ff' : '#f8fafc', borderRadius:12, border: t.self ? '1px solid #ede9fe' : '1px solid #e2e8f0' }}>
              <p style={{ fontSize:12, color:'#374151', lineHeight:1.6, margin:0 }}>{t.msg}</p>
            </div>
          </div>
        ))}
        {/* AI reply */}
        <div style={{ padding:'12px 14px', background:'#f5f3ff', borderRadius:12, border:'1px solid #ede9fe' }}>
          <p style={{ fontSize:11, fontWeight:700, color:'#5b21b6', margin:'0 0 6px' }}>✦ AI Reply Suggestion</p>
          <p style={{ fontSize:12, color:'#374151', margin:'0 0 10px', lineHeight:1.6 }}>Hi Alex, Thursday at 3 PM works perfectly. I've sent a calendar invite. Looking forward to finalising the terms!</p>
          <div style={{ display:'flex', gap:8 }}>
            <button style={{ padding:'5px 12px', background:'#7c3aed', color:'#fff', fontSize:11, fontWeight:700, borderRadius:6, border:'none', cursor:'pointer' }}>Send Now</button>
            <button style={{ padding:'5px 12px', background:'transparent', color:'#7c3aed', fontSize:11, fontWeight:600, borderRadius:6, border:'1px solid #ede9fe', cursor:'pointer' }}>Edit First</button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const data: FPData = {
  badge:'Product · Email Intelligence',
  badgeIcon: Mail,
  heroTitle: <>Every email, automatically<br /><span style={{ color:'#7c3aed' }}>linked to the right deal.</span></>,
  heroDesc:'Pulse Email Intelligence syncs your Gmail inbox in real-time, links every thread to the correct contact and deal, tracks opens and clicks, and lets AI draft your replies — all without leaving your CRM.',
  overviewTitle:'Your inbox is your CRM, seamlessly',
  overviewDesc:'Email Intelligence eliminates the gap between your inbox and your CRM. Every sent and received email is automatically logged against the right deal, building a complete communication timeline with zero manual effort.',
  capabilities:[
    { icon:RefreshCw, title:'Real-Time Gmail Sync', desc:'OAuth 2.0 Gmail integration syncs your inbox in the background. Sent and received emails appear in Pulse within seconds — no browser extension or manual copy-paste required.' },
    { icon:Link2, title:'Auto-Link to Contacts & Deals', desc:'Pulse matches incoming emails to existing contacts by email address and automatically links threads to the associated deal. Multi-contact threads are handled correctly.' },
    { icon:Activity, title:'Thread Timeline Logging', desc:'Every email thread becomes a timeline entry on both the contact record and the linked deal card. Managers can see the complete email history of any deal at a glance.' },
    { icon:FileText, title:'Email Templates', desc:'Save and reuse high-performing email templates for proposals, follow-ups, check-ins, and closing sequences. Templates support dynamic variables like {{contact.first_name}} and {{deal.value}}.' },
    { icon:Sparkles, title:'AI Reply Drafting', desc:'Pulse AI reads the current email thread and generates a contextually appropriate reply in your tone. One click sends it; it logs immediately in the deal timeline.' },
    { icon:Mail, title:'Open & Click Tracking', desc:'Every email sent through Pulse includes invisible pixel tracking. See exactly who opened your email, when, and how many times — giving you precise insight into buyer engagement.' },
  ],
  howItWorksTitle:'How Email Intelligence works in Pulse CRM',
  steps:[
    { step:'01', title:'Connect Gmail with OAuth', desc:'Visit Settings → Integrations and click "Connect Gmail." You\'ll be redirected to Google\'s OAuth consent screen. After authorising, Pulse begins syncing your inbox immediately — no browser extensions or forwarding rules needed.' },
    { step:'02', title:'Pulse matches emails to contacts', desc:'As emails arrive, Pulse checks the sender and recipient addresses against your Contacts database. Matched emails are automatically linked to the contact record and any associated deals. Unmatched emails appear in the "Unlinked" inbox for manual assignment.' },
    { step:'03', title:'Every thread appears in the deal timeline', desc:'Linked emails appear as timeline entries on the deal card — displayed alongside stage changes, calls, notes, and tasks. The full conversation history is visible in chronological order without switching to Gmail.' },
    { step:'04', title:'AI drafts context-aware replies', desc:'Click "AI Reply" on any email and GPT-4o reads the full thread and deal context to generate a suggested reply. The draft appears below the thread for review, editing, or one-click sending.' },
    { step:'05', title:'Track engagement before your next call', desc:'Before a follow-up call, check the contact\'s email engagement history: has the proposal been opened? How many times? Was the pricing sheet clicked? This intelligence sharpens every conversation.' },
  ],
  statsTitle:'The impact of Email Intelligence',
  statsDesc:'Teams with Pulse Email Intelligence report higher reply rates, faster response times, and dramatically less time spent on manual CRM data entry.',
  stats:[
    { stat:'100%', label:'Auto-logged emails', desc:'Every inbound and outbound email linked to deals automatically' },
    { stat:'2.3×', label:'Higher reply rate', desc:'AI-drafted emails using deal context outperform generic templates' },
    { stat:'Zero', label:'Manual copy-paste', desc:'Eliminating email-to-CRM manual logging saves 45 min per rep daily' },
    { stat:'< 5s', label:'Sync latency', desc:'New emails appear in Pulse within 5 seconds of Gmail receipt' },
  ],
  mockupTitle:'Email Intelligence — exactly as it appears in Pulse CRM',
  mockup:<EmailMockup />,
  ctaTitle:'Never lose track of a conversation again.',
  ctaDesc:'Connect your Gmail to Pulse CRM and have every email automatically linked to the right deal from the moment you sign up.',
};

export default function EmailIntelligencePage() { return <FeaturePage data={data} />; }
