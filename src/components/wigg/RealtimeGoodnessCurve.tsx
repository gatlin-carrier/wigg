import React from 'react';

import type { ProgressSegment } from '@/hooks/useTitleProgress';
import {
  buildGoodnessCurveSeries,
  resampleSegmentsToGoodnessPoints,
  type GoodnessCurveUnitKind,
} from '@/lib/goodnessCurve';
import { cn } from '@/lib/utils';

import { MiniGoodnessCurve } from './MiniGoodnessCurve';

export interface RealtimeGoodnessCurveProps {
  segments: ProgressSegment[] | undefined;
  segmentCount?: number;
  height?: number;
  currentPct?: number;
  t2gEstimatePct?: number;
  className?: string;
  onScrub?: (pct: number) => void;
  onScrubEnd?: (pct: number) => void;
  unitKind?: GoodnessCurveUnitKind;
}

const DOMAIN_MIN = 0;
const DOMAIN_MAX = 4;
const CHART_MARGIN = 4;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function interpolateValue(values: number[], position: number): number | null {
  if (!values.length) return null;
  if (values.length === 1) return values[0] ?? null;

  const clampedPosition = clamp(position, 0, values.length - 1);
  const lowerIndex = Math.floor(clampedPosition);
  const upperIndex = Math.ceil(clampedPosition);
  const t = clampedPosition - lowerIndex;

  const lower = values[lowerIndex];
  const upper = values[upperIndex];

  if (typeof lower !== 'number' || typeof upper !== 'number') {
    return lower ?? upper ?? null;
  }

  return lower + (upper - lower) * t;
}

export function RealtimeGoodnessCurve({
  segments,
  segmentCount = 24,
  height = 96,
  currentPct = 0,
  t2gEstimatePct,
  className,
  onScrub,
  onScrubEnd,
  unitKind = 'episode',
}: RealtimeGoodnessCurveProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = React.useState(0);
  const [isScrubbing, setIsScrubbing] = React.useState(false);

  const { series, values, labelByIndex, hasScores } = React.useMemo(() => {
    const resampled = resampleSegmentsToGoodnessPoints(segments, segmentCount, unitKind);
    return buildGoodnessCurveSeries({
      data: resampled,
      totalUnits: segmentCount,
      unitLabelKind: unitKind,
    });
  }, [segments, segmentCount, unitKind]);

  React.useEffect(() => {
    if (!containerRef.current || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setWidth(entry.contentRect.width);
    });

    observer.observe(containerRef.current);
    setWidth(containerRef.current.clientWidth);

    return () => observer.disconnect();
  }, []);

  const denom = Math.max(1, values.length - 1);
  const currentPosition = (clamp(currentPct, 0, 100) / 100) * denom;
  const currentValue = interpolateValue(values, currentPosition);

  const t2gPosition = typeof t2gEstimatePct === 'number'
    ? (clamp(t2gEstimatePct, 0, 100) / 100) * denom
    : null;
  const t2gValue = typeof t2gEstimatePct === 'number'
    ? interpolateValue(values, t2gPosition ?? 0)
    : null;

  const handleScrubAtEvent = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width === 0) return;
    const ratio = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const pct = ratio * 100;
    onScrub?.(pct);
  }, [onScrub]);

  const handlePointerDown = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsScrubbing(true);
    handleScrubAtEvent(event);
  }, [handleScrubAtEvent]);

  const handlePointerMove = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!isScrubbing) return;
    handleScrubAtEvent(event);
  }, [handleScrubAtEvent, isScrubbing]);

  const handlePointerUp = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!isScrubbing) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    setIsScrubbing(false);
    handleScrubAtEvent(event);
    if (onScrubEnd) {
      const rect = event.currentTarget.getBoundingClientRect();
      const ratio = rect.width === 0 ? 0 : clamp((event.clientX - rect.left) / rect.width, 0, 1);
      onScrubEnd(ratio * 100);
    }
  }, [handleScrubAtEvent, isScrubbing, onScrubEnd]);

  const overlaySvg = React.useMemo(() => {
    if (width <= 0 || !values.length) return null;

    const innerWidth = Math.max(0, width - CHART_MARGIN * 2);
    const innerHeight = Math.max(0, height - CHART_MARGIN * 2);

    const positionToX = (position: number) => {
      if (values.length <= 1) return width / 2;
      return CHART_MARGIN + (position / Math.max(1, values.length - 1)) * innerWidth;
    };

    const valueToY = (value: number | null | undefined) => {
      if (value == null) return CHART_MARGIN + innerHeight / 2;
      const ratio = (clamp(value, DOMAIN_MIN, DOMAIN_MAX) - DOMAIN_MIN) / (DOMAIN_MAX - DOMAIN_MIN || 1);
      return CHART_MARGIN + (1 - ratio) * innerHeight;
    };

    const currentX = positionToX(currentPosition);
    const currentY = valueToY(currentValue);
    const t2gX = t2gPosition != null ? positionToX(t2gPosition) : null;
    const t2gY = t2gValue != null ? valueToY(t2gValue) : null;

    return (
      <svg
        className="pointer-events-none absolute inset-0"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
      >
        <line
          x1={currentX}
          x2={currentX}
          y1={CHART_MARGIN}
          y2={height - CHART_MARGIN}
          stroke="#8b5cf6"
          strokeWidth={1.5}
          strokeLinecap="round"
          opacity={0.75}
        />
        <circle cx={currentX} cy={currentY} r={4.5} fill="white" opacity={0.95} />
        <circle cx={currentX} cy={currentY} r={2.5} fill="#8b5cf6" />

        {t2gX != null && t2gY != null && (
          <>
            <line
              x1={t2gX}
              x2={t2gX}
              y1={CHART_MARGIN}
              y2={height - CHART_MARGIN}
              stroke="hsl(var(--primary))"
              strokeDasharray="4 3"
              strokeWidth={1}
              opacity={0.6}
            />
            <circle cx={t2gX} cy={t2gY} r={3.5} fill="white" opacity={0.9} />
            <circle cx={t2gX} cy={t2gY} r={2} fill="hsl(var(--primary))" />
          </>
        )}
      </svg>
    );
  }, [currentPosition, currentValue, height, t2gPosition, t2gValue, values.length, width]);

  return (
    <div className={cn('flex w-full flex-col gap-2', className)}>
      <div
        ref={containerRef}
        className="relative flex-1"
        style={{ minHeight: height }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        role={onScrub ? 'slider' : undefined}
        aria-valuenow={currentPct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progress goodness curve"
      >
        {hasScores ? (
          <>
            <MiniGoodnessCurve
              values={values}
              height={height}
              threshold={2.2}
              badThreshold={1.5}
              showPeakMarker
              showPeakPlayhead
              gridLines={[1, 2, 3]}
            />
            {overlaySvg}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center rounded border border-dashed border-muted text-xs text-muted-foreground">
            No community data yet
          </div>
        )}
      </div>

      {hasScores && series.length > 0 && (
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{labelByIndex.get(0)}</span>
          {series.length > 2 && <span>{labelByIndex.get(Math.floor((series.length - 1) / 2))}</span>}
          <span>{labelByIndex.get(series.length - 1)}</span>
        </div>
      )}
    </div>
  );
}

