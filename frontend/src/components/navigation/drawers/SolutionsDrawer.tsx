'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2, Users, Zap, HeartPulse, GraduationCap,
  Factory, Landmark, Home, ShoppingBag, HardHat, Heart,
  BarChart2, Target, Briefcase, Settings,
} from 'lucide-react';
import DrawerSidebar from '../DrawerSidebar';
import DrawerHeader from '../DrawerHeader';
import DrawerFooter from '../DrawerFooter';
import FeatureCard from '../FeatureCard';

const sidebarItems = [
  { id: 'industry', label: 'By Industry', icon: Building2 },
  { id: 'team', label: 'By Team', icon: Users },
  { id: 'size', label: 'By Company Size', icon: BarChart2 },
  { id: 'department', label: 'Departments', icon: Briefcase },
  { id: 'usecase', label: 'Use Cases', icon: Target },
  { id: 'migration', label: 'CRM Migration', icon: Settings },
];

const contentMap: Record<string, { icon: React.ElementType; title: string; desc: string; href: string; color: string }[]> = {
  industry: [
    { icon: Building2, title: 'Enterprise', desc: 'Scalable CRM for large sales orgs with SSO, audit logs, and dedicated support.', href: '/features/contacts', color: '#7c3aed' },
    { icon: Zap, title: 'Startups', desc: 'Fast setup in 2 minutes. Seed data, REST API, and AI scoring out of the box.', href: '/features/contacts', color: '#f59e0b' },
    { icon: HeartPulse, title: 'Healthcare', desc: 'HIPAA-aware data handling with role-scoped access and audit logs.', href: '/features/contacts', color: '#ef4444' },
    { icon: GraduationCap, title: 'Education', desc: 'Manage student leads, enrollment pipelines, and alumni relations.', href: '/features/contacts', color: '#2563eb' },
    { icon: Factory, title: 'Manufacturing', desc: 'B2B deal tracking with long sales cycles and complex account structures.', href: '/features/contacts', color: '#059669' },
    { icon: Landmark, title: 'Finance', desc: 'Compliance-ready CRM with JWT auth, RBAC, and encrypted data at rest.', href: '/features/contacts', color: '#7c3aed' },
    { icon: Home, title: 'Real Estate', desc: 'Track property deals through custom pipeline stages with close date forecasting.', href: '/features/pipeline', color: '#f59e0b' },
    { icon: ShoppingBag, title: 'Retail', desc: 'Customer relationship tracking and campaign-driven lead management.', href: '/features/contacts', color: '#2563eb' },
    { icon: HardHat, title: 'Construction', desc: 'Project-based deal management with company and contact linking.', href: '/features/pipeline', color: '#059669' },
  ],
  team: [
    { icon: Users, title: 'Sales Teams', desc: 'FSM pipelines, leaderboards, AI scoring, and Gmail sync built for closers.', href: '/features/pipeline', color: '#7c3aed' },
    { icon: Target, title: 'Marketing Teams', desc: 'Lead capture, source tracking, and campaign-to-pipeline attribution.', href: '/features/contacts', color: '#2563eb' },
    { icon: BarChart2, title: 'RevOps', desc: 'Full revenue operations suite: forecasting, reports, and RBAC governance.', href: '/features/analytics', color: '#059669' },
    { icon: Briefcase, title: 'Account Managers', desc: 'Account-level views with all contacts, deals, and emails per company.', href: '/features/contacts', color: '#f59e0b' },
    { icon: Settings, title: 'IT & Admins', desc: '33-permission RBAC system, SSO, audit logs, and API access control.', href: '/features/dashboard', color: '#7c3aed' },
    { icon: Building2, title: 'Leadership', desc: 'Executive dashboards with pipeline health, forecasts, and rep rankings.', href: '/features/analytics', color: '#6b7280' },
  ],
  size: [
    { icon: Zap, title: 'Solo & Freelance', desc: '1-person CRM. Free trial, no credit card. Up and running in 2 minutes.', href: '/features/dashboard', color: '#7c3aed' },
    { icon: Users, title: 'Small Teams (2–10)', desc: 'Core pipeline, contacts, leads, and Gmail sync for small fast-moving teams.', href: '/features/contacts', color: '#2563eb' },
    { icon: Building2, title: 'Mid-Market (11–200)', desc: 'AI scoring, analytics, team leaderboards, and automation workflows.', href: '/features/analytics', color: '#059669' },
    { icon: Landmark, title: 'Enterprise (200+)', desc: 'SSO, SAML, audit logs, dedicated CSM, and on-premise deployment option.', href: '/features/dashboard', color: '#f59e0b' },
  ],
  department: [
    { icon: Target, title: 'Sales', desc: 'Leads, pipeline, deals, and AI-assisted closing workflows.', href: '/features/pipeline', color: '#7c3aed' },
    { icon: BarChart2, title: 'Marketing', desc: 'Lead sources, campaign attribution, and email engagement tracking.', href: '/features/analytics', color: '#2563eb' },
    { icon: HeartPulse, title: 'Customer Success', desc: 'Post-sale activity tracking, contact health scores, and renewal forecasts.', href: '/features/contacts', color: '#059669' },
    { icon: Settings, title: 'Operations', desc: 'RBAC governance, workflow automation, and data integrity tools.', href: '/features/dashboard', color: '#f59e0b' },
    { icon: Landmark, title: 'Finance', desc: 'Deal revenue tracking, close date forecasting, and pipeline value reports.', href: '/features/analytics', color: '#7c3aed' },
    { icon: GraduationCap, title: 'HR & Recruiting', desc: 'Candidate pipeline management using FSM deal stages.', href: '/features/pipeline', color: '#6b7280' },
  ],
  usecase: [
    { icon: Target, title: 'Lead Generation', desc: 'Capture, score, and route inbound leads from API, forms, or CSV.', href: '/features/contacts', color: '#7c3aed' },
    { icon: BarChart2, title: 'Sales Forecasting', desc: 'AI-weighted pipeline forecast with historical close rate analysis.', href: '/features/ai-copilot', color: '#2563eb' },
    { icon: Users, title: 'Account Management', desc: 'Full account-level view: contacts, deals, emails, and activities.', href: '/features/contacts', color: '#059669' },
    { icon: Zap, title: 'Pipeline Acceleration', desc: 'AI next-best-action recommendations and stalled deal alerts.', href: '/features/ai-copilot', color: '#f59e0b' },
    { icon: Heart, title: 'Customer Retention', desc: 'Track renewal dates, engagement scores, and churn signals.', href: '/features/analytics', color: '#7c3aed' },
    { icon: Factory, title: 'Partner Management', desc: 'Multi-company deal tracking with shared pipeline views.', href: '/features/pipeline', color: '#6b7280' },
  ],
  migration: [
    { icon: Settings, title: 'Migrate from Salesforce', desc: 'Import contacts, deals, and history via our REST API or CSV migration tool.', href: '/features/contacts', color: '#7c3aed' },
    { icon: Building2, title: 'Migrate from HubSpot', desc: 'Map your existing pipeline stages to Pulse FSM with zero data loss.', href: '/features/pipeline', color: '#f59e0b' },
    { icon: BarChart2, title: 'Migrate from Zoho', desc: 'API-based migration with field mapping and duplicate detection.', href: '/features/contacts', color: '#2563eb' },
    { icon: Zap, title: 'CSV Import', desc: 'Bulk import contacts, companies, and leads via structured CSV files.', href: '/features/contacts', color: '#059669' },
    { icon: Target, title: 'Data Validation', desc: 'Duplicate email checks, format validation, and conflict resolution.', href: '/features/contacts', color: '#7c3aed' },
    { icon: Users, title: 'Migration Support', desc: '24/7 support team guides you through every step of migration.', href: '/features/dashboard', color: '#6b7280' },
  ],
};

