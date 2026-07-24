'use client';
import React from 'react';
import FeaturePage, { FPData } from '@/components/shared/FeaturePage';
import { Workflow, Zap, Mail, Bell, Users, Target, ArrowRight } from 'lucide-react';

const AutomationMockup = () => (
  <div>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
      <p style={{ fontSize:16, fontWeight:800, color:'#0f172a', margin:0 }}>Automation Builder</p>
      <button style={{ padding:'8px 18px', background:'#7c3aed', color:'#fff', fontSize:12, fontWeight:700, borderRadius:8, border:'none', cursor:'pointer' }}>+ New Workflow</button>
    </div>
    {/* Active flows */}
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:20 }}>
      {[
        { name:'New Lead Auto-Assign', trigger:'Lead Created', actions:['Score Lead (AI)','Assign to Rep','Send Welcome Email'], status:'Active', runs:842, color:'#7c3aed', bg:'#f5f3ff' },
        { name:'Proposal Follow-Up', trigger:'Deal stage → Proposal', actions:['Wait 3 days','Check email opened','Send follow-up if not opened'], status:'Active', runs:314, color:'#2563eb', bg:'#eff6ff' },
        { name:'Deal Won Celebration', trigger:'Deal Closed Won', actions:['Notify Slack channel','Update revenue dashboard','Create onboarding task'], status:'Active', runs:57, color:'#059669', bg:'#f0fdf4' },
        { name:'At-Risk Deal Alert', trigger:'Deal age > 21 days', actions:['Flag deal as at-risk','Notify manager','AI drafts re-engagement email'], status:'Active', runs:128, color:'#d97706', bg:'#fffbeb' },
      ].map(flow=>(
        <div key={flow.name} style={{ padding:'16px', background:'#fff', borderRadius:12, border:'1px solid #e2e8f0' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
            <div>
              <p style={{ fontSize:13, fontWeight:700, color:'#0f172a', margin:'0 0 3px' }}>{flow.name}</p>
              <span style={{ fontSize:11, color:'#64748b' }}>Trigger: {flow.trigger}</span>
            </div>
            <span style={{ fontSize:10, fontWeight:700, color:flow.color, background:flow.bg, padding:'3px 9px', borderRadius:20, border:`1px solid ${flow.color}30`, flexShrink:0 }}>{flow.status}</span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:12 }}>
            {flow.actions.map((a,i)=>(
              <div key={i} style={{ display:'flex', alignItems:'center', gap:7 }}>
                {i > 0 && <div style={{ width:1, height:8, background:'#e2e8f0', marginLeft:7, marginRight:6 }} />}
                <div style={{ height:22, width:22, borderRadius:6, background:flow.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <ArrowRight size={10} color={flow.color} />
                </div>
                <span style={{ fontSize:11, color:'#475569', fontWeight:500 }}>{a}</span>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', paddingTop:10, borderTop:'1px solid #f1f5f9' }}>
            <span style={{ fontSize:11, color:'#64748b' }}>{flow.runs} runs total</span>
            <button style={{ fontSize:11, color:flow.color, fontWeight:600, background:'none', border:'none', cursor:'pointer' }}>View Logs →</button>
          </div>
        </div>
      ))}
    </div>
    {/* Visual workflow builder */}
    <div style={{ padding:'20px', background:'#f8fafc', borderRadius:12, border:'2px dashed #e2e8f0' }}>
      <p style={{ fontSize:12, fontWeight:700, color:'#64748b', textAlign:'center', margin:'0 0 16px', textTransform:'uppercase', letterSpacing:'0.05em' }}>Workflow Builder — Drag & Drop</p>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:0, flexWrap:'wrap' }}>
        {[
          { label:'Lead Created', icon:Target, color:'#7c3aed', bg:'#f5f3ff' },
          { label:'→', icon:null, color:'#cbd5e1', bg:'transparent' },
          { label:'AI Score Lead', icon:Zap, color:'#2563eb', bg:'#eff6ff' },
          { label:'→', icon:null, color:'#cbd5e1', bg:'transparent' },
          { label:'Route to Rep', icon:Users, color:'#059669', bg:'#f0fdf4' },
          { label:'→', icon:null, color:'#cbd5e1', bg:'transparent' },
          { label:'Send Email', icon:Mail, color:'#d97706', bg:'#fffbeb' },
          { label:'→', icon:null, color:'#cbd5e1', bg:'transparent' },
          { label:'Notify Team', icon:Bell, color:'#7c3aed', bg:'#f5f3ff' },
        ].map((node,i)=>(
          node.icon
            ? <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5, padding:'10px 14px', background:node.bg, borderRadius:10, border:`1px solid ${node.color}30` }}>
                <node.icon size={16} color={node.color} />
                <span style={{ fontSize:10, fontWeight:700, color:node.color, whiteSpace:'nowrap' }}>{node.label}</span>
              </div>
            : <span key={i} style={{ fontSize:18, color:node.color, padding:'0 4px' }}>{node.label}</span>
        ))}
      </div>
    </div>
  </div>
);

