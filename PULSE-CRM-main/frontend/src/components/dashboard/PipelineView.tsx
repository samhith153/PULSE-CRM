'use client';

import React, { useState, useEffect } from 'react';
import { getDeals, updateDealStage, createDeal, updateDeal, deleteDeal, getPipelineStages } from '@/utils/api';
import { 
  Plus, 
  IndianRupee, 
  TrendingUp, 
  Sparkles, 
  X, 
  Edit, 
  Trash2, 
  Building2,
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

export default function PipelineView() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stages, setStages] = useState<PipelineStage[]>([]);

  useEffect(() => {
    getPipelineStages().then(data => {
      const sorted = (data as any[]).sort((a: any, b: any) => a.sort_order - b.sort_order);
      setStages(sorted);
    }).catch(() => {});
    getDeals().then(data => {
      setDeals(data as any);
    });
  }, []);

  const stageNames = stages.map(s => s.name);

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5 pt-4 border-t border-border">
          <div className="flex items-center space-x-3 bg-secondary p-3 rounded-lg border border-border">
            <div className="h-8.5 w-8.5 rounded-lg bg-secondary flex items-center justify-center text-brand-purple border border-border">
              <IndianRupee className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-[9px] font-semibold text-muted-foreground uppercase">Total Pipeline Value</p>
              <p className="text-sm font-semibold text-foreground tabular-nums">${totalValue.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 bg-secondary p-3 rounded-lg border border-border">
            <div className="h-8.5 w-8.5 rounded-lg bg-secondary flex items-center justify-center text-brand-purple border border-border">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-[9px] font-semibold text-muted-foreground uppercase">Weighted Revenue Forecast</p>
              <p className="text-sm font-semibold text-foreground tabular-nums">${Math.round(weightedForecast).toLocaleString()}</p>
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
                  <p className="text-[10px] text-muted-foreground font-semibold mt-0.5 tabular-nums">${stageSum.toLocaleString()}</p>
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
                      <span className="text-[11px] font-semibold text-foreground tabular-nums">${deal.value.toLocaleString()}</span>
                      
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
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Value ($)</label>
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
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Value ($)</label>
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

