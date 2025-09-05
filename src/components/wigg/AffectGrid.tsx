import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';

export type Confidence = 'low' | 'med' | 'high';

export interface AffectGridValue {
  quality: number; // 0..1 (meh -> peak)
  energy: number;  // 0..1 (calm -> hype)
  confidence?: Confidence;
}

export interface AffectGridProps {
  value?: AffectGridValue;
  onChange?: (val: AffectGridValue) => void;
  size?: number; // px
  discrete?: boolean; // snap to 2x2 quadrants for quick marking
  showAxes?: boolean;
  className?: string;
}

function clamp01(n: number) { return Math.max(0, Math.min(1, n)); }

export function AffectGrid({
  value,
  onChange,
  size = 220,
  discrete = false,
  showAxes = true,
  className = ''
}: AffectGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [internal, setInternal] = useState<AffectGridValue>({ quality: 0.5, energy: 0.5, confidence: 'med' });
  const val = value ?? internal;

  const setVal = (next: AffectGridValue) => {
    setInternal(next);
    onChange?.(next);
  };

  const handlePointer = useCallback((e: React.PointerEvent) => {
    const el = containerRef.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = clamp01((e.clientX - rect.left) / rect.width);
    const y = clamp01(1 - (e.clientY - rect.top) / rect.height); // bottom=0 top=1
    let q = x, en = y;
    if (discrete) {
      q = q < 0.25 ? 0 : q < 0.5 ? 0.33 : q < 0.75 ? 0.66 : 1;
      en = en < 0.25 ? 0 : en < 0.5 ? 0.33 : en < 0.75 ? 0.66 : 1;
    }
    setVal({ quality: q, energy: en, confidence: val.confidence });
  }, [discrete, val.confidence]);

  const startDrag = (e: React.PointerEvent) => {
    (e.target as Element).ownerDocument?.body.classList.add('select-none');
    e.currentTarget.setPointerCapture(e.pointerId);
    handlePointer(e);
  };
  const moveDrag = (e: React.PointerEvent) => handlePointer(e);
  const endDrag = (e: React.PointerEvent) => {
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    (e.target as Element).ownerDocument?.body.classList.remove('select-none');
  };

  const dotX = val.quality * size;
  const dotY = (1 - val.energy) * size;

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <div
        ref={containerRef}
        style={{ width: size, height: size }}
        className="relative rounded-lg overflow-hidden border bg-background"
        onPointerDown={startDrag}
        onPointerMove={(e) => { if ((e.currentTarget as any).hasPointerCapture?.(e.pointerId)) moveDrag(e); }}
        onPointerUp={endDrag}
        role="application"
        aria-label="Affect grid: left=meh, right=peak, bottom=calm, top=hype"
      >
        {/* background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--muted)/.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--muted)/.3)_1px,transparent_1px)] bg-[size:25%_100%,100%_25%]" />
        {showAxes && (
          <>
            <div className="absolute left-1/2 top-0 -translate-x-1/2 w-px h-full bg-muted/60" />
            <div className="absolute top-1/2 left-0 -translate-y-1/2 h-px w-full bg-muted/60" />
            <div className="absolute left-2 bottom-2 text-[10px] text-muted-foreground">calm</div>
            <div className="absolute right-2 top-2 text-[10px] text-muted-foreground">hype</div>
            <div className="absolute left-2 top-2 text-[10px] text-muted-foreground">meh</div>
            <div className="absolute right-2 bottom-2 text-[10px] text-muted-foreground">peak</div>
          </>
        )}
        {/* selection dot */}
        <div
          className="absolute rounded-full border-2 border-background shadow-md"
          style={{ width: 18, height: 18, left: dotX - 9, top: dotY - 9, background: 'hsl(var(--primary))' }}
        />
      </div>
      {/* confidence controls */}
      <div className="mt-2 flex items-center gap-2" aria-label="Confidence">
        {(['low','med','high'] as Confidence[]).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setVal({ ...val, confidence: c })}
            className={`w-6 h-6 rounded-full border ${val.confidence === c ? 'bg-primary border-primary' : 'bg-muted'}`}
            aria-label={`${c} confidence`}
          />
        ))}
      </div>
      <div className="text-[10px] text-muted-foreground mt-1">quality {val.quality.toFixed(2)} · energy {val.energy.toFixed(2)} · {val.confidence}</div>
    </div>
  );
}

