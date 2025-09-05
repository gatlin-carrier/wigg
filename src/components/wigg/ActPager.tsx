import React, { useMemo } from 'react';
import { type Milestone } from '@/hooks/useMilestones';
import { LollipopStrip } from '@/components/wigg/LollipopStrip';
import { type ProgressSegment } from '@/hooks/useTitleProgress';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';

export interface ActPagerProps {
  titleId: string;
  milestones: Milestone[];
  segments?: ProgressSegment[];
  className?: string;
  onSelect?: (milestoneId: string) => void;
}

export function ActPager({ titleId, milestones, segments = [], className = '', onSelect }: ActPagerProps) {
  const acts = useMemo(() => {
    const buckets = [
      { name: 'Act I', start: 0, end: 33 },
      { name: 'Act II', start: 33, end: 66 },
      { name: 'Act III', start: 66, end: 100 },
    ];
    return buckets.map(b => ({
      ...b,
      milestones: milestones.filter(m => m.pct >= b.start && m.pct < b.end).sort((a, z) => a.pct - z.pct),
      segs: segments.filter(s => s.startPct >= b.start && s.endPct <= b.end),
    }));
  }, [milestones, segments]);

  return (
    <div className={`w-full ${className}`}>
      <Carousel className="w-full">
        <CarouselContent>
          {acts.map((act) => (
            <CarouselItem key={act.name} className="basis-full">
              <div className="p-3 border rounded-lg bg-card">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold">{act.name}</h3>
                  <div className="text-xs text-muted-foreground">{act.start}%–{act.end}%</div>
                </div>
                {/* Mini strip per act */}
                <div className="mb-3">
                  <LollipopStrip titleId={`${titleId}-${act.name}`} segments={act.segs.length ? act.segs : (segments || [])} interactive={false} height={54} />
                </div>
                {/* Key beats list */}
                <div className="space-y-1">
                  {act.milestones.length === 0 ? (
                    <div className="text-xs text-muted-foreground">No key beats in this range</div>
                  ) : (
                    act.milestones.map(m => (
                      <button
                        key={m.id}
                        className="w-full flex items-center justify-between px-2 py-2 rounded hover:bg-accent text-sm border"
                        onClick={() => onSelect?.(m.id)}
                        aria-label={`${m.label} at ${m.pct.toFixed(0)}%`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{m.icon || '•'}</span>
                          <span className="truncate max-w-[200px] text-left">{m.label}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{m.pct.toFixed(0)}%</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}

