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

// Fetch detailed data for an OpenLibrary work
export async function fetchWorkDetails(keyOrId: string) {
  // keyOrId can be like "/works/OL12345W" or just "OL12345W"
  const key = keyOrId.startsWith('/works/') ? keyOrId : `/works/${keyOrId}`;
  const res = await fetch(`${OL_BASE}${key}.json`);
  if (!res.ok) throw new Error(`OpenLibrary ${res.status}`);
  const work = await res.json();

  // Attempt to normalize some convenient fields
  const covers: number[] = Array.isArray(work.covers) ? work.covers : [];
  const first_publish_date: string | undefined = work.first_publish_date || work.first_publish_year || undefined;
  let description: string | undefined;
  if (typeof work.description === 'string') description = work.description;
  else if (work.description && typeof work.description.value === 'string') description = work.description.value;

  return {
    ...work,
    key,
    cover_url: getCoverUrl(covers[0], 'L'),
    first_publish_date,
    description,
    subjects: work.subjects || work.subject || [],
  } as any;
}
