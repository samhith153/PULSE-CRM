import { toast } from '../lib/toast';
export { toast };

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
  id: string;
  title: string;
  description: string | null;
  status: string;
  source: string | null;
  interest: string | null;
  industry: string | null;
  employee_count: number | null;
  current_crm: string | null;
  location: string | null;
  operational_systems: string | null;
  estimated_value: number | null;
  currency: string;
  score: number | null;
  fit_score: number | null;
  engagement_score: number | null;
  top_reasons: string[] | null;
  priority: string | null;
  notes: string | null;
  close_reason: string | null;
  company_id: string | null;
  contact_id: string | null;
  owner_id: string | null;
  organization_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  company_name: string | null;
  job_title: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  owner_name: string | null;
}

export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string | null;
  mobile: string | null;
  job_title: string | null;
  department: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  notes: string | null;
  company_id: string | null;
  owner_id: string | null;
  organization_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  company_name: string | null;
}

export interface Company {
  id: string;
  name: string;
  domain: string | null;
  website: string | null;
  description: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  zip_code: string | null;
  industry: string | null;
  current_crm: string | null;
  operational_system: string | null;
  company_type: string | null;
  employee_count: number | null;
  annual_revenue: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  owner_id: string | null;
  organization_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  owner_name: string | null;
}

export interface Deal {
  id: string;
  name: string;
  description: string | null;
  status: string;
  amount: number | null;
  currency: string;
  expected_close_date: string | null;
  probability: number;
  priority: string | null;
  notes: string | null;
  close_reason: string | null;
  closed_at: string | null;
  owner_id: string | null;
  pipeline_stage_id: string | null;
  company_id: string | null;
  contact_id: string | null;
  lead_id: string | null;
  organization_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  company_name: string | null;
  contact_name: string | null;
  owner_name: string | null;
}

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
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
      else if (body?.detail) message = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail);
    } catch {
    }
    toast.error(message);
    throw new Error(message);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  const json = await res.json();
  return (json.data ?? json) as T;
}

// --- Leads API ---
export async function getLeads(): Promise<Lead[]> {
  const dbResult = await apiFetch<any>('/api/v1/leads');
  const items: any[] = Array.isArray(dbResult) ? dbResult : (dbResult?.data ?? []);
  return items as Lead[];
}

export async function getLead(leadId: string): Promise<Lead> {
  return apiFetch<Lead>(`/api/v1/leads/${leadId}`);
}

export async function createLead(leadData: Record<string, unknown>): Promise<Lead> {
  return apiFetch<Lead>('/api/v1/leads', {
    method: 'POST',
    body: JSON.stringify(leadData)
  });
}

export async function updateLead(leadId: string, leadData: Record<string, unknown>): Promise<Lead> {
  return apiFetch<Lead>(`/api/v1/leads/${leadId}`, {
    method: 'PUT',
    body: JSON.stringify(leadData)
  });
}

export async function deleteLead(leadId: string): Promise<void> {
  await apiFetch<void>(`/api/v1/leads/${leadId}`, { method: 'DELETE' });
}

export async function convertLead(
  leadId: string,
  payload: { industry?: string; revenue?: number; employee_count?: number; pipeline_stage_id?: string }
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
  })) as unknown as Contact[];
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
    return {
      id: dc.id,
      name: dc.name || `Company ${dc.id}`,
      industry: dc.industry || '',
      revenue: String(dc.annual_revenue || ''),
      employees: dc.employee_count || 0,
      contacts: [],
      openDeals: dc.open_deals ?? 0,
      owner: dc.owner_name || dc.owner || '',
      ownerAvatar: dc.owner_avatar || '',
      notes: dc.notes || '',
      timeline: [],
      emails: [],
      files: [],
    };
  }) as unknown as Company[];
}

export async function createCompany(companyData: any): Promise<any> {
  return apiFetch('/api/v1/companies', {
    method: 'POST',
    body: JSON.stringify(companyData)
  });
}

export async function updateCompany(companyId: string | number, companyData: any): Promise<any> {
  return apiFetch(`/api/v1/companies/${companyId}`, {
    method: 'PUT',
    body: JSON.stringify(companyData)
  });
}

// --- Deals API ---
export async function getDeals(): Promise<Deal[]> {
  const dbResult = await apiFetch<any>('/api/v1/deals');
  const dbDeals: any[] = Array.isArray(dbResult) ? dbResult : (dbResult?.data ?? []);
  return dbDeals.map((dd, idx) => {
    return {
      id: dd.id,
      title: dd.name || `Deal ${dd.id}`,
      company: dd.company_name || dd.company?.name || '',
      value: Number(dd.amount || 0),
      stage: dd.stage_name || dd.stage_slug || 'New',
      priority: dd.priority || '',
      owner: dd.owner_name || dd.owner || '',
      closeDate: dd.expected_close_date || '',
    };
  }) as unknown as Deal[];
}

export async function updateDealStage(dealId: string | number, stageId: string): Promise<any> {
  return apiFetch(`/api/v1/pipeline/move`, {
    method: 'PATCH',
    body: JSON.stringify({ deal_id: dealId, stage_id: stageId })
  });
}

export async function createDeal(dealData: any): Promise<any> {
  return apiFetch('/api/v1/deals', {
    method: 'POST',
    body: JSON.stringify(dealData)
  });
}

