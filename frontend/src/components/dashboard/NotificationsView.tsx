'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  UserPlus, 
  Mail, 
  Calendar, 
  AlertTriangle, 
  Sparkles, 
  X, 
  CheckCheck,
  CheckSquare,
  Loader2,
  FileText,
  TrendingUp,
  ShieldAlert,
  MoreHorizontal,
  Trash2,
} from 'lucide-react';
import { useNotifications, Notification } from '@/hooks/useNotifications';

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  lead_assigned: <UserPlus className="h-4.5 w-4.5 text-status-info-text" />,
  lead_created: <UserPlus className="h-4.5 w-4.5 text-status-info-text" />,
  lead_won: <TrendingUp className="h-4.5 w-4.5 text-accent-color" />,
  lead_lost: <ShieldAlert className="h-4.5 w-4.5 text-destructive" />,
  lead_converted: <Sparkles className="h-4.5 w-4.5 text-status-warning-text" />,
  deal_created: <TrendingUp className="h-4.5 w-4.5 text-accent-color" />,
  deal_won: <TrendingUp className="h-4.5 w-4.5 text-accent-color" />,
  deal_lost: <ShieldAlert className="h-4.5 w-4.5 text-destructive" />,
  email_received: <Mail className="h-4.5 w-4.5 text-accent-color" />,
  email_reply: <Mail className="h-4.5 w-4.5 text-accent-color" />,
  meeting_reminder: <Calendar className="h-4.5 w-4.5 text-chart-1" />,
  task_due: <CheckSquare className="h-4.5 w-4.5 text-destructive" />,
  ai_alert: <Sparkles className="h-4.5 w-4.5 text-status-warning-text" />,
};

function getIcon(type: string) {
  return TYPE_ICONS[type] || <Bell className="h-4.5 w-4.5 text-text-muted" />;
}

export default function NotificationsView() {
  const { notifications, unreadCount, loading, markAllRead, dismiss, clearAll } = useNotifications(50);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [menuOpen]);

  return (
    <div className="space-y-6">
      <div className="bg-surface-1 border border-border-default rounded-2xl p-5">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h2 className="font-sans text-2xl text-text-primary font-bold">Notifications Alert Inbox</h2>
            <p className="text-[11px] text-text-muted mt-0.5 font-semibold">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button 
                onClick={markAllRead}
                className="inline-flex items-center space-x-1 px-3 py-1.5 border border-border-default hover:border-border-default text-text-primary hover:bg-surface-2 text-xs font-semibold rounded-lg cursor-pointer"
              >
                <CheckCheck className="h-4 w-4 mr-0.5 text-accent-color" />
                <span>Mark all as read</span>
              </button>
            )}
            {notifications.length > 0 && (
              <div className="relative" ref={menuRef}>
                <button 
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="inline-flex items-center justify-center p-1.5 border border-border-default hover:border-border-default text-text-muted hover:text-text-primary hover:bg-surface-2 text-xs rounded-lg cursor-pointer"
                  aria-label="More options"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-44 bg-surface-1 border border-border-default rounded-xl shadow-lg py-1 z-50">
                    <button
                      onClick={() => { clearAll(); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/5 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Clear all</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Notifications Feed list */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-text-muted text-xs font-semibold">
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Loading notifications...
          </div>
        ) : (
          <div className="space-y-3.5">
            {notifications.length > 0 ? (
              notifications.map((item) => (
                <div 
                  key={item.id} 
                  className={`p-4 border rounded-xl flex items-start justify-between space-x-4 transition duration-200 ${
                    item.is_read 
                      ? 'border-border-default bg-surface-2/20 opacity-70' 
                      : 'border-border-default bg-surface-1'
                  }`}
                >
                  <div className="flex items-start space-x-3.5">
                    <div className="h-8.5 w-8.5 rounded-lg bg-surface-2 border border-border-default flex items-center justify-center shrink-0">
                      {getIcon(item.type)}
                    </div>
                    <div>
                      <h4 className={`text-xs ${item.is_read ? 'font-bold text-text-muted/80' : 'font-semibold text-text-primary'}`}>{item.title}</h4>
                      {item.message && (
                        <p className="text-xs text-text-muted mt-1 leading-relaxed font-semibold">{item.message}</p>
                      )}
                      <span className="text-[9px] text-text-muted font-semibold mt-2 inline-block tabular-nums">{timeAgo(item.created_at)}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => dismiss(item.id)} 
                    className="p-1 text-text-muted hover:text-destructive rounded transition-colors cursor-pointer shrink-0"
                    aria-label="Dismiss notification"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-16 text-text-muted text-xs font-semibold">
                <Bell className="h-8 w-8 mx-auto text-text-muted mb-2" />
                <span>Notification queue cleared. No new alerts.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
