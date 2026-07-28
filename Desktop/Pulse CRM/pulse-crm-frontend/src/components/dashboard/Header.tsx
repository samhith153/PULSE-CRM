'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Moon
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
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // Theme state and persistence logic
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('pulse-crm-theme') as 'light' | 'dark' || 'light';
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
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
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
    switch (userRole) {
      case 'admin':
        return {
          name: "System Admin",
          email: "admin@pulse.crm",
          avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&fit=crop&q=80"
        };
      case 'manager':
        return {
          name: "Alex Johnson",
          email: "alex.johnson@pulse.crm",
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&fit=crop&q=80"
        };
      case 'representative':
      default:
        return {
          name: "Sarah Johnson",
          email: "sarah.johnson@pulse.crm",
          avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&fit=crop&q=80"
        };
    }
  };

  const profile = getUserProfile();

  return (
    <header className="h-16 bg-white border-b border-brand-border-purple/20 flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm/5 text-brand-text">
      {/* Search & Collapse Toggle */}
      <div className="flex items-center space-x-4 flex-1 max-w-md">
        <button 
          onClick={() => setCollapsed(!collapsed)} 
          className="text-slate-400 hover:text-brand-text transition-colors p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer"
          aria-label="Toggle Sidebar"
        >
          <Menu className="h-4.5 w-4.5" strokeWidth={1.75} />
        </button>

        {/* Polished Search Bar - Light Themed with Periwinkle Borders */}
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" strokeWidth={1.75} />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search leads, contacts, companies, deals... (Ctrl+K)"
            value=""
            readOnly
            onClick={() => {
              if (onOpenCommandPalette) onOpenCommandPalette();
            }}
            onFocus={(e) => {
              e.target.blur();
              if (onOpenCommandPalette) onOpenCommandPalette();
            }}
            className="w-full pl-9 pr-12 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text bg-slate-50/60 placeholder-slate-400 cursor-pointer focus:outline-none transition-all duration-200 shadow-sm/5"
          />
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
            <kbd className="text-[9px] font-sans font-bold text-brand-text/65 bg-slate-50 border border-brand-border-purple/30 px-1.5 py-0.5 rounded shadow-sm/5">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      {/* Top Bar Actions Cluster - Light Themed */}
      <div className="flex items-center space-x-3.5">
        {/* Role Badge (Static) */}
        <div className="flex items-center space-x-1.5 bg-slate-50 border border-brand-border-purple/10 px-2.5 py-1.5 rounded-lg text-xs font-bold text-brand-text shadow-sm/5 select-none">
          <span className="text-[9px] text-slate-400 font-extrabold uppercase">Role:</span>
          <span className="text-brand-heading font-extrabold capitalize">
            {userRole === 'representative' ? 'Sales Rep' : userRole === 'manager' ? 'Sales Manager' : 'Admin'}
          </span>
        </div>

        {/* + New Report CTA in Medium Purple */}
        <button
          onClick={onNewReportClick}
          className="inline-flex items-center space-x-1 px-3.5 py-1.5 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-lg text-xs font-bold shadow-sm/10 hover:shadow-sm transition-all duration-200 cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          <span>New Report</span>
        </button>

        {/* Theme Switcher Button */}
        <button
          onClick={toggleTheme}
          className="p-1.5 text-slate-400 hover:text-brand-text rounded-lg hover:bg-slate-50 transition-all cursor-pointer relative"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          aria-label="Toggle dark mode"
        >
          {theme === 'light' ? (
            <Moon className="h-4.5 w-4.5" strokeWidth={1.75} />
          ) : (
            <Sun className="h-4.5 w-4.5 text-amber-500" strokeWidth={1.75} />
          )}
        </button>

        {/* Notifications Trigger */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-1.5 text-slate-400 hover:text-brand-text rounded-lg hover:bg-slate-50 transition-all cursor-pointer relative"
            aria-label="View notifications"
          >
            <Bell className="h-4.5 w-4.5" strokeWidth={1.75} />
            <span className="absolute top-1 right-1 h-3.5 w-3.5 bg-brand-accent text-[9px] font-bold text-white rounded-full flex items-center justify-center border border-white">
              4
            </span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-brand-border-purple/35 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 bg-slate-50 border-b border-brand-border-purple/15 flex justify-between items-center">
                <span className="font-bold text-brand-heading text-xs">Notifications</span>
                <span className="text-[9px] bg-brand-accent/10 text-brand-accent px-2 py-0.5 rounded-full font-bold">
                  4 New
                </span>
              </div>
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="p-3 hover:bg-slate-50/50 transition-colors flex items-start space-x-2.5 text-[11px]">
                    <div className="mt-0.5">
                      {n.type === 'won' && <TrendingUp className="h-3.5 w-3.5 text-emerald-600" strokeWidth={1.75} />}
                      {n.type === 'warning' && <ShieldAlert className="h-3.5 w-3.5 text-rose-500" strokeWidth={1.75} />}
                      {n.type === 'report' && <FileText className="h-3.5 w-3.5 text-brand-accent" strokeWidth={1.75} />}
                      {!['won', 'warning', 'report'].includes(n.type) && <Bell className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.75} />}
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-600 leading-relaxed">{n.text}</p>
                      <span className="text-[9px] text-slate-400 mt-0.5 block">{n.time}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-2 border-t border-brand-border-purple/15 bg-slate-50 text-center flex justify-between px-4">
                <button 
                  type="button"
                  onClick={() => setShowNotifications(false)}
                  className="text-[10px] font-bold text-slate-500 hover:text-brand-text transition-colors py-1 cursor-pointer"
                >
                  Mark all read
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setShowNotifications(false);
                    onTabChange?.('notifications');
                  }}
                  className="text-[10px] font-bold text-brand-accent hover:text-brand-accent-hover transition-colors py-1 cursor-pointer"
                >
                  View all alerts
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-2 p-1 rounded-lg hover:bg-slate-50 transition-all cursor-pointer"
            aria-label="Profile menu"
          >
            <div className="h-7 w-7 rounded-full bg-slate-200 overflow-hidden border border-brand-border-purple/20">
              <img 
                src={profile.avatar} 
                alt={`${profile.name} Avatar`} 
                className="h-full w-full object-cover"
              />
            </div>
            <span className="text-xs font-bold text-brand-text hidden md:inline-block">{profile.name}</span>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-brand-border-purple/35 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-2.5 bg-slate-50 border-b border-brand-border-purple/15 text-left">
                <p className="text-xs font-bold text-brand-text">{profile.name}</p>
                <p className="text-[10px] text-slate-450 truncate mt-0.5 font-bold">{profile.email}</p>
              </div>
              <div className="py-1">
                <button 
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    onTabChange?.('profile');
                  }}
                  className="flex items-center space-x-2 w-full text-left px-4 py-2 text-xs text-brand-text/80 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <User className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.75} />
                  <span>My Profile</span>
                </button>

                <button 
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    onTabChange?.('settings');
                  }}
                  className="flex items-center space-x-2 w-full text-left px-4 py-2 text-xs text-brand-text/80 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <Settings className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.75} />
                  <span>Account Settings</span>
                </button>
              </div>
              <div className="border-t border-brand-border-purple/15 py-1 bg-slate-50/50">
                <button 
                  onClick={() => {
                    setShowProfileMenu(false);
                    if (onSignOut) onSignOut();
                  }}
                  className="flex items-center space-x-2 w-full px-4 py-2 text-xs text-rose-650 hover:bg-rose-50 hover:text-rose-700 transition-colors text-left cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
