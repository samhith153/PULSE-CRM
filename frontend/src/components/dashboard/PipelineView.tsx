'use client';

import React, { useState, useEffect } from 'react';
import { getDeals, updateDealStage, createDeal, updateDeal, deleteDeal, getPipelineStages } from '@/utils/api';
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
      const sorted = (data as any[]).sort((a: any, b: any) => a.sort_order - b.sort_order);
      setStages(sorted);
    }).catch(() => {}).finally(checkDone);
    getDeals().then(data => {
      setDeals(data as any);
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

  const sortedDeals = React.useMemo(() => {
    return [...deals].sort((a: any, b: any) => {
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
  }, [deals, sortField, sortOrder]);

  const totalValue = deals.reduce((acc, d) => {
    const stage = stages.find(s => s.name === d.stage);
    if (stage && stage.slug !== 'lost') return acc + d.value;
    return acc;
  }, 0);
  const weightedForecast = deals.reduce((acc, d) => acc + (d.value * (stageProbabilities[d.stage] || 0)), 0);

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
        closeDate: form.closeDate
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
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="font-sans text-2xl text-foreground font-bold">Deals Kanban Pipeline</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-semibold">Drag and drop cards to update pipeline stages, track forecasts, and monitor deal velocity.</p>
          </div>
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center border border-border rounded-lg overflow-hidden p-0.5 bg-secondary/50 shrink-0 select-none">
              <button
                type="button"
                onClick={() => toggleViewMode('kanban')}
                className={`p-1.5 rounded-md transition-all cursor-pointer ${
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
                className={`p-1.5 rounded-md transition-all cursor-pointer ${
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
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-brand-purple hover:bg-brand-purple/90 text-primary-foreground rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Deal</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5 pt-4 border-t border-border">
          <div className="flex items-center space-x-3 bg-secondary p-3 rounded-lg border border-border">
            <div className="h-8.5 w-8.5 rounded-lg bg-secondary flex items-center justify-center text-brand-purple border border-border">
              <IndianRupee className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-[9px] font-semibold text-muted-foreground uppercase">Total Pipeline Value</p>
              <p className="text-sm font-semibold text-foreground tabular-nums">{formatINR(totalValue)}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 bg-secondary p-3 rounded-lg border border-border">
            <div className="h-8.5 w-8.5 rounded-lg bg-secondary flex items-center justify-center text-brand-purple border border-border">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-[9px] font-semibold text-muted-foreground uppercase">Weighted Revenue Forecast</p>
              <p className="text-sm font-semibold text-foreground tabular-nums">{formatINR(Math.round(weightedForecast))}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 bg-brand-purple/5 p-3 rounded-lg border border-border">
            <Sparkles className="h-4.5 w-4.5 text-brand-purple" />
            <div>
              <p className="text-[9px] font-semibold text-foreground uppercase">AI Co-pilot Status</p>
              <p className="text-[10px] text-muted-foreground font-semibold leading-tight">Click on deal details to read next-best-action alerts.</p>
            </div>
          </div>
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
                        className={`hover:bg-secondary/20 transition-all border-b border-border/40 ${isRowSelected ? 'bg-brand-blue/[0.02]' : ''}`}
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
        <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-brand-border-purple/20 scrollbar-track-transparent">
          {stages.map((stage) => {
            const stageDeals = deals.filter(d => d.stage === stage.name);
            const stageSum = stageDeals.reduce((sum, d) => sum + d.value, 0);

            return (
              <div 
                key={stage.id}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(stage.name)}
                className="bg-secondary border border-border rounded-2xl p-3 w-72 shrink-0 flex flex-col h-[550px]"
              >
              <div className="flex justify-between items-center pb-2 border-b border-border mb-3">
                <div>
                  <h3 className="text-[11px] font-semibold text-foreground uppercase tracking-wider">{stage.name}</h3>
                  <p className="text-[10px] text-muted-foreground font-semibold mt-0.5 tabular-nums">₹{stageSum.toLocaleString()}</p>
                </div>
                <span className="text-[9px] font-semibold bg-brand-purple/10 text-brand-purple px-1.5 py-0.5 rounded-full tabular-nums">
                  {stageDeals.length}
                </span>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {stageDeals.map((deal) => (
                  <div 
                    key={deal.id}
                    draggable
                    onDragStart={() => handleDragStart(deal.id)}
                    className="bg-card border border-border rounded-xl p-3 hover:shadow-nav hover:-translate-y-0.5 transition-all duration-200 cursor-grab active:cursor-grabbing"
                  >
                    <div className="flex justify-between items-start gap-1">
                      <h4 className="text-[11px] font-semibold text-foreground leading-tight truncate flex-1 pr-1.5" title={deal.title}>{deal.title}</h4>
                      <span className={`text-[8px] font-bold px-1 py-0.25 rounded shrink-0 ${
                        deal.priority === 'High' ? 'text-destructive bg-destructive/10' :
                        deal.priority === 'Medium' ? 'text-amber-700 bg-amber-50' : 'text-muted-foreground bg-secondary'
                      }`}>{deal.priority}</span>
                    </div>

                    <div className="text-[10px] text-muted-foreground mt-1 flex items-center">
                      <Building2 className="h-3 w-3 mr-1 text-muted-foreground" />
                      {deal.company}
                    </div>

                    <div className="mt-3.5 pt-2.5 border-t border-border flex justify-between items-center">
                      <span className="text-[11px] font-semibold text-foreground tabular-nums">₹{deal.value.toLocaleString()}</span>
                      
                      <div className="flex space-x-1">
                        <button 
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
                          className="p-0.5 text-muted-foreground hover:text-foreground rounded"
                          title="Edit Deal"
                        >
                          <Edit className="h-3 w-3" />
                        </button>
                        <button 
                          onClick={() => handleDelete(deal.id)}
                          className="p-0.5 text-muted-foreground hover:text-destructive rounded"
                           title="Delete Deal (cascades to contact and company if no other active deals)"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-2 flex justify-between items-center text-[9px] font-semibold text-muted-foreground border-t border-border pt-1.5">
                      <span>Shift Stage:</span>
                      <select 
                        value={deal.stage}
                        onChange={(e) => {
                          const newStage = e.target.value;
                          const stageId = stageIdByName[newStage];
                          setDeals(deals.map(d => d.id === deal.id ? { ...d, stage: newStage } : d));
                          if (stageId) {
                            updateDealStage(deal.id, stageId).catch(() => {});
                          }
                        }}
                        className="bg-transparent text-brand-purple focus:outline-none cursor-pointer"
                      >
                        {stageNames.map(st => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
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

