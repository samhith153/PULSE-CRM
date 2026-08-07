'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Users,
  Video,
  PhoneCall,
  Loader2,
} from 'lucide-react';
import { getActivities, ActivityTimelineItem } from '@/utils/api';

interface EventItem {
  id: string;
  title: string;
  type: 'meeting' | 'call' | 'followup' | 'task';
  date: string;
  time: string;
  attendees: string;
  details: string;
}

const ACTION_TO_TYPE: Record<string, EventItem['type']> = {
  meeting: 'meeting',
  meeting_scheduled: 'meeting',
  call: 'call',
  call_logged: 'call',
  task: 'task',
  task_completed: 'task',
  note: 'followup',
  follow_up: 'followup',
  email: 'followup',
  email_sent: 'followup',
  email_received: 'followup',
};

const TYPE_BADGE: Record<EventItem['type'], string> = {
  meeting: 'bg-brand-purple/10 text-purple-750 border border-purple-100',
  call: 'bg-brand-cyan/15 text-emerald-750 border border-brand-cyan/20',
  task: 'bg-amber-50 text-amber-750 border border-amber-100',
  followup: 'bg-blue-50 text-blue-750 border border-blue-100',
};

function toEvent(a: ActivityTimelineItem): EventItem {
  const type = ACTION_TO_TYPE[a.action] ?? 'followup';
  const dt = new Date(a.created_at);
  const date = dt.toISOString().slice(0, 10);
  const time = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return {
    id: a.id,
    title: a.title || a.action,
    type,
    date,
    time,
    attendees: a.entity_type ? `${a.entity_type}` : 'Self',
    details: a.description || '',
  };
}

