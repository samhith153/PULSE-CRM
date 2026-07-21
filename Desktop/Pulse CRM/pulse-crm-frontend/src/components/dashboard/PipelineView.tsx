'use client';

import React, { useState, useEffect } from 'react';
import { getDeals, updateDealStage } from '@/utils/api';
import { 
  Plus, 
  IndianRupee, 
  TrendingUp, 
  Sparkles, 
  X, 
  Edit, 
  Trash2, 
  MoveRight,
  AlertCircle,
  Building2,
  Calendar
} from 'lucide-react';

interface Deal {
  id: number | string;
  title: string;
  company: string;
  value: number;
  stage: 'Qualified' | 'Proposal' | 'Under Review' | 'Won' | 'Lost';
  priority: 'High' | 'Medium' | 'Low';
  owner: string;
  closeDate: string;
}

export default function PipelineView() {
  const [deals, setDeals] = useState<Deal[]>([]);

  useEffect(() => {
    getDeals().then(data => {
      setDeals(data as any);
    });
  }, []);

  const stages: Deal['stage'][] = ['Qualified', 'Proposal', 'Under Review', 'Won', 'Lost'];

  const stageProbabilities: Record<Deal['stage'], number> = {
    'Qualified': 0.1,
    'Proposal': 0.4,
    'Under Review': 0.7,
    'Won': 1.0,
    'Lost': 0.0
  };

  // State for modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  // Form state
  const [form, setForm] = useState({
    title: '', company: '', value: 0, stage: 'Qualified' as Deal['stage'], priority: 'Medium' as Deal['priority'], owner: 'Sarah Johnson', closeDate: ''
  });

  // Drag and drop states
  const [draggedId, setDraggedId] = useState<number | string | null>(null);

  // Calculating pipeline statistics
  const totalValue = deals.reduce((acc, d) => d.stage !== 'Lost' ? acc + d.value : acc, 0);
  const weightedForecast = deals.reduce((acc, d) => acc + (d.value * stageProbabilities[d.stage]), 0);

  const getAISuggestion = (deal: Deal) => {
    if (deal.stage === 'Proposal' && deal.priority === 'High') {
      return "Critical Deal: Proposal sent 3 days ago. Schedule a proposal review session immediately.";
    }
    if (deal.stage === 'Under Review') {
      return "Close Date approaching. Send the contract agreement link to confirm legal alignment.";
    }
    if (deal.priority === 'Low' && deal.stage === 'Qualified') {
      return "Nurture track: Send standard developer sandboxing API resources.";
    }
    return "Check in with stakeholders to maintain deal velocity.";
  };

  // HTML5 Drag handlers
  const handleDragStart = (id: number | string) => {
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (stage: Deal['stage']) => {
    if (draggedId === null) return;
    setDeals(deals.map(d => d.id === draggedId ? { ...d, stage } : d));
    
    // Commit update to backend if stage maps to seeded UUIDs
    const stageIds: Record<string, string> = {
      'Qualified': 'd1f60c42-b0c6-4767-88ea-d4b68e9f2918',
      'Proposal': 'e2f50c42-b0c6-4767-88ea-d4b68e9f2919',
      'Under Review': 'f3f40c42-b0c6-4767-88ea-d4b68e9f2920',
      'Won': 'a4f30c42-b0c6-4767-88ea-d4b68e9f2921',
      'Lost': 'b5f20c42-b0c6-4767-88ea-d4b68e9f2922'
    };
    const stageId = stageIds[stage];
    if (stageId) {
      updateDealStage(draggedId, stageId).catch(err => console.warn("Failed to update deal stage in backend", err));
    }
    
    setDraggedId(null);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const newDeal: Deal = {
      id: Date.now(),
      title: form.title,
      company: form.company,
      value: Number(form.value),
      stage: form.stage,
      priority: form.priority,
      owner: form.owner,
      closeDate: form.closeDate || '2025-06-30'
    };
    setDeals([...deals, newDeal]);
    setIsAddModalOpen(false);
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeal) return;
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
    setIsEditModalOpen(false);
    setSelectedDeal(null);
  };

  const handleDelete = (id: number | string) => {
    setDeals(deals.filter(d => d.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="font-sans text-2xl text-brand-heading font-bold">Deals Kanban Pipeline</h2>
            <p className="text-[11px] text-brand-text/60 mt-0.5 font-bold">Drag and drop cards to update pipeline stages, track forecasts, and monitor deal velocity.</p>
          </div>
          <button 
            onClick={() => {
              setForm({ title: '', company: '', value: 10000, stage: 'Qualified', priority: 'Medium', owner: 'Sarah Johnson', closeDate: '' });
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Deal</span>
          </button>
        </div>

        {/* Stats and Forecasting cards summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5 pt-4 border-t border-brand-border-purple/15">
          <div className="flex items-center space-x-3 bg-slate-50/50 p-3 rounded-lg border border-brand-border-purple/15">
            <div className="h-8.5 w-8.5 rounded-lg bg-brand-sidebar-hover/10 flex items-center justify-center text-brand-accent border border-brand-border-purple/20">
              <IndianRupee className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-[9px] font-extrabold text-brand-text/60 uppercase">Total Pipeline Value</p>
              <p className="text-sm font-extrabold text-brand-heading tabular-nums">${totalValue.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 bg-slate-50/50 p-3 rounded-lg border border-brand-border-purple/15">
            <div className="h-8.5 w-8.5 rounded-lg bg-brand-sidebar-hover/10 flex items-center justify-center text-brand-accent border border-brand-border-purple/20">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-[9px] font-extrabold text-brand-text/60 uppercase">Weighted Revenue Forecast</p>
              <p className="text-sm font-extrabold text-brand-heading tabular-nums">${Math.round(weightedForecast).toLocaleString()}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 bg-brand-sidebar-hover/20 p-3 rounded-lg border border-brand-border-purple/30">
            <Sparkles className="h-4.5 w-4.5 text-brand-accent" />
            <div>
              <p className="text-[9px] font-extrabold text-brand-heading uppercase">AI Co-pilot Status</p>
              <p className="text-[10px] text-brand-text/80 font-bold leading-tight">Click on deal details to read next-best-action alerts.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Stages Horizontal scroll container */}
      <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-brand-border-purple/20 scrollbar-track-transparent">
        {stages.map((stage) => {
          const stageDeals = deals.filter(d => d.stage === stage);
          const stageSum = stageDeals.reduce((sum, d) => sum + d.value, 0);

          return (
            <div 
              key={stage}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(stage)}
              className="bg-slate-50/50 border border-brand-border-purple/20 rounded-xl p-3 w-72 shrink-0 flex flex-col h-[550px]"
            >
              {/* Stage Header */}
              <div className="flex justify-between items-center pb-2 border-b border-brand-border-purple/15 mb-3">
                <div>
                  <h3 className="text-[11px] font-extrabold text-brand-heading uppercase tracking-wider">{stage}</h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5 tabular-nums">${stageSum.toLocaleString()}</p>
                </div>
                <span className="text-[9px] font-extrabold bg-brand-secondary-accent/15 text-brand-accent px-1.5 py-0.5 rounded-full tabular-nums">
                  {stageDeals.length}
                </span>
              </div>

              {/* Deal Cards Container */}
              <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {stageDeals.map((deal) => (
                  <div 
                    key={deal.id}
                    draggable
                    onDragStart={() => handleDragStart(deal.id)}
                    className="bg-white border border-brand-border-purple/20 rounded-lg p-3 shadow-sm/5 hover:border-brand-border-purple/40 hover:-translate-y-0.5 transition-all duration-200 cursor-grab active:cursor-grabbing"
                  >
                    <div className="flex justify-between items-start gap-1">
                      <h4 className="text-[11px] font-extrabold text-brand-heading leading-tight truncate flex-1 pr-1.5" title={deal.title}>{deal.title}</h4>
                      <span className={`text-[8px] font-bold px-1 py-0.25 rounded shrink-0 ${
                        deal.priority === 'High' ? 'text-rose-700 bg-rose-50' :
                        deal.priority === 'Medium' ? 'text-amber-700 bg-amber-50' : 'text-slate-500 bg-slate-50'
                      }`}>{deal.priority}</span>
                    </div>

                    <div className="text-[10px] text-brand-text/60 mt-1 flex items-center">
                      <Building2 className="h-3 w-3 mr-1 text-slate-400" />
                      {deal.company}
                    </div>

                    <div className="mt-3.5 pt-2.5 border-t border-brand-border-purple/10 flex justify-between items-center">
                      <span className="text-[11px] font-extrabold text-brand-heading tabular-nums">${deal.value.toLocaleString()}</span>
                      
                      {/* Control buttons */}
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
                          className="p-0.5 text-slate-400 hover:text-brand-heading rounded"
                          title="Edit Deal"
                        >
                          <Edit className="h-3 w-3" />
                        </button>
                        <button 
                          onClick={() => handleDelete(deal.id)}
                          className="p-0.5 text-slate-400 hover:text-rose-600 rounded"
                          title="Delete Deal"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Stage shift trigger for responsive/mobile layouts */}
                    <div className="mt-2 flex justify-between items-center text-[9px] font-bold text-brand-accent/80 border-t border-brand-border-purple/10 pt-1.5">
                      <span>Shift Stage:</span>
                      <select 
                        value={deal.stage}
                        onChange={(e) => {
                          setDeals(deals.map(d => d.id === deal.id ? { ...d, stage: e.target.value as any } : d));
                        }}
                        className="bg-transparent text-brand-accent focus:outline-none cursor-pointer"
                      >
                        {stages.map(st => (
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

      {/* Add Deal Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-brand-border-purple/25 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-brand-border-purple/15 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-brand-heading text-sm">Create New Deal</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-brand-text p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleAdd} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Deal Title</label>
                  <input type="text" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Company</label>
                  <input type="text" required value={form.company} onChange={e => setForm({...form, company: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Value ($)</label>
                  <input type="number" required value={form.value} onChange={e => setForm({...form, value: Number(e.target.value)})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Stage</label>
                  <select value={form.stage} onChange={e => setForm({...form, stage: e.target.value as any})} className="w-full px-2 py-1.5 border border-brand-border-purple/35 bg-white text-brand-text rounded-lg text-xs cursor-pointer">
                    {stages.map(st => <option key={st}>{st}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Priority</label>
                  <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value as any})} className="w-full px-2 py-1.5 border border-brand-border-purple/35 bg-white text-brand-text rounded-lg text-xs cursor-pointer">
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Close Date</label>
                  <input type="date" value={form.closeDate} onChange={e => setForm({...form, closeDate: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text focus:outline-none cursor-pointer" />
                </div>
              </div>
              <div className="pt-3 border-t border-brand-border-purple/15 flex justify-end space-x-2.5">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-1.5 border border-brand-border-purple/30 rounded-lg text-xs font-bold text-brand-text/75 hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-lg text-xs font-bold shadow-sm/10 cursor-pointer">Save Deal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Deal Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-brand-border-purple/25 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-brand-border-purple/15 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-brand-heading text-sm">Edit Deal Details</h3>
              <button onClick={() => { setIsEditModalOpen(false); setSelectedDeal(null); }} className="text-slate-400 hover:text-brand-text p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleEdit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Deal Title</label>
                  <input type="text" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Company</label>
                  <input type="text" required value={form.company} onChange={e => setForm({...form, company: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Value ($)</label>
                  <input type="number" required value={form.value} onChange={e => setForm({...form, value: Number(e.target.value)})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Stage</label>
                  <select value={form.stage} onChange={e => setForm({...form, stage: e.target.value as any})} className="w-full px-2 py-1.5 border border-brand-border-purple/35 bg-white text-brand-text rounded-lg text-xs cursor-pointer">
                    {stages.map(st => <option key={st}>{st}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Priority</label>
                  <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value as any})} className="w-full px-2 py-1.5 border border-brand-border-purple/35 bg-white text-brand-text rounded-lg text-xs cursor-pointer">
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Close Date</label>
                  <input type="date" value={form.closeDate} onChange={e => setForm({...form, closeDate: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text focus:outline-none cursor-pointer" />
                </div>
              </div>
              {selectedDeal && (
                <div className="mt-3.5 bg-brand-sidebar-hover/20 border border-brand-border-purple/30 rounded-xl p-3.5 flex items-start space-x-2">
                  <Sparkles className="h-4.5 w-4.5 text-brand-accent shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[10px] font-extrabold text-brand-heading uppercase tracking-wider">AI Copilot Recommendation</h4>
                    <p className="text-[10px] text-brand-text/80 mt-1 leading-relaxed font-bold">{getAISuggestion(selectedDeal)}</p>
                  </div>
                </div>
              )}
              <div className="pt-3 border-t border-brand-border-purple/15 flex justify-end space-x-2.5">
                <button type="button" onClick={() => { setIsEditModalOpen(false); setSelectedDeal(null); }} className="px-4 py-1.5 border border-brand-border-purple/30 rounded-lg text-xs font-bold text-brand-text/75 hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-lg text-xs font-bold shadow-sm/10 cursor-pointer">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
