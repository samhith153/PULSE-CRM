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

type MainTab = 'timeline' | 'tasks' | 'calendar';
type ActivityTab = 'all' | 'note' | 'call' | 'meeting' | 'email' | 'stage_change' | 'lead_conversion';

const activityTabs: { id: ActivityTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'note', label: 'Notes' },
  { id: 'call', label: 'Calls' },
  { id: 'meeting', label: 'Meetings' },
  { id: 'email', label: 'Emails' },
  { id: 'stage_change', label: 'Stage Changes' },
  { id: 'lead_conversion', label: 'Lead Conversion' }
];

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 60) return `${Math.max(1, minutes)} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function iconFor(action: string) {
  const normalized = action.toLowerCase();
  if (normalized.includes('email')) return <Mail className="h-4 w-4 text-indigo-600" />;
  if (normalized.includes('call')) return <Phone className="h-4 w-4 text-emerald-600" />;
  if (normalized.includes('meeting')) return <Calendar className="h-4 w-4 text-purple-600" />;
  if (normalized.includes('stage')) return <GitPullRequest className="h-4 w-4 text-rose-600" />;
  if (normalized.includes('conversion') || normalized.includes('convert') || normalized.includes('creation')) return <UserPlus className="h-4 w-4 text-blue-600" />;
  return <FileText className="h-4 w-4 text-amber-600" />;
}

export default function ActivitiesView() {
  const [activeSubTab, setActiveSubTab] = useState<'audit' | 'calendar'>('audit');
  
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
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pageSize = 20;
  const hasMore = activities.length < total;

  const loadActivities = async (nextPage = 1, append = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getActivities({
        page: nextPage,
        page_size: pageSize,
        search,
        activity_type: activityTab === 'all' ? undefined : activityTab
      });
      setActivities(current => append ? [...current, ...result.data] : result.data);
      setTotal(result.total);
      setPage(nextPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load activities.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (mainTab === 'timeline') loadActivities(1, false);
  }, [mainTab, activityTab]);

  useEffect(() => {
    if (mainTab !== 'timeline') return;
    const timeout = window.setTimeout(() => loadActivities(1, false), 350);
    return () => window.clearTimeout(timeout);
  }, [search]);

  return (
    <div className="space-y-6">
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

      {mainTab === 'timeline' && (
        <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div>
              <h2 className="font-sans text-2xl text-brand-heading font-bold">Activity Timeline</h2>
              <p className="text-[11px] text-brand-text/60 mt-0.5 font-bold">Chronological CRM activity across notes, calls, meetings, emails, stage changes, and conversions.</p>
            </div>
            <button onClick={() => loadActivities(1, false)} disabled={isLoading} className="inline-flex items-center gap-2 px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs font-bold text-brand-text/75 hover:bg-slate-50 disabled:opacity-60">
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
            {activityTabs.map(tab => (
              <button key={tab.id} onClick={() => setActivityTab(tab.id)} className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold whitespace-nowrap transition-colors ${activityTab === tab.id ? 'bg-brand-accent text-white' : 'bg-slate-50 text-brand-text/70 hover:bg-slate-100'}`}>{tab.label}</button>
            ))}
          </div>

          <div className="relative mb-5">
            <Search className="absolute inset-y-0 left-2.5 my-auto h-3.5 w-3.5 text-slate-400" />
            <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search activities by title, description, entity, or action..." className="w-full pl-8 pr-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-accent/20" />
          </div>

          {error && <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 flex gap-2"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}

          <div className="relative border-l border-brand-border-purple/15 pl-4 ml-3 space-y-6">
            {isLoading && activities.length === 0 ? (
              <div className="py-10 text-slate-400 text-xs font-bold flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin mr-2" />Loading activities...</div>
            ) : activities.length > 0 ? activities.map(activity => (
              <div key={activity.id} className="relative">
                <div className="absolute -left-[27px] top-0 h-6.5 w-6.5 rounded-full bg-white border border-brand-border-purple/30 flex items-center justify-center shadow-sm/5">{iconFor(activity.action)}</div>
                <div className="bg-slate-50/50 hover:bg-slate-50 border border-brand-border-purple/15 rounded-xl p-4 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                    <div className="min-w-0">
                      <h4 className="text-xs font-extrabold text-brand-heading">{activity.title}</h4>
                      <p className="text-xs text-brand-text/80 mt-1 font-semibold leading-relaxed">{activity.description || activity.action}</p>
                      <p className="text-[9px] text-slate-400 font-bold mt-2 uppercase">{activity.entity_type} - {activity.action.replace(/_/g, ' ')}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-bold text-slate-400 flex items-center justify-end"><Clock className="h-3 w-3 mr-1 text-slate-350" />{formatTime(activity.created_at)}</span>
                      {activity.created_by && <p className="text-[9px] text-brand-accent font-extrabold mt-0.5">by {activity.created_by}</p>}
                    </div>
                  </div>
                </div>
              </div>
            )) : <p className="text-slate-400 text-center py-8 text-xs font-semibold">No activities found for this filter.</p>}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-5">
              <button onClick={() => loadActivities(page + 1, true)} disabled={isLoading} className="px-4 py-2 border border-brand-border-purple/35 rounded-lg text-xs font-bold text-brand-text/75 hover:bg-slate-50 disabled:opacity-60">{isLoading ? 'Loading...' : 'Load more'}</button>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'calendar' && <CalendarView />}
    </div>
  );
}
