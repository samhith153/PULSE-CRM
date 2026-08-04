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
  ListFilter
} from 'lucide-react';
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
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Unified Tab Sub-Navigation (Tactile pills) */}
      <div className="flex space-x-1.5 p-1 bg-secondary border border-border rounded-xl w-fit">
        <button
          onClick={() => setActiveSubTab('audit')}
          className={`py-1.5 px-4 rounded-lg font-semibold text-xs transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'audit' 
              ? 'bg-brand-purple text-primary-foreground' 
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          }`}
        >
          <ListFilter className="h-3.5 w-3.5" />
          <span>Audit Logs</span>
        </button>
        <button
          onClick={() => setActiveSubTab('calendar')}
          className={`py-1.5 px-4 rounded-lg font-semibold text-xs transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'calendar' 
              ? 'bg-brand-purple text-primary-foreground' 
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          }`}
        >
          <Calendar className="h-3.5 w-3.5" />
          <span>Calendar</span>
        </button>
      </div>

      {/* Render sub views */}
      {activeSubTab === 'audit' && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div>
              <h2 className="font-sans text-2xl text-foreground font-bold">Audit Activities Log</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-semibold">Monitor a chronological timeline of calls, emails, notes, stage adjustments, and lead actions.</p>
            </div>
            
            {/* Time Filter Pills */}
            <div className="flex space-x-1 p-1 bg-secondary border border-border rounded-xl shrink-0">
              {['all', 'today', 'week', 'month'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setDateFilter(tab as any)}
                  className={`py-1 px-3 rounded-lg font-semibold text-[10px] uppercase transition-all duration-200 cursor-pointer ${
                    dateFilter === tab 
                      ? 'bg-brand-purple text-primary-foreground' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-5">
            <span className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-muted-foreground">
              <Search className="h-3.5 w-3.5" />
            </span>
            <input 
              type="text" 
              placeholder="Search activities by user, log description, action type..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-border rounded-lg text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand-purple/20 bg-secondary"
            />
          </div>

          {/* Timeline representation */}
          <div className="relative border-l border-border pl-4 ml-3 space-y-6">
            {filtered.length > 0 ? (
              filtered.map((log) => (
                <div key={log.id} className="relative">
                  {/* Visual Icon Node overlay */}
                  <div className="absolute -left-[27px] top-0 h-6.5 w-6.5 rounded-full bg-card border border-border flex items-center justify-center">
                    {getIcon(log.type)}
                  </div>

                  <div className="bg-secondary hover:bg-secondary border border-border rounded-xl p-4 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                      <div>
                        <h4 className="text-xs font-semibold text-foreground">{log.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1 font-semibold leading-relaxed">{log.desc}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-semibold text-muted-foreground flex items-center justify-end">
                          <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                          {log.time}
                        </span>
                        <p className="text-[9px] text-brand-purple font-semibold mt-0.5">by {log.user}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-6 text-xs font-semibold">No activity logs found matching the filter criteria.</p>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'calendar' && <CalendarView />}
    </div>
  );
}

