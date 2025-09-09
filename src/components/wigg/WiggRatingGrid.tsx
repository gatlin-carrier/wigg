import React from 'react';
import { type SwipeValue } from '@/components/wigg/SwipeRating';

export interface WiggRatingGridProps {
  value?: SwipeValue | null;
  onChange: (value: SwipeValue) => void;
  className?: string;
}

const RATING_ITEMS: Array<{ v: SwipeValue; label: string; emoji: string }> = [
  { v: 0, label: 'zzz',   emoji: '😴' },
  { v: 1, label: 'good',  emoji: '🙂' },
  { v: 2, label: 'better',emoji: '😃' },
  { v: 3, label: 'peak',  emoji: '🤩' },
];

export function WiggRatingGrid({ value = null, onChange, className = '' }: WiggRatingGridProps) {
  return (
    <div className={`grid grid-cols-2 gap-2 ${className}`} role="radiogroup" aria-label="How good is it?">
      {RATING_ITEMS.map((item) => (
        <button
          key={item.v}
          onClick={() => onChange(item.v)}
          className={`p-3 rounded-lg border text-center transition-all ${
            value === item.v
              ? 'border-primary bg-primary/10 scale-105'
              : 'border-border hover:border-primary/50'
          }`}
          role="radio"
          aria-checked={value === item.v}
        >
          <div className="text-lg mb-1 select-none">{item.emoji}</div>
          <div className="text-xs font-medium">{item.label}</div>
        </button>
      ))}
    </div>
  );
}

