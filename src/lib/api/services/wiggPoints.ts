import { supabase } from '@/integrations/supabase/client';
import { createApiResponse } from '../base';

export const wiggPointService = {
  createWiggPoint: async (params: any) => {
    // Create media first
    const { data: mediaId } = await supabase.rpc('upsert_media', {
      p_title: params.mediaTitle,
      p_type: params.mediaType,
      p_year: null
    });

    // Create WIGG point
    await supabase.rpc('add_wigg', {
      p_media_id: mediaId,
      p_episode_id: null,
      p_user_id: params.userId,
      p_pos_kind: params.posKind,
      p_pos_value: params.posValue,
      p_tags: params.tags,
      p_reason_short: params.reasonShort,
      p_spoiler: params.spoilerLevel
    });

    return createApiResponse({});
  }
};