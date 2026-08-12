'use client';

import React, { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Plus, Search, Trash2, Download, ChevronDown, X,
  Calendar, ClipboardList, PhoneCall, Mail, FileText,
  Check, Filter, RefreshCw, ChevronLeft, ChevronRight,
  Link2, CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CollapseToggle } from '@/components/ui/CollapseToggle';
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
    case 'urgent': return 'bg-status-danger-text text-text-on-primary font-medium shadow-sm border border-transparent';
    case 'high':   return 'bg-priority-high-bg text-priority-high border border-priority-high/15 font-bold';
    case 'medium': return 'bg-status-info-bg text-status-info-text border border-status-info-text/15 font-bold';
    default:       return 'bg-secondary text-muted-foreground border border-border/80 font-bold';
  }
}

function getStatusColor(s: string) {
  switch (s?.toLowerCase()) {
    case 'completed':   return 'bg-status-success-bg text-status-success-text border border-status-success-text/15';
    case 'overdue':     return 'bg-status-danger-bg text-status-danger-text border border-status-danger-text/15';
    case 'in_progress':
    case 'scheduled':   return 'bg-status-info-bg text-status-info-text border border-status-info-text/15';
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
  const [isTasksCollapsed, setIsTasksCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'logs'>('kanban');
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
      if (type === 'lead') {
        const items = await getLeads();
        const filtered = items.filter((l: any) =>
          (l.title || '').toLowerCase().includes(query.toLowerCase()) ||
          (l.company_name || '').toLowerCase().includes(query.toLowerCase())
        );
        results = filtered.slice(0, 10).map((l: any) => ({
          id: l.id,
          name: l.title || l.company_name || 'Untitled Lead',
          subtitle: l.company_name || l.status || '',
        }));
      } else if (type === 'contact') {
        const items = await getContacts();
        const filtered = items.filter((c: any) =>
          (c.name || `${c.first_name || ''} ${c.last_name || ''}`).toLowerCase().includes(query.toLowerCase()) ||
          (c.email || '').toLowerCase().includes(query.toLowerCase())
        );
        results = filtered.slice(0, 10).map((c: any) => ({
          id: c.id,
          name: c.name || `${c.first_name} ${c.last_name}`,
          subtitle: c.company || c.email || '',
        }));
      } else if (type === 'company') {
        const items = await getCompanies();
        const filtered = items.filter((c: any) =>
          (c.name || '').toLowerCase().includes(query.toLowerCase()) ||
          (c.industry || '').toLowerCase().includes(query.toLowerCase())
        );
        results = filtered.slice(0, 10).map((c: any) => ({
          id: c.id,
          name: c.name || 'Untitled Company',
          subtitle: c.industry || '',
        }));
      } else if (type === 'deal') {
        const items = await getDeals();
        const filtered = items.filter((d: any) =>
          (d.title || d.name || '').toLowerCase().includes(query.toLowerCase()) ||
          (d.company || '').toLowerCase().includes(query.toLowerCase())
        );
        results = filtered.slice(0, 10).map((d: any) => ({
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

  // Listen for command palette "Create Meeting" event
  useEffect(() => {
    const handleOpenCreateMeeting = () => {
      setActiveFormType('meeting');
    };
    window.addEventListener('pulse-open-create-meeting-modal', handleOpenCreateMeeting);
    return () => window.removeEventListener('pulse-open-create-meeting-modal', handleOpenCreateMeeting);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-border/60">
        <div>
          <h2 className="text-[20px] font-medium tracking-tight text-foreground flex items-center gap-1.5">
            <ClipboardList className="h-5 w-5 text-accent-color" /><span>Activities</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Review, log, and action scheduled sales activities.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Segmented Switch for Kanban Board vs Timeline Logs */}
          <div className="flex border border-border rounded-lg p-0.5 bg-secondary/30 shrink-0 select-none mr-2">
            <button type="button" onClick={() => setViewMode('kanban')} className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${viewMode === 'kanban' ? 'bg-accent-color text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              Tasks Board
            </button>
            <button type="button" onClick={() => setViewMode('logs')} className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${viewMode === 'logs' ? 'bg-accent-color text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              Activity Logs
            </button>
          </div>

          <button onClick={() => { setIsSelectMode(!isSelectMode); setSelectedIds(new Set()); }}
            className={`inline-flex items-center gap-1.5 px-4 py-2 border rounded-full text-xs font-bold transition-all cursor-pointer shadow-sm ${isSelectMode ? 'bg-accent-color text-white border-accent-color' : 'border-border bg-card hover:bg-secondary text-foreground'}`}>
            <Check size={13} /><span>Select</span>
          </button>
          <div className="relative">
            <button onClick={() => setIsAddDropdownOpen(!isAddDropdownOpen)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent-color hover:bg-accent-color/90 text-white rounded-lg text-xs font-bold cursor-pointer shadow-sm">
              <span>Add activity</span>
              <ChevronDown size={12} className={`transition-transform ${isAddDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {isAddDropdownOpen && (
              <div className="absolute right-0 mt-1.5 bg-card border border-border rounded-xl shadow-lg py-1.5 w-44 z-50">
                {([{ type:'task', label:'Create Task', icon:ClipboardList, color:'text-accent-color' },
                   { type:'call', label:'Log Call', icon:PhoneCall, color:'text-status-success-text' },
                   { type:'meeting', label:'Schedule Meeting', icon:Calendar, color:'text-accent-color' },
                   { type:'email', label:'Sync Email', icon:Mail, color:'text-priority-high' },
                   { type:'note', label:'Add Note', icon:FileText, color:'text-status-success-text' }] as const).map(item => {
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
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-border bg-card hover:bg-secondary text-foreground rounded-full text-xs font-bold cursor-pointer shadow-sm">
            <Download size={13} /><span>Export</span>
          </button>
          {selectedIds.size > 0 && (
            <button onClick={handleBulkDelete}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-status-danger-text hover:bg-status-danger-text/90 text-text-on-primary rounded-lg text-xs font-bold cursor-pointer shadow-sm animate-in fade-in">
              <Trash2 size={13} /><span>Delete ({selectedIds.size})</span>
            </button>
          )}
        </div>
      </div>

      {viewMode === 'kanban' ? (
        /* ─── Task Kanban Board (Separated and on Top) ─── */
        <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <ClipboardList className="h-4 w-4 text-accent-color" />
                <span>Workspace Tasks Board</span>
              </h3>
              <CollapseToggle isCollapsed={isTasksCollapsed} onToggle={() => setIsTasksCollapsed(!isTasksCollapsed)} />
            </div>
            {!isTasksCollapsed && <TasksView isEmbedded={true} />}
        </div>
      ) : (
        /* ─── CRM Activity Logs ─── */
        <>
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Activity History Logs</h3>

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-4 sm:px-5 py-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 size-3.5" />
            <input type="text" placeholder="Search subject, notes, records..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-secondary/20 border border-border rounded-lg pl-9 pr-4 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none" />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] text-muted-foreground/75 font-bold uppercase">View:</span>
            <select value={activeTabType} onChange={e => { setActiveTabType(e.target.value as any); setCurrentPage(1); }}
              className="bg-secondary/30 border border-border rounded-lg px-2.5 py-1 text-foreground focus:outline-none cursor-pointer text-xs font-bold">
              <option value="timeline">Timeline Logs</option>
              <option value="meeting">Meetings</option><option value="call">Calls</option>
              <option value="email">Emails</option><option value="note">Notes</option><option value="calendar">Calendar</option>
            </select>
          </div>
        </div>
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pt-3 border-t border-border/60">
          <div className="flex space-x-1 p-0.5 bg-secondary border border-border/80 rounded-lg w-fit">
            {(['all','today','upcoming','overdue'] as const).map(tab => (
              <button key={tab} onClick={() => { setQuickTab(tab); setCurrentPage(1); }}
                className={`py-1 px-3.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${quickTab===tab ? 'bg-accent-color text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                {tab.charAt(0).toUpperCase()+tab.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="bg-secondary/30 border border-border rounded-lg px-2 py-1 text-muted-foreground focus:outline-none cursor-pointer text-[10px] font-bold">
              <option value="All">Status: all</option><option value="pending">Pending</option>
              <option value="scheduled">Scheduled</option><option value="in_progress">In Progress</option>
              <option value="completed">Completed</option><option value="overdue">Overdue</option>
            </select>
            <select value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); setCurrentPage(1); }}
              className="bg-secondary/30 border border-border rounded-lg px-2 py-1 text-muted-foreground focus:outline-none cursor-pointer text-[10px] font-bold">
              <option value="All">Priority: all</option><option value="urgent">Urgent</option>
              <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
            </select>
            <select value={ownerFilter} onChange={e => { setOwnerFilter(e.target.value); setCurrentPage(1); }}
              className="bg-secondary/30 border border-border rounded-lg px-2 py-1 text-muted-foreground focus:outline-none cursor-pointer text-[10px] font-bold">
              <option value="All">Owner: all</option>
              {owners.map(o => <option key={o.id} value={o.full_name}>{o.full_name}</option>)}
            </select>
            {(statusFilter!=='All'||priorityFilter!=='All'||ownerFilter!=='All'||searchQuery!=='') && (
              <button onClick={() => { setSearchQuery(''); setQuickTab('all'); setActiveTabType('timeline'); setStatusFilter('All'); setPriorityFilter('All'); setOwnerFilter('All'); setCurrentPage(1); toast.success('Filters cleared.'); }}
                className="text-[10px] font-bold text-accent-color hover:underline cursor-pointer ml-1.5">Clear</button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      {activeTabType === 'calendar' ? (
        <CalendarView />
      ) : (
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 bg-surface-2 border border-border-default/50 rounded-xl" />
            ))}
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
          <div className="grid grid-cols-1 gap-3">
            {activities.map(a => (
              <div
                key={a.id}
                onClick={() => onSelectActivity(a.id)}
                className="group relative p-4 bg-surface-1 hover:bg-surface-hover border border-border-default hover:border-accent-color/20 rounded-xl transition duration-200 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm"
              >
                {/* Left side: Checkbox + Icon + Details */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  {isSelectMode && (
                    <div className="shrink-0 flex items-center self-center" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(a.id)}
                        onChange={() => handleSelectRow(a.id)}
                        className="cursor-pointer size-4 rounded border-border-default text-accent-color focus:ring-accent-color/30"
                      />
                    </div>
                  )}

                  {/* Icon depending on activity type */}
                  <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 border select-none ${
                    a.activity_type === 'task' ? 'bg-status-info-bg border-status-info-text/15 text-status-info-text' :
                    a.activity_type === 'meeting' ? 'bg-status-success-bg border-status-success-text/15 text-status-success-text' :
                    a.activity_type === 'call' ? 'bg-purple-500/10 border-purple-500/15 text-purple-600' :
                    a.activity_type === 'email' ? 'bg-amber-500/10 border-amber-500/15 text-amber-600' :
                    'bg-secondary border-border text-muted-foreground'
                  }`}>
                    {a.activity_type === 'task' ? <ClipboardList size={16} /> :
                     a.activity_type === 'meeting' ? <Calendar size={16} /> :
                     a.activity_type === 'call' ? <PhoneCall size={16} /> :
                     a.activity_type === 'email' ? <Mail size={16} /> :
                     <FileText size={16} />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-text-primary text-sm truncate leading-tight group-hover:text-accent-color transition-colors">{a.subject}</h4>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full select-none border ${getStatusColor(a.status)}`}>
                        {fmt(a.status)}
                      </span>
                      {a.priority && (
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full select-none border ${getPriorityColor(a.priority)}`}>
                          {fmt(a.priority)}
                        </span>
                      )}
                    </div>
                    {/* Owner description or small info */}
                    <div className="flex items-center gap-2 text-[10px] text-text-muted mt-1 font-bold">
                      {a.owner_name && <span>Owner: {a.owner_name}</span>}
                      {a.related_record_name && (
                        <>
                          <span className="text-border-default/80">•</span>
                          <span className="text-accent-color hover:underline cursor-pointer" onClick={(e) => { e.stopPropagation(); if (a.related_entity_type === 'lead') onTabChange?.('leads'); }}>
                            Linked: {a.related_record_name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side: Due Date & Deletion Controls */}
                <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 border-t md:border-t-0 border-border-default/40 pt-3 md:pt-0">
                  <div className="text-right flex flex-col md:items-end select-none font-semibold">
                    <span className="text-[10px] text-text-muted">Due Date</span>
                    <span className="text-[11px] text-text-primary tabular-nums">
                      {a.due_date ? new Date(a.due_date).toLocaleDateString() : 'No deadline'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={e => handleRowDelete(e, a)}
                      className="p-1.5 rounded-md text-text-muted hover:text-status-danger-text hover:bg-status-danger-bg opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                      title="Delete activity"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* Pagination */}
      <div className="bg-secondary/15 border border-border rounded-[10px] px-4 py-3 flex items-center justify-between text-xs select-none">
        <div className="text-muted-foreground font-semibold">
          Showing <span className="text-foreground">{Math.min(total,(currentPage-1)*pageSize+1)}</span> to{' '}
          <span className="text-foreground">{Math.min(total,currentPage*pageSize)}</span> of{' '}
          <span className="text-foreground">{total}</span> activities
        </div>
        <div className="flex items-center gap-2">
          <button onClick={()=>setCurrentPage(p=>Math.max(1,p-1))} disabled={currentPage===1}
            className="p-1.5 border border-border bg-card hover:bg-secondary rounded-lg text-muted-foreground cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
            <ChevronLeft size={13} />
          </button>
          <span className="font-bold text-foreground">{currentPage}</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-muted-foreground">{totalPages}</span>
          <button onClick={()=>setCurrentPage(p=>Math.min(totalPages,p+1))} disabled={currentPage===totalPages}
            className="p-1.5 border border-border bg-card hover:bg-secondary rounded-lg text-muted-foreground cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
            <ChevronRight size={13} />
          </button>
        </div>
      </div>
      </>
      )}

      {/* Add Activity Modal */}
      {activeFormType && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl p-5 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-border pb-2 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border ${activeFormType==='task'?'bg-accent-color/10 text-accent-color border-accent-color/15':activeFormType==='meeting'?'bg-accent-color/10 text-accent-color border-accent-color/15':activeFormType==='call'?'bg-status-success-bg text-status-success-text border-status-success-text/15':activeFormType==='email'?'bg-priority-high-bg text-priority-high border-priority-high/15':'bg-status-success-bg text-status-success-text border-status-success-text/15'}`}>{activeFormType}</span>
                <h3 className="font-bold text-foreground text-sm">
                  {activeFormType==='task'?'Log New Task':activeFormType==='call'?'Log Call Outcome':activeFormType==='meeting'?'Schedule Meeting':activeFormType==='email'?'Sync Email':'Add Note'}
                </h3>
              </div>
              <button onClick={()=>{setActiveFormType(null);resetForm();}} className="p-1 hover:bg-secondary rounded-lg text-muted-foreground border border-border cursor-pointer"><X size={12}/></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3 overflow-y-auto pr-1 flex-1">
              {/* Related record */}
              <div className="bg-secondary/20 border border-border/85 rounded-xl p-3 space-y-3">
                <span className="text-[8px] font-black uppercase text-accent-color tracking-widest block leading-none font-['Space_Grotesk']">Linked CRM Context</span>
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
                          ? 'bg-accent-color/10 border-accent-color/20 text-accent-color font-extrabold shadow-sm'
                          : 'bg-card border-border text-muted-foreground'
                      }`}
                    >
                      {rt.label}
                    </button>
                  ))}
                </div>

                <div className="relative" ref={dropdownRef}>
                  <label className="block text-[8px] font-extrabold text-muted-foreground/80 uppercase">
                    Search {relatedType.charAt(0).toUpperCase() + relatedType.slice(1)} {activeFormType !== 'email' && activeFormType !== 'note' && <span className="text-status-danger-text">*</span>}
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
                    <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-accent-color font-semibold">
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
                {activeFormType!=='email'&&<button type="submit" disabled={submitting} className="px-4 py-2 bg-accent-color hover:bg-accent-color/90 text-white rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-60">{submitting?'Saving…':'Submit Activity'}</button>}
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
        <RefreshCw className="size-4 animate-spin text-accent-color mr-2" /><span>Loading activities...</span>
      </div>
    }>
      <ActivitiesListContent onSelectActivity={setSelectedId} onTabChange={onTabChange} />
    </Suspense>
  );
}
