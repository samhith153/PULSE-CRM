'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen, FileText, Users, HeadphonesIcon, Code, Play,
  Video, Bell, Download, Sparkles, Activity, BarChart2,
} from 'lucide-react';
import DrawerSidebar from '../DrawerSidebar';
import DrawerHeader from '../DrawerHeader';
import DrawerFooter from '../DrawerFooter';
import FeatureCard from '../FeatureCard';

const sidebarItems = [
  { id: 'docs', label: 'Documentation', icon: BookOpen },
  { id: 'blog', label: 'Blog', icon: FileText },
  { id: 'community', label: 'Community', icon: Users },
  { id: 'support', label: 'Support', icon: HeadphonesIcon },
  { id: 'api', label: 'API Docs', icon: Code },
  { id: 'tutorials', label: 'Tutorials', icon: Play },
  { id: 'videos', label: 'Videos', icon: Video },
  { id: 'release', label: 'Release Notes', icon: Bell },
];

const contentMap: Record<string, { icon: React.ElementType; title: string; desc: string; href: string; color: string }[]> = {
  docs: [
    { icon: BookOpen, title: 'Getting Started Guide', desc: 'Set up Pulse CRM in 2 minutes. Install, seed, and start the API server.', href: '/features/dashboard', color: '#7c3aed' },
    { icon: Code, title: 'REST API Reference', desc: '40+ endpoints. Full CRUD for leads, contacts, deals, companies.', href: '/features/dashboard', color: '#2563eb' },
    { icon: Activity, title: 'Authentication Guide', desc: 'JWT tokens, refresh flow, password reset, and role-based scoping.', href: '/features/dashboard', color: '#059669' },
    { icon: BarChart2, title: 'RBAC & Permissions', desc: '33 granular permissions across 3 roles: Admin, Manager, Sales Rep.', href: '/features/dashboard', color: '#f59e0b' },
    { icon: Sparkles, title: 'AI Copilot Guide', desc: 'Configure GPT-4o integration, lead scoring thresholds, and model settings.', href: '/features/ai-copilot', color: '#7c3aed' },
    { icon: FileText, title: 'Database Schema', desc: '11 tables, FK constraints, indexes, and migration guide with Alembic.', href: '/features/dashboard', color: '#6b7280' },
  ],
  blog: [
    { icon: FileText, title: 'Building a CRM with FastAPI', desc: 'How we built 40+ REST endpoints with Clean Architecture and DDD.', href: '/features/dashboard', color: '#7c3aed' },
    { icon: Sparkles, title: 'AI Lead Scoring Deep Dive', desc: 'How GPT-4o analyses deal context to generate 0–100 lead scores.', href: '/features/ai-copilot', color: '#2563eb' },
    { icon: Activity, title: 'FSM Pipeline Design', desc: 'Why Finite State Machine validation makes your pipeline bulletproof.', href: '/features/pipeline', color: '#059669' },
    { icon: BarChart2, title: 'RBAC Best Practices', desc: '33 permissions, 3 roles, and how to design access control for CRM.', href: '/features/dashboard', color: '#f59e0b' },
    { icon: Code, title: 'JWT Auth in Python', desc: 'Access tokens, refresh tokens, and secure password reset flow.', href: '/features/dashboard', color: '#7c3aed' },
    { icon: BookOpen, title: 'Gmail OAuth Integration', desc: 'Per-user inbox sync with GmailConnection model and OAuth2 scopes.', href: '/features/email-sync', color: '#6b7280' },
  ],
  community: [
    { icon: Users, title: 'Developer Forum', desc: 'Ask questions, share integrations, and get help from the Pulse community.', href: '/features/dashboard', color: '#7c3aed' },
    { icon: Code, title: 'GitHub Repository', desc: 'Browse the source code, open issues, and submit pull requests.', href: 'https://github.com', color: '#2563eb' },
    { icon: Play, title: 'Live Demos', desc: 'Weekly live product demos with Q&A from the Pulse engineering team.', href: '/features/dashboard', color: '#059669' },
    { icon: FileText, title: 'Integration Showcase', desc: 'See how other teams integrate Pulse CRM with their existing tools.', href: '/features/dashboard', color: '#f59e0b' },
    { icon: Bell, title: 'Community Blog', desc: 'User-written guides, tips, and workflows for the Pulse CRM ecosystem.', href: '/features/dashboard', color: '#7c3aed' },
    { icon: HeadphonesIcon, title: 'Community Slack', desc: 'Real-time chat with other Pulse CRM users and the core team.', href: '/features/dashboard', color: '#6b7280' },
  ],
  support: [
    { icon: HeadphonesIcon, title: 'Live Chat Support', desc: '24/7 live chat with real humans who know the codebase.', href: '/features/dashboard', color: '#7c3aed' },
    { icon: FileText, title: 'Help Center', desc: 'Searchable knowledge base covering setup, features, and troubleshooting.', href: '/features/dashboard', color: '#2563eb' },
    { icon: Activity, title: 'System Status', desc: 'Real-time uptime monitoring for all Pulse CRM services.', href: '/features/dashboard', color: '#059669' },
    { icon: Code, title: 'Bug Reports', desc: 'Submit bug reports via GitHub Issues or the in-app bug reporter.', href: 'https://github.com', color: '#f59e0b' },
    { icon: BookOpen, title: 'Onboarding Sessions', desc: 'Scheduled 1:1 onboarding calls for Growth and Enterprise customers.', href: '/features/dashboard', color: '#7c3aed' },
    { icon: Bell, title: 'Incident Alerts', desc: 'Subscribe to incident and maintenance notifications via email.', href: '/features/dashboard', color: '#6b7280' },
  ],
  api: [
    { icon: Code, title: 'REST API Overview', desc: '40+ endpoints with OpenAPI spec at /openapi.json and Swagger at /docs.', href: '/features/dashboard', color: '#7c3aed' },
    { icon: Activity, title: 'Authentication', desc: 'JWT Bearer tokens. POST /api/v1/auth/login returns access + refresh tokens.', href: '/features/dashboard', color: '#2563eb' },
    { icon: Users, title: 'Contacts API', desc: 'GET/POST/PUT/DELETE /api/v1/contacts with search and pagination.', href: '/features/contacts', color: '#059669' },
    { icon: BarChart2, title: 'Leads API', desc: 'GET/POST /api/v1/leads. FSM status transitions via PUT /api/v1/leads/{id}.', href: '/features/contacts', color: '#f59e0b' },
    { icon: FileText, title: 'Deals & Pipeline API', desc: 'GET/POST /api/v1/deals and pipeline stage management endpoints.', href: '/features/pipeline', color: '#7c3aed' },
    { icon: Sparkles, title: 'AI API', desc: 'GET /api/v1/ai — lead scores, deal insights, and recommendations.', href: '/features/ai-copilot', color: '#6b7280' },
  ],
  tutorials: [
    { icon: Play, title: 'Setup in 5 Minutes', desc: 'Docker → alembic upgrade head → seed → uvicorn. Full walkthrough.', href: '/features/dashboard', color: '#7c3aed' },
    { icon: Code, title: 'First API Call', desc: 'Login, get JWT token, and make your first authenticated request.', href: '/features/dashboard', color: '#2563eb' },
    { icon: Activity, title: 'Lead-to-Deal Workflow', desc: 'Create a lead, advance through FSM stages, and convert to a deal.', href: '/features/pipeline', color: '#059669' },
    { icon: Sparkles, title: 'Configure AI Scoring', desc: 'Set GPT-4o API key, scoring thresholds, and test lead scoring.', href: '/features/ai-copilot', color: '#f59e0b' },
    { icon: FileText, title: 'Custom Reports', desc: 'Build and export custom analytics reports using the reports API.', href: '/features/analytics', color: '#7c3aed' },
    { icon: Users, title: 'Role Setup Guide', desc: 'Create users, assign roles, and configure per-permission access.', href: '/features/dashboard', color: '#6b7280' },
  ],
  videos: [
    { icon: Video, title: 'Product Walkthrough', desc: 'Full 15-minute video tour of every feature in Pulse CRM.', href: '/features/dashboard', color: '#7c3aed' },
    { icon: Activity, title: 'Pipeline Demo', desc: 'Watch a live deal move through all 6 FSM pipeline stages.', href: '/features/pipeline', color: '#2563eb' },
    { icon: Sparkles, title: 'AI Copilot in Action', desc: 'GPT-4o scoring, deal insights, and email drafting live demo.', href: '/features/ai-copilot', color: '#059669' },
    { icon: Code, title: 'API Integration Demo', desc: 'Build a custom integration using the Pulse REST API from scratch.', href: '/features/dashboard', color: '#f59e0b' },
    { icon: BarChart2, title: 'Analytics Overview', desc: 'Configure revenue reports, leaderboards, and export to CSV.', href: '/features/analytics', color: '#7c3aed' },
    { icon: FileText, title: 'Admin Setup Video', desc: 'User roles, permissions, and organisation settings walkthrough.', href: '/features/dashboard', color: '#6b7280' },
  ],
  release: [
    { icon: Bell, title: 'v1.0.0 — Launch Release', desc: 'JWT auth, RBAC (33 permissions), 40+ REST endpoints, Gmail sync, AI scoring.', href: '/features/dashboard', color: '#7c3aed' },
    { icon: Sparkles, title: 'AI Copilot Release', desc: 'GPT-4o lead scoring (0–100), deal insights, and forecast analysis.', href: '/features/ai-copilot', color: '#2563eb' },
    { icon: Activity, title: 'Pipeline FSM Update', desc: 'Finite State Machine validation for all deal stage transitions.', href: '/features/pipeline', color: '#059669' },
    { icon: Code, title: 'Swagger & ReDoc', desc: 'Auto-generated API documentation at /docs and /redoc for all endpoints.', href: '/features/dashboard', color: '#f59e0b' },
    { icon: Download, title: 'Database Migrations', desc: 'Alembic migrations for all 11 tables with FK constraints and indexes.', href: '/features/dashboard', color: '#7c3aed' },
    { icon: FileText, title: 'Seed Data v1', desc: '4 users, 5 companies, 5 contacts, 5 leads, 33 permissions seeded.', href: '/features/dashboard', color: '#6b7280' },
  ],
};

