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
  },

  getComments: async (pointId: string) => {
    const { data, error } = await supabase
      .from('wigg_point_comments')
      .select('id, user_id, point_id, content, created_at, updated_at, profiles(username)')
      .eq('point_id', pointId)
      .order('created_at', { ascending: true });

    if (error) {
      return createApiError(error.message);
    }

    const comments = (data as any[]).map(row => ({
      id: row.id,
      userId: row.user_id,
      username: row.profiles?.username ?? 'Anonymous',
      content: row.content,
      createdAt: row.created_at
    }));

    return createApiResponse(comments);
  },

  addComment: async (params: { pointId: string; userId: string; content: string }) => {
    const { error } = await supabase
      .from('wigg_point_comments')
      .insert({
        point_id: params.pointId,
        user_id: params.userId,
        content: params.content
      });

    if (error) {
      return createApiError(error.message);
    }

    return createApiResponse(null);
  },

  deleteComment: async (params: { commentId: string; userId: string }) => {
    const { error } = await supabase
      .from('wigg_point_comments')
      .delete()
      .eq('id', params.commentId)
      .eq('user_id', params.userId);

    if (error) {
      return createApiError(error.message);
    }

    return createApiResponse(null);
  },

  checkFollowing: async (params: { followerId: string; targetUserId: string }) => {
    const { data, error } = await supabase
      .from('user_follows')
      .select('id')
      .eq('follower_id', params.followerId)
      .eq('following_id', params.targetUserId)
      .maybeSingle();

    if (error) {
      return createApiError(error.message);
    }

    return createApiResponse(Boolean(data));
  },

  followUser: async (params: { followerId: string; targetUserId: string }) => {
    const { error } = await supabase
      .from('user_follows')
      .insert({
        follower_id: params.followerId,
        following_id: params.targetUserId
      });

    if (error) {
      return createApiError(error.message);
    }

    return createApiResponse(null);
  },

  unfollowUser: async (params: { followerId: string; targetUserId: string }) => {
    const { error } = await supabase
      .from('user_follows')
      .delete()
      .eq('follower_id', params.followerId)
      .eq('following_id', params.targetUserId);

    if (error) {
      return createApiError(error.message);
    }

    return createApiResponse(null);
  }
};