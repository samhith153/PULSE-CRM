'use client';

import React, { useState, useMemo } from 'react';
import { Layers, Check, Clock, ChevronRight, ExternalLink } from 'lucide-react';

export interface PriorityQueueItem {
  id: string;
  leadId?: string;
  name: string;
  type: 'task' | 'lead';
  company?: string;
  score?: number;
  tier?: string;
  reason?: string;
}

interface PriorityQueueCardProps {
  items?: PriorityQueueItem[];
  onOpenLead?: (leadId?: string) => void;
  onViewAll?: () => void;
}

const DISMISS_KEY = 'pulse-crm-priority-dismissals';

function loadDismissals(): Record<string, 'done' | 'snooze'> {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function deriveAction(item: PriorityQueueItem): string {
  if (item.type === 'task') return 'Follow up';
  const reason = (item.reason || '').toLowerCase();
  const tier = (item.tier || '').toLowerCase();
  if (reason.includes('proposal')) return 'Follow up';
  if (reason.includes('demo')) return 'Schedule demo';
  if (reason.includes('no response') || reason.includes('declined') || reason.includes('cold')) return 'Re-engage';
  if (tier === 'hot') return 'Call';
  return 'Follow up';
}

export default function PriorityQueueCard({
  items = [],
  onOpenLead,
  onViewAll,
}: PriorityQueueCardProps) {
  const [dismissals, setDismissals] = useState<Record<string, 'done' | 'snooze'>>(loadDismissals);

  const dismissKey = (id: string) => `priority-${id}`;

  const visibleItems = useMemo(() => {
    return items.filter((item) => !dismissals[dismissKey(item.id)]).slice(0, 5);
  }, [items, dismissals]);

  const handleDismiss = (id: string, status: 'done' | 'snooze') => {
    setDismissals((prev) => {
      const next = { ...prev, [dismissKey(id)]: status };
      try {
        localStorage.setItem(DISMISS_KEY, JSON.stringify(next));
      } catch {
        // localStorage unavailable — keep state in-memory only
      }
      return next;
    });
  };

  const tierColor = (tier?: string) => {
    if (tier === 'Hot') return 'bg-status-danger';
    if (tier === 'Warm') return 'bg-status-warning';
    if (tier === 'Nurture') return 'bg-status-success';
    return 'bg-accent-color';
  };

  return (
    <div className="bg-surface-1 border border-border-default rounded-[20px] p-5 flex flex-col justify-between h-full">
      <div className="flex flex-col min-h-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 mb-3.5 border-b border-border/60 select-none">
          <div className="flex items-center space-x-2.5">
            <div className="h-9 w-9 rounded-xl bg-accent-color/12 flex items-center justify-center text-accent-color border border-accent-color/20">
              <Layers size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-foreground text-sm tracking-tight flex items-center gap-2">
                <span>Today's Priority</span>
                {visibleItems.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-accent-color/10 text-accent-color text-[10px] font-bold tabular-nums">
                    {visibleItems.length}
                  </span>
                )}
              </h3>
              <p className="text-[10px] text-text-secondary font-medium">High priority actions for today</p>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="space-y-[var(--space-2)] overflow-y-auto max-h-[280px] custom-scrollbar pr-1">
          {visibleItems.length === 0 ? (
            <div className="py-10 flex flex-col items-center justify-center text-center space-y-2">
              <div className="h-12 w-12 rounded-full bg-status-success/10 border border-status-success/20 flex items-center justify-center text-status-success shadow-inner">
                <Check size={24} />
              </div>
              <p className="text-xs font-bold text-text-primary">You're all caught up</p>
              <p className="text-[10px] text-text-muted max-w-[200px]">
                No priority actions for today.
              </p>
            </div>
          ) : (
            visibleItems.map((item) => {
              const action = deriveAction(item);
              return (
                <div
                  key={item.id}
                  className="p-[var(--space-2)] rounded-xl border border-border-default/60 bg-surface-2/10 hover:bg-surface-2/20 transition"
                >
                  <div className="flex items-start justify-between gap-[var(--space-2)]">
                    <div className="min-w-0">
                      {/* Priority / tier indicator + action + lead name */}
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full shrink-0 ${tierColor(item.tier)}`} />
                        <span className="text-[10px] font-bold text-text-primary truncate block max-w-[150px]">
                          {action} {item.name}
                        </span>
                      </div>
                      {/* Company */}
                      {item.company && (
                        <p className="text-[9px] text-text-muted mt-0.5 font-semibold truncate">
                          {item.company}
                        </p>
                      )}
                    </div>
                    {/* Score / Tier */}
                    {item.score !== undefined && (
                      <span className="text-[9px] font-extrabold bg-accent-color/10 text-accent-color px-1.5 py-0.5 rounded-full select-none shrink-0 tabular-nums">
                        {item.score} · {item.tier || '—'}
                      </span>
                    )}
                  </div>

                  {/* Why now */}
                  {item.reason && (
                    <p className="text-[9px] text-text-muted mt-1.5 font-semibold border-t border-border-default/40 pt-1.5 leading-relaxed">
                      {item.reason}
                    </p>
                  )}

                  {/* Action row */}
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleDismiss(item.id, 'done')}
                        title="Mark done"
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold border border-border-default/80 bg-surface-1 text-text-primary hover:text-status-success hover:border-status-success/40 hover:bg-status-success/10 transition cursor-pointer"
                      >
                        <Check size={9} />
                        Done
                      </button>
                      <button
                        onClick={() => handleDismiss(item.id, 'snooze')}
                        title="Snooze"
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold border border-border-default/80 bg-surface-1 text-text-primary hover:text-status-warning hover:border-status-warning/40 hover:bg-status-warning/10 transition cursor-pointer"
                      >
                        <Clock size={9} />
                        Snooze
                      </button>
                    </div>
                    <button
                      onClick={() => onOpenLead?.(item.leadId)}
                      title="Open lead"
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold text-accent-color bg-accent-color/10 border border-accent-color/20 hover:bg-accent-color hover:text-surface-0 hover:border-transparent transition cursor-pointer"
                    >
                      <ExternalLink size={9} />
                      Open
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="pt-[var(--space-2)] border-t border-border/60 mt-[var(--space-2)] text-right shrink-0">
        <button
          onClick={onViewAll}
          className="inline-flex items-center gap-0.5 text-xs text-accent-color hover:text-accent-color/85 font-semibold cursor-pointer select-none"
        >
          View all leads <ChevronRight size={12} />
        </button>
      </div>
    </div>
  );
}
