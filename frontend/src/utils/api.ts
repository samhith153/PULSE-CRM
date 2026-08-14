import { toast } from '@/lib/toast';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').trim().replace(/\/+$/, '');
const TOKEN_KEY = 'pulse-crm-token';
const REFRESH_TOKEN_KEY = 'pulse-crm-refresh-token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string): void {
  sessionStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function clearToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// ── Silent token refresh (deduplicated) ─────────────────────────────────────

let _refreshPromise: Promise<boolean> | null = null;

// ── In-flight GET deduplication ────────────────────────────────────────────

const _inflight = new Map<string, Promise<unknown>>();

// ── Short-TTL GET response cache (dashboard-heavy endpoints only) ──────────
// Dashboard/AI views unmount on tab switch and re-fetch on every mount.
// A short cache makes returning to home/AI insights feel instant while still
// refreshing within the TTL window.

const _getCache = new Map<string, { t: number; p: Promise<unknown> }>();
const _CACHE_TTL_MS = 60_000;

function cachedGet<T>(endpoint: string, ttlMs = _CACHE_TTL_MS): Promise<T> {
  const hit = _getCache.get(endpoint);
  if (hit && Date.now() - hit.t < ttlMs) return hit.p as Promise<T>;
  const p = apiFetch<T>(endpoint);
  _getCache.set(endpoint, { t: Date.now(), p });
  p.catch(() => {
    if (_getCache.get(endpoint)?.p === p) _getCache.delete(endpoint);
  });
  return p;
}

async function _tryRefresh(): Promise<boolean> {
  const rt = getRefreshToken();
  if (!rt) return false;
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: rt }),
    });
    if (!res.ok) return false;
    const json = await res.json();
    const data = json.data ?? json;
    if (data?.access_token) {
      setToken(data.access_token);
      if (data.refresh_token) setRefreshToken(data.refresh_token);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

async function refreshIfNeeded(): Promise<boolean> {
  if (!_refreshPromise) {
    _refreshPromise = _tryRefresh().finally(() => { _refreshPromise = null; });
  }
  return _refreshPromise;
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
  owner_avatar_url?: string | null;
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
  stage_slug?: string | null;
  stage_name?: string | null;
  lead_name?: string | null;
  lead_email?: string | null;
  lead_score?: number | null;
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
  const data = json.data ?? json;
  if (data?.refresh_token) setRefreshToken(data.refresh_token);
  return data;
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
  const data = json.data ?? json;
  if (data?.refresh_token) setRefreshToken(data.refresh_token);
  return data;
}

export async function getAuthConfig(): Promise<{ google_client_id: string | null }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/config`);
  if (!res.ok) {
    throw new Error(`Failed to load auth config (${res.status})`);
  }
  const json = await res.json();
  return json.data ?? json;
}

export async function getGoogleAuthUrl(): Promise<{ auth_url: string; state: string }> {
  // Same-origin request: next.config.ts rewrites /api/v1/* to the backend,
  // so this works from localhost, the LAN address, or any device with no CORS.
  const res = await fetch(`/api/v1/auth/google/auth-url`);
  if (!res.ok) {
    throw new Error(`Failed to load Google auth URL (${res.status})`);
  }
  const json = await res.json();
  const data = json.data ?? json;
  if (!data?.auth_url) {
    throw new Error('Google auth is not configured. Please set GOOGLE_CLIENT_ID on the server.');
  }
  return { auth_url: data.auth_url, state: data.state };
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
  const data = json.data ?? json;
  if (data?.refresh_token) setRefreshToken(data.refresh_token);
  return data;
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
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `${base}${cleanUrl}`;
}


async function apiFetch<T>(endpoint: string, options?: RequestInit, _retry = true): Promise<T> {
  const token = getToken();
  if (!token) {
    return undefined as T;
  }

  // Deduplicate concurrent identical GET requests
  const method = options?.method?.toUpperCase() ?? 'GET';
  if (method === 'GET') {
    const key = `GET:${endpoint}`;
    if (_inflight.has(key)) {
      return _inflight.get(key) as Promise<T>;
    }
    const promise = _apiFetchInner<T>(endpoint, options, _retry);
    _inflight.set(key, promise);
    promise.finally(() => _inflight.delete(key));
    return promise;
  }

  return _apiFetchInner<T>(endpoint, options, _retry);
}

async function _apiFetchInner<T>(endpoint: string, options?: RequestInit, _retry = true): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...(options?.headers || {})
      }
    });
  } catch (err: any) {
    // Network error — server unreachable, DNS failure, CORS block, etc.
    const msg = err?.message === 'Failed to fetch'
      ? 'Network error — could not reach the server. Please check your connection.'
      : `Network error: ${err?.message || 'Unknown failure'}`;
    toast.error(msg, { duration: 6000 });
    throw new Error(msg);
  }

  // On 401, attempt a single silent refresh then retry
  if (res.status === 401 && _retry) {
    const refreshed = await refreshIfNeeded();
    if (refreshed) {
      res = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
          ...(options?.headers || {})
        }
      });
    }
    if (!refreshed || res.status === 401) {
      clearToken();
      sessionStorage.removeItem('pulse-crm-auth');
      toast.error('Session expired. Please log in again.');
      window.location.href = '/login';
      throw new Error('Session expired');
    }
  }
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    let errorDetail = '';
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
      errorDetail = body?.error_code || '';
    } catch {
    }
    // Show a toast for every non-2xx error so failures are never silent.
    if (res.status === 403) {
      toast.error(`Permission denied: ${message}`);
    } else if (res.status === 429) {
      toast.error('Too many requests. Please wait a moment and try again.');
    } else if (res.status === 401) {
      // Should not reach here (handled above), but guard anyway.
      toast.error('Authentication required.');
    } else if (res.status === 404) {
      toast.warning(`Not found: ${message}`);
    } else if (res.status === 422 || res.status === 400) {
      toast.warning(message);
    } else if (res.status >= 500) {
      toast.error(`Server error: ${message}`);
    } else {
      toast.warning(message);
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

export async function updateLeadStatus(leadId: string, status: string, closeReason?: string): Promise<Lead> {
  return apiFetch<Lead>(`/api/v1/leads/${leadId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, close_reason: closeReason || undefined })
  });
}

