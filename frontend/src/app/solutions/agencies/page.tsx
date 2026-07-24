'use client';
import FeaturePage, { FPData } from '@/components/shared/FeaturePage';
import { Briefcase, Users, BarChart2, FileText, Eye, Zap } from 'lucide-react';

const data: FPData = {
  badge: 'Solutions · Agencies & Consultancies',
  badgeIcon: Briefcase,
  heroTitle: <>Manage multiple clients<br /><span style={{ color: '#7c3aed' }}>in one workspace.</span></>,
  heroDesc: 'Pulse CRM for agencies lets you run separate pipelines for each client, generate per-client reports, and optionally white-label the platform — all from a single account with unified billing.',
  overviewTitle: 'One CRM for all your clients',
  overviewDesc: 'Stop juggling spreadsheets and disconnected tools. Pulse gives agencies a single workspace to manage leads, deals, and pipelines across every client account.',
  capabilities: [
    { icon: Users, title: 'Multi-Client Workspace', desc: 'Create separate pipeline views for each client. Filter deals, contacts, and reports by client tag so teams only see their assigned accounts.' },
    { icon: BarChart2, title: 'Per-Client Reporting', desc: 'Generate revenue reports, pipeline summaries, and activity logs filtered by client. Export to PDF or CSV for monthly client check-ins.' },
    { icon: FileText, title: 'White-Label Option', desc: 'Enterprise plan includes white-labeling: replace Pulse branding with your agency logo, colors, and domain (e.g., crm.youragency.com).' },
    { icon: Eye, title: 'Client-Specific Permissions', desc: 'Grant read-only access to specific clients so they can view their pipeline without seeing other clients\' data or your internal deals.' },
    { icon: Zap, title: 'Unified Billing', desc: 'One subscription covers all your clients. No per-client seat fees, no surprise charges as you add new client accounts to the workspace.' },
    { icon: Briefcase, title: 'Agency Templates', desc: 'Pre-built pipeline templates for common agency use cases: lead gen agencies, consultancies, recruitment firms, and fractional sales teams.' },
  ],
  howItWorksTitle: 'How agencies use Pulse CRM',
  steps: [
    { step: '01', title: 'Create client-specific tags', desc: 'Tag every deal, contact, and company with a client identifier (e.g., "Client: Acme Corp"). Tags are filterable throughout Pulse so you can isolate each client\'s data.' },
    { step: '02', title: 'Assign teams per client', desc: 'Assign specific sales reps or consultants to each client account. Reps see only their assigned clients by default, keeping focus sharp and data secure.' },
    { step: '03', title: 'Run client pipelines independently', desc: 'Each client can have a customised pipeline: different stage names, different deal values, different automation workflows tailored to that client\'s process.' },
    { step: '04', title: 'Generate monthly client reports', desc: 'At month-end, filter the Reports dashboard by client tag, export a pipeline summary PDF, and send it to your client stakeholder as a deliverable.' },
    { step: '05', title: 'Scale with unified billing', desc: 'Add new clients without per-account fees. Your Pulse subscription covers all clients under one roof — making agency margins predictable and profitable.' },
  ],
  statsTitle: 'Why agencies choose Pulse CRM',
  statsDesc: 'Agencies managing multiple client accounts report cleaner data, faster reporting, and better client satisfaction with Pulse CRM.',
  stats: [
    { stat: '5×', label: 'More clients managed', desc: 'Per account manager vs. spreadsheet-based pipeline tracking' },
    { stat: '90%', label: 'Reporting time saved', desc: 'Auto-generated client reports replace manual slide decks' },
    { stat: 'One', label: 'Unified subscription', desc: 'No per-client seat fees or hidden account charges' },
    { stat: '100%', label: 'Data isolation', desc: 'Clients see only their data with role-based access control' },
  ],
  mockupTitle: 'Agency multi-client dashboard',
  mockup: <div style={{ padding: '80px 40px', background: 'linear-gradient(135deg,#f5f3ff 0%,#fff 100%)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #ede9fe' }}>
    <div style={{ textAlign: 'center' }}>
      <Briefcase size={52} color="#7c3aed" style={{ marginBottom: 16 }} />
      <p style={{ fontSize: 16, fontWeight: 600, color: '#64748b' }}>Client-Specific Pipeline Views</p>
      <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 4 }}>Tag-based filtering · Per-client reports · White-label ready</p>
    </div>
  </div>,
  ctaTitle: 'Manage all your clients in one place.',
  ctaDesc: 'Start your 14-day free trial. Set up client-specific pipelines, reporting, and permissions from day one.',
};

export default function AgenciesPage() { return <FeaturePage data={data} />; }
