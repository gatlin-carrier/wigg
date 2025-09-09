import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { type SwipeValue } from '@/components/wigg/SwipeRating';

export type RatingButtonsSize = 'compact' | 'regular' | 'large';

export interface RatingButtonsProps {
  value?: SwipeValue | null;
  onChange?: (value: SwipeValue) => void;
  size?: RatingButtonsSize;
  showHints?: boolean;
  className?: string;
  flyToSelector?: string; // CSS selector of target (e.g., '#barcode-target')
}

// Face emojis for 4-level scale: 0..3
const FACES: Record<SwipeValue, string> = {
  0: '😴', // zzz
  1: '🙂', // good
  2: '😃', // better
  3: '🤩', // peak
};

export function RatingButtons({ value = null, onChange, size = 'regular', showHints = false, className = '', flyToSelector = '#barcode-target' }: RatingButtonsProps) {
  const sizes: Record<RatingButtonsSize, string> = {
    compact: 'h-11 w-11 text-base',
    regular: 'h-12 w-12 text-lg',
    large: 'h-14 w-14 text-xl',
  };

  const flyTo = useCallback((emoji: string, source: HTMLElement) => {
    const target = document.querySelector(flyToSelector) as HTMLElement | null;
    if (!target) return;
    const sRect = source.getBoundingClientRect();
    const tRect = target.getBoundingClientRect();
    const ghost = document.createElement('div');
    ghost.textContent = emoji;
    Object.assign(ghost.style, {
      position: 'fixed',
      left: `${sRect.left + sRect.width / 2 - 14}px`,
      top: `${sRect.top + sRect.height / 2 - 14}px`,
      width: '28px', height: '28px',
      borderRadius: '9999px',
      background: 'var(--background)',
      border: '1px solid hsl(var(--border))',
      display: 'grid', placeItems: 'center',
      zIndex: '9999',
      transition: 'transform 450ms cubic-bezier(.2,.8,.2,1), opacity 450ms',
    } as CSSStyleDeclaration);
    document.body.appendChild(ghost);
    const dx = (tRect.left + tRect.width / 2) - (sRect.left + sRect.width / 2);
    const dy = (tRect.top + 8) - (sRect.top + sRect.height / 2);
    requestAnimationFrame(() => {
      ghost.style.transform = `translate(${dx}px, ${dy}px) scale(.7)`;
      ghost.style.opacity = '0.3';
    });
    setTimeout(() => {
      ghost.remove();
    }, 500);
  }, [flyToSelector]);

  return (
    <div role="radiogroup" aria-label="Rate moment" className={`flex items-center gap-3 ${className}`}>
      {(Object.keys(FACES) as Array<keyof typeof FACES>).map((key) => {
        const k = key as SwipeValue;
        const active = value === k;
        return (
          <button
            key={k}
            type="button"
            className={`inline-flex items-center justify-center ${sizes[size]} rounded-full border transition-transform duration-150 ${active ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-secondary-foreground border-border'} hover:scale-105 hover:rotate-1`}
            onClick={(e) => {
              flyTo(FACES[k], e.currentTarget as HTMLElement);
              onChange?.(k);
            }}
            role="radio"
            aria-checked={active}
            aria-label={`Rate ${k}`}
            style={{ minWidth: 44, minHeight: 44 }}
          >
            <span className="pointer-events-none select-none animate-[wiggle_900ms_ease-in-out_infinite] [@keyframes_wiggle]{0%{transform:rotate(-2deg)}50%{transform:rotate(2deg)}100%{transform:rotate(-2deg)}}">
              {FACES[k]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
