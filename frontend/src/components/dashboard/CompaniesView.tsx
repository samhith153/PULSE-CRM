'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { getCompanies, updateCompany, deleteCompany } from '@/utils/api';
import { toast } from '@/lib/toast';
import { 
  Building2, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  UserPlus, 
  Users, 
  Paperclip, 
  PlusCircle,
  X,
  LayoutGrid,
  List,
  SlidersHorizontal,
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
  Briefcase,
  Handshake,
  Receipt
} from 'lucide-react';

const formatCompanyRevenue = (val: string | number) => {
  if (!val) return '—';
  const cleanStr = String(val).replace(/[^0-9.-]/g, '');
  if (!cleanStr) return String(val);
  const num = Math.round(Number(cleanStr));
  if (isNaN(num)) return String(val);
  return `₹${num.toLocaleString('en-IN')}`;
};

const parseRevenue = (val: string | number) => {
  if (!val) return 0;
  const cleanStr = String(val).replace(/[^0-9.-]/g, '');
  return Number(cleanStr) || 0;
};

// Avatar colors based on name hash
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
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

const INDUSTRY_COLORS: Record<string, string> = {
  'Retail': 'violet-600',
  'Media': 'blue-600',
  'IT': 'emerald-600',
  'IT Services': 'amber-600',
  'Construction': 'emerald-600',
  'Agriculture': 'blue-600',
  'Manufacturing': 'violet-600',
  'Legal': 'cyan-600',
};

function getIndustryColor(industry: string) {
  return INDUSTRY_COLORS[industry] || 'slate-500';
}

interface Company {
  id: number;
  name: string;
  industry: string;
  revenue: string;
  employees: number;
  contacts: string[];
  openDeals: number;
  owner: string;
  ownerAvatar: string | null;
  notes: string;
  timeline: { id: number; title: string; time: string }[];
  emails: { id: number; subject: string; time: string }[];
  files: { id: number; name: string; size: string }[];
}

