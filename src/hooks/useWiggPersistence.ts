import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { type Moment } from "@/components/wigg/MomentCapture";
import { type SwipeValue } from "@/components/wigg/SwipeRating";
import { type MediaSearchResult } from "@/components/media/MediaSearch";

interface WiggRating {
  mediaId: string;
  value: SwipeValue;
  position: number;
  positionType: "sec" | "page" | "episode";
}

export function useWiggPersistence() {
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();

  const saveWiggRating = async (rating: WiggRating): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to save ratings",
        variant: "destructive",
      });
      return false;
    }

    try {
      setIsSaving(true);

      // For retrospective ratings, we don't need to store episodes
      // Just store the position (episode/chapter number) as pos_value
      const { error } = await supabase.from("wigg_points").insert({
        media_id: rating.mediaId,
        episode_id: null, // Not using episodes for retrospective ratings
        user_id: user.id,
        pos_kind: rating.positionType === "episode" ? "sec" : rating.positionType as any,
        pos_value: rating.position,
        tags: [`rating_${rating.value}`],
        reason_short: `Rated ${["Skip", "Okay", "Good", "Peak"][rating.value]}`,
        spoiler: "0",
      });

      if (error) throw error;

      toast({
        title: "Rating saved",
        description: `Your ${["skip", "okay", "good", "peak"][rating.value]} rating has been saved`,
      });

      return true;
    } catch (error) {
      console.error("Error saving rating:", error);
      toast({
        title: "Save failed",
        description: "Could not save your rating. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const saveMoment = async (
    moment: Moment,
    media: MediaSearchResult,
    episodeId?: string
  ): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to save moments",
        variant: "destructive",
      });
      return false;
    }

    try {
      setIsSaving(true);

      // Map spoiler level to database format
      const spoilerMap = { none: "0", light: "1", heavy: "2" } as const;

      const { error } = await supabase.from("wigg_points").insert({
        media_id: media.id,
        episode_id: episodeId || null,
        user_id: user.id,
        pos_kind: moment.anchorType === "timestamp" ? "sec" : "page",
        pos_value: moment.anchorValue,
        tags: moment.whyTags,
        reason_short: moment.notes || undefined,
        spoiler: spoilerMap[moment.spoilerLevel],
      });

      if (error) throw error;

      toast({
        title: "Moment saved",
        description: "Your moment has been added to the community feed",
      });

      return true;
    } catch (error) {
      console.error("Error saving moment:", error);
      toast({
        title: "Save failed",
        description: "Could not save your moment. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const saveMediaToDatabase = async (media: MediaSearchResult): Promise<string> => {
    try {
      // First, check if media already exists
      const { data: existingMedia } = await supabase
        .from("media")
        .select("id")
        .eq("external_ids->>'anilist_id'", media.externalIds?.anilist_id?.toString())
        .eq("external_ids->>'tmdb_id'", media.externalIds?.tmdb_id?.toString())
        .eq("external_ids->>'podcast_guid'", media.externalIds?.podcast_guid)
        .single();

      if (existingMedia) {
        return existingMedia.id;
      }

      // Map MediaType to database format
      let dbType: "movie" | "tv" | "anime" | "game" | "book" | "podcast";
      
      if (media.type === "manga") {
        dbType = "book";
      } else if (media.type === "tv") {
        dbType = "tv";
      } else {
        dbType = media.type as "movie" | "tv" | "anime" | "game" | "book" | "podcast";
      }

      // Create new media entry
      const { data: newMedia, error } = await supabase
        .from("media")
        .insert({
          type: dbType,
          title: media.title,
          year: media.year,
          duration_sec: media.duration,
          pages: media.chapterCount,
          external_ids: media.externalIds,
          metadata: {
            coverImage: media.coverImage,
            description: media.description,
            episodeCount: media.episodeCount,
          },
        })
        .select("id")
        .single();

      if (error) throw error;
      return newMedia.id;
    } catch (error) {
      console.error("Error saving media:", error);
      throw error;
    }
  };

  return {
    isSaving,
    saveWiggRating,
    saveMoment,
    saveMediaToDatabase,
  };
}