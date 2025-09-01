import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Star, Calendar, Clock, ExternalLink, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getMovieDetails, getTvDetails, getImageUrl } from '@/integrations/tmdb/client';
import { fetchWorkDetails } from '@/integrations/openlibrary/client';
import { useTmdbMovieGenres } from '@/integrations/tmdb/hooks';
import { WiggMap } from '@/components/wigg/WiggMap';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

export default function MediaDetails() {
  const { source, id } = useParams<{ source: string; id: string }>();
  const [heroColor, setHeroColor] = React.useState<string | undefined>(undefined);
  const [bgError, setBgError] = React.useState<boolean>(false);
  
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

  const hasLargeBackdrop = (isTmdbMovie || isTmdbTv)
    ? Boolean((movie as any)?.backdrop_path)
    : isGame
      ? Boolean((movie as any)?.background)
      : false;

  const backdropUrl = hasLargeBackdrop
    ? ((isTmdbMovie || isTmdbTv)
        ? getImageUrl((movie as any)?.backdrop_path, 'original')
        : (movie as any)?.background ?? undefined)
    : undefined;

  const posterUrl = (isTmdbMovie || isTmdbTv)
    ? getImageUrl((movie as any)?.poster_path, 'w500')
    : isBook
      ? ((movie as any)?.cover_url ?? undefined)
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-32 bg-muted rounded" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <div className="aspect-[2/3] bg-muted rounded-lg" />
              </div>
              <div className="lg:col-span-2 space-y-4">
                <div className="h-8 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded w-3/4" />
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

  // Now that data is loaded, compute display fields
  const title = isTmdbMovie
    ? (movie as any).title
    : isTmdbTv
      ? ((movie as any)?.name ?? 'Untitled')
    : isBook
      ? ((movie as any)?.title ?? 'Untitled')
      : ((movie as any)?.name ?? (movie as any)?.title ?? 'Untitled');
  const genres = (isTmdbMovie || isTmdbTv)
    ? ((movie as any).genres?.map((g: any) => g.name) || [])
    : isBook
      ? ((movie as any)?.subjects ?? [])
      : (((movie as any)?.genres as string[] | undefined) ?? []);
  const year = isTmdbMovie
    ? (movie as any).release_date?.slice(0, 4)
    : isTmdbTv
      ? ((movie as any)?.first_air_date || '').slice(0, 4)
    : isBook
      ? String((movie as any)?.first_publish_date ?? '').slice(0, 4)
      : String((movie as any)?.releaseDate ?? '').slice(0, 4);
  const rating = (isTmdbMovie || isTmdbTv) ? (movie as any).vote_average : (movie as any)?.rating;
  const overview = (isTmdbMovie || isTmdbTv)
    ? (movie as any).overview
    : isBook
      ? (((movie as any)?.description as string | undefined) ?? 'No description available.')
      : ((movie as any)?.summary ?? 'No overview available.');
  const runtime = isTmdbMovie
    ? (movie as any).runtime
    : isTmdbTv
      ? (Array.isArray((movie as any)?.episode_run_time) && (movie as any).episode_run_time[0]) || (movie as any)?.last_episode_to_air?.runtime || undefined
      : undefined;
  const externalUrl = isTmdbMovie
    ? `https://www.themoviedb.org/movie/${(movie as any).id}`
    : isTmdbTv
      ? `https://www.themoviedb.org/tv/${(movie as any).id}`
    : isBook
      ? (`https://openlibrary.org${(movie as any)?.key ?? ''}`)
      : (movie as any)?.url;

  

  return (
    <div className="min-h-screen bg-background">
      {/* Backdrop */}
      <div className="relative h-96 overflow-hidden">
        {backdropUrl && !bgError ? (
          // Display image backdrop when available
          <>
            {isGame ? (
              <picture>
                <source media="(max-width: 640px)" srcSet={resizeIgdbImage(backdropUrl, 't_720p') || backdropUrl} />
                <source media="(max-width: 1280px)" srcSet={resizeIgdbImage(backdropUrl, 't_1080p') || backdropUrl} />
                <img
                  src={resizeIgdbImage(backdropUrl, 't_original') || backdropUrl}
                  alt={title}
                  className="w-full h-full object-cover"
                  decoding="async"
                  onError={() => setBgError(true)}
                />
              </picture>
            ) : (
              <img src={backdropUrl} alt={title} className="w-full h-full object-cover" onError={() => setBgError(true)} />
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
      
      <div className="container mx-auto px-4 py-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Poster */}
          <div className="lg:col-span-1">
            <Card className="p-0 overflow-hidden">
              {posterUrl ? (
                <img
                  src={posterUrl}
                  alt={title}
                  className="w-full aspect-[2/3] object-cover"
                />
              ) : (
                <div className="w-full aspect-[2/3] bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground">No poster available</span>
                </div>
              )}
            </Card>
            
            <div className="mt-4 space-y-2">
              <Button className="w-full" size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Add WIGG Point
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
          </div>

          {/* Details */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">{title}</h1>
              {(isTmdbMovie || isTmdbTv) && (movie as any).tagline && (
                <p className="text-lg text-muted-foreground italic mb-4">{(movie as any).tagline}</p>
              )}
              
              <div className="flex flex-wrap items-center gap-4 mb-6">
                {rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    <span className="font-medium">{(Number(rating) as number).toFixed(1)}/10</span>
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

              {genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {genres.map((genre: string) => (
                    <Badge key={genre} variant="secondary">{genre}</Badge>
                  ))}
                </div>
              )}
            </div>

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

            <Separator />

            <div>
              <h2 className="text-xl font-semibold mb-3">WIGG Chart</h2>
              <Card className="p-4 mb-4">
                <WiggMap
                  consensus={{
                    posKind: 'sec',
                    duration: runtime || 7200, // Use movie runtime or default 2 hours
                    medianPos: (runtime || 7200) / 2, // Default to middle
                    windows: []
                  }}
                  points={[]}
                  width={600}
                  height={80}
                  className="text-primary"
                />
              </Card>
              
              <Card className="p-6 text-center border-dashed">
                <p className="text-muted-foreground mb-3">No WIGG points yet for this media</p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add the first WIGG point
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </div>
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
