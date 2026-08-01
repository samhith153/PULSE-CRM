'use client';

import React, { useState, useEffect } from 'react';
import { Lead as BackendLead, getLeads, createLead, updateLead, deleteLead as apiDeleteLead, convertLead, sendGmailEmail, getGmailStatus, getEmails, getPipelineStages, getCurrentUser, getUsers, fetchLeadRecommendation, fetchBatchRecommendations } from '@/utils/api';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  Calendar, 
  Award, 
  Clock, 
  Sparkles, 
  X, 
  Check, 
  Send, 
  PhoneCall, 
  MessageSquare, 
  TrendingUp, 
  User, 
  Building2,
  AlertCircle,
  MapPin,
  Briefcase,
  Globe,
  Monitor,
  Users,
  ChevronDown
} from 'lucide-react';

// Mapping helpers
const STATUS_MAP: Record<string, string> = {
  'New': 'new', 'Contacted': 'contacted', 'Qualified': 'qualified', 'Converted': 'converted', 'Lost': 'lost',
};
const STATUS_UNMAP: Record<string, Lead['status']> = {
  'new': 'New', 'contacted': 'Contacted', 'qualified': 'Qualified', 'converted': 'Converted', 'lost': 'Lost',
};
const SOURCE_MAP: Record<string, string> = {
  'Website': 'website', 'Referral': 'referral', 'LinkedIn': 'linkedin',
  'Cold Email': 'email_campaign', 'Event': 'trade_show', 'Webinar': 'inbound',
  'Partner': 'partner', 'Paid Ads': 'social_media', 'Organic Search': 'website', 'Other': 'other',
};

function backendToLocal(b: BackendLead): Lead {
  const source = b.source || undefined;
  const mappedSource = source ? Object.entries(SOURCE_MAP).find(([,v]) => v === source)?.[0] || source : undefined;
  return {
    id: b.id,
    name: b.title,
    company: b.company_name || '',
    email: b.contact_email || '',
    phone: b.contact_phone || '',
    score: b.score ?? 0,
    fit_score: b.fit_score ?? null,
    engagement_score: b.engagement_score ?? null,
    engagementReasons: b.engagement_reasons ?? [],
    priorityTier: b.priority ?? null,
    topReasons: b.top_reasons ?? [],
    status: STATUS_UNMAP[b.status] || 'New',
    priority: (b.priority as Lead['priority']) ?? 'Low',
    owner: b.owner_name || 'Unassigned',
    ownerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&fit=crop&q=80",
    notes: b.notes || '',
    source: mappedSource,
    industry: b.industry || undefined,
    jobTitle: b.job_title || undefined,
    location: b.location || undefined,
    numberOfEmployees: b.employee_count?.toString() || undefined,
    currentCRM: b.current_crm || undefined,
    operationalSystem: b.operational_systems || undefined,
    value: b.estimated_value ? Number(b.estimated_value) : undefined,
    employee_count: b.employee_count || undefined,
    timeline: [],
    emails: [],
    calls: [],
    meetings: [],
  };
}

// Types Definition
interface ActivityItem {
  id: number;
  type: 'creation' | 'email' | 'call' | 'meeting' | 'conversion';
  title: string;
  desc: string;
  time: string;
}

interface EmailItem {
  id: number;
  subject: string;
  body: string;
  time: string;
}

interface CallItem {
  id: number;
  outcome: string;
  notes: string;
  time: string;
}

interface MeetingItem {
  id: number;
  title: string;
  date: string;
  time: string;
  desc: string;
}

interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  score: number;
  fit_score: number | null;
  engagement_score: number | null;
  engagementReasons: string[];
  priorityTier: string | null;
  topReasons: string[];
  status: 'New' | 'Contacted' | 'Qualified' | 'Converted' | 'Lost';
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  owner: string;
  ownerAvatar: string;
  notes: string;
  source?: string;
  value?: string | number;
  employee_count?: number;
  jobTitle?: string;
  industry?: string;
  location?: string;
  numberOfEmployees?: string;
  currentCRM?: string;
  operationalSystem?: string;
  timeline: ActivityItem[];
  emails: EmailItem[];
  calls: CallItem[];
  meetings: MeetingItem[];
}