export default function CompaniesView({ onLoaded }: { onLoaded?: () => void } = {}) {
  const [companies, setCompanies] = useState<Company[]>([]);

  const [selectedId, setSelectedId] = useState<number | string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);

  const [viewMode, setViewMode] = useState<'default' | 'list'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('pulse-crm-view-mode-companies') as any) || 'list';
    }
    return 'list';
  });

  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [sortField, setSortField] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterIndustry, setFilterIndustry] = useState<string>('');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const toggleViewMode = (mode: 'default' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('pulse-crm-view-mode-companies', mode);
  };

  const handleToggleSelectAll = (items: any[]) => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map(item => item.id)));
    }
  };

  const handleToggleSelectRow = (id: string | number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleHeaderClick = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleDeleteSelectedCompanies = async () => {
    if (!window.confirm(`Are you sure you want to delete the ${selectedIds.size} selected company/companies?`)) return;
    try {
      for (const id of Array.from(selectedIds)) {
        await deleteCompany(id);
      }
      setCompanies(prev => prev.filter(c => !selectedIds.has(c.id)));
      setSelectedIds(new Set());
      setSelectedId(null);
      toast.success("Selected companies deleted successfully.");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to delete selected companies.");
    }
  };

  const [form, setForm] = useState({
    name: '', industry: '', revenue: '', employees: 10, owner: 'Sarah Johnson', notes: ''
  });
  const [contactName, setContactName] = useState('');

  useEffect(() => {
    getCompanies().then(data => {
      setCompanies(data as any);
    });
  }, []);

  useEffect(() => {
    const handleOpen = () => {
      setForm({ name: '', industry: '', revenue: '', employees: 10, owner: 'Sarah Johnson', notes: '' });
      setIsAddModalOpen(true);
    };
    window.addEventListener('pulse-open-create-company-modal', handleOpen);
    return () => window.removeEventListener('pulse-open-create-company-modal', handleOpen);
  }, []);

  const active = selectedId ? companies.find(c => c.id === selectedId) || null : null;

  const filtered = companies.filter(c => 
    (c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.industry.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (filterIndustry === '' || c.industry.toLowerCase() === filterIndustry.toLowerCase())
  );

  const uniqueIndustries = useMemo(() => {
    const set = new Set(companies.map(c => c.industry).filter(Boolean));
    return Array.from(set).sort();
  }, [companies]);

  const sortedCompanies = useMemo(() => {
    return [...filtered].sort((a: any, b: any) => {
      let valA = (a[sortField] || '').toString().toLowerCase();
      let valB = (b[sortField] || '').toString().toLowerCase();
      if (sortField === 'employees' || sortField === 'openDeals') {
        valA = Number(a[sortField]) || 0;
        valB = Number(b[sortField]) || 0;
      }
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortField, sortOrder]);

  const totalPages = Math.ceil(sortedCompanies.length / pageSize);
  const paginatedCompanies = sortedCompanies.slice((page - 1) * pageSize, page * pageSize);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const newComp: Company = {
      id: Date.now(),
      name: form.name,
      industry: form.industry,
      revenue: form.revenue,
      employees: Number(form.employees),
      contacts: [],
      openDeals: 0,
      owner: form.owner,
      ownerAvatar: null,
      notes: form.notes,
      timeline: [{ id: 1, title: "Company Profile Added", time: "Just now" }],
      emails: [],
      files: []
    };
    setCompanies([...companies, newComp]);
    setSelectedId(newComp.id);
    setIsAddModalOpen(false);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!active) return;
    try {
      await updateCompany(active.id, {
        name: form.name,
        industry: form.industry,
        annual_revenue: form.revenue || null,
        employee_count: Number(form.employees),
        notes: form.notes || null,
      });
      setCompanies(companies.map(c => c.id === active.id ? {
        ...c,
        name: form.name,
        industry: form.industry,
        revenue: form.revenue,
        employees: Number(form.employees),
        owner: form.owner,
        notes: form.notes
      } : c));
      setIsEditModalOpen(false);
    } catch {
      toast.error('Failed to save company');
    }
  };

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !active) return;
    setCompanies(companies.map(c => c.id === active.id ? {
      ...c,
      contacts: [...c.contacts, contactName.trim()]
    } : c));
    setContactName('');
    setIsAddContactModalOpen(false);
  };

  // Stats calculation
  const totalCompaniesCount = companies.length;
  const totalRevenue = companies.reduce((sum, c) => sum + parseRevenue(c.revenue), 0);
  const totalEmployeesCount = companies.reduce((sum, c) => sum + (Number(c.employees) || 0), 0);
  const totalOpenDeals = companies.reduce((sum, c) => sum + (Number(c.openDeals) || 0), 0);

  return (
    <div className="grid grid-cols-12 gap-6 items-start">
      {/* Companies List */}
      <div className={`col-span-12 ${active && viewMode !== 'list' ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-5`}>
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-brand-purple/10 flex items-center justify-center text-brand-purple shrink-0">
                <Building2 className="w-7 h-7" />
              </div>
              <div>
                <h2 className="font-sans text-3xl text-foreground font-bold tracking-tight">Companies</h2>
                <p className="text-sm text-muted-foreground mt-1 font-medium">Monitor accounts, track revenue sizes, and view contact chains.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-border rounded-lg overflow-hidden p-0.5 bg-secondary/30 shrink-0 select-none">
                <button
                  type="button"
                  onClick={() => toggleViewMode('default')}
                  className={`p-1.5 rounded-md transition cursor-pointer ${
                    viewMode === 'default'
                      ? 'bg-card text-brand-purple shadow-sm font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Split View"
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => toggleViewMode('list')}
                  className={`p-1.5 rounded-md transition cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-card text-brand-purple shadow-sm font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="List Table View"
                >
                  <List size={16} />
                </button>
              </div>
              {selectedIds.size > 0 && (
                <button 
                  onClick={handleDeleteSelectedCompanies}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete ({selectedIds.size})</span>
                </button>
              )}
              <button 
                onClick={() => {
                  setForm({ name: '', industry: '', revenue: '', employees: 10, owner: 'Sarah Johnson', notes: '' });
                  setIsAddModalOpen(true);
                }}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-brand-purple hover:bg-brand-purple/90 text-primary-foreground rounded-lg text-sm font-semibold transition-colors cursor-pointer shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Add Company</span>
              </button>
            </div>
          </div>

          {/* Search, Sort, and Filters toolbar */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
                <Search className="h-4 w-4" />
              </span>
              <input 
                type="text" 
                placeholder="Search companies..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand-purple/30 bg-background hover:border-border/80 transition-colors shadow-sm"
              />
            </div>
            
            <div className="flex items-center gap-3">
              {/* Sort Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setIsSortDropdownOpen(!isSortDropdownOpen); setIsFilterDropdownOpen(false); }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 border border-border bg-background hover:bg-secondary rounded-xl text-sm font-semibold text-foreground transition-colors cursor-pointer shadow-sm"
                >
                  <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                  <span>Sort</span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isSortDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isSortDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 z-30 bg-card border border-border rounded-xl shadow-lg p-1.5 min-w-[180px]">
                    {[
                      { label: 'Name (A→Z)', field: 'name', order: 'asc' as const },
                      { label: 'Name (Z→A)', field: 'name', order: 'desc' as const },
                      { label: 'Revenue ↑', field: 'revenue', order: 'asc' as const },
                      { label: 'Revenue ↓', field: 'revenue', order: 'desc' as const },
                      { label: 'Employees ↑', field: 'employees', order: 'asc' as const },
                      { label: 'Employees ↓', field: 'employees', order: 'desc' as const },
                      { label: 'Open Deals ↑', field: 'openDeals', order: 'asc' as const },
                      { label: 'Open Deals ↓', field: 'openDeals', order: 'desc' as const },
                    ].map(({ label, field, order }) => (
                      <button
                        key={`${field}-${order}`}
                        onClick={() => { setSortField(field); setSortOrder(order); setIsSortDropdownOpen(false); }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                          sortField === field && sortOrder === order
                            ? 'bg-brand-purple/10 text-brand-purple font-bold'
                            : 'text-foreground hover:bg-secondary'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Filter Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setIsFilterDropdownOpen(!isFilterDropdownOpen); setIsSortDropdownOpen(false); }}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-semibold transition-colors cursor-pointer shadow-sm ${
                    filterIndustry ? 'bg-brand-purple/10 border-brand-purple/30 text-brand-purple' : 'border-border bg-background hover:bg-secondary text-foreground'
                  }`}
                >
                  <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                  <span>{filterIndustry ? `Industry: ${filterIndustry}` : 'Filter'}</span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isFilterDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 z-30 bg-card border border-border rounded-xl shadow-lg p-1.5 min-w-[200px] max-h-60 overflow-y-auto">
                    <button
                      onClick={() => { setFilterIndustry(''); setIsFilterDropdownOpen(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer mb-1 ${
                        filterIndustry === '' ? 'bg-brand-purple/10 text-brand-purple font-bold' : 'text-foreground hover:bg-secondary'
                      }`}
                    >
                      All Industries
                    </button>
                    {uniqueIndustries.map(ind => (
                      <button
                        key={ind}
                        onClick={() => { setFilterIndustry(ind); setIsFilterDropdownOpen(false); }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                          filterIndustry === ind ? 'bg-brand-purple/10 text-brand-purple font-bold' : 'text-foreground hover:bg-secondary'
                        }`}
                      >
                        {ind}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total Companies */}
            <div className="p-4 pt-5 rounded-2xl border border-border/80 bg-card hover:shadow-sm transition-shadow relative overflow-hidden group cursor-pointer flex items-center justify-between">
              <div className="absolute inset-x-6 bottom-0 h-[3px] bg-brand-purple rounded-t-full"></div>
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 rounded-xl bg-brand-purple/10 flex items-center justify-center text-brand-purple shrink-0">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-0.5">Total Companies</p>
                  <p className="text-xl font-bold text-foreground">{totalCompaniesCount}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">Across all industries</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors self-start mt-1 shrink-0" />
            </div>

            {/* Total Revenue */}
            <div className="p-4 pt-5 rounded-2xl border border-border/80 bg-card hover:shadow-sm transition-shadow relative overflow-hidden group cursor-pointer flex items-center justify-between">
              <div className="absolute inset-x-6 bottom-0 h-[3px] bg-emerald-500 rounded-t-full"></div>
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                  <Receipt className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-0.5">Total Revenue</p>
                  <p className="text-xl font-bold text-foreground">₹{totalRevenue.toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">Combined revenue</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors self-start mt-1 shrink-0" />
            </div>

            {/* Total Employees */}
            <div className="p-4 pt-5 rounded-2xl border border-border/80 bg-card hover:shadow-sm transition-shadow relative overflow-hidden group cursor-pointer flex items-center justify-between">
              <div className="absolute inset-x-6 bottom-0 h-[3px] bg-blue-500 rounded-t-full"></div>
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-0.5">Total Employees</p>
                  <p className="text-xl font-bold text-foreground">{totalEmployeesCount.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">Active across companies</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors self-start mt-1 shrink-0" />
            </div>

            {/* Open Deals */}
            <div className="p-4 pt-5 rounded-2xl border border-border/80 bg-card hover:shadow-sm transition-shadow relative overflow-hidden group cursor-pointer flex items-center justify-between">
              <div className="absolute inset-x-6 bottom-0 h-[3px] bg-amber-500 rounded-t-full"></div>
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                  <Handshake className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-0.5">Open Deals</p>
                  <p className="text-xl font-bold text-foreground">{totalOpenDeals}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">In progress</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors self-start mt-1 shrink-0" />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden border border-border/80 rounded-2xl bg-card">
            <table className="w-full border-collapse text-left table-fixed">
              <thead className="bg-muted/30 select-none border-b border-border">
                <tr className="text-[11px] uppercase font-black tracking-wider text-muted-foreground">
                  <th className="py-4 px-4 w-[28%] cursor-pointer hover:text-foreground" onClick={() => handleHeaderClick('name')}>
                    <div className="flex items-center gap-1.5">Company Name <ArrowUpDown className="w-3 h-3 opacity-50" /></div>
                  </th>
                  <th className="py-4 px-4 w-[20%] cursor-pointer hover:text-foreground" onClick={() => handleHeaderClick('industry')}>
                    <div className="flex items-center gap-1.5">Industry <ArrowUpDown className="w-3 h-3 opacity-50" /></div>
                  </th>
                  <th className="py-4 px-4 w-[20%] cursor-pointer hover:text-foreground" onClick={() => handleHeaderClick('revenue')}>
                    <div className="flex items-center gap-1.5">Revenue <ArrowUpDown className="w-3 h-3 opacity-50" /></div>
                  </th>
                  <th className="py-4 px-4 w-[15%] text-center cursor-pointer hover:text-foreground" onClick={() => handleHeaderClick('employees')}>
                    <div className="flex items-center justify-center gap-1.5">Employees <ArrowUpDown className="w-3 h-3 opacity-50" /></div>
                  </th>
                  <th className="py-4 px-4 w-[12%] text-center cursor-pointer hover:text-foreground" onClick={() => handleHeaderClick('openDeals')}>
                    <div className="flex items-center justify-center gap-1.5">Open Deals <ArrowUpDown className="w-3 h-3 opacity-50" /></div>
                  </th>
                  <th className="py-4 px-4 w-[5%] text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-sm text-foreground font-medium">
                {paginatedCompanies.length > 0 ? (
                  paginatedCompanies.map((comp) => {
                    const avatarColor = getAvatarColorClass(comp.name);
                    const initials = getInitials(comp.name);
                    const indColor = getIndustryColor(comp.industry);

                    return (
                      <tr 
                        key={comp.id} 
                        onClick={() => setSelectedId(comp.id)}
                        className={`hover:bg-secondary/40 transition cursor-pointer ${comp.id === selectedId ? 'bg-brand-blue/[0.04]' : ''}`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor.bg} ${avatarColor.text}`}>
                              {initials}
                            </div>
                            <span className="font-bold truncate text-foreground text-[13px]">{comp.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full bg-${indColor}`}></div>
                            <span className={`text-[12px] font-semibold text-foreground`}>
                              {comp.industry}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground tabular-nums text-[13px]">
                          {formatCompanyRevenue(comp.revenue)}
                        </td>
                        <td className="py-3 px-4 text-center tabular-nums text-muted-foreground text-[13px]">
                          {comp.employees}
                        </td>
                        <td className="py-3 px-4 text-center tabular-nums text-muted-foreground text-[13px]">
                          {comp.openDeals}
                        </td>
                        <td className="py-3 px-4 text-right pr-6" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setForm({ name: comp.name, industry: comp.industry, revenue: comp.revenue, employees: comp.employees, owner: comp.owner, notes: comp.notes });
                              setSelectedId(comp.id);
                              setIsEditModalOpen(true);
                            }}
                            className="w-8 h-8 inline-flex items-center justify-center bg-secondary hover:bg-secondary/80 rounded-full transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      No companies matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            
            {/* Pagination footer */}
            {sortedCompanies.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                <span className="text-xs text-muted-foreground font-semibold">
                  Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, sortedCompanies.length)} of {sortedCompanies.length} companies
                </span>
                <div className="flex items-center gap-4">
                  <div className="flex items-center">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      className="p-2 border border-border rounded-l-lg bg-card hover:bg-secondary disabled:opacity-50 text-muted-foreground transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="px-4 py-1.5 border-y border-border bg-brand-purple/10 text-brand-purple text-xs font-bold min-w-[36px] text-center">
                      {page}
                    </div>
                    {page < totalPages && (
                      <div className="px-4 py-1.5 border border-border border-l-0 bg-card text-muted-foreground text-xs font-bold hover:bg-secondary cursor-pointer" onClick={() => setPage(page + 1)}>
                        {page + 1}
                      </div>
                    )}
                    <button
                      disabled={page >= totalPages}
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      className="p-2 border border-border rounded-r-lg bg-card hover:bg-secondary disabled:opacity-50 text-muted-foreground transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="relative hidden sm:block">
                    <select className="appearance-none pl-3 pr-8 py-2 border border-border rounded-lg text-xs font-bold bg-card text-foreground cursor-pointer focus:outline-none">
                      <option value="10">{pageSize} / page</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Details Side Panel */}
      {active && viewMode !== 'list' && (
        <div className="col-span-12 lg:col-span-4 space-y-5">
          <div className="bg-card border border-border rounded-2xl p-5 sticky top-20 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-xl bg-brand-purple/10 border border-brand-purple/10 flex items-center justify-center text-brand-purple">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-base tracking-tight">{active.name}</h3>
                  <p className="text-[11px] text-muted-foreground font-semibold">{active.industry}</p>
                </div>
              </div>
              {/* Close Button */}
              <button 
                onClick={() => setSelectedId(null)}
                className="p-1.5 bg-secondary hover:bg-secondary border border-border rounded-md text-muted-foreground hover:text-foreground transition duration-200 cursor-pointer"
                title="Close Summary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs font-semibold border-b border-border">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1.5"><UserPlus className="w-3.5 h-3.5"/> Owner</span>
                <span className="text-foreground">{active.owner}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1.5"><IndianRupee className="w-3.5 h-3.5"/> Revenue Size</span>
                <span className="text-foreground tabular-nums">{formatCompanyRevenue(active.revenue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1.5"><Users className="w-3.5 h-3.5"/> Employees</span>
                <span className="text-foreground tabular-nums">{active.employees}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5"/> Open Deals</span>
                <span className="text-foreground tabular-nums">{active.openDeals}</span>
              </div>
            </div>

            {/* Contacts list */}
            <div className="py-4 border-b border-border">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Company Contacts</h4>
                <button 
                  onClick={() => setIsAddContactModalOpen(true)}
                  className="text-brand-purple hover:text-brand-purple/80 inline-flex items-center space-x-1 text-[11px] font-bold cursor-pointer"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>Add Link</span>
                </button>
              </div>
              <div className="space-y-2">
                {active.contacts.length > 0 ? (
                  active.contacts.map((c, i) => (
                    <div key={i} className="text-xs text-foreground font-semibold flex items-center bg-secondary/50 p-2 rounded-lg border border-border/50">
                      <div className="w-6 h-6 rounded-md bg-white border border-border flex items-center justify-center mr-2.5 shrink-0">
                        <Users className="h-3 w-3 text-brand-purple" />
                      </div>
                      <span className="truncate">{c}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-xs font-medium text-center py-2 bg-secondary/30 rounded-lg border border-dashed border-border/80">No contacts linked yet.</p>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="py-4 border-b border-border">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Notes</h4>
                <button 
                  onClick={() => {
                    setForm({ name: active.name, industry: active.industry, revenue: active.revenue, employees: active.employees, owner: active.owner, notes: active.notes });
                    setIsEditModalOpen(true);
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Edit className="w-3 h-3" />
                </button>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed font-medium bg-secondary/50 p-3 border border-border/50 rounded-xl">{active.notes || 'No internal notes saved.'}</p>
            </div>

            {/* Timeline & Files */}
            <div className="pt-4 space-y-5">
              <div>
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Recent Timeline</h4>
                <div className="space-y-3 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent pl-6 md:pl-0">
                  {active.timeline.map((item) => (
                    <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-4 h-4 rounded-full border border-white bg-brand-purple text-slate-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute -left-6 md:static">
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                      </div>
                      <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-2.5 rounded-xl border border-border bg-card shadow-sm">
                        <div className="text-xs font-bold text-foreground mb-0.5">{item.title}</div>
                        <div className="text-[10px] font-medium text-muted-foreground">{item.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Company Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-border flex justify-between items-center bg-secondary">
              <h3 className="font-semibold text-foreground text-sm">Add Company</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleAdd} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Company Name</label>
                  <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-purple/30 bg-background" />
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Industry</label>
                  <input type="text" required placeholder="e.g. Software" value={form.industry} onChange={e => setForm({...form, industry: e.target.value})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-purple/30 bg-background" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Revenue</label>
                  <input type="text" placeholder="e.g. ₹5,000,000" value={form.revenue} onChange={e => setForm({...form, revenue: e.target.value})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-purple/30 bg-background" />
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Employees</label>
                  <input type="number" value={form.employees} onChange={e => setForm({...form, employees: Number(e.target.value)})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-purple/30 bg-background" />
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Owner</label>
                <select value={form.owner} onChange={e => setForm({...form, owner: e.target.value})} className="w-full px-2 py-1.5 border border-border bg-background text-foreground rounded-lg text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-purple/30">
                  <option>Sarah Johnson</option>
                  <option>Alex Johnson</option>
                </select>
              </div>
              <div className="pt-3 border-t border-border flex justify-end space-x-2.5">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-1.5 border border-border rounded-lg text-xs font-semibold text-foreground hover:bg-secondary cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-brand-purple hover:bg-brand-purple/90 text-primary-foreground rounded-lg text-xs font-bold cursor-pointer">Save Company</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Company Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-border flex justify-between items-center bg-secondary">
              <h3 className="font-semibold text-foreground text-sm">Edit Company</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleEdit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Company Name</label>
                  <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-purple/30 bg-background" />
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Industry</label>
                  <input type="text" required value={form.industry} onChange={e => setForm({...form, industry: e.target.value})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-purple/30 bg-background" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Revenue</label>
                  <input type="text" value={form.revenue} onChange={e => setForm({...form, revenue: e.target.value})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-purple/30 bg-background" />
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Employees</label>
                  <input type="number" value={form.employees} onChange={e => setForm({...form, employees: Number(e.target.value)})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-purple/30 bg-background" />
                </div>
              </div>
              <div className="pt-3 border-t border-border flex justify-end space-x-2.5">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-1.5 border border-border rounded-lg text-xs font-semibold text-foreground hover:bg-secondary cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-brand-purple hover:bg-brand-purple/90 text-primary-foreground rounded-lg text-xs font-bold cursor-pointer">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {isAddContactModalOpen && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-border flex justify-between items-center bg-secondary">
              <h3 className="font-semibold text-foreground text-sm">Link Contact</h3>
              <button onClick={() => setIsAddContactModalOpen(false)} className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleAddContact} className="p-5 space-y-4">
              <div>
                <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Contact Name & Role</label>
                <input type="text" required placeholder="e.g. Timothy Brown (CTO)" value={contactName} onChange={e => setContactName(e.target.value)} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-purple/30 bg-background" />
              </div>
              <div className="pt-3 border-t border-border flex justify-end space-x-2.5">
                <button type="button" onClick={() => setIsAddContactModalOpen(false)} className="px-4 py-1.5 border border-border rounded-lg text-xs font-semibold text-foreground hover:bg-secondary cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-brand-purple hover:bg-brand-purple/90 text-primary-foreground rounded-lg text-xs font-bold cursor-pointer">Link Contact</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
