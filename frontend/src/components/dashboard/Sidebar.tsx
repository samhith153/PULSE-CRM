'use client';

import React from 'react';
import { 
  LayoutDashboard, 
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
  ChevronDown,
  Calendar,
  Award,
  TrendingUp,
  Shield,
  Bell,
  Link2,
  Cpu
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  userRole: 'representative' | 'manager' | 'admin';
}

export default function Sidebar({ activeTab, setActiveTab, collapsed, userRole }: SidebarProps) {
  // Dynamic sidebar sections based on user role
  const getSections = () => {
    switch (userRole) {
      case 'manager':
        return [
          {
            name: 'Sales Management',
            items: [
              { name: 'Team Pipeline', icon: Layers, tab: 'team pipeline' },
              { name: 'Leads', icon: Users, tab: 'leads' },
              { name: 'Companies', icon: Building2, tab: 'companies' },
              { name: 'Contacts', icon: Contact, tab: 'contacts' },
            ]
          },
          {
            name: 'Manager Forecasting',
            items: [
              { name: 'Reports', icon: BarChart3, tab: 'reports' },
              { name: 'Forecast', icon: TrendingUp, tab: 'forecast' },
              { name: 'Team Performance', icon: Award, tab: 'team performance' },
            ]
          },
          {
            name: 'Productivity & AI',
            items: [
              { name: 'Activities', icon: Activity, tab: 'activities' },
              { name: 'Calendar', icon: Calendar, tab: 'calendar' },
              { name: 'AI Insights', icon: Sparkles, tab: 'ai insights' },
            ]
          },
          {
            name: 'Notifications & Settings',
            items: [
              { name: 'Notifications', icon: Bell, tab: 'notifications' },
              { name: 'Settings', icon: Settings, tab: 'settings' },
            ]
          }
        ];
      case 'admin':
        return [
          {
            name: 'User Directory',
            items: [
              { name: 'Users', icon: Users, tab: 'users' },
              { name: 'Roles & Permissions', icon: Shield, tab: 'roles & permissions' },
            ]
          },
          {
            name: 'Core Entities',
            items: [
              { name: 'Companies', icon: Building2, tab: 'companies' },
              { name: 'Contacts', icon: Contact, tab: 'contacts' },
              { name: 'Products', icon: Package, tab: 'products' },
            ]
          },
          {
            name: 'Integrations & Automation',
            items: [
              { name: 'Integrations', icon: Link2, tab: 'integrations' },
              { name: 'Automation', icon: GitBranch, tab: 'automation' },
            ]
          },
          {
            name: 'System Intelligence',
            items: [
              { name: 'Reports', icon: BarChart3, tab: 'reports' },
              { name: 'AI Models', icon: Cpu, tab: 'ai models' },
              { name: 'Audit Logs', icon: Activity, tab: 'audit logs' },
            ]
          },
          {
            name: 'Administration',
            items: [
              { name: 'Settings', icon: Settings, tab: 'settings' },
            ]
          }
        ];
      case 'representative':
      default:
        return [
          {
            name: 'Sales',
            items: [
              { name: 'Leads', icon: Users, tab: 'leads' },
              { name: 'Contacts', icon: Contact, tab: 'contacts' },
              { name: 'Companies', icon: Building2, tab: 'companies' },
              { name: 'Deals', icon: Layers, tab: 'deals' },
              { name: 'Products', icon: Package, tab: 'products' },
            ]
          },
          {
            name: 'Productivity',
            items: [
              { name: 'Activities', icon: Activity, tab: 'activities' },
              { name: 'Emails', icon: Mail, tab: 'emails' },
            ]
          },
          {
            name: 'Automations & Intelligence',
            items: [
              { name: 'Workflows', icon: GitBranch, tab: 'workflows' },
              { name: 'AI Insights', icon: Sparkles, tab: 'ai insights' },
            ]
          },
          {
            name: 'Data & Analytics',
            items: [
              { name: 'Reports', icon: BarChart3, tab: 'reports' },
              { name: 'Documents', icon: FileText, tab: 'documents' },
            ]
          },
          {
            name: 'Configuration',
            items: [
              { name: 'Settings', icon: Settings, tab: 'settings' },
            ]
          }
        ];
    }
  };

  // Dynamic user profile footer details based on active role
  const getUserProfile = () => {
    switch (userRole) {
      case 'admin':
        return {
          name: "System Admin",
          role: "Administrator",
          avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&fit=crop&q=80"
        };
      case 'manager':
        return {
          name: "Alex Johnson",
          role: "Sales Manager",
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&fit=crop&q=80"
        };
      case 'representative':
      default:
        return {
          name: "Sarah Johnson",
          role: "Sales Representative",
          avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&fit=crop&q=80"
        };
    }
  };

  const profile = getUserProfile();
  const sections = getSections();

  const handleTabClick = (tabName: string) => {
    setActiveTab(tabName.toLowerCase());
  };

  const isTabActive = (tabName: string) => {
    return activeTab.toLowerCase() === tabName.toLowerCase();
  };

  return (
    <aside 
      className={`bg-white text-brand-text h-full flex flex-col justify-between transition-all duration-200 z-45 shrink-0 border-r border-slate-100 shadow-[4px_0_20px_rgba(0,0,0,0.03)] overflow-hidden ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="flex flex-col h-full overflow-hidden">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="h-8 w-8 rounded-lg bg-brand-accent flex items-center justify-center shrink-0 border border-brand-border-purple/30">
              <svg className="h-4.5 w-4.5 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            {!collapsed && (
              <span className="font-extrabold text-brand-text text-lg tracking-wide uppercase font-sans">
                PULSE
              </span>
            )}
          </div>
        </div>

        {/* Scrollable Navigation Area */}
        <div className="flex-1 overflow-y-auto py-4 px-2 space-y-4 scrollbar-thin scrollbar-thumb-brand-border-purple/20">
          {/* Dashboard Home - Main button outside categories */}
          <div className="space-y-1">
            <button
              onClick={() => handleTabClick('dashboard')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer group border-l-4 relative ${
                isTabActive('dashboard')
                  ? 'bg-brand-secondary-accent/15 text-brand-accent border-brand-secondary-accent shadow-sm/5 font-extrabold' 
                  : 'hover:bg-slate-50 text-brand-text/80 hover:text-brand-text border-l-4 border-transparent'
              }`}
              title={collapsed ? 'Dashboard (Your analytical home base)' : undefined}
            >
              <LayoutDashboard 
                className={`h-4.5 w-4.5 shrink-0 transition-colors ${
                  isTabActive('dashboard') ? 'text-brand-heading' : 'text-brand-text/70 group-hover:text-brand-text'
                }`}
                strokeWidth={2}
              />
              {!collapsed && (
                <div className="text-left">
                  <span className="tracking-wide block">Dashboard</span>
                  <span className="text-[9px] text-slate-400 font-semibold block mt-0.5 leading-none">Your analytical home base</span>
                </div>
              )}
              {collapsed && (
                <div className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-[10px] rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50 whitespace-nowrap">
                  Dashboard
                </div>
              )}
            </button>
          </div>

          {/* Sections Map */}
          {sections.map((section) => (
            <div key={section.name} className="space-y-1">
              {/* Category Header */}
              {!collapsed ? (
                <h4 className="text-[9px] font-extrabold text-brand-heading/70 uppercase tracking-wider px-3 pt-2 pb-1.5 font-sans">
                  {section.name}
                </h4>
              ) : (
                <div className="h-px bg-slate-100 my-2 mx-2" />
              )}

              {/* Category Items */}
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isTabActive(item.tab);
                return (
                  <button
                    key={item.name}
                    onClick={() => handleTabClick(item.tab)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer group border-l-4 relative ${
                      active 
                        ? 'bg-brand-secondary-accent/15 text-brand-accent border-brand-secondary-accent shadow-sm/5 font-extrabold' 
                        : 'hover:bg-slate-50 text-brand-text/80 hover:text-brand-text border-l-4 border-transparent'
                    }`}
                    title={collapsed ? item.name : undefined}
                  >
                    <Icon 
                      className={`h-4.5 w-4.5 shrink-0 transition-colors ${
                        active ? 'text-brand-heading' : 'text-brand-text/70 group-hover:text-brand-text'
                      }`}
                      strokeWidth={2}
                    />
                    {!collapsed && <span className="tracking-wide">{item.name}</span>}
                    {collapsed && (
                      <div className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-[10px] rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50 whitespace-nowrap">
                        {item.name}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-slate-100 shrink-0">
        <button 
          type="button"
          onClick={() => handleTabClick('profile')}
          className="flex items-center justify-between w-full text-left cursor-pointer hover:bg-slate-50 p-1 rounded-lg transition-colors"
        >
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="h-8 w-8 rounded-full bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
              <img 
                src={profile.avatar} 
                alt={`${profile.name} Profile`} 
                className="h-full w-full object-cover"
              />
            </div>
            {!collapsed && (
              <div className="text-left overflow-hidden">
                <p className="text-xs font-extrabold text-brand-text truncate leading-tight">{profile.name}</p>
                <p className="text-[10px] text-brand-text/75 truncate mt-0.5 font-bold">{profile.role}</p>
              </div>
            )}
          </div>
          {!collapsed && (
            <span className="text-brand-text/70 hover:text-brand-text transition-colors">
              <ChevronDown className="h-4.5 w-4.5" strokeWidth={2} />
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}

