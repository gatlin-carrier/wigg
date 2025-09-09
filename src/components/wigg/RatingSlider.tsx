import React from 'react';
import { type SwipeValue } from '@/components/wigg/SwipeRating';

export interface RatingSliderProps {
  value?: number;
  onChange?: (value: number) => void;
  height?: number; // px (for vertical)
  className?: string;
  discrete?: boolean; // snap to 4 stops (kept for API symmetry)
  orientation?: 'vertical' | 'horizontal';
  showIcons?: boolean; // render emoji/icons on stops
  scale?: 4 | 5; // number of stops
}

export function RatingSlider({
  value = 1,
  onChange,
  height = 180,
  className = '',
  discrete = true,
  orientation = 'vertical',
  showIcons = true,
  scale = 4,
}: RatingSliderProps) {
  const stops4 = [
    { v: 0 as SwipeValue, label: 'zzz', emoji: '😴' },
    { v: 1 as SwipeValue, label: 'good', emoji: '🙂' },
    { v: 2 as SwipeValue, label: 'better', emoji: '😃' },
    { v: 3 as SwipeValue, label: 'peak', emoji: '🤩' },
  ];
  // For scale=5 we extend to 5 faces: hated it, bad, ok, good, peak
  const stops5 = [
    { v: 0 as SwipeValue, label: 'hated', emoji: '🤮' },
    { v: 1 as SwipeValue, label: 'bad', emoji: '😞' },
    { v: 2 as SwipeValue, label: 'ok', emoji: '😐' },
    { v: 3 as SwipeValue, label: 'good', emoji: '🙂' },
    // Peak is out of SwipeValue range, but we allow it via cast; consumers should treat value as number when scale=5
  ];
  const peakStop = { v: 3 as SwipeValue, label: 'peak', emoji: '🤩' };
  const stops = (scale === 5 ? [...stops5, peakStop] : stops4) as Array<{ v: SwipeValue; label: string; emoji: string }>;

  const handleClick = (v: number) => onChange?.(v);

  if (orientation === 'horizontal') {
    return (
      <div className={`w-full ${className}`}>
        <div className="relative w-full h-8">
          {/* Track */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-2 bg-muted rounded-full overflow-hidden" />
          {/* Active fill */}
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-2 rounded-full"
            style={{
              width: `${(Number(value) / (stops.length - 1)) * 100}%`,
              background: 'linear-gradient(90deg, hsl(var(--primary)/.5) 0%, hsl(var(--primary)) 100%)',
            }}
          />
          {/* Stops */}
          {stops.map((s, i) => (
            <button
              key={s.v}
              type="button"
              onClick={() => handleClick(s.v)}
              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background focus:outline-none focus:ring-2 focus:ring-primary flex items-center justify-center ${
                value === s.v ? 'bg-primary text-primary-foreground' : 'bg-foreground/70 text-background'
              }`}
              style={{
                left: `${(i / (stops.length - 1)) * 100}%`,
                top: '50%',
                width: 28,
                height: 28,
              }}
              aria-label={`Select ${s.label}`}
              aria-pressed={value === s.v}
            >
              {showIcons ? s.emoji : null}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Vertical layout
  return (
    <div className={`relative flex items-center gap-3 ${className}`}>
      <div className="flex flex-col items-end gap-3">
        {stops.slice().reverse().map(s => (
          <button
            key={s.v}
            type="button"
            onClick={() => handleClick(s.v)}
            className={`px-2 py-1 rounded text-xs min-h-[24px] ${value === s.v ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}
            aria-label={`Set rating ${s.label}`}
          >
            {showIcons ? <span className="inline-flex items-center gap-1">{s.emoji}<span className="sr-only"> {s.label}</span></span> : s.label}
          </button>
        ))}
      </div>
      <div className="relative" style={{ height }}>
        <div className="w-2 h-full bg-muted rounded-full relative">
          {/* Active fill */}
          <div
            className="absolute left-0 right-0 bg-primary rounded-full"
            style={{ bottom: 0, top: `${(((stops.length - 1) - Number(value)) / (stops.length - 1)) * height}px` }}
          />
          {/* Stops */}
          {stops.map((s, i) => (
            <button
              key={s.v}
              type="button"
              className={`absolute left-1/2 -translate-x-1/2 rounded-full border-2 border-background ${value === s.v ? 'bg-primary' : 'bg-foreground/70'} focus:outline-none focus:ring-2 focus:ring-primary`}
              style={{ width: 16, height: 16, bottom: `${(i / (stops.length - 1)) * (height - 2)}px` }}
              onClick={() => handleClick(s.v)}
              aria-label={`Select ${s.label}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
