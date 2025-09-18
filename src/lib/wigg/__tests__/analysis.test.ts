import { describe, it, expect } from 'vitest';
import { resampleSegments, classifyPeak, estimateT2GFromCurve } from '../analysis';
import type { ProgressSegment } from '@/hooks/useTitleProgress';

describe('resampleSegments', () => {
  it('should return single bin for zero bins (clamped to minimum 1)', () => {
    const segments: ProgressSegment[] = [
      { startPct: 0, endPct: 50, userScore: 3 }
    ];
    const result = resampleSegments(segments, 0);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(3);
  });

  it('should resample segments into specified number of bins', () => {
    const segments: ProgressSegment[] = [
      { startPct: 0, endPct: 50, userScore: 3 },
      { startPct: 50, endPct: 100, userScore: 4 }
    ];
    const result = resampleSegments(segments, 4);
    expect(result).toHaveLength(4);
    // First two bins should be ~3, last two should be ~4
    expect(result[0]).toBe(3);
    expect(result[1]).toBe(3);
    expect(result[2]).toBe(4);
    expect(result[3]).toBe(4);
  });
});

describe('classifyPeak', () => {
  it('should return "Unknown pacing" for very short series', () => {
    const result = classifyPeak([1]);
    expect(result.label).toBe('Unknown pacing');
    expect(result.globalMaxPct).toBe(50);
  });

  it('should detect "Strong start" pattern', () => {
    // High early scores, declining later
    const series = [4, 4, 3.5, 3, 2.5, 2, 2, 2];
    const result = classifyPeak(series);
    expect(result.label).toBe('Strong start');
    expect(result.globalMaxPct).toBeLessThan(50); // Peak early
  });

  it('should detect "Peak late" pattern', () => {
    // Low early scores, high later
    const series = [2, 2, 2.5, 3, 3.5, 4, 4, 4];
    const result = classifyPeak(series);
    expect(result.label).toBe('Peak late');
    expect(result.globalMaxPct).toBeGreaterThan(50); // Peak late
  });
});

describe('estimateT2GFromCurve', () => {
  it('should return null for empty series', () => {
    expect(estimateT2GFromCurve([])).toBeNull();
  });

  it('should detect time to good when series crosses threshold', () => {
    // Series starts low, then crosses threshold (2.0) at 40%
    const series = [1, 1.5, 2.5, 3, 3.5, 4];
    const result = estimateT2GFromCurve(series, 2.0);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(100);
  });
});