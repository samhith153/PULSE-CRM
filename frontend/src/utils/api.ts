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
    if (err?.details && Array.isArray(err.details) && err.details.length > 0) {
      const d = err.details[0];
      if (d?.message && /password/i.test(d?.field || '')) {
        message = d.message.replace(/^Value error,\s*/i, '');
      } else if (d?.message) {
        message = d.message;
      }
    } else if (err?.message) {
      const weakMatch = err.message.match(/^Password is too weak:\s*(.*)$/i);
      message = weakMatch ? `Password ${weakMatch[1].trim()}` : err.message;
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
    throw new Error((err as any).message || `Login failed (${res.status})`);
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
      if (body?.details && Array.isArray(body.details) && body.details.length > 0) {
        const d = body.details[0];
        if (d?.field && d?.message && /password/.test(d.field)) {
          message = d.message.replace(/^Value error,\s*/i, '');
        } else if (d?.message && d.message !== message) {
          message = d.message;
        }
      }
    } catch {
    }
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
  is_read?: boolean;
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

export interface CreateActivityPayload {
  entity_type: string;
  entity_id: string;
  action: string;
  title: string;
  description?: string | null;
  payload?: Record<string, unknown>;
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

export async function createActivity(payload: CreateActivityPayload): Promise<ActivityTimelineItem> {
  return apiFetch<ActivityTimelineItem>('/api/v1/activities', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
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

export async function getSalesDashboard(period: 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<SalesRepDashboardData> {
  return apiFetch<SalesRepDashboardData>(`/api/v1/dashboard/sales${toQuery({ period })}`);
}
export async function getCurrentUser(): Promise<{ id: string; email: string; full_name: string; organization_id: string; roles: string[]; permissions: string[]; is_verified: boolean; is_superuser: boolean }> {
  return apiFetch('/api/v1/auth/me');
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

export async function createAutomationEvent(payload: {
  event_type: string;
  aggregate_type?: string | null;
  aggregate_id?: string | null;
  source?: string | null;
  correlation_id?: string | null;
  payload?: Record<string, unknown>;
}): Promise<AutomationEvent> {
  return apiFetch<AutomationEvent>('/api/v1/events', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
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

// --- User Management API ---

export interface UserData {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  job_title: string | null;
  avatar_url: string | null;
  organization_id: string;
  is_active: boolean;
  is_verified: boolean;
  is_superuser: boolean;
  roles: string[];
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function getUsers(page = 1, pageSize = 20, search?: string): Promise<PaginatedResult<UserData>> {
  return apiFetch<PaginatedResult<UserData>>(`/api/v1/users${toQuery({ page, page_size: pageSize, search })}`);
}

export async function getUser(userId: string): Promise<UserData> {
  return apiFetch<UserData>(`/api/v1/users/${userId}`);
}

export async function createUser(data: { full_name: string; email: string; password: string; role_id?: string | null }): Promise<UserData> {
  return apiFetch<UserData>('/api/v1/users', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updateUser(userId: string, data: { full_name?: string; phone?: string; job_title?: string }): Promise<UserData> {
  return apiFetch<UserData>(`/api/v1/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function deleteUser(userId: string): Promise<void> {
  await apiFetch<void>(`/api/v1/users/${userId}`, { method: 'DELETE' });
}

export async function activateUser(userId: string): Promise<UserData> {
  return apiFetch<UserData>(`/api/v1/users/${userId}/activate`, { method: 'POST' });
}

export async function deactivateUser(userId: string): Promise<UserData> {
  return apiFetch<UserData>(`/api/v1/users/${userId}/deactivate`, { method: 'POST' });
}

export async function assignUserRole(userId: string, roleId: string): Promise<UserData> {
  return apiFetch<UserData>(`/api/v1/users/${userId}/roles`, {
    method: 'POST',
    body: JSON.stringify({ role_id: roleId })
  });
}

export async function resetUserPassword(userId: string): Promise<{ new_password: string }> {
  return apiFetch<{ new_password: string }>(`/api/v1/users/${userId}/reset-password`, { method: 'POST' });
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiFetch<void>('/api/v1/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
  });
}

// --- Roles & Permissions API ---

export interface RoleData {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  is_system: boolean;
  permissions: string[];
}

export interface PermissionData {
  id: string;
  codename: string;
  name: string;
  description: string | null;
  resource: string;
  action: string;
}

export async function getRoles(): Promise<RoleData[]> {
  return apiFetch<RoleData[]>('/api/v1/roles');
}

export async function getRole(roleId: string): Promise<RoleData> {
  return apiFetch<RoleData>(`/api/v1/roles/${roleId}`);
}

export async function getPermissions(): Promise<PermissionData[]> {
  return apiFetch<PermissionData[]>('/api/v1/roles/permissions/all');
}

export async function updateRolePermissions(roleId: string, permissionCodenames: string[]): Promise<RoleData> {
  return apiFetch<RoleData>(`/api/v1/roles/${roleId}/permissions`, {
    method: 'PUT',
    body: JSON.stringify({ permission_codenames: permissionCodenames })
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

export async function deleteDocumentAPI(id: string | number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/v1/documents/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });

  if (!res.ok) {
    throw new Error('Failed to delete document');
  }
}

// --- Sales Manager Forecast API ---

export interface ManagerForecastData {
  expected_revenue: {
    expected_revenue: Decimal;
    quarter: string;
    previous_forecast: Decimal;
    growth_pct: Decimal;
    target_achievement_pct: Decimal;
  };
  best_case_pipeline: {
    best_case_pipeline: Decimal;
    active_pipeline_value: Decimal;
    difference_from_expected: Decimal;
  };
  pipeline_coverage: {
    coverage_ratio: Decimal;
    coverage_status: string;  // Critical / Moderate / Healthy / Excellent
  };
  confidence_score: {
    score: number;
    status: string;   // Very High / High / Medium / Low
    description: string;
  };
  monthly_forecast: {
    month: string;
    pipeline: Decimal;
    expected: Decimal;
    maximum: Decimal;
  }[];
  quarterly_projection: {
    quarter: string;
    quota_target: Decimal;
    expected_closed_revenue: Decimal;
    best_case_close: Decimal;
    open_pipeline: Decimal;
    target_achievement_pct: Decimal;
  }[];
  forecast_trend: { month: string; forecast: Decimal }[];
  forecast_accuracy: {
    current_accuracy_pct: Decimal;
    previous_accuracy_pct: Decimal;
    difference_pct: Decimal;
  };
  sales_velocity: {
    sales_velocity: Decimal;
    previous_velocity: Decimal;
    growth_pct: Decimal;
  };
  forecast_insights: { message: string; type: string }[];
  forecast_risks: {
    deal_id: string;
    deal_name: string;
    company: string | null;
    owner_name: string | null;
    deal_value: Decimal;
    risk_type: string;
    risk_description: string;
    days_overdue: number;
    probability: number;
  }[];
  forecast_recommendations: {
    priority: string;
    title: string;
    description: string;
    action: string;
    impact: string;
  }[];
  quarter: string;
  period: string;
  generated_at: string;
}

export async function getManagerForecast(
  period: 'monthly' | 'quarterly' | 'yearly' = 'monthly'
): Promise<ManagerForecastData> {
  return apiFetch<ManagerForecastData>(
    `/api/v1/dashboard/manager/forecast${toQuery({ period })}`
  );
}

// --- Notifications API ---
export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  entity_type: string | null;
  entity_id: string | null;
  payload: Record<string, unknown> | null;
  is_read: boolean;
  read_at: string | null;
  is_dismissed: boolean;
  created_at: string;
}

export interface NotificationList {
  items: Notification[];
  total: number;
  unread_count: number;
}

export async function getNotifications(params: { page?: number; pageSize?: number; unreadOnly?: boolean } = {}): Promise<NotificationList> {
  const query = new URLSearchParams();
  query.set('page', String(params.page ?? 1));
  query.set('page_size', String(params.pageSize ?? 20));
  if (params.unreadOnly) query.set('unread_only', 'true');
  return apiFetch<NotificationList>(`/api/v1/notifications?${query.toString()}`);
}

export async function getUnreadNotificationCount(): Promise<number> {
  const result = await apiFetch<{ unread_count: number }>('/api/v1/notifications/unread-count');
  return result.unread_count;
}

export async function markNotificationRead(notificationId: string): Promise<Notification> {
  return apiFetch<Notification>(`/api/v1/notifications/${notificationId}/read`, { method: 'POST' });
}

export async function markAllNotificationsRead(): Promise<{ updated: number }> {
  return apiFetch<{ updated: number }>('/api/v1/notifications/read-all', { method: 'POST' });
}

export async function dismissNotification(notificationId: string): Promise<Notification> {
  return apiFetch<Notification>(`/api/v1/notifications/${notificationId}`, { method: 'DELETE' });
}
