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

  // Find peaks in the curve for static dots
  const peaks = useMemo(() => {
    if (!centers.length) return [];
    const threshold = 0.3; // Only show dots for significant peaks
    const peakPositions: Array<{x: number, y: number, pos: number}> = [];
    
    for (let i = 1; i < centers.length - 1; i++) {
      const val = values[i];
      const leftVal = values[i - 1];
      const rightVal = values[i + 1];
      
      // Check if this is a local maximum above threshold
      if (val > threshold && val >= leftVal && val >= rightVal) {
        peakPositions.push({
          x: x(centers[i]),
          y: y(val),
          pos: centers[i]
        });
      }
    }
    
    return peakPositions;
  }, [centers, values, x, y]);

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
    let px = clamp(e.clientX - rect.left, 0, width);
    
    // Snap to nearby peak circles if close enough
    const snapDistance = 20; // pixels
    
    for (const peak of peaks) {
      if (Math.abs(px - peak.x) <= snapDistance) {
        px = peak.x;
        break;
      }
    }
    
    setCursorX(px);
    const finalPos = (px / width) * consensus.duration;
    onPeek?.(finalPos);
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
        aria-label="WiggMap visualization"
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        onClick={handleClick}
        className="overflow-visible"
      >
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

        {/* Static circles at peak positions */}
        {peaks.map((peak, i) => (
          <circle
            key={i}
            cx={peak.x}
            cy={peak.y}
            r={4}
            className="fill-current"
            fillOpacity={0.8}
            stroke="currentColor"
            strokeWidth={1}
            strokeOpacity={0.6}
          />
        ))}

        {showMiniBar && (
          <rect x={0} y={height-3} width={width} height={2} rx={1} className="fill-current opacity-40" />
        )}


        {cursorX !== null && (
          (() => {
            const pos = (cursorX/width) * consensus.duration;
            // interpolate local value along bins for smoother dot placement
            const i = Math.max(0, Math.min(centers.length - 1, Math.floor(pos / (dx || 1))))
            const leftC = centers[i] ?? 0;
            const rightC = centers[i+1] ?? leftC;
            const t = rightC !== leftC ? Math.max(0, Math.min(1, (pos - leftC) / (rightC - leftC))) : 0;
            const v = (values[i] ?? 0) * (1 - t) + (values[i+1] ?? values[i] ?? 0) * t;
            const cy = y(v);
            const labelX = Math.min(width - 4, cursorX + 8);
            const placeBelow = cy < 18; // if near top, place label below the dot
            const labelY = placeBelow
              ? Math.min(height - 8, cy + 8)
              : Math.max(8, cy - 18);
            return (
              <>
                {/* vertical playhead line from top to bottom */}
                <line x1={cursorX} x2={cursorX} y1={0} y2={height} stroke="currentColor" strokeOpacity={0.7} strokeWidth={2} />
                {/* scrobble dot on the curve, same color as line */}
                <circle cx={cursorX} cy={cy} r={3.5} className="fill-current" />
                {/* harmonious colored numbers with better contrast */}
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor="start"
                  dominantBaseline="hanging"
                  className="text-[10px] font-medium"
                  style={{ fill: '#f1f5f9' }}
                >
                  <tspan style={{ fill: '#f1f5f9' }}>{fmt(pos)} </tspan>
                  <tspan fontSize={9} style={{ fill: '#cbd5e1' }} fillOpacity={0.9}>
                    {(v ?? 0).toFixed(2)}
                  </tspan>
                </text>
              </>
            );
          })()
        )}
      </svg>
      <div className="relative mt-1 text-[10px] text-zinc-400" style={{ width }}>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const timeStr = fmt(t * consensus.duration);
          // Remove 'min' suffix and keep just the time
          const cleanTime = timeStr.replace(/\s*min\s*$/, '').trim();
          const xPos = t * width;
          
          return (
            <span 
              key={t} 
              className="absolute transform -translate-x-1/2"
              style={{ 
                left: t === 0 ? '0px' : t === 1 ? `${width}px` : `${xPos}px`,
                transform: t === 0 ? 'translateX(0)' : t === 1 ? 'translateX(-100%)' : 'translateX(-50%)'
              }}
            >
              {cleanTime}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default WiggMap;
