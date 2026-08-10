'use client';

import React, { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Plus, Search, Trash2, Download, ChevronDown, X,
  Calendar, ClipboardList, PhoneCall, Mail, FileText,
  Check, Filter, RefreshCw, ChevronLeft, ChevronRight,
  Link2, CheckCircle2, Activity, MoreHorizontal,
} from 'lucide-react';
import {
  getCrmActivities, getCrmActivityOwners, downloadCrmActivitiesExport,
  createCrmTask, createCrmCall, createCrmMeeting, createCrmNote, createCrmEmail,
  bulkDeleteCrmActivities, deleteCrmTask, deleteCrmCall, deleteCrmNote,
  getLeads, getContacts, getCompanies, getDeals,
  type CrmActivity, type CrmActivityOwner, type CrmActivitiesListParams,
  type CreateTaskPayload, type CreateCallPayload,
  type CreateMeetingPayload, type CreateNotePayload,
  type EmailComposeTarget,
} from '@/utils/api';
import ActivityDetailView from './ActivityDetailView';
import CalendarView from './CalendarView';
import TasksView from './TasksView';
import { toast } from '@/lib/toast';


interface ActivitiesViewProps {
  activityId?: string;
  onTabChange?: (tab: string) => void;
  onComposeEmail?: (target: Omit<EmailComposeTarget, 'requestId'>) => void;
}

// ─── helpers ────────────────────────────────────────────────────────────────

function getPriorityColor(p: string) {
  switch (p?.toLowerCase()) {
    case 'urgent': return 'bg-[#E2604F] text-white font-medium shadow-sm border border-transparent';
    case 'high':   return 'bg-[#E8A33D]/10 text-[#E8A33D] border border-[#E8A33D]/15 font-bold';
    case 'medium': return 'bg-[#5B9BD5]/10 text-[#5B9BD5] border border-[#5B9BD5]/15 font-bold';
    default:       return 'bg-secondary text-muted-foreground border border-border/80 font-bold';
  }
}

function getStatusColor(s: string) {
  switch (s?.toLowerCase()) {
    case 'completed':   return 'bg-[#4FB477]/10 text-[#4FB477] border border-[#4FB477]/15';
    case 'overdue':     return 'bg-[#E2604F]/10 text-[#E2604F] border border-[#E2604F]/15';
    case 'in_progress':
    case 'scheduled':   return 'bg-[#5B9BD5]/10 text-[#5B9BD5] border border-[#5B9BD5]/15';
    default:            return 'bg-secondary text-muted-foreground border border-border';
  }
}

function fmt(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ') : '';
}

