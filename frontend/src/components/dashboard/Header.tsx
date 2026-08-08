'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Search, Bell, Plus, Menu,
  TrendingUp, User, ShieldAlert, Settings, LogOut,
  Sun, Moon, UserPlus, Mail, Zap
} from 'lucide-react';
import { useCurrentUser, userInitials } from '@/hooks/useCurrentUser';
import { useNotifications } from '@/hooks/useNotifications';
import { resolveImageUrl } from '@/utils/api';
import { cn } from '@/lib/utils';

interface HeaderProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  onNewReportClick: () => void;
  onTabChange?: (tab: string) => void;
  onOpenCommandPalette?: () => void;
  onSignOut?: () => void;
  userRole: 'representative' | 'manager' | 'admin';
}

export default function Header({
  collapsed,
  setCollapsed,
  onNewReportClick,
  onTabChange,
  onOpenCommandPalette,
  onSignOut,
  userRole,
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [syncSeconds, setSyncSeconds] = useState(2);
  const [isSyncing, setIsSyncing] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { user: currentUser } = useCurrentUser();
  const { notifications: notifItems, unreadCount, markAllRead } = useNotifications(10);

  const profileName = currentUser?.full_name || 'User';
  const profileEmail = currentUser?.email || '';
  const profileInitials = userInitials(currentUser?.full_name);

  useEffect(() => {
    const savedTheme = (localStorage.getItem('pulse-crm-theme') as 'light' | 'dark') || 'light';
    setTheme(savedTheme);
    if (savedTheme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenCommandPalette?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenCommandPalette]);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('pulse-crm-theme', next);
    if (next === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  const btn = cn(
    'grid shrink-0 size-9 place-items-center rounded-full border border-border bg-card',
    'text-muted-foreground shadow-sm transition-all hover:bg-secondary hover:text-foreground cursor-pointer',
  );

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-md md:px-6">
      {/* Sidebar toggle */}
      <button onClick={() => setCollapsed(!collapsed)} className={btn} aria-label="Toggle Sidebar">
        <Menu size={16} strokeWidth={1.75} />
      </button>

      {/* Search */}
      <div
        className="flex flex-1 h-10 items-center gap-2 rounded-full border border-border bg-card px-4 shadow-sm cursor-pointer hover:bg-secondary/50 transition-all"
        onClick={() => onOpenCommandPalette?.()}
      >
        <Search size={15} className="shrink-0 text-muted-foreground" />
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search leads, contacts, companies, deals..."
          readOnly
          onClick={() => onOpenCommandPalette?.()}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none cursor-pointer"
        />
        <span className="hidden shrink-0 rounded-md bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground sm:inline">⌘K</span>
      </div>

      {/* Right cluster */}
      <div className="flex shrink-0 items-center gap-2">
        {/* Sync badge */}
        <span className="hidden lg:inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-semibold text-brand select-none min-w-[110px]">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-60"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand"></span>
          </span>
          <span>{isSyncing ? 'Syncing...' : `Updated ${syncSeconds}s ago`}</span>
        </span>

        {/* Role badge */}
        <span className="hidden lg:inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground select-none">
          <span className="size-2 rounded-full bg-lime animate-pulse" />
          Role: <span className="font-semibold text-foreground">
            {userRole === 'representative' ? 'Sales Rep' : userRole === 'manager' ? 'Sales Manager' : 'Admin'}
          </span>
        </span>

        {/* New report */}
        <button
          onClick={onNewReportClick}
          className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm hover:bg-secondary transition-all cursor-pointer"
        >
          <Plus size={13} /> New report
        </button>

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
            <div className="absolute right-0 top-11 w-80 bg-popover border border-border rounded-xl shadow-lg overflow-hidden z-50">
              <div className="px-4 py-3 bg-secondary border-b border-border flex justify-between items-center">
                <span className="font-semibold text-foreground text-xs">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-[11px] bg-brand/10 text-brand px-2 py-0.5 rounded-full font-semibold">{unreadCount} New</span>
                )}
              </div>
              <div className="divide-y divide-border max-h-72 overflow-y-auto">
                {notifItems.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground text-xs">No notifications yet.</div>
                ) : notifItems.map((n) => (
                  <div key={n.id} className="p-3 hover:bg-secondary flex items-start gap-2.5 text-xs">
                    <div className="mt-0.5 shrink-0">
                      {n.type.includes('deal') ? <TrendingUp size={14} className="text-brand" /> :
                       n.type.includes('email') ? <Mail size={14} className="text-brand" /> :
                       n.type.includes('lead') ? <UserPlus size={14} className="text-blue-600" /> :
                       <Bell size={14} className="text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={n.is_read ? 'text-muted-foreground' : 'text-foreground'}>{n.title}</p>
                      {n.message && <p className="text-muted-foreground mt-0.5 truncate">{n.message}</p>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-2 border-t border-border bg-secondary flex justify-between px-4">
                <button onClick={markAllRead} className="text-xs text-muted-foreground hover:text-foreground py-1 cursor-pointer">Mark all read</button>
                <button onClick={() => { setShowNotifications(false); onTabChange?.('notifications'); }} className="text-xs text-brand hover:text-brand/80 py-1 cursor-pointer">View all</button>
              </div>
            </div>
          )}
        </div>

        {/* Avatar */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-pale text-xs font-bold text-brand-deep ring-1 ring-brand-soft/70 ring-offset-2 ring-offset-background hover:ring-2 hover:ring-brand/40 transition-all cursor-pointer overflow-hidden"
          >
            {currentUser?.avatar_url ? (
              <Image src={resolveImageUrl(currentUser.avatar_url)} alt={profileName} width={36} height={36} className="h-full w-full object-cover" unoptimized />
            ) : (
              <span className="select-none">{profileInitials}</span>
            )}
          </button>
          {showProfileMenu && (
            <div className="absolute right-0 top-11 w-48 bg-popover border border-border rounded-xl shadow-lg overflow-hidden z-50">
              <div className="px-4 py-2.5 bg-secondary border-b border-border">
                <p className="text-xs font-semibold text-foreground truncate">{profileName}</p>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">{profileEmail}</p>
              </div>
              <div className="py-1">
                <button onClick={() => { setShowProfileMenu(false); onTabChange?.('profile'); }} className="flex items-center gap-2 w-full px-4 py-2 text-xs text-foreground hover:bg-secondary cursor-pointer">
                  <User size={14} className="text-muted-foreground" /> My Profile
                </button>
                <button onClick={() => { setShowProfileMenu(false); onTabChange?.('settings'); }} className="flex items-center gap-2 w-full px-4 py-2 text-xs text-foreground hover:bg-secondary cursor-pointer">
                  <Settings size={14} className="text-muted-foreground" /> Settings
                </button>
              </div>
              <div className="border-t border-border py-1">
                <button onClick={() => { setShowProfileMenu(false); onSignOut?.(); }} className="flex items-center gap-2 w-full px-4 py-2.5 text-xs text-destructive hover:bg-destructive/10 cursor-pointer">
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
