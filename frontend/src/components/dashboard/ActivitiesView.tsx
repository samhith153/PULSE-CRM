'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Plus, 
  Search, 
  Trash2, 
  Download, 
  ChevronDown, 
  X, 
  Calendar, 
  ClipboardList, 
  PhoneCall, 
  Mail, 
  FileText, 
  Check, 
  Inbox, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  User,
  MoreVertical,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { getActivitiesFromStorage, saveActivitiesToStorage, Activity, RelatedRecord } from '@/utils/activityDb';
import ActivityDetailView from './ActivityDetailView';
import { toast } from '@/lib/toast';

interface ActivitiesViewProps {
  activityId?: string;
}

function ActivitiesListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- Database State ---
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Filtering State ---
  const [searchQuery, setSearchQuery] = useState('');
  const [quickTab, setQuickTab] = useState<'all' | 'today' | 'upcoming' | 'overdue'>('all');
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['task', 'call', 'meeting', 'email', 'note']);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [ownerFilter, setOwnerFilter] = useState<string>('All');

  // --- Pagination State ---
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // --- Row Selection State ---
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // --- Modal Forms State ---
  const [isAddDropdownOpen, setIsAddDropdownOpen] = useState(false);
  const [activeFormType, setActiveFormType] = useState<'task' | 'call' | 'meeting' | 'email' | 'note' | null>(null);

  // --- Creation Form Fields ---
  const [formSubject, setFormSubject] = useState('');
  const [formPriority, setFormPriority] = useState('Medium');
  const [formStatus, setFormStatus] = useState('Pending');
  const [formDueDate, setFormDueDate] = useState('');
  
  // Type-specific
  const [taskDesc, setTaskDesc] = useState('');
  const [taskReminder, setTaskReminder] = useState('15 mins before');
  const [taskRepeat, setTaskRepeat] = useState('None');
  
  const [callContactName, setCallContactName] = useState('');
  const [callPhoneNumber, setCallPhoneNumber] = useState('');
  const [callType, setCallType] = useState('Outbound');
  const [callDuration, setCallDuration] = useState('10 mins');
  const [callOutcome, setCallOutcome] = useState('Connected');
  const [callNotes, setCallNotes] = useState('');
  
  const [meetingAgenda, setMeetingAgenda] = useState('');
  const [meetingParticipants, setMeetingParticipants] = useState('');
  const [meetingLocation, setMeetingLocation] = useState('');
  
  const [emailFrom, setEmailFrom] = useState('sarah.johnson@pulsecrm.com');
  const [emailTo, setEmailTo] = useState('');
  const [emailThread, setEmailThread] = useState('');
  const [emailBody, setEmailBody] = useState('');
  
  const [noteBody, setNoteBody] = useState('');

  // Related Record selector
  const [relatedType, setRelatedType] = useState<'lead' | 'contact' | 'company' | 'deal'>('lead');
  const [relatedName, setRelatedName] = useState('');
  const [relatedId, setRelatedId] = useState('');

  // Initial Load & Query Params Pre-filtering
  useEffect(() => {
    const list = getActivitiesFromStorage();
    setActivities(list);
    setLoading(false);

    // Read search query params
    const tabParam = searchParams.get('tab');
    const typeParam = searchParams.get('type');

    if (tabParam) {
      if (tabParam === 'today-tasks') {
        setQuickTab('today');
        setSelectedTypes(['task']);
      } else if (tabParam === 'upcoming-meetings') {
        setQuickTab('upcoming');
        setSelectedTypes(['meeting']);
      } else if (tabParam === 'pending-calls') {
        setQuickTab('all');
        setSelectedTypes(['call']);
        setStatusFilter('Pending');
      } else if (tabParam === 'overdue-tasks') {
        setQuickTab('overdue');
        setSelectedTypes(['task']);
      } else if (tabParam === 'completed') {
        setStatusFilter('Completed');
      } else if (tabParam === 'emails-sent') {
        setSelectedTypes(['email']);
        setSearchQuery('sarah.johnson');
      } else if (tabParam === 'emails-received') {
        setSelectedTypes(['email']);
      }
    }

    if (typeParam) {
      setSelectedTypes([typeParam]);
    }
  }, [searchParams]);

  // --- Filtering Logic ---
  const filteredActivities = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);

    return activities.filter(a => {
      // 1. Search Query
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        a.subject.toLowerCase().includes(q) ||
        (a.details.notes || '').toLowerCase().includes(q) ||
        (a.details.description || '').toLowerCase().includes(q) ||
        (a.details.body || '').toLowerCase().includes(q) ||
        (a.relatedRecord?.name || '').toLowerCase().includes(q);

      // 2. Type Chip Select (OR filter)
      const matchesType = selectedTypes.includes(a.type);

      // 3. Status
      const matchesStatus = statusFilter === 'All' || a.status === statusFilter;

      // 4. Priority
      const matchesPriority = priorityFilter === 'All' || a.priority === priorityFilter;

      // 5. Owner
      const matchesOwner = ownerFilter === 'All' || a.owner === ownerFilter;

      // 6. Quick segmented control tab
      let matchesTab = true;
      if (quickTab === 'today') {
        matchesTab = a.dueDate?.slice(0, 10) === todayStr && a.status !== 'Completed';
      } else if (quickTab === 'upcoming') {
        matchesTab = a.dueDate?.slice(0, 10) >= todayStr && a.status !== 'Completed';
      } else if (quickTab === 'overdue') {
        matchesTab = a.status === 'Overdue' || (!!a.dueDate && a.dueDate < new Date().toISOString() && a.status !== 'Completed');
      }

      return matchesSearch && matchesType && matchesStatus && matchesPriority && matchesOwner && matchesTab;
    });
  }, [activities, searchQuery, selectedTypes, statusFilter, priorityFilter, ownerFilter, quickTab]);

  // --- Pagination calculations ---
  const totalItems = filteredActivities.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  
  // Guard current page
  const activePage = Math.min(currentPage, totalPages);

  const paginatedActivities = useMemo(() => {
    const start = (activePage - 1) * pageSize;
    return filteredActivities.slice(start, start + pageSize);
  }, [filteredActivities, activePage, pageSize]);

  // --- Row selection handlers ---
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const ids = new Set(paginatedActivities.map(a => a.id));
      setSelectedIds(ids);
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // --- Bulk Deletes (Sequential) ---
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Are you sure you want to delete the ${selectedIds.size} selected activities?`)) return;

    try {
      const remaining = activities.filter(a => !selectedIds.has(a.id));
      saveActivitiesToStorage(remaining);
      setActivities(remaining);
      setSelectedIds(new Set());
      toast.success("Selected activities deleted successfully.");
    } catch (e) {
      toast.error("Failed to delete selected activities.");
    }
  };

  // --- Type Chip Toggle helper ---
  const handleToggleTypeChip = (type: string) => {
    setSelectedTypes(prev => {
      if (prev.includes(type)) {
        if (prev.length === 1) return prev; // keep at least one selected
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  // --- Create Activity Submit ---
  const handleCreateActivity = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formSubject.trim() && activeFormType !== 'note') {
      toast.error("Subject is required!");
      return;
    }

    const newId = `act-${Date.now()}`;
    const rRecord: RelatedRecord | undefined = relatedName.trim() ? {
      id: relatedId || `rel-${Date.now()}`,
      name: relatedName,
      type: relatedType
    } : undefined;

    let detailsPayload: any = {};
    let finalSubject = formSubject;

    if (activeFormType === 'task') {
      detailsPayload = {
        title: formSubject,
        description: taskDesc,
        assignedTo: 'Sarah Johnson',
        reminder: taskReminder,
        repeat: taskRepeat
      };
    } else if (activeFormType === 'call') {
      detailsPayload = {
        contactName: callContactName || relatedName,
        phoneNumber: callPhoneNumber,
        callType,
        duration: callDuration,
        outcome: callOutcome,
        notes: callNotes
      };
    } else if (activeFormType === 'meeting') {
      detailsPayload = {
        agenda: meetingAgenda,
        participants: meetingParticipants.split(',').map(p => p.trim()),
        date: formDueDate.slice(0, 10),
        time: formDueDate.slice(11, 16),
        location: meetingLocation,
        meetingUrl: meetingLocation.startsWith('http') ? meetingLocation : undefined
      };
    } else if (activeFormType === 'email') {
      detailsPayload = {
        from: emailFrom,
        to: emailTo,
        sentTime: 'Just now',
        thread: emailThread || formSubject,
        body: emailBody,
        isRead: true
      };
    } else if (activeFormType === 'note') {
      finalSubject = `Internal Note: ${noteBody.slice(0, 30)}...`;
      detailsPayload = {
        body: noteBody
      };
    }

    const newActivity: Activity = {
      id: newId,
      type: activeFormType!,
      subject: finalSubject,
      status: activeFormType === 'task' ? formStatus : 'Completed',
      priority: formPriority,
      dueDate: formDueDate ? new Date(formDueDate).toISOString() : new Date().toISOString(),
      owner: 'Sarah Johnson',
      relatedRecord: rRecord,
      details: detailsPayload,
      timeline: [
        { action: 'Created', time: new Date().toISOString(), user: 'Sarah Johnson', desc: `Activity manually logged as ${activeFormType}.` }
      ]
    };

    const updatedList = [newActivity, ...activities];
    saveActivitiesToStorage(updatedList);
    setActivities(updatedList);
    
    // Close modal & reset fields
    setActiveFormType(null);
    resetFormFields();
    toast.success("Activity logged successfully.");
  };

  const resetFormFields = () => {
    setFormSubject('');
    setFormPriority('Medium');
    setFormStatus('Pending');
    setFormDueDate('');
    setTaskDesc('');
    setCallContactName('');
    setCallPhoneNumber('');
    setCallNotes('');
    setMeetingAgenda('');
    setMeetingParticipants('');
    setMeetingLocation('');
    setEmailTo('');
    setEmailThread('');
    setEmailBody('');
    setNoteBody('');
    setRelatedName('');
    setRelatedId('');
  };

  // --- Export Excel/CSV mockup ---
  const handleExportCSV = () => {
    toast.success("CSV file generation initiated. Download will begin shortly.");
  };

  // --- Color utilities ---
  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'Urgent': return 'bg-rose-500/10 text-rose-500 border border-rose-500/15';
      case 'High': return 'bg-amber-500/10 text-amber-500 border border-amber-500/15';
      case 'Medium': return 'bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/15';
      default: return 'bg-secondary text-muted-foreground border border-border/80';
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'Completed': return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/15';
      case 'Overdue': return 'bg-rose-500/10 text-rose-500 border border-rose-500/15';
      case 'In Progress': return 'bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/15';
      case 'Scheduled': return 'bg-brand-purple/10 text-brand-purple border border-brand-purple/15';
      default: return 'bg-secondary text-muted-foreground border border-border/80';
    }
  };

  return (
    <div className="space-y-[var(--space-4)] animate-in fade-in duration-300">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-[var(--space-2)] border-b border-border/80">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-1.5 select-none">
            <ClipboardList className="h-5 w-5 text-brand-purple" />
            <span>Activities</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 leading-none">Review, log, and action scheduled sales activities, note entries, and sync logs.</p>
        </div>

        <div className="flex items-center gap-[var(--space-2)] relative">
          
          {/* Add Activity dropdown trigger */}
          <div className="relative">
            <button
              onClick={() => setIsAddDropdownOpen(!isAddDropdownOpen)}
              className="inline-flex items-center gap-1.5 px-4.5 py-2 bg-brand-purple hover:bg-brand-purple/90 text-primary-foreground rounded-lg text-xs font-semibold cursor-pointer shadow-sm"
            >
              <Plus size={13} />
              <span>Add Activity</span>
              <ChevronDown size={12} className={`transition-transform duration-200 ${isAddDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isAddDropdownOpen && (
              <div className="absolute right-0 mt-1.5 bg-card border border-border rounded-xl shadow-lg py-1.5 w-44 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                {[
                  { type: 'task', label: 'Create Task', icon: ClipboardList, color: 'text-brand-purple' },
                  { type: 'call', label: 'Log Call', icon: PhoneCall, color: 'text-brand-cyan' },
                  { type: 'meeting', label: 'Schedule Meeting', icon: Calendar, color: 'text-brand-blue' },
                  { type: 'email', label: 'Sync Email', icon: Mail, color: 'text-amber-500' },
                  { type: 'note', label: 'Add Note', icon: FileText, color: 'text-emerald-500' }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.type}
                      onClick={() => {
                        setActiveFormType(item.type as any);
                        setIsAddDropdownOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-secondary flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Icon size={13} className={item.color} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-border bg-card hover:bg-secondary text-foreground rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-sm"
          >
            <Download size={13} />
            <span>Export</span>
          </button>
          
          {selectedIds.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-sm animate-in fade-in duration-200"
            >
              <Trash2 size={13} />
              <span>Delete ({selectedIds.size})</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-card border border-border rounded-2xl p-[var(--space-4)] shadow-card space-y-4">
        
        {/* Row 1: Search & Tabs */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-[var(--space-3)]">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 size-3.5" />
            <input
              type="text"
              placeholder="Search subject, notes, related record..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-secondary/20 border border-border rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-brand-purple/20 transition-all"
            />
          </div>

          {/* Quick tab controls */}
          <div className="flex space-x-1 p-1 bg-secondary border border-border/80 rounded-xl w-fit select-none">
            {[
              { id: 'all', label: 'All' },
              { id: 'today', label: 'Due Today' },
              { id: 'upcoming', label: 'Upcoming' },
              { id: 'overdue', label: 'Overdue' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setQuickTab(tab.id as any); setCurrentPage(1); }}
                className={`py-1 px-3.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  quickTab === tab.id
                    ? 'bg-brand-purple text-primary-foreground shadow-sm font-black'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Type filter chips */}
        <div className="flex flex-wrap items-center gap-[var(--space-2)] border-t border-border/60 pt-3 select-none">
          <span className="text-[10px] text-muted-foreground/75 font-bold uppercase mr-1.5">Activity Types:</span>
          {[
            { id: 'task', label: 'Tasks', icon: ClipboardList, color: 'text-brand-purple bg-brand-purple/10 border-brand-purple/25' },
            { id: 'call', label: 'Calls', icon: PhoneCall, color: 'text-brand-cyan bg-brand-cyan/10 border-brand-cyan/25' },
            { id: 'meeting', label: 'Meetings', icon: Calendar, color: 'text-brand-blue bg-brand-blue/10 border-brand-blue/25' },
            { id: 'email', label: 'Emails', icon: Mail, color: 'text-amber-500 bg-amber-500/10 border-amber-500/25' },
            { id: 'note', label: 'Notes', icon: FileText, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/25' }
          ].map(chip => {
            const isSelected = selectedTypes.includes(chip.id);
            const Icon = chip.icon;
            return (
              <button
                key={chip.id}
                onClick={() => { handleToggleTypeChip(chip.id); setCurrentPage(1); }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-extrabold border transition-all cursor-pointer select-none ${
                  isSelected 
                    ? `${chip.color} shadow-sm` 
                    : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-secondary/40'
                }`}
              >
                <Icon size={11} strokeWidth={2.25} />
                <span>{chip.label}</span>
              </button>
            );
          })}
        </div>

        {/* Row 3: Dropdown filters */}
        <div className="flex flex-wrap items-center gap-3 border-t border-border/60 pt-3">
          <span className="text-[10px] text-muted-foreground/75 font-bold uppercase mr-1.5">Filters:</span>
          
          {/* Status filter */}
          <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground select-none">
            <span className="text-[9px] uppercase font-bold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="bg-secondary/30 border border-border rounded-lg px-2.5 py-1 text-foreground focus:outline-none cursor-pointer hover:bg-secondary/60"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Scheduled">Scheduled</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>

          {/* Priority filter */}
          <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground select-none">
            <span className="text-[9px] uppercase font-bold">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => { setPriorityFilter(e.target.value); setCurrentPage(1); }}
              className="bg-secondary/30 border border-border rounded-lg px-2.5 py-1 text-foreground focus:outline-none cursor-pointer hover:bg-secondary/60"
            >
              <option value="All">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Owner filter */}
          <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground select-none">
            <span className="text-[9px] uppercase font-bold">Owner:</span>
            <select
              value={ownerFilter}
              onChange={(e) => { setOwnerFilter(e.target.value); setCurrentPage(1); }}
              className="bg-secondary/30 border border-border rounded-lg px-2.5 py-1 text-foreground focus:outline-none cursor-pointer hover:bg-secondary/60"
            >
              <option value="All">All Owners</option>
              <option value="Sarah Johnson">Sarah Johnson</option>
              <option value="Alex Rivera">Alex Rivera</option>
              <option value="David Wilson">David Wilson</option>
              <option value="System">System</option>
            </select>
          </div>

          <button
            onClick={() => {
              setSearchQuery('');
              setQuickTab('all');
              setSelectedTypes(['task', 'call', 'meeting', 'email', 'note']);
              setStatusFilter('All');
              setPriorityFilter('All');
              setOwnerFilter('All');
              setCurrentPage(1);
              toast.success("Filters cleared.");
            }}
            className="text-[10px] font-bold text-brand-purple hover:underline cursor-pointer ml-auto select-none"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Main table list view */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-card">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-xs text-muted-foreground font-semibold">
            <RefreshCw className="size-4 animate-spin text-brand-purple mr-2" />
            <span>Retrieving activities data...</span>
          </div>
        ) : paginatedActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center select-none bg-card p-6">
            <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mb-3">
              <Filter className="size-5 text-muted-foreground/60" />
            </div>
            <p className="text-xs font-bold text-foreground">No Activities Found</p>
            <p className="text-[11px] text-muted-foreground max-w-sm mt-1 leading-relaxed">
              No logged items match your current filter settings. Try adjusting search queries, types, or statuses.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse table-fixed select-none">
              <thead>
                <tr className="border-b border-border/80 bg-secondary/15 text-[9px] uppercase font-bold text-muted-foreground/75 tracking-wider">
                  <th className="py-3 px-[var(--space-3)] text-center w-12">
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAll}
                      checked={selectedIds.size === paginatedActivities.length && paginatedActivities.length > 0}
                      className="cursor-pointer size-3.5"
                    />
                  </th>
                  <th className="py-3 px-[var(--space-3)] text-left w-[38%]">Subject</th>
                  <th className="py-3 px-[var(--space-3)] text-center w-24">Type</th>
                  <th className="py-3 px-[var(--space-3)] text-center w-28">Status</th>
                  <th className="py-3 px-[var(--space-3)] text-center w-28">Priority</th>
                  <th className="py-3 px-[var(--space-3)] text-right w-36">Due Date</th>
                  <th className="py-3 px-[var(--space-3)] text-left w-36">Related Record</th>
                  <th className="py-3 px-[var(--space-3)] text-left w-32">Owner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/45 text-xs font-semibold text-foreground">
                {paginatedActivities.map((a) => (
                  <tr 
                    key={a.id} 
                    onClick={() => router.push(`/activities/${a.id}`)}
                    className="hover:bg-secondary/10 hover:shadow-sm transition-all duration-150 cursor-pointer"
                  >
                    <td 
                      className="py-[var(--space-2)] px-[var(--space-3)] text-center" 
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input 
                        type="checkbox" 
                        checked={selectedIds.has(a.id)}
                        onChange={() => handleSelectRow(a.id)}
                        className="cursor-pointer size-3.5"
                      />
                    </td>
                    
                    <td className="py-[var(--space-2)] px-[var(--space-3)] text-left max-w-0 overflow-hidden text-ellipsis">
                      <span className="font-bold text-foreground hover:text-brand-purple transition-colors truncate block" title={a.subject}>
                        {a.subject}
                      </span>
                    </td>

                    <td className="py-[var(--space-2)] px-[var(--space-3)] text-center capitalize text-[10px] font-bold text-muted-foreground/90">
                      {a.type}
                    </td>

                    <td className="py-[var(--space-2)] px-[var(--space-3)] text-center whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase leading-tight ${getStatusColor(a.status)}`}>
                        {a.status}
                      </span>
                    </td>

                    <td className="py-[var(--space-2)] px-[var(--space-3)] text-center whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase leading-tight ${getPriorityColor(a.priority)}`}>
                        {a.priority}
                      </span>
                    </td>

                    <td className="py-[var(--space-2)] px-[var(--space-3)] text-right text-muted-foreground/80 font-bold tabular-nums whitespace-nowrap">
                      {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : 'No deadline'}
                    </td>

                    <td className="py-[var(--space-2)] px-[var(--space-3)] text-left max-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[10px] font-bold">
                      {a.relatedRecord ? (
                        <span 
                          onClick={(e) => { e.stopPropagation(); router.push(`/${a.relatedRecord?.type}s`); }}
                          className="text-brand-purple hover:underline"
                        >
                          {a.relatedRecord.name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </td>

                    <td className="py-[var(--space-2)] px-[var(--space-3)] text-left max-w-0 overflow-hidden text-ellipsis whitespace-nowrap font-medium text-muted-foreground/90">
                      <div className="flex items-center gap-1">
                        <span className="size-4.5 rounded-full bg-secondary flex items-center justify-center text-[9px] font-extrabold text-brand-purple select-none shrink-0">
                          {a.owner.charAt(0)}
                        </span>
                        <span className="truncate">{a.owner}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer pagination */}
        <div className="bg-secondary/15 border-t border-border/80 px-[var(--space-4)] py-[var(--space-3)] flex items-center justify-between text-xs select-none">
          <div className="text-muted-foreground font-semibold">
            Showing <span className="text-foreground">{Math.min(totalItems, (activePage - 1) * pageSize + 1)}</span> to{' '}
            <span className="text-foreground">{Math.min(totalItems, activePage * pageSize)}</span> of{' '}
            <span className="text-foreground">{totalItems}</span> activities
          </div>

          <div className="flex items-center gap-[var(--space-2)]">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={activePage === 1}
              className="p-1.5 border border-border bg-card hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              <ChevronLeft size={13} />
            </button>
            
            <div className="flex items-center gap-1 font-bold">
              <span className="text-foreground">{activePage}</span>
              <span className="text-muted-foreground">/</span>
              <span className="text-muted-foreground">{totalPages}</span>
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={activePage === totalPages}
              className="p-1.5 border border-border bg-card hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* --- Add Activity Modals (Type discriminate) --- */}
      {activeFormType && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl p-[var(--space-5)] animate-in scale-in duration-250 flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between border-b border-border pb-[var(--space-2)] mb-[var(--space-4)] shrink-0">
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                  activeFormType === 'task' ? 'bg-brand-purple/10 text-brand-purple border-brand-purple/15' :
                  activeFormType === 'meeting' ? 'bg-brand-blue/10 text-brand-blue border-brand-blue/15' :
                  activeFormType === 'call' ? 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/15' :
                  activeFormType === 'email' ? 'bg-amber-500/10 text-amber-500 border-amber-500/15' :
                  'bg-emerald-500/10 text-emerald-500 border-emerald-500/15'
                }`}>
                  {activeFormType}
                </span>
                <h3 className="font-bold text-foreground text-sm">
                  {activeFormType === 'task' ? 'Log New Task' :
                   activeFormType === 'call' ? 'Log Call outcome' :
                   activeFormType === 'meeting' ? 'Schedule Calendar Meeting' :
                   activeFormType === 'email' ? 'Archive Synced Email' :
                   'Add Internal Note'}
                </h3>
              </div>
              <button 
                onClick={() => { setActiveFormType(null); resetFormFields(); }}
                className="p-1 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground cursor-pointer transition-colors border border-border"
              >
                <X size={12} />
              </button>
            </div>

            <form onSubmit={handleCreateActivity} className="space-y-[var(--space-3)] overflow-y-auto pr-1 flex-1 custom-scrollbar">
              
              {/* Common Related Record Selector (REQUIRED except Note/Email) */}
              <div className="bg-secondary/20 border border-border/80 rounded-xl p-3 space-y-3">
                <span className="text-[8px] font-black uppercase text-brand-purple tracking-widest block leading-none">Linked CRM Context</span>
                <div className="grid grid-cols-3 gap-2">
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

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[8px] font-extrabold text-muted-foreground/80 uppercase">Record Name {activeFormType !== 'email' && activeFormType !== 'note' && <span className="text-rose-500">*</span>}</label>
                    <input
                      type="text"
                      placeholder="e.g. Acme Corp"
                      value={relatedName}
                      onChange={(e) => setRelatedName(e.target.value)}
                      required={activeFormType !== 'email' && activeFormType !== 'note'}
                      className="mt-1 w-full bg-card border border-border rounded-lg px-2.5 py-1 text-xs text-foreground focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] font-extrabold text-muted-foreground/80 uppercase">Record ID (optional)</label>
                    <input
                      type="text"
                      placeholder="UUID or Slug"
                      value={relatedId}
                      onChange={(e) => setRelatedId(e.target.value)}
                      className="mt-1 w-full bg-card border border-border rounded-lg px-2.5 py-1 text-xs text-foreground focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Form Discrimination Fields */}
              {activeFormType === 'task' && (
                <>
                  <div>
                    <label className="block text-[9px] font-bold text-muted-foreground uppercase">Task Subject *</label>
                    <input
                      type="text"
                      placeholder="e.g. Sign legal compliance SLA"
                      value={formSubject}
                      onChange={(e) => setFormSubject(e.target.value)}
                      className="mt-1 w-full bg-background border border-border rounded-lg px-2.5 py-1 text-xs text-foreground focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-muted-foreground uppercase">Description</label>
                    <textarea
                      placeholder="Enter detailed task assignment checklist notes..."
                      value={taskDesc}
                      onChange={(e) => setTaskDesc(e.target.value)}
                      rows={3}
                      className="mt-1 w-full bg-background border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold text-muted-foreground uppercase">Due Date & Time *</label>
                      <input
                        type="datetime-local"
                        value={formDueDate}
                        onChange={(e) => setFormDueDate(e.target.value)}
                        required
                        className="mt-1 w-full bg-background border border-border rounded-lg px-2.5 py-1 text-xs text-foreground focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-muted-foreground uppercase">Priority</label>
                      <select
                        value={formPriority}
                        onChange={(e) => setFormPriority(e.target.value)}
                        className="mt-1 w-full bg-background border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none"
                      >
                        <option>Urgent</option>
                        <option>High</option>
                        <option>Medium</option>
                        <option>Low</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {activeFormType === 'call' && (
                <>
                  <div>
                    <label className="block text-[9px] font-bold text-muted-foreground uppercase">Call Topic / Subject *</label>
                    <input
                      type="text"
                      placeholder="e.g. Discovery meeting alignment call"
                      value={formSubject}
                      onChange={(e) => setFormSubject(e.target.value)}
                      className="mt-1 w-full bg-background border border-border rounded-lg px-2.5 py-1 text-xs text-foreground focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold text-muted-foreground uppercase">Contact Name</label>
                      <input
                        type="text"
                        placeholder="Marcus Aurelius"
                        value={callContactName}
                        onChange={(e) => setCallContactName(e.target.value)}
                        className="mt-1 w-full bg-background border border-border rounded-lg px-2.5 py-1 text-xs text-foreground focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-muted-foreground uppercase">Phone Number</label>
                      <input
                        type="text"
                        placeholder="+91 99281 72615"
                        value={callPhoneNumber}
                        onChange={(e) => setCallPhoneNumber(e.target.value)}
                        className="mt-1 w-full bg-background border border-border rounded-lg px-2.5 py-1 text-xs text-foreground focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold text-muted-foreground uppercase">Call Type</label>
                      <select
                        value={callType}
                        onChange={(e) => setCallType(e.target.value)}
                        className="mt-1 w-full bg-background border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none"
                      >
                        <option>Outbound</option>
                        <option>Inbound</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-muted-foreground uppercase">Outcome</label>
                      <select
                        value={callOutcome}
                        onChange={(e) => setFormStatus(e.target.value === 'Connected' ? 'Completed' : 'Pending')}
                        className="mt-1 w-full bg-background border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none"
                      >
                        <option>Connected</option>
                        <option>Busy</option>
                        <option>Left VM</option>
                        <option>Call Back Later</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-muted-foreground uppercase">Duration</label>
                      <input
                        type="text"
                        placeholder="15 mins"
                        value={callDuration}
                        onChange={(e) => setCallDuration(e.target.value)}
                        className="mt-1 w-full bg-background border border-border rounded-lg px-2.5 py-1 text-xs text-foreground focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-muted-foreground uppercase">Call Summary Notes</label>
                    <textarea
                      placeholder="Write notes about custom SSO queries, client constraints..."
                      value={callNotes}
                      onChange={(e) => setCallNotes(e.target.value)}
                      rows={2}
                      className="mt-1 w-full bg-background border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none"
                    />
                  </div>
                </>
              )}

              {activeFormType === 'meeting' && (
                <>
                  <div>
                    <label className="block text-[9px] font-bold text-muted-foreground uppercase">Meeting Title *</label>
                    <input
                      type="text"
                      placeholder="e.g. Contract Signoff Panel"
                      value={formSubject}
                      onChange={(e) => setFormSubject(e.target.value)}
                      className="mt-1 w-full bg-background border border-border rounded-lg px-2.5 py-1 text-xs text-foreground focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-muted-foreground uppercase">Agenda Details</label>
                    <textarea
                      placeholder="Detail presentation of SOC2 credentials and blueprints..."
                      value={meetingAgenda}
                      onChange={(e) => setMeetingAgenda(e.target.value)}
                      rows={2}
                      className="mt-1 w-full bg-background border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold text-muted-foreground uppercase">Schedule Date & Time *</label>
                      <input
                        type="datetime-local"
                        value={formDueDate}
                        onChange={(e) => setFormDueDate(e.target.value)}
                        required
                        className="mt-1 w-full bg-background border border-border rounded-lg px-2.5 py-1 text-xs text-foreground focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-muted-foreground uppercase">Meeting Location (Zoom / Room)</label>
                      <input
                        type="text"
                        placeholder="https://zoom.us/j/..."
                        value={meetingLocation}
                        onChange={(e) => setMeetingLocation(e.target.value)}
                        className="mt-1 w-full bg-background border border-border rounded-lg px-2.5 py-1 text-xs text-foreground focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-muted-foreground uppercase">Participants (comma separated)</label>
                    <input
                      type="text"
                      placeholder="Sarah Johnson, Alex Rivera, Marcus Aurelius"
                      value={meetingParticipants}
                      onChange={(e) => setMeetingParticipants(e.target.value)}
                      className="mt-1 w-full bg-background border border-border rounded-lg px-2.5 py-1 text-xs text-foreground focus:outline-none"
                    />
                  </div>
                </>
              )}

              {activeFormType === 'email' && (
                <>
                  <div>
                    <label className="block text-[9px] font-bold text-muted-foreground uppercase">Email Subject *</label>
                    <input
                      type="text"
                      placeholder="e.g. Sync: SSO migration roadmap"
                      value={formSubject}
                      onChange={(e) => setFormSubject(e.target.value)}
                      className="mt-1 w-full bg-background border border-border rounded-lg px-2.5 py-1 text-xs text-foreground focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold text-muted-foreground uppercase">Sender (From)</label>
                      <input
                        type="text"
                        value={emailFrom}
                        onChange={(e) => setEmailFrom(e.target.value)}
                        className="mt-1 w-full bg-background border border-border rounded-lg px-2.5 py-1 text-xs text-foreground focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-muted-foreground uppercase">Receiver (To) *</label>
                      <input
                        type="text"
                        placeholder="client@techcorp.com"
                        value={emailTo}
                        onChange={(e) => setEmailTo(e.target.value)}
                        required
                        className="mt-1 w-full bg-background border border-border rounded-lg px-2.5 py-1 text-xs text-foreground focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-muted-foreground uppercase">Thread Conversation Topic</label>
                    <input
                      type="text"
                      placeholder="Configuration Queries"
                      value={emailThread}
                      onChange={(e) => setEmailThread(e.target.value)}
                      className="mt-1 w-full bg-background border border-border rounded-lg px-2.5 py-1 text-xs text-foreground focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-muted-foreground uppercase">Email Body Payload</label>
                    <textarea
                      placeholder="Sync and archive full conversation text body..."
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      rows={3}
                      className="mt-1 w-full bg-background border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none"
                    />
                  </div>
                </>
              )}

              {activeFormType === 'note' && (
                <>
                  <div>
                    <label className="block text-[9px] font-bold text-muted-foreground uppercase">Internal Note Body *</label>
                    <textarea
                      placeholder="Type details, client comments, skepticism factors, Blue-Green deployments..."
                      value={noteBody}
                      onChange={(e) => setNoteBody(e.target.value)}
                      rows={4}
                      required
                      className="mt-1 w-full bg-background border border-border rounded-lg p-2.5 text-xs text-foreground focus:outline-none"
                    />
                  </div>
                </>
              )}

              <div className="pt-4 border-t border-border flex justify-end gap-[var(--space-2)] shrink-0">
                <button
                  type="button"
                  onClick={() => { setActiveFormType(null); resetFormFields(); }}
                  className="px-4 py-2 border border-border bg-card hover:bg-secondary text-foreground rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4.5 py-2 bg-brand-purple hover:bg-brand-purple/90 text-primary-foreground rounded-lg text-xs font-semibold cursor-pointer shadow-sm"
                >
                  Submit Activity
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default function ActivitiesView({ activityId }: ActivitiesViewProps) {
  if (activityId) {
    return <ActivityDetailView id={activityId} />;
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20 text-xs text-muted-foreground font-semibold">
        <RefreshCw className="size-4 animate-spin text-brand-purple mr-2" />
        <span>Loading activities...</span>
      </div>
    }>
      <ActivitiesListContent />
    </Suspense>
  );
}
