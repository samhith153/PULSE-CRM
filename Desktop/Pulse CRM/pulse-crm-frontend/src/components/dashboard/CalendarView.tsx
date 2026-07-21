'use client';

import React, { useState } from 'react';
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
  PhoneCall
} from 'lucide-react';

interface EventItem {
  id: number;
  title: string;
  type: 'meeting' | 'call' | 'followup' | 'task';
  date: string;
  time: string;
  attendees: string;
  details: string;
}

export default function CalendarView() {
  const [activeView, setActiveView] = useState<'month' | 'week' | 'day'>('week');
  const [events, setEvents] = useState<EventItem[]>([
    { id: 1, title: "SSO Migration Scope Sync", type: "meeting", date: "2025-05-14", time: "10:00 AM", attendees: "Alex Rivera", details: "Review SAML setup specs and security guidelines." },
    { id: 2, title: "Call: Marcus HIPAA Check", type: "call", date: "2025-05-15", time: "02:30 PM", attendees: "Marcus Aurelius", details: "Log call details on healthcare privacy standards." },
    { id: 3, title: "Task: Proposal Outline draft", type: "task", date: "2025-05-16", time: "11:00 AM", attendees: "Self", details: "Draft custom proposal for TechCorp cloud project." },
    { id: 4, title: "Follow-up: Helena Troy", type: "followup", date: "2025-05-14", time: "04:00 PM", attendees: "Helena Troy", details: "Email volumetric team agency pricing sheet." }
  ]);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState({
    title: '', type: 'meeting' as EventItem['type'], date: '2025-05-14', time: '10:00 AM', attendees: '', details: ''
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const newEvent: EventItem = {
      id: Date.now(),
      title: form.title,
      type: form.type,
      date: form.date,
      time: form.time,
      attendees: form.attendees,
      details: form.details
    };
    setEvents([...events, newEvent]);
    setIsAddOpen(false);
  };

  const getBadgeColor = (type: EventItem['type']) => {
    switch (type) {
      case 'meeting': return 'bg-purple-50 text-purple-750 border border-purple-100';
      case 'call': return 'bg-emerald-50 text-emerald-750 border border-emerald-100';
      case 'task': return 'bg-amber-50 text-amber-750 border border-amber-100';
      case 'followup': return 'bg-blue-50 text-blue-750 border border-blue-100';
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6 items-start">
      {/* Calendar Grid representation (Col 8) */}
      <div className="col-span-12 lg:col-span-8 space-y-5">
        <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div>
              <h2 className="font-sans text-2xl text-brand-heading font-bold">Calendar Schedule</h2>
              <p className="text-[11px] text-brand-text/60 mt-0.5 font-bold">Coordinate outbound calls, video demos, priority tasks, and team follow-ups.</p>
            </div>
            
            <div className="flex items-center space-x-3 self-end sm:self-center">
              {/* Day/Week/Month tabs */}
              <div className="flex space-x-1 p-1 bg-brand-sidebar-hover/15 border border-brand-border-purple/20 rounded-xl">
                {['day', 'week', 'month'].map((view) => (
                  <button
                    key={view}
                    onClick={() => setActiveView(view as any)}
                    className={`py-1 px-3 rounded-lg font-extrabold text-[10px] uppercase transition-all duration-200 cursor-pointer ${
                      activeView === view 
                        ? 'bg-brand-accent text-white shadow-sm' 
                        : 'text-brand-text/75 hover:text-brand-heading hover:bg-brand-sidebar-hover/20'
                    }`}
                  >
                    {view}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setIsAddOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Event</span>
              </button>
            </div>
          </div>

          {/* Calendar visual grid - Week View */}
          {activeView === 'week' && (
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-brand-text border-t border-brand-border-purple/15 pt-4">
              {[
                { day: 'Mon', num: 12, active: false },
                { day: 'Tue', num: 13, active: false },
                { day: 'Wed', num: 14, active: true }, // Today
                { day: 'Thu', num: 15, active: false },
                { day: 'Fri', num: 16, active: false },
                { day: 'Sat', num: 17, active: false },
                { day: 'Sun', num: 18, active: false }
              ].map((slot, idx) => {
                const dayEvents = events.filter(e => e.date === `2025-05-${slot.num}`);
                return (
                  <div key={idx} className="space-y-3">
                    <div className={`p-2.5 rounded-lg border ${
                      slot.active 
                        ? 'bg-brand-secondary-accent/15 border-brand-secondary-accent text-brand-accent' 
                        : 'bg-slate-50/50 border-brand-border-purple/15'
                    }`}>
                      <p className="text-[10px] uppercase font-extrabold">{slot.day}</p>
                      <p className="text-sm font-extrabold mt-1.5 tabular-nums">{slot.num}</p>
                    </div>

                    {/* Stage events list nested inside card slot */}
                    <div className="space-y-2.5 min-h-[300px] bg-slate-50/20 rounded-lg p-1.5 border border-brand-border-purple/10">
                      {dayEvents.map((evt) => (
                        <div key={evt.id} className={`p-2 rounded text-[10px] text-left font-bold cursor-pointer hover:shadow-sm ${getBadgeColor(evt.type)}`}>
                          <p className="line-clamp-2 leading-tight">{evt.title}</p>
                          <p className="text-[9px] text-slate-500 font-bold mt-1 tabular-nums">{evt.time}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeView !== 'week' && (
            <div className="text-center py-24 text-slate-400 text-xs font-semibold border-t border-brand-border-purple/15 pt-4">
              {activeView === 'month' ? "Month grid layout loaded. Re-select Week for live scheduler demo." : "Day timeline layout loaded. Re-select Week for live scheduler demo."}
            </div>
          )}
        </div>
      </div>

      {/* Side event list view (Col 4) */}
      <div className="col-span-12 lg:col-span-4 space-y-5">
        <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 sticky top-20">
          <h3 className="font-extrabold text-brand-heading text-sm mb-4">Agenda Details</h3>
          
          <div className="space-y-4">
            {events.map((evt) => (
              <div key={evt.id} className="p-3 border border-brand-border-purple/20 rounded-xl bg-slate-50/50 space-y-2">
                <div className="flex justify-between items-center">
                  <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase ${getBadgeColor(evt.type)}`}>
                    {evt.type}
                  </span>
                  <span className="text-[9px] text-slate-450 font-bold flex items-center tabular-nums">
                    <Clock className="h-3 w-3 mr-1" />
                    {evt.time}
                  </span>
                </div>
                <h4 className="text-xs font-extrabold text-brand-heading leading-snug">{evt.title}</h4>
                <p className="text-[10px] text-brand-text/80 leading-relaxed font-semibold">{evt.details}</p>
                <div className="pt-2 border-t border-brand-border-purple/10 flex justify-between items-center text-[10px] font-bold text-brand-text/60">
                  <span className="flex items-center">
                    <Users className="h-3.5 w-3.5 mr-1 text-slate-400" />
                    {evt.attendees}
                  </span>
                  <span className="text-brand-accent">{evt.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-brand-border-purple/25 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-brand-border-purple/15 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-brand-heading text-sm">Add Calendar Event</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-brand-text p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleAdd} className="p-5 space-y-4">
              <div>
                <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Event Title</label>
                <input type="text" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Event Type</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value as any})} className="w-full px-2 py-1.5 border border-brand-border-purple/35 bg-white text-brand-text rounded-lg text-xs cursor-pointer">
                    <option>meeting</option>
                    <option>call</option>
                    <option>task</option>
                    <option>followup</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Attendees</label>
                  <input type="text" required placeholder="e.g. Alex Rivera" value={form.attendees} onChange={e => setForm({...form, attendees: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Date</label>
                  <input type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text focus:outline-none cursor-pointer" />
                </div>
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Time</label>
                  <input type="text" required placeholder="e.g. 10:00 AM" value={form.time} onChange={e => setForm({...form, time: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Agenda / Description</label>
                <textarea required placeholder="Discuss scope..." value={form.details} onChange={e => setForm({...form, details: e.target.value})} className="w-full p-2 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text focus:outline-none min-h-[60px]" />
              </div>
              <div className="pt-3 border-t border-brand-border-purple/15 flex justify-end space-x-2.5">
                <button type="button" onClick={() => setIsAddOpen(false)} className="px-4 py-1.5 border border-brand-border-purple/30 rounded-lg text-xs font-bold text-brand-text/75 hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-lg text-xs font-bold shadow-sm/10 cursor-pointer">Save Event</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
