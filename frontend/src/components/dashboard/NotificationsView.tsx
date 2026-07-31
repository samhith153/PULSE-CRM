'use client';

import React from 'react';
import { 
  Bell, 
  UserPlus, 
  TrendingUp, 
  ShieldAlert,
  Sparkles, 
  X, 
  CheckCheck,
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

function getIcon(type: string) {
  switch (type) {
    case 'lead_assigned':
      return <UserPlus className="h-4.5 w-4.5 text-blue-600" />;
    case 'deal_won':
      return <TrendingUp className="h-4.5 w-4.5 text-emerald-600" />;
    case 'deal_lost':
      return <ShieldAlert className="h-4.5 w-4.5 text-rose-600" />;
    case 'lead_converted':
      return <Sparkles className="h-4.5 w-4.5 text-amber-600" />;
    default:
      return <Bell className="h-4.5 w-4.5 text-slate-400" />;
  }
}

function formatRelativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationsView() {
  const { notifications, unreadCount, loading, markRead, markAllRead, dismiss } = useNotifications(50);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h2 className="font-sans text-2xl text-brand-heading font-bold">Notifications Alert Inbox</h2>
            <p className="text-[11px] text-brand-text/60 mt-0.5 font-bold">Real-time alerts generated from deal, lead, and pipeline activity.</p>
          </div>
          
          {unreadCount > 0 && (
            <button 
              onClick={markAllRead}
              className="inline-flex items-center space-x-1 px-3 py-1.5 border border-brand-border-purple/35 hover:border-brand-border-purple text-brand-text/80 hover:bg-slate-50 text-xs font-bold rounded-lg cursor-pointer"
            >
              <CheckCheck className="h-4 w-4 mr-0.5 text-brand-accent" />
              <span>Mark all as read</span>
            </button>
          )}
        </div>

        {/* Notifications Feed list */}
        <div className="space-y-3.5">
          {loading ? (
            <div className="text-center py-16 text-slate-400 text-xs font-semibold">Loading notifications…</div>
          ) : notifications.length > 0 ? (
            notifications.map((item) => (
              <div 
                key={item.id} 
                onClick={() => !item.is_read && markRead(item.id)}
                className={`p-4 border rounded-xl flex items-start justify-between space-x-4 transition-all duration-200 cursor-pointer ${
                  item.is_read 
                    ? 'border-brand-border-purple/15 bg-slate-50/20 opacity-70' 
                    : 'border-brand-border-purple/25 bg-white shadow-sm/5'
                }`}
              >
                <div className="flex items-start space-x-3.5">
                  <div className="h-8.5 w-8.5 rounded-lg bg-slate-50 border border-brand-border-purple/15 flex items-center justify-center shrink-0">
                    {getIcon(item.type)}
                  </div>
                  <div>
                    <h4 className={`text-xs ${item.is_read ? 'font-bold text-brand-text/80' : 'font-extrabold text-brand-heading'}`}>{item.title}</h4>
                    <p className="text-xs text-brand-text/75 mt-1 leading-relaxed font-semibold">{item.message}</p>
                    <span className="text-[9px] text-slate-400 font-bold mt-2 inline-block tabular-nums">{formatRelativeTime(item.created_at)}</span>
                  </div>
                </div>

                <button 
                  onClick={(e) => { e.stopPropagation(); dismiss(item.id); }}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer shrink-0"
                  aria-label="Dismiss notification"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-16 text-slate-400 text-xs font-semibold">
              <Bell className="h-8 w-8 mx-auto text-slate-300 mb-2" />
              <span>Notification queue cleared. No new alerts.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
