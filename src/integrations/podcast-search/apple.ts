import type { AppleSearchRes } from './types';

const APPLE_SEARCH_BASE = 'https://itunes.apple.com';

function buildQuery(params: Record<string, any> = {}) {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== '') u.set(k, String(v));
  return u.toString();
}

async function appleGet<T>(path: string, params?: Record<string, any>): Promise<T> {
  const qs = buildQuery(params);
  const url = `${APPLE_SEARCH_BASE}${path}?${qs}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Apple ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export async function searchApple(term: string, country: string, limit = 5): Promise<AppleSearchRes> {
  return appleGet<AppleSearchRes>('/search', { media: 'podcast', term, limit, country });
}

export async function lookupApple(collectionId: number | string, country?: string): Promise<AppleSearchRes> {
  // 'lookup' for show details; 'entity=podcast' included for clarity
  return appleGet<AppleSearchRes>('/lookup', { id: collectionId, entity: 'podcast', country });
}

