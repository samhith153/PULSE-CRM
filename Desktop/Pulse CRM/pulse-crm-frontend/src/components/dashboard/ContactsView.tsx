'use client';

import React, { useState, useEffect } from 'react';
import { getContacts } from '@/utils/api';
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
  User
} from 'lucide-react';

interface ContactItem {
  id: number;
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

export default function ContactsView() {
  const [contacts, setContacts] = useState<ContactItem[]>([
    {
      id: 1,
      name: "Alex Rivera",
      company: "TechCorp Inc.",
      designation: "VP of Engineering",
      phone: "+1 (555) 019-2834",
      email: "alex.rivera@techcorp.com",
      notes: "Preferred contact method is email. High technical authority.",
      timeline: [
        { id: 1, title: "SSO blueprint sent", time: "2 days ago" },
        { id: 2, title: "Intro call logged", time: "1 week ago" }
      ],
      calls: [
        { id: 1, outcome: "Spoke with Lead", notes: "Discussed cloud migration scope.", time: "1 week ago" }
      ],
      meetings: [],
      emails: [
        { id: 1, subject: "Cloud migration outline", body: "Shared guidelines and specs document.", time: "2 days ago" }
      ]
    },
    {
      id: 2,
      name: "Marcus Aurelius",
      company: "MedSaaS Solutions",
      designation: "Director of Compliance",
      phone: "+1 (555) 304-9843",
      email: "marcus.aurelius@medsaas.org",
      notes: "Extremely detail oriented. Highly concerned with security guidelines.",
      timeline: [
        { id: 1, title: "Product walkthrough demo", time: "3 days ago" }
      ],
      calls: [],
      meetings: [
        { id: 1, title: "Security compliance review", date: "2025-05-20", time: "10:00 AM" }
      ],
      emails: []
    },
    {
      id: 3,
      name: "Helena Troy",
      company: "Sparta Creative",
      designation: "CEO & Founder",
      phone: "+1 (555) 834-0192",
      email: "helena.t@spartacreative.io",
      notes: "Met at local design panel. Interested in CRM team workflows onboarding.",
      timeline: [
        { id: 1, title: "Profile created", time: "10 hours ago" }
      ],
      calls: [],
      meetings: [],
      emails: []
    }
  ]);

  const [selectedId, setSelectedId] = useState<number | string>(1);
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
    getContacts().then(data => {
      setContacts(data as any);
      if (data.length > 0) {
        setSelectedId(data[0].id as any);
      }
    });
  }, []);

  const active = contacts.find(c => c.id === selectedId) || contacts[0];

  const filtered = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const newContact: ContactItem = {
      id: Date.now(),
      name: form.name,
      company: form.company,
      designation: form.designation,
      phone: form.phone,
      email: form.email,
      notes: form.notes,
      timeline: [{ id: 1, title: "Contact Registered", time: "Just now" }],
      calls: [],
      meetings: [],
      emails: []
    };
    setContacts([newContact, ...contacts]);
    setSelectedId(newContact.id);
    setIsAddModalOpen(false);
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setContacts(contacts.map(c => c.id === active.id ? {
      ...c,
      name: form.name,
      company: form.company,
      designation: form.designation,
      phone: form.phone,
      email: form.email,
      notes: form.notes
    } : c));
    setIsEditModalOpen(false);
  };

  const handleDelete = (id: number) => {
    const remaining = contacts.filter(c => c.id !== id);
    if (remaining.length > 0) {
      setContacts(remaining);
      setSelectedId(remaining[0].id);
    }
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
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
      <div className="col-span-12 lg:col-span-8 space-y-5">
        <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="font-sans text-2xl text-brand-heading font-bold">Contacts Directory</h2>
              <p className="text-[11px] text-brand-text/60 mt-0.5 font-bold">Track profiles, designation hierarchies, phone links, and messaging history.</p>
            </div>
            <button 
              onClick={() => {
                setForm({ name: '', company: '', designation: '', phone: '', email: '', notes: '' });
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Contact</span>
            </button>
          </div>

          <div className="relative mb-4">
            <span className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-slate-400">
              <Search className="h-3.5 w-3.5" />
            </span>
            <input 
              type="text" 
              placeholder="Search contacts..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-accent/20"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-brand-border-purple/20 text-[9px] uppercase font-extrabold tracking-wider text-brand-heading pb-2">
                  <th className="pb-2">Contact Name</th>
                  <th className="pb-2">Company</th>
                  <th className="pb-2">Designation</th>
                  <th className="pb-2">Phone</th>
                  <th className="pb-2">Email</th>
                  <th className="pb-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border-purple/15 text-xs text-brand-text font-semibold">
                {filtered.map((con) => (
                  <tr 
                    key={con.id}
                    onClick={() => setSelectedId(con.id)}
                    className={`hover:bg-slate-50/50 cursor-pointer ${con.id === selectedId ? 'bg-brand-secondary-accent/10' : ''}`}
                  >
                    <td className="py-3 font-extrabold text-brand-heading">{con.name}</td>
                    <td className="py-3 text-brand-text/80">{con.company}</td>
                    <td className="py-3">{con.designation}</td>
                    <td className="py-3 tabular-nums">{con.phone}</td>
                    <td className="py-3 truncate max-w-[120px]">{con.email}</td>
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
                          className="p-1 text-slate-400 hover:text-brand-heading hover:bg-slate-100 rounded transition-colors cursor-pointer"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(con.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
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
        </div>
      </div>

      {/* Selected Contact details Pane */}
      <div className="col-span-12 lg:col-span-4 space-y-5">
        <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 sticky top-20">
          <div className="flex items-center space-x-2.5 pb-3 border-b border-brand-border-purple/15">
            <div className="h-8.5 w-8.5 rounded-full bg-brand-sidebar-hover/20 border border-brand-border-purple/35 flex items-center justify-center text-brand-accent">
              <User className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="font-extrabold text-brand-heading text-sm">{active.name}</h3>
              <p className="text-[10px] text-brand-text/60 font-bold">{active.designation} at {active.company}</p>
            </div>
          </div>

          <div className="py-3 space-y-2 text-[11px] font-semibold border-b border-brand-border-purple/15">
            <div className="flex justify-between">
              <span className="text-brand-text/50">Email</span>
              <a href={`mailto:${active.email}`} className="text-brand-accent hover:underline">{active.email}</a>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-text/50">Phone</span>
              <span className="text-brand-text tabular-nums">{active.phone}</span>
            </div>
          </div>

          {/* Notes display */}
          <div className="py-3 border-b border-brand-border-purple/15">
            <h4 className="text-[10px] font-extrabold text-brand-heading uppercase tracking-wider mb-1.5">Notes</h4>
            <p className="text-[11px] text-brand-text/80 leading-relaxed font-bold bg-slate-50/60 p-2 border border-brand-border-purple/20 rounded-lg">{active.notes || 'No internal notes saved.'}</p>
          </div>

          {/* Communication triggers */}
          <div className="grid grid-cols-2 gap-2 py-3 border-b border-brand-border-purple/15">
            <button 
              onClick={() => setIsEmailModalOpen(true)}
              className="inline-flex items-center justify-center space-x-1 py-1.5 border border-brand-border-purple/35 hover:border-brand-border-purple hover:bg-slate-50 rounded-lg text-[10px] font-extrabold text-brand-text/80 cursor-pointer"
            >
              <Mail className="h-3.5 w-3.5 text-slate-450" />
              <span>Email Contact</span>
            </button>
            <button 
              onClick={() => setIsCallModalOpen(true)}
              className="inline-flex items-center justify-center space-x-1 py-1.5 border border-brand-border-purple/35 hover:border-brand-border-purple hover:bg-slate-50 rounded-lg text-[10px] font-extrabold text-brand-text/80 cursor-pointer"
            >
              <Phone className="h-3.5 w-3.5 text-slate-450" />
              <span>Log Call</span>
            </button>
          </div>

          {/* Activity Feeds */}
          <div className="pt-3">
            <div className="flex border-b border-brand-border-purple/15 text-[9px] font-extrabold uppercase mb-3">
              {['timeline', 'calls', 'meetings', 'emails'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveHistoryTab(tab as any)}
                  className={`pb-1.5 px-2 border-b-2 transition-all cursor-pointer ${
                    activeHistoryTab === tab ? 'border-brand-secondary-accent text-brand-heading' : 'border-transparent text-slate-450 hover:text-brand-text'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="max-h-48 overflow-y-auto pr-1">
              {activeHistoryTab === 'timeline' && (
                <div className="space-y-2 pl-2 border-l border-brand-border-purple/15">
                  {active.timeline.map((act) => (
                    <div key={act.id} className="relative text-[10px] font-semibold">
                      <div className="absolute -left-[12.5px] top-1 h-2 w-2 rounded-full bg-brand-secondary-accent border border-white" />
                      <div className="font-extrabold text-brand-heading flex justify-between">
                        <span>{act.title}</span>
                        <span className="text-slate-400 font-bold">{act.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeHistoryTab === 'calls' && (
                <div className="space-y-2">
                  {active.calls && active.calls.length > 0 ? (
                    active.calls.map((c) => (
                      <div key={c.id} className="p-2 border border-brand-border-purple/15 bg-slate-50/50 rounded text-[10px] font-semibold">
                        <div className="font-extrabold text-brand-heading flex justify-between">
                          <span>{c.outcome}</span>
                          <span className="text-slate-450 font-bold">{c.time}</span>
                        </div>
                        <p className="text-brand-text/70 mt-0.5">{c.notes}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-[10px] text-center py-2">No calls logged.</p>
                  )}
                </div>
              )}

              {activeHistoryTab === 'meetings' && (
                <div className="space-y-2">
                  {active.meetings && active.meetings.length > 0 ? (
                    active.meetings.map((m) => (
                      <div key={m.id} className="p-2 border border-brand-border-purple/15 bg-slate-50/50 rounded text-[10px] font-semibold">
                        <div className="font-extrabold text-brand-heading flex justify-between">
                          <span>{m.title}</span>
                          <span className="text-brand-accent font-bold">{m.date}</span>
                        </div>
                        <p className="text-slate-450 mt-0.5">Time: {m.time}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-[10px] text-center py-2">No scheduled meetings.</p>
                  )}
                </div>
              )}

              {activeHistoryTab === 'emails' && (
                <div className="space-y-2">
                  {active.emails && active.emails.length > 0 ? (
                    active.emails.map((e) => (
                      <div key={e.id} className="p-2 border border-brand-border-purple/15 bg-slate-50/50 rounded text-[10px] font-semibold">
                        <div className="font-extrabold text-brand-heading flex justify-between">
                          <span className="truncate max-w-[140px]">{e.subject}</span>
                          <span className="text-slate-450 font-bold">{e.time}</span>
                        </div>
                        <p className="text-brand-text/70 mt-1">{e.body}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-[10px] text-center py-2">No emails logged.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Contact Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-brand-border-purple/25 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-brand-border-purple/15 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-brand-heading text-sm">Add New Contact</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-brand-text p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleAdd} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Full Name</label>
                  <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Company</label>
                  <input type="text" required value={form.company} onChange={e => setForm({...form, company: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Designation</label>
                  <input type="text" required value={form.designation} onChange={e => setForm({...form, designation: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Phone</label>
                  <input type="text" required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Email</label>
                <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text focus:outline-none" />
              </div>
              <div>
                <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Internal Notes</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full p-2 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text focus:outline-none min-h-[60px]" />
              </div>
              <div className="pt-3 border-t border-brand-border-purple/15 flex justify-end space-x-2.5">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-1.5 border border-brand-border-purple/30 rounded-lg text-xs font-bold text-brand-text/75 hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-lg text-xs font-bold shadow-sm/10 cursor-pointer">Add Contact</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Contact Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-brand-border-purple/25 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-brand-border-purple/15 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-brand-heading text-sm">Edit Contact</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-brand-text p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleEdit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Full Name</label>
                  <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Company</label>
                  <input type="text" required value={form.company} onChange={e => setForm({...form, company: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Designation</label>
                  <input type="text" required value={form.designation} onChange={e => setForm({...form, designation: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Phone</label>
                  <input type="text" required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Email</label>
                <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text focus:outline-none" />
              </div>
              <div className="pt-3 border-t border-brand-border-purple/15 flex justify-end space-x-2.5">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-1.5 border border-brand-border-purple/30 rounded-lg text-xs font-bold text-brand-text/75 hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-lg text-xs font-bold shadow-sm/10 cursor-pointer">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-brand-border-purple/25 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-brand-border-purple/15 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-brand-heading text-sm">Email {active.name}</h3>
              <button onClick={() => setIsEmailModalOpen(false)} className="text-slate-400 hover:text-brand-text p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleSendEmail} className="p-5 space-y-4">
              <div>
                <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Subject</label>
                <input type="text" required placeholder="Subject line" value={emailForm.subject} onChange={e => setEmailForm({...emailForm, subject: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text focus:outline-none" />
              </div>
              <div>
                <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Email Body</label>
                <textarea required placeholder="Write message..." value={emailForm.body} onChange={e => setEmailForm({...emailForm, body: e.target.value})} className="w-full p-2 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text focus:outline-none min-h-[100px]" />
              </div>
              <div className="pt-3 border-t border-brand-border-purple/15 flex justify-end space-x-2.5">
                <button type="button" onClick={() => setIsEmailModalOpen(false)} className="px-4 py-1.5 border border-brand-border-purple/30 rounded-lg text-xs font-bold text-brand-text/75 hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="inline-flex items-center space-x-1 px-4 py-1.5 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-lg text-xs font-bold shadow-sm/10 cursor-pointer">
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-brand-border-purple/25 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-brand-border-purple/15 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-brand-heading text-sm">Log Call</h3>
              <button onClick={() => setIsCallModalOpen(false)} className="text-slate-400 hover:text-brand-text p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleLogCall} className="p-5 space-y-4">
              <div>
                <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Call Outcome</label>
                <select value={callForm.outcome} onChange={e => setCallForm({...callForm, outcome: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 bg-white text-brand-text rounded-lg text-xs cursor-pointer">
                  <option>Spoke with Lead</option>
                  <option>Left Voice Mail</option>
                  <option>Busy / No Answer</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Call Notes</label>
                <textarea required placeholder="Call summary notes..." value={callForm.notes} onChange={e => setCallForm({...callForm, notes: e.target.value})} className="w-full p-2 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text focus:outline-none min-h-[80px]" />
              </div>
              <div className="pt-3 border-t border-brand-border-purple/15 flex justify-end space-x-2.5">
                <button type="button" onClick={() => setIsCallModalOpen(false)} className="px-4 py-1.5 border border-brand-border-purple/30 rounded-lg text-xs font-bold text-brand-text/75 hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="inline-flex items-center space-x-1 px-4 py-1.5 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-lg text-xs font-bold shadow-sm/10 cursor-pointer">
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
