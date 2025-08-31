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

