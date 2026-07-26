'use client';

import React, { useState, useEffect } from 'react';
import { getLeads } from '@/utils/api';
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
  AlertCircle
} from 'lucide-react';

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
  id: number;
  name: string;
  company: string;
  email: string;
  phone: string;
  score: number;
  status: 'New' | 'Contacted' | 'Qualified' | 'Converted' | 'Lost';
  priority: 'High' | 'Medium' | 'Low';
  owner: string;
  ownerAvatar: string;
  notes: string;
  source?: string;
  timeline: ActivityItem[];
  emails: EmailItem[];
  calls: CallItem[];
  meetings: MeetingItem[];
}

export default function LeadsView() {
  // Prepopulated state variables
  const [leads, setLeads] = useState<Lead[]>([
    {
      id: 1,
      name: "Alex Rivera",
      company: "TechCorp Inc.",
      email: "alex.rivera@techcorp.com",
      phone: "+1 (555) 019-2834",
      score: 88,
      status: "Qualified",
      priority: "High",
      owner: "Sarah Johnson",
      ownerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&fit=crop&q=80",
      notes: "Met at TechEx 2025. Interested in migrating their legacy database to our unified SaaS solution. Has a budget of ₹120K. Ready for proposal stage next week.",
      source: "Referral",
      timeline: [
        { id: 1, type: "creation", title: "Lead Ingestion", desc: "Lead created from TechEx 2025 conference scan.", time: "4 days ago" },
        { id: 2, type: "call", title: "Discovery Call Logged", desc: "Spoke to Alex. Confirmed decision matrix and budget availability.", time: "2 days ago" }
      ],
      emails: [
        { id: 1, subject: "Pulse CRM Info Request", body: "Hi Alex, thank you for stopping by our booth. Here is the migration documentation we discussed.", time: "3 days ago" }
      ],
      calls: [
        { id: 1, outcome: "Spoke with Lead", notes: "Alex is highly technical. Focus proposal on database security and speed.", time: "2 days ago" }
      ],
      meetings: []
    },
    {
      id: 2,
      name: "Marcus Aurelius",
      company: "MedSaaS Solutions",
      email: "marcus.aurelius@medsaas.org",
      phone: "+1 (555) 304-9843",
      score: 72,
      status: "Contacted",
      priority: "Medium",
      owner: "Alex Johnson",
      ownerAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&fit=crop&q=80",
      notes: "Currently evaluating competitor pricing. Emphasized compliance standards (HIPAA/GDPR) as critical factors. Scheduled a follow-up demo.",
      source: "Website",
      timeline: [
        { id: 1, type: "creation", title: "Lead Form Submission", desc: "Lead created from inbound marketing landing page.", time: "6 days ago" },
        { id: 2, type: "email", title: "Introduction Email Sent", desc: "Shared introduction and pricing tiers overview.", time: "5 days ago" }
      ],
      emails: [
        { id: 1, subject: "Welcome to Pulse CRM", body: "Hello Marcus, introducing Pulse and attaching compliance guidelines.", time: "5 days ago" }
      ],
      calls: [],
      meetings: []
    },
    {
      id: 3,
      name: "Helena Troy",
      company: "Sparta Creative",
      email: "helena.t@spartacreative.io",
      phone: "+1 (555) 834-0192",
      score: 95,
      status: "New",
      priority: "High",
      owner: "Sarah Johnson",
      ownerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&fit=crop&q=80",
      notes: "Inbound contact request. Enterprise customer asking about custom SSO support and priority SLA details. Immediate response required.",
      source: "LinkedIn",
      timeline: [
        { id: 1, type: "creation", title: "Inbound Request Recieved", desc: "Submitted custom enterprise contact form.", time: "2 hours ago" }
      ],
      emails: [],
      calls: [],
      meetings: []
    },
    {
      id: 4,
      name: "David Hume",
      company: "Empiric Logistics",
      email: "david.hume@empiric.co.uk",
      phone: "+44 20 7946 0192",
      score: 41,
      status: "Lost",
      priority: "Low",
      owner: "David Wilson",
      ownerAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&fit=crop&q=80",
      notes: "Small business prospect. Rejected pricing packages as out of scope for budget limit. Keep in cold nurturing list for low-tier launch.",
      source: "Cold Email",
      timeline: [
        { id: 1, type: "creation", title: "API Ingestion", desc: "Lead created through automated developer partner API.", time: "10 days ago" },
        { id: 2, type: "call", title: "Call Outcome: Busy", desc: "Tried logging call, prospect rejected due to resource limits.", time: "8 days ago" }
      ],
      emails: [],
      calls: [
        { id: 1, outcome: "Lead Not Interested", notes: "No budget availability. Moving to cold nurturing.", time: "8 days ago" }
      ],
      meetings: []
    }
  ]);

  // View Mode: table vs priority
  const [viewMode, setViewMode] = useState<'table' | 'priority'>('table');

  // Summary card state (click to open, double-click to close)
  const [summaryLeadId, setSummaryLeadId] = useState<number | string | null>(null);

  // Original selected lead for edit/create action context
  const [editLeadId, setEditLeadId] = useState<number | string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [activeHistoryTab, setActiveHistoryTab] = useState<'timeline' | 'emails' | 'calls' | 'meetings'>('timeline');

  // Modal Open/Close States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);

  // Form Fields State
  const [leadForm, setLeadForm] = useState({
    name: '', company: '', email: '', phone: '', status: 'New' as Lead['status'], priority: 'Medium' as Lead['priority'], owner: 'Sarah Johnson', notes: ''
  });
  const [emailForm, setEmailForm] = useState({ subject: '', body: '' });
  const [callForm, setCallForm] = useState({ outcome: 'Spoke with Lead', notes: '' });
  const [meetingForm, setMeetingForm] = useState({ title: '', date: '', time: '', desc: '' });

  useEffect(() => {
    getLeads().then(data => {
      setLeads(data as any);
    });
  }, []);

  // Active lead for summary card
  const summaryLead = summaryLeadId ? leads.find(l => l.id === summaryLeadId) || null : null;
  // Active lead for edit modal
  const activeLead = editLeadId ? leads.find(l => l.id === editLeadId) || null : summaryLead;

  // AI Recommendation engine
  const getAIRecommendation = (lead: Lead) => {
    if (lead.status === 'New' && lead.priority === 'High') {
      return `High-priority inbound lead. Send an introductory email with custom SSO/SLA details and schedule a 15-minute briefing within 2 hours.`;
    }
    if (lead.status === 'Contacted' && lead.score > 70) {
      return `Lead score is high (${lead.score}). Call back to schedule a formal sandbox product walkthrough and invite their engineering stakeholders.`;
    }
    if (lead.status === 'Qualified') {
      return `Migration budget is set. Draft and send the custom enterprise SLA pricing proposal. Next touchpoint deadline: 24 hours.`;
    }
    return `Monitor lead activity. Log notes on their technical requirements stack when they open the next pricing link.`;
  };

  // ML Pipeline Feature Engineering Helpers
  const getSourceQuality = (source?: string) => {
    if (!source) return 50;
    const mapping: Record<string, number> = {
      "Referral": 100,
      "Website": 85,
      "LinkedIn": 70,
      "Webinar": 75,
      "Event": 65,
      "Cold Email": 40
    };
    return mapping[source] || 50;
  };

  const getEngagementDetails = (emails: any[]) => {
    let score = 0;
    if (!emails) return { score, level: "LOW" };
    emails.forEach(email => {
      score += 5; // email exists
      if (email.subject?.toLowerCase().includes("re:") || email.replied === "Yes") {
        score += 15;
      }
    });
    
    let level = "LOW";
    if (score >= 50) level = "HIGH";
    else if (score >= 25) level = "MEDIUM";
    
    return { score, level };
  };

  const getReplyDetails = (emails: any[]) => {
    if (!emails || emails.length === 0) return { rate: 0, level: "NO RESPONSE" };
    let totalSent = emails.length;
    let totalReplied = emails.filter(email => 
      email.subject?.toLowerCase().includes("re:") || 
      email.replied === "Yes"
    ).length;
    
    const rate = Math.round((totalReplied / totalSent) * 100);
    let level = "NO RESPONSE";
    if (rate >= 70) level = "FAST";
    else if (rate >= 40) level = "MEDIUM";
    else if (rate > 0) level = "SLOW";
    
    return { rate, level };
  };

  const getRecencyDays = (timeline: any[]) => {
    if (!timeline || timeline.length === 0) return 999;
    let minDays = 999;
    timeline.forEach(item => {
      const timeStr = item.time?.toLowerCase() || '';
      if (timeStr.includes("today")) {
        minDays = Math.min(minDays, 0);
      } else if (timeStr.includes("yesterday")) {
        minDays = Math.min(minDays, 1);
      } else {
        const match = timeStr.match(/(\d+)\s+day/);
        if (match) {
          minDays = Math.min(minDays, parseInt(match[1]));
        }
      }
    });
    return minDays;
  };

  const getCompanyBand = (companyName: string) => {
    const sizeMap: Record<string, string> = {
      "TechCorp Inc.": "Enterprise",
      "MedSaaS Solutions": "Large",
      "Empiric Logistics": "Medium",
      "AeroSpace Labs": "Large",
      "CloudSync Co.": "Medium",
      "Fintech Global": "Enterprise",
      "Apex Dynamics": "Large"
    };
    return sizeMap[companyName] || "Medium";
  };

  // Filtered Leads list
  const filteredLeads = leads.filter(l => {
    const matchesSearch = l.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          l.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || l.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || l.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Action: Create Lead Submit
  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    const newLead: Lead = {
      id: Date.now(),
      name: leadForm.name,
      company: leadForm.company,
      email: leadForm.email,
      phone: leadForm.phone,
      score: Math.floor(Math.random() * 40) + 55, // Random score 55-95
      status: leadForm.status,
      priority: leadForm.priority,
      owner: leadForm.owner,
      ownerAvatar: leadForm.owner === 'Sarah Johnson' 
        ? "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&fit=crop&q=80" 
        : "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&fit=crop&q=80",
      notes: leadForm.notes,
      timeline: [
        { id: 1, type: "creation", title: "Lead Created Manually", desc: `Lead added to database by system user.`, time: "Just now" }
      ],
      emails: [],
      calls: [],
      meetings: []
    };
    const updated = [newLead, ...leads];
    setLeads(updated);
    setSelectedLeadId(newLead.id);
    setIsCreateModalOpen(false);
    setLeadForm({ name: '', company: '', email: '', phone: '', status: 'New', priority: 'Medium', owner: 'Sarah Johnson', notes: '' });
  };

  // Action: Edit Lead Submit
  const handleEditLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLead) return;
    setLeads(leads.map(l => {
      if (l.id === activeLead.id) {
        return {
          ...l,
          name: leadForm.name,
          company: leadForm.company,
          email: leadForm.email,
          phone: leadForm.phone,
          status: leadForm.status,
          priority: leadForm.priority,
          owner: leadForm.owner,
          notes: leadForm.notes
        };
      }
      return l;
    }));
    setIsEditModalOpen(false);
  };

  // Action: Delete Lead
  const handleDeleteLead = (id: number) => {
    const remaining = leads.filter(l => l.id !== id);
    if (remaining.length > 0) {
      setLeads(remaining);
      setSelectedLeadId(remaining[0].id);
    }
  };

  // Action: Convert Lead (Updates status to Converted)
  const handleConvertLead = (id: number) => {
    setLeads(leads.map(l => {
      if (l.id === id) {
        return {
          ...l,
          status: 'Converted' as const,
          timeline: [
            { id: Date.now(), type: 'conversion', title: 'Lead Converted', desc: 'Converted to active Account & Deal pipeline opportunity.', time: 'Just now' },
            ...l.timeline
          ]
        };
      }
      return l;
    }));
  };

  // Action: Send Email Submit
  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLead) return;
    setLeads(leads.map(l => {
      if (l.id === activeLead.id) {
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
          desc: `Sent by CRM. Content summary: ${emailForm.body.substring(0, 40)}...`,
          time: 'Just now'
        };
        return {
          ...l,
          emails: [newEmail, ...l.emails],
          timeline: [newActivity, ...l.timeline]
        };
      }
      return l;
    }));
    setIsEmailModalOpen(false);
    setEmailForm({ subject: '', body: '' });
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
    <div className="space-y-6">
      <div className="bg-white border border-brand-border-purple/20 rounded-xl p-5 shadow-sm/5">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="font-sans text-2xl text-brand-heading font-bold">Sales Leads</h2>
            <p className="text-[11px] text-brand-text/60 mt-0.5 font-bold">Manage prospects, monitor qualification scores, and trigger follow-ups.</p>
          </div>
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex space-x-0.5 p-0.5 bg-brand-sidebar-hover/15 border border-brand-border-purple/20 rounded-lg">
              <button
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold transition-all cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-brand-heading shadow-sm' : 'text-brand-text/60 hover:text-brand-heading'
                }`}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode('priority')}
                className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold transition-all cursor-pointer ${
                  viewMode === 'priority' ? 'bg-white text-brand-heading shadow-sm' : 'text-brand-text/60 hover:text-brand-heading'
                }`}
              >
                Priority
              </button>
            </div>
            <button 
              onClick={() => {
                setLeadForm({ name: '', company: '', email: '', phone: '', status: 'New', priority: 'Medium', owner: 'Sarah Johnson', notes: '' });
                setIsCreateModalOpen(true);
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-lg text-xs font-bold shadow-sm/10 transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.25} />
              <span>Add Lead</span>
            </button>
          </div>
        </div>

          {/* Search & Filters block */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
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
            <div className="relative">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-1.5 border border-brand-border-purple/35 bg-white text-brand-text/80 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-accent/20 cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Converted">Converted</option>
                <option value="Lost">Lost</option>
              </select>
            </div>
            <div className="relative">
              <select 
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-3 py-1.5 border border-brand-border-purple/35 bg-white text-brand-text/80 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-accent/20 cursor-pointer"
              >
                <option value="All">All Priorities</option>
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </div>
          </div>

          {/* === TABLE VIEW === */}
          {viewMode === 'table' && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-brand-border-purple/20 text-[9px] uppercase font-extrabold tracking-wider text-black pb-2">
                    <th className="pb-2">Name & Company</th>
                    <th className="pb-2 text-center">Score</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Priority</th>
                    <th className="pb-2">Owner</th>
                    <th className="pb-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border-purple/15 text-xs text-brand-text font-semibold">
                  {filteredLeads.length > 0 ? (
                    filteredLeads.map((lead) => {
                      const showSummary = lead.id === summaryLeadId;
                      return (
                        <React.Fragment key={lead.id}>
                          <tr 
                            onClick={() => setSummaryLeadId(lead.id === summaryLeadId ? null : lead.id)}
                            onDoubleClick={() => setSummaryLeadId(null)}
                            className={`hover:bg-slate-50/50 cursor-pointer transition-colors ${
                              showSummary ? 'bg-brand-secondary-accent/10' : ''
                            }`}
                          >
                            <td className="py-3">
                              <div className="font-extrabold text-brand-heading">{lead.name}</div>
                              <div className="text-[10px] text-brand-text/60 mt-0.5 flex items-center">
                                <Building2 className="h-3 w-3 mr-1 text-brand-text/40" />
                                {lead.company}
                              </div>
                            </td>
                            <td className="py-3 text-center">
                              <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded tabular-nums ${
                                lead.score >= 80 ? 'text-emerald-700 bg-emerald-50' :
                                lead.score >= 60 ? 'text-amber-700 bg-amber-50' : 'text-rose-700 bg-rose-50'
                              }`}>
                                {lead.score}
                              </span>
                            </td>
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
                            <td className="py-3">
                              <span className={`text-[9px] font-bold ${
                                lead.priority === 'High' ? 'text-rose-600' :
                                lead.priority === 'Medium' ? 'text-amber-600' : 'text-slate-500'
                              }`}>
                                ● {lead.priority}
                              </span>
                            </td>
                            <td className="py-3">
                              <div className="flex items-center space-x-1.5">
                                <img src={lead.ownerAvatar} alt={lead.owner} className="h-5 w-5 rounded-full border border-slate-200" />
                                <span className="text-[10px] text-brand-text/80 truncate max-w-[80px]">{lead.owner.split(' ')[0]}</span>
                              </div>
                            </td>
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
                                    setEditLeadId(lead.id);
                                    setLeadForm({
                                      name: lead.name,
                                      company: lead.company,
                                      email: lead.email,
                                      phone: lead.phone,
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
                                  onClick={() => handleDeleteLead(lead.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                          {/* Summary card appears below the clicked row */}
                          {showSummary && (
                            <tr>
                              <td colSpan={6} className="pt-0 pb-4 px-0">
                                <LeadSummaryCard
                                  lead={lead}
                                  onClose={() => setSummaryLeadId(null)}
                                  onEmail={() => { setEditLeadId(lead.id); setIsEmailModalOpen(true); }}
                                  onCall={() => { setEditLeadId(lead.id); setIsCallModalOpen(true); }}
                                  onMeeting={() => { setEditLeadId(lead.id); setIsMeetingModalOpen(true); }}
                                  getAIRecommendation={getAIRecommendation}
                                  getEngagementDetails={getEngagementDetails}
                                  getReplyDetails={getReplyDetails}
                                  getRecencyDays={getRecencyDays}
                                  getCompanyBand={getCompanyBand}
                                  getSourceQuality={getSourceQuality}
                                  activeHistoryTab={activeHistoryTab}
                                  setActiveHistoryTab={setActiveHistoryTab}
                                  handleSaveNotes={handleSaveNotes}
                                />
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
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
          )}

          {/* === PRIORITY VIEW === */}
          {viewMode === 'priority' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              {(['High', 'Medium', 'Low'] as const).map((priority) => {
                const priorityLeads = filteredLeads.filter(l => l.priority === priority);
                return (
                  <div key={priority} className="border border-brand-border-purple/20 rounded-xl bg-slate-50/30 p-4 min-h-[300px]">
                    <div className="flex items-center justify-between pb-3 border-b border-brand-border-purple/15 mb-3">
                      <h3 className={`text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${
                        priority === 'High' ? 'text-rose-700' :
                        priority === 'Medium' ? 'text-amber-700' : 'text-slate-500'
                      }`}>
                        <span className={`h-2.5 w-2.5 rounded-full ${
                          priority === 'High' ? 'bg-rose-500' :
                          priority === 'Medium' ? 'bg-amber-500' : 'bg-slate-400'
                        }`} />
                        {priority}
                      </h3>
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full tabular-nums ${
                        priority === 'High' ? 'bg-rose-50 text-rose-700' :
                        priority === 'Medium' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {priorityLeads.length}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {priorityLeads.length > 0 ? priorityLeads.map(lead => (
                        <div 
                          key={lead.id}
                          onClick={() => setSummaryLeadId(lead.id === summaryLeadId ? null : lead.id)}
                          onDoubleClick={() => setSummaryLeadId(null)}
                          className={`bg-white border rounded-xl p-3.5 cursor-pointer transition-all hover:shadow-sm ${
                            lead.id === summaryLeadId ? 'border-brand-accent ring-1 ring-brand-accent/20' : 'border-brand-border-purple/20'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="text-xs font-extrabold text-brand-heading">{lead.name}</h4>
                              <p className="text-[10px] text-brand-text/60 font-semibold">{lead.company}</p>
                            </div>
                            <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded tabular-nums ${
                              lead.score >= 80 ? 'text-emerald-700 bg-emerald-50' :
                              lead.score >= 60 ? 'text-amber-700 bg-amber-50' : 'text-rose-700 bg-rose-50'
                            }`}>
                              {lead.score}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[9px] font-bold">
                            <span className={`px-1.5 py-0.5 rounded-full ${
                              lead.status === 'New' ? 'text-blue-750 bg-blue-50' :
                              lead.status === 'Contacted' ? 'text-yellow-750 bg-yellow-50' :
                              lead.status === 'Qualified' ? 'text-purple-750 bg-purple-50' :
                              lead.status === 'Converted' ? 'text-emerald-750 bg-emerald-50' : 'text-slate-500 bg-slate-100'
                            }`}>
                              {lead.status}
                            </span>
                            <span className="text-slate-400">{lead.owner.split(' ')[0]}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-400">{lead.source || '—'}</span>
                          </div>
                          {/* Summary content when card is selected */}
                          {lead.id === summaryLeadId && (
                            <div className="mt-3 pt-3 border-t border-brand-border-purple/10 text-[10px] font-semibold text-brand-text/75 space-y-2">
                              <p className="leading-relaxed">{lead.notes.substring(0, 100)}...</p>
                              <div className="flex gap-1.5">
                                <button onClick={(e) => { e.stopPropagation(); setEditLeadId(lead.id); setIsEmailModalOpen(true); }} className="px-2 py-1 border border-brand-border-purple/30 rounded text-[9px] font-extrabold hover:bg-slate-50">Email</button>
                                <button onClick={(e) => { e.stopPropagation(); setEditLeadId(lead.id); setIsCallModalOpen(true); }} className="px-2 py-1 border border-brand-border-purple/30 rounded text-[9px] font-extrabold hover:bg-slate-50">Call</button>
                                <button onClick={(e) => { e.stopPropagation(); setEditLeadId(lead.id); setIsMeetingModalOpen(true); }} className="px-2 py-1 border border-brand-border-purple/30 rounded text-[9px] font-extrabold hover:bg-slate-50">Meet</button>
                              </div>
                            </div>
                          )}
                        </div>
                      )) : (
                        <p className="text-center text-slate-400 text-xs py-8 font-semibold">No {priority.toLowerCase()} priority leads.</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      {/* CREATE LEAD DIALOG MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-brand-border-purple/25 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-brand-border-purple/15 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-brand-heading text-sm">Add New Lead</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-brand-text p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleCreateLead} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Lead Name</label>
                  <input type="text" required placeholder="e.g. John Doe" value={leadForm.name} onChange={(e) => setLeadForm({...leadForm, name: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-accent/20" />
                </div>
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Company</label>
                  <input type="text" required placeholder="e.g. Acme Corp" value={leadForm.company} onChange={(e) => setLeadForm({...leadForm, company: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-accent/20" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Email</label>
                  <input type="email" required placeholder="name@company.com" value={leadForm.email} onChange={(e) => setLeadForm({...leadForm, email: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-accent/20" />
                </div>
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Phone</label>
                  <input type="text" required placeholder="+1 (555) 000-0000" value={leadForm.phone} onChange={(e) => setLeadForm({...leadForm, phone: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-accent/20" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Status</label>
                  <select value={leadForm.status} onChange={(e) => setLeadForm({...leadForm, status: e.target.value as any})} className="w-full px-2 py-1.5 border border-brand-border-purple/35 bg-white text-brand-text rounded-lg text-xs cursor-pointer">
                    <option>New</option>
                    <option>Contacted</option>
                    <option>Qualified</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Priority</label>
                  <select value={leadForm.priority} onChange={(e) => setLeadForm({...leadForm, priority: e.target.value as any})} className="w-full px-2 py-1.5 border border-brand-border-purple/35 bg-white text-brand-text rounded-lg text-xs cursor-pointer">
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Owner</label>
                  <select value={leadForm.owner} onChange={(e) => setLeadForm({...leadForm, owner: e.target.value})} className="w-full px-2 py-1.5 border border-brand-border-purple/35 bg-white text-brand-text rounded-lg text-xs cursor-pointer">
                    <option>Sarah Johnson</option>
                    <option>Alex Johnson</option>
                    <option>Lisa Martinez</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Initial Notes</label>
                <textarea placeholder="Describe technical requirements, pipeline potential..." value={leadForm.notes} onChange={(e) => setLeadForm({...leadForm, notes: e.target.value})} className="w-full p-2 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-accent/20 min-h-[60px]" />
              </div>
              <div className="pt-3 border-t border-brand-border-purple/15 flex justify-end space-x-2.5">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-1.5 border border-brand-border-purple/30 rounded-lg text-xs font-bold text-brand-text/75 hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-lg text-xs font-bold shadow-sm/10 cursor-pointer">Create Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT LEAD DIALOG MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-brand-border-purple/25 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-brand-border-purple/15 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-brand-heading text-sm">Edit Lead Details</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-brand-text p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleEditLead} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Lead Name</label>
                  <input type="text" required placeholder="e.g. John Doe" value={leadForm.name} onChange={(e) => setLeadForm({...leadForm, name: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text placeholder-slate-400 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Company</label>
                  <input type="text" required placeholder="e.g. Acme Corp" value={leadForm.company} onChange={(e) => setLeadForm({...leadForm, company: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text placeholder-slate-400 focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Email</label>
                  <input type="email" required placeholder="name@company.com" value={leadForm.email} onChange={(e) => setLeadForm({...leadForm, email: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Phone</label>
                  <input type="text" required placeholder="+1 (555) 000-0000" value={leadForm.phone} onChange={(e) => setLeadForm({...leadForm, phone: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Status</label>
                  <select value={leadForm.status} onChange={(e) => setLeadForm({...leadForm, status: e.target.value as any})} className="w-full px-2 py-1.5 border border-brand-border-purple/35 bg-white text-brand-text rounded-lg text-xs cursor-pointer">
                    <option>New</option>
                    <option>Contacted</option>
                    <option>Qualified</option>
                    <option>Converted</option>
                    <option>Lost</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Priority</label>
                  <select value={leadForm.priority} onChange={(e) => setLeadForm({...leadForm, priority: e.target.value as any})} className="w-full px-2 py-1.5 border border-brand-border-purple/35 bg-white text-brand-text rounded-lg text-xs cursor-pointer">
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Owner</label>
                  <select value={leadForm.owner} onChange={(e) => setLeadForm({...leadForm, owner: e.target.value})} className="w-full px-2 py-1.5 border border-brand-border-purple/35 bg-white text-brand-text rounded-lg text-xs cursor-pointer">
                    <option>Sarah Johnson</option>
                    <option>Alex Johnson</option>
                    <option>Lisa Martinez</option>
                  </select>
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

      {/* SEND EMAIL DIALOG MODAL */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-brand-border-purple/25 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-brand-border-purple/15 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-brand-heading text-sm">Send Email to {activeLead?.name}</h3>
              <button onClick={() => setIsEmailModalOpen(false)} className="text-slate-400 hover:text-brand-text p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleSendEmail} className="p-5 space-y-4">
              <div>
                <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Subject</label>
                <input type="text" required placeholder="Subject line" value={emailForm.subject} onChange={(e) => setEmailForm({...emailForm, subject: e.target.value})} className="w-full px-3 py-1.5 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text placeholder-slate-400 focus:outline-none" />
              </div>
              <div>
                <label className="block text-[9px] font-extrabold text-brand-heading uppercase tracking-wider mb-1">Email Body</label>
                <textarea required placeholder="Write your message here..." value={emailForm.body} onChange={(e) => setEmailForm({...emailForm, body: e.target.value})} className="w-full p-3 border border-brand-border-purple/35 rounded-lg text-xs text-brand-text placeholder-slate-400 focus:outline-none min-h-[120px] leading-relaxed" />
              </div>
              <div className="pt-3 border-t border-brand-border-purple/15 flex justify-end space-x-2.5">
                <button type="button" onClick={() => setIsEmailModalOpen(false)} className="px-4 py-1.5 border border-brand-border-purple/30 rounded-lg text-xs font-bold text-brand-text/75 hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="inline-flex items-center space-x-1.5 px-4 py-1.5 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-lg text-xs font-bold shadow-sm/10 cursor-pointer">
                  <Send className="h-3.5 w-3.5" />
                  <span>Send Email</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOG CALL DIALOG MODAL */}
      {isCallModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-brand-border-purple/25 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-brand-border-purple/15 flex justify-between items-center bg-slate-50">
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
              <div className="pt-3 border-t border-brand-border-purple/15 flex justify-end space-x-2.5">
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
          <div className="bg-white border border-brand-border-purple/25 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-brand-border-purple/15 flex justify-between items-center bg-slate-50">
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
              <div className="pt-3 border-t border-brand-border-purple/15 flex justify-end space-x-2.5">
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
    </div>
  );
}

// -------------------- LeadSummaryCard Component --------------------
function LeadSummaryCard({ lead, onClose, onEmail, onCall, onMeeting, getAIRecommendation, getEngagementDetails, getReplyDetails, getRecencyDays, getCompanyBand, getSourceQuality, activeHistoryTab, setActiveHistoryTab, handleSaveNotes }: {
  lead: Lead;
  onClose: () => void;
  onEmail: () => void;
  onCall: () => void;
  onMeeting: () => void;
  getAIRecommendation: (lead: Lead) => string;
  getEngagementDetails: (emails: any[]) => { score: number; level: string };
  getReplyDetails: (emails: any[]) => { rate: number; level: string };
  getRecencyDays: (timeline: any[]) => number;
  getCompanyBand: (companyName: string) => string;
  getSourceQuality: (source?: string) => number;
  activeHistoryTab: string;
  setActiveHistoryTab: (tab: any) => void;
  handleSaveNotes: (val: string) => void;
}) {
  const tabs = ['timeline', 'emails', 'calls', 'meetings'];
  return (
    <div className="bg-white border border-brand-border-purple/20 rounded-xl p-4 shadow-sm/5 my-2 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div>
            <h3 className="font-extrabold text-brand-heading text-sm">{lead.name}</h3>
            <p className="text-[10px] text-brand-text/60 font-bold">{lead.company}</p>
          </div>
          <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded tabular-nums ${
            lead.score >= 80 ? 'text-emerald-700 bg-emerald-50' :
            lead.score >= 60 ? 'text-amber-700 bg-amber-50' : 'text-rose-700 bg-rose-50'
          }`}>
            {lead.score}
          </span>
        </div>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-brand-text cursor-pointer"><X className="h-4 w-4" /></button>
      </div>

      <div className="flex items-center gap-3 text-[10px] font-bold mb-3">
        <span className={`px-1.5 py-0.5 rounded-full ${
          lead.status === 'New' ? 'text-blue-750 bg-blue-50' :
          lead.status === 'Contacted' ? 'text-yellow-750 bg-yellow-50' :
          lead.status === 'Qualified' ? 'text-purple-750 bg-purple-50' :
          lead.status === 'Converted' ? 'text-emerald-750 bg-emerald-50' : 'text-slate-500 bg-slate-100'
        }`}>
          {lead.status}
        </span>
        <span className={`${lead.priority === 'High' ? 'text-rose-600' : lead.priority === 'Medium' ? 'text-amber-600' : 'text-slate-500'}`}>
          ● {lead.priority}
        </span>
        <a href={`mailto:${lead.email}`} className="text-brand-accent hover:underline">{lead.email}</a>
        <span className="text-slate-400 tabular-nums">{lead.phone}</span>
        <span className="text-slate-400">Owner: {lead.owner}</span>
      </div>

      {/* AI Recommendation */}
      <div className="mb-3 bg-brand-sidebar-hover/20 border border-brand-border-purple/30 rounded-lg p-2.5 flex items-start space-x-2">
        <Sparkles className="h-3.5 w-3.5 text-brand-accent shrink-0 mt-0.5" strokeWidth={2} />
        <p className="text-[10px] text-brand-text/80 font-bold">{getAIRecommendation(lead)}</p>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 mb-3">
        <button onClick={onEmail} className="inline-flex items-center space-x-1 px-2.5 py-1 border border-brand-border-purple/35 rounded-lg text-[10px] font-extrabold text-brand-text/80 hover:bg-slate-50 cursor-pointer"><Mail className="h-3 w-3" /><span>Email</span></button>
        <button onClick={onCall} className="inline-flex items-center space-x-1 px-2.5 py-1 border border-brand-border-purple/35 rounded-lg text-[10px] font-extrabold text-brand-text/80 hover:bg-slate-50 cursor-pointer"><Phone className="h-3 w-3" /><span>Log Call</span></button>
        <button onClick={onMeeting} className="inline-flex items-center space-x-1 px-2.5 py-1 border border-brand-border-purple/35 rounded-lg text-[10px] font-extrabold text-brand-text/80 hover:bg-slate-50 cursor-pointer"><Calendar className="h-3 w-3" /><span>Meet</span></button>
      </div>

      {/* Mini AI Features Grid */}
      <div className="grid grid-cols-4 gap-2 mb-3 text-[9px] font-bold">
        <div className="bg-slate-50 border border-slate-100 rounded-lg p-2">
          <span className="text-slate-400 block text-[8px]">Engagement</span>
          <span className="text-brand-heading">{getEngagementDetails(lead.emails).score} pts</span>
          <span className={`ml-1 px-1 py-0.25 rounded text-[7px] ${
            getEngagementDetails(lead.emails).level === 'HIGH' ? 'bg-emerald-50 text-emerald-700' :
            getEngagementDetails(lead.emails).level === 'MEDIUM' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
          }`}>{getEngagementDetails(lead.emails).level}</span>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-lg p-2">
          <span className="text-slate-400 block text-[8px]">Reply Vel.</span>
          <span className="text-brand-heading">{getReplyDetails(lead.emails).rate}%</span>
          <span className={`ml-1 px-1 py-0.25 rounded text-[7px] ${
            getReplyDetails(lead.emails).level === 'FAST' ? 'bg-emerald-50 text-emerald-700' :
            getReplyDetails(lead.emails).level === 'MEDIUM' ? 'bg-amber-50 text-amber-700' :
            getReplyDetails(lead.emails).level === 'SLOW' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'
          }`}>{getReplyDetails(lead.emails).level}</span>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-lg p-2">
          <span className="text-slate-400 block text-[8px]">Recency</span>
          <span className="text-brand-heading">{getRecencyDays(lead.timeline) === 999 ? 'None' : `${getRecencyDays(lead.timeline)}d`}</span>
          <span className="ml-1 px-1 py-0.25 rounded text-[7px] bg-blue-50 text-blue-700">
            {getRecencyDays(lead.timeline) <= 3 ? 'Active' : getRecencyDays(lead.timeline) <= 7 ? 'Warm' : 'Cold'}
          </span>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-lg p-2">
          <span className="text-slate-400 block text-[8px]">Firmographic</span>
          <span className="text-brand-heading">{getCompanyBand(lead.company)}</span>
          <span className="ml-1 px-1 py-0.25 rounded text-[7px] bg-purple-50 text-purple-700">Q:{getSourceQuality(lead.source)}</span>
        </div>
      </div>

      {/* Notes & Activity tabs */}
      <div className="flex border-b border-brand-border-purple/15 text-[9px] font-extrabold uppercase mb-2">
        {tabs.map((tab) => (
          <button key={tab} onClick={() => setActiveHistoryTab(tab as any)}
            className={`pb-1 px-2.5 border-b-2 transition-all cursor-pointer ${
              activeHistoryTab === tab ? 'border-brand-secondary-accent text-brand-heading' : 'border-transparent text-slate-450 hover:text-brand-text'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="max-h-32 overflow-y-auto text-[10px] font-semibold text-brand-text/75 space-y-1.5 pr-1">
        {activeHistoryTab === 'timeline' && (lead.timeline.length > 0 ? lead.timeline.map(a => (
          <div key={a.id} className="flex justify-between"><span>{a.title}</span><span className="text-slate-400 text-[9px]">{a.time}</span></div>
        )) : <p className="text-slate-400 text-center py-2">No timeline.</p>)}
        {activeHistoryTab === 'emails' && (lead.emails.length > 0 ? lead.emails.map(e => (
          <div key={e.id} className="border-b border-brand-border-purple/10 pb-1"><span className="font-extrabold text-brand-heading">{e.subject}</span><p className="text-[9px]">{e.body.substring(0, 60)}...</p></div>
        )) : <p className="text-slate-400 text-center py-2">No emails.</p>)}
        {activeHistoryTab === 'calls' && (lead.calls.length > 0 ? lead.calls.map(c => (
          <div key={c.id} className="border-b border-brand-border-purple/10 pb-1"><span className="font-extrabold text-brand-heading">{c.outcome}</span><p className="text-[9px]">{c.notes.substring(0, 60)}...</p></div>
        )) : <p className="text-slate-400 text-center py-2">No calls.</p>)}
        {activeHistoryTab === 'meetings' && (lead.meetings.length > 0 ? lead.meetings.map(m => (
          <div key={m.id} className="border-b border-brand-border-purple/10 pb-1"><span className="font-extrabold text-brand-heading">{m.title}</span><p className="text-[9px]">{m.date} @ {m.time}</p></div>
        )) : <p className="text-slate-400 text-center py-2">No meetings.</p>)}
      </div>
    </div>
  );
}