const headings: Record<string, { title: string; desc: string }> = {
  docs: { title: 'Documentation', desc: 'Everything you need to build, integrate, and deploy with Pulse CRM.' },
  blog: { title: 'Engineering Blog', desc: 'Deep dives into how Pulse CRM is architected — from API design to AI integration.' },
  community: { title: 'Community', desc: 'Connect with engineers and sales teams using Pulse CRM worldwide.' },
  support: { title: 'Support Center', desc: '24/7 expert support across live chat, knowledge base, and onboarding calls.' },
  api: { title: 'API Documentation', desc: 'Full REST API reference with 40+ endpoints, JWT auth, and OpenAPI spec.' },
  tutorials: { title: 'Step-by-Step Tutorials', desc: 'Hands-on guides to get the most out of every Pulse CRM feature.' },
  videos: { title: 'Video Library', desc: 'Product demos, walkthroughs, and integration tutorials on video.' },
  release: { title: 'Release Notes', desc: 'See what shipped in every version of Pulse CRM.' },
};

interface ResourcesDrawerProps {
  onClose: () => void;
  onOpenModal: () => void;
}

export default function ResourcesDrawer({ onClose, onOpenModal }: ResourcesDrawerProps) {
  const [activeId, setActiveId] = useState('docs');
  const router = useRouter();
  const cards = contentMap[activeId] ?? [];
  const heading = headings[activeId];

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <DrawerSidebar items={sidebarItems} activeId={activeId} onSelect={setActiveId} title="Resources" />
      <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <DrawerHeader
          title={heading.title}
          description={heading.desc}
          browseLabel="View all resources"
          browseHref="/features/dashboard"
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
