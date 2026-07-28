import { TEST_COMPANIES, TEST_CONTACTS, TEST_LEADS, TEST_DEALS, SEED_DATA_FILE } from './fixtures';
import * as fs from 'fs';
import * as path from 'path';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface SeedResult {
  token: string;
  refreshToken: string;
  companyIds: (number | string)[];
  contactIds: (number | string)[];
  leadIds: (number | string)[];
  dealIds: (number | string)[];
}

async function apiRequest(
  endpoint: string,
  method: string,
  token?: string,
  body?: object
): Promise<{ status: number; data: any }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => null);
  return { status: response.status, data };
}

function generateUniqueEmail(): string {
  return `e2e-admin-${Date.now()}@pulse-test.com`;
}

function generateUniqueOrgName(): string {
  return `E2E Test Org ${Date.now()}`;
}

/**
 * Register a new test organization via the backend API.
 */
export async function registerTestOrg(): Promise<{
  token: string;
  refreshToken: string;
}> {
  const result = await apiRequest('/api/v1/auth/register', 'POST', undefined, {
    full_name: 'E2E Test Admin',
    email: generateUniqueEmail(),
    password: 'E2ETest!1234',
    organization_name: generateUniqueOrgName(),
  });

  if (result.status !== 201 && result.status !== 200) {
    const errorMsg = result.data?.message || result.data?.detail || JSON.stringify(result.data);
    throw new Error(`Failed to register test org: ${result.status} - ${errorMsg}`);
  }

  const tokenData = result.data.data;
  return {
    token: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
  };
}

export async function seedCompanies(token: string): Promise<(number | string)[]> {
  const ids: (number | string)[] = [];
  for (const company of TEST_COMPANIES) {
    const result = await apiRequest('/api/v1/companies', 'POST', token, company);
    if (result.status === 201 || result.status === 200) {
      ids.push(result.data.data.id);
    } else {
      console.log(`[SEED] Failed to create company "${company.name}": ${result.status} - ${result.data?.message || ''}`);
    }
  }
  return ids;
}

export async function seedContacts(token: string, companyIds: (number | string)[]): Promise<(number | string)[]> {
  const ids: (number | string)[] = [];
  for (const contact of TEST_CONTACTS) {
    const result = await apiRequest('/api/v1/contacts', 'POST', token, {
      first_name: contact.firstName,
      last_name: contact.lastName,
      email: contact.email,
      phone: contact.phone,
      job_title: contact.jobTitle,
      department: contact.department,
      company_id: companyIds[contact.companyId] || companyIds[0],
    });
    if (result.status === 201 || result.status === 200) {
      ids.push(result.data.data.id);
    } else {
      console.log(`[SEED] Failed to create contact "${contact.firstName} ${contact.lastName}": ${result.status} - ${result.data?.message || ''}`);
    }
  }
  return ids;
}

export async function seedLeads(
  token: string,
  companyIds: (number | string)[],
  contactIds: (number | string)[]
): Promise<(number | string)[]> {
  const ids: (number | string)[] = [];
  for (const lead of TEST_LEADS) {
    const result = await apiRequest('/api/v1/leads', 'POST', token, {
      title: lead.title,
      description: lead.description,
      status: lead.status,
      source: lead.source,
      estimated_value: lead.estimatedValue,
      industry: lead.industry,
      interest: lead.interest,
      company_id: companyIds[lead.companyId] || companyIds[0],
      contact_id: contactIds[lead.contactId] || contactIds[0],
    });
    if (result.status === 201 || result.status === 200) {
      ids.push(result.data.data.id);
    } else {
      console.log(`[SEED] Failed to create lead "${lead.title}": ${result.status} - ${result.data?.message || ''}`);
    }
  }
  return ids;
}

export async function seedDeals(
  token: string,
  companyIds: (number | string)[],
  contactIds: (number | string)[]
): Promise<(number | string)[]> {
  const ids: (number | string)[] = [];
  for (const deal of TEST_DEALS) {
    const result = await apiRequest('/api/v1/deals', 'POST', token, {
      name: deal.name,
      description: deal.description,
      status: deal.status,
      amount: deal.amount,
      expected_close_date: deal.expectedCloseDate,
      probability: deal.probability,
      company_id: companyIds[deal.companyId] || companyIds[0],
      contact_id: contactIds[deal.contactId] || contactIds[0],
    });
    if (result.status === 201 || result.status === 200) {
      ids.push(result.data.data.id);
    } else {
      console.log(`[SEED] Failed to create deal "${deal.name}": ${result.status} - ${result.data?.message || ''}`);
    }
  }
  return ids;
}

export async function destroyTestData(token: string, seedData: SeedResult): Promise<void> {
  for (const id of seedData.dealIds) {
    await apiRequest(`/api/v1/deals/${id}`, 'DELETE', token);
  }
  for (const id of seedData.leadIds) {
    await apiRequest(`/api/v1/leads/${id}`, 'DELETE', token);
  }
  for (const id of seedData.contactIds) {
    await apiRequest(`/api/v1/contacts/${id}`, 'DELETE', token);
  }
  for (const id of seedData.companyIds) {
    await apiRequest(`/api/v1/companies/${id}`, 'DELETE', token);
  }
}

export async function seedAllTestData(token: string): Promise<SeedResult> {
  const companyIds = await seedCompanies(token);
  const contactIds = await seedContacts(token, companyIds);
  const leadIds = await seedLeads(token, companyIds, contactIds);
  const dealIds = await seedDeals(token, companyIds, contactIds);

  const result: SeedResult = {
    token,
    refreshToken: '',
    companyIds,
    contactIds,
    leadIds,
    dealIds,
  };

  const seedPath = path.join(process.cwd(), SEED_DATA_FILE);
  fs.writeFileSync(seedPath, JSON.stringify(result, null, 2));

  return result;
}

export async function loadSeedData(): Promise<SeedResult | null> {
  const seedPath = path.join(process.cwd(), SEED_DATA_FILE);
  if (fs.existsSync(seedPath)) {
    return JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
  }
  return null;
}

export async function cleanupSeedData(): Promise<void> {
  const seedPath = path.join(process.cwd(), SEED_DATA_FILE);
  if (fs.existsSync(seedPath)) {
    fs.unlinkSync(seedPath);
  }
}

export async function waitForBackend(timeoutMs: number = 60000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(`${API_BASE}/api/v1/health/ping`);
      if (response.ok) return;
    } catch {
      // Backend not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error(`Backend not ready after ${timeoutMs}ms`);
}
