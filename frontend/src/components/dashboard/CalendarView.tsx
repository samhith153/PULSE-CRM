'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  Plus,
  X,
  Users,
  Loader2,
} from 'lucide-react';
import { createActivity, getActivities, type ActivityTimelineItem } from '@/utils/api';

interface EventItem {
  id: string;
  title: string;
  type: 'meeting' | 'call' | 'followup' | 'task';
  date: string;
  time: string;
  attendees: string;
  details: string;
}

const CALENDAR_ACTIONS = ['meeting', 'meeting_scheduled', 'call', 'call_logged', 'task', 'follow_up'];

const ACTION_TO_TYPE: Record<string, EventItem['type']> = {
  meeting: 'meeting',
  meeting_scheduled: 'meeting',
  call: 'call',
  call_logged: 'call',
  task: 'task',
  follow_up: 'followup',
};

const TYPE_BADGE: Record<EventItem['type'], string> = {
  meeting: 'bg-purple-50 text-purple-750 border border-purple-100',
  call: 'bg-emerald-50 text-emerald-750 border border-emerald-100',
  task: 'bg-amber-50 text-amber-750 border border-amber-100',
  followup: 'bg-blue-50 text-blue-750 border border-blue-100',
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function timeToDisplay(value?: unknown): string {
  const raw = typeof value === 'string' ? value : '';
  if (!raw) return '09:00 AM';
  const [hourText, minuteText = '00'] = raw.split(':');
  const hour = Number(hourText);
  if (Number.isNaN(hour)) return raw;
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minuteText.padStart(2, '0')} ${suffix}`;
}

function toEvent(activity: ActivityTimelineItem): EventItem | null {
  if (!CALENDAR_ACTIONS.includes(activity.action)) return null;
  const payload = activity.payload ?? {};
  const scheduledDate = typeof payload.scheduled_date === 'string' ? payload.scheduled_date : undefined;
  const dt = new Date(activity.created_at);
  const date = scheduledDate || dt.toISOString().slice(0, 10);

  return {
    id: activity.id,
    title: activity.title || activity.action,
    type: ACTION_TO_TYPE[activity.action] ?? 'task',
    date,
    time: timeToDisplay(payload.scheduled_time),
    attendees: typeof payload.assignee === 'string' && payload.assignee ? payload.assignee : 'Self',
    details: activity.description || '',
  };
}

export default function CalendarView() {
  const [activeView, setActiveView] = useState<'month' | 'week' | 'day'>('week');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    type: 'task' as EventItem['type'],
    date: todayIso(),
    time: '09:00',
    attendees: '',
    details: '',
  });

  const loadEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(
        CALENDAR_ACTIONS.map((action) => getActivities({ page_size: 100, activity_type: action }))
      );
      const liveEvents = results
        .flatMap((res) => res.data ?? [])
        .map(toEvent)
        .filter((item): item is EventItem => Boolean(item))
        .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
      setEvents(liveEvents);
    } catch (e: any) {
      setError(e?.message || 'Failed to load calendar events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all(CALENDAR_ACTIONS.map((action) => getActivities({ page_size: 100, activity_type: action })))
      .then((results) => {
        if (!mounted) return;
        const liveEvents = results
          .flatMap((res) => res.data ?? [])
          .map(toEvent)
          .filter((item): item is EventItem => Boolean(item))
          .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
        setEvents(liveEvents);
        setError(null);
      })
      .catch((e) => mounted && setError(e?.message || 'Failed to load calendar events.'))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  const openCreateForm = (date = todayIso()) => {
    setSuccess(null);
    setError(null);
    setForm({ title: '', type: 'task', date, time: '09:00', attendees: '', details: '' });
    setIsAddOpen(true);
  };

  const handleDayClick = (date: string) => {
    if (date >= todayIso()) openCreateForm(date);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Task title is required.');
      return;
    }
    if (form.date < todayIso()) {
      setError('Choose today or a future date.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await createActivity({
        entity_type: 'system',
        entity_id: crypto.randomUUID(),
        action: form.type === 'followup' ? 'follow_up' : form.type,
        title: form.title.trim(),
        description: form.details.trim() || null,
        payload: {
          calendar_event: true,
          scheduled_date: form.date,
          scheduled_time: form.time,
          assignee: form.attendees.trim() || 'Self',
        },
      });
      setIsAddOpen(false);
      setSuccess('Task created successfully.');
      await loadEvents();
    } catch (e: any) {
      setError(e?.message || 'Failed to create task.');
    } finally {
      setSaving(false);
    }
  };

  const weekDays = useMemo(() => {
    const now = new Date();
    const monday = new Date(now);
    const day = (now.getDay() + 6) % 7;
    monday.setDate(now.getDate() - day);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return { day: d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3), num: d.getDate(), iso: d.toISOString().slice(0, 10), active: i === day };
    });
  }, []);

  return (
    <div className="grid grid-cols-12 gap-6 items-start">
      <div className="col-span-12 lg:col-span-8 space-y-5">
        <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div>
              <h2 className="font-sans text-2xl text-brand-heading font-bold">Calendar Schedule</h2>
              <p className="text-[11px] text-brand-text/60 mt-0.5 font-bold">Coordinate calls, demos, priority tasks, and follow-ups from live CRM activity data.</p>
            </div>

            <div className="flex items-center space-x-3 self-end sm:self-center">
              <div className="flex space-x-1 p-1 bg-brand-sidebar-hover/15 border border-brand-border-purple/20 rounded-xl">
                {['day', 'week', 'month'].map((view) => (
                  <button key={view} onClick={() => setActiveView(view as any)} className={`py-1 px-3 rounded-lg font-extrabold text-[10px] uppercase transition-all duration-200 cursor-pointer ${activeView === view ? 'bg-brand-accent text-white shadow-sm' : 'text-brand-text/75 hover:text-brand-heading hover:bg-brand-sidebar-hover/20'}`}>
                    {view}
                  </button>
                ))}
              </div>

              <button onClick={() => openCreateForm()} className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-lg text-xs font-bold transition-colors cursor-pointer">
                <Plus className="h-3.5 w-3.5" />
                <span>Add Task</span>
              </button>
            </div>
          </div>

          {success && <div className="mb-4 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-700">{success}</div>}
          {error && <div className="mb-4 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-700">{error}</div>}

          {loading ? (
            <div className="flex items-center justify-center py-24 text-slate-400 text-xs font-semibold border-t border-brand-border-purple/15">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading calendar events...
            </div>
          ) : activeView === 'week' ? (
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-brand-text border-t border-brand-border-purple/15 pt-4">
              {weekDays.map((slot) => {
                const dayEvents = events.filter((event) => event.date === slot.iso);
                const canCreate = slot.iso >= todayIso();
                return (
                  <div key={slot.iso} className="space-y-3">
                    <button type="button" onClick={() => handleDayClick(slot.iso)} disabled={!canCreate} className={`w-full p-2.5 rounded-lg border transition-colors ${slot.active ? 'bg-brand-secondary-accent/15 border-brand-secondary-accent text-brand-accent' : 'bg-slate-50/50 border-brand-border-purple/15'} ${canCreate ? 'cursor-pointer hover:border-brand-accent/50' : 'cursor-default opacity-70'}`}>
                      <p className="text-[10px] uppercase font-extrabold">{slot.day}</p>
                      <p className="text-sm font-extrabold mt-1.5 tabular-nums">{slot.num}</p>
                    </button>

                    <div className="space-y-2.5 min-h-[300px] bg-slate-50/20 rounded-lg p-1.5 border border-brand-border-purple/10">
                      {dayEvents.map((evt) => (
                        <div key={evt.id} className={`p-2 rounded text-[10px] text-left font-bold hover:shadow-sm ${TYPE_BADGE[evt.type]}`}>
                          <p className="line-clamp-2 leading-tight">{evt.title}</p>
                          <p className="text-[9px] text-slate-500 font-bold mt-1 tabular-nums">{evt.time}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-24 text-slate-400 text-xs font-semibold border-t border-brand-border-purple/15 pt-4">
              {activeView === 'month' ? 'Month grid layout loaded. Re-select Week for live scheduler.' : 'Day timeline layout loaded. Re-select Week for live scheduler.'}
            </div>
          )}
        </div>
      </div>

      <div className="col-span-12 lg:col-span-4 space-y-5">
        <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 sticky top-20">
          <h3 className="font-extrabold text-brand-heading text-sm mb-4">Agenda Details</h3>
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-10 text-slate-400 text-xs font-semibold"><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading...</div>
            ) : events.length === 0 ? (
              <p className="text-center text-slate-400 text-xs font-semibold py-10">No calendar events yet.</p>
            ) : (
              events.map((evt) => (
                <div key={evt.id} className="p-3 border border-brand-border-purple/20 rounded-xl bg-slate-50/50 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase ${TYPE_BADGE[evt.type]}`}>{evt.type}</span>
                    <span className="text-[9px] text-slate-450 font-bold flex items-center tabular-nums"><Clock className="h-3 w-3 mr-1" />{evt.time}</span>
                  </div>
                  <h4 className="text-xs font-extrabold text-brand-heading leading-snug">{evt.title}</h4>
                  <p className="text-[10px] text-brand-text/80 leading-relaxed font-semibold">{evt.details || 'No description provided.'}</p>
                  <div className="pt-2 border-t border-brand-border-purple/10 flex justify-between items-center text-[10px] font-bold text-brand-text/60">
                    <span className="flex items-center"><Users className="h-3.5 w-3.5 mr-1 text-slate-400" />{evt.attendees}</span>
                    <span className="text-brand-accent">{evt.date}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-brand-border-purple/25 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-brand-border-purple/15 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-brand-heading text-sm">Create Calendar Task</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-brand-text p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleAdd} className="p-5 space-y-4">
              <div>
                <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Title</label>
                <input type="text" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Type</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value as EventItem['type']})} className="w-full px-2 py-1.5 border border-brand-border-purple/35 bg-white text-brand-text rounded-lg text-xs cursor-pointer">
                    <option value="task">task</option>
                    <option value="meeting">meeting</option>
                    <option value="call">call</option>
                    <option value="followup">followup</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Assignee</label>
                  <input type="text" placeholder="e.g. Alex Rivera" value={form.attendees} onChange={e => setForm({...form, attendees: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Date</label>
                  <input type="date" required min={todayIso()} value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text focus:outline-none cursor-pointer" />
                </div>
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Time</label>
                  <input type="time" required value={form.time} onChange={e => setForm({...form, time: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Description</label>
                <textarea placeholder="Discuss scope..." value={form.details} onChange={e => setForm({...form, details: e.target.value})} className="w-full p-2 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text focus:outline-none min-h-[60px]" />
              </div>
              <div className="pt-3 border-t border-brand-border-purple/15 flex justify-end space-x-2.5">
                <button type="button" disabled={saving} onClick={() => setIsAddOpen(false)} className="px-4 py-1.5 border border-brand-border-purple/30 rounded-lg text-xs font-bold text-brand-text/75 hover:bg-slate-50 cursor-pointer disabled:opacity-60">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-1.5 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-lg text-xs font-bold shadow-sm/10 cursor-pointer disabled:opacity-60 inline-flex items-center gap-1.5">
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{saving ? 'Saving...' : 'Save Task'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
