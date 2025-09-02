import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTmdbPopular, useTmdbTrending, useTmdbMovieGenres } from '@/integrations/tmdb/hooks';
import { getImageUrl } from '@/integrations/tmdb/client';
import useEmblaCarousel from 'embla-carousel-react';
import MediaTile from '@/components/media/MediaTile';

type Props = {
  kind?: 'trending' | 'popular';
  period?: 'day' | 'week';
  onAdd?: (item: { title: string; type: 'Movie' }) => void;
};

export function TmdbPopular({ kind = 'trending', period = 'day', onAdd }: Props) {
  const navigate = useNavigate();
  const { data, isFetching, isError, error } = kind === 'trending' ? useTmdbTrending(period) : useTmdbPopular();
  const items = data?.results ?? [];
  const { data: genreMap = {} } = useTmdbMovieGenres();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'start', slidesToScroll: 1, dragFree: true });
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">
          {kind === 'trending' ? `Trending Movies (${period})` : 'Popular Movies'}
        </h3>
        <div className="hidden sm:flex gap-2">
          <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={scrollPrev} aria-label="Prev">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={scrollNext} aria-label="Next">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isError && (
        <div className="text-sm text-red-500">
          {(error as any)?.message || 'Unable to load TMDB'}. Set VITE_TMDB_API_KEY in .env or deploy the 'tmdb' Edge Function.
        </div>
      )}

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-3">
          {(isFetching && !items.length ? Array.from({ length: 10 }) : items.slice(0, 24)).map((it: any, idx: number) => {
            if (isFetching && !items.length) {
              return (
                <div key={idx} className="flex-none w-36 sm:w-40 md:w-44 lg:w-48">
                  <div className="p-2 bg-muted/40 rounded-lg animate-pulse">
                    <div className="aspect-[2/3] rounded-md bg-muted" />
                    <div className="mt-2 h-3 bg-muted rounded w-3/4" />
                  </div>
                </div>
              );
            }
            const r = it;
            const title = (r as any).title ?? (r as any).name ?? 'Untitled';
            const year = (r.release_date || (r as any).first_air_date || '').slice(0, 4);
            const poster = getImageUrl(r.poster_path, 'w342');
            const rating = (r as any).vote_average;
            const genreIds: number[] = (r as any).genre_ids || [];
            const tags = genreIds.map((id) => genreMap[id]).filter(Boolean).slice(0, 2);
            return (
              <div key={`pop-${r.id}`} className="flex-none w-36 sm:w-40 md:w-44 lg:w-48">
                <MediaTile
                  title={title}
                  imageUrl={poster}
                  year={year}
                  ratingLabel={typeof rating === 'number' ? `${rating.toFixed(1)}/10` : undefined}
                  tags={tags}
                  onAdd={() => onAdd?.({ title, type: 'Movie' })}
                  onClick={() => navigate(`/media/tmdb/${r.id}`)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default TmdbPopular;
