import React from 'react';

import type { Milestone } from '@/hooks/useMilestones';
import {
  buildGoodnessCurveSeries,
  type GoodnessCurvePoint,
} from '@/lib/goodnessCurve';
import { cn } from '@/lib/utils';

import { MiniGoodnessCurve } from './MiniGoodnessCurve';

export interface MilestonePathProps {
  titleId: string;
  milestones: Milestone[];
  segmentScores?: Array<{ pct: number; score: number }>;
  onSelect?: (milestoneId: string) => void;
  focusPct?: number;
  className?: string;
  height?: number;
  maxWidth?: number;
}

const DEFAULT_POINT_COUNT = 24;

function buildPointsFromScores(scores: Array<{ pct: number; score: number }>): GoodnessCurvePoint[] {
  if (!scores.length) {
    return Array.from({ length: DEFAULT_POINT_COUNT }, (_, index) => ({
      unit: index + 1,
      label: `Seg${index + 1}`,
      score: null,
    }));
  }

  const sorted = [...scores].sort((a, b) => a.pct - b.pct);
  return sorted.map((entry, index) => ({
    unit: index + 1,
    label: `Seg${index + 1}`,
    score: typeof entry.score === 'number' ? entry.score : null,
  }));
}

export function MilestonePath({
  milestones,
  segmentScores = [],
  onSelect,
  focusPct,
  className = '',
  height = 140,
}: MilestonePathProps) {
  const dataPoints = React.useMemo(() => buildPointsFromScores(segmentScores), [segmentScores]);

  const { series, labelByIndex, values, hasScores } = React.useMemo(
    () =>
      buildGoodnessCurveSeries({
        data: dataPoints,
        totalUnits: Math.max(DEFAULT_POINT_COUNT, dataPoints.length || DEFAULT_POINT_COUNT),
        unitLabelKind: 'episode',
        threshold: 2.2,
      }),
    [dataPoints],
  );

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = React.useState(0);
  React.useEffect(() => {
    if (!containerRef.current || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      if (!entries.length) return;
      setWidth(entries[0].contentRect.width);
    });
    observer.observe(containerRef.current);
    setWidth(containerRef.current.clientWidth);
    return () => observer.disconnect();
  }, []);

  const focusedMilestoneId = React.useMemo(() => {
    if (focusPct === undefined || !milestones.length) return null;
    let closest = milestones[0];
    let minDiff = Math.abs(focusPct - milestones[0].pct);
    for (let i = 1; i < milestones.length; i++) {
      const diff = Math.abs(focusPct - milestones[i].pct);
      if (diff < minDiff) {
        closest = milestones[i];
        minDiff = diff;
      }
    }
    return closest.id;
  }, [focusPct, milestones]);

  const markers = React.useMemo(() => {
    if (!width || !milestones.length) return null;
    const chartMargin = 4; // matches MiniGoodnessCurve default margin
    const innerWidth = Math.max(0, width - chartMargin * 2);
    const sorted = [...milestones].sort((a, b) => a.pct - b.pct);
    return sorted.map((milestone) => {
      const clampedPct = Math.min(100, Math.max(0, milestone.pct));
      const x = chartMargin + (clampedPct / 100) * innerWidth;
      const isFocused = focusedMilestoneId === milestone.id;
      return (
        <button
          key={milestone.id}
          type="button"
          className={cn(
            'absolute top-2 flex -translate-x-1/2 flex-col items-center gap-1 text-[10px] transition-transform hover:-translate-y-1',
            isFocused ? 'text-primary' : 'text-muted-foreground',
          )}
          style={{ left: `${x}px` }}
          onClick={() => onSelect?.(milestone.id)}
        >
          <span
            className={cn(
              'flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 shadow-sm',
              isFocused ? 'ring-1 ring-primary/60' : 'border border-border',
            )}
          >
            <span aria-hidden>{milestone.icon ?? '•'}</span>
            <span className="max-w-[140px] truncate">{milestone.label}</span>
          </span>
          <span className="text-[9px] font-medium">{Math.round(clampedPct)}%</span>
        </button>
      );
    });
  }, [focusedMilestoneId, milestones, onSelect, width]);

  if (!milestones.length && !hasScores) {
    return (
      <div className={cn('w-full rounded-lg border bg-muted/20 p-6 text-center text-sm text-muted-foreground', className)}>
        No milestones or community data available yet
      </div>
    );
  }

  return (
    <div className={cn('flex w-full flex-col gap-3', className)}>
      <div
        ref={containerRef}
        className="relative rounded-xl border bg-gradient-to-br from-background via-background to-muted/40 px-4 py-5 shadow-sm"
        style={{ minHeight: `${Math.max(120, height)}px` }}
      >
        {hasScores ? (
          <MiniGoodnessCurve
            values={values}
            height={Math.max(80, height - 32)}
            threshold={2.2}
            badThreshold={1.5}
            showPeakMarker
            showPeakPlayhead
            gridLines={[1, 2, 3]}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No community data yet
          </div>
        )}
        {markers}
      </div>

      {series.length > 0 && (
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{labelByIndex.get(0)}</span>
          {series.length > 2 && (
            <span>{labelByIndex.get(Math.floor((series.length - 1) / 2))}</span>
          )}
          <span>{labelByIndex.get(series.length - 1)}</span>
        </div>
      )}
    </div>
  );
}
