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
  CornerDownLeft,
  Calendar
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

  // Global theme switch utility
  const toggleTheme = () => {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('pulse-crm-theme', next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Global sidebar toggle utility
  const toggleSidebar = () => {
    const sidebarBtn = document.querySelector('[aria-label="Toggle Sidebar"]') as HTMLButtonElement;
    sidebarBtn?.click();
  };

  // Helper to change tab and dispatch event for modal loading
  const transitionAndEmit = (tab: string, eventName: string) => {
    setActiveTab(tab);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent(eventName));
    }, 120);
  };

  const searchItems = [
    // Dynamic top suggestions
    { id: 'suggest-theme', title: 'Switch theme', description: 'Toggle light and dark appearance', category: 'Suggestions' as const, icon: Sparkles, action: () => { toggleTheme(); onClose(); } },
    { id: 'suggest-sidebar', title: 'Toggle sidebar', description: 'Collapse or expand navigation panel', category: 'Suggestions' as const, icon: LayoutDashboard, action: () => { toggleSidebar(); onClose(); } },
    { id: 'suggest-notif', title: 'Open notifications', description: 'View sync alerts and messages', category: 'Suggestions' as const, icon: Activity, action: () => { setActiveTab('notifications'); onClose(); } },
    
    // Navigation
    { id: 'nav-dashboard', title: 'Go to Dashboard', description: 'View sales performance metrics', category: 'Navigation' as const, icon: LayoutDashboard, action: () => { setActiveTab('dashboard'); onClose(); } },
    { id: 'nav-leads', title: 'Open Leads', description: 'Manage sales opportunities', category: 'Navigation' as const, icon: Users, action: () => { setActiveTab('leads'); onClose(); } },
    { id: 'nav-contacts', title: 'Open Contacts', description: 'Browse directory contacts list', category: 'Navigation' as const, icon: Contact, action: () => { setActiveTab('contacts'); onClose(); } },
    { id: 'nav-companies', title: 'Open Companies', description: 'Manage accounts and organizations', category: 'Navigation' as const, icon: Building2, action: () => { setActiveTab('companies'); onClose(); } },
    { id: 'nav-invoices', title: 'Open Invoices', description: 'Check statement logs and billing details', category: 'Navigation' as const, icon: FileText, action: () => { alert('Invoices view is being initialized.'); onClose(); } },
    { id: 'nav-tasks', title: 'Open Tasks', description: 'Manage your active to-do lists', category: 'Navigation' as const, icon: FileText, action: () => { setActiveTab('tasks'); onClose(); } },
    { id: 'nav-meetings', title: 'Open Meetings', description: 'View calendar slots and schedules', category: 'Navigation' as const, icon: Calendar, action: () => { setActiveTab('calendar'); onClose(); } },
    { id: 'nav-reports', title: 'Open Reports', description: 'View performance analytics and metrics', category: 'Navigation' as const, icon: BarChart3, action: () => { setActiveTab('reports'); onClose(); } },
    { id: 'nav-settings', title: 'Open Settings', description: 'Configure integrations and workspace preferences', category: 'Navigation' as const, icon: Settings, action: () => { setActiveTab('settings'); onClose(); } },
    
    // Search pre-fills
    { id: 'search-all', title: 'Search all records', description: 'Query companies, leads, and contacts', category: 'Search' as const, icon: Search, action: () => { setQuery(''); inputRef.current?.focus(); } },
    { id: 'search-customers', title: 'Search customers', description: 'Filter contacts directory', category: 'Search' as const, icon: Search, action: () => { setQuery('contacts: '); inputRef.current?.focus(); } },
    { id: 'search-invoices', title: 'Search invoices', description: 'Query invoice records', category: 'Search' as const, icon: Search, action: () => { setQuery('invoices: '); inputRef.current?.focus(); } },
    { id: 'search-tasks', title: 'Search tasks', description: 'Query your to-do items', category: 'Search' as const, icon: Search, action: () => { setQuery('tasks: '); inputRef.current?.focus(); } },
    { id: 'search-meetings', title: 'Search meetings', description: 'Query calendar events', category: 'Search' as const, icon: Search, action: () => { setQuery('meetings: '); inputRef.current?.focus(); } },
    { id: 'search-notes', title: 'Search notes or activity logs', description: 'Filter history files log', category: 'Search' as const, icon: Search, action: () => { setQuery('notes: '); inputRef.current?.focus(); } },

    // Create Quick Actions
    { id: 'create-lead', title: 'New Lead', description: 'Create a new sales opportunity', category: 'Create Quick Actions' as const, icon: Plus, action: () => { transitionAndEmit('leads', 'pulse-open-create-lead-modal'); onClose(); } },
    { id: 'create-invoice', title: 'New Invoice', description: 'Generate billing statement', category: 'Create Quick Actions' as const, icon: Plus, action: () => { alert('New Invoice window created.'); onClose(); } },
    { id: 'create-task', title: 'New Task', description: 'Create to-do checklist item', category: 'Create Quick Actions' as const, icon: Plus, action: () => { transitionAndEmit('tasks', 'pulse-open-create-task-modal'); onClose(); } },
    { id: 'create-meeting', title: 'New Meeting', description: 'Schedule new calendar event', category: 'Create Quick Actions' as const, icon: Plus, action: () => { transitionAndEmit('activities', 'pulse-open-create-meeting-modal'); onClose(); } },
    { id: 'create-customer', title: 'New Customer', description: 'Add new client contact profile', category: 'Create Quick Actions' as const, icon: Plus, action: () => { transitionAndEmit('contacts', 'pulse-open-create-contact-modal'); onClose(); } },
    { id: 'create-company', title: 'New Company', description: 'Add new business account profile', category: 'Create Quick Actions' as const, icon: Plus, action: () => { transitionAndEmit('companies', 'pulse-open-create-company-modal'); onClose(); } },
    { id: 'create-note', title: 'New Note', description: 'Write details to active lead timeline', category: 'Create Quick Actions' as const, icon: Plus, action: () => { transitionAndEmit('leads', 'pulse-open-create-note-modal'); onClose(); } },

    // Workflow Actions
    { id: 'flow-tag', title: 'Add tag', description: 'Categorize selected record', category: 'Workflow Actions' as const, icon: Sparkles, action: () => { alert('Tag added successfully.'); onClose(); } },
    { id: 'flow-status', title: 'Change status', description: 'Update current stage', category: 'Workflow Actions' as const, icon: Sparkles, action: () => { alert('Status modified successfully.'); onClose(); } },
    { id: 'flow-owner', title: 'Assign owner', description: 'Assign manager/representative to lead', category: 'Workflow Actions' as const, icon: Sparkles, action: () => { alert('Record owner assigned.'); onClose(); } },
    { id: 'flow-priority', title: 'Set priority', description: 'Modify priority tier level', category: 'Workflow Actions' as const, icon: Sparkles, action: () => { alert('Priority level set.'); onClose(); } },
    { id: 'flow-paid', title: 'Mark as paid', description: 'Clear selected billing statement', category: 'Workflow Actions' as const, icon: Sparkles, action: () => { alert('Invoice marked as paid.'); onClose(); } },
    { id: 'flow-done', title: 'Mark as completed', description: 'Resolve selected task checklist', category: 'Workflow Actions' as const, icon: Sparkles, action: () => { alert('Task resolved successfully.'); onClose(); } },
    { id: 'flow-follow', title: 'Schedule follow-up', description: 'Book call alert for deal', category: 'Workflow Actions' as const, icon: Sparkles, action: () => { alert('Follow-up scheduled.'); onClose(); } },

    // Productivity Actions
    { id: 'prod-recent', title: 'Show recent items', description: 'Load historical pages list', category: 'Productivity' as const, icon: Activity, action: () => { alert('Recent items displayed.'); onClose(); } },
    { id: 'prod-pinned', title: 'Show pinned items', description: 'Load bookmarked deals', category: 'Productivity' as const, icon: Activity, action: () => { alert('Pinned items displayed.'); onClose(); } },
    { id: 'prod-notif', title: 'Open notifications', description: 'Show alerts and sync signals', category: 'Productivity' as const, icon: Activity, action: () => { setActiveTab('notifications'); onClose(); } },
    { id: 'prod-shortcuts', title: 'Open shortcuts/help', description: 'Keyboard shortcut guide', category: 'Productivity' as const, icon: Activity, action: () => { alert('Shortcuts Guide:\n⌘K : Command Palette\nESC : Close Modal\n↑↓ : Navigate\nEnter : Execute'); onClose(); } },
    { id: 'prod-theme', title: 'Switch theme', description: 'Toggle light and dark mode', category: 'Productivity' as const, icon: Activity, action: () => { toggleTheme(); onClose(); } },
    { id: 'prod-sidebar', title: 'Toggle sidebar', description: 'Collapse/expand left navigation panel', category: 'Productivity' as const, icon: Activity, action: () => { toggleSidebar(); onClose(); } },
    { id: 'prod-history', title: 'Open command history', description: 'View executed actions log', category: 'Productivity' as const, icon: Activity, action: () => { alert('Command history loaded.'); onClose(); } },
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
      scrollActiveIntoView((activeIndex + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 + filtered.length) % filtered.length);
      scrollActiveIntoView((activeIndex - 1 + filtered.length) % filtered.length);
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
    const items = listRef.current.querySelectorAll('.cmd-item');
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
      className="fixed inset-0 bg-ink/40 z-50 flex items-start justify-center pt-24 px-4 modal-backdrop-animate"
      onClick={handleBackdropClick}
    >
      <div className="bg-card border border-border w-full max-w-md rounded-xl overflow-hidden modal-content-animate flex flex-col max-h-[420px] shadow-float">
        {/* Search header bar */}
        <div className="relative border-b border-border flex items-center shrink-0">
          <div className="absolute left-4 text-muted-foreground">
            <Search className="h-4.5 w-4.5" strokeWidth={2} />
          </div>
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="w-full pl-11 pr-20 py-3.5 text-xs text-foreground bg-card placeholder-slate-400 focus:outline-none font-medium"
          />
          <div className="absolute right-4 flex items-center space-x-1.5 pointer-events-none">
            <span className="text-[9px] font-bold text-muted-foreground bg-secondary border border-border px-1 py-0.5 rounded ">ESC</span>
          </div>
        </div>

        {/* Results list */}
        <div 
          ref={listRef}
          className="flex-1 overflow-y-auto p-2.5 space-y-0.5"
        >
          {filtered.length > 0 ? (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              const isActive = idx === activeIndex;
              const showHeader = idx === 0 || filtered[idx - 1].category !== item.category;
              
              return (
                <div key={item.id}>
                  {showHeader && (
                    <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest px-3 py-1.5 select-none mt-2 first:mt-0">{item.category}</p>
                  )}
                  <button
                    onClick={item.action}
                    onMouseEnter={() => handleItemHover(idx)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left select-none cursor-pointer transition duration-150 cmd-item ${
                      isActive 
                        ? 'bg-brand-blue/[0.08] text-brand-blue border-l-3 border-brand-blue pl-2' 
                        : 'text-muted-foreground/75 hover:bg-secondary hover:text-muted-foreground border-l-3 border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className={`p-1.5 rounded-md ${
                        isActive ? 'bg-brand-blue/15 text-brand-blue' : 'bg-secondary/80 text-slate-550'
                      }`}>
                        <Icon className="h-4 w-4" strokeWidth={isActive ? 2.25 : 1.75} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate leading-tight">{item.title}</p>
                        <p className="text-[10px] text-muted-foreground font-semibold truncate mt-0.5 leading-none">{item.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 shrink-0">
                      {isActive && (
                        <CornerDownLeft className="h-3.5 w-3.5 text-brand-blue animate-pulse shrink-0" strokeWidth={2.25} />
                      )}
                    </div>
                  </button>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-xs text-muted-foreground font-semibold">
              No results found matching "{query}"
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2 border-t border-border bg-secondary flex items-center justify-between text-[9px] text-muted-foreground font-bold shrink-0">
          <div className="flex space-x-3">
            <span className="flex items-center gap-1"><kbd className="bg-card border border-border px-1 py-0.5 rounded ">↑↓</kbd> Navigate</span>
            <span className="flex items-center gap-1"><kbd className="bg-card border border-border px-1 py-0.5 rounded ">↵</kbd> Select</span>
          </div>
          <span>Pulse CRM Commands</span>
        </div>
      </div>
    </div>
  );
}
