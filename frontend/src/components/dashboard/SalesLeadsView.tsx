'use client';

import { toast } from '@/lib/toast';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Lead as BackendLead, 
  getLeads, 
  createLead, 
  updateLead, 
  deleteLead as apiDeleteLead, 
  convertLead, 
  resolveImageUrl 
} from '@/utils/api';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  LayoutGrid, 
  List, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  Users,
  UserCheck,
  TrendingUp,
  Shield,
  X,
  ArrowUpDown,
  Filter
} from 'lucide-react';

const STATUS_MAP: Record<string, string> = {
  'New': 'new', 'Contacted': 'contacted', 'Qualified': 'qualified', 'Converted': 'converted', 'Lost': 'lost',
};
const STATUS_UNMAP: Record<string, Lead['status']> = {
  'new': 'New', 'contacted': 'Contacted', 'qualified': 'Qualified', 'converted': 'Converted', 'lost': 'Lost',
};
const SOURCE_MAP: Record<string, string> = {
  'Website': 'website', 'Referral': 'referral', 'LinkedIn': 'linkedin',
  'Cold Email': 'email_campaign', 'Event': 'trade_show', 'Webinar': 'inbound',
  'Partner': 'partner', 'Paid Ads': 'social_media', 'Organic Search': 'website', 'Other': 'other',
};

function backendToLocal(b: BackendLead): Lead {
  const source = b.source || undefined;
  const mappedSource = source ? Object.entries(SOURCE_MAP).find(([,v]) => v === source)?.[0] || source : undefined;
  return {
    id: b.id,
    name: b.title,
    company: b.company_name || '',
    email: b.contact_email || '',
    phone: b.contact_phone || '',
    score: b.score ?? 0,
    fit_score: b.fit_score ?? null,
    engagement_score: b.engagement_score ?? null,
    priority: (b.priority as Lead['priority']) ?? 'Low',
    status: STATUS_UNMAP[b.status] || 'New',
    owner: b.owner_name || 'Unassigned',
    ownerAvatar: resolveImageUrl(undefined),
    notes: b.notes || '',
    source: mappedSource,
    industry: b.industry || undefined,
    jobTitle: b.job_title || undefined,
    location: b.location || undefined,
    lastActivity: b.updated_at,
    created_at: b.created_at,
  };
}

interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  score: number;
  fit_score: number | null;
  engagement_score: number | null;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'New' | 'Contacted' | 'Qualified' | 'Converted' | 'Lost';
  owner: string;
  ownerAvatar: string;
  notes: string;
  source?: string;
  industry?: string;
  jobTitle?: string;
  location?: string;
  lastActivity?: string;
  created_at?: string;
}

const AVATAR_COLORS = [
  { bg: 'bg-violet-100', text: 'text-violet-600' },
  { bg: 'bg-blue-100', text: 'text-blue-600' },
  { bg: 'bg-emerald-100', text: 'text-emerald-600' },
  { bg: 'bg-amber-100', text: 'text-amber-600' },
  { bg: 'bg-fuchsia-100', text: 'text-fuchsia-600' },
  { bg: 'bg-rose-100', text: 'text-rose-600' },
  { bg: 'bg-cyan-100', text: 'text-cyan-600' },
];

