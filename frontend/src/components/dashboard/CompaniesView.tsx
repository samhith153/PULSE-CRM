'use client';

import React, { useState, useEffect } from 'react';
import { getCompanies } from '@/utils/api';
import { 
  Building2, 
  Search, 
  Plus, 
  Edit, 
  Eye, 
  UserPlus, 
  Users, 
  IndianRupee, 
  Briefcase, 
  Clock, 
  Paperclip, 
  Mail, 
  PlusCircle,
  X,
  Check
} from 'lucide-react';

interface Company {
  id: number;
  name: string;
  industry: string;
  revenue: string;
  employees: number;
  contacts: string[];
  openDeals: number;
  owner: string;
  ownerAvatar: string;
  notes: string;
  timeline: { id: number; title: string; time: string }[];
  emails: { id: number; subject: string; time: string }[];
  files: { id: number; name: string; size: string }[];
}

export default function CompaniesView() {
  const [companies, setCompanies] = useState<Company[]>([
    {
      id: 1,
      name: "TechCorp Inc.",
      industry: "Software & IT",
      revenue: "₹12,400,000",
      employees: 320,
      contacts: ["Alex Rivera (VP Eng)", "Jane Doe (Product Manager)"],
      openDeals: 2,
      owner: "Sarah Johnson",
      ownerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&fit=crop&q=80",
      notes: "Expanding cloud migration contracts. Security SLA signed in Q1.",
      timeline: [
        { id: 1, title: "SSO Config Approved", time: "2 days ago" },
        { id: 2, title: "Discovery meeting logged", time: "1 week ago" }
      ],
      emails: [
        { id: 1, subject: "SSO integration guidelines", time: "3 days ago" }
      ],
      files: [
        { id: 1, name: "Migration_Blueprint.pdf", size: "2.4 MB" }
      ]
    },
    {
      id: 2,
      name: "MedSaaS Solutions",
      industry: "Healthcare tech",
      revenue: "₹4,500,000",
      employees: 85,
      contacts: ["Marcus Aurelius (Director)"],
      openDeals: 1,
      owner: "Alex Johnson",
      ownerAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&fit=crop&q=80",
      notes: "Evaluating compliance guidelines. Demo was well received.",
      timeline: [
        { id: 1, title: "Product Demo Scheduled", time: "3 days ago" }
      ],
      emails: [
        { id: 1, subject: "Sandbox login requests", time: "4 days ago" }
      ],
      files: []
    },
    {
      id: 3,
      name: "Sparta Creative",
      industry: "Marketing & Design",
      revenue: "₹1,200,000",
      employees: 24,
      contacts: ["Helena Troy (CEO)"],
      openDeals: 0,
      owner: "Sarah Johnson",
      ownerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&fit=crop&q=80",
      notes: "SSO and custom branding design requirements are priority.",
      timeline: [
        { id: 1, title: "Form Ingestion", time: "10 hours ago" }
      ],
      emails: [],
      files: []
    }
  ]);

  const [selectedId, setSelectedId] = useState<number | string | null>(null);
  const [summaryCompanyId, setSummaryCompanyId] = useState<number | string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);

  const [form, setForm] = useState({
    name: '', industry: '', revenue: '', employees: 10, owner: 'Sarah Johnson', notes: ''
  });
  const [contactName, setContactName] = useState('');

  useEffect(() => {
    getCompanies().then(data => {
      setCompanies(data as any);
    });
  }, []);

  const active = selectedId ? companies.find(c => c.id === selectedId) || null : null;

  const filtered = companies.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.industry.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      ownerAvatar: form.owner === 'Sarah Johnson' 
        ? "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&fit=crop&q=80" 
        : "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&fit=crop&q=80",
      notes: form.notes,
      timeline: [{ id: 1, title: "Company Profile Added", time: "Just now" }],
      emails: [],
      files: []
    };
    setCompanies([...companies, newComp]);
    setSelectedId(newComp.id);
    setIsAddModalOpen(false);
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!active) return;
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
    <div className="space-y-6">
      <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="font-sans text-2xl text-brand-heading font-bold">Companies</h2>
            <p className="text-[11px] text-brand-text/60 mt-0.5 font-bold">Monitor accounts, track revenue sizes, and view contact chains.</p>
          </div>
          <button 
            onClick={() => {
              setForm({ name: '', industry: '', revenue: '', employees: 10, owner: 'Sarah Johnson', notes: '' });
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Company</span>
          </button>
        </div>

        <div className="relative mb-4">
          <span className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-slate-400">
            <Search className="h-3.5 w-3.5" />
          </span>
          <input 
            type="text" 
            placeholder="Search companies..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-accent/20"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-brand-border-purple/20 text-[9px] uppercase font-extrabold tracking-wider text-black pb-2">
                <th className="pb-2">Company Name</th>
                <th className="pb-2">Industry</th>
                <th className="pb-2">Revenue</th>
                <th className="pb-2 text-center">Employees</th>
                <th className="pb-2 text-center">Open Deals</th>
                <th className="pb-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border-purple/15 text-xs text-brand-text font-semibold">
              {filtered.map((comp) => {
                const showSummary = comp.id === summaryCompanyId;
                return (
                  <React.Fragment key={comp.id}>
                    <tr 
                      onClick={() => setSummaryCompanyId(comp.id === summaryCompanyId ? null : comp.id)}
                      onDoubleClick={() => setSummaryCompanyId(null)}
                      className={`hover:bg-slate-50/50 cursor-pointer transition-colors ${showSummary ? 'bg-brand-secondary-accent/10' : ''}`}
                    >
                      <td className="py-3 font-extrabold text-brand-heading truncate max-w-[160px]">{comp.name}</td>
                      <td className="py-3 text-brand-text/80 truncate max-w-[120px]">{comp.industry}</td>
                      <td className="py-3 tabular-nums">{comp.revenue || '—'}</td>
                      <td className="py-3 text-center tabular-nums">{comp.employees}</td>
                      <td className="py-3 text-center tabular-nums">{comp.openDeals}</td>
                      <td className="py-3 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-end space-x-1">
                          <button 
                            onClick={() => {
                              setSelectedId(comp.id);
                              setForm({
                                name: comp.name,
                                industry: comp.industry,
                                revenue: comp.revenue,
                                employees: comp.employees,
                                owner: comp.owner,
                                notes: comp.notes
                              });
                              setIsEditModalOpen(true);
                            }}
                            className="p-1 text-slate-400 hover:text-brand-heading hover:bg-slate-100 rounded transition-colors cursor-pointer"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {showSummary && (
                      <tr>
                        <td colSpan={6} className="pt-0 pb-4 px-0">
                          <CompanySummaryCard comp={comp} onClose={() => setSummaryCompanyId(null)} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Company Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-brand-border-purple/25 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-brand-border-purple/15 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-brand-heading text-sm">Add Company</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-brand-text p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleAdd} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Company Name</label>
                  <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Industry</label>
                  <input type="text" required placeholder="e.g. Software" value={form.industry} onChange={e => setForm({...form, industry: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Revenue</label>
                  <input type="text" placeholder="e.g. ₹5,000,000" value={form.revenue} onChange={e => setForm({...form, revenue: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Employees</label>
                  <input type="number" value={form.employees} onChange={e => setForm({...form, employees: Number(e.target.value)})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Owner</label>
                <select value={form.owner} onChange={e => setForm({...form, owner: e.target.value})} className="w-full px-2 py-1.5 border border-brand-border-purple/35 bg-white text-brand-text rounded-lg text-xs cursor-pointer">
                  <option>Sarah Johnson</option>
                  <option>Alex Johnson</option>
                </select>
              </div>
              <div className="pt-3 border-t border-brand-border-purple/15 flex justify-end space-x-2.5">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-1.5 border border-brand-border-purple/30 rounded-lg text-xs font-bold text-brand-text/75 hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-lg text-xs font-bold shadow-sm/10 cursor-pointer">Save Company</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Company Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-brand-border-purple/25 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-brand-border-purple/15 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-brand-heading text-sm">Edit Company</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-brand-text p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleEdit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Company Name</label>
                  <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Industry</label>
                  <input type="text" required value={form.industry} onChange={e => setForm({...form, industry: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Revenue</label>
                  <input type="text" value={form.revenue} onChange={e => setForm({...form, revenue: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Employees</label>
                  <input type="number" value={form.employees} onChange={e => setForm({...form, employees: Number(e.target.value)})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text focus:outline-none" />
                </div>
              </div>
              <div className="pt-3 border-t border-brand-border-purple/15 flex justify-end space-x-2.5">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-1.5 border border-brand-border-purple/30 rounded-lg text-xs font-bold text-brand-text/75 hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-lg text-xs font-bold shadow-sm/10 cursor-pointer">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Link Contact Modal */}
      {isAddContactModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-brand-border-purple/25 rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-brand-border-purple/15 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-brand-heading text-sm">Link Contact</h3>
              <button onClick={() => setIsAddContactModalOpen(false)} className="text-slate-400 hover:text-brand-text p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleAddContact} className="p-5 space-y-4">
              <div>
                <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Contact Name & Role</label>
                <input type="text" required placeholder="e.g. Timothy Brown (CTO)" value={contactName} onChange={e => setContactName(e.target.value)} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text focus:outline-none" />
              </div>
              <div className="pt-3 border-t border-brand-border-purple/15 flex justify-end space-x-2.5">
                <button type="button" onClick={() => setIsAddContactModalOpen(false)} className="px-4 py-1.5 border border-brand-border-purple/30 rounded-lg text-xs font-bold text-brand-text/75 hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-lg text-xs font-bold shadow-sm/10 cursor-pointer">Link Contact</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------- CompanySummaryCard Component --------------------
function CompanySummaryCard({ comp, onClose }: { comp: Company; onClose: () => void }) {
  return (
    <div className="bg-white border border-brand-border-purple/20 rounded-xl p-4 shadow-sm/5 my-2 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-lg bg-brand-sidebar-hover/20 border border-brand-border-purple/35 flex items-center justify-center text-brand-accent">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-brand-heading text-sm">{comp.name}</h3>
            <p className="text-[10px] text-brand-text/60 font-bold">{comp.industry}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-brand-text cursor-pointer"><X className="h-4 w-4" /></button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-3 text-[11px] font-semibold">
        <div><span className="text-brand-text/50 block">Owner</span><span className="text-brand-text">{comp.owner}</span></div>
        <div><span className="text-brand-text/50 block">Revenue</span><span className="text-brand-text tabular-nums">{comp.revenue || '—'}</span></div>
        <div><span className="text-brand-text/50 block">Employees</span><span className="text-brand-text tabular-nums">{comp.employees}</span></div>
      </div>

      <div className="mb-3">
        <h4 className="text-[10px] font-extrabold text-brand-heading uppercase tracking-wider mb-1.5">Contacts</h4>
        <div className="flex flex-wrap gap-1.5">
          {comp.contacts.length > 0 ? comp.contacts.map((c, i) => (
            <span key={i} className="text-[10px] font-bold bg-slate-50 border border-brand-border-purple/20 px-2 py-0.5 rounded-full">{c}</span>
          )) : <span className="text-[10px] text-slate-400">No contacts linked.</span>}
        </div>
      </div>

      <div className="mb-3">
        <h4 className="text-[10px] font-extrabold text-brand-heading uppercase tracking-wider mb-1.5">Notes</h4>
        <p className="text-[10px] text-brand-text/80 font-semibold bg-slate-50/60 p-2 border border-brand-border-purple/20 rounded-lg">{comp.notes || 'No notes saved.'}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-[10px] font-extrabold text-brand-heading uppercase tracking-wider mb-1.5">Timeline</h4>
          <div className="space-y-1">
            {comp.timeline.map(item => (
              <div key={item.id} className="text-[10px] font-semibold flex justify-between">
                <span className="text-brand-text/80">{item.title}</span>
                <span className="text-slate-400">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-[10px] font-extrabold text-brand-heading uppercase tracking-wider mb-1.5">Attachments</h4>
          <div className="space-y-1">
            {comp.files.length > 0 ? comp.files.map(file => (
              <div key={file.id} className="text-[10px] font-semibold flex items-center">
                <Paperclip className="h-3 w-3 mr-1 text-slate-400" />
                <span className="text-brand-heading">{file.name}</span>
                <span className="text-slate-400 ml-1">({file.size})</span>
              </div>
            )) : <span className="text-[10px] text-slate-400">No files.</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
