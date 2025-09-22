import React from 'react';
import { SparkLineChart } from '@mui/x-charts/SparkLineChart';
import { ChartsReferenceLine } from '@mui/x-charts/ChartsReferenceLine';

import { cn } from '@/lib/utils';

export interface MiniGoodnessCurveProps {
  values: number[]; // 0..4 scale
  height?: number; // px
  stroke?: string; // CSS color
  fill?: string;   // CSS color (area under)
  className?: string;
  threshold?: number; // 0..4
  colorMode?: 'brand' | 'heat';
  heatStyle?: 'muted' | 'vivid';
  minimal?: boolean; // no fill, no threshold, round caps
  badThreshold?: number; // draw tiny markers on x-axis where value <= threshold
  badMarkerColor?: string;
}

export function MiniGoodnessCurve({
  values,
  height = 32,
  stroke = 'hsl(var(--primary))',
  fill = 'hsl(var(--primary) / 0.12)',
  className = '',
  threshold,
  colorMode = 'brand',
  heatStyle = 'muted',
  minimal = false,
  badThreshold,
  badMarkerColor = 'hsl(var(--destructive))',
}: MiniGoodnessCurveProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = React.useState<number>(0);
  const uniqueId = React.useId();
  const gradientId = React.useMemo(
    () => `mgc-grad-${uniqueId.replace(/[:]/g, '')}`,
    [uniqueId]
  );

  React.useEffect(() => {
    if (!containerRef.current || typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      if (!entries.length) return;
      const entry = entries[0];
      setWidth(entry.contentRect.width);
    });
    observer.observe(containerRef.current);
    setWidth(containerRef.current.clientWidth);
    return () => observer.disconnect();
  }, []);

  const heatColorFor = React.useCallback(
    (norm: number) => {
      const n = Math.max(0, Math.min(1, norm));
      const light = heatStyle === 'vivid'
        ? Math.round(92 - 52 * n)
        : Math.round(92 - 44 * n);
      return `hsl(0 0% ${light}%)`;
    },
    [heatStyle]
  );

  const areaSlotProps = React.useMemo(() => {
    if (minimal) return undefined;
    return {
      filter: 'none',
      fill: colorMode === 'heat' ? `url(#${gradientId})` : fill,
      opacity: colorMode === 'heat' ? 1 : undefined,
    } as const;
  }, [minimal, colorMode, gradientId, fill]);

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
        margin={minimal ? 0 : 4}
        showTooltip={false}
        showHighlight={false}
        clipAreaOffset={{ top: 0, bottom: 0, left: 0, right: 0 }}
        yAxis={{ min: 0, max: 4 }}
        slotProps={{
          area: areaSlotProps,
          line: lineSlotProps,
        }}
      >
        {colorMode === 'heat' && (
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              {values.map((v, i) => {
                const denom = Math.max(1, values.length - 1);
                const offset = (i / denom) * 100;
                return (
                  <stop
                    key={i}
                    offset={`${offset}%`}
                    stopColor={heatColorFor(v / 4)}
                    stopOpacity={0.9}
                  />
                );
              })}
            </linearGradient>
          </defs>
        )}
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
      {markerSvg}
    </div>
  );
}
