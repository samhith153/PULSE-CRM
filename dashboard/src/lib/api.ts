import { toast } from "sonner";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

// Helper to get auth token from localStorage
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
}

// Standard response type
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Dashboard stats types
export interface DashboardStat {
  label: string;
  value: number;
  delta: number;
  spark?: number[];
}

export interface DashboardStats {
  total_revenue: number;
  won_deals: number;
  win_rate: number;
  avg_deal_size: number;
  avg_sales_cycle: number;
  revenue_delta: number;
  won_deals_delta: number;
  win_rate_delta: number;
  avg_deal_size_delta: number;
  avg_sales_cycle_delta: number;
}

export interface RevenuePoint {
  date: string;
  value: number;
}

export interface DealStage {
  name: string;
  value: number;
  color?: string;
}

export interface ActivityItem {
  icon: string;
  label: string;
  value: number;
}

export interface Insight {
  id: string;
  title: string;
  description: string;
  type: "info" | "warning" | "success" | "error";
  action_url?: string;
}

export interface DashboardData {
  stats: DashboardStats;
  revenue: RevenuePoint[];
  deals_by_stage: DealStage[];
  activities: ActivityItem[];
  insights: Insight[];
}

// Generic fetch wrapper
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const token = getAuthToken();
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options?.headers || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 401) {
        // Handle unauthorized - redirect to login
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth_token");
          window.location.href = "/login";
        }
        throw new Error("Unauthorized");
      }

      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data as ApiResponse<T>;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

// Dashboard API calls
export const dashboardApi = {
  // Get all dashboard data in one call
  async getDashboardData(): Promise<DashboardData> {
    try {
      const [statsResponse, revenueResponse] = await Promise.all([
        fetchApi<DashboardStats>("/dashboard/sales-rep"),
        fetchApi<RevenuePoint[]>("/dashboard/revenue"),
      ]);

      const stats = statsResponse.data;
      const revenue = revenueResponse.data;

      // Transform backend data to frontend format
      return {
        stats: {
          total_revenue: stats.total_revenue || 0,
          won_deals: stats.won_deals || 0,
          win_rate: stats.win_rate || 0,
          avg_deal_size: stats.avg_deal_size || 0,
          avg_sales_cycle: stats.avg_sales_cycle || 0,
          revenue_delta: stats.revenue_delta || 0,
          won_deals_delta: stats.won_deals_delta || 0,
          win_rate_delta: stats.win_rate_delta || 0,
          avg_deal_size_delta: stats.avg_deal_size_delta || 0,
          avg_sales_cycle_delta: stats.avg_sales_cycle_delta || 0,
        },
        revenue: revenue.map((r) => ({
          date: r.date,
          value: r.value,
        })),
        deals_by_stage: [],
        activities: [],
        insights: [],
      };
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      // Return empty data structure instead of throwing
      return {
        stats: {
          total_revenue: 0,
          won_deals: 0,
          win_rate: 0,
          avg_deal_size: 0,
          avg_sales_cycle: 0,
          revenue_delta: 0,
          won_deals_delta: 0,
          win_rate_delta: 0,
          avg_deal_size_delta: 0,
          avg_sales_cycle_delta: 0,
        },
        revenue: [],
        deals_by_stage: [],
        activities: [],
        insights: [],
      };
    }
  },

  // Get stats only
  async getStats(): Promise<DashboardStats> {
    const response = await fetchApi<DashboardStats>("/dashboard/sales-rep");
    return response.data;
  },

  // Get revenue series
  async getRevenue(): Promise<RevenuePoint[]> {
    const response = await fetchApi<RevenuePoint[]>("/dashboard/revenue");
    return response.data;
  },

  // Get deals by stage
  async getDealsByStage(): Promise<DealStage[]> {
    const response = await fetchApi<DealStage[]>("/dashboard/analytics");
    return response.data.deals_by_stage || [];
  },

  // Get activities
  async getActivities(): Promise<ActivityItem[]> {
    const response = await fetchApi<ActivityItem[]>("/activities/stats");
    return response.data || [];
  },

  // Get insights
  async getInsights(): Promise<Insight[]> {
    const response = await fetchApi<Insight[]>("/ai-insights/dashboard");
    return response.data || [];
  },
};

// CRM Entities API
export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: string;
  score?: number;
  created_at: string;
  owner_id: string;
}

export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company_id?: string;
  owner_id: string;
  created_at: string;
}

export interface Deal {
  id: string;
  name: string;
  amount: number;
  stage: string;
  probability: number;
  expected_close_date?: string;
  contact_id?: string;
  company_id?: string;
  owner_id: string;
  created_at: string;
}

export interface Company {
  id: string;
  name: string;
  industry?: string;
  website?: string;
  phone?: string;
  employees?: number;
  annual_revenue?: number;
  owner_id: string;
  created_at: string;
}

export interface Activity {
  id: string;
  type: string;
  subject: string;
  description?: string;
  status: string;
  due_date?: string;
  completed_at?: string;
  related_to_type?: string;
  related_to_id?: string;
  owner_id: string;
  created_at: string;
}

