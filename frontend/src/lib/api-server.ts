// frontend/src/lib/api-server.ts
// ──────────────────────────────────────────────────────────────────────────────
// SERVER-ONLY data fetching functions — use in Server Components only.
// Uses Next.js extended `fetch` with cache tags for revalidation.
// ──────────────────────────────────────────────────────────────────────────────

import { 
  API_BASE_URL, 
  type Lead as ApiLead,
  type Contact as ApiContact,
  type Company as ApiCompany,
} from '@/utils/api';

// ═══════════════════════════════════════════════════════════════════════════════
// UI TYPES — Match the types used in Components (CompaniesView, ContactsView, LeadsView)
// ═══════════════════════════════════════════════════════════════════════════════

export interface UICompany {
  id: string | number;
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

export interface UIContact {
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

export interface UILead {
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
  timeline: { id: number; type: 'creation' | 'email' | 'call' | 'meeting' | 'conversion'; title: string; desc: string; time: string }[];
  emails: { id: number; subject: string; body: string; time: string }[];
  calls: { id: number; outcome: string; notes: string; time: string }[];
  meetings: { id: number; title: string; date: string; time: string; desc: string }[];
}

// Cache tags for granular revalidation
export const CACHE_TAGS = {
  contacts: 'contacts',
  contactDetail: 'contact-detail',
  leads: 'leads',
  leadDetail: 'lead-detail',
  companies: 'companies',
  companyDetail: 'company-detail',
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// COMPANIES
// ═══════════════════════════════════════════════════════════════════════════════

export async function getCompaniesServer(): Promise<UICompany[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/companies`, {
    headers: { 'Content-Type': 'application/json' },
    next: { 
      tags: [CACHE_TAGS.companies],
      revalidate: 60,
    },
  });
  
  if (!res.ok) {
    throw new Error(`Failed to fetch companies: ${res.status}`);
  }
  
  const data = await res.json();
  const companies: ApiCompany[] = Array.isArray(data) ? data : (data?.data ?? []);
  
  return companies.map((dc: ApiCompany) => ({
    id: dc.id,
    name: dc.name || `Company ${dc.id}`,
    industry: dc.industry || '',
    revenue: String(dc.annual_revenue || ''),
    employees: dc.employee_count || 0,
    contacts: [],
    openDeals: 0,
    owner: dc.owner_name || '',
    ownerAvatar: '',
    notes: '',
    timeline: [],
    emails: [],
    files: [],
  }));
}

export async function getCompanyServer(companyId: string): Promise<UICompany | null> {
  const res = await fetch(`${API_BASE_URL}/api/v1/companies/${companyId}`, {
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });
  
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Failed to fetch company ${companyId}: ${res.status}`);
  }
  
  const dc = await res.json();
  
  return {
    id: dc.id,
    name: dc.name || `Company ${dc.id}`,
    industry: dc.industry || '',
    revenue: String(dc.annual_revenue || ''),
    employees: dc.employee_count || 0,
    contacts: [],
    openDeals: 0,
    owner: dc.owner_name || '',
    ownerAvatar: '',
    notes: '',
    timeline: [],
    emails: [],
    files: [],
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTACTS
// ═══════════════════════════════════════════════════════════════════════════════

export async function getContactsServer(): Promise<UIContact[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/contacts`, {
    headers: { 'Content-Type': 'application/json' },
    next: { 
      tags: [CACHE_TAGS.contacts],
      revalidate: 60,
    },
  });
  
  if (!res.ok) {
    throw new Error(`Failed to fetch contacts: ${res.status}`);
  }
  
  const data = await res.json();
  const contacts: ApiContact[] = Array.isArray(data) ? data : (data?.data ?? []);
  
  return contacts.map((dc: ApiContact) => ({
    id: dc.id,
    name: `${dc.first_name || ''} ${dc.last_name || ''}`.trim() || dc.full_name || 'Unnamed Contact',
    company: dc.company_name || '',
    designation: dc.job_title || dc.department || '',
    phone: dc.phone || dc.mobile || '',
    email: dc.email,
    notes: dc.notes || '',
    timeline: [],
    calls: [],
    meetings: [],
    emails: [],
  }));
}

export async function getContactServer(contactId: string): Promise<UIContact | null> {
  const res = await fetch(`${API_BASE_URL}/api/v1/contacts/${contactId}`, {
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });
  
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Failed to fetch contact ${contactId}: ${res.status}`);
  }
  
  const dc = await res.json();
  
  return {
    id: dc.id,
    name: `${dc.first_name || ''} ${dc.last_name || ''}`.trim() || dc.full_name || 'Unnamed Contact',
    company: dc.company_name || '',
    designation: dc.job_title || dc.department || '',
    phone: dc.phone || dc.mobile || '',
    email: dc.email,
    notes: dc.notes || '',
    timeline: [],
    calls: [],
    meetings: [],
    emails: [],
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEADS
// ═══════════════════════════════════════════════════════════════════════════════

const STATUS_MAP: Record<string, string> = {
  'New': 'new', 'Contacted': 'contacted', 'Qualified': 'qualified', 'Converted': 'converted', 'Lost': 'lost',
};
const STATUS_UNMAP: Record<string, UILead['status']> = {
  'new': 'New', 'contacted': 'Contacted', 'qualified': 'Qualified', 'converted': 'Converted', 'lost': 'Lost',
};
const SOURCE_MAP: Record<string, string> = {
  'Website': 'website', 'Referral': 'referral', 'LinkedIn': 'linkedin',
  'Cold Email': 'email_campaign', 'Event': 'trade_show', 'Webinar': 'inbound',
  'Partner': 'partner', 'Paid Ads': 'social_media', 'Organic Search': 'website', 'Other': 'other',
};

function backendToLocal(b: ApiLead): UILead {
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
    priority: (b.priority as UILead['priority']) ?? 'Low',
    owner: b.owner_name || 'Unassigned',
    ownerAvatar: b.owner_avatar_url || '',
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

export async function getLeadsServer(): Promise<UILead[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/leads`, {
    headers: { 'Content-Type': 'application/json' },
    next: { 
      tags: [CACHE_TAGS.leads],
      revalidate: 60,
    },
  });
  
  if (!res.ok) {
    throw new Error(`Failed to fetch leads: ${res.status}`);
  }
  
  const data = await res.json();
  const leads: ApiLead[] = Array.isArray(data) ? data : (data?.data ?? []);
  
  return leads.map(backendToLocal);
}

export async function getLeadServer(leadId: string): Promise<UILead | null> {
  const res = await fetch(`${API_BASE_URL}/api/v1/leads/${leadId}`, {
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });
  
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Failed to fetch lead ${leadId}: ${res.status}`);
  }
  
  const b = await res.json();
  return backendToLocal(b);
}

export async function getPipelineStagesServer(): Promise<any[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/pipeline/stages`, {
    headers: { 'Content-Type': 'application/json' },
    next: { 
      tags: ['pipeline-stages'],
      revalidate: 300, // 5 min - rarely changes
    },
  });
  
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : (data?.data ?? []);
}

export async function getGmailStatusServer(): Promise<{ connected: boolean; connection?: any }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/gmail/connections`, {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return { connected: false };
    const connections = await res.json();
    const connection = Array.isArray(connections) ? connections.find((c: any) => c.is_active) : null;
    return { connected: Boolean(connection?.is_active), connection };
  } catch {
    return { connected: false };
  }
}