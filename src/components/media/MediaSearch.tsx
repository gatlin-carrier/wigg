import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus } from "lucide-react";
import { useAnilistMangaSearch } from "@/integrations/anilist/hooks";
import { usePodcastSearch } from "@/integrations/podcast-search/hooks";
import { useTmdbSearch } from "@/integrations/tmdb/hooks";
import { useOpenLibrarySearch } from "@/integrations/openlibrary/searchHooks";
import { type MediaType } from "../wigg/MomentCapture";

// Helper function to safely parse year from date strings
function parseYear(dateStr?: string): number | undefined {
  if (!dateStr) return undefined;
  
  // First try parsing as a date
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    const year = date.getFullYear();
    if (year > 1800 && year < 2100) return year;
  }
  
  // If that fails, try extracting 4-digit year from the string
  const yearMatch = dateStr.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    const year = parseInt(yearMatch[0], 10);
    if (year > 1800 && year < 2100) return year;
  }
  
  return undefined;
}

export interface MediaSearchResult {
  id: string;
  title: string;
  year?: number;
  type: MediaType;
  coverImage?: string;
  description?: string;
  episodeCount?: number;
  chapterCount?: number;
  volumeCount?: number;
  duration?: number;
  externalIds?: {
    tmdb_id?: number;
    anilist_id?: number;
    podcast_guid?: string;
    openlibrary_id?: string;
    mangadx_id?: string;
    search_title?: string;
  };
}

interface MediaSearchProps {
  onMediaSelect: (media: MediaSearchResult) => void;
  className?: string;
}

