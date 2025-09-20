import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAnilistManga } from '@/integrations/anilist/hooks';
import useEmblaCarousel from 'embla-carousel-react';
import MediaTile from '@/components/media/MediaTile';
import { MediaTileSkeletonRow } from '@/components/media/MediaTileSkeleton';

type Props = {
  onAdd?: (item: { title: string; type: 'Book' }) => void;
};

export default function AnilistManga({ onAdd }: Props) {
  const navigate = useNavigate();
  const { data: items = [], isFetching, isError, error } = useAnilistManga('popular');
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'start', slidesToScroll: 1, dragFree: true });
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const showSkeleton = isFetching && items.length === 0;

  const filteredItems = (items as any[]).filter((r: any) => (r?.countryOfOrigin ?? 'JP') === 'JP');

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Popular Manga</h3>
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
          {(error as any)?.message || 'Unable to load AniList'}
        </div>
      )}

      <div className="overflow-hidden" ref={emblaRef}>
        {showSkeleton ? (
          <MediaTileSkeletonRow containerClassName="flex gap-3" itemClassName="flex-none w-36 sm:w-40 md:w-44 lg:w-48" />
        ) : (
          <div className="flex gap-3">
            {filteredItems.map((r: any) => {
              const id = r.id;
              const titleEn = r?.title?.english || r?.title?.romaji || 'Untitled';
              const titleJa = r?.title?.native || '';
              const displayTitle = titleJa && titleJa !== titleEn ? `${titleEn} (${titleJa})` : titleEn;
              const year = String(r?.startDate?.year || '').slice(0, 4);
              const poster = r?.coverImage?.extraLarge || r?.coverImage?.large || undefined;
              const avg = r?.averageScore;
              const ratingLabel = typeof avg === 'number' ? `${(avg / 10).toFixed(1)}/10` : undefined;
              const tags: string[] = Array.isArray(r?.genres) ? r.genres.slice(0, 2) : [];
              return (
                <div key={`manga-${id}`} className="flex-none w-36 sm:w-40 md:w-44 lg:w-48">
                  <MediaTile
                    title={displayTitle}
                    imageUrl={poster}
                    year={year}
                    ratingLabel={ratingLabel}
                    tags={tags}
                    onAdd={() => onAdd?.({ title: displayTitle, type: 'Book' })}
                    onClick={() => navigate(`/media/anilist-manga/${id}`)}
                    mediaData={{
                      source: 'anilist-manga',
                      id: String(id),
                      title: displayTitle,
                      type: 'manga',
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
