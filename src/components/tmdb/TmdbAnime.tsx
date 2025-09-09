import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTmdbAnime, useTmdbMovieGenres, useTmdbTvGenres } from '@/integrations/tmdb/hooks';
import { getImageUrl } from '@/integrations/tmdb/client';
import useEmblaCarousel from 'embla-carousel-react';
import MediaTile from '@/components/media/MediaTile';

type Props = {
  onAdd?: (item: { title: string; type: 'Movie' | 'TV Show' }) => void;
};

export function TmdbAnime({ onAdd }: Props) {
  const navigate = useNavigate();
  const { data, isFetching, isError, error } = useTmdbAnime();
  const items = data?.results ?? [];
  const { data: movieGenreMap = {} } = useTmdbMovieGenres();
  const { data: tvGenreMap = {} } = useTmdbTvGenres();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'start', slidesToScroll: 1, dragFree: true });
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Popular Anime</h3>
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
          {(isFetching && !items.length ? Array.from({ length: 10 }) : items).map((it: any, idx: number) => {
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
            const isTv = r.__kind === 'tv' || (!!(r as any).first_air_date && !(r as any).title);
            const titleEn = (r as any).__title_en || (isTv ? (r as any).name : (r as any).title) || 'Untitled';
            const titleJa = (r as any).__title_ja || (isTv ? (r as any).original_name : (r as any).original_title) || '';
            const displayTitle = titleJa && titleJa !== titleEn ? `${titleEn} (${titleJa})` : titleEn;
            const dateStr = isTv ? (r as any).first_air_date : (r as any).release_date;
            const year = (dateStr || '').slice(0, 4);
            const posterPath = (r as any).poster_path;
            const poster = getImageUrl(posterPath, 'w342');
            const rating = (r as any).vote_average;
            const genreIds: number[] = (r as any).genre_ids || [];
            const tags = genreIds
              .map((id) => (isTv ? tvGenreMap[id] : movieGenreMap[id]))
              .filter(Boolean)
              .slice(0, 2);
            return (
              <div key={`anime-${r.__kind}-${r.id}`} className="flex-none w-36 sm:w-40 md:w-44 lg:w-48">
                <MediaTile
                  title={displayTitle}
                  imageUrl={poster}
                  year={year}
                  ratingLabel={typeof rating === 'number' ? `${rating.toFixed(1)}/10` : undefined}
                  tags={tags}
                  onAdd={() => onAdd?.({ title: displayTitle, type: isTv ? 'TV Show' : 'Movie' })}
                  onClick={() => navigate(isTv ? `/media/tmdb-tv/${r.id}` : `/media/tmdb/${r.id}`)}
                  mediaData={{
                    source: isTv ? 'tmdb-tv' : 'tmdb',
                    id: String(r.id),
                    title: displayTitle,
                    type: isTv ? 'tv' : 'movie',
                    posterUrl: poster,
                    year
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default TmdbAnime;
