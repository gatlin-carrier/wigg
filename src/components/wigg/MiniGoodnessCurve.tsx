import React from 'react';
import { SparkLineChart } from '@mui/x-charts/SparkLineChart';
import { ChartsReferenceLine } from '@mui/x-charts/ChartsReferenceLine';

import { smooth } from '@/lib/wigg/analysis';
import { cn } from '@/lib/utils';

export interface MiniGoodnessCurveProps {
  values: number[]; // 0..4 scale
  height?: number; // px
  stroke?: string; // CSS color
  fill?: string;   // CSS color (area under)
  className?: string;
  threshold?: number; // 0..4
  minimal?: boolean; // no fill, no threshold, round caps
  badThreshold?: number; // draw tiny markers on x-axis where value <= threshold
  badMarkerColor?: string;
  showPeakMarker?: boolean;
  showPeakPlayhead?: boolean;
  peakMarkerColor?: string;
  gridLines?: number[];
  gridLineColor?: string;
  gridLineDash?: string;
}

export function MiniGoodnessCurve({
  values,
  height = 32,
  stroke = 'hsl(var(--primary))',
  fill = 'hsl(var(--primary) / 0.12)',
  className = '',
  threshold,
  minimal = false,
  badThreshold,
  badMarkerColor = 'hsl(var(--destructive))',
  showPeakMarker = true,
  showPeakPlayhead = true,
  peakMarkerColor = '#8b5cf6',
  gridLines,
  gridLineColor = 'hsl(var(--muted-foreground) / 0.3)',
  gridLineDash = '3 3',
}: MiniGoodnessCurveProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = React.useState<number>(300); // Start with default to prevent CLS
  const chartMargin = minimal ? 0 : 4;

  React.useEffect(() => {
    if (!containerRef.current || typeof ResizeObserver === 'undefined') {
      return;
    }
    // Set initial width immediately to prevent layout shift
    setWidth(containerRef.current.clientWidth);

    const observer = new ResizeObserver((entries) => {
      if (!entries.length) return;
      const entry = entries[0];
      const newWidth = entry.contentRect.width;
      // Only update if width changed to prevent unnecessary re-renders
      setWidth(prev => Math.abs(prev - newWidth) > 1 ? newWidth : prev);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const areaSlotProps = React.useMemo(() => {
    if (minimal) return undefined;
    return {
      filter: 'none',
      fill,
    } as const;
  }, [minimal, fill]);

  const lineSlotProps = React.useMemo(
    () => ({
      strokeWidth: minimal ? 1.25 : 1.5,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      filter: 'none',
    }),
    [minimal]
  );

  const markerSvg = React.useMemo(() => {
    if (typeof badThreshold !== 'number' || width <= 0) {
      return null;
    }
    const n = Math.max(1, values.length - 1);
    return (
      <svg
        className="pointer-events-none absolute inset-0"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
      >
        {values.map((v, i) => {
          if (v > badThreshold) return null;
          const x = values.length > 1 ? (i / n) * width : width / 2;
          const y = height - 2;
          return <circle key={`bad-${i}`} cx={x} cy={y} r={1} fill={badMarkerColor} />;
        })}
      </svg>
    );
  }, [badThreshold, badMarkerColor, height, values, width]);

  const gridSvg = React.useMemo(() => {
    if (!gridLines?.length || width <= 0) {
      return null;
    }
    const domainMin = 0;
    const domainMax = 4;
    const innerWidth = Math.max(0, width - chartMargin * 2);
    const innerHeight = Math.max(0, height - chartMargin * 2);
    return (
      <svg
        className="pointer-events-none absolute inset-0"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
      >
        {gridLines.map((value, idx) => {
          if (value < domainMin || value > domainMax) return null;
          const ratio = (value - domainMin) / (domainMax - domainMin || 1);
          const y = chartMargin + (1 - ratio) * innerHeight;
          return (
            <line
              key={`grid-${idx}`}
              x1={chartMargin}
              x2={width - chartMargin}
              y1={y}
              y2={y}
              stroke={gridLineColor}
              strokeDasharray={gridLineDash}
              strokeWidth={1}
            />
          );
        })}
      </svg>
    );
  }, [chartMargin, gridLineColor, gridLineDash, gridLines, height, width]);

  const firstPeak = React.useMemo(() => {
    const n = values.length;
    if (n === 0) return null;
    if (n === 1) return { index: 0, value: values[0] };
    const window = Math.max(3, Math.round(n * 0.12));
    const smoothed = smooth(values, window);
    const epsilon = 0.05;
    for (let i = 1; i < n - 1; i++) {
      const prev = smoothed[i - 1];
      const curr = smoothed[i];
      const next = smoothed[i + 1];
      if (curr >= prev && curr >= next && (curr - prev > epsilon || curr - next > epsilon)) {
        return { index: i, value: values[i] ?? curr };
      }
    }
    let maxIdx = 0;
    for (let i = 1; i < n; i++) {
      if (smoothed[i] > smoothed[maxIdx]) maxIdx = i;
    }
    return { index: maxIdx, value: values[maxIdx] ?? smoothed[maxIdx] };
  }, [values]);

  const peakOverlay = React.useMemo(() => {
    if ((!showPeakMarker && !showPeakPlayhead) || !firstPeak || width <= 0) {
      return null;
    }
    const domainMin = 0;
    const domainMax = 4;
    const clamped = Math.min(domainMax, Math.max(domainMin, firstPeak.value));
    const innerWidth = Math.max(0, width - chartMargin * 2);
    const innerHeight = Math.max(0, height - chartMargin * 2);
    const denom = Math.max(1, values.length - 1);
    const x = values.length > 1
      ? chartMargin + (firstPeak.index / denom) * innerWidth
      : width / 2;
    const ratio = (clamped - domainMin) / (domainMax - domainMin || 1);
    const y = chartMargin + (1 - ratio) * innerHeight;

    return (
      <svg
        className="pointer-events-none absolute inset-0"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
      >
        {showPeakPlayhead && (
          <line
            x1={x}
            x2={x}
            y1={chartMargin}
            y2={height - chartMargin}
            stroke={peakMarkerColor}
            strokeWidth={1}
            strokeLinecap="round"
            opacity={0.6}
          />
        )}
        {showPeakMarker && (
          <>
            <circle cx={x} cy={y} r={4} fill="white" opacity={0.9} />
            <circle cx={x} cy={y} r={2.5} fill={peakMarkerColor} />
          </>
        )}
      </svg>
    );
  }, [chartMargin, firstPeak, height, peakMarkerColor, showPeakMarker, showPeakPlayhead, values.length, width]);

  return (
    <div
      ref={containerRef}
      className={cn('relative w-full', className)}
      style={{ height }}
    >
      <SparkLineChart
        className="h-full w-full"
        data={values}
        height={height}
        width={width || undefined}
        color={stroke}
        curve={minimal ? 'linear' : 'catmullRom'}
        area={!minimal}
        baseline={0}
        margin={chartMargin}
        showTooltip={false}
        showHighlight={false}
        clipAreaOffset={{ top: 0, bottom: 0, left: 0, right: 0 }}
        yAxis={{ min: 0, max: 4 }}
        slotProps={{
          area: areaSlotProps,
          line: lineSlotProps,
        }}
      >
        {!minimal && typeof threshold === 'number' && (
          <ChartsReferenceLine
            y={threshold}
            lineStyle={{
              stroke: 'hsl(var(--muted-foreground)/0.5)',
              strokeDasharray: '4 4',
              strokeWidth: 1,
            }}
          />
        )}
      </SparkLineChart>
      {gridSvg}
      {markerSvg}
      {peakOverlay}
    </div>
  );
}