export function MediaSearch({ onMediaSelect, className = "" }: MediaSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<MediaType>("anime");
  const [showCreateCustom, setShowCreateCustom] = useState(false);

  const mangaSearch = useAnilistMangaSearch((activeTab === "manga" || activeTab === "webtoon") ? searchQuery : "");
  const podcastSearch = usePodcastSearch(activeTab === "podcast" ? searchQuery : "");
  const tvSearch = useTmdbSearch(activeTab === "tv" ? searchQuery : "", "multi");
  const animeSearch = useTmdbSearch(activeTab === "anime" ? searchQuery : "", "multi");
  const bookSearch = useOpenLibrarySearch(activeTab === "book" ? searchQuery : "");

  const getSearchResults = (): MediaSearchResult[] => {
    switch (activeTab) {
      case "tv":
        return tvSearch.data?.results?.filter((item: any) => 
          item.media_type === 'tv' || item.name
        ).map((item: any) => ({
          id: item.id.toString(),
          title: item.name || item.title || "Unknown Title",
          year: parseYear(item.first_air_date || item.release_date),
          type: "tv" as MediaType,
          coverImage: item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : undefined,
          description: item.overview,
          episodeCount: item.number_of_episodes,
          externalIds: { tmdb_id: item.id },
        })) || [];

      case "anime":
        return animeSearch.data?.results?.filter((item: any) => 
          // Filter for anime (animation genre + Japanese origin)
          item.genre_ids?.includes(16) && 
          (item.original_language === 'ja' || item.origin_country?.includes('JP'))
        ).map((item: any) => ({
          id: item.id.toString(),
          title: item.name || item.title || "Unknown Title",
          year: parseYear(item.first_air_date || item.release_date),
          type: "anime" as MediaType,
          coverImage: item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : undefined,
          description: item.overview,
          episodeCount: item.number_of_episodes,
          externalIds: { tmdb_id: item.id },
        })) || [];

      case "book":
        return bookSearch.data?.map((item: any) => ({
          id: item.id,
          title: item.title || "Unknown Title",
          year: item.year,
          type: "book" as MediaType,
          coverImage: item.cover_url,
          description: item.genre,
          externalIds: { openlibrary_id: item.id },
        })) || [];

      case "manga":
        return mangaSearch.data?.map((item: any) => ({
          id: item.id.toString(),
          title: item.title?.english || item.title?.romaji || "Unknown Title",
          year: item.startDate?.year,
          type: "manga" as MediaType,
          coverImage: item.coverImage?.medium,
          description: item.description,
          chapterCount: item.chapters,
          volumeCount: item.volumes,
          externalIds: { 
            anilist_id: item.id,
            // Store title for MangaDx cross-reference
            search_title: item.title?.english || item.title?.romaji
          },
        })) || [];

      case "webtoon":
        // Use AniList webtoon data but mark as webtoon type
        return mangaSearch.data?.map((item: any) => ({
          id: item.id.toString(),
          title: item.title?.english || item.title?.romaji || "Unknown Title",
          year: item.startDate?.year,
          type: "webtoon" as MediaType,
          coverImage: item.coverImage?.medium,
          description: item.description,
          chapterCount: item.chapters,
          externalIds: { 
            anilist_id: item.id,
            // Store title for MangaDx cross-reference
            search_title: item.title?.english || item.title?.romaji
          },
        })) || [];
      
      case "podcast":
        return podcastSearch.data?.resolved?.show ? [{
          id: podcastSearch.data.resolved.show.id,
          title: podcastSearch.data.resolved.show.title,
          year: undefined,
          type: "podcast" as MediaType,
          coverImage: podcastSearch.data.resolved.show.artwork?.url,
          description: undefined,
          externalIds: { podcast_guid: podcastSearch.data.resolved.show.id },
        }] : [];
      
      default:
        return [];
    }
  };

  const results = getSearchResults();
  const isLoading = mangaSearch.isLoading || podcastSearch.isLoading || tvSearch.isLoading || animeSearch.isLoading || bookSearch.isLoading;

  const handleCreateCustom = () => {
    const customMedia: MediaSearchResult = {
      id: `custom-${Date.now()}`,
      title: searchQuery || "Custom Media",
      type: activeTab,
      year: new Date().getFullYear(),
    };
    onMediaSelect(customMedia);
  };

  return (
    <Card className={`rounded-2xl shadow-sm ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Search className="h-4 w-4" />
          Search Media
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Search for movies, shows, books, manga, podcasts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MediaType)}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="tv">TV</TabsTrigger>
            <TabsTrigger value="anime">Anime</TabsTrigger>
            <TabsTrigger value="book">Book</TabsTrigger>
            <TabsTrigger value="manga">Manga</TabsTrigger>
            <TabsTrigger value="webtoon">Webtoon</TabsTrigger>
            <TabsTrigger value="podcast">Podcast</TabsTrigger>
          </TabsList>
        </Tabs>

        {searchQuery && (
          <div className="space-y-2">
            {isLoading ? (
              <div className="text-center py-4 text-sm text-muted-foreground">
                Searching...
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {results.map((media) => (
                  <button
                    key={media.id}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer w-full text-left bg-red-100 border-red-500"
                    onClick={(e) => {
                      console.log('MediaSearch click handler called', media);
                      e.preventDefault();
                      onMediaSelect(media);
                    }}
                  >
                    {media.coverImage && (
                      <img
                        src={media.coverImage}
                        alt={media.title}
                        className="w-12 h-16 object-cover rounded"
                        width="48"
                        height="64"
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{media.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {media.year && <span>{media.year}</span>}
                        <Badge variant="outline" className="text-[10px]">
                          {media.type}
                        </Badge>
                        {media.episodeCount && (
                          <span>{media.episodeCount} episodes</span>
                        )}
                        {media.chapterCount && (
                          <span>{media.chapterCount} chapters</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="text-sm text-muted-foreground mb-2">
                  No results found for "{searchQuery}"
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCreateCustom}
                  className="text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Create custom {activeTab}
                </Button>
              </div>
            )}
          </div>
        )}

        {!searchQuery && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            Search for media to start rating and capturing moments
          </div>
        )}
      </CardContent>
    </Card>
  );
}