const headings: Record<string, { title: string; desc: string }> = {
  industry: { title: 'Solutions by Industry', desc: 'Pulse CRM adapts to your industry with purpose-built features and compliance controls.' },
  team: { title: 'Solutions by Team', desc: 'Every role gets the exact tools they need — no more, no less.' },
  size: { title: 'Solutions by Company Size', desc: 'From solo freelancers to Fortune 500 enterprises — Pulse scales with you.' },
  department: { title: 'Solutions by Department', desc: 'Sales, Marketing, RevOps, and Customer Success — all in one workspace.' },
  usecase: { title: 'Solutions by Use Case', desc: 'Built for the real-world workflows your team runs every day.' },
  migration: { title: 'CRM Migration', desc: 'Move from Salesforce, HubSpot, or Zoho to Pulse in days, not months.' },
};

interface SolutionsDrawerProps {
  onClose: () => void;
  onOpenModal: () => void;
}

export default function SolutionsDrawer({ onClose, onOpenModal }: SolutionsDrawerProps) {
  const [activeId, setActiveId] = useState('industry');
  const router = useRouter();
  const cards = contentMap[activeId] ?? [];
  const heading = headings[activeId];

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <DrawerSidebar items={sidebarItems} activeId={activeId} onSelect={setActiveId} title="Explore Solutions" />
      <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <DrawerHeader
          title={heading.title}
          description={heading.desc}
          browseLabel="Browse all solutions"
          browseHref="/features/contacts"
          onClose={onClose}
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, flex: 1 }}>
          {cards.map(card => (
            <FeatureCard
              key={card.title}
              icon={card.icon}
              title={card.title}
              description={card.desc}
              href={card.href}
              color={card.color}
              onClick={() => { router.push(card.href); onClose(); }}
            />
          ))}
        </div>
        <div style={{ marginTop: 24 }}>
          <DrawerFooter onClose={onClose} onOpenModal={onOpenModal} />
        </div>
      </div>
    </div>
  );
}
