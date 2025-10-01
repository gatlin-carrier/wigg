import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Star, Calendar, Clock, ExternalLink, Plus, TrendingUp, Activity, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { getMovieDetails, getTvDetails, getImageUrl } from '@/integrations/tmdb/client';
import { fetchAnimeDetails, fetchMangaDetails } from '@/integrations/anilist/client';
import { fetchWorkDetails } from '@/integrations/openlibrary/client';
import { useTmdbMovieGenres } from '@/integrations/tmdb/hooks';
import { normalizeRatingTo10, formatRating10 } from '@/lib/ratings';
import { formatT2G } from '@/lib/wigg/format';
import { classifyPeakFromSegments, resampleSegments } from '@/lib/wigg/analysis';
import { supabase } from '@/integrations/supabase/client';
import { usePageHeader } from '@/contexts/HeaderContext';
import { useTitleProgress } from '@/hooks/useTitleProgress';
import { useUserWiggs } from '@/hooks/useUserWiggs';
import { useUserWiggsDataLayer } from '@/data/hooks/useUserWiggsDataLayer';
import { MiniGoodnessCurve } from '@/components/wigg/MiniGoodnessCurve';
import { useMediaUnits } from '@/hooks/useMediaUnits';
import { useFeatureFlag } from '@/lib/featureFlags';
import type { MediaSearchResult } from '@/components/media/MediaSearch';

