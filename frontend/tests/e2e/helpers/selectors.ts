import { Page, Locator } from '@playwright/test';

export const SIDEBAR = {
  leads: (page: Page): Locator => page.getByRole('button', { name: /^Leads$/i }),
  contacts: (page: Page): Locator => page.getByRole('button', { name: /^Contacts$/i }),
  companies: (page: Page): Locator => page.getByRole('button', { name: /^Companies$/i }),
  deals: (page: Page): Locator => page.getByRole('button', { name: /^Deals$/i }),
  products: (page: Page): Locator => page.getByRole('button', { name: /^Products$/i }),
  activities: (page: Page): Locator => page.getByRole('button', { name: /^Activities$/i }),
  emails: (page: Page): Locator => page.getByRole('button', { name: /^Emails$/i }),
  documents: (page: Page): Locator => page.getByRole('button', { name: /^Documents$/i }),
  reports: (page: Page): Locator => page.getByRole('button', { name: /^Reports$/i }),
  workflows: (page: Page): Locator => page.getByRole('button', { name: /^Workflows$/i }),
  aiInsights: (page: Page): Locator => page.getByRole('button', { name: /AI Insights/i }),
  settings: (page: Page): Locator => page.getByRole('button', { name: /^Settings$/i }),
  profile: (page: Page): Locator => page.getByRole('button', { name: /^Profile$/i }),
  notifications: (page: Page): Locator => page.getByRole('button', { name: /^Notifications$/i }),
  calendar: (page: Page): Locator => page.getByRole('button', { name: /^Calendar$/i }),
  forecast: (page: Page): Locator => page.getByRole('button', { name: /^Forecast$/i }),
  teamPerformance: (page: Page): Locator => page.getByRole('button', { name: /Team Performance/i }),
  users: (page: Page): Locator => page.getByRole('button', { name: /^Users$/i }),
  rolesPermissions: (page: Page): Locator => page.getByRole('button', { name: /Roles & Permissions/i }),
  integrations: (page: Page): Locator => page.getByRole('button', { name: /^Integrations$/i }),
  automation: (page: Page): Locator => page.getByRole('button', { name: /^Automation$/i }),
  aiModels: (page: Page): Locator => page.getByRole('button', { name: /AI Models/i }),
  auditLogs: (page: Page): Locator => page.getByRole('button', { name: /Audit Logs/i }),
};

export const BUTTONS = {
  getStartedFree: (page: Page): Locator => page.getByRole('button', { name: /Get Started Free/i }).first(),
  startFreeTrial: (page: Page): Locator => page.getByRole('button', { name: /Start Free Trial/i }).first(),
  signIn: (page: Page): Locator => page.getByRole('button', { name: /^Sign In$/i }),
  createAccount: (page: Page): Locator => page.getByRole('button', { name: /Create Account/i }),
  addLead: (page: Page): Locator => page.getByRole('button', { name: /Add Lead/i }).first(),
  addContact: (page: Page): Locator => page.getByRole('button', { name: /Add Contact/i }).first(),
  addCompany: (page: Page): Locator => page.getByRole('button', { name: /Add Company/i }).first(),
  addDeal: (page: Page): Locator => page.getByRole('button', { name: /Add Deal/i }).first(),
  email: (page: Page): Locator => page.getByRole('button', { name: /^Email$/i }).first(),
  logCall: (page: Page): Locator => page.getByRole('button', { name: /Log Call/i }).first(),
  meet: (page: Page): Locator => page.getByRole('button', { name: /^Meet$/i }).first(),
  save: (page: Page): Locator => page.getByRole('button', { name: /^Save$/i }).first(),
  cancel: (page: Page): Locator => page.getByRole('button', { name: /^Cancel$/i }).first(),
  delete: (page: Page): Locator => page.getByRole('button', { name: /^Delete$/i }).first(),
  confirm: (page: Page): Locator => page.getByRole('button', { name: /^Confirm$/i }).first(),
  signOut: (page: Page): Locator => page.getByRole('button', { name: /Sign Out/i }),
  profileMenu: (page: Page): Locator => page.getByLabel('Profile menu'),
  connectGmail: (page: Page): Locator => page.getByRole('button', { name: /Connect Gmail/i }).first(),
  newReport: (page: Page): Locator => page.getByRole('button', { name: /New Report/i }).first(),
  close: (page: Page): Locator => page.getByRole('button', { name: /^Close$/i }).first(),
};

export const FORMS = {
  auth: (page: Page) => page.locator('form').filter({ hasText: /Password|Email|Create Account|Sign In/i }),
  firstName: (page: Page) => page.getByPlaceholder('John'),
  lastName: (page: Page) => page.getByPlaceholder('Doe'),
  companyName: (page: Page) => page.getByPlaceholder('Acme Inc.'),
  email: (page: Page) => page.getByPlaceholder('you@company.com'),
  password: (page: Page) => page.getByPlaceholder(/•/),
  search: (page: Page) => page.getByPlaceholder(/Search/).first(),
  leadSearch: (page: Page) => page.getByPlaceholder('Search leads, companies...'),
  companySearch: (page: Page) => page.getByPlaceholder('Search companies...'),
  contactSearch: (page: Page) => page.getByPlaceholder(/Search contacts/i),
};

export const HEADINGS = {
  salesLeads: (page: Page): Locator => page.getByRole('heading', { name: /Sales Leads/i }),
  companies: (page: Page): Locator => page.getByRole('heading', { name: /^Companies$/i }),
  contactsDirectory: (page: Page): Locator => page.getByRole('heading', { name: /Contacts Directory/i }),
  getStartedFree: (page: Page): Locator => page.getByRole('heading', { name: /Get started free/i }),
  welcomeBack: (page: Page): Locator => page.getByRole('heading', { name: /Welcome back/i }),
  settings: (page: Page): Locator => page.getByRole('heading', { name: /settings/i }),
  profile: (page: Page): Locator => page.getByRole('heading', { name: /^Profile$/i }),
  users: (page: Page): Locator => page.getByRole('heading', { name: /user.*profile|users/i }),
  reports: (page: Page): Locator => page.getByRole('heading', { name: /^Reports/i }),
  pipeline: (page: Page): Locator => page.getByText(/pipeline|deal|stage|column/i).first(),
};

export const ROLES = {
  admin: (page: Page): Locator => page.getByRole('button', { name: /^Admin$/i }),
  manager: (page: Page): Locator => page.getByRole('button', { name: /^Manager$/i }),
  salesRep: (page: Page): Locator => page.getByRole('button', { name: /Sales Rep/i }),
};

export const NAV_ITEMS_BY_ROLE = {
  admin: ['Users', 'Roles & Permissions', 'Companies', 'Contacts', 'Products', 'Integrations', 'Automation', 'Reports', 'AI Models', 'Audit Logs', 'Settings'],
  manager: ['Dashboard', 'Team Pipeline', 'Leads', 'Companies', 'Contacts', 'Reports', 'Forecast', 'Team Performance', 'Activities', 'Calendar', 'AI Insights', 'Notifications', 'Settings'],
  representative: ['Dashboard', 'Leads', 'Contacts', 'Companies', 'Deals', 'Products', 'Activities', 'Emails', 'Workflows', 'AI Insights', 'Reports', 'Documents', 'Settings'],
};
