'use client';

import React from 'react';
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
  lead_won: <TrendingUp className="h-4.5 w-4.5 text-brand-cyan" />,
  lead_lost: <ShieldAlert className="h-4.5 w-4.5 text-destructive" />,
  lead_converted: <Sparkles className="h-4.5 w-4.5 text-status-warning-text" />,
  deal_created: <TrendingUp className="h-4.5 w-4.5 text-brand-cyan" />,
  deal_won: <TrendingUp className="h-4.5 w-4.5 text-brand-cyan" />,
  deal_lost: <ShieldAlert className="h-4.5 w-4.5 text-destructive" />,
  email_received: <Mail className="h-4.5 w-4.5 text-brand-purple" />,
  email_reply: <Mail className="h-4.5 w-4.5 text-brand-purple" />,
  meeting_reminder: <Calendar className="h-4.5 w-4.5 text-chart-1" />,
  task_due: <CheckSquare className="h-4.5 w-4.5 text-destructive" />,
  ai_alert: <Sparkles className="h-4.5 w-4.5 text-status-warning-text" />,
};

function getIcon(type: string) {
  return TYPE_ICONS[type] || <Bell className="h-4.5 w-4.5 text-muted-foreground" />;
}

export default function NotificationsView() {
  const { notifications, unreadCount, loading, markAllRead, dismiss } = useNotifications(50);

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-2xl p-5">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h2 className="font-sans text-2xl text-foreground font-bold">Notifications Alert Inbox</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-semibold">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
            </p>
          </div>
          
          {unreadCount > 0 && (
            <button 
              onClick={markAllRead}
              className="inline-flex items-center space-x-1 px-3 py-1.5 border border-border hover:border-border text-foreground hover:bg-secondary text-xs font-semibold rounded-lg cursor-pointer"
            >
              <CheckCheck className="h-4 w-4 mr-0.5 text-brand-purple" />
              <span>Mark all as read</span>
            </button>
          )}
        </div>

        {/* Notifications Feed list */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-xs font-semibold">
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
                      ? 'border-border bg-secondary/20 opacity-70' 
                      : 'border-border bg-card'
                  }`}
                >
                  <div className="flex items-start space-x-3.5">
                    <div className="h-8.5 w-8.5 rounded-lg bg-secondary border border-border flex items-center justify-center shrink-0">
                      {getIcon(item.type)}
                    </div>
                    <div>
                      <h4 className={`text-xs ${item.is_read ? 'font-bold text-muted-foreground/80' : 'font-semibold text-foreground'}`}>{item.title}</h4>
                      {item.message && (
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed font-semibold">{item.message}</p>
                      )}
                      <span className="text-[9px] text-muted-foreground font-semibold mt-2 inline-block tabular-nums">{timeAgo(item.created_at)}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => dismiss(item.id)} 
                    className="p-1 text-muted-foreground hover:text-destructive rounded transition-colors cursor-pointer shrink-0"
                    aria-label="Dismiss notification"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-16 text-muted-foreground text-xs font-semibold">
                <Bell className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <span>Notification queue cleared. No new alerts.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
