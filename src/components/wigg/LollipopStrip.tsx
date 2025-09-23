import React from 'react';

import type { ProgressSegment } from '@/hooks/useTitleProgress';
import {
  buildGoodnessCurveSeries,
  resampleSegmentsToGoodnessPoints,
  type GoodnessCurveUnitKind,
} from '@/lib/goodnessCurve';
import { cn } from '@/lib/utils';

import { MiniGoodnessCurve } from './MiniGoodnessCurve';

export interface LollipopStripProps {
  titleId: string;
  segments: ProgressSegment[];
  t2gEstimatePct?: number;
  threshold?: number;
  onMarkWigg?: (pct: number) => void;
  interactive?: boolean;
  className?: string;
  height?: number;
  unitLabelKind?: GoodnessCurveUnitKind;
}

export function LollipopStrip({
  segments,
  className = '',
  height = 60,
  threshold = 2.2,
  unitLabelKind = 'episode',
}: LollipopStripProps) {
  const { series, labelByIndex, values, hasScores } = React.useMemo(() => {
    const resampled = resampleSegmentsToGoodnessPoints(segments, Math.max(12, Math.min(48, segments.length || 16)), unitLabelKind);
    return buildGoodnessCurveSeries({
      data: resampled,
      totalUnits: resampled.length,
      unitLabelKind,
      threshold,
    });
  }, [segments, threshold, unitLabelKind]);

  return (
    <div className={cn('relative flex w-full flex-col gap-2', className)}>
      {hasScores ? (
        <>
          <MiniGoodnessCurve
            values={values}
            height={Math.max(36, height)}
            threshold={threshold}
            badThreshold={1.5}
            showPeakMarker
            showPeakPlayhead
            gridLines={[1, 2, 3]}
          />
          {series.length > 0 && (
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{labelByIndex.get(0)}</span>
              {series.length > 2 && (
                <span>{labelByIndex.get(Math.floor((series.length - 1) / 2))}</span>
              )}
              <span>{labelByIndex.get(series.length - 1)}</span>
            </div>
          )}
        </>
      ) : (
        <div className="flex h-full items-center justify-center rounded border border-dashed border-muted text-xs text-muted-foreground">
          No community data yet
        </div>
      )}
    </div>
  );
}