function ActivitiesListContent({ onSelectActivity, onTabChange }: { onSelectActivity: (id: string) => void; onTabChange?: (tab: string) => void }) {
  const searchParams = useSearchParams();

  const [activities, setActivities] = useState<CrmActivity[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [owners, setOwners] = useState<CrmActivityOwner[]>([]);

  const [activeTabType, setActiveTabType] = useState<'timeline'|'task'|'meeting'|'call'|'email'|'note'|'calendar'>('timeline');
  const [quickTab, setQuickTab] = useState<'all'|'today'|'upcoming'|'overdue'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [ownerFilter, setOwnerFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [isAddDropdownOpen, setIsAddDropdownOpen] = useState(false);
  const [activeFormType, setActiveFormType] = useState<'task'|'call'|'meeting'|'email'|'note'|null>(null);
  const [submitting, setSubmitting] = useState(false);

  // form state
  const [formSubject, setFormSubject] = useState('');
  const [formPriority, setFormPriority] = useState('medium');
  const [formStatus, setFormStatus] = useState('pending');
  const [formDueDate, setFormDueDate] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [callContact, setCallContact] = useState('');
  const [callPhone, setCallPhone] = useState('');
  const [callType, setCallType] = useState('outbound');
  const [callDuration, setCallDuration] = useState('');
  const [callOutcome, setCallOutcome] = useState('connected');
  const [callNotes, setCallNotes] = useState('');
  const [meetingEnd, setMeetingEnd] = useState('');
  const [meetingAgenda, setMeetingAgenda] = useState('');
  const [meetingLoc, setMeetingLoc] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [relatedType, setRelatedType] = useState<'lead'|'contact'|'company'|'deal'>('lead');
  const [relatedName, setRelatedName] = useState('');
  const [relatedLeadId, setRelatedLeadId] = useState('');
  const [relatedContactId, setRelatedContactId] = useState('');
  const [relatedCompanyId, setRelatedCompanyId] = useState('');
  const [relatedDealId, setRelatedDealId] = useState('');

  useEffect(() => { getCrmActivityOwners().then(setOwners).catch(() => {}); }, []);

  // ── Autocomplete search for entity linking ─────────────────────────────────
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string; subtitle?: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const searchEntities = useCallback(async (query: string, type: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    setIsSearching(true);
    setShowDropdown(true);
    try {
      let results: Array<{ id: string; name: string; subtitle?: string }> = [];
      const q = query.toLowerCase();
      if (type === 'lead') {
        const items = await getLeads();
        results = (Array.isArray(items) ? items : []).filter((l: any) =>
          (l.title || l.company_name || '').toLowerCase().includes(q)
        ).slice(0, 10).map((l: any) => ({
          id: l.id,
          name: l.title || l.company_name || 'Untitled Lead',
          subtitle: l.company_name || l.status || '',
        }));
      } else if (type === 'contact') {
        const items = await getContacts();
        results = (Array.isArray(items) ? items : []).filter((c: any) =>
          (c.name || `${c.first_name} ${c.last_name}` || c.email || '').toLowerCase().includes(q)
        ).slice(0, 10).map((c: any) => ({
          id: c.id,
          name: c.name || `${c.first_name} ${c.last_name}`,
          subtitle: c.company || c.email || '',
        }));
      } else if (type === 'company') {
        const items = await getCompanies();
        results = (Array.isArray(items) ? items : []).filter((c: any) =>
          (c.name || '').toLowerCase().includes(q)
        ).slice(0, 10).map((c: any) => ({
          id: c.id,
          name: c.name || 'Untitled Company',
          subtitle: c.industry || '',
        }));
      } else if (type === 'deal') {
        const items = await getDeals();
        results = (Array.isArray(items) ? items : []).filter((d: any) =>
          (d.title || d.name || '').toLowerCase().includes(q)
        ).slice(0, 10).map((d: any) => ({
          id: d.id,
          name: d.title || d.name || 'Untitled Deal',
          subtitle: d.company || d.stage || '',
        }));
      }
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchInput = useCallback((value: string) => {
    setRelatedName(value);
    if (relatedType === 'lead') setRelatedLeadId('');
    else if (relatedType === 'contact') setRelatedContactId('');
    else if (relatedType === 'company') setRelatedCompanyId('');
    else setRelatedDealId('');
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      searchEntities(value, relatedType);
    }, 300);
  }, [relatedType, searchEntities]);

  useEffect(() => {
    setRelatedName('');
    setRelatedLeadId(''); setRelatedContactId(''); setRelatedCompanyId(''); setRelatedDealId('');
    setSearchResults([]);
    setShowDropdown(false);
  }, [relatedType]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const relatedIds = () => ({
    related_entity_type: relatedName ? relatedType : undefined,
    related_lead_id:    relatedType === 'lead'    && relatedLeadId    ? relatedLeadId    : undefined,
    related_contact_id: relatedType === 'contact' && relatedContactId ? relatedContactId : undefined,
    related_company_id: relatedType === 'company' && relatedCompanyId ? relatedCompanyId : undefined,
    related_deal_id:    relatedType === 'deal'    && relatedDealId    ? relatedDealId    : undefined,
  });

  useEffect(() => {
    const tab = searchParams.get('tab'); const type = searchParams.get('type');
    if (tab === 'today-tasks')       { setQuickTab('today');    setActiveTabType('task'); }
    else if (tab === 'upcoming-meetings') { setQuickTab('upcoming'); setActiveTabType('meeting'); }
    else if (tab === 'pending-calls')     { setActiveTabType('call'); setStatusFilter('pending'); }
    else if (tab === 'overdue-tasks')     { setQuickTab('overdue');  setActiveTabType('task'); }
    else if (tab === 'completed')         { setStatusFilter('completed'); }
    if (type) setActiveTabType(type as any);
  }, [searchParams]);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const params: CrmActivitiesListParams = { page: currentPage, page_size: pageSize, sort_order: 'desc' };
      if (activeTabType !== 'timeline' && activeTabType !== 'calendar') params.view = activeTabType;
      if (searchQuery)   params.search   = searchQuery;
      if (statusFilter   !== 'All') params.status   = statusFilter.toLowerCase();
      if (priorityFilter !== 'All') params.priority = priorityFilter.toLowerCase();
      if (ownerFilter    !== 'All') { const o = owners.find(x => x.full_name === ownerFilter); if (o) params.owner_id = o.id; }
      if (quickTab !== 'all') params.quick_tab = quickTab;
      const result = await getCrmActivities(params);
      setActivities(result.data ?? []);
      setTotal(result.meta?.total ?? 0);
      setTotalPages(result.meta?.total_pages ?? 1);
    } catch { toast.error('Failed to load activities.'); }
    finally { setLoading(false); }
  }, [currentPage, activeTabType, searchQuery, statusFilter, priorityFilter, ownerFilter, quickTab, owners]);

  useEffect(() => {
  fetchActivities();
}, [fetchActivities]);

/*
 * When the Workflow page automatically creates an
 * AI-recommended CRM task, refresh Activities immediately.
 */
useEffect(() => {
  const handleWorkflowActivityCreated = () => {
    void fetchActivities();
  };

  window.addEventListener(
    'pulse-crm-activity-created',
    handleWorkflowActivityCreated
  );

  return () => {
    window.removeEventListener(
      'pulse-crm-activity-created',
      handleWorkflowActivityCreated
    );
  };
}, [fetchActivities]);

useEffect(() => {
  setCurrentPage(1);
}, [
  activeTabType,
  searchQuery,
  statusFilter,
  priorityFilter,
  ownerFilter,
  quickTab,
]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) =>
    setSelectedIds(e.target.checked ? new Set(activities.map(a => a.id)) : new Set());
  const handleSelectRow = (id: string) => {
    const next = new Set(selectedIds); next.has(id) ? next.delete(id) : next.add(id); setSelectedIds(next);
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.size || !window.confirm(`Delete ${selectedIds.size} activities?`)) return;
    try {
      const r = await bulkDeleteCrmActivities(Array.from(selectedIds));
      toast.success(r.message); setSelectedIds(new Set()); setIsSelectMode(false); fetchActivities();
    } catch { toast.error('Bulk delete failed.'); }
  };

  const handleRowDelete = async (e: React.MouseEvent, a: CrmActivity) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${a.subject}"?`)) return;
    try {
      if (a.activity_type === 'task') await deleteCrmTask(a.id);
      else if (a.activity_type === 'call') await deleteCrmCall(a.id);
      else if (a.activity_type === 'note') await deleteCrmNote(a.id);
      else { toast.error('Deletion not supported for this type.'); return; }
      toast.success('Activity deleted.');
      fetchActivities();
    } catch { toast.error('Delete failed.'); }
  };

  const handleExport = async () => {
    try {
      const params: any = {};
      if (activeTabType !== 'timeline' && activeTabType !== 'calendar') params.view = activeTabType;
      if (searchQuery)   params.search   = searchQuery;
      if (statusFilter   !== 'All') params.status   = statusFilter.toLowerCase();
      if (priorityFilter !== 'All') params.priority = priorityFilter.toLowerCase();
      if (quickTab !== 'all') params.quick_tab = quickTab;
      await downloadCrmActivitiesExport(params);
      toast.success('Export downloaded.');
    } catch { toast.error('Export failed.'); }
  };

  const resetForm = () => {
    setFormSubject(''); setFormPriority('medium'); setFormStatus('pending'); setFormDueDate('');
    setTaskDesc(''); setCallContact(''); setCallPhone(''); setCallNotes('');
    setMeetingEnd(''); setMeetingAgenda(''); setMeetingLoc('');
    setNoteBody(''); setRelatedName(''); setRelatedLeadId(''); setRelatedContactId(''); setRelatedCompanyId(''); setRelatedDealId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true);
    try {
      if (activeFormType === 'task') {
        await createCrmTask({ subject: formSubject, description: taskDesc, due_date: formDueDate ? new Date(formDueDate).toISOString() : undefined, priority: formPriority, status: formStatus, ...relatedIds() });
      } else if (activeFormType === 'call') {
        await createCrmCall({ subject: formSubject, contact_name: callContact, phone_number: callPhone, call_type: callType, outcome: callOutcome, notes: callNotes, duration_minutes: callDuration ? parseInt(callDuration) : undefined, priority: formPriority, called_at: formDueDate ? new Date(formDueDate).toISOString() : undefined, ...relatedIds() });
      } else if (activeFormType === 'meeting') {
        if (!formDueDate || !meetingEnd) { toast.error('Start and end date/time required.'); setSubmitting(false); return; }
        await createCrmMeeting({ title: formSubject, description: meetingAgenda, start_datetime: new Date(formDueDate).toISOString(), end_datetime: new Date(meetingEnd).toISOString(), location: meetingLoc || undefined, meeting_link: meetingLoc?.startsWith('http') ? meetingLoc : undefined, ...relatedIds() });
      } else if (activeFormType === 'note') {
        await createCrmNote({ title: formSubject || `Note: ${noteBody.slice(0, 40)}`, body: noteBody, ...relatedIds() });
      } else if (activeFormType === 'email') {
        await createCrmEmail({ subject: formSubject, body: noteBody, direction: callType || 'outbound', recipient_email: callContact, recipient_name: relatedName, priority: formPriority, status: 'completed', ...relatedIds() });
      }
      toast.success('Activity saved.'); setActiveFormType(null); resetForm(); fetchActivities();
    } catch (err: any) { toast.error(err?.message || 'Failed to save activity.'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 pt-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-purple/10 flex items-center justify-center">
            <Activity className="h-5 w-5 text-brand-purple" />
          </div>
          <div>
            <h2 className="text-[22px] font-bold tracking-tight text-foreground">Activities</h2>
            <p className="text-xs font-semibold text-muted-foreground mt-0.5">Plan, track, and stay on top of all your tasks and activities.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setIsSelectMode(!isSelectMode); setSelectedIds(new Set()); }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 border rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm ${isSelectMode ? 'bg-brand-blue text-white border-brand-blue' : 'border-border bg-card hover:bg-secondary text-foreground'}`}>
            <Check size={13} /><span>Select</span>
          </button>
          <div className="relative">
            <button onClick={() => setIsAddDropdownOpen(!isAddDropdownOpen)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-blue hover:bg-brand-blue/90 text-white rounded-lg text-xs font-bold cursor-pointer shadow-sm">
              <Plus size={13} /><span>+ Add activity</span>
              <ChevronDown size={12} className={`transition-transform ${isAddDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {isAddDropdownOpen && (
              <div className="absolute right-0 mt-1.5 bg-card border border-border rounded-xl shadow-lg py-1.5 w-44 z-50">
                {([{ type:'task', label:'Create Task', icon:ClipboardList, color:'text-brand-purple' },
                   { type:'call', label:'Log Call', icon:PhoneCall, color:'text-[#4FB477]' },
                   { type:'meeting', label:'Schedule Meeting', icon:Calendar, color:'text-brand-blue' },
                   { type:'email', label:'Sync Email', icon:Mail, color:'text-[#E8A33D]' },
                   { type:'note', label:'Add Note', icon:FileText, color:'text-emerald-500' }] as const).map(item => {
                  const Icon = item.icon;
                  return (
                    <button key={item.type} onClick={() => { setActiveFormType(item.type); setIsAddDropdownOpen(false); }}
                      className="w-full text-left px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-secondary flex items-center gap-2 cursor-pointer">
                      <Icon size={13} className={item.color} /><span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <button onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-border bg-card hover:bg-secondary text-foreground rounded-lg text-xs font-bold cursor-pointer shadow-sm">
            <Download size={13} /><span>Export</span>
          </button>
          {selectedIds.size > 0 && (
            <button onClick={handleBulkDelete}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#E2604F] hover:bg-[#E2604F]/90 text-white rounded-lg text-xs font-bold cursor-pointer shadow-sm animate-in fade-in">
              <Trash2 size={13} /><span>Delete ({selectedIds.size})</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── Task Kanban Board (Separated and on Top) ─── */}
      <div className="space-y-4 pt-2">
        <TasksView isEmbedded={true} />
      </div>

      <div className="border-t border-border/60 my-2" />

      {/* ─── CRM Activity Logs ─── */}
      <div className="pt-6">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Activity History Logs</h3>

        {/* Filters */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-3.5" />
              <input type="text" placeholder="Search subject, notes, records..." value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-card border border-border rounded-lg pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none" />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-foreground font-semibold">View</span>
              <select value={activeTabType} onChange={e => { setActiveTabType(e.target.value as any); setCurrentPage(1); }}
                className="bg-card border border-border rounded-lg px-3 py-1.5 text-foreground focus:outline-none cursor-pointer text-xs font-semibold">
                <option value="timeline">Timeline Log</option>
                <option value="meeting">Meetings</option><option value="call">Calls</option>
                <option value="email">Emails</option><option value="note">Notes</option><option value="calendar">Calendar</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
            <div className="flex space-x-1 p-1 border border-border rounded-[10px] w-fit">
              {(['all','today','upcoming','overdue'] as const).map(tab => (
                <button key={tab} onClick={() => { setQuickTab(tab); setCurrentPage(1); }}
                  className={`py-1.5 px-4 rounded-md text-xs font-semibold capitalize transition-all cursor-pointer ${quickTab===tab ? 'bg-brand-purple text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                  {tab}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-foreground font-semibold">Status:</span>
                <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  className="bg-card border border-border rounded-lg px-2 py-1.5 text-foreground focus:outline-none cursor-pointer text-xs font-semibold">
                  <option value="All">All</option><option value="pending">Pending</option>
                  <option value="scheduled">Scheduled</option><option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option><option value="overdue">Overdue</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-foreground font-semibold">Priority:</span>
                <select value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); setCurrentPage(1); }}
                  className="bg-card border border-border rounded-lg px-2 py-1.5 text-foreground focus:outline-none cursor-pointer text-xs font-semibold">
                  <option value="All">All</option><option value="urgent">Urgent</option>
                  <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-foreground font-semibold">Owner:</span>
                <select value={ownerFilter} onChange={e => { setOwnerFilter(e.target.value); setCurrentPage(1); }}
                  className="bg-card border border-border rounded-lg px-2 py-1.5 text-foreground focus:outline-none cursor-pointer text-xs font-semibold">
                  <option value="All">All</option>
                  {owners.map(o => <option key={o.id} value={o.full_name}>{o.full_name}</option>)}
                </select>
              </div>
              {(statusFilter!=='All'||priorityFilter!=='All'||ownerFilter!=='All'||searchQuery!=='') && (
                <button onClick={() => { setSearchQuery(''); setQuickTab('all'); setActiveTabType('timeline'); setStatusFilter('All'); setPriorityFilter('All'); setOwnerFilter('All'); setCurrentPage(1); toast.success('Filters cleared.'); }}
                  className="text-xs font-bold text-brand-purple hover:underline cursor-pointer ml-1.5">Clear</button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      {activeTabType === 'calendar' ? (
        <CalendarView />
      ) : (
      <div className="bg-card border-none mt-2 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-xs text-muted-foreground font-semibold">
            <RefreshCw className="size-4 animate-spin text-brand-purple mr-2" /><span>Loading activities...</span>
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center p-6 bg-card border border-border rounded-xl">
            <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mb-3">
              <Filter className="size-5 text-muted-foreground/60" />
            </div>
            <p className="text-xs font-bold text-foreground">No Activities Found</p>
            <p className="text-[10px] text-muted-foreground mt-1">Try adjusting your filters or add a new activity.</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse table-fixed select-none">
              <thead>
                <tr className="border-b border-border text-[11px] font-black uppercase text-foreground tracking-wider bg-card">
                  <th className="py-3 px-1 w-2"></th>
                  <th className="py-3 px-3 text-left w-[30%]">Subject</th>
                  <th className="py-3 px-3 text-center w-24">Type</th>
                  <th className="py-3 px-3 text-center w-28">Status</th>
                  <th className="py-3 px-3 text-center w-28">Priority</th>
                  <th className="py-3 px-3 text-center w-36">Due Date</th>
                  <th className="py-3 px-3 text-left w-[18%]">Related Record</th>
                  <th className="py-3 px-3 text-left w-32">Owner</th>
                  <th className="py-3 px-3 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-xs font-semibold text-foreground bg-card">
                {activities.map((a, idx) => (
                  <tr key={a.id} onClick={() => onSelectActivity(a.id)} className="group hover:bg-secondary/50 transition-all cursor-pointer">
                    <td className="py-4 px-1"></td>
                    <td className="py-4 px-3 text-left whitespace-normal break-words">
                      <span className="font-bold text-foreground hover:text-brand-purple transition-colors block leading-tight">{a.subject}</span>
                      {a.related_record_name && <span className="text-[10px] text-muted-foreground mt-1 block">Lead: {a.related_record_name}</span>}
                    </td>
                    <td className="py-4 px-3 text-center capitalize text-[11px] font-semibold text-muted-foreground">{a.activity_type}</td>
                    <td className="py-4 px-3 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${a.status === 'pending' ? 'border-brand-purple/20 text-brand-purple bg-brand-purple/5' : 'border-border text-muted-foreground bg-secondary'}`}>
                        {fmt(a.status)}
                      </span>
                    </td>
                    <td className="py-4 px-3 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 text-[10px] font-semibold ${
                        a.priority === 'high' || a.priority === 'urgent' ? 'text-rose-500' :
                        a.priority === 'medium' ? 'text-amber-500' : 'text-emerald-500'
                      }`}>
                        {fmt(a.priority)}
                      </span>
                    </td>
                    <td className="py-4 px-3 text-center text-muted-foreground font-semibold tabular-nums whitespace-nowrap">
                      {a.due_date ? new Date(a.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No deadline'}
                    </td>
                    <td className="py-4 px-3 text-left truncate text-[11px] font-bold text-brand-purple hover:underline cursor-pointer">
                      {a.related_record_name || '—'}
                    </td>
                    <td className="py-4 px-3 text-left">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-secondary border border-border flex items-center justify-center text-[9px] font-bold text-muted-foreground shrink-0">
                          {idx % 2 === 0 ? 'SR' : idx % 3 === 0 ? 'PJ' : 'AK'}
                        </div>
                        <span className="text-[11px] font-semibold text-foreground truncate">{a.owner_name || 'You'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-3 text-center" onClick={e => e.stopPropagation()}>
                      <button onClick={e => handleRowDelete(e, a)}
                        className="text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Delete activity">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 py-4">
        <span className="text-xs font-semibold text-muted-foreground">
          Showing {Math.min(total,(currentPage-1)*pageSize+1)} to {Math.min(total,currentPage*pageSize)} of {total} activities
        </span>
        <div className="flex items-center gap-3">
          <div className="flex items-center">
            <button onClick={()=>setCurrentPage(p=>Math.max(1,p-1))} disabled={currentPage===1}
              className="w-8 h-8 flex items-center justify-center border border-border bg-card rounded-l-lg text-muted-foreground hover:bg-secondary cursor-pointer transition-colors disabled:opacity-50">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center border-y border-border bg-brand-purple/10 text-brand-purple font-bold text-xs cursor-pointer">
              {currentPage}
            </button>
            <button className="w-8 h-8 flex items-center justify-center border border-border bg-card hover:bg-secondary text-muted-foreground font-bold text-xs cursor-pointer">
              2
            </button>
            <button className="w-8 h-8 flex items-center justify-center border border-border bg-card hover:bg-secondary text-muted-foreground font-bold text-xs cursor-pointer">
              3
            </button>
            <button className="w-8 h-8 flex items-center justify-center border-y border-border bg-card text-muted-foreground text-xs">
              ...
            </button>
            <button onClick={()=>setCurrentPage(p=>Math.min(totalPages,p+1))} disabled={currentPage===totalPages}
              className="w-8 h-8 flex items-center justify-center border border-border bg-card rounded-r-lg text-muted-foreground hover:bg-secondary cursor-pointer transition-colors disabled:opacity-50">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <select className="border border-border bg-card text-foreground text-xs font-semibold rounded-lg px-2 py-1.5 cursor-pointer focus:outline-none">
            <option>10 / page</option>
            <option>20 / page</option>
            <option>50 / page</option>
          </select>
        </div>
      </div>

      {/* Add Activity Modal */}
      {activeFormType && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl p-5 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-border pb-2 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border ${activeFormType==='task'?'bg-brand-purple/10 text-brand-purple border-brand-purple/15':activeFormType==='meeting'?'bg-brand-blue/10 text-brand-blue border-brand-blue/15':activeFormType==='call'?'bg-[#4FB477]/10 text-[#4FB477] border-[#4FB477]/15':activeFormType==='email'?'bg-[#E8A33D]/10 text-[#E8A33D] border-[#E8A33D]/15':'bg-emerald-500/10 text-emerald-500 border-emerald-500/15'}`}>{activeFormType}</span>
                <h3 className="font-bold text-foreground text-sm">
                  {activeFormType==='task'?'Log New Task':activeFormType==='call'?'Log Call Outcome':activeFormType==='meeting'?'Schedule Meeting':activeFormType==='email'?'Sync Email':'Add Note'}
                </h3>
              </div>
              <button onClick={()=>{setActiveFormType(null);resetForm();}} className="p-1 hover:bg-secondary rounded-lg text-muted-foreground border border-border cursor-pointer"><X size={12}/></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3 overflow-y-auto pr-1 flex-1">
              {/* Related record */}
              <div className="bg-secondary/20 border border-border/85 rounded-xl p-3 space-y-3">
                <span className="text-[8px] font-black uppercase text-brand-purple tracking-widest block leading-none font-['Space_Grotesk']">Linked CRM Context</span>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'lead', label: 'Lead' },
                    { id: 'contact', label: 'Contact' },
                    { id: 'company', label: 'Company' },
                    { id: 'deal', label: 'Deal' }
                  ].map(rt => (
                    <button
                      type="button"
                      key={rt.id}
                      onClick={() => setRelatedType(rt.id as any)}
                      className={`py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all border cursor-pointer ${
                        relatedType === rt.id
                          ? 'bg-brand-purple/10 border-brand-purple/20 text-brand-purple font-extrabold shadow-sm'
                          : 'bg-card border-border text-muted-foreground'
                      }`}
                    >
                      {rt.label}
                    </button>
                  ))}
                </div>

                <div className="relative" ref={dropdownRef}>
                  <label className="block text-[8px] font-extrabold text-muted-foreground/80 uppercase">
                    Search {relatedType.charAt(0).toUpperCase() + relatedType.slice(1)} {activeFormType !== 'email' && activeFormType !== 'note' && <span className="text-rose-500">*</span>}
                  </label>
                  <div className="relative mt-1">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder={`Search ${relatedType}s by name...`}
                      value={relatedName}
                      onChange={(e) => handleSearchInput(e.target.value)}
                      onFocus={() => relatedName.length >= 2 && setShowDropdown(true)}
                      className="w-full bg-card border border-border rounded-lg pl-7 pr-8 py-1.5 text-xs text-foreground focus:outline-none"
                    />
                    {relatedName && (
                      <button
                        type="button"
                        onClick={() => { setRelatedName(''); setRelatedLeadId(''); setRelatedContactId(''); setRelatedCompanyId(''); setRelatedDealId(''); setSearchResults([]); setShowDropdown(false); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  {showDropdown && (
                    <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {isSearching ? (
                        <div className="px-3 py-2 text-[10px] text-muted-foreground">Searching...</div>
                      ) : searchResults.length === 0 ? (
                        <div className="px-3 py-2 text-[10px] text-muted-foreground">No results found</div>
                      ) : (
                        searchResults.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setRelatedName(item.name);
                              if (relatedType === 'lead') setRelatedLeadId(item.id);
                              else if (relatedType === 'contact') setRelatedContactId(item.id);
                              else if (relatedType === 'company') setRelatedCompanyId(item.id);
                              else setRelatedDealId(item.id);
                              setShowDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-secondary transition-colors cursor-pointer border-b border-border/50 last:border-0"
                          >
                            <div className="text-xs font-semibold text-foreground truncate">{item.name}</div>
                            {item.subtitle && (
                              <div className="text-[10px] text-muted-foreground truncate">{item.subtitle}</div>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}

                  {relatedLeadId || relatedContactId || relatedCompanyId || relatedDealId ? (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-brand-purple font-semibold">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Linked: {relatedName}</span>
                    </div>
                  ) : null}
                </div>
              </div>

              {activeFormType==='task'&&(<>
                <div><label className="block text-[9px] font-bold text-muted-foreground uppercase">Subject *</label><input type="text" required value={formSubject} onChange={e=>setFormSubject(e.target.value)} className="mt-1 w-full bg-background border border-border rounded-lg px-2.5 py-1 text-xs focus:outline-none"/></div>
                <div><label className="block text-[9px] font-bold text-muted-foreground uppercase">Description</label><textarea value={taskDesc} onChange={e=>setTaskDesc(e.target.value)} rows={2} className="mt-1 w-full bg-background border border-border rounded-lg p-2 text-xs focus:outline-none"/></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-[9px] font-bold text-muted-foreground uppercase">Due Date & Time *</label><input type="datetime-local" required value={formDueDate} onChange={e=>setFormDueDate(e.target.value)} className="mt-1 w-full bg-background border border-border rounded-lg px-2.5 py-1 text-xs focus:outline-none"/></div>
                  <div><label className="block text-[9px] font-bold text-muted-foreground uppercase">Priority</label><select value={formPriority} onChange={e=>setFormPriority(e.target.value)} className="mt-1 w-full bg-background border border-border rounded-lg px-2 py-1 text-xs focus:outline-none"><option value="urgent">Urgent</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></div>
                </div>
              </>)}

              {activeFormType==='call'&&(<>
                <div><label className="block text-[9px] font-bold text-muted-foreground uppercase">Call Topic *</label><input type="text" required value={formSubject} onChange={e=>setFormSubject(e.target.value)} className="mt-1 w-full bg-background border border-border rounded-lg px-2.5 py-1 text-xs focus:outline-none"/></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-[9px] font-bold text-muted-foreground uppercase">Contact</label><input type="text" value={callContact} onChange={e=>setCallContact(e.target.value)} className="mt-1 w-full bg-background border border-border rounded-lg px-2.5 py-1 text-xs focus:outline-none"/></div>
                  <div><label className="block text-[9px] font-bold text-muted-foreground uppercase">Phone</label><input type="text" value={callPhone} onChange={e=>setCallPhone(e.target.value)} className="mt-1 w-full bg-background border border-border rounded-lg px-2.5 py-1 text-xs focus:outline-none"/></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="block text-[9px] font-bold text-muted-foreground uppercase">Type</label><select value={callType} onChange={e=>setCallType(e.target.value)} className="mt-1 w-full bg-background border border-border rounded-lg px-2 py-1 text-xs focus:outline-none"><option value="outbound">Outbound</option><option value="inbound">Inbound</option></select></div>
                  <div><label className="block text-[9px] font-bold text-muted-foreground uppercase">Outcome</label><select value={callOutcome} onChange={e=>setCallOutcome(e.target.value)} className="mt-1 w-full bg-background border border-border rounded-lg px-2 py-1 text-xs focus:outline-none"><option value="connected">Connected</option><option value="busy">Busy</option><option value="left_vm">Left VM</option><option value="call_back_later">Call Back Later</option><option value="no_answer">No Answer</option></select></div>
                  <div><label className="block text-[9px] font-bold text-muted-foreground uppercase">Duration (min)</label><input type="number" min="0" value={callDuration} onChange={e=>setCallDuration(e.target.value)} className="mt-1 w-full bg-background border border-border rounded-lg px-2.5 py-1 text-xs focus:outline-none"/></div>
                </div>
                <div><label className="block text-[9px] font-bold text-muted-foreground uppercase">Notes</label><textarea value={callNotes} onChange={e=>setCallNotes(e.target.value)} rows={2} className="mt-1 w-full bg-background border border-border rounded-lg p-2 text-xs focus:outline-none"/></div>
              </>)}

              {activeFormType==='meeting'&&(<>
                <div><label className="block text-[9px] font-bold text-muted-foreground uppercase">Meeting Title *</label><input type="text" required value={formSubject} onChange={e=>setFormSubject(e.target.value)} className="mt-1 w-full bg-background border border-border rounded-lg px-2.5 py-1 text-xs focus:outline-none"/></div>
                <div><label className="block text-[9px] font-bold text-muted-foreground uppercase">Agenda</label><textarea value={meetingAgenda} onChange={e=>setMeetingAgenda(e.target.value)} rows={2} className="mt-1 w-full bg-background border border-border rounded-lg p-2 text-xs focus:outline-none"/></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-[9px] font-bold text-muted-foreground uppercase">Start *</label><input type="datetime-local" required value={formDueDate} onChange={e=>setFormDueDate(e.target.value)} className="mt-1 w-full bg-background border border-border rounded-lg px-2.5 py-1 text-xs focus:outline-none"/></div>
                  <div><label className="block text-[9px] font-bold text-muted-foreground uppercase">End *</label><input type="datetime-local" required value={meetingEnd} onChange={e=>setMeetingEnd(e.target.value)} className="mt-1 w-full bg-background border border-border rounded-lg px-2.5 py-1 text-xs focus:outline-none"/></div>
                </div>
                <div><label className="block text-[9px] font-bold text-muted-foreground uppercase">Location / Link</label><input type="text" value={meetingLoc} onChange={e=>setMeetingLoc(e.target.value)} placeholder="https://zoom.us/..." className="mt-1 w-full bg-background border border-border rounded-lg px-2.5 py-1 text-xs focus:outline-none"/></div>
              </>)}

              {activeFormType==='email'&&(<>
                <div><label className="block text-[9px] font-bold text-muted-foreground uppercase">Subject *</label><input type="text" required value={formSubject} onChange={e=>setFormSubject(e.target.value)} className="mt-1 w-full bg-background border border-border rounded-lg px-2.5 py-1 text-xs focus:outline-none"/></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-[9px] font-bold text-muted-foreground uppercase">To Email *</label><input type="email" required value={callContact} onChange={e=>setCallContact(e.target.value)} placeholder="recipient@email.com" className="mt-1 w-full bg-background border border-border rounded-lg px-2.5 py-1 text-xs focus:outline-none"/></div>
                  <div><label className="block text-[9px] font-bold text-muted-foreground uppercase">Direction</label>
                    <select value={callType} onChange={e=>setCallType(e.target.value)} className="mt-1 w-full bg-background border border-border rounded-lg px-2 py-1 text-xs focus:outline-none">
                      <option value="outbound">Outbound</option><option value="inbound">Inbound</option>
                    </select>
                  </div>
                </div>
                <div><label className="block text-[9px] font-bold text-muted-foreground uppercase">Body *</label><textarea required value={noteBody} onChange={e=>setNoteBody(e.target.value)} rows={4} placeholder="Email body..." className="mt-1 w-full bg-background border border-border rounded-lg p-2.5 text-xs focus:outline-none"/></div>
              </>)}

              {activeFormType==='note'&&(<>
                <div><label className="block text-[9px] font-bold text-muted-foreground uppercase">Title</label><input type="text" value={formSubject} onChange={e=>setFormSubject(e.target.value)} placeholder="Optional title..." className="mt-1 w-full bg-background border border-border rounded-lg px-2.5 py-1 text-xs focus:outline-none"/></div>
                <div><label className="block text-[9px] font-bold text-muted-foreground uppercase">Note Body *</label><textarea required value={noteBody} onChange={e=>setNoteBody(e.target.value)} rows={4} placeholder="Type your note..." className="mt-1 w-full bg-background border border-border rounded-lg p-2.5 text-xs focus:outline-none"/></div>
              </>)}

              <div className="pt-4 border-t border-border flex justify-end gap-2 shrink-0">
                <button type="button" onClick={()=>{setActiveFormType(null);resetForm();}} className="px-4 py-2 border border-border bg-card hover:bg-secondary text-foreground rounded-lg text-xs font-semibold cursor-pointer">Cancel</button>
                {activeFormType!=='email'&&<button type="submit" disabled={submitting} className="px-4 py-2 bg-brand-purple hover:bg-brand-purple/90 text-white rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-60">{submitting?'Saving…':'Submit Activity'}</button>}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Root export ────────────────────────────────────────────────────────────

export default function ActivitiesView({ activityId, onTabChange }: ActivitiesViewProps) {
  const [selectedId, setSelectedId] = useState<string | undefined>(activityId);
  useEffect(() => { setSelectedId(activityId); }, [activityId]);

  if (selectedId) {
    return <ActivityDetailView id={selectedId} onBack={() => setSelectedId(undefined)} onTabChange={onTabChange} />;
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20 text-xs text-muted-foreground font-semibold">
        <RefreshCw className="size-4 animate-spin text-brand-purple mr-2" /><span>Loading activities...</span>
      </div>
    }>
      <ActivitiesListContent onSelectActivity={setSelectedId} onTabChange={onTabChange} />
    </Suspense>
  );
}
