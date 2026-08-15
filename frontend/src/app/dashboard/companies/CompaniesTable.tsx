// frontend/src/app/dashboard/companies/CompaniesTable.tsx
// ──────────────────────────────────────────────────────────────────────────────
// PURE PRESENTATIONAL — no data fetching, no mutations. Just renders.
// ──────────────────────────────────────────────────────────────────────────────

import { 
  Building2, Search, Plus, Edit, Eye, Trash2, UserPlus, Users, 
  IndianRupee, Briefcase, Clock, Paperclip, Mail, PlusCircle,
  X, Check, LayoutGrid, List, SlidersHorizontal, ArrowUpDown,
  ChevronDown
} from 'lucide-react';

import type { UICompany } from '@/lib/api-server';

interface CompaniesTableProps {
  companies: UICompany[];
  selectedIds: Set<string | number>;
  selectedId: string | number | null;
  viewMode: 'default' | 'list';
  searchQuery: string;
  sortField: string;
  sortOrder: 'asc' | 'desc';
  filterIndustry: string;
  uniqueIndustries: string[];
  isSortDropdownOpen: boolean;
  isFilterDropdownOpen: boolean;
  formatCompanyRevenue: (val: string | number) => string;
  onSearchChange: (q: string) => void;
  onViewModeChange: (mode: 'default' | 'list') => void;
  onSelect: (id: string | number) => void;
  onToggleSelectRow: (id: string | number) => void;
  onToggleSelectAll: (items: UICompany[]) => void;
  onSort: (field: string) => void;
  onFilterChange: (industry: string) => void;
  onSortDropdownToggle: (open: boolean) => void;
  onFilterDropdownToggle: (open: boolean) => void;
  onAddClick: () => void;
  onEditClick: (company: UICompany) => void;
  onDeleteClick: (id: number | string) => void;
  onDeleteSelected: () => void;
  onAddContactClick: () => void;
}

