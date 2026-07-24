'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, Target, Users, Building2, TrendingUp,
  Briefcase, Activity, Sparkles, Mail, BarChart2, FileText,
  Workflow, Code, Settings, Shield,
} from 'lucide-react';
import DrawerSidebar from '../DrawerSidebar';
import DrawerHeader from '../DrawerHeader';
import DrawerFooter from '../DrawerFooter';
import FeatureCard from '../FeatureCard';

const sidebarItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'leads', label: 'Leads', icon: Target },
  { id: 'contacts', label: 'Contacts', icon: Users },
  { id: 'companies', label: 'Companies', icon: Building2 },
  { id: 'pipeline', label: 'Pipeline', icon: TrendingUp },
  { id: 'deals', label: 'Deals', icon: Briefcase },
  { id: 'activities', label: 'Activities', icon: Activity },
  { id: 'ai-copilot', label: 'AI Copilot', icon: Sparkles },
  { id: 'email-sync', label: 'Email Sync', icon: Mail },
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'automation', label: 'Automation', icon: Workflow },
  { id: 'api', label: 'API', icon: Code },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const featureMap: Record<string, { icon: React.ElementType; title: string; desc: string; href: string; color: string }[]> = {
  dashboard: [
    { icon: LayoutDashboard, title: 'Sales Dashboard', desc: 'Real-time KPIs: New Deals, Emails Sent, Revenue. Pipeline chart + AI insights.', href: '/features/dashboard', color: '#7c3aed' },
    { icon: BarChart2, title: 'Pipeline Overview', desc: 'Visualise deal stages and pipeline value at a glance.', href: '/features/analytics', color: '#2563eb' },
    { icon: Sparkles, title: 'AI Insights Panel', desc: 'GPT-4o powered deal insights surface directly on the dashboard.', href: '/features/ai-copilot', color: '#059669' },
    { icon: Users, title: 'Team Leaderboard', desc: 'Rep rankings by closed value, activity score, and win rate.', href: '/features/analytics', color: '#f59e0b' },
    { icon: Activity, title: 'Activity Feed', desc: 'Live log of calls, emails, and notes across your team.', href: '/features/dashboard', color: '#7c3aed' },
    { icon: Settings, title: 'Dashboard Settings', desc: 'Customise widget layout, date ranges, and data scope.', href: '/features/dashboard', color: '#6b7280' },
  ],
  leads: [
    { icon: Target, title: 'Lead Capture', desc: 'Create leads via API, form, or CSV import automatically.', href: '/features/contacts', color: '#7c3aed' },
    { icon: Sparkles, title: 'AI Lead Scoring', desc: 'Every lead scored 0–100 by GPT-4o based on engagement signals.', href: '/features/ai-copilot', color: '#2563eb' },
    { icon: TrendingUp, title: 'Lead FSM Pipeline', desc: 'New → Contacted → Qualified → Proposal Sent → Negotiation → Won/Lost.', href: '/features/contacts', color: '#059669' },
    { icon: Users, title: 'Lead Assignment', desc: 'Assign leads to reps with owner tracking and notifications.', href: '/features/contacts', color: '#f59e0b' },
    { icon: FileText, title: 'Lead Reports', desc: 'Breakdown by status, source, owner, and time period.', href: '/features/analytics', color: '#7c3aed' },
    { icon: Workflow, title: 'Lead Automation', desc: 'Auto-assign, auto-score, and auto-notify on new leads.', href: '/features/contacts', color: '#6b7280' },
  ],
  contacts: [
    { icon: Users, title: 'Contact Profiles', desc: 'Rich profiles: name, email, phone, job title, department, LinkedIn.', href: '/features/contacts', color: '#7c3aed' },
    { icon: Building2, title: 'Company Linking', desc: 'Link contacts to companies for account-level relationship views.', href: '/features/contacts', color: '#2563eb' },
    { icon: Mail, title: 'Email History', desc: 'Full email thread history linked to each contact automatically.', href: '/features/email-sync', color: '#059669' },
    { icon: Activity, title: 'Activity Timeline', desc: 'Calls, notes, meetings, and emails per contact in one feed.', href: '/features/contacts', color: '#f59e0b' },
    { icon: Sparkles, title: 'Smart Deduplication', desc: 'Unique email constraints and server-side duplicate detection.', href: '/features/contacts', color: '#7c3aed' },
    { icon: BarChart2, title: 'Contact Analytics', desc: 'Engagement metrics, response rates, and contact health scores.', href: '/features/analytics', color: '#6b7280' },
  ],
  companies: [
    { icon: Building2, title: 'Company Profiles', desc: 'Name, domain, industry, employee count, website, and social links.', href: '/features/contacts', color: '#7c3aed' },
    { icon: Users, title: 'Team Contacts', desc: 'See all people at a company with their roles and status.', href: '/features/contacts', color: '#2563eb' },
    { icon: Briefcase, title: 'Account Deals', desc: 'All open and closed deals associated with a company.', href: '/features/pipeline', color: '#059669' },
    { icon: Activity, title: 'Account Timeline', desc: 'Full activity history across all contacts at a company.', href: '/features/contacts', color: '#f59e0b' },
    { icon: BarChart2, title: 'Account Analytics', desc: 'Revenue, deal count, and engagement metrics per account.', href: '/features/analytics', color: '#7c3aed' },
    { icon: Target, title: 'Account-Based Leads', desc: 'Create leads targeting specific companies and tracks.', href: '/features/contacts', color: '#6b7280' },
  ],
  pipeline: [
    { icon: TrendingUp, title: 'Visual Pipeline', desc: 'FSM-based kanban with stages: New → Discovery → Proposal → Negotiation → Closed.', href: '/features/pipeline', color: '#7c3aed' },
    { icon: Briefcase, title: 'Deal Cards', desc: 'Value (₹), owner, close date, and stage visible per deal.', href: '/features/pipeline', color: '#2563eb' },
    { icon: Activity, title: 'Stage Transitions', desc: 'FSM validation rejects invalid moves. Every change logged.', href: '/features/pipeline', color: '#059669' },
    { icon: BarChart2, title: 'Pipeline Analytics', desc: 'Velocity, conversion rate, and stuck deal detection.', href: '/features/analytics', color: '#f59e0b' },
    { icon: Sparkles, title: 'AI Forecasting', desc: 'GPT-4o predicts end-of-quarter revenue from pipeline state.', href: '/features/ai-copilot', color: '#7c3aed' },
    { icon: Settings, title: 'Stage Configuration', desc: 'Customise pipeline stage names and probabilities per org.', href: '/features/pipeline', color: '#6b7280' },
  ],
  deals: [
    { icon: Briefcase, title: 'Deal Management', desc: 'Track every opportunity with value (₹), dates, and owner.', href: '/features/pipeline', color: '#7c3aed' },
    { icon: TrendingUp, title: 'Deal Pipeline', desc: 'Full Kanban view of all deals by stage.', href: '/features/pipeline', color: '#2563eb' },
    { icon: Activity, title: 'Deal Timeline', desc: 'Immutable history of every action taken on a deal.', href: '/features/pipeline', color: '#059669' },
    { icon: Sparkles, title: 'Win Probability', desc: 'AI-generated probability score updated on every stage change.', href: '/features/ai-copilot', color: '#f59e0b' },
    { icon: FileText, title: 'Deal Reports', desc: 'Win/loss analysis, cycle time, and revenue attribution.', href: '/features/analytics', color: '#7c3aed' },
    { icon: Users, title: 'Deal Collaboration', desc: 'Multi-rep visibility with role-scoped access control.', href: '/features/pipeline', color: '#6b7280' },
  ],
  activities: [
    { icon: Activity, title: 'Activity Timeline', desc: 'All calls, emails, notes, and meetings in one chronological feed.', href: '/features/dashboard', color: '#7c3aed' },
    { icon: Mail, title: 'Email Activities', desc: 'Sent and received emails linked to contacts and deals.', href: '/features/email-sync', color: '#2563eb' },
    { icon: Target, title: 'Task Management', desc: 'Create and track tasks with due dates and priorities.', href: '/features/dashboard', color: '#059669' },
    { icon: BarChart2, title: 'Activity Reports', desc: 'Activity count, type breakdown, and rep-level metrics.', href: '/features/analytics', color: '#f59e0b' },
    { icon: Workflow, title: 'Auto-Log Activities', desc: 'Email sync auto-creates email activity records per contact.', href: '/features/email-sync', color: '#7c3aed' },
    { icon: Sparkles, title: 'AI Activity Insights', desc: 'Detect low-activity contacts and stalled deals automatically.', href: '/features/ai-copilot', color: '#6b7280' },
  ],
  'ai-copilot': [
    { icon: Sparkles, title: 'Lead Scoring', desc: 'Every lead scored 0–100 using GPT-4o context analysis.', href: '/features/ai-copilot', color: '#7c3aed' },
    { icon: BarChart2, title: 'Deal Insights', desc: 'Plain-language insights on deal health and next steps.', href: '/features/ai-copilot', color: '#2563eb' },
    { icon: TrendingUp, title: 'Revenue Forecast', desc: 'AI-weighted pipeline forecast with confidence intervals.', href: '/features/ai-copilot', color: '#059669' },
    { icon: Mail, title: 'Email Drafts', desc: 'Auto-draft follow-up emails tailored to deal stage and tone.', href: '/features/ai-copilot', color: '#f59e0b' },
    { icon: Activity, title: 'Anomaly Detection', desc: 'Flag stalled deals, ghosted contacts, and activity drops.', href: '/features/ai-copilot', color: '#7c3aed' },
    { icon: Workflow, title: 'Smart Actions', desc: 'Recommend the single best action per deal in real time.', href: '/features/ai-copilot', color: '#6b7280' },
  ],
  'email-sync': [
    { icon: Mail, title: 'Gmail OAuth', desc: 'One-click Gmail connect with per-user inbox isolation.', href: '/features/email-sync', color: '#7c3aed' },
    { icon: Activity, title: 'Thread Logging', desc: 'Full email thread history linked to contacts and deals.', href: '/features/email-sync', color: '#2563eb' },
    { icon: TrendingUp, title: 'Deal Linking', desc: 'Automatically link inbound/outbound emails to open deals.', href: '/features/email-sync', color: '#059669' },
    { icon: Settings, title: 'Sync Status', desc: 'Real-time sync state tracking: connected, syncing, or error.', href: '/features/email-sync', color: '#f59e0b' },
    { icon: FileText, title: 'Email Templates', desc: 'Save and reuse email templates across your sales team.', href: '/features/email-sync', color: '#7c3aed' },
    { icon: BarChart2, title: 'Email Analytics', desc: 'Open rates, reply rates, and response time per contact.', href: '/features/analytics', color: '#6b7280' },
  ],
  analytics: [
    { icon: BarChart2, title: 'Revenue Analytics', desc: 'Revenue by period, rep, source, and deal type.', href: '/features/analytics', color: '#7c3aed' },
    { icon: TrendingUp, title: 'Pipeline Velocity', desc: 'Average cycle time per stage and overall sales speed.', href: '/features/analytics', color: '#2563eb' },
    { icon: Users, title: 'Rep Leaderboard', desc: 'Rankings by closed value, activity count, and win rate.', href: '/features/analytics', color: '#059669' },
    { icon: FileText, title: 'Win/Loss Reports', desc: 'Aggregate win and loss data by rep, time, and source.', href: '/features/analytics', color: '#f59e0b' },
    { icon: Activity, title: 'Activity Heatmap', desc: 'Visualise when and how often reps are active.', href: '/features/analytics', color: '#7c3aed' },
    { icon: Target, title: 'Lead Funnel Report', desc: 'Track conversion rates from lead to closed at each stage.', href: '/features/analytics', color: '#6b7280' },
  ],
  reports: [
    { icon: FileText, title: 'Custom Reports', desc: 'Build and save custom reports with flexible filters.', href: '/features/analytics', color: '#7c3aed' },
    { icon: BarChart2, title: 'Dashboard Reports', desc: 'KPI summaries at /api/v1/dashboard — role-scoped.', href: '/features/dashboard', color: '#2563eb' },
    { icon: TrendingUp, title: 'Forecast Reports', desc: 'Quarter and monthly revenue predictions from pipeline.', href: '/features/analytics', color: '#059669' },
    { icon: Sparkles, title: 'AI-Generated Reports', desc: 'GPT-4o creates narrative summaries of your key metrics.', href: '/features/ai-copilot', color: '#f59e0b' },
    { icon: Users, title: 'Team Reports', desc: 'Manager-level team performance breakdowns.', href: '/features/analytics', color: '#7c3aed' },
    { icon: Activity, title: 'Activity Reports', desc: 'Volume, type, and timing of all sales activities.', href: '/features/analytics', color: '#6b7280' },
  ],
  automation: [
    { icon: Workflow, title: 'Workflow Builder', desc: 'Build no-code automation workflows triggered by CRM events.', href: '/features/contacts', color: '#7c3aed' },
    { icon: Mail, title: 'Email Automation', desc: 'Auto-send follow-up emails on lead stage change or inactivity.', href: '/features/email-sync', color: '#2563eb' },
    { icon: Target, title: 'Lead Auto-Assign', desc: 'Round-robin or rule-based lead assignment to reps.', href: '/features/contacts', color: '#059669' },
    { icon: Sparkles, title: 'AI Triggers', desc: 'Trigger actions when AI score crosses a threshold.', href: '/features/ai-copilot', color: '#f59e0b' },
    { icon: Activity, title: 'Activity Reminders', desc: 'Auto-create follow-up tasks based on contact inactivity.', href: '/features/dashboard', color: '#7c3aed' },
    { icon: Settings, title: 'Automation Settings', desc: 'Configure triggers, conditions, and actions per workflow.', href: '/features/dashboard', color: '#6b7280' },
  ],
  api: [
    { icon: Code, title: 'REST API', desc: '40+ endpoints. Full CRUD for leads, contacts, deals, companies.', href: '/features/dashboard', color: '#7c3aed' },
    { icon: Shield, title: 'JWT Authentication', desc: 'Secure API access with role-encoded JWT tokens.', href: '/features/dashboard', color: '#2563eb' },
    { icon: Settings, title: 'RBAC Permissions', desc: '33 granular permissions scoped per resource and action.', href: '/features/dashboard', color: '#059669' },
    { icon: FileText, title: 'OpenAPI / Swagger', desc: 'Auto-generated Swagger UI at /docs. ReDoc at /redoc.', href: '/features/dashboard', color: '#f59e0b' },
    { icon: Workflow, title: 'Webhooks', desc: 'Outgoing webhooks on deal stage change, lead creation, and more.', href: '/features/dashboard', color: '#7c3aed' },
    { icon: BarChart2, title: 'API Analytics', desc: 'Request logs, rate limits, and per-token usage metrics.', href: '/features/analytics', color: '#6b7280' },
  ],
  settings: [
    { icon: Settings, title: 'Organization Settings', desc: 'Manage your workspace name, slug, timezone, and branding.', href: '/features/dashboard', color: '#7c3aed' },
    { icon: Users, title: 'User Management', desc: 'Invite, deactivate, and assign roles to team members.', href: '/features/contacts', color: '#2563eb' },
    { icon: Shield, title: 'Roles & Permissions', desc: '33 permissions across 3 roles: Admin, Manager, Sales Rep.', href: '/features/dashboard', color: '#059669' },
    { icon: Mail, title: 'Email Config', desc: 'SMTP settings, from-name, and default email templates.', href: '/features/email-sync', color: '#f59e0b' },
    { icon: Sparkles, title: 'AI Settings', desc: 'GPT-4o API key, scoring thresholds, and model preferences.', href: '/features/ai-copilot', color: '#7c3aed' },
    { icon: Activity, title: 'Audit Logs', desc: 'Immutable log of all user actions for compliance and review.', href: '/features/dashboard', color: '#6b7280' },
  ],
};

interface ProductDrawerProps {
  onClose: () => void;
  onOpenModal: () => void;
}

export default function ProductDrawer({ onClose, onOpenModal }: ProductDrawerProps) {
  const [activeId, setActiveId] = useState('dashboard');
  const router = useRouter();
  const cards = featureMap[activeId] ?? featureMap['dashboard'];
  const activeItem = sidebarItems.find(s => s.id === activeId);

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Sidebar */}
      <DrawerSidebar
        items={sidebarItems}
        activeId={activeId}
        onSelect={setActiveId}
        title="Browse Product"
      />

      {/* Content */}
      <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0 }}>
        <DrawerHeader
          title={activeItem?.label ?? 'Product'}
          description={`Explore all ${activeItem?.label?.toLowerCase() ?? 'product'} features built into Pulse CRM — designed for real sales teams.`}
          browseLabel={`Browse all ${activeItem?.label ?? 'Product'} features`}
          browseHref={`/features/${activeId}`}
          onClose={onClose}
        />

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 14, flex: 1,
        }}>
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
