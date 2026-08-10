'use client';

import React, { useState, useEffect } from 'react';
import { getDeals, updateDealStage, createDeal, updateDeal, deleteDeal, getPipelineStages, formatINR } from '@/utils/api';
import { toast } from '@/lib/toast';
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
  Layers,
  Inbox,
  ArrowUpRight,
  User,
  ArrowRight,
  ClipboardList,
  Target,
  Trophy,
  LineChart
} from 'lucide-react';

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

  useEffect(() => {
    let loaded = 0;
    const checkDone = () => { loaded++; if (loaded >= 2) onLoaded?.(); };
    getPipelineStages().then(data => {
      const sorted = (Array.isArray(data) ? data : []).sort((a: any, b: any) => a.sort_order - b.sort_order);
      setStages(sorted);
    }).catch(() => {}).finally(checkDone);
    getDeals({ silent: true }).then((data: any) => {
      setDeals(Array.isArray(data) ? (data as Deal[]) : []);
    }).catch(() => {}).finally(checkDone);
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

  const handleDrop = (stageName: string) => {
    if (draggedId === null) return;
    const stageId = stageIdByName[stageName];
    setDeals(deals.map(d => d.id === draggedId ? { ...d, stage: stageName } : d));
    if (stageId) {
      updateDealStage(draggedId, stageId).catch(err => console.warn("Failed to update deal stage", err));
    }
    setDraggedId(null);
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-brand-purple/10 flex items-center justify-center text-brand-purple shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-sans text-2xl text-foreground font-bold tracking-tight">Deals Kanban Pipeline</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-semibold">Drag and drop cards to update pipeline stages, track forecasts, and monitor deal velocity.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center border border-border rounded-lg overflow-hidden p-0.5 bg-secondary/50 shrink-0 select-none">
              <button
                type="button"
                onClick={() => toggleViewMode('kanban')}
                className={`p-1.5 rounded-md transition cursor-pointer ${
                  viewMode === 'kanban'
                    ? 'bg-card text-brand-purple shadow-sm font-bold'
                    : 'text-muted-foreground hover:text-foreground'
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
                    ? 'bg-card text-brand-purple shadow-sm font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="List Table View"
              >
                <List size={14} />
              </button>
            </div>
            {selectedIds.size > 0 && (
              <button 
                onClick={handleDeleteSelectedDeals}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer mr-2"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Selected ({selectedIds.size})</span>
              </button>
            )}

            <button 
              onClick={() => {
                setForm({ title: '', company: '', value: 10000, stage: stageNames[0] || 'Qualified', priority: 'Medium', owner: '', closeDate: '' });
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-brand-purple hover:bg-brand-purple/90 text-primary-foreground rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Deal</span>
              <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-70" />
            </button>
          </div>
        </div>

        {/* Search, Sort, and Filters Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-muted-foreground">
              <Search className="h-3.5 w-3.5" />
            </span>
            <input 
              type="text" 
              placeholder="Search deals by title, company, owner..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-border rounded-lg text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand-purple/20 bg-secondary/15"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Priority Filter */}
            <div className="relative">
              <button
                type="button"
                onClick={() => { setIsFilterDropdownOpen(!isFilterDropdownOpen); setIsOwnerDropdownOpen(false); }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  priorityFilter !== 'All' ? 'bg-brand-purple/10 border-brand-purple/30 text-brand-purple' : 'border-border bg-card hover:bg-secondary text-foreground'
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>{priorityFilter !== 'All' ? `Priority: ${priorityFilter}` : 'Filter Priority'}</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isFilterDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 z-30 bg-card border border-border rounded-xl shadow-lg p-1.5 min-w-[150px]">
                  {['All', 'High', 'Medium', 'Low'].map(prio => (
                    <button
                      key={prio}
                      onClick={() => { setPriorityFilter(prio); setIsFilterDropdownOpen(false); }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        priorityFilter === prio ? 'bg-brand-purple/10 text-brand-purple font-bold' : 'text-foreground hover:bg-secondary'
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
                  ownerFilter !== 'All' ? 'bg-brand-purple/10 border-brand-purple/30 text-brand-purple' : 'border-border bg-card hover:bg-secondary text-foreground'
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>{ownerFilter !== 'All' ? `Owner: ${ownerFilter}` : 'Filter Owner'}</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${isOwnerDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOwnerDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 z-30 bg-card border border-border rounded-xl shadow-lg p-1.5 min-w-[180px] max-h-60 overflow-y-auto">
                  <button
                    onClick={() => { setOwnerFilter('All'); setIsOwnerDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer mb-0.5 ${
                      ownerFilter === 'All' ? 'bg-brand-purple/10 text-brand-purple font-bold' : 'text-foreground hover:bg-secondary'
                    }`}
                  >
                    All Owners
                  </button>
                  {uniqueOwners.map(own => (
                    <button
                      key={own}
                      onClick={() => { setOwnerFilter(own); setIsOwnerDropdownOpen(false); }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        ownerFilter === own ? 'bg-brand-purple/10 text-brand-purple font-bold' : 'text-foreground hover:bg-secondary'
                      }`}
                    >
                      {own}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6 mb-6">
          {/* Total Pipeline Value */}
          <div className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between relative overflow-hidden shadow-sm">
            <div className="flex gap-4 z-10 relative">
              <div className="w-12 h-12 rounded-xl bg-brand-purple/10 flex items-center justify-center text-brand-purple shrink-0 mt-1">
                <IndianRupee className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Pipeline Value</p>
                <p className="text-2xl font-bold text-foreground tabular-nums mb-1">{formatINR(totalValue)}</p>
                <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" />
                  + 18.2% <span className="text-muted-foreground font-medium ml-1">vs last 30 days</span>
                </p>
              </div>
            </div>
            {/* Fake Sparkline SVG */}
            <svg className="absolute right-0 bottom-0 w-32 h-20 opacity-80" viewBox="0 0 100 50" preserveAspectRatio="none">
              <path d="M0,45 L15,35 L30,40 L45,25 L60,35 L80,15 L100,5" fill="none" stroke="hsl(267, 100%, 65%)" strokeWidth="2.5" />
              <path d="M0,45 L15,35 L30,40 L45,25 L60,35 L80,15 L100,5 L100,50 L0,50 Z" fill="url(#purple-grad)" />
              <defs>
                <linearGradient id="purple-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(267, 100%, 65%)" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="hsl(267, 100%, 65%)" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Weighted Revenue Forecast */}
          <div className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between relative overflow-hidden shadow-sm">
            <div className="flex gap-4 z-10 relative">
              <div className="w-12 h-12 rounded-xl bg-brand-purple/10 flex items-center justify-center text-brand-purple shrink-0 mt-1">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Weighted Revenue Forecast</p>
                <p className="text-2xl font-bold text-foreground tabular-nums mb-1">{formatINR(Math.round(weightedForecast))}</p>
                <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" />
                  + 14.7% <span className="text-muted-foreground font-medium ml-1">vs last 30 days</span>
                </p>
              </div>
            </div>
            {/* Fake Sparkline SVG */}
            <svg className="absolute right-0 bottom-0 w-32 h-20 opacity-80" viewBox="0 0 100 50" preserveAspectRatio="none">
              <path d="M0,40 L20,38 L35,45 L55,20 L75,25 L90,10 L100,5" fill="none" stroke="hsl(150, 80%, 40%)" strokeWidth="2.5" />
              <path d="M0,40 L20,38 L35,45 L55,20 L75,25 L90,10 L100,5 L100,50 L0,50 Z" fill="url(#green-grad)" />
              <defs>
                <linearGradient id="green-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(150, 80%, 40%)" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="hsl(150, 80%, 40%)" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* AI Co-Pilot */}
          <div className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between shadow-sm gap-4">
            <div className="flex gap-4">
              <div className="mt-1">
                <Sparkles className="h-6 w-6 text-brand-purple" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">AI Co-Pilot</p>
                <p className="text-[11px] text-foreground font-semibold leading-relaxed">
                  Monitor deal health, get next-best-action recommendations and alerts.
                </p>
              </div>
            </div>
            <button className="shrink-0 inline-flex items-center space-x-1.5 px-3 py-1.5 bg-brand-purple/10 hover:bg-brand-purple/20 text-brand-purple rounded-xl text-xs font-bold transition-colors cursor-pointer">
              <span>View AI Insights</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

      {viewMode === 'list' ? (
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="overflow-y-auto max-h-[600px] border border-border/60 rounded-xl bg-card custom-scrollbar">
            <table className="w-full border-collapse text-left table-fixed">
              <thead className="sticky top-0 bg-card z-10 border-b border-border shadow-[0_1px_0_0_rgba(0,0,0,0.02)] select-none">
                <tr className="text-[11px] uppercase font-black tracking-wider text-foreground border-b border-border bg-muted/40">
                  <th className="py-3 px-4 w-[4%] text-left">
                    <input 
                      type="checkbox" 
                      checked={sortedDeals.length > 0 && selectedIds.size === sortedDeals.length}
                      onChange={() => handleToggleSelectAll(sortedDeals)}
                      className="rounded border-border text-brand-purple focus:ring-brand-purple cursor-pointer size-3.5"
                    />
                  </th>
                  <th className="py-3 px-2 w-[20%] cursor-pointer hover:text-foreground" onClick={() => handleHeaderClick('title')}>Deal Title</th>
                  <th className="py-3 px-2 w-[16%] cursor-pointer hover:text-foreground" onClick={() => handleHeaderClick('company')}>Company</th>
                  <th className="py-3 px-2 w-[10%] cursor-pointer hover:text-foreground" onClick={() => handleHeaderClick('value')}>Value (₹)</th>
                  <th className="py-3 px-2 w-[12%] cursor-pointer hover:text-foreground" onClick={() => handleHeaderClick('stage')}>Stage</th>
                  <th className="py-3 px-2 w-[10%] cursor-pointer hover:text-foreground text-center">Probability %</th>
                  <th className="py-3 px-2 w-[14%] cursor-pointer hover:text-foreground" onClick={() => handleHeaderClick('closeDate')}>Expected Close</th>
                  <th className="py-3 px-2 w-[9%] cursor-pointer hover:text-foreground" onClick={() => handleHeaderClick('priority')}>Priority</th>
                  <th className="py-3 px-2 w-[10%] cursor-pointer hover:text-foreground" onClick={() => handleHeaderClick('owner')}>Owner</th>
                  <th className="py-3 px-2 w-[5%] text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-xs text-foreground font-medium">
                {sortedDeals.length > 0 ? (
                  sortedDeals.map((deal) => {
                    const prob = Math.round((stageProbabilities[deal.stage] || 0) * 100);
                    const isRowSelected = selectedIds.has(deal.id);
                    return (
                      <tr 
                        key={deal.id}
                        className={`hover:bg-secondary/20 transition border-b border-border/40 ${isRowSelected ? 'bg-brand-blue/[0.02]' : ''}`}
                      >
                        <td className="py-3.5 px-4 text-left" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="checkbox" 
                            checked={isRowSelected}
                            onChange={() => handleToggleSelectRow(deal.id)}
                            className="rounded border-border text-brand-purple focus:ring-brand-purple cursor-pointer size-3.5"
                          />
                        </td>
                        <td className="py-3.5 px-2 font-bold truncate" title={deal.title}>{deal.title}</td>
                        <td className="py-3.5 px-2 text-muted-foreground truncate" title={deal.company}>{deal.company}</td>
                        <td className="py-3.5 px-2 tabular-nums font-semibold">₹{deal.value.toLocaleString('en-IN')}</td>
                        <td className="py-3.5 px-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-brand-purple/10 text-brand-purple border-brand-purple/15 inline-block truncate max-w-full" title={deal.stage}>
                            {deal.stage}
                          </span>
                        </td>
                        <td className="py-3.5 px-2 text-center tabular-nums">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border inline-block ${
                            prob >= 70 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/15' :
                            prob >= 40 ? 'bg-amber-500/10 text-amber-500 border-amber-500/15' :
                            'bg-secondary text-muted-foreground border-border'
                          }`}>
                            {prob}%
                          </span>
                        </td>
                        <td className="py-3.5 px-2 text-muted-foreground tabular-nums truncate">{deal.closeDate || '—'}</td>
                        <td className="py-3.5 px-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border inline-block ${
                            deal.priority === 'High' ? 'bg-amber-500/10 text-amber-500 border-amber-500/15' :
                            deal.priority === 'Low' ? 'bg-secondary text-muted-foreground border-border' :
                            'bg-brand-purple/10 text-brand-purple border-brand-purple/15'
                          }`}>
                            {deal.priority}
                          </span>
                        </td>
                        <td className="py-3.5 px-2 text-muted-foreground truncate" title={deal.owner}>{deal.owner}</td>
                        <td className="py-3.5 px-2 text-right pr-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-1.5">
                            <button 
                              onClick={() => {
                                setSelectedDeal(deal);
                                setForm({ title: deal.title, company: deal.company, value: deal.value, stage: deal.stage, priority: deal.priority, owner: deal.owner, closeDate: deal.closeDate });
                                setIsEditModalOpen(true);
                              }}
                              className="p-1 text-muted-foreground hover:text-foreground hover:bg-secondary rounded transition-colors cursor-pointer"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDelete(deal.id)}
                              className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors cursor-pointer"
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
                    <td colSpan={10} className="py-8 text-center text-muted-foreground">
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
          {stages.map((stage, index) => {
            const sl = stage.name.toLowerCase();
            const colorClass = 
              sl.includes('new') || index === 0 ? { border: 'border-purple-500', bgText: 'bg-purple-100 text-purple-600', text: 'text-purple-600', outline: 'border-purple-300 bg-purple-50/50' } :
              sl.includes('qualif') || index === 1 ? { border: 'border-blue-500', bgText: 'bg-blue-100 text-blue-600', text: 'text-blue-600', outline: 'border-blue-300 bg-blue-50/50' } :
              sl.includes('propos') || index === 2 ? { border: 'border-amber-500', bgText: 'bg-amber-100 text-amber-600', text: 'text-amber-600', outline: 'border-amber-300 bg-amber-50/50' } :
              sl.includes('negot') || index === 3 ? { border: 'border-emerald-500', bgText: 'bg-emerald-100 text-emerald-600', text: 'text-emerald-600', outline: 'border-emerald-300 bg-emerald-50/50' } :
              { border: 'border-slate-500', bgText: 'bg-slate-100 text-slate-600', text: 'text-slate-600', outline: 'border-slate-300 bg-slate-50/50' };

            const stageDeals = filteredDeals.filter(d => d.stage === stage.name);
            const stageSum = stageDeals.reduce((sum, d) => sum + d.value, 0);

            return (
              <div 
                key={stage.id}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(stage.name)}
                className={`bg-card border border-border border-t-[3px] shadow-sm rounded-2xl p-3 w-[290px] shrink-0 flex flex-col h-[600px] ${colorClass.border}`}
              >
              <div className="flex justify-between items-start mb-4 px-1">
                <div>
                  <h3 className="text-xs font-black text-foreground uppercase tracking-wider">{stage.name}</h3>
                  <p className="text-[12px] text-foreground font-bold mt-1 tabular-nums">
                    {stageSum === 0 ? '₹0' : `₹${stageSum.toLocaleString('en-IN')}`}
                  </p>
                </div>
                <span className={`text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full tabular-nums shrink-0 ${colorClass.bgText}`}>
                  {stageDeals.length}
                </span>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto pr-1 pb-2 custom-scrollbar">
                {stageDeals.length === 0 ? (
                  <div className={`h-56 border border-dashed rounded-xl flex flex-col items-center justify-center text-center p-4 ${colorClass.outline}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${colorClass.bgText}`}>
                      <Inbox className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-foreground">No deals yet</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">Drag deals here</p>
                    <button 
                      onClick={() => {
                        setForm({ title: '', company: '', value: 10000, stage: stage.name, priority: 'Medium', owner: '', closeDate: '' });
                        setIsAddModalOpen(true);
                      }}
                      className={`mt-4 text-[11px] font-bold cursor-pointer hover:underline ${colorClass.text}`}
                    >
                      + Create Deal
                    </button>
                  </div>
                ) : (
                  stageDeals.map((deal) => {
                    const isWon = deal.stage.toLowerCase() === 'won';
                    const isLost = deal.stage.toLowerCase() === 'lost';
                    const borderLeft = isWon ? 'border-l-[4px] border-l-emerald-500' : isLost ? 'border-l-[4px] border-l-rose-500' : '';

                    return (
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
                        className={`bg-card border border-border rounded-xl p-4 hover:shadow-md hover:-translate-y-0.5 transition duration-200 cursor-pointer select-none flex flex-col gap-3.5 group ${borderLeft}`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="text-xs font-bold text-foreground leading-tight break-words">{deal.title}</h4>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                            deal.priority === 'High' ? 'text-rose-600 bg-rose-50' :
                            deal.priority === 'Medium' ? 'text-amber-600 bg-amber-50' : 'text-slate-500 bg-slate-100'
                          }`}>{deal.priority}</span>
                        </div>

                        <div className="space-y-1.5">
                          <div className="text-[10px] text-muted-foreground font-medium flex items-center">
                            <Building2 className="h-3 w-3 mr-1.5 opacity-70" />
                            <span className="truncate">{deal.company}</span>
                          </div>
                          {deal.createdAt && (
                            <div className="text-[10px] text-muted-foreground font-medium flex items-center">
                              <CalendarDays className="h-3 w-3 mr-1.5 opacity-70" />
                              {new Date(deal.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </div>
                          )}
                        </div>

                        <div className="flex justify-between items-center mt-1">
                          <span className="text-[13px] font-bold text-foreground tabular-nums">₹{deal.value.toLocaleString('en-IN')}</span>
                          
                          <div className="flex space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
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
                              className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
                              title="Edit Deal"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(deal.id);
                              }}
                              className="p-1 text-muted-foreground hover:text-destructive rounded transition-colors"
                              title="Delete Deal (cascades to contact and company if no other active deals)"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-[10px] font-medium text-muted-foreground pt-3 border-t border-border">
                          <span>Shift Stage:</span>
                          <div className="flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors relative">
                            <select 
                              value={deal.stage}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                e.stopPropagation();
                                const newStage = e.target.value;
                                const stageId = stageIdByName[newStage];
                                setDeals(deals.map(d => d.id === deal.id ? { ...d, stage: newStage } : d));
                                if (stageId) {
                                  updateDealStage(deal.id, stageId).catch(() => {});
                                }
                              }}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full"
                            >
                              {stageNames.map(st => (
                                <option key={st} value={st}>{st}</option>
                              ))}
                            </select>
                            <span className="text-foreground font-bold">{deal.stage}</span>
                            <ChevronDown className="h-3 w-3 text-foreground" />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
          })}
        </div>
      )}

      {/* Bottom Summary Metrics */}
      <div className="bg-card border border-border rounded-2xl p-5 mt-6 shadow-sm flex flex-wrap lg:flex-nowrap items-center justify-between gap-6 overflow-hidden">
        {[
          { label: 'Total Deals', value: String(filteredDeals.length), sub: 'Across all stages', icon: ClipboardList, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Total Pipeline Value', value: formatINR(totalValue), sub: 'Sum of deal values', icon: IndianRupee, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Avg. Deal Size', value: formatINR(filteredDeals.length > 0 ? totalValue / filteredDeals.length : 0), sub: 'Per deal average', icon: LineChart, color: 'text-purple-500', bg: 'bg-purple-500/10' },
          { label: 'Sales Cycle', value: filteredDeals.length > 0 ? '0 days' : '0 days', sub: 'Average sales cycle', icon: Target, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'Win Rate', value: `${filteredDeals.length > 0 ? Math.round((filteredDeals.filter(d => /won/i.test(d.stage)).length / filteredDeals.length) * 100) : 0}%`, sub: 'Conversion rate', icon: Trophy, color: 'text-teal-500', bg: 'bg-teal-500/10' },
        ].map((metric, i) => (
          <div key={metric.label} className={`flex items-center gap-4 flex-1 ${i > 0 ? 'lg:pl-6 lg:border-l lg:border-border/50' : ''}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${metric.bg} ${metric.color}`}>
              <metric.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">{metric.label}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-xl font-bold text-foreground tabular-nums">{metric.value}</p>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">{metric.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-border">
        <span className="text-xs font-semibold text-muted-foreground">
          Showing 1 to {filteredDeals.length} of {filteredDeals.length} deals
        </span>
        <div className="flex items-center gap-3">
          <div className="flex items-center">
            <button className="w-8 h-8 flex items-center justify-center border border-border bg-card rounded-l-lg text-muted-foreground hover:bg-secondary cursor-pointer transition-colors disabled:opacity-50" disabled>
              <ChevronDown className="w-4 h-4 rotate-90" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center border-y border-border bg-brand-purple/10 text-brand-purple font-bold text-xs cursor-pointer">
              1
            </button>
            <button className="w-8 h-8 flex items-center justify-center border border-border bg-card rounded-r-lg text-muted-foreground hover:bg-secondary cursor-pointer transition-colors disabled:opacity-50" disabled>
              <ChevronDown className="w-4 h-4 -rotate-90" />
            </button>
          </div>
          <select className="border border-border bg-card text-foreground text-xs font-semibold rounded-lg px-2 py-1.5 cursor-pointer focus:outline-none">
            <option>10 / page</option>
            <option>20 / page</option>
            <option>50 / page</option>
          </select>
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-border flex justify-between items-center bg-secondary">
              <h3 className="font-semibold text-foreground text-sm">Create New Deal</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleAdd} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Deal Title</label>
                  <input type="text" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none bg-background" />
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Company</label>
                  <input type="text" required value={form.company} onChange={e => setForm({...form, company: e.target.value})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none bg-background" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Value (₹)</label>
                  <input type="number" required value={form.value} onChange={e => setForm({...form, value: Number(e.target.value)})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none bg-background" />
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Stage</label>
                  <select value={form.stage} onChange={e => setForm({...form, stage: e.target.value})} className="w-full px-2 py-1.5 border border-border bg-background text-foreground rounded-lg text-xs cursor-pointer">
                    {stageNames.map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Priority</label>
                  <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value as any})} className="w-full px-2 py-1.5 border border-border bg-background text-foreground rounded-lg text-xs cursor-pointer">
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Close Date</label>
                  <input type="date" value={form.closeDate} onChange={e => setForm({...form, closeDate: e.target.value})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none bg-background cursor-pointer" />
                </div>
              </div>
              <div className="pt-3 border-t border-border flex justify-end space-x-2.5">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-1.5 border border-border rounded-lg text-xs font-semibold text-foreground hover:bg-secondary cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-brand-purple hover:bg-brand-purple/90 text-primary-foreground rounded-lg text-xs font-semibold  cursor-pointer">Save Deal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-border flex justify-between items-center bg-secondary">
              <h3 className="font-semibold text-foreground text-sm">Edit Deal Details</h3>
              <button onClick={() => { setIsEditModalOpen(false); setSelectedDeal(null); }} className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleEdit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Deal Title</label>
                  <input type="text" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none bg-background" />
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Company</label>
                  <input type="text" required value={form.company} onChange={e => setForm({...form, company: e.target.value})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none bg-background" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Value (₹)</label>
                  <input type="number" required value={form.value} onChange={e => setForm({...form, value: Number(e.target.value)})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none bg-background" />
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Stage</label>
                  <select value={form.stage} onChange={e => setForm({...form, stage: e.target.value})} className="w-full px-2 py-1.5 border border-border bg-background text-foreground rounded-lg text-xs cursor-pointer">
                    {stageNames.map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Priority</label>
                  <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value as any})} className="w-full px-2 py-1.5 border border-border bg-background text-foreground rounded-lg text-xs cursor-pointer">
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Close Date</label>
                  <input type="date" value={form.closeDate} onChange={e => setForm({...form, closeDate: e.target.value})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none bg-background cursor-pointer" />
                </div>
              </div>
              {selectedDeal && (
                <div className="mt-3.5 bg-brand-purple/5 border border-border rounded-xl p-3.5 flex items-start space-x-2">
                  <Sparkles className="h-4.5 w-4.5 text-brand-purple shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[10px] font-semibold text-foreground uppercase tracking-wider">AI Copilot Recommendation</h4>
                    <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed font-semibold">{getAISuggestion(selectedDeal)}</p>
                  </div>
                </div>
              )}
              <div className="pt-3 border-t border-border flex justify-end space-x-2.5">
                <button type="button" onClick={() => { setIsEditModalOpen(false); setSelectedDeal(null); }} className="px-4 py-1.5 border border-border rounded-lg text-xs font-semibold text-foreground hover:bg-secondary cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-brand-purple hover:bg-brand-purple/90 text-primary-foreground rounded-lg text-xs font-semibold  cursor-pointer">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

