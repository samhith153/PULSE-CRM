'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  Users,
  Loader2,
} from 'lucide-react';
import {
  getCrmActivities,
  type CrmActivity,
} from '@/utils/api';

interface EventItem {
  id: string;
  title: string;
  type: 'meeting' | 'call' | 'followup' | 'task';
  date: string;
  time: string;
  attendees: string;
  details: string;
  status?: string;
  priority?: string;
  relatedRecordName?: string | null;
}

const ACTIVITY_TO_EVENT_TYPE: Record<string, EventItem['type']> = {
  meeting: 'meeting',
  call: 'call',
  task: 'task',
  email: 'followup',
  note: 'followup',
};

const TYPE_BADGE: Record<EventItem['type'], string> = {
  meeting: 'bg-accent-color/10 text-accent-color border border-accent-color/20',
  call: 'bg-accent-color/15 text-status-success-text border border-accent-color/20',
  task: 'bg-status-warning-bg text-status-warning-text border border-status-warning-text/30 shadow-[0_1px_2px_rgba(0,0,0,0.05)]',
  followup: 'bg-status-info-text/10 text-status-info-text border border-status-info-text/20',
};

/**
 * IMPORTANT:
 * Do not use toISOString().slice(0, 10) for calendar dates.
 * toISOString() converts the date to UTC and can move a local
 * activity from Aug 9 to Aug 10 (or vice versa).
 */
function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function toEvent(a: CrmActivity): EventItem {
  const type = ACTIVITY_TO_EVENT_TYPE[a.activity_type] ?? 'followup';

  const dateValue = a.due_date || a.created_at;
  const dt = new Date(dateValue);

  return {
    id: a.id,
    title: a.subject || 'Untitled activity',
    type,
    date: localDateKey(dt),
    time: a.due_date
      ? dt.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'No time',
    attendees: a.related_record_name || a.owner_name || 'Self',
    details: a.details?.description || a.details?.body || '',
    status: a.status,
    priority: a.priority,
    relatedRecordName: a.related_record_name,
  };
}

