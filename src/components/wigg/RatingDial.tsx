import React, { useMemo, useRef, useState } from 'react';
import { type SwipeValue } from '@/components/wigg/SwipeRating';

export interface RatingDialProps {
  value?: SwipeValue;
  onChange?: (value: SwipeValue) => void;
  size?: number; // px
  className?: string;
  interactive?: boolean;
}

export function RatingDial({ value = 1, onChange, size = 160, className = '', interactive = true }: RatingDialProps) {
  const radius = size / 2;
  const stroke = 16;
  const innerR = radius - stroke / 2 - 6;
  const segments: Array<{ v: SwipeValue; start: number; end: number; label: string }> = [
    { v: 0, start: -135, end: -45, label: 'zzz' },
    { v: 1, start: -45, end: 45, label: 'good' },
    { v: 2, start: 45, end: 135, label: 'better' },
    { v: 3, start: 135, end: 225, label: 'peak' }, // wraps past 180
  ];

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const arcPath = (startDeg: number, endDeg: number) => {
    // Normalize angles to SVG polar coords (0 at 3 o'clock, clockwise)
    const s = toRad(startDeg);
    const e = toRad(endDeg);
    const sx = radius + innerR * Math.cos(s);
    const sy = radius + innerR * Math.sin(s);
    const ex = radius + innerR * Math.cos(e);
    const ey = radius + innerR * Math.sin(e);
    const largeArc = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
    const sweep = 1;
    return `M ${sx} ${sy} A ${innerR} ${innerR} 0 ${largeArc} ${sweep} ${ex} ${ey}`;
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<SwipeValue | null>(null);

  const active = hover ?? value;

  const handleClick = (v: SwipeValue) => {
    if (!interactive) return;
    onChange?.(v);
  };

  return (
    <div ref={containerRef} className={`relative inline-block select-none ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role={interactive ? 'slider' : 'img'} aria-valuemin={0} aria-valuemax={3} aria-valuenow={active}>
        {/* Background ring */}
        <circle cx={radius} cy={radius} r={innerR} stroke="hsl(var(--muted-foreground)/.2)" strokeWidth={stroke} fill="none" />

        {/* Segments */}
        {segments.map(seg => (
          <path
            key={seg.v}
            d={arcPath(seg.start, seg.end)}
            stroke={seg.v <= active ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground)/.35)'}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            className={interactive ? 'cursor-pointer transition-colors' : ''}
            onMouseEnter={() => setHover(seg.v)}
            onMouseLeave={() => setHover(null)}
            onClick={() => handleClick(seg.v)}
          />
        ))}

        {/* Center label */}
        <circle cx={radius} cy={radius} r={radius * 0.35} fill="hsl(var(--background))" stroke="hsl(var(--border))" />
        <text x={radius} y={radius - 2} textAnchor="middle" className="fill-foreground" style={{ fontSize: 14, fontWeight: 600 }}>
          {['zzz', 'good', 'better', 'peak'][active]}
        </text>
        <text x={radius} y={radius + 14} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 10 }}>
          tap to set
        </text>
      </svg>
    </div>
  );
}

