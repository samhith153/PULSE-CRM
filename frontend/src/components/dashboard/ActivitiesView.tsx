'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Plus, Search, Trash2, Download, ChevronDown, X,
  Calendar, ClipboardList, PhoneCall, Mail, FileText,
  Check, Filter, RefreshCw, ChevronLeft, ChevronRight,
} from 'lucide-react';
import {
  getCrmActivities, getCrmActivityOwners, downloadCrmActivitiesExport,
  createCrmTask, createCrmCall, createCrmMeeting, createCrmNote,
  bulkDeleteCrmActivities,
  type CrmActivity, type CrmActivityOwner, type CrmActivitiesListParams,
  type CreateTaskPayload, type CreateCallPayload,
  type CreateMeetingPayload, type CreateNotePayload,
} from '@/utils/api';
import ActivityDetailView from './ActivityDetailView';
import { toast } from '@/lib/toast';

interface ActivitiesViewProps {
  activityId?: string;
  onTabChange?: (tab: string) => void;
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

  const [activeTabType, setActiveTabType] = useState<'timeline'|'task'|'meeting'|'call'|'email'|'note'>('timeline');
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
      if (activeTabType !== 'timeline') params.view = activeTabType;
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

  useEffect(() => { fetchActivities(); }, [fetchActivities]);
  useEffect(() => { setCurrentPage(1); }, [activeTabType, searchQuery, statusFilter, priorityFilter, ownerFilter, quickTab]);

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

