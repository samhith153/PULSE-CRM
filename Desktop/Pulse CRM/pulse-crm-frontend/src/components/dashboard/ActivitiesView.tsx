'use client';

import React, { useState } from 'react';
import { 
  Clock, 
  Mail, 
  Phone, 
  Calendar, 
  UserPlus, 
  FileText, 
  GitPullRequest,
  Search,
  CheckSquare,
  ListFilter
} from 'lucide-react';
import TasksView from './TasksView';
import CalendarView from './CalendarView';

interface ActivityLog {
  id: number;
  type: 'creation' | 'email' | 'call' | 'meeting' | 'note' | 'stage_change';
  title: string;
  desc: string;
  user: string;
  time: string;
  dateKey: 'today' | 'week' | 'month';
}

export default function ActivitiesView() {
  const [activeSubTab, setActiveSubTab] = useState<'audit' | 'tasks' | 'calendar'>('audit');
  
  const [logs] = useState<ActivityLog[]>([
    { id: 1, type: 'note', title: 'Internal Note Added', desc: 'Alex Rivera: Interested in enterprise migration plan.', user: 'Sarah Johnson', time: '10 mins ago', dateKey: 'today' },
    { id: 2, type: 'email', title: 'Proposal Email Sent', desc: 'Subject: Cloud migration specs and security SLAs', user: 'Sarah Johnson', time: '2 hours ago', dateKey: 'today' },
    { id: 3, type: 'meeting', title: 'Meeting Scheduled: Security Review', desc: 'Date: May 20, 2025 at 10:00 AM', user: 'Alex Johnson', time: '1 day ago', dateKey: 'week' },
    { id: 4, type: 'call', title: 'Call Logged: Outbound Discovery', desc: 'Outcome: Spoke with Marcus Aurelius. Compliance checklist discussed.', user: 'Alex Johnson', time: '3 days ago', dateKey: 'week' },
    { id: 5, type: 'stage_change', title: 'Deal Moved to Proposal', desc: 'Database Cloud Migration moved from Contacted to Proposal.', user: 'System', time: '4 days ago', dateKey: 'week' },
    { id: 6, type: 'creation', title: 'New Lead Ingested', desc: 'Helena Troy registered via custom enterprise contact form.', user: 'System', time: '1 week ago', dateKey: 'month' },
    { id: 7, type: 'call', title: 'Call Outcome: Busy', desc: 'Tried calling David Hume. Cold nurturing assigned.', user: 'David Wilson', time: '2 weeks ago', dateKey: 'month' }
  ]);

  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [search, setSearch] = useState('');

  const filtered = logs.filter(l => {
    const matchesFilter = dateFilter === 'all' || l.dateKey === dateFilter;
    const matchesSearch = l.title.toLowerCase().includes(search.toLowerCase()) || 
                          l.desc.toLowerCase().includes(search.toLowerCase()) || 
                          l.user.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getIcon = (type: ActivityLog['type']) => {
    switch(type) {
      case 'creation': return <UserPlus className="h-4 w-4 text-blue-600" />;
      case 'email': return <Mail className="h-4 w-4 text-indigo-600" />;
      case 'call': return <Phone className="h-4 w-4 text-emerald-600" />;
      case 'meeting': return <Calendar className="h-4 w-4 text-purple-600" />;
      case 'note': return <FileText className="h-4 w-4 text-amber-600" />;
      case 'stage_change': return <GitPullRequest className="h-4 w-4 text-rose-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Unified Tab Sub-Navigation (Tactile pills) */}
      <div className="flex space-x-1.5 p-1 bg-brand-sidebar-hover/15 border border-brand-border-purple/20 rounded-xl w-fit">
        <button
          onClick={() => setActiveSubTab('audit')}
          className={`py-1.5 px-4 rounded-lg font-extrabold text-xs transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'audit' 
              ? 'bg-brand-accent text-white shadow-sm' 
              : 'text-brand-text/75 hover:text-brand-heading hover:bg-brand-sidebar-hover/20'
          }`}
        >
          <ListFilter className="h-3.5 w-3.5" />
          <span>Audit Logs</span>
        </button>
        <button
          onClick={() => setActiveSubTab('tasks')}
          className={`py-1.5 px-4 rounded-lg font-extrabold text-xs transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'tasks' 
              ? 'bg-brand-accent text-white shadow-sm' 
              : 'text-brand-text/75 hover:text-brand-heading hover:bg-brand-sidebar-hover/20'
          }`}
        >
          <CheckSquare className="h-3.5 w-3.5" />
          <span>Tasks Workspace</span>
        </button>
        <button
          onClick={() => setActiveSubTab('calendar')}
          className={`py-1.5 px-4 rounded-lg font-extrabold text-xs transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'calendar' 
              ? 'bg-brand-accent text-white shadow-sm' 
              : 'text-brand-text/75 hover:text-brand-heading hover:bg-brand-sidebar-hover/20'
          }`}
        >
          <Calendar className="h-3.5 w-3.5" />
          <span>Calendar</span>
        </button>
      </div>

      {/* Render sub views */}
      {activeSubTab === 'audit' && (
        <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div>
              <h2 className="font-sans text-2xl text-brand-heading font-bold">Audit Activities Log</h2>
              <p className="text-[11px] text-brand-text/60 mt-0.5 font-bold">Monitor a chronological timeline of calls, emails, notes, stage adjustments, and lead actions.</p>
            </div>
            
            {/* Time Filter Pills */}
            <div className="flex space-x-1 p-1 bg-brand-sidebar-hover/15 border border-brand-border-purple/20 rounded-xl shrink-0">
              {['all', 'today', 'week', 'month'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setDateFilter(tab as any)}
                  className={`py-1 px-3 rounded-lg font-extrabold text-[10px] uppercase transition-all duration-200 cursor-pointer ${
                    dateFilter === tab 
                      ? 'bg-brand-accent text-white shadow-sm' 
                      : 'text-brand-text/75 hover:text-brand-heading hover:bg-brand-sidebar-hover/20'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-5">
            <span className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-slate-400">
              <Search className="h-3.5 w-3.5" />
            </span>
            <input 
              type="text" 
              placeholder="Search activities by user, log description, action type..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-accent/20"
            />
          </div>

          {/* Timeline representation */}
          <div className="relative border-l border-brand-border-purple/15 pl-4 ml-3 space-y-6">
            {filtered.length > 0 ? (
              filtered.map((log) => (
                <div key={log.id} className="relative">
                  {/* Visual Icon Node overlay */}
                  <div className="absolute -left-[27px] top-0 h-6.5 w-6.5 rounded-full bg-white border border-brand-border-purple/30 flex items-center justify-center shadow-sm/5">
                    {getIcon(log.type)}
                  </div>

                  <div className="bg-slate-50/50 hover:bg-slate-50 border border-brand-border-purple/15 rounded-xl p-4 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                      <div>
                        <h4 className="text-xs font-extrabold text-brand-heading">{log.title}</h4>
                        <p className="text-xs text-brand-text/80 mt-1 font-semibold leading-relaxed">{log.desc}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-bold text-slate-400 flex items-center justify-end">
                          <Clock className="h-3 w-3 mr-1 text-slate-350" />
                          {log.time}
                        </span>
                        <p className="text-[9px] text-brand-accent font-extrabold mt-0.5">by {log.user}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-center py-6 text-xs font-semibold">No activity logs found matching the filter criteria.</p>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'tasks' && <TasksView />}
      {activeSubTab === 'calendar' && <CalendarView />}
    </div>
  );
}
