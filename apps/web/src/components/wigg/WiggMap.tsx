import React, { useMemo, useRef, useState } from 'react';
import { computeBins, pickPrimaryIndex, defaultFormat, clamp } from '@shared/wigg/curve';
import type { WiggMapProps } from '@shared/wigg/types';

type Props = WiggMapProps;

export function WiggMap({
  consensus,
  points = [],
  height = 56,
  width = 600,
  posKindLabel,
  spoilerSafe = true,
  sensitivity,
  showGrid = false,
  showMiniBar = true,
  onSeek,
  onPeek,
  formatTick,
  className
}: Props) {
  const filtered = useMemo(() => {
    if (!sensitivity?.tagsToMute?.length) return points;
    const muted = new Set(sensitivity.tagsToMute.map(t => t.toLowerCase()));
    return points.map(p => {
      const hasMuted = (p.tags ?? []).some(t => muted.has(t.toLowerCase()));
      return hasMuted ? { ...p, weight: (p.weight ?? 1) * 0.4 } : p;
    });
  }, [points, sensitivity]);

  const { centers, values, dx } = useMemo(
    () => computeBins(filtered, consensus.duration, width),
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
  const svgRef = useRef<SVGSVGElement>(null);

  function handleMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = clamp(e.clientX - rect.left, 0, width);
    setCursorX(px);
    const pos = (px / width) * consensus.duration;
    onPeek?.(pos);
  }
  function handleLeave() { setCursorX(null); }
  function handleClick(e: React.MouseEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = clamp(e.clientX - rect.left, 0, width);
    const pos = (px / width) * consensus.duration;
    onSeek?.(pos);
  }

  const fmt = formatTick ?? ((p:number) => defaultFormat(p, consensus.posKind));
  const primary = consensus.windows.find(w => w.isPrimary) ?? null;

  const srDesc = (() => {
    const parts: string[] = [];
    if (primary) parts.push(`Primary window from ${fmt(primary.start)} to ${fmt(primary.end)}`);
    if (typeof consensus.medianPos === 'number') parts.push(`Median at ${fmt(consensus.medianPos)}`);
    return parts.join('. ');
  })();

  return (
    <div className={className}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        role="img"
        aria-label="WiggMap density over time"
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        onClick={handleClick}
        className="overflow-visible"
      >
        <title>WiggMap density over time</title>
        {srDesc && <desc>{srDesc}</desc>}

        {showGrid && [0.25,0.5,0.75].map((t) => (
          <line key={t} x1={0} x2={width} y1={y(t)} y2={y(t)} className="stroke-zinc-300/30" strokeWidth={1}/>
        ))}

        {consensus.windows.map((w, i) => {
          const x1 = x(w.start), x2 = x(w.end);
          const isP = !!w.isPrimary;
          return (
            <g key={i} aria-hidden>
              <rect x={x1} y={8} width={Math.max(0, x2 - x1)} height={height-16}
                    className={isP ? 'fill-current' : 'fill-current'}
                    fillOpacity={(isP ? 0.18 : 0.12) * (w.score ?? 1)}
                    stroke="currentColor" strokeOpacity={(isP ? 0.3 : 0.2) * (w.score ?? 1)} strokeWidth={isP ? 1.25 : 1}/>
              {!spoilerSafe && w.label && (
                <text x={(x1+x2)/2} y={14} textAnchor="middle" className="fill-current opacity-70 text-[10px]">
                  {w.label}
                </text>
              )}
            </g>
          );
        })}

        <path d={areaPath} className="fill-current" fillOpacity={0.25} stroke="currentColor" strokeWidth={1} />

        {showMiniBar && (
          <rect x={0} y={height-3} width={width} height={2} rx={1} className="fill-current opacity-40" />
        )}

        <line x1={markerX} x2={markerX} y1={8} y2={height-8} className="stroke-current" strokeWidth={1}/>
        <circle cx={markerX} cy={8} r={3} className="fill-current" />

        {cursorX !== null && (
          <>
            <line x1={cursorX} x2={cursorX} y1={8} y2={height-8} className="stroke-current opacity-40" strokeDasharray="2 2" />
            <rect x={cursorX+6} y={8} width={64} height={16} rx={4} className="fill-black/70" />
            <text x={cursorX+38} y={20} textAnchor="middle" className="fill-white text-[10px]">
              {(() => {
                const pos = (cursorX/width)*consensus.duration;
                // local bin strength
                const idx = centers.reduce((best, c, i) => Math.abs(c - pos) < Math.abs(centers[best] - pos) ? i : best, 0);
                const strength = values[idx] ?? 0;
                return `${fmt(pos)}  ${strength.toFixed(2)}`;
              })()}
            </text>
          </>
        )}
      </svg>
      <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-500">
        <span>0{posKindLabel ? ` ${posKindLabel}` : ''}</span>
        <span>{fmt(consensus.duration)}{posKindLabel ? ` ${posKindLabel}` : ''}</span>
      </div>
    </div>
  );
}

export default WiggMap;
