import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardApi, crmApi, authApi, type LoginRequest } from "@/lib/api";

// Query keys
export const queryKeys = {
  dashboard: {
    all: ["dashboard"] as const,
    stats: () => [...queryKeys.dashboard.all, "stats"] as const,
    revenue: () => [...queryKeys.dashboard.all, "revenue"] as const,
    dealsByStage: () => [...queryKeys.dashboard.all, "deals-by-stage"] as const,
    activities: () => [...queryKeys.dashboard.all, "activities"] as const,
    insights: () => [...queryKeys.dashboard.all, "insights"] as const,
  },
  leads: {
    all: ["leads"] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.leads.all, "list", filters] as const,
    detail: (id: string) => [...queryKeys.leads.all, "detail", id] as const,
  },
  contacts: {
    all: ["contacts"] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.contacts.all, "list", filters] as const,
    detail: (id: string) => [...queryKeys.contacts.all, "detail", id] as const,
  },
  deals: {
    all: ["deals"] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.deals.all, "list", filters] as const,
    detail: (id: string) => [...queryKeys.deals.all, "detail", id] as const,
  },
  companies: {
    all: ["companies"] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.companies.all, "list", filters] as const,
    detail: (id: string) => [...queryKeys.companies.all, "detail", id] as const,
  },
  activities: {
    all: ["activities"] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.activities.all, "list", filters] as const,
    detail: (id: string) => [...queryKeys.activities.all, "detail", id] as const,
  },
  auth: {
    user: ["auth", "user"] as const,
  },
};

// Dashboard hooks
export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: () => dashboardApi.getStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

export function useDashboardRevenue() {
  return useQuery({
    queryKey: queryKeys.dashboard.revenue(),
    queryFn: () => dashboardApi.getRevenue(),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

export function useDealsByStage() {
  return useQuery({
    queryKey: queryKeys.dashboard.dealsByStage(),
    queryFn: () => dashboardApi.getDealsByStage(),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

export function useActivityStats() {
  return useQuery({
    queryKey: queryKeys.dashboard.activities(),
    queryFn: () => dashboardApi.getActivities(),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

export function useDashboardInsights() {
  return useQuery({
    queryKey: queryKeys.dashboard.insights(),
    queryFn: () => dashboardApi.getInsights(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
}

export function useDashboardData() {
  return useQuery({
    queryKey: queryKeys.dashboard.all,
    queryFn: () => dashboardApi.getDashboardData(),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

// CRM hooks - Leads
export function useLeads(filters?: { limit?: number; offset?: number; status?: string }) {
  return useQuery({
    queryKey: queryKeys.leads.list(filters),
    queryFn: () => crmApi.getLeads(filters),
    staleTime: 2 * 60 * 1000,
    retry: 2,
  });
}

export function useLead(id: string) {
  return useQuery({
    queryKey: queryKeys.leads.detail(id),
    queryFn: () => crmApi.getLead(id),
    enabled: !!id,
    retry: 2,
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Parameters<typeof crmApi.createLead>[0]) => 
      crmApi.createLead(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof crmApi.updateLead>[1] }) => 
      crmApi.updateLead(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => crmApi.deleteLead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}

// CRM hooks - Contacts
export function useContacts(filters?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: queryKeys.contacts.list(filters),
    queryFn: () => crmApi.getContacts(filters),
    staleTime: 2 * 60 * 1000,
    retry: 2,
  });
}

export function useContact(id: string) {
  return useQuery({
    queryKey: queryKeys.contacts.detail(id),
    queryFn: () => crmApi.getContact(id),
    enabled: !!id,
    retry: 2,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Parameters<typeof crmApi.createContact>[0]) => 
      crmApi.createContact(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof crmApi.updateContact>[1] }) => 
      crmApi.updateContact(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.detail(id) });
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => crmApi.deleteContact(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
    },
  });
}

// CRM hooks - Deals
export function useDeals(filters?: { limit?: number; offset?: number; stage?: string }) {
  return useQuery({
    queryKey: queryKeys.deals.list(filters),
    queryFn: () => crmApi.getDeals(filters),
    staleTime: 2 * 60 * 1000,
    retry: 2,
  });
}

export function useDeal(id: string) {
  return useQuery({
    queryKey: queryKeys.deals.detail(id),
    queryFn: () => crmApi.getDeal(id),
    enabled: !!id,
    retry: 2,
  });
}

export function useCreateDeal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Parameters<typeof crmApi.createDeal>[0]) => 
      crmApi.createDeal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.deals.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}

export function useUpdateDeal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof crmApi.updateDeal>[1] }) => 
      crmApi.updateDeal(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.deals.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.deals.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}

export function useDeleteDeal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => crmApi.deleteDeal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.deals.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}

// CRM hooks - Companies
export function useCompanies(filters?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: queryKeys.companies.list(filters),
    queryFn: () => crmApi.getCompanies(filters),
    staleTime: 2 * 60 * 1000,
    retry: 2,
  });
}

export function useCompany(id: string) {
  return useQuery({
    queryKey: queryKeys.companies.detail(id),
    queryFn: () => crmApi.getCompany(id),
    enabled: !!id,
    retry: 2,
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Parameters<typeof crmApi.createCompany>[0]) => 
      crmApi.createCompany(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof crmApi.updateCompany>[1] }) => 
      crmApi.updateCompany(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.detail(id) });
    },
  });
}

export function useDeleteCompany() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => crmApi.deleteCompany(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
    },
  });
}

// CRM hooks - Activities
export function useActivities(filters?: { 
  limit?: number; 
  offset?: number; 
  type?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: queryKeys.activities.list(filters),
    queryFn: () => crmApi.getActivities(filters),
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: 2,
  });
}

export function useActivity(id: string) {
  return useQuery({
    queryKey: queryKeys.activities.detail(id),
    queryFn: () => crmApi.getActivity(id),
    enabled: !!id,
    retry: 2,
  });
}

export function useCreateActivity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Parameters<typeof crmApi.createActivity>[0]) => 
      crmApi.createActivity(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.activities.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}

export function useUpdateActivity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof crmApi.updateActivity>[1] }) => 
      crmApi.updateActivity(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.activities.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.activities.detail(id) });
    },
  });
}

export function useCompleteActivity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => crmApi.completeActivity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.activities.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}

export function useDeleteActivity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => crmApi.deleteActivity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.activities.all });
    },
  });
}

// Auth hooks
export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.auth.user,
    queryFn: () => authApi.getCurrentUser(),
    staleTime: Infinity,
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (credentials: LoginRequest) => authApi.login(credentials),
    onSuccess: (data) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("auth_token", data.access_token);
      }
      queryClient.setQueryData(queryKeys.auth.user, data.user);
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}

export function useSignup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userData: Parameters<typeof authApi.signup>[0]) => 
      authApi.signup(userData),
    onSuccess: (data) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("auth_token", data.access_token);
      }
      queryClient.setQueryData(queryKeys.auth.user, data.user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      queryClient.clear();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    },
  });
}
