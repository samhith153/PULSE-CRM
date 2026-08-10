'use client';

import { toast } from '@/lib/toast';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Lead as BackendLead, getLeads, createLead, updateLead, deleteLead as apiDeleteLead, convertLead, sendGmailEmail, getGmailStatus, getEmails, getPipelineStages, fetchBatchRecommendations, fetchLeadRecommendation, resolveImageUrl } from '@/utils/api';
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
  LayoutGrid,
  List,
  ArrowLeft,
  Maximize2,
  Minimize2
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
    fitReasons: b.fit_reasons ?? [],
    engagementReasons: b.engagement_reasons ?? [],
    priorityTier: b.priority ?? null,
    topReasons: b.top_reasons ?? [],
    status: STATUS_UNMAP[b.status] || 'New',
    priority: (b.priority as Lead['priority']) ?? 'Low',
    owner: b.owner_name || 'Unassigned',
    ownerAvatar: resolveImageUrl(b.owner_avatar_url),
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

function getEngagementDetails(emails: EmailItem[]): { score: number; level: string } {
  if (!emails || emails.length === 0) return { score: 0, level: 'LOW' };
  const score = Math.min(100, emails.length * 15);
  const level = score >= 60 ? 'HIGH' : score >= 30 ? 'MEDIUM' : 'LOW';
  return { score, level };
}

function getReplyDetails(emails: EmailItem[]): { rate: number; level: string } {
  if (!emails || emails.length === 0) return { rate: 0, level: 'SLOW' };
  const rate = Math.min(100, Math.round((emails.length / Math.max(emails.length, 3)) * 100));
  const level = rate >= 70 ? 'FAST' : rate >= 40 ? 'MEDIUM' : 'SLOW';
  return { rate, level };
}

function getRecencyDays(timeline: ActivityItem[]): number {
  if (!timeline || timeline.length === 0) return 999;
  const now = Date.now();
  let earliest = now;
  for (const act of timeline) {
    const t = new Date(act.time).getTime();
    if (!isNaN(t) && t < earliest) earliest = t;
  }
  return Math.max(0, Math.floor((now - earliest) / (1000 * 60 * 60 * 24)));
}

function getCompanyBand(company: string): string {
  if (!company) return 'Unknown';
  const lower = company.toLowerCase();
  if (lower.includes('corp') || lower.includes('inc') || lower.includes('ltd') || lower.includes('llc')) return 'Enterprise';
  if (lower.includes('studio') || lower.includes('lab') || lower.includes('co')) return 'SMB';
  return 'Mid-Market';
}

