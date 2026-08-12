'use client';

import React from 'react';
import Image from 'next/image';
import {
  Home,
  Users,
  Contact,
  Building2,
  Layers,
  Package,
  Activity,
  Mail,
  GitBranch,
  Sparkles,
  BarChart3,
  FileText,
  Settings,
  ChevronsUpDown,
  Calendar,
  Award,
  TrendingUp,
  Shield,
  Bell,
  Link2,
  Cpu,
  Zap,
  LayoutDashboard,
  ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrentUser, userInitials } from '@/hooks/useCurrentUser';
import { resolveImageUrl } from '@/utils/api';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  userRole: 'sales_rep' | 'manager' | 'admin';
  currentUser?: { full_name: string; email: string; avatar_url: string | null; job_title: string | null } | null;
}

/* ── Nav data per role ───────────────────────────────────────────────── */

type NavItem = { name: string; icon: React.ElementType; tab: string };
type NavSection = { label: string; items: NavItem[] };

function getSections(userRole: SidebarProps['userRole']): NavSection[] {
  switch (userRole) {
    case 'manager':
      return [
        {
          label: 'Sales',
          items: [
            { name: 'Team Pipeline', icon: Layers,     tab: 'team pipeline' },
            { name: 'Leads',         icon: Users,      tab: 'leads' },
            { name: 'Companies',     icon: Building2,  tab: 'companies' },
            { name: 'Contacts',      icon: Contact,    tab: 'contacts' },
          ],
        },
        {
          label: 'Forecasting',
          items: [
            { name: 'Reports',          icon: BarChart3,  tab: 'reports' },
            { name: 'Forecast',         icon: TrendingUp, tab: 'forecast' },
            { name: 'Team Performance', icon: Award,      tab: 'team performance' },
          ],
        },
        {
          label: 'Productivity',
          items: [
            { name: 'Activities',   icon: Activity,  tab: 'activities' },
            { name: 'AI Insights',  icon: Sparkles,  tab: 'ai insights' },
          ],
        },
        {
          label: 'Settings',
          items: [
            { name: 'Notifications', icon: Bell,     tab: 'notifications' },
          ],
        },
      ];

    case 'admin':
      return [
        {
          label: 'People',
          items: [
            { name: 'Users',             icon: Users,  tab: 'users' },
            { name: 'Roles & Perms',     icon: Shield, tab: 'roles & permissions' },
          ],
        },
        {
          label: 'Records',
          items: [
            { name: 'Companies', icon: Building2, tab: 'companies' },
            { name: 'Contacts',  icon: Contact,   tab: 'contacts' },
            { name: 'Products',  icon: Package,   tab: 'products' },
          ],
        },
        {
          label: 'Intelligence',
          items: [
            { name: 'AI Models',  icon: Cpu,       tab: 'ai models' },
            { name: 'Audit Logs', icon: Activity,  tab: 'audit logs' },
          ],
        },
      ];

    case 'sales_rep':
    default:
      return [
        {
          label: 'Productivity',
          items: [
            { name: 'Leads',        icon: Users,      tab: 'leads' },
            { name: 'Contacts',     icon: Contact,    tab: 'contacts' },
            { name: 'Companies',    icon: Building2,  tab: 'companies' },
            { name: 'Deals',        icon: Layers,     tab: 'deals' },
            { name: 'Activities',   icon: Activity,   tab: 'activities' },
            { name: 'Emails',       icon: Mail,       tab: 'emails' },
          ],
        },
        {
          label: 'Automations & Intelligence',
          items: [
            { name: 'Workflows',   icon: Zap,      tab: 'workflows' },
            { name: 'AI Insights', icon: Sparkles, tab: 'ai insights' },
          ],
        },
        {
          label: 'Data & Analytics',
          items: [
            { name: 'Reports',   icon: BarChart3, tab: 'reports' },
            { name: 'Documents', icon: FileText,  tab: 'documents' },
          ],
        },
      ];
  }
}

/* ── Component ───────────────────────────────────────────────────────── */

