import { supabase } from '@/integrations/supabase/client';
import { createApiResponse, createApiError } from '../base';

interface SaveWiggRatingParams {
  mediaId: string;
  userId: string;
  value: number;
  position: number;
  positionType: string;
}

export const wiggPersistenceService = {
  saveWiggRating: async (params: SaveWiggRatingParams) => {
    const { error } = await supabase.from('wigg_points').insert({
      media_id: params.mediaId,
      episode_id: null,
      user_id: params.userId,
      pos_kind: params.positionType,
      pos_value: params.position,
      tags: [`rating_${params.value}`],
      reason_short: 'Rated better',
      spoiler: '0'
    });

    if (error) {
      return createApiError(error.message);
    }

    return createApiResponse(null);
  },

  saveMoment: async (params: {
    mediaId: string;
    episodeId?: string;
    userId: string;
    anchorType: 'timestamp' | 'page';
    anchorValue: number;
    whyTags: string[];
    notes?: string;
    spoilerLevel: 'none' | 'light' | 'heavy';
  }) => {
    const spoilerMap = { none: '0', light: '1', heavy: '2' } as const;

    const { error } = await supabase.from('wigg_points').insert({
      media_id: params.mediaId,
      episode_id: params.episodeId || null,
      user_id: params.userId,
      pos_kind: params.anchorType === 'timestamp' ? 'sec' : 'page',
      pos_value: params.anchorValue,
      tags: params.whyTags,
      reason_short: params.notes || undefined,
      spoiler: spoilerMap[params.spoilerLevel]
    });

    if (error) {
      return createApiError(error.message);
    }

    return createApiResponse(null);
  },

  saveMediaToDatabase: async (params: any) => {
    const { data: mediaId, error } = await supabase.rpc("upsert_media", {
      p_type: params.type,
      p_title: params.title,
      p_year: params.year,
      p_duration_sec: params.duration,
      p_pages: params.chapterCount,
      p_external_ids: params.externalIds
    });

    if (error) {
      return createApiError(error.message);
    }

    return createApiResponse(mediaId);
  }
};