function getSourceQuality(source?: string): string {
  if (!source) return 'N/A';
  const s = source.toLowerCase();
  if (s.includes('referral') || s.includes('partner')) return 'A';
  if (s.includes('website') || s.includes('organic') || s.includes('linkedin')) return 'B';
  if (s.includes('cold') || s.includes('purchase') || s.includes('list')) return 'C';
  return 'B';
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
  fitReasons: string[];
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

interface LeadsViewProps {
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

export default function LeadsView({ onLoaded, onTabChange, onComposeEmail }: LeadsViewProps = {}) {
  const router = useRouter();
  // NEW: Listen for the Command Palette search click to open a specific lead
  useEffect(() => {
    const handleOpenRecord = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { id, type } = customEvent.detail;
      
      // Ensure we only process events meant for the Leads view
      if (type === 'leads' && id) {
        
        // Remove the 'lead_' prefix if it exists (from the backend response format)
        let rawId = String(id);
        if (rawId.startsWith('lead_')) {
          rawId = rawId.replace('lead_', '');
        }

        // Check if we need to parse it as a number or leave as string
        const finalId = /^\d+$/.test(rawId) ? Number(rawId) : rawId;
        
        // This opens the right-side details panel for the lead
        setSelectedLeadId(finalId);
        
        // Ensure we are not in list mode so the details drawer actually shows
        setViewMode('default');
      }
    };

    window.addEventListener('pulse-open-record', handleOpenRecord);
    return () => window.removeEventListener('pulse-open-record', handleOpenRecord);
  }, []);

  // Listen for command palette "Create Lead" event
  useEffect(() => {
    const handleOpenCreate = () => {
      setIsCreatingFullPage(true);
    };
    window.addEventListener('pulse-open-create-lead-modal', handleOpenCreate);
    return () => window.removeEventListener('pulse-open-create-lead-modal', handleOpenCreate);
  }, []);
  // Prepopulated state variables
  const [leads, setLeads] = useState<Lead[]>([]);
  const leadsRef = useRef<Lead[]>([]);
  leadsRef.current = leads;

  const [viewMode, setViewMode] = useState<'default' | 'list'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('pulse-crm-view-mode-leads') as any) || 'default';
    }
    return 'default';
  });

  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [sortField, setSortField] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const toggleViewMode = (mode: 'default' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('pulse-crm-view-mode-leads', mode);
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

  const handleDeleteSelectedLeads = async () => {
    if (!window.confirm(`Are you sure you want to delete the ${selectedIds.size} selected lead(s)?`)) return;
    try {
      for (const id of Array.from(selectedIds)) {
        await apiDeleteLead(String(id));
      }
      setLeads(prev => prev.filter(lead => !selectedIds.has(lead.id)));
      setSelectedIds(new Set());
      setSelectedLeadId(null);
      window.dispatchEvent(new CustomEvent('pulse-leads-changed'));
      toast.success("Selected leads deleted successfully.");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to delete selected leads.");
    }
  };

  // Selections & Filters State
  const [selectedLeadId, setSelectedLeadId] = useState<number | string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [activeHistoryTab, setActiveHistoryTab] = useState<string>('timeline');
  const [isPriorityView, setIsPriorityView] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  // Modal Open/Close States
  const [isCreatingFullPage, setIsCreatingFullPage] = useState(false);
  const [isEditingFullPage, setIsEditingFullPage] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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
    name: '',
    jobTitle: '',
    email: '',
    phone: '',
    company: '',
    industry: '',
    location: '',
    numberOfEmployees: '',
    source: '',
    currentCRM: '',
    operationalSystem: '',
    status: 'New' as Lead['status'],
    priority: 'Medium' as Lead['priority'],
    owner: 'Sarah Johnson',
    notes: ''
  });
  const [emailForm, setEmailForm] = useState({ subject: '', body: '' });
  const [callForm, setCallForm] = useState({ outcome: 'Spoke with Lead', notes: '' });
  const [meetingForm, setMeetingForm] = useState({ title: '', date: '', time: '', desc: '' });
  const [convertForm, setConvertForm] = useState({ industry: '', revenue: '', employeeCount: '', pipelineStageId: '' });
  const [pipelineStages, setPipelineStages] = useState<{ id: string; name: string; slug: string }[]>([]);

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

  // Helper: fetch recommendations for all leads
  const refreshRecommendations = (leadIds: string[]) => {
    if (leadIds.length === 0) return;
    fetchBatchRecommendations(leadIds).then(res => {
      const recs: Record<string, string> = {};
      for (const [id, item] of Object.entries(res.recommendations || {})) {
        recs[id] = item.recommended_action || 'No recommendation available.';
      }
      setLeadRecommendations(recs);
    }).catch(() => {});
  };

  useEffect(() => {
    getLeads().then(data => {
      const mapped = (data ?? []).map(backendToLocal);
      setLeads(mapped);
      const ids = mapped.map(l => l.id).filter(Boolean) as string[];
      refreshRecommendations(ids);
    }).finally(() => {
      onLoaded?.();
    });
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

    // Periodically refresh recommendations (assessments run in background)
    const intervalId = window.setInterval(() => {
      const ids = leadsRef.current.map(l => l.id).filter(Boolean) as string[];
      refreshRecommendations(ids);
    }, 30000);
    return () => window.clearInterval(intervalId);
  }, []);

  // Get currently active lead object
  const activeLead = selectedLeadId ? leads.find(l => l.id === selectedLeadId) || null : null;

  // ── Load real panel data when a lead is selected ────────────────────────
  useEffect(() => {
    if (!selectedLeadId) return;
    const lid = String(selectedLeadId);

    // Fetch timeline
    import('@/utils/api').then(({ getLeadTimeline, getLeadEmails, getLeadCalls, getLeadMeetings }) => {
      getLeadTimeline(lid, { page_size: 30 }).then(tl => {
        const entries = (tl.entries ?? []).map((e: any, idx: number) => ({
          id: idx,
          type: 'email' as const,
          title: e.title,
          desc: e.description || e.relative_time,
          time: e.relative_time,
        }));
        setLeads(prev => prev.map(l => l.id === lid ? { ...l, timeline: entries } : l));
      }).catch(() => {});

      getLeadEmails(lid).then(emails => {
        const mapped = (emails ?? []).map((e: any, idx: number) => ({
          id: idx,
          subject: e.subject || '(no subject)',
          body: e.body_preview || '',
          time: e.sent_at ? new Date(e.sent_at).toLocaleString() : '',
        }));
        setLeads(prev => prev.map(l => l.id === lid ? { ...l, emails: mapped } : l));
      }).catch(() => {});

      getLeadCalls(lid).then(calls => {
        const mapped = (calls ?? []).map((c: any, idx: number) => ({
          id: idx,
          outcome: c.outcome || c.status || 'Logged',
          notes: c.notes || c.subject || '',
          time: c.called_at ? new Date(c.called_at).toLocaleString() : (c.created_at ? new Date(c.created_at).toLocaleString() : ''),
        }));
        setLeads(prev => prev.map(l => l.id === lid ? { ...l, calls: mapped } : l));
      }).catch(() => {});

      getLeadMeetings(lid).then(meetings => {
        const mapped = (meetings ?? []).map((m: any, idx: number) => ({
          id: idx,
          title: m.title,
          date: m.start_datetime ? new Date(m.start_datetime).toLocaleDateString() : '',
          time: m.start_datetime ? new Date(m.start_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          desc: m.description || m.location || m.meeting_link || '',
        }));
        setLeads(prev => prev.map(l => l.id === lid ? { ...l, meetings: mapped } : l));
      }).catch(() => {});
    });
  }, [selectedLeadId]);

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

  const sortedLeads = React.useMemo(() => {
    if (isPriorityView) {
      return displayLeads;
    }
    return [...displayLeads].sort((a, b) => {
      const ra = a as any;
      const rb = b as any;
      let valA: any = (ra[sortField] || '').toString().toLowerCase();
      let valB: any = (rb[sortField] || '').toString().toLowerCase();
      if (sortField === 'score') {
        valA = Number(ra[sortField]) || 0;
        valB = Number(rb[sortField]) || 0;
      }
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [displayLeads, sortField, sortOrder, isPriorityView]);

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
          { id: Date.now(), type: "creation" as const, title: "Lead Created Manually", desc: `Lead added to database by system user.`, time: "Just now" }
        ],
      };
      setLeads([newLead, ...leads]);
      setSelectedLeadId(newLead.id);
    } catch (err) {
      console.error("Failed to create lead:", err);
    }
    setIsCreatingFullPage(false);
    setLeadForm({ name: '', jobTitle: '', email: '', phone: '', company: '', industry: '', location: '', numberOfEmployees: '', source: '', currentCRM: '', operationalSystem: '', status: 'New', priority: 'Medium', owner: 'Sarah Johnson', notes: '' });
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
      source: SOURCE_MAP[leadForm.source as string] || leadForm.source || undefined,
      industry: leadForm.industry || undefined,
      location: leadForm.location || undefined,
      employee_count: leadForm.numberOfEmployees ? parseInt(leadForm.numberOfEmployees, 10) || undefined : undefined,
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
    setIsEditingFullPage(false);
    setEditingLeadId(null);
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
      window.dispatchEvent(new CustomEvent('pulse-leads-changed'));
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

  if (isCreatingFullPage || isEditingFullPage) {
    const isEdit = isEditingFullPage;
    return (
      <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200">
        {/* Full page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-border">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                setIsCreatingFullPage(false);
                setIsEditingFullPage(false);
                setEditingLeadId(null);
                setLeadForm({ name: '', jobTitle: '', email: '', phone: '', company: '', industry: '', location: '', numberOfEmployees: '', source: '', currentCRM: '', operationalSystem: '', status: 'New', priority: 'Medium', owner: 'Sarah Johnson', notes: '' });
              }}
              className="p-2 border border-border hover:bg-secondary rounded-xl text-muted-foreground hover:text-foreground cursor-pointer transition hover:scale-105"
              title="Back to Leads"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-brand-purple/10 text-brand-purple text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">{isEdit ? 'Editing' : 'New Prospect'}</span>
              </div>
              <h2 className="font-sans text-2xl text-foreground font-bold tracking-tight mt-1">{isEdit ? 'Edit Lead' : 'Create New Lead'}</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-semibold">{isEdit ? 'Update lead details across all dimensions.' : 'Enter all details across prospect, company, and technology dimensions.'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => {
                setIsCreatingFullPage(false);
                setIsEditingFullPage(false);
                setEditingLeadId(null);
                setLeadForm({ name: '', jobTitle: '', email: '', phone: '', company: '', industry: '', location: '', numberOfEmployees: '', source: '', currentCRM: '', operationalSystem: '', status: 'New', priority: 'Medium', owner: 'Sarah Johnson', notes: '' });
              }}
              className="px-4.5 py-2 border border-border rounded-xl text-xs font-semibold text-foreground hover:bg-secondary cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="full-page-lead-form"
              className="px-5.5 py-2 bg-brand-purple hover:bg-brand-purple/90 text-primary-foreground rounded-xl text-xs font-semibold cursor-pointer shadow-lg shadow-brand-purple/10 hover:shadow-brand-purple/20 transition hover:-translate-y-0.5"
            >
              {isEdit ? 'Save Changes' : 'Create Lead'}
            </button>
          </div>
        </div>

        <form id="full-page-lead-form" onSubmit={isEdit ? handleEditLead : handleCreateLead} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: Contact Information */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-2 pb-3 border-b border-border">
              <div className="p-1.5 bg-brand-purple/10 text-brand-purple rounded-lg">
                <User className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">Contact Information</h4>
                <p className="text-[10px] text-muted-foreground font-medium">Basic contact details of the prospect</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-foreground uppercase tracking-wider mb-1">
                    Full Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={leadForm.name}
                    onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                    className="w-full px-3.5 py-2 border border-border rounded-xl text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/25 focus:border-brand-purple bg-background transition"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-foreground uppercase tracking-wider mb-1">Job Title</label>
                  <input
                    type="text"
                    placeholder="e.g. VP of Engineering"
                    value={leadForm.jobTitle}
                    onChange={(e) => setLeadForm({ ...leadForm, jobTitle: e.target.value })}
                    className="w-full px-3.5 py-2 border border-border rounded-xl text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/25 focus:border-brand-purple bg-background transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-foreground uppercase tracking-wider mb-1">
                    Email Address <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={leadForm.email}
                    onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                    className="w-full px-3.5 py-2 border border-border rounded-xl text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/25 focus:border-brand-purple bg-background transition"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-foreground uppercase tracking-wider mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 000-0000"
                    value={leadForm.phone}
                    onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2 border border-border rounded-xl text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/25 focus:border-brand-purple bg-background transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Company Information */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-2 pb-3 border-b border-border">
              <div className="p-1.5 bg-brand-purple/10 text-brand-purple rounded-lg">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">Company Information</h4>
                <p className="text-[10px] text-muted-foreground font-medium">Details of the target organization</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-foreground uppercase tracking-wider mb-1">
                    Company Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Corp"
                    value={leadForm.company}
                    onChange={(e) => setLeadForm({ ...leadForm, company: e.target.value })}
                    className="w-full px-3.5 py-2 border border-border rounded-xl text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/25 focus:border-brand-purple bg-background transition"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-foreground uppercase tracking-wider mb-1">
                    Industry <span className="text-destructive">*</span>
                  </label>
                  <select
                    required
                    value={leadForm.industry}
                    onChange={(e) => setLeadForm({ ...leadForm, industry: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-xl text-xs text-foreground bg-background cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-purple/25 focus:border-brand-purple transition"
                  >
                    <option value="">Select Industry</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Pharma">Pharma</option>
                    <option value="Logistics">Logistics</option>
                    <option value="Construction">Construction</option>
                    <option value="Education">Education</option>
                    <option value="Finance">Finance</option>
                    <option value="Insurance">Insurance</option>
                    <option value="Hospitality">Hospitality</option>
                    <option value="Real Estate">Real Estate</option>
                    <option value="Agriculture">Agriculture</option>
                    <option value="Legal">Legal</option>
                    <option value="Retail">Retail</option>
                    <option value="Media">Media</option>
                    <option value="Consulting">Consulting</option>
                    <option value="IT">IT</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-foreground uppercase tracking-wider mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. San Francisco, CA"
                    value={leadForm.location}
                    onChange={(e) => setLeadForm({ ...leadForm, location: e.target.value })}
                    className="w-full px-3.5 py-2 border border-border rounded-xl text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/25 focus:border-brand-purple bg-background transition"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-foreground uppercase tracking-wider mb-1">Number of Employees</label>
                  <select
                    value={leadForm.numberOfEmployees}
                    onChange={(e) => setLeadForm({ ...leadForm, numberOfEmployees: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-xl text-xs text-foreground bg-background cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-purple/25 focus:border-brand-purple transition"
                  >
                    <option value="">Select Range</option>
                    <option value="1">1</option>
                    <option value="10">10</option>
                    <option value="50">50</option>
                    <option value="200">200</option>
                    <option value="500">500</option>
                    <option value="1001">1001+</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Lead Classification */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-2 pb-3 border-b border-border">
              <div className="p-1.5 bg-brand-purple/10 text-brand-purple rounded-lg">
                <Globe className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">Lead Classification</h4>
                <p className="text-[10px] text-muted-foreground font-medium">Source, priority, and current assignments</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-foreground uppercase tracking-wider mb-1">
                    Lead Source <span className="text-destructive">*</span>
                  </label>
                  <select
                    required
                    value={leadForm.source}
                    onChange={(e) => setLeadForm({ ...leadForm, source: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-xl text-xs text-foreground bg-background cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-purple/25 focus:border-brand-purple transition"
                  >
                    <option value="">Select Source</option>
                    <option value="Website">Website</option>
                    <option value="Referral">Referral</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Cold Email">Cold Email</option>
                    <option value="Event">Event</option>
                    <option value="Webinar">Webinar</option>
                    <option value="Partner">Partner</option>
                    <option value="Paid Ads">Paid Ads</option>
                    <option value="Organic Search">Organic Search</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-foreground uppercase tracking-wider mb-1">Priority</label>
                  <select
                    value={leadForm.priority}
                    onChange={(e) => setLeadForm({ ...leadForm, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border border-border rounded-xl text-xs text-foreground bg-background cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-purple/25 focus:border-brand-purple transition"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-foreground uppercase tracking-wider mb-1">Status</label>
                  <select
                    value={leadForm.status}
                    onChange={(e) => setLeadForm({ ...leadForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-border rounded-xl text-xs text-foreground bg-background cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-purple/25 focus:border-brand-purple transition"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Converted">Converted</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-foreground uppercase tracking-wider mb-1">Lead Owner</label>
                <input
                  type="text"
                  placeholder="e.g. Sarah Johnson"
                  value={leadForm.owner}
                  onChange={(e) => setLeadForm({ ...leadForm, owner: e.target.value })}
                  className="w-full px-3.5 py-2 border border-border rounded-xl text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/25 focus:border-brand-purple bg-background transition"
                />
              </div>
            </div>
          </div>

          {/* Card 4: Technical Stack & Context */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-2 pb-3 border-b border-border">
              <div className="p-1.5 bg-brand-purple/10 text-brand-purple rounded-lg">
                <Monitor className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">Technical Context & Notes</h4>
                <p className="text-[10px] text-muted-foreground font-medium">Tools used and additional qualitative notes</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-foreground uppercase tracking-wider mb-1">Current CRM</label>
                  <select
                    value={leadForm.currentCRM}
                    onChange={(e) => setLeadForm({ ...leadForm, currentCRM: e.target.value })}
                    className="w-full px-3.5 py-2 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/25 focus:border-brand-purple bg-background transition"
                  >
                    <option value="">Select CRM...</option>
                    <option value="No CRM">No CRM</option>
                    <option value="Excel">Excel</option>
                    <option value="Google Sheets">Google Sheets</option>
                    <option value="Manual">Manual</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Basic CRM">Basic CRM</option>
                    <option value="HubSpot">HubSpot</option>
                    <option value="Zoho">Zoho</option>
                    <option value="Salesforce">Salesforce</option>
                    <option value="Custom Software">Custom Software</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-foreground uppercase tracking-wider mb-1">Operational System</label>
                  <select
                    value={leadForm.operationalSystem}
                    onChange={(e) => setLeadForm({ ...leadForm, operationalSystem: e.target.value })}
                    className="w-full px-3.5 py-2 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/25 focus:border-brand-purple bg-background transition"
                  >
                    <option value="">Select system...</option>
                    <option value="No Structured System">No Structured System</option>
                    <option value="Excel">Excel</option>
                    <option value="Google Sheets">Google Sheets</option>
                    <option value="Manual">Manual</option>
                    <option value="Spreadsheets">Spreadsheets</option>
                    <option value="CRM">CRM</option>
                    <option value="ERP">ERP</option>
                    <option value="Structured Business Software">Structured Business Software</option>
                    <option value="Custom Software">Custom Software</option>
                    <option value="Custom Internal Software">Custom Internal Software</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-foreground uppercase tracking-wider mb-1">Background Notes / Context</label>
                <textarea
                  placeholder="Enter initial conversations, requirements or key context..."
                  value={leadForm.notes}
                  onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })}
                  className="w-full h-19 px-3.5 py-2 border border-border rounded-xl text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple/25 focus:border-brand-purple bg-background transition resize-none"
                />
              </div>
            </div>
          </div>

          {/* Form Actions Footer (Span full width) */}
          <div className="col-span-1 md:col-span-2 flex items-center justify-between p-4 bg-secondary/50 border border-border rounded-xl mt-4">
            <p className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
              <span className="text-destructive font-bold text-xs">*</span> Required fields must be completed.
            </p>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  setIsCreatingFullPage(false);
                  setLeadForm({ name: '', jobTitle: '', email: '', phone: '', company: '', industry: '', location: '', numberOfEmployees: '', source: '', currentCRM: '', operationalSystem: '', status: 'New', priority: 'Medium', owner: 'Sarah Johnson', notes: '' });
                }}
                className="px-4.5 py-2 border border-border rounded-xl text-xs font-semibold text-foreground hover:bg-secondary cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5.5 py-2 bg-brand-purple hover:bg-brand-purple/90 text-primary-foreground rounded-xl text-xs font-semibold cursor-pointer shadow-lg shadow-brand-purple/10 hover:shadow-brand-purple/20 transition hover:-translate-y-0.5"
              >
                Create Lead
              </button>
            </div>
          </div>

        </form>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-6 items-start">
      {/* Left Pane (Table, filters, search, headers) */}
      <div className={`col-span-12 ${activeLead && viewMode !== 'list' ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-5`}>
        <div className="bg-card border border-border rounded-2xl p-5">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="font-sans text-2xl text-foreground font-bold">Sales Leads</h2>
                {/* Priority View Toggle */}
                <button
                  type="button"
                  onClick={() => setIsPriorityView(!isPriorityView)}
                  className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition duration-200 cursor-pointer ${
                    isPriorityView
                      ? 'bg-brand-purple text-primary-foreground ring-2 ring-brand-purple/25'
                      : 'bg-secondary hover:bg-secondary text-foreground hover:text-foreground'
                  }`}
                >
                  <Sparkles className="h-3 w-3" />
                  <span>{isPriorityView ? 'Priority View On' : 'Priority View Off'}</span>
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-semibold">Manage prospects, monitor qualification scores, and trigger follow-ups.</p>
            </div>
            <div className="flex items-center gap-3">
              {/* View Toggle Button */}
              <div className="flex items-center border border-border rounded-lg overflow-hidden p-0.5 bg-secondary/50 shrink-0 select-none">
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
                  <LayoutGrid size={14} />
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
                  <List size={14} />
                </button>
              </div>

              {selectedIds.size > 0 && (
                <button 
                  onClick={handleDeleteSelectedLeads}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer mr-2"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                  <span>Delete Selected ({selectedIds.size})</span>
                </button>
              )}

              <button 
                onClick={() => {
                  setLeadForm({ name: '', jobTitle: '', email: '', phone: '', company: '', industry: '', location: '', numberOfEmployees: '', source: '', currentCRM: '', operationalSystem: '', status: 'New', priority: 'Medium', owner: 'Sarah Johnson', notes: '' });
                  setIsCreatingFullPage(true);
                }}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-brand-purple hover:bg-brand-purple/90 text-primary-foreground rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2.25} />
                <span>Add Lead</span>
              </button>
            </div>
          </div>

          {/* Search & Filters block */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            {/* Search Input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-muted-foreground">
                <Search className="h-3.5 w-3.5" />
              </span>
              <input 
                type="text" 
                placeholder="Search leads, companies..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-border rounded-lg text-xs text-foreground bg-secondary placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand-purple/20"
              />
            </div>
            
            {/* Status Filter */}
            <div className="relative">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-1.5 border border-border bg-background text-foreground rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-purple/20 cursor-pointer"
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
                className="w-full px-3 py-1.5 border border-border bg-background text-foreground rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-purple/20 cursor-pointer"
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
          {viewMode === 'list' ? (
            <div className="overflow-y-auto max-h-[580px] border border-border/60 rounded-xl bg-card custom-scrollbar">
              <table className="w-full border-collapse text-left table-fixed">
                <thead className="sticky top-0 bg-card z-10 border-b border-border shadow-[0_1px_0_0_rgba(0,0,0,0.02)] select-none">
                  <tr className="text-[11px] uppercase font-black tracking-wider text-foreground border-b border-border bg-muted/40">
                    <th className="py-3 px-4 text-left w-10">
                      <input 
                        type="checkbox" 
                        checked={sortedLeads.length > 0 && selectedIds.size === sortedLeads.length}
                        onChange={() => handleToggleSelectAll(sortedLeads)}
                        className="rounded border-border text-brand-purple focus:ring-brand-purple cursor-pointer size-3.5"
                      />
                    </th>
                    <th className="py-3 px-2 w-[16%] cursor-pointer hover:text-primary transition-colors" onClick={() => handleHeaderClick('name')}>Name</th>
                    <th className="py-3 px-2 w-[16%] cursor-pointer hover:text-primary transition-colors" onClick={() => handleHeaderClick('company')}>Company</th>
                    <th className="py-3 px-2 w-[18%] cursor-pointer hover:text-primary transition-colors" onClick={() => handleHeaderClick('email')}>Email</th>
                    <th className="py-3 px-2 w-[11%] cursor-pointer hover:text-primary transition-colors" onClick={() => handleHeaderClick('phone')}>Phone</th>
                    <th className="py-3 px-2 w-[7%] cursor-pointer hover:text-primary transition-colors text-center" onClick={() => handleHeaderClick('score')}>Score</th>
                    <th className="py-3 px-2 w-[10%] cursor-pointer hover:text-primary transition-colors" onClick={() => handleHeaderClick('status')}>Status</th>
                    <th className="py-3 px-2 w-[10%] cursor-pointer hover:text-primary transition-colors" onClick={() => handleHeaderClick('priority')}>Priority</th>
                    <th className="py-3 px-2 w-[14%] text-right pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 text-xs text-foreground font-medium">
                  {sortedLeads.length > 0 ? (
                    sortedLeads.map((lead) => {
                      const isRowSelected = selectedIds.has(lead.id);
                      return (
                        <tr 
                          key={lead.id} 
                          onClick={() => setSelectedLeadId(lead.id)}
                          className={`hover:bg-secondary/20 transition border-b border-border/40 ${isRowSelected ? 'bg-brand-blue/[0.02]' : ''}`}
                        >
                          <td className="py-3.5 px-4 text-left" onClick={(e) => e.stopPropagation()}>
                            <input 
                              type="checkbox" 
                              checked={isRowSelected}
                              onChange={() => handleToggleSelectRow(lead.id)}
                              className="rounded border-border text-brand-purple focus:ring-brand-purple cursor-pointer size-3.5"
                            />
                          </td>
                          <td className="py-3.5 px-2 font-bold truncate" title={lead.name}>{lead.name}</td>
                          <td className="py-3.5 px-2 text-muted-foreground truncate" title={lead.company}>{lead.company}</td>
                          <td className="py-3.5 px-2 text-muted-foreground truncate" title={lead.email}>{lead.email}</td>
                          <td className="py-3.5 px-2 text-muted-foreground truncate" title={lead.phone}>{lead.phone}</td>
                          <td className="py-3.5 px-2 text-center font-bold tabular-nums">
                            <span className={`px-2 py-0.5 rounded text-[10px] ${
                              lead.score >= 80 ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/15' :
                              lead.score >= 50 ? 'bg-amber-500/10 text-amber-500 border border-amber-500/15' :
                              'bg-rose-500/10 text-rose-500 border border-rose-500/15'
                            }`}>
                              {lead.score}
                            </span>
                          </td>
                          <td className="py-3.5 px-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border inline-block ${
                              lead.status === 'Converted' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/15' :
                              lead.status === 'Lost' ? 'bg-rose-500/10 text-rose-500 border-rose-500/15' :
                              'bg-brand-purple/10 text-brand-purple border-brand-purple/15'
                            }`}>
                              {lead.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border inline-block ${
                              lead.priority === 'Critical' ? 'bg-rose-500/10 text-rose-500 border-rose-500/15' :
                              lead.priority === 'High' ? 'bg-amber-500/10 text-amber-500 border-amber-500/15' :
                              'bg-secondary text-muted-foreground border-border'
                            }`}>
                              {lead.priority}
                            </span>
                          </td>
                          <td className="py-3.5 px-2 text-right pr-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end gap-1.5">
                              <button 
                                onClick={() => {
                                  setLeadForm({
                                    name: lead.name,
                                    jobTitle: lead.jobTitle || '',
                                    email: lead.email,
                                    phone: lead.phone,
                                    company: lead.company,
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
                                  setEditingLeadId(String(lead.id));
                                  setSelectedLeadId(lead.id);
                                  setIsEditingFullPage(true);
                                }}
                                className="p-1 text-muted-foreground hover:text-foreground hover:bg-secondary rounded transition-colors cursor-pointer"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button 
                                onClick={() => setDeleteConfirmId(lead.id)}
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
                      <td colSpan={9} className="py-8 text-center text-muted-foreground">
                        No leads matching search or filter selections.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[580px] border border-border/60 rounded-xl bg-card">
              <table className="w-full border-collapse text-left table-fixed">
              <thead className="sticky top-0 bg-card z-10 border-b border-border shadow-[0_1px_0_0_rgba(0,0,0,0.02)] select-none">
                {isPriorityView ? (
                  <tr className="text-[11px] uppercase font-black tracking-wider text-foreground border-b border-border bg-muted/40">
                    <th className="py-3 px-4 w-[22%]">Company Name</th>
                    <th className="py-3 text-center w-[12%] text-brand-blue">Fit Score</th>
                    <th className="py-3 text-center w-[14%] text-amber-600 dark:text-amber-400">Engagement Score</th>
                    <th className="py-3 text-center w-[12%] text-emerald-600 dark:text-emerald-400">Overall Score</th>
                    <th className="py-3 w-[22%]">Recommendation</th>
                    <th className="py-3 text-right pr-4 w-[18%]">Actions</th>
                  </tr>
                ) : (
                  <tr className="text-[11px] uppercase font-black tracking-wider text-foreground border-b border-border bg-muted/40">
                    <th className="py-3 px-4 w-[24%]">Name &amp; Company</th>
                    <th className="py-3 text-center w-[10%]">Score</th>
                    <th className="py-3 w-[15%]">Status</th>
                    <th className="py-3 w-[15%]">Priority</th>
                    <th className="py-3 w-[16%]">Owner</th>
                    <th className="py-3 text-right pr-4 w-[20%]">Actions</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-border/40 text-xs text-foreground font-medium">
                {sortedLeads.length > 0 ? (
                  sortedLeads.map((lead, idx) => {
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
                        className={`hover:bg-secondary/40 cursor-pointer transition duration-200 border-b border-border/40 ${
                          isSelected ? 'bg-brand-blue/[0.04]' : ''
                        } ${isTopPriority ? 'bg-brand-blue/[0.01]' : ''}`}
                      >
                        {isPriorityView ? (
                          <>
                            {/* Company Name */}
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-foreground flex items-center space-x-1.5">
                                <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span>{lead.company}</span>
                              </div>
                              <div className="text-[10px] text-muted-foreground mt-0.5 ml-5">
                                Contact: {lead.name}
                              </div>
                            </td>
                            {/* Fit Score */}
                            <td className="py-3.5 text-center">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/10">
                                {lead.fit_score ?? 0}%
                              </span>
                            </td>
                            {/* Engagement Score */}
                            <td className="py-3.5 text-center">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border/60">
                                {lead.engagement_score ?? 0}%
                              </span>
                            </td>
                            {/* Overall Score */}
                            <td className="py-3.5 text-center">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full tabular-nums border ${
                                lead.score >= 80 ? 'text-emerald-600 bg-emerald-500/10 dark:text-emerald-400 border-emerald-500/10' :
                                lead.score >= 60 ? 'text-amber-600 bg-amber-500/10 dark:text-amber-400 border-amber-500/10' : 'text-destructive bg-destructive/10 border-destructive/10'
                              }`}>
                                {lead.score}%
                              </span>
                            </td>
                            {/* Recommendation */}
                            <td className="py-3.5">
                              <div className="text-[10px] text-foreground/80 font-medium max-w-[220px] truncate" title={getAIRecommendation(lead)}>
                                {getAIRecommendation(lead)}
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            {/* Name & Company */}
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-foreground">{lead.name}</div>
                              <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center">
                                <Building2 className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                                {lead.company}
                              </div>
                            </td>
                            
                            {/* Lead Score */}
                            <td className="py-3.5 text-center">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full tabular-nums border ${
                                lead.score >= 80 ? 'text-emerald-600 bg-emerald-500/10 dark:text-emerald-400 border-emerald-500/10' :
                                lead.score >= 60 ? 'text-amber-600 bg-amber-500/10 dark:text-amber-400 border-amber-500/10' : 'text-destructive bg-destructive/10 border-destructive/10'
                              }`}>
                                {lead.score}
                              </span>
                            </td>

                            {/* Status Badge */}
                            <td className="py-3.5">
                              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                                lead.status === 'New' ? 'text-blue-600 bg-blue-500/10 dark:text-blue-400 border-blue-500/10' :
                                lead.status === 'Contacted' ? 'text-amber-600 bg-amber-500/10 dark:text-amber-400 border-amber-500/10' :
                                lead.status === 'Qualified' ? 'text-indigo-600 bg-indigo-500/10 dark:text-indigo-400 border-indigo-500/10' :
                                lead.status === 'Converted' ? 'text-emerald-600 bg-emerald-500/10 dark:text-emerald-400 border-emerald-500/10' :
                                'text-muted-foreground bg-secondary/80 border border-border/80'
                              }`}>
                                {lead.status}
                              </span>
                            </td>

                            {/* Priority Badge */}
                            <td className="py-3.5">
                              <span className={`text-[10px] font-semibold flex items-center gap-1.5 ${
                                lead.priorityTier === 'Critical' ? 'text-emerald-600' :
                                lead.priorityTier === 'High' ? 'text-destructive' :
                                lead.priorityTier === 'Medium' ? 'text-amber-600' :
                                'text-muted-foreground'
                              }`}>
                                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                                  lead.priorityTier === 'Critical' ? 'bg-emerald-500' :
                                  lead.priorityTier === 'High' ? 'bg-destructive' :
                                  lead.priorityTier === 'Medium' ? 'bg-amber-500' :
                                  'bg-muted-foreground/60'
                                }`} />
                                <span>{lead.priorityTier || lead.priority}</span>
                              </span>
                            </td>

                            {/* Owner */}
                            <td className="py-3.5">
                              <div className="flex items-center space-x-1.5">
                                <img src={lead.ownerAvatar || ''} alt={lead.owner} className="h-5 w-5 rounded-full border border-border" />
                                <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">{lead.owner.split(' ')[0]}</span>
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
                                className="px-2 py-0.5 border border-emerald-250 text-emerald-750 hover:bg-brand-cyan hover:text-primary-foreground rounded text-[10px] font-semibold transition-colors cursor-pointer"
                                title="Convert Lead"
                              >
                                Convert
                              </button>
                            )}
                            <button 
                              onClick={() => {
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
                                setEditingLeadId(String(lead.id));
                                setSelectedLeadId(lead.id);
                                setIsEditingFullPage(true);
                              }}
                              className="p-1 text-muted-foreground hover:text-foreground hover:bg-secondary rounded transition-colors cursor-pointer"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button 
                              onClick={() => setDeleteConfirmId(lead.id)}
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
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      No leads matching search or filter selections.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          )}
        </div>
      </div>

      {/* Right Pane (Selected Lead Details drawer, activities, timeline logs, editable notes, AI advice) */}
      {activeLead && viewMode !== 'list' && (
        <div className="col-span-12 lg:col-span-4 space-y-5">
          {/* Maximized Overlay Backdrop */}
          {isMaximized && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setIsMaximized(false)} />
          )}

          <div className={isMaximized
            ? "fixed inset-4 md:inset-8 z-50 flex flex-col rounded-2xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.35)] animate-in zoom-in-95 duration-200"
            : "bg-card border border-border rounded-2xl p-5 sticky top-20"
          }
          style={isMaximized ? { background: '#ffffff', color: '#111827' } : undefined}
          >
            {isMaximized ? (
              /* ===== MAXIMIZED LIGHT-THEME LAYOUT ===== */
              <>
                {/* Top bar */}
                <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ background: '#f3f4f6', borderColor: '#e5e7eb' }}>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                      <span className="text-purple-700 font-bold text-sm">{activeLead.name?.[0] || '?'}</span>
                    </div>
                    <div>
                      <h2 className="font-bold text-gray-900 text-base leading-tight">{activeLead.name}</h2>
                      <p className="text-xs text-gray-500 font-medium">{activeLead.company}</p>
                    </div>
                    <span className={`ml-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      activeLead.status === 'Converted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      activeLead.status === 'Lost' ? 'bg-red-50 text-red-700 border-red-200' :
                      activeLead.status === 'Qualified' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                      activeLead.status === 'Contacted' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>{activeLead.status}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setIsMaximized(false)}
                      className="p-2 rounded-lg border cursor-pointer transition bg-white border-gray-200 hover:bg-gray-100 text-gray-500 hover:text-gray-800" title="Minimize">
                      <Minimize2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => { setSelectedLeadId(null); setIsMaximized(false); }}
                      className="p-2 rounded-lg border cursor-pointer transition bg-white border-gray-200 hover:bg-red-50 hover:text-red-600 text-gray-500" title="Close">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Body: Two-column layout */}
                <div className="flex-1 overflow-y-auto p-6" style={{ background: '#ffffff' }}>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* LEFT COLUMN */}
                    <div className="space-y-5 text-gray-800">

                      {/* Contact Info */}
                      <div className="rounded-xl border overflow-hidden border-gray-200">
                        <div className="px-4 py-2.5 border-b bg-gray-50 border-gray-200">
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Contact Information</span>
                        </div>
                        <div className="p-4 space-y-3">
                          {[
                            { label: 'Email', value: activeLead.email, link: `mailto:${activeLead.email}` },
                            { label: 'Phone', value: activeLead.phone },
                            { label: 'Job Title', value: activeLead.jobTitle },
                            { label: 'Location', value: activeLead.location },
                            { label: 'Source', value: activeLead.source },
                          ].map(row => (
                            <div key={row.label} className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                              <span className="text-xs font-semibold text-gray-500">{row.label}</span>
                              {row.link ? (
                                <a href={row.link} className="text-xs font-bold truncate max-w-[240px] text-purple-600 hover:underline">{row.value || '—'}</a>
                              ) : (
                                <span className="text-xs font-bold text-gray-800">{row.value || '—'}</span>
                              )}
                            </div>
                          ))}
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-xs font-semibold text-gray-500">Owner</span>
                            <div className="flex items-center gap-1.5">
                              <img src={activeLead.ownerAvatar || ''} alt={activeLead.owner} className="h-5 w-5 rounded-full border border-gray-200" />
                              <span className="text-xs font-bold text-gray-800">{activeLead.owner}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Lead Scoring */}
                      <div className="rounded-xl border overflow-hidden border-gray-200">
                        <div className="px-4 py-2.5 border-b bg-gray-50 border-gray-200">
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Lead Scoring</span>
                        </div>
                        <div className="p-4 space-y-3">
                          {[
                            { label: 'Overall Score', value: activeLead.score, color: activeLead.score >= 80 ? '#10b981' : activeLead.score >= 60 ? '#f59e0b' : '#ef4444' },
                            { label: 'Fit Score', value: activeLead.fit_score ?? 0, color: '#6366f1' },
                            { label: 'Engagement Score', value: activeLead.engagement_score ?? 0, color: '#8b5cf6' },
                          ].map(s => (
                            <div key={s.label}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-semibold text-gray-500">{s.label}</span>
                                <span className="text-xs font-bold tabular-nums" style={{ color: s.color }}>{s.value}%</span>
                              </div>
                              <div className="h-1.5 rounded-full overflow-hidden bg-gray-100">
                                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${s.value}%`, background: s.color }} />
                              </div>
                            </div>
                          ))}
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-xs font-semibold text-gray-500">Priority Tier</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              activeLead.priorityTier === 'Critical' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' :
                              activeLead.priorityTier === 'High' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              activeLead.priorityTier === 'Medium' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              'bg-gray-50 text-gray-600 border-gray-200'
                            }`}>{activeLead.priorityTier || activeLead.priority || '—'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Company & Technology Details */}
                      <div className="rounded-xl border overflow-hidden border-gray-200">
                        <div className="px-4 py-2.5 border-b bg-gray-50 border-gray-200">
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Company & Technology Details</span>
                        </div>
                        <div className="p-4 space-y-3">
                          {[
                            { label: 'Industry', value: activeLead.industry },
                            { label: 'Employee Count', value: activeLead.numberOfEmployees || activeLead.employee_count },
                            { label: 'Estimated Deal Value', value: activeLead.value ? `$${Number(activeLead.value).toLocaleString()}` : '—' },
                            { label: 'Current CRM', value: activeLead.currentCRM },
                            { label: 'Operational System', value: activeLead.operationalSystem },
                          ].map(row => (
                            <div key={row.label} className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                              <span className="text-xs font-semibold text-gray-500">{row.label}</span>
                              <span className="text-xs font-bold text-gray-800">{row.value || '—'}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* AI Scoring Insights & Recommendations */}
                      <div className="rounded-xl border overflow-hidden border-gray-200">
                        <div className="px-4 py-2.5 border-b bg-gray-50 border-gray-200">
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">AI Scoring Insights</span>
                        </div>
                        <div className="p-4 space-y-4">
                          {activeLead.topReasons && activeLead.topReasons.length > 0 && (
                            <div>
                              <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Key AI Insights</span>
                              <div className="mt-1.5 flex flex-wrap gap-1.5">
                                {activeLead.topReasons.map((r, i) => (
                                  <span key={i} className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-[10px] font-semibold border border-purple-100">{r}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {activeLead.fitReasons && activeLead.fitReasons.length > 0 && (
                            <div>
                              <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Fit Reasons</span>
                              <ul className="mt-1 list-disc list-inside text-xs text-gray-700 space-y-1">
                                {activeLead.fitReasons.map((r, i) => <li key={i} className="font-medium">{r}</li>)}
                              </ul>
                            </div>
                          )}

                          {activeLead.engagementReasons && activeLead.engagementReasons.length > 0 && (
                            <div>
                              <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Engagement Signals</span>
                              <ul className="mt-1 list-disc list-inside text-xs text-gray-700 space-y-1">
                                {activeLead.engagementReasons.map((r, i) => <li key={i} className="font-medium">{r}</li>)}
                              </ul>
                            </div>
                          )}

                          {leadRecommendations[activeLead.id] && (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-blue-600">Recommended Next Action</span>
                              <p className="mt-1 text-xs font-bold text-gray-800 leading-relaxed">{leadRecommendations[activeLead.id]}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Quick Action Buttons */}
                      <div className="grid grid-cols-3 gap-2">
                        <button onClick={() => { router.push(`?compose=${encodeURIComponent(activeLead.email)}`); onTabChange?.('emails'); setTimeout(() => { window.dispatchEvent(new CustomEvent('pulse-compose-email', { detail: { to: activeLead.email } })); }, 150); }}
                          className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold border border-gray-200 bg-white hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 text-gray-700 cursor-pointer transition">
                          <Mail className="h-4 w-4" /><span>Email</span>
                        </button>
                        <button onClick={() => setIsCallModalOpen(true)}
                          className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold border border-gray-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 text-gray-700 cursor-pointer transition">
                          <PhoneCall className="h-4 w-4" /><span>Call</span>
                        </button>
                        <button onClick={() => { onTabChange?.('calendar'); setTimeout(() => { window.dispatchEvent(new CustomEvent('pulse-open-create-calendar-event-modal', { detail: { title: `Meet with ${activeLead.name}`, attendees: activeLead.email || activeLead.name, date: new Date().toISOString().slice(0, 10), time: '11:00 AM', type: 'meeting' } })); }, 150); }}
                          className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 text-gray-700 cursor-pointer transition">
                          <Calendar className="h-4 w-4" /><span>Meet</span>
                        </button>
                      </div>

                      {/* Notes */}
                      <div className="rounded-xl border border-gray-200 overflow-hidden">
                        <div className="px-4 py-2.5 border-b bg-gray-50 border-gray-200">
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Internal Notes</span>
                        </div>
                        <div className="p-4">
                          <textarea
                            className="w-full p-3 rounded-lg text-xs leading-relaxed resize-y min-h-[90px] focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 text-gray-800 bg-gray-50 border border-gray-200"
                            value={activeLead.notes}
                            onChange={(e) => handleSaveNotes(e.target.value)}
                            placeholder="Record lead feedback, key challenges, sizing metrics..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* RIGHT COLUMN — Activity History */}
                    <div className="rounded-xl border flex flex-col border-gray-200" style={{ maxHeight: '78vh' }}>
                      <div className="px-4 py-2.5 border-b shrink-0 bg-gray-50 border-gray-200">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Activity History</span>
                      </div>
                      <div className="flex gap-1 px-4 pt-3 pb-2 flex-wrap shrink-0 border-b border-gray-100">
                        {[
                          { id: 'timeline', label: 'Timeline', icon: Clock },
                          { id: 'emails', label: 'Emails', icon: Mail },
                          { id: 'calls', label: 'Calls', icon: PhoneCall },
                          { id: 'meetings', label: 'Meetings', icon: Calendar },
                          { id: 'activity chart', label: 'Chart', icon: TrendingUp },
                        ].map(tab => {
                          const Icon = tab.icon;
                          const active = activeHistoryTab === tab.id;
                          return (
                            <button key={tab.id} onClick={() => setActiveHistoryTab(tab.id)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer"
                              style={active ? { background: '#7c3aed', color: '#fff', border: '1px solid #7c3aed' } : { background: '#fff', color: '#6b7280', border: '1px solid #e5e7eb' }}>
                              <Icon className="h-3 w-3 shrink-0" />
                              <span>{tab.label}</span>
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-white">
                        {activeHistoryTab === 'timeline' && (
                          activeLead.timeline.length > 0 ? activeLead.timeline.map(act => (
                            <div key={act.id} className="flex gap-3 p-3 rounded-lg border bg-gray-50 border-gray-100 hover:bg-purple-50 hover:border-purple-100 transition">
                              <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 bg-purple-50 border border-purple-100">
                                <Clock className="h-3.5 w-3.5 text-purple-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-xs font-bold leading-snug text-gray-800">{act.title}</p>
                                  <span className="text-[9px] font-mono shrink-0 text-gray-400">{act.time}</span>
                                </div>
                                <p className="text-[10px] mt-0.5 text-gray-500">{act.desc}</p>
                              </div>
                            </div>
                          )) : <p className="text-center py-8 text-xs text-gray-400">No timeline activity yet.</p>
                        )}
                        {activeHistoryTab === 'emails' && (
                          activeLead.emails.length > 0 ? activeLead.emails.map(e => (
                            <div key={e.id} className="p-3 rounded-lg border bg-purple-50/30 border-purple-100 hover:bg-purple-50 transition">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-[9px] text-gray-400 mb-0.5">To: {activeLead.email}</p>
                                  <p className="text-xs font-bold text-purple-700">{e.subject}</p>
                                </div>
                                <span className="text-[9px] font-mono shrink-0 text-gray-400">{e.time}</span>
                              </div>
                            </div>
                          )) : <p className="text-center py-8 text-xs text-gray-400">No emails logged.</p>
                        )}
                        {activeHistoryTab === 'calls' && (
                          activeLead.calls.length > 0 ? activeLead.calls.map(c => {
                            const connected = c.outcome?.toLowerCase().includes('connect');
                            return (
                              <div key={c.id} className="p-3 rounded-lg border" style={{ background: connected ? '#f0fdf4' : '#fff1f2', borderColor: connected ? '#bbf7d0' : '#fecdd3' }}>
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="px-2 py-0.5 rounded text-[9px] font-bold" style={connected ? { background: '#d1fae5', color: '#065f46' } : { background: '#fee2e2', color: '#991b1b' }}>{c.outcome}</span>
                                  <span className="text-[9px] font-mono text-gray-400">{c.time}</span>
                                </div>
                                <p className="text-[10px] text-gray-600">{c.notes}</p>
                              </div>
                            );
                          }) : <p className="text-center py-8 text-xs text-gray-400">No calls logged.</p>
                        )}
                        {activeHistoryTab === 'meetings' && (
                          activeLead.meetings.length > 0 ? activeLead.meetings.map(m => (
                            <div key={m.id} className="p-3 rounded-lg border border-blue-100 bg-blue-50/50 hover:bg-blue-50 transition">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <p className="text-xs font-bold text-blue-800">{m.title}</p>
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 bg-purple-100 text-purple-700">{m.date}</span>
                              </div>
                              <p className="text-[10px] flex items-center gap-1 mb-1 text-blue-600"><Clock className="h-2.5 w-2.5" />{m.time}</p>
                              <p className="text-[10px] text-gray-500">{m.desc}</p>
                            </div>
                          )) : <p className="text-center py-8 text-xs text-gray-400">No meetings scheduled.</p>
                        )}
                        {activeHistoryTab === 'activity chart' && (
                          <div className="p-3 rounded-lg border bg-gray-50 border-gray-100">
                            <h5 className="text-[9px] font-bold uppercase tracking-wider mb-3 flex items-center gap-1 text-gray-500">
                              <TrendingUp className="h-3.5 w-3.5 text-purple-500" />Lead Score Progression
                            </h5>
                            <div className="w-full h-40 relative">
                              <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
                                <line x1="0" y1="90" x2="300" y2="90" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="3,3" />
                                <line x1="0" y1="50" x2="300" y2="50" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="3,3" />
                                <line x1="0" y1="10" x2="300" y2="10" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="3,3" />
                                <path d={getProgressPoints(activeLead.score).areaPath} fill="url(#purpleGradMax)" opacity="0.2" />
                                <path d={getProgressPoints(activeLead.score).path} fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" />
                                {getProgressPoints(activeLead.score).points.map((p, idx) => (
                                  <circle key={idx} cx={p.x} cy={p.y} r="4" fill="#7c3aed" stroke="white" strokeWidth="1.5" />
                                ))}
                                <defs>
                                  <linearGradient id="purpleGradMax" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#7c3aed" />
                                    <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
                                  </linearGradient>
                                </defs>
                              </svg>
                              <div className="flex justify-between text-[8px] font-medium mt-1 text-gray-400">
                                <span>Start</span><span>Midpoint</span><span>Today ({activeLead.score})</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* ===== COMPACT SIDEBAR LAYOUT ===== */
              <>
                {/* Card Title Header */}
                <div className="flex items-start justify-between border-b border-border pb-3">
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{activeLead.name}</h3>
                    <p className="text-[10px] text-muted-foreground font-semibold">{activeLead.company}</p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button 
                      type="button"
                      onClick={() => setIsMaximized(true)}
                      className="p-1 bg-secondary hover:bg-secondary border border-border rounded text-muted-foreground hover:text-foreground transition duration-200 cursor-pointer"
                      title="Maximize Summary"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </button>
                    {/* Close Button */}
                    <button 
                      onClick={() => setSelectedLeadId(null)}
                      className="p-1 bg-secondary hover:bg-secondary border border-border rounded text-muted-foreground hover:text-foreground transition duration-200 cursor-pointer"
                      title="Close Summary"
                      aria-label="Close Summary"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Quick Details Fields list */}
                <div className="py-3.5 space-y-2.5 text-[11px] font-semibold border-b border-border">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className={`font-semibold px-1.5 py-0.25 rounded ${
                      activeLead.status === 'Converted' ? 'text-brand-cyan bg-brand-cyan/15' : 'text-foreground'
                    }`}>{activeLead.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Priority</span>
                    <span className={`font-semibold ${
                      activeLead.priorityTier === 'Critical' ? 'text-brand-cyan bg-brand-cyan/15 px-1.5 py-0.25 rounded' :
                      activeLead.priorityTier === 'High' ? 'text-amber-700 bg-amber-50 px-1.5 py-0.25 rounded' :
                      activeLead.priorityTier === 'Medium' ? 'text-blue-700 bg-blue-50 px-1.5 py-0.25 rounded' :
                      activeLead.priorityTier === 'Low' ? 'text-muted-foreground bg-secondary px-1.5 py-0.25 rounded' : ''
                    }`}>{activeLead.priorityTier || activeLead.priority}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <a href={`mailto:${activeLead.email}`} className="text-brand-purple hover:underline truncate max-w-[150px]">{activeLead.email}</a>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone</span>
                    <span className="text-foreground tabular-nums">{activeLead.phone}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Owner</span>
                    <div className="flex items-center space-x-1">
                      <img src={activeLead.ownerAvatar || ''} alt={activeLead.owner} className="h-4.5 w-4.5 rounded-full border border-border" />
                      <span className="text-foreground">{activeLead.owner}</span>
                    </div>
                  </div>
                </div>

                {/* Priority View - Advanced Scoring Details (toggled on/off) */}
                {isPriorityView && (
                  <div className="mt-4 border border-border rounded-xl p-3.5">
                    <h4 className="text-[10px] font-semibold text-foreground uppercase tracking-wider flex items-center space-x-1 mb-3">
                      <Award className="h-4 w-4 text-brand-purple" />
                      <span>Priority Scoring Details</span>
                    </h4>
                    <div className="space-y-2.5 text-[10px] font-semibold">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Fit Score</span>
                        <span className="font-semibold text-foreground">{activeLead.fit_score ?? 0}%</span>
                      </div>
                      {activeLead.fitReasons.length > 0 && (
                        <div className="reason-subtext">
                          {activeLead.fitReasons.slice(0, 2).map((r, i) => (
                            <div key={i} className="mb-0.5">• {r}</div>
                          ))}
                        </div>
                      )}
                      <div className="border-t border-border" />
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Engagement Score</span>
                        <span className="font-semibold text-foreground">{activeLead.engagement_score ?? 0}%</span>
                      </div>
                      {activeLead.engagementReasons.length > 0 && (
                        <div className="reason-subtext">
                          {activeLead.engagementReasons.slice(0, 2).map((r, i) => (
                            <div key={i} className="mb-0.5">• {r}</div>
                          ))}
                        </div>
                      )}
                      <div className="border-t border-border" />
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Overall Score</span>
                        <span className={`font-semibold tabular-nums ${
                          activeLead.score >= 80 ? 'text-brand-cyan' : activeLead.score >= 60 ? 'text-amber-600' : 'text-destructive'
                        }`}>{activeLead.score}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Tier</span>
                        <span className={`font-semibold ${
                          activeLead.priorityTier === 'Critical' ? 'text-brand-cyan' :
                          activeLead.priorityTier === 'High' ? 'text-amber-600' :
                          activeLead.priorityTier === 'Medium' ? 'text-blue-600' :
                          activeLead.priorityTier === 'Low' ? 'text-muted-foreground' : 'text-muted-foreground'
                        }`}>{activeLead.priorityTier || activeLead.priority}</span>
                      </div>
                      {activeLead.topReasons.length > 0 && (
                        <div className="border-t border-border pt-2">
                          <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">Top Reasons</span>
                          <div className="mt-1 text-[9px] text-muted-foreground leading-relaxed">
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
                  <h4 className="text-[10px] font-semibold text-foreground uppercase tracking-wider mb-1.5">Internal Notes</h4>
                  <textarea
                    className="w-full p-2 border border-border rounded-lg text-[11px] font-semibold text-foreground bg-secondary placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand-purple/20 min-h-[70px] resize-y leading-relaxed"
                    value={activeLead.notes}
                    onChange={(e) => handleSaveNotes(e.target.value)}
                    placeholder="Record lead feedback, key challenges, sizing metrics..."
                  />
                </div>

                {/* Action Triggers panel */}
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <button 
                    onClick={() => {
                      router.push(`?compose=${encodeURIComponent(activeLead.email)}`);
                      onTabChange?.('emails');
                      setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('pulse-compose-email', { detail: { to: activeLead.email } }));
                      }, 150);
                    }}
                    className="inline-flex items-center justify-center space-x-1 py-1.5 border border-border hover:bg-secondary rounded-lg text-[10px] font-semibold text-muted-foreground cursor-pointer transition-colors"
                  >
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Email</span>
                  </button>
                  <button 
                    onClick={() => setIsCallModalOpen(true)}
                    className="inline-flex items-center justify-center space-x-1 py-1.5 border border-border hover:bg-secondary rounded-lg text-[10px] font-semibold text-muted-foreground cursor-pointer transition-colors"
                  >
                    <PhoneCall className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>calls</span>
                  </button>
                  <button 
                    onClick={() => {
                      onTabChange?.('calendar');
                      setTimeout(() => {
                        const event = new CustomEvent('pulse-open-create-calendar-event-modal', {
                          detail: {
                            title: `Meet with ${activeLead.name}`,
                            attendees: activeLead.email || activeLead.name,
                            details: `Meeting scheduled from Leads page context. Lead: ${activeLead.name} at ${activeLead.company}.`,
                            date: new Date().toISOString().slice(0, 10),
                            time: '11:00 AM',
                            type: 'meeting'
                          }
                        });
                        window.dispatchEvent(event);
                      }, 150);
                    }}
                    className="inline-flex items-center justify-center space-x-1 py-1.5 border border-border hover:bg-secondary rounded-lg text-[10px] font-semibold text-muted-foreground cursor-pointer transition-colors"
                  >
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Meet</span>
                  </button>
                </div>

                {/* History Tabs */}
                <div className="mt-5 border-t border-border pt-4">
                  <div className="flex flex-wrap bg-secondary/60 dark:bg-secondary/35 p-1 rounded-xl gap-1 text-[9px] font-semibold uppercase mb-4 border border-border/40">
                    {[
                      { id: 'timeline', label: 'Timeline', icon: Clock },
                      { id: 'emails', label: 'Emails', icon: Mail },
                      { id: 'calls', label: 'Calls', icon: PhoneCall },
                      { id: 'meetings', label: 'Meetings', icon: Calendar },
                      { id: 'activity chart', label: 'Chart', icon: TrendingUp }
                    ].map((tabItem) => {
                      const IconComp = tabItem.icon;
                      const isActive = activeHistoryTab === tabItem.id;
                      return (
                        <button
                          key={tabItem.id}
                          onClick={() => setActiveHistoryTab(tabItem.id)}
                          className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg transition duration-200 cursor-pointer text-[9px] flex-grow min-w-[62px] shrink-0 ${
                            isActive 
                              ? 'bg-card text-brand-purple border border-border/50 shadow-sm font-bold scale-[1.02]' 
                              : 'text-muted-foreground hover:text-foreground hover:bg-background/20'
                          }`}
                        >
                          <IconComp className="h-3 w-3 shrink-0" />
                          <span>{tabItem.label}</span>
                        </button>
                      );
                    })}
                  </div>
       
                  {/* Tab content loops */}
                  <div className="mt-3.5 max-h-56 overflow-y-auto pr-1 scrollbar-thin space-y-3">
                    {activeHistoryTab === 'timeline' && (
                      <div className="space-y-4 py-1">
                        {activeLead.timeline.length > 0 ? (
                          activeLead.timeline.map((act) => {
                            return (
                              <div key={act.id} className="text-[10px] leading-relaxed border-b border-border/40 pb-2 last:border-0">
                                <div className="font-bold text-foreground flex justify-between">
                                  <span className="text-brand-purple">{act.title}</span>
                                  <span className="text-muted-foreground font-semibold flex items-center gap-1 font-mono text-[9px]">
                                    <Clock className="h-2.5 w-2.5 text-muted-foreground/60" />
                                    {act.time}
                                  </span>
                                </div>
                                <p className="text-muted-foreground mt-1 font-medium">{act.desc}</p>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-center text-muted-foreground py-3 text-[10px]">No timeline logs recorded.</p>
                        )}
                      </div>
                    )}
       
                    {activeHistoryTab === 'emails' && (
                      <div className="space-y-2.5">
                        {activeLead.emails.length > 0 ? (
                          activeLead.emails.map((e) => (
                            <div key={e.id} className="p-3 border border-border rounded-xl bg-card/60 backdrop-blur-sm hover:bg-secondary/20 hover:border-brand-purple/20 transition duration-200 shadow-sm relative overflow-hidden group/item">
                              <div className="absolute top-0 left-0 w-1 h-full bg-brand-purple/50" />
                              <div className="flex justify-between items-center text-[10px] font-bold text-foreground">
                                <div className="flex flex-col">
                                  <span className="text-[9px] text-muted-foreground">To: {activeLead.email}</span>
                                  <span className="text-brand-purple font-extrabold group-hover/item:underline mt-0.5">{e.subject}</span>
                                </div>
                                <span className="text-muted-foreground font-semibold flex items-center gap-1 font-mono text-[9px] shrink-0 self-start">
                                  <Clock className="h-2.5 w-2.5 text-muted-foreground/60" />
                                  {e.time}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-center text-muted-foreground py-3 text-[10px]">No emails logged.</p>
                        )}
                      </div>
                    )}
       
                    {activeHistoryTab === 'calls' && (
                      <div className="space-y-2.5">
                        {activeLead.calls.length > 0 ? (
                          activeLead.calls.map((c) => {
                            const isConnected = c.outcome?.toLowerCase().includes('connect');
                            return (
                              <div key={c.id} className="p-3 border border-border rounded-xl bg-card/60 backdrop-blur-sm hover:bg-secondary/20 hover:border-emerald-500/20 transition duration-200 shadow-sm relative overflow-hidden group/item">
                                <div className={`absolute top-0 left-0 w-1 h-full ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                <div className="flex justify-between items-center text-[10px] font-bold text-foreground mb-1.5">
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider ${
                                    isConnected ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                                  }`}>
                                    {c.outcome}
                                  </span>
                                  <span className="text-muted-foreground font-semibold flex items-center gap-1 font-mono text-[9px]">
                                    <Clock className="h-2.5 w-2.5 text-muted-foreground/60" />
                                    {c.time}
                                  </span>
                                </div>
                                <p className="text-[10px] text-muted-foreground leading-relaxed font-semibold">{c.notes}</p>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-center text-muted-foreground py-3 text-[10px]">No call notes logged.</p>
                        )}
                      </div>
                    )}
       
                    {activeHistoryTab === 'meetings' && (
                      <div className="space-y-2.5">
                        {activeLead.meetings.length > 0 ? (
                          activeLead.meetings.map((m) => (
                            <div key={m.id} className="p-3 border border-border rounded-xl bg-card/60 backdrop-blur-sm hover:bg-secondary/20 hover:border-brand-blue/20 transition duration-200 shadow-sm relative overflow-hidden group/item">
                              <div className="absolute top-0 left-0 w-1 h-full bg-brand-blue" />
                              <div className="flex justify-between items-center text-[10px] font-bold text-foreground mb-1">
                                <span className="text-brand-blue font-extrabold">{m.title}</span>
                                <span className="px-1.5 py-0.5 bg-brand-purple/10 text-brand-purple border border-brand-purple/15 rounded text-[8.5px] font-extrabold">{m.date}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-semibold mb-1.5">
                                <Clock className="h-2.5 w-2.5 text-brand-purple/70" />
                                <span>{m.time}</span>
                              </div>
                              <p className="text-[10px] text-muted-foreground leading-relaxed font-semibold">{m.desc}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-center text-muted-foreground py-3 text-[10px]">No meetings scheduled.</p>
                        )}
                      </div>
                    )}
       
                    {activeHistoryTab === 'activity chart' && (
                      <div className="space-y-3 p-1">
                        <div className="p-3 border border-border rounded-xl bg-secondary">
                          <h5 className="text-[9px] font-semibold text-foreground uppercase tracking-wider mb-2 flex items-center space-x-1">
                            <TrendingUp className="h-3.5 w-3.5 text-brand-purple" />
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
                                stroke="var(--brand-purple)"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                              />
                              
                              {getProgressPoints(activeLead.score).points.map((p, idx) => (
                                <circle key={idx} cx={p.x} cy={p.y} r="4" fill="var(--brand-purple)" stroke="white" strokeWidth="1.5" />
                              ))}
       
                              <defs>
                                <linearGradient id="purpleGradLeads" x1="0%" y1="0%" x2="0%" y2="100%">
                                  <stop offset="0%" stopColor="var(--brand-purple)" />
                                  <stop offset="100%" stopColor="var(--brand-purple)" stopOpacity="0" />
                                </linearGradient>
                              </defs>
                            </svg>
                            
                            <div className="flex justify-between text-[8px] font-semibold text-muted-foreground mt-1">
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
              </>
            )}
          </div>
        </div>
      )}

      {/* Create Lead modal removed — replaced by full page create view */}

      {/* EDIT LEAD DIALOG MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-border flex justify-between items-center bg-secondary">
              <h3 className="font-semibold text-foreground text-sm">Edit Lead Details</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleEditLead} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Lead Name</label>
                  <input type="text" required placeholder="e.g. John Doe" value={leadForm.name} onChange={(e) => setLeadForm({...leadForm, name: e.target.value})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground placeholder-muted-foreground focus:outline-none bg-background" />
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Company</label>
                  <input type="text" required placeholder="e.g. Acme Corp" value={leadForm.company} onChange={(e) => setLeadForm({...leadForm, company: e.target.value})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground placeholder-muted-foreground focus:outline-none bg-background" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Email</label>
                  <input type="email" placeholder="name@company.com" value={leadForm.email} onChange={(e) => setLeadForm({...leadForm, email: e.target.value})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none bg-background" />
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Phone</label>
                  <input type="text" placeholder="+1 (555) 000-0000" value={leadForm.phone} onChange={(e) => setLeadForm({...leadForm, phone: e.target.value})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none bg-background" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Status</label>
                  <select value={leadForm.status} onChange={(e) => setLeadForm({...leadForm, status: e.target.value as any})} className="w-full px-2 py-1.5 border border-border bg-background text-foreground rounded-lg text-xs cursor-pointer">
                    <option>New</option>
                    <option>Contacted</option>
                    <option>Qualified</option>
                    <option>Converted</option>
                    <option>Lost</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Priority</label>
                  <select value={leadForm.priority} onChange={(e) => setLeadForm({...leadForm, priority: e.target.value as any})} className="w-full px-2 py-1.5 border border-border bg-background text-foreground rounded-lg text-xs cursor-pointer">
                    <option>Critical</option>
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Owner</label>
                  <select value={leadForm.owner} onChange={(e) => setLeadForm({...leadForm, owner: e.target.value})} className="w-full px-2 py-1.5 border border-border bg-background text-foreground rounded-lg text-xs cursor-pointer">
                    <option>Sarah Johnson</option>
                    <option>Alex Johnson</option>
                    <option>Lisa Martinez</option>
                  </select>
                </div>
              </div>
              <div className="pt-3 border-t border-border flex justify-end space-x-2.5">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-1.5 border border-border rounded-lg text-xs font-semibold text-foreground hover:bg-secondary cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-brand-purple hover:bg-brand-purple/90 text-primary-foreground rounded-lg text-xs font-semibold cursor-pointer">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SEND EMAIL DIALOG MODAL */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-border flex justify-between items-center bg-secondary">
              <h3 className="font-semibold text-foreground text-sm">Send Email to {activeLead?.name}</h3>
              <button onClick={() => { setIsEmailModalOpen(false); setEmailError(null); }} className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleSendEmail} className="p-5 space-y-4">
              {!gmailConnected && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-foreground">
                  <strong>Gmail not connected.</strong> Go to <strong>Integrations</strong> in the sidebar to connect your Gmail account, then try again.
                </div>
              )}
              {activeLead?.email && (
                <div className="p-2.5 bg-secondary border border-border rounded-lg">
                  <span className="text-[9px] font-semibold text-foreground uppercase tracking-wider">To:</span>
                  <span className="ml-2 text-xs text-foreground">{activeLead.email}</span>
                </div>
              )}
              {!activeLead?.email && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive">
                  <strong>No email address.</strong> Edit this lead to add an email address first.
                </div>
              )}
              {emailError && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive">
                  {emailError}
                </div>
              )}
              <div>
                <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Subject</label>
                <input type="text" required placeholder="Subject line" value={emailForm.subject} onChange={(e) => setEmailForm({...emailForm, subject: e.target.value})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground placeholder-muted-foreground focus:outline-none bg-background" />
              </div>
              <div>
                <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Email Body</label>
                <textarea required placeholder="Write your message here..." value={emailForm.body} onChange={(e) => setEmailForm({...emailForm, body: e.target.value})} className="w-full p-3 border border-border rounded-lg text-xs text-foreground placeholder-muted-foreground focus:outline-none min-h-[120px] leading-relaxed bg-background" />
              </div>
              <div className="pt-3 border-t border-border flex justify-end space-x-2.5">
                <button type="button" onClick={() => { setIsEmailModalOpen(false); setEmailError(null); }} className="px-4 py-1.5 border border-border rounded-lg text-xs font-semibold text-foreground hover:bg-secondary cursor-pointer">Cancel</button>
                <button type="submit" disabled={emailSending || !gmailConnected || !activeLead?.email} className="inline-flex items-center space-x-1.5 px-4 py-1.5 bg-brand-purple hover:bg-brand-purple/90 text-primary-foreground rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
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
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-border flex justify-between items-center bg-secondary">
              <h3 className="font-semibold text-foreground text-sm">Log Call Outcome</h3>
              <button onClick={() => setIsCallModalOpen(false)} className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleLogCall} className="p-5 space-y-4">
              <div>
                <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Call Outcome</label>
                <select value={callForm.outcome} onChange={(e) => setCallForm({...callForm, outcome: e.target.value})} className="w-full px-3 py-1.5 border border-border bg-background text-foreground rounded-lg text-xs cursor-pointer">
                  <option>Spoke with Lead</option>
                  <option>Left Voice Mail</option>
                  <option>Busy / No Answer</option>
                  <option>Lead Not Interested</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Call Notes</label>
                <textarea required placeholder="Summarize prospect comments, next scheduling options..." value={callForm.notes} onChange={(e) => setCallForm({...callForm, notes: e.target.value})} className="w-full p-3 border border-border rounded-lg text-xs text-foreground placeholder-muted-foreground focus:outline-none min-h-[80px] bg-background" />
              </div>
              <div className="pt-3 border-t border-border flex justify-end space-x-2.5">
                <button type="button" onClick={() => setIsCallModalOpen(false)} className="px-4 py-1.5 border border-border rounded-lg text-xs font-semibold text-foreground hover:bg-secondary cursor-pointer">Cancel</button>
                <button type="submit" className="inline-flex items-center space-x-1.5 px-4 py-1.5 bg-brand-purple hover:bg-brand-purple/90 text-primary-foreground rounded-lg text-xs font-semibold cursor-pointer">
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
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-border flex justify-between items-center bg-secondary">
              <h3 className="font-semibold text-foreground text-sm">Schedule Meeting</h3>
              <button onClick={() => setIsMeetingModalOpen(false)} className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleScheduleMeeting} className="p-5 space-y-4">
              <div>
                <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Meeting Title</label>
                <input type="text" required placeholder="e.g. Pulse Sandbox Architecture Demo" value={meetingForm.title} onChange={(e) => setMeetingForm({...meetingForm, title: e.target.value})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground placeholder-muted-foreground focus:outline-none bg-background" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Date</label>
                  <input type="date" required value={meetingForm.date} onChange={(e) => setMeetingForm({...meetingForm, date: e.target.value})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none cursor-pointer bg-background" />
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Time</label>
                  <input type="time" required value={meetingForm.time} onChange={(e) => setMeetingForm({...meetingForm, time: e.target.value})} className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground focus:outline-none cursor-pointer bg-background" />
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Agenda / Details</label>
                <textarea required placeholder="Discuss compliance guidelines and db sizing outline..." value={meetingForm.desc} onChange={(e) => setMeetingForm({...meetingForm, desc: e.target.value})} className="w-full p-3 border border-border rounded-lg text-xs text-foreground placeholder-muted-foreground focus:outline-none min-h-[80px] bg-background" />
              </div>
              <div className="pt-3 border-t border-border flex justify-end space-x-2.5">
                <button type="button" onClick={() => setIsMeetingModalOpen(false)} className="px-4 py-1.5 border border-border rounded-lg text-xs font-semibold text-foreground hover:bg-secondary cursor-pointer">Cancel</button>
                <button type="submit" className="inline-flex items-center space-x-1.5 px-4 py-1.5 bg-brand-purple hover:bg-brand-purple/90 text-primary-foreground rounded-lg text-xs font-semibold cursor-pointer">
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
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-border flex justify-between items-center bg-secondary">
              <h3 className="font-semibold text-foreground text-sm">Convert Lead to Account & Deal</h3>
              <button onClick={() => { setIsConvertModalOpen(false); setConvertingLeadId(null); }} className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleConvertLeadSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Industry</label>
                <input 
                  type="text" 
                  placeholder="e.g. Software, Healthcare, Retail" 
                  value={convertForm.industry} 
                  onChange={(e) => setConvertForm({...convertForm, industry: e.target.value})} 
                  className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand-purple/20 bg-background" 
                />
              </div>
              <div>
                <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Revenue (₹)</label>
                <input 
                  type="number" 
                  placeholder="e.g. 1200000" 
                  value={convertForm.revenue} 
                  onChange={(e) => setConvertForm({...convertForm, revenue: e.target.value})} 
                  className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand-purple/20 bg-background" 
                />
              </div>
              <div>
                <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Pipeline Stage</label>
                <select 
                  value={convertForm.pipelineStageId} 
                  onChange={(e) => setConvertForm({...convertForm, pipelineStageId: e.target.value})} 
                  className="w-full px-2 py-1.5 border border-border bg-background text-foreground rounded-lg text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-purple/20"
                >
                  <option value="">— Default (New) —</option>
                  {pipelineStages.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-semibold text-foreground uppercase tracking-wider mb-1">Number of Employees</label>
                <input 
                  type="number" 
                  placeholder="e.g. 150" 
                  value={convertForm.employeeCount} 
                  onChange={(e) => setConvertForm({...convertForm, employeeCount: e.target.value})} 
                  className="w-full px-3 py-1.5 border border-border rounded-lg text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand-purple/20 bg-background" 
                />
              </div>
              <div className="pt-3 border-t border-border flex justify-end space-x-2.5">
                <button 
                  type="button" 
                  onClick={() => { setIsConvertModalOpen(false); setConvertingLeadId(null); }} 
                  className="px-4 py-1.5 border border-border rounded-lg text-xs font-semibold text-foreground hover:bg-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-1.5 bg-brand-cyan hover:bg-brand-cyan/90 text-primary-foreground rounded-lg text-xs font-semibold cursor-pointer transition-colors"
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
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-border flex items-center space-x-2 bg-destructive/10">
              <AlertCircle className="h-4.5 w-4.5 text-destructive" />
              <h3 className="font-semibold text-foreground text-sm">Confirm Delete</h3>
            </div>
            <div className="p-5">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Are you sure you want to delete this lead? This action <span className="font-semibold text-destructive">cannot be undone</span> and will permanently remove all associated data.
              </p>
              <div className="flex justify-end space-x-2.5 mt-5">
                <button 
                  onClick={() => setDeleteConfirmId(null)} 
                  className="px-4 py-1.5 border border-border rounded-lg text-xs font-semibold text-foreground hover:bg-secondary cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteLead} 
                  className="px-4 py-1.5 bg-destructive hover:bg-destructive/90 text-primary-foreground rounded-lg text-xs font-semibold cursor-pointer transition-colors inline-flex items-center space-x-1.5"
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
  