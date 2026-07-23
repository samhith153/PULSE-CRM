// API client wrapper with automatic mock-fallback for robustness

const API_BASE_URL = 'http://localhost:8000';

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

// Helper to make API calls with fallback
async function apiFetch<T>(endpoint: string, options?: RequestInit, fallbackData?: T): Promise<T> {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {})
      }
    });
    if (!res.ok) {
      throw new Error(`API error ${res.status}`);
    }
    return await res.json() as T;
  } catch (err) {
    console.warn(`Failed fetching ${endpoint}, using mock fallback.`, err);
    if (fallbackData !== undefined) return fallbackData;
    throw err;
  }
}

// --- Leads API ---
export async function getLeads(): Promise<Lead[]> {
  try {
    const dbLeads = await apiFetch<any[]>('/leads', {}, []);
    if (!dbLeads || dbLeads.length === 0) return MOCK_LEADS;

    // Join/map leads with mock metadata since backend schema is simple
    return dbLeads.map((dl, idx) => {
      const fallback = MOCK_LEADS[idx] || MOCK_LEADS[0];
      return {
        ...fallback, // Inherit all mock fields (timeline, emails, calls, meetings, owner, score)
        id: dl.id,
        status: dl.status || fallback.status,
        value: String(dl.value || fallback.value || ''),
        notes: dl.description || fallback.notes
      };
    });
  } catch {
    return MOCK_LEADS;
  }
}

export async function createLead(leadData: any): Promise<any> {
  return apiFetch('/leads', {
    method: 'POST',
    body: JSON.stringify(leadData)
  });
}

export async function convertLead(leadId: string | number, payload: { name: string }): Promise<any> {
  return apiFetch(`/leads/${leadId}/convert`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

// --- Contacts API ---
export async function getContacts(): Promise<Contact[]> {
  try {
    const dbContacts = await apiFetch<any[]>('/contacts', {}, []);
    if (!dbContacts || dbContacts.length === 0) return MOCK_CONTACTS;

    return dbContacts.map((dc, idx) => {
      const fallback = MOCK_CONTACTS[idx] || MOCK_CONTACTS[0];
      return {
        ...fallback, // Inherit mock timeline, calls, meetings, emails
        id: dc.id,
        name: `${dc.first_name} ${dc.last_name}`,
        email: dc.email,
        phone: dc.phone || fallback.phone,
        designation: dc.job_title || fallback.designation
      };
    });
  } catch {
    return MOCK_CONTACTS;
  }
}

export async function createContact(contactData: any): Promise<any> {
  return apiFetch('/contacts', {
    method: 'POST',
    body: JSON.stringify(contactData)
  });
}

// --- Companies API ---
export async function getCompanies(): Promise<Company[]> {
  try {
    const dbCompanies = await apiFetch<any[]>('/companies', {}, []);
    if (!dbCompanies || dbCompanies.length === 0) return MOCK_COMPANIES;

    return dbCompanies.map((dc, idx) => {
      const fallback = MOCK_COMPANIES[idx] || MOCK_COMPANIES[0];
      return {
        ...fallback, // Inherit mock contacts, timeline, emails, files
        id: dc.id,
        name: dc.name,
        domain: dc.domain || fallback.domain || '',
        industry: dc.industry || fallback.industry
      };
    });
  } catch {
    return MOCK_COMPANIES;
  }
}

export async function createCompany(companyData: any): Promise<any> {
  return apiFetch('/companies', {
    method: 'POST',
    body: JSON.stringify(companyData)
  });
}

// --- Deals API ---
export async function getDeals(): Promise<Deal[]> {
  try {
    const dbDeals = await apiFetch<any[]>('/deals', {}, []);
    if (!dbDeals || dbDeals.length === 0) return MOCK_DEALS;

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
  } catch {
    return MOCK_DEALS;
  }
}

export async function updateDealStage(dealId: string | number, stageId: string): Promise<any> {
  return apiFetch(`/deals/${dealId}/stage`, {
    method: 'PUT',
    body: JSON.stringify({ stage_id: stageId })
  });
}
