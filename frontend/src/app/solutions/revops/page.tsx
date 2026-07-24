'use client';
import FeaturePage, { FPData } from '@/components/shared/FeaturePage';
import { Target, Workflow, BarChart2, Code, Users, Shield } from 'lucide-react';

const data: FPData = {
  badge: 'Solutions · RevOps Teams',
  badgeIcon: Target,
  heroTitle: <>The CRM your RevOps<br /><span style={{ color: '#7c3aed' }}>team can actually configure.</span></>,
  heroDesc: 'Pulse CRM gives RevOps teams full control: REST API for integrations, no-code workflow builder, custom permissions, cross-functional reporting, and audit logs — without relying on dev teams or consultants.',
  overviewTitle: 'Built for revenue operations at scale',
  overviewDesc: 'RevOps teams need a CRM that is flexible, auditable, and integratable. Pulse delivers all three with a clean REST API, role-based access, and native integration support.',
  capabilities: [
    { icon: Code, title: '40+ REST API Endpoints', desc: 'Full programmatic access to contacts, deals, companies, leads, activities, and reports. Interactive Swagger UI for testing. Webhooks for real-time event streaming.' },
    { icon: Workflow, title: 'No-Code Automation Builder', desc: 'Build lead routing, email sequences, and webhook triggers without dev tickets. Visual workflow canvas with conditional branching and delay timers.' },
    { icon: Shield, title: 'Granular RBAC', desc: '33 individual permissions across all resources. Create custom roles for RevOps, Sales, Marketing, CS, and Finance with exact access levels per department.' },
    { icon: BarChart2, title: 'Cross-Functional Reporting', desc: 'Build custom reports that span Sales, Marketing, and CS data. Track lead-to-customer conversion, CAC payback, and revenue attribution by source.' },
    { icon: Users, title: 'Multi-Team Management', desc: 'Manage Sales, SDR, and CS teams in one workspace with separate pipelines, dashboards, and leaderboards per function.' },
    { icon: Target, title: 'Full Audit Trail', desc: 'Every config change, permission edit, and workflow update is logged with user ID, timestamp, and full diff. Perfect for SOX and compliance audits.' },
  ],
  howItWorksTitle: 'RevOps implementation workflow',
  steps: [
    { step: '01', title: 'Map your tech stack integrations', desc: 'Use Pulse REST API to connect your existing tools: marketing automation, customer success platforms, data warehouses, and BI tools. Swagger UI makes testing endpoints fast.' },
    { step: '02', title: 'Configure role-based permissions', desc: 'Set up roles for Sales Reps, SDRs, Managers, CS, Marketing, and Finance. Define exactly which resources each role can view, edit, create, or delete.' },
    { step: '03', title: 'Build automation workflows', desc: 'Use the no-code builder to create lead routing (Marketing → SDR → AE), deal handoffs (Sales → CS), and cross-team notifications without dev tickets.' },
    { step: '04', title: 'Create cross-functional dashboards', desc: 'Build custom reports that show Marketing spend → MQLs → SQLs → Closed Won → Revenue — giving your exec team full funnel visibility in one view.' },
    { step: '05', title: 'Monitor with audit logs', desc: 'Track every config change, data edit, and permission update in the audit log. Export logs to your SIEM or compliance tool for centralized monitoring.' },
  ],
  statsTitle: 'Why RevOps teams choose Pulse CRM',
  statsDesc: 'RevOps teams on Pulse CRM report faster integration times, cleaner data flows, and better cross-team visibility.',
  stats: [
    { stat: '40+', label: 'REST API endpoints', desc: 'Full programmatic access to every CRM resource' },
    { stat: '< 1 day', label: 'Avg integration time', desc: 'Connect external tools via REST API or webhooks' },
    { stat: '33', label: 'Granular permissions', desc: 'Fine-grained RBAC for cross-functional team access' },
    { stat: '100%', label: 'Config changes logged', desc: 'Full audit trail for compliance and SOX requirements' },
  ],
  mockupTitle: 'RevOps configuration dashboard',
  mockup: <div style={{ padding: '80px 40px', background: 'linear-gradient(135deg,#f5f3ff 0%,#fff 100%)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #ede9fe' }}>
    <div style={{ textAlign: 'center' }}>
      <Target size={52} color="#7c3aed" style={{ marginBottom: 16 }} />
      <p style={{ fontSize: 16, fontWeight: 600, color: '#64748b' }}>RevOps Control Panel</p>
      <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 4 }}>API keys · Workflow builder · Permissions · Audit logs</p>
    </div>
  </div>,
  ctaTitle: 'Give your RevOps team the tools they need.',
  ctaDesc: 'Start your 14-day free trial. Full REST API, no-code automation, and granular RBAC from day one.',
};

export default function RevOpsPage() { return <FeaturePage data={data} />; }
