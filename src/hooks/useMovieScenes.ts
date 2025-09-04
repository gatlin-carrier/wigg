import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { type MovieScene } from '@/components/wigg/SceneSelector';
import { fetchChapterDbChapters } from '@/services/chapterdb';

export function useMovieScenes(mediaId: string | number, movieTitle?: string) {
  return useQuery({
    queryKey: ['movie-scenes', mediaId, movieTitle],
    queryFn: async (): Promise<MovieScene[]> => {
      // Skip community scenes if mediaId is not a UUID (external IDs won't work)
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(mediaId.toString());
      
      const [communityScenes, chapterDbScenes] = await Promise.allSettled([
        isUuid ? fetchCommunityScenes(mediaId) : Promise.resolve([]),
        movieTitle ? fetchChapterDbChapters(movieTitle) : Promise.resolve([])
      ]);

      const community = communityScenes.status === 'fulfilled' ? communityScenes.value : [];
      const chapterDb = chapterDbScenes.status === 'fulfilled' ? chapterDbScenes.value : [];

      // Combine and sort by timestamp
      return [...chapterDb, ...community].sort((a, b) => a.timestampSeconds - b.timestampSeconds);
    },
    enabled: !!mediaId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

async function fetchCommunityScenes(mediaId: string | number): Promise<MovieScene[]> {
  const { data, error } = await supabase
    .from('movie_scenes')
    .select(`
      id,
      timestamp_seconds,
      scene_name,
      description,
      votes,
      verified,
      submitted_by
    `)
    .eq('media_id', mediaId)
    .order('timestamp_seconds', { ascending: true });

  if (error) throw error;

  return data.map(scene => ({
    id: scene.id,
    timestampSeconds: scene.timestamp_seconds,
    sceneName: scene.scene_name,
    description: scene.description || undefined,
    votes: scene.votes,
    verified: scene.verified,
    submittedBy: scene.submitted_by,
  }));
}

export function useAddMovieScene() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      mediaId,
      timestampSeconds,
      sceneName,
      description,
    }: {
      mediaId: string | number;
      timestampSeconds: number;
      sceneName: string;
      description?: string;
    }) => {
      if (!user) throw new Error('Must be authenticated to add scenes');

      const { data, error } = await supabase
        .from('movie_scenes')
        .insert({
          media_id: mediaId,
          timestamp_seconds: timestampSeconds,
          scene_name: sceneName,
          description: description || null,
          submitted_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch scenes for this media
      queryClient.invalidateQueries({ queryKey: ['movie-scenes', variables.mediaId] });
    },
  });
}

export function useVoteOnScene() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sceneId,
      voteType,
    }: {
      sceneId: string;
      voteType: -1 | 0 | 1; // -1 downvote, 0 neutral, 1 upvote
    }) => {
      if (!user) throw new Error('Must be authenticated to vote');

      // Upsert vote (insert or update if exists)
      const { data, error } = await supabase
        .from('movie_scene_votes')
        .upsert({
          scene_id: sceneId,
          user_id: user.id,
          vote_type: voteType,
        }, {
          onConflict: 'scene_id, user_id'
        });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidate scenes query to refresh vote counts
      queryClient.invalidateQueries({ queryKey: ['movie-scenes'] });
    },
  });
}

export function useUserSceneVotes(sceneIds: string[]) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['scene-votes', user?.id, sceneIds],
    queryFn: async (): Promise<Record<string, number>> => {
      if (!user || sceneIds.length === 0) return {};

      const { data, error } = await supabase
        .from('movie_scene_votes')
        .select('scene_id, vote_type')
        .eq('user_id', user.id)
        .in('scene_id', sceneIds);

      if (error) throw error;

      return data.reduce((acc, vote) => {
        acc[vote.scene_id] = vote.vote_type;
        return acc;
      }, {} as Record<string, number>);
    },
    enabled: !!user && sceneIds.length > 0,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}