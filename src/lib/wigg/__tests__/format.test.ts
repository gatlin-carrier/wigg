import { describe, it, expect } from 'vitest';
import { formatT2G } from '../format';

describe('formatT2G', () => {
  it('should return empty string for null/undefined percentage', () => {
    expect(formatT2G(null)).toBe('');
    expect(formatT2G(undefined)).toBe('');
  });

  it('should return just percentage when no runtime or mediaType provided', () => {
    expect(formatT2G(35)).toBe('35%');
    expect(formatT2G(67.8)).toBe('68%');
  });

  it('should format book/manga with page numbers', () => {
    expect(formatT2G(25, 400, 'book')).toBe('25% (~page 100)');
    expect(formatT2G(50, 200, 'manga')).toBe('50% (~page 100)');
  });

  it('should format movie/TV with time duration', () => {
    expect(formatT2G(25, 120, 'movie')).toBe('25% (~30m)');
    expect(formatT2G(50, 180, 'tv')).toBe('50% (~1h 30m)');
    expect(formatT2G(10, 60, 'movie')).toBe('10% (~6m)');
  });

  it('should format game duration with heuristic for hours vs minutes', () => {
    // Low runtime (< 200) treated as hours and converted to minutes
    expect(formatT2G(50, 20, 'game')).toBe('50% (~10h)'); // 20 hours * 60 = 1200 min, 50% = 600 min = 10h
    // High runtime (>= 200) treated as minutes
    expect(formatT2G(25, 400, 'game')).toBe('25% (~1h 40m)'); // 400 min, 25% = 100 min = 1h 40m
  });
});