import { describe, it, expect } from 'vitest';
import { normalizeRatingTo10, formatRating10, type RatingSource } from '../ratings';

describe('normalizeRatingTo10', () => {
  it('should return undefined for null values', () => {
    expect(normalizeRatingTo10(null)).toBeUndefined();
  });

  it('should return undefined for undefined values', () => {
    expect(normalizeRatingTo10(undefined)).toBeUndefined();
  });

  it('should convert percentage strings correctly', () => {
    expect(normalizeRatingTo10('78%')).toBe(7.8);
    expect(normalizeRatingTo10('100%')).toBe(10);
    expect(normalizeRatingTo10('0%')).toBe(0);
  });

  it('should convert fraction strings correctly', () => {
    expect(normalizeRatingTo10('4/5')).toBe(8);
    expect(normalizeRatingTo10('3/5')).toBe(6);
    expect(normalizeRatingTo10('7/10')).toBe(7);
  });

  it('should detect and convert different numeric scales', () => {
    // 0-1 scale
    expect(normalizeRatingTo10(0.8)).toBe(8);
    // 0-5 scale  
    expect(normalizeRatingTo10(4)).toBe(8);
    // 0-10 scale
    expect(normalizeRatingTo10(7.5)).toBe(7.5);
    // 0-100 scale
    expect(normalizeRatingTo10(85)).toBe(8.5);
  });

  it('should handle TMDB source as 0-10 scale', () => {
    expect(normalizeRatingTo10(8.2, { source: 'tmdb' })).toBe(8.2);
    expect(normalizeRatingTo10(7.5, { source: 'tmdb-movie' })).toBe(7.5);
    expect(normalizeRatingTo10(9.1, { source: 'tmdb-tv' })).toBe(9.1);
  });

  it('should handle AniList source as 0-100 scale when > 10', () => {
    expect(normalizeRatingTo10(85, { source: 'anilist' })).toBe(8.5);
    expect(normalizeRatingTo10(92, { source: 'anilist-manga' })).toBe(9.2);
    // But should treat <= 10 as 0-10 scale
    expect(normalizeRatingTo10(7.5, { source: 'anilist' })).toBe(7.5);
  });
});

describe('formatRating10', () => {
  it('should return undefined for null and undefined values', () => {
    expect(formatRating10(null)).toBeUndefined();
    expect(formatRating10(undefined)).toBeUndefined();
  });

  it('should format integers without decimal places', () => {
    expect(formatRating10(8)).toBe('8');
    expect(formatRating10(10)).toBe('10');
    expect(formatRating10(0)).toBe('0');
  });

  it('should format decimals and strip trailing zeros', () => {
    expect(formatRating10(7.5)).toBe('7.5');
    expect(formatRating10(8.0)).toBe('8');
    expect(formatRating10(9.25)).toBe('9.3'); // Rounded to 1 decimal
  });
});