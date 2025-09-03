import { useQuery } from "@tanstack/react-query";
import { getMangaDxChapters, getMangaDxDetails, findMangaDxByTitle } from "./client";

export function useMangaDxChapters(mangaId: string | undefined, language = 'en') {
  return useQuery({
    queryKey: ['mangadx-chapters', mangaId, language],
    queryFn: () => getMangaDxChapters(mangaId!, language),
    enabled: !!mangaId,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    retry: 1,
  });
}

export function useMangaDxDetails(mangaId: string | undefined) {
  return useQuery({
    queryKey: ['mangadx-details', mangaId],
    queryFn: () => getMangaDxDetails(mangaId!),
    enabled: !!mangaId,
    staleTime: 30 * 60 * 1000, // Cache for 30 minutes
    retry: 1,
  });
}

export function useMangaDxSearch(title: string) {
  return useQuery({
    queryKey: ['mangadx-search', title],
    queryFn: () => findMangaDxByTitle(title),
    enabled: !!title && title.length > 2,
    staleTime: 60 * 60 * 1000, // Cache for 1 hour
    retry: 1,
  });
}