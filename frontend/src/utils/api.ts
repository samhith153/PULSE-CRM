const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
const TOKEN_KEY = 'pulse-crm-token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

export function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export interface Lead {
  id: number | string;
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
  value?: string | number;
  source?: string;
  timeline: { id: number; type: string; title: string; desc: string; time: string }[];
  emails: { id: number; subject: string; body: string; time: string }[];
  calls: { id: number; outcome: string; notes: string; time: string }[];
  meetings: { id: number; title: string; date: string; time: string; desc: string }[];
}

export interface Contact {
  id: number | string;
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

export interface Company {
  id: number | string;
  name: string;
  industry: string;
  revenue: string;
  employees: number;
  contacts: string[];
  openDeals: number;
  owner: string;
  ownerAvatar: string;
  notes: string;
  domain?: string;
  timeline: { id: number; title: string; time: string }[];
  emails: { id: number; subject: string; time: string }[];
  files: { id: number; name: string; size: string }[];
}

export interface Deal {
  id: number | string;
  title: string;
  company: string;
  value: number;
  stage: 'Qualified' | 'Proposal' | 'Under Review' | 'Won' | 'Lost';
  priority: 'High' | 'Medium' | 'Low';
  owner: string;
  closeDate: string;
}

// Default High-Fidelity Fallback Mock Data
export const MOCK_LEADS: Lead[] = [
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
      { id: 1, type: "creation", title: "Inbound Request Recieved", desc: "Submitted custom enterprise contact form.", time: "10 hours ago" }
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
];

export const MOCK_CONTACTS: Contact[] = [
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
];

export const MOCK_COMPANIES: Company[] = [
  {
    id: 1,
    name: "TechCorp Inc.",
    industry: "Software & IT",
    revenue: "₹12,400,000",
    employees: 320,
    contacts: ["Alex Rivera (VP Eng)", "Jane Doe (Product Manager)"],
    openDeals: 2,
    owner: "Sarah Johnson",
    ownerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&fit=crop&q=80",
    notes: "Expanding cloud migration contracts. Security SLA signed in Q1.",
    timeline: [
      { id: 1, title: "SSO Config Approved", time: "2 days ago" },
      { id: 2, title: "Discovery meeting logged", time: "1 week ago" }
    ],
    emails: [
      { id: 1, subject: "SSO integration guidelines", time: "3 days ago" }
    ],
    files: [
      { id: 1, name: "Migration_Blueprint.pdf", size: "2.4 MB" }
    ]
  },
  {
    id: 2,
    name: "MedSaaS Solutions",
    industry: "Healthcare tech",
    revenue: "₹4,500,000",
    employees: 85,
    contacts: ["Marcus Aurelius (Director)"],
    openDeals: 1,
    owner: "Alex Johnson",
    ownerAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&fit=crop&q=80",
    notes: "Evaluating compliance guidelines. Demo was well received.",
    timeline: [
      { id: 1, title: "Product Demo Scheduled", time: "3 days ago" }
    ],
    emails: [
      { id: 1, subject: "Sandbox login requests", time: "4 days ago" }
    ],
    files: []
  },
  {
    id: 3,
    name: "Sparta Creative",
    industry: "Marketing & Design",
    revenue: "₹1,200,000",
    employees: 24,
    contacts: ["Helena Troy (CEO)"],
    openDeals: 0,
    owner: "Sarah Johnson",
    ownerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&fit=crop&q=80",
    notes: "SSO and custom branding design requirements are priority.",
    timeline: [
      { id: 1, title: "Form Ingestion", time: "10 hours ago" }
    ],
    emails: [],
    files: []
  }
];

export const MOCK_DEALS: Deal[] = [
  { id: 1, title: "Database Cloud Migration", company: "TechCorp Inc.", value: 120000, stage: "Proposal", priority: "High", owner: "Sarah Johnson", closeDate: "2025-06-30" },
  { id: 2, title: "SSO Integration Scope", company: "Sparta Creative", value: 45000, stage: "Qualified", priority: "Medium", owner: "Sarah Johnson", closeDate: "2025-07-15" },
  { id: 3, title: "Compliance Suite Expansion", company: "MedSaaS Solutions", value: 85000, stage: "Under Review", priority: "High", owner: "Alex Johnson", closeDate: "2025-05-25" },
  { id: 4, title: "Global Logistics API", company: "Empiric Logistics", value: 380000, stage: "Proposal", priority: "High", owner: "David Wilson", closeDate: "2025-08-01" },
  { id: 5, title: "Analytics Custom Tier", company: "ByteSized Co.", value: 18000, stage: "Won", priority: "Low", owner: "Alex Johnson", closeDate: "2025-05-10" }
];

export async function register(fullName: string, email: string, password: string, organizationName: string): Promise<{ access_token: string; refresh_token: string }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ full_name: fullName, email, password, organization_name: organizationName })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    let message = `Registration failed (${res.status})`;
    const detail = err?.detail;
    if (Array.isArray(detail) && detail.length) {
      const first = detail[0];
      const field = String(first?.loc ? Array.isArray(first.loc) ? first.loc.join(' ') : first.loc : first?.field || '').replace('body -> ', '').replace(/->/g, ' ').trim();
      const msg = String(first?.msg || first?.message || '');
      if (/password/i.test(field) || /password/i.test(msg)) {
        message = 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.';
      } else if (/organization with name/i.test(msg) || /already exists/i.test(msg)) {
        message = 'An organization with this name already exists. Please choose a different name.';
      } else {
        message = field ? `${field}: ${msg}` : msg;
      }
    } else if (typeof detail === 'string') {
      message = detail;
    }
    throw new Error(message);
  }
  const json = await res.json();
  return json.data;
}

