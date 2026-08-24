'use client';

import { toast } from '@/lib/toast';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SkeletonLoader from './SkeletonLoader';
import { Lead as BackendLead, getLeads, getLead, createLead, updateLead, updateLeadStatus, deleteLead as apiDeleteLead, convertLead, sendGmailEmail, getGmailStatus, getEmails, getPipelineStages, fetchBatchRecommendations, fetchLeadRecommendation, resolveImageUrl, bulkCreateLeads, toBackendLeadPayload } from '@/utils/api';
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
  Minimize2,
  Loader2,
  RefreshCw,
  Eye,
  Download
} from 'lucide-react';

// Mapping helpers
const STATUS_MAP: Record<string, string> = {
  'New': 'new', 'Contacted': 'contacted', 'Qualified': 'qualified', 'Converted': 'converted', 'Lost': 'lost',
};
const STATUS_UNMAP: Record<string, Lead['status']> = {
  'new': 'New', 'contacted': 'Contacted', 'qualified': 'Qualified', 'converted': 'Converted', 'lost': 'Lost',
};

// Simple CSV parser
/* ── Smart CSV Parser ──────────────────────────────────────────────────
 * Handles unstructured lead data: varying column names, missing fields,
 * mixed delimiters, quoted values, combined name+company, emails-as-names,
 * and inconsistent formatting.
 */

const COLUMN_ALIASES: Record<string, keyof ParsedLead> = {
  name: 'name', 'full name': 'name', 'contact name': 'name', 'lead name': 'name',
  prospect: 'name', contact: 'name', 'first name': 'name', 'last name': 'name',
  'company name': 'company', company: 'company', org: 'company', organization: 'company',
  'company/org': 'company', employer: 'company',
  email: 'email', 'email address': 'email', 'contact email': 'email', 'e mail': 'email',
  phone: 'phone', 'phone number': 'phone', 'contact phone': 'phone', mobile: 'phone',
  tel: 'phone', telephone: 'phone', cell: 'phone',
  industry: 'industry', sector: 'industry', vertical: 'industry',
  location: 'location', city: 'location', address: 'location', region: 'location',
  'work location': 'location', country: 'location', 'office location': 'location',
  source: 'source', 'lead source': 'source', 'how did they find us': 'source', channel: 'source',
  status: 'status', 'lead status': 'status', stage: 'status', state: 'status',
  priority: 'priority', 'lead priority': 'priority', urgency: 'priority', rank: 'priority',
  notes: 'notes', 'lead notes': 'notes', comments: 'notes', description: 'notes',
  details: 'notes', 'additional info': 'notes', 'internal notes': 'notes',
  'job title': 'jobTitle', title: 'jobTitle', role: 'jobTitle', position: 'jobTitle',
  designation: 'jobTitle', 'job role': 'jobTitle',
  'number of employees': 'numberOfEmployees', employees: 'numberOfEmployees', headcount: 'numberOfEmployees',
  'current crm': 'currentCRM', crm: 'currentCRM', 'existing crm': 'currentCRM',
  'operational system': 'operationalSystem', 'ops system': 'operationalSystem', systems: 'operationalSystem',
};

type ParsedLead = {
  name: string; jobTitle: string; email: string; phone: string; company: string;
  industry: string; location: string; numberOfEmployees: string; source: string;
  currentCRM: string; operationalSystem: string; status: string; priority: string;
  notes: string; owner: string;
};

const STATUS_KEYWORDS: Record<string, string> = {
  new: 'New', fresh: 'New', inbound: 'New', raw: 'New',
  contacted: 'Contacted', called: 'Contacted', emailed: 'Contacted', reached: 'Contacted',
  qualified: 'Qualified', vetted: 'Qualified', scored: 'Qualified', approved: 'Qualified',
  converted: 'Converted', won: 'Converted', closed: 'Converted', deal: 'Converted',
  lost: 'Lost', churned: 'Lost', rejected: 'Lost', declined: 'Lost', dead: 'Lost',
};

const PRIORITY_KEYWORDS: Record<string, string> = {
  critical: 'Critical', urgent: 'Critical', asap: 'Critical', p0: 'Critical',
  high: 'High', important: 'High', hot: 'High', p1: 'High',
  medium: 'Medium', normal: 'Medium', standard: 'Medium', p2: 'Medium', mid: 'Medium',
  low: 'Low', minor: 'Low', cold: 'Low', p3: 'Low', lukewarm: 'Low',
};

const SOURCE_KEYWORDS: Record<string, string> = {
  referral: 'referral', referred: 'referral', word: 'referral',
  linkedin: 'linkedin', li: 'linkedin', social: 'linkedin',
  website: 'website', web: 'website', organic: 'website', search: 'website', seo: 'website',
  event: 'trade_show', conference: 'trade_show', trade: 'trade_show', expo: 'trade_show',
  webinar: 'inbound', seminar: 'inbound', workshop: 'inbound',
  partner: 'partner', channel: 'partner', reseller: 'partner',
  ads: 'social_media', paid: 'social_media', ppc: 'social_media', facebook: 'social_media', google: 'social_media',
  email: 'email_campaign', cold: 'email_campaign', outreach: 'email_campaign', campaign: 'email_campaign',
  api: 'api', integration: 'api',
};

function normalizeStatus(raw: string): string {
  const lower = raw.toLowerCase().trim();
  return STATUS_KEYWORDS[lower] || (raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase());
}

function normalizePriority(raw: string): string {
  const lower = raw.toLowerCase().trim();
  return PRIORITY_KEYWORDS[lower] || 'Medium';
}

function normalizeSource(raw: string): string {
  const lower = raw.toLowerCase().trim();
  for (const [key, val] of Object.entries(SOURCE_KEYWORDS)) {
    if (lower.includes(key)) return val;
  }
  return raw;
}

function extractNameFromEmail(email: string): string {
  const local = email.split('@')[0] || '';
  return local
    .replace(/[._-]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/\s+/g, ' ')
    .trim();
}

function extractCompanyFromEmail(email: string): string {
  const domain = email.split('@')[1] || '';
  const base = domain.split('.')[0] || '';
  if (['gmail', 'yahoo', 'hotmail', 'outlook', 'aol', 'icloud', 'mail', 'email'].includes(base.toLowerCase())) return '';
  return base.charAt(0).toUpperCase() + base.slice(1);
}