const data: FPData = {
  badge:'Product · Automation',
  badgeIcon: Workflow,
  heroTitle: <>Your sales process,<br /><span style={{ color:'#7c3aed' }}>running on autopilot.</span></>,
  heroDesc:'Pulse Automation lets you build powerful multi-step workflows without writing a single line of code. Route leads, trigger email sequences, notify your team, and fire webhooks — all based on real CRM events.',
  overviewTitle:'Build workflows in minutes, not days',
  overviewDesc:'Pulse Automation connects triggers (events in your CRM) to actions (things Pulse does automatically). Any event — a new lead, a stage change, a deal going cold — can kick off a sequence of automated actions.',
  capabilities:[
    { icon:Workflow, title:'Visual Workflow Builder', desc:'Build automation flows with a drag-and-drop canvas. Connect triggers to conditions to actions with no code required. Each node is a visual block you can reorder and test.' },
    { icon:Target, title:'CRM Event Triggers', desc:'Workflows can be triggered by any CRM event: lead created, deal stage changed, contact updated, email received, deal age exceeded, task overdue, or a custom webhook call.' },
    { icon:Users, title:'Intelligent Lead Routing', desc:'Automatically assign new leads to the right rep based on rules: territory, company size, industry, lead source, or round-robin distribution with load balancing across your team.' },
    { icon:Mail, title:'Automated Email Sequences', desc:'Enrol contacts into multi-step email sequences. Each message is sent at a configured interval, paused if the contact replies, and personalised using deal and contact field variables.' },
    { icon:Bell, title:'Notifications & Webhooks', desc:'Send Slack notifications, push real-time webhooks to external systems, or trigger in-app alerts to specific reps or managers when defined conditions are met.' },
    { icon:Zap, title:'Conditional Branching', desc:'Add if/else conditions to your workflows. For example: if the proposal email was opened → wait 1 day; if not opened after 3 days → send a follow-up. Full logic tree support.' },
  ],
  howItWorksTitle:'How Automation works in Pulse CRM',
  steps:[
    { step:'01', title:'Choose a trigger event', desc:'Every workflow starts with a trigger. Choose from CRM events: "Lead Created", "Deal Moved to Proposal Stage", "Deal Age Exceeds 14 Days", "Email Not Opened After 72 Hours", or a custom inbound webhook from an external tool.' },
    { step:'02', title:'Add conditions and filters', desc:'Add optional conditions to narrow when the workflow fires: "Only for leads with score > 60", "Only for deals over ₹5L", "Only if rep has fewer than 10 open deals". Conditions prevent workflows from misfiring.' },
    { step:'03', title:'Define the action sequence', desc:'Chain together actions in order: Score Lead → Assign to Rep → Send Welcome Email → Wait 2 Days → Send Follow-Up → Create Task. Each action executes in sequence; delays are handled automatically.' },
    { step:'04', title:'Activate and monitor', desc:'Toggle your workflow to "Active" and Pulse starts processing events immediately. The Automation Logs panel shows every run with timestamp, trigger data, action results, and any errors.' },
    { step:'05', title:'Iterate and optimise', desc:'Review run history and A/B test different sequences. See which email templates get the highest open rates, which routing rules produce the best win rates, and refine your workflows over time.' },
  ],
  statsTitle:'What Automation delivers for your team',
  statsDesc:'Pulse Automation users eliminate hours of manual work per week and ensure no lead or deal ever falls through the cracks.',
  stats:[
    { stat:'< 60s', label:'Lead to first touch', desc:'From form submit to rep assignment and welcome email in under 60 seconds' },
    { stat:'Zero', label:'Leads dropped', desc:'Every new lead is automatically scored, assigned, and followed up with' },
    { stat:'8.2h', label:'Saved per rep weekly', desc:'Automated lead routing, email sequences, and task creation' },
    { stat:'3.4×', label:'Faster pipeline velocity', desc:'Automated follow-ups prevent deals from stalling between stages' },
  ],
  mockupTitle:'Automation Builder — live in Pulse CRM',
  mockup:<AutomationMockup />,
  ctaTitle:'Put your sales process on autopilot.',
  ctaDesc:'Start your free 14-day trial and build your first automation workflow in minutes. No code. No consultants.',
};

export default function AutomationPage() { return <FeaturePage data={data} />; }
