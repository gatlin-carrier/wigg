import type { PosKind, WiggPoint } from './types';

export function computeBins(
  points: WiggPoint[] = [],
  duration: number,
  widthPx: number,
  minBins = 40,
  maxBins = 400
) {
  const numBins = Math.max(minBins, Math.min(maxBins, Math.round(widthPx / 6)));
  const dx = duration / numBins;
  const centers = new Array(numBins).fill(0).map((_, i) => (i + 0.5) * dx);
  const h = 2 * dx;

  const densities = new Float32Array(numBins);
  for (const p of points) {
    const w = p.weight ?? 1;
    const startIdx = Math.max(0, Math.floor((p.pos - h) / dx));
    const endIdx = Math.min(numBins - 1, Math.ceil((p.pos + h) / dx));
    for (let i = startIdx; i <= endIdx; i++) {
      const x = centers[i];
      const tri = Math.max(0, 1 - Math.abs(x - p.pos) / h);
      densities[i] += tri * w;
    }
  }
  let max = 0;
  for (let i = 0; i < numBins; i++) max = Math.max(max, densities[i]);
  const norm = max > 0 ? 1 / max : 0;
  const normalized = Array.from(densities, (d) => d * norm);

  return { centers, values: normalized, dx, numBins, h };
}

export function pickPrimaryIndex(values: number[]) {
  let idx = 0; let vmax = -1;
  for (let i = 0; i < values.length; i++) if (values[i] > vmax) { vmax = values[i]; idx = i; }
  return idx;
}

export function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export function defaultFormat(pos: number, kind: PosKind) {
  if (kind === 'percent') return `${Math.round(pos)}%`;
  if (kind === 'page') return `p.${Math.round(pos)}`;
  const m = Math.floor(pos / 60);
  const s = Math.round(pos % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

