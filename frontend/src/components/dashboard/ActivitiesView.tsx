'use client';

import React, { useState, useEffect } from 'react';
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
import { getActivities } from '@/utils/api';

interface ActivityLog {
  id: string | number;
  type: 'creation' | 'email' | 'call' | 'meeting' | 'note' | 'stage_change';
  title: string;
  desc: string;
  user: string;
  time: string;
  dateKey: 'today' | 'week' | 'month';
}

export default function ActivitiesView() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    getActivities({ page_size: 100 }).then(res => {
      const list = res.data || res || [];
      const mapped = list.map((act: any) => {
        let type: ActivityLog['type'] = 'note';
        if (act.action === 'call') type = 'call';
        else if (act.action === 'meeting') type = 'meeting';
        else if (act.action === 'email') type = 'email';
        else if (act.action?.includes('stage') || act.action?.includes('pipeline')) type = 'stage_change';
        else if (act.action?.includes('create')) type = 'creation';

        const createdDate = new Date(act.created_at || Date.now());
        const diffMs = Math.abs(new Date().getTime() - createdDate.getTime());
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        let dateKey: ActivityLog['dateKey'] = 'today';
        if (diffDays > 30) dateKey = 'month';
        else if (diffDays > 7) dateKey = 'week';

        let timeStr = `${diffDays} days ago`;
        if (diffDays === 0) {
          const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
          timeStr = diffHrs === 0 ? 'Just now' : `${diffHrs} hours ago`;
        }

        return {
          id: act.id,
          type,
          title: act.title || 'Timeline Event',
          desc: act.description || 'CRM system operational action logged.',
          user: act.created_by || 'System',
          time: timeStr,
          dateKey
        };
      });
      setLogs(mapped);
      setLoading(false);
    }).catch(err => {
      console.error("Failed to load audit logs:", err);
      setLoading(false);
    });
  }, []);

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white border border-brand-border-purple/20 rounded-xl p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent"></div>
        <p className="text-xs text-brand-text/60 mt-4 font-bold">Querying system activity audit trail...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
    </div>
  );
}