export async function login(email: string, password: string): Promise<{ access_token: string; refresh_token: string; token_type?: string; expires_in?: number }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).detail || `Login failed (${res.status})`);
  }
  const json = await res.json();
  return json.data ?? json;
}

async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...(options?.headers || {})
    }
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}`);
  }
  const json = await res.json();
  return (json.data ?? json) as T;
}

// --- Leads API ---
export async function getLeads(): Promise<Lead[]> {
  const dbResult = await apiFetch<any>('/api/v1/leads');
  const dbLeads: any[] = Array.isArray(dbResult) ? dbResult : (dbResult?.data ?? []);
  return dbLeads.map((dl, idx) => {
    const fallback = MOCK_LEADS[idx] || MOCK_LEADS[0];
    return {
      ...fallback,
      id: dl.id,
      status: dl.status || fallback.status,
      value: String(dl.value || fallback.value || ''),
      notes: dl.description || fallback.notes
    };
  });
}

export async function createLead(leadData: any): Promise<any> {
  return apiFetch('/api/v1/leads', {
    method: 'POST',
    body: JSON.stringify(leadData)
  });
}

export async function convertLead(
  leadId: string | number,
  payload: { industry?: string; revenue?: string; employee_count?: number }
): Promise<any> {
  return apiFetch(`/api/v1/leads/${leadId}/convert`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

// --- Contacts API ---
export async function getContacts(): Promise<Contact[]> {
  const dbResult = await apiFetch<any>('/api/v1/contacts');
  const dbContacts: any[] = Array.isArray(dbResult) ? dbResult : (dbResult?.data ?? []);
  return dbContacts.map((dc: any) => ({
    id: dc.id,
    name: `${dc.first_name || ''} ${dc.last_name || ''}`.trim() || dc.full_name || 'Unnamed Contact',
    company: dc.company?.name || dc.company_name || '',
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

export async function createContact(contactData: any): Promise<any> {
  return apiFetch('/api/v1/contacts', {
    method: 'POST',
    body: JSON.stringify(contactData)
  });
}

export async function updateContact(contactId: string | number, contactData: any): Promise<any> {
  return apiFetch(`/api/v1/contacts/${contactId}`, {
    method: 'PUT',
    body: JSON.stringify(contactData)
  });
}

// --- Companies API ---
export async function getCompanies(): Promise<Company[]> {
  const dbResult = await apiFetch<any>('/api/v1/companies');
  const dbCompanies: any[] = Array.isArray(dbResult) ? dbResult : (dbResult?.data ?? []);
  return dbCompanies.map((dc, idx) => {
    const fallback = MOCK_COMPANIES[idx] || MOCK_COMPANIES[0];
    return {
      ...fallback,
      id: dc.id,
      name: dc.name,
      domain: dc.domain || fallback.domain || '',
      industry: dc.industry || fallback.industry
    };
  });
}

export async function createCompany(companyData: any): Promise<any> {
  return apiFetch('/api/v1/companies', {
    method: 'POST',
    body: JSON.stringify(companyData)
  });
}

// --- Deals API ---
export async function getDeals(): Promise<Deal[]> {
  const dbResult = await apiFetch<any>('/api/v1/deals');
  const dbDeals: any[] = Array.isArray(dbResult) ? dbResult : (dbResult?.data ?? []);
  return dbDeals.map((dd, idx) => {
    const fallback = MOCK_DEALS[idx] || MOCK_DEALS[0];
    return {
      ...fallback,
      id: dd.id,
      title: dd.name,
      value: Number(dd.value || fallback.value),
      stage: dd.stage_id === 'd1f60c42-b0c6-4767-88ea-d4b68e9f2918' ? 'Qualified' :
             dd.stage_id === 'e2f50c42-b0c6-4767-88ea-d4b68e9f2919' ? 'Proposal' :
             dd.stage_id === 'f3f40c42-b0c6-4767-88ea-d4b68e9f2920' ? 'Under Review' :
             dd.stage_id === 'a4f30c42-b0c6-4767-88ea-d4b68e9f2921' ? 'Won' : 'Lost'
    };
  });
}

export async function updateDealStage(dealId: string | number, stageId: string): Promise<any> {
  return apiFetch(`/api/v1/deals/${dealId}/stage`, {
    method: 'PUT',
    body: JSON.stringify({ stage_id: stageId })
  });
}

// --- Conversation Intelligence (Bhavani Summarization API) ---
export interface SummaryMessage {
  sender: string;
  recipients: string[];
  subject: string;
  body: string;
  timestamp: string;
  direction: 'incoming' | 'outgoing';
}

export interface ConversationSummary {
  thread_id: string;
  summary: string;
  summary_word: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  intent: 'demo' | 'buy' | 'negotiate' | 'followup' | 'decline' | 'other';
  confidence: number;
  key_points: string[];
  action_items: string[];
  category?: 'sales' | 'support' | 'general' | 'urgent';
  draft_reply?: string;
  follow_up_suggestion?: string;
  follow_up_timing?: 'immediate' | 'today' | 'tomorrow' | '2_days' | '3_days' | '1_week' | '2_weeks' | 'no_followup';
  processing_time_ms?: number;
  model_version?: string;
}

export async function summarizeThread(threadId: string, messages: SummaryMessage[], contactId?: string, dealId?: string): Promise<ConversationSummary | null> {
  const res = await fetch(`${API_BASE_URL}/api/v1/summarization/summarise`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({
      thread_id: threadId,
      messages,
      contact_id: contactId,
      deal_id: dealId
    })
  });
  if (!res.ok) throw new Error(`Summarization API error ${res.status}`);
  return res.json() as Promise<ConversationSummary>;
}

export async function getSummaryByThread(threadId: string): Promise<ConversationSummary | null> {
  const res = await fetch(`${API_BASE_URL}/api/v1/summarization/summary/${threadId}`, {
    headers: { ...getAuthHeaders() }
  });
  if (!res.ok) throw new Error(`Summarization API error ${res.status}`);
  return res.json() as Promise<ConversationSummary>;
}


function toQuery(params: Record<string, string | number | boolean | null | undefined>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages?: number;
  has_next?: boolean;
  has_prev?: boolean;
}

export interface GmailConnection {
  id: string;
  user_id: string;
  email_address: string;
  sync_status: string;
  sync_cursor?: string | null;
  token_expires_at?: string | null;
  scopes_json?: string[] | null;
  organization_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GmailOAuthLogin {
  authorization_url: string;
  state: string;
}

export interface EmailAttachment {
  filename: string;
  content_type?: string | null;
  size_bytes?: number | null;
  attachment_id?: string | null;
  inline?: boolean;
}

export interface SyncedEmail {
  id: string;
  gmail_message_id: string;
  thread_id?: string | null;
  direction: 'inbound' | 'outbound' | string;
  sender: string;
  receiver?: string | null;
  subject: string;
  body_preview?: string | null;
  sent_at: string;
  attachment_metadata: EmailAttachment[];
  raw_payload?: Record<string, unknown> | null;
  is_read: boolean;
  email_open_count?: number;
  gmail_connection_id?: string | null;
  external_entity_type?: string | null;
  external_entity_id?: string | null;
}

export interface ActivityTimelineItem {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  title: string;
  description?: string | null;
  payload?: Record<string, unknown> | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailListParams {
  page?: number;
  page_size?: number;
  search?: string;
  direction?: 'inbound' | 'outbound' | '';
  thread_id?: string;
  sort_order?: 'asc' | 'desc';
}

export interface ActivityListParams {
  page?: number;
  page_size?: number;
  entity_type?: string;
  entity_id?: string;
  activity_type?: string;
  search?: string;
}

export async function startGmailOAuth(): Promise<GmailOAuthLogin> {
  return apiFetch<GmailOAuthLogin>('/api/v1/gmail/oauth/login');
}

export async function completeGmailOAuth(code: string, state?: string | null): Promise<GmailConnection> {
  return apiFetch<GmailConnection>('/api/v1/gmail/oauth/callback', {
    method: 'POST',
    body: JSON.stringify({ code, state })
  });
}

export async function getGmailConnections(): Promise<GmailConnection[]> {
  return apiFetch<GmailConnection[]>('/api/v1/gmail/connections');
}

export async function getGmailStatus(): Promise<{ connected: boolean; connection?: GmailConnection | null }> {
  const connections = await getGmailConnections();
  const connection = connections.find(item => item.is_active) ?? connections[0] ?? null;
  return { connected: Boolean(connection?.is_active), connection };
}

export interface EmailSyncResult {
  gmail_connection_id: string;
  synced_count: number;
  skipped_count: number;
  next_cursor?: string | null;
  connection_status: string;
  emails: SyncedEmail[];
}

export interface SendEmailPayload {
  gmail_connection_id: string;
  receiver: string;
  subject: string;
  html_body: string;
  external_entity_type?: string | null;
  external_entity_id?: string | null;
}

export async function syncGmail(connectionId: string): Promise<EmailSyncResult> {
  return apiFetch<EmailSyncResult>(`/api/v1/gmail/connections/${connectionId}/sync`, {
    method: 'POST'
  });
}

export async function sendGmailEmail(payload: SendEmailPayload): Promise<SyncedEmail> {
  return apiFetch<SyncedEmail>('/api/v1/gmail/send', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function getEmails(params: EmailListParams = {}): Promise<PaginatedResult<SyncedEmail>> {
  return apiFetch<PaginatedResult<SyncedEmail>>(`/api/v1/emails${toQuery(params as Record<string, string | number | boolean | null | undefined>)}`);
}

export async function getEmail(id: string): Promise<SyncedEmail> {
  return apiFetch<SyncedEmail>(`/api/v1/emails/${id}`);
}

export async function getActivities(params: ActivityListParams = {}): Promise<PaginatedResult<ActivityTimelineItem>> {
  const { activity_type, ...rest } = params;
  return apiFetch<PaginatedResult<ActivityTimelineItem>>(
    `/api/v1/activities${toQuery({ ...rest, action: activity_type })}`
  );
}

// --- Dashboard KPI API (Admin / Manager / Sales Rep) ---

// Decimal values arrive as strings from the JSON serializer.
export type Decimal = string | number;

export function asNumber(v: Decimal | undefined | null): number {
  if (v === undefined || v === null || v === '') return 0;
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export function formatINR(v: Decimal | undefined | null): string {
  const n = asNumber(v);
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)}Cr`;
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
}

