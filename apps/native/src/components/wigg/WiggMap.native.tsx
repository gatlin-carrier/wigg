import React, { useMemo, useState } from 'react';
import { View, LayoutChangeEvent } from 'react-native';
import Svg, { Path, Rect, Line, Circle, Text as SvgText, TSpan } from 'react-native-svg';
import { computeBins, pickPrimaryIndex, defaultFormat, clamp } from '@shared/wigg/curve';
import type { WiggMapProps } from '@shared/wigg/types';

type Props = WiggMapProps;

export function WiggMapNative({
  consensus,
  points = [],
  height = 56,
  spoilerSafe = true,
  sensitivity,
  showMiniBar = true,
  onSeek,
  onPeek,
  formatTick,
  className
}: Props) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const filtered = useMemo(() => {
    if (!sensitivity?.tagsToMute?.length) return points;
    const muted = new Set(sensitivity.tagsToMute.map(t => t.toLowerCase()));
    return points.map(p => {
      const hasMuted = (p.tags ?? []).some(t => muted.has(t.toLowerCase()));
      return hasMuted ? { ...p, weight: (p.weight ?? 1) * 0.4 } : p;
    });
  }, [points, sensitivity]);

  const { centers, values, dx } = useMemo(
    () => width ? computeBins(filtered, consensus.duration, Math.min(160, Math.max(40, Math.floor(width/6))) * 6) : { centers: [], values: [], dx: 0, numBins: 0, h: 0 },
    [filtered, consensus.duration, width]
  );

  const y = (v: number) => height - 8 - v * (height - 16);
  const x = (pos: number) => (pos / consensus.duration) * width;

  const areaPath = useMemo(() => {
    if (!centers.length) return '';
    let d = `M 0 ${y(0)} `;
    d += `L ${x(centers[0] - dx/2)} ${y(values[0])} `;
    for (let i = 0; i < centers.length; i++) {
      const xc = x(centers[i]);
      d += `L ${xc} ${y(values[i])} `;
    }
    d += `L ${width} ${y(0)} Z`;
    return d;
  }, [centers, values, dx, width, height]);

  const markerX = useMemo(() => {
    const pos = typeof consensus.medianPos === 'number'
      ? consensus.medianPos
      : (centers.length ? centers[pickPrimaryIndex(values)] : 0);
    return clamp(x(pos), 0, width);
  }, [consensus.medianPos, centers, values, width]);

  const [cursorX, setCursorX] = useState<number | null>(null);
  const fmt = formatTick ?? ((p:number) => defaultFormat(p, consensus.posKind));

  function handleTouch(evt: any) {
    if (!width) return;
    const px = clamp(evt.nativeEvent.locationX, 0, width);
    setCursorX(px);
    const pos = (px / width) * consensus.duration;
    onPeek?.(pos);
  }
  function handleRelease(evt: any) {
    if (!width) return;
    const px = clamp(evt.nativeEvent.locationX, 0, width);
    const pos = (px / width) * consensus.duration;
    onSeek?.(pos);
  }

  return (
    <View className={className}
      onLayout={onLayout}
      onStartShouldSetResponder={() => true}
      onResponderMove={handleTouch}
      onResponderRelease={handleRelease}
    >
      <Svg width="100%" height={height}>
        {/* x-axis ticks along bottom: 0, 25%, 50%, 75%, 100% */}
        {width > 0 && [0, 0.25, 0.5, 0.75, 1].map((t, idx) => {
          const px = x(t * consensus.duration);
          const anchor = t === 0 ? 'start' : t === 1 ? 'end' : 'middle';
          return (
            <SvgText
              key={idx}
              x={px}
              y={height - 6}
              fontSize={10}
              textAnchor={anchor as any}
              fill="currentColor"
              fillOpacity={0.6}
            >
              {fmt(t * consensus.duration)}
            </SvgText>
          );
        })}
        {consensus.windows.map((w, i) => {
          const x1 = x(w.start), x2 = x(w.end);
          const isP = !!w.isPrimary;
          return (
            <Rect key={i}
              x={x1} y={8} width={Math.max(0, x2 - x1)} height={height-16}
              fill="currentColor" fillOpacity={(isP ? 0.18 : 0.12) * (w.score ?? 1)}
              stroke="currentColor" strokeOpacity={(isP ? 0.3 : 0.2) * (w.score ?? 1)} strokeWidth={isP ? 1.25 : 1}
            />
          );
        })}

        <Path d={areaPath} fill="currentColor" fillOpacity={0.25} stroke="currentColor" strokeWidth={1} />

        {showMiniBar && <Rect x={0} y={height-3} width={width} height={2} rx={1} fill="currentColor" opacity={0.4} />}

        <Line x1={markerX} x2={markerX} y1={8} y2={height-8} stroke="currentColor" strokeWidth={1} />
        <Circle cx={markerX} cy={8} r={3} fill="currentColor" />

        {cursorX !== null && (() => {
          const pos = (cursorX/width) * consensus.duration;
          // interpolate local value along bins
          const dxLocal = (centers[1] ?? centers[0] ?? 0) - (centers[0] ?? 0);
          const i = Math.max(0, Math.min(centers.length - 1, Math.floor(pos / (dxLocal || 1))))
          const leftC = centers[i] ?? 0;
          const rightC = centers[i+1] ?? leftC;
          const t = rightC !== leftC ? Math.max(0, Math.min(1, (pos - leftC) / (rightC - leftC))) : 0;
          const v = (values[i] ?? 0) * (1 - t) + (values[i+1] ?? values[i] ?? 0) * t;
          const cy = y(v);
          const labelX = Math.min(width - 4, cursorX + 8);
          const placeBelow = cy < 18;
          const labelY = placeBelow ? Math.min(height - 8, cy + 8) : Math.max(8, cy - 14);
          return (
            <>
              {/* vertical scrobble line from top to bottom */}
              {/* fallback white line to ensure visibility on dark backgrounds */}
              <Line x1={cursorX} x2={cursorX} y1={0} y2={height} stroke="white" strokeWidth={1.5} opacity={0.12} />
              <Line x1={cursorX} x2={cursorX} y1={0} y2={height} stroke="currentColor" strokeWidth={1} opacity={0.35} />
              {/* scrobble dot on the curve */}
              <Circle cx={cursorX} cy={cy} r={3.5} fill="currentColor" stroke="white" strokeOpacity={0.15} />
              {/* inline tooltip text, subtle */}
              <SvgText x={labelX} y={labelY} fill="currentColor" fillOpacity={0.9} fontSize={10} textAnchor="start" alignmentBaseline="hanging">
                <TSpan fillOpacity={0.9}>{fmt(pos)} </TSpan>
                <TSpan fontSize={9} fill="currentColor" fillOpacity={0.8}>{(v ?? 0).toFixed(2)}</TSpan>
              </SvgText>
            </>
          );
        })()}
      </Svg>
    </View>
  );
}

export default WiggMapNative;
