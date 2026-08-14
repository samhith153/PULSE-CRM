'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { getDeals, updateDealStage, createDeal, updateDeal, deleteDeal, getPipelineStages, formatINR } from '@/utils/api';
import { toast } from '@/lib/toast';
import SkeletonLoader from './SkeletonLoader';
import { 
  Plus, 
  IndianRupee, 
  TrendingUp, 
  Sparkles, 
  X, 
  Edit, 
  Trash2, 
  Building2,
  LayoutGrid,
  List,
  CalendarDays,
  Search,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';

function StageDropdown({ 
  value, 
  onChange, 
  stages,
  className = ""
}: { 
  value: string; 
  onChange: (val: string) => void; 
  stages: string[];
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
        setFocusedIndex(stages.indexOf(value));
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => (prev + 1) % stages.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => (prev - 1 + stages.length) % stages.length);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < stages.length) {
        onChange(stages[focusedIndex]);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative inline-block text-left w-full ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        onKeyDown={handleKeyDown}
        className="w-full flex items-center justify-between gap-1.5 px-2 py-1 border border-border-default rounded-md text-[10px] bg-surface-1 text-text-primary hover:bg-surface-hover transition-colors cursor-pointer outline-none focus:ring-1 focus:ring-accent-color/30"
      >
        <span className="truncate font-semibold">{value}</span>
        <ChevronDown size={10} className={`text-text-secondary shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-surface-1 border border-border-default rounded-xl shadow-lg p-1 max-h-48 overflow-y-auto custom-scrollbar flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100">
          {stages.map((st, idx) => {
            const isSelected = st === value;
            const isFocused = idx === focusedIndex;
            return (
              <button
                key={st}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(st);
                  setIsOpen(false);
                }}
                onMouseEnter={() => setFocusedIndex(idx)}
                className={`w-full text-left px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors block truncate cursor-pointer ${
                  isSelected ? "bg-accent-color/10 text-accent-color font-bold" : 
                  isFocused ? "bg-surface-2 text-text-primary" : "text-text-primary hover:bg-surface-2"
                }`}
              >
                {st}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface Deal {
  id: number | string;
  title: string;
  company: string;
  value: number;
  stage: string;
  priority: 'High' | 'Medium' | 'Low';
  owner: string;
  closeDate: string;
  createdAt?: string;
}

interface PipelineStage {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  probability: number;
}

export default function PipelineView({ onLoaded }: { onLoaded?: () => void } = {}) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getPipelineStages(), getDeals()]).then(([stagesData, dealsData]) => {
      const sortedStages = (Array.isArray(stagesData) ? stagesData : []).sort((a: any, b: any) => a.sort_order - b.sort_order);
      setStages(sortedStages);

      const mappedDeals = (Array.isArray(dealsData) ? dealsData : []).map(d => {
        const stageObj = sortedStages.find(s => s.id === d.pipeline_stage_id);
        const stageName = stageObj ? stageObj.name : (d.status || 'New');
        return {
          id: d.id,
          title: d.name || 'Untitled Deal',
          company: d.company_name || '',
          value: d.amount ? Number(d.amount) : 0,
          stage: stageName,
          priority: (d.priority || 'Medium') as Deal['priority'],
          owner: d.owner_name || 'Unassigned',
          closeDate: d.expected_close_date || '',
          createdAt: d.created_at || new Date().toISOString()
        };
      });
      setDeals(mappedDeals);
    }).catch(err => {
      console.error("Failed to load pipeline data:", err);
    }).finally(() => {
      setLoading(false);
      onLoaded?.();
    });
  }, []);

  const stageNames = stages.map(s => s.name);

  useEffect(() => {
    const handleOpen = () => {
      setForm({ title: '', company: '', value: 0, stage: stageNames[0] || 'New', priority: 'Medium', owner: '', closeDate: '' });
      setIsAddModalOpen(true);
    };
    window.addEventListener('pulse-open-create-deal-modal', handleOpen);
    return () => window.removeEventListener('pulse-open-create-deal-modal', handleOpen);
  }, [stageNames]);

  const stageProbabilities: Record<string, number> = {};
  stages.forEach(s => { stageProbabilities[s.name] = s.probability / 100; });

  const stageIdByName: Record<string, string> = {};
  stages.forEach(s => { stageIdByName[s.name] = s.id; });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  const [form, setForm] = useState({
    title: '', company: '', value: 0, stage: '', priority: 'Medium' as Deal['priority'], owner: '', closeDate: ''
  });

  const [draggedId, setDraggedId] = useState<number | string | null>(null);
  const [pendingStageChange, setPendingStageChange] = useState<{
    dealId: number | string;
    stageId: string;
    stageName: string;
  } | null>(null);

  const [closeReason, setCloseReason] = useState('');
  const [isSavingStage, setIsSavingStage] = useState(false);

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('pulse-crm-view-mode-deals') as any) || 'kanban';
    }
    return 'kanban';
  });

  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [sortField, setSortField] = useState<string>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchIndex, setActiveSearchIndex] = useState(-1);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [ownerSearchQuery, setOwnerSearchQuery] = useState('');

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return deals.filter(d => 
      d.title.toLowerCase().includes(q) || 
      d.company.toLowerCase().includes(q) || 
      (d.owner || '').toLowerCase().includes(q)
    );
  }, [deals, searchQuery]);

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-accent-color/20 text-accent-color font-bold rounded-sm px-0.5">{part}</mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getAvatarBgColor = (name: string) => {
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
      'bg-blue-500 text-white font-bold',
      'bg-green-500 text-white font-bold',
      'bg-yellow-500 text-slate-800 font-bold',
      'bg-purple-500 text-white font-bold',
      'bg-pink-500 text-white font-bold',
      'bg-indigo-500 text-white font-bold',
      'bg-teal-500 text-white font-bold',
    ];
    return colors[hash % colors.length];
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (!showSearchDropdown || searchResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSearchIndex(prev => (prev + 1) % searchResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSearchIndex(prev => (prev - 1 + searchResults.length) % searchResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeSearchIndex >= 0 && activeSearchIndex < searchResults.length) {
        const selected = searchResults[activeSearchIndex];
        setSelectedDeal(selected);
        setIsEditModalOpen(true);
        setShowSearchDropdown(false);
        setSearchQuery('');
      }
    } else if (e.key === 'Escape') {
      setShowSearchDropdown(false);
    }
  };

  const [priorityFilter, setPriorityFilter] = useState('All');
  const [ownerFilter, setOwnerFilter] = useState('All');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isOwnerDropdownOpen, setIsOwnerDropdownOpen] = useState(false);

  const toggleViewMode = (mode: 'kanban' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('pulse-crm-view-mode-deals', mode);
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

  const handleDeleteSelectedDeals = async () => {
    if (!window.confirm(`Are you sure you want to delete the ${selectedIds.size} selected deal(s)?`)) return;
    try {
      for (const id of Array.from(selectedIds)) {
        await deleteDeal(id);
      }
      setDeals(prev => prev.filter(deal => !selectedIds.has(deal.id)));
      setSelectedIds(new Set());
      toast.success("Selected deals deleted successfully.");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to delete selected deals.");
    }
  };

  const uniqueOwners = React.useMemo(() => {
    const owners = new Set<string>();
    deals.forEach(d => { if (d.owner) owners.add(d.owner); });
    return Array.from(owners).sort();
  }, [deals]);

  const filteredDeals = React.useMemo(() => {
    return deals.filter(deal => {
      const matchesSearch = 
        deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deal.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (deal.owner || '').toLowerCase().includes(searchQuery.toLowerCase());
        
      const matchesPriority = priorityFilter === 'All' || deal.priority === priorityFilter;
      const matchesOwner = ownerFilter === 'All' || deal.owner === ownerFilter;
      
      return matchesSearch && matchesPriority && matchesOwner;
    });
  }, [deals, searchQuery, priorityFilter, ownerFilter]);

  const sortedDeals = React.useMemo(() => {
    return [...filteredDeals].sort((a: any, b: any) => {
      let valA: any = (a[sortField] || '').toString().toLowerCase();
      let valB: any = (b[sortField] || '').toString().toLowerCase();
      if (sortField === 'value') {
        valA = Number(a[sortField]) || 0;
        valB = Number(b[sortField]) || 0;
      }
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredDeals, sortField, sortOrder]);

  const totalValue = filteredDeals.reduce((acc, d) => {
    const stage = stages.find(s => s.name === d.stage);
    if (stage && stage.slug !== 'lost') return acc + d.value;
    return acc;
  }, 0);
  const weightedForecast = filteredDeals.reduce((acc, d) => acc + (d.value * (stageProbabilities[d.stage] || 0)), 0);

  const getAISuggestion = (deal: Deal) => {
    if (deal.stage === 'Proposal' && deal.priority === 'High') {
      return "Critical Deal: Proposal sent 3 days ago. Schedule a proposal review session immediately.";
    }
    if (deal.stage === 'Negotiation') {
      return "Close Date approaching. Send the contract agreement link to confirm legal alignment.";
    }
    if (deal.priority === 'Low' && deal.stage === 'Qualified') {
      return "Nurture track: Send standard developer sandboxing API resources.";
    }
    return "Check in with stakeholders to maintain deal velocity.";
  };

  const handleDragStart = (id: number | string) => {
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const isClosingStage = (stageName: string) => {
    const stage = stages.find(s => s.name === stageName);
    const slug = String(stage?.slug || '').toLowerCase();

    return (
      slug === 'won' ||
      slug === 'lost' ||
      stageName.toLowerCase() === 'won' ||
      stageName.toLowerCase() === 'lost'
    );
  };

  const handleDrop = async (stageName: string) => {
    if (draggedId === null) return;

    const stageId = stageIdByName[stageName];
    if (!stageId) {
      setDraggedId(null);
      return;
    }

    // Won/Lost requires a close reason from the backend.
    if (isClosingStage(stageName)) {
      setPendingStageChange({
        dealId: draggedId,
        stageId,
        stageName,
      });
      setCloseReason('');
      setDraggedId(null);
      return;
    }

    // For normal stages, move card instantly (optimistic update).
    const originalStage = deals.find(d => d.id === draggedId)?.stage;
    setDeals(prev =>
      prev.map(d =>
        d.id === draggedId
          ? { ...d, stage: stageName }
          : d
      )
    );
    setDraggedId(null);

    try {
      await updateDealStage(draggedId, stageId);
    } catch (err: any) {
      // Revert on failure
      if (originalStage) {
        setDeals(prev =>
          prev.map(d =>
            d.id === draggedId
              ? { ...d, stage: originalStage }
              : d
          )
        );
      }
      console.error('Failed to update deal stage:', err);
      toast.error(err?.message || 'Failed to update deal stage.');
    }
  };

  const confirmStageChange = async () => {
    if (!pendingStageChange) return;

    const reason = closeReason.trim();

    if (!reason) {
      toast.error('Please enter a close reason.');
      return;
    }

    const originalStage = deals.find(d => d.id === pendingStageChange.dealId)?.stage;
    const stageName = pendingStageChange.stageName;
    const dealId = pendingStageChange.dealId;

    // Move card instantly (optimistic update)
    setDeals(prev =>
      prev.map(d =>
        d.id === dealId
          ? { ...d, stage: stageName }
          : d
      )
    );
    toast.success(`Deal moved to ${stageName}.`);
    setPendingStageChange(null);
    setCloseReason('');
    setIsSavingStage(true);

    try {
      await updateDealStage(dealId, pendingStageChange.stageId, reason);
    } catch (err: any) {
      // Revert on failure
      if (originalStage) {
        setDeals(prev =>
          prev.map(d =>
            d.id === dealId
              ? { ...d, stage: originalStage }
              : d
          )
        );
      }
      console.error('Failed to update deal stage:', err);
      toast.error(err?.message || 'Failed to update deal stage.');
    } finally {
      setIsSavingStage(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const stageId = stageIdByName[form.stage];
      const created = await createDeal({
        name: form.title,
        amount: form.value,
        pipeline_stage_id: stageId || undefined,
        priority: form.priority,
        expected_close_date: form.closeDate || undefined,
      });
      const newDeal: Deal = {
        id: created?.id || Date.now(),
        title: form.title,
        company: form.company,
        value: Number(form.value),
        stage: form.stage,
        priority: form.priority,
        owner: form.owner,
        closeDate: form.closeDate,
        createdAt: created?.created_at || new Date().toISOString()
      };
      setDeals([...deals, newDeal]);
    } catch (err) {
      console.error("Failed to create deal:", err);
    }
    setIsAddModalOpen(false);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeal) return;
    try {
      const stageId = stageIdByName[form.stage];
      await updateDeal(selectedDeal.id, {
        name: form.title,
        amount: form.value,
        pipeline_stage_id: stageId || undefined,
        priority: form.priority,
        expected_close_date: form.closeDate || undefined,
      });
      setDeals(deals.map(d => d.id === selectedDeal.id ? {
        ...d,
        title: form.title,
        company: form.company,
        value: Number(form.value),
        stage: form.stage,
        priority: form.priority,
        owner: form.owner,
        closeDate: form.closeDate
      } : d));
    } catch (err) {
      console.error("Failed to update deal:", err);
    }
    setIsEditModalOpen(false);
    setSelectedDeal(null);
  };

  const handleDelete = async (id: number | string) => {
    const deal = deals.find(d => d.id === id);
    const confirmed = window.confirm(
      `Delete "${deal?.title || 'this deal'}"? The linked contact and company will also be removed if they have no other active deals.`
    );
    if (!confirmed) return;
    try {
      await deleteDeal(id);
      setDeals(deals.filter(d => d.id !== id));
    } catch (err) {
      console.error("Failed to delete deal:", err);
    }
  };

  return (
    <SkeletonLoader isLoading={loading} layout={viewMode === 'kanban' ? 'kanban' : 'table'}>
    <div className="space-y-6">
      <div className="bg-surface-1 border border-border-default rounded-2xl p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="font-sans text-2xl text-text-primary font-bold">Deals Kanban Pipeline</h2>
            <p className="text-[11px] text-text-muted mt-0.5 font-semibold">Drag and drop cards to update pipeline stages, track forecasts, and monitor deal velocity.</p>
          </div>
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center border border-border-default rounded-lg overflow-hidden p-0.5 bg-surface-2/50 shrink-0 select-none">
              <button
                type="button"
                onClick={() => toggleViewMode('kanban')}
                className={`p-1.5 rounded-md transition cursor-pointer ${
                  viewMode === 'kanban'
                    ? 'bg-surface-1 text-accent-color shadow-sm font-bold'
                    : 'text-text-muted hover:text-text-primary'
                }`}
                title="Kanban View"
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
                onClick={handleDeleteSelectedDeals}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-status-danger hover:bg-status-danger/90 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer mr-2"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Selected ({selectedIds.size})</span>
              </button>
            )}

            <button 
              onClick={() => {
                setForm({ title: '', company: '', value: 0, stage: stageNames[0] || 'New', priority: 'Medium', owner: '', closeDate: '' });
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-accent-color hover:bg-accent-color/90 text-surface-0 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Deal</span>
            </button>
          </div>
        </div>

        {/* Search, Sort, and Filters Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t border-border-default">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-text-muted">
              <Search className="h-3.5 w-3.5" />
            </span>
            <input 
              type="text" 
              placeholder="Search deals by title, company, owner..." 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
                setActiveSearchIndex(-1);
              }}
              onFocus={() => setShowSearchDropdown(true)}
              onKeyDown={handleSearchKeyDown}
              className="w-full pl-8 pr-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent-color focus:border-accent-color bg-surface-2/15 transition-all"
            />
            {/* Search Dropdown Overlay */}
            {showSearchDropdown && searchResults.length > 0 && (
              <>
                <div 
                  className="fixed inset-0 z-35" 
                  onClick={() => setShowSearchDropdown(false)} 
                />
                <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-surface-1 border border-border-default rounded-xl shadow-lg p-1.5 max-h-60 overflow-y-auto custom-scrollbar flex flex-col gap-0.5">
                  {searchResults.map((deal, idx) => {
                    const isActive = idx === activeSearchIndex;
                    return (
                      <button
                        key={deal.id}
                        type="button"
                        onClick={() => {
                          setSelectedDeal(deal);
                          setIsEditModalOpen(true);
                          setShowSearchDropdown(false);
                          setSearchQuery('');
                        }}
                        onMouseEnter={() => setActiveSearchIndex(idx)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs flex justify-between items-center transition cursor-pointer ${
                          isActive ? 'bg-surface-2 text-accent-color font-semibold' : 'text-text-primary hover:bg-surface-2/60'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-bold truncate select-none">
                            {highlightMatch(deal.title, searchQuery)}
                          </p>
                          <p className="text-[10px] text-text-secondary mt-0.5 truncate select-none">
                            Company: <span className="font-semibold text-text-primary">{highlightMatch(deal.company, searchQuery)}</span> · Owner: <span className="font-semibold text-text-primary">{highlightMatch(deal.owner || 'Unassigned', searchQuery)}</span>
                          </p>
                        </div>
                        <span className="text-[10px] font-bold text-accent-color shrink-0 tabular-nums bg-accent-muted px-2 py-0.5 rounded-md border border-accent-color/10">
                          {formatINR(deal.value)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Priority Filter */}
            <div className="relative">
              <button
                type="button"
                onClick={() => { setIsFilterDropdownOpen(!isFilterDropdownOpen); setIsOwnerDropdownOpen(false); }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  priorityFilter !== 'All' ? 'bg-accent-color/10 border-accent-color/30 text-accent-color' : 'border-border-default bg-surface-1 hover:bg-surface-2 text-text-primary'
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>{priorityFilter !== 'All' ? `Priority: ${priorityFilter}` : 'Filter Priority'}</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isFilterDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 z-30 bg-surface-1 border border-border-default rounded-xl shadow-lg p-1.5 min-w-[150px]">
                  {['All', 'High', 'Medium', 'Low'].map(prio => (
                    <button
                      key={prio}
                      onClick={() => { setPriorityFilter(prio); setIsFilterDropdownOpen(false); }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        priorityFilter === prio ? 'bg-accent-color/10 text-accent-color font-bold' : 'text-text-primary hover:bg-surface-2'
                      }`}
                    >
                      {prio === 'All' ? 'All Priorities' : prio}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Owner Filter */}
            <div className="relative">
              <button
                type="button"
                onClick={() => { setIsOwnerDropdownOpen(!isOwnerDropdownOpen); setIsFilterDropdownOpen(false); }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  ownerFilter !== 'All' ? 'bg-accent-color/10 border-accent-color/30 text-accent-color' : 'border-border-default bg-surface-1 hover:bg-surface-2 text-text-primary'
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>{ownerFilter !== 'All' ? `Owner: ${ownerFilter}` : 'Filter Owner'}</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${isOwnerDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOwnerDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 z-30 bg-surface-1 border border-border-default rounded-xl shadow-lg p-2 min-w-[200px] w-56 flex flex-col gap-2">
                  {/* Internal Search input */}
                  <div className="relative" onClick={e => e.stopPropagation()}>
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-text-secondary" />
                    <input
                      type="text"
                      placeholder="Search owners..."
                      value={ownerSearchQuery}
                      onChange={(e) => setOwnerSearchQuery(e.target.value)}
                      className="w-full pl-7 pr-2.5 py-1 border border-border-default rounded-lg text-[10px] text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-color/30 bg-surface-2/20"
                    />
                  </div>

                  <div className="max-h-48 overflow-y-auto custom-scrollbar flex flex-col gap-0.5 pr-0.5">
                    <button
                      type="button"
                      onClick={() => { 
                        setOwnerFilter('All'); 
                        setIsOwnerDropdownOpen(false); 
                        setOwnerSearchQuery('');
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-2 ${
                        ownerFilter === 'All' ? 'bg-accent-color/10 text-accent-color font-bold' : 'text-text-primary hover:bg-surface-2'
                      }`}
                    >
                      <div className="size-5 rounded-full bg-accent-muted text-accent-color flex items-center justify-center text-[8px] font-extrabold shrink-0 border border-accent-color/10">
                        ALL
                      </div>
                      <span className="truncate">All Owners</span>
                    </button>
                    
                    {uniqueOwners
                      .filter(own => own.toLowerCase().includes(ownerSearchQuery.toLowerCase()))
                      .map(own => (
                        <button
                          key={own}
                          type="button"
                          onClick={() => { 
                            setOwnerFilter(own); 
                            setIsOwnerDropdownOpen(false); 
                            setOwnerSearchQuery('');
                          }}
                          className={`w-full text-left px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-2 ${
                            ownerFilter === own ? 'bg-accent-color/10 text-accent-color font-bold' : 'text-text-primary hover:bg-surface-2'
                          }`}
                        >
                          <div className={`size-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 border border-black/5 select-none ${getAvatarBgColor(own)}`}>
                            {getInitials(own)}
                          </div>
                          <span className="truncate flex-1">{own}</span>
                        </button>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5 pt-4 border-t border-border-default">
          <div className="flex items-center space-x-3 bg-surface-2 p-3 rounded-lg border border-border-default">
            <div className="h-8.5 w-8.5 rounded-lg bg-surface-2 flex items-center justify-center text-accent-color border border-border-default">
              <IndianRupee className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-[9px] font-semibold text-text-muted uppercase">Total Pipeline Value</p>
              <p className="text-sm font-semibold text-text-primary tabular-nums">{formatINR(totalValue)}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 bg-surface-2 p-3 rounded-lg border border-border-default">
            <div className="h-8.5 w-8.5 rounded-lg bg-surface-2 flex items-center justify-center text-accent-color border border-border-default">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-[9px] font-semibold text-text-muted uppercase">Weighted Revenue Forecast</p>
              <p className="text-sm font-semibold text-text-primary tabular-nums">{formatINR(Math.round(weightedForecast))}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 bg-accent-color/5 p-3 rounded-lg border border-border-default">
            <Sparkles className="h-4.5 w-4.5 text-accent-color" />
            <div>
              <p className="text-[9px] font-semibold text-text-primary uppercase">AI Co-pilot Status</p>
              <p className="text-[10px] text-text-muted font-semibold leading-tight">Click on deal details to read next-best-action alerts.</p>
            </div>
          </div>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="bg-surface-1 border border-border-default rounded-2xl p-5">
          <div className="overflow-y-auto max-h-[600px] border border-border-default/60 rounded-xl bg-surface-1 custom-scrollbar">
            <table className="w-full border-collapse text-left table-fixed">
              <thead className="sticky top-0 bg-surface-1 z-10 border-b border-border-default shadow-[0_1px_0_0_rgba(0,0,0,0.02)] select-none">
                <tr className="text-[11px] uppercase font-black tracking-wider text-text-primary border-b border-border-default bg-surface-2/40">
                  <th className="py-3 px-4 w-[4%] text-left">
                    <input 
                      type="checkbox" 
                      checked={sortedDeals.length > 0 && selectedIds.size === sortedDeals.length}
                      onChange={() => handleToggleSelectAll(sortedDeals)}
                      className="rounded border-border-default text-accent-color focus:ring-accent-color cursor-pointer size-3.5"
                    />
                  </th>
                  <th className="py-3 px-2 w-[20%] cursor-pointer hover:text-text-primary" onClick={() => handleHeaderClick('title')}>Deal Title</th>
                  <th className="py-3 px-2 w-[16%] cursor-pointer hover:text-text-primary" onClick={() => handleHeaderClick('company')}>Company</th>
                  <th className="py-3 px-2 w-[10%] cursor-pointer hover:text-text-primary" onClick={() => handleHeaderClick('value')}>Value (₹)</th>
                  <th className="py-3 px-2 w-[12%] cursor-pointer hover:text-text-primary" onClick={() => handleHeaderClick('stage')}>Stage</th>
                  <th className="py-3 px-2 w-[10%] cursor-pointer hover:text-text-primary text-center">Probability %</th>
                  <th className="py-3 px-2 w-[14%] cursor-pointer hover:text-text-primary" onClick={() => handleHeaderClick('closeDate')}>Expected Close</th>
                  <th className="py-3 px-2 w-[9%] cursor-pointer hover:text-text-primary" onClick={() => handleHeaderClick('priority')}>Priority</th>
                  <th className="py-3 px-2 w-[10%] cursor-pointer hover:text-text-primary" onClick={() => handleHeaderClick('owner')}>Owner</th>
                  <th className="py-3 px-2 w-[5%] text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-xs text-text-primary font-medium">
                {sortedDeals.length > 0 ? (
                  sortedDeals.map((deal) => {
                    const prob = Math.round((stageProbabilities[deal.stage] || 0) * 100);
                    const isRowSelected = selectedIds.has(deal.id);
                    return (
                      <tr 
                        key={deal.id}
                        className={`hover:bg-surface-2/20 transition border-b border-border-default/40 ${isRowSelected ? 'bg-accent-color/[0.02]' : ''}`}
                      >
                        <td className="py-3.5 px-4 text-left" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="checkbox" 
                            checked={isRowSelected}
                            onChange={() => handleToggleSelectRow(deal.id)}
                            className="rounded border-border-default text-accent-color focus:ring-accent-color cursor-pointer size-3.5"
                          />
                        </td>
                        <td className="py-3.5 px-2 font-bold truncate" title={deal.title}>{deal.title}</td>
                        <td className="py-3.5 px-2 text-text-muted truncate" title={deal.company}>{deal.company}</td>
                        <td className="py-3.5 px-2 tabular-nums font-semibold">₹{deal.value.toLocaleString('en-IN')}</td>
                        <td className="py-3.5 px-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-accent-color/10 text-accent-color border-accent-color/15 inline-block truncate max-w-full" title={deal.stage}>
                            {deal.stage}
                          </span>
                        </td>
                        <td className="py-3.5 px-2 text-center tabular-nums">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border inline-block ${
                            prob >= 70 ? 'bg-status-success/10 text-status-success border-status-success/15' :
                            prob >= 40 ? 'bg-status-warning/10 text-status-warning border-status-warning/15' :
                            'bg-surface-2 text-text-muted border-border-default'
                          }`}>
                            {prob}%
                          </span>
                        </td>
                        <td className="py-3.5 px-2 text-text-muted tabular-nums truncate">{deal.closeDate || '—'}</td>
                        <td className="py-3.5 px-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border inline-block ${
                            deal.priority === 'High' ? 'bg-status-warning/10 text-status-warning border-status-warning/15' :
                            deal.priority === 'Low' ? 'bg-surface-2 text-text-muted border-border-default' :
                            'bg-accent-color/10 text-accent-color border-accent-color/15'
                          }`}>
                            {deal.priority}
                          </span>
                        </td>
                        <td className="py-3.5 px-2 text-text-muted truncate" title={deal.owner}>{deal.owner}</td>
                        <td className="py-3.5 px-2 text-right pr-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-1.5">
                            <button 
                              onClick={() => {
                                setSelectedDeal(deal);
                                setForm({ title: deal.title, company: deal.company, value: deal.value, stage: deal.stage, priority: deal.priority, owner: deal.owner, closeDate: deal.closeDate });
                                setIsEditModalOpen(true);
                              }}
                              className="p-1 text-text-muted hover:text-text-primary hover:bg-surface-2 rounded transition-colors cursor-pointer"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDelete(deal.id)}
                              className="p-1 text-text-muted hover:text-destructive hover:bg-destructive/10 rounded transition-colors cursor-pointer"
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
                    <td colSpan={10} className="py-8 text-center text-text-muted">
                      No deals found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex space-x-4 overflow-x-auto pb-4" style={{ scrollbarWidth: 'thin', scrollbarColor: 'hsl(var(--border)) transparent' }}>
          {stages.map((stage) => {
            const stageDeals = filteredDeals.filter(d => d.stage === stage.name);
            const stageSum = stageDeals.reduce((sum, d) => sum + d.value, 0);

            return (
              <div 
                key={stage.id}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(stage.name)}
                className="bg-surface-2 border border-border-default rounded-2xl p-3 w-72 shrink-0 flex flex-col"
              >
              <div className="flex justify-between items-center pb-2 border-b border-border-default mb-3">
                <div>
                  <h3 className="text-[11px] font-semibold text-text-primary uppercase tracking-wider">{stage.name}</h3>
                  <p className="text-[10px] text-text-muted font-semibold mt-0.5 tabular-nums">₹{stageSum.toLocaleString()}</p>
                </div>
                <span className="text-[9px] font-semibold bg-accent-color/10 text-accent-color px-1.5 py-0.5 rounded-full tabular-nums">
                  {stageDeals.length}
                </span>
              </div>

              <div className="flex-1 space-y-3 pr-1">
                {stageDeals.map((deal) => (
                  <div 
                    key={deal.id}
                    draggable
                    onDragStart={() => handleDragStart(deal.id)}
                    onClick={() => {
                      setSelectedDeal(deal);
                      setForm({
                        title: deal.title,
                        company: deal.company,
                        value: deal.value,
                        stage: deal.stage,
                        priority: deal.priority,
                        owner: deal.owner,
                        closeDate: deal.closeDate
                      });
                      setIsEditModalOpen(true);
                    }}
                    className="bg-surface-1 border border-border-default rounded-xl p-3 hover:shadow-nav hover:-translate-y-0.5 transition duration-200 cursor-pointer select-none overflow-visible"
                  >
                    <div className="flex justify-between items-start gap-1">
                      <h4 className="text-[11px] font-semibold text-text-primary leading-tight truncate flex-1 pr-1.5" title={deal.title}>{deal.title}</h4>
                      <span className={`text-[8px] font-bold px-1 py-0.25 rounded shrink-0 ${
                        deal.priority === 'High' ? 'text-status-danger bg-status-danger/10' :
                        deal.priority === 'Medium' ? 'text-status-warning bg-status-warning/10' : 'text-text-muted bg-surface-2'
                      }`}>{deal.priority}</span>
                    </div>

                    <div className="text-[10px] text-text-muted mt-1 flex items-center">
                      <Building2 className="h-3 w-3 mr-1 text-text-muted" />
                      {deal.company}
                    </div>

                    {deal.createdAt && (
                      <div className="text-[9px] text-text-muted mt-1 flex items-center gap-1">
                        <CalendarDays className="h-2.5 w-2.5 text-text-muted/70" />
                        <span>Created: {new Date(deal.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </div>
                    )}

                    <div className="mt-3.5 pt-2.5 border-t border-border-default flex justify-between items-center">
                      <span className="text-[11px] font-semibold text-text-primary tabular-nums">₹{deal.value.toLocaleString()}</span>
                      
                      <div className="flex space-x-1">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDeal(deal);
                            setForm({
                              title: deal.title,
                              company: deal.company,
                              value: deal.value,
                              stage: deal.stage,
                              priority: deal.priority,
                              owner: deal.owner,
                              closeDate: deal.closeDate
                            });
                            setIsEditModalOpen(true);
                          }}
                          className="p-0.5 text-text-muted hover:text-text-primary rounded"
                          title="Edit Deal"
                        >
                          <Edit className="h-3 w-3" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(deal.id);
                          }}
                          className="p-0.5 text-text-muted hover:text-destructive rounded"
                           title="Delete Deal (cascades to contact and company if no other active deals)"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-2 border-t border-border-default pt-1.5">
                      <span className="text-[8px] font-semibold text-text-muted uppercase tracking-wider mb-1 block">Shift Stage:</span>
                      <StageDropdown
                        value={deal.stage}
                        stages={stageNames}
                        onChange={(newStage) => {
                          const stageId = stageIdByName[newStage];

                          if (!stageId) return;

                          if (isClosingStage(newStage)) {
                            setPendingStageChange({
                              dealId: deal.id,
                              stageId,
                              stageName: newStage,
                            });
                            setCloseReason('');
                            return;
                          }

                          // Move card instantly (optimistic update)
                          const origStage = deal.stage;
                          setDeals(prev =>
                            prev.map(d =>
                              d.id === deal.id
                                ? { ...d, stage: newStage }
                                : d
                            )
                          );
                          updateDealStage(deal.id, stageId).catch((err: any) => {
                            // Revert on failure
                            setDeals(prev =>
                              prev.map(d =>
                                d.id === deal.id
                                  ? { ...d, stage: origStage }
                                  : d
                              )
                            );
                            console.error('Failed to update deal stage:', err);
                            toast.error(err?.message || 'Failed to update deal stage.');
                          });
                        }}
                        className="w-28 shrink-0"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
          })}
        </div>
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-surface-1 border border-border-default rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-border-default flex justify-between items-center bg-surface-2">
              <h3 className="font-semibold text-text-primary text-sm">Create New Deal</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-text-muted hover:text-text-primary p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleAdd} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Deal Title</label>
                  <input type="text" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary focus:outline-none bg-surface-0" />
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Company</label>
                  <input type="text" required value={form.company} onChange={e => setForm({...form, company: e.target.value})} className="w-full px-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary focus:outline-none bg-surface-0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Value (₹)</label>
                  <input type="number" required value={form.value} onChange={e => setForm({...form, value: Number(e.target.value)})} className="w-full px-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary focus:outline-none bg-surface-0" />
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Stage</label>
                  <StageDropdown
                    value={form.stage}
                    stages={stageNames}
                    onChange={(val) => setForm({...form, stage: val})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Priority</label>
                  <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value as any})} className="w-full px-2 py-1.5 border border-border-default bg-surface-0 text-text-primary rounded-lg text-xs cursor-pointer">
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Close Date</label>
                  <input type="date" value={form.closeDate} onChange={e => setForm({...form, closeDate: e.target.value})} className="w-full px-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary focus:outline-none bg-surface-0 cursor-pointer" />
                </div>
              </div>
              <div className="pt-3 border-t border-border-default flex justify-end space-x-2.5">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-1.5 border border-border-default rounded-lg text-xs font-semibold text-text-primary hover:bg-surface-2 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-accent-color hover:bg-accent-color/90 text-surface-0 rounded-lg text-xs font-semibold  cursor-pointer">Save Deal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-surface-1 border border-border-default rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-border-default flex justify-between items-center bg-surface-2">
              <h3 className="font-semibold text-text-primary text-sm">Edit Deal Details</h3>
              <button onClick={() => { setIsEditModalOpen(false); setSelectedDeal(null); }} className="text-text-muted hover:text-text-primary p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleEdit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Deal Title</label>
                  <input type="text" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary focus:outline-none bg-surface-0" />
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Company</label>
                  <input type="text" required value={form.company} onChange={e => setForm({...form, company: e.target.value})} className="w-full px-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary focus:outline-none bg-surface-0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Value (₹)</label>
                  <input type="number" required value={form.value} onChange={e => setForm({...form, value: Number(e.target.value)})} className="w-full px-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary focus:outline-none bg-surface-0" />
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Stage</label>
                  <StageDropdown
                    value={form.stage}
                    stages={stageNames}
                    onChange={(val) => setForm({...form, stage: val})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Priority</label>
                  <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value as any})} className="w-full px-2 py-1.5 border border-border-default bg-surface-0 text-text-primary rounded-lg text-xs cursor-pointer">
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Close Date</label>
                  <input type="date" value={form.closeDate} onChange={e => setForm({...form, closeDate: e.target.value})} className="w-full px-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary focus:outline-none bg-surface-0 cursor-pointer" />
                </div>
              </div>
              {selectedDeal && (
                <div className="mt-3.5 bg-accent-color/5 border border-border-default rounded-xl p-3.5 flex items-start space-x-2">
                  <Sparkles className="h-4.5 w-4.5 text-accent-color shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[10px] font-semibold text-text-primary uppercase tracking-wider">AI Copilot Recommendation</h4>
                    <p className="text-[10px] text-text-muted mt-1 leading-relaxed font-semibold">{getAISuggestion(selectedDeal)}</p>
                  </div>
                </div>
              )}
              <div className="pt-3 border-t border-border-default flex justify-end space-x-2.5">
                <button type="button" onClick={() => { setIsEditModalOpen(false); setSelectedDeal(null); }} className="px-4 py-1.5 border border-border-default rounded-lg text-xs font-semibold text-text-primary hover:bg-surface-2 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-accent-color hover:bg-accent-color/90 text-surface-0 rounded-lg text-xs font-semibold  cursor-pointer">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {pendingStageChange && (
  <div
    className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200"
    onClick={() => {
      if (!isSavingStage) {
        setPendingStageChange(null);
        setCloseReason('');
      }
    }}
  >
    <div
      className="bg-surface-1 border border-border-default rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
      onClick={e => e.stopPropagation()}
    >
      <div className="px-5 py-3.5 border-b border-border-default flex justify-between items-center bg-surface-2">
        <div>
          <h3 className="font-semibold text-text-primary text-sm">
            Close Deal
          </h3>

          <p className="text-[10px] text-text-muted mt-0.5">
            Moving this deal to {pendingStageChange.stageName}
          </p>
        </div>

        <button
          type="button"
          disabled={isSavingStage}
          onClick={() => {
            setPendingStageChange(null);
            setCloseReason('');
          }}
          className="text-text-muted hover:text-text-primary p-1 cursor-pointer disabled:opacity-50"
        >
          <X className="h-4.5 w-4.5" />
        </button>
      </div>

      <div className="p-5 space-y-4">
        <div>
          <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">
            Close Reason *
          </label>

          <textarea
            autoFocus
            required
            value={closeReason}
            onChange={e => setCloseReason(e.target.value)}
            placeholder={
              pendingStageChange.stageName.toLowerCase() === 'won'
                ? 'e.g. Customer signed the agreement'
                : 'e.g. Customer selected another vendor'
            }
            className="w-full min-h-[90px] px-3 py-2 border border-border-default rounded-lg text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-color/20 bg-surface-0 resize-none"
            disabled={isSavingStage}
          />
        </div>

        <div className="pt-3 border-t border-border-default flex justify-end space-x-2.5">
          <button
            type="button"
            disabled={isSavingStage}
            onClick={() => {
              setPendingStageChange(null);
              setCloseReason('');
            }}
            className="px-4 py-1.5 border border-border-default rounded-lg text-xs font-semibold text-text-primary hover:bg-surface-2 cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isSavingStage || !closeReason.trim()}
            onClick={confirmStageChange}
            className="px-4 py-1.5 bg-accent-color hover:bg-accent-color/90 text-surface-0 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50"
          >
            {isSavingStage ? 'Saving...' : `Move to ${pendingStageChange.stageName}`}
          </button>
        </div>
      </div>
    </div>
  </div>
)}
    </div>
    </SkeletonLoader>
  );
}

