import type { ProgressSegment } from '@/hooks/useTitleProgress';
import type { WiggEntry } from '@/hooks/useUserWiggs';

export type PeakLabel = 'Peak late' | 'Peak mid' | 'Strong start' | 'Even pacing' | 'Unknown pacing';

export interface PeakClassification {
  label: PeakLabel;
  globalMaxPct: number; // 0..100 where the max occurs
  earlyAvg?: number;
  lateAvg?: number;
}

export interface T2GPickResult {
  pct: number; // 0..100
  source: 'personal' | 'community' | 'curve' | 'default';
  confidence: number; // 0..1 heuristic
}

// Choose the best available score for a segment
function segmentScore(seg: ProgressSegment, scope: 'auto' | 'user' | 'mean' = 'auto'): number | null {
  if (scope === 'user') return typeof seg.userScore === 'number' ? seg.userScore! : null;
  if (scope === 'mean') return typeof seg.meanScore === 'number' ? seg.meanScore! : null;
  return typeof seg.userScore === 'number' ? seg.userScore! : (typeof seg.meanScore === 'number' ? seg.meanScore! : null);
}

export function resampleSegments(
  segments: ProgressSegment[],
  bins: number,
  scope: 'auto' | 'user' | 'mean' = 'auto',
  fallbackValue = 2
): number[] {
  const n = Math.max(1, Math.floor(bins));
  const out: (number | null)[] = new Array(n).fill(null);
  for (let i = 0; i < n; i++) {
    const binStart = (i / n) * 100;
    const binEnd = ((i + 1) / n) * 100;
    let weightSum = 0;
    let valueSum = 0;
    for (const seg of segments) {
      const v = segmentScore(seg, scope);
      if (v == null) continue;
      const overlap = Math.max(0, Math.min(binEnd, seg.endPct) - Math.max(binStart, seg.startPct));
      if (overlap > 0) {
        weightSum += overlap;
        valueSum += v * overlap;
      }
    }
    if (weightSum > 0) out[i] = valueSum / weightSum;
  }
  // Fill gaps by linear interpolation, then fallback
  // forward fill indices with null between known points
  let lastIdx = -1;
  for (let i = 0; i < n; i++) {
    if (out[i] == null) continue;
    if (lastIdx >= 0 && lastIdx < i - 1) {
      const a = out[lastIdx]!;
      const b = out[i]!;
      const span = i - lastIdx;
      for (let k = lastIdx + 1; k < i; k++) {
        const t = (k - lastIdx) / span;
        out[k] = a + (b - a) * t;
      }
    }
    lastIdx = i;
  }
  // If still leading/trailing nulls, set to fallbackValue
  for (let i = 0; i < n; i++) if (out[i] == null) out[i] = fallbackValue;
  return out as number[];
}

export function smooth(series: number[], window: number): number[] {
  const n = series.length;
  const w = Math.max(1, Math.floor(window));
  const half = Math.floor(w / 2);
  const out = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    let sum = 0;
    let count = 0;
    for (let k = i - half; k <= i + half; k++) {
      if (k >= 0 && k < n) {
        sum += series[k];
        count++;
      }
    }
    out[i] = count > 0 ? sum / count : series[i];
  }
  return out;
}

export function classifyPeak(series: number[]): PeakClassification {
  const n = series.length;
  if (n < 3) return { label: 'Unknown pacing', globalMaxPct: 50 };
  // Choose smoothing window about 8% of series length
  const w = Math.max(2, Math.round(n * 0.08));
  const s = smooth(series, w);
  const third = Math.max(1, Math.floor(n / 3));
  const mean = (arr: number[]) => (arr.reduce((a, b) => a + b, 0) / Math.max(1, arr.length));
  const earlyAvg = mean(s.slice(0, third));
  const lateAvg = mean(s.slice(n - third));
  // global max
  let maxIdx = 0;
  for (let i = 1; i < n; i++) if (s[i] > s[maxIdx]) maxIdx = i;
  const globalMaxPct = (maxIdx / Math.max(1, n - 1)) * 100;
  const delta = 0.5; // meaningful difference on 0..4
  const epsilon = 0.3; // near-even threshold
  if (Math.abs(lateAvg - earlyAvg) < epsilon) {
    // If the curve is roughly even overall, check location of global max
    if (globalMaxPct >= 33 && globalMaxPct <= 66) {
      return { label: 'Peak mid', globalMaxPct, earlyAvg, lateAvg };
    }
    return { label: 'Even pacing', globalMaxPct, earlyAvg, lateAvg };
  }
  if (lateAvg > earlyAvg + delta || globalMaxPct >= 66) {
    return { label: 'Peak late', globalMaxPct, earlyAvg, lateAvg };
  }
  return { label: 'Strong start', globalMaxPct, earlyAvg, lateAvg };
}

export function estimateT2GFromCurve(
  series: number[],
  threshold = 2.0,
  sustainBins = 2
): number | null {
  const n = series.length;
  if (n === 0) return null;
  const w = Math.max(2, Math.round(n * 0.06));
  const s = smooth(series, w);
  for (let i = 0; i < n; i++) {
    let ok = s[i] >= threshold;
    for (let j = 1; j < sustainBins && i + j < n; j++) {
      ok = ok && s[i + j] >= threshold;
      if (!ok) break;
    }
    if (ok) return (i / Math.max(1, n - 1)) * 100;
  }
  return null;
}

export function firstGoodFromWiggs(entries: WiggEntry[], minRating = 1): number | null {
  const eligible = entries
    .filter((e) => (e.rating ?? 0) >= minRating)
    .sort((a, b) => a.pct - b.pct);
  return eligible.length ? eligible[0].pct : null;
}

export function pickT2G(
  personal: number | null,
  community: number | null
): T2GPickResult {
  if (personal != null) return { pct: personal, source: 'personal', confidence: 0.9 };
  if (community != null) return { pct: community, source: 'community', confidence: 0.7 };
  return { pct: 35, source: 'default', confidence: 0.3 };
}

export function classifyPeakFromSegments(segments: ProgressSegment[]): PeakClassification {
  if (!segments?.length) return { label: 'Unknown pacing', globalMaxPct: 50 };
  const series = resampleSegments(segments, 24, 'auto', 2);
  return classifyPeak(series);
}

export function estimateT2GFromSegments(segments: ProgressSegment[], threshold = 2.0): number | null {
  if (!segments?.length) return null;
  const series = resampleSegments(segments, 24, 'auto', 2);
  return estimateT2GFromCurve(series, threshold, 2);
}
