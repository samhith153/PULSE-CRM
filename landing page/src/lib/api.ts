const API_BASE = (import.meta.env.VITE_API_URL ?? "http://localhost:8000").replace(/\/+$/, "");
const TOKEN_KEY = "pulse-crm-token";

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string) {
  sessionStorage.setItem(TOKEN_KEY, token);
}
function authHeaders(): Record<string, string> {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function post<T>(path: string, body: unknown, auth = false): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(auth ? authHeaders() : {}),
    },
    body: JSON.stringify(body),
  });

  let json: any;
  try {
    json = await res.json();
  } catch {
    throw new Error(`Server error (${res.status})`);
  }

  if (!res.ok) {
    // Extract the most useful message from FastAPI's error shapes
    const msg =
      json?.message ||
      json?.detail ||
      (Array.isArray(json?.details) && json.details[0]?.message) ||
      `Request failed (${res.status})`;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }

  return (json?.data ?? json) as T;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...authHeaders() },
  });

  let json: any;
  try {
    json = await res.json();
  } catch {
    throw new Error(`Server error (${res.status})`);
  }

  if (!res.ok) {
    const msg = json?.message || json?.detail || `Request failed (${res.status})`;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }

  return (json?.data ?? json) as T;
}

/* ─── Auth endpoints ─────────────────────────────────────────────────── */

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface CurrentUser {
  id: string;
  email: string;
  full_name: string;
  organization_id: string;
  roles: string[];
  is_verified: boolean;
  is_superuser: boolean;
}

export async function apiLogin(email: string, password: string): Promise<AuthTokens> {
  return post<AuthTokens>("/api/v1/auth/login", { email, password });
}

export async function apiRegister(
  fullName: string,
  email: string,
  password: string,
  organizationName: string,
): Promise<AuthTokens> {
  return post<AuthTokens>("/api/v1/auth/register", {
    full_name: fullName,
    email,
    password,
    organization_name: organizationName,
  });
}

export async function apiLoginWithGoogle(credential: string): Promise<AuthTokens> {
  return post<AuthTokens>("/api/v1/auth/google", { credential });
}

export async function getCurrentUser(): Promise<CurrentUser> {
  return get<CurrentUser>("/api/v1/auth/me");
}