export default function LeadsView({ onLoaded }: { onLoaded?: () => void } = {}) {
  // Prepopulated state variables
  const [leads, setLeads] = useState<Lead[]>([]);

  // Selections & Filters State
  const [selectedLeadId, setSelectedLeadId] = useState<number | string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [activeHistoryTab, setActiveHistoryTab] = useState<string>('timeline');
  const [isPriorityView, setIsPriorityView] = useState(false);

  // Modal Open/Close States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateIndustryOpen, setIsCreateIndustryOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditIndustryOpen, setIsEditIndustryOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [convertingLeadId, setConvertingLeadId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [gmailConnectionId, setGmailConnectionId] = useState<string | null>(null);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [leadRecommendations, setLeadRecommendations] = useState<Record<string, string>>({});

  // Form Fields State
  const [leadForm, setLeadForm] = useState({
    name: '', jobTitle: '', email: '', phone: '',
    company: '', industry: '', location: '', numberOfEmployees: '',
    source: '', currentCRM: '', operationalSystem: '',
    status: 'New' as Lead['status'], priority: 'Medium' as Lead['priority'], owner: '', notes: ''
  });
  const [emailForm, setEmailForm] = useState({ subject: '', body: '' });
  const [callForm, setCallForm] = useState({ outcome: 'Spoke with Lead', notes: '' });
  const [meetingForm, setMeetingForm] = useState({ title: '', date: '', time: '', desc: '' });
  const [convertForm, setConvertForm] = useState({ industry: '', revenue: '', employeeCount: '', pipelineStageId: '' });
  const [pipelineStages, setPipelineStages] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; full_name: string } | null>(null);
  const [users, setUsers] = useState<{ id: string; full_name: string }[]>([]);

  const getProgressPoints = (score: number) => {
    const p1 = { x: 10, y: 80 };
    const p2 = { x: 80, y: 90 - (Math.max(30, score - 20) * 0.8) };
    const p3 = { x: 150, y: 90 - (Math.max(40, score - 10) * 0.8) };
    const p4 = { x: 220, y: 90 - (Math.max(50, score - 5) * 0.8) };
    const p5 = { x: 290, y: 90 - (score * 0.8) };
    return {
      path: `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y} L ${p4.x} ${p4.y} L ${p5.x} ${p5.y}`,
      areaPath: `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y} L ${p4.x} ${p4.y} L ${p5.x} ${p5.y} L ${p5.x} 90 L ${p1.x} 90 Z`,
      points: [p1, p2, p3, p4, p5]
    };
  };

  useEffect(() => {
    getLeads().then(data => {
      const mapped = (data ?? []).map(backendToLocal);
      setLeads(mapped);
      const ids = mapped.map(l => l.id).filter(Boolean);
      if (ids.length > 0) {
        fetchBatchRecommendations(ids).then(res => {
          const recs: Record<string, string> = {};
          for (const [id, item] of Object.entries(res.recommendations || {})) {
            recs[id] = item.recommended_action || 'No recommendation available.';
          }
          setLeadRecommendations(recs);
        }).catch(() => {});
      }
    }).finally(() => {
      onLoaded?.();
    });
    getCurrentUser().then(user => {
      setCurrentUser(user);
      setLeadForm(prev => ({ ...prev, owner: user.full_name }));
    }).catch(() => {});
    getUsers().then(data => {
      if (data && data.data) {
        setUsers(data.data.map(u => ({ id: u.id, full_name: u.full_name })));
      }
    }).catch(() => {});
    getGmailStatus().then(status => {
      setGmailConnected(status.connected);
      if (status.connection) {
        setGmailConnectionId(status.connection.id);
      }
    }).catch(() => {
      setGmailConnected(false);
    });
    getPipelineStages().then(data => {
      setPipelineStages(data as any);
    }).catch(() => {});
  }, []);

  // Poll for lead score updates every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      getLeads().then(data => {
        const mapped = (data ?? []).map(backendToLocal);
        setLeads(mapped);
        const ids = mapped.map(l => l.id).filter(Boolean);
        if (ids.length > 0) {
          fetchBatchRecommendations(ids).then(res => {
            const recs: Record<string, string> = {};
            for (const [id, item] of Object.entries(res.recommendations || {})) {
              recs[id] = item.recommended_action || 'No recommendation available.';
            }
            setLeadRecommendations(recs);
          }).catch(() => {});
        }
      }).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch recommendation when selected lead changes
  useEffect(() => {
    if (!selectedLeadId || leadRecommendations[selectedLeadId]) return;
    fetchLeadRecommendation(String(selectedLeadId))
      .then(res => {
        const text = res.recommendations?.[0] || 'No recommendation available.';
        setLeadRecommendations(prev => ({ ...prev, [selectedLeadId]: text }));
      })
      .catch(() => {
        setLeadRecommendations(prev => ({ ...prev, [selectedLeadId]: 'Unable to generate recommendation.' }));
      });
  }, [selectedLeadId]);

  // Get currently active lead object
  const activeLead = selectedLeadId ? leads.find(l => l.id === selectedLeadId) || null : null;

  // AI Recommendation engine — returns cached backend recommendation or loading text
  const getAIRecommendation = (lead: Lead) => {
    return leadRecommendations[lead.id] || 'Loading recommendation...';
  };

  // Filtered Leads list
  const filteredLeads = leads.filter(l => {
    const matchesSearch = l.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          l.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || l.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || l.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const displayLeads = isPriorityView
    ? [...filteredLeads].sort((a, b) => (b.score || 0) - (a.score || 0))
    : filteredLeads;

  // Action: Create Lead Submit
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      title: leadForm.name,
      company_name: leadForm.company,
      job_title: leadForm.jobTitle || undefined,
      email: leadForm.email || undefined,
      phone: leadForm.phone || undefined,
      source: SOURCE_MAP[leadForm.source as string] || leadForm.source || undefined,
      industry: leadForm.industry || undefined,
      location: leadForm.location || undefined,
      employee_count: leadForm.numberOfEmployees ? parseInt(leadForm.numberOfEmployees, 10) || undefined : undefined,
      current_crm: leadForm.currentCRM || undefined,
      operational_systems: leadForm.operationalSystem || undefined,
      notes: leadForm.notes || undefined,
    };
    try {
      const created = await createLead(payload);
      const newLead: Lead = {
        ...backendToLocal(created),
        timeline: [
          { id: Date.now(), type: "creation" as const, title: "Lead Created Manually", desc: `Lead added to database by ${currentUser?.full_name || 'system user'}.`, time: "Just now" }
        ],
      };
      setLeads([newLead, ...leads]);
      setSelectedLeadId(newLead.id);
    } catch (err) {
      console.error("Failed to create lead:", err);
    }
    setIsCreateModalOpen(false);
    setLeadForm({ name: '', jobTitle: '', email: '', phone: '', company: '', industry: '', location: '', numberOfEmployees: '', source: '', currentCRM: '', operationalSystem: '', status: 'New', priority: 'Medium', owner: currentUser?.full_name || '', notes: '' });
  };

  // Action: Edit Lead Submit
  const handleEditLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLead) return;
    const payload: Record<string, unknown> = {
      title: leadForm.name,
      company_name: leadForm.company,
      job_title: leadForm.jobTitle || undefined,
      email: leadForm.email || undefined,
      phone: leadForm.phone || undefined,
      status: STATUS_MAP[leadForm.status as string] || leadForm.status,
      priority: leadForm.priority,
      source: SOURCE_MAP[leadForm.source as string] || leadForm.source || undefined,
      industry: leadForm.industry || undefined,
      location: leadForm.location || undefined,
      employee_count: leadForm.numberOfEmployees ? parseInt(leadForm.numberOfEmployees, 10) || undefined : undefined,
      current_crm: leadForm.currentCRM || undefined,
      operational_systems: leadForm.operationalSystem || undefined,
      notes: leadForm.notes || undefined,
    };
    try {
      const updated = await updateLead(activeLead.id, payload);
      setLeads(leads.map(l => l.id === activeLead.id ? backendToLocal(updated) : l));
      fetchLeadRecommendation(String(activeLead.id)).then(res => {
        setLeadRecommendations(prev => ({ ...prev, [activeLead.id]: res.recommendations?.[0] || 'No recommendation available.' }));
      }).catch(() => {});
    } catch (err) {
      console.error("Failed to update lead:", err);
    }
    setIsEditModalOpen(false);
  };

  // Action: Delete Lead
  const handleDeleteLead = async () => {
    if (!deleteConfirmId) return;
    try {
      await apiDeleteLead(deleteConfirmId);
      const remaining = leads.filter(l => l.id !== deleteConfirmId);
      setLeads(remaining);
      if (selectedLeadId === deleteConfirmId) {
        setSelectedLeadId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err) {
      console.error("Failed to delete lead:", err);
    }
    setDeleteConfirmId(null);
  };

  // Action: Convert Lead (Updates status to Converted)
  const handleConvertLead = (id: string) => {
    const lead = leads.find(l => l.id === id);
    setConvertingLeadId(id);
    setConvertForm({
      industry: lead?.industry || '',
      revenue: lead?.value ? String(lead.value) : '',
      employeeCount: lead?.employee_count ? String(lead.employee_count) : '',
      pipelineStageId: '',
    });
    setIsConvertModalOpen(true);
  };

  const handleConvertLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertingLeadId) return;
    try {
      const payload = {
        industry: convertForm.industry || undefined,
        revenue: convertForm.revenue ? Number(convertForm.revenue.replace(/[^0-9.]/g, '')) : undefined,
        employee_count: convertForm.employeeCount ? Number(convertForm.employeeCount) : undefined,
        pipeline_stage_id: convertForm.pipelineStageId || undefined,
      };
      await convertLead(convertingLeadId, payload);
      
      // Update local state
      setLeads(leads.map(l => {
        if (l.id === convertingLeadId) {
          return {
            ...l,
            status: 'Converted' as const,
            industry: convertForm.industry || l.industry,
            employee_count: convertForm.employeeCount ? Number(convertForm.employeeCount) : l.employee_count,
            timeline: [
              { id: Date.now(), type: 'conversion', title: 'Lead Converted', desc: 'Converted to active Account & Deal pipeline opportunity.', time: 'Just now' },
              ...l.timeline
            ]
          };
        }
        return l;
      }));
      fetchLeadRecommendation(convertingLeadId).then(res => {
        setLeadRecommendations(prev => ({ ...prev, [convertingLeadId]: res.recommendations?.[0] || 'No recommendation available.' }));
      }).catch(() => {});
      setIsConvertModalOpen(false);
      setConvertingLeadId(null);
    } catch (err) {
      console.error("Failed to convert lead:", err);
      // Fallback update in case of API issues so UI works smoothly
      setLeads(leads.map(l => {
        if (l.id === convertingLeadId) {
          return {
            ...l,
            status: 'Converted' as const,
            industry: convertForm.industry || l.industry,
            employee_count: convertForm.employeeCount ? Number(convertForm.employeeCount) : l.employee_count,
            timeline: [
              { id: Date.now(), type: 'conversion', title: 'Lead Converted (Offline)', desc: 'Converted to active Account & Deal pipeline opportunity.', time: 'Just now' },
              ...l.timeline
            ]
          };
        }
        return l;
      }));
      setIsConvertModalOpen(false);
      setConvertingLeadId(null);
    }
  };

  // Action: Send Email Submit
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLead) return;
    if (!gmailConnectionId || !gmailConnected) {
      setEmailError('Gmail is not connected. Please connect Gmail in Integrations settings first.');
      return;
    }
    if (!activeLead.email) {
      setEmailError('This lead has no email address. Edit the lead to add an email first.');
      return;
    }
    setEmailSending(true);
    setEmailError(null);
    try {
      const result = await sendGmailEmail({
        gmail_connection_id: gmailConnectionId,
        receiver: activeLead.email,
        subject: emailForm.subject,
        html_body: emailForm.body,
        external_entity_type: 'lead',
        external_entity_id: activeLead.id,
      });
      const newEmail: EmailItem = {
        id: Date.now(),
        subject: emailForm.subject,
        body: emailForm.body,
        time: 'Just now'
      };
      const newActivity: ActivityItem = {
        id: Date.now() + 1,
        type: 'email',
        title: `Email Sent: ${emailForm.subject}`,
        desc: `Sent to ${activeLead.email}. ${emailForm.body.substring(0, 40)}...`,
        time: 'Just now'
      };
      setLeads(leads.map(l => {
        if (l.id === activeLead.id) {
          return {
            ...l,
            emails: [newEmail, ...l.emails],
            timeline: [newActivity, ...l.timeline]
          };
        }
        return l;
      }));
      fetchLeadRecommendation(String(activeLead.id)).then(res => {
        setLeadRecommendations(prev => ({ ...prev, [activeLead.id]: res.recommendations?.[0] || 'No recommendation available.' }));
      }).catch(() => {});
      setIsEmailModalOpen(false);
      setEmailForm({ subject: '', body: '' });
    } catch (err: any) {
      setEmailError(err?.message || 'Failed to send email. Please try again.');
    } finally {
      setEmailSending(false);
    }
  };

  // Action: Log Call Submit
  const handleLogCall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLead) return;
    setLeads(leads.map(l => {
      if (l.id === activeLead.id) {
        const newCall: CallItem = {
          id: Date.now(),
          outcome: callForm.outcome,
          notes: callForm.notes,
          time: 'Just now'
        };
        const newActivity: ActivityItem = {
          id: Date.now() + 1,
          type: 'call',
          title: `Call Outcome: ${callForm.outcome}`,
          desc: `Notes logged: ${callForm.notes}`,
          time: 'Just now'
        };
        return {
          ...l,
          calls: [newCall, ...l.calls],
          timeline: [newActivity, ...l.timeline]
        };
      }
      return l;
    }));
    setIsCallModalOpen(false);
    setCallForm({ outcome: 'Spoke with Lead', notes: '' });
  };

  // Action: Schedule Meeting Submit
  const handleScheduleMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLead) return;
    setLeads(leads.map(l => {
      if (l.id === activeLead.id) {
        const newMeeting: MeetingItem = {
          id: Date.now(),
          title: meetingForm.title,
          date: meetingForm.date,
          time: meetingForm.time,
          desc: meetingForm.desc
        };
        const newActivity: ActivityItem = {
          id: Date.now() + 1,
          type: 'meeting',
          title: `Meeting Scheduled: ${meetingForm.title}`,
          desc: `Agenda: ${meetingForm.desc} on ${meetingForm.date} at ${meetingForm.time}`,
          time: 'Just now'
        };
        return {
          ...l,
          meetings: [newMeeting, ...l.meetings],
          timeline: [newActivity, ...l.timeline]
        };
      }
      return l;
    }));
    setIsMeetingModalOpen(false);
    setMeetingForm({ title: '', date: '', time: '', desc: '' });
  };

  // Action: Save Editable Notes
  const handleSaveNotes = (val: string) => {
    if (!activeLead) return;
    setLeads(leads.map(l => {
      if (l.id === activeLead.id) {
        return { ...l, notes: val };
      }
      return l;
    }));
  };

  return (
    <div className="grid grid-cols-12 gap-6 items-start">
      {/* Left Pane (Table, filters, search, headers) */}
      <div className={`col-span-12 ${activeLead ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-5`}>
        <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="font-sans text-2xl text-brand-heading font-bold">Sales Leads</h2>
                {/* Priority View Toggle */}
                <button
                  type="button"
                  onClick={() => setIsPriorityView(!isPriorityView)}
                  className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold transition-all duration-200 cursor-pointer ${
                    isPriorityView
                      ? 'bg-brand-accent text-white shadow-sm ring-2 ring-brand-accent/25'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-brand-heading'
                  }`}
                >
                  <Sparkles className="h-3 w-3" />
                  <span>{isPriorityView ? 'Priority View On' : 'Priority View Off'}</span>
                </button>
              </div>
              <p className="text-[11px] text-brand-text/60 mt-0.5 font-bold">Manage prospects, monitor qualification scores, and trigger follow-ups.</p>
            </div>
            <button 
              onClick={() => {
                setLeadForm({ name: '', jobTitle: '', email: '', phone: '', company: '', industry: '', location: '', numberOfEmployees: '', source: '', currentCRM: '', operationalSystem: '', status: 'New', priority: 'Medium', owner: currentUser?.full_name || '', notes: '' });
                setIsCreateModalOpen(true);
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-lg text-xs font-bold shadow-sm/10 transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.25} />
              <span>Add Lead</span>
            </button>
          </div>

          {/* Search & Filters block */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            {/* Search Input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-slate-400">
                <Search className="h-3.5 w-3.5" />
              </span>
              <input 
                type="text" 
                placeholder="Search leads, companies..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text bg-slate-50/50 focus:bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-accent/20"
              />
            </div>
            
            {/* Status Filter */}
            <div className="relative">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-1.5 border border-brand-border-purple/35 bg-white text-brand-text/80 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-accent/20 cursor-pointer"
              >
                <option value="All">All</option>
                <option value="New">New</option>
                <option value="Converted">Converted</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div className="relative">
              <select 
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-3 py-1.5 border border-brand-border-purple/35 bg-white text-brand-text/80 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-accent/20 cursor-pointer"
              >
                <option value="All">All Priorities</option>
                <option value="Critical">Critical Priority</option>
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </div>
          </div>

          {/* Lead Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                {isPriorityView ? (
                  <tr className="border-b border-brand-border-purple/20 text-[9px] uppercase font-extrabold tracking-wider text-black pb-2">
                    <th className="pb-2">Company Name</th>
                    <th className="pb-2 text-center">Fit Score</th>
                    <th className="pb-2 text-center">Engagement Score</th>
                    <th className="pb-2 text-center">Overall Score</th>
                    <th className="pb-2">Recommendation</th>
                    <th className="pb-2 text-right">Actions</th>
                  </tr>
                ) : (
                  <tr className="border-b border-brand-border-purple/20 text-[9px] uppercase font-extrabold tracking-wider text-black pb-2">
                    <th className="pb-2">Name & Company</th>
                    <th className="pb-2 text-center">Score</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Priority</th>
                    <th className="pb-2">Owner</th>
                    <th className="pb-2 text-right">Actions</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-brand-border-purple/15 text-xs text-brand-text font-semibold">
                {displayLeads.length > 0 ? (
                  displayLeads.map((lead, idx) => {
                    const isSelected = lead.id === selectedLeadId;
                    const isTopPriority = isPriorityView && idx === 0;
                    return (
                      <tr 
                        key={lead.id}
                        onClick={() => setSelectedLeadId(lead.id)}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          setSelectedLeadId(prevId => prevId === lead.id ? null : prevId);
                        }}
                        className={`hover:bg-slate-50/50 cursor-pointer transition-all duration-200 ${
                          isSelected ? 'bg-brand-secondary-accent/10' : ''
                        } ${isTopPriority ? 'border-l-4 border-l-brand-accent bg-brand-accent/[0.03]' : ''}`}
                      >
                        {isPriorityView ? (
                          <>
                            {/* Company Name */}
                            <td className="py-3">
                              <div className="font-extrabold text-black flex items-center space-x-1.5">
                                <Building2 className="h-3.5 w-3.5 text-black shrink-0" />
                                <span>{lead.company}</span>
                              </div>
                              <div className="text-[10px] text-brand-text/60 mt-0.5 ml-5">
                                Contact: {lead.name}
                              </div>
                            </td>
                            {/* Fit Score */}
                            <td className="py-3 text-center">
                              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                                {lead.fit_score ?? 0}%
                              </span>
                            </td>
                            {/* Engagement Score */}
                            <td className="py-3 text-center">
                              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 text-black">
                                {lead.engagement_score ?? 0}%
                              </span>
                            </td>
                            {/* Overall Score */}
                            <td className="py-3 text-center">
                              <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded tabular-nums ${
                                lead.score >= 80 ? 'text-emerald-700 bg-emerald-50' :
                                lead.score >= 60 ? 'text-amber-700 bg-amber-50' : 'text-rose-700 bg-rose-50'
                              }`}>
                                {lead.score}%
                              </span>
                            </td>
                            {/* Recommendation */}
                            <td className="py-3">
                              <div className="text-[10px] text-brand-heading font-bold max-w-[220px] truncate" title={getAIRecommendation(lead)}>
                                {getAIRecommendation(lead)}
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            {/* Name & Company */}
                            <td className="py-3">
                              <div className="font-extrabold text-brand-heading">{lead.name}</div>
                              <div className="text-[10px] text-brand-text/60 mt-0.5 flex items-center">
                                <Building2 className="h-3.5 w-3.5 mr-1 text-brand-text/40" />
                                {lead.company}
                              </div>
                            </td>
                            
                            {/* Lead Score */}
                            <td className="py-3 text-center">
                              <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded tabular-nums ${
                                lead.score >= 80 ? 'text-emerald-700 bg-emerald-50' :
                                lead.score >= 60 ? 'text-amber-700 bg-amber-50' : 'text-rose-700 bg-rose-50'
                              }`}>
                                {lead.score}
                              </span>
                            </td>

                            {/* Status Badge */}
                            <td className="py-3">
                              <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                                lead.status === 'New' ? 'text-blue-750 bg-blue-50' :
                                lead.status === 'Contacted' ? 'text-yellow-750 bg-yellow-50' :
                                lead.status === 'Qualified' ? 'text-purple-750 bg-purple-50' :
                                lead.status === 'Converted' ? 'text-emerald-750 bg-emerald-50 border border-emerald-100' : 'text-slate-500 bg-slate-100'
                              }`}>
                                {lead.status}
                              </span>
                            </td>

                            {/* Priority Badge */}
                            <td className="py-3">
                              <span className={`text-[9px] font-bold ${
                                lead.priorityTier === 'Critical' ? 'text-emerald-600' :
                                lead.priorityTier === 'High' ? 'text-rose-600' :
                                lead.priorityTier === 'Medium' ? 'text-amber-600' :
                                lead.priorityTier === 'Low' ? 'text-slate-500' : 'text-slate-300'
                              }`}>
                                ● {lead.priorityTier || lead.priority}
                              </span>
                            </td>

                            {/* Owner */}
                            <td className="py-3">
                              <div className="flex items-center space-x-1.5">
                                <img src={lead.ownerAvatar} alt={lead.owner} className="h-5 w-5 rounded-full border border-slate-200" />
                                <span className="text-[10px] text-brand-text/80 truncate max-w-[80px]">{lead.owner.split(' ')[0]}</span>
                              </div>
                            </td>
                          </>
                        )}

                        {/* Row Actions */}
                        <td className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end space-x-1">
                            {lead.status !== 'Converted' && (
                              <button 
                                onClick={() => handleConvertLead(lead.id)}
                                className="px-2 py-0.5 border border-emerald-250 text-emerald-750 hover:bg-emerald-600 hover:text-white rounded text-[10px] font-extrabold transition-colors cursor-pointer"
                                title="Convert Lead"
                              >
                                Convert
                              </button>
                            )}
                            <button 
                              onClick={() => {
                                setSelectedLeadId(lead.id);
                                setLeadForm({
                                  name: lead.name,
                                  jobTitle: lead.jobTitle || '',
                                  company: lead.company,
                                  email: lead.email,
                                  phone: lead.phone,
                                  industry: lead.industry || '',
                                  location: lead.location || '',
                                  numberOfEmployees: lead.numberOfEmployees || '',
                                  source: lead.source || '',
                                  currentCRM: lead.currentCRM || '',
                                  operationalSystem: lead.operationalSystem || '',
                                  status: lead.status,
                                  priority: lead.priority,
                                  owner: lead.owner,
                                  notes: lead.notes
                                });
                                setIsEditModalOpen(true);
                              }}
                              className="p-1 text-slate-400 hover:text-brand-heading hover:bg-slate-100 rounded transition-colors cursor-pointer"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button 
                              onClick={() => setDeleteConfirmId(lead.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
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
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No leads matching search or filter selections.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right Pane (Selected Lead Details drawer, activities, timeline logs, editable notes, AI advice) */}
      {activeLead && <div className="col-span-12 lg:col-span-4 space-y-5">
        <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5 sticky top-20">
          {/* Card Title Header */}
          <div className="flex items-start justify-between border-b border-brand-border-purple/15 pb-3">
            <div>
              <h3 className="font-extrabold text-brand-heading text-sm">{activeLead.name}</h3>
              <p className="text-[10px] text-brand-text/60 font-bold">{activeLead.company}</p>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Circular score progress indicator */}
              <div className="flex items-center space-x-1 bg-brand-sidebar-hover/30 border border-brand-border-purple/35 rounded-lg px-2 py-0.5">
                <Award className="h-3.5 w-3.5 text-brand-accent" strokeWidth={2} />
                <span className="text-[10px] font-extrabold text-brand-text tabular-nums">{activeLead.score}%</span>
              </div>
              
              {/* Close Button */}
              <button 
                onClick={() => setSelectedLeadId(null)}
                className="p-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 hover:border-slate-300 rounded text-slate-500 hover:text-slate-700 transition-all duration-200 cursor-pointer"
                title="Close Summary"
                aria-label="Close Summary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Quick Details Fields list */}
          <div className="py-3.5 space-y-2.5 text-[11px] font-semibold border-b border-brand-border-purple/15">
            <div className="flex justify-between">
              <span className="text-brand-text/50">Status</span>
              <span className={`font-bold px-1.5 py-0.25 rounded ${
                activeLead.status === 'Converted' ? 'text-emerald-700 bg-emerald-50' : 'text-brand-heading'
              }`}>{activeLead.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-text/50">Priority</span>
              <span className={`font-bold ${
                activeLead.priorityTier === 'Critical' ? 'text-emerald-700 bg-emerald-50 px-1.5 py-0.25 rounded' :
                activeLead.priorityTier === 'High' ? 'text-amber-700 bg-amber-50 px-1.5 py-0.25 rounded' :
                activeLead.priorityTier === 'Medium' ? 'text-blue-700 bg-blue-50 px-1.5 py-0.25 rounded' :
                activeLead.priorityTier === 'Low' ? 'text-slate-500 bg-slate-50 px-1.5 py-0.25 rounded' : ''
              }`}>{activeLead.priorityTier || activeLead.priority}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-text/50">Email</span>
              <a href={`mailto:${activeLead.email}`} className="text-brand-accent hover:underline truncate max-w-[150px]">{activeLead.email}</a>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-text/50">Phone</span>
              <span className="text-brand-text tabular-nums">{activeLead.phone}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-brand-text/50">Owner</span>
              <div className="flex items-center space-x-1">
                <img src={activeLead.ownerAvatar} alt={activeLead.owner} className="h-4.5 w-4.5 rounded-full border border-slate-200" />
                <span className="text-brand-text">{activeLead.owner}</span>
              </div>
            </div>
          </div>

          {/* AI Recommendation Alert box */}
          <div className="mt-4 bg-brand-sidebar-hover/20 border border-brand-border-purple/30 rounded-xl p-3.5 flex items-start space-x-2">
            <Sparkles className="h-4.5 w-4.5 text-brand-accent shrink-0 mt-0.5" strokeWidth={2} />
            <div>
              <h4 className="text-[10px] font-extrabold text-brand-heading uppercase tracking-wider">AI Next Best Action</h4>
              <p className="text-[10px] text-brand-text/80 mt-1 leading-relaxed font-bold">{getAIRecommendation(activeLead)}</p>
            </div>
          </div>

          {/* Priority View - Advanced Scoring Details (toggled on/off) */}
          {isPriorityView && (
            <div className="mt-4 border border-brand-border-purple/30 rounded-xl p-3.5">
              <h4 className="text-[10px] font-extrabold text-brand-heading uppercase tracking-wider flex items-center space-x-1 mb-3">
                <Award className="h-4 w-4 text-brand-accent" />
                <span>Priority Scoring Details</span>
              </h4>
              <div className="space-y-2.5 text-[10px] font-bold">
                <div className="flex justify-between items-center">
                  <span className="text-brand-text/60">Fit Score</span>
                  <span className="font-extrabold text-brand-heading">{activeLead.fit_score ?? 0}%</span>
                </div>
                {activeLead.fit_score !== null && activeLead.topReasons.filter(r => r.includes('company') || r.includes('industry') || r.includes('CRM') || r.includes('automation') || r.includes('customization')).length > 0 && (
                  <div className="text-[9px] text-brand-text/70 leading-relaxed pl-2 border-l-2 border-blue-200">
                    {activeLead.topReasons.filter(r => r.includes('company') || r.includes('industry') || r.includes('CRM') || r.includes('automation') || r.includes('customization')).slice(0, 2).map((r, i) => (
                      <div key={i} className="mb-0.5">• {r}</div>
                    ))}
                  </div>
                )}
                <div className="border-t border-brand-border-purple/10" />
                <div className="flex justify-between items-center">
                  <span className="text-brand-text/60">Engagement Score</span>
                  <span className="font-extrabold text-brand-heading">{activeLead.engagement_score ?? 0}%</span>
                </div>
                {activeLead.engagementReasons.length > 0 && (
                  <div className="text-[9px] text-brand-text/70 leading-relaxed pl-2 border-l-2 border-amber-200">
                    {activeLead.engagementReasons.slice(0, 2).map((r, i) => (
                      <div key={i} className="mb-0.5">• {r}</div>
                    ))}
                  </div>
                )}
                <div className="border-t border-brand-border-purple/10" />
                <div className="flex justify-between items-center">
                  <span className="text-brand-text/60">Overall Score</span>
                  <span className={`font-extrabold tabular-nums ${
                    activeLead.score >= 80 ? 'text-emerald-600' : activeLead.score >= 60 ? 'text-amber-600' : 'text-rose-600'
                  }`}>{activeLead.score}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-brand-text/60">Tier</span>
                  <span className={`font-extrabold ${
                    activeLead.priorityTier === 'Critical' ? 'text-emerald-600' :
                    activeLead.priorityTier === 'High' ? 'text-amber-600' :
                    activeLead.priorityTier === 'Medium' ? 'text-blue-600' :
                    activeLead.priorityTier === 'Low' ? 'text-slate-500' : 'text-slate-300'
                  }`}>{activeLead.priorityTier || activeLead.priority}</span>
                </div>
                {activeLead.topReasons.length > 0 && (
                  <div className="border-t border-brand-border-purple/10 pt-2">
                    <span className="text-[9px] text-brand-text/60 uppercase tracking-wider font-extrabold">Top Reasons</span>
                    <div className="mt-1 text-[9px] text-brand-text/80 leading-relaxed">
                      {activeLead.topReasons.slice(0, 3).map((r, i) => (
                        <div key={i} className="mb-0.5">• {r}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Live Notes block */}
          <div className="mt-4">
            <h4 className="text-[10px] font-extrabold text-brand-heading uppercase tracking-wider mb-1.5">Internal Notes</h4>
            <textarea
              className="w-full p-2 border border-brand-border-purple/30 rounded-lg text-[11px] font-semibold text-brand-text bg-slate-50/50 focus:bg-white placeholder-slate-450 focus:outline-none focus:ring-1 focus:ring-brand-accent/20 min-h-[70px] resize-y leading-relaxed"
              value={activeLead.notes}
              onChange={(e) => handleSaveNotes(e.target.value)}
              placeholder="Record lead feedback, key challenges, sizing metrics..."
            />
          </div>

          {/* Action Triggers panel */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            <button 
              onClick={() => setIsEmailModalOpen(true)}
              className="inline-flex items-center justify-center space-x-1 py-1.5 border border-brand-border-purple/35 hover:border-brand-border-purple hover:bg-slate-50 rounded-lg text-[10px] font-extrabold text-brand-text/80 cursor-pointer transition-colors"
            >
              <Mail className="h-3.5 w-3.5 text-slate-450" />
              <span>Email</span>
            </button>
            <button 
              onClick={() => setIsCallModalOpen(true)}
              className="inline-flex items-center justify-center space-x-1 py-1.5 border border-brand-border-purple/35 hover:border-brand-border-purple hover:bg-slate-50 rounded-lg text-[10px] font-extrabold text-brand-text/80 cursor-pointer transition-colors"
            >
              <Phone className="h-3.5 w-3.5 text-slate-450" />
              <span>Log Call</span>
            </button>
            <button 
              onClick={() => setIsMeetingModalOpen(true)}
              className="inline-flex items-center justify-center space-x-1 py-1.5 border border-brand-border-purple/35 hover:border-brand-border-purple hover:bg-slate-50 rounded-lg text-[10px] font-extrabold text-brand-text/80 cursor-pointer transition-colors"
            >
              <Calendar className="h-3.5 w-3.5 text-slate-450" />
              <span>Meet</span>
            </button>
          </div>          {/* Activity Feeds Tabs toggles */}
          <div className="mt-5 border-t border-brand-border-purple/15 pt-4">
            <div className="flex border-b border-brand-border-purple/15 text-[10px] font-extrabold uppercase flex-wrap">
              {['timeline', 'emails', 'calls', 'meetings', 'activity chart'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveHistoryTab(tab)}
                  className={`pb-1.5 px-2.5 border-b-2 transition-all cursor-pointer ${
                    activeHistoryTab === tab 
                      ? 'border-brand-secondary-accent text-brand-heading' 
                      : 'border-transparent text-slate-450 hover:text-brand-text'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
 
            {/* Tab content loops */}
            <div className="mt-3.5 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
              {activeHistoryTab === 'timeline' && (
                <div className="space-y-3 pl-2 border-l border-brand-border-purple/15">
                  {activeLead.timeline.length > 0 ? (
                    activeLead.timeline.map((act) => (
                      <div key={act.id} className="relative text-[10px] font-semibold leading-relaxed">
                        {/* Dot indicator */}
                        <div className="absolute -left-[12.5px] top-1 h-2 w-2 rounded-full bg-brand-secondary-accent border border-white" />
                        <div className="font-extrabold text-brand-heading flex justify-between">
                          <span>{act.title}</span>
                          <span className="text-slate-400 font-bold">{act.time}</span>
                        </div>
                        <p className="text-brand-text/75 mt-0.5">{act.desc}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-slate-400 py-3 text-[10px]">No timeline logs recorded.</p>
                  )}
                </div>
              )}
 
              {activeHistoryTab === 'emails' && (
                <div className="space-y-2.5">
                  {activeLead.emails.length > 0 ? (
                    activeLead.emails.map((e) => (
                      <div key={e.id} className="p-2 border border-brand-border-purple/20 rounded-lg bg-slate-50/50">
                        <div className="flex justify-between items-center text-[10px] font-extrabold text-brand-heading">
                          <span className="truncate max-w-[150px]">{e.subject}</span>
                          <span className="text-slate-400 font-bold">{e.time}</span>
                        </div>
                        <p className="text-[10px] text-brand-text/80 mt-1 leading-relaxed font-semibold">{e.body}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-slate-400 py-3 text-[10px]">No emails logged.</p>
                  )}
                </div>
              )}
 
              {activeHistoryTab === 'calls' && (
                <div className="space-y-2.5">
                  {activeLead.calls.length > 0 ? (
                    activeLead.calls.map((c) => (
                      <div key={c.id} className="p-2 border border-brand-border-purple/20 rounded-lg bg-slate-50/50">
                        <div className="flex justify-between items-center text-[10px] font-extrabold text-brand-heading">
                          <span>{c.outcome}</span>
                          <span className="text-slate-400 font-bold">{c.time}</span>
                        </div>
                        <p className="text-[10px] text-brand-text/80 mt-1 leading-relaxed font-semibold">{c.notes}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-slate-400 py-3 text-[10px]">No call notes logged.</p>
                  )}
                </div>
              )}
 
              {activeHistoryTab === 'meetings' && (
                <div className="space-y-2.5">
                  {activeLead.meetings.length > 0 ? (
                    activeLead.meetings.map((m) => (
                      <div key={m.id} className="p-2 border border-brand-border-purple/20 rounded-lg bg-slate-50/50">
                        <div className="flex justify-between items-center text-[10px] font-extrabold text-brand-heading">
                          <span>{m.title}</span>
                          <span className="text-brand-accent">{m.date}</span>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-0.5 font-bold">Time: {m.time}</p>
                        <p className="text-[10px] text-brand-text/80 mt-1 leading-relaxed font-semibold">{m.desc}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-slate-400 py-3 text-[10px]">No meetings scheduled.</p>
                  )}
                </div>
              )}

              {activeHistoryTab === 'activity chart' && (
                <div className="space-y-3 p-1">
                  <div className="p-3 border border-brand-border-purple/20 rounded-xl bg-slate-50/50">
                    <h5 className="text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-2 flex items-center space-x-1">
                      <TrendingUp className="h-3.5 w-3.5 text-brand-accent" />
                      <span>Lead Progression & Score Trend</span>
                    </h5>
                    <div className="w-full h-32 relative">
                      <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
                        <line x1="0" y1="90" x2="300" y2="90" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3,3" />
                        <line x1="0" y1="50" x2="300" y2="50" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3,3" />
                        <line x1="0" y1="10" x2="300" y2="10" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3,3" />
                        
                        <path
                          d={getProgressPoints(activeLead.score).areaPath}
                          fill="url(#purpleGradLeads)"
                          opacity="0.15"
                        />
                        
                        <path
                          d={getProgressPoints(activeLead.score).path}
                          fill="none"
                          stroke="#7957fb"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                        
                        {getProgressPoints(activeLead.score).points.map((p, idx) => (
                          <circle key={idx} cx={p.x} cy={p.y} r="4" fill="#7957fb" stroke="white" strokeWidth="1.5" />
                        ))}

                        <defs>
                          <linearGradient id="purpleGradLeads" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#7957fb" />
                            <stop offset="100%" stopColor="#7957fb" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                      </svg>
                      
                      <div className="flex justify-between text-[8px] font-bold text-slate-400 mt-1">
                        <span>Created ({activeLead.timeline[activeLead.timeline.length - 1]?.time || '5d ago'})</span>
                        <span>Midpoint</span>
                        <span>Today (Score: {activeLead.score})</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      }

      {/* CREATE LEAD DIALOG MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-brand-border-purple/25 rounded-xl shadow-xl w-full max-w-lg animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-brand-border-purple/15 flex justify-between items-center bg-gradient-to-r from-slate-50 to-brand-sidebar-hover/20 rounded-t-xl">
              <div>
                <h3 className="font-bold text-brand-heading text-sm">Create New Lead</h3>
                <p className="text-[10px] text-brand-text/50 font-semibold mt-0.5">Capture prospect details across all dimensions</p>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-brand-text p-1 cursor-pointer hover:bg-slate-100 rounded transition-colors"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleCreateLead} className="max-h-[70vh] overflow-y-auto scrollbar-thin">
              {/* LEAD INFORMATION Section */}
              <div className="px-5 pt-5 pb-4">
                <div className="flex items-center space-x-1.5 mb-3">
                  <User className="h-3.5 w-3.5 text-brand-accent" />
                  <h4 className="text-[10px] font-extrabold text-brand-heading uppercase tracking-wider">Lead Information</h4>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input type="text" required placeholder="e.g. John Doe" value={leadForm.name} onChange={(e) => setLeadForm({...leadForm, name: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-accent/20 bg-white hover:border-brand-border-purple/50 transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Job Title</label>
                      <input type="text" placeholder="e.g. VP of Engineering" value={leadForm.jobTitle} onChange={(e) => setLeadForm({...leadForm, jobTitle: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-accent/20 bg-white hover:border-brand-border-purple/50 transition-colors" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">
                        Email <span className="text-rose-500">*</span>
                      </label>
                      <input type="email" required placeholder="name@company.com" value={leadForm.email} onChange={(e) => setLeadForm({...leadForm, email: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-accent/20 bg-white hover:border-brand-border-purple/50 transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Phone Number</label>
                      <input type="text" placeholder="+1 (555) 000-0000" value={leadForm.phone} onChange={(e) => setLeadForm({...leadForm, phone: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-accent/20 bg-white hover:border-brand-border-purple/50 transition-colors" />
                    </div>
                  </div>
                </div>
              </div>

              {/* COMPANY INFORMATION Section */}
              <div className="px-5 pb-4 pt-1 border-t border-brand-border-purple/10">
                <div className="flex items-center space-x-1.5 mb-3 mt-3">
                  <Building2 className="h-3.5 w-3.5 text-brand-accent" />
                  <h4 className="text-[10px] font-extrabold text-brand-heading uppercase tracking-wider">Company Information</h4>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">
                        Company Name <span className="text-rose-500">*</span>
                      </label>
                      <input type="text" required placeholder="e.g. Acme Corp" value={leadForm.company} onChange={(e) => setLeadForm({...leadForm, company: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-accent/20 bg-white hover:border-brand-border-purple/50 transition-colors" />
                    </div>
                    <div className="relative">
                      <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">
                        Industry <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsCreateIndustryOpen(!isCreateIndustryOpen)}
                        className="w-full flex items-center justify-between px-3 py-1.5 border border-brand-border-purple/35 bg-white text-brand-text rounded-lg text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-accent/20 hover:border-brand-border-purple/50 transition-colors text-left"
                      >
                        <span>{leadForm.industry || "Select Industry"}</span>
                        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                      </button>
                      {isCreateIndustryOpen && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setIsCreateIndustryOpen(false)} />
                          <div className="absolute left-0 right-0 mt-1 max-h-36 overflow-y-auto bg-white border border-brand-border-purple/30 rounded-lg shadow-lg z-20 scrollbar-thin">
                            {[
                              "Manufacturing", "Healthcare", "Pharma", "Logistics", "Construction", 
                              "Education", "Finance", "Insurance", "Hospitality", "Real Estate", 
                              "Agriculture", "Legal", "Retail", "Media", "Consulting", "IT"
                            ].map((ind) => (
                              <button
                                key={ind}
                                type="button"
                                onClick={() => {
                                  setLeadForm({ ...leadForm, industry: ind });
                                  setIsCreateIndustryOpen(false);
                                }}
                                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 transition-colors font-semibold ${
                                  leadForm.industry === ind ? 'bg-brand-secondary-accent/10 text-brand-heading font-extrabold' : 'text-brand-text'
                                }`}
                              >
                                {ind}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Location</label>
                      <input type="text" placeholder="e.g. San Francisco, CA" value={leadForm.location} onChange={(e) => setLeadForm({...leadForm, location: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-accent/20 bg-white hover:border-brand-border-purple/50 transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Number of Employees</label>
                      <select value={leadForm.numberOfEmployees} onChange={(e) => setLeadForm({...leadForm, numberOfEmployees: e.target.value})} className="w-full px-2 py-1.5 border border-brand-border-purple/35 bg-white text-brand-text rounded-lg text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-accent/20 hover:border-brand-border-purple/50 transition-colors">
                        <option value="">Select Range</option>
                        <option>1</option>
                        <option>10</option>
                        <option>50</option>
                        <option>200</option>
                        <option>500</option>
                        <option>1001</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* LEAD SOURCE Section */}
              <div className="px-5 pb-4 pt-1 border-t border-brand-border-purple/10">
                <div className="flex items-center space-x-1.5 mb-3 mt-3">
                  <Globe className="h-3.5 w-3.5 text-brand-accent" />
                  <h4 className="text-[10px] font-extrabold text-brand-heading uppercase tracking-wider">Lead Source</h4>
                </div>
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">
                    Source <span className="text-rose-500">*</span>
                  </label>
                  <select required value={leadForm.source} onChange={(e) => setLeadForm({...leadForm, source: e.target.value})} className="w-full px-2 py-1.5 border border-brand-border-purple/35 bg-white text-brand-text rounded-lg text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-accent/20 hover:border-brand-border-purple/50 transition-colors">
                    <option value="">Select Source</option>
                    <option>Website</option>
                    <option>Referral</option>
                    <option>LinkedIn</option>
                    <option>Cold Email</option>
                    <option>Event</option>
                    <option>Webinar</option>
                    <option>Partner</option>
                    <option>Paid Ads</option>
                    <option>Organic Search</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              {/* CURRENT SOFTWARE Section */}
              <div className="px-5 pb-5 pt-1 border-t border-brand-border-purple/10">
                <div className="flex items-center space-x-1.5 mb-3 mt-3">
                  <Monitor className="h-3.5 w-3.5 text-brand-accent" />
                  <h4 className="text-[10px] font-extrabold text-brand-heading uppercase tracking-wider">Current Software</h4>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Current CRM</label>
                    <input type="text" placeholder="e.g. Salesforce, HubSpot" value={leadForm.currentCRM} onChange={(e) => setLeadForm({...leadForm, currentCRM: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-accent/20 bg-white hover:border-brand-border-purple/50 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Operational System</label>
                    <input type="text" placeholder="e.g. SAP, Oracle ERP" value={leadForm.operationalSystem} onChange={(e) => setLeadForm({...leadForm, operationalSystem: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-accent/20 bg-white hover:border-brand-border-purple/50 transition-colors" />
                  </div>
                </div>
              </div>

              {/* Submit Footer */}
              <div className="px-5 py-3.5 border-t border-brand-border-purple/15 bg-slate-50/50 flex items-center justify-between rounded-b-xl">
                <p className="text-[9px] text-brand-text/40 font-semibold"><span className="text-rose-500">*</span> Required fields</p>
                <div className="flex space-x-2.5">
                  <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-1.5 border border-brand-border-purple/30 rounded-lg text-xs font-bold text-brand-text/75 hover:bg-slate-100 cursor-pointer transition-colors">Cancel</button>
                  <button type="submit" className="px-5 py-1.5 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-lg text-xs font-bold shadow-sm/10 cursor-pointer transition-colors">Create Lead</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT LEAD DIALOG MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-brand-border-purple/25 rounded-xl shadow-xl w-full max-w-lg animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-brand-border-purple/15 flex justify-between items-center bg-gradient-to-r from-slate-50 to-brand-sidebar-hover/20 rounded-t-xl">
              <div>
                <h3 className="font-bold text-brand-heading text-sm">Edit Lead Details</h3>
                <p className="text-[10px] text-brand-text/50 font-semibold mt-0.5">Update prospect details across all dimensions</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-brand-text p-1 cursor-pointer hover:bg-slate-100 rounded transition-colors"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleEditLead} className="max-h-[70vh] overflow-y-auto scrollbar-thin">
              {/* LEAD STATUS & ASSIGNMENT Section */}
              <div className="px-5 pt-5 pb-4">
                <div className="flex items-center space-x-1.5 mb-3">
                  <Award className="h-3.5 w-3.5 text-brand-accent" />
                  <h4 className="text-[10px] font-extrabold text-brand-heading uppercase tracking-wider">Status & Assignment</h4>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Status</label>
                    <select value={leadForm.status} onChange={(e) => setLeadForm({...leadForm, status: e.target.value as any})} className="w-full px-2 py-1.5 border border-brand-border-purple/35 bg-white text-brand-text rounded-lg text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-accent/20">
                      <option>New</option>
                      <option>Contacted</option>
                      <option>Qualified</option>
                      <option>Converted</option>
                      <option>Lost</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Priority</label>
                    <select value={leadForm.priority} onChange={(e) => setLeadForm({...leadForm, priority: e.target.value as any})} className="w-full px-2 py-1.5 border border-brand-border-purple/35 bg-white text-brand-text rounded-lg text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-accent/20">
                      <option>Critical</option>
                      <option>High</option>
                      <option>Medium</option>
                      <option>Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Owner</label>
                    <select value={leadForm.owner} onChange={(e) => setLeadForm({...leadForm, owner: e.target.value})} className="w-full px-2 py-1.5 border border-brand-border-purple/35 bg-white text-brand-text rounded-lg text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-accent/20">
                      {users.length > 0 ? (
                        users.map(u => (
                          <option key={u.id} value={u.full_name}>{u.full_name}</option>
                        ))
                      ) : (
                        <option>{currentUser?.full_name || 'Sarah Johnson'}</option>
                      )}
                    </select>
                  </div>
                </div>
              </div>

              {/* LEAD INFORMATION Section */}
              <div className="px-5 pb-4 pt-1 border-t border-brand-border-purple/10">
                <div className="flex items-center space-x-1.5 mb-3 mt-3">
                  <User className="h-3.5 w-3.5 text-brand-accent" />
                  <h4 className="text-[10px] font-extrabold text-brand-heading uppercase tracking-wider">Lead Information</h4>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Full Name</label>
                      <input type="text" required placeholder="e.g. John Doe" value={leadForm.name} onChange={(e) => setLeadForm({...leadForm, name: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-accent/20 bg-white" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Job Title</label>
                      <input type="text" placeholder="e.g. VP of Engineering" value={leadForm.jobTitle} onChange={(e) => setLeadForm({...leadForm, jobTitle: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-accent/20 bg-white" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Email</label>
                      <input type="email" required placeholder="name@company.com" value={leadForm.email} onChange={(e) => setLeadForm({...leadForm, email: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-accent/20 bg-white" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Phone Number</label>
                      <input type="text" placeholder="+1 (555) 000-0000" value={leadForm.phone} onChange={(e) => setLeadForm({...leadForm, phone: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-accent/20 bg-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* COMPANY INFORMATION Section */}
              <div className="px-5 pb-4 pt-1 border-t border-brand-border-purple/10">
                <div className="flex items-center space-x-1.5 mb-3 mt-3">
                  <Building2 className="h-3.5 w-3.5 text-brand-accent" />
                  <h4 className="text-[10px] font-extrabold text-brand-heading uppercase tracking-wider">Company Information</h4>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Company Name</label>
                      <input type="text" required placeholder="e.g. Acme Corp" value={leadForm.company} onChange={(e) => setLeadForm({...leadForm, company: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-accent/20 bg-white" />
                    </div>
                    <div className="relative">
                      <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Industry</label>
                      <button
                        type="button"
                        onClick={() => setIsEditIndustryOpen(!isEditIndustryOpen)}
                        className="w-full flex items-center justify-between px-3 py-1.5 border border-brand-border-purple/35 bg-white text-brand-text rounded-lg text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-accent/20 hover:border-brand-border-purple/50 transition-colors text-left"
                      >
                        <span>{leadForm.industry || "Select Industry"}</span>
                        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                      </button>
                      {isEditIndustryOpen && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setIsEditIndustryOpen(false)} />
                          <div className="absolute left-0 right-0 mt-1 max-h-36 overflow-y-auto bg-white border border-brand-border-purple/30 rounded-lg shadow-lg z-20 scrollbar-thin">
                            {[
                              "Manufacturing", "Healthcare", "Pharma", "Logistics", "Construction", 
                              "Education", "Finance", "Insurance", "Hospitality", "Real Estate", 
                              "Agriculture", "Legal", "Retail", "Media", "Consulting", "IT"
                            ].map((ind) => (
                              <button
                                key={ind}
                                type="button"
                                onClick={() => {
                                  setLeadForm({ ...leadForm, industry: ind });
                                  setIsEditIndustryOpen(false);
                                }}
                                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 transition-colors font-semibold ${
                                  leadForm.industry === ind ? 'bg-brand-secondary-accent/10 text-brand-heading font-extrabold' : 'text-brand-text'
                                }`}
                              >
                                {ind}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Location</label>
                      <input type="text" placeholder="e.g. San Francisco, CA" value={leadForm.location} onChange={(e) => setLeadForm({...leadForm, location: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-accent/20 bg-white" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Number of Employees</label>
                      <select value={leadForm.numberOfEmployees} onChange={(e) => setLeadForm({...leadForm, numberOfEmployees: e.target.value})} className="w-full px-2 py-1.5 border border-brand-border-purple/35 bg-white text-brand-text rounded-lg text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-accent/20">
                        <option value="">Select Range</option>
                        <option>1</option>
                        <option>10</option>
                        <option>50</option>
                        <option>200</option>
                        <option>500</option>
                        <option>1001</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* LEAD SOURCE Section */}
              <div className="px-5 pb-4 pt-1 border-t border-brand-border-purple/10">
                <div className="flex items-center space-x-1.5 mb-3 mt-3">
                  <Globe className="h-3.5 w-3.5 text-brand-accent" />
                  <h4 className="text-[10px] font-extrabold text-brand-heading uppercase tracking-wider">Lead Source</h4>
                </div>
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Source</label>
                  <select value={leadForm.source} onChange={(e) => setLeadForm({...leadForm, source: e.target.value})} className="w-full px-2 py-1.5 border border-brand-border-purple/35 bg-white text-brand-text rounded-lg text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-accent/20">
                    <option value="">Select Source</option>
                    <option>Website</option>
                    <option>Referral</option>
                    <option>LinkedIn</option>
                    <option>Cold Email</option>
                    <option>Event</option>
                    <option>Webinar</option>
                    <option>Partner</option>
                    <option>Paid Ads</option>
                    <option>Organic Search</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              {/* CURRENT SOFTWARE Section */}
              <div className="px-5 pb-5 pt-1 border-t border-brand-border-purple/10">
                <div className="flex items-center space-x-1.5 mb-3 mt-3">
                  <Monitor className="h-3.5 w-3.5 text-brand-accent" />
                  <h4 className="text-[10px] font-extrabold text-brand-heading uppercase tracking-wider">Current Software</h4>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Current CRM</label>
                    <input type="text" placeholder="e.g. Salesforce, HubSpot" value={leadForm.currentCRM} onChange={(e) => setLeadForm({...leadForm, currentCRM: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-accent/20 bg-white" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Operational System</label>
                    <input type="text" placeholder="e.g. SAP, Oracle ERP" value={leadForm.operationalSystem} onChange={(e) => setLeadForm({...leadForm, operationalSystem: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-accent/20 bg-white" />
                  </div>
                </div>
              </div>

              {/* Submit Footer */}
              <div className="px-5 py-3.5 border-t border-brand-border-purple/15 bg-slate-50/50 flex items-center justify-end space-x-2.5 rounded-b-xl">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-1.5 border border-brand-border-purple/30 rounded-lg text-xs font-bold text-brand-text/75 hover:bg-slate-100 cursor-pointer transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-1.5 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-lg text-xs font-bold shadow-sm/10 cursor-pointer transition-colors">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SEND EMAIL DIALOG MODAL */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-brand-border-purple/25 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-brand-border-purple/15 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-brand-heading text-sm">Send Email to {activeLead?.name}</h3>
              <button onClick={() => { setIsEmailModalOpen(false); setEmailError(null); }} className="text-slate-400 hover:text-brand-text p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleSendEmail} className="p-5 space-y-4">
              {!gmailConnected && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                  <strong>Gmail not connected.</strong> Go to <strong>Integrations</strong> in the sidebar to connect your Gmail account, then try again.
                </div>
              )}
              {activeLead?.email && (
                <div className="p-2.5 bg-slate-50 border border-brand-border-purple/20 rounded-lg">
                  <span className="text-[9px] font-extrabold text-brand-heading uppercase tracking-wider">To:</span>
                  <span className="ml-2 text-xs text-brand-text">{activeLead.email}</span>
                </div>
              )}
              {!activeLead?.email && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
                  <strong>No email address.</strong> Edit this lead to add an email address first.
                </div>
              )}
              {emailError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
                  {emailError}
                </div>
              )}
              <div>
                <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Subject</label>
                <input type="text" required placeholder="Subject line" value={emailForm.subject} onChange={(e) => setEmailForm({...emailForm, subject: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text placeholder-slate-400 focus:outline-none" />
              </div>
              <div>
                <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Email Body</label>
                <textarea required placeholder="Write your message here..." value={emailForm.body} onChange={(e) => setEmailForm({...emailForm, body: e.target.value})} className="w-full p-3 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text placeholder-slate-400 focus:outline-none min-h-[120px] leading-relaxed" />
              </div>
              <div className="pt-3 border-t border-brand-border-purple/15 flex justify-end space-x-2.5">
                <button type="button" onClick={() => { setIsEmailModalOpen(false); setEmailError(null); }} className="px-4 py-1.5 border border-brand-border-purple/30 rounded-lg text-xs font-bold text-brand-text/75 hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" disabled={emailSending || !gmailConnected || !activeLead?.email} className="inline-flex items-center space-x-1.5 px-4 py-1.5 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-lg text-xs font-bold shadow-sm/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                  <Send className="h-3.5 w-3.5" />
                  <span>{emailSending ? 'Sending...' : 'Send Email'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOG CALL DIALOG MODAL */}
      {isCallModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-brand-border-purple/25 rounded-xl shadow-xl w-full max-w-md animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-brand-border-purple/15 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h3 className="font-bold text-brand-heading text-sm">Log Call Outcome</h3>
              <button onClick={() => setIsCallModalOpen(false)} className="text-slate-400 hover:text-brand-text p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleLogCall} className="p-5 space-y-4">
              <div>
                <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Call Outcome</label>
                <select value={callForm.outcome} onChange={(e) => setCallForm({...callForm, outcome: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 bg-white text-brand-text rounded-lg text-xs cursor-pointer">
                  <option>Spoke with Lead</option>
                  <option>Left Voice Mail</option>
                  <option>Busy / No Answer</option>
                  <option>Lead Not Interested</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Call Notes</label>
                <textarea required placeholder="Summarize prospect comments, next scheduling options..." value={callForm.notes} onChange={(e) => setCallForm({...callForm, notes: e.target.value})} className="w-full p-3 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text placeholder-slate-400 focus:outline-none min-h-[80px]" />
              </div>
              <div className="pt-3 border-t border-brand-border-purple/15 flex justify-end space-x-2.5 rounded-b-xl bg-slate-50/20 px-5 pb-5">
                <button type="button" onClick={() => setIsCallModalOpen(false)} className="px-4 py-1.5 border border-brand-border-purple/30 rounded-lg text-xs font-bold text-brand-text/75 hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="inline-flex items-center space-x-1.5 px-4 py-1.5 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-lg text-xs font-bold shadow-sm/10 cursor-pointer">
                  <PhoneCall className="h-3.5 w-3.5" />
                  <span>Log Call</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SCHEDULE MEETING DIALOG MODAL */}
      {isMeetingModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-brand-border-purple/25 rounded-xl shadow-xl w-full max-w-md animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-brand-border-purple/15 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h3 className="font-bold text-brand-heading text-sm">Schedule Meeting</h3>
              <button onClick={() => setIsMeetingModalOpen(false)} className="text-slate-400 hover:text-brand-text p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleScheduleMeeting} className="p-5 space-y-4">
              <div>
                <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Meeting Title</label>
                <input type="text" required placeholder="e.g. Pulse Sandbox Architecture Demo" value={meetingForm.title} onChange={(e) => setMeetingForm({...meetingForm, title: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text placeholder-slate-400 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Date</label>
                  <input type="date" required value={meetingForm.date} onChange={(e) => setMeetingForm({...meetingForm, date: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text focus:outline-none cursor-pointer" />
                </div>
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Time</label>
                  <input type="time" required value={meetingForm.time} onChange={(e) => setMeetingForm({...meetingForm, time: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text focus:outline-none cursor-pointer" />
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Agenda / Details</label>
                <textarea required placeholder="Discuss compliance guidelines and db sizing outline..." value={meetingForm.desc} onChange={(e) => setMeetingForm({...meetingForm, desc: e.target.value})} className="w-full p-3 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text placeholder-slate-400 focus:outline-none min-h-[80px]" />
              </div>
              <div className="pt-3 border-t border-brand-border-purple/15 flex justify-end space-x-2.5 rounded-b-xl bg-slate-50/20 px-5 pb-5">
                <button type="button" onClick={() => setIsMeetingModalOpen(false)} className="px-4 py-1.5 border border-brand-border-purple/30 rounded-lg text-xs font-bold text-brand-text/75 hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="inline-flex items-center space-x-1.5 px-4 py-1.5 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-lg text-xs font-bold shadow-sm/10 cursor-pointer">
                  <Calendar className="h-3.5 w-3.5" strokeWidth={2} />
                  <span>Schedule Meeting</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONVERT LEAD DIALOG MODAL */}
      {isConvertModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-brand-border-purple/25 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-brand-border-purple/15 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-brand-heading text-sm">Convert Lead to Account & Deal</h3>
              <button onClick={() => { setIsConvertModalOpen(false); setConvertingLeadId(null); }} className="text-slate-400 hover:text-brand-text p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleConvertLeadSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Industry</label>
                <input 
                  type="text" 
                  placeholder="e.g. Software, Healthcare, Retail" 
                  value={convertForm.industry} 
                  onChange={(e) => setConvertForm({...convertForm, industry: e.target.value})} 
                  className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text placeholder-slate-450 focus:outline-none focus:ring-1 focus:ring-brand-accent/20" 
                />
              </div>
              <div>
                <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Revenue ($)</label>
                <input 
                  type="number" 
                  placeholder="e.g. 1200000" 
                  value={convertForm.revenue} 
                  onChange={(e) => setConvertForm({...convertForm, revenue: e.target.value})} 
                  className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text placeholder-slate-450 focus:outline-none focus:ring-1 focus:ring-brand-accent/20" 
                />
              </div>
              <div>
                <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Pipeline Stage</label>
                <select 
                  value={convertForm.pipelineStageId} 
                  onChange={(e) => setConvertForm({...convertForm, pipelineStageId: e.target.value})} 
                  className="w-full px-2 py-1.5 border border-brand-border-purple/35 bg-white text-brand-text rounded-lg text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-accent/20"
                >
                  <option value="">— Default (New) —</option>
                  {pipelineStages.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Number of Employees</label>
                <input 
                  type="number" 
                  placeholder="e.g. 150" 
                  value={convertForm.employeeCount} 
                  onChange={(e) => setConvertForm({...convertForm, employeeCount: e.target.value})} 
                  className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text placeholder-slate-450 focus:outline-none focus:ring-1 focus:ring-brand-accent/20" 
                />
              </div>
              <div className="pt-3 border-t border-brand-border-purple/15 flex justify-end space-x-2.5">
                <button 
                  type="button" 
                  onClick={() => { setIsConvertModalOpen(false); setConvertingLeadId(null); }} 
                  className="px-4 py-1.5 border border-brand-border-purple/30 rounded-lg text-xs font-bold text-brand-text/75 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-750 text-white rounded-lg text-xs font-bold shadow-sm/10 cursor-pointer transition-colors"
                >
                  Convert Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-brand-border-purple/25 rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-brand-border-purple/15 flex items-center space-x-2 bg-rose-50/40">
              <AlertCircle className="h-4.5 w-4.5 text-rose-500" />
              <h3 className="font-bold text-brand-heading text-sm">Confirm Delete</h3>
            </div>
            <div className="p-5">
              <p className="text-xs text-brand-text/80 leading-relaxed">
                Are you sure you want to delete this lead? This action <span className="font-extrabold text-rose-600">cannot be undone</span> and will permanently remove all associated data.
              </p>
              <div className="flex justify-end space-x-2.5 mt-5">
                <button 
                  onClick={() => setDeleteConfirmId(null)} 
                  className="px-4 py-1.5 border border-brand-border-purple/30 rounded-lg text-xs font-bold text-brand-text/75 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteLead} 
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm/10 cursor-pointer transition-colors inline-flex items-center space-x-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Permanently</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
  