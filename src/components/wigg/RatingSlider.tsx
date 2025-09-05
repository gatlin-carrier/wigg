import React, { useMemo } from 'react';
import { type SwipeValue } from '@/components/wigg/SwipeRating';

export interface RatingSliderProps {
  value?: SwipeValue;
  onChange?: (value: SwipeValue) => void;
  height?: number; // px
  className?: string;
  discrete?: boolean; // snap to 4 stops
}

export function RatingSlider({ value = 1, onChange, height = 180, className = '', discrete = true }: RatingSliderProps) {
  const stops: Array<{ v: SwipeValue; label: string }> = [
    { v: 3, label: 'peak' },
    { v: 2, label: 'better' },
    { v: 1, label: 'good' },
    { v: 0, label: 'zzz' },
  ];

  const handleClick = (v: SwipeValue) => onChange?.(v);

  return (
    <div className={`relative flex items-center gap-3 ${className}`}>
      <div className="flex flex-col items-end gap-3">
        {stops.map(s => (
          <button
            key={s.v}
            type="button"
            onClick={() => handleClick(s.v)}
            className={`px-2 py-1 rounded text-xs min-h-[24px] ${value === s.v ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}
            aria-label={`Set rating ${s.label}`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="relative" style={{ height }}>
        <div className="w-2 h-full bg-muted rounded-full relative">
          {/* Active fill */}
          <div
            className="absolute left-0 right-0 bg-primary rounded-full"
            style={{ bottom: 0, top: `${((3 - value) / 3) * height}px` }}
          />
          {/* Stops */}
          {stops.map((s, i) => (
            <button
              key={s.v}
              type="button"
              className={`absolute left-1/2 -translate-x-1/2 rounded-full border-2 border-background ${value === s.v ? 'bg-primary' : 'bg-foreground/70'} focus:outline-none focus:ring-2 focus:ring-primary`}
              style={{ width: 16, height: 16, bottom: `${(i / 3) * (height - 2)}px` }}
              onClick={() => handleClick(s.v)}
              aria-label={`Select ${s.label}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