export async function deleteLead(leadId: string): Promise<void> {
  await apiFetch<void>(`/api/v1/leads/${leadId}`, { method: 'DELETE' });
}

// --- Recycle Bin (admin-only purge of soft-deleted leads) ---

/** List soft-deleted (archived) leads — admin only. */
export async function getDeletedLeads(
  page = 1,
  pageSize = 20,
  search?: string
): Promise<PaginatedResult<Lead>> {
  return apiFetch<PaginatedResult<Lead>>(
    `/api/v1/leads/deleted${toQuery({ page, page_size: pageSize, search })}`
  );
}

/** Permanently delete one soft-deleted lead — admin only. */
export async function permanentlyDeleteLead(leadId: string): Promise<void> {
  await apiFetch<void>(`/api/v1/leads/${leadId}/permanent`, { method: 'DELETE' });
}

/** Permanently delete ALL soft-deleted leads in the org — admin only. */
export async function purgeDeletedLeads(): Promise<{ purged: number }> {
  return apiFetch<{ purged: number }>('/api/v1/leads/purge-deleted', { method: 'POST' });
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

// =============================================================================
// AI LEAD WORKFLOW
// =============================================================================

export interface WorkflowTask {
  id: string;
  lead_id: string;
  source_recommendation_id?: string | null;
  action_type: string;
  reasoning?: string | null;
  priority: string;
  current_stage?: string | null;
  status: string;
  stall_count: number;
  due_at: string;
  completed_at?: string | null;
}

export interface LeadWorkflowResponse {
  current_task: WorkflowTaskItem | null;
  history: WorkflowTaskItem[];
}

/**
 * Fetch the AI-driven workflow for a lead.
 *
 * Backend:
 * GET /api/v1/workflows/leads/{lead_id}
 */


// ============================================================
// AI WORKFLOW TASKS
// ============================================================
// ============================================================
// AI WORKFLOW API
// Replace ONLY your existing workflow-related interfaces/functions
// with this block. Do not replace the entire api.ts file.
// ============================================================

export interface WorkflowTaskItem {
  id: string;
  lead_id: string;
  source_recommendation_id?: string | null;
  action_type: string;
  reasoning?: string | null;
  priority: string;
  current_stage?: string | null;
  status: string;
  stall_count: number;
  due_at: string;
  completed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}



/**
 * Fetch the workflow for one lead.
 *
 * IMPORTANT:
 * Backend route is /api/v1/workflow (singular), not /workflows.
 */
export async function getLeadWorkflow(
  leadId: string
): Promise<LeadWorkflowResponse> {
  const result = await apiFetch<any>(
    `/api/v1/workflows/leads/${leadId}`
  );

  if (!result) {
    return {
      current_task: null,
      history: [],
    };
  }

  const data = result?.data ?? result;

  return {
    current_task: data?.current_task ?? null,
    history: Array.isArray(data?.history)
      ? data.history
      : [],
  };
}

/**
 * Complete ONE workflow task.
 *
 * IMPORTANT:
 * Pass the workflow task ID, NOT the lead ID.
 */
export async function completeWorkflowTask(
  taskId: string
): Promise<WorkflowTaskItem> {
  const result = await apiFetch<any>(
    `/api/v1/workflows/tasks/${taskId}/complete`,
    {
      method: 'POST',
    }
  );

  return (result?.data ?? result) as WorkflowTaskItem;
}


/**
 * Optional task-list endpoint.
 * The Workflow page above does not need this function,
 * but keeping it here is useful for other components.
 */
export async function getWorkflowTasks(
  status?: string
): Promise<WorkflowTaskItem[]> {
  const query = status
    ? `?status=${encodeURIComponent(status)}`
    : '';

  const result = await apiFetch<any>(
    `/api/v1/workflows/tasks${query}`
  );

  if (!result) return [];

  const data = result?.data ?? result;

  return Array.isArray(data) ? data : [];
}
/**
 * Complete an AI workflow task.
 */
export interface WorkflowTaskResponse {
  id: string;
  lead_id: string;
  source_recommendation_id?: string | null;
  action_type: string;
  reasoning?: string | null;
  priority: string;
  current_stage?: string | null;
  status: string;
  stall_count: number;
  due_at: string;
  completed_at?: string | null;
  created_at?: string;
  updated_at?: string;
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
  return dbDeals.map((dd) => ({
    ...dd,
    title: dd.name || `Deal ${dd.id}`,
    company: dd.company_name || dd.company?.name || '',
    value: Number(dd.amount || 0),
    stage: dd.stage_name || dd.stage_slug || 'New',
    owner: dd.owner_name || dd.owner || '',
    closeDate: dd.expected_close_date || '',
    createdAt: dd.created_at || dd.createdAt || new Date().toISOString(),
  })) as unknown as Deal[];
}

export async function updateDealStage(
  dealId: string | number,
  stageId: string,
  closeReason?: string
): Promise<any> {
  return apiFetch(`/api/v1/pipeline/move`, {
    method: 'PATCH',
    body: JSON.stringify({
      deal_id: dealId,
      stage_id: stageId,
      ...(closeReason ? { close_reason: closeReason } : {}),
    }),
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
  user_management?: {
    active_seats: number;
    invites_pending?: number;
    role_distribution: { role_name: string; count: number }[];
  };
  system_health?: {
    services: { service: string; status: string; message?: string }[];
    critical_logs_24h?: number;
    warning_logs_24h?: number;
  };
  data_quality?: {
    duplicates_detected: number;
    incomplete_fields: number;
    orphaned_leads: number;
  };
  license_usage?: {
    storage_used?: number;
    storage_limit?: number;
    active_seats: number;
    seat_limit?: number;
    usage_percentage?: number;
  };
  integrations?: { integration: string; status: string; last_sync?: string; message?: string }[];
  custom_fields?: {
    custom_fields_active?: number;
    custom_fields_idle?: number;
    automations_active: number;
    automations_idle: number;
    lead_scoring_usage: number;
  };
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
  rep_quota_attainment: { user_id: string; full_name: string; assigned_target: Decimal | null; revenue_generated: Decimal; quota_achievement_pct: Decimal; rank: number }[];
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
  activity_overview?: { emails_sent: number; calls_made: number; meetings_held: number; tasks_completed: number; notes_added: number } | null;
}

export async function getAdminDashboard(): Promise<AdminDashboardData> {
  return cachedGet<AdminDashboardData>('/api/v1/dashboard/admin');
}

export type ManagerDashboardPeriod =
  | 'week'
  | 'month'
  | 'quarter'
  | 'year';

export interface ManagerDashboardFilters {
  period?: ManagerDashboardPeriod;
  repId?: string;
}

export async function getManagerDashboard(
  filters: ManagerDashboardFilters = {}
): Promise<ManagerDashboardData> {
  return cachedGet<ManagerDashboardData>(
    `/api/v1/dashboard/manager${toQuery({
      period: filters.period ?? 'quarter',
      rep_id: filters.repId,
    })}`
  );
}

export async function getSalesRepDashboard(period: 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<SalesRepDashboardData> {
  return cachedGet<SalesRepDashboardData>(`/api/v1/dashboard/sales-rep${toQuery({ period })}`);
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
  manager_id?: string | null;
  manager_name?: string | null;
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

// --- Manager ↔ Sales Representative hierarchy API ---

/** List active manager-role users in the org (admin assignment picker). */
export async function getManagers(): Promise<UserData[]> {
  const res = await apiFetch<any>('/api/v1/users/managers');
  return Array.isArray(res) ? res : (res?.data ?? []);
}

/** Manager-only: list the sales reps assigned to the calling manager. */
export async function getMyTeam(): Promise<UserData[]> {
  const res = await apiFetch<any>('/api/v1/users/my-team');
  return Array.isArray(res) ? res : (res?.data ?? []);
}

/**
 * Assign a sales rep to a manager, or pass null to remove the assignment.
 * Admin only.
 */
export async function assignUserManager(userId: string, managerId: string | null): Promise<UserData> {
  if (managerId) {
    return apiFetch<UserData>(`/api/v1/users/${userId}/manager`, {
      method: 'POST',
      body: JSON.stringify({ manager_id: managerId })
    });
  }
  return apiFetch<UserData>(`/api/v1/users/${userId}/manager`, { method: 'DELETE' });
}

// --- Sales Target API (manager assigns per-rep targets) ---

export interface SalesTargetData {
  id: string | null;
  rep_id: string;
  rep_name: string;
  rep_email: string;
  target_type: string;
  target_amount: number;
  period_type: string;
  period_start: string;
  period_end: string;
  notes?: string | null;
  actual_amount?: number;
  achievement_pct?: number;
  remaining?: number;
  status?: string;
  created_at?: string;
}

export interface SalesTargetCreatePayload {
  rep_id: string;
  target_type: string;
  target_amount: number;
  period_type: string;
  period_start: string;
  period_end: string;
  notes?: string;
}

/** Current-period targets for the visible reps (admins: all, managers: their team). */
export async function getCurrentTargets(periodType: string = 'monthly'): Promise<SalesTargetData[]> {
  const res = await apiFetch<any>(`/api/v1/targets/current${toQuery({ period_type: periodType })}`);
  const data = Array.isArray(res) ? res : (res?.targets ?? []);
  return data;
}

export async function createSalesTarget(payload: SalesTargetCreatePayload): Promise<SalesTargetData> {
  return apiFetch<SalesTargetData>('/api/v1/targets', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function updateSalesTarget(targetId: string, payload: { target_amount?: number; notes?: string }): Promise<SalesTargetData> {
  return apiFetch<SalesTargetData>(`/api/v1/targets/${targetId}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export async function deleteSalesTarget(targetId: string): Promise<void> {
  await apiFetch<void>(`/api/v1/targets/${targetId}`, { method: 'DELETE' });
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

// --- Assistant AI API ---
export async function sendAssistantChatMessage(message: string, context?: Record<string, any>): Promise<{ response: string; role?: string }> {
  return apiFetch<{ response: string; role?: string }>('/api/v1/assistant/chat', {
    method: 'POST',
    body: JSON.stringify({ message, context: context || {} })
  });
}

// --- Tasks API ---
export async function getTasks(params?: { status?: string; lead_id?: string; deal_id?: string }): Promise<any[]> {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  if (params?.lead_id) query.append('lead_id', params.lead_id);
  if (params?.deal_id) query.append('deal_id', params.deal_id);
  const qStr = query.toString();
  const res = await apiFetch<any>(`/api/v1/tasks${qStr ? `?${qStr}` : ''}`);
  return Array.isArray(res) ? res : (res?.data ?? []);
}

export async function createTask(taskData: any): Promise<any> {
  return apiFetch('/api/v1/tasks', {
    method: 'POST',
    body: JSON.stringify(taskData)
  });
}

export async function updateTask(taskId: string, taskData: any): Promise<any> {
  return apiFetch(`/api/v1/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(taskData)
  });
}

export async function deleteTask(taskId: string): Promise<void> {
  await apiFetch<void>(`/api/v1/tasks/${taskId}`, { method: 'DELETE' });
}

// --- Calendar & Meetings API ---
export async function getCalendarEvents(start?: string, end?: string): Promise<any[]> {
  const query = new URLSearchParams();
  if (start) query.append('start', start);
  if (end) query.append('end', end);
  const qStr = query.toString();
  const res = await apiFetch<any>(`/api/v1/calendar/events${qStr ? `?${qStr}` : ''}`);
  return Array.isArray(res) ? res : (res?.data ?? []);
}

export async function createCalendarEvent(eventData: any): Promise<any> {
  return apiFetch('/api/v1/calendar/events', {
    method: 'POST',
    body: JSON.stringify(eventData)
  });
}

export async function getMeetings(): Promise<any[]> {
  const res = await apiFetch<any>('/api/v1/meetings');
  return Array.isArray(res) ? res : (res?.data ?? []);
}

export async function createMeeting(meetingData: any): Promise<any> {
  return apiFetch('/api/v1/meetings', {
    method: 'POST',
    body: JSON.stringify(meetingData)
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
  priority_queue: { lead_id: string; first_name: string; last_name: string; company_name?: string; email: string; score: number; tier: string; top_reason?: string; top_reasons?: string[] }[];
  deals_at_risk: { deal_id: string; deal_title: string; value: Decimal; stalled_days: number; risk_reason: string; sentiment?: string; probability?: number; company_name?: string | null; owner_name?: string | null }[];
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
// The stream authenticates via the Authorization header (fetch-based SSE),
// so the URL carries no token — JWTs in query strings leak into logs/history.
export function getDashboardStreamUrl(): string | null {
  return `${API_BASE_URL}/api/v1/stream/dashboard`;
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
  const res = await fetch(`${API_BASE_URL}/api/v1/documents/upload`, {
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

export async function getDocumentSignedUrl(docId: string): Promise<{ url: string; expires_at: string }> {
  return apiFetch<{ url: string; expires_at: string }>(`/api/v1/documents/${docId}/url`);
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

export async function getCrmActivity(activityId: string): Promise<CrmActivity> {
  return apiFetch<CrmActivity>(`/api/v1/crm-activities/${activityId}`);
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
// LEAD DETAIL PANEL  ΓÇö real data for Timeline / Emails / Calls / Meetings / Chart
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

export interface CreateEmailPayload {
  subject: string;
  body?: string;
  direction?: string;
  recipient_email?: string;
  recipient_name?: string;
  priority?: string;
  status?: string;
  related_entity_type?: string;
  related_lead_id?: string;
  related_contact_id?: string;
  related_company_id?: string;
  related_deal_id?: string;
}

export async function createCrmEmail(payload: CreateEmailPayload): Promise<any> {
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
  trend?: string | null;
  change?: string | null;
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
  return cachedGet<SalesRepAIInsightsData>('/api/v1/ai-insights/sales-rep');
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


// ΓöÇΓöÇ Report Types & API Functions ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

export interface ReportParams {
  period?: 'week' | 'month' | 'quarter' | 'year';
  rep_id?: string;
}

export interface RevenueByRep {
  rep_id: string;
  rep_name: string;
  revenue: number;
  deal_count: number;
  avg_deal_value: number;
}

export interface WinRateByRep {
  rep_id: string;
  rep_name: string;
  won: number;
  lost: number;
  total_closed: number;
  win_rate: number;
}

export interface QuotaAttainment {
  rep_id: string;
  rep_name: string;
  target: number;
  actual: number;
  achievement_pct: number;
  remaining: number;
}

export interface TopPerformer {
  rank: number;
  rep_id: string;
  rep_name: string;
  revenue: number;
  win_rate: number;
  quota_pct: number;
}

export interface BottomPerformer {
  rep_id: string;
  rep_name: string;
  revenue: number;
  quota_pct: number;
  gap: number;
}

export interface SalesPerformanceReport {
  revenue_by_rep: RevenueByRep[];
  win_rate_by_rep: WinRateByRep[];
  quota_attainment: QuotaAttainment[];
  top_performers: TopPerformer[];
  bottom_performers: BottomPerformer[];
  total_revenue: number;
  team_win_rate: number;
}

export interface PipelineByStage {
  stage: string;
  stage_slug: string;
  deal_count: number;
  total_value: number;
  percentage: number;
}

export interface StageConversion {
  from_stage: string;
  to_stage: string;
  count: number;
  conversion_pct: number;
}

export interface PipelineAging {
  bucket: string;
  count: number;
  value: number;
}

export interface StalledDeal {
  deal_id: string;
  deal_name: string;
  owner_name: string;
  stage: string;
  value: number;
  days_inactive: number;
}

export interface AvgTimeInStage {
  stage: string;
  avg_days: number;
}

export interface PipelineAnalyticsReport {
  pipeline_by_stage: PipelineByStage[];
  stage_conversion: StageConversion[];
  pipeline_aging: PipelineAging[];
  stalled_deals: StalledDeal[];
  avg_time_in_stage: AvgTimeInStage[];
}

export interface LeaderboardEntry {
  rank: number;
  rep_id: string;
  rep_name: string;
  revenue: number;
  deals_won: number;
  win_rate: number;
  quota_pct: number;
  avg_deal_size: number;
  sales_cycle_days: number;
}

export interface RepComparison {
  rep_id: string;
  rep_name: string;
  revenue: number;
  win_rate: number;
  deals_won: number;
  quota_pct: number;
  sales_cycle_days: number;
  avg_deal_size: number;
}

export interface PerformanceVsPrior {
  metric: string;
  current: number;
  previous: number;
  change_pct: number;
}

export interface TeamPerformanceReport {
  leaderboard: LeaderboardEntry[];
  rep_comparison: RepComparison[];
  sales_cycle_by_rep: SalesCycleByRep[];
  performance_vs_prior: PerformanceVsPrior[];
}

export interface SalesCycleByRep {
  rep_id: string;
  rep_name: string;
  avg_cycle_days: number;
  deal_count: number;
}

export interface ActivitySummary {
  calls: number;
  emails: number;
  meetings: number;
  tasks: number;
  notes: number;
  total: number;
}

export interface ActivityByRep {
  rep_id: string;
  rep_name: string;
  calls: number;
  emails: number;
  meetings: number;
  tasks: number;
  total: number;
}

export interface CompletedVsOverdue {
  completed: number;
  overdue: number;
  pending: number;
  completion_rate: number;
}

export interface ActivityAnalyticsReport {
  activity_summary: ActivitySummary;
  activity_by_rep: ActivityByRep[];
  activity_trend: ActivityTrendPoint[];
  completed_vs_overdue: CompletedVsOverdue;
  activity_to_deal: ActivityToDeal;
}

export interface ActivityTrendPoint {
  period: string;
  calls: number;
  emails: number;
  meetings: number;
  tasks: number;
  total: number;
}

export interface ActivityToDeal {
  total_deals: number;
  deals_with_high_activity: number;
  deals_with_low_activity: number;
  high_activity_win_rate: number;
  low_activity_win_rate: number;
  insight: string;
}

export interface SourcePerformance {
  source: string;
  total: number;
  qualified: number;
  converted: number;
  conversion_pct: number;
}

export interface ConversionFunnelStage {
  stage: string;
  count: number;
  percentage: number;
}

export interface LeadAging {
  bucket: string;
  count: number;
}

export interface LeadAnalyticsReport {
  source_performance: SourcePerformance[];
  conversion_funnel: ConversionFunnelStage[];
  conversion_by_rep: ConversionByRep[];
  lead_aging: LeadAging[];
  total_leads: number;
  overall_conversion_rate: number;
}

export interface ConversionByRep {
  rep_id: string;
  rep_name: string;
  total_leads: number;
  converted: number;
  conversion_pct: number;
}

export interface WonDealItem {
  deal_id: string;
  deal_name: string;
  owner_name: string;
  amount: number;
  close_date: string;
  sales_cycle_days: number;
}

export interface LostDealItem {
  deal_id: string;
  deal_name: string;
  owner_name: string;
  amount: number;
  close_date: string;
  lost_reason: string;
}

export interface LostReasonAnalysis {
  reason: string;
  count: number;
  percentage: number;
}

export interface DealSizeStats {
  current: number;
  previous: number;
  change_pct: number;
}

export interface DealClosingSoon {
  deal_id: string;
  deal_name: string;
  owner_name: string;
  amount: number;
  expected_close_date: string;
  days_until: number;
  stage: string;
}

export interface AtRiskDeal {
  deal_id: string;
  deal_name: string;
  owner_name: string;
  stage: string;
  value: number;
  risk_reason: string;
  days_inactive: number;
}

export interface DealAnalyticsReport {
  won_deals: WonDealItem[];
  lost_deals: LostDealItem[];
  lost_reason_analysis: LostReasonAnalysis[];
  avg_deal_size: DealSizeStats;
  deals_closing_soon: DealClosingSoon[];
  at_risk_deals: AtRiskDeal[];
  total_won: number;
  total_lost: number;
  total_won_value: number;
  total_lost_value: number;
}

export async function getSalesPerformanceReport(params?: ReportParams): Promise<SalesPerformanceReport> {
  return apiFetch<SalesPerformanceReport>(
    `/api/v1/reports/sales-performance${toQuery({ period: params?.period, rep_id: params?.rep_id })}`
  );
}

export async function getPipelineAnalyticsReport(params?: ReportParams): Promise<PipelineAnalyticsReport> {
  return apiFetch<PipelineAnalyticsReport>(
    `/api/v1/reports/pipeline-analytics${toQuery({ period: params?.period })}`
  );
}

export async function getTeamPerformanceReport(params?: ReportParams): Promise<TeamPerformanceReport> {
  return apiFetch<TeamPerformanceReport>(
    `/api/v1/reports/team-performance${toQuery({ period: params?.period, rep_id: params?.rep_id })}`
  );
}

export async function getActivityAnalyticsReport(params?: ReportParams): Promise<ActivityAnalyticsReport> {
  return apiFetch<ActivityAnalyticsReport>(
    `/api/v1/reports/activity-analytics${toQuery({ period: params?.period })}`
  );
}

export async function getLeadAnalyticsReport(params?: ReportParams): Promise<LeadAnalyticsReport> {
  return apiFetch<LeadAnalyticsReport>(
    `/api/v1/reports/lead-analytics${toQuery({ period: params?.period })}`
  );
}

export async function getDealAnalyticsReport(params?: ReportParams): Promise<DealAnalyticsReport> {
  return apiFetch<DealAnalyticsReport>(
    `/api/v1/reports/deal-analytics${toQuery({ period: params?.period })}`
  );
}

export async function recomputeLeadScore(leadId: string): Promise<any> {
  return apiFetch<any>(`/api/v1/lead-scores/leads/${leadId}/recompute`, {
    method: 'POST'
  });
}
