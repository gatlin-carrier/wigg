import { useState } from "react";
import { wiggPersistenceService } from "@/lib/api/services/wiggPersistence";
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

      const result = await wiggPersistenceService.saveWiggRating({
        mediaId: rating.mediaId,
        userId: user.id,
        value: rating.value,
        position: rating.position,
        positionType: rating.positionType
      });

      if (!result.success) {
        throw new Error(result.error.message);
      }

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

      const result = await wiggPersistenceService.saveMoment({
        mediaId: media.id,
        episodeId,
        userId: user.id,
        anchorType: moment.anchorType,
        anchorValue: moment.anchorValue,
        whyTags: moment.whyTags,
        notes: moment.notes,
        spoilerLevel: moment.spoilerLevel
      });

      if (!result.success) {
        throw new Error(result.error.message);
      }

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
    const result = await wiggPersistenceService.saveMediaToDatabase({
      type: media.type,
      title: media.title,
      year: media.year,
      duration: media.duration,
      chapterCount: media.chapterCount,
      externalIds: media.externalIds
    });

    if (!result.success) {
      throw new Error(result.error.message);
    }

    return result.data;
  };

  return {
    isSaving,
    saveWiggRating,
    saveMoment,
    saveMediaToDatabase,
  };
}