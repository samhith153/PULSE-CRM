'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  User,
  Plus,
  Search,
  CornerDownLeft
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveTab: (tab: string) => void;
  onNewReportClick: () => void;
}

export default function CommandPalette({ isOpen, onClose, setActiveTab, onNewReportClick }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global listener for Escape to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const searchItems = [
    // Navigation
    { id: 'nav-dashboard', title: 'Go to Dashboard', description: 'View sales performance and widgets', category: 'Navigation' as const, icon: LayoutDashboard, action: () => { setActiveTab('dashboard'); onClose(); } },
    { id: 'nav-leads', title: 'Go to Leads', description: 'Manage inbound unqualified leads', category: 'Navigation' as const, icon: Users, action: () => { setActiveTab('leads'); onClose(); } },
    { id: 'nav-contacts', title: 'Go to Contacts', description: 'View client personnel profiles', category: 'Navigation' as const, icon: Contact, action: () => { setActiveTab('contacts'); onClose(); } },
    { id: 'nav-companies', title: 'Go to Companies', description: 'Browse and edit organizations', category: 'Navigation' as const, icon: Building2, action: () => { setActiveTab('companies'); onClose(); } },
    { id: 'nav-deals', title: 'Go to Deals & Pipeline', description: 'Track deal stages and opportunities', category: 'Navigation' as const, icon: Layers, action: () => { setActiveTab('deals'); onClose(); } },
    { id: 'nav-products', title: 'Go to Products', description: 'Browse company product pricing tiers', category: 'Navigation' as const, icon: Package, action: () => { setActiveTab('products'); onClose(); } },
    { id: 'nav-activities', title: 'Go to Activities', description: 'View tasks, calls, and calendar', category: 'Navigation' as const, icon: Activity, action: () => { setActiveTab('activities'); onClose(); } },
    { id: 'nav-emails', title: 'Go to Emails', description: 'Read synced communications', category: 'Navigation' as const, icon: Mail, action: () => { setActiveTab('emails'); onClose(); } },
    { id: 'nav-workflows', title: 'Go to Workflows', description: 'Configure trigger actions and automations', category: 'Navigation' as const, icon: GitBranch, action: () => { setActiveTab('workflows'); onClose(); } },
    { id: 'nav-ai', title: 'Go to AI Insights', description: 'Read system generated predictions', category: 'Navigation' as const, icon: Sparkles, action: () => { setActiveTab('ai insights'); onClose(); } },
    { id: 'nav-reports', title: 'Go to Reports & Analytics', description: 'View conversion rates and forecasts', category: 'Navigation' as const, icon: BarChart3, action: () => { setActiveTab('reports'); onClose(); } },
    { id: 'nav-documents', title: 'Go to Documents', description: 'Browse deal templates and attachments', category: 'Navigation' as const, icon: FileText, action: () => { setActiveTab('documents'); onClose(); } },
    { id: 'nav-settings', title: 'Go to Settings', description: 'Manage workspace integrations', category: 'Navigation' as const, icon: Settings, action: () => { setActiveTab('settings'); onClose(); } },
    { id: 'nav-profile', title: 'Go to Profile', description: 'Manage personal credentials', category: 'Navigation' as const, icon: User, action: () => { setActiveTab('profile'); onClose(); } },
    
    // Actions
    { id: 'act-report', title: 'Create New Report', description: 'Open the custom report builder dialog', category: 'Actions' as const, icon: Plus, action: () => { onNewReportClick(); onClose(); } },
    
    // Mocks / Entities
    { id: 'lead-acme', title: 'Acme Enterprise (Lead)', description: 'Status: Contacted | ₹120,000 value', category: 'Leads' as const, icon: Users, action: () => { setActiveTab('leads'); onClose(); } },
    { id: 'lead-bigtech', title: 'Big Tech SaaS Upgrade (Lead)', description: 'Status: New | ₹85,000 value', category: 'Leads' as const, icon: Users, action: () => { setActiveTab('leads'); onClose(); } },
    { id: 'contact-bruce', title: 'Bruce Wayne (Contact)', description: 'Wayne Enterprises | bwayne@wayne.com', category: 'Contacts' as const, icon: Contact, action: () => { setActiveTab('contacts'); onClose(); } },
    { id: 'contact-sarah', title: 'Sarah Johnson (Contact)', description: 'Acme Corp | sjohnson@acme.com', category: 'Contacts' as const, icon: Contact, action: () => { setActiveTab('contacts'); onClose(); } },
    { id: 'company-wayne', title: 'Wayne Enterprises (Company)', description: 'Domain: wayne.com | Gotham City', category: 'Companies' as const, icon: Building2, action: () => { setActiveTab('companies'); onClose(); } },
    { id: 'company-acme', title: 'Acme Corp (Company)', description: 'Domain: acme.com | Manufacturing', category: 'Companies' as const, icon: Building2, action: () => { setActiveTab('companies'); onClose(); } },
    { id: 'deal-saas', title: 'Enterprise SaaS Upgrade (Deal)', description: 'Stage: Qualified | ₹120,000 value', category: 'Deals' as const, icon: Layers, action: () => { setActiveTab('deals'); onClose(); } },
    { id: 'deal-logistics', title: 'Global Logistics API (Deal)', description: 'Stage: Negotiation | ₹380,000 value', category: 'Deals' as const, icon: Layers, action: () => { setActiveTab('deals'); onClose(); } }
  ];

  // Filter items based on search query
  const filtered = searchItems.filter(item => {
    const searchString = `${item.title} ${item.description} ${item.category}`.toLowerCase();
    return searchString.includes(query.toLowerCase());
  });

  // Handle arrow keys and enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 + filtered.length) % filtered.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[activeIndex]) {
        filtered[activeIndex].action();
      }
    }
  };

  // Scroll active item into view inside the list
  const scrollActiveIntoView = (index: number) => {
    if (!listRef.current) return;
    const items = listRef.current.children;
    const activeItem = items[index] as HTMLElement;
    if (!activeItem) return;

    const listHeight = listRef.current.clientHeight;
    const scrollTop = listRef.current.scrollTop;
    const itemHeight = activeItem.clientHeight;
    const itemTop = activeItem.offsetTop;

    if (itemTop < scrollTop) {
      listRef.current.scrollTop = itemTop;
    } else if (itemTop + itemHeight > scrollTop + listHeight) {
      listRef.current.scrollTop = itemTop + itemHeight - listHeight;
    }
  };

  // Update active index and scroll into view when index changes
  const handleItemHover = (index: number) => {
    setActiveIndex(index);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-start justify-center pt-24 px-4 transition-all duration-300 animate-in fade-in"
      onClick={handleBackdropClick}
    >
      <div className="bg-white border border-brand-border-purple/30 w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[380px]">
        {/* Search header bar */}
        <div className="relative border-b border-brand-border-purple/15 flex items-center shrink-0">
          <div className="absolute left-4 text-slate-400">
            <Search className="h-4.5 w-4.5" strokeWidth={2} />
          </div>
          <input
            ref={inputRef}
            type="text"
            placeholder="Type to search dashboard, pages, leads, or deals..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="w-full pl-11 pr-20 py-3.5 text-xs text-brand-text bg-white placeholder-slate-400 focus:outline-none"
          />
          <div className="absolute right-4 flex items-center space-x-1.5 pointer-events-none">
            <span className="text-[9px] font-bold text-slate-400 bg-slate-50 border border-brand-border-purple/20 px-1 py-0.5 rounded shadow-sm/5">ESC</span>
          </div>
        </div>

        {/* Results list */}
        <div 
          ref={listRef}
          className="flex-1 overflow-y-auto p-2.5 space-y-0.5"
        >
          {query.trim() === '' ? (
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-2">
              <div className="p-2 bg-brand-accent/5 rounded-full border border-brand-border-purple/15 text-brand-accent/60">
                <Search className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-brand-text">Search Pulse CRM</p>
                <p className="text-[10px] text-slate-400 font-semibold max-w-[240px]">Search pages, leads, contacts, companies, and deals...</p>
              </div>
            </div>
          ) : filtered.length > 0 ? (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              const isActive = idx === activeIndex;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => handleItemHover(idx)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left select-none cursor-pointer transition-all duration-150 ${
                    isActive 
                      ? 'bg-brand-accent/10 text-brand-accent border-l-3 border-brand-accent pl-2' 
                      : 'text-brand-text/75 hover:bg-slate-50 hover:text-brand-text border-l-3 border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={`p-1.5 rounded-md ${
                      isActive ? 'bg-brand-accent/15 text-brand-accent' : 'bg-slate-100/80 text-slate-550'
                    }`}>
                      <Icon className="h-4 w-4" strokeWidth={isActive ? 2.25 : 1.75} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate leading-tight">{item.title}</p>
                      <p className="text-[10px] text-slate-400 font-semibold truncate mt-0.5 leading-none">{item.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 shrink-0">
                    <span className={`text-[9px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded border ${
                      isActive 
                        ? 'bg-brand-accent/10 border-brand-accent/25 text-brand-accent' 
                        : 'bg-slate-50 border-brand-border-purple/15 text-slate-500'
                    }`}>
                      {item.category}
                    </span>
                    {isActive && (
                      <CornerDownLeft className="h-3.5 w-3.5 text-brand-accent animate-pulse shrink-0" strokeWidth={2.25} />
                    )}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="py-8 text-center text-xs text-slate-400 font-semibold">
              No results found matching "{query}"
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2 border-t border-brand-border-purple/10 bg-slate-50 flex items-center justify-between text-[9px] text-slate-400 font-bold shrink-0">
          <div className="flex space-x-3">
            <span className="flex items-center gap-1"><kbd className="bg-white border border-brand-border-purple/20 px-1 py-0.5 rounded shadow-sm/5">↑↓</kbd> Navigate</span>
            <span className="flex items-center gap-1"><kbd className="bg-white border border-brand-border-purple/20 px-1 py-0.5 rounded shadow-sm/5">↵</kbd> Select</span>
          </div>
          <span>Pulse CRM Commands</span>
        </div>
      </div>
    </div>
  );
}