export default function MediaDetails() {
  const { source, id } = useParams<{ source: string; id: string }>();
  const navigate = useNavigate();
  
  // Configure header first, before any other logic
  usePageHeader({
    title: "Media Details",
    showBackButton: true,
    showHomeButton: true,
  });
  
  const [heroColor, setHeroColor] = React.useState<string | undefined>(undefined);
  const [bgError, setBgError] = React.useState<boolean>(false);
  const [enlargedImage, setEnlargedImage] = React.useState<{ url: string; alt: string } | null>(null);
  
  const { data: movieGenres = {} } = useTmdbMovieGenres();
  
  const { data: movie, isLoading, error } = useQuery({
    queryKey: ['media-details', source, id],
    queryFn: async () => {
      if ((source === 'tmdb' || source === 'tmdb-movie') && id) {
        return await getMovieDetails(parseInt(id));
      }
      if (source === 'tmdb-tv' && id) {
        return await getTvDetails(parseInt(id));
      }
      if (source === 'anilist' && id) {
        return await fetchAnimeDetails(parseInt(id));
      }
      if (source === 'anilist-manga' && id) {
        return await fetchMangaDetails(parseInt(id));
      }
      if (source === 'game' && id) {
        const { data, error } = await supabase.functions.invoke('fetch-game-details', {
          body: { id: Number(id) },
        });
        if (error) throw error;
        // Support either { game: {...} } or raw object shape
        const payload: any = data ?? null;
        return (payload?.game ?? payload) as any;
      }
      if (source === 'openlibrary' && id) {
        return await fetchWorkDetails(id);
      }
      throw new Error('Unsupported media source');
    },
    enabled: !!source && !!id,
  });

  // Media type flags and hero image candidates computed before any returns
  const isTmdbMovie = source === 'tmdb' || source === 'tmdb-movie';
  const isTmdbTv = source === 'tmdb-tv';
  const isGame = source === 'game';
  const isBook = source === 'openlibrary';
  const isAnilist = source === 'anilist' || source === 'anilist-manga';

  const hasLargeBackdrop = (isTmdbMovie || isTmdbTv)
    ? Boolean((movie as any)?.backdrop_path)
    : isGame
      ? Boolean((movie as any)?.background)
      : isAnilist
        ? Boolean((movie as any)?.bannerImage)
        : false;

  const backdropUrl = hasLargeBackdrop
    ? ((isTmdbMovie || isTmdbTv)
        ? getImageUrl((movie as any)?.backdrop_path, 'original')
        : isAnilist
          ? ((movie as any)?.bannerImage ?? undefined)
          : (movie as any)?.background ?? undefined)
    : undefined;

  const posterUrl = (isTmdbMovie || isTmdbTv)
    ? getImageUrl((movie as any)?.poster_path, 'w500')
    : isBook
      ? ((movie as any)?.cover_url ?? undefined)
      : isAnilist
        ? ((movie as any)?.coverImage?.extraLarge ?? (movie as any)?.coverImage?.large ?? undefined)
        : ((movie as any)?.cover ?? undefined);

  // Keep hooks order stable: effects must be above any early returns
  React.useEffect(() => {
    setBgError(false);
  }, [backdropUrl]);

  React.useEffect(() => {
    if (backdropUrl && !bgError) {
      setHeroColor(undefined);
      return;
    }
    const candidate = posterUrl || undefined;
    let cancelled = false;
    if (!candidate) {
      setHeroColor(undefined);
      return;
    }
    extractDominantColor(candidate)
      .then((rgb) => {
        if (!cancelled) setHeroColor(rgb);
      })
      .catch(() => {
        if (!cancelled) setHeroColor(undefined);
      });
    return () => {
      cancelled = true;
    };
  }, [backdropUrl, posterUrl, bgError]);

  // Community pacing data keyed by a stable local id (source:id)
  const titleKey = `${source ?? 'media'}:${id ?? ''}`;
  const { data: progressData } = useTitleProgress(titleKey);

  // Feature flag for data layer coexistence
  const useNewDataLayer = useFeatureFlag('media-details-data-layer');
  const legacyWiggsData = useUserWiggs(titleKey, { enabled: !useNewDataLayer });
  const newWiggsData = useUserWiggsDataLayer(titleKey, { enabled: useNewDataLayer });
  const { data: wiggsData } = useNewDataLayer ? newWiggsData : legacyWiggsData;
  const { units } = useMediaUnits(movie ? {
    id: id || '',
    title: (movie as any)?.title || (movie as any)?.name || 'Title',
    type: (isTmdbTv ? 'tv' : (isAnilist ? 'anime' : (isBook ? 'book' : (isTmdbMovie ? 'movie' : 'game')))) as any,
    year: (movie as any)?.release_date ? parseInt((movie as any).release_date.slice(0,4)) : undefined,
    coverImage: posterUrl,
    externalIds: { tmdb_id: (isTmdbMovie || isTmdbTv) ? Number(id) : undefined }
  } as any : null);

  const segments = progressData?.segments ?? [];
  const segmentCount = progressData?.segmentCount ?? segments.length;
  const curveValues = React.useMemo(() => {
    if (!segments.length) return [];
    const bins = segmentCount > 0 ? segmentCount : segments.length || 1;
    return resampleSegments(segments, bins);
  }, [segments, segmentCount]);

  const peakInfo = React.useMemo(() => classifyPeakFromSegments(segments), [segments]);
  const peakLabel = peakInfo.label;
  const PeakIcon = peakLabel === 'Even pacing' ? Activity : peakLabel === 'Peak late' ? Minus : TrendingUp;
  const totalSegments = segmentCount;
  const userWiggCount = wiggsData?.entries?.length ?? 0;
  const t2gEstimatePct = typeof wiggsData?.t2gEstimatePct === 'number' ? wiggsData.t2gEstimatePct : null;

  // Compute addWiggMedia early (before returns) to maintain hook order
  // This useMemo must be called unconditionally, but can return null when movie isn't loaded
  const addWiggMedia = React.useMemo<MediaSearchResult | null>(() => {
    if (!movie) return null;

    // Compute display fields
    const title = isTmdbMovie
      ? (movie as any).title
      : isTmdbTv
        ? ((movie as any)?.name ?? 'Untitled')
      : isAnilist
        ? (((movie as any)?.title?.english ?? (movie as any)?.title?.romaji) ?? 'Untitled')
      : isBook
        ? ((movie as any)?.title ?? 'Untitled')
        : ((movie as any)?.name ?? (movie as any)?.title ?? 'Untitled');

    const year = isTmdbMovie
      ? (movie as any).release_date?.slice(0, 4)
      : isTmdbTv
        ? ((movie as any)?.first_air_date || '').slice(0, 4)
      : isAnilist
        ? (String((movie as any)?.seasonYear ?? (movie as any)?.startDate?.year ?? '')).slice(0, 4)
      : isBook
        ? String((movie as any)?.first_publish_date ?? '').slice(0, 4)
        : String((movie as any)?.releaseDate ?? '').slice(0, 4);

    const runtime = isTmdbMovie
      ? (movie as any).runtime
      : isTmdbTv
        ? (Array.isArray((movie as any)?.episode_run_time) && (movie as any).episode_run_time[0]) || (movie as any)?.last_episode_to_air?.runtime || undefined
        : isAnilist
          ? (movie as any)?.duration || undefined
          : undefined;
    const runtimeMinutes = typeof runtime === 'number' ? runtime : undefined;

    const overview = (isTmdbMovie || isTmdbTv)
      ? (movie as any).overview
      : isBook
        ? (((movie as any)?.description as string | undefined) ?? 'No description available.')
        : isAnilist
          ? (((movie as any)?.description as string | undefined) ?? 'No description available.')
          : ((movie as any)?.summary ?? 'No overview available.');

    const mediaSearchType: MediaSearchResult['type'] = isTmdbMovie
      ? 'movie'
      : isTmdbTv
        ? 'tv'
        : isGame
          ? 'game'
          : isBook
            ? 'book'
            : isAnilist
              ? (source === 'anilist-manga' ? 'manga' : 'anime')
              : 'movie';

    const parsedYear = year ? Number.parseInt(year, 10) : undefined;
    const durationSeconds = runtimeMinutes != null ? Math.round(runtimeMinutes * 60) : undefined;

    const externalIds: NonNullable<MediaSearchResult['externalIds']> = {};
    if (id) {
      if (isTmdbMovie || isTmdbTv) {
        const tmdbId = Number(id);
        if (!Number.isNaN(tmdbId)) {
          externalIds.tmdb_id = tmdbId;
        }
      }

      if (isAnilist) {
        const anilistId = Number(id);
        if (!Number.isNaN(anilistId)) {
          externalIds.anilist_id = anilistId;
        }
      }

      if (isBook) {
        externalIds.openlibrary_id = id;
      }

      if (isGame && title) {
        externalIds.search_title = title;
      }
    }

    const episodicUnits = units && units.length > 1 ? units : undefined;
    const episodeCount = episodicUnits?.[0]?.subtype === 'episode' ? episodicUnits.length : undefined;
    const chapterCount = episodicUnits?.[0]?.subtype === 'chapter' ? episodicUnits.length : undefined;

    const result: MediaSearchResult = {
      id: titleKey,
      title,
      type: mediaSearchType,
      year: parsedYear,
      coverImage: posterUrl,
      description: overview ?? undefined,
      duration: durationSeconds,
      episodeCount,
      chapterCount,
      externalIds: Object.keys(externalIds).length ? externalIds : undefined,
    };

    return result;
  }, [movie, id, isTmdbMovie, isTmdbTv, isGame, isBook, isAnilist, source, units, titleKey, posterUrl]);

  const typedMovie = movie as any;

  // Precompute display fields with null-safe access
  const title = isTmdbMovie
    ? typedMovie?.title ?? 'Untitled'
    : isTmdbTv
      ? typedMovie?.name ?? 'Untitled'
      : isAnilist
        ? ((typedMovie?.title?.english ?? typedMovie?.title?.romaji) ?? 'Untitled')
        : isBook
          ? typedMovie?.title ?? 'Untitled'
          : (typedMovie?.name ?? typedMovie?.title ?? 'Untitled');

  const genres = (isTmdbMovie || isTmdbTv)
    ? (typedMovie?.genres?.map((g: any) => g.name) ?? [])
    : isBook
      ? (typedMovie?.subjects ?? [])
      : isAnilist
        ? ((typedMovie?.genres as string[] | undefined) ?? [])
        : ((typedMovie?.genres as string[] | undefined) ?? []);

  const year = isTmdbMovie
    ? typedMovie?.release_date?.slice(0, 4)
    : isTmdbTv
      ? (typedMovie?.first_air_date || '').slice(0, 4)
      : isAnilist
        ? (String(typedMovie?.seasonYear ?? typedMovie?.startDate?.year ?? '')).slice(0, 4)
        : isBook
          ? String(typedMovie?.first_publish_date ?? '').slice(0, 4)
          : String(typedMovie?.releaseDate ?? '').slice(0, 4);

  const rating = normalizeRatingTo10(
    (isTmdbMovie || isTmdbTv)
      ? typedMovie?.vote_average
      : isAnilist
        ? typedMovie?.averageScore
        : typedMovie?.rating,
    { source: source as any }
  );
  const ratingLabel = rating !== undefined ? formatRating10(rating) : undefined;

  const overview = (isTmdbMovie || isTmdbTv)
    ? typedMovie?.overview
    : isBook
      ? ((typedMovie?.description as string | undefined) ?? 'No description available.')
      : isAnilist
        ? ((typedMovie?.description as string | undefined) ?? 'No description available.')
        : (typedMovie?.summary ?? 'No overview available.');

  const runtime = isTmdbMovie
    ? typedMovie?.runtime
    : isTmdbTv
      ? (Array.isArray(typedMovie?.episode_run_time) && typedMovie?.episode_run_time?.[0]) || typedMovie?.last_episode_to_air?.runtime || undefined
      : isAnilist
        ? typedMovie?.duration || undefined
        : undefined;
  const runtimeMinutes = typeof runtime === 'number' ? runtime : undefined;

  const externalUrl = isTmdbMovie
    ? (typedMovie?.id !== undefined ? `https://www.themoviedb.org/movie/${typedMovie.id}` : undefined)
    : isTmdbTv
      ? (typedMovie?.id !== undefined ? `https://www.themoviedb.org/tv/${typedMovie.id}` : undefined)
      : isBook
        ? (typedMovie?.key ? `https://openlibrary.org${typedMovie.key}` : undefined)
        : isAnilist
          ? (typedMovie?.siteUrl ?? (id ? `https://anilist.co/anime/${id}` : undefined))
          : typedMovie?.url;

  const subtitle = [
    year ? `${year}` : undefined,
    runtime ? (runtime > 60 ? `${Math.floor(runtime / 60)}h ${runtime % 60}m` : `${runtime}m`) : undefined,
    genres?.slice(0, 2).join(', ')
  ].filter(Boolean).join(' • ');

  const mediaSearchType: MediaSearchResult['type'] = isTmdbMovie
    ? 'movie'
    : isTmdbTv
      ? 'tv'
      : isGame
        ? 'game'
        : isBook
          ? 'book'
          : isAnilist
            ? (source === 'anilist-manga' ? 'manga' : 'anime')
            : 'movie';

  const getsGoodPercent = t2gEstimatePct != null ? `${t2gEstimatePct.toFixed(0)}%` : null;
  const t2gDetail = t2gEstimatePct != null ? formatT2G(t2gEstimatePct, runtimeMinutes, mediaSearchType) : null;
  const getsGoodText = t2gDetail ?? getsGoodPercent;
  const sampleSize = progressData?.sampleSize ?? null;
  const formattedSampleSize = sampleSize != null ? sampleSize.toLocaleString() : null;
  const communitySummary = totalSegments > 0
    ? `Based on ${totalSegments} segment${totalSegments === 1 ? '' : 's'}${userWiggCount > 0 ? ` and ${userWiggCount} logged moment${userWiggCount === 1 ? '' : 's'}` : ''}${formattedSampleSize ? ` across ${formattedSampleSize} community entries` : ''}.`
    : 'No community pacing data yet for this title.';


  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-48 rounded-md" style={{ animationDelay: '0s' }} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <Skeleton className="aspect-[2/3] w-full rounded-xl" style={{ animationDelay: '0.08s' }} />
              </div>
              <div className="lg:col-span-2 space-y-4">
                <Skeleton className="h-8 w-3/4 rounded-md" style={{ animationDelay: '0.12s' }} />
                <Skeleton className="h-4 w-1/2 rounded-md" style={{ animationDelay: '0.18s' }} />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full rounded-md" style={{ animationDelay: '0.24s' }} />
                  <Skeleton className="h-4 w-full rounded-md" style={{ animationDelay: '0.28s' }} />
                  <Skeleton className="h-4 w-3/4 rounded-md" style={{ animationDelay: '0.32s' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Card className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Media Not Found</h2>
            <p className="text-muted-foreground">Unable to load media details. Please try again.</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Backdrop */}
      <div className="relative h-64 sm:h-96 overflow-hidden">
        {backdropUrl && !bgError ? (
          // Display image backdrop when available
          <>
            {isGame ? (
              <picture
                className="cursor-pointer"
                onClick={() => setEnlargedImage({ url: resizeIgdbImage(backdropUrl, 't_original') || backdropUrl, alt: title })}
              >
                <source media="(max-width: 640px)" srcSet={resizeIgdbImage(backdropUrl, 't_720p') || backdropUrl} />
                <source media="(max-width: 1280px)" srcSet={resizeIgdbImage(backdropUrl, 't_1080p') || backdropUrl} />
                <img
                  src={resizeIgdbImage(backdropUrl, 't_original') || backdropUrl}
                  alt={title}
                  className="w-full h-full object-cover"
                  width="1280"
                  height="720"
                  decoding="async"
                  onError={() => setBgError(true)}
                />
              </picture>
            ) : (
              <img
                src={backdropUrl}
                alt={title}
                className="w-full h-full object-cover cursor-pointer"
                width="1280"
                height="720"
                onError={() => setBgError(true)}
                onClick={() => setEnlargedImage({ url: backdropUrl, alt: title })}
              />
            )}
          </>
        ) : (
          // Fallback: use dominant color from any available image, or default purple
          <div
            className="w-full h-full"
            style={{
              backgroundColor: heroColor || 'hsl(var(--primary))',
              transition: 'background-color 200ms ease-out',
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
      </div>
      
      <div className="container mx-auto px-4 py-8 relative -mt-16 sm:-mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title and Poster Row (Mobile) */}
            <div className="flex gap-4 lg:block">
              {/* Poster (Mobile only - smaller) */}
              <div className="w-24 sm:w-32 lg:hidden flex-shrink-0">
                <Card className="p-0 overflow-hidden">
                  {posterUrl ? (
                    <img
                      src={posterUrl}
                      alt={title}
                      className="w-full aspect-[2/3] object-cover cursor-pointer"
                      width="400"
                      height="600"
                      loading="lazy"
                      decoding="async"
                      onClick={() => setEnlargedImage({ url: posterUrl, alt: title })}
                    />
                  ) : (
                    <div className="w-full aspect-[2/3] bg-muted flex items-center justify-center">
                      <span className="text-xs text-muted-foreground text-center">No poster</span>
                    </div>
                  )}
                </Card>
              </div>
              
              {/* Title Section */}
              <div className="flex-1 lg:mb-0">
                <h1 className="text-2xl sm:text-4xl font-bold mb-2">{title}</h1>
                
                {/* Rating and Year under title */}
                <div className="flex flex-wrap items-center gap-4 mb-3">
                  {ratingLabel !== undefined && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      <span className="font-medium">{ratingLabel}/10</span>
                    </div>
                  )}
                  {year && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{year}</span>
                    </div>
                  )}
                  {runtime && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{runtime} min</span>
                    </div>
                  )}
                </div>

                {/* Genre chips on mobile */}
                {genres.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3 lg:hidden">
                    {genres.map((genre: string) => (
                      <Badge key={genre} variant="secondary">{genre}</Badge>
                    ))}
                  </div>
                )}
                
                {/* Tagline/Summary for movies, TV, and games */}
                {((isTmdbMovie || isTmdbTv) && (movie as any).tagline) || (isGame && (movie as any).summary) && (
                  <p className="text-sm sm:text-lg text-muted-foreground italic mb-4 hidden lg:block">
                    {(isTmdbMovie || isTmdbTv) ? (movie as any).tagline : 
                     isGame ? (movie as any).summary?.split('.')[0] + ((movie as any).summary?.includes('.') ? '.' : '') : ''}
                  </p>
                )}
              </div>
            </div>

            {/* Tagline on mobile (below title/poster) */}
            {(((isTmdbMovie || isTmdbTv) && (movie as any).tagline) || (isGame && (movie as any).summary)) && (
              <p className="text-sm text-muted-foreground italic lg:hidden">
                {(isTmdbMovie || isTmdbTv) ? (movie as any).tagline : 
                 isGame ? (movie as any).summary?.split('.')[0] + ((movie as any).summary?.includes('.') ? '.' : '') : ''}
              </p>
            )}
            
            {/* Genres (Desktop only) */}
            {genres.length > 0 && (
                <div className="hidden lg:flex flex-wrap gap-2 mb-6">
                  {genres.map((genre: string) => (
                    <Badge key={genre} variant="secondary">{genre}</Badge>
                  ))}
                </div>
              )}

            {/* Action Buttons */}
            <div className="space-y-2">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => navigate('/add-wigg', {
                    state: {
                      media: addWiggMedia,
                    }
                  })}
                >
                <Plus className="h-4 w-4 mr-2" />
                WIGG it
              </Button>
              {externalUrl && (
                <Button asChild variant="outline" className="w-full" size="lg">
                  <a href={externalUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {(isTmdbMovie || isTmdbTv) ? 'View on TMDB' : 'View Website'}
                  </a>
                </Button>
              )}
            </div>

            <Separator />

            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">Community WIGG Curve</h2>
                  <p className="text-sm text-muted-foreground">
                    {communitySummary}
                  </p>
                </div>
                {getsGoodText && (
                  <div className="inline-flex items-center gap-2 rounded-full bg-secondary/60 px-3 py-1 text-sm text-secondary-foreground">
                    <Star className="h-3.5 w-3.5 text-primary" fill="currentColor" />
                    <span>Gets good {getsGoodText}</span>
                  </div>
                )}
              </div>

              <Card className="p-4">
                <MiniGoodnessCurve
                  values={curveValues}
                  height={120}
                  threshold={2}
                  badThreshold={1.5}
                  className="rounded"
                />
                <div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
                  <div className="inline-flex items-center gap-2">
                    <PeakIcon className="h-4 w-4 text-primary" />
                    <span>{peakLabel}</span>
                  </div>
                  <div>{totalSegments} segment{totalSegments === 1 ? '' : 's'} analyzed</div>
                  <div>{userWiggCount} moment{userWiggCount === 1 ? '' : 's'} logged</div>
                </div>
              </Card>
            </section>

            <Separator />

            <div>
              <h2 className="text-xl font-semibold mb-3">Overview</h2>
              <p className="text-muted-foreground leading-relaxed">{overview}</p>
            </div>

            {isTmdbMovie && (movie as any).production_companies?.length > 0 && (
              <>
                <Separator />
                <div>
                  <h2 className="text-xl font-semibold mb-3">Production</h2>
                  <div className="flex flex-wrap gap-2">
                    {(movie as any).production_companies.map((company: any) => (
                      <Badge key={company.id} variant="outline">{company.name}</Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

          </div>

          {/* Desktop Poster */}
          <div className="lg:col-span-1 hidden lg:block">
            <Card className="p-0 overflow-hidden sticky top-8">
              {posterUrl ? (
                <img
                  src={posterUrl}
                  alt={title}
                  className="w-full aspect-[2/3] object-cover cursor-pointer"
                  width="400"
                  height="600"
                  loading="lazy"
                  decoding="async"
                  onClick={() => setEnlargedImage({ url: posterUrl, alt: title })}
                />
              ) : (
                <div className="w-full aspect-[2/3] bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground">No poster available</span>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Image Enlargement Modal */}
      <Dialog open={!!enlargedImage} onOpenChange={(open) => !open && setEnlargedImage(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-fit h-fit p-0 border-0 bg-transparent shadow-none">
          {enlargedImage && (
            <img
              src={enlargedImage.url}
              alt={enlargedImage.alt}
              className="max-w-full max-h-[95vh] object-contain"
              loading="eager"
              decoding="async"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// For IGDB images, swap any size token (e.g., t_thumb, t_1080p) with the desired one.
function resizeIgdbImage(url?: string, targetSize?: 't_720p' | 't_1080p' | 't_original' | 't_cover_big') {
  if (!url) return undefined;
  try {
    const u = new URL(url, window.location.origin);
    // Only rewrite IGDB-hosted images
    if (!u.hostname.includes('images.igdb.com')) return url;
    const replaced = u.pathname.replace(/\/t_[^/]+\//, `/${targetSize ?? 't_original'}/`);
    return `${u.protocol}//${u.host}${replaced}`;
  } catch {
    // Fallback: simple string replace pattern
    return url.replace(/\/t_[^/]+\//, `/${targetSize ?? 't_original'}/`);
  }
}

// Extract a basic dominant color (average) from an image URL.
async function extractDominantColor(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.decoding = 'async';
      img.loading = 'eager';
      img.src = url;
      img.onload = () => {
        try {
          const size = 32;
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas context unavailable');
          ctx.drawImage(img, 0, 0, size, size);
          const data = ctx.getImageData(0, 0, size, size).data;
          let r = 0, g = 0, b = 0, count = 0;
          for (let i = 0; i < data.length; i += 4) {
            const alpha = data[i + 3];
            if (alpha < 8) continue; // skip near-transparent
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            count++;
          }
          if (count === 0) throw new Error('No opaque pixels');
          r = Math.round(r / count);
          g = Math.round(g / count);
          b = Math.round(b / count);
          resolve(`rgb(${r}, ${g}, ${b})`);
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error('Image load failed'));
    } catch (e) {
      reject(e);
    }
  });
}
