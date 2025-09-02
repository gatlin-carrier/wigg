import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import MediaTile from '@/components/media/MediaTile';
import { useTrendingPodcasts } from '@/integrations/podcast-search/hooks';

type Props = {
  onAdd?: (item: { title: string; type: 'Podcast' }) => void;
};

export default function PodcastTrending({ onAdd }: Props) {
  const { data, isFetching, isError, error } = useTrendingPodcasts(24);
  const items = (data?.feeds || []) as Array<{ id: number; title: string; author?: string; image?: string }>;
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'start', slidesToScroll: 1, dragFree: true });
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Popular Podcasts</h3>
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
          {(error as any)?.message || 'Unable to load podcasts'}. Ensure Podcast Index secrets are set on the Supabase function.
        </div>
      )}

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-3">
          {(isFetching && !items.length ? Array.from({ length: 12 }) : items).map((it: any, idx: number) => {
            if (isFetching && !items.length) {
              return (
                <div key={idx} className="flex-none w-36 sm:w-40 md:w-44 lg:w-48">
                  <div className="p-2 bg-muted/40 rounded-lg animate-pulse">
                    <div className="aspect-[1/1] rounded-md bg-muted" />
                    <div className="mt-2 h-3 bg-muted rounded w-3/4" />
                  </div>
                </div>
              );
            }
            const r = it as { id: number; title: string; author?: string; image?: string };
            const title = r.title || 'Untitled';
            const img = r.image || undefined;
            const publisher = r.author || undefined;
            return (
              <div key={`pod-${r.id}`} className="flex-none w-36 sm:w-40 md:w-44 lg:w-48">
                <MediaTile
                  title={title}
                  imageUrl={img}
                  tags={publisher ? [publisher] : []}
                  onAdd={() => onAdd?.({ title, type: 'Podcast' })}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