export default function CompaniesTable(props: CompaniesTableProps) {
  const { 
    companies, selectedIds, selectedId, viewMode, searchQuery, 
    sortField, sortOrder, filterIndustry, uniqueIndustries,
    isSortDropdownOpen, isFilterDropdownOpen,
    formatCompanyRevenue, onSearchChange, onViewModeChange,
    onSelect, onToggleSelectRow, onToggleSelectAll, onSort,
    onFilterChange, onSortDropdownToggle, onFilterDropdownToggle,
    onAddClick, onEditClick, onDeleteClick, onDeleteSelected,
    onAddContactClick
  } = props;

  return (
    <div className="bg-surface-1 border border-border-default rounded-2xl p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 border-b border-border-default/40 pb-3">
        <div>
          <h2 className="font-sans text-2xl text-text-primary font-bold">Companies</h2>
          <p className="text-[11px] text-text-muted mt-0.5 font-semibold">Monitor accounts, track revenue sizes, and view contact chains.</p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center border border-border-default rounded-lg overflow-hidden p-0.5 bg-surface-2/50 shrink-0 select-none">
            <button type="button" onClick={() => onViewModeChange('default')}
              className={`p-1.5 rounded-md transition cursor-pointer ${viewMode === 'default' ? 'bg-surface-1 text-accent-color shadow-sm font-bold' : 'text-text-muted hover:text-text-primary'}`}
              title="Split View"><LayoutGrid size={14} /></button>
            <button type="button" onClick={() => onViewModeChange('list')}
              className={`p-1.5 rounded-md transition cursor-pointer ${viewMode === 'list' ? 'bg-surface-1 text-accent-color shadow-sm font-bold' : 'text-text-muted hover:text-text-primary'}`}
              title="List Table View"><List size={14} /></button>
          </div>
          {selectedIds.size > 0 && (
            <button onClick={onDeleteSelected}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-status-danger-text hover:bg-status-danger-text/90 text-text-on-primary rounded-lg text-xs font-bold transition-colors cursor-pointer">
              <Trash2 className="h-3.5 w-3.5" /><span>Delete ({selectedIds.size})</span>
            </button>
          )}
          <button onClick={onAddClick}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-accent-color hover:bg-accent-color/90 text-surface-0 rounded-lg text-xs font-bold transition-colors cursor-pointer">
            <Plus className="h-3.5 w-3.5" /><span>Add Company</span>
          </button>
        </div>
      </div>

      {/* Search, Sort, and Filters toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-text-muted"><Search className="h-3.5 w-3.5" /></span>
          <input type="text" placeholder="Search companies..." value={searchQuery} onChange={e => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent-color/20 bg-surface-2/15" />
        </div>
        
        <div className="flex items-center gap-2">
          {/* Sort Dropdown */}
          <div className="relative">
            <button type="button" onClick={() => { onSortDropdownToggle(!isSortDropdownOpen); onFilterDropdownToggle(false); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border-default bg-surface-1 hover:bg-surface-2 rounded-lg text-xs font-bold text-text-primary transition-colors cursor-pointer">
              <ArrowUpDown className="h-3.5 w-3.5 text-text-muted" /><span>Sort</span>
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
                  <button key={`${field}-${order}`} onClick={() => { onSort(field); onSortDropdownToggle(false); }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${sortField === field && sortOrder === order ? 'bg-accent-color/10 text-accent-color font-bold' : 'text-text-primary hover:bg-surface-2'}`}>
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter Dropdown */}
          <div className="relative">
            <button type="button" onClick={() => { onFilterDropdownToggle(!isFilterDropdownOpen); onSortDropdownToggle(false); }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-bold transition-colors cursor-pointer ${filterIndustry ? 'bg-accent-color/10 border-accent-color/30 text-accent-color' : 'border-border-default bg-surface-1 hover:bg-surface-2 text-text-primary'}`}>
              <SlidersHorizontal className="h-3.5 w-3.5" /><span>{filterIndustry ? `Industry: ${filterIndustry}` : 'Filter'}</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {isFilterDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 z-30 bg-surface-1 border border-border-default rounded-xl shadow-lg p-1.5 min-w-[200px] max-h-60 overflow-y-auto">
                <button onClick={() => { onFilterChange(''); onFilterDropdownToggle(false); }}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer mb-0.5 ${filterIndustry === '' ? 'bg-accent-color/10 text-accent-color font-bold' : 'text-text-primary hover:bg-surface-2'}`}>
                  All Industries
                </button>
                {uniqueIndustries.map(ind => (
                  <button key={ind} onClick={() => { onFilterChange(ind); onFilterDropdownToggle(false); }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${filterIndustry === ind ? 'bg-accent-color/10 text-accent-color font-bold' : 'text-text-primary hover:bg-surface-2'}`}>
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
                  <input type="checkbox" checked={companies.length > 0 && selectedIds.size === companies.length}
                    onChange={() => onToggleSelectAll(companies)} className="rounded border-border-default text-accent-color focus:ring-accent-color cursor-pointer size-3.5" />
                </th>
                <th className="py-3 px-2 w-[22%] cursor-pointer hover:text-text-primary" onClick={() => onSort('name')}>Company Name</th>
                <th className="py-3 px-2 w-[20%] cursor-pointer hover:text-text-primary" onClick={() => onSort('industry')}>Industry</th>
                <th className="py-3 px-2 w-[15%] cursor-pointer hover:text-text-primary" onClick={() => onSort('revenue')}>Revenue</th>
                <th className="py-3 px-2 w-[13%] cursor-pointer hover:text-text-primary text-center" onClick={() => onSort('employees')}>Employees</th>
                <th className="py-3 px-2 w-[13%] cursor-pointer hover:text-text-primary text-center" onClick={() => onSort('openDeals')}>Open Deals</th>
                <th className="py-3 px-2 w-[12%] cursor-pointer hover:text-text-primary" onClick={() => onSort('owner')}>Owner</th>
                <th className="py-3 px-2 w-[5%] text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-xs text-text-primary font-medium">
              {companies.length > 0 ? (
                companies.map((comp) => {
                  const isRowSelected = selectedIds.has(comp.id);
                  return (
                    <tr key={comp.id} onClick={() => onSelect(comp.id)} className={`hover:bg-surface-2/20 transition border-b border-border-default/40 ${isRowSelected ? 'bg-accent-color/[0.02]' : ''}`}>
                      <td className="py-3.5 px-4 text-left" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={isRowSelected} onChange={() => onToggleSelectRow(comp.id)} className="rounded border-border-default text-accent-color focus:ring-accent-color cursor-pointer size-3.5" />
                      </td>
                      <td className="py-3.5 px-2 font-bold truncate" title={comp.name}>{comp.name}</td>
                      <td className="py-3.5 px-2 text-text-muted truncate" title={comp.industry}>{comp.industry}</td>
                      <td className="py-3.5 px-2 text-text-muted tabular-nums truncate">{formatCompanyRevenue(comp.revenue)}</td>
                      <td className="py-3.5 px-2 text-center tabular-nums">{comp.employees}</td>
                      <td className="py-3.5 px-2 text-center tabular-nums">{comp.openDeals}</td>
                      <td className="py-3.5 px-2 text-text-muted truncate" title={comp.owner}>{comp.owner}</td>
                      <td className="py-3.5 px-2 text-right pr-4" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-end gap-1.5">
                          <button onClick={() => onEditClick(comp)} className="p-1 text-text-muted hover:text-text-primary hover:bg-surface-2 rounded transition-colors cursor-pointer"><Edit className="h-3.5 w-3.5" /></button>
                          <button onClick={() => onDeleteClick(comp.id)} className="p-1 text-text-muted hover:text-status-danger-text hover:bg-status-danger-bg rounded transition-colors cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={8} className="py-8 text-center text-text-muted">No companies matching search.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-y-auto max-h-[580px] border border-border-default/60 rounded-xl bg-surface-1">
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 bg-surface-1 z-10 border-b border-border-default shadow-[0_1px_0_0_rgba(0,0,0,0.02)] select-none">
              <tr className="text-[11px] uppercase font-black tracking-wider text-text-primary border-b border-border-default bg-surface-2/40">
                <th className="py-3 px-4 cursor-pointer hover:text-text-primary" onClick={() => onSort('name')}>Company Name</th>
                <th className="py-3 cursor-pointer hover:text-text-primary" onClick={() => onSort('industry')}>Industry</th>
                <th className="py-3 cursor-pointer hover:text-text-primary" onClick={() => onSort('revenue')}>Revenue</th>
                <th className="py-3 text-center cursor-pointer hover:text-text-primary" onClick={() => onSort('employees')}>Employees</th>
                <th className="py-3 text-center cursor-pointer hover:text-text-primary" onClick={() => onSort('openDeals')}>Open Deals</th>
                <th className="py-3 text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-xs text-text-primary font-medium">
              {companies.map((comp) => (
                <tr key={comp.id} onClick={() => onSelect(comp.id)} onDoubleClick={e => { e.stopPropagation(); }} className={`hover:bg-surface-2/40 cursor-pointer transition duration-200 border-b border-border-default/40 ${comp.id === selectedId ? 'bg-accent-color/[0.04]' : ''}`}>
                  <td className="py-3.5 px-4 font-semibold text-text-primary truncate max-w-[160px]">{comp.name}</td>
                  <td className="py-3.5 text-text-muted truncate max-w-[120px]">{comp.industry}</td>
                  <td className="py-3.5 tabular-nums">{formatCompanyRevenue(comp.revenue)}</td>
                  <td className="py-3.5 text-center tabular-nums">{comp.employees}</td>
                  <td className="py-3.5 text-center tabular-nums">{comp.openDeals}</td>
                  <td className="py-3.5 text-right pr-4" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-end space-x-1">
                      <button onClick={() => onEditClick(comp)} className="p-1 text-text-muted hover:text-text-primary hover:bg-surface-2 rounded transition-colors cursor-pointer"><Edit className="h-3.5 w-3.5" /></button>
                      <button onClick={() => onDeleteClick(comp.id)} className="p-1 text-text-muted hover:text-status-danger-text hover:bg-status-danger-bg rounded transition-colors cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}