export default function CalendarView() {
  const [activeView, setActiveView] = useState<'month' | 'week' | 'day'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    type: 'meeting' as EventItem['type'],
    date: localDateKey(new Date()),
    time: '10:00 AM',
    attendees: '',
    details: '',
  });

  useEffect(() => {
    let cancelled = false;

    const loadCalendarActivities = async () => {
      setLoading(true);

      try {
        const result = await getCrmActivities({
          view: 'timeline',
          page: 1,
          page_size: 100,
          sort_order: 'asc',
        });

        if (cancelled) return;

        const loadedEvents = (result.data ?? []).map(toEvent);

        setEvents(loadedEvents);

        setSelectedEventId(prev => {
          if (prev && loadedEvents.some(event => event.id === prev)) {
            return prev;
          }

          return loadedEvents[0]?.id ?? null;
        });

        setError(null);
      } catch (e: any) {
        if (cancelled) return;

        setError(e?.message || 'Failed to load activities');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadCalendarActivities();

    const handleActivityCreated = () => {
      void loadCalendarActivities();
    };

    window.addEventListener(
      'pulse-crm-activity-created',
      handleActivityCreated
    );

    return () => {
      cancelled = true;

      window.removeEventListener(
        'pulse-crm-activity-created',
        handleActivityCreated
      );
    };
  }, []);

  useEffect(() => {
    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent;
      const data = customEvent.detail || {};

      setForm({
        title: data.title || '',
        type: data.type || 'meeting',
        date: data.date || localDateKey(new Date()),
        time: data.time || '10:00 AM',
        attendees: data.attendees || '',
        details: data.details || '',
      });

      setIsAddOpen(true);
    };

    window.addEventListener(
      'pulse-open-create-calendar-event-modal',
      handleOpen
    );

    return () => {
      window.removeEventListener(
        'pulse-open-create-calendar-event-modal',
        handleOpen
      );
    };
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

    setEvents(prev => [...prev, newEvent]);
    setIsAddOpen(false);
  };

  const getBadgeColor = (type: EventItem['type']) => TYPE_BADGE[type];

  const weekDays = useMemo(() => {
    const date = new Date(currentDate);
    const day = (date.getDay() + 6) % 7;

    const monday = new Date(date);
    monday.setDate(date.getDate() - day);
    monday.setHours(0, 0, 0, 0);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);

      return {
        day: d.toLocaleDateString('en-US', {
          weekday: 'short',
        }),
        num: d.getDate(),
        iso: localDateKey(d),
        active: d.toDateString() === new Date().toDateString(),
      };
    });
  }, [currentDate]);

  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startOffset = (firstDay.getDay() + 6) % 7;
    const totalDays = lastDay.getDate();

    const days: Array<{
      date: Date;
      iso: string;
      isCurrentMonth: boolean;
      isToday: boolean;
    }> = [];

    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);

      days.push({
        date: d,
        iso: localDateKey(d),
        isCurrentMonth: false,
        isToday: d.toDateString() === new Date().toDateString(),
      });
    }

    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(year, month, day);

      days.push({
        date: d,
        iso: localDateKey(d),
        isCurrentMonth: true,
        isToday: d.toDateString() === new Date().toDateString(),
      });
    }

    let nextDay = 1;

    while (days.length < 42) {
      const d = new Date(year, month + 1, nextDay++);

      days.push({
        date: d,
        iso: localDateKey(d),
        isCurrentMonth: false,
        isToday: d.toDateString() === new Date().toDateString(),
      });
    }

    return days;
  }, [currentDate]);

  const selectedDayIso = localDateKey(currentDate);

  const selectedDayEvents = useMemo(
    () =>
      events
        .filter(event => event.date === selectedDayIso)
        .sort((a, b) => a.time.localeCompare(b.time)),
    [events, selectedDayIso]
  );

  const selectedEvent = useMemo(
    () => events.find(event => event.id === selectedEventId) ?? null,
    [events, selectedEventId]
  );

  const monthTitle = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const weekTitle = useMemo(() => {
    if (weekDays.length !== 7) return '';

    const start = new Date(`${weekDays[0].iso}T00:00:00`);
    const end = new Date(`${weekDays[6].iso}T00:00:00`);

    if (start.getFullYear() === end.getFullYear()) {
      if (start.getMonth() === end.getMonth()) {
        return `${start.toLocaleDateString('en-US', {
          month: 'long',
        })} ${start.getDate()}–${end.getDate()}, ${start.getFullYear()}`;
      }

      return `${start.toLocaleDateString('en-US', {
        month: 'short',
      })} ${start.getDate()} – ${end.toLocaleDateString('en-US', {
        month: 'short',
      })} ${end.getDate()}, ${end.getFullYear()}`;
    }

    return `${start.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })} – ${end.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })}`;
  }, [weekDays]);

  const goToPrevious = () => {
    setCurrentDate(prev => {
      const next = new Date(prev);

      if (activeView === 'month') {
        next.setMonth(next.getMonth() - 1);
      } else if (activeView === 'week') {
        next.setDate(next.getDate() - 7);
      } else {
        next.setDate(next.getDate() - 1);
      }

      return next;
    });
  };

  const goToNext = () => {
    setCurrentDate(prev => {
      const next = new Date(prev);

      if (activeView === 'month') {
        next.setMonth(next.getMonth() + 1);
      } else if (activeView === 'week') {
        next.setDate(next.getDate() + 7);
      } else {
        next.setDate(next.getDate() + 1);
      }

      return next;
    });
  };

  const goToToday = () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    setCurrentDate(today);
  };

  const isShowingToday =
    currentDate.toDateString() === new Date().toDateString();

  return (
    <div className="grid grid-cols-12 gap-6 items-start">
      <div className="col-span-12 lg:col-span-8 space-y-5">
        <div className="bg-surface-1 border border-border-default rounded-2xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div>
              <h2 className="font-sans text-2xl text-text-primary font-bold">
                Calendar Schedule
              </h2>

              <p className="text-[11px] text-text-muted mt-0.5 font-bold">
                Coordinate outbound calls, video demos, priority tasks, and team follow-ups.
              </p>

              <p className="text-[11px] text-accent-color font-bold mt-2">
                {activeView === 'month'
                  ? monthTitle
                  : activeView === 'week'
                    ? weekTitle
                    : currentDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
              </p>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center">
              <div className="flex items-center gap-1">
                <button
                  onClick={goToPrevious}
                  className="p-1.5 border border-border-default rounded-lg hover:bg-surface-2 text-text-muted hover:text-text-primary cursor-pointer"
                  title="Previous"
                  type="button"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <button
                  onClick={goToToday}
                  className={`px-2.5 py-1.5 border border-border-default rounded-lg text-[10px] font-bold cursor-pointer ${
                    isShowingToday
                      ? 'bg-accent-color text-primary-foreground border-accent-color'
                      : 'hover:bg-surface-2 text-text-primary'
                  }`}
                  type="button"
                >
                  Today
                </button>

                <button
                  onClick={goToNext}
                  className="p-1.5 border border-border-default rounded-lg hover:bg-surface-2 text-text-muted hover:text-text-primary cursor-pointer"
                  title="Next"
                  type="button"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="flex space-x-1 p-1 bg-surface-2 border border-border-default rounded-xl">
                {['day', 'week', 'month'].map(view => (
                  <button
                    key={view}
                    onClick={() =>
                      setActiveView(view as 'month' | 'week' | 'day')
                    }
                    className={`py-1 px-3 rounded-lg font-semibold text-[10px] uppercase transition duration-200 cursor-pointer ${
                      activeView === view
                        ? 'bg-accent-color text-primary-foreground'
                        : 'text-text-muted hover:text-text-primary hover:bg-surface-2'
                    }`}
                    type="button"
                  >
                    {view}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setIsAddOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-accent-color hover:bg-accent-color/90 text-primary-foreground rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                type="button"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Event</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24 text-text-muted text-xs font-semibold border-t border-border-default">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Loading activities…
            </div>
          ) : error ? (
            <div className="py-24 text-center text-status-danger text-xs font-semibold border-t border-border-default">
              {error}
            </div>
          ) : activeView === 'week' ? (
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-text-primary border-t border-border-default pt-4">
              {weekDays.map((slot, idx) => {
                const dayEvents = events.filter(
                  event => event.date === slot.iso
                );

                return (
                  <div key={idx} className="space-y-3">
                    <div
                      className={`p-2.5 rounded-lg border ${
                        slot.active
                          ? 'bg-accent-color/10 border-accent-color text-accent-color'
                          : 'bg-surface-2 border-border-default'
                      }`}
                    >
                      <p className="text-[10px] uppercase font-semibold">
                        {slot.day}
                      </p>

                      <p className="text-sm font-semibold mt-1.5 tabular-nums">
                        {slot.num}
                      </p>
                    </div>

                    <div className="space-y-2.5 min-h-[300px] bg-surface-2/20 rounded-lg p-1.5 border border-border-default">
                      {dayEvents.length === 0 ? (
                        <div className="text-[9px] text-text-muted/40 py-5">
                          —
                        </div>
                      ) : (
                        dayEvents.map(evt => (
                          <button
                            key={evt.id}
                            type="button"
                            onClick={() => setSelectedEventId(evt.id)}
                            className={`w-full p-2 rounded-lg text-[10px] text-left font-bold cursor-pointer border transition-all hover:-translate-y-0.5 hover:shadow-sm ${
                              selectedEventId === evt.id
                                ? 'ring-2 ring-accent-color/40 shadow-sm'
                                : ''
                            } ${getBadgeColor(evt.type)}`}
                          >
                            <p className="line-clamp-2 leading-tight">
                              {evt.title}
                            </p>

                            <p className="text-[9px] text-text-muted font-bold mt-1 tabular-nums">
                              {evt.time}
                            </p>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : activeView === 'month' ? (
            <div className="border-t border-border-default pt-4">
              <div className="grid grid-cols-7 border-l border-t border-border-default">
                {[
                  'MON',
                  'TUE',
                  'WED',
                  'THU',
                  'FRI',
                  'SAT',
                  'SUN',
                ].map(day => (
                  <div
                    key={day}
                    className="py-2 text-center text-[10px] font-bold text-text-muted border-r border-b border-border-default bg-surface-2/40"
                  >
                    {day}
                  </div>
                ))}

                {monthDays.map((day, index) => {
                  const dayEvents = events.filter(
                    event => event.date === day.iso
                  );

                  return (
                    <div
                      key={index}
                      className={`min-h-[120px] p-2 border-r border-b border-border-default ${
                        !day.isCurrentMonth
                          ? 'bg-surface-2/20'
                          : 'bg-surface-1'
                      } ${
                        day.isToday
                          ? 'ring-2 ring-inset ring-accent-color/40'
                          : ''
                      }`}
                    >
                      <div
                        className={`text-[11px] font-bold mb-2 ${
                          day.isCurrentMonth
                            ? 'text-text-primary'
                            : 'text-text-muted/40'
                        }`}
                      >
                        {day.date.getDate()}
                      </div>

                      <div className="space-y-1">
                        {dayEvents.slice(0, 4).map(evt => (
                          <button
                            key={evt.id}
                            type="button"
                            onClick={() => setSelectedEventId(evt.id)}
                            className={`w-full text-left px-1.5 py-1 rounded text-[9px] font-bold truncate cursor-pointer border transition-all hover:shadow-sm ${
                              selectedEventId === evt.id
                                ? 'ring-2 ring-accent-color/40'
                                : ''
                            } ${getBadgeColor(evt.type)}`}
                            title={`${evt.title} — ${evt.time}`}
                          >
                            {evt.title}
                          </button>
                        ))}

                        {dayEvents.length > 4 && (
                          <div className="text-[9px] text-accent-color font-bold px-1">
                            +{dayEvents.length - 4} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="border-t border-border-default pt-4">
              <div className="mb-4">
                <p className="text-sm font-bold text-text-primary">
                  {currentDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>

                <p className="text-[10px] text-text-muted font-semibold mt-1">
                  {selectedDayEvents.length}{' '}
                  {selectedDayEvents.length === 1
                    ? 'activity'
                    : 'activities'}
                </p>
              </div>

              {selectedDayEvents.length === 0 ? (
                <div className="py-20 text-center border border-border-default rounded-xl bg-surface-2/20">
                  <CalendarIcon className="h-8 w-8 mx-auto text-text-muted/40 mb-3" />

                  <p className="text-xs font-bold text-text-primary">
                    No activities scheduled
                  </p>

                  <p className="text-[10px] text-text-muted mt-1">
                    There are no tasks, calls, or meetings scheduled for this day.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedDayEvents.map(evt => (
                    <button
                      key={evt.id}
                      type="button"
                      onClick={() => setSelectedEventId(evt.id)}
                      className={`w-full text-left flex items-stretch border rounded-xl overflow-hidden bg-surface-1 hover:bg-surface-2/20 transition-all cursor-pointer ${
                        selectedEventId === evt.id
                          ? 'border-accent-color ring-2 ring-accent-color/20'
                          : 'border-border-default'
                      }`}
                    >
                      <div className="w-24 shrink-0 bg-surface-2/40 flex items-center justify-center border-r border-border-default">
                        <span className="text-xs font-bold text-text-primary">
                          {evt.time}
                        </span>
                      </div>

                      <div className="flex-1 p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${getBadgeColor(
                              evt.type
                            )}`}
                          >
                            {evt.type}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-text-primary">
                          {evt.title}
                        </h4>

                        {evt.details && (
                          <p className="text-[10px] text-text-muted mt-1">
                            {evt.details}
                          </p>
                        )}

                        <div className="flex items-center gap-3 mt-2 text-[10px] text-text-muted">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {evt.attendees}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {isAddOpen && (
          <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div
              className="bg-surface-1 border border-border-default rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-5 py-3.5 border-b border-border-default flex justify-between items-center bg-surface-2">
                <h3 className="font-bold text-text-primary text-sm">
                  Add Calendar Event
                </h3>

                <button
                  onClick={() => setIsAddOpen(false)}
                  className="text-text-muted hover:text-text-primary p-1 cursor-pointer"
                  type="button"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <form onSubmit={handleAdd} className="p-5 space-y-4">
                <div>
                  <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">
                    Event Title
                  </label>

                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={e =>
                      setForm({ ...form, title: e.target.value })
                    }
                    className="w-full px-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">
                      Event Type
                    </label>

                    <select
                      value={form.type}
                      onChange={e =>
                        setForm({
                          ...form,
                          type: e.target.value as EventItem['type'],
                        })
                      }
                      className="w-full px-2 py-1.5 border border-border-default bg-surface-1 text-text-primary rounded-lg text-xs cursor-pointer"
                    >
                      <option value="meeting">meeting</option>
                      <option value="call">call</option>
                      <option value="task">task</option>
                      <option value="followup">followup</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">
                      Attendees
                    </label>

                    <input
                      type="text"
                      required
                      placeholder="e.g. Alex Rivera"
                      value={form.attendees}
                      onChange={e =>
                        setForm({ ...form, attendees: e.target.value })
                      }
                      className="w-full px-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">
                      Date
                    </label>

                    <input
                      type="date"
                      required
                      value={form.date}
                      onChange={e =>
                        setForm({ ...form, date: e.target.value })
                      }
                      className="w-full px-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary focus:outline-none cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">
                      Time
                    </label>

                    <input
                      type="text"
                      required
                      placeholder="e.g. 10:00 AM"
                      value={form.time}
                      onChange={e =>
                        setForm({ ...form, time: e.target.value })
                      }
                      className="w-full px-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">
                    Agenda / Description
                  </label>

                  <textarea
                    required
                    placeholder="Discuss scope..."
                    value={form.details}
                    onChange={e =>
                      setForm({ ...form, details: e.target.value })
                    }
                    className="w-full p-2 border border-border-default rounded-lg text-xs text-text-primary focus:outline-none min-h-[60px]"
                  />
                </div>

                <div className="pt-3 border-t border-border-default flex justify-end space-x-2.5">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="px-4 py-1.5 border border-border-default rounded-lg text-xs font-bold text-text-muted hover:bg-surface-2 cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-accent-color hover:bg-accent-color/90 text-primary-foreground rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Save Event
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <aside className="col-span-12 lg:col-span-4">
        <div className="bg-surface-1 border border-border-default rounded-2xl p-5 lg:sticky lg:top-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-text-primary">
                Agenda Details
              </h3>
              <p className="text-[10px] text-text-muted mt-0.5">
                Select an activity to view its details.
              </p>
            </div>

            {selectedEvent && (
              <button
                type="button"
                onClick={() => setSelectedEventId(null)}
                className="p-1.5 rounded-lg hover:bg-surface-2 text-text-muted hover:text-text-primary cursor-pointer"
                title="Clear selection"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {selectedEvent ? (
            <div className="space-y-4">
              <div
                className={`rounded-xl border p-4 ${getBadgeColor(
                  selectedEvent.type
                )}`}
              >
                <div className="flex items-center justify-between gap-3 mb-3">
                  <span className="text-[9px] uppercase font-bold tracking-wide px-2 py-1 rounded-full bg-white/70">
                    {selectedEvent.type}
                  </span>

                  {selectedEvent.status && (
                    <span className="text-[9px] font-bold uppercase text-text-primary/70">
                      {selectedEvent.status}
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-bold text-text-primary leading-snug">
                  {selectedEvent.title}
                </h4>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CalendarIcon className="h-4 w-4 text-accent-color mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[9px] uppercase tracking-wide font-bold text-text-muted">
                      Due date
                    </p>
                    <p className="text-xs font-semibold text-text-primary mt-0.5">
                      {new Date(`${selectedEvent.date}T12:00:00`).toLocaleDateString(
                        'en-US',
                        {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        }
                      )}
                    </p>
                    {selectedEvent.time !== 'No time' && (
                      <p className="text-[10px] text-text-muted mt-0.5">
                        {selectedEvent.time}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="h-4 w-4 text-accent-color mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[9px] uppercase tracking-wide font-bold text-text-muted">
                      Related record / owner
                    </p>
                    <p className="text-xs font-semibold text-text-primary mt-0.5">
                      {selectedEvent.attendees || 'Not specified'}
                    </p>
                  </div>
                </div>

                {selectedEvent.priority && (
                  <div className="flex items-start gap-3">
                    <div className="h-4 w-4 rounded-full border-2 border-accent-color mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[9px] uppercase tracking-wide font-bold text-text-muted">
                        Priority
                      </p>
                      <p className="text-xs font-semibold text-text-primary mt-0.5 capitalize">
                        {selectedEvent.priority}
                      </p>
                    </div>
                  </div>
                )}

                {selectedEvent.details && (
                  <div className="pt-3 border-t border-border-default">
                    <p className="text-[9px] uppercase tracking-wide font-bold text-text-muted mb-1.5">
                      Description
                    </p>
                    <p className="text-xs leading-relaxed text-text-primary">
                      {selectedEvent.details}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="min-h-[280px] rounded-xl border border-dashed border-border-default bg-surface-2/20 flex flex-col items-center justify-center text-center px-6">
              <div className="h-10 w-10 rounded-full bg-accent-color/10 flex items-center justify-center mb-3">
                <CalendarIcon className="h-5 w-5 text-accent-color" />
              </div>

              <p className="text-xs font-bold text-text-primary">
                No activity selected
              </p>

              <p className="text-[10px] text-text-muted mt-1 leading-relaxed">
                Click a task, call, meeting, or follow-up in the calendar to
                view its full details.
              </p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}