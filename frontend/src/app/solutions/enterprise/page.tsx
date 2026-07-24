'use client';
import FeaturePage, { FPData } from '@/components/shared/FeaturePage';
import { Building2, Shield, Users, Key, FileText, Eye } from 'lucide-react';

const data: FPData = {
  badge: 'Solutions · Enterprise',
  badgeIcon: Building2,
  heroTitle: <>Enterprise CRM<br /><span style={{ color: '#7c3aed' }}>without the enterprise complexity.</span></>,
  heroDesc: 'Pulse CRM delivers SOC 2 compliance, SSO/SAML, unlimited seats, dedicated CSMs, 99.99% SLA, and on-premise deployment options — everything your enterprise needs with zero cruft.',
  overviewTitle: 'Built for regulated, global enterprises',
  overviewDesc: 'From Fortune 500 to government contractors — Pulse CRM scales to thousands of users with enterprise-grade security, compliance, and support.',
  capabilities: [
    { icon: Shield, title: 'SOC 2 Type II Certified', desc: 'Annual third-party audits. Full attestation reports available. Meets GDPR, CCPA, and HIPAA requirements.' },
    { icon: Key, title: 'SSO & SAML 2.0', desc: 'Single sign-on via Okta, Azure AD, Google Workspace, or any SAML 2.0 provider. MFA enforcement supported.' },
    { icon: Users, title: 'Unlimited Users', desc: 'No per-seat pricing limits. Scale from 10 to 10,000 users with flat enterprise pricing and volume discounts.' },
    { icon: FileText, title: 'Dedicated CSM & SLA', desc: 'Every enterprise customer gets a named Customer Success Manager and a 99.99% uptime SLA with financial penalties.' },
    { icon: Eye, title: '7-Year Audit Logs', desc: 'Every action logged with user ID, IP, timestamp, and full payload. Logs retained for 7 years for compliance.' },
    { icon: Building2, title: 'On-Premise Deployment', desc: 'Run Pulse CRM in your own VPC or on-premise data center with Docker containers and Kubernetes orchestration.' },
  ],
  howItWorksTitle: 'Enterprise implementation in 4 weeks',
  steps: [
    { step: '01', title: 'Week 1: SSO & Security Setup', desc: 'Your IT team configures SSO via your SAML identity provider. Pulse engineers validate the integration, test MFA flows, and configure role-based access for all departments.' },
    { step: '02', title: 'Week 2: Data Migration', desc: 'Pulse CSM works with your team to migrate existing CRM data via CSV import or REST API. We map fields, validate data integrity, and deduplicate records.' },
    { step: '03', title: 'Week 3: Customisation & Training', desc: 'Configure custom pipeline stages, email templates, automation workflows, and permission sets for your org structure. Train managers and admins on the system.' },
    { step: '04', title: 'Week 4: Rollout & Go-Live', desc: 'Phased rollout to sales teams with live support. CSM monitors adoption, troubleshoots issues, and ensures smooth transition from legacy CRM.' },
  ],
  statsTitle: 'Enterprise scale, startup speed',
  statsDesc: 'Pulse CRM delivers enterprise functionality without the 6-month implementation timelines of legacy CRMs.',
  stats: [
    { stat: '4 weeks', label: 'Avg implementation', desc: 'From contract signature to full team rollout' },
    { stat: '99.99%', label: 'Uptime SLA', desc: 'Backed by financial penalties for any downtime' },
    { stat: '10,000+', label: 'Max users supported', desc: 'Unlimited seats with flat enterprise pricing' },
    { stat: 'SOC 2', label: 'Type II Certified', desc: 'Annual audits by independent third-party firms' },
  ],
  mockupTitle: 'Enterprise Admin Portal',
  mockup: <div style={{ padding: '80px 40px', background: 'linear-gradient(135deg,#f5f3ff 0%,#fff 100%)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #ede9fe' }}>
    <div style={{ textAlign: 'center' }}>
      <Building2 size={52} color="#7c3aed" style={{ marginBottom: 16 }} />
      <p style={{ fontSize: 16, fontWeight: 600, color: '#64748b' }}>Enterprise Admin Dashboard</p>
      <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 4 }}>SSO config · User provisioning · Audit logs · SLA monitoring</p>
    </div>
  </div>,
  ctaTitle: 'Ready for an enterprise CRM that moves fast?',
  ctaDesc: 'Contact our enterprise team for a custom demo, security review, and pricing tailored to your organization.',
};

export default function EnterprisePage() { return <FeaturePage data={data} />; }
