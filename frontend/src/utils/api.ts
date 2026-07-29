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

export async function register(fullName: string, email: string, password: string, organizationName: string): Promise<{ access_token: string; refresh_token: string }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ full_name: fullName, email, password, organization_name: organizationName })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).detail || `Registration failed (${res.status})`);
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
  return dbLeads.map((dl) => ({
    id: dl.id,
    name: dl.name || dl.full_name || '',
    company: dl.company_name || dl.company || '',
    email: dl.email || '',
    phone: dl.phone || '',
    score: dl.score ?? 0,
    status: dl.status || 'New',
    priority: dl.priority || 'Medium',
    owner: dl.owner_name || dl.owner || '',
    ownerAvatar: dl.owner_avatar || '',
    notes: dl.description || dl.notes || '',
    value: String(dl.value || ''),
    source: dl.source || '',
    timeline: dl.timeline || [],
    emails: dl.emails || [],
    calls: dl.calls || [],
    meetings: dl.meetings || []
  }));
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
  return dbContacts.map((dc) => ({
    id: dc.id,
    name: dc.first_name && dc.last_name ? `${dc.first_name} ${dc.last_name}` : (dc.name || ''),
    company: dc.company_name || dc.company || '',
    designation: dc.job_title || dc.designation || '',
    phone: dc.phone || '',
    email: dc.email || '',
    notes: dc.notes || '',
    timeline: dc.timeline || [],
    calls: dc.calls || [],
    meetings: dc.meetings || [],
    emails: dc.emails || []
  }));
}

export async function createContact(contactData: any): Promise<any> {
  return apiFetch('/api/v1/contacts', {
    method: 'POST',
    body: JSON.stringify(contactData)
  });
}

// --- Companies API ---
export async function getCompanies(): Promise<Company[]> {
  const dbResult = await apiFetch<any>('/api/v1/companies');
  const dbCompanies: any[] = Array.isArray(dbResult) ? dbResult : (dbResult?.data ?? []);
  return dbCompanies.map((dc) => ({
    id: dc.id,
    name: dc.name || '',
    industry: dc.industry || '',
    revenue: dc.revenue || '₹0',
    employees: dc.employee_count || dc.employees || 0,
    contacts: dc.contacts || [],
    openDeals: dc.open_deals || dc.openDeals || 0,
    owner: dc.owner_name || dc.owner || '',
    ownerAvatar: dc.owner_avatar || dc.ownerAvatar || '',
    notes: dc.notes || '',
    domain: dc.domain || '',
    timeline: dc.timeline || [],
    emails: dc.emails || [],
    files: dc.files || []
  }));
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
  return dbDeals.map((dd) => ({
    id: dd.id,
    title: dd.name || dd.title || '',
    company: dd.company_name || dd.company || '',
    value: Number(dd.value || 0),
    stage: dd.stage_id === 'd1f60c42-b0c6-4767-88ea-d4b68e9f2918' ? 'Qualified' :
           dd.stage_id === 'e2f50c42-b0c6-4767-88ea-d4b68e9f2919' ? 'Proposal' :
           dd.stage_id === 'f3f40c42-b0c6-4767-88ea-d4b68e9f2920' ? 'Under Review' :
           dd.stage_id === 'a4f30c42-b0c6-4767-88ea-d4b68e9f2921' ? 'Won' :
           (dd.stage || 'Qualified') as Deal['stage'],
    priority: dd.priority || 'Medium',
    owner: dd.owner_name || dd.owner || '',
    closeDate: dd.close_date || dd.closeDate || ''
  }));
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
  return apiFetch<PaginatedResult<SyncedEmail>>(`/api/v1/emails${toQuery(params)}`);
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

export async function createActivity(activityData: any): Promise<any> {
  return apiFetch('/api/v1/activities', {
    method: 'POST',
    body: JSON.stringify(activityData)
  });
}

export async function getEnhancedRecommendation(leadId: string): Promise<any> {
  return apiFetch(`/api/v1/ai/enhanced-recommendation?lead_id=${leadId}`, {
    method: 'POST'
  });
}

export async function getLeadScore(leadId: string): Promise<any> {
  return apiFetch(`/api/v1/ai/lead-score`, {
    method: 'POST',
    body: JSON.stringify({ lead_id: leadId })
  });
}

export async function getUsers(): Promise<any> {
  return apiFetch('/api/v1/users');
}

export async function getWebhookEndpoints(): Promise<any> {
  return apiFetch('/api/v1/webhooks/endpoints');
}

export async function createWebhookEndpoint(webhookData: any): Promise<any> {
  return apiFetch('/api/v1/webhooks/endpoints', {
    method: 'POST',
    body: JSON.stringify(webhookData)
  });
}