export function formatNum(v: Decimal | undefined | null): string {
  const n = asNumber(v);
  if (n >= 1_00_00_000) return `${(n / 1_00_00_000).toFixed(2)}Cr`;
  if (n >= 1_00_000) return `${(n / 1_00_000).toFixed(2)}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString('en-IN');
}

export function formatPct(v: Decimal | undefined | null, digits = 1): string {
  const n = asNumber(v);
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(digits)}%`;
}

export interface AdminDashboardData {
  summary: {
    organizations: { total: number; added_this_month: number; monthly_growth_pct: Decimal };
    users: { total: number; active: number; inactive: number; new_this_month: number };
    companies: { total: number; added_this_month: number; monthly_growth_pct: Decimal };
    contacts: { total: number; new_this_month: number; monthly_growth_pct: Decimal };
    leads: { total: number; new_today: number; new_this_month: number; monthly_growth_pct: Decimal; converted: number; conversion_rate: Decimal };
    revenue: { today: Decimal; this_week: Decimal; this_month: Decimal; this_year: Decimal; growth_pct: Decimal };
    tasks: { pending: number; overdue: number; due_today: number };
  };
  monthly_sales: { month: string; leads_created: number; leads_converted: number; revenue: Decimal }[];
  lead_sources: { source: string; count: number; percentage: Decimal }[];
  lead_funnel: { stage: string; count: number; percentage: Decimal }[];
  top_sales_reps: { user_id: string; full_name: string; deals_closed: number; revenue: Decimal; conversion_rate: Decimal }[];
  top_companies: { company_id: string; name: string; revenue: Decimal; lead_count: number; contact_count: number }[];
  recent_activities: { id: string; action: string; title: string; entity_type: string; created_at: string; created_by: string | null }[];
  notifications: { overdue_tasks: number; todays_meetings: number; pending_approvals: number; high_priority_leads: number; system_alerts: number };
}

