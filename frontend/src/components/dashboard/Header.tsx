'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Bell, 
  Plus, 
  Menu, 
  FileText,
  TrendingUp,
  User,
  ShieldAlert,
  Settings,
  LogOut,
  Sun,
  Moon,
  UserPlus,
  CheckSquare,
  Calendar,
  ChevronDown
} from 'lucide-react';

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
  userRole
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  
  // Real-time synchronization mockup variables
  const [syncSeconds, setSyncSeconds] = useState(2);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setSyncSeconds((prev) => {
        if (prev >= 14) {
          setIsSyncing(true);
          const syncTimeout = setTimeout(() => {
            setIsSyncing(false);
          }, 1200);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Theme state and persistence logic
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('pulse-crm-theme') as 'light' | 'dark' || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('pulse-crm-theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };
  
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const quickAddRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (quickAddRef.current && !quickAddRef.current.contains(event.target as Node)) {
        setShowQuickAdd(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (onOpenCommandPalette) {
          onOpenCommandPalette();
        } else {
          searchInputRef.current?.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenCommandPalette]);

  const notifications = [
    { id: 1, text: "Sarah Johnson won the 'Acme Enterprise' deal!", type: "won", time: "10m ago" },
    { id: 2, text: "Gmail sync completed: 24 new threads pulled.", type: "sync", time: "1h ago" },
    { id: 3, text: "High-value lead 'Global Tech' has been idle for 5 days.", type: "warning", time: "3h ago" },
    { id: 4, text: "New report 'Q3 Sales Forecast' ready for review.", type: "report", time: "5h ago" },
  ];

  // Dynamic profile details mapping
  const getUserProfile = () => {
    let name = "";
    let email = "";
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('pulse-crm-user');
      if (storedUser) {
        if (storedUser.includes('@')) {
          email = storedUser;
          const namePart = storedUser.split('@')[0];
          name = namePart.replace(/[._-]/g, ' ');
        } else {
          name = storedUser;
          email = `${storedUser.toLowerCase().replace(/\s+/g, '.')}@pulse.crm`;
        }
      }
    }

    let defaultAvatar = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&fit=crop&q=80";
    if (userRole === 'admin') {
      defaultAvatar = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&fit=crop&q=80";
      if (!name) name = "System Admin";
      if (!email) email = "admin@pulse.crm";
    } else if (userRole === 'manager') {
      defaultAvatar = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&fit=crop&q=80";
      if (!name) name = "Alex Johnson";
      if (!email) email = "alex.johnson@pulse.crm";
    } else {
      if (!name) name = "Sarah Johnson";
      if (!email) email = "sarah.johnson@pulse.crm";
    }

    return {
      name: name,
      email: email,
      avatar: defaultAvatar
    };
  };

  const profile = getUserProfile();

  return (
    <header className="sticky top-0 z-30 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border/80 bg-background/70 px-4 py-3 backdrop-blur-xl md:px-6 text-foreground">

      {/* Left: sidebar toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="shrink-0 grid size-9 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground cursor-pointer"
        aria-label="Toggle Sidebar"
      >
        <Menu size={16} strokeWidth={1.75} />
      </button>

      {/* Center: search bar */}
      <div
        className="flex h-11 min-w-0 items-center gap-2 rounded-full border border-border/60 bg-secondary/40 px-4 cursor-pointer hover:bg-secondary/70 hover:border-border transition-all duration-200"
        onClick={() => onOpenCommandPalette?.()}
      >
        <Search size={16} className="shrink-0 text-muted-foreground" />
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search leads, contacts, companies, deals…"
          value=""
          readOnly
          onClick={() => onOpenCommandPalette?.()}
          onFocus={(e) => { e.target.blur(); onOpenCommandPalette?.(); }}
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/75 focus:outline-none cursor-pointer"
        />
        <span className="hidden shrink-0 rounded-md bg-background border border-border/80 px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground sm:inline">
          ⌘K
        </span>
      </div>

      {/* Right: actions cluster */}
      <div className="flex shrink-0 items-center gap-2">

        {/* Live sync pulsing badge */}
        <span className="hidden items-center gap-1.5 rounded-full border border-border/80 bg-background/55 px-2.5 py-1 text-[11px] font-semibold text-brand-purple lg:inline-flex select-none transition-all duration-300 min-w-[110px]">
          <span className="relative flex h-1.5 w-1.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-purple ${isSyncing ? 'opacity-90 scale-150 duration-500' : 'opacity-60'}`}></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-purple"></span>
          </span>
          <span>{isSyncing ? 'Syncing...' : `Updated ${syncSeconds}s ago`}</span>
        </span>

        {/* Role badge */}
        <span className="hidden items-center gap-1.5 rounded-full border border-border/40 bg-secondary/30 px-3 py-1 text-[11px] font-bold text-muted-foreground lg:inline-flex select-none">
          Role: <span className="text-foreground">
            {userRole === 'representative' ? 'Sales Rep' : userRole === 'manager' ? 'Sales Manager' : 'Admin'}
          </span>
        </span>



        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          className="grid size-9 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground cursor-pointer"
        >
          {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="View notifications"
            className="relative grid size-9 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-secondary cursor-pointer hover-wiggle"
          >
            <Bell size={15} />
            <span className="absolute -top-0.5 -right-0.5 grid size-4 place-items-center rounded-full bg-brand-purple text-[9px] font-semibold text-primary-foreground">
              4
            </span>
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                transition={{ type: "spring", stiffness: 350, damping: 26 }}
                className="absolute right-0 mt-2 w-80 bg-popover border border-border rounded-xl shadow-float overflow-hidden z-50"
              >
                <div className="px-4 py-3 bg-secondary border-b border-border flex justify-between items-center">
                  <span className="font-semibold text-foreground text-xs">Notifications</span>
                  <span className="text-[11px] bg-brand-purple/10 text-brand-purple px-2 py-0.5 rounded-full font-semibold">
                    4 New
                  </span>
                </div>
                <div className="divide-y divide-border max-h-72 overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n.id} className="p-3 hover:bg-secondary transition-colors flex items-start gap-2.5 text-xs">
                      <div className="mt-0.5 shrink-0">
                        {n.type === 'won' && <TrendingUp size={14} className="text-brand-cyan" strokeWidth={1.75} />}
                        {n.type === 'warning' && <ShieldAlert size={14} className="text-destructive" strokeWidth={1.75} />}
                        {n.type === 'report' && <FileText size={14} className="text-brand-purple" strokeWidth={1.75} />}
                        {!['won', 'warning', 'report'].includes(n.type) && <Bell size={14} className="text-muted-foreground" strokeWidth={1.75} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground leading-relaxed">{n.text}</p>
                        <span className="text-[11px] text-muted-foreground mt-0.5 block">{n.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-2 border-t border-border bg-secondary flex justify-between px-4">
                  <button
                    type="button"
                    onClick={() => setShowNotifications(false)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors py-1 cursor-pointer font-medium"
                  >
                    Mark all read
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowNotifications(false); onTabChange?.('notifications'); }}
                    className="text-xs text-brand-purple hover:text-brand-purple/80 transition-colors py-1 cursor-pointer font-medium"
                  >
                    View all alerts
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User avatar / dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold text-ink hover:ring-2 hover:ring-brand-purple/40 ring-1 ring-border/40 ring-offset-2 ring-offset-background transition-all duration-200 cursor-pointer overflow-hidden"
            aria-label="Profile menu"
          >
            <Image
              src={profile.avatar}
              alt={`${profile.name} avatar`}
              width={36} height={36}
              className="h-full w-full object-cover"
              unoptimized
            />
          </button>

          <AnimatePresence>
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                transition={{ type: "spring", stiffness: 350, damping: 26 }}
                className="absolute right-0 mt-2 w-48 bg-popover border border-border rounded-xl shadow-float overflow-hidden z-50"
              >
                <div className="px-4 py-2.5 bg-secondary border-b border-border">
                  <p className="text-xs font-semibold text-foreground truncate">{profile.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">{profile.email}</p>
                </div>
                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => { setShowProfileMenu(false); onTabChange?.('profile'); }}
                    className="flex items-center gap-2 w-full text-left px-4 py-2 text-xs text-foreground hover:bg-secondary transition-colors cursor-pointer font-medium"
                  >
                    <User size={14} className="text-muted-foreground" strokeWidth={1.75} />
                    <span>My Profile</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowProfileMenu(false); onTabChange?.('settings'); }}
                    className="flex items-center gap-2 w-full text-left px-4 py-2 text-xs text-foreground hover:bg-secondary transition-colors cursor-pointer font-medium"
                  >
                    <Settings size={14} className="text-muted-foreground" strokeWidth={1.75} />
                    <span>Account Settings</span>
                  </button>
                </div>
                <div className="border-t border-border py-1">
                  <button
                    onClick={() => { setShowProfileMenu(false); onSignOut?.(); }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-xs text-destructive hover:bg-destructive/10 transition-colors text-left cursor-pointer font-medium"
                  >
                    <LogOut size={14} strokeWidth={1.75} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
