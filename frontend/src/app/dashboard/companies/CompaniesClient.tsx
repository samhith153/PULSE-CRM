// frontend/src/app/dashboard/companies/CompaniesClient.tsx
// ──────────────────────────────────────────────────────────────────────────────
// CLIENT COMPONENT — only interactive state. Receives initial data as props.
// ──────────────────────────────────────────────────────────────────────────────

'use client';

import { useState, useMemo, useEffect } from 'react';
import CompaniesTable from './CompaniesTable';
import CompanyDetailPanel from './CompanyDetailPanel';
import { AddCompanyModal, EditCompanyModal, AddContactModal } from './modals';
import { revalidateCompanies } from '@/lib/api-server-actions';
import type { UICompany } from '@/lib/api-server';

interface CompaniesClientProps {
  initialCompanies: UICompany[];
  initialSelectedId?: string | number | null;
}

export default function CompaniesClient({ 
  initialCompanies, 
  initialSelectedId = null 
}: CompaniesClientProps) {
  const [companies, setCompanies] = useState<UICompany[]>(initialCompanies);
  const [selectedId, setSelectedId] = useState<string | number | null>(initialSelectedId);
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

  const [form, setForm] = useState({
    name: '', industry: '', revenue: '', employees: 10, owner: 'Sarah Johnson', notes: ''
  });
  const [contactName, setContactName] = useState('');

  // Listen for create company modal event
  useEffect(() => {
    const handleOpen = () => {
      setForm({ name: '', industry: '', revenue: '', employees: 10, owner: 'Sarah Johnson', notes: '' });
      setIsAddModalOpen(true);
    };
    window.addEventListener('pulse-open-create-company-modal', handleOpen);
    return () => window.removeEventListener('pulse-open-create-company-modal', handleOpen);
  }, []);

  const active = selectedId ? companies.find(c => c.id === selectedId) || null : null;

  const filtered = useMemo(() => companies.filter(c => 
    (c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (c.industry || '').toLowerCase().includes(searchQuery.toLowerCase())) &&
    (filterIndustry === '' || (c.industry || '').toLowerCase() === filterIndustry.toLowerCase())
  ), [companies, searchQuery, filterIndustry]);

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

  const formatCompanyRevenue = (val: string | number) => {
    if (!val) return '—';
    const cleanStr = String(val).replace(/[^0-9.-]/g, '');
    if (!cleanStr) return String(val);
    const num = Math.round(Number(cleanStr));
    if (isNaN(num)) return String(val);
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const toggleViewMode = (mode: 'default' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('pulse-crm-view-mode-companies', mode);
  };

  const handleToggleSelectAll = (items: UICompany[]) => {
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
      const { deleteCompany } = await import('@/utils/api');
      for (const id of Array.from(selectedIds)) {
        await deleteCompany(id);
      }
      setCompanies(prev => prev.filter(c => !selectedIds.has(c.id)));
      setSelectedIds(new Set());
      setSelectedId(null);
      await revalidateCompanies();
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleDelete = async (id: number | string) => {
    if (!window.confirm('Are you sure you want to delete this company?')) return;
    try {
      const { deleteCompany } = await import('@/utils/api');
      await deleteCompany(id);
      setCompanies(prev => prev.filter(c => c.id !== id));
      if (selectedId === id) {
        setSelectedId(null);
      }
      await revalidateCompanies();
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const newComp: UICompany = {
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
      const { updateCompany } = await import('@/utils/api');
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
      await revalidateCompanies();
    } catch {
      // Error handled by updateCompany
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
        <CompaniesTable
          companies={sortedCompanies}
          selectedIds={selectedIds}
          selectedId={selectedId}
          viewMode={viewMode}
          searchQuery={searchQuery}
          sortField={sortField}
          sortOrder={sortOrder}
          filterIndustry={filterIndustry}
          uniqueIndustries={uniqueIndustries}
          isSortDropdownOpen={isSortDropdownOpen}
          isFilterDropdownOpen={isFilterDropdownOpen}
          formatCompanyRevenue={formatCompanyRevenue}
          onSearchChange={setSearchQuery}
          onViewModeChange={toggleViewMode}
          onSelect={setSelectedId}
          onToggleSelectRow={handleToggleSelectRow}
          onToggleSelectAll={handleToggleSelectAll}
          onSort={handleHeaderClick}
          onFilterChange={setFilterIndustry}
          onSortDropdownToggle={setIsSortDropdownOpen}
          onFilterDropdownToggle={setIsFilterDropdownOpen}
          onAddClick={() => {
            setForm({ name: '', industry: '', revenue: '', employees: 10, owner: 'Sarah Johnson', notes: '' });
            setIsAddModalOpen(true);
          }}
          onEditClick={(c) => {
            setForm({ name: c.name, industry: c.industry, revenue: c.revenue, employees: c.employees, owner: c.owner, notes: c.notes });
            setSelectedId(c.id);
            setIsEditModalOpen(true);
          }}
          onDeleteClick={handleDelete}
          onDeleteSelected={handleDeleteSelectedCompanies}
          onAddContactClick={() => setIsAddContactModalOpen(true)}
        />
        
        {/* Modals */}
        <AddCompanyModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSubmit={handleAdd} form={form} setForm={setForm} />
        <EditCompanyModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSubmit={handleEdit} form={form} setForm={setForm} />
        <AddContactModal isOpen={isAddContactModalOpen} onClose={() => setIsAddContactModalOpen(false)} onSubmit={handleAddContact} contactName={contactName} setContactName={setContactName} />
      </div>

      {/* Details Side Panel */}
      {active && viewMode !== 'list' && (
        <div className="col-span-12 lg:col-span-4 space-y-5">
          <CompanyDetailPanel
            company={active}
            formatCompanyRevenue={formatCompanyRevenue}
            onClose={() => setSelectedId(null)}
            onDelete={handleDelete}
            onAddContact={() => setIsAddContactModalOpen(true)}
          />
        </div>
      )}
    </div>
  );
}