function cleanQuotedValue(val: string): string {
  return val.replace(/^["']{1,2}|["']{1,2}$/g, '').trim();
}

function extractPhoneFromText(text: string): string {
  const phoneMatch = text.match(/[\+]?[\d\s\-\(\)\.]{7,20}/);
  return phoneMatch ? phoneMatch[0].trim() : '';
}

function extractEmailFromText(text: string): string {
  const emailMatch = text.match(/[\w.+-]+@[\w.-]+\.\w{2,}/);
  return emailMatch ? emailMatch[0].trim() : '';
}

function detectDelimiter(lines: string[]): string {
  const first = lines[0] || '';
  const semicolons = (first.match(/;/g) || []).length;
  const tabs = (first.match(/\t/g) || []).length;
  const pipes = (first.match(/\|/g) || []).length;
  if (semicolons > 1) return ';';
  if (tabs > 1) return '\t';
  if (pipes > 1) return '|';
  return ',';
}

function smartSplitLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === quoteChar && line[i + 1] === quoteChar) {
        current += ch;
        i++;
      } else if (ch === quoteChar) {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else if (ch === '"' || ch === "'") {
      inQuotes = true;
      quoteChar = ch;
    } else if (ch === delimiter) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function mapColumn(header: string): keyof ParsedLead | null {
  const normalized = header.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
  return COLUMN_ALIASES[normalized] || null;
}

function parseLeadCSV(text: string): ParsedLead[] {
  const lines = text.split(/\r?\n/).filter((l: string) => l.trim());
  if (lines.length < 2) return [];

  const delimiter = detectDelimiter(lines);
  const headers = smartSplitLine(lines[0], delimiter);

  if (headers.length < 2) {
    return parseSpaceDelimited(text);
  }

  const defaultLead: ParsedLead = {
    name: '', jobTitle: '', email: '', phone: '', company: '',
    industry: '', location: '', numberOfEmployees: '', source: '',
    currentCRM: '', operationalSystem: '', status: 'New', priority: 'Medium',
    notes: '', owner: 'Sarah Johnson',
  };

  return lines.slice(1).map((line: string) => {
    const values = smartSplitLine(line, delimiter);
    const raw: Record<string, string> = {};
    headers.forEach((h: string, i: number) => {
      raw[h] = cleanQuotedValue(values[i] || '');
    });

    const lead = { ...defaultLead };

    const mapped: Record<string, string> = {};
    for (const [header, value] of Object.entries(raw)) {
      if (!value) continue;
      const field = mapColumn(header);
      if (field) {
        mapped[field] = (mapped[field] || '') ? mapped[field] + ' ' + value : value;
      }
    }

    for (const [field, value] of Object.entries(mapped)) {
      const f = field as keyof ParsedLead;
      if (f === 'status') {
        lead.status = normalizeStatus(value);
      } else if (f === 'priority') {
        lead.priority = normalizePriority(value);
      } else if (f === 'source') {
        lead.source = normalizeSource(value);
      } else {
        (lead as any)[f] = cleanQuotedValue(value);
      }
    }

    if (!lead.name && mapped.email) {
      lead.name = extractNameFromEmail(mapped.email);
    }

    if (!lead.company && mapped.email) {
      lead.company = extractCompanyFromEmail(mapped.email);
    }

    if (!lead.name) {
      const combined = Object.values(raw).join(' ');
      const foundEmail = extractEmailFromText(combined);
      if (foundEmail && !lead.email) {
        lead.email = foundEmail;
        lead.name = extractNameFromEmail(foundEmail);
        if (!lead.company) lead.company = extractCompanyFromEmail(foundEmail);
      }
    }

    if (!lead.phone) {
      const combined = Object.values(raw).join(' ');
      const foundPhone = extractPhoneFromText(combined);
      if (foundPhone) lead.phone = foundPhone;
    }

    if (!lead.name) {
      const combined = Object.values(raw).filter(v => v && !v.includes('@') && !v.match(/^\+?[\d\s\-\(\)]+$/)).join(' ');
      const nameMatch = combined.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/);
      if (nameMatch) lead.name = nameMatch[1];
    }

    if (!lead.company && lead.name) {
      const combined = Object.values(raw).join(' ');
      const companyPatterns = [
        /(?:at|@|for|from|w\/)\s+([A-Z][A-Za-z&\s]+?)(?:\s*,|\s*$)/,
        /\b([A-Z][A-Za-z]{2,}(?:\s+(?:Corp|Inc|LLC|Ltd|Co|Group|Solutions|Technologies|Tech|Labs|IO|AI|Inc\.)))/,
      ];
      for (const pattern of companyPatterns) {
        const match = combined.match(pattern);
        if (match && match[1]) {
          lead.company = match[1].trim();
          break;
        }
      }
    }

    if (!lead.notes) {
      const allValues = Object.values(raw);
      const longTexts = allValues.filter(v => v.length > 30 && !v.includes('@'));
      if (longTexts.length > 0) {
        lead.notes = longTexts.join('; ');
      }
    }

    return lead;
  }).filter((lead: ParsedLead) => lead.name || lead.email);
}

function parseSpaceDelimited(text: string): ParsedLead[] {
  const lines = text.split(/\r?\n/).filter((l: string) => l.trim());
  if (lines.length < 2) return [];

  const defaultLead: ParsedLead = {
    name: '', jobTitle: '', email: '', phone: '', company: '',
    industry: '', location: '', numberOfEmployees: '', source: '',
    currentCRM: '', operationalSystem: '', status: 'New', priority: 'Medium',
    notes: '', owner: 'Sarah Johnson',
  };

  return lines.slice(1).map((line: string) => {
    const lead = { ...defaultLead };
    const parts = line.trim().split(/\s{2,}/);
    if (parts.length >= 6) {
      const nameOrEmail = parts[0];
      if (nameOrEmail.includes('@')) {
        lead.email = nameOrEmail;
        lead.name = extractNameFromEmail(nameOrEmail);
      } else {
        lead.name = nameOrEmail;
      }
      const email = parts.find((p: string) => p.includes('@'));
      if (email) lead.email = email;
      const phone = parts.find((p: string) => p.match(/^[\+]?[\d\s\-\(\)]{7,20}$/));
      if (phone) lead.phone = phone;
      const nonEmailParts = parts.filter((p: string) => !p.includes('@') && !p.match(/^[\+]?[\d\s\-\(\)]{7,20}$/) && p !== lead.name);
      if (nonEmailParts.length > 0) lead.company = nonEmailParts[0] || '';
      if (nonEmailParts.length > 1) lead.industry = nonEmailParts[1] || '';
      if (nonEmailParts.length > 2) lead.location = nonEmailParts[2] || '';
    }
    return lead;
  }).filter((lead: ParsedLead) => lead.name || lead.email);
}
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
    score: b.score ?? null,
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

function PendingScoreCell({ center, withLabel }: { center?: boolean; withLabel?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-accent-color/5 text-accent-color ${center ? 'mx-auto justify-center' : ''}`}>
      <Loader2 className="animate-spin h-3 w-3" />
      {withLabel ? 'Scoring' : ''}
    </span>
  );
}

interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  score: number | null;
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
  /** Deep-link support: /dashboard/leads/[id] pre-selects this lead. */
  openLeadId?: string | number;
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

export default function LeadsView({ onLoaded, onTabChange, onComposeEmail, openLeadId }: LeadsViewProps = {}) {
  const router = useRouter();

  // Record selection & view state — declared early because the event-listener
  // effects below reference these setters.
  const [selectedLeadId, setSelectedLeadId] = useState<number | string | null>(null);
  const [viewMode, setViewMode] = useState<'default' | 'list'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('pulse-crm-view-mode-leads') as any) || 'list';
    }
    return 'list';
  });
  const [isCreatingFullPage, setIsCreatingFullPage] = useState(false);
  const [importLeadModalOpen, setImportLeadModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

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

  // Deep-link support: /dashboard/leads/[id] pre-selects the record directly.
  useEffect(() => {
    if (openLeadId == null) return;
    let rawId = String(openLeadId);
    if (rawId.startsWith('lead_')) rawId = rawId.replace('lead_', '');
    const finalId = /^\d+$/.test(rawId) ? Number(rawId) : rawId;
    setSelectedLeadId(finalId);
    setViewMode('default');
  }, [openLeadId]);

  // Listen for command palette "Create Lead" event
  useEffect(() => {
    const handleOpenCreate = () => {
      setIsCreatingFullPage(true);
    };
    window.addEventListener('pulse-open-create-lead-modal', handleOpenCreate);
    return () => window.removeEventListener('pulse-open-create-lead-modal', handleOpenCreate);
  }, []);
  // Prepopulated state variables
  const [recommendationsExpanded, setRecommendationsExpanded] = useState<Record<string, boolean>>({});
  const [recommendationLoading, setRecommendationLoading] = useState<Record<string, boolean>>({});
  const [recommendationError, setRecommendationError] = useState<Record<string, string>>({});
  const [recommendationLoadingIds, setRecommendationLoadingIds] = useState<Set<string>>(new Set());

  const handleReadRecommendations = async (leadId: string) => {
    setRecommendationLoading(prev => ({ ...prev, [leadId]: true }));
    setRecommendationError(prev => ({ ...prev, [leadId]: '' }));
    setRecommendationsExpanded(prev => ({ ...prev, [leadId]: true }));
    try {
      const res = await fetchLeadRecommendation(leadId);
      const recText = res.recommendations?.[0] || 'No recommendation available.';
      setLeadRecommendations(prev => ({ ...prev, [leadId]: recText }));
    } catch (err) {
      setRecommendationError(prev => ({ ...prev, [leadId]: 'Failed to retrieve recommendations. Please check network connection and try again.' }));
    } finally {
      setRecommendationLoading(prev => ({ ...prev, [leadId]: false }));
    }
  };

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  // Track leads whose AI assessment is in progress (score pending)
  const [scoringLeadIds, setScoringLeadIds] = useState<Set<string>>(new Set());

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
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [activeHistoryTab, setActiveHistoryTab] = useState<string>('timeline');
  const [isPriorityView, setIsPriorityView] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  // Modal Open/Close States
  const [isEditingFullPage, setIsEditingFullPage] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreatingLead, setIsCreatingLead] = useState(false);
  const [isEditingLead, setIsEditingLead] = useState(false);
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
  const [isConverting, setIsConverting] = useState(false);
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
    setRecommendationLoadingIds(prev => {
      const next = new Set(prev);
      leadIds.forEach(id => next.add(id));
      return next;
    });
    fetchBatchRecommendations(leadIds).then(res => {
      const recs: Record<string, string> = {};
      for (const [id, item] of Object.entries(res.recommendations || {})) {
        recs[id] = item.recommended_action || 'No recommendation available.';
      }
      setLeadRecommendations(prev => ({ ...prev, ...recs }));
    }).catch(() => {}).finally(() => {
      setRecommendationLoadingIds(prev => {
        const next = new Set(prev);
        leadIds.forEach(id => next.delete(id));
        return next;
      });
    });
  };

  useEffect(() => {
    getLeads().then(data => {
      const mapped = (data ?? []).map(backendToLocal);
      setLeads(mapped);
      const ids = mapped.map(l => l.id).filter(Boolean) as string[];
      refreshRecommendations(ids);
    }).finally(() => {
      setLoading(false);
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

    // Periodically refresh leads + recommendations (assessments run in background)
    let lastLeadHash = '';
    let prevLeadsMap: Record<string, { score: number | null; status: string }> = {};
    const intervalId = window.setInterval(() => {
      getLeads().then(data => {
        const mapped = (data ?? []).map(backendToLocal);
        setLeads(mapped);
        const ids = mapped.map(l => l.id).filter(Boolean) as string[];

        // Only refresh recommendations for leads that actually changed
        const changedIds: string[] = [];
        for (const l of mapped) {
          const prev = prevLeadsMap[l.id];
          if (!prev || prev.score !== l.score || prev.status !== l.status) {
            changedIds.push(l.id);
          }
        }
        prevLeadsMap = Object.fromEntries(mapped.map(l => [l.id, { score: l.score, status: l.status }]));

        if (changedIds.length > 0) {
          refreshRecommendations(changedIds);
        }
        // Clear scoring indicators for leads that now have scores
        setScoringLeadIds(prev => {
          if (prev.size === 0) return prev;
          const next = new Set(prev);
          let changed = false;
          for (const id of prev) {
            const lead = mapped.find(l => String(l.id) === id);
            if (lead && lead.score != null && lead.score > 0) { next.delete(id); changed = true; }
          }
          return changed ? next : prev;
        });
      }).catch(() => {});
    }, 30000);
    return () => window.clearInterval(intervalId);
  }, []);

  // Listen for real-time lead score updates via SSE
  useEffect(() => {
    const handleScoreUpdate = (e: Event) => {
      const { lead_id } = (e as CustomEvent).detail || {};
      if (!lead_id) return;
      getLeads().then(data => {
        const mapped = (data ?? []).map(backendToLocal);
        setLeads(mapped);
        setScoringLeadIds(prev => {
          if (!prev.has(lead_id)) return prev;
          const next = new Set(prev);
          next.delete(lead_id);
          return next;
        });
        refreshRecommendations([lead_id]);
      }).catch(() => {});
    };
    window.addEventListener('pulse-lead-score-updated', handleScoreUpdate);
    return () => window.removeEventListener('pulse-lead-score-updated', handleScoreUpdate);
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

  // Score-based priority view helpers — prefer real backend scores, fall back to heuristic
  const isScorePending = (lead: Lead) => lead.score == null || scoringLeadIds.has(String(lead.id));
  const isRecommendationPending = (lead: Lead) => !leadRecommendations[lead.id] || recommendationLoadingIds.has(String(lead.id));
  const getEngagementScore = (lead: Lead): number | null => {
    if (lead.score == null) return null;
    if (lead.engagement_score != null) return lead.engagement_score;
    let score = 0;
    if (lead.emails && lead.emails.length > 0) {
      score += lead.emails.length * 5;
      lead.emails.forEach(e => {
        if (e.subject?.toLowerCase().includes('re:')) score += 15;
      });
    }
    if (lead.calls && lead.calls.length > 0) score += lead.calls.length * 10;
    if (lead.meetings && lead.meetings.length > 0) score += lead.meetings.length * 15;
    if (lead.timeline && lead.timeline.length > 0) score += lead.timeline.length * 3;
    return Math.min(score, 100);
  };

  const getFitScore = (lead: Lead): number | null => {
    if (lead.score == null) return null;
    const fit = lead.fit_score ?? lead.score;
    return Number(fit) || 0;
  };

  const getOverallScore = (lead: Lead): number | null => {
    if (lead.score != null) return lead.score;
    if (lead.fit_score != null || lead.engagement_score != null) {
      return Math.round((getFitScore(lead) ?? 0) * 0.6 + (getEngagementScore(lead) ?? 0) * 0.4);
    }
    return null;
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
    setIsCreatingLead(true);
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
      // Re-fetch leads so the server-computed score is available
      try {
        const refreshed = await getLeads();
        const mapped = (refreshed ?? []).map(backendToLocal);
        setLeads(mapped);
        refreshRecommendations([created.id]);
      } catch {
        const newLead: Lead = {
          ...backendToLocal(created),
          timeline: [
            { id: Date.now(), type: "creation" as const, title: "Lead Created Manually", desc: `Lead added to database by system user.`, time: "Just now" }
          ],
        };
        setLeads([newLead, ...leads]);
      }
      setSelectedLeadId(created?.id ?? null);
      // Poll for score update — background AI assessment takes 5-15s
      const newId = String(created?.id ?? '');
      if (newId) {
        setScoringLeadIds(prev => new Set(prev).add(newId));
        let attempts = 0;
        const pollId = window.setInterval(async () => {
          attempts++;
          if (attempts > 10) {
            window.clearInterval(pollId);
            setScoringLeadIds(prev => { const n = new Set(prev); n.delete(newId); return n; });
            return;
          }
          try {
            const updated = await getLead(newId);
            if (updated && updated.score != null) {
              setLeads(prev => prev.map(l => l.id === newId ? backendToLocal(updated) : l));
              window.clearInterval(pollId);
              setScoringLeadIds(prev => { const n = new Set(prev); n.delete(newId); return n; });
              toast.success(`Lead scored: ${updated.score}% — ${updated.priority || 'N/A'} priority`);
            }
          } catch { /* retry next tick */ }
        }, 3000);
      }
    } catch (err) {
      console.error("Failed to create lead:", err);
    }
    setIsCreatingFullPage(false);
    setIsCreatingLead(false);
    setLeadForm({ name: '', jobTitle: '', email: '', phone: '', company: '', industry: '', location: '', numberOfEmployees: '', source: '', currentCRM: '', operationalSystem: '', status: 'New', priority: 'Medium', owner: 'Sarah Johnson', notes: '' });
  };

  // Action: Edit Lead Submit
  const handleEditLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditingLead(true);
    if (!activeLead) return;
    const preEditScore = activeLead.score;
    const newStatusBackend = STATUS_MAP[leadForm.status as string] || leadForm.status;
    const oldStatusBackend = STATUS_MAP[activeLead.status] || activeLead.status;
    const statusChanged = newStatusBackend !== oldStatusBackend;
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
      let updated = await updateLead(activeLead.id, payload);
      if (statusChanged) {
        updated = await updateLeadStatus(activeLead.id, newStatusBackend);
      }
      setLeads(leads.map(l => l.id === activeLead.id ? backendToLocal(updated) : l));
      fetchLeadRecommendation(String(activeLead.id)).then(res => {
        setLeadRecommendations(prev => ({ ...prev, [activeLead.id]: res.recommendations?.[0] || 'No recommendation available.' }));
      }).catch(() => {});
      // Track re-assessment after edit (AI may re-score in background)
      const editId = String(activeLead.id);
      setScoringLeadIds(prev => new Set(prev).add(editId));
      let editAttempts = 0;
      const editPollId = window.setInterval(async () => {
        editAttempts++;
        if (editAttempts > 20) {
          window.clearInterval(editPollId);
          setScoringLeadIds(prev => { const n = new Set(prev); n.delete(editId); return n; });
          return;
        }
        try {
          const refreshed = await getLeads();
          const mapped = (refreshed ?? []).map(backendToLocal);
          setLeads(mapped);
          const r = mapped.find(l => String(l.id) === editId);
          if (r && r.score !== preEditScore) {
            window.clearInterval(editPollId);
            setScoringLeadIds(prev => { const n = new Set(prev); n.delete(editId); return n; });
          }
        } catch { /* retry */ }
      }, 3000);
    } catch (err) {
      console.error("Failed to update lead:", err);
    }
    setIsEditingFullPage(false);
    setIsEditingLead(false);
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
    setIsConverting(true);
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
      toast.error(err instanceof Error ? err.message : "Failed to convert lead. Please try again.");
      setIsConvertModalOpen(false);
      setConvertingLeadId(null);
    } finally {
      setIsConverting(false);
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-border-default">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                setIsCreatingFullPage(false);
                setIsEditingFullPage(false);
                setEditingLeadId(null);
                setLeadForm({ name: '', jobTitle: '', email: '', phone: '', company: '', industry: '', location: '', numberOfEmployees: '', source: '', currentCRM: '', operationalSystem: '', status: 'New', priority: 'Medium', owner: 'Sarah Johnson', notes: '' });
              }}
              className="p-2 border border-border-default hover:bg-surface-2 rounded-xl text-text-muted hover:text-text-primary cursor-pointer transition hover:scale-105"
              title="Back to Leads"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-accent-color/10 text-accent-color text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">{isEdit ? 'Editing' : 'New Prospect'}</span>
              </div>
              <h2 className="font-sans text-2xl text-text-primary font-bold tracking-tight mt-1">{isEdit ? 'Edit Lead' : 'Create New Lead'}</h2>
              <p className="text-[11px] text-text-muted mt-0.5 font-semibold">{isEdit ? 'Update lead details across all dimensions.' : 'Enter all details across prospect, company, and technology dimensions.'}</p>
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
              className="px-4.5 py-2 border border-border-default rounded-xl text-xs font-semibold text-text-primary hover:bg-surface-2 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="full-page-lead-form"
              disabled={isCreatingLead || isEditingLead}
              className="px-5.5 py-2 bg-accent-color hover:bg-accent-color/90 text-surface-0 rounded-xl text-xs font-semibold shadow-lg shadow-accent-color/10 hover:shadow-accent-color/20 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center gap-2 cursor-pointer"
            >
              {(isCreatingLead || isEditingLead) && (
                <span className="size-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              )}
              {isCreatingLead ? 'Creating Lead...' : isEditingLead ? 'Saving Changes...' : isEdit ? 'Save Changes' : 'Create Lead'}
            </button>
          </div>
        </div>

        <form id="full-page-lead-form" onSubmit={isEdit ? handleEditLead : handleCreateLead} className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
          
          {/* Loading overlay while creating/editing */}
          {(isCreatingLead || isEditingLead) && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-surface-0/80 backdrop-blur-sm rounded-2xl">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="size-16 rounded-full border-4 border-accent-color/20 animate-pulse" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="size-8 text-accent-color animate-spin" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-text-primary">{isEdit ? 'Saving Changes...' : 'Creating Lead...'}</p>
                  <p className="text-xs text-text-muted mt-1">Please wait while we process your request</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Card 1: Contact Information */}
          <div className="bg-surface-1 border border-border-default rounded-2xl p-6 space-y-4 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-2 pb-3 border-b border-border-default">
              <div className="p-1.5 bg-accent-color/10 text-accent-color rounded-lg">
                <User className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-semibold text-text-primary text-xs uppercase tracking-wider">Contact Information</h4>
                <p className="text-[10px] text-text-muted font-medium">Basic contact details of the prospect</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-text-primary uppercase tracking-wider mb-1">
                    Full Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={leadForm.name}
                    onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                    className="w-full px-3.5 py-2 border border-border-default rounded-xl text-xs text-text-primary placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent-color/25 focus:border-accent-color bg-surface-0 transition"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-text-primary uppercase tracking-wider mb-1">Job Title</label>
                  <input
                    type="text"
                    placeholder="e.g. VP of Engineering"
                    value={leadForm.jobTitle}
                    onChange={(e) => setLeadForm({ ...leadForm, jobTitle: e.target.value })}
                    className="w-full px-3.5 py-2 border border-border-default rounded-xl text-xs text-text-primary placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent-color/25 focus:border-accent-color bg-surface-0 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-text-primary uppercase tracking-wider mb-1">
                    Email Address <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={leadForm.email}
                    onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                    className="w-full px-3.5 py-2 border border-border-default rounded-xl text-xs text-text-primary placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent-color/25 focus:border-accent-color bg-surface-0 transition"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-text-primary uppercase tracking-wider mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 000-0000"
                    value={leadForm.phone}
                    onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2 border border-border-default rounded-xl text-xs text-text-primary placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent-color/25 focus:border-accent-color bg-surface-0 transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Company Information */}
          <div className="bg-surface-1 border border-border-default rounded-2xl p-6 space-y-4 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-2 pb-3 border-b border-border-default">
              <div className="p-1.5 bg-accent-color/10 text-accent-color rounded-lg">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-semibold text-text-primary text-xs uppercase tracking-wider">Company Information</h4>
                <p className="text-[10px] text-text-muted font-medium">Details of the target organization</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-text-primary uppercase tracking-wider mb-1">
                    Company Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Corp"
                    value={leadForm.company}
                    onChange={(e) => setLeadForm({ ...leadForm, company: e.target.value })}
                    className="w-full px-3.5 py-2 border border-border-default rounded-xl text-xs text-text-primary placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent-color/25 focus:border-accent-color bg-surface-0 transition"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-text-primary uppercase tracking-wider mb-1">
                    Industry <span className="text-destructive">*</span>
                  </label>
                  <select
                    required
                    value={leadForm.industry}
                    onChange={(e) => setLeadForm({ ...leadForm, industry: e.target.value })}
                    className="w-full px-3 py-2 border border-border-default rounded-xl text-xs text-text-primary bg-surface-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent-color/25 focus:border-accent-color transition"
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
                  <label className="block text-[9px] font-bold text-text-primary uppercase tracking-wider mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. San Francisco, CA"
                    value={leadForm.location}
                    onChange={(e) => setLeadForm({ ...leadForm, location: e.target.value })}
                    className="w-full px-3.5 py-2 border border-border-default rounded-xl text-xs text-text-primary placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent-color/25 focus:border-accent-color bg-surface-0 transition"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-text-primary uppercase tracking-wider mb-1">Number of Employees</label>
                  <select
                    value={leadForm.numberOfEmployees}
                    onChange={(e) => setLeadForm({ ...leadForm, numberOfEmployees: e.target.value })}
                    className="w-full px-3 py-2 border border-border-default rounded-xl text-xs text-text-primary bg-surface-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent-color/25 focus:border-accent-color transition"
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
          <div className="bg-surface-1 border border-border-default rounded-2xl p-6 space-y-4 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-2 pb-3 border-b border-border-default">
              <div className="p-1.5 bg-accent-color/10 text-accent-color rounded-lg">
                <Globe className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-semibold text-text-primary text-xs uppercase tracking-wider">Lead Classification</h4>
                <p className="text-[10px] text-text-muted font-medium">Source, priority, and current assignments</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-text-primary uppercase tracking-wider mb-1">
                    Lead Source <span className="text-destructive">*</span>
                  </label>
                  <select
                    required
                    value={leadForm.source}
                    onChange={(e) => setLeadForm({ ...leadForm, source: e.target.value })}
                    className="w-full px-3 py-2 border border-border-default rounded-xl text-xs text-text-primary bg-surface-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent-color/25 focus:border-accent-color transition"
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
                  <label className="block text-[9px] font-bold text-text-primary uppercase tracking-wider mb-1">Priority</label>
                  <select
                    value={leadForm.priority}
                    onChange={(e) => setLeadForm({ ...leadForm, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border border-border-default rounded-xl text-xs text-text-primary bg-surface-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent-color/25 focus:border-accent-color transition"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-text-primary uppercase tracking-wider mb-1">Status</label>
                  <select
                    value={leadForm.status}
                    onChange={(e) => setLeadForm({ ...leadForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-border-default rounded-xl text-xs text-text-primary bg-surface-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent-color/25 focus:border-accent-color transition"
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
                <label className="block text-[9px] font-bold text-text-primary uppercase tracking-wider mb-1">Lead Owner</label>
                <input
                  type="text"
                  placeholder="e.g. Sarah Johnson"
                  value={leadForm.owner}
                  onChange={(e) => setLeadForm({ ...leadForm, owner: e.target.value })}
                  className="w-full px-3.5 py-2 border border-border-default rounded-xl text-xs text-text-primary placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent-color/25 focus:border-accent-color bg-surface-0 transition"
                />
              </div>
            </div>
          </div>

          {/* Card 4: Technical Stack & Context */}
          <div className="bg-surface-1 border border-border-default rounded-2xl p-6 space-y-4 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-2 pb-3 border-b border-border-default">
              <div className="p-1.5 bg-accent-color/10 text-accent-color rounded-lg">
                <Monitor className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-semibold text-text-primary text-xs uppercase tracking-wider">Technical Context & Notes</h4>
                <p className="text-[10px] text-text-muted font-medium">Tools used and additional qualitative notes</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-text-primary uppercase tracking-wider mb-1">Current CRM</label>
                  <select
                    value={leadForm.currentCRM}
                    onChange={(e) => setLeadForm({ ...leadForm, currentCRM: e.target.value })}
                    className="w-full px-3.5 py-2 border border-border-default rounded-xl text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-color/25 focus:border-accent-color bg-surface-0 transition"
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
                  <label className="block text-[9px] font-bold text-text-primary uppercase tracking-wider mb-1">Operational System</label>
                  <select
                    value={leadForm.operationalSystem}
                    onChange={(e) => setLeadForm({ ...leadForm, operationalSystem: e.target.value })}
                    className="w-full px-3.5 py-2 border border-border-default rounded-xl text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-color/25 focus:border-accent-color bg-surface-0 transition"
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
                <label className="block text-[9px] font-bold text-text-primary uppercase tracking-wider mb-1">Background Notes / Context</label>
                <textarea
                  placeholder="Enter initial conversations, requirements or key context..."
                  value={leadForm.notes}
                  onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })}
                  className="w-full h-19 px-3.5 py-2 border border-border-default rounded-xl text-xs text-text-primary placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent-color/25 focus:border-accent-color bg-surface-0 transition resize-none"
                />
              </div>
            </div>
          </div>

          {/* Form Actions Footer (Span full width) */}
          <div className="col-span-1 md:col-span-2 flex items-center justify-between p-4 bg-surface-2/50 border border-border-default rounded-xl mt-4">
            <p className="text-[10px] text-text-muted font-semibold flex items-center gap-1">
              <span className="text-destructive font-bold text-xs">*</span> Required fields must be completed.
            </p>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  setIsCreatingFullPage(false);
                  setLeadForm({ name: '', jobTitle: '', email: '', phone: '', company: '', industry: '', location: '', numberOfEmployees: '', source: '', currentCRM: '', operationalSystem: '', status: 'New', priority: 'Medium', owner: 'Sarah Johnson', notes: '' });
                }}
                className="px-4.5 py-2 border border-border-default rounded-xl text-xs font-semibold text-text-primary hover:bg-surface-2 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5.5 py-2 bg-accent-color hover:bg-accent-color/90 text-surface-0 rounded-xl text-xs font-semibold cursor-pointer shadow-lg shadow-accent-color/10 hover:shadow-accent-color/20 transition hover:-translate-y-0.5"
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
    <SkeletonLoader isLoading={loading} layout="table">
    <div className="grid grid-cols-12 gap-6 items-start">
      {/* Left Pane (Table, filters, search, headers) */}
      <div className={`col-span-12 ${activeLead && viewMode !== 'list' ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-5`}>
        <div className="bg-surface-1 border border-border-default rounded-2xl p-5">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="font-sans text-2xl text-text-primary font-bold">Sales Leads</h2>
                {/* Priority View Toggle */}
                <button
                  type="button"
                  onClick={() => setIsPriorityView(!isPriorityView)}
                  className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition duration-200 cursor-pointer ${
                    isPriorityView
                      ? 'bg-accent-color text-surface-0 ring-2 ring-accent-color/25'
                      : 'bg-surface-2 hover:bg-surface-2 text-text-primary hover:text-text-primary'
                  }`}
                >
                  <Sparkles className="h-3 w-3" />
                  <span>{isPriorityView ? 'Priority View On' : 'Priority View Off'}</span>
                </button>
              </div>
              <p className="text-[11px] text-text-muted mt-0.5 font-semibold">Manage prospects, monitor qualification scores, and trigger follow-ups.</p>
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

              {selectedIds.size > 0 && viewMode === 'list' && (
                <button 
                  onClick={handleDeleteSelectedLeads}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-status-danger-text hover:bg-status-danger-text/90 text-text-on-primary rounded-lg text-xs font-semibold transition-colors cursor-pointer mr-2"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                  <span>Delete Selected ({selectedIds.size})</span>
                </button>
              )}

              <button
                onClick={() => setImportLeadModalOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-accent-color hover:bg-accent-color/90 text-text-on-primary rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-sm"
              >
                <Download className="h-3.5 w-3.5" strokeWidth={2.25} />
                <span>Import Leads</span>
              </button>

              <button
                onClick={() => {
                  setLeadForm({ name: '', jobTitle: '', email: '', phone: '', company: '', industry: '', location: '', numberOfEmployees: '', source: '', currentCRM: '', operationalSystem: '', status: 'New', priority: 'Medium', owner: 'Sarah Johnson', notes: '' });
                  setIsCreatingFullPage(true);
                }}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-accent-color hover:bg-accent-color/90 text-surface-0 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
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
              <span className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-text-muted">
                <Search className="h-3.5 w-3.5" />
              </span>
              <input 
                type="text" 
                placeholder="Search leads, companies..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary bg-surface-2 placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent-color/20"
              />
            </div>
            
            {/* Status Filter */}
            <div className="relative">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-1.5 border border-border-default bg-surface-0 text-text-primary rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-accent-color/20 cursor-pointer"
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
                className="w-full px-3 py-1.5 border border-border-default bg-surface-0 text-text-primary rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-accent-color/20 cursor-pointer"
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
            <div className="overflow-y-auto max-h-[580px] border border-border-default/60 rounded-xl bg-surface-1 custom-scrollbar">
              <table className="w-full border-collapse text-left table-fixed">
                <thead className="sticky top-0 bg-surface-1 z-10 border-b border-border-default shadow-[0_1px_0_0_rgba(0,0,0,0.02)] select-none">
                  <tr className="text-[11px] uppercase font-black tracking-wider text-text-primary border-b border-border-default bg-surface-2/40">
                    {!isPriorityView && (
                    <th className="py-3 px-4 w-[5%] text-left">
                      <input 
                        type="checkbox" 
                        checked={sortedLeads.length > 0 && selectedIds.size === sortedLeads.length}
                        onChange={() => handleToggleSelectAll(sortedLeads)}
                        className="rounded border-border-default text-accent-color focus:ring-accent-color cursor-pointer size-3.5"
                      />
                    </th>
                    )}
                    {isPriorityView ? (
                      <>
                        <th className="py-3 px-2 w-[18%] cursor-pointer hover:text-text-primary transition-colors" onClick={() => handleHeaderClick('company')}>Company Name</th>
                        <th className="py-3 px-2 w-[10%] text-center">Fit Score</th>
                        <th className="py-3 px-2 w-[12%] text-center">Engagement Score</th>
                        <th className="py-3 px-2 w-[10%] text-center">Overall Score</th>
                        <th className="py-3 px-2 w-[28%]">Recommendation</th>
                        <th className="py-3 px-2 w-[10%] text-right pr-4">Actions</th>
                      </>
                    ) : (
                      <>
                        <th className="py-3 px-2 w-[16%] cursor-pointer hover:text-text-primary transition-colors" onClick={() => handleHeaderClick('name')}>Name</th>
                        <th className="py-3 px-2 w-[7%] cursor-pointer hover:text-text-primary transition-colors text-center" onClick={() => handleHeaderClick('score')}>Score</th>
                        <th className="py-3 px-2 w-[16%] cursor-pointer hover:text-text-primary transition-colors" onClick={() => handleHeaderClick('company')}>Company</th>
                        <th className="py-3 px-2 w-[18%] cursor-pointer hover:text-text-primary transition-colors" onClick={() => handleHeaderClick('email')}>Email</th>
                        <th className="py-3 px-2 w-[11%] cursor-pointer hover:text-text-primary transition-colors" onClick={() => handleHeaderClick('phone')}>Phone</th>
                        <th className="py-3 px-2 w-[10%] cursor-pointer hover:text-text-primary transition-colors" onClick={() => handleHeaderClick('status')}>Status</th>
                        <th className="py-3 px-2 w-[10%] cursor-pointer hover:text-text-primary transition-colors" onClick={() => handleHeaderClick('priority')}>Priority</th>
                        <th className="py-3 px-2 w-[14%] text-right pr-4">Actions</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 text-xs text-text-primary font-medium">
                  {sortedLeads.length > 0 ? (
                    sortedLeads.map((lead) => {
                      const isRowSelected = selectedIds.has(lead.id);
                      return (
                        <tr 
                          key={lead.id} 
                          onClick={() => setSelectedLeadId(lead.id)}
                          className={`hover:bg-surface-2/20 transition border-b border-border-default/40 ${isRowSelected ? 'bg-accent-color/[0.02]' : ''}`}
                        >
                          {isPriorityView ? (
                            <>
                              <td className="py-3.5 px-2 font-bold truncate" title={lead.company}>{lead.company}</td>
                              <td className="py-3.5 px-2 text-center">
                                {isScorePending(lead) ? <PendingScoreCell center /> : (
                                <span className={`text-xs font-extrabold tabular-nums ${
                                  (getFitScore(lead) ?? 0) >= 80 ? 'text-status-success-text' :
                                  (getFitScore(lead) ?? 0) >= 60 ? 'text-status-warning-text' : 'text-destructive'
                                }`}>{getFitScore(lead)}</span>
                                )}
                              </td>
                              <td className="py-3.5 px-2 text-center">
                                {isScorePending(lead) ? <PendingScoreCell center /> : (
                                <span className={`text-xs font-extrabold tabular-nums ${
                                  (getEngagementScore(lead) ?? 0) >= 30 ? 'text-status-success-text' :
                                  (getEngagementScore(lead) ?? 0) >= 15 ? 'text-status-warning-text' : 'text-destructive'
                                }`}>{getEngagementScore(lead)}</span>
                                )}
                              </td>
                              <td className="py-3.5 px-2 text-center">
                                {isScorePending(lead) ? <PendingScoreCell center /> : (
                                <span className={`text-xs font-extrabold tabular-nums px-1.5 py-0.5 rounded ${
                                  (getOverallScore(lead) ?? 0) >= 70 ? 'bg-status-success-text/10 text-status-success-text' :
                                  (getOverallScore(lead) ?? 0) >= 40 ? 'bg-status-warning-text/10 text-status-warning-text' : 'bg-destructive/10 text-destructive'
                                }`}>{getOverallScore(lead)}</span>
                                )}
                              </td>
                              <td className="py-3.5 px-2 text-[10px] text-text-muted max-w-[200px] truncate">
                                {isRecommendationPending(lead) ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-accent-color">
                                    <Loader2 className="animate-spin h-3 w-3" />
                                    Loading…
                                  </span>
                                ) : getAIRecommendation(lead)}
                              </td>
                              <td className="py-3.5 px-2 text-right pr-4">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(lead.id); }}
                                  className="text-text-muted/50 hover:text-destructive transition-colors p-1"
                                  title="Delete"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="py-3.5 px-4 text-left" onClick={(e) => e.stopPropagation()}>
                                <input 
                                  type="checkbox" 
                                  checked={isRowSelected}
                                  onChange={() => handleToggleSelectRow(lead.id)}
                                  className="rounded border-border-default text-accent-color focus:ring-accent-color cursor-pointer size-3.5"
                                />
                              </td>
                              <td className="py-3.5 px-2 font-bold truncate" title={lead.name}>{lead.name}</td>
                              <td className="py-3.5 px-2 text-center font-bold tabular-nums">
                                {isScorePending(lead) ? (
                                  <PendingScoreCell withLabel />
                                ) : (
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border tabular-nums inline-block ${
                                    (lead.score ?? 0) >= 80 ? 'text-status-success-text bg-status-success-text/10 border-status-success-text/10' :
                                    (lead.score ?? 0) >= 60 ? 'text-status-warning-text bg-status-warning-text/10 border-status-warning-text/10' :
                                    'text-destructive bg-destructive/10 border-destructive/10'
                                  }`}>
                                    {lead.score != null ? `${lead.score}%` : '—'}
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-2 text-text-muted truncate" title={lead.company}>{lead.company}</td>
                              <td className="py-3.5 px-2 text-text-muted truncate" title={lead.email}>{lead.email}</td>
                              <td className="py-3.5 px-2 text-text-muted truncate" title={lead.phone}>{lead.phone}</td>
                              <td className="py-3.5 px-2">
                                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                                  lead.status === 'New' ? 'text-accent-color bg-accent-color/10' :
                                  lead.status === 'Contacted' ? 'text-status-warning-text bg-status-warning-text/10' :
                                  lead.status === 'Qualified' ? 'text-status-info-text bg-status-info-text/10' :
                                  lead.status === 'Converted' ? 'text-status-success-text bg-status-success-text/10 border border-status-success-text/15' :
                                  'text-text-muted bg-surface-2'
                                }`}>
                                  {lead.status}
                                </span>
                              </td>
                              <td className="py-3.5 px-2">
                                <span className={`text-[9px] font-bold ${
                                  lead.priority === 'High' ? 'text-destructive' :
                                  lead.priority === 'Medium' ? 'text-status-warning-text' : 'text-text-muted'
                                }`}>
                                  ● {lead.priority}
                                </span>
                              </td>
                              <td className="py-3.5 px-2 text-right pr-4">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setSelectedLeadId(lead.id); }}
                                    className="text-text-muted/50 hover:text-accent-color transition-colors p-1"
title="View"
                                >
                                  {viewMode !== 'list' && (
                                    <Eye className="h-3.5 w-3.5" />
                                  )}
                                </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(lead.id); }}
                                    className="text-text-muted/50 hover:text-destructive transition-colors p-1"
                                    title="Delete"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-text-muted">
                        No leads matching search or filter selections.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  {isPriorityView ? (
                    <tr className="border-b border-border-default text-[9px] uppercase font-extrabold tracking-wider text-text-primary pb-2">
                      <th className="pb-2">Company Name</th>
                      <th className="pb-2 text-center">Fit Score</th>
                      <th className="pb-2 text-center">Engagement Score</th>
                      <th className="pb-2 text-center">Overall Score</th>
                      <th className="pb-2">Recommendation</th>
                      <th className="pb-2 text-right">Actions</th>
                    </tr>
                  ) : (
                    <tr className="border-b border-border-default text-[9px] uppercase font-extrabold tracking-wider text-text-primary pb-2">
                      <th className="pb-2">Name</th>
                      <th className="pb-2 text-center">Score</th>
                      <th className="pb-2">Company</th>
                      <th className="pb-2">Email</th>
                      <th className="pb-2">Phone</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2">Priority</th>
                      <th className="pb-2 text-right">Actions</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-border/40 text-xs text-text-primary font-semibold">
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
                          className={`hover:bg-surface-2/20 cursor-pointer transition-all duration-200 ${
                            isSelected ? 'bg-accent-color/[0.04]' : ''
                          } ${isTopPriority ? 'border-l-4 border-l-accent-color bg-accent-color/[0.03]' : ''}`}
                        >
                          {isPriorityView ? (
                            <>
                              <td className="py-3">
                                <div className="font-extrabold text-text-primary flex items-center space-x-1.5">
                                  <Building2 className="h-3.5 w-3.5 text-text-muted shrink-0" />
                                  <span>{lead.company}</span>
                                </div>
                                <div className="text-[10px] text-text-muted mt-0.5 ml-5">
                                  Contact: {lead.name}
                                </div>
                              </td>
                              <td className="py-3 text-center">
                                {isScorePending(lead) ? (
                                  <PendingScoreCell center />
                                ) : (
                                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-accent-color/10 text-accent-color">
                                    {getFitScore(lead)}%
                                  </span>
                                )}
                              </td>
                              <td className="py-3 text-center">
                                {isScorePending(lead) ? (
                                  <PendingScoreCell center />
                                ) : (
                                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-surface-2 text-text-primary">
                                    {getEngagementScore(lead)}%
                                  </span>
                                )}
                              </td>
                              <td className="py-3 text-center">
                                {isScorePending(lead) ? (
                                  <PendingScoreCell center withLabel />
                                ) : (
                                  <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded tabular-nums ${
                                    (lead.score ?? 0) >= 80 ? 'text-status-success-text bg-status-success-text/10' :
                                    (lead.score ?? 0) >= 60 ? 'text-status-warning-text bg-status-warning-text/10' : 'text-destructive bg-destructive/10'
                                  }`}>
                                    {lead.score}%
                                  </span>
                                )}
                              </td>
                              <td className="py-3">
                                <div className="text-[10px] text-text-muted font-bold max-w-[220px] truncate" title={isRecommendationPending(lead) ? '' : getAIRecommendation(lead)}>
                                  {isRecommendationPending(lead) ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-accent-color">
                                      <Loader2 className="animate-spin h-3 w-3" />
                                      Loading…
                                    </span>
                                  ) : getAIRecommendation(lead)}
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="py-3">
                                <div className="font-extrabold text-text-primary">{lead.name}</div>
                              </td>
                              <td className="py-3 text-center">
                                {isScorePending(lead) ? (
                                  <PendingScoreCell withLabel />
                                ) : (
                                  <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded tabular-nums ${
                                    (lead.score ?? 0) >= 80 ? 'text-status-success-text bg-status-success-text/10' :
                                    (lead.score ?? 0) >= 60 ? 'text-status-warning-text bg-status-warning-text/10' : 'text-destructive bg-destructive/10'
                                  }`}>
                                    {lead.score}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 text-[10px] text-text-muted">{lead.company}</td>
                              <td className="py-3 text-[10px] text-text-muted truncate max-w-[140px]">{lead.email}</td>
                              <td className="py-3 text-[10px] text-text-muted tabular-nums">{lead.phone}</td>
                              <td className="py-3">
                                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                                  lead.status === 'New' ? 'text-accent-color bg-accent-color/10' :
                                  lead.status === 'Contacted' ? 'text-status-warning-text bg-status-warning-text/10' :
                                  lead.status === 'Qualified' ? 'text-status-info-text bg-status-info-text/10' :
                                  lead.status === 'Converted' ? 'text-status-success-text bg-status-success-text/10 border border-status-success-text/15' :
                                  'text-text-muted bg-surface-2'
                                }`}>
                                  {lead.status}
                                </span>
                              </td>
                              <td className="py-3">
                                <span className={`text-[9px] font-bold ${
                                  lead.priority === 'High' ? 'text-destructive' :
                                  lead.priority === 'Medium' ? 'text-status-warning-text' : 'text-text-muted'
                                }`}>
                                  ● {lead.priority}
                                </span>
                              </td>
                            </>
                          )}
                          <td className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end space-x-1">
                              {lead.status !== 'Converted' && (
                                <button
                                  onClick={() => handleConvertLead(lead.id)}
                                  className="px-2 py-0.5 border border-status-success-text/25 text-status-success-text hover:bg-status-success-text hover:text-white rounded text-[10px] font-extrabold transition-colors cursor-pointer"
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
                                className="p-1 text-text-muted hover:text-text-primary hover:bg-surface-2 rounded transition-colors cursor-pointer"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(lead.id)}
                                className="p-1 text-text-muted hover:text-destructive hover:bg-destructive/10 rounded transition-colors cursor-pointer"
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
                      <td colSpan={6} className="py-8 text-center text-text-muted">
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
            : "bg-surface-1 border border-border-default rounded-2xl p-5 sticky top-20"
          }
          style={isMaximized ? { background: 'var(--surface-1)', color: 'var(--foreground)' } : undefined}
          >
            {isMaximized ? (
              /* ===== MAXIMIZED LIGHT-THEME LAYOUT ===== */
              <>
                {/* Top bar */}
                <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ background: 'var(--surface-2)', borderColor: 'var(--border-default)' }}>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-accent-muted flex items-center justify-center shrink-0">
                      <span className="text-accent-color font-bold text-sm">{activeLead.name?.[0] || '?'}</span>
                    </div>
                    <div>
                      <h2 className="font-bold text-text-primary text-base leading-tight">{activeLead.name}</h2>
                      <p className="text-xs text-text-muted font-medium">{activeLead.company}</p>
                    </div>
                    <span className={`ml-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      activeLead.status === 'Converted' ? 'bg-status-success-text/10 text-status-success-text border-status-success-text/20' :
                      activeLead.status === 'Lost' ? 'bg-status-danger-text/10 text-status-danger-text border-status-danger-text/20' :
                      activeLead.status === 'Qualified' ? 'bg-accent-color/10 text-accent-color border-accent-color/20' :
                      activeLead.status === 'Contacted' ? 'bg-status-warning-text/10 text-status-warning-text border-status-warning-text/20' :
                      'bg-status-info-text/10 text-status-info-text border-status-info-text/20'
                    }`}>{activeLead.status}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setIsMaximized(false)}
                      className="p-2 rounded-lg border cursor-pointer transition bg-surface-1 border-border-default hover:bg-surface-2 text-text-muted hover:text-text-primary" title="Minimize">
                      <Minimize2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => { setSelectedLeadId(null); setIsMaximized(false); }}
                      className="p-2 rounded-lg border cursor-pointer transition bg-surface-1 border-border-default hover:bg-status-danger-text/10 hover:text-status-danger-text text-text-muted" title="Close">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Body: Two-column layout */}
                <div className="flex-1 overflow-y-auto p-6" style={{ background: 'var(--surface-1)' }}>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* LEFT COLUMN */}
                    <div className="space-y-5 text-text-primary">

                      {/* Contact Info */}
                      <div className="rounded-xl border overflow-hidden border-border-default">
                        <div className="px-4 py-2.5 border-b bg-surface-2 border-border-default">
                          <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Contact Information</span>
                        </div>
                        <div className="p-4 space-y-3">
                          {[
                            { label: 'Email', value: activeLead.email, link: `mailto:${activeLead.email}` },
                            { label: 'Phone', value: activeLead.phone },
                            { label: 'Job Title', value: activeLead.jobTitle },
                            { label: 'Location', value: activeLead.location },
                            { label: 'Source', value: activeLead.source },
                          ].map(row => (
                            <div key={row.label} className="flex items-center justify-between border-b border-border-default pb-2 last:border-0 last:pb-0">
                              <span className="text-xs font-semibold text-text-muted">{row.label}</span>
                              {row.link ? (
                                <a href={row.link} className="text-xs font-bold truncate max-w-[240px] text-accent-color hover:underline">{row.value || '—'}</a>
                              ) : (
                                <span className="text-xs font-bold text-text-primary">{row.value || '—'}</span>
                              )}
                            </div>
                          ))}
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-xs font-semibold text-text-muted">Owner</span>
                            <div className="flex items-center gap-1.5">
                              <img src={activeLead.ownerAvatar || ''} alt={activeLead.owner} className="h-5 w-5 rounded-full border border-border-default" />
                              <span className="text-xs font-bold text-text-primary">{activeLead.owner}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Lead Scoring */}
                      <div className="rounded-xl border overflow-hidden border-border-default">
                        <div className="px-4 py-2.5 border-b bg-surface-2 border-border-default">
                          <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Lead Scoring</span>
                        </div>
                        <div className="p-4 space-y-3">
                          {isScorePending(activeLead) ? (
                            <div className="flex items-center justify-center gap-2 py-3 rounded-lg bg-accent-color/5 text-accent-color text-xs font-semibold">
                              <Loader2 className="animate-spin h-4 w-4" />
                              Scoring lead, please wait...
                            </div>
                          ) : (
                            [
                              { label: 'Overall Score', value: activeLead.score, color: (activeLead.score ?? 0) >= 80 ? 'var(--status-success-text)' : (activeLead.score ?? 0) >= 60 ? 'var(--status-warning-text)' : 'var(--status-danger-text)' },
                              { label: 'Fit Score', value: getFitScore(activeLead), color: 'var(--accent-color)' },
                              { label: 'Engagement Score', value: getEngagementScore(activeLead), color: 'var(--chart-1)' },
                            ].map(s => (
                              <div key={s.label}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-semibold text-text-muted">{s.label}</span>
                                  <span className="text-xs font-bold tabular-nums" style={{ color: s.color }}>{s.value ?? 0}%</span>
                                </div>
                                <div className="h-1.5 rounded-full overflow-hidden bg-surface-2">
                                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${s.value ?? 0}%`, background: s.color }} />
                                </div>
                              </div>
                            ))
                          )}
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-xs font-semibold text-text-muted">Priority Tier</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              activeLead.priorityTier === 'Critical' ? 'bg-status-success-text/10 text-status-success-text border-status-success-text/20' :
                              activeLead.priorityTier === 'High' ? 'bg-status-warning-text/10 text-status-warning-text border-status-warning-text/20' :
                              activeLead.priorityTier === 'Medium' ? 'bg-status-info-text/10 text-status-info-text border-status-info-text/20' :
                              'bg-surface-2 text-text-muted border-border-default'
                            }`}>{activeLead.priorityTier || activeLead.priority || '—'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Company & Technology Details */}
                      <div className="rounded-xl border overflow-hidden border-border-default">
                        <div className="px-4 py-2.5 border-b bg-surface-2 border-border-default">
                          <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Company & Technology Details</span>
                        </div>
                        <div className="p-4 space-y-3">
                          {[
                            { label: 'Industry', value: activeLead.industry },
                            { label: 'Employee Count', value: activeLead.numberOfEmployees || activeLead.employee_count },
                            { label: 'Estimated Deal Value', value: activeLead.value ? `$${Number(activeLead.value).toLocaleString()}` : '—' },
                            { label: 'Current CRM', value: activeLead.currentCRM },
                            { label: 'Operational System', value: activeLead.operationalSystem },
                          ].map(row => (
                            <div key={row.label} className="flex items-center justify-between border-b border-border-default pb-2 last:border-0 last:pb-0">
                              <span className="text-xs font-semibold text-text-muted">{row.label}</span>
                              <span className="text-xs font-bold text-text-primary">{row.value || '—'}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* AI Scoring Insights & Recommendations */}
                      <div className="rounded-xl border overflow-hidden border-border-default">
                        <div className="px-4 py-2.5 border-b bg-surface-2 border-border-default">
                          <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">AI Scoring Insights</span>
                        </div>
                        <div className="p-4 space-y-4">
                          {activeLead.topReasons && activeLead.topReasons.length > 0 && (
                            <div>
                              <span className="text-[9px] font-bold uppercase tracking-wider text-text-muted">Key AI Insights</span>
                              <div className="mt-1.5 flex flex-wrap gap-1.5">
                                {activeLead.topReasons.map((r, i) => (
                                  <span key={i} className="px-2 py-0.5 rounded bg-accent-color/10 text-accent-color text-[10px] font-semibold border border-accent-color/15">{r}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {activeLead.fitReasons && activeLead.fitReasons.length > 0 && (
                            <div>
                              <span className="text-[9px] font-bold uppercase tracking-wider text-text-muted">Fit Reasons</span>
                              <ul className="mt-1 list-disc list-inside text-xs text-text-primary space-y-1">
                                {activeLead.fitReasons.map((r, i) => <li key={i} className="font-medium">{r}</li>)}
                              </ul>
                            </div>
                          )}

                          {activeLead.engagementReasons && activeLead.engagementReasons.length > 0 && (
                            <div>
                              <span className="text-[9px] font-bold uppercase tracking-wider text-text-muted">Engagement Signals</span>
                              <ul className="mt-1 list-disc list-inside text-xs text-text-primary space-y-1">
                                {activeLead.engagementReasons.map((r, i) => <li key={i} className="font-medium">{r}</li>)}
                              </ul>
                            </div>
                          )}

                          {/* AI Recommendation Engine */}
                          <div className="pt-2">
                            {!recommendationsExpanded[activeLead.id] ? (
                              <button
                                onClick={() => handleReadRecommendations(activeLead.id)}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-dashed border-accent-color/40 hover:border-accent-color hover:bg-accent-color/5 text-xs font-bold text-accent-color transition duration-200 cursor-pointer shadow-sm select-none"
                              >
                                <Sparkles className="h-4 w-4 animate-pulse" />
                                <span>Click to read the next best actions</span>
                              </button>
                            ) : (
                              <div className="p-4 bg-accent-color/5 border border-accent-color/20 rounded-xl space-y-2.5 relative overflow-hidden transition-all duration-300">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-accent-color flex items-center gap-1">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    AI Recommended Next Actions
                                  </span>
                                  <button 
                                    onClick={() => setRecommendationsExpanded(prev => ({ ...prev, [activeLead.id]: false }))}
                                    className="text-[10px] font-bold text-text-muted hover:text-text-primary cursor-pointer hover:underline"
                                  >
                                    Collapse
                                  </button>
                                </div>

                                {recommendationLoading[activeLead.id] ? (
                                  <div className="flex items-center justify-center py-6 text-xs text-text-muted font-semibold select-none">
                                    <Loader2 className="h-4 w-4 animate-spin text-accent-color mr-2" />
                                    <span>Retrieving recommendations...</span>
                                  </div>
                                ) : recommendationError[activeLead.id] ? (
                                  <div className="space-y-3 py-2">
                                    <p className="text-xs text-status-danger-text font-semibold">{recommendationError[activeLead.id]}</p>
                                    <button
                                      onClick={() => handleReadRecommendations(activeLead.id)}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-status-danger-bg text-status-danger-text border border-status-danger-text/20 hover:bg-status-danger-bg/80 text-[10px] font-bold rounded-lg transition cursor-pointer"
                                    >
                                      <RefreshCw className="h-3 w-3 animate-spin" /> Retry Analysis
                                    </button>
                                  </div>
                                ) : (
                                  <div className="text-xs text-text-primary font-medium leading-relaxed space-y-2">
                                    {leadRecommendations[activeLead.id] ? (
                                      <div className="space-y-2 font-medium text-xs leading-relaxed text-text-primary">
                                        {leadRecommendations[activeLead.id].split('\n').map((line: string, idx: number) => {
                                          const clean = line.replace(/^[*\-\s]+/, '').trim();
                                          if (!clean) return null;
                                          
                                          const isHeader = clean.endsWith(':') || (clean.startsWith('**') && clean.endsWith('**'));
                                          const formatted = clean.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

                                          if (isHeader) {
                                            return <h5 key={idx} className="font-extrabold text-[11px] text-accent-color uppercase tracking-wider mt-3 first:mt-0" dangerouslySetInnerHTML={{ __html: formatted }} />;
                                          }

                                          return (
                                            <div key={idx} className="flex items-start gap-1.5 pl-1.5">
                                              <span className="text-accent-color mt-1 select-none shrink-0">•</span>
                                              <p dangerouslySetInnerHTML={{ __html: formatted }} />
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <p className="italic text-text-muted">No recommendations available.</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quick Action Buttons */}
                      <div className="grid grid-cols-3 gap-2">
                        <button onClick={() => { if (onComposeEmail && activeLead.email) { onComposeEmail({ to: activeLead.email, name: activeLead.name, company: activeLead.company, designation: activeLead.jobTitle, externalEntityType: 'lead', externalEntityId: String(activeLead.id) }); } else { router.push(`?compose=${encodeURIComponent(activeLead.email)}`); onTabChange?.('emails'); setTimeout(() => { window.dispatchEvent(new CustomEvent('pulse-compose-email', { detail: { to: activeLead.email } })); }, 150); } }}
                          className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold border border-border-default bg-surface-1 hover:bg-accent-color/10 hover:border-accent-color hover:text-accent-color text-text-primary cursor-pointer transition">
                          <Mail className="h-4 w-4" /><span>Email</span>
                        </button>
                        <button onClick={() => setIsCallModalOpen(true)}
                          className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold border border-border-default bg-surface-1 hover:bg-status-success-text/10 hover:border-status-success-text hover:text-status-success-text text-text-primary cursor-pointer transition">
                          <PhoneCall className="h-4 w-4" /><span>Call</span>
                        </button>
                        <button onClick={() => { onTabChange?.('calendar'); setTimeout(() => { window.dispatchEvent(new CustomEvent('pulse-open-create-calendar-event-modal', { detail: { title: `Meet with ${activeLead.name}`, attendees: activeLead.email || activeLead.name, date: new Date().toISOString().slice(0, 10), time: '11:00 AM', type: 'meeting' } })); }, 150); }}
                          className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold border border-border-default bg-surface-1 hover:bg-status-info-text/10 hover:border-status-info-text hover:text-status-info-text text-text-primary cursor-pointer transition">
                          <Calendar className="h-4 w-4" /><span>Meet</span>
                        </button>
                      </div>

                      {/* Notes */}
                      <div className="rounded-xl border border-border-default overflow-hidden">
                        <div className="px-4 py-2.5 border-b bg-surface-2 border-border-default">
                          <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Internal Notes</span>
                        </div>
                        <div className="p-4">
                          <textarea
                            className="w-full p-3 rounded-lg text-xs leading-relaxed resize-y min-h-[90px] focus:outline-none focus:ring-2 focus:ring-accent-color/20 focus:border-accent-color text-text-primary bg-surface-2 border border-border-default"
                            value={activeLead.notes}
                            onChange={(e) => handleSaveNotes(e.target.value)}
                            placeholder="Record lead feedback, key challenges, sizing metrics..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* RIGHT COLUMN — Activity History */}
                    <div className="rounded-xl border flex flex-col border-border-default" style={{ maxHeight: '78vh' }}>
                      <div className="px-4 py-2.5 border-b shrink-0 bg-surface-2 border-border-default">
                        <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Activity History</span>
                      </div>
                      <div className="flex gap-1 px-4 pt-3 pb-2 flex-wrap shrink-0 border-b border-border-default">
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
                              style={active ? { background: 'var(--accent-color)', color: 'var(--text-on-primary)', border: '1px solid var(--accent-color)' } : { background: 'var(--surface-1)', color: 'var(--text-muted)', border: '1px solid var(--border-default)' }}>
                              <Icon className="h-3 w-3 shrink-0" />
                              <span>{tab.label}</span>
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-surface-1">
                        {activeHistoryTab === 'timeline' && (
                          activeLead.timeline.length > 0 ? activeLead.timeline.map(act => (
                            <div key={act.id} className="flex gap-3 p-3 rounded-lg border bg-surface-2 border-border-default hover:bg-accent-color/10 hover:border-accent-color/15 transition">
                              <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 bg-accent-color/10 border border-accent-color/15">
                                <Clock className="h-3.5 w-3.5 text-accent-color" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-xs font-bold leading-snug text-text-primary">{act.title}</p>
                                  <span className="text-[9px] font-mono shrink-0 text-text-muted">{act.time}</span>
                                </div>
                                <p className="text-[10px] mt-0.5 text-text-muted">{act.desc}</p>
                              </div>
                            </div>
                          )) : <p className="text-center py-8 text-xs text-text-muted">No timeline activity yet.</p>
                        )}
                        {activeHistoryTab === 'emails' && (
                          activeLead.emails.length > 0 ? activeLead.emails.map(e => (
                            <div key={e.id} className="p-3 rounded-lg border bg-accent-color/5 border-accent-color/15 hover:bg-accent-color/10 transition">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-[9px] text-text-muted mb-0.5">To: {activeLead.email}</p>
                                  <p className="text-xs font-bold text-accent-color">{e.subject}</p>
                                </div>
                                <span className="text-[9px] font-mono shrink-0 text-text-muted">{e.time}</span>
                              </div>
                            </div>
                          )) : <p className="text-center py-8 text-xs text-text-muted">No emails logged.</p>
                        )}
                        {activeHistoryTab === 'calls' && (
                          activeLead.calls.length > 0 ? activeLead.calls.map(c => {
                            const connected = c.outcome?.toLowerCase().includes('connect');
                            return (
                              <div key={c.id} className="p-3 rounded-lg border" style={{ background: connected ? 'rgba(16,185,129,0.05)' : 'rgba(244,63,94,0.05)' }}>
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="px-2 py-0.5 rounded text-[9px] font-bold" style={connected ? { background: 'var(--status-success-text)', color: 'var(--text-on-primary)' } : { background: 'var(--status-danger-text)', color: 'var(--text-on-primary)' }}>{c.outcome}</span>
                                  <span className="text-[9px] font-mono text-text-muted">{c.time}</span>
                                </div>
                                <p className="text-[10px] text-text-muted">{c.notes}</p>
                              </div>
                            );
                          }) : <p className="text-center py-8 text-xs text-text-muted">No calls logged.</p>
                        )}
                        {activeHistoryTab === 'meetings' && (
                          activeLead.meetings.length > 0 ? activeLead.meetings.map(m => (
                            <div key={m.id} className="p-3 rounded-lg border border-status-info-text/15 bg-status-info-text/5 hover:bg-status-info-text/10 transition">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <p className="text-xs font-bold text-status-info-text">{m.title}</p>
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 bg-accent-muted text-accent-color">{m.date}</span>
                              </div>
                              <p className="text-[10px] flex items-center gap-1 mb-1 text-status-info-text"><Clock className="h-2.5 w-2.5" />{m.time}</p>
                              <p className="text-[10px] text-text-muted">{m.desc}</p>
                            </div>
                          )) : <p className="text-center py-8 text-xs text-text-muted">No meetings scheduled.</p>
                        )}
                        {activeHistoryTab === 'activity chart' && (
                          <div className="p-3 rounded-lg border bg-surface-2 border-border-default">
                            <h5 className="text-[9px] font-bold uppercase tracking-wider mb-3 flex items-center gap-1 text-text-muted">
                              <TrendingUp className="h-3.5 w-3.5 text-accent-color" />Lead Score Progression
                            </h5>
                            {isScorePending(activeLead) ? (
                              <div className="flex items-center justify-center gap-2 h-40 text-accent-color text-xs font-semibold">
                                <Loader2 className="animate-spin h-4 w-4" />
                                Waiting for score...
                              </div>
                            ) : (
                            <div className="w-full h-40 relative">
                              <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
                                <line x1="0" y1="90" x2="300" y2="90" stroke="var(--border-default)" strokeWidth="1" strokeDasharray="3,3" />
                                <line x1="0" y1="50" x2="300" y2="50" stroke="var(--border-default)" strokeWidth="1" strokeDasharray="3,3" />
                                <line x1="0" y1="10" x2="300" y2="10" stroke="var(--border-default)" strokeWidth="1" strokeDasharray="3,3" />
                                <path d={getProgressPoints(activeLead.score ?? 0).areaPath} fill="url(#purpleGradMax)" opacity="0.2" />
                                <path d={getProgressPoints(activeLead.score ?? 0).path} fill="none" stroke="var(--accent-color)" strokeWidth="2.5" strokeLinecap="round" />
                                {getProgressPoints(activeLead.score ?? 0).points.map((p, idx) => (
                                  <circle key={idx} cx={p.x} cy={p.y} r="4" fill="var(--accent-color)" stroke="var(--text-on-primary)" strokeWidth="1.5" />
                                ))}
                                <defs>
                                  <linearGradient id="purpleGradMax" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="var(--accent-color)" />
                                    <stop offset="100%" stopColor="var(--accent-color)" stopOpacity="0" />
                                  </linearGradient>
                                </defs>
                              </svg>
                              <div className="flex justify-between text-[8px] font-medium mt-1 text-text-muted">
                                <span>Start</span><span>Midpoint</span><span>Today ({activeLead.score})</span>
                              </div>
                            </div>
                            )}
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
                <div className="flex items-start justify-between border-b border-border-default pb-3">
                  <div>
                    <h3 className="font-semibold text-text-primary text-sm">{activeLead.name}</h3>
                    <p className="text-[10px] text-text-muted font-semibold">{activeLead.company}</p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button 
                      type="button"
                      onClick={() => setIsMaximized(true)}
                      className="p-1 bg-surface-2 hover:bg-surface-2 border border-border-default rounded text-text-muted hover:text-text-primary transition duration-200 cursor-pointer"
                      title="Maximize Summary"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </button>
                    {/* Close Button */}
                    <button 
                      onClick={() => setSelectedLeadId(null)}
                      className="p-1 bg-surface-2 hover:bg-surface-2 border border-border-default rounded text-text-muted hover:text-text-primary transition duration-200 cursor-pointer"
                      title="Close Summary"
                      aria-label="Close Summary"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Quick Details Fields list */}
                <div className="py-3.5 space-y-2.5 text-[11px] font-semibold border-b border-border-default">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Status</span>
                    <span className={`font-semibold px-1.5 py-0.25 rounded ${
                      activeLead.status === 'Converted' ? 'text-accent-color bg-accent-color/15' : 'text-text-primary'
                    }`}>{activeLead.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Priority</span>
                    <span className={`font-semibold ${
                      activeLead.priorityTier === 'Critical' ? 'text-status-success-text bg-status-success-text/15 px-1.5 py-0.25 rounded' :
                      activeLead.priorityTier === 'High' ? 'text-status-warning-text bg-status-warning-text/10 px-1.5 py-0.25 rounded' :
                      activeLead.priorityTier === 'Medium' ? 'text-status-info-text bg-status-info-text/10 px-1.5 py-0.25 rounded' :
                      activeLead.priorityTier === 'Low' ? 'text-text-muted bg-surface-2 px-1.5 py-0.25 rounded' : ''
                    }`}>{activeLead.priorityTier || activeLead.priority}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Email</span>
                    <a href={`mailto:${activeLead.email}`} className="text-accent-color hover:underline truncate max-w-[150px]">{activeLead.email}</a>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Phone</span>
                    <span className="text-text-primary tabular-nums">{activeLead.phone}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-muted">Owner</span>
                    <div className="flex items-center space-x-1">
                      <img src={activeLead.ownerAvatar || ''} alt={activeLead.owner} className="h-4.5 w-4.5 rounded-full border border-border-default" />
                      <span className="text-text-primary">{activeLead.owner}</span>
                    </div>
                  </div>
                </div>

                {/* Priority View - Advanced Scoring Details (toggled on/off) */}
                {isPriorityView && (
                  <div className="mt-4 border border-border-default rounded-xl p-3.5">
                    <h4 className="text-[10px] font-semibold text-text-primary uppercase tracking-wider flex items-center space-x-1 mb-3">
                      <Award className="h-4 w-4 text-accent-color" />
                      <span>Priority Scoring Details</span>
                    </h4>
                    <div className="space-y-2.5 text-[10px] font-semibold">
                      <div className="flex justify-between items-center">
                        <span className="text-text-muted">Fit Score</span>
                        {isScorePending(activeLead) ? <PendingScoreCell /> : <span className="font-semibold text-text-primary">{getFitScore(activeLead)}%</span>}
                      </div>
                      {activeLead.fitReasons.length > 0 && (
                        <div className="reason-subtext">
                          {activeLead.fitReasons.slice(0, 2).map((r, i) => (
                            <div key={i} className="mb-0.5 text-gray-600 dark:text-gray-300">• {r}</div>
                          ))}
                        </div>
                      )}
                      <div className="border-t border-border-default" />
                      <div className="flex justify-between items-center">
                        <span className="text-text-muted">Engagement Score</span>
                        {isScorePending(activeLead) ? <PendingScoreCell /> : <span className="font-semibold text-text-primary">{getEngagementScore(activeLead)}%</span>}
                      </div>
                      {activeLead.engagementReasons.length > 0 && (
                        <div className="reason-subtext">
                          {activeLead.engagementReasons.slice(0, 2).map((r, i) => (
                            <div key={i} className="mb-0.5 text-gray-600 dark:text-gray-300">• {r}</div>
                          ))}
                        </div>
                      )}
                      <div className="border-t border-border-default" />
                      <div className="flex justify-between items-center">
                        <span className="text-text-muted">Overall Score</span>
                        {isScorePending(activeLead) ? <PendingScoreCell /> : (
                        <span className={`font-semibold tabular-nums ${
                          (activeLead.score ?? 0) >= 80 ? 'text-status-success-text' : (activeLead.score ?? 0) >= 60 ? 'text-status-warning-text' : 'text-destructive'
                        }`}>{activeLead.score}%</span>
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-text-muted">Tier</span>
                        <span className={`font-semibold ${
                          activeLead.priorityTier === 'Critical' ? 'text-status-success-text' :
                          activeLead.priorityTier === 'High' ? 'text-status-warning-text' :
                          activeLead.priorityTier === 'Medium' ? 'text-status-info-text' :
                          activeLead.priorityTier === 'Low' ? 'text-text-muted' : 'text-text-muted'
                        }`}>{activeLead.priorityTier || activeLead.priority}</span>
                      </div>
                      {activeLead.topReasons.length > 0 && (
                        <div className="border-t border-border-default pt-2">
                          <span className="text-[9px] text-text-muted uppercase tracking-wider font-semibold">Top Reasons</span>
                          <div className="mt-1 text-[9px] text-text-muted leading-relaxed">
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
                  <h4 className="text-[10px] font-semibold text-text-primary uppercase tracking-wider mb-1.5">Internal Notes</h4>
                  <textarea
                    className="w-full p-2 border border-border-default rounded-lg text-[11px] font-semibold text-text-primary bg-surface-2 placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent-color/20 min-h-[70px] resize-y leading-relaxed"
                    value={activeLead.notes}
                    onChange={(e) => handleSaveNotes(e.target.value)}
                    placeholder="Record lead feedback, key challenges, sizing metrics..."
                  />
                </div>

                {/* Action Triggers panel */}
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <button 
                    onClick={() => {
                      if (onComposeEmail && activeLead.email) {
                        onComposeEmail({ to: activeLead.email, name: activeLead.name, company: activeLead.company, designation: activeLead.jobTitle, externalEntityType: 'lead', externalEntityId: String(activeLead.id) });
                      } else {
                        router.push(`?compose=${encodeURIComponent(activeLead.email)}`);
                        onTabChange?.('emails');
                        setTimeout(() => {
                          window.dispatchEvent(new CustomEvent('pulse-compose-email', { detail: { to: activeLead.email } }));
                        }, 150);
                      }
                    }}
                    className="inline-flex items-center justify-center space-x-1 py-1.5 border border-border-default hover:bg-surface-2 rounded-lg text-[10px] font-semibold text-text-muted cursor-pointer transition-colors"
                  >
                    <Mail className="h-3.5 w-3.5 text-text-muted" />
                    <span>Email</span>
                  </button>
                  <button 
                    onClick={() => setIsCallModalOpen(true)}
                    className="inline-flex items-center justify-center space-x-1 py-1.5 border border-border-default hover:bg-surface-2 rounded-lg text-[10px] font-semibold text-text-muted cursor-pointer transition-colors"
                  >
                    <PhoneCall className="h-3.5 w-3.5 text-text-muted" />
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
                    className="inline-flex items-center justify-center space-x-1 py-1.5 border border-border-default hover:bg-surface-2 rounded-lg text-[10px] font-semibold text-text-muted cursor-pointer transition-colors"
                  >
                    <Calendar className="h-3.5 w-3.5 text-text-muted" />
                    <span>Meet</span>
                  </button>
                </div>

                {/* History Tabs */}
                <div className="mt-5 border-t border-border-default pt-4">
                  <div className="flex flex-wrap bg-surface-2/60 dark:bg-surface-2/35 p-1 rounded-xl gap-1 text-[9px] font-semibold uppercase mb-4 border border-border-default/40">
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
                              ? 'bg-surface-1 text-accent-color border border-border-default/50 shadow-sm font-bold scale-[1.02]' 
                              : 'text-text-muted hover:text-text-primary hover:bg-surface-0/20'
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
                              <div key={act.id} className="text-[10px] leading-relaxed border-b border-border-default/40 pb-2 last:border-0">
                                <div className="font-bold text-text-primary flex justify-between">
                                  <span className="text-accent-color">{act.title}</span>
                                  <span className="text-text-muted font-semibold flex items-center gap-1 font-mono text-[9px]">
                                    <Clock className="h-2.5 w-2.5 text-text-muted/60" />
                                    {act.time}
                                  </span>
                                </div>
                                <p className="text-text-muted mt-1 font-medium">{act.desc}</p>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-center text-text-muted py-3 text-[10px]">No timeline logs recorded.</p>
                        )}
                      </div>
                    )}
       
                    {activeHistoryTab === 'emails' && (
                      <div className="space-y-2.5">
                        {activeLead.emails.length > 0 ? (
                          activeLead.emails.map((e) => (
                            <div key={e.id} className="p-3 border border-border-default rounded-xl bg-surface-1/60 backdrop-blur-sm hover:bg-surface-2/20 hover:border-accent-color/20 transition duration-200 shadow-sm relative overflow-hidden group/item">
                              <div className="absolute top-0 left-0 w-1 h-full bg-accent-color/50" />
                              <div className="flex justify-between items-center text-[10px] font-bold text-text-primary">
                                <div className="flex flex-col">
                                  <span className="text-[9px] text-text-muted">To: {activeLead.email}</span>
                                  <span className="text-accent-color font-extrabold group-hover/item:underline mt-0.5">{e.subject}</span>
                                </div>
                                <span className="text-text-muted font-semibold flex items-center gap-1 font-mono text-[9px] shrink-0 self-start">
                                  <Clock className="h-2.5 w-2.5 text-text-muted/60" />
                                  {e.time}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-center text-text-muted py-3 text-[10px]">No emails logged.</p>
                        )}
                      </div>
                    )}
       
                    {activeHistoryTab === 'calls' && (
                      <div className="space-y-2.5">
                        {activeLead.calls.length > 0 ? (
                          activeLead.calls.map((c) => {
                            const isConnected = c.outcome?.toLowerCase().includes('connect');
                            return (
                              <div key={c.id} className="p-3 border border-border-default rounded-xl bg-surface-1/60 backdrop-blur-sm hover:bg-surface-2/20 hover:border-status-success-text/20 transition duration-200 shadow-sm relative overflow-hidden group/item">
                                <div className={`absolute top-0 left-0 w-1 h-full ${isConnected ? 'bg-status-success-text' : 'bg-status-danger-text'}`} />
                                <div className="flex justify-between items-center text-[10px] font-bold text-text-primary mb-1.5">
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider ${
                                    isConnected ? 'bg-status-success-text/10 text-status-success-text border border-status-success-text/20' : 'bg-status-danger-text/10 text-status-danger-text border border-status-danger-text/20'
                                  }`}>
                                    {c.outcome}
                                  </span>
                                  <span className="text-text-muted font-semibold flex items-center gap-1 font-mono text-[9px]">
                                    <Clock className="h-2.5 w-2.5 text-text-muted/60" />
                                    {c.time}
                                  </span>
                                </div>
                                <p className="text-[10px] text-text-muted leading-relaxed font-semibold">{c.notes}</p>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-center text-text-muted py-3 text-[10px]">No call notes logged.</p>
                        )}
                      </div>
                    )}
       
                    {activeHistoryTab === 'meetings' && (
                      <div className="space-y-2.5">
                        {activeLead.meetings.length > 0 ? (
                          activeLead.meetings.map((m) => (
                            <div key={m.id} className="p-3 border border-border-default rounded-xl bg-surface-1/60 backdrop-blur-sm hover:bg-surface-2/20 hover:border-accent-color/20 transition duration-200 shadow-sm relative overflow-hidden group/item">
                              <div className="absolute top-0 left-0 w-1 h-full bg-accent-color" />
                              <div className="flex justify-between items-center text-[10px] font-bold text-text-primary mb-1">
                                <span className="text-accent-color font-extrabold">{m.title}</span>
                                <span className="px-1.5 py-0.5 bg-accent-color/10 text-accent-color border border-accent-color/15 rounded text-[8.5px] font-extrabold">{m.date}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[9px] text-text-muted font-semibold mb-1.5">
                                <Clock className="h-2.5 w-2.5 text-accent-color/70" />
                                <span>{m.time}</span>
                              </div>
                              <p className="text-[10px] text-text-muted leading-relaxed font-semibold">{m.desc}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-center text-text-muted py-3 text-[10px]">No meetings scheduled.</p>
                        )}
                      </div>
                    )}
       
                    {activeHistoryTab === 'activity chart' && (
                      <div className="space-y-3 p-1">
                        <div className="p-3 border border-border-default rounded-xl bg-surface-2">
                          <h5 className="text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-2 flex items-center space-x-1">
                            <TrendingUp className="h-3.5 w-3.5 text-accent-color" />
                            <span>Lead Progression & Score Trend</span>
                          </h5>
                          {isScorePending(activeLead) ? (
                            <div className="flex items-center justify-center gap-2 h-32 text-accent-color text-xs font-semibold">
                              <Loader2 className="animate-spin h-4 w-4" />
                              Waiting for score...
                            </div>
                          ) : (
                          <div className="w-full h-32 relative">
                            <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
                              <line x1="0" y1="90" x2="300" y2="90" stroke="var(--border-default)" strokeWidth="1" strokeDasharray="3,3" />
                              <line x1="0" y1="50" x2="300" y2="50" stroke="var(--border-strong)" strokeWidth="1" strokeDasharray="3,3" />
                              <line x1="0" y1="10" x2="300" y2="10" stroke="var(--border-strong)" strokeWidth="1" strokeDasharray="3,3" />
                              
                              <path
                                d={getProgressPoints(activeLead.score ?? 0).areaPath}
                                fill="url(#purpleGradLeads)"
                                opacity="0.15"
                              />
                              
                              <path
                                d={getProgressPoints(activeLead.score ?? 0).path}
                                fill="none"
                                stroke="var(--accent-color)"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                              />
                              
                              {getProgressPoints(activeLead.score ?? 0).points.map((p, idx) => (
                                <circle key={idx} cx={p.x} cy={p.y} r="4" fill="var(--accent-color)" stroke="var(--text-on-primary)" strokeWidth="1.5" />
                              ))}
      
                              <defs>
                                <linearGradient id="purpleGradLeads" x1="0%" y1="0%" x2="0%" y2="100%">
                                  <stop offset="0%" stopColor="var(--accent-color)" />
                                  <stop offset="100%" stopColor="var(--accent-color)" stopOpacity="0" />
                                </linearGradient>
                              </defs>
                            </svg>
                            
                            <div className="flex justify-between text-[8px] font-semibold text-text-muted mt-1">
                              <span>Created ({activeLead.timeline[activeLead.timeline.length - 1]?.time || '5d ago'})</span>
                              <span>Midpoint</span>
                              <span>Today (Score: {activeLead.score})</span>
                            </div>
                          </div>
                          )}
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
          <div className="bg-surface-1 border border-border-default rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-border-default flex justify-between items-center bg-surface-2">
              <h3 className="font-semibold text-text-primary text-sm">Edit Lead Details</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-text-muted hover:text-text-primary p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleEditLead} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Lead Name</label>
                  <input type="text" required placeholder="e.g. John Doe" value={leadForm.name} onChange={(e) => setLeadForm({...leadForm, name: e.target.value})} className="w-full px-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary placeholder-muted-foreground focus:outline-none bg-surface-0" />
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Company</label>
                  <input type="text" required placeholder="e.g. Acme Corp" value={leadForm.company} onChange={(e) => setLeadForm({...leadForm, company: e.target.value})} className="w-full px-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary placeholder-muted-foreground focus:outline-none bg-surface-0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Email</label>
                  <input type="email" placeholder="name@company.com" value={leadForm.email} onChange={(e) => setLeadForm({...leadForm, email: e.target.value})} className="w-full px-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary focus:outline-none bg-surface-0" />
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Phone</label>
                  <input type="text" placeholder="+1 (555) 000-0000" value={leadForm.phone} onChange={(e) => setLeadForm({...leadForm, phone: e.target.value})} className="w-full px-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary focus:outline-none bg-surface-0" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Status</label>
                  <select value={leadForm.status} onChange={(e) => setLeadForm({...leadForm, status: e.target.value as any})} className="w-full px-2 py-1.5 border border-border-default bg-surface-0 text-text-primary rounded-lg text-xs cursor-pointer">
                    <option>New</option>
                    <option>Contacted</option>
                    <option>Qualified</option>
                    <option>Converted</option>
                    <option>Lost</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Priority</label>
                  <select value={leadForm.priority} onChange={(e) => setLeadForm({...leadForm, priority: e.target.value as any})} className="w-full px-2 py-1.5 border border-border-default bg-surface-0 text-text-primary rounded-lg text-xs cursor-pointer">
                    <option>Critical</option>
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Owner</label>
                  <select value={leadForm.owner} onChange={(e) => setLeadForm({...leadForm, owner: e.target.value})} className="w-full px-2 py-1.5 border border-border-default bg-surface-0 text-text-primary rounded-lg text-xs cursor-pointer">
                    <option>Sarah Johnson</option>
                    <option>Alex Johnson</option>
                    <option>Lisa Martinez</option>
                  </select>
                </div>
              </div>
              <div className="pt-3 border-t border-border-default flex justify-end space-x-2.5">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-1.5 border border-border-default rounded-lg text-xs font-semibold text-text-primary hover:bg-surface-2 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-accent-color hover:bg-accent-color/90 text-surface-0 rounded-lg text-xs font-semibold cursor-pointer">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SEND EMAIL DIALOG MODAL */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-surface-1 border border-border-default rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-border-default flex justify-between items-center bg-surface-2">
              <h3 className="font-semibold text-text-primary text-sm">Send Email to {activeLead?.name}</h3>
              <button onClick={() => { setIsEmailModalOpen(false); setEmailError(null); }} className="text-text-muted hover:text-text-primary p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleSendEmail} className="p-5 space-y-4">
              {!gmailConnected && (
                <div className="p-3 bg-status-warning-text/10 border border-status-warning-text/20 rounded-lg text-xs text-text-primary">
                  <strong>Gmail not connected.</strong> Go to <strong>Integrations</strong> in the sidebar to connect your Gmail account, then try again.
                </div>
              )}
              {activeLead?.email && (
                <div className="p-2.5 bg-surface-2 border border-border-default rounded-lg">
                  <span className="text-[9px] font-semibold text-text-primary uppercase tracking-wider">To:</span>
                  <span className="ml-2 text-xs text-text-primary">{activeLead.email}</span>
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
                <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Subject</label>
                <input type="text" required placeholder="Subject line" value={emailForm.subject} onChange={(e) => setEmailForm({...emailForm, subject: e.target.value})} className="w-full px-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary placeholder-muted-foreground focus:outline-none bg-surface-0" />
              </div>
              <div>
                <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Email Body</label>
                <textarea required placeholder="Write your message here..." value={emailForm.body} onChange={(e) => setEmailForm({...emailForm, body: e.target.value})} className="w-full p-3 border border-border-default rounded-lg text-xs text-text-primary placeholder-muted-foreground focus:outline-none min-h-[120px] leading-relaxed bg-surface-0" />
              </div>
              <div className="pt-3 border-t border-border-default flex justify-end space-x-2.5">
                <button type="button" onClick={() => { setIsEmailModalOpen(false); setEmailError(null); }} className="px-4 py-1.5 border border-border-default rounded-lg text-xs font-semibold text-text-primary hover:bg-surface-2 cursor-pointer">Cancel</button>
                <button type="submit" disabled={emailSending || !gmailConnected || !activeLead?.email} className="inline-flex items-center space-x-1.5 px-4 py-1.5 bg-accent-color hover:bg-accent-color/90 text-surface-0 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
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
          <div className="bg-surface-1 border border-border-default rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-border-default flex justify-between items-center bg-surface-2">
              <h3 className="font-semibold text-text-primary text-sm">Log Call Outcome</h3>
              <button onClick={() => setIsCallModalOpen(false)} className="text-text-muted hover:text-text-primary p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleLogCall} className="p-5 space-y-4">
              <div>
                <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Call Outcome</label>
                <select value={callForm.outcome} onChange={(e) => setCallForm({...callForm, outcome: e.target.value})} className="w-full px-3 py-1.5 border border-border-default bg-surface-0 text-text-primary rounded-lg text-xs cursor-pointer">
                  <option>Spoke with Lead</option>
                  <option>Left Voice Mail</option>
                  <option>Busy / No Answer</option>
                  <option>Lead Not Interested</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Call Notes</label>
                <textarea required placeholder="Summarize prospect comments, next scheduling options..." value={callForm.notes} onChange={(e) => setCallForm({...callForm, notes: e.target.value})} className="w-full p-3 border border-border-default rounded-lg text-xs text-text-primary placeholder-muted-foreground focus:outline-none min-h-[80px] bg-surface-0" />
              </div>
              <div className="pt-3 border-t border-border-default flex justify-end space-x-2.5">
                <button type="button" onClick={() => setIsCallModalOpen(false)} className="px-4 py-1.5 border border-border-default rounded-lg text-xs font-semibold text-text-primary hover:bg-surface-2 cursor-pointer">Cancel</button>
                <button type="submit" className="inline-flex items-center space-x-1.5 px-4 py-1.5 bg-accent-color hover:bg-accent-color/90 text-surface-0 rounded-lg text-xs font-semibold cursor-pointer">
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
          <div className="bg-surface-1 border border-border-default rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-border-default flex justify-between items-center bg-surface-2">
              <h3 className="font-semibold text-text-primary text-sm">Schedule Meeting</h3>
              <button onClick={() => setIsMeetingModalOpen(false)} className="text-text-muted hover:text-text-primary p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleScheduleMeeting} className="p-5 space-y-4">
              <div>
                <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Meeting Title</label>
                <input type="text" required placeholder="e.g. Pulse Sandbox Architecture Demo" value={meetingForm.title} onChange={(e) => setMeetingForm({...meetingForm, title: e.target.value})} className="w-full px-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary placeholder-muted-foreground focus:outline-none bg-surface-0" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Date</label>
                  <input type="date" required value={meetingForm.date} onChange={(e) => setMeetingForm({...meetingForm, date: e.target.value})} className="w-full px-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary focus:outline-none cursor-pointer bg-surface-0" />
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Time</label>
                  <input type="time" required value={meetingForm.time} onChange={(e) => setMeetingForm({...meetingForm, time: e.target.value})} className="w-full px-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary focus:outline-none cursor-pointer bg-surface-0" />
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Agenda / Details</label>
                <textarea required placeholder="Discuss compliance guidelines and db sizing outline..." value={meetingForm.desc} onChange={(e) => setMeetingForm({...meetingForm, desc: e.target.value})} className="w-full p-3 border border-border-default rounded-lg text-xs text-text-primary placeholder-muted-foreground focus:outline-none min-h-[80px] bg-surface-0" />
              </div>
              <div className="pt-3 border-t border-border-default flex justify-end space-x-2.5">
                <button type="button" onClick={() => setIsMeetingModalOpen(false)} className="px-4 py-1.5 border border-border-default rounded-lg text-xs font-semibold text-text-primary hover:bg-surface-2 cursor-pointer">Cancel</button>
                <button type="submit" className="inline-flex items-center space-x-1.5 px-4 py-1.5 bg-accent-color hover:bg-accent-color/90 text-surface-0 rounded-lg text-xs font-semibold cursor-pointer">
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
          <div className="bg-surface-1 border border-border-default rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-border-default flex justify-between items-center bg-surface-2">
              <h3 className="font-semibold text-text-primary text-sm">Convert Lead to Account & Deal</h3>
              <button onClick={() => { setIsConvertModalOpen(false); setConvertingLeadId(null); setIsConverting(false); }} className="text-text-muted hover:text-text-primary p-1 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleConvertLeadSubmit} className="p-5 space-y-4 relative">
              {isConverting && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-surface-0/80 backdrop-blur-sm rounded-b-2xl">
                  <Loader2 className="h-6 w-6 text-accent-color animate-spin mb-2" />
                  <p className="text-xs font-semibold text-text-primary">Converting lead...</p>
                </div>
              )}
              <div>
                <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Industry</label>
                <input 
                  type="text" 
                  placeholder="e.g. Software, Healthcare, Retail" 
                  value={convertForm.industry} 
                  onChange={(e) => setConvertForm({...convertForm, industry: e.target.value})} 
                  className="w-full px-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent-color/20 bg-surface-0" 
                />
              </div>
              <div>
                <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Revenue (₹)</label>
                <input 
                  type="number" 
                  placeholder="e.g. 1200000" 
                  value={convertForm.revenue} 
                  onChange={(e) => setConvertForm({...convertForm, revenue: e.target.value})} 
                  className="w-full px-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent-color/20 bg-surface-0" 
                />
              </div>
              <div>
                <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Pipeline Stage</label>
                <select 
                  value={convertForm.pipelineStageId} 
                  onChange={(e) => setConvertForm({...convertForm, pipelineStageId: e.target.value})} 
                  className="w-full px-2 py-1.5 border border-border-default bg-surface-0 text-text-primary rounded-lg text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-accent-color/20"
                >
                  <option value="">— Default (New) —</option>
                  {pipelineStages.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-semibold text-text-primary uppercase tracking-wider mb-1">Number of Employees</label>
                <input 
                  type="number" 
                  placeholder="e.g. 150" 
                  value={convertForm.employeeCount} 
                  onChange={(e) => setConvertForm({...convertForm, employeeCount: e.target.value})} 
                  className="w-full px-3 py-1.5 border border-border-default rounded-lg text-xs text-text-primary placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent-color/20 bg-surface-0" 
                />
              </div>
              <div className="pt-3 border-t border-border-default flex justify-end space-x-2.5">
                <button 
                  type="button" 
                  onClick={() => { setIsConvertModalOpen(false); setConvertingLeadId(null); setIsConverting(false); }}
                  className="px-4 py-1.5 border border-border-default rounded-lg text-xs font-semibold text-text-primary hover:bg-surface-2 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isConverting}
                  className="px-4 py-1.5 bg-accent-color hover:bg-accent-color/90 text-surface-0 rounded-lg text-xs font-semibold cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isConverting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {isConverting ? 'Converting...' : 'Convert Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-surface-1 border border-border-default rounded-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-border-default flex items-center space-x-2 bg-destructive/10">
              <AlertCircle className="h-4.5 w-4.5 text-destructive" />
              <h3 className="font-semibold text-text-primary text-sm">Confirm Delete</h3>
            </div>
            <div className="p-5">
              <p className="text-xs text-text-muted leading-relaxed">
                Are you sure you want to delete this lead? This action <span className="font-semibold text-destructive">cannot be undone</span> and will permanently remove all associated data.
              </p>
              <div className="flex justify-end space-x-2.5 mt-5">
                <button 
                  onClick={() => setDeleteConfirmId(null)} 
                  className="px-4 py-1.5 border border-border-default rounded-lg text-xs font-semibold text-text-primary hover:bg-surface-2 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteLead} 
                  className="px-4 py-1.5 bg-destructive hover:bg-destructive/90 text-surface-0 rounded-lg text-xs font-semibold cursor-pointer transition-colors inline-flex items-center space-x-1.5"
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

    {/* Import Leads Modal */}
    {importLeadModalOpen && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4">
        <div className="bg-surface-1 rounded-2xl p-6 w-full max-w-lg border border-border-default">
          <h2 className="text-text-primary text-xl font-bold mb-4">Import Leads</h2>
          {importError && (
            <div className="bg-status-danger-text/10 text-status-danger-text border border-status-danger-text/20 rounded p-3 mb-4">
              {importError}
            </div>
          )}
          <div className="mb-4">
            <label className="block text-text-muted text-sm mb-2">CSV File</label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                if (!f.name.endsWith('.csv')) {
                  setImportError('Please select a CSV file');
                  return;
                }
                setImportFile(f);
                setImportError(null);
              }}
              className="w-full px-3 py-2 border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-color"
            />
            {importFile && <p className="text-xs text-text-muted mt-1">Selected: {importFile.name}</p>}
          </div>
          <button
            onClick={async () => {
              if (!importFile) return;
              setImporting(true);
              setImportError(null);
              try {
                const text = await importFile.text();
                const leads = parseLeadCSV(text);
                let imported = 0;
                let skipped = 0;
                for (const lead of leads) {
                  try {
                    await createLead(toBackendLeadPayload(lead));
                    imported++;
                  } catch (rowErr: any) {
                    skipped++;
                  }
                }
                setImporting(false);
                const msg = skipped > 0
                  ? `${imported} leads imported, ${skipped} skipped (duplicates or validation errors)`
                  : `${imported} leads imported successfully`;
                toast.success(msg, { title: 'Import Complete' });
                setImportLeadModalOpen(false);
                setImportFile(null);
              } catch (err: any) {
                setImportError(err?.message || 'Failed to import leads');
                setImporting(false);
              }
            }}
            disabled={importing || !importFile}
            className="w-full px-3 py-2 bg-accent-color hover:bg-accent-color/90 text-surface-0 rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            {importing ? (
              <span className="inline-flex items-center gap-2"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Importing...</span>
            ) : 'Import Leads'}
          </button>
          <button
            onClick={() => { setImportLeadModalOpen(false); setImportFile(null); setImportError(null); }}
            className="mt-4 w-full px-3 py-1.5 border border-border-default rounded-lg text-xs font-semibold text-text-primary hover:bg-surface-2 cursor-pointer transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    )}
    </SkeletonLoader>
  );
}
  
