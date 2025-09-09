import React, { useMemo, useRef, useEffect } from 'react';

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
  const ref = useRef<SVGSVGElement | null>(null);
  const gradId = useMemo(() => `mgc-grad-${Math.random().toString(36).slice(2)}`, []);

  const { path, area, threshY } = useMemo(() => {
    const n = Math.max(2, values.length);
    const w = 100; // viewBox width (percent)
    const h = height; // viewBox height in px
    const max = 4;
    const xs = values.map((_, i) => (i / (n - 1)) * w);
    const ys = values.map(v => h - (Math.max(0, Math.min(max, v)) / max) * (h - 4) - 2);
    // Build a smooth cubic bezier path using Catmull-Rom to Bezier conversion
    const pts = xs.map((x, i) => ({ x, y: ys[i] }));
    const segs: string[] = [];
    if (pts.length > 0) {
      segs.push(`M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`);
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[Math.max(0, i - 1)];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[Math.min(pts.length - 1, i + 2)];
        // Catmull-Rom to Bezier with adjustable tension (more rounded if minimal)
        const t = minimal ? 0.7 : 0.5;
        const c1x = p1.x + (p2.x - p0.x) * (t / 6);
        const c1y = p1.y + (p2.y - p0.y) * (t / 6);
        const c2x = p2.x - (p3.x - p1.x) * (t / 6);
        const c2y = p2.y - (p3.y - p1.y) * (t / 6);
        segs.push(
          `C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
        );
      }
    }
    const p = segs.join(' ');
    const a = `${p} L ${w} ${h} L 0 ${h} Z`;
    const ty = threshold !== undefined ? (h - (Math.max(0, Math.min(max, threshold)) / max) * (h - 4) - 2) : undefined;
    return { path: p, area: a, threshY: ty };
  }, [values, height, threshold, minimal]);

  const heatColorFor = (norm: number) => {
    // Monochrome gradient: low values = light gray, high values = near-black
    const n = Math.max(0, Math.min(1, norm));
    const light = heatStyle === 'vivid'
      ? Math.round(92 - 52 * n)   // 92% -> 40%
      : Math.round(92 - 44 * n);  // 92% -> 48%
    return `hsl(0 0% ${light}%)`;
  };

  useEffect(() => {
    // nothing; placeholder for future animations
  }, [values]);

  return (
    <svg ref={ref} className={`w-full ${className}`} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" role="img" aria-label="goodness curve">
      {colorMode === 'heat' && (
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            {values.map((v, i) => {
              const offset = (i / Math.max(1, values.length - 1)) * 100;
              const color = heatColorFor(v / 4);
              return <stop key={i} offset={`${offset}%`} stopColor={color} stopOpacity={0.9} />;
            })}
          </linearGradient>
        </defs>
      )}
      {!minimal && (
        <path d={area} fill={colorMode === 'heat' ? `url(#${gradId})` : fill} />
      )}
      {!minimal && threshold !== undefined && (
        <line x1={0} y1={threshY} x2={100} y2={threshY} stroke="hsl(var(--muted-foreground)/0.5)" strokeDasharray="4 4" />
      )}
      <path d={path} stroke={stroke} strokeWidth={minimal ? 1.25 : 1.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {typeof badThreshold === 'number' && (
        <g>
          {values.map((v, i) => {
            if (v > badThreshold) return null;
            const x = (i / Math.max(1, values.length - 1)) * 100;
            const y = height - 1;
            return <circle key={`bad-${i}`} cx={x} cy={y} r={1} fill={badMarkerColor} />
          })}
        </g>
      )}
    </svg>
  );
}
