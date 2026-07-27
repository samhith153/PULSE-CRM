'use client';

import React, { useState, useEffect } from 'react';
import { getDeals } from '@/utils/api';
import { 
  Plus, IndianRupee, TrendingUp, Sparkles, X, Edit, Trash2, Search, Filter, Building2, Calendar, Award
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

export default function DealsView() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [summaryDealId, setSummaryDealId] = useState<number | string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  const [form, setForm] = useState({
    title: '', company: '', value: 0, stage: 'Qualified' as Deal['stage'], priority: 'Medium' as Deal['priority'], owner: 'Sarah Johnson', closeDate: ''
  });

  useEffect(() => {
    getDeals().then(data => setDeals(data as any));
  }, []);

  const stages: Deal['stage'][] = ['Qualified', 'Proposal', 'Under Review', 'Won', 'Lost'];
  const stageProbabilities: Record<Deal['stage'], number> = {
    'Qualified': 0.1, 'Proposal': 0.4, 'Under Review': 0.7, 'Won': 1.0, 'Lost': 0.0
  };

  const totalValue = deals.reduce((acc, d) => d.stage !== 'Lost' ? acc + d.value : acc, 0);
  const weightedForecast = deals.reduce((acc, d) => acc + (d.value * stageProbabilities[d.stage]), 0);
  const activeDeals = deals.filter(d => d.stage !== 'Lost' && d.stage !== 'Won');

  const filtered = deals.filter(d => {
    const matchSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase()) || d.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStage = stageFilter === 'All' || d.stage === stageFilter;
    return matchSearch && matchStage;
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const newDeal: Deal = {
      id: Date.now(), title: form.title, company: form.company, value: Number(form.value),
      stage: form.stage, priority: form.priority, owner: form.owner, closeDate: form.closeDate || '2025-06-30'
    };
    setDeals([...deals, newDeal]);
    setIsAddModalOpen(false);
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeal) return;
    setDeals(deals.map(d => d.id === selectedDeal.id ? { ...d, title: form.title, company: form.company, value: Number(form.value), stage: form.stage, priority: form.priority, owner: form.owner, closeDate: form.closeDate } : d));
    setIsEditModalOpen(false);
    setSelectedDeal(null);
  };

  const handleDelete = (id: number | string) => {
    setDeals(deals.filter(d => d.id !== id));
    if (summaryDealId === id) setSummaryDealId(null);
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-3 bg-slate-50/50 p-3 rounded-lg border border-brand-border-purple/15">
            <div className="h-8.5 w-8.5 rounded-lg bg-brand-sidebar-hover/10 flex items-center justify-center text-brand-accent border border-brand-border-purple/20">
              <IndianRupee className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-[9px] font-extrabold text-brand-text/60 uppercase">Total Pipeline</p>
              <p className="text-sm font-extrabold text-brand-heading tabular-nums">${totalValue.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 bg-slate-50/50 p-3 rounded-lg border border-brand-border-purple/15">
            <div className="h-8.5 w-8.5 rounded-lg bg-brand-sidebar-hover/10 flex items-center justify-center text-brand-accent border border-brand-border-purple/20">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-[9px] font-extrabold text-brand-text/60 uppercase">Weighted Forecast</p>
              <p className="text-sm font-extrabold text-brand-heading tabular-nums">${Math.round(weightedForecast).toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 bg-slate-50/50 p-3 rounded-lg border border-brand-border-purple/15">
            <div className="h-8.5 w-8.5 rounded-lg bg-brand-sidebar-hover/10 flex items-center justify-center text-amber-600 border border-brand-border-purple/20">
              <Award className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-[9px] font-extrabold text-brand-text/60 uppercase">Active Deals</p>
              <p className="text-sm font-extrabold text-brand-heading tabular-nums">{activeDeals.length}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 bg-brand-sidebar-hover/20 p-3 rounded-lg border border-brand-border-purple/30">
            <Sparkles className="h-4.5 w-4.5 text-brand-accent" />
            <div>
              <p className="text-[9px] font-extrabold text-brand-heading uppercase">AI Co-pilot</p>
              <p className="text-[10px] text-brand-text/80 font-bold">Click a deal for recommendations.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Deals Table */}
      <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="font-sans text-2xl text-brand-heading font-bold">Deals Pipeline</h2>
            <p className="text-[11px] text-brand-text/60 mt-0.5 font-bold">Track active deals, update stages, and monitor revenue metrics in a structured table view.</p>
          </div>
          <button 
            onClick={() => { setForm({ title: '', company: '', value: 10000, stage: 'Qualified', priority: 'Medium', owner: 'Sarah Johnson', closeDate: '' }); setIsAddModalOpen(true); }}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Deal</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="relative">
            <span className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-slate-400"><Search className="h-3.5 w-3.5" /></span>
            <input type="text" placeholder="Search deals, companies..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-8 pr-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-accent/20" />
          </div>
          <div className="relative">
            <select value={stageFilter} onChange={e => setStageFilter(e.target.value)} className="w-full px-3 py-1.5 border border-brand-border-purple/35 bg-white text-brand-text/80 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-accent/20 cursor-pointer">
              <option value="All">All Stages</option>
              {stages.map(st => <option key={st} value={st}>{st}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-brand-border-purple/20 text-[9px] uppercase font-extrabold tracking-wider text-black pb-2">
                <th className="pb-2">Deal Title</th>
                <th className="pb-2">Company</th>
                <th className="pb-2 text-right">Value</th>
                <th className="pb-2">Stage</th>
                <th className="pb-2">Priority</th>
                <th className="pb-2">Owner</th>
                <th className="pb-2">Close Date</th>
                <th className="pb-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border-purple/15 text-xs text-brand-text font-semibold">
              {filtered.length > 0 ? filtered.map(deal => {
                const showSummary = deal.id === summaryDealId;
                return (
                  <React.Fragment key={deal.id}>
                    <tr 
                      onClick={() => setSummaryDealId(deal.id === summaryDealId ? null : deal.id)}
                      onDoubleClick={() => setSummaryDealId(null)}
                      className={`hover:bg-slate-50/50 cursor-pointer transition-colors ${showSummary ? 'bg-brand-secondary-accent/10' : ''}`}
                    >
                      <td className="py-3 font-extrabold text-brand-heading">{deal.title}</td>
                      <td className="py-3 text-brand-text/80">{deal.company}</td>
                      <td className="py-3 text-right tabular-nums font-extrabold">${deal.value.toLocaleString()}</td>
                      <td className="py-3">
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                          deal.stage === 'Qualified' ? 'text-blue-700 bg-blue-50' :
                          deal.stage === 'Proposal' ? 'text-purple-700 bg-purple-50' :
                          deal.stage === 'Under Review' ? 'text-amber-700 bg-amber-50' :
                          deal.stage === 'Won' ? 'text-emerald-700 bg-emerald-50' : 'text-slate-500 bg-slate-100'
                        }`}>{deal.stage}</span>
                      </td>
                      <td className="py-3">
                        <span className={`text-[9px] font-bold ${deal.priority === 'High' ? 'text-rose-600' : deal.priority === 'Medium' ? 'text-amber-600' : 'text-slate-500'}`}>
                          ● {deal.priority}
                        </span>
                      </td>
                      <td className="py-3 text-brand-text/80">{deal.owner}</td>
                      <td className="py-3 tabular-nums text-slate-500">{deal.closeDate}</td>
                      <td className="py-3 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-end space-x-1">
                          <button 
                            onClick={() => { setSelectedDeal(deal); setForm({ title: deal.title, company: deal.company, value: deal.value, stage: deal.stage, priority: deal.priority, owner: deal.owner, closeDate: deal.closeDate }); setIsEditModalOpen(true); }}
                            className="p-1 text-slate-400 hover:text-brand-heading hover:bg-slate-100 rounded cursor-pointer"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleDelete(deal.id)} className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {showSummary && (
                      <tr>
                        <td colSpan={8} className="pt-0 pb-4 px-0">
                          <DealSummaryCard deal={deal} onClose={() => setSummaryDealId(null)} stageProbabilities={stageProbabilities} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              }) : (
                <tr><td colSpan={8} className="py-8 text-center text-slate-400">No deals found matching filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
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
                    <option>High</option><option>Medium</option><option>Low</option>
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
                    <option>High</option><option>Medium</option><option>Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Close Date</label>
                  <input type="date" value={form.closeDate} onChange={e => setForm({...form, closeDate: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text focus:outline-none cursor-pointer" />
                </div>
              </div>
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

// -------------------- DealSummaryCard Component --------------------
function DealSummaryCard({ deal, onClose, stageProbabilities }: { deal: Deal; onClose: () => void; stageProbabilities: Record<string, number> }) {
  const prob = stageProbabilities[deal.stage] || 0;
  const expectedValue = Math.round(deal.value * prob);
  return (
    <div className="bg-white border border-brand-border-purple/20 rounded-xl p-4 shadow-sm/5 my-2 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-extrabold text-brand-heading text-sm">{deal.title}</h3>
          <p className="text-[10px] text-brand-text/60 font-bold flex items-center"><Building2 className="h-3 w-3 mr-1" />{deal.company}</p>
        </div>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-brand-text cursor-pointer"><X className="h-4 w-4" /></button>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-3 text-[11px] font-semibold">
        <div><span className="text-brand-text/50 block text-[9px]">Value</span><span className="text-brand-heading font-extrabold">${deal.value.toLocaleString()}</span></div>
        <div><span className="text-brand-text/50 block text-[9px]">Expected</span><span className="text-brand-heading font-extrabold">${expectedValue.toLocaleString()}</span></div>
        <div><span className="text-brand-text/50 block text-[9px]">Probability</span><span className="text-brand-accent font-extrabold">{Math.round(prob * 100)}%</span></div>
        <div><span className="text-brand-text/50 block text-[9px]">Close</span><span className="text-brand-text tabular-nums">{deal.closeDate}</span></div>
      </div>

      <div className="flex items-center gap-2 text-[10px] font-bold mb-3">
        <span className={`px-1.5 py-0.5 rounded-full ${
          deal.stage === 'Qualified' ? 'text-blue-700 bg-blue-50' :
          deal.stage === 'Proposal' ? 'text-purple-700 bg-purple-50' :
          deal.stage === 'Under Review' ? 'text-amber-700 bg-amber-50' :
          deal.stage === 'Won' ? 'text-emerald-700 bg-emerald-50' : 'text-slate-500 bg-slate-100'
        }`}>{deal.stage}</span>
        <span className={deal.priority === 'High' ? 'text-rose-600' : deal.priority === 'Medium' ? 'text-amber-600' : 'text-slate-500'}>● {deal.priority}</span>
        <span className="text-slate-400">Owner: {deal.owner}</span>
      </div>

      {/* AI Recommendation */}
      <div className="bg-brand-sidebar-hover/20 border border-brand-border-purple/30 rounded-lg p-2.5 flex items-start space-x-2">
        <Sparkles className="h-3.5 w-3.5 text-brand-accent shrink-0 mt-0.5" strokeWidth={2} />
        <p className="text-[10px] text-brand-text/80 font-bold">
          {deal.stage === 'Proposal' && deal.priority === 'High'
            ? "Critical Deal: Proposal sent 3 days ago. Schedule a review session immediately."
            : deal.stage === 'Under Review'
            ? "Close Date approaching. Send the contract agreement link to confirm legal alignment."
            : deal.priority === 'Low' && deal.stage === 'Qualified'
            ? "Nurture track: Send standard developer sandboxing API resources."
            : "Check in with stakeholders to maintain deal velocity."}
        </p>
      </div>
    </div>
  );
}
