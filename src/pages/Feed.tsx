import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { WiggPointCard } from '@/components/WiggPointCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Filter } from 'lucide-react';
import { usePageHeader } from '@/contexts/HeaderContext';
import { supabase } from '@/integrations/supabase/client';

type WiggPoint = Parameters<typeof WiggPointCard>[0]['point'];

const DUMMY: WiggPoint[] = [
  {
    id: 'f1', media_title: 'Midnight Run', type: 'movie', pos_kind: 'min', pos_value: 18,
    reason_short: 'Buddy dynamic clicks during the first chase',
    tags: ['chemistry','chase'], spoiler: '0',
    created_at: new Date(Date.now() - 1000*60*30).toISOString(),
    username: 'sam', user_id: '00000000-0000-0000-0000-000000000011', vote_score: 12,
  },
  {
    id: 'f2', media_title: 'The Expanse S1', type: 'tv show', pos_kind: 'episode', pos_value: 4,
    reason_short: 'Political threads converge and raise stakes',
    tags: ['politics','reveal'], spoiler: '1',
    created_at: new Date(Date.now() - 1000*60*60*2).toISOString(),
    username: 'arya', user_id: '00000000-0000-0000-0000-000000000012', vote_score: 34,
  },
  {
    id: 'f3', media_title: 'Dune (novel)', type: 'book', pos_kind: 'page', pos_value: 80,
    reason_short: 'Worldbuilding coheres; first maneuver lands',
    tags: ['politics','lore'], spoiler: '0',
    created_at: new Date(Date.now() - 1000*60*60*6).toISOString(),
    username: 'kyle', user_id: '00000000-0000-0000-0000-000000000013', vote_score: 21,
  },
  {
    id: 'f4', media_title: 'Into the Spider‑Verse', type: 'movie', pos_kind: 'min', pos_value: 25,
    reason_short: 'First big set‑piece + theme stated',
    tags: ['setpiece','theme'], spoiler: '0',
    created_at: new Date(Date.now() - 1000*60*60*12).toISOString(),
    username: 'miles', user_id: '00000000-0000-0000-0000-000000000014', vote_score: 57,
  },
  {
    id: 'f5', media_title: 'The Last of Us (game)', type: 'game', pos_kind: 'hour', pos_value: 2,
    reason_short: 'Systems open up and tone locks in',
    tags: ['mechanics','tone'], spoiler: '1',
    created_at: new Date(Date.now() - 1000*60*60*24).toISOString(),
    username: 'ellie', user_id: '00000000-0000-0000-0000-000000000015', vote_score: 40,
  },
  {
    id: 'f6', media_title: 'Better Call Saul S1', type: 'tv show', pos_kind: 'episode', pos_value: 3,
    reason_short: 'Character aim crystallizes with a clever pivot',
    tags: ['character','pivot'], spoiler: '0',
    created_at: new Date(Date.now() - 1000*60*60*30).toISOString(),
    username: 'kim', user_id: '00000000-0000-0000-0000-000000000016', vote_score: 19,
  },
  {
    id: 'f7', media_title: 'Arrival', type: 'movie', pos_kind: 'min', pos_value: 35,
    reason_short: 'Linguistics route surfaces; tone deepens',
    tags: ['tone','pivot'], spoiler: '0',
    created_at: new Date(Date.now() - 1000*60*60*42).toISOString(),
    username: 'lou', user_id: '00000000-0000-0000-0000-000000000017', vote_score: 28,
  },
  {
    id: 'f8', media_title: 'Andre Agassi – Open', type: 'book', pos_kind: 'page', pos_value: 50,
    reason_short: 'Voice fully lands; themes cohere',
    tags: ['voice','memoir'], spoiler: '0',
    created_at: new Date(Date.now() - 1000*60*60*72).toISOString(),
    username: 'serena', user_id: '00000000-0000-0000-0000-000000000018', vote_score: 13,
  },
  {
    id: 'f9', media_title: 'Dark S1', type: 'tv show', pos_kind: 'episode', pos_value: 5,
    reason_short: 'Timeline interlocks; mystery hooks in',
    tags: ['mystery','timelines'], spoiler: '2',
    created_at: new Date(Date.now() - 1000*60*60*96).toISOString(),
    username: 'ulrich', user_id: '00000000-0000-0000-0000-000000000019', vote_score: 31,
  },
  {
    id: 'f10', media_title: 'Spider‑Man 2 (PS5)', type: 'game', pos_kind: 'hour', pos_value: 1,
    reason_short: 'Traversal + first boss showcase mechanics',
    tags: ['traversal','boss'], spoiler: '0',
    created_at: new Date(Date.now() - 1000*60*60*120).toISOString(),
    username: 'pete', user_id: '00000000-0000-0000-0000-000000000020', vote_score: 22,
  },
];

