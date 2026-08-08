import { toast } from '@/lib/toast';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').trim().replace(/\/+$/, '');
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
  fit_reasons: string[] | null;
  engagement_reasons: string[] | null;
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

export async function getAuthConfig(): Promise<{ google_client_id: string | null }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/config`);
  if (!res.ok) {
    throw new Error(`Failed to load auth config (${res.status})`);
  }
  const json = await res.json();
  return json.data ?? json;
}

export async function loginWithGoogle(credential: string): Promise<{ access_token: string; refresh_token: string }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).message || `Google Sign-In failed (${res.status})`);
  }
  const json = await res.json();
  return json.data ?? json;
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, new_password: newPassword })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `Reset password failed (${res.status})`);
  }
}

export function resolveImageUrl(url: string | null | undefined): string {
  if (!url) return 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&fit=crop&q=80';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `${base}${cleanUrl}`;
}


async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  // Guard: skip the network call entirely if no auth token is available.
  // This prevents a flood of 401s from components mounting before the auth
  // guard in DashboardShell has finished running.
  const token = getToken();
  if (!token) {
    // Return a safe empty value so callers don't crash while unauthenticated.
    // Array endpoints get [], object endpoints get undefined — components
    // that handle empty arrays or undefined data won't error.
    return undefined as T;
  }

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
    // Show toast for permission errors so users get immediate feedback
    if (res.status === 403) {
      toast.error(`Permission denied: ${message}`);
    } else if (res.status === 401) {
      toast.error('Session expired. Please log in again.');
    } else if (res.status >= 500) {
      toast.error(`Server error: ${message}`);
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
  return items.map((dl: any) => ({
    ...dl,
    ownerAvatar: resolveImageUrl(dl.owner_avatar || dl.ownerAvatar),
  })) as unknown as Lead[];
}

export async function getLead(leadId: string): Promise<Lead> {
  const dl = await apiFetch<any>(`/api/v1/leads/${leadId}`);
  if (dl) {
    dl.ownerAvatar = resolveImageUrl(dl.owner_avatar || dl.ownerAvatar);
  }
  return dl as Lead;
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

export interface LeadRecommendation {
  entity_type: string;
  entity_id: string | null;
  status: string;
  recommendations: string[];
  reasoning: string[];
  metadata: Record<string, unknown>;
  generated_at: string;
}

export async function fetchLeadRecommendation(leadId: string): Promise<LeadRecommendation> {
  return apiFetch<LeadRecommendation>('/api/v1/ai/recommendations', {
    method: 'POST',
    body: JSON.stringify({ entity_type: 'lead', entity_id: leadId }),
  });
}

export interface BatchRecommendationItem {
  lead_id: string;
  recommended_action: string;
  reason: string;
  current_score: number;
  current_stage: string;
  all_candidates: Record<string, unknown>[];
}

export interface BatchRecommendationResponse {
  status: string;
  recommendations: Record<string, BatchRecommendationItem>;
  generated_at: string;
}

export async function fetchBatchRecommendations(leadIds: string[]): Promise<BatchRecommendationResponse> {
  return apiFetch<BatchRecommendationResponse>('/api/v1/ai/recommendations/batch', {
    method: 'POST',
    body: JSON.stringify({ lead_ids: leadIds }),
  });
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

export async function deleteContact(contactId: string | number): Promise<void> {
  await apiFetch(`/api/v1/contacts/${contactId}`, { method: 'DELETE' });
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
      ownerAvatar: resolveImageUrl(dc.owner_avatar || dc.ownerAvatar || ''),
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

export async function deleteCompany(companyId: string | number): Promise<void> {
  await apiFetch(`/api/v1/companies/${companyId}`, { method: 'DELETE' });
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
      createdAt: dd.created_at || dd.createdAt || new Date().toISOString(),
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

export interface EmailSummaryData {
  summary: string | null;
  sentiment: string | null;
  intent: string | null;
  confidence: number | null;
  key_points: string[];
  action_items: string[];
  category: string | null;
  draft_reply: string | null;
  follow_up_suggestion: string | null;
  follow_up_timing: string | null;
  model_version: string | null;
}

export async function getEmailSummary(threadId: string): Promise<EmailSummaryData | null> {
  return apiFetch<EmailSummaryData | null>(`/api/v1/emails/summary/${threadId}`);
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
  if (n >= 1_00_000) return `₹${(n / 1_00_00_000).toFixed(2)}L`;
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

export async function getCurrentUser(): Promise<any> {
  const me = await apiFetch<any>('/api/v1/auth/me');
  if (me && me.avatar_url) {
    me.avatar_url = resolveImageUrl(me.avatar_url);
  }
  return me;
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

// --- Dashboard Command Center (Sales Rep /me) ---

export interface DashboardOverviewData {
  kpis: { open_deals: number; untouched_deals: number; calls_today: number; leads_assigned: number; leads_today?: number };
  open_tasks: { id: string; title: string; due_date: string; status: string; source?: string; lead_id?: string; deal_id?: string }[];
  meetings_today: { id: string; title: string; start_time: string; end_time: string; zoom_link?: string; contact_name?: string; transcript_status?: string }[];
  priority_queue: { lead_id: string; first_name: string; last_name: string; company_name?: string; email: string; score: number; tier: string; top_reason?: string }[];
  deals_at_risk: { deal_id: string; deal_title: string; value: Decimal; stalled_days: number; risk_reason: string; sentiment?: string }[];
  quota_pace: { closed_won_revenue: Decimal; target_revenue: Decimal; attained_percentage: Decimal; pace_status: string };
  deals?: { id: string; name: string; value: number; stage: string; owner: string; closeDate: string }[];
  leads?: { id: string; name: string; company: string; score: number; status: string; owner: string }[];
  generated_at: string;
}

export interface DashboardDeal {
  id: number | string;
  title: string;
  company: string;
  value: number;
  stage: string;
  priority: 'High' | 'Medium' | 'Low';
  owner: string;
  closeDate: string;
  createdAt?: string;
}

export async function getDashboardMe(): Promise<DashboardOverviewData> {
  return apiFetch<DashboardOverviewData>('/api/v1/dashboard/me');
}

// --- SSE Stream URL ---

export function getDashboardStreamUrl(): string | null {
  const token = getToken();
  if (!token) return null;
  return `${API_BASE_URL}/api/v1/stream/dashboard?token=${encodeURIComponent(token)}`;
}

// --- Documents API ---

export interface DocumentData {
  id: string;
  organization_id: string;
  uploaded_by?: string;
  contact_id?: string;
  deal_id?: string;
  company_id?: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size_bytes: number;
  created_at: string;
}

export async function getDocuments(params: { contact_id?: string; deal_id?: string; company_id?: string } = {}): Promise<DocumentData[]> {
  return apiFetch<DocumentData[]>(`/api/v1/documents${toQuery(params as Record<string, string | number | boolean | null | undefined>)}`);
}

export async function uploadDocument(file: File, params: { contact_id?: string; deal_id?: string; company_id?: string } = {}): Promise<DocumentData> {
  const formData = new FormData();
  formData.append('file', file);
  Object.entries(params).forEach(([key, value]) => {
    if (value) formData.append(key, value);
  });
  const token = getToken();
  const res = await fetch(`${API_BASE_URL}/api/v1/documents`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(detail.detail || 'Upload failed');
  }
  const json = await res.json();
  return (json.data ?? json) as DocumentData;
}

export async function deleteDocument(docId: string): Promise<void> {
  await apiFetch<void>(`/api/v1/documents/${docId}`, { method: 'DELETE' });
}

export function getDocumentDownloadUrl(docId: string): string {
  return `${API_BASE_URL}/api/v1/documents/${docId}/download`;
}

export async function uploadAvatar(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const token = getToken();
  const res = await fetch(`${API_BASE_URL}/api/v1/uploads/avatars`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(detail.detail || 'Avatar upload failed');
  }
  return res.json();
}

// =============================================================================
// CRM ACTIVITIES API  (/api/v1/crm-activities)
// =============================================================================

export interface CrmActivityDetails {
  description?: string | null;
  reminder_minutes?: number | null;
  completed_at?: string | null;
  contact_name?: string | null;
  phone_number?: string | null;
  call_type?: string | null;
  duration_minutes?: number | null;
  outcome?: string | null;
  notes?: string | null;
  end_datetime?: string | null;
  location?: string | null;
  meeting_link?: string | null;
  direction?: string | null;
  sender?: string | null;
  receiver?: string | null;
  body_preview?: string | null;
  thread_id?: string | null;
  is_read?: boolean | null;
  body?: string | null;
}

export interface CrmActivity {
  id: string;
  activity_type: 'task' | 'call' | 'meeting' | 'email' | 'note';
  subject: string;
  status: string;
  priority: string;
  due_date: string | null;
  owner_id: string | null;
  owner_name: string | null;
  related_entity_type: string | null;
  related_record_id: string | null;
  related_record_name: string | null;
  organization_id: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  details: CrmActivityDetails;
}

export interface CrmActivityOwner {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
}

export interface CrmActivitiesListParams {
  view?: 'timeline' | 'task' | 'call' | 'meeting' | 'email' | 'note';
  search?: string;
  status?: string;
  priority?: string;
  owner_id?: string;
  from_date?: string;
  to_date?: string;
  quick_tab?: 'all' | 'today' | 'upcoming' | 'overdue';
  sort_order?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}

export interface PaginatedCrmActivities {
  data: CrmActivity[];
  meta: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export async function getCrmActivities(
  params: CrmActivitiesListParams = {}
): Promise<PaginatedCrmActivities> {
  const result = await apiFetch<PaginatedCrmActivities>(
    `/api/v1/crm-activities${toQuery(params as Record<string, string | number | boolean | null | undefined>)}`
  );
  return result ?? { data: [], meta: { total: 0, page: 1, page_size: 20, total_pages: 1, has_next: false, has_prev: false } };
}

export async function getCrmActivityOwners(): Promise<CrmActivityOwner[]> {
  const result = await apiFetch<CrmActivityOwner[]>('/api/v1/crm-activities/owners');
  return Array.isArray(result) ? result : [];
}

export async function downloadCrmActivitiesExport(
  params: Omit<CrmActivitiesListParams, 'page' | 'page_size'>
): Promise<void> {
  const qs = toQuery(params as Record<string, string | number | boolean | null | undefined>);
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${API_BASE_URL}/api/v1/crm-activities/export${qs}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'text/csv' },
  });
  if (!res.ok) {
    let msg = `Export failed (${res.status})`;
    try { const b = await res.json(); if (b?.message) msg = b.message; } catch {}
    throw new Error(msg);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `activities_export_${new Date().toISOString().slice(0, 10)}.csv`;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 200);
}

export interface CreateTaskPayload {
  subject: string; description?: string; due_date?: string; priority?: string;
  status?: string; owner_id?: string; reminder_minutes?: number;
  related_entity_type?: string; related_lead_id?: string;
  related_contact_id?: string; related_company_id?: string; related_deal_id?: string;
}
export async function createCrmTask(payload: CreateTaskPayload): Promise<CrmActivity> {
  return apiFetch<CrmActivity>('/api/v1/crm-activities/tasks', { method: 'POST', body: JSON.stringify(payload) });
}
export async function updateCrmTask(id: string, payload: Partial<CreateTaskPayload>): Promise<CrmActivity> {
  return apiFetch<CrmActivity>(`/api/v1/crm-activities/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
}
export async function deleteCrmTask(id: string): Promise<void> {
  await apiFetch<void>(`/api/v1/crm-activities/tasks/${id}`, { method: 'DELETE' });
}

