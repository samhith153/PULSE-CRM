'use client';

import React, { useState, useEffect } from 'react';
import { getContacts, createContact, updateContact, deleteContact } from '@/utils/api';
import { toast } from '@/lib/toast';
import { 
  Contact, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  Calendar, 
  Building2,
  X,
  Check,
  Send,
  PhoneCall,
  User,
  LayoutGrid,
  List
} from 'lucide-react';

interface ContactItem {
  id: string | number;
  name: string;
  company: string;
  designation: string;
  phone: string;
  email: string;
  notes: string;
  timeline: { id: number; title: string; time: string }[];
  calls: { id: number; outcome: string; notes: string; time: string }[];
  meetings: { id: number; title: string; date: string; time: string }[];
  emails: { id: number; subject: string; body: string; time: string }[];
}

const EMPTY_CONTACTS: ContactItem[] = [];

export default function ContactsView({ onLoaded }: { onLoaded?: () => void } = {}) {
  const [contacts, setContacts] = useState<ContactItem[]>(EMPTY_CONTACTS);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState<'default' | 'list'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('pulse-crm-view-mode-contacts') as any) || 'default';
    }
    return 'default';
  });

  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [sortField, setSortField] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const toggleViewMode = (mode: 'default' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('pulse-crm-view-mode-contacts', mode);
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

  const handleDeleteSelectedContacts = async () => {
    if (!window.confirm(`Are you sure you want to delete the ${selectedIds.size} selected contact(s)?`)) return;
    try {
      for (const id of Array.from(selectedIds)) {
        await deleteContact(id);
      }
      setContacts(prev => prev.filter(c => !selectedIds.has(c.id)));
      setSelectedIds(new Set());
      setSelectedId(null);
      toast.success("Selected contacts deleted successfully.");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to delete selected contacts.");
    }
  };

  const [selectedId, setSelectedId] = useState<number | string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeHistoryTab, setActiveHistoryTab] = useState<'timeline' | 'calls' | 'meetings' | 'emails'>('timeline');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);

  // Forms state
  const [form, setForm] = useState({
    name: '', company: '', designation: '', phone: '', email: '', notes: ''
  });
  const [emailForm, setEmailForm] = useState({ subject: '', body: '' });
  const [callForm, setCallForm] = useState({ outcome: 'Spoke with Lead', notes: '' });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getContacts().then((data) => {
      if (!cancelled) {
        setContacts(data as any);
        setLoading(false);
        if (data.length && !selectedId) setSelectedId((data as any)[0].id);
      }
    }).catch(() => {
      if (!cancelled) {
        setLoading(false);
        onLoaded?.();
        toast.error('Failed to load contacts');
      }
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const handleOpen = () => {
      setForm({ name: '', company: '', designation: '', phone: '', email: '', notes: '' });
      setIsAddModalOpen(true);
    };
    window.addEventListener('pulse-open-create-contact-modal', handleOpen);
    return () => window.removeEventListener('pulse-open-create-contact-modal', handleOpen);
  }, []);

  const active = selectedId ? contacts.find(c => c.id === selectedId) || null : null;

  const filtered = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedContacts = React.useMemo(() => {
    return [...filtered].sort((a: any, b: any) => {
      let valA = (a[sortField] || '').toString().toLowerCase();
      let valB = (b[sortField] || '').toString().toLowerCase();
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortField, sortOrder]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parts = form.name.trim().split(/\s+/).filter(Boolean);
      const [first_name, ...rest] = parts;
      const last_name = rest.join(' ') || (parts.length === 1 ? parts[0] : '');
      const created = await createContact({
        first_name: first_name || form.name || 'Unnamed',
        last_name: last_name || '',
        email: form.email,
        phone: form.phone || null,
        mobile: null,
        job_title: form.designation || null,
        department: null,
        linkedin_url: null,
        twitter_url: null,
        address: null,
        city: null,
        country: null,
        notes: form.notes || null,
        company_id: null,
      });
      const newContact: ContactItem = {
        id: created?.data?.id || created?.id || Date.now(),
        name: [created?.data?.first_name, created?.data?.last_name].filter(Boolean).join(' ') || form.name,
        company: form.company,
        designation: form.designation,
        phone: form.phone,
        email: form.email,
        notes: form.notes,
        timeline: [{ id: 1, title: 'Contact Registered', time: 'Just now' }],
        calls: [],
        meetings: [],
        emails: []
      };
      setContacts([newContact, ...contacts]);
      setSelectedId(newContact.id);
      setIsAddModalOpen(false);
      setForm({ name: '', company: '', designation: '', phone: '', email: '', notes: '' });
    } catch {
      toast.error('Failed to save contact');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!active || typeof active.id !== 'string') return;
    try {
      const parts = form.name.trim().split(/\s+/).filter(Boolean);
      const [first_name, ...rest] = parts;
      const last_name = rest.join(' ') || (parts.length === 1 ? parts[0] : '');
      const updated = await updateContact(String(active.id), {
        first_name: first_name || form.name || 'Unnamed',
        last_name: last_name || '',
        email: form.email || null,
        phone: form.phone || null,
        job_title: form.designation || null,
        notes: form.notes || null,
      });
      const source = updated?.data ?? updated;
      setContacts(contacts.map(c => c.id === active.id ? {
        ...c,
        name: [source?.first_name, source?.last_name].filter(Boolean).join(' ') || c.name,
        company: form.company,
        designation: form.designation,
        phone: form.phone,
        email: form.email,
        notes: form.notes,
      } : c));
      setIsEditModalOpen(false);
    } catch {
      toast.error('Failed to save contact');
    }
  };

  const handleDelete = (id: number | string) => {
    const remaining = contacts.filter(c => c.id !== id);
    setContacts(remaining);
    if (selectedId === id) {
      setSelectedId(null);
    }
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!active) return;
    setContacts(contacts.map(c => c.id === active.id ? {
      ...c,
      emails: [{ id: Date.now(), subject: emailForm.subject, body: emailForm.body, time: "Just now" }, ...c.emails],
      timeline: [{ id: Date.now() + 1, title: `Email Sent: ${emailForm.subject}`, time: "Just now" }, ...c.timeline]
    } : c));
    setIsEmailModalOpen(false);
    setEmailForm({ subject: '', body: '' });
  };

  const handleLogCall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!active) return;
    setContacts(contacts.map(c => c.id === active.id ? {
      ...c,
      calls: [{ id: Date.now(), outcome: callForm.outcome, notes: callForm.notes, time: "Just now" }, ...c.calls],
      timeline: [{ id: Date.now() + 1, title: `Call Outcome: ${callForm.outcome}`, time: "Just now" }, ...c.timeline]
    } : c));
    setIsCallModalOpen(false);
    setCallForm({ outcome: 'Spoke with Lead', notes: '' });
  };

  return (
    <div className="grid grid-cols-12 gap-6 items-start">
      {/* Contact Table Section */}
      <div className={`col-span-12 ${active && viewMode !== 'list' ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-5`}>
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="font-sans text-2xl text-foreground font-bold">Contacts Directory</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-semibold">Track profiles, designation hierarchies, phone links, and messaging history.</p>
            </div>
            <div className="flex items-center gap-3">
              {/* View Toggle Button */}
              <div className="flex items-center border border-border rounded-lg overflow-hidden p-0.5 bg-secondary/50 shrink-0 select-none">
                <button
                  type="button"
                  onClick={() => toggleViewMode('default')}
                  className={`p-1.5 rounded-md transition-all cursor-pointer ${
                    viewMode === 'default'
                      ? 'bg-card text-brand-purple shadow-sm font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Split View"
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
                  onClick={handleDeleteSelectedContacts}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer mr-2"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Selected ({selectedIds.size})</span>
                </button>
              )}

              <button 
                onClick={() => {
                  setForm({ name: '', company: '', designation: '', phone: '', email: '', notes: '' });
                  setIsAddModalOpen(true);
                }}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-brand-purple hover:bg-brand-purple/90 text-primary-foreground rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Contact</span>
              </button>
            </div>
          </div>

          <div className="relative mb-4">
            <span className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-muted-foreground">
              <Search className="h-3.5 w-3.5" />
            </span>
            <input 
              type="text" 
              placeholder="Search contacts..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-border rounded-lg text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand-purple/20 bg-secondary"
            />
          </div>

          {viewMode === 'list' ? (
            <div className="overflow-y-auto max-h-[580px] border border-border/60 rounded-xl bg-card custom-scrollbar">
              <table className="w-full border-collapse text-left table-fixed">
                <thead className="sticky top-0 bg-card z-10 border-b border-border shadow-[0_1px_0_0_rgba(0,0,0,0.02)] select-none">
                  <tr className="text-[11px] uppercase font-black tracking-wider text-foreground border-b border-border bg-muted/40">
                    <th className="py-3 px-4 w-[5%] text-left">
                      <input 
                        type="checkbox" 
                        checked={sortedContacts.length > 0 && selectedIds.size === sortedContacts.length}
                        onChange={() => handleToggleSelectAll(sortedContacts)}
                        className="rounded border-border text-brand-purple focus:ring-brand-purple cursor-pointer size-3.5"
                      />
                    </th>
                    <th className="py-3 px-2 w-[22%] cursor-pointer hover:text-foreground" onClick={() => handleHeaderClick('name')}>Contact Name</th>
                    <th className="py-3 px-2 w-[20%] cursor-pointer hover:text-foreground" onClick={() => handleHeaderClick('company')}>Company</th>
                    <th className="py-3 px-2 w-[20%] cursor-pointer hover:text-foreground" onClick={() => handleHeaderClick('designation')}>Designation</th>
                    <th className="py-3 px-2 w-[13%] cursor-pointer hover:text-foreground" onClick={() => handleHeaderClick('phone')}>Phone</th>
                    <th className="py-3 px-2 w-[13%] cursor-pointer hover:text-foreground" onClick={() => handleHeaderClick('email')}>Email</th>
                    <th className="py-3 px-2 w-[7%] text-right pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 text-xs text-foreground font-medium">
                  {sortedContacts.length > 0 ? (
                    sortedContacts.map((con) => {
                      const isRowSelected = selectedIds.has(con.id);
                      return (
                        <tr 
                          key={con.id} 
                          onClick={() => setSelectedId(con.id)}
                          className={`hover:bg-secondary/20 transition-all border-b border-border/40 ${isRowSelected ? 'bg-brand-blue/[0.02]' : ''}`}
                        >
                          <td className="py-3.5 px-4 text-left" onClick={(e) => e.stopPropagation()}>
                            <input 
                              type="checkbox" 
                              checked={isRowSelected}
                              onChange={() => handleToggleSelectRow(con.id)}
                              className="rounded border-border text-brand-purple focus:ring-brand-purple cursor-pointer size-3.5"
                            />
                          </td>
                          <td className="py-3.5 px-2 font-bold truncate" title={con.name}>{con.name}</td>
                          <td className="py-3.5 px-2 text-muted-foreground truncate" title={con.company}>{con.company}</td>
                          <td className="py-3.5 px-2 text-muted-foreground truncate" title={con.designation}>{con.designation}</td>
                          <td className="py-3.5 px-2 text-muted-foreground truncate tabular-nums" title={con.phone}>{con.phone}</td>
                          <td className="py-3.5 px-2 text-muted-foreground truncate" title={con.email}>{con.email}</td>
                          <td className="py-3.5 px-2 text-right pr-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end gap-1.5">
                              <button 
                                onClick={() => {
                                  setForm({
                                    name: con.name,
                                    company: con.company,
                                    designation: con.designation,
                                    phone: con.phone,
                                    email: con.email,
                                    notes: con.notes
                                  });
                                  setSelectedId(con.id);
                                  setIsEditModalOpen(true);
                                }}
                                className="p-1 text-muted-foreground hover:text-foreground hover:bg-secondary rounded transition-colors cursor-pointer"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button 
                                onClick={() => handleDelete(con.id)}
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
                      <td colSpan={7} className="py-8 text-center text-muted-foreground">
                        No contacts matching search or filter selections.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[580px] border border-border/60 rounded-xl bg-card">
              <table className="w-full border-collapse text-left">
                <thead className="sticky top-0 bg-card z-10 border-b border-border shadow-[0_1px_0_0_rgba(0,0,0,0.02)] select-none">
                  <tr className="text-[11px] uppercase font-black tracking-wider text-foreground border-b border-border bg-muted/40">
                    <th className="py-3 px-4 cursor-pointer hover:text-foreground" onClick={() => handleHeaderClick('name')}>Contact Name</th>
                    <th className="py-3 cursor-pointer hover:text-foreground" onClick={() => handleHeaderClick('company')}>Company</th>
                    <th className="py-3 cursor-pointer hover:text-foreground" onClick={() => handleHeaderClick('designation')}>Designation</th>
                    <th className="py-3 cursor-pointer hover:text-foreground" onClick={() => handleHeaderClick('phone')}>Phone</th>
                    <th className="py-3 cursor-pointer hover:text-foreground" onClick={() => handleHeaderClick('email')}>Email</th>
                    <th className="py-3 text-right pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 text-xs text-foreground font-medium">
                  {sortedContacts.map((con) => (
                    <tr 
                      key={con.id}
                      onClick={() => setSelectedId(con.id)}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setSelectedId(prevId => prevId === con.id ? null : prevId);
                      }}
                      className={`hover:bg-secondary/40 cursor-pointer transition-all duration-200 border-b border-border/40 ${con.id === selectedId ? 'bg-brand-blue/[0.04]' : ''}`}
                    >
                      <td className="py-3.5 px-4 font-semibold text-foreground truncate max-w-[150px]">{con.name}</td>
                      <td className="py-3.5 text-muted-foreground truncate max-w-[130px]">{con.company}</td>
                      <td className="py-3.5 truncate max-w-[120px]">{con.designation}</td>
                      <td className="py-3.5 tabular-nums">{con.phone}</td>
                      <td className="py-3.5 truncate max-w-[120px]">{con.email}</td>
                      <td className="py-3 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-end space-x-1">
                          <button 
                            onClick={() => {
                              setForm({
                                name: con.name,
                                company: con.company,
                                designation: con.designation,
                                phone: con.phone,
                                email: con.email,
                                notes: con.notes
                              });
                              setIsEditModalOpen(true);
                            }}
                            className="p-1 text-muted-foreground hover:text-foreground hover:bg-secondary rounded transition-colors cursor-pointer"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(con.id)}
                            className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Selected Contact details Pane */}
      {active && viewMode !== 'list' && <div className="col-span-12 lg:col-span-4 space-y-5">
        <div className="bg-card border border-border rounded-2xl p-5 sticky top-20">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center space-x-2.5">
              <div className="h-8.5 w-8.5 rounded-full bg-secondary border border-border flex items-center justify-center text-brand-purple">
                <User className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">{active.name}</h3>
                <p className="text-[10px] text-muted-foreground font-semibold">{active.designation} at {active.company}</p>
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

          <div className="py-3 space-y-2 text-[11px] font-semibold border-b border-border">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <a href={`mailto:${active.email}`} className="text-brand-purple hover:underline">{active.email}</a>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone</span>
              <span className="text-foreground tabular-nums">{active.phone}</span>
            </div>
          </div>

          {/* Notes display */}
          <div className="py-3 border-b border-border">
            <h4 className="text-[10px] font-semibold text-foreground uppercase tracking-wider mb-1.5">Notes</h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed font-semibold bg-secondary p-2 border border-border rounded-lg">{active.notes || 'No internal notes saved.'}</p>
          </div>

          {/* Communication triggers */}
          <div className="grid grid-cols-2 gap-2 py-3 border-b border-border">
            <button 
              onClick={() => setIsEmailModalOpen(true)}
              className="inline-flex items-center justify-center space-x-1 py-1.5 border border-border hover:bg-secondary rounded-lg text-[10px] font-semibold text-muted-foreground cursor-pointer"
            >
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Email Contact</span>
            </button>
            <button 
              onClick={() => setIsCallModalOpen(true)}
              className="inline-flex items-center justify-center space-x-1 py-1.5 border border-border hover:bg-secondary rounded-lg text-[10px] font-semibold text-muted-foreground cursor-pointer"
            >
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Log Call</span>
            </button>
          </div>

          {/* Activity Feeds */}
          <div className="pt-3">
            <div className="flex border-b border-border text-[9px] font-semibold uppercase mb-3">
              {['timeline', 'calls', 'meetings', 'emails'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveHistoryTab(tab as any)}
                  className={`pb-1.5 px-2 border-b-2 transition-all cursor-pointer ${
                    activeHistoryTab === tab ? 'border-brand-purple text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="max-h-48 overflow-y-auto pr-1">
              {activeHistoryTab === 'timeline' && (
                <div className="space-y-2 pl-2 border-l border-border">
                  {active?.timeline?.map((act) => (
                    <div key={act.id} className="relative text-[10px] font-semibold">
                      <div className="absolute -left-[12.5px] top-1 h-2 w-2 rounded-full bg-brand-purple border border-card" />
                      <div className="font-semibold text-foreground flex justify-between">
                        <span>{act.title}</span>
                        <span className="text-muted-foreground font-semibold">{act.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeHistoryTab === 'calls' && (
                <div className="space-y-2">
                  {active.calls && active.calls.length > 0 ? (
                    active.calls.map((c) => (
                      <div key={c.id} className="p-2 border border-border bg-secondary rounded text-[10px] font-semibold">
                        <div className="font-semibold text-foreground flex justify-between">
                          <span>{c.outcome}</span>
                          <span className="text-muted-foreground font-semibold">{c.time}</span>
                        </div>
                        <p className="text-muted-foreground mt-0.5">{c.notes}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-[10px] text-center py-2">No calls logged.</p>
                  )}
                </div>
              )}

              {activeHistoryTab === 'meetings' && (
                <div className="space-y-2">
                  {active.meetings && active.meetings.length > 0 ? (
                    active.meetings.map((m) => (
                      <div key={m.id} className="p-2 border border-border bg-secondary rounded text-[10px] font-semibold">
                        <div className="font-semibold text-foreground flex justify-between">
                          <span>{m.title}</span>
                          <span className="text-brand-purple font-semibold">{m.date}</span>
                        </div>
                        <p className="text-muted-foreground mt-0.5">Time: {m.time}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-[10px] text-center py-2">No scheduled meetings.</p>
                  )}
                </div>
              )}

              {activeHistoryTab === 'emails' && (
                <div className="space-y-2">
                  {active.emails && active.emails.length > 0 ? (
                    active.emails.map((e) => (
                      <div key={e.id} className="p-2 border border-border bg-secondary rounded text-[10px] font-semibold">
                        <div className="font-semibold text-foreground flex justify-between">
                          <span className="truncate max-w-[140px]">{e.subject}</span>
                          <span className="text-muted-foreground font-semibold">{e.time}</span>
                        </div>
                        <p className="text-muted-foreground mt-1">{e.body}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-[10px] text-center py-2">No emails logged.</p>
                  )}
                </div>
              )}
            </div>
        </div>
      </div>
      </div>}

      {/* Add Contact Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-border flex justify-between items-center bg-secondary">
              <h3 className="font-semibold text-foreground text-sm">Add New Contact</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleAdd} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Full Name</label>
                  <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none bg-background" />
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Company</label>
                  <input type="text" required value={form.company} onChange={e => setForm({...form, company: e.target.value})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none bg-background" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Designation</label>
                  <input type="text" required value={form.designation} onChange={e => setForm({...form, designation: e.target.value})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none bg-background" />
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Phone</label>
                  <input type="text" required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none bg-background" />
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Email</label>
                <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none bg-background" />
              </div>
              <div>
                <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Internal Notes</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full p-2 border border-border rounded-lg text-xs text-foreground focus:outline-none min-h-[60px] bg-background" />
              </div>
              <div className="pt-3 border-t border-border flex justify-end space-x-2.5">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-1.5 border border-border rounded-lg text-xs font-semibold text-foreground hover:bg-secondary cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-brand-purple hover:bg-brand-purple/90 text-primary-foreground rounded-lg text-xs font-semibold cursor-pointer">Add Contact</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Contact Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-border flex justify-between items-center bg-secondary">
              <h3 className="font-semibold text-foreground text-sm">Edit Contact</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleEdit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Full Name</label>
                  <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none bg-background" />
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Company</label>
                  <input type="text" required value={form.company} onChange={e => setForm({...form, company: e.target.value})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none bg-background" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Designation</label>
                  <input type="text" required value={form.designation} onChange={e => setForm({...form, designation: e.target.value})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none bg-background" />
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Phone</label>
                  <input type="text" required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none bg-background" />
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Email</label>
                <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none bg-background" />
              </div>
              <div className="pt-3 border-t border-border flex justify-end space-x-2.5">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-1.5 border border-border rounded-lg text-xs font-semibold text-foreground hover:bg-secondary cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-brand-purple hover:bg-brand-purple/90 text-primary-foreground rounded-lg text-xs font-semibold cursor-pointer">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-border flex justify-between items-center bg-secondary">
              <h3 className="font-semibold text-foreground text-sm">Email {active?.name}</h3>
              <button onClick={() => setIsEmailModalOpen(false)} className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleSendEmail} className="p-5 space-y-4">
              <div>
                <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Subject</label>
                <input type="text" required placeholder="Subject line" value={emailForm.subject} onChange={e => setEmailForm({...emailForm, subject: e.target.value})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none bg-background" />
              </div>
              <div>
                <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Email Body</label>
                <textarea required placeholder="Write message..." value={emailForm.body} onChange={e => setEmailForm({...emailForm, body: e.target.value})} className="w-full p-2 border border-border rounded-lg text-xs text-foreground focus:outline-none min-h-[100px] bg-background" />
              </div>
              <div className="pt-3 border-t border-border flex justify-end space-x-2.5">
                <button type="button" onClick={() => setIsEmailModalOpen(false)} className="px-4 py-1.5 border border-border rounded-lg text-xs font-semibold text-foreground hover:bg-secondary cursor-pointer">Cancel</button>
                <button type="submit" className="inline-flex items-center space-x-1 px-4 py-1.5 bg-brand-purple hover:bg-brand-purple/90 text-primary-foreground rounded-lg text-xs font-semibold cursor-pointer">
                  <Send className="h-3.5 w-3.5 mr-1" />
                  <span>Send Email</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Call Modal */}
      {isCallModalOpen && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-border flex justify-between items-center bg-secondary">
              <h3 className="font-semibold text-foreground text-sm">Log Call</h3>
              <button onClick={() => setIsCallModalOpen(false)} className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleLogCall} className="p-5 space-y-4">
              <div>
                <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Call Outcome</label>
                <select value={callForm.outcome} onChange={e => setCallForm({...callForm, outcome: e.target.value})} className="w-full px-3 py-1.5 border border-border bg-background text-foreground rounded-lg text-xs cursor-pointer">
                  <option>Spoke with Lead</option>
                  <option>Left Voice Mail</option>
                  <option>Busy / No Answer</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Call Notes</label>
                <textarea required placeholder="Call summary notes..." value={callForm.notes} onChange={e => setCallForm({...callForm, notes: e.target.value})} className="w-full p-2 border border-border rounded-lg text-xs text-foreground focus:outline-none min-h-[80px] bg-background" />
              </div>
              <div className="pt-3 border-t border-border flex justify-end space-x-2.5">
                <button type="button" onClick={() => setIsCallModalOpen(false)} className="px-4 py-1.5 border border-border rounded-lg text-xs font-semibold text-foreground hover:bg-secondary cursor-pointer">Cancel</button>
                <button type="submit" className="inline-flex items-center space-x-1 px-4 py-1.5 bg-brand-purple hover:bg-brand-purple/90 text-primary-foreground rounded-lg text-xs font-semibold cursor-pointer">
                  <PhoneCall className="h-3.5 w-3.5 mr-1" />
                  <span>Log Call</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
