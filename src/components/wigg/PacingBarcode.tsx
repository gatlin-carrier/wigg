import React from 'react';

import type { ProgressSegment } from '@/hooks/useTitleProgress';
import {
  buildGoodnessCurveSeries,
  resampleSegmentsToGoodnessPoints,
  type GoodnessCurveUnitKind,
} from '@/lib/goodnessCurve';
import { cn } from '@/lib/utils';

import { MiniGoodnessCurve } from './MiniGoodnessCurve';

export type EditGraphState = 'idle' | 'edit_enabled' | 'placing' | 'preview_zoom' | 'committed' | 'canceled';

export interface WiggPuckState {
  pct: number;
  isDragging: boolean;
  showFisheye: boolean;
  fisheyeZoom: number;
}

export interface PacingBarcodeProps {
  titleId: string;
  height?: number;
  segmentCount?: number;
  segments: ProgressSegment[];
  t2gEstimatePct?: number;
  currentPct?: number;
  onScrub?: (pct: number) => void;
  onCommitScrub?: (pct: number) => void;
  onMarkWigg?: (pct: number) => void;
  interactive?: boolean;
  ariaLabel?: string;
  className?: string;
  editable?: boolean;
  onEnterEdit?: () => void;
  onExitEdit?: () => void;
  onPlaceWigg?: (pct: number, note?: string) => Promise<void>;
  onPaintSegmentScore?: (pct: number, score: number) => Promise<void>;
  showFisheye?: boolean;
  editIdleTimeoutMs?: number;
  suppressGlobalListeners?: boolean;
  suppressHaptics?: boolean;
  colorMode?: 'brand' | 'heat';
  heatStyle?: 'muted' | 'vivid';
  segmentLabels?: string[];
  highlightOnHover?: boolean;
  onSegmentClick?: (segmentIndex: number) => void;
  dataScope?: 'community' | 'local' | 'auto';
  playheadVisibility?: 'always' | 'hover' | 'never';
  selectedSegmentIndex?: number;
}

function deriveUnitKindFromScope(scope?: PacingBarcodeProps['dataScope']): GoodnessCurveUnitKind {
  if (!scope) return 'episode';
  switch (scope) {
    case 'community':
    case 'auto':
      return 'episode';
    case 'local':
    default:
      return 'episode';
  }
}

export const PacingBarcode = React.memo(function PacingBarcode({
  segments,
  segmentCount = 20,
  height = 60,
  className = '',
  dataScope,
}: PacingBarcodeProps) {
  const unitLabelKind = deriveUnitKindFromScope(dataScope);

  const { series, labelByIndex, values, hasScores } = React.useMemo(() => {
    const resampled = resampleSegmentsToGoodnessPoints(segments, segmentCount, unitLabelKind);
    return buildGoodnessCurveSeries({
      data: resampled,
      totalUnits: segmentCount,
      unitLabelKind,
    });
  }, [segments, segmentCount, unitLabelKind]);

  const heightPx = Math.max(36, height);

  return (
    <div className={cn('relative flex w-full flex-col gap-2', className)} style={{ minHeight: heightPx }}>
      {hasScores ? (
        <>
          <div className="relative flex-1">
            <MiniGoodnessCurve
              values={values}
              height={heightPx}
              threshold={2.2}
              badThreshold={1.5}
              showPeakMarker
              showPeakPlayhead
              gridLines={[1, 2, 3]}
            />
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
        </>
      ) : (
        <div className="flex h-full items-center justify-center rounded border border-dashed border-muted text-xs text-muted-foreground">
          No community data yet
        </div>
      )}
    </div>
  );
});

PacingBarcode.displayName = 'PacingBarcode';