  const handleExport = async () => {
    try {
      const params: any = {};
      if (activeTabType !== 'timeline') params.view = activeTabType;
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

  const relatedIds = () => ({
    related_entity_type: relatedName ? relatedType : undefined,
    related_lead_id:    relatedType === 'lead'    && relatedLeadId    ? relatedLeadId    : undefined,
    related_contact_id: relatedType === 'contact' && relatedContactId ? relatedContactId : undefined,
    related_company_id: relatedType === 'company' && relatedCompanyId ? relatedCompanyId : undefined,
    related_deal_id:    relatedType === 'deal'    && relatedDealId    ? relatedDealId    : undefined,
  });

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
        toast.info('Emails sync automatically via Gmail integration.'); setActiveFormType(null); resetForm(); setSubmitting(false); return;
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
            <ClipboardList className="h-5 w-5 text-brand-blue" /><span>Activities</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Review, log, and action scheduled sales activities.</p>
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
              <option value="timeline">Timeline</option><option value="task">Tasks</option>
              <option value="meeting">Meetings</option><option value="call">Calls</option>
              <option value="email">Emails</option><option value="note">Notes</option>
            </select>
          </div>
        </div>
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pt-3 border-t border-border/60">
          <div className="flex space-x-1 p-0.5 bg-secondary border border-border/80 rounded-lg w-fit">
            {(['all','today','upcoming','overdue'] as const).map(tab => (
              <button key={tab} onClick={() => { setQuickTab(tab); setCurrentPage(1); }}
                className={`py-1 px-3.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${quickTab===tab ? 'bg-brand-blue text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
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
                className="text-[10px] font-bold text-brand-blue hover:underline cursor-pointer ml-1.5">Clear</button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-xs text-muted-foreground font-semibold">
            <RefreshCw className="size-4 animate-spin text-brand-blue mr-2" /><span>Loading activities...</span>
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center p-6">
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
                <tr className="border-b border-border bg-muted/40 text-[11px] font-black uppercase text-foreground tracking-wider">
                  {isSelectMode && <th className="py-3 px-3 text-center w-12"><input type="checkbox" onChange={handleSelectAll} checked={selectedIds.size===activities.length&&activities.length>0} className="cursor-pointer size-3.5" /></th>}
                  <th className="py-3 px-3 text-left w-[42%]">Subject</th>
                  <th className="py-3 px-3 text-center w-24">Type</th>
                  <th className="py-3 px-3 text-center w-28">Status</th>
                  <th className="py-3 px-3 text-center w-28">Priority</th>
                  <th className="py-3 px-3 text-right w-36">Due Date</th>
                  <th className="py-3 px-3 text-left w-[20%]">Related Record</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-xs font-semibold text-foreground">
                {activities.map(a => (
                  <tr key={a.id} onClick={() => onSelectActivity(a.id)} className="hover:bg-secondary/15 transition-all cursor-pointer">
                    {isSelectMode && <td className="py-3 px-3 text-center" onClick={e=>e.stopPropagation()}><input type="checkbox" checked={selectedIds.has(a.id)} onChange={()=>handleSelectRow(a.id)} className="cursor-pointer size-3.5" /></td>}
                    <td className="py-3 px-3 text-left whitespace-normal break-words">
                      <span className="font-bold text-foreground hover:text-brand-blue transition-colors block">{a.subject}</span>
                      {a.owner_name && <span className="text-[10px] text-muted-foreground">{a.owner_name}</span>}
                    </td>
                    <td className="py-3 px-3 text-center capitalize text-[10px] font-bold text-muted-foreground/90 font-mono">{a.activity_type}</td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold ${getStatusColor(a.status)}`}>{fmt(a.status)}</span>
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded text-[9px] ${getPriorityColor(a.priority)}`}>{fmt(a.priority)}</span>
                    </td>
                    <td className="py-3 px-3 text-right text-muted-foreground/80 font-bold tabular-nums whitespace-nowrap font-mono">
                      {a.due_date ? new Date(a.due_date).toLocaleDateString() : 'No deadline'}
                    </td>
                    <td className="py-3 px-3 text-left truncate text-[10px] font-bold">
                      {a.related_record_name
                        ? <span className="text-brand-blue hover:underline cursor-pointer">{a.related_record_name}</span>
                        : <span className="text-muted-foreground/50">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
                <span className="text-[8px] font-black uppercase text-brand-purple tracking-widest block">Linked CRM Context</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['lead','contact','company','deal'] as const).map(rt => (
                    <button type="button" key={rt} onClick={()=>setRelatedType(rt)}
                      className={`py-1.5 rounded-lg text-[9px] font-bold uppercase border cursor-pointer ${relatedType===rt?'bg-brand-purple/10 border-brand-purple/20 text-brand-purple':'bg-card border-border text-muted-foreground'}`}>
                      {rt.charAt(0).toUpperCase()+rt.slice(1)}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[8px] font-extrabold text-muted-foreground/80 uppercase">Record Name</label>
                    <input type="text" placeholder="e.g. Acme Corp" value={relatedName} onChange={e=>setRelatedName(e.target.value)} className="mt-1 w-full bg-card border border-border rounded-lg px-2.5 py-1 text-xs focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[8px] font-extrabold text-muted-foreground/80 uppercase">Record ID (optional)</label>
                    <input type="text" placeholder="UUID"
                      value={relatedType==='lead'?relatedLeadId:relatedType==='contact'?relatedContactId:relatedType==='company'?relatedCompanyId:relatedDealId}
                      onChange={e=>{if(relatedType==='lead')setRelatedLeadId(e.target.value);else if(relatedType==='contact')setRelatedContactId(e.target.value);else if(relatedType==='company')setRelatedCompanyId(e.target.value);else setRelatedDealId(e.target.value);}}
                      className="mt-1 w-full bg-card border border-border rounded-lg px-2.5 py-1 text-xs focus:outline-none" />
                  </div>
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

              {activeFormType==='email'&&(
                <div className="bg-[#E8A33D]/10 border border-[#E8A33D]/20 rounded-xl p-4 text-center">
                  <Mail className="size-8 text-[#E8A33D] mx-auto mb-2"/>
                  <p className="text-xs font-bold text-foreground">Email Sync via Gmail</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Emails sync automatically from your connected Gmail account.</p>
                </div>
              )}

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
