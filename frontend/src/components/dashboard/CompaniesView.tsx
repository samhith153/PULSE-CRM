'use client';

import React, { useState, useEffect } from 'react';
import { getCompanies, updateCompany, deleteCompany } from '@/utils/api';
import { toast } from '@/lib/toast';
import { 
  Building2, 
  Search, 
  Plus, 
  Edit, 
  Eye, 
  Trash2, 
  UserPlus, 
  Users, 
  IndianRupee, 
  Briefcase, 
  Clock, 
  Paperclip, 
  Mail, 
  PlusCircle,
  X,
  Check,
  LayoutGrid,
  List,
  SlidersHorizontal,
  ArrowUpDown,
  ChevronDown
} from 'lucide-react';

const formatCompanyRevenue = (val: string | number) => {
  if (!val) return '—';
  const cleanStr = String(val).replace(/[^0-9.-]/g, '');
  if (!cleanStr) return String(val);
  const num = Math.round(Number(cleanStr));
  if (isNaN(num)) return String(val);
  return `₹${num.toLocaleString('en-IN')}`;
};

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
      return (localStorage.getItem('pulse-crm-view-mode-companies') as any) || 'default';
    }
    return 'default';
  });

  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [sortField, setSortField] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterIndustry, setFilterIndustry] = useState<string>('');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

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

  const uniqueIndustries = React.useMemo(() => {
    const set = new Set(companies.map(c => c.industry).filter(Boolean));
    return Array.from(set).sort();
  }, [companies]);

  const sortedCompanies = React.useMemo(() => {
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

  return (
    <div className="grid grid-cols-12 gap-6 items-start">
      {/* Companies List */}
      <div className={`col-span-12 ${active && viewMode !== 'list' ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-5`}>
        <div className="bg-surface-1 border border-border-default rounded-2xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 border-b border-border-default/40 pb-3">
            <div>
              <h2 className="font-sans text-2xl text-text-primary font-bold">Companies</h2>
              <p className="text-[11px] text-text-muted mt-0.5 font-semibold">Monitor accounts, track revenue sizes, and view contact chains.</p>
            </div>
            
            {/* View Toggle + Actions Group */}
            <div className="flex items-center gap-2">
              <div className="flex items-center border border-border-default rounded-lg overflow-hidden p-0.5 bg-surface-2/50 shrink-0 select-none">
                <button
                  type="button"
                  onClick={() => toggleViewMode('default')}
                  className={`p-1.5 rounded-md transition cursor-pointer ${
                    viewMode === 'default'
                      ? 'bg-surface-1 text-accent-color shadow-sm font-bold'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                  title="Split View"
                >
                  <LayoutGrid size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => toggleViewMode('list')}
                  className={`p-1.5 rounded-md transition cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-surface-1 text-accent-color shadow-sm font-bold'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                  title="List Table View"
                >
                  <List size={14} />
                </button>
              </div>
              {selectedIds.size > 0 && (
                <button 
                  onClick={handleDeleteSelectedCompanies}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-status-danger hover:bg-status-danger/90 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete ({selectedIds.size})</span>
                </button>
              )}
              <button 
                onClick={() => {
                  setForm({ name: '', industry: '', revenue: '', employees: 10, owner: 'Sarah Johnson', notes: '' });
                  setIsAddModalOpen(true);
                }}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-accent-color hover:bg-accent-color/90 text-surface-0 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Company</span>
              </button>
            </div>
          </div>

          {/* Search, Sort, and Filters toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-text-muted">
                <Search className="h-3.5 w-3.5" />
              </span>
              <input 
                type="text" 
                placeholder="Search companies..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent-color/20 bg-surface-2/15"
              />
            </div>
            
            <div className="flex items-center gap-2">
              {/* Sort Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setIsSortDropdownOpen(!isSortDropdownOpen); setIsFilterDropdownOpen(false); }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border-default bg-surface-1 hover:bg-surface-2 rounded-lg text-xs font-bold text-text-primary transition-colors cursor-pointer"
                >
                  <ArrowUpDown className="h-3.5 w-3.5 text-text-muted" />
                  <span>Sort</span>
                  <ChevronDown className={`h-3 w-3 text-text-muted transition-transform ${isSortDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isSortDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1.5 z-30 bg-surface-1 border border-border-default rounded-xl shadow-lg p-1.5 min-w-[160px]">
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
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          sortField === field && sortOrder === order
                            ? 'bg-accent-color/10 text-accent-color font-bold'
                            : 'text-text-primary hover:bg-surface-2'
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
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    filterIndustry ? 'bg-accent-color/10 border-accent-color/30 text-accent-color' : 'border-border-default bg-surface-1 hover:bg-surface-2 text-text-primary'
                  }`}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span>{filterIndustry ? `Industry: ${filterIndustry}` : 'Filter'}</span>
                  <ChevronDown className={`h-3 w-3 transition-transform ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isFilterDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1.5 z-30 bg-surface-1 border border-border-default rounded-xl shadow-lg p-1.5 min-w-[200px] max-h-60 overflow-y-auto">
                    <button
                      onClick={() => { setFilterIndustry(''); setIsFilterDropdownOpen(false); }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer mb-0.5 ${
                        filterIndustry === '' ? 'bg-accent-color/10 text-accent-color font-bold' : 'text-text-primary hover:bg-surface-2'
                      }`}
                    >
                      All Industries
                    </button>
                    {uniqueIndustries.map(ind => (
                      <button
                        key={ind}
                        onClick={() => { setFilterIndustry(ind); setIsFilterDropdownOpen(false); }}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          filterIndustry === ind ? 'bg-accent-color/10 text-accent-color font-bold' : 'text-text-primary hover:bg-surface-2'
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

          {viewMode === 'list' ? (
            <div className="overflow-y-auto max-h-[580px] border border-border-default/60 rounded-xl bg-surface-1 custom-scrollbar">
              <table className="w-full border-collapse text-left table-fixed">
                <thead className="sticky top-0 bg-surface-1 z-10 border-b border-border-default shadow-[0_1px_0_0_rgba(0,0,0,0.02)] select-none">
                  <tr className="text-[11px] uppercase font-black tracking-wider text-text-primary border-b border-border-default bg-surface-2/40">
                    <th className="py-3 px-4 w-[5%] text-left">
                      <input 
                        type="checkbox" 
                        checked={sortedCompanies.length > 0 && selectedIds.size === sortedCompanies.length}
                        onChange={() => handleToggleSelectAll(sortedCompanies)}
                        className="rounded border-border-default text-accent-color focus:ring-accent-color cursor-pointer size-3.5"
                      />
                    </th>
                    <th className="py-3 px-2 w-[22%] cursor-pointer hover:text-text-primary" onClick={() => handleHeaderClick('name')}>Company Name</th>
                    <th className="py-3 px-2 w-[20%] cursor-pointer hover:text-text-primary" onClick={() => handleHeaderClick('industry')}>Industry</th>
                    <th className="py-3 px-2 w-[15%] cursor-pointer hover:text-text-primary" onClick={() => handleHeaderClick('revenue')}>Revenue</th>
                    <th className="py-3 px-2 w-[13%] cursor-pointer hover:text-text-primary text-center" onClick={() => handleHeaderClick('employees')}>Employees</th>
                    <th className="py-3 px-2 w-[13%] cursor-pointer hover:text-text-primary text-center" onClick={() => handleHeaderClick('openDeals')}>Open Deals</th>
                    <th className="py-3 px-2 w-[12%] cursor-pointer hover:text-text-primary" onClick={() => handleHeaderClick('owner')}>Owner</th>
                    <th className="py-3 px-2 w-[5%] text-right pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 text-xs text-text-primary font-medium">
                  {sortedCompanies.length > 0 ? (
                    sortedCompanies.map((comp) => {
                      const isRowSelected = selectedIds.has(comp.id);
                      return (
                        <tr 
                          key={comp.id} 
                          onClick={() => setSelectedId(comp.id)}
                          className={`hover:bg-surface-2/20 transition border-b border-border-default/40 ${isRowSelected ? 'bg-accent-color/[0.02]' : ''}`}
                        >
                          <td className="py-3.5 px-4 text-left" onClick={(e) => e.stopPropagation()}>
                            <input 
                              type="checkbox" 
                              checked={isRowSelected}
                              onChange={() => handleToggleSelectRow(comp.id)}
                              className="rounded border-border-default text-accent-color focus:ring-accent-color cursor-pointer size-3.5"
                            />
                          </td>
                          <td className="py-3.5 px-2 font-bold truncate" title={comp.name}>{comp.name}</td>
                          <td className="py-3.5 px-2 text-text-muted truncate" title={comp.industry}>{comp.industry}</td>
                          <td className="py-3.5 px-2 text-text-muted tabular-nums truncate">{formatCompanyRevenue(comp.revenue)}</td>
                          <td className="py-3.5 px-2 text-center tabular-nums">{comp.employees}</td>
                          <td className="py-3.5 px-2 text-center tabular-nums">{comp.openDeals}</td>
                          <td className="py-3.5 px-2 text-text-muted truncate" title={comp.owner}>{comp.owner}</td>
                          <td className="py-3.5 px-2 text-right pr-4" onClick={(e) => e.stopPropagation()}>
                            <button 
                              onClick={() => {
                                setForm({ name: comp.name, industry: comp.industry, revenue: comp.revenue, employees: comp.employees, owner: comp.owner, notes: comp.notes });
                                setSelectedId(comp.id);
                                setIsEditModalOpen(true);
                              }}
                              className="p-1 text-text-muted hover:text-text-primary hover:bg-surface-2 rounded transition-colors cursor-pointer"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-text-muted">
                        No companies matching search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[580px] border border-border-default/60 rounded-xl bg-surface-1">
              <table className="w-full border-collapse text-left">
                <thead className="sticky top-0 bg-surface-1 z-10 border-b border-border-default shadow-[0_1px_0_0_rgba(0,0,0,0.02)] select-none">
                  <tr className="text-[11px] uppercase font-black tracking-wider text-text-primary border-b border-border-default bg-surface-2/40">
                    <th className="py-3 px-4 cursor-pointer hover:text-text-primary" onClick={() => handleHeaderClick('name')}>Company Name</th>
                    <th className="py-3 cursor-pointer hover:text-text-primary" onClick={() => handleHeaderClick('industry')}>Industry</th>
                    <th className="py-3 cursor-pointer hover:text-text-primary" onClick={() => handleHeaderClick('revenue')}>Revenue</th>
                    <th className="py-3 text-center cursor-pointer hover:text-text-primary" onClick={() => handleHeaderClick('employees')}>Employees</th>
                    <th className="py-3 text-center cursor-pointer hover:text-text-primary" onClick={() => handleHeaderClick('openDeals')}>Open Deals</th>
                    <th className="py-3 text-right pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 text-xs text-text-primary font-medium">
                  {sortedCompanies.map((comp) => (
                    <tr 
                      key={comp.id}
                      onClick={() => setSelectedId(comp.id)}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setSelectedId(prevId => prevId === comp.id ? null : prevId);
                      }}
                      className={`hover:bg-surface-2/40 cursor-pointer transition duration-200 border-b border-border-default/40 ${comp.id === selectedId ? 'bg-accent-color/[0.04]' : ''}`}
                    >
                      <td className="py-3.5 px-4 font-semibold text-text-primary truncate max-w-[160px]">{comp.name}</td>
                      <td className="py-3.5 text-text-muted truncate max-w-[120px]">{comp.industry}</td>
                      <td className="py-3.5 tabular-nums">{formatCompanyRevenue(comp.revenue)}</td>
                      <td className="py-3.5 text-center tabular-nums">{comp.employees}</td>
                      <td className="py-3.5 text-center tabular-nums">{comp.openDeals}</td>
                      <td className="py-3.5 text-right pr-4" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-end space-x-1">
                          <button 
                            onClick={() => {
                              setForm({ name: comp.name, industry: comp.industry, revenue: comp.revenue, employees: comp.employees, owner: comp.owner, notes: comp.notes });
                              setIsEditModalOpen(true);
                            }}
                            className="p-1 text-text-muted hover:text-text-primary hover:bg-surface-2 rounded transition-colors cursor-pointer"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Details Side Panel */}
      {active && viewMode !== 'list' && <div className="col-span-12 lg:col-span-4 space-y-5">
        <div className="bg-surface-1 border border-border-default rounded-2xl p-5 sticky top-20">
          <div className="flex items-center justify-between pb-3 border-b border-border-default">
            <div className="flex items-center space-x-2.5">
              <div className="h-8.5 w-8.5 rounded-lg bg-surface-2 border border-border-default flex items-center justify-center text-accent-color">
                <Building2 className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary text-sm">{active.name}</h3>
                <p className="text-[10px] text-text-muted font-semibold">{active.industry}</p>
              </div>
            </div>
            {/* Close Button */}
            <button 
              onClick={() => setSelectedId(null)}
              className="p-1 bg-surface-2 hover:bg-surface-2 border border-border-default rounded text-text-muted hover:text-text-primary transition duration-200 cursor-pointer"
              title="Close Summary"
              aria-label="Close Summary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="py-3 space-y-2.5 text-[11px] font-semibold border-b border-border-default">
            <div className="flex justify-between">
              <span className="text-text-muted">Owner</span>
              <span className="text-text-primary">{active.owner}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Revenue Size</span>
              <span className="text-text-muted tabular-nums">{formatCompanyRevenue(active.revenue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Employees</span>
              <span className="text-text-muted tabular-nums">{active.employees}</span>
            </div>
          </div>

          {/* Contacts list */}
          <div className="py-3 border-b border-border-default">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[10px] font-semibold text-text-primary uppercase tracking-wider">Company Contacts</h4>
              <button 
                onClick={() => setIsAddContactModalOpen(true)}
                className="text-accent-color hover:text-accent-color/80 inline-flex items-center space-x-0.5 text-[10px] font-bold cursor-pointer"
              >
                <PlusCircle className="h-3 w-3" />
                <span>Add Link</span>
              </button>
            </div>
            <div className="space-y-1.5">
              {active.contacts.length > 0 ? (
                active.contacts.map((c, i) => (
                  <div key={i} className="text-[11px] text-text-primary font-semibold flex items-center">
                    <Users className="h-3 w-3 mr-1.5 text-text-muted" />
                    {c}
                  </div>
                ))
              ) : (
                <p className="text-text-muted text-[10px] font-semibold">No contacts linked yet.</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="py-3 border-b border-border-default">
            <h4 className="text-[10px] font-semibold text-text-primary uppercase tracking-wider mb-1.5">Notes</h4>
            <p className="text-[11px] text-text-muted leading-relaxed font-semibold bg-surface-2 p-2 border border-border-default rounded-lg">{active.notes || 'No internal notes saved.'}</p>
          </div>

          {/* Timeline & Files */}
          <div className="pt-3 space-y-4">
            <div>
              <h4 className="text-[10px] font-semibold text-text-primary uppercase tracking-wider mb-2">Recent Timeline</h4>
              <div className="space-y-2">
                {active.timeline.map((item) => (
                  <div key={item.id} className="text-[10px] font-semibold flex justify-between">
                    <span className="text-text-muted">{item.title}</span>
                    <span className="text-text-muted font-bold">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-semibold text-text-primary uppercase tracking-wider mb-2">Uploaded Attachments</h4>
              <div className="space-y-1.5">
                {active.files.length > 0 ? (
                  active.files.map((file) => (
                    <div key={file.id} className="p-2 border border-border-default rounded bg-surface-2 flex justify-between items-center text-[10px] font-semibold">
                      <span className="flex items-center text-text-primary font-semibold">
                        <Paperclip className="h-3.5 w-3.5 mr-1.5 text-text-muted" />
                        {file.name}
                      </span>
                      <span className="text-text-muted">{file.size}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-text-muted text-[10px] font-semibold">No files uploaded.</p>
                )}
              </div>
            </div>
        </div>
      </div>
      </div>}

      {/* Add Company Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-surface-1 border border-border-default rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-border-default flex justify-between items-center bg-surface-2">
              <h3 className="font-semibold text-text-primary text-sm">Add Company</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-text-muted hover:text-text-primary p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleAdd} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Company Name</label>
                  <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary focus:outline-none bg-surface-0" />
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Industry</label>
                  <input type="text" required placeholder="e.g. Software" value={form.industry} onChange={e => setForm({...form, industry: e.target.value})} className="w-full px-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary focus:outline-none bg-surface-0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Revenue</label>
                  <input type="text" placeholder="e.g. ₹5,000,000" value={form.revenue} onChange={e => setForm({...form, revenue: e.target.value})} className="w-full px-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary focus:outline-none bg-surface-0" />
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Employees</label>
                  <input type="number" value={form.employees} onChange={e => setForm({...form, employees: Number(e.target.value)})} className="w-full px-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary focus:outline-none bg-surface-0" />
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Owner</label>
                <select value={form.owner} onChange={e => setForm({...form, owner: e.target.value})} className="w-full px-2 py-1.5 border border-border-default bg-surface-0 text-text-primary rounded-lg text-xs cursor-pointer">
                  <option>Sarah Johnson</option>
                  <option>Alex Johnson</option>
                </select>
              </div>
              <div className="pt-3 border-t border-border-default flex justify-end space-x-2.5">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-1.5 border border-border-default rounded-lg text-xs font-semibold text-text-primary hover:bg-surface-2 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-accent-color hover:bg-accent-color/90 text-surface-0 rounded-lg text-xs font-bold  cursor-pointer">Save Company</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Company Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-surface-1 border border-border-default rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-border-default flex justify-between items-center bg-surface-2">
              <h3 className="font-semibold text-text-primary text-sm">Edit Company</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-text-muted hover:text-text-primary p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleEdit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Company Name</label>
                  <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary focus:outline-none bg-surface-0" />
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Industry</label>
                  <input type="text" required value={form.industry} onChange={e => setForm({...form, industry: e.target.value})} className="w-full px-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary focus:outline-none bg-surface-0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Revenue</label>
                  <input type="text" value={form.revenue} onChange={e => setForm({...form, revenue: e.target.value})} className="w-full px-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary focus:outline-none bg-surface-0" />
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Employees</label>
                  <input type="number" value={form.employees} onChange={e => setForm({...form, employees: Number(e.target.value)})} className="w-full px-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary focus:outline-none bg-surface-0" />
                </div>
              </div>
              <div className="pt-3 border-t border-border-default flex justify-end space-x-2.5">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-1.5 border border-border-default rounded-lg text-xs font-semibold text-text-primary hover:bg-surface-2 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-accent-color hover:bg-accent-color/90 text-surface-0 rounded-lg text-xs font-bold  cursor-pointer">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {isAddContactModalOpen && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-surface-1 border border-border-default rounded-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-border-default flex justify-between items-center bg-surface-2">
              <h3 className="font-semibold text-text-primary text-sm">Link Contact</h3>
              <button onClick={() => setIsAddContactModalOpen(false)} className="text-text-muted hover:text-text-primary p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleAddContact} className="p-5 space-y-4">
              <div>
                <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Contact Name & Role</label>
                <input type="text" required placeholder="e.g. Timothy Brown (CTO)" value={contactName} onChange={e => setContactName(e.target.value)} className="w-full px-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary focus:outline-none bg-surface-0" />
              </div>
              <div className="pt-3 border-t border-border-default flex justify-end space-x-2.5">
                <button type="button" onClick={() => setIsAddContactModalOpen(false)} className="px-4 py-1.5 border border-border-default rounded-lg text-xs font-semibold text-text-primary hover:bg-surface-2 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-accent-color hover:bg-accent-color/90 text-surface-0 rounded-lg text-xs font-bold  cursor-pointer">Link Contact</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

