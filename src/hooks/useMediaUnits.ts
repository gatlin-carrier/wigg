import { useQuery } from "@tanstack/react-query";
import { getTvEpisodes } from "@/integrations/tmdb/client";
import { fetchAnimeEpisodes, fetchMangaChapters } from "@/integrations/anilist/client";
import { fetchPodcastEpisodes } from "@/integrations/podcast-search/client";
import { getMangaDxChapters, findMangaDxByTitle } from "@/integrations/mangadx/client";
import { generateBookChapters } from "@/integrations/openlibrary/client";
import { type MediaSearchResult } from "@/components/media/MediaSearch";
import { type Unit } from "@/components/wigg/SwipeRating";

function generateBookChapterTitles(count: number): string[] {
  const commonChapterNames = [
    "Introduction", "The Beginning", "Foundation", "Development", "Rising Action",
    "Complications", "The Turning Point", "Climax", "Resolution", "Aftermath",
    "New Horizons", "Reflection", "Epilogue", "Conclusion", "Final Thoughts"
  ];
  
  if (count <= commonChapterNames.length) {
    return commonChapterNames.slice(0, count).map((name, i) => `Chapter ${i + 1}: ${name}`);
  }
  
  // For longer books, mix named and numbered chapters
  const result = [];
  for (let i = 0; i < count; i++) {
    if (i < commonChapterNames.length) {
      result.push(`Chapter ${i + 1}: ${commonChapterNames[i]}`);
    } else {
      result.push(`Chapter ${i + 1}`);
    }
  }
  return result;
}

interface UseMediaUnitsResult {
  units: Unit[];
  isLoading: boolean;
  error: Error | null;
}

export function useMediaUnits(media: MediaSearchResult | null): UseMediaUnitsResult {
  const { data: units = [], isLoading, error } = useQuery({
    queryKey: ["media-units", media?.id, media?.type],
    queryFn: async (): Promise<Unit[]> => {
      if (!media) return [];

      try {
        switch (media.type) {
          case "tv":
          case "anime": {
            if (media.externalIds?.tmdb_id) {
              return await getTvEpisodes(media.externalIds.tmdb_id, 1);
            } else if (media.externalIds?.anilist_id) {
              return await fetchAnimeEpisodes(media.externalIds.anilist_id);
            }
            // Fallback to generic episodes
            return Array.from({ length: 12 }).map((_, i) => ({
              id: `generic-ep-${media.id}-${i + 1}`,
              title: `Episode ${i + 1}`,
              ordinal: i + 1,
              subtype: "episode" as const,
              runtimeSec: 24 * 60,
            }));
          }

          case "manga": {
            // Priority 1: Try MangaDx for detailed chapter titles
            try {
              const mangaDxId = await findMangaDxByTitle(media.title);
              if (mangaDxId) {
                const chapters = await getMangaDxChapters(mangaDxId);
                if (chapters.length > 0) return chapters;
              }
            } catch (error) {
              console.warn('MangaDx fetch failed, falling back to AniList:', error);
            }
            
            // Priority 2: Use AniList for chapter count
            if (media.externalIds?.anilist_id) {
              return await fetchMangaChapters(media.externalIds.anilist_id);
            }
            
            // Fallback: Generic manga chapters
            const totalChapters = media.chapterCount || 15;
            return Array.from({ length: Math.min(totalChapters, 50) }).map((_, i) => ({
              id: `generic-manga-ch-${media.id}-${i + 1}`,
              title: `Ch. ${i + 1}`, // Shorter naming for manga
              ordinal: i + 1,
              subtype: "chapter" as const,
              pages: 18 + Math.round(Math.random() * 8),
            }));
          }

          case "webtoon": {
            // Webtoons use episode-style naming and typically have more content
            if (media.externalIds?.anilist_id) {
              const chapters = await fetchMangaChapters(media.externalIds.anilist_id);
              // Convert to webtoon episode format
              return chapters.map(ch => ({
                ...ch,
                id: `webtoon-ep-${media.id}-${ch.ordinal}`,
                title: `Episode ${ch.ordinal}`,
                subtype: "episode" as const,
              }));
            }
            
            // Webtoons typically have many more episodes than manga chapters
            const totalEpisodes = media.chapterCount || 30;
            return Array.from({ length: Math.min(totalEpisodes, 100) }).map((_, i) => ({
              id: `webtoon-ep-${media.id}-${i + 1}`,
              title: `Episode ${i + 1}`,
              ordinal: i + 1,
              subtype: "episode" as const,
              pages: 10 + Math.round(Math.random() * 5), // Webtoons typically shorter per episode
            }));
          }

          case "book": {
            // Try OpenLibrary enhanced chapter generation
            if (media.externalIds?.openlibrary_id) {
              try {
                const bookData = { 
                  id: media.externalIds.openlibrary_id, 
                  title: media.title,
                  genre: media.description || '',
                };
                return await generateBookChapters(bookData);
              } catch (error) {
                console.warn('OpenLibrary chapter fetch failed:', error);
              }
            }
            
            // Fallback: Enhanced book chapter naming
            const totalChapters = media.chapterCount || 12;
            const chapterTitles = generateBookChapterTitles(totalChapters);
            return chapterTitles.map((title, i) => ({
              id: `book-ch-${media.id}-${i + 1}`,
              title,
              ordinal: i + 1,
              subtype: "chapter" as const,
              pages: 20 + Math.round(Math.random() * 15),
            }));
          }

          case "podcast": {
            if (media.externalIds?.podcast_guid) {
              return await fetchPodcastEpisodes(media.externalIds.podcast_guid);
            }
            // Fallback to generic episodes
            return Array.from({ length: 20 }).map((_, i) => ({
              id: `generic-podcast-ep-${media.id}-${i + 1}`,
              title: `Episode ${i + 1}`,
              ordinal: i + 1,
              subtype: "episode" as const,
              runtimeSec: 45 * 60,
            }));
          }

          case "movie":
          case "game":
          default:
            // For movies and games, create single "unit" representing the whole media
            return [{
              id: `single-${media.id}`,
              title: media.title,
              ordinal: 1,
              subtype: media.type === "movie" ? "episode" : "chapter" as const,
              runtimeSec: media.duration || (media.type === "movie" ? 120 * 60 : undefined),
            }];
        }
      } catch (error) {
        console.error("Error fetching media units:", error);
        // Fallback to generic units on error
        const isChapterBased = ["book", "manga"].includes(media.type);
        const isEpisodeBased = ["webtoon"].includes(media.type);
        
        return Array.from({ length: 5 }).map((_, i) => ({
          id: `fallback-${media.id}-${i + 1}`,
          title: isChapterBased ? `Chapter ${i + 1}` : `Episode ${i + 1}`,
          ordinal: i + 1,
          subtype: (isChapterBased ? "chapter" : "episode") as const,
          runtimeSec: 30 * 60,
          pages: isChapterBased ? 20 : undefined,
        }));
      }
    },
    enabled: !!media,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  });

  return {
    units,
    isLoading,
    error: error as Error | null,
  };
}