export default function Sidebar({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  userRole,
}: SidebarProps) {
  const sections = getSections(userRole);
  const { user: currentUser } = useCurrentUser();
  const profileName = currentUser?.full_name || 'User';
  const profileRoleLabel = userRole === 'admin' ? 'Administrator' : userRole === 'manager' ? 'Sales Manager' : 'Sales Representative';
  const profileInitials = userInitials(currentUser?.full_name);

  const isActive = (tab: string) =>
    activeTab.toLowerCase() === tab.toLowerCase();

  /* ui.md §6: Nav item — height 44px, --radius-md, icon 20px + label 14px/500 */
  const itemBase = cn(
    'group relative w-full flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer',
  );
  const itemActive = cn(
    'bg-accent-color text-text-on-primary shadow-[0_8px_18px_-8px_var(--accent-color)]',
  );
  const itemInactive = cn(
    'text-text-primary hover:bg-surface-hover',
  );

  return (
    <aside
      className={cn(
        'flex h-full flex-col shrink-0 overflow-hidden',
        /* ui.md §6: White surface, no border, rounded outer corner */
        'bg-surface-1 text-text-primary',
        'transition-[width] duration-300 ease-in-out z-40',
        collapsed ? 'w-[72px]' : 'w-[240px]',
        /* Rounded outer corners per §6 */
        'm-0 rounded-none',
      )}
      style={{ borderRadius: '0' }}
    >
      {/* ── Brand header — ui.md §6 ─────────────────────────────────────── */}
      <div className="flex items-center gap-2.5 px-4 py-5 shrink-0 min-w-0">
        <div className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-color text-text-on-primary shadow-[0_8px_18px_-8px_var(--accent-color)]">
          <Zap size={18} strokeWidth={2.6} />
        </div>
        {!collapsed && (
          <span className="truncate text-lg font-bold tracking-tight text-text-primary">
            Pulse CRM
          </span>
        )}
      </div>

      {/* ── Scrollable nav — ui.md §6: md-lg padding ───────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-3.5">

        {/* Home — ui.md §6: icon 20px */}
        <button
          onClick={() => setActiveTab('home')}
          className={cn(
            itemBase,
            collapsed ? 'justify-center px-2' : '',
            isActive('home') ? itemActive : itemInactive,
          )}
        >
          <LayoutDashboard
            size={20}
            strokeWidth={2}
            className={cn(
              'shrink-0 transition-transform duration-200 group-hover:scale-105',
              isActive('home') ? '' : 'text-text-secondary',
            )}
          />
          {!collapsed && <span className="truncate">Home</span>}

          {/* Collapsed tooltip — ui.md §5: shadow-popover */}
          {collapsed && (
            <span className="pointer-events-none absolute left-full ml-2.5 whitespace-nowrap rounded-[12px] border border-border-default bg-surface-1 px-2.5 py-1.5 text-xs text-text-primary shadow-popover opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
              Home
            </span>
          )}
        </button>

        {/* Sections */}
        {sections.map((section) => (
          <div key={section.label} className="space-y-1">
            {/* Group label — ui.md §3: 11px/600 uppercase 0.06em spacing */}
            {!collapsed ? (
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted select-none">
                {section.label}
              </p>
            ) : (
              <div className="mx-2 mb-1 h-px bg-border-default" />
            )}

            {section.items.map((item) => {
              const Icon   = item.icon;
              const active = isActive(item.tab);

              return (
                <button
                  key={item.name}
                  onClick={() => setActiveTab(item.tab)}
                  className={cn(
                    itemBase,
                    collapsed ? 'justify-center px-2' : '',
                    active ? itemActive : itemInactive,
                  )}
                >
                  <Icon
                    size={20}
                    strokeWidth={2}
                    className={cn(
                      'shrink-0 transition-transform duration-200 group-hover:scale-105',
                      active ? '' : 'text-text-secondary',
                    )}
                  />
                  {!collapsed && <span className="truncate">{item.name}</span>}

                  {collapsed && (
                    <span className="pointer-events-none absolute left-full ml-2.5 whitespace-nowrap rounded-[12px] border border-border-default bg-surface-1 px-2.5 py-1.5 text-xs text-text-primary shadow-popover opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
                      {item.name}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── User footer — ui.md §6 ──────────────────────────────────────── */}
      <div className="shrink-0 border-t border-border-default p-3">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={cn(
            'w-full flex items-center gap-3 rounded-[12px] p-3',
            'text-left transition-colors duration-150 cursor-pointer',
            'hover:bg-surface-hover',
            collapsed && 'justify-center',
          )}
        >
          <div className="size-10 shrink-0 overflow-hidden rounded-full border border-border-default flex items-center justify-center bg-accent-muted">
            {currentUser?.avatar_url ? (
              <Image
                src={resolveImageUrl(currentUser.avatar_url)}
                alt={profileName}
                width={40}
                height={40}
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : (
              <span className="text-xs font-bold text-accent-color select-none">{profileInitials}</span>
            )}
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-sm font-semibold text-text-primary">
                  {profileName}
                </p>
                <p className="truncate text-xs text-text-muted">
                  {profileRoleLabel}
                </p>
              </div>
              <ChevronsUpDown size={14} className="shrink-0 text-text-muted" />
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
