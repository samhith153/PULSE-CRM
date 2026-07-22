'use client';

import React, { useState } from 'react';
import { 
  Bell, 
  UserPlus, 
  Mail, 
  Calendar, 
  AlertTriangle, 
  Sparkles, 
  X, 
  CheckCheck,
  CheckSquare
} from 'lucide-react';

interface NotificationItem {
  id: number;
  type: 'lead_assigned' | 'email_reply' | 'meeting_reminder' | 'task_due' | 'ai_alert';
  title: string;
  desc: string;
  time: string;
  read: boolean;
}

export default function NotificationsView() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    { id: 1, type: 'lead_assigned', title: 'New Lead Assigned', desc: 'Inbound high-priority lead Helena Troy has been assigned to Sarah Johnson.', time: '10 mins ago', read: false },
    { id: 2, type: 'email_reply', title: 'Email Reply Recieved', desc: 'Alex Rivera: SSO Migration scope specs approved. Scheduled legal sync.', time: '2 hours ago', read: false },
    { id: 3, type: 'meeting_reminder', title: 'Meeting Countdown Reminder', desc: 'Discovery review sync with Marcus Aurelius in 15 minutes.', time: '15 mins from now', read: false },
    { id: 4, type: 'task_due', title: 'Task Deadline Imminent', desc: 'Review TechCorp SAML integration setup details is overdue.', time: '3 hours ago', read: false },
    { id: 5, type: 'ai_alert', title: 'AI Risk Alert', desc: 'At-risk pipeline alert: David Hume has budget mismatch. Refocus on lower tier package.', time: '5 hours ago', read: false }
  ]);

  const handleDismiss = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'lead_assigned': return <UserPlus className="h-4.5 w-4.5 text-blue-600" />;
      case 'email_reply': return <Mail className="h-4.5 w-4.5 text-indigo-600" />;
      case 'meeting_reminder': return <Calendar className="h-4.5 w-4.5 text-purple-600" />;
      case 'task_due': return <CheckSquare className="h-4.5 w-4.5 text-rose-600" />;
      case 'ai_alert': return <Sparkles className="h-4.5 w-4.5 text-amber-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h2 className="font-sans text-2xl text-brand-heading font-bold">Notifications Alert Inbox</h2>
            <p className="text-[11px] text-brand-text/60 mt-0.5 font-bold">Monitor automated status updates, inbox threads replies, and compliance warnings.</p>
          </div>
          
          {notifications.some(n => !n.read) && (
            <button 
              onClick={handleMarkAllRead}
              className="inline-flex items-center space-x-1 px-3 py-1.5 border border-brand-border-purple/35 hover:border-brand-border-purple text-brand-text/80 hover:bg-slate-50 text-xs font-bold rounded-lg cursor-pointer"
            >
              <CheckCheck className="h-4 w-4 mr-0.5 text-brand-accent" />
              <span>Mark all as read</span>
            </button>
          )}
        </div>

        {/* Notifications Feed list */}
        <div className="space-y-3.5">
          {notifications.length > 0 ? (
            notifications.map((item) => (
              <div 
                key={item.id} 
                className={`p-4 border rounded-xl flex items-start justify-between space-x-4 transition-all duration-200 ${
                  item.read 
                    ? 'border-brand-border-purple/15 bg-slate-50/20 opacity-70' 
                    : 'border-brand-border-purple/25 bg-white shadow-sm/5'
                }`}
              >
                <div className="flex items-start space-x-3.5">
                  <div className="h-8.5 w-8.5 rounded-lg bg-slate-50 border border-brand-border-purple/15 flex items-center justify-center shrink-0">
                    {getIcon(item.type)}
                  </div>
                  <div>
                    <h4 className={`text-xs ${item.read ? 'font-bold text-brand-text/80' : 'font-extrabold text-brand-heading'}`}>{item.title}</h4>
                    <p className="text-xs text-brand-text/75 mt-1 leading-relaxed font-semibold">{item.desc}</p>
                    <span className="text-[9px] text-slate-400 font-bold mt-2 inline-block tabular-nums">{item.time}</span>
                  </div>
                </div>

                <button 
                  onClick={() => handleDismiss(item.id)} 
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