export async function updateDeal(dealId: string | number, dealData: any): Promise<any> {
  return apiFetch(`/api/v1/deals/${dealId}`, {
    method: 'PUT',
    body: JSON.stringify(dealData)
  });
}

export async function deleteDeal(dealId: string | number): Promise<void> {
  await apiFetch(`/api/v1/deals/${dealId}`, { method: 'DELETE' });
}

export async function getPipelineStages(): Promise<any[]> {
  const dbResult = await apiFetch<any>('/api/v1/pipeline/stages');
  const stages: any[] = Array.isArray(dbResult) ? dbResult : (dbResult?.data ?? []);
  return stages;
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
  if (!res.ok) {
    let message = `Summarization failed (${res.status})`;
    try { const body = await res.json(); if (body?.message) message = body.message; } catch {}
    toast.error(message);
    throw new Error(message);
  }
  return res.json() as Promise<ConversationSummary>;
}

export async function getSummaryByThread(threadId: string): Promise<ConversationSummary | null> {
  const res = await fetch(`${API_BASE_URL}/api/v1/summarization/summary/${threadId}`, {
    headers: { ...getAuthHeaders() }
  });
  if (!res.ok) {
    let message = `Failed to load summary (${res.status})`;
    try { const body = await res.json(); if (body?.message) message = body.message; } catch {}
    toast.error(message);
    throw new Error(message);
  }
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

// --- Automation / Events API ---

export interface AutomationEvent {
  id: string;
  event_type: string;
  event_name: string;
  aggregate_type?: string | null;
  aggregate_id?: string | null;
  organization_id?: string | null;
  actor_id?: string | null;
  source?: string | null;
  correlation_id?: string | null;
  payload: Record<string, unknown>;
  occurred_at: string;
  created_at: string;
}

export interface AutomationEventList {
  items: AutomationEvent[];
  total: number;
  limit: number;
  offset: number;
}

export interface WebhookEndpoint {
  id: string;
  name: string;
  target_url: string;
  event_types: string[];
  max_attempts: number;
  organization_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WebhookDelivery {
  id: string;
  endpoint_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  status: string;
  attempts: number;
  next_attempt_at?: string | null;
  last_status_code?: number | null;
  last_error?: string | null;
  delivered_at?: string | null;
  created_at: string;
}

export async function getAutomationEvents(limit = 25): Promise<AutomationEventList> {
  return apiFetch<AutomationEventList>(`/api/v1/events${toQuery({ limit })}`);
}

export async function getWebhookEndpoints(): Promise<WebhookEndpoint[]> {
  return apiFetch<WebhookEndpoint[]>('/api/v1/webhooks/endpoints');
}

export async function triggerAutomationDelivery(eventType: string, payload: Record<string, unknown> = {}): Promise<WebhookDelivery[]> {
  return apiFetch<WebhookDelivery[]>('/api/v1/webhooks/deliveries', {
    method: 'POST',
    body: JSON.stringify({ event_type: eventType, payload })
  });
}

export interface DocumentResponse {
  id: string;
  organization_id: string;
  uploaded_by?: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size_bytes: number;
  created_at: string;
}

export async function uploadDocument(file: File): Promise<DocumentResponse | null> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    // This now uses the API_BASE_URL that is already defined in your file
    const res = await fetch(`${API_BASE_URL}/api/v1/documents/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`
      },
      body: formData
    });

    if (!res.ok) {
        console.error('Upload failed with status:', res.status);
        return null;
    }
    return (await res.json()) as DocumentResponse;
  } catch (error) {
    console.error('Error uploading document:', error);
    return null;
  }
}

// --- Formatting Helpers ---
export function formatNum(num: number | null | undefined): string {
  if (num === null || num === undefined) return '0';
  return num.toLocaleString();
}

export function formatPct(num: number | null | undefined): string {
  if (num === null || num === undefined) return '0%';
  return `${num}%`;
}

export function formatINR(num: number | null | undefined): string {
  if (num === null || num === undefined) return '₹0';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num);
}

// --- Dashboard & User Fetchers ---
export async function getAdminDashboard(): Promise<any> {
  return apiFetch('/api/v1/dashboards/admin').catch(() => ({})); 
}

export async function getManagerDashboard(): Promise<any> {
  return apiFetch('/api/v1/dashboards/manager').catch(() => ({}));
}

export async function getSalesRepDashboard(): Promise<any> {
  return apiFetch('/api/v1/dashboards/sales').catch(() => ({}));
}

export async function getCurrentUser(): Promise<any> {
  // Returns a mock user if the endpoint fails so the UI doesn't crash
  return apiFetch('/api/v1/users/me').catch(() => ({ 
    id: '1', 
    name: 'Test User', 
    email: 'test@example.com',
    role: 'admin' 
  }));
}

export function asNumber(val: any): number {
  if (typeof val === 'number') return val;
  const num = Number(val);
  return isNaN(num) ? 0 : num;
}

export async function getDocuments(): Promise<DocumentResponse[]> {
  const dbResult = await apiFetch<any>('/api/v1/documents');
  const items: any[] = Array.isArray(dbResult) ? dbResult : (dbResult?.data ?? []);
  return items as DocumentResponse[];
}

export async function downloadDocumentFile(id: string | number): Promise<Blob> {
  const res = await fetch(`${API_BASE_URL}/api/v1/documents/${id}/download`, {
    headers: getAuthHeaders()
  });
  
  if (!res.ok) {
    throw new Error('Failed to download document');
  }
  return res.blob();
}