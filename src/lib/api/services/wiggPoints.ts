import { supabase } from '@/integrations/supabase/client';
import { createApiResponse, createApiError } from '../base';

interface CreateWiggPointParams {
  mediaTitle: string;
  mediaType: string;
  userId: string;
  posKind: string;
  posValue: number;
  tags: string[];
  reasonShort: string;
  spoilerLevel: number;
}

export const wiggPointService = {
  createWiggPoint: async (params: CreateWiggPointParams) => {
    // Create media first
    const { data: mediaId, error: mediaError } = await supabase.rpc('upsert_media', {
      p_title: params.mediaTitle,
      p_type: params.mediaType,
      p_year: null
    });

    if (mediaError) {
      return createApiError(mediaError.message);
    }

    // Create WIGG point
    const { error: wiggError } = await supabase.rpc('add_wigg', {
      p_media_id: mediaId,
      p_episode_id: null,
      p_user_id: params.userId,
      p_pos_kind: params.posKind,
      p_pos_value: params.posValue,
      p_tags: params.tags,
      p_reason_short: params.reasonShort,
      p_spoiler: params.spoilerLevel
    });

    if (wiggError) {
      return createApiError(wiggError.message);
    }

    return createApiResponse({});
  }
};