import { supabase } from '@/integrations/supabase/client';
import { createApiResponse, createApiError } from '../base';

export const socialService = {
  getFollowerCounts: async (userId: string) => {
    const [followerRes, followingRes] = await Promise.all([
      supabase.rpc('get_follower_count', { user_id: userId }),
      supabase.rpc('get_following_count', { user_id: userId })
    ]);

    if (followerRes.error) {
      return createApiError(followerRes.error.message);
    }

    if (followingRes.error) {
      return createApiError(followingRes.error.message);
    }

    return createApiResponse({
      followers: followerRes.data,
      following: followingRes.data
    });
  },

  toggleLike: async (params: { pointId: string; userId: string; isLiked: boolean }) => {
    if (!params.isLiked) {
      const { error } = await supabase
        .from('wigg_point_likes')
        .insert({
          point_id: params.pointId,
          user_id: params.userId
        });

      if (error) {
        return createApiError(error.message);
      }
    } else {
      const { error } = await supabase
        .from('wigg_point_likes')
        .delete()
        .eq('point_id', params.pointId)
        .eq('user_id', params.userId);

      if (error) {
        return createApiError(error.message);
      }
    }

    return createApiResponse(null);
  },

  getLikeCount: async (pointId: string) => {
    const { data, error } = await supabase.rpc('get_wigg_point_like_count', { point_id: pointId });

    if (error) {
      return createApiError(error.message);
    }

    return createApiResponse(data);
  },

  hasUserLiked: async (pointId: string, userId: string) => {
    const { data, error } = await supabase.rpc('user_liked_wigg_point', { point_id: pointId, user_id: userId });

    if (error) {
      return createApiError(error.message);
    }

    return createApiResponse(data);
  }
};