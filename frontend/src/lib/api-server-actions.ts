// frontend/src/lib/api-server-actions.ts
// ──────────────────────────────────────────────────────────────────────────────
// SERVER ACTIONS — Revalidation functions called from Client Components.
// Must be in a separate file with "use server" at the top.
// ──────────────────────────────────────────────────────────────────────────────

'use server';

import { revalidateTag } from 'next/cache';
import { CACHE_TAGS } from './api-server';

export async function revalidateCompanies() {
  revalidateTag(CACHE_TAGS.companies, 'max');
}

export async function revalidateContacts() {
  revalidateTag(CACHE_TAGS.contacts, 'max');
}

export async function revalidateLeads() {
  revalidateTag(CACHE_TAGS.leads, 'max');
}