export const crmApi = {
  // Leads
  async getLeads(params?: { limit?: number; offset?: number; status?: string }): Promise<Lead[]> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());
    if (params?.status) queryParams.append("status", params.status);
    
    const url = `/leads${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    const response = await fetchApi<Lead[]>(url);
    return response.data || [];
  },

  async getLead(id: string): Promise<Lead> {
    const response = await fetchApi<Lead>(`/leads/${id}`);
    return response.data;
  },

  async createLead(data: Partial<Lead>): Promise<Lead> {
    const response = await fetchApi<Lead>("/leads", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.data;
  },

  async updateLead(id: string, data: Partial<Lead>): Promise<Lead> {
    const response = await fetchApi<Lead>(`/leads/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return response.data;
  },

  async deleteLead(id: string): Promise<void> {
    await fetchApi<void>(`/leads/${id}`, {
      method: "DELETE",
    });
  },

  // Contacts
  async getContacts(params?: { limit?: number; offset?: number }): Promise<Contact[]> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());
    
    const url = `/contacts${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    const response = await fetchApi<Contact[]>(url);
    return response.data || [];
  },

  async getContact(id: string): Promise<Contact> {
    const response = await fetchApi<Contact>(`/contacts/${id}`);
    return response.data;
  },

  async createContact(data: Partial<Contact>): Promise<Contact> {
    const response = await fetchApi<Contact>("/contacts", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.data;
  },

  async updateContact(id: string, data: Partial<Contact>): Promise<Contact> {
    const response = await fetchApi<Contact>(`/contacts/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return response.data;
  },

  async deleteContact(id: string): Promise<void> {
    await fetchApi<void>(`/contacts/${id}`, {
      method: "DELETE",
    });
  },

  // Deals
  async getDeals(params?: { limit?: number; offset?: number; stage?: string }): Promise<Deal[]> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());
    if (params?.stage) queryParams.append("stage", params.stage);
    
    const url = `/deals${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    const response = await fetchApi<Deal[]>(url);
    return response.data || [];
  },

  async getDeal(id: string): Promise<Deal> {
    const response = await fetchApi<Deal>(`/deals/${id}`);
    return response.data;
  },

  async createDeal(data: Partial<Deal>): Promise<Deal> {
    const response = await fetchApi<Deal>("/deals", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.data;
  },

  async updateDeal(id: string, data: Partial<Deal>): Promise<Deal> {
    const response = await fetchApi<Deal>(`/deals/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return response.data;
  },

  async deleteDeal(id: string): Promise<void> {
    await fetchApi<void>(`/deals/${id}`, {
      method: "DELETE",
    });
  },

  // Companies
  async getCompanies(params?: { limit?: number; offset?: number }): Promise<Company[]> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());
    
    const url = `/companies${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    const response = await fetchApi<Company[]>(url);
    return response.data || [];
  },

  async getCompany(id: string): Promise<Company> {
    const response = await fetchApi<Company>(`/companies/${id}`);
    return response.data;
  },

  async createCompany(data: Partial<Company>): Promise<Company> {
    const response = await fetchApi<Company>("/companies", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.data;
  },

  async updateCompany(id: string, data: Partial<Company>): Promise<Company> {
    const response = await fetchApi<Company>(`/companies/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return response.data;
  },

  async deleteCompany(id: string): Promise<void> {
    await fetchApi<void>(`/companies/${id}`, {
      method: "DELETE",
    });
  },

  // Activities
  async getActivities(params?: { 
    limit?: number; 
    offset?: number; 
    type?: string;
    status?: string;
  }): Promise<Activity[]> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());
    if (params?.type) queryParams.append("type", params.type);
    if (params?.status) queryParams.append("status", params.status);
    
    const url = `/activities${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    const response = await fetchApi<Activity[]>(url);
    return response.data || [];
  },

  async getActivity(id: string): Promise<Activity> {
    const response = await fetchApi<Activity>(`/activities/${id}`);
    return response.data;
  },

  async createActivity(data: Partial<Activity>): Promise<Activity> {
    const response = await fetchApi<Activity>("/activities", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.data;
  },

  async updateActivity(id: string, data: Partial<Activity>): Promise<Activity> {
    const response = await fetchApi<Activity>(`/activities/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return response.data;
  },

  async completeActivity(id: string): Promise<Activity> {
    const response = await fetchApi<Activity>(`/activities/${id}/complete`, {
      method: "POST",
    });
    return response.data;
  },

  async deleteActivity(id: string): Promise<void> {
    await fetchApi<void>(`/activities/${id}`, {
      method: "DELETE",
    });
  },
};

// Auth API
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    organization_id: string;
  };
}

export const authApi = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Login failed");
    }

    const data = await response.json();
    return data;
  },

  async signup(userData: {
    email: string;
    password: string;
    name: string;
    organization_name?: string;
  }): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Signup failed");
    }

    const data = await response.json();
    return data;
  },

  async logout(): Promise<void> {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
    }
  },

  async getCurrentUser(): Promise<LoginResponse["user"] | null> {
    try {
      const response = await fetchApi<LoginResponse["user"]>("/users/me");
      return response.data;
    } catch {
      return null;
    }
  },
};

export default {
  dashboard: dashboardApi,
  crm: crmApi,
  auth: authApi,
};
