import { describe, it, expect } from 'vitest';
import { computeBins, pickPrimaryIndex, clamp } from '../curve';
import type { WiggPoint } from '../types';

describe('computeBins', () => {
  it('normalizes values so max is 1', () => {
    const points: WiggPoint[] = [
      { pos: 10, weight: 1 },
      { pos: 20, weight: 1 },
    ];
    const { values } = computeBins(points, 60, 600);
    const peak = Math.max(...values);
    expect(peak).toBeCloseTo(1, 5);
  });

  it('overlap raises density between two points above far-away regions', () => {
    const points: WiggPoint[] = [
      { pos: 10, weight: 1 },
      { pos: 20, weight: 1 },
    ];
    const duration = 40;
    const width = 72; // -> ~12 bins, h ~ 6.67 (> 5), overlap present
    const { centers, values } = computeBins(points, duration, width, 10, 400);
    const midIdx = centers.reduce((best, c, i) => Math.abs(c - 15) < Math.abs(centers[best] - 15) ? i : best, 0);
    const edgeIdx = centers.reduce((best, c, i) => Math.abs(c - 0) < Math.abs(centers[best] - 0) ? i : best, 0);
    const farIdx = centers.reduce((best, c, i) => Math.abs(c - 30) < Math.abs(centers[best] - 30) ? i : best, 0);
    expect(values[midIdx]).toBeGreaterThan(values[edgeIdx]);
    expect(values[midIdx]).toBeGreaterThan(values[farIdx]);
  });
});

describe('pickPrimaryIndex', () => {
  it('returns index of maximum value', () => {
    const idx = pickPrimaryIndex([0.1, 0.9, 0.2, 0.9]);
    expect(idx).toBe(1); // first max
  });
});

describe('sensitivity down-weight (simulated)', () => {
  it('reduces local peak by ~60% (to 0.4x) when muted', () => {
    // Reference cluster at 0 strong enough to be global max in both runs
    const ref: WiggPoint[] = [
      { pos: 0 }, { pos: 0.1 }, { pos: -0.1 }, // tight cluster near 0
    ];
    const target: WiggPoint = { pos: 10, weight: 1 };
    const targetMuted: WiggPoint = { pos: 10, weight: 0.4 };

    const duration = 40; const width = 600;
    const a = computeBins([...ref, target], duration, width);
    const b = computeBins([...ref, targetMuted], duration, width);

    // Find nearest bin to target position
    const nearestIndex = a.centers.reduce((best, c, i) => {
      const d = Math.abs(c - target.pos);
      return d < Math.abs(a.centers[best] - target.pos) ? i : best;
    }, 0);

    const aVal = a.values[nearestIndex];
    const bVal = b.values[nearestIndex];

    // Expect bVal to be about 0.4x of aVal, allow tolerance due to smoothing/normalization
    expect(bVal / aVal).toBeGreaterThan(0.35);
    expect(bVal / aVal).toBeLessThan(0.45);
  });
});

describe('clamp', () => {
  it('clamps values to range', () => {
    expect(clamp(-10, 0, 100)).toBe(0);
    expect(clamp(50, 0, 100)).toBe(50);
    expect(clamp(120, 0, 100)).toBe(100);
  });
});
