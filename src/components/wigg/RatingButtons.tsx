import React from 'react';
import { Button } from '@/components/ui/button';
import { type SwipeValue } from '@/components/wigg/SwipeRating';
import { Moon, ThumbsUp, Sparkles, Crown } from 'lucide-react';

export type RatingButtonsSize = 'compact' | 'regular' | 'large';

export interface RatingButtonsProps {
  value?: SwipeValue | null;
  onChange?: (value: SwipeValue) => void;
  size?: RatingButtonsSize;
  showHints?: boolean;
  className?: string;
}

const LABELS: Record<SwipeValue, { label: string; icon: React.ReactNode; hint: string }> = {
  0: { label: 'zzz',   icon: <Moon className="h-4 w-4" />,      hint: 'A / ←' },
  1: { label: 'good',  icon: <ThumbsUp className="h-4 w-4" />,  hint: 'S / ↑' },
  2: { label: 'better',icon: <Sparkles className="h-4 w-4" />,  hint: 'D / →' },
  3: { label: 'peak',  icon: <Crown className="h-4 w-4" />,     hint: 'F / ↓' },
};

export function RatingButtons({ value = null, onChange, size = 'regular', showHints = true, className = '' }: RatingButtonsProps) {
  const sizes: Record<RatingButtonsSize, string> = {
    compact: 'h-10 text-[10px] gap-0.5',
    regular: 'h-14 text-xs gap-1',
    large: 'h-16 text-sm gap-1.5',
  };

  return (
    <div role="radiogroup" aria-label="Rate moment" className={`grid grid-cols-4 gap-2 ${className}`}>
      {(Object.keys(LABELS) as Array<keyof typeof LABELS>).map((key) => {
        const k = key as SwipeValue;
        const active = value === k;
        return (
          <Button
            key={k}
            type="button"
            variant={active ? 'default' : 'outline'}
            className={`flex flex-col items-center justify-center ${sizes[size]} rounded-lg min-w-[44px]`}
            onClick={() => onChange?.(k)}
            role="radio"
            aria-checked={active}
            aria-label={`${LABELS[k].label}${showHints ? ` (${LABELS[k].hint})` : ''}`}
          >
            <span className={`inline-flex items-center justify-center ${size === 'compact' ? 'mb-0.5' : 'mb-1'} ${active ? '' : 'opacity-90'}`}>
              {LABELS[k].icon}
            </span>
            <span className={active ? 'font-medium' : 'text-muted-foreground'}>{LABELS[k].label}</span>
            {showHints && (
              <span className="text-[10px] text-muted-foreground/80 mt-0.5">{LABELS[k].hint}</span>
            )}
          </Button>
        );
      })}
    </div>
  );
}

