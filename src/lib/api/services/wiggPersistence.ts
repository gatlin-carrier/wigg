import { supabase } from '@/integrations/supabase/client';
import { createApiResponse, createApiError } from '../base';

export const wiggPersistenceService = {
  saveWiggRating: async (params: any) => {
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
  }
};