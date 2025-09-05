import React, { useMemo, useRef, useState } from 'react';
import { type Milestone } from '@/hooks/useMilestones';
import { Star } from 'lucide-react';

export interface StoryRailProps {
  titleId: string;
  milestones: Milestone[];
  currentPct?: number;
  t2gEstimatePct?: number;
  onSelect?: (milestoneId: string) => void;
  className?: string;
}

export function StoryRail({
  titleId,
  milestones,
  currentPct,
  t2gEstimatePct,
  onSelect,
  className = ''
}: StoryRailProps) {
  const railWidth = 1200; // wide virtual rail for accurate percent positioning
  const sorted = useMemo(() => [...milestones].sort((a, b) => a.pct - b.pct), [milestones]);

  const [activeId, setActiveId] = useState<string | null>(null);

  if (sorted.length === 0) {
    return (
      <div className={`w-full p-4 border rounded-lg bg-muted/20 text-center text-sm text-muted-foreground ${className}`}>
        No milestones available
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <div
        className="relative overflow-x-auto py-4"
        style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' as any }}
      >
        <div className="relative h-20" style={{ width: railWidth }}>
          {/* Track line */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[3px] bg-muted rounded-full" />

          {/* T2G marker */}
          {typeof t2gEstimatePct === 'number' && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${(t2gEstimatePct / 100) * railWidth}px`, top: '10%' }}
              title={`Gets good around ${Math.round(t2gEstimatePct)}%`}
              aria-label={`Gets good around ${Math.round(t2gEstimatePct)}%`}
            >
              <Star className="text-primary drop-shadow" size={14} fill="currentColor" />
            </div>
          )}

          {/* Current progress cursor */}
          {typeof currentPct === 'number' && (
            <div
              className="absolute w-[2px] bg-primary/70"
              style={{ left: `${(currentPct / 100) * railWidth}px`, top: 8, bottom: 8 }}
              aria-label={`Current progress ${currentPct.toFixed(1)}%`}
            />
          )}

          {/* Stops */}
          {sorted.map((m) => {
            const left = (m.pct / 100) * railWidth;
            const active = activeId === m.id;
            return (
              <button
                key={m.id}
                className={`absolute -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full border bg-background flex items-center justify-center focus:ring-2 focus:ring-primary shadow-sm ${active ? 'border-primary' : 'border-muted'}`}
                style={{ left, top: '50%' }}
                onClick={() => { setActiveId(m.id); onSelect?.(m.id); }}
                role="button"
                aria-label={`${m.label} at ${m.pct.toFixed(0)}%`}
              >
                <span className="text-[11px] font-medium truncate max-w-[40px]" title={`${m.label} (${m.pct.toFixed(0)}%)`}>
                  {m.icon || '•'}
                </span>
              </button>
            );
          })}

          {/* Labels popover (simple inline) */}
          {sorted.map((m) => {
            if (activeId !== m.id) return null;
            const left = (m.pct / 100) * railWidth;
            return (
              <div
                key={`label-${m.id}`}
                className="absolute -translate-x-1/2 top-full mt-2 px-2 py-1 rounded bg-popover text-popover-foreground text-xs border shadow"
                style={{ left }}
              >
                {m.label} · {m.pct.toFixed(0)}%
              </div>
            );
          })}
        </div>
      </div>

      {/* SR summary */}
      <div className="sr-only">
        Story rail for {titleId} with {sorted.length} milestones.
        {typeof t2gEstimatePct === 'number' && ` Gets good near ${Math.round(t2gEstimatePct)} percent.`}
      </div>
    </div>
  );
}

