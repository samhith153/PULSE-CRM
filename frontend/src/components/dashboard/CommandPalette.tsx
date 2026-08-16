'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  LayoutDashboard,
  Activity,
  Sparkles,
  Plus,
  Search,
  CornerDownLeft,
  Clock,
  Zap,
  FilePlus2,
} from 'lucide-react';
import Fuse from 'fuse.js';
import { searchGlobalCRM } from '@/utils/api';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { type Role } from '@/lib/roles';
import { NAV_HOME, NAV_EXTRA_ITEMS, getNavSections } from '@/lib/dashboard-nav';

/* ── Types ────────────────────────────────────────────────────── */

interface CommandItem {
  id: string;
  title: string;
  description: string;
  category: 'Suggestions' | 'Navigation' | 'Search' | 'Create Quick Actions' | 'Workflow Actions' | 'Productivity';
  icon: React.ElementType;
  action: () => void;
  shortcut?: string;
  roles?: Role[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveTab: (tab: string) => void;
  onNewReportClick: () => void;
}

/* ── Recent commands helpers ──────────────────────────────────── */

const RECENT_KEY = 'pulse-crm-recent-commands';
const MAX_RECENT = 5;

function getRecentCommands(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveRecentCommand(id: string) {
  const recent = getRecentCommands().filter((r) => r !== id);
  recent.unshift(id);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
}

/* ── Palette-specific nav flavor. Tabs, labels and icons come from
      lib/dashboard-nav.ts — these only add shortcuts + descriptions. ── */
const TAB_SHORTCUTS: Record<string, string> = {
  home: 'G H',
  leads: 'G L',
  contacts: 'G C',
  companies: 'G O',
  deals: 'G D',
  tasks: 'G T',
  calendar: 'G M',
  reports: 'G R',
  settings: 'G S',
};

const TAB_DESCRIPTIONS: Record<string, string> = {
  home: 'View sales performance metrics',
  leads: 'Manage sales opportunities',
  contacts: 'Browse directory contacts list',
  companies: 'Manage accounts and organizations',
  deals: 'View active sales pipeline',
  tasks: 'Manage your active to-do lists',
  calendar: 'View calendar slots and schedules',
  activities: 'View calls, emails, and meetings',
  reports: 'View performance analytics and metrics',
  'ai insights': 'AI-powered recommendations and scoring',
  emails: 'View and manage email communications',
  settings: 'Configure integrations and workspace preferences',
  profile: 'View and edit your profile',
  documents: 'Manage files and attachments',
  workflows: 'Manage automation workflows',
};

/* ── Component ────────────────────────────────────────────────── */

export default function CommandPalette({ isOpen, onClose, setActiveTab, onNewReportClick }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [dynamicResults, setDynamicResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [recentIds, setRecentIds] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const { user: currentUser } = useCurrentUser();
  const userRole = (currentUser?.roles?.[0] as Role) || 'sales_rep';

  // Load recent commands on mount and when palette opens
  useEffect(() => {
    if (isOpen) {
      setRecentIds(getRecentCommands());
    }
  }, [isOpen]);

  /* ── Global Ctrl+K is handled by DashboardShell / page.tsx ── */

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      setSearchError(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Escape to close
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

  /* ── Theme / sidebar utilities ────────────────────────────── */

  const toggleTheme = useCallback(() => {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    localStorage.setItem('pulse-crm-theme', next);
  }, []);

  const toggleSidebar = useCallback(() => {
    const sidebarBtn = document.querySelector('[aria-label="Toggle Sidebar"]') as HTMLButtonElement;
    sidebarBtn?.click();
  }, []);

  const transitionAndEmit = useCallback(
    (tab: string, eventName: string) => {
      setActiveTab(tab);
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent(eventName));
      }, 120);
    },
    [setActiveTab],
  );

  /* ── Navigation commands — generated from lib/dashboard-nav.ts ── */

  const navCommands = useMemo<CommandItem[]>(() => {
    const commands: CommandItem[] = [];
    const push = (item: { tab: string; name: string; icon: React.ElementType }) => {
      commands.push({
        id: `nav-${item.tab}`,
        title: `Go to ${item.name}`,
        description: TAB_DESCRIPTIONS[item.tab] ?? `Navigate to ${item.name}`,
        category: 'Navigation',
        icon: item.icon,
        shortcut: TAB_SHORTCUTS[item.tab],
        action: () => { setActiveTab(item.tab); onClose(); },
      });
    };
    push(NAV_HOME);
    for (const section of getNavSections(userRole)) {
      for (const item of section.items) push(item);
    }
    for (const item of NAV_EXTRA_ITEMS) push(item);
    return commands;
  }, [userRole, setActiveTab, onClose]);

  /* ── Build static commands (memoized, role-filtered) ──────── */

  const allCommands = useMemo<CommandItem[]>(() => {
    return [
      // ── Suggestions ──
      { id: 'suggest-theme', title: 'Switch theme', description: 'Toggle light and dark appearance', category: 'Suggestions', icon: Sparkles, action: () => { toggleTheme(); onClose(); } },
      { id: 'suggest-sidebar', title: 'Toggle sidebar', description: 'Collapse or expand navigation panel', category: 'Suggestions', icon: LayoutDashboard, action: () => { toggleSidebar(); onClose(); } },
      { id: 'suggest-notif', title: 'Open notifications', description: 'View sync alerts and messages', category: 'Suggestions', icon: Activity, action: () => { setActiveTab('notifications'); onClose(); } },

      // ── Navigation (from lib/dashboard-nav.ts, role-filtered) ──
      ...navCommands,

      // ── Search ──
      { id: 'search-all', title: 'Search all records', description: 'Query companies, leads, contacts, and deals', category: 'Search', icon: Search, action: () => { setQuery(''); }, shortcut: '/' },

      // ── Create Quick Actions ──
      { id: 'create-lead', title: 'Create Lead', description: 'Create a new sales opportunity', category: 'Create Quick Actions', icon: Plus, action: () => { transitionAndEmit('leads', 'pulse-open-create-lead-modal'); onClose(); }, shortcut: 'N L' },
      { id: 'create-contact', title: 'Create Contact', description: 'Add new client contact profile', category: 'Create Quick Actions', icon: Plus, action: () => { transitionAndEmit('contacts', 'pulse-open-create-contact-modal'); onClose(); }, shortcut: 'N C' },
      { id: 'create-company', title: 'Create Company', description: 'Add new business account profile', category: 'Create Quick Actions', icon: Plus, action: () => { transitionAndEmit('companies', 'pulse-open-create-company-modal'); onClose(); }, shortcut: 'N O' },
      { id: 'create-task', title: 'Create Task', description: 'Create to-do checklist item', category: 'Create Quick Actions', icon: Plus, action: () => { transitionAndEmit('tasks', 'pulse-open-create-task-modal'); onClose(); }, shortcut: 'N T' },
      { id: 'create-meeting', title: 'Create Meeting', description: 'Schedule new calendar event', category: 'Create Quick Actions', icon: Plus, action: () => { transitionAndEmit('activities', 'pulse-open-create-meeting-modal'); onClose(); }, shortcut: 'N M' },
      { id: 'create-note', title: 'Create Note', description: 'Write details to active lead timeline', category: 'Create Quick Actions', icon: Plus, action: () => { transitionAndEmit('leads', 'pulse-open-create-note-modal'); onClose(); } },
      { id: 'create-report', title: 'New Report', description: 'Build a custom analytics report', category: 'Create Quick Actions', icon: FilePlus2, action: () => { onNewReportClick(); onClose(); }, shortcut: 'N R' },

      // ── Workflow Actions ──
      { id: 'flow-tag', title: 'Add tag', description: 'Categorize selected record', category: 'Workflow Actions', icon: Zap, action: () => { alert('Tag added successfully.'); onClose(); } },
      { id: 'flow-status', title: 'Change status', description: 'Update current stage', category: 'Workflow Actions', icon: Zap, action: () => { alert('Status modified successfully.'); onClose(); } },
      { id: 'flow-owner', title: 'Assign owner', description: 'Assign manager/representative to lead', category: 'Workflow Actions', icon: Zap, action: () => { alert('Record owner assigned.'); onClose(); } },
      { id: 'flow-priority', title: 'Set priority', description: 'Modify priority tier level', category: 'Workflow Actions', icon: Zap, action: () => { alert('Priority level set.'); onClose(); } },

      // ── Productivity ──
      { id: 'prod-theme', title: 'Switch theme', description: 'Toggle light and dark mode', category: 'Productivity', icon: Sparkles, action: () => { toggleTheme(); onClose(); }, shortcut: 'Shift+T' },
      { id: 'prod-sidebar', title: 'Toggle sidebar', description: 'Collapse/expand left navigation panel', category: 'Productivity', icon: LayoutDashboard, action: () => { toggleSidebar(); onClose(); } },
    ];
  }, [setActiveTab, onClose, toggleTheme, toggleSidebar, transitionAndEmit, navCommands, onNewReportClick]);

  // Filter commands by user role
  const roleFilteredCommands = useMemo(() => {
    return allCommands.filter((cmd) => {
      if (!cmd.roles) return true;
      return cmd.roles.includes(userRole);
    });
  }, [allCommands, userRole]);

  /* ── Fuzzy search (Fuse.js) for static commands ──────────── */

  const fuse = useMemo(
    () =>
      new Fuse(roleFilteredCommands, {
        keys: ['title', 'description', 'category'],
        threshold: 0.4,
        includeScore: true,
      }),
    [roleFilteredCommands],
  );

  const staticFiltered = useMemo(() => {
    if (!query.trim()) return roleFilteredCommands;
    return fuse.search(query).map((r) => r.item);
  }, [query, fuse, roleFilteredCommands]);

  /* ── Backend search (debounced, abortable) ────────────────── */

  useEffect(() => {
    // Cancel any in-flight request
    abortRef.current?.abort();

    if (query.trim().length < 2) {
      setDynamicResults([]);
      setSearchError(null);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    const fetchSearchResults = async () => {
      setIsSearching(true);
      setSearchError(null);
      try {
        const results = await searchGlobalCRM(query.trim());
        if (!controller.signal.aborted) {
          const formattedDynamic = (results || []).map((item: any) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            category: item.category as any,
            icon: Search,
            action: () => {
              setActiveTab(item.type);
              setTimeout(() => {
                window.dispatchEvent(
                  new CustomEvent('pulse-open-record', {
                    detail: { id: item.db_id, type: item.type },
                  }),
                );
              }, 120);
              onClose();
            },
          }));
          setDynamicResults(formattedDynamic);
          setActiveIndex(0);
        }
      } catch (error: any) {
        if (!controller.signal.aborted && error?.name !== 'AbortError') {
          console.error('Search failed:', error);
          setSearchError('Unable to search records right now.');
          setDynamicResults([]);
        }
      } finally {
        if (!controller.signal.aborted) setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(fetchSearchResults, 300);
    return () => {
      controller.abort();
      clearTimeout(debounceTimer);
    };
  }, [query, setActiveTab, onClose]);

  /* ── Combined results ─────────────────────────────────────── */

  const filtered = useMemo(() => {
    const hasQuery = query.trim().length > 0;
    const items: any[] = [];

    // Show recent commands when no query
    if (!hasQuery && recentIds.length > 0) {
      const recentCommands = recentIds
        .map((id) => roleFilteredCommands.find((c) => c.id === id))
        .filter(Boolean) as CommandItem[];
      if (recentCommands.length > 0) {
        items.push(
          ...recentCommands.map((cmd) => ({ ...cmd, category: 'Recent' as const, icon: Clock })),
        );
      }
    }

    // Dynamic backend results
    if (hasQuery && query.trim().length >= 2) {
      items.push(...dynamicResults);
    }

    // Static filtered results
    items.push(...staticFiltered);

    // Deduplicate by id (backend results may overlap with static)
    const seen = new Set<string>();
    return items.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [query, recentIds, dynamicResults, staticFiltered, roleFilteredCommands]);

  /* ── Keyboard navigation ──────────────────────────────────── */

  const executeCommand = useCallback(
    (item: any) => {
      saveRecentCommand(item.id);
      item.action();
    },
    [],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = (activeIndex + 1) % (filtered.length || 1);
      setActiveIndex(next);
      scrollActiveIntoView(next);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = (activeIndex - 1 + filtered.length) % (filtered.length || 1);
      setActiveIndex(prev);
      scrollActiveIntoView(prev);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[activeIndex]) {
        executeCommand(filtered[activeIndex]);
      }
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActiveIndex(0);
      scrollActiveIntoView(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      const last = filtered.length - 1;
      setActiveIndex(last);
      scrollActiveIntoView(last);
    }
  };

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

  if (!isOpen) return null;

  /* ── Render ────────────────────────────────────────────────── */

  return (
    <div
      className="fixed inset-0 bg-ink/40 z-50 flex items-start justify-center pt-24 px-4 modal-backdrop-animate"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div className="bg-surface-1 border border-border-default w-full max-w-md rounded-xl overflow-hidden modal-content-animate flex flex-col max-h-[420px] shadow-float">
        {/* Search header bar */}
        <div className="relative border-b border-border-default flex items-center shrink-0">
          <div className="absolute left-4 text-text-muted">
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
            className="w-full pl-11 pr-20 py-3.5 text-xs text-text-primary bg-surface-1 placeholder-text-muted focus:outline-none font-medium"
            role="combobox"
            aria-expanded={true}
            aria-controls="command-list"
            aria-activedescendant={filtered[activeIndex] ? `cmd-${filtered[activeIndex].id}` : undefined}
          />

          {/* Loading Spinner */}
          {isSearching && (
            <div className="absolute right-12 flex items-center pointer-events-none">
              <div className="h-4 w-4 border-2 border-accent-color border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          <div className="absolute right-4 flex items-center space-x-1.5 pointer-events-none">
            <span className="text-[9px] font-bold text-text-muted bg-surface-2 border border-border-default px-1 py-0.5 rounded">ESC</span>
          </div>
        </div>

        {/* Results list */}
        <div
          ref={listRef}
          id="command-list"
          role="listbox"
          className="flex-1 overflow-y-auto p-2.5 space-y-0.5"
        >
          {/* Error state */}
          {searchError && (
            <div className="py-4 px-3 text-center">
              <p className="text-xs text-destructive font-semibold">{searchError}</p>
              <p className="text-[10px] text-text-muted mt-1">Try a different search term.</p>
            </div>
          )}

          {/* Results */}
          {!searchError && filtered.length > 0 ? (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              const isActive = idx === activeIndex;
              const showHeader = idx === 0 || filtered[idx - 1].category !== item.category;

              return (
                <div key={item.id} role="option" aria-selected={isActive} id={`cmd-${item.id}`}>
                  {showHeader && (
                    <p className="text-[9px] font-bold text-text-muted/60 uppercase tracking-widest px-3 py-1.5 select-none mt-2 first:mt-0">
                      {item.category}
                    </p>
                  )}
                  <button
                    onClick={() => executeCommand(item)}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => handleItemHover(idx)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left select-none cursor-pointer transition duration-150 cmd-item ${
                      isActive
                        ? 'bg-accent-color/[0.08] text-accent-color border-l-3 border-accent-color pl-2'
                        : 'text-text-primary hover:bg-surface-2 hover:text-text-primary border-l-3 border-transparent'
                    }`}
                    role="option"
                    aria-selected={isActive}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div
                        className={`p-1.5 rounded-md ${
                          isActive ? 'bg-accent-color/15 text-accent-color' : 'bg-surface-2/80 text-text-secondary'
                        }`}
                      >
                        <Icon className="h-4 w-4" strokeWidth={isActive ? 2.25 : 1.75} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate leading-tight">{item.title}</p>
                        <p className="text-[10px] text-text-secondary font-semibold truncate mt-0.5 leading-none">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      {item.shortcut && (
                        <span className="text-[9px] font-bold text-text-secondary/70 bg-surface-2 border border-border-default px-1.5 py-0.5 rounded hidden sm:inline">
                          {item.shortcut}
                        </span>
                      )}
                      {isActive && (
                        <CornerDownLeft className="h-3.5 w-3.5 text-accent-color animate-pulse shrink-0" strokeWidth={2.25} />
                      )}
                    </div>
                  </button>
                </div>
              );
            })
          ) : (
            !searchError && (
              <div className="py-8 text-center text-xs text-text-muted font-semibold">
                {query.trim() ? (
                  <>No results found matching &ldquo;{query}&rdquo;</>
                ) : (
                  'Type to search commands and records...'
                )}
              </div>
            )
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2 border-t border-border-default bg-surface-2 flex items-center justify-between text-[9px] text-text-muted font-bold shrink-0">
          <div className="flex space-x-3">
            <span className="flex items-center gap-1">
              <kbd className="bg-surface-1 border border-border-default px-1 py-0.5 rounded">↑↓</kbd> Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-surface-1 border border-border-default px-1 py-0.5 rounded">↵</kbd> Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-surface-1 border border-border-default px-1 py-0.5 rounded">⌘K</kbd> Open
            </span>
          </div>
          <span>Pulse CRM</span>
        </div>
      </div>
    </div>
  );
}
