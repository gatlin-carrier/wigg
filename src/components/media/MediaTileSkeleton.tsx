import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export interface MediaTileSkeletonProps {
  className?: string;
  delay?: number;
}

function buildDelay(base: number, offset: number): CSSProperties | undefined {
  const value = base + offset;
  return value > 0 ? { animationDelay: `${value.toFixed(2)}s` } : undefined;
}

export function MediaTileSkeleton({ className, delay = 0 }: MediaTileSkeletonProps) {
  return (
    <div
      className={cn('p-4 rounded-xl border border-border/50 bg-card/80 shadow-soft space-y-3', className)}
      data-testid="media-tile-skeleton"
    >
      <div className="aspect-[2/3] w-full overflow-hidden rounded-lg bg-muted">
        <Skeleton className="h-full w-full" style={buildDelay(delay, 0)} />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" style={buildDelay(delay, 0.05)} />
        <Skeleton className="h-3 w-1/2" style={buildDelay(delay, 0.1)} />
      </div>
      <div className="flex items-center space-x-2">
        <Skeleton className="h-3 w-3 rounded-full" style={buildDelay(delay, 0.15)} />
        <Skeleton className="h-3 w-12" style={buildDelay(delay, 0.2)} />
      </div>
      <Skeleton className="h-12 w-full rounded" style={buildDelay(delay, 0.25)} />
    </div>
  );
}

export interface MediaTileSkeletonRowProps {
  count?: number;
  containerClassName?: string;
  itemClassName?: string;
  baseDelay?: number;
  stagger?: number;
}

export function MediaTileSkeletonRow({
  count = 6,
  containerClassName = 'flex gap-4',
  itemClassName = 'flex-none w-36 sm:w-40 md:w-44 lg:w-48',
  baseDelay = 0,
  stagger = 0.08,
}: MediaTileSkeletonRowProps) {
  return (
    <div className={containerClassName}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={itemClassName}>
          <MediaTileSkeleton className="h-full" delay={baseDelay + index * stagger} />
        </div>
      ))}
    </div>
  );
}