export default function Feed() {
  const [mediaTypeFilter, setMediaTypeFilter] = useState<string>("all");
  const [spoilerFilter, setSpoilerFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  usePageHeader({
    title: "Community Feed",
    subtitle: "Latest WIGG points from the community",
    showBackButton: true,
    showHomeButton: true,
  });

  const { data: wiggPoints, isLoading, error, refetch } = useQuery({
    queryKey: ['feed', 'wigg-points', mediaTypeFilter, spoilerFilter],
    queryFn: async () => {
      let query = supabase
        .from('wigg_points')
        .select(`
          id,
          pos_kind,
          pos_value,
          tags,
          reason_short,
          spoiler,
          created_at,
          media!inner(
            id,
            title,
            type,
            year
          ),
          episodes(
            id,
            title,
            season,
            episode
          ),
          profiles!inner(
            username
          ),
          votes(
            value
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      // Apply filters
      if (mediaTypeFilter !== "all") {
        query = query.eq('media.type', mediaTypeFilter as "movie" | "tv" | "anime" | "game" | "book" | "podcast");
      }
      if (spoilerFilter !== "all") {
        query = query.eq('spoiler', spoilerFilter as "0" | "1" | "2");
      }

      const { data, error } = await query;
      if (error) throw error;

      // Transform to WiggPoint format
      return data.map((point: any) => ({
        id: point.id,
        media_title: point.episodes?.title 
          ? `${point.media.title} - ${point.episodes.title}`
          : point.media.title,
        type: point.media.type,
        pos_kind: point.pos_kind,
        pos_value: point.pos_value,
        reason_short: point.reason_short,
        tags: point.tags || [],
        spoiler: point.spoiler,
        created_at: point.created_at,
        username: point.profiles?.username,
        user_id: point.profiles?.id,
        vote_score: point.votes?.reduce((sum: number, vote: any) => sum + vote.value, 0) || 0,
      }));
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Set up real-time subscription for new wigg points
  useEffect(() => {
    const subscription = supabase
      .channel('wigg_points_feed')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'wigg_points' },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [refetch]);

  const points = wiggPoints || DUMMY; // Fallback to dummy data

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-1" />
            Filters
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        <Badge variant="secondary" className="text-xs">
          {points.length} points
        </Badge>
      </div>

      {showFilters && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium mb-2 block">Media Type</label>
                <Tabs value={mediaTypeFilter} onValueChange={setMediaTypeFilter}>
                  <TabsList className="grid grid-cols-6 w-full">
                    <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                    <TabsTrigger value="movie" className="text-xs">Movies</TabsTrigger>
                    <TabsTrigger value="tv" className="text-xs">TV</TabsTrigger>
                    <TabsTrigger value="anime" className="text-xs">Anime</TabsTrigger>
                    <TabsTrigger value="book" className="text-xs">Books</TabsTrigger>
                    <TabsTrigger value="podcast" className="text-xs">Podcasts</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <div>
                <label className="text-xs font-medium mb-2 block">Spoiler Level</label>
                <Tabs value={spoilerFilter} onValueChange={setSpoilerFilter}>
                  <TabsList className="grid grid-cols-4 w-full">
                    <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                    <TabsTrigger value="0" className="text-xs">No Spoilers</TabsTrigger>
                    <TabsTrigger value="1" className="text-xs">Light</TabsTrigger>
                    <TabsTrigger value="2" className="text-xs">Heavy</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Failed to load wigg points. Using sample data.
            </p>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-1" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-6">
            {points.map((point) => (
              <WiggPointCard 
                key={point.id} 
                point={point}
                onVoteUpdate={(pointId, newScore, userVote) => {
                  // Optimistically update the vote score
                  refetch();
                }}
              />
            ))}
          </div>

          {points.length === 0 && (
            <Card className="mt-8">
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No wigg points found with current filters.
                </p>
              </CardContent>
            </Card>
          )}

          {wiggPoints && wiggPoints.length > 0 && (
            <Card className="mt-8">
              <CardContent className="p-4 text-xs text-muted-foreground text-center">
                Live feed powered by Supabase • Real-time updates enabled
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

