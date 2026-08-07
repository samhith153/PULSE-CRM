'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
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
            { name: 'Tasks',        icon: ClipboardList, tab: 'tasks' },
            { name: 'Calendar',     icon: Calendar,  tab: 'calendar' },
            { name: 'AI Insights',  icon: Sparkles,  tab: 'ai insights' },
          ],
        },
        {
          label: 'Settings',
          items: [
            { name: 'Notifications', icon: Bell,     tab: 'notifications' },
            { name: 'Settings',      icon: Settings, tab: 'settings' },
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
            { name: 'Reports',    icon: BarChart3, tab: 'reports' },
            { name: 'AI Models',  icon: Cpu,       tab: 'ai models' },
            { name: 'Audit Logs', icon: Activity,  tab: 'audit logs' },
          ],
        },
        {
          label: 'System',
          items: [
            { name: 'Settings', icon: Settings, tab: 'settings' },
          ],
        },
      ];

    case 'representative':
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
            { name: 'Tasks',        icon: ClipboardList, tab: 'tasks' },
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
        {
          label: 'Configuration',
          items: [
            { name: 'Settings', icon: Settings, tab: 'settings' },
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

  /* Shared active / inactive styles */
  const itemBase = cn(
    'group relative w-full flex items-center rounded-xl py-2 text-sm z-0 overflow-hidden',
    'transition-all duration-200 cursor-pointer',
  );
  const itemActive = cn(
    'text-brand-blue font-semibold',
  );
  const itemInactive = cn(
    'text-sidebar-foreground/55 font-medium hover:text-sidebar-foreground',
    'hover:bg-sidebar-accent/40',
  );

  return (
    <aside
      className={cn(
        'flex h-full flex-col shrink-0 overflow-hidden',
        'bg-sidebar text-sidebar-foreground border-r border-sidebar-border',
        'transition-[width] duration-300 ease-in-out z-40',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* ── Brand header ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2.5 px-3 py-4 shrink-0 min-w-0">
        <div className="grad-blue-purple grid size-9 shrink-0 place-items-center rounded-xl text-primary-foreground">
          <Zap size={17} />
        </div>
        {!collapsed && (
          <span className="truncate text-base font-bold tracking-tight text-sidebar-foreground">
            PULSE CRM
          </span>
        )}
      </div>

      {/* ── Scrollable nav ───────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">

        {/* Home */}
        <button
          onClick={() => setActiveTab('home')}
          className={cn(
            itemBase,
            collapsed ? 'justify-center px-2' : 'px-3 gap-2.5',
            isActive('home') ? itemActive : itemInactive,
          )}
        >
          <LayoutDashboard
            size={16}
            strokeWidth={2}
            fill={isActive('home') ? "rgba(37, 99, 235, 0.15)" : "none"}
            className={cn(
              'shrink-0 transition-colors',
              isActive('dashboard') ? 'text-brand-purple' : 'text-muted-foreground group-hover:text-sidebar-foreground',
            )}
          />
          {!collapsed && <span className="truncate relative z-10">Home</span>}

          {/* Collapsed tooltip */}
          {collapsed && (
            <span className="pointer-events-none absolute left-full ml-2.5 whitespace-nowrap rounded-lg border border-border bg-popover px-2.5 py-1.5 text-xs text-foreground shadow-nav opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
              Home
            </span>
          )}
        </button>

        {/* Sections */}
        {sections.map((section) => (
          <div key={section.label} className="pt-3">
            {/* Group label */}
            {!collapsed ? (
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 select-none">
                {section.label}
              </p>
            ) : (
              <div className="mx-2 mb-2 h-px bg-sidebar-border" />
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
                    collapsed ? 'justify-center px-2' : 'px-3 gap-2.5',
                    active ? itemActive : itemInactive,
                  )}
                >
                  {active && (
                    <motion.div
                      layoutId="activeNavIndicator"
                      className="absolute inset-0 bg-brand-blue/[0.08] rounded-xl z-0"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    >
                      <div className="absolute left-0 top-2 bottom-2 w-0.75 rounded-r bg-brand-blue" />
                    </motion.div>
                  )}
                  <Icon
                    size={15}
                    strokeWidth={2}
                    fill={active ? "rgba(37, 99, 235, 0.15)" : "none"}
                    className={cn(
                      'shrink-0 transition-colors relative z-10',
                      active
                        ? 'text-brand-blue'
                        : 'text-muted-foreground group-hover:text-sidebar-foreground',
                    )}
                  />
                  {!collapsed && <span className="truncate relative z-10">{item.name}</span>}

                  {collapsed && (
                    <span className="pointer-events-none absolute left-full ml-2.5 whitespace-nowrap rounded-lg border border-border bg-popover px-2.5 py-1.5 text-xs text-foreground shadow-nav opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
                      {item.name}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── User footer ──────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-sidebar-border px-2 py-3">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={cn(
            'w-full flex items-center gap-2.5 rounded-xl p-2',
            'text-left transition-colors duration-150 cursor-pointer',
            'hover:bg-sidebar-accent/60',
            collapsed && 'justify-center',
          )}
        >
          <div className="size-8 shrink-0 overflow-hidden rounded-full border border-sidebar-border flex items-center justify-center bg-secondary">
            {currentUser?.avatar_url ? (
              <Image
                src={resolveImageUrl(currentUser.avatar_url)}
                alt={profileName}
                width={32}
                height={32}
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : (
              <span className="text-[10px] font-bold text-muted-foreground select-none">{profileInitials}</span>
            )}
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-sidebar-foreground">
                  {profileName}
                </p>
                <p className="truncate text-[10px] text-muted-foreground">
                  {profileRoleLabel}
                </p>
              </div>
              <ChevronsUpDown size={13} className="shrink-0 text-muted-foreground" />
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