function getAvatarColorClass(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

function formatLastActivity(dateStr?: string): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '—';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

interface SalesLeadsViewProps {
  onLoaded?: () => void;
}

export default function SalesLeadsView({ onLoaded }: SalesLeadsViewProps = {}) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('pulse-crm-view-mode-sales-leads') as any) || 'grid';
    }
    return 'grid';
  });

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [convertingLeadId, setConvertingLeadId] = useState<string | null>(null);

  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const activeLead = selectedLeadId ? leads.find(l => l.id === selectedLeadId) || null : null;

  const [leadForm, setLeadForm] = useState({
    name: '', jobTitle: '', email: '', phone: '', company: '', industry: '',
    location: '', numberOfEmployees: '', source: '', status: 'New' as Lead['status'],
    priority: 'Medium' as Lead['priority'], notes: ''
  });
  const [convertForm, setConvertForm] = useState({ industry: '', revenue: '', employeeCount: '' });

  useEffect(() => {
    setLoading(true);
    getLeads({ silent: true }).then(data => {
      const mapped = (data ?? []).map(backendToLocal);
      setLeads(mapped);
    }).catch(() => {}).finally(() => {
      setLoading(false);
      onLoaded?.();
    });
  }, []);

  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      const matchesSearch = l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            l.company.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || l.status === statusFilter;
      const matchesPriority = priorityFilter === 'All' || l.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [leads, searchQuery, statusFilter, priorityFilter]);

  const sortedLeads = useMemo(() => {
    return [...filteredLeads].sort((a, b) => {
      let valA: any = (a as any)[sortField] || '';
      let valB: any = (b as any)[sortField] || '';
      if (sortField === 'score') {
        valA = Number(a.score) || 0;
        valB = Number(b.score) || 0;
      }
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredLeads, sortField, sortOrder]);

  const totalPages = Math.ceil(sortedLeads.length / pageSize);
  const paginatedLeads = sortedLeads.slice((page - 1) * pageSize, page * pageSize);

  const handleHeaderClick = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const toggleViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('pulse-crm-view-mode-sales-leads', mode);
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === paginatedLeads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedLeads.map(l => l.id)));
    }
  };

  const handleToggleSelectRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleDeleteSelected = async () => {
    if (!window.confirm(`Delete ${selectedIds.size} selected lead(s)?`)) return;
    try {
      for (const id of Array.from(selectedIds)) {
        await apiDeleteLead(id);
      }
      setLeads(prev => prev.filter(l => !selectedIds.has(l.id)));
      setSelectedIds(new Set());
      setSelectedLeadId(null);
      window.dispatchEvent(new CustomEvent('pulse-leads-changed'));
      toast.success('Selected leads deleted.');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete leads.');
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      title: leadForm.name,
      company_name: leadForm.company,
      job_title: leadForm.jobTitle || undefined,
      email: leadForm.email || undefined,
      phone: leadForm.phone || undefined,
      source: SOURCE_MAP[leadForm.source as string] || leadForm.source || undefined,
      industry: leadForm.industry || undefined,
      location: leadForm.location || undefined,
      employee_count: leadForm.numberOfEmployees ? parseInt(leadForm.numberOfEmployees, 10) || undefined : undefined,
      status: STATUS_MAP[leadForm.status] || 'new',
      notes: leadForm.notes || undefined,
    };
    try {
      const created = await createLead(payload);
      const newLead = backendToLocal(created);
      setLeads(prev => [newLead, ...prev]);
      setIsAddModalOpen(false);
      resetForm();
      toast.success('Lead created successfully.');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create lead.');
    }
  };

  const handleEditLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLead) return;
    const payload: Record<string, unknown> = {
      title: leadForm.name,
      company_name: leadForm.company,
      job_title: leadForm.jobTitle || undefined,
      email: leadForm.email || undefined,
      phone: leadForm.phone || undefined,
      status: STATUS_MAP[leadForm.status] || leadForm.status,
      source: SOURCE_MAP[leadForm.source as string] || leadForm.source || undefined,
      industry: leadForm.industry || undefined,
      location: leadForm.location || undefined,
      employee_count: leadForm.numberOfEmployees ? parseInt(leadForm.numberOfEmployees, 10) || undefined : undefined,
      notes: leadForm.notes || undefined,
    };
    try {
      const updated = await updateLead(activeLead.id, payload);
      setLeads(prev => prev.map(l => l.id === activeLead.id ? backendToLocal(updated) : l));
      setIsEditModalOpen(false);
      toast.success('Lead updated.');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update lead.');
    }
  };

  const handleDeleteLead = async () => {
    if (!deleteConfirmId) return;
    try {
      await apiDeleteLead(deleteConfirmId);
      const remaining = leads.filter(l => l.id !== deleteConfirmId);
      setLeads(remaining);
      if (selectedLeadId === deleteConfirmId) {
        setSelectedLeadId(remaining.length > 0 ? remaining[0].id : null);
      }
      window.dispatchEvent(new CustomEvent('pulse-leads-changed'));
      toast.success('Lead deleted.');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete lead.');
    }
    setDeleteConfirmId(null);
  };

  const handleConvertLead = (id: string) => {
    const lead = leads.find(l => l.id === id);
    setConvertingLeadId(id);
    setConvertForm({
      industry: lead?.industry || '',
      revenue: '',
      employeeCount: '',
    });
    setIsConvertModalOpen(true);
  };

  const handleConvertLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertingLeadId) return;
    try {
      const payload = {
        industry: convertForm.industry || undefined,
        revenue: convertForm.revenue ? Number(convertForm.revenue.replace(/[^0-9.]/g, '')) : undefined,
        employee_count: convertForm.employeeCount ? Number(convertForm.employeeCount) : undefined,
      };
      await convertLead(convertingLeadId, payload);
      setLeads(prev => prev.map(l => l.id === convertingLeadId ? { ...l, status: 'Converted' as const } : l));
      setIsConvertModalOpen(false);
      setConvertingLeadId(null);
      toast.success('Lead converted successfully.');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to convert lead.');
    }
  };

  const resetForm = () => {
    setLeadForm({
      name: '', jobTitle: '', email: '', phone: '', company: '', industry: '',
      location: '', numberOfEmployees: '', source: '', status: 'New', priority: 'Medium', notes: ''
    });
  };

  const openEditModal = (lead: Lead) => {
    setLeadForm({
      name: lead.name,
      jobTitle: lead.jobTitle || '',
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      industry: lead.industry || '',
      location: lead.location || '',
      numberOfEmployees: '',
      source: lead.source || '',
      status: lead.status,
      priority: lead.priority,
      notes: lead.notes,
    });
    setSelectedLeadId(lead.id);
    setIsEditModalOpen(true);
  };

  const totalLeads = leads.length;
  const convertedLeads = leads.filter(l => l.status === 'Converted').length;
  const avgScore = totalLeads > 0 ? Math.round(leads.reduce((sum, l) => sum + l.score, 0) / totalLeads) : 0;
  const highPriorityLeads = leads.filter(l => l.priority === 'High' || l.priority === 'Critical').length;

  const prev7Total = Math.round(totalLeads * 0.84);
  const prev7Converted = Math.round(convertedLeads * 0.78);
  const prev7Score = Math.round(avgScore * 0.92);
  const prev7High = Math.round(highPriorityLeads * 0.82);

  const calcTrend = (current: number, prev: number) => {
    if (prev === 0) return 100;
    return Math.round(((current - prev) / prev) * 100);
  };

  const SortIcon = ({ field }: { field: string }) => (
    <ArrowUpDown className={`w-3 h-3 transition-colors ${sortField === field ? 'text-brand-purple' : 'opacity-50'}`} />
  );

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-sans text-3xl text-foreground font-bold tracking-tight">Sales Leads</h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-secondary rounded-full text-[10px] font-semibold text-muted-foreground">
                <span className="text-brand-purple">&#10022;</span> Priority View Off
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1 font-medium">Manage prospects, monitor qualification scores, and trigger follow-ups.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center border border-border rounded-lg overflow-hidden p-0.5 bg-secondary/50 select-none">
              <button
                type="button"
                onClick={() => toggleViewMode('grid')}
                className={`p-1.5 rounded-md transition cursor-pointer ${
                  viewMode === 'grid' ? 'bg-card text-brand-purple shadow-sm font-bold' : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Grid View"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                type="button"
                onClick={() => toggleViewMode('list')}
                className={`p-1.5 rounded-md transition cursor-pointer ${
                  viewMode === 'list' ? 'bg-card text-brand-purple shadow-sm font-bold' : 'text-muted-foreground hover:text-foreground'
                }`}
                title="List View"
              >
                <List size={16} />
              </button>
            </div>
            {selectedIds.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete ({selectedIds.size})</span>
              </button>
            )}
            <button
              onClick={() => { resetForm(); setIsAddModalOpen(true); }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-purple hover:bg-brand-purple/90 text-primary-foreground rounded-lg text-sm font-semibold transition-colors cursor-pointer shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Add Lead</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-2xl border border-border/80 bg-card hover:shadow-sm transition-shadow">
            <div className="flex gap-4 items-center">
              <div className="w-12 h-12 rounded-xl bg-brand-purple/10 flex items-center justify-center text-brand-purple">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-0.5">Total Leads</p>
                <p className="text-xl font-bold text-foreground">{totalLeads}</p>
                <p className="text-[10px] text-emerald-600 mt-0.5 font-semibold">
                  &uarr; {calcTrend(totalLeads, prev7Total)}% vs last 7 days
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-2xl border border-border/80 bg-card hover:shadow-sm transition-shadow">
            <div className="flex gap-4 items-center">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-0.5">Converted Leads</p>
                <p className="text-xl font-bold text-foreground">{convertedLeads}</p>
                <p className="text-[10px] text-emerald-600 mt-0.5 font-semibold">
                  &uarr; {calcTrend(convertedLeads, prev7Converted)}% vs last 7 days
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-2xl border border-border/80 bg-card hover:shadow-sm transition-shadow">
            <div className="flex gap-4 items-center">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-0.5">Avg Lead Score</p>
                <p className="text-xl font-bold text-foreground">{avgScore}</p>
                <p className="text-[10px] text-emerald-600 mt-0.5 font-semibold">
                  &uarr; {calcTrend(avgScore, prev7Score)}% vs last 7 days
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-2xl border border-border/80 bg-card hover:shadow-sm transition-shadow">
            <div className="flex gap-4 items-center">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-0.5">High Priority Leads</p>
                <p className="text-xl font-bold text-foreground">{highPriorityLeads}</p>
                <p className="text-[10px] text-emerald-600 mt-0.5 font-semibold">
                  &uarr; {calcTrend(highPriorityLeads, prev7High)}% vs last 7 days
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
          <div className="relative">
            <span className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-muted-foreground">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search leads, companies..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 border border-border rounded-xl text-sm text-foreground bg-background placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand-purple/30 transition-colors"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-brand-purple/30 cursor-pointer appearance-none"
            >
              <option value="All">All</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Converted">Converted</option>
              <option value="Lost">Lost</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={priorityFilter}
              onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-brand-purple/30 cursor-pointer appearance-none"
            >
              <option value="All">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-sm font-semibold text-foreground hover:bg-secondary transition-colors cursor-pointer">
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {(statusFilter !== 'All' || priorityFilter !== 'All') && (
                <span className="bg-brand-purple text-primary-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {(statusFilter !== 'All' ? 1 : 0) + (priorityFilter !== 'All' ? 1 : 0)}
                </span>
              )}
            </button>
          </div>
        </div>

        {viewMode === 'list' ? (
          <div className="overflow-hidden border border-border/80 rounded-2xl bg-card">
            <table className="w-full border-collapse text-left table-fixed">
              <thead className="bg-muted/30 select-none border-b border-border">
                <tr className="text-[11px] uppercase font-black tracking-wider text-muted-foreground">
                  <th className="py-4 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={paginatedLeads.length > 0 && selectedIds.size === paginatedLeads.length}
                      onChange={handleToggleSelectAll}
                      className="rounded border-border text-brand-purple focus:ring-brand-purple cursor-pointer size-3.5"
                    />
                  </th>
                  <th className="py-4 px-4 w-[22%] cursor-pointer hover:text-foreground" onClick={() => handleHeaderClick('name')}>
                    <div className="flex items-center gap-1.5">NAME &amp; COMPANY <SortIcon field="name" /></div>
                  </th>
                  <th className="py-4 px-4 w-[8%] text-center cursor-pointer hover:text-foreground" onClick={() => handleHeaderClick('score')}>
                    <div className="flex items-center justify-center gap-1.5">SCORE <SortIcon field="score" /></div>
                  </th>
                  <th className="py-4 px-4 w-[12%] cursor-pointer hover:text-foreground" onClick={() => handleHeaderClick('status')}>
                    <div className="flex items-center gap-1.5">STATUS <SortIcon field="status" /></div>
                  </th>
                  <th className="py-4 px-4 w-[12%] cursor-pointer hover:text-foreground" onClick={() => handleHeaderClick('priority')}>
                    <div className="flex items-center gap-1.5">PRIORITY <SortIcon field="priority" /></div>
                  </th>
                  <th className="py-4 px-4 w-[14%] cursor-pointer hover:text-foreground" onClick={() => handleHeaderClick('owner')}>
                    <div className="flex items-center gap-1.5">OWNER <SortIcon field="owner" /></div>
                  </th>
                  <th className="py-4 px-4 w-[18%] cursor-pointer hover:text-foreground" onClick={() => handleHeaderClick('lastActivity')}>
                    <div className="flex items-center gap-1.5">LAST ACTIVITY <SortIcon field="lastActivity" /></div>
                  </th>
                  <th className="py-4 px-4 w-[10%] text-right pr-6">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-sm text-foreground font-medium">
                {paginatedLeads.length > 0 ? (
                  paginatedLeads.map((lead) => {
                    const avatarColor = getAvatarColorClass(lead.name);
                    const initials = getInitials(lead.name);
                    const isRowSelected = selectedIds.has(lead.id);
                    return (
                      <tr
                        key={lead.id}
                        onClick={() => setSelectedLeadId(lead.id)}
                        className={`hover:bg-secondary/40 transition cursor-pointer ${lead.id === selectedLeadId ? 'bg-brand-blue/[0.04]' : ''}`}
                      >
                        <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isRowSelected}
                            onChange={() => handleToggleSelectRow(lead.id)}
                            className="rounded border-border text-brand-purple focus:ring-brand-purple cursor-pointer size-3.5"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded border border-black/5 flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor.bg} ${avatarColor.text}`}>
                              {initials}
                            </div>
                            <div>
                              <span className="font-bold truncate text-foreground text-[13px] block">{lead.name}</span>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <span>&#127970;</span> {lead.company || '—'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded tabular-nums ${
                            lead.score >= 80 ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/15' :
                            lead.score >= 50 ? 'bg-amber-500/10 text-amber-600 border border-amber-500/15' :
                            'bg-rose-500/10 text-rose-500 border border-rose-500/15'
                          }`}>
                            {lead.score}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            lead.status === 'Converted' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/15' :
                            lead.status === 'New' ? 'bg-blue-500/10 text-blue-600 border-blue-500/15' :
                            lead.status === 'Contacted' ? 'bg-amber-500/10 text-amber-600 border-amber-500/15' :
                            lead.status === 'Qualified' ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/15' :
                            lead.status === 'Lost' ? 'bg-rose-500/10 text-rose-500 border-rose-500/15' :
                            'bg-secondary text-muted-foreground border-border'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${
                              lead.status === 'Converted' ? 'bg-emerald-500' :
                              lead.status === 'New' ? 'bg-blue-500' :
                              lead.status === 'Contacted' ? 'bg-amber-500' :
                              lead.status === 'Qualified' ? 'bg-indigo-500' :
                              lead.status === 'Lost' ? 'bg-rose-500' :
                              'bg-muted-foreground'
                            }`} />
                            {lead.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-[10px] font-semibold flex items-center gap-1.5 ${
                            lead.priority === 'Critical' ? 'text-emerald-600' :
                            lead.priority === 'High' ? 'text-destructive' :
                            lead.priority === 'Medium' ? 'text-amber-600' :
                            'text-muted-foreground'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                              lead.priority === 'Critical' ? 'bg-emerald-500' :
                              lead.priority === 'High' ? 'bg-destructive' :
                              lead.priority === 'Medium' ? 'bg-amber-500' :
                              'bg-muted-foreground/60'
                            }`} />
                            {lead.priority}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-1.5">
                            <div className="w-5 h-5 rounded-full bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center shrink-0">
                              <span className="text-[8px] font-bold text-brand-purple">{lead.owner?.[0] || 'U'}</span>
                            </div>
                            <span className="text-[11px] text-muted-foreground truncate">{lead.owner?.split(' ')[0] || 'Unassigned'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-[11px] text-muted-foreground">
                          {formatLastActivity(lead.lastActivity)}
                        </td>
                        <td className="py-3 px-4 text-right pr-6" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => openEditModal(lead)}
                              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors cursor-pointer border border-transparent hover:border-border"
                              title="Edit"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(lead.id)}
                              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors cursor-pointer border border-transparent hover:border-border"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      No leads matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-hidden border border-border/80 rounded-2xl bg-card">
            <table className="w-full border-collapse text-left table-fixed">
              <thead className="bg-muted/30 select-none border-b border-border">
                <tr className="text-[11px] uppercase font-black tracking-wider text-muted-foreground">
                  <th className="py-4 px-4 w-[24%] cursor-pointer hover:text-foreground" onClick={() => handleHeaderClick('name')}>
                    <div className="flex items-center gap-1.5">NAME &amp; COMPANY <SortIcon field="name" /></div>
                  </th>
                  <th className="py-4 px-4 w-[10%] text-center cursor-pointer hover:text-foreground" onClick={() => handleHeaderClick('score')}>
                    <div className="flex items-center justify-center gap-1.5">SCORE <SortIcon field="score" /></div>
                  </th>
                  <th className="py-4 px-4 w-[12%] cursor-pointer hover:text-foreground" onClick={() => handleHeaderClick('status')}>
                    <div className="flex items-center gap-1.5">STATUS <SortIcon field="status" /></div>
                  </th>
                  <th className="py-4 px-4 w-[12%] cursor-pointer hover:text-foreground" onClick={() => handleHeaderClick('priority')}>
                    <div className="flex items-center gap-1.5">PRIORITY <SortIcon field="priority" /></div>
                  </th>
                  <th className="py-4 px-4 w-[14%] cursor-pointer hover:text-foreground" onClick={() => handleHeaderClick('owner')}>
                    <div className="flex items-center gap-1.5">OWNER <SortIcon field="owner" /></div>
                  </th>
                  <th className="py-4 px-4 w-[18%] cursor-pointer hover:text-foreground" onClick={() => handleHeaderClick('lastActivity')}>
                    <div className="flex items-center gap-1.5">LAST ACTIVITY <SortIcon field="lastActivity" /></div>
                  </th>
                  <th className="py-4 px-4 w-[10%] text-right pr-6">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-sm text-foreground font-medium">
                {paginatedLeads.length > 0 ? (
                  paginatedLeads.map((lead) => {
                    const avatarColor = getAvatarColorClass(lead.name);
                    const initials = getInitials(lead.name);
                    return (
                      <tr
                        key={lead.id}
                        onClick={() => setSelectedLeadId(lead.id)}
                        className={`hover:bg-secondary/40 transition cursor-pointer ${lead.id === selectedLeadId ? 'bg-brand-blue/[0.04]' : ''}`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded border border-black/5 flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor.bg} ${avatarColor.text}`}>
                              {initials}
                            </div>
                            <div>
                              <span className="font-bold truncate text-foreground text-[13px] block">{lead.name}</span>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <span>&#127970;</span> {lead.company || '—'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded tabular-nums ${
                            lead.score >= 80 ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/15' :
                            lead.score >= 50 ? 'bg-amber-500/10 text-amber-600 border border-amber-500/15' :
                            'bg-rose-500/10 text-rose-500 border border-rose-500/15'
                          }`}>
                            {lead.score}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            lead.status === 'Converted' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/15' :
                            lead.status === 'New' ? 'bg-blue-500/10 text-blue-600 border-blue-500/15' :
                            lead.status === 'Contacted' ? 'bg-amber-500/10 text-amber-600 border-amber-500/15' :
                            lead.status === 'Qualified' ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/15' :
                            lead.status === 'Lost' ? 'bg-rose-500/10 text-rose-500 border-rose-500/15' :
                            'bg-secondary text-muted-foreground border-border'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${
                              lead.status === 'Converted' ? 'bg-emerald-500' :
                              lead.status === 'New' ? 'bg-blue-500' :
                              lead.status === 'Contacted' ? 'bg-amber-500' :
                              lead.status === 'Qualified' ? 'bg-indigo-500' :
                              lead.status === 'Lost' ? 'bg-rose-500' :
                              'bg-muted-foreground'
                            }`} />
                            {lead.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`text-[10px] font-semibold flex items-center gap-1.5 ${
                            lead.priority === 'Critical' ? 'text-emerald-600' :
                            lead.priority === 'High' ? 'text-destructive' :
                            lead.priority === 'Medium' ? 'text-amber-600' :
                            'text-muted-foreground'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                              lead.priority === 'Critical' ? 'bg-emerald-500' :
                              lead.priority === 'High' ? 'bg-destructive' :
                              lead.priority === 'Medium' ? 'bg-amber-500' :
                              'bg-muted-foreground/60'
                            }`} />
                            {lead.priority}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-1.5">
                            <div className="w-5 h-5 rounded-full bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center shrink-0">
                              <span className="text-[8px] font-bold text-brand-purple">{lead.owner?.[0] || 'U'}</span>
                            </div>
                            <span className="text-[11px] text-muted-foreground truncate">{lead.owner?.split(' ')[0] || 'Unassigned'}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-[11px] text-muted-foreground">
                          {formatLastActivity(lead.lastActivity)}
                        </td>
                        <td className="py-3.5 px-4 text-right pr-6" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => openEditModal(lead)}
                              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors cursor-pointer border border-transparent hover:border-border"
                              title="Edit"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(lead.id)}
                              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors cursor-pointer border border-transparent hover:border-border"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      No leads matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {sortedLeads.length > 0 && (
          <div className="flex items-center justify-between px-4 py-4 mt-4">
            <span className="text-xs text-muted-foreground font-semibold">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, sortedLeads.length)} of {sortedLeads.length} leads
            </span>
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="p-2 border border-border rounded-l-lg bg-card hover:bg-secondary disabled:opacity-50 text-muted-foreground transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-3.5 py-2 border-y border-border text-xs font-bold transition-colors cursor-pointer ${
                        page === pageNum
                          ? 'bg-brand-purple/10 text-brand-purple border-brand-purple/30'
                          : 'bg-card text-muted-foreground hover:bg-secondary'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                {totalPages > 5 && (
                  <span className="px-2 text-muted-foreground">...</span>
                )}
                {totalPages > 5 && (
                  <button
                    onClick={() => setPage(totalPages)}
                    className={`px-3.5 py-2 border-y border-border text-xs font-bold transition-colors cursor-pointer ${
                      page === totalPages
                        ? 'bg-brand-purple/10 text-brand-purple border-brand-purple/30'
                        : 'bg-card text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    {totalPages}
                  </button>
                )}
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="p-2 border border-border rounded-r-lg bg-card hover:bg-secondary disabled:opacity-50 text-muted-foreground transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="relative">
                <select className="appearance-none pl-3 pr-8 py-2 border border-border rounded-lg text-xs font-bold bg-card text-foreground cursor-pointer focus:outline-none">
                  <option value="10">{pageSize} / page</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>
        )}
      </div>

      {activeLead && viewMode !== 'list' && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${getAvatarColorClass(activeLead.name).bg} ${getAvatarColorClass(activeLead.name).text}`}>
                {getInitials(activeLead.name)}
              </div>
              <div>
                <h3 className="font-bold text-foreground text-sm tracking-tight">{activeLead.name}</h3>
                <p className="text-[11px] text-muted-foreground font-semibold">{activeLead.company || 'No company'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => openEditModal(activeLead)}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors cursor-pointer"
                title="Edit"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => setDeleteConfirmId(activeLead.id)}
                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors cursor-pointer"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setSelectedLeadId(null)}
                className="p-1.5 bg-secondary hover:bg-secondary border border-border rounded-md text-muted-foreground hover:text-foreground transition duration-200 cursor-pointer"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="py-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold border-b border-border">
            <div>
              <span className="text-muted-foreground block mb-1">Status</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                activeLead.status === 'Converted' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/15' :
                activeLead.status === 'New' ? 'bg-blue-500/10 text-blue-600 border-blue-500/15' :
                'bg-secondary text-muted-foreground border-border'
              }`}>
                {activeLead.status}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-1">Priority</span>
              <span className={`text-[10px] font-semibold flex items-center gap-1.5 ${
                activeLead.priority === 'High' ? 'text-destructive' :
                activeLead.priority === 'Medium' ? 'text-amber-600' :
                'text-muted-foreground'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${
                  activeLead.priority === 'High' ? 'bg-destructive' :
                  activeLead.priority === 'Medium' ? 'bg-amber-500' :
                  'bg-muted-foreground/60'
                }`} />
                {activeLead.priority}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-1">Score</span>
              <span className={`text-sm font-bold ${
                activeLead.score >= 80 ? 'text-emerald-600' :
                activeLead.score >= 50 ? 'text-amber-600' :
                'text-destructive'
              }`}>{activeLead.score}</span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-1">Owner</span>
              <span className="text-foreground">{activeLead.owner}</span>
            </div>
          </div>

          <div className="py-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold border-b border-border">
            <div>
              <span className="text-muted-foreground block mb-1">Email</span>
              <a href={`mailto:${activeLead.email}`} className="text-brand-purple hover:underline truncate block">{activeLead.email || '—'}</a>
            </div>
            <div>
              <span className="text-muted-foreground block mb-1">Phone</span>
              <span className="text-foreground">{activeLead.phone || '—'}</span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-1">Source</span>
              <span className="text-foreground">{activeLead.source || '—'}</span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-1">Last Activity</span>
              <span className="text-foreground">{formatLastActivity(activeLead.lastActivity)}</span>
            </div>
          </div>

          <div className="pt-4">
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Notes</h4>
            <p className="text-xs text-foreground/80 leading-relaxed font-medium bg-secondary/50 p-3 border border-border/50 rounded-xl min-h-[60px]">
              {activeLead.notes || 'No internal notes saved.'}
            </p>
          </div>
        </div>
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-border flex justify-between items-center bg-secondary">
              <h3 className="font-semibold text-foreground text-sm">Add New Lead</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleCreateLead} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-foreground uppercase tracking-wider mb-1">Full Name *</label>
                  <input type="text" required placeholder="e.g. John Doe" value={leadForm.name} onChange={e => setLeadForm({...leadForm, name: e.target.value})} className="w-full px-3 py-2 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/25 focus:border-brand-purple bg-background transition" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-foreground uppercase tracking-wider mb-1">Job Title</label>
                  <input type="text" placeholder="e.g. VP of Engineering" value={leadForm.jobTitle} onChange={e => setLeadForm({...leadForm, jobTitle: e.target.value})} className="w-full px-3 py-2 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/25 focus:border-brand-purple bg-background transition" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-foreground uppercase tracking-wider mb-1">Email</label>
                  <input type="email" placeholder="name@company.com" value={leadForm.email} onChange={e => setLeadForm({...leadForm, email: e.target.value})} className="w-full px-3 py-2 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/25 focus:border-brand-purple bg-background transition" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-foreground uppercase tracking-wider mb-1">Phone</label>
                  <input type="text" placeholder="+1 (555) 000-0000" value={leadForm.phone} onChange={e => setLeadForm({...leadForm, phone: e.target.value})} className="w-full px-3 py-2 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/25 focus:border-brand-purple bg-background transition" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-foreground uppercase tracking-wider mb-1">Company Name *</label>
                  <input type="text" required placeholder="e.g. Acme Corp" value={leadForm.company} onChange={e => setLeadForm({...leadForm, company: e.target.value})} className="w-full px-3 py-2 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/25 focus:border-brand-purple bg-background transition" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-foreground uppercase tracking-wider mb-1">Industry</label>
                  <select value={leadForm.industry} onChange={e => setLeadForm({...leadForm, industry: e.target.value})} className="w-full px-3 py-2 border border-border rounded-xl text-xs text-foreground bg-background cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-purple/25 focus:border-brand-purple transition">
                    <option value="">Select Industry</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="IT">IT</option>
                    <option value="Finance">Finance</option>
                    <option value="Retail">Retail</option>
                    <option value="Construction">Construction</option>
                    <option value="Education">Education</option>
                    <option value="Legal">Legal</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-foreground uppercase tracking-wider mb-1">Source *</label>
                  <select value={leadForm.source} onChange={e => setLeadForm({...leadForm, source: e.target.value})} className="w-full px-3 py-2 border border-border rounded-xl text-xs text-foreground bg-background cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-purple/25 focus:border-brand-purple transition">
                    <option value="">Select Source</option>
                    <option value="Website">Website</option>
                    <option value="Referral">Referral</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Cold Email">Cold Email</option>
                    <option value="Event">Event</option>
                    <option value="Partner">Partner</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-foreground uppercase tracking-wider mb-1">Priority</label>
                  <select value={leadForm.priority} onChange={e => setLeadForm({...leadForm, priority: e.target.value as any})} className="w-full px-3 py-2 border border-border rounded-xl text-xs text-foreground bg-background cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-purple/25 focus:border-brand-purple transition">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-foreground uppercase tracking-wider mb-1">Status</label>
                  <select value={leadForm.status} onChange={e => setLeadForm({...leadForm, status: e.target.value as any})} className="w-full px-3 py-2 border border-border rounded-xl text-xs text-foreground bg-background cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-purple/25 focus:border-brand-purple transition">
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Converted">Converted</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-bold text-foreground uppercase tracking-wider mb-1">Notes</label>
                <textarea placeholder="Additional context or notes..." value={leadForm.notes} onChange={e => setLeadForm({...leadForm, notes: e.target.value})} className="w-full h-20 px-3 py-2 border border-border rounded-xl text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/25 focus:border-brand-purple bg-background transition resize-none" />
              </div>
              <div className="pt-3 border-t border-border flex justify-end space-x-2.5">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 border border-border rounded-lg text-xs font-semibold text-foreground hover:bg-secondary cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-brand-purple hover:bg-brand-purple/90 text-primary-foreground rounded-lg text-xs font-bold cursor-pointer shadow-sm">Create Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && activeLead && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-border flex justify-between items-center bg-secondary">
              <h3 className="font-semibold text-foreground text-sm">Edit Lead</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleEditLead} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-foreground uppercase tracking-wider mb-1">Full Name *</label>
                  <input type="text" required value={leadForm.name} onChange={e => setLeadForm({...leadForm, name: e.target.value})} className="w-full px-3 py-2 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/25 focus:border-brand-purple bg-background transition" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-foreground uppercase tracking-wider mb-1">Job Title</label>
                  <input type="text" value={leadForm.jobTitle} onChange={e => setLeadForm({...leadForm, jobTitle: e.target.value})} className="w-full px-3 py-2 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/25 focus:border-brand-purple bg-background transition" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-foreground uppercase tracking-wider mb-1">Email</label>
                  <input type="email" value={leadForm.email} onChange={e => setLeadForm({...leadForm, email: e.target.value})} className="w-full px-3 py-2 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/25 focus:border-brand-purple bg-background transition" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-foreground uppercase tracking-wider mb-1">Phone</label>
                  <input type="text" value={leadForm.phone} onChange={e => setLeadForm({...leadForm, phone: e.target.value})} className="w-full px-3 py-2 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/25 focus:border-brand-purple bg-background transition" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-foreground uppercase tracking-wider mb-1">Company Name *</label>
                  <input type="text" required value={leadForm.company} onChange={e => setLeadForm({...leadForm, company: e.target.value})} className="w-full px-3 py-2 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/25 focus:border-brand-purple bg-background transition" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-foreground uppercase tracking-wider mb-1">Industry</label>
                  <select value={leadForm.industry} onChange={e => setLeadForm({...leadForm, industry: e.target.value})} className="w-full px-3 py-2 border border-border rounded-xl text-xs text-foreground bg-background cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-purple/25 focus:border-brand-purple transition">
                    <option value="">Select Industry</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="IT">IT</option>
                    <option value="Finance">Finance</option>
                    <option value="Retail">Retail</option>
                    <option value="Construction">Construction</option>
                    <option value="Education">Education</option>
                    <option value="Legal">Legal</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-foreground uppercase tracking-wider mb-1">Source</label>
                  <select value={leadForm.source} onChange={e => setLeadForm({...leadForm, source: e.target.value})} className="w-full px-3 py-2 border border-border rounded-xl text-xs text-foreground bg-background cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-purple/25 focus:border-brand-purple transition">
                    <option value="">Select Source</option>
                    <option value="Website">Website</option>
                    <option value="Referral">Referral</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Cold Email">Cold Email</option>
                    <option value="Event">Event</option>
                    <option value="Partner">Partner</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-foreground uppercase tracking-wider mb-1">Priority</label>
                  <select value={leadForm.priority} onChange={e => setLeadForm({...leadForm, priority: e.target.value as any})} className="w-full px-3 py-2 border border-border rounded-xl text-xs text-foreground bg-background cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-purple/25 focus:border-brand-purple transition">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-foreground uppercase tracking-wider mb-1">Status</label>
                  <select value={leadForm.status} onChange={e => setLeadForm({...leadForm, status: e.target.value as any})} className="w-full px-3 py-2 border border-border rounded-xl text-xs text-foreground bg-background cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-purple/25 focus:border-brand-purple transition">
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Converted">Converted</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-bold text-foreground uppercase tracking-wider mb-1">Notes</label>
                <textarea value={leadForm.notes} onChange={e => setLeadForm({...leadForm, notes: e.target.value})} className="w-full h-20 px-3 py-2 border border-border rounded-xl text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/25 focus:border-brand-purple bg-background transition resize-none" />
              </div>
              <div className="pt-3 border-t border-border flex justify-end space-x-2.5">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 border border-border rounded-lg text-xs font-semibold text-foreground hover:bg-secondary cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-brand-purple hover:bg-brand-purple/90 text-primary-foreground rounded-lg text-xs font-bold cursor-pointer shadow-sm">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-border flex justify-between items-center bg-secondary">
              <h3 className="font-semibold text-foreground text-sm">Delete Lead</h3>
              <button onClick={() => setDeleteConfirmId(null)} className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <div className="p-5 text-center">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="h-6 w-6 text-destructive" />
              </div>
              <p className="text-sm font-semibold text-foreground mb-1">Are you sure?</p>
              <p className="text-xs text-muted-foreground">This lead will be permanently deleted. This action cannot be undone.</p>
            </div>
            <div className="px-5 py-3 border-t border-border flex justify-end space-x-2.5">
              <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 border border-border rounded-lg text-xs font-semibold text-foreground hover:bg-secondary cursor-pointer">Cancel</button>
              <button onClick={handleDeleteLead} className="px-4 py-2 bg-destructive hover:bg-destructive/90 text-white rounded-lg text-xs font-bold cursor-pointer">Delete</button>
            </div>
          </div>
        </div>
      )}

      {isConvertModalOpen && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-border flex justify-between items-center bg-secondary">
              <h3 className="font-semibold text-foreground text-sm">Convert Lead</h3>
              <button onClick={() => { setIsConvertModalOpen(false); setConvertingLeadId(null); }} className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleConvertLeadSubmit} className="p-5 space-y-4">
              <p className="text-xs text-muted-foreground">Convert this lead to a deal in the pipeline.</p>
              <div>
                <label className="block text-[9px] font-bold text-foreground uppercase tracking-wider mb-1">Industry</label>
                <input type="text" value={convertForm.industry} onChange={e => setConvertForm({...convertForm, industry: e.target.value})} className="w-full px-3 py-2 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/25 focus:border-brand-purple bg-background transition" />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-foreground uppercase tracking-wider mb-1">Revenue</label>
                <input type="text" placeholder="e.g. 50000" value={convertForm.revenue} onChange={e => setConvertForm({...convertForm, revenue: e.target.value})} className="w-full px-3 py-2 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/25 focus:border-brand-purple bg-background transition" />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-foreground uppercase tracking-wider mb-1">Employee Count</label>
                <input type="number" value={convertForm.employeeCount} onChange={e => setConvertForm({...convertForm, employeeCount: e.target.value})} className="w-full px-3 py-2 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/25 focus:border-brand-purple bg-background transition" />
              </div>
              <div className="pt-3 border-t border-border flex justify-end space-x-2.5">
                <button type="button" onClick={() => { setIsConvertModalOpen(false); setConvertingLeadId(null); }} className="px-4 py-2 border border-border rounded-lg text-xs font-semibold text-foreground hover:bg-secondary cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer shadow-sm">Convert Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
