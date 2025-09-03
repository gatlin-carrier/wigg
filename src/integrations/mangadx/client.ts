const MANGADX_API_BASE = 'https://api.mangadex.org';

interface MangaDxSearchResponse {
  result: string;
  response: string;
  data: MangaDxManga[];
  limit: number;
  offset: number;
  total: number;
}

interface MangaDxManga {
  id: string;
  type: string;
  attributes: {
    title: Record<string, string>;
    altTitles: Array<Record<string, string>>;
    description: Record<string, string>;
    isLocked: boolean;
    links: Record<string, string>;
    originalLanguage: string;
    lastVolume: string;
    lastChapter: string;
    publicationDemographic: string;
    status: string;
    year: number;
    contentRating: string;
    tags: Array<{
      id: string;
      type: string;
      attributes: {
        name: Record<string, string>;
        description: Record<string, string>;
        group: string;
        version: number;
      };
    }>;
    state: string;
    chapterNumbersResetOnNewVolume: boolean;
    createdAt: string;
    updatedAt: string;
    version: number;
  };
}

interface MangaDxChapter {
  id: string;
  type: string;
  attributes: {
    volume: string | null;
    chapter: string;
    title: string;
    translatedLanguage: string;
    externalUrl: string | null;
    publishAt: string;
    readableAt: string;
    createdAt: string;
    updatedAt: string;
    pages: number;
    version: number;
  };
}

interface MangaDxChapterResponse {
  result: string;
  response: string;
  data: MangaDxChapter[];
  limit: number;
  offset: number;
  total: number;
}

async function mangaDxGet<T>(path: string, params: Record<string, any> = {}): Promise<T> {
  const url = new URL(`${MANGADX_API_BASE}${path}`);
  
  // Add query parameters
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url.toString(), {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`MangaDex API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export async function searchMangaDx(title: string, limit = 10) {
  const response = await mangaDxGet<MangaDxSearchResponse>('/manga', {
    title,
    limit,
    order: { relevance: 'desc' },
    'contentRating[]': ['safe', 'suggestive', 'erotica'], // Exclude pornographic
    'hasAvailableChapters': 'true',
  });

  return response.data.map((manga) => ({
    id: manga.id,
    title: manga.attributes.title.en || 
           manga.attributes.title.ja || 
           Object.values(manga.attributes.title)[0] || 
           'Unknown Title',
    description: manga.attributes.description.en || 
                manga.attributes.description.ja || 
                Object.values(manga.attributes.description)[0],
    year: manga.attributes.year,
    lastChapter: manga.attributes.lastChapter,
    status: manga.attributes.status,
    contentRating: manga.attributes.contentRating,
    originalLanguage: manga.attributes.originalLanguage,
  }));
}

export async function getMangaDxChapters(mangaId: string, limit = 100, language = 'en') {
  try {
    const response = await mangaDxGet<MangaDxChapterResponse>('/chapter', {
      manga: mangaId,
      limit,
      translatedLanguage: [language],
      order: { chapter: 'asc' },
      'contentRating[]': ['safe', 'suggestive', 'erotica'],
    });

    return response.data.map((chapter, index) => ({
      id: `mangadx-ch-${mangaId}-${chapter.id}`,
      title: chapter.attributes.title 
        ? `Ch. ${chapter.attributes.chapter}: ${chapter.attributes.title}`
        : `Chapter ${chapter.attributes.chapter || index + 1}`,
      ordinal: parseInt(chapter.attributes.chapter) || index + 1,
      subtype: "chapter" as const,
      pages: chapter.attributes.pages || 20,
      volume: chapter.attributes.volume,
      chapterNumber: chapter.attributes.chapter,
      publishAt: chapter.attributes.publishAt,
      language: chapter.attributes.translatedLanguage,
    })).sort((a, b) => a.ordinal - b.ordinal);
  } catch (error) {
    console.error('Error fetching MangaDx chapters:', error);
    throw error;
  }
}

export async function getMangaDxDetails(mangaId: string) {
  const response = await mangaDxGet<{ data: MangaDxManga }>(`/manga/${mangaId}`, {
    'includes[]': ['cover_art'],
  });

  const manga = response.data;
  return {
    id: manga.id,
    title: manga.attributes.title.en || 
           manga.attributes.title.ja || 
           Object.values(manga.attributes.title)[0],
    description: manga.attributes.description.en || 
                manga.attributes.description.ja || 
                Object.values(manga.attributes.description)[0],
    year: manga.attributes.year,
    lastChapter: manga.attributes.lastChapter,
    status: manga.attributes.status,
    contentRating: manga.attributes.contentRating,
    originalLanguage: manga.attributes.originalLanguage,
  };
}

// Helper function to find MangaDx ID by AniList title
export async function findMangaDxByTitle(title: string) {
  const results = await searchMangaDx(title, 5);
  return results[0]?.id; // Return first match
}