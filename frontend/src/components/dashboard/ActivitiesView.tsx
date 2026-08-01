'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  Loader2,
  Mail,
  Phone,
  UserPlus,
  FileText,
  Building2,
  CheckCircle2,
  CircleDot,
  Users,
} from 'lucide-react';
import { getActivities, type ActivityTimelineItem } from '@/utils/api';

const ACTION_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  meeting: Users,
  meeting_scheduled: Users,
  call: Phone,
  call_logged: Phone,
  email_sent: Mail,
  email_opened: Mail,
  lead_created: UserPlus,
  contact_created: UserPlus,
  company_created: Building2,
  deal_created: FileText,
  deal_won: CheckCircle2,
  deal_lost: CircleDot,
  task: Activity,
  follow_up: Activity,
};

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ActivitiesView({ onLoaded }: { onLoaded?: () => void } = {}) {
  const [items, setItems] = useState<ActivityTimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getActivities({ page_size: 50 })
      .then((res) => {
        if (!mounted) return;
        setItems(res.data ?? []);
        setError(null);
      })
      .catch((e) => {
        if (!mounted) return;
        setError(e?.message || 'Failed to load activities.');
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
          onLoaded?.();
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-sans text-brand-heading tracking-tight font-bold">Activity Timeline</h1>
        <p className="text-xs md:text-sm text-brand-text/75 mt-2 leading-relaxed max-w-2xl font-medium tracking-wide">
          A live feed of every action across your CRM — leads, calls, emails, deals, and tasks.
        </p>
      </div>

      <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-400 text-xs font-semibold">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading activities…
          </div>
        ) : error ? (
          <div className="py-24 text-center text-rose-600 text-xs font-semibold">{error}</div>
        ) : items.length === 0 ? (
          <div className="py-24 text-center text-slate-400 text-xs font-semibold">No activity recorded yet.</div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const Icon = ACTION_ICON[item.action] ?? Activity;
              return (
                <div key={item.id} className="flex items-start gap-3 bg-white border border-brand-border-purple/20 rounded-xl p-3 shadow-sm/5">
                  <span className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-brand-secondary-accent/15 border border-brand-secondary-accent text-brand-accent">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-brand-heading leading-snug break-words">{item.title}</p>
                        {item.description && (
                          <p className="text-[11px] text-brand-text/80 leading-relaxed font-semibold mt-0.5 break-words">{item.description}</p>
                        )}
                        <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wide">{item.action.replace(/_/g, ' ')}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap shrink-0">{timeAgo(item.created_at)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
