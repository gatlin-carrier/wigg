import type { OLTrendingResponse, OLWork } from './types';

const OL_BASE = 'https://openlibrary.org';

export type OLTrendingPeriod = 'daily' | 'weekly' | 'monthly';

export function getCoverUrl(coverId?: number, size: 'S'|'M'|'L' = 'M') {
  if (!coverId) return undefined;
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
}

export async function fetchTrendingBooks(period: OLTrendingPeriod = 'weekly') {
  const res = await fetch(`${OL_BASE}/trending/${period}.json`);
  if (!res.ok) throw new Error(`OpenLibrary ${res.status}`);
  const data = (await res.json()) as OLTrendingResponse;
  return data.works ?? [];
}

export async function searchBooks(query: string, limit = 10) {
  const url = new URL(`${OL_BASE}/search.json`);
  url.searchParams.set('q', query);
  url.searchParams.set('limit', String(limit));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`OpenLibrary ${res.status}`);
  const data = await res.json();
  const docs = (data.docs || []) as Array<{
    key: string;
    title: string;
    cover_i?: number;
    first_publish_year?: number;
    author_name?: string[];
    subject?: string[];
  }>;
  return docs.map(d => normalizeWork({
    key: d.key,
    title: d.title,
    cover_i: d.cover_i,
    first_publish_year: d.first_publish_year,
    author_name: d.author_name,
    subject: d.subject,
  } as any));
}

export type TrendingBook = {
  id: string;
  title: string;
  cover_url?: string;
  author?: string;
  year?: number;
  genre?: string;
};

export function normalizeWork(w: OLWork): TrendingBook {
  return {
    id: w.key,
    title: w.title,
    cover_url: getCoverUrl(w.cover_i, 'L'),
    author: (w.author_name && w.author_name[0]) || undefined,
    year: w.first_publish_year,
    genre: (w.subject && w.subject[0]) || undefined,
  };
}
