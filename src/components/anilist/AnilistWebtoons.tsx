import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAnilistWebtoonsMerged } from '@/integrations/anilist/hooks';
import useEmblaCarousel from 'embla-carousel-react';
import MediaTile from '@/components/media/MediaTile';

type Props = {
  country?: 'KR' | 'CN' | 'TW' | 'JP';
  onAdd?: (item: { title: string; type: 'Book' }) => void;
};

export default function AnilistWebtoons({ country = 'KR', onAdd }: Props) {
  const navigate = useNavigate();
  // Aggregate KR+CN+TW webtoons, then filter client-side with chips
  const [filter, setFilter] = useState<'ALL' | 'KR' | 'CN' | 'TW'>('ALL');
  const { data: items = [], isFetching, isError, error } = useAnilistWebtoonsMerged();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'start', slidesToScroll: 1, dragFree: true });
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const filtered = useMemo(() => {
    const list = Array.isArray(items) ? items : [];
    if (filter === 'ALL') return list;
    return list.filter((r: any) => (r?.countryOfOrigin ?? '') === filter);
  }, [items, filter]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Popular Webtoons</h3>
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
          {(error as any)?.message || 'Unable to load AniList'}
        </div>
      )}

      {/* Filter chips */}
      <div className="flex items-center gap-2">
        {(['ALL','KR','CN','TW'] as const).map((c) => (
          <Button
            key={c}
            size="sm"
            variant={filter === c ? 'default' : 'outline'}
            onClick={() => setFilter(c)}
          >
            {c === 'ALL' ? 'All' : c}
          </Button>
        ))}
      </div>

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-3">
          {(isFetching && items.length === 0 ? Array.from({ length: 10 }) : filtered).map((r: any, idx: number) => {
            if (isFetching && items.length === 0) {
              return (
                <div key={idx} className="flex-none w-36 sm:w-40 md:w-44 lg:w-48">
                  <div className="p-2 bg-muted/40 rounded-lg animate-pulse">
                    <div className="aspect-[2/3] rounded-md bg-muted" />
                    <div className="mt-2 h-3 bg-muted rounded w-3/4" />
                  </div>
                </div>
              );
            }
            const id = r.id;
            const titleEn = r?.title?.english || r?.title?.romaji || 'Untitled';
            const titleJa = r?.title?.native || '';
            const displayTitle = titleJa && titleJa !== titleEn ? `${titleEn} (${titleJa})` : titleEn;
            const year = String(r?.startDate?.year || '').slice(0, 4);
            const poster = r?.coverImage?.extraLarge || r?.coverImage?.large || undefined;
            const avg = r?.averageScore;
            const ratingLabel = typeof avg === 'number' ? `${(avg/10).toFixed(1)}/10` : undefined;
            const tags: string[] = Array.isArray(r?.genres) ? r.genres.slice(0, 2) : [];
            const co = r?.countryOfOrigin as string | undefined;
            return (
              <div key={`webtoon-${id}`} className="flex-none w-36 sm:w-40 md:w-44 lg:w-48">
                <MediaTile
                  title={displayTitle}
                  imageUrl={poster}
                  year={year}
                  ratingLabel={ratingLabel}
                  tags={co ? [...tags, co].slice(0,3) : tags}
                  onAdd={() => onAdd?.({ title: displayTitle, type: 'Book' })}
                  onClick={() => navigate(`/media/anilist-manga/${id}`)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
