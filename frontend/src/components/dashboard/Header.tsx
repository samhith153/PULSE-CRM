'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Search, Bell, Menu,
  TrendingUp, User, LogOut,
  Sun, Moon, UserPlus, Mail
} from 'lucide-react';
import { useCurrentUser, userInitials } from '@/hooks/useCurrentUser';
import { useNotifications } from '@/hooks/useNotifications';
import { resolveImageUrl } from '@/utils/api';
import { cn } from '@/lib/utils';

interface HeaderProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  onTabChange?: (tab: string) => void;
  onOpenCommandPalette?: () => void;
  onSignOut?: () => void;
  userRole: 'sales_rep' | 'manager' | 'admin';
}

export default function Header({
  collapsed,
  setCollapsed,
  onTabChange,
  onOpenCommandPalette,
  onSignOut,
  userRole,
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [syncSeconds, setSyncSeconds] = useState(2);
  const [isSyncing, setIsSyncing] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(
    () => (typeof document !== 'undefined'
      ? (document.documentElement.classList.contains('dark') ? 'light' : 'light')
      : 'light')
  );

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { user: currentUser } = useCurrentUser();
  const { notifications: notifItems, unreadCount, markAllRead } = useNotifications(10);

  const profileName = currentUser?.full_name || 'User';
  const profileEmail = currentUser?.email || '';
  const profileInitials = userInitials(currentUser?.full_name);

  useEffect(() => {
    setTheme('light');
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.classList.remove('dark');
    localStorage.setItem('pulse-crm-theme', 'light');
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setSyncSeconds((prev) => {
        if (prev >= 14) {
          setIsSyncing(true);
          setTimeout(() => setIsSyncing(false), 1200);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setShowNotifications(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setShowProfileMenu(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Ctrl+K listener is handled in DashboardShell (parent) to avoid duplicates.

  const toggleTheme = () => {
    setTheme('light');
    localStorage.setItem('pulse-crm-theme', 'light');
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.classList.remove('dark');
  };

  const btn = cn(
    'grid shrink-0 size-9 place-items-center rounded-full border border-border-default bg-surface-1',
    'text-text-secondary shadow-sm transition-all hover:bg-surface-hover hover:text-text-primary cursor-pointer',
  );

  return (
    /* ui.md §6: 72px height, white surface, no shadow */
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border-default bg-surface-1/90 px-4 py-3 backdrop-blur-md md:px-6" style={{ height: '72px' }}>
      {/* Sidebar toggle */}
      <button onClick={() => setCollapsed(!collapsed)} className={btn} aria-label="Toggle Sidebar">
        <Menu size={16} strokeWidth={1.75} />
      </button>

      {/* Search — ui.md §6: pill, surface-secondary fill, radius-full */}
      <div
        className="flex flex-1 h-10 items-center gap-2 rounded-full border border-border-default bg-surface-2 px-4 shadow-sm cursor-pointer hover:bg-surface-hover hover:border-accent-color/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-color/20 focus-visible:border-accent-color transition-all text-left"
        onClick={() => onOpenCommandPalette?.()}
        aria-label="Search CRM records"
      >
        <Search size={15} className="shrink-0 text-text-muted" />
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search leads, contacts, companies, deals..."
          readOnly
          onClick={() => onOpenCommandPalette?.()}
          className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none cursor-pointer"
        />
        <span className="hidden shrink-0 rounded-md bg-surface-1 px-1.5 py-0.5 text-[11px] font-semibold text-text-muted border border-border-default sm:inline">⌘K</span>
      </div>

      {/* Right cluster */}
      <div className="flex shrink-0 items-center gap-2">
        {/* Sync badge — ui.md §9 trend badge style */}
        <span className="hidden lg:inline-flex items-center gap-1.5 rounded-full border border-border-default bg-surface-1 px-2.5 py-1 text-[11px] font-semibold text-accent-color select-none min-w-[110px]">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-color opacity-60"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent-color"></span>
          </span>
          <span>{isSyncing ? 'Syncing...' : `Updated ${syncSeconds}s ago`}</span>
        </span>

        {/* Role badge */}
        <span className="hidden lg:inline-flex items-center gap-1.5 rounded-full border border-border-default bg-surface-1 px-3 py-1.5 text-xs font-medium text-text-muted select-none">
          <span className="size-2 rounded-full bg-status-success-text animate-pulse" />
          Role: <span className="font-semibold text-text-primary">
            {userRole === 'sales_rep' ? 'Sales Rep' : userRole === 'manager' ? 'Sales Manager' : 'Admin'}
          </span>
        </span>

        {/* Theme */}
        <button onClick={toggleTheme} className={btn} aria-label="Toggle theme">
          {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button onClick={() => setShowNotifications(!showNotifications)} className={cn(btn, 'relative')} aria-label="Notifications">
            <Bell size={15} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 grid size-4 place-items-center rounded-full bg-brand text-[9px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {showNotifications && (
            <div className="absolute right-0 top-11 w-80 bg-surface-1 border border-border-default rounded-[12px] shadow-popover overflow-hidden z-50">
              <div className="px-4 py-3 bg-surface-2 border-b border-border-default flex justify-between items-center">
                <span className="font-semibold text-text-primary text-xs">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-[11px] bg-accent-muted text-accent-color px-2 py-0.5 rounded-full font-semibold">{unreadCount} New</span>
                )}
              </div>
              <div className="divide-y divide-border-subtle max-h-72 overflow-y-auto">
                {notifItems.length === 0 ? (
                  <div className="p-6 text-center text-text-muted text-xs">No notifications yet.</div>
                ) : notifItems.map((n) => (
                  <div key={n.id} className="p-3 hover:bg-surface-hover flex items-start gap-2.5 text-xs">
                    <div className="mt-0.5 shrink-0">
                      {n.type.includes('deal') ? <TrendingUp size={14} className="text-accent-color" /> :
                       n.type.includes('email') ? <Mail size={14} className="text-accent-color" /> :
                       n.type.includes('lead') ? <UserPlus size={14} className="text-status-info-text" /> :
                       <Bell size={14} className="text-text-muted" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={n.is_read ? 'text-text-muted' : 'text-text-primary'}>{n.title}</p>
                      {n.message && <p className="text-text-muted mt-0.5 truncate">{n.message}</p>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-2 border-t border-border-default bg-surface-2 flex justify-between px-4">
                <button onClick={markAllRead} className="text-xs text-text-muted hover:text-text-primary py-1 cursor-pointer">Mark all read</button>
                <button onClick={() => { setShowNotifications(false); onTabChange?.('notifications'); }} className="text-xs text-accent-color hover:text-accent-hover py-1 cursor-pointer">View all</button>
              </div>
            </div>
          )}
        </div>

        {/* Avatar — ui.md §6: right-aligned */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-muted text-xs font-bold text-accent-color ring-1 ring-border-default ring-offset-2 ring-offset-surface-1 hover:ring-2 hover:ring-accent-color/40 transition-all cursor-pointer overflow-hidden"
          >
            {currentUser?.avatar_url ? (
              <Image src={resolveImageUrl(currentUser.avatar_url)} alt={profileName} width={36} height={36} className="h-full w-full object-cover" unoptimized />
            ) : (
              <span className="select-none">{profileInitials}</span>
            )}
          </button>
          {showProfileMenu && (
            <div className="absolute right-0 top-11 w-48 bg-surface-1 border border-border-default rounded-[12px] shadow-popover overflow-hidden z-50">
              <div className="px-4 py-2.5 bg-surface-2 border-b border-border-default">
                <p className="text-xs font-semibold text-text-primary truncate">{profileName}</p>
                <p className="text-[11px] text-text-muted truncate mt-0.5">{profileEmail}</p>
              </div>
              <div className="py-1">
                <button onClick={() => { setShowProfileMenu(false); onTabChange?.('profile'); }} className="flex items-center gap-2 w-full px-4 py-2 text-xs text-text-primary hover:bg-surface-hover cursor-pointer">
                  <User size={14} className="text-text-muted" /> My Profile
                </button>
              </div>
              <div className="border-t border-border-default py-1">
                <button onClick={() => { setShowProfileMenu(false); onSignOut?.(); }} className="flex items-center gap-2 w-full px-4 py-2.5 text-xs text-status-danger-text hover:bg-status-danger-bg cursor-pointer">
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
