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

export async function fetchBookTableOfContents(keyOrId: string) {
  try {
    const workDetails = await fetchWorkDetails(keyOrId);
    
    // Try to extract table of contents from description or other fields
    const tableOfContents: string[] = [];
    
    // Check if work has explicit table_of_contents field
    if (workDetails.table_of_contents) {
      if (Array.isArray(workDetails.table_of_contents)) {
        tableOfContents.push(...workDetails.table_of_contents.map((item: any) => 
          typeof item === 'string' ? item : item.title || item.name || 'Chapter'
        ));
      }
    }
    
    // If no explicit TOC, generate intelligent chapter names
    if (tableOfContents.length === 0) {
      const estimatedChapters = estimateChapterCount(workDetails);
      for (let i = 1; i <= estimatedChapters; i++) {
        tableOfContents.push(`Chapter ${i}`);
      }
    }
    
    return tableOfContents.slice(0, 50); // Limit to reasonable number
  } catch (error) {
    console.error('Error fetching table of contents:', error);
    return [];
  }
}

function estimateChapterCount(workDetails: any): number {
  // Extract chapter count hints from various fields
  const description = workDetails.description || '';
  const subjects = workDetails.subjects || [];
  
  // Look for chapter mentions in description
  const chapterMatch = description.match(/(\d+)\s*chapters?/i);
  if (chapterMatch) {
    return Math.min(parseInt(chapterMatch[1]), 50);
  }
  
  // Look for part mentions
  const partMatch = description.match(/(\d+)\s*parts?/i);
  if (partMatch) {
    return Math.min(parseInt(partMatch[1]), 25);
  }
  
  // Check subjects for hints about book structure
  const hasMultipleParts = subjects.some((s: string) => 
    s.toLowerCase().includes('multi') || s.toLowerCase().includes('series')
  );
  
  // Default estimates based on book type
  if (subjects.some((s: string) => s.toLowerCase().includes('textbook'))) {
    return 15; // Textbooks typically have more chapters
  }
  if (subjects.some((s: string) => s.toLowerCase().includes('novel'))) {
    return 12; // Novels typically have 8-15 chapters
  }
  if (hasMultipleParts) {
    return 8; // Multi-part books
  }
  
  return 10; // Default fallback
}

export async function generateBookChapters(bookData: TrendingBook) {
  const tableOfContents = bookData.id.startsWith('/works/') 
    ? await fetchBookTableOfContents(bookData.id)
    : [];
  
  if (tableOfContents.length > 0) {
    return tableOfContents.map((title, index) => ({
      id: `ol-ch-${bookData.id}-${index + 1}`,
      title: title.length > 50 ? `${title.slice(0, 47)}...` : title,
      ordinal: index + 1,
      subtype: "chapter" as const,
      pages: 15 + Math.round(Math.random() * 10), // Estimated pages per chapter
    }));
  }
  
  // Fallback to generic chapters with better naming
  const chapterCount = estimateChapterCount({ description: bookData.genre });
  return Array.from({ length: chapterCount }).map((_, i) => ({
    id: `ol-ch-${bookData.id}-${i + 1}`,
    title: `Chapter ${i + 1}`,
    ordinal: i + 1,
    subtype: "chapter" as const,
    pages: 15 + Math.round(Math.random() * 10),
  }));
}
