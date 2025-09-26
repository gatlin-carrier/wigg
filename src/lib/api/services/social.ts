import { supabase } from '@/integrations/supabase/client';
import { createApiResponse } from '../base';

export const socialService = {
  getFollowerCounts: async (userId: string) => {
    const [followerRes, followingRes] = await Promise.all([
      supabase.rpc('get_follower_count', { user_id: userId }),
      supabase.rpc('get_following_count', { user_id: userId })
    ]);

    return createApiResponse({
      followers: followerRes.data,
      following: followingRes.data
    });
  }
};