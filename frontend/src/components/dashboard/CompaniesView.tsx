'use client';

import React, { useState, useEffect } from 'react';
import { getCompanies, updateCompany } from '@/utils/api';
import { toast } from '@/lib/toast';
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
      <div className={`col-span-12 ${active ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-5`}>
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="font-sans text-2xl text-foreground font-bold">Companies</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-semibold">Monitor accounts, track revenue sizes, and view contact chains.</p>
            </div>
            <button 
              onClick={() => {
                setForm({ name: '', industry: '', revenue: '', employees: 10, owner: 'Sarah Johnson', notes: '' });
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-brand-purple hover:bg-brand-purple/90 text-primary-foreground rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Company</span>
            </button>
          </div>

          <div className="relative mb-4">
            <span className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-muted-foreground">
              <Search className="h-3.5 w-3.5" />
            </span>
            <input 
              type="text" 
              placeholder="Search companies..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-border rounded-lg text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand-purple/20"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border text-[9px] uppercase font-semibold tracking-widest text-muted-foreground pb-2">
                  <th className="pb-2">Company Name</th>
                  <th className="pb-2">Industry</th>
                  <th className="pb-2">Revenue</th>
                  <th className="pb-2 text-center">Employees</th>
                  <th className="pb-2 text-center">Open Deals</th>
                  <th className="pb-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs text-foreground font-semibold">
                {filtered.map((comp) => (
                  <tr 
                    key={comp.id}
                    onClick={() => setSelectedId(comp.id)}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setSelectedId(prevId => prevId === comp.id ? null : prevId);
                    }}
                    className={`hover:bg-secondary/50 cursor-pointer transition-colors ${comp.id === selectedId ? 'bg-brand-purple/5' : ''}`}
                  >
                    <td className="py-3 font-semibold text-foreground truncate max-w-[160px]">{comp.name}</td>
                    <td className="py-3 text-muted-foreground truncate max-w-[120px]">{comp.industry}</td>
                    <td className="py-3 tabular-nums">{comp.revenue || '—'}</td>
                    <td className="py-3 text-center tabular-nums">{comp.employees}</td>
                    <td className="py-3 text-center tabular-nums">{comp.openDeals}</td>
                    <td className="py-3 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex justify-end space-x-1">
                        <button 
                          onClick={() => {
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
                          className="p-1 text-muted-foreground hover:text-foreground hover:bg-secondary rounded transition-colors cursor-pointer"
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
        </div>
      </div>

      {/* Details Side Panel */}
      {active && <div className="col-span-12 lg:col-span-4 space-y-5">
        <div className="bg-card border border-border rounded-2xl p-5 sticky top-20">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center space-x-2.5">
              <div className="h-8.5 w-8.5 rounded-lg bg-secondary border border-border flex items-center justify-center text-brand-purple">
                <Building2 className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">{active.name}</h3>
                <p className="text-[10px] text-muted-foreground font-semibold">{active.industry}</p>
              </div>
            </div>
            {/* Close Button */}
            <button 
              onClick={() => setSelectedId(null)}
              className="p-1 bg-secondary hover:bg-secondary border border-border rounded text-muted-foreground hover:text-foreground transition-all duration-200 cursor-pointer"
              title="Close Summary"
              aria-label="Close Summary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="py-3 space-y-2.5 text-[11px] font-semibold border-b border-border">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Owner</span>
              <span className="text-foreground">{active.owner}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Revenue Size</span>
              <span className="text-muted-foreground tabular-nums">{active.revenue || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Employees</span>
              <span className="text-muted-foreground tabular-nums">{active.employees}</span>
            </div>
          </div>

          {/* Contacts list */}
          <div className="py-3 border-b border-border">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[10px] font-semibold text-foreground uppercase tracking-wider">Company Contacts</h4>
              <button 
                onClick={() => setIsAddContactModalOpen(true)}
                className="text-brand-purple hover:text-brand-purple/80 inline-flex items-center space-x-0.5 text-[10px] font-bold cursor-pointer"
              >
                <PlusCircle className="h-3 w-3" />
                <span>Add Link</span>
              </button>
            </div>
            <div className="space-y-1.5">
              {active.contacts.length > 0 ? (
                active.contacts.map((c, i) => (
                  <div key={i} className="text-[11px] text-foreground font-semibold flex items-center">
                    <Users className="h-3 w-3 mr-1.5 text-muted-foreground" />
                    {c}
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-[10px] font-semibold">No contacts linked yet.</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="py-3 border-b border-border">
            <h4 className="text-[10px] font-semibold text-foreground uppercase tracking-wider mb-1.5">Notes</h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed font-semibold bg-secondary p-2 border border-border rounded-lg">{active.notes || 'No internal notes saved.'}</p>
          </div>

          {/* Timeline & Files */}
          <div className="pt-3 space-y-4">
            <div>
              <h4 className="text-[10px] font-semibold text-foreground uppercase tracking-wider mb-2">Recent Timeline</h4>
              <div className="space-y-2">
                {active.timeline.map((item) => (
                  <div key={item.id} className="text-[10px] font-semibold flex justify-between">
                    <span className="text-muted-foreground">{item.title}</span>
                    <span className="text-muted-foreground font-bold">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-semibold text-foreground uppercase tracking-wider mb-2">Uploaded Attachments</h4>
              <div className="space-y-1.5">
                {active.files.length > 0 ? (
                  active.files.map((file) => (
                    <div key={file.id} className="p-2 border border-border rounded bg-secondary flex justify-between items-center text-[10px] font-semibold">
                      <span className="flex items-center text-foreground font-semibold">
                        <Paperclip className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                        {file.name}
                      </span>
                      <span className="text-muted-foreground">{file.size}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-[10px] font-semibold">No files uploaded.</p>
                )}
              </div>
            </div>
        </div>
      </div>
      </div>}

      {/* Add Company Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-border flex justify-between items-center bg-secondary">
              <h3 className="font-semibold text-foreground text-sm">Add Company</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleAdd} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Company Name</label>
                  <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none bg-background" />
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Industry</label>
                  <input type="text" required placeholder="e.g. Software" value={form.industry} onChange={e => setForm({...form, industry: e.target.value})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none bg-background" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Revenue</label>
                  <input type="text" placeholder="e.g. ₹5,000,000" value={form.revenue} onChange={e => setForm({...form, revenue: e.target.value})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none bg-background" />
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Employees</label>
                  <input type="number" value={form.employees} onChange={e => setForm({...form, employees: Number(e.target.value)})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none bg-background" />
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Owner</label>
                <select value={form.owner} onChange={e => setForm({...form, owner: e.target.value})} className="w-full px-2 py-1.5 border border-border bg-background text-foreground rounded-lg text-xs cursor-pointer">
                  <option>Sarah Johnson</option>
                  <option>Alex Johnson</option>
                </select>
              </div>
              <div className="pt-3 border-t border-border flex justify-end space-x-2.5">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-1.5 border border-border rounded-lg text-xs font-semibold text-foreground hover:bg-secondary cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-brand-purple hover:bg-brand-purple/90 text-primary-foreground rounded-lg text-xs font-bold  cursor-pointer">Save Company</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Company Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-border flex justify-between items-center bg-secondary">
              <h3 className="font-semibold text-foreground text-sm">Edit Company</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleEdit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Company Name</label>
                  <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none bg-background" />
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Industry</label>
                  <input type="text" required value={form.industry} onChange={e => setForm({...form, industry: e.target.value})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none bg-background" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Revenue</label>
                  <input type="text" value={form.revenue} onChange={e => setForm({...form, revenue: e.target.value})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none bg-background" />
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Employees</label>
                  <input type="number" value={form.employees} onChange={e => setForm({...form, employees: Number(e.target.value)})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none bg-background" />
                </div>
              </div>
              <div className="pt-3 border-t border-border flex justify-end space-x-2.5">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-1.5 border border-border rounded-lg text-xs font-semibold text-foreground hover:bg-secondary cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-brand-purple hover:bg-brand-purple/90 text-primary-foreground rounded-lg text-xs font-bold  cursor-pointer">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {isAddContactModalOpen && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-border flex justify-between items-center bg-secondary">
              <h3 className="font-semibold text-foreground text-sm">Link Contact</h3>
              <button onClick={() => setIsAddContactModalOpen(false)} className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleAddContact} className="p-5 space-y-4">
              <div>
                <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Contact Name & Role</label>
                <input type="text" required placeholder="e.g. Timothy Brown (CTO)" value={contactName} onChange={e => setContactName(e.target.value)} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none bg-background" />
              </div>
              <div className="pt-3 border-t border-border flex justify-end space-x-2.5">
                <button type="button" onClick={() => setIsAddContactModalOpen(false)} className="px-4 py-1.5 border border-border rounded-lg text-xs font-semibold text-foreground hover:bg-secondary cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-brand-purple hover:bg-brand-purple/90 text-primary-foreground rounded-lg text-xs font-bold  cursor-pointer">Link Contact</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