export interface CreateCallPayload {
  subject: string; contact_name?: string; phone_number?: string; call_type?: string;
  duration_minutes?: number; outcome?: string; notes?: string; priority?: string;
  status?: string; called_at?: string; owner_id?: string;
  related_entity_type?: string; related_lead_id?: string;
  related_contact_id?: string; related_company_id?: string; related_deal_id?: string;
}
export async function createCrmCall(payload: CreateCallPayload): Promise<CrmActivity> {
  return apiFetch<CrmActivity>('/api/v1/crm-activities/calls', { method: 'POST', body: JSON.stringify(payload) });
}
export async function updateCrmCall(id: string, payload: Partial<CreateCallPayload>): Promise<CrmActivity> {
  return apiFetch<CrmActivity>(`/api/v1/crm-activities/calls/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
}
export async function deleteCrmCall(id: string): Promise<void> {
  await apiFetch<void>(`/api/v1/crm-activities/calls/${id}`, { method: 'DELETE' });
}

export interface CreateMeetingPayload {
  title: string; description?: string; start_datetime: string; end_datetime: string;
  status?: string; owner_id?: string; meeting_link?: string; location?: string;
  reminder_minutes?: number; related_lead_id?: string; related_contact_id?: string;
  related_company_id?: string; related_deal_id?: string;
}
export async function createCrmMeeting(payload: CreateMeetingPayload): Promise<any> {
  return apiFetch<any>('/api/v1/crm-activities/meetings', { method: 'POST', body: JSON.stringify(payload) });
}

export interface CreateNotePayload {
  title: string; body?: string; owner_id?: string; related_entity_type?: string;
  related_lead_id?: string; related_contact_id?: string;
  related_company_id?: string; related_deal_id?: string;
}
export async function createCrmNote(payload: CreateNotePayload): Promise<CrmActivity> {
  return apiFetch<CrmActivity>('/api/v1/crm-activities/notes', { method: 'POST', body: JSON.stringify(payload) });
}
export async function updateCrmNote(id: string, payload: Partial<CreateNotePayload>): Promise<CrmActivity> {
  return apiFetch<CrmActivity>(`/api/v1/crm-activities/notes/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
}
export async function deleteCrmNote(id: string): Promise<void> {
  await apiFetch<void>(`/api/v1/crm-activities/notes/${id}`, { method: 'DELETE' });
}

export async function bulkDeleteCrmActivities(ids: string[]): Promise<{ affected: number; message: string }> {
  return apiFetch<{ affected: number; message: string }>('/api/v1/crm-activities/bulk-delete', {
    method: 'POST', body: JSON.stringify({ ids }),
  });
}
export async function bulkUpdateCrmActivities(payload: { ids: string[]; status?: string; owner_id?: string; archive?: boolean }): Promise<{ affected: number; message: string }> {
  return apiFetch<{ affected: number; message: string }>('/api/v1/crm-activities/bulk-update', {
    method: 'POST', body: JSON.stringify(payload),
  });
}

// =============================================================================
// LEAD DETAIL PANEL  — real data for Timeline / Emails / Calls / Meetings / Chart
// =============================================================================

export interface LeadTimelineEntry {
  timeline_id: string;
  activity_type: string;
  title: string;
  description?: string | null;
  performed_by: string;
  performed_by_avatar?: string | null;
  icon: string;
  color: string;
  created_at: string;
  relative_time: string;
}

export interface LeadPanelCall {
  id: string;
  subject: string;
  call_type: string;
  outcome?: string | null;
  duration_minutes?: number | null;
  notes?: string | null;
  called_at?: string | null;
  owner_name?: string | null;
  created_at: string;
}

export interface LeadPanelMeeting {
  id: string;
  title: string;
  status: string;
  start_datetime: string;
  end_datetime: string;
  location?: string | null;
  meeting_link?: string | null;
  owner_name?: string | null;
}

export interface LeadPanelNote {
  id: string;
  title: string;
  body?: string | null;
  author_name: string;
  created_at: string;
  updated_at: string;
}

/** Fetch real timeline events for a lead */
export async function getLeadTimeline(
  leadId: string,
  params: { page?: number; page_size?: number } = {}
): Promise<{ entries: LeadTimelineEntry[]; total_records: number }> {
  const qs = toQuery({ page: params.page ?? 1, page_size: params.page_size ?? 20 } as any);
  const result = await apiFetch<any>(
    `/api/v1/crm-activities/lead/${leadId}/timeline${qs}`
  );
  return result ?? { entries: [], total_records: 0 };
}

/** Fetch emails linked to a lead (via Gmail sync) */
export async function getLeadEmails(leadId: string): Promise<SyncedEmail[]> {
  const result = await apiFetch<any>(
    `/api/v1/emails${toQuery({ external_entity_type: 'lead', external_entity_id: leadId, page_size: 50 } as any)}`
  );
  if (!result) return [];
  if (Array.isArray(result)) return result;
  if (result.data && Array.isArray(result.data)) return result.data;
  if (result.records && Array.isArray(result.records)) return result.records;
  return [];
}

/** Fetch calls linked to a lead */
export async function getLeadCalls(leadId: string): Promise<LeadPanelCall[]> {
  const result = await apiFetch<any>(
    `/api/v1/crm-activities/calls${toQuery({ related_lead_id: leadId, page_size: 50 } as any)}`
  );
  if (!result) return [];
  const items = result.data ?? result;
  return Array.isArray(items) ? items : [];
}

/** Fetch meetings linked to a lead */
export async function getLeadMeetings(leadId: string): Promise<LeadPanelMeeting[]> {
  const result = await apiFetch<any>(
    `/api/v1/meetings${toQuery({ related_lead_id: leadId, page_size: 50 } as any)}`
  );
  if (!result) return [];
  const items = result.data ?? result;
  return Array.isArray(items) ? items : [];
}

/** Fetch lead score for the chart */
export async function getLeadScore(leadId: string): Promise<{ score: number; fit_score: number; engagement_score: number } | null> {
  try {
    const result = await apiFetch<any>(`/api/v1/lead-scores/leads/${leadId}`);
    return result ?? null;
  } catch {
    return null;
  }
}

// =============================================================================
// AVATAR API
// =============================================================================

export async function deleteAvatar(): Promise<void> {
  const token = getToken();
  const res = await fetch(`${API_BASE_URL}/api/v1/uploads/avatars`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(detail.detail || 'Failed to remove avatar');
  }
}

// =============================================================================
// NOTIFICATIONS API
// =============================================================================

export interface NotificationData {
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

export interface NotificationListData {
  items: NotificationData[];
  total: number;
  unread_count: number;
}

export async function getNotifications(page = 1, pageSize = 20, unreadOnly = false): Promise<NotificationListData> {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (unreadOnly) params.set('unread_only', 'true');
  return apiFetch<NotificationListData>(`/api/v1/notifications?${params}`);
}

export async function getUnreadNotificationCount(): Promise<number> {
  const result = await apiFetch<{ unread_count: number }>('/api/v1/notifications/unread-count');
  return result?.unread_count ?? 0;
}

export async function markNotificationRead(id: string): Promise<NotificationData> {
  return apiFetch<NotificationData>(`/api/v1/notifications/${id}/read`, { method: 'POST' });
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiFetch(`/api/v1/notifications/read-all`, { method: 'POST' });
}

export async function dismissNotification(id: string): Promise<void> {
  await apiFetch(`/api/v1/notifications/${id}`, { method: 'DELETE' });
}

// =============================================================================
// EMAIL DRAFT API
// =============================================================================

export interface EmailDraftRequestPayload {
  recipient_name: string;
  recipient_email: string;
  company?: string;
  designation?: string;
  purpose?: 'cold_intro' | 'follow_up' | 'check_in' | 'proposal' | 'thank_you' | 'custom';
  context?: string;
  external_entity_type?: string | null;
  external_entity_id?: string | null;
}

export interface EmailDraftResult {
  subject: string;
  body: string;
  model_version?: string | null;
}

export async function draftOutreachEmail(payload: EmailDraftRequestPayload): Promise<EmailDraftResult> {
  return apiFetch<EmailDraftResult>('/api/v1/emails/draft-outreach', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

/** Shared shape passed from any "Send Email" trigger to the Emails page's compose panel. */
export interface EmailComposeTarget {
  to: string;
  name?: string;
  company?: string;
  designation?: string;
  purpose?: EmailDraftRequestPayload['purpose'];
  context?: string;
  externalEntityType?: string | null;
  externalEntityId?: string | null;
  /** Bumped on every open so EmailsView re-triggers even if the same contact is clicked twice. */
  requestId: number;
}

// =============================================================================
// CRM EMAIL ACTIVITY
// =============================================================================

export async function createCrmEmail(payload: CrmActivityPayload & {
  body?: string;
  direction?: string;
  recipient_email?: string;
  recipient_name?: string;
}): Promise<any> {
  return apiFetch('/api/v1/crm-activities/emails', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

// =============================================================================
// USER MANAGEMENT (soft-delete / restore / permanent-delete)
// =============================================================================

export async function getDeletedUsers(page = 1, pageSize = 20, search?: string): Promise<PaginatedResult<UserData>> {
  return apiFetch<PaginatedResult<UserData>>(`/api/v1/users/deleted${toQuery({ page, page_size: pageSize, search })}`);
}

export async function restoreUser(userId: string): Promise<UserData> {
  return apiFetch<UserData>(`/api/v1/users/${userId}/restore`, { method: 'POST' });
}

export async function permanentDeleteUser(userId: string): Promise<void> {
  await apiFetch<void>(`/api/v1/users/${userId}/permanent`, { method: 'DELETE' });
}

// =============================================================================
// GLOBAL SEARCH
// =============================================================================

// =============================================================================
// SALES REP AI INSIGHTS API  (/api/v1/ai-insights/sales-rep)
// =============================================================================

export interface SalesRepActionItem {
  lead_id: string;
  lead_name: string;
  company: string | null;
  score: number;
  reason: string;
  deal_id: string | null;
  deal_name: string | null;
  deal_value: number;
}

export interface SalesRepFollowUpItem {
  lead_id: string;
  lead_name: string;
  company: string | null;
  days_overdue: number;
  reason: string;
  deal_id: string | null;
  deal_value: number;
}

export interface SalesRepColdItem {
  lead_id: string;
  lead_name: string;
  company: string | null;
  score: number;
  reason: string;
  days_inactive: number;
  deal_id: string | null;
}

export interface SalesRepActionCenter {
  immediate_action: SalesRepActionItem[];
  follow_up_due: SalesRepFollowUpItem[];
  rising_interest: SalesRepActionItem[];
  going_cold: SalesRepColdItem[];
}

export interface SalesRepPipelineHealth {
  score: number;
  status: string;
  trend_label: string;
  explanation: string;
}

export interface SalesRepPriorityItem {
  priority_id: string;
  title: string;
  description: string;
  priority_level: string;
  related_lead: string | null;
  related_lead_id: string | null;
  related_deal: string | null;
  related_deal_id: string | null;
  related_company: string | null;
  deal_value: number;
  due_date: string | null;
}

export interface SalesRepSentimentBreakdown {
  positive: number;
  neutral: number;
  negative: number;
}

export interface SalesRepIntentItem {
  label: string;
  count: number;
}

export interface SalesRepRecentSummary {
  id: string;
  contact_name: string;
  company: string | null;
  summary: string;
  sentiment: string;
  category: string;
  follow_up_suggestion: string | null;
  date: string;
}

export interface SalesRepConversationIntelligence {
  sentiment: SalesRepSentimentBreakdown;
  intent_distribution: SalesRepIntentItem[];
  recent_summaries: SalesRepRecentSummary[];
  powered_by: string;
}

export interface SalesRepAIInsightsData {
  action_center: SalesRepActionCenter;
  pipeline_health: SalesRepPipelineHealth;
  daily_priorities: SalesRepPriorityItem[];
  conversation_intelligence: SalesRepConversationIntelligence;
  generated_at: string;
}

export async function getSalesRepAIInsights(): Promise<SalesRepAIInsightsData> {
  return apiFetch<SalesRepAIInsightsData>('/api/v1/ai-insights/sales-rep');
}

// =============================================================================
// GLOBAL SEARCH
// =============================================================================

export async function searchGlobalCRM(query: string) {
  const token = getToken();
  if (!token) {
    console.error('No auth token found for search');
    return [];
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/search?q=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Search failed with status: ${response.status}`);
    }

    const result = await response.json();
    return result.data || []; 
  } catch (error) {
    console.error('Error fetching global search:', error);
    return [];
  }
}
