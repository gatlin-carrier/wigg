import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Play, Book } from "lucide-react";
import { getTvSeasons, getTvEpisodes } from "@/integrations/tmdb/client";
import { useQuery } from "@tanstack/react-query";
import { type MediaSearchResult } from "./MediaSearch";

interface SeasonVolumeData {
  id: number;
  name: string;
  number: number;
  episodeCount?: number;
  airDate?: string;
  overview?: string;
  posterPath?: string;
}

interface SeasonVolumeSelectorProps {
  media: MediaSearchResult;
  onSelectionChange: (seasonNumber?: number, volumeNumber?: number, episodeData?: { id: string, title: string, number: number }) => void;
  className?: string;
}

export function SeasonVolumeSelector({ 
  media, 
  onSelectionChange, 
  className = "" 
}: SeasonVolumeSelectorProps) {
  const [selectedSeason, setSelectedSeason] = useState<string>("");
  const [selectedVolume, setSelectedVolume] = useState<string>("");
  const [selectedEpisode, setSelectedEpisode] = useState<string>("");

  // Fetch TV seasons from TMDB
  const { data: seasons, isLoading: seasonsLoading } = useQuery({
    queryKey: ['tv-seasons', media.id],
    queryFn: async () => {
      if (!media.externalIds?.tmdb_id) return [];
      const seasonsData = await getTvSeasons(media.externalIds.tmdb_id);
      return seasonsData.filter((season: any) => season.season_number > 0); // Filter out specials (season 0)
    },
    enabled: (media.type === "tv" || media.type === "anime") && !!media.externalIds?.tmdb_id,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours (season data rarely changes)
  });

  // Fetch episodes for selected season
  const { data: episodes, isLoading: episodesLoading } = useQuery({
    queryKey: ['tv-episodes', media.id, selectedSeason],
    queryFn: async () => {
      if (!media.externalIds?.tmdb_id || !selectedSeason) return [];
      return await getTvEpisodes(media.externalIds.tmdb_id, parseInt(selectedSeason));
    },
    enabled: (media.type === "tv" || media.type === "anime") && !!media.externalIds?.tmdb_id && !!selectedSeason,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  // Generate volumes for manga (if volume count is available)
  const volumes: SeasonVolumeData[] = React.useMemo(() => {
    if (media.type !== "manga") return [];
    
    // Use actual volume count if available, otherwise estimate from chapters
    const volumeCount = media.volumeCount || (media.chapterCount ? Math.ceil(media.chapterCount / 10) : 0);
    
    if (volumeCount === 0) return [];
    
    const chaptersPerVolume = media.chapterCount ? Math.ceil(media.chapterCount / volumeCount) : 10;
    
    return Array.from({ length: volumeCount }, (_, i) => ({
      id: i + 1,
      name: `Volume ${i + 1}`,
      number: i + 1,
      episodeCount: media.chapterCount 
        ? Math.min(chaptersPerVolume, media.chapterCount - (i * chaptersPerVolume))
        : chaptersPerVolume,
    }));
  }, [media]);

  const handleSeasonSelect = (seasonNumber: string) => {
    // Toggle selection - if already selected, deselect
    const newSeason = selectedSeason === seasonNumber ? "" : seasonNumber;
    setSelectedSeason(newSeason);
    // Clear episode selection when season changes
    setSelectedEpisode("");
    const num = newSeason ? parseInt(newSeason) : undefined;
    const volNum = selectedVolume ? parseInt(selectedVolume) : undefined;
    onSelectionChange(num, volNum, undefined);
  };

  const handleVolumeSelect = (volumeNumber: string) => {
    // Toggle selection - if already selected, deselect
    const newVolume = selectedVolume === volumeNumber ? "" : volumeNumber;
    setSelectedVolume(newVolume);
    const num = newVolume ? parseInt(newVolume) : undefined;
    const seasonNum = selectedSeason ? parseInt(selectedSeason) : undefined;
    onSelectionChange(seasonNum, num, undefined);
  };

  const handleEpisodeSelect = (episodeId: string) => {
    // Toggle selection - if already selected, deselect
    const newEpisode = selectedEpisode === episodeId ? "" : episodeId;
    setSelectedEpisode(newEpisode);
    
    // Find the episode data and pass it to the callback
    const episodeData = episodes?.find((ep: any) => ep.id === episodeId);
    const seasonNum = selectedSeason ? parseInt(selectedSeason) : undefined;
    const volNum = selectedVolume ? parseInt(selectedVolume) : undefined;
    
    if (episodeData && newEpisode) {
      onSelectionChange(seasonNum, volNum, {
        id: episodeData.id,
        title: episodeData.title,
        number: episodeData.episodeNumber || episodeData.ordinal || 1
      });
    } else {
      onSelectionChange(seasonNum, volNum, undefined);
    }
  };

  // Auto-select Episode 1 when episodes load for a new season
  useEffect(() => {
    if (selectedSeason && episodes && episodes.length > 0 && !selectedEpisode) {
      // Find Episode 1 (or the first episode)
      const firstEpisode = episodes.find((ep: any) => ep.episodeNumber === 1 || ep.ordinal === 1) || episodes[0];
      
      if (firstEpisode) {
        setSelectedEpisode(firstEpisode.id);
        const seasonNum = selectedSeason ? parseInt(selectedSeason) : undefined;
        const volNum = selectedVolume ? parseInt(selectedVolume) : undefined;
        
        onSelectionChange(seasonNum, volNum, {
          id: firstEpisode.id,
          title: firstEpisode.title,
          number: firstEpisode.episodeNumber || firstEpisode.ordinal || 1
        });
      }
    }
  }, [selectedSeason, episodes, selectedEpisode, selectedVolume, onSelectionChange]);

  // Don't render if not applicable
  if (!((media.type === "tv" || media.type === "anime") && seasons?.length > 1) && 
      !(media.type === "manga" && volumes.length)) {
    return null;
  }

  return (
    <div className={className}>
        {/* TV Show/Anime Season Selector */}
        {(media.type === "tv" || media.type === "anime") && seasons && seasons.length > 1 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Play className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Season (optional):</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {seasons.map((season: any) => {
                const seasonNumber = season.season_number.toString();
                const isSelected = selectedSeason === seasonNumber;
                return (
                  <Button
                    key={season.id}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleSeasonSelect(seasonNumber)}
                    className={isSelected ? "ring-2 ring-primary ring-offset-2" : ""}
                  >
                    {season.name}
                  </Button>
                );
              })}
            </div>

            {/* Episode Selector */}
            {selectedSeason && episodes && episodes.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Play className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">Episodes:</span>
                </div>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                  {episodes.map((episode: any) => {
                    const isSelected = selectedEpisode === episode.id;
                    return (
                      <Button
                        key={episode.id}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleEpisodeSelect(episode.id)}
                        className={`h-6 px-2 py-0 text-xs ${
                          isSelected ? "ring-1 ring-primary ring-offset-1" : ""
                        }`}
                      >
                        E{episode.episodeNumber || episode.ordinal}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Manga Volume Selector */}
        {media.type === "manga" && volumes.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Book className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Volume (optional):</span>
            </div>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {volumes.map((volume) => {
                const volumeNumber = volume.number.toString();
                const isSelected = selectedVolume === volumeNumber;
                return (
                  <Button
                    key={volume.id}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleVolumeSelect(volumeNumber)}
                    className={isSelected ? "ring-2 ring-primary ring-offset-2" : ""}
                  >
                    Vol {volume.number}
                  </Button>
                );
              })}
            </div>
          </div>
        )}
    </div>
  );
}