export interface ManagerDashboardData {
  summary: {
    team_revenue: Decimal;
    forecast_projection: Decimal;
    pipeline_value: Decimal;
    quota_achievement: Decimal;
    team_members: number;
    conversion_rate: Decimal;
    win_rate: Decimal;
    average_sales_cycle: Decimal;
  };
  revenue_stats: { team_revenue_won: Decimal; team_target: Decimal; achievement_pct: Decimal; monthly_growth_pct: Decimal };
  forecast: { projected_revenue: Decimal; forecast_accuracy: Decimal; confidence_score: Decimal; expected_quarter_revenue: Decimal };
  pipeline_health: {
    active_pipeline_value: Decimal;
    total_deals: number;
    health_score: Decimal;
    stage_distribution: { stage: string; deal_count: number; total_value: Decimal; percentage: Decimal }[];
  };
  rep_quota_attainment: { user_id: string; full_name: string; assigned_target: Decimal; revenue_generated: Decimal; quota_achievement_pct: Decimal; rank: number }[];
  monthly_revenue_trend: { month: string; revenue: Decimal; target: Decimal; growth_pct: Decimal }[];
  top_reps: { user_id: string; full_name: string; revenue: Decimal; deals_closed: number; conversion_rate: Decimal; quota_achievement_pct: Decimal }[];
  deals_at_risk: { deal_id: string; deal_name: string; company: string | null; owner_name: string | null; deal_value: Decimal; risk_reason: string; days_since_last_activity: number }[];
  alerts: { severity: string; message: string; timestamp: string }[];
  recent_activities: { id: string; action: string; title: string; entity_type: string; created_at: string; created_by: string | null }[];
  team_metrics: {
    total_members: number;
    active_reps: number;
    avg_deal_size: Decimal;
    avg_sales_cycle_days: Decimal;
    team_conversion_rate: Decimal;
    win_rate: Decimal;
    forecast_accuracy: Decimal;
  };
}

