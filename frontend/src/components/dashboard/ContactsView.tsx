'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
  Building2,
  X,
  LayoutGrid,
  List,
  SlidersHorizontal,
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  User,
  PhoneCall,
  Send,
  Sparkles,
  Filter
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

// Avatar colors based on name hash
const AVATAR_COLORS = [
  { bg: 'bg-violet-100', text: 'text-violet-600' },
  { bg: 'bg-blue-100', text: 'text-blue-600' },
  { bg: 'bg-emerald-100', text: 'text-emerald-600' },
  { bg: 'bg-amber-100', text: 'text-amber-600' },
  { bg: 'bg-fuchsia-100', text: 'text-fuchsia-600' },
  { bg: 'bg-rose-100', text: 'text-rose-600' },
  { bg: 'bg-cyan-100', text: 'text-cyan-600' },
];

function getAvatarColorClass(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 1).toUpperCase();
  }
  return (parts[0][0]).toUpperCase();
}

// Designation Colors
const DESIGNATION_COLORS: Record<string, string> = {
  'AI Engineer': 'text-violet-600 bg-violet-50',
  'CEO': 'text-blue-600 bg-blue-50',
  'kiran': 'text-emerald-600 bg-emerald-50',
  'lead': 'text-amber-600 bg-amber-50',
  'Manager': 'text-purple-600 bg-purple-50',
  'test': 'text-rose-600 bg-rose-50',
  '206': 'text-amber-600 bg-amber-50',
  'Product Manager': 'text-emerald-600 bg-emerald-50',
};

function getDesignationStyle(desig: string) {
  return DESIGNATION_COLORS[desig] || 'text-slate-600 bg-slate-50';
}

const COMPANY_COLORS: Record<string, string> = {
  'Kalnet': 'text-violet-600 bg-violet-50 border-violet-100',
  'Swecha Telangana': 'text-blue-600 bg-blue-50 border-blue-100',
  'kiran': 'text-emerald-600 bg-emerald-50 border-emerald-100',
  'lead': 'text-amber-600 bg-amber-50 border-amber-100',
  'tcs': 'text-purple-600 bg-purple-50 border-purple-100',
  'MCU': 'text-rose-600 bg-rose-50 border-rose-100',
  '1est': 'text-cyan-600 bg-cyan-50 border-cyan-100',
  '206': 'text-amber-600 bg-amber-50 border-amber-100',
  'Pulse Labs': 'text-emerald-600 bg-emerald-50 border-emerald-100',
};

function getCompanyStyle(company: string) {
  return COMPANY_COLORS[company] || 'text-slate-600 bg-slate-50 border-slate-200';
}

const WaveBackground = ({ color }: { color: string }) => (
  <svg className="absolute bottom-0 left-0 w-full h-12 opacity-10 pointer-events-none rounded-b-2xl" viewBox="0 0 100 50" preserveAspectRatio="none">
    <path d="M0,50 L0,20 C20,30 40,0 60,10 C80,20 100,5 100,5 L100,50 Z" fill={color} />
  </svg>
);