export default function CalendarView() {
  const [activeView, setActiveView] = useState<'month' | 'week' | 'day'>('week');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState({
    title: '', type: 'meeting' as EventItem['type'], date: new Date().toISOString().slice(0, 10), time: '10:00 AM', attendees: '', details: ''
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getActivities({ page_size: 100 })
      .then((res) => {
        if (cancelled) return;
        const items: ActivityTimelineItem[] = Array.isArray(res) ? res : (res?.data ?? []);
        setEvents(items.map(toEvent));
        setError(null);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.message || 'Failed to load activities');
      })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent;
      const data = customEvent.detail || {};
      setForm({
        title: data.title || '',
        type: data.type || 'meeting',
        date: data.date || new Date().toISOString().slice(0, 10),
        time: data.time || '10:00 AM',
        attendees: data.attendees || '',
        details: data.details || '',
      });
      setIsAddOpen(true);
    };
    window.addEventListener('pulse-open-create-calendar-event-modal', handleOpen);
    return () => window.removeEventListener('pulse-open-create-calendar-event-modal', handleOpen);
  }, []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const newEvent: EventItem = {
      id: `local-${Date.now()}`,
      title: form.title,
      type: form.type,
      date: form.date,
      time: form.time,
      attendees: form.attendees,
      details: form.details,
    };
    setEvents([...events, newEvent]);
    setIsAddOpen(false);
  };

  const getBadgeColor = (type: EventItem['type']) => TYPE_BADGE[type];

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
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div>
              <h2 className="font-sans text-2xl text-foreground font-bold">Calendar Schedule</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-bold">Coordinate outbound calls, video demos, priority tasks, and team follow-ups.</p>
            </div>

            <div className="flex items-center space-x-3 self-end sm:self-center">
              <div className="flex space-x-1 p-1 bg-secondary border border-border rounded-xl">
                {['day', 'week', 'month'].map((view) => (
                  <button
                    key={view}
                    onClick={() => setActiveView(view as any)}
                    className={`py-1 px-3 rounded-lg font-semibold text-[10px] uppercase transition-all duration-200 cursor-pointer ${
                      activeView === view
                        ? 'bg-brand-purple text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                  >
                    {view}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setIsAddOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-brand-purple hover:bg-brand-purple/90 text-primary-foreground rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Event</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24 text-muted-foreground text-xs font-semibold border-t border-border">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading activities…
            </div>
          ) : error ? (
            <div className="py-24 text-center text-destructive text-xs font-semibold border-t border-border">{error}</div>
          ) : activeView === 'week' ? (
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-foreground border-t border-border pt-4">
              {weekDays.map((slot, idx) => {
                const dayEvents = events.filter((e) => e.date === slot.iso);
                return (
                  <div key={idx} className="space-y-3">
                    <div className={`p-2.5 rounded-lg border ${
                      slot.active
                        ? 'bg-brand-purple/10 border-brand-secondary-accent text-brand-purple'
                        : 'bg-secondary border-border'
                    }`}>
                      <p className="text-[10px] uppercase font-semibold">{slot.day}</p>
                      <p className="text-sm font-semibold mt-1.5 tabular-nums">{slot.num}</p>
                    </div>

                    <div className="space-y-2.5 min-h-[300px] bg-secondary/20 rounded-lg p-1.5 border border-border">
                      {dayEvents.map((evt) => (
                        <div key={evt.id} className={`p-2 rounded text-[10px] text-left font-bold cursor-pointer hover: ${getBadgeColor(evt.type)}`}>
                          <p className="line-clamp-2 leading-tight">{evt.title}</p>
                          <p className="text-[9px] text-muted-foreground font-bold mt-1 tabular-nums">{evt.time}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-24 text-muted-foreground text-xs font-semibold border-t border-border pt-4">
              {activeView === 'month' ? "Month grid layout loaded. Re-select Week for live scheduler." : "Day timeline layout loaded. Re-select Week for live scheduler."}
            </div>
          )}
        </div>
      </div>

      <div className="col-span-12 lg:col-span-4 space-y-5">
        <div className="bg-card border border-border rounded-2xl p-5 sticky top-20">
          <h3 className="font-semibold text-foreground text-sm mb-4">Agenda Details</h3>

          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground text-xs font-semibold"><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading…</div>
            ) : events.length === 0 ? (
              <p className="text-center text-muted-foreground text-xs font-semibold py-10">No activities yet.</p>
            ) : (
              events.map((evt) => (
                <div key={evt.id} className="p-3 border border-border rounded-xl bg-secondary space-y-2">
                  <div className="flex justify-between items-center">
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full uppercase ${getBadgeColor(evt.type)}`}>
                      {evt.type}
                    </span>
                    <span className="text-[9px] text-muted-foreground font-bold flex items-center tabular-nums">
                      <Clock className="h-3 w-3 mr-1" />
                      {evt.time}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-foreground leading-snug">{evt.title}</h4>
                  <p className="text-[10px] text-muted-foreground leading-relaxed font-semibold">{evt.details}</p>
                  <div className="pt-2 border-t border-border flex justify-between items-center text-[10px] font-bold text-muted-foreground">
                    <span className="flex items-center">
                      <Users className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                      {evt.attendees}
                    </span>
                    <span className="text-brand-purple">{evt.date}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-border flex justify-between items-center bg-secondary">
              <h3 className="font-bold text-foreground text-sm">Add Calendar Event</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleAdd} className="p-5 space-y-4">
              <div>
                <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Event Title</label>
                <input type="text" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Event Type</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value as any})} className="w-full px-2 py-1.5 border border-border bg-card text-foreground rounded-lg text-xs cursor-pointer">
                    <option>meeting</option>
                    <option>call</option>
                    <option>task</option>
                    <option>followup</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Attendees</label>
                  <input type="text" required placeholder="e.g. Alex Rivera" value={form.attendees} onChange={e => setForm({...form, attendees: e.target.value})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Date</label>
                  <input type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none cursor-pointer" />
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Time</label>
                  <input type="text" required placeholder="e.g. 10:00 AM" value={form.time} onChange={e => setForm({...form, time: e.target.value})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Agenda / Description</label>
                <textarea required placeholder="Discuss scope..." value={form.details} onChange={e => setForm({...form, details: e.target.value})} className="w-full p-2 border border-border rounded-lg text-xs text-foreground focus:outline-none min-h-[60px]" />
              </div>
              <div className="pt-3 border-t border-border flex justify-end space-x-2.5">
                <button type="button" onClick={() => setIsAddOpen(false)} className="px-4 py-1.5 border border-border rounded-lg text-xs font-bold text-muted-foreground hover:bg-secondary cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-brand-purple hover:bg-brand-purple/90 text-primary-foreground rounded-lg text-xs font-semibold/10 cursor-pointer">Save Event</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