export interface SalesRepDashboardData {
  summary: { total_revenue: Decimal; won_deals: number; win_rate: Decimal; average_deal_size: Decimal; average_sales_cycle: Decimal };
  revenue_stat: { total: Decimal; previous_period: Decimal; growth_pct: Decimal };
  won_deals_stat: { count: number; previous_period: number; growth_pct: Decimal };
  win_rate_stat: { win_rate: Decimal; previous_win_rate: Decimal; growth_pct: Decimal };
  avg_deal_size_stat: { avg_deal_value: Decimal; previous_avg: Decimal; growth_pct: Decimal };
  avg_sales_cycle_stat: { avg_days: Decimal; previous_avg_days: Decimal; difference_days: Decimal };
  revenue_trend: { period: string; revenue: Decimal }[];
  deals_by_stage: { stage: string; count: number; percentage: Decimal; conversion_rate: Decimal }[];
  deals_by_source: { source: string; count: number; percentage: Decimal; revenue: Decimal }[];
  key_metrics: { open_deals: number; pipeline_value: Decimal; deals_created: number; deals_lost: number; activities_logged: number; pipeline_value_growth_pct: Decimal; deals_created_growth_pct: Decimal; activities_growth_pct: Decimal };
}

export async function getAdminDashboard(): Promise<AdminDashboardData> {
  return apiFetch<AdminDashboardData>('/api/v1/dashboard/admin');
}

export async function getManagerDashboard(): Promise<ManagerDashboardData> {
  return apiFetch<ManagerDashboardData>('/api/v1/dashboard/manager');
}

export async function getSalesRepDashboard(period: 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<SalesRepDashboardData> {
  return apiFetch<SalesRepDashboardData>(`/api/v1/dashboard/sales-rep${toQuery({ period })}`);
}

export async function getCurrentUser(): Promise<{ id: string; email: string; full_name: string; organization_id: string; roles: string[]; permissions: string[]; is_verified: boolean; is_superuser: boolean }> {
  return apiFetch('/api/v1/auth/me');
}
