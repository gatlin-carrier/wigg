import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTmdbPopularTv, useTmdbTrendingTv, useTmdbTvGenres } from '@/integrations/tmdb/hooks';
import { getImageUrl } from '@/integrations/tmdb/client';
import useEmblaCarousel from 'embla-carousel-react';
import MediaTile from '@/components/media/MediaTile';
import { MediaTileSkeletonRow } from '@/components/media/MediaTileSkeleton';

type Props = {
  kind?: 'trending' | 'popular';
  period?: 'day' | 'week';
  onAdd?: (item: { title: string; type: 'TV Show' }) => void;
};

export function TmdbPopularTv({ kind = 'popular', period = 'day', onAdd }: Props) {
  const navigate = useNavigate();
  const { data, isFetching, isError, error } = kind === 'trending' ? useTmdbTrendingTv(period) : useTmdbPopularTv();
  const items = data?.results ?? [];
  const showSkeleton = isFetching && !items.length;
  const { data: genreMap = {} } = useTmdbTvGenres();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'start', slidesToScroll: 1, dragFree: true });
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">
          {kind === 'trending' ? `Trending TV (${period})` : 'Popular TV Shows'}
        </h3>
        <div className="hidden sm:flex gap-2">
          <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={scrollPrev} aria-label="Previous">
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
        {showSkeleton ? (
          <MediaTileSkeletonRow containerClassName="flex gap-3" itemClassName="flex-none w-36 sm:w-40 md:w-44 lg:w-48" />
        ) : (
          <div className="flex gap-3">
            {items.slice(0, 24).map((r: any) => {
              const title = r.name ?? r.title ?? 'Untitled';
              const year = (r.first_air_date || r.release_date || '').slice(0, 4);
              const poster = getImageUrl(r.poster_path, 'w342');
              const rating = r.vote_average;
              const genreIds: number[] = r.genre_ids || [];
              const tags = genreIds.map((id) => genreMap[id]).filter(Boolean).slice(0, 2);
              return (
                <div key={`tv-${r.id}`} className="flex-none w-36 sm:w-40 md:w-44 lg:w-48">
                  <MediaTile
                    title={title}
                    imageUrl={poster}
                    year={year}
                    ratingLabel={typeof rating === 'number' ? `${rating.toFixed(1)}/10` : undefined}
                    tags={tags}
                    onAdd={() => onAdd?.({ title, type: 'TV Show' })}
                    onClick={() => navigate(`/media/tmdb-tv/${r.id}`)}
                    mediaData={{
                      source: 'tmdb-tv',
                      id: String(r.id),
                      title,
                      type: 'tv',
                      posterUrl: poster,
                      year,
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default TmdbPopularTv;