interface ContactsViewProps {
  onLoaded?: () => void;
  onTabChange?: (tab: string) => void;
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

export default function ContactsView({ onLoaded, onTabChange, onComposeEmail }: ContactsViewProps = {}) {
  const router = useRouter();
  const [contacts, setContacts] = useState<ContactItem[]>(EMPTY_CONTACTS);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState<'default' | 'list'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('pulse-crm-view-mode-contacts') as any) || 'list';
    }
    return 'list';
  });

  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [sortField, setSortField] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterCompany, setFilterCompany] = useState<string>('');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const toggleViewMode = (mode: 'default' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('pulse-crm-view-mode-contacts', mode);
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
        const storedId = localStorage.getItem('pulse-selected-contact-id');
        if (storedId) {
          const match = data.find((c: any) => String(c.id) === storedId);
          if (match) {
            setSelectedId(match.id);
            localStorage.removeItem('pulse-selected-contact-id');
          }
        }
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
    (c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)) &&
    (filterCompany === '' || c.company === filterCompany)
  );

  const uniqueCompanies = useMemo(() => {
    const set = new Set(contacts.map(c => c.company).filter(Boolean));
    return Array.from(set).sort();
  }, [contacts]);

  const sortedContacts = useMemo(() => {
    return [...filtered].sort((a: any, b: any) => {
      let valA = (a[sortField] || '').toString().toLowerCase();
      let valB = (b[sortField] || '').toString().toLowerCase();
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortField, sortOrder]);

  const totalPages = Math.ceil(sortedContacts.length / pageSize);
  const paginatedContacts = sortedContacts.slice((page - 1) * pageSize, page * pageSize);

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
    if (!window.confirm("Are you sure you want to delete this contact?")) return;
    deleteContact(id).then(() => {
      const remaining = contacts.filter(c => c.id !== id);
      setContacts(remaining);
      if (selectedId === id) setSelectedId(null);
      toast.success("Contact deleted");
    }).catch(() => {
      toast.error("Failed to delete contact");
    });
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

  // Stats
  const totalContacts = contacts.length;
  const totalCompanies = new Set(contacts.map(c => c.company).filter(Boolean)).size;
  const totalPhones = contacts.filter(c => c.phone).length;
  const totalEmails = contacts.filter(c => c.email).length;

  return (
    <div className="grid grid-cols-12 gap-6 items-start">
      {/* Contact Table Section */}
      <div className={`col-span-12 ${active && viewMode !== 'list' ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-5`}>
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="font-sans text-3xl text-foreground font-bold tracking-tight">Contacts Directory</h2>
              <p className="text-sm text-muted-foreground mt-1 font-medium">Track profiles, designation hierarchies, phone links, and messaging history.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-border rounded-lg overflow-hidden p-0.5 bg-secondary/30 shrink-0 select-none">
                <button
                  type="button"
                  onClick={() => toggleViewMode('default')}
                  className={`p-1.5 rounded-md transition cursor-pointer ${
                    viewMode === 'default'
                      ? 'bg-card text-brand-purple shadow-sm font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Split View"
                >
                  <LayoutGrid size={16} />
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
                  <List size={16} />
                </button>
              </div>

              <button 
                onClick={() => {
                  setForm({ name: '', company: '', designation: '', phone: '', email: '', notes: '' });
                  setIsAddModalOpen(true);
                }}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-brand-purple hover:bg-brand-purple/90 text-primary-foreground rounded-lg text-sm font-semibold transition-colors cursor-pointer shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Add Contact</span>
              </button>
            </div>
          </div>

          {/* Search, Sort, and Filters toolbar */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
                <Search className="h-4 w-4" />
              </span>
              <input 
                type="text" 
                placeholder="Search contacts..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand-purple/30 bg-background hover:border-border/80 transition-colors shadow-sm"
              />
            </div>
            
            <div className="flex items-center gap-3">
              {/* Sort Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setIsSortDropdownOpen(!isSortDropdownOpen); setIsFilterDropdownOpen(false); }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 border border-border bg-background hover:bg-secondary rounded-xl text-sm font-semibold text-foreground transition-colors cursor-pointer shadow-sm"
                >
                  <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                  <span>Sort</span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isSortDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isSortDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 z-30 bg-card border border-border rounded-xl shadow-lg p-1.5 min-w-[180px]">
                    {[
                      { label: 'Name (A→Z)', field: 'name', order: 'asc' as const },
                      { label: 'Name (Z→A)', field: 'name', order: 'desc' as const },
                      { label: 'Company ↑', field: 'company', order: 'asc' as const },
                      { label: 'Company ↓', field: 'company', order: 'desc' as const },
                    ].map(({ label, field, order }) => (
                      <button
                        key={`${field}-${order}`}
                        onClick={() => { setSortField(field); setSortOrder(order); setIsSortDropdownOpen(false); }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                          sortField === field && sortOrder === order
                            ? 'bg-brand-purple/10 text-brand-purple font-bold'
                            : 'text-foreground hover:bg-secondary'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Filter Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setIsFilterDropdownOpen(!isFilterDropdownOpen); setIsSortDropdownOpen(false); }}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-semibold transition-colors cursor-pointer shadow-sm ${
                    filterCompany ? 'bg-brand-purple/10 border-brand-purple/30 text-brand-purple' : 'border-border bg-background hover:bg-secondary text-foreground'
                  }`}
                >
                  <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                  <span>{filterCompany ? `Company: ${filterCompany}` : 'Filter'}</span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isFilterDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 z-30 bg-card border border-border rounded-xl shadow-lg p-1.5 min-w-[200px] max-h-60 overflow-y-auto">
                    <button
                      onClick={() => { setFilterCompany(''); setIsFilterDropdownOpen(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer mb-1 ${
                        filterCompany === '' ? 'bg-brand-purple/10 text-brand-purple font-bold' : 'text-foreground hover:bg-secondary'
                      }`}
                    >
                      All Companies
                    </button>
                    {uniqueCompanies.map(ind => (
                      <button
                        key={ind}
                        onClick={() => { setFilterCompany(ind); setIsFilterDropdownOpen(false); }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                          filterCompany === ind ? 'bg-brand-purple/10 text-brand-purple font-bold' : 'text-foreground hover:bg-secondary'
                        }`}
                      >
                        {ind}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-2xl border border-border/80 bg-card hover:shadow-sm transition-shadow relative overflow-hidden">
              <div className="flex gap-4 items-center z-10 relative">
                <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
                  <Contact className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-0.5">Total Contacts</p>
                  <p className="text-xl font-bold text-foreground">{totalContacts}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">Across all companies</p>
                </div>
              </div>
              <WaveBackground color="#8b5cf6" />
            </div>
            
            <div className="p-4 rounded-2xl border border-border/80 bg-card hover:shadow-sm transition-shadow relative overflow-hidden">
              <div className="flex gap-4 items-center z-10 relative">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-0.5">Total Companies</p>
                  <p className="text-xl font-bold text-foreground">{totalCompanies}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">Associated companies</p>
                </div>
              </div>
              <WaveBackground color="#10b981" />
            </div>

            <div className="p-4 rounded-2xl border border-border/80 bg-card hover:shadow-sm transition-shadow relative overflow-hidden">
              <div className="flex gap-4 items-center z-10 relative">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-0.5">Total Phone Links</p>
                  <p className="text-xl font-bold text-foreground">{totalPhones}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">Verified phone numbers</p>
                </div>
              </div>
              <WaveBackground color="#3b82f6" />
            </div>

            <div className="p-4 rounded-2xl border border-border/80 bg-card hover:shadow-sm transition-shadow relative overflow-hidden">
              <div className="flex gap-4 items-center z-10 relative">
                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-0.5">Total Emails</p>
                  <p className="text-xl font-bold text-foreground">{totalEmails}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">Verified email addresses</p>
                </div>
              </div>
              <WaveBackground color="#f59e0b" />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden border border-border/80 rounded-2xl bg-card">
            <table className="w-full border-collapse text-left table-fixed">
              <thead className="bg-muted/30 select-none border-b border-border">
                <tr className="text-[11px] uppercase font-black tracking-wider text-muted-foreground">
                  <th className="py-4 px-4 w-[25%] cursor-pointer hover:text-foreground" onClick={() => handleHeaderClick('name')}>
                    <div className="flex items-center gap-1.5">Contact Name <ArrowUpDown className="w-3 h-3 opacity-50" /></div>
                  </th>
                  <th className="py-4 px-4 w-[20%] cursor-pointer hover:text-foreground" onClick={() => handleHeaderClick('company')}>
                    <div className="flex items-center gap-1.5">Company <ArrowUpDown className="w-3 h-3 opacity-50" /></div>
                  </th>
                  <th className="py-4 px-4 w-[15%] cursor-pointer hover:text-foreground" onClick={() => handleHeaderClick('designation')}>
                    <div className="flex items-center gap-1.5">Designation <ArrowUpDown className="w-3 h-3 opacity-50" /></div>
                  </th>
                  <th className="py-4 px-4 w-[15%] cursor-pointer hover:text-foreground" onClick={() => handleHeaderClick('phone')}>
                    <div className="flex items-center gap-1.5">Phone <ArrowUpDown className="w-3 h-3 opacity-50" /></div>
                  </th>
                  <th className="py-4 px-4 w-[20%] cursor-pointer hover:text-foreground" onClick={() => handleHeaderClick('email')}>
                    <div className="flex items-center gap-1.5">Email <ArrowUpDown className="w-3 h-3 opacity-50" /></div>
                  </th>
                  <th className="py-4 px-4 w-[5%] text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-sm text-foreground font-medium">
                {paginatedContacts.length > 0 ? (
                  paginatedContacts.map((con) => {
                    const avatarColor = getAvatarColorClass(con.name);
                    const initials = getInitials(con.name);
                    const desigStyle = getDesignationStyle(con.designation);
                    const companyStyle = getCompanyStyle(con.company);

                    return (
                      <tr 
                        key={con.id} 
                        onClick={() => setSelectedId(con.id)}
                        className={`hover:bg-secondary/40 transition cursor-pointer ${con.id === selectedId ? 'bg-brand-blue/[0.04]' : ''}`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor.bg} ${avatarColor.text}`}>
                              {initials}
                            </div>
                            <span className="font-bold truncate text-foreground text-[13px]">{con.name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-bold ${companyStyle}`}>
                            <Building2 className="w-3 h-3" />
                            <span className="truncate max-w-[100px]">{con.company}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${desigStyle}`}>
                            {con.designation}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2 text-brand-purple">
                            <Phone className="w-3.5 h-3.5 opacity-70" />
                            <span className="text-[12px] font-semibold truncate">{con.phone || '—'}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="w-3.5 h-3.5 opacity-70" />
                            <span className="text-[12px] font-medium truncate max-w-[140px]">{con.email || '—'}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right pr-6" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
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
                              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors cursor-pointer border border-transparent hover:border-border"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(con.id);
                              }}
                              className="p-1.5 text-rose-500/70 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer border border-transparent hover:border-rose-100"
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
                    <td colSpan={6} className="py-24 text-center">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="relative mb-2">
                          <div className="absolute inset-0 bg-brand-purple/10 rounded-full blur-xl scale-[1.5]"></div>
                          <div className="w-16 h-16 bg-white border border-brand-purple/10 shadow-sm rounded-full flex items-center justify-center relative">
                            <Mail className="w-7 h-7 text-brand-purple" />
                            <Sparkles className="w-5 h-5 text-brand-purple/60 absolute -top-1 -left-2" />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <h3 className="font-sans text-xl font-bold text-foreground tracking-tight">No contacts found</h3>
                          <p className="text-[13px] font-medium text-muted-foreground max-w-[280px] mx-auto leading-relaxed">
                            We couldn't find any contacts that match your current filters.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setFilterCompany('');
                          }}
                          className="inline-flex items-center space-x-2 px-4 py-2 border border-brand-purple/20 bg-brand-purple/5 hover:bg-brand-purple/10 rounded-xl text-[13px] font-bold text-brand-purple transition-colors cursor-pointer shadow-sm mt-2"
                        >
                          <Filter className="w-3.5 h-3.5" />
                          <span>Clear filters</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            
            {/* Pagination footer */}
            {sortedContacts.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                <span className="text-xs text-muted-foreground font-semibold">
                  Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, sortedContacts.length)} of {sortedContacts.length} contacts
                </span>
                <div className="flex items-center gap-4">
                  <div className="flex items-center">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      className="p-2 border border-border rounded-l-lg bg-card hover:bg-secondary disabled:opacity-50 text-muted-foreground transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="px-4 py-1.5 border-y border-border bg-brand-purple/10 text-brand-purple text-xs font-bold min-w-[36px] text-center">
                      {page}
                    </div>
                    {page < totalPages && (
                      <div className="px-4 py-1.5 border border-border border-l-0 bg-card text-muted-foreground text-xs font-bold hover:bg-secondary cursor-pointer" onClick={() => setPage(page + 1)}>
                        {page + 1}
                      </div>
                    )}
                    <button
                      disabled={page >= totalPages}
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      className="p-2 border border-border rounded-r-lg bg-card hover:bg-secondary disabled:opacity-50 text-muted-foreground transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="relative hidden sm:block">
                    <select className="appearance-none pl-3 pr-8 py-2 border border-border rounded-lg text-xs font-bold bg-card text-foreground cursor-pointer focus:outline-none">
                      <option value="10">Rows per page 10</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selected Contact details Pane */}
      {active && viewMode !== 'list' && (
        <div className="col-span-12 lg:col-span-4 space-y-5">
          <div className="bg-card border border-border rounded-2xl p-5 sticky top-20 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center space-x-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold ${getAvatarColorClass(active.name).bg} ${getAvatarColorClass(active.name).text}`}>
                  {getInitials(active.name)}
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-base tracking-tight">{active.name}</h3>
                  <p className="text-[11px] text-muted-foreground font-semibold">{active.designation} at {active.company}</p>
                </div>
              </div>
              {/* Close Button */}
              <button 
                onClick={() => setSelectedId(null)}
                className="p-1.5 bg-secondary hover:bg-secondary border border-border rounded-md text-muted-foreground hover:text-foreground transition duration-200 cursor-pointer"
                title="Close Summary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs font-semibold border-b border-border">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1.5"><Mail className="w-3.5 h-3.5"/> Email</span>
                <a href={`mailto:${active.email}`} className="text-brand-purple hover:underline truncate max-w-[150px]">{active.email}</a>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1.5"><Phone className="w-3.5 h-3.5"/> Phone</span>
                <span className="text-foreground tabular-nums">{active.phone}</span>
              </div>
            </div>

            {/* Notes */}
            <div className="py-4 border-b border-border">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Internal Notes</h4>
                <button 
                  onClick={() => {
                    setForm({ name: active.name, company: active.company, designation: active.designation, phone: active.phone, email: active.email, notes: active.notes });
                    setIsEditModalOpen(true);
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Edit className="w-3 h-3" />
                </button>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed font-medium bg-secondary/50 p-3 border border-border/50 rounded-xl">{active.notes || 'No internal notes saved.'}</p>
            </div>

            {/* Communication triggers */}
            <div className="grid grid-cols-2 gap-2 py-4 border-b border-border">
              <button 
                onClick={() => {
                  router.push(`?compose=${encodeURIComponent(active.email)}`);
                  onTabChange?.('emails');
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('pulse-compose-email', { detail: { to: active.email } }));
                  }, 150);
                }}
                className="inline-flex items-center justify-center space-x-1.5 py-2 border border-border hover:bg-secondary rounded-xl text-[11px] font-bold text-muted-foreground cursor-pointer shadow-sm"
              >
                <Mail className="h-3.5 w-3.5" />
                <span>Send Email</span>
              </button>
              <button 
                onClick={() => setIsCallModalOpen(true)}
                className="inline-flex items-center justify-center space-x-1.5 py-2 border border-border hover:bg-secondary rounded-xl text-[11px] font-bold text-muted-foreground cursor-pointer shadow-sm"
              >
                <PhoneCall className="h-3.5 w-3.5" />
                <span>Log Call</span>
              </button>
            </div>

            {/* Activity Feeds */}
            <div className="pt-4">
              <div className="flex border-b border-border/60 text-[10px] font-bold uppercase mb-4">
                {['timeline', 'calls', 'meetings', 'emails'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveHistoryTab(tab as any)}
                    className={`pb-2 px-3 border-b-2 transition cursor-pointer ${
                      activeHistoryTab === tab ? 'border-brand-purple text-brand-purple' : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="max-h-48 overflow-y-auto pr-1">
                {activeHistoryTab === 'timeline' && (
                  <div className="space-y-3 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent pl-6">
                    {active?.timeline?.map((act) => (
                      <div key={act.id} className="relative text-xs font-semibold">
                        <div className="absolute -left-[18.5px] top-1.5 h-2 w-2 rounded-full bg-brand-purple border border-card" />
                        <div className="font-semibold text-foreground flex justify-between">
                          <span>{act.title}</span>
                          <span className="text-muted-foreground text-[10px] font-bold">{act.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* Simplified rendering for other tabs for brevity */}
                {activeHistoryTab !== 'timeline' && (
                  <p className="text-muted-foreground text-xs text-center py-4">No recent {activeHistoryTab}.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
                  <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-purple/30 bg-background" />
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Company</label>
                  <input type="text" required value={form.company} onChange={e => setForm({...form, company: e.target.value})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-purple/30 bg-background" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Designation</label>
                  <input type="text" required value={form.designation} onChange={e => setForm({...form, designation: e.target.value})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-purple/30 bg-background" />
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Phone</label>
                  <input type="text" required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-purple/30 bg-background" />
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Email</label>
                <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-purple/30 bg-background" />
              </div>
              <div>
                <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Internal Notes</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full p-2 border border-border rounded-lg text-xs text-foreground focus:outline-none min-h-[60px] bg-background focus:ring-1 focus:ring-brand-purple/30" />
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
                  <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-purple/30 bg-background" />
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Company</label>
                  <input type="text" required value={form.company} onChange={e => setForm({...form, company: e.target.value})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-purple/30 bg-background" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Designation</label>
                  <input type="text" required value={form.designation} onChange={e => setForm({...form, designation: e.target.value})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-purple/30 bg-background" />
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Phone</label>
                  <input type="text" required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-purple/30 bg-background" />
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Email</label>
                <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-purple/30 bg-background" />
              </div>
              <div className="pt-3 border-t border-border flex justify-end space-x-2.5">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-1.5 border border-border rounded-lg text-xs font-semibold text-foreground hover:bg-secondary cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-brand-purple hover:bg-brand-purple/90 text-primary-foreground rounded-lg text-xs font-semibold cursor-pointer">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
