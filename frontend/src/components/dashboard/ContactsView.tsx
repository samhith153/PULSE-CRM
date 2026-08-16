'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getContacts, createContact, updateContact, deleteContact } from '@/utils/api';
import { toast } from '@/lib/toast';
import SkeletonLoader from './SkeletonLoader';
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

interface ContactsViewProps {
  onLoaded?: () => void;
  onTabChange?: (tab: string) => void;
  /** Deep-link support: /dashboard/contacts/[id] pre-selects this contact. */
  openContactId?: string | number;
  onComposeEmail?: (target: { 
    to: string; 
    name?: string; 
    company?: string; 
    designation?: string;
    purpose?: 'cold_intro' | 'follow_up' | 'check_in' | 'proposal' | 'thank_you' | 'custom';
    context?: string;
    externalEntityType?: string | null;
    externalEntityId?: string | null;
  }) => void;
}

export default function ContactsView({ onLoaded, onTabChange, onComposeEmail, openContactId }: ContactsViewProps = {}) {
  const router = useRouter();
  const [contacts, setContacts] = useState<ContactItem[]>(EMPTY_CONTACTS);
  const [loading, setLoading] = useState(true);

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
        onLoaded?.();
        // Deep-link id takes priority over the cross-page localStorage handoff.
        const storedId = localStorage.getItem('pulse-selected-contact-id');
        const targetId = openContactId != null
          ? String(openContactId).replace(/^contact_/, '')
          : storedId;
        if (targetId) {
          const match = data.find((c: any) => String(c.id) === targetId);
          if (match) {
            setSelectedId(match.id);
            localStorage.removeItem('pulse-selected-contact-id');
          }
        }
      }
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [openContactId]);

  const active = selectedId ? contacts.find(c => c.id === selectedId) || null : null;

  const filtered = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── List view state: grid/split vs table, bulk selection, sorting ──
  const [viewMode, setViewMode] = useState<'default' | 'list'>('default');
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [sortField, setSortField] = useState<'name' | 'company' | 'designation' | 'phone' | 'email'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const toggleViewMode = (mode: 'default' | 'list') => {
    setViewMode(mode);
    if (mode === 'list') setSelectedIds(new Set());
  };

  const sortedContacts = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = String(a[sortField] ?? '').toLowerCase();
      const bv = String(b[sortField] ?? '').toLowerCase();
      const cmp = av.localeCompare(bv);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortField, sortDir]);

  const handleHeaderClick = (field: 'name' | 'company' | 'designation' | 'phone' | 'email') => {
    if (sortField === field) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const handleToggleSelectRow = (id: string | number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAll = (list: ContactItem[]) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      const allSelected = list.length > 0 && list.every(c => prev.has(c.id));
      if (allSelected) {
        list.forEach(c => next.delete(c.id));
      } else {
        list.forEach(c => next.add(c.id));
      }
      return next;
    });
  };

  const handleDeleteSelectedContacts = async () => {
    const ids = [...selectedIds];
    setContacts(contacts.filter(c => !selectedIds.has(c.id)));
    setSelectedIds(new Set());
    if (selectedId != null && selectedIds.has(selectedId)) {
      setSelectedId(contacts.find(c => !selectedIds.has(c.id))?.id ?? null);
    }
    for (const id of ids) {
      try {
        await deleteContact(id);
      } catch {
        // Per-item failures are non-fatal; keep the UI in sync regardless.
      }
    }
  };

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
    }
  };

  const handleDelete = async (id: number | string) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) return;
    try {
      await deleteContact(id);
      const remaining = contacts.filter(c => c.id !== id);
      setContacts(remaining);
      if (selectedId === id) {
        setSelectedId(remaining.length > 0 ? remaining[0].id : null);
      }
      toast.success('Contact deleted successfully.');
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Failed to delete contact.');
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
    <SkeletonLoader isLoading={loading} layout="table">
    <div className="grid grid-cols-12 gap-6 items-start">
      {/* Contact Table Section */}
      <div className={`col-span-12 ${active && viewMode !== 'list' ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-5`}>
        <div className="bg-surface-1 border border-border-default rounded-2xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="font-sans text-2xl text-text-primary font-bold">Contacts Directory</h2>
              <p className="text-[11px] text-text-muted mt-0.5 font-semibold">Track profiles, designation hierarchies, phone links, and messaging history.</p>
            </div>
            <div className="flex items-center gap-3">
              {/* View Toggle Button */}
              <div className="flex items-center border border-border-default rounded-lg overflow-hidden p-0.5 bg-surface-2/50 shrink-0 select-none">
                <button
                  type="button"
                  onClick={() => toggleViewMode('default')}
                  className={`p-1.5 rounded-md transition cursor-pointer ${
                    viewMode === 'default'
                      ? 'bg-surface-1 text-accent-color shadow-sm font-bold'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                  title="Split View"
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
                  onClick={handleDeleteSelectedContacts}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-status-danger-text hover:bg-status-danger-text/90 text-text-on-primary rounded-lg text-xs font-semibold transition-colors cursor-pointer mr-2"
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
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-accent-color hover:bg-accent-color/90 text-surface-0 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Contact</span>
              </button>
            </div>
          </div>

          <div className="relative mb-4">
            <span className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-text-muted">
              <Search className="h-3.5 w-3.5" />
            </span>
            <input 
              type="text" 
              placeholder="Search contacts..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent-color/20 bg-surface-2"
            />
          </div>

          {viewMode === 'list' ? (
            <div className="overflow-y-auto max-h-[580px] border border-border-default/60 rounded-xl bg-surface-1 custom-scrollbar">
              <table className="w-full border-collapse text-left table-fixed">
                <thead className="sticky top-0 bg-surface-1 z-10 border-b border-border-default shadow-[0_1px_0_0_rgba(0,0,0,0.02)] select-none">
                  <tr className="text-[11px] uppercase font-black tracking-wider text-text-primary border-b border-border-default bg-surface-2/40">
                    <th className="py-3 px-4 w-[5%] text-left">
                      <input 
                        type="checkbox" 
                        checked={sortedContacts.length > 0 && selectedIds.size === sortedContacts.length}
                        onChange={() => handleToggleSelectAll(sortedContacts)}
                        className="rounded border-border-default text-accent-color focus:ring-accent-color cursor-pointer size-3.5"
                      />
                    </th>
                    <th className="py-3 px-2 w-[22%] cursor-pointer hover:text-text-primary" onClick={() => handleHeaderClick('name')}>Contact Name</th>
                    <th className="py-3 px-2 w-[20%] cursor-pointer hover:text-text-primary" onClick={() => handleHeaderClick('company')}>Company</th>
                    <th className="py-3 px-2 w-[20%] cursor-pointer hover:text-text-primary" onClick={() => handleHeaderClick('designation')}>Designation</th>
                    <th className="py-3 px-2 w-[13%] cursor-pointer hover:text-text-primary" onClick={() => handleHeaderClick('phone')}>Phone</th>
                    <th className="py-3 px-2 w-[13%] cursor-pointer hover:text-text-primary" onClick={() => handleHeaderClick('email')}>Email</th>
                    <th className="py-3 px-2 w-[7%] text-right pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 text-xs text-text-primary font-medium">
                  {sortedContacts.length > 0 ? (
                    sortedContacts.map((con) => {
                      const isRowSelected = selectedIds.has(con.id);
                      return (
                        <tr 
                          key={con.id} 
                          onClick={() => setSelectedId(con.id)}
                          className={`hover:bg-surface-2/20 transition border-b border-border-default/40 ${isRowSelected ? 'bg-accent-color/[0.02]' : ''}`}
                        >
                          <td className="py-3.5 px-4 text-left" onClick={(e) => e.stopPropagation()}>
                            <input 
                              type="checkbox" 
                              checked={isRowSelected}
                              onChange={() => handleToggleSelectRow(con.id)}
                              className="rounded border-border-default text-accent-color focus:ring-accent-color cursor-pointer size-3.5"
                            />
                          </td>
                          <td className="py-3.5 px-2 font-bold truncate" title={con.name}>{con.name}</td>
                          <td className="py-3.5 px-2 text-text-muted truncate" title={con.company}>{con.company}</td>
                          <td className="py-3.5 px-2 text-text-muted truncate" title={con.designation}>{con.designation}</td>
                          <td className="py-3.5 px-2 text-text-muted truncate tabular-nums" title={con.phone}>{con.phone}</td>
                          <td className="py-3.5 px-2 text-text-muted truncate" title={con.email}>{con.email}</td>
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
                                className="p-1 text-text-muted hover:text-text-primary hover:bg-surface-2 rounded transition-colors cursor-pointer"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button 
                                onClick={() => handleDelete(con.id)}
                                className="p-1 text-text-muted hover:text-status-danger-text hover:bg-status-danger-bg rounded transition-colors cursor-pointer"
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
                      <td colSpan={7} className="py-8 text-center text-text-muted">
                        No contacts matching search or filter selections.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[580px] border border-border-default/60 rounded-xl bg-surface-1">
              <table className="w-full border-collapse text-left">
                <thead className="sticky top-0 bg-surface-1 z-10 border-b border-border-default shadow-[0_1px_0_0_rgba(0,0,0,0.02)] select-none">
                  <tr className="text-[11px] uppercase font-black tracking-wider text-text-primary border-b border-border-default bg-surface-2/40">
                    <th className="py-3 px-4 cursor-pointer hover:text-text-primary" onClick={() => handleHeaderClick('name')}>Contact Name</th>
                    <th className="py-3 cursor-pointer hover:text-text-primary" onClick={() => handleHeaderClick('company')}>Company</th>
                    <th className="py-3 cursor-pointer hover:text-text-primary" onClick={() => handleHeaderClick('designation')}>Designation</th>
                    <th className="py-3 cursor-pointer hover:text-text-primary" onClick={() => handleHeaderClick('phone')}>Phone</th>
                    <th className="py-3 cursor-pointer hover:text-text-primary" onClick={() => handleHeaderClick('email')}>Email</th>
                    <th className="py-3 text-right pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 text-xs text-text-primary font-medium">
                  {sortedContacts.map((con) => (
                    <tr 
                      key={con.id}
                      onClick={() => setSelectedId(con.id)}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setSelectedId(prevId => prevId === con.id ? null : prevId);
                      }}
                      className={`hover:bg-surface-2/40 cursor-pointer transition duration-200 border-b border-border-default/40 ${con.id === selectedId ? 'bg-accent-color/[0.04]' : ''}`}
                    >
                      <td className="py-3.5 px-4 font-semibold text-text-primary truncate max-w-[150px]">{con.name}</td>
                      <td className="py-3.5 text-text-muted truncate max-w-[130px]">{con.company}</td>
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
                            className="p-1 text-text-muted hover:text-text-primary hover:bg-surface-2 rounded transition-colors cursor-pointer"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(con.id)}
                            className="p-1 text-text-muted hover:text-status-danger-text hover:bg-status-danger-bg rounded transition-colors cursor-pointer"
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
        <div className="bg-surface-1 border border-border-default rounded-2xl p-5 sticky top-20">
          <div className="flex items-center justify-between pb-3 border-b border-border-default">
            <div className="flex items-center space-x-2.5">
              <div className="h-8.5 w-8.5 rounded-full bg-surface-2 border border-border-default flex items-center justify-center text-accent-color">
                <User className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary text-sm">{active.name}</h3>
                <p className="text-[10px] text-text-muted font-semibold">{active.designation} at {active.company}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => handleDelete(active.id)}
                className="p-1 bg-surface-2 hover:bg-status-danger-bg border border-border-default rounded text-text-muted hover:text-status-danger-text transition duration-200 cursor-pointer"
                title="Delete Contact"
                aria-label="Delete Contact"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setSelectedId(null)}
                className="p-1 bg-surface-2 hover:bg-surface-2 border border-border-default rounded text-text-muted hover:text-text-primary transition duration-200 cursor-pointer"
                title="Close Summary"
                aria-label="Close Summary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="py-3 space-y-2 text-[11px] font-semibold border-b border-border-default">
            <div className="flex justify-between">
              <span className="text-text-muted">Email</span>
              <a href={`mailto:${active.email}`} className="text-accent-color hover:underline">{active.email}</a>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Phone</span>
              <span className="text-text-primary tabular-nums">{active.phone}</span>
            </div>
          </div>

          {/* Notes display */}
          <div className="py-3 border-b border-border-default">
            <h4 className="text-[10px] font-semibold text-text-primary uppercase tracking-wider mb-1.5">Notes</h4>
            <p className="text-[11px] text-text-muted leading-relaxed font-semibold bg-surface-2 p-2 border border-border-default rounded-lg">{active.notes || 'No internal notes saved.'}</p>
          </div>

          {/* Communication triggers */}
          <div className="grid grid-cols-2 gap-2 py-3 border-b border-border-default">
            <button 
              onClick={() => {
                router.push(`?compose=${encodeURIComponent(active.email)}`);
                onTabChange?.('emails');
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('pulse-compose-email', { detail: { to: active.email } }));
                }, 150);
              }}
              className="inline-flex items-center justify-center space-x-1 py-1.5 border border-border-default hover:bg-surface-2 rounded-lg text-[10px] font-semibold text-text-muted cursor-pointer"
            >
              <Mail className="h-3.5 w-3.5 text-text-muted" />
              <span>Email Contact</span>
            </button>
            <button 
              onClick={() => {
                if (onComposeEmail && active) {
                  onComposeEmail({
                    to: active.email,
                    name: active.name,
                    company: active.company,
                    designation: active.designation,
                    purpose: 'follow_up',
                    context: active.notes || '',
                    externalEntityType: 'contact',
                    externalEntityId: String(active.id)
                  });
                }
              }}
              className="inline-flex items-center justify-center space-x-1 py-1.5 border border-border-default hover:bg-surface-2 rounded-lg text-[10px] font-semibold text-text-muted cursor-pointer"
            >
              <Mail className="h-3.5 w-3.5 text-text-muted" />
              <span>Email Contact</span>
            </button>
          </div>

          {/* Activity Feeds */}
          <div className="pt-3">
            <div className="flex border-b border-border-default text-[9px] font-semibold uppercase mb-3">
              {['timeline', 'calls', 'meetings', 'emails'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveHistoryTab(tab as any)}
                  className={`pb-1.5 px-2 border-b-2 transition cursor-pointer ${
                    activeHistoryTab === tab ? 'border-accent-color text-text-primary' : 'border-transparent text-text-muted hover:text-text-primary'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="max-h-48 overflow-y-auto pr-1">
              {activeHistoryTab === 'timeline' && (
                <div className="space-y-2 pl-2 border-l border-border-default">
                  {active?.timeline?.map((act) => (
                    <div key={act.id} className="relative text-[10px] font-semibold">
                      <div className="absolute -left-[12.5px] top-1 h-2 w-2 rounded-full bg-accent-color border border-card" />
                      <div className="font-semibold text-text-primary flex justify-between">
                        <span>{act.title}</span>
                        <span className="text-text-muted font-semibold">{act.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeHistoryTab === 'calls' && (
                <div className="space-y-2">
                  {active.calls && active.calls.length > 0 ? (
                    active.calls.map((c) => (
                      <div key={c.id} className="p-2 border border-border-default bg-surface-2 rounded text-[10px] font-semibold">
                        <div className="font-semibold text-text-primary flex justify-between">
                          <span>{c.outcome}</span>
                          <span className="text-text-muted font-semibold">{c.time}</span>
                        </div>
                        <p className="text-text-muted mt-0.5">{c.notes}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-text-muted text-[10px] text-center py-2">No calls logged.</p>
                  )}
                </div>
              )}

              {activeHistoryTab === 'meetings' && (
                <div className="space-y-2">
                  {active.meetings && active.meetings.length > 0 ? (
                    active.meetings.map((m) => (
                      <div key={m.id} className="p-2 border border-border-default bg-surface-2 rounded text-[10px] font-semibold">
                        <div className="font-semibold text-text-primary flex justify-between">
                          <span>{m.title}</span>
                          <span className="text-accent-color font-semibold">{m.date}</span>
                        </div>
                        <p className="text-text-muted mt-0.5">Time: {m.time}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-text-muted text-[10px] text-center py-2">No scheduled meetings.</p>
                  )}
                </div>
              )}

              {activeHistoryTab === 'emails' && (
                <div className="space-y-2">
                  {active.emails && active.emails.length > 0 ? (
                    active.emails.map((e) => (
                      <div key={e.id} className="p-2 border border-border-default bg-surface-2 rounded text-[10px] font-semibold">
                        <div className="font-semibold text-text-primary flex justify-between">
                          <span className="truncate max-w-[140px]">{e.subject}</span>
                          <span className="text-text-muted font-semibold">{e.time}</span>
                        </div>
                        <p className="text-text-muted mt-1">{e.body}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-text-muted text-[10px] text-center py-2">No emails logged.</p>
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
          <div className="bg-surface-1 border border-border-default rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-border-default flex justify-between items-center bg-surface-2">
              <h3 className="font-semibold text-text-primary text-sm">Add New Contact</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-text-muted hover:text-text-primary p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleAdd} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Full Name</label>
                  <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary focus:outline-none bg-surface-0" />
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Company</label>
                  <input type="text" required value={form.company} onChange={e => setForm({...form, company: e.target.value})} className="w-full px-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary focus:outline-none bg-surface-0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Designation</label>
                  <input type="text" required value={form.designation} onChange={e => setForm({...form, designation: e.target.value})} className="w-full px-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary focus:outline-none bg-surface-0" />
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Phone</label>
                  <input type="text" required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary focus:outline-none bg-surface-0" />
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Email</label>
                <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary focus:outline-none bg-surface-0" />
              </div>
              <div>
                <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Internal Notes</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full p-2 border border-border-default rounded-lg text-xs text-text-primary focus:outline-none min-h-[60px] bg-surface-0" />
              </div>
              <div className="pt-3 border-t border-border-default flex justify-end space-x-2.5">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-1.5 border border-border-default rounded-lg text-xs font-semibold text-text-primary hover:bg-surface-2 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-accent-color hover:bg-accent-color/90 text-surface-0 rounded-lg text-xs font-semibold cursor-pointer">Add Contact</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Contact Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-surface-1 border border-border-default rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-border-default flex justify-between items-center bg-surface-2">
              <h3 className="font-semibold text-text-primary text-sm">Edit Contact</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-text-muted hover:text-text-primary p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleEdit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Full Name</label>
                  <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary focus:outline-none bg-surface-0" />
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Company</label>
                  <input type="text" required value={form.company} onChange={e => setForm({...form, company: e.target.value})} className="w-full px-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary focus:outline-none bg-surface-0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Designation</label>
                  <input type="text" required value={form.designation} onChange={e => setForm({...form, designation: e.target.value})} className="w-full px-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary focus:outline-none bg-surface-0" />
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Phone</label>
                  <input type="text" required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary focus:outline-none bg-surface-0" />
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Email</label>
                <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary focus:outline-none bg-surface-0" />
              </div>
              <div className="pt-3 border-t border-border-default flex justify-end space-x-2.5">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-1.5 border border-border-default rounded-lg text-xs font-semibold text-text-primary hover:bg-surface-2 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-accent-color hover:bg-accent-color/90 text-surface-0 rounded-lg text-xs font-semibold cursor-pointer">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-surface-1 border border-border-default rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-border-default flex justify-between items-center bg-surface-2">
              <h3 className="font-semibold text-text-primary text-sm">Email {active?.name}</h3>
              <button onClick={() => setIsEmailModalOpen(false)} className="text-text-muted hover:text-text-primary p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleSendEmail} className="p-5 space-y-4">
              <div>
                <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Subject</label>
                <input type="text" required placeholder="Subject line" value={emailForm.subject} onChange={e => setEmailForm({...emailForm, subject: e.target.value})} className="w-full px-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary focus:outline-none bg-surface-0" />
              </div>
              <div>
                <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Email Body</label>
                <textarea required placeholder="Write message..." value={emailForm.body} onChange={e => setEmailForm({...emailForm, body: e.target.value})} className="w-full p-2 border border-border-default rounded-lg text-xs text-text-primary focus:outline-none min-h-[100px] bg-surface-0" />
              </div>
              <div className="pt-3 border-t border-border-default flex justify-end space-x-2.5">
                <button type="button" onClick={() => setIsEmailModalOpen(false)} className="px-4 py-1.5 border border-border-default rounded-lg text-xs font-semibold text-text-primary hover:bg-surface-2 cursor-pointer">Cancel</button>
                <button type="submit" className="inline-flex items-center space-x-1 px-4 py-1.5 bg-accent-color hover:bg-accent-color/90 text-surface-0 rounded-lg text-xs font-semibold cursor-pointer">
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
          <div className="bg-surface-1 border border-border-default rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-border-default flex justify-between items-center bg-surface-2">
              <h3 className="font-semibold text-text-primary text-sm">Log Call</h3>
              <button onClick={() => setIsCallModalOpen(false)} className="text-text-muted hover:text-text-primary p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleLogCall} className="p-5 space-y-4">
              <div>
                <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Call Outcome</label>
                <select value={callForm.outcome} onChange={e => setCallForm({...callForm, outcome: e.target.value})} className="w-full px-3 py-1.5 border border-border-default bg-surface-0 text-text-primary rounded-lg text-xs cursor-pointer">
                  <option>Spoke with Lead</option>
                  <option>Left Voice Mail</option>
                  <option>Busy / No Answer</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Call Notes</label>
                <textarea required placeholder="Call summary notes..." value={callForm.notes} onChange={e => setCallForm({...callForm, notes: e.target.value})} className="w-full p-2 border border-border-default rounded-lg text-xs text-text-primary focus:outline-none min-h-[80px] bg-surface-0" />
              </div>
              <div className="pt-3 border-t border-border-default flex justify-end space-x-2.5">
                <button type="button" onClick={() => setIsCallModalOpen(false)} className="px-4 py-1.5 border border-border-default rounded-lg text-xs font-semibold text-text-primary hover:bg-surface-2 cursor-pointer">Cancel</button>
                <button type="submit" className="inline-flex items-center space-x-1 px-4 py-1.5 bg-accent-color hover:bg-accent-color/90 text-surface-0 rounded-lg text-xs font-semibold cursor-pointer">
                  <PhoneCall className="h-3.5 w-3.5 mr-1" />
                  <span>Log Call</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </SkeletonLoader>
  );
}
