// Utility functions for normalizing heterogeneous rating scales to a 0–10 baseline
// Supported inputs:
// - Numbers on common scales (0–5, 0–10, 0–100)
// - Strings like "78%", "4/5", "7.8/10"
// - Optional source hints: tmdb, tmdb-movie, tmdb-tv, anilist, anilist-manga, game, openlibrary

export type RatingSource =
  | 'tmdb'
  | 'tmdb-movie'
  | 'tmdb-tv'
  | 'anilist'
  | 'anilist-manga'
  | 'game'
  | 'openlibrary'
  | (string & {});

export interface NormalizeRatingOptions {
  source?: RatingSource;
  min?: number; // default 0
  max?: number; // if provided, map linearly to 0–10
}

/**
 * Normalize various rating inputs to a 0–10 numeric value.
 * Returns undefined for null/NaN values.
 */
export function normalizeRatingTo10(value: unknown, opts: NormalizeRatingOptions = {}): number | undefined {
  if (value === null || value === undefined) return undefined;

  const src = opts.source?.toLowerCase();

  // Helper: clamp to [0,10]
  const clamp10 = (n: number) => Math.max(0, Math.min(10, n));

  // Parse string forms first (e.g., "78%", "4/5", "7.8/10")
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return undefined;

    // Percent form
    if (trimmed.endsWith('%')) {
      const pct = parseFloat(trimmed.replace('%', ''));
      if (isFinite(pct)) return clamp10(pct / 10);
      return undefined;
    }

    // Fraction form a/b
    const frac = trimmed.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
    if (frac) {
      const num = parseFloat(frac[1]);
      const den = parseFloat(frac[2]);
      if (isFinite(num) && isFinite(den) && den > 0) {
        return clamp10((num / den) * 10);
      }
      return undefined;
    }

    // Plain numeric string
    const f = parseFloat(trimmed);
    if (!isFinite(f)) return undefined;
    return clamp10(heuristicNormalize(f, src));
  }

  if (typeof value === 'number') {
    if (!isFinite(value)) return undefined;

    // Explicit [min,max] mapping when provided
    if (typeof opts.max === 'number') {
      const min = typeof opts.min === 'number' ? opts.min : 0;
      if (opts.max <= min) return undefined;
      const ratio = (value - min) / (opts.max - min);
      return clamp10(ratio * 10);
    }

    // Source-aware and heuristic mapping
    return clamp10(heuristicNormalize(value, src));
  }

  return undefined;
}

function heuristicNormalize(n: number, src?: string): number {
  // Known sources
  if (src) {
    if (src === 'tmdb' || src === 'tmdb-movie' || src === 'tmdb-tv') {
      // TMDB uses 0–10 (vote_average)
      return n;
    }
    if (src === 'anilist' || src === 'anilist-manga') {
      // AniList uses 0–100 (averageScore)
      return n > 10 ? n / 10 : n;
    }
    if (src === 'game') {
      // IGDB style ratings are typically 0–100
      return n > 10 ? n / 10 : n;
    }
    // openlibrary or other sources: fall through to heuristics
  }

  // Heuristics when scale unknown
  if (n === 0) return 0;
  if (n <= 1) return n * 10;     // 0–1
  if (n <= 5) return n * 2;      // 0–5
  if (n <= 10) return n;         // 0–10
  return n / 10;                 // assume 0–100
}

/**
 * Format a 0–10 rating, trimming trailing .0 while keeping one decimal when needed.
 * Example: 10 -> "10", 7.5 -> "7.5", 8.0 -> "8"
 */
export function formatRating10(n: number | undefined | null, decimals = 1): string | undefined {
  if (n === null || n === undefined || !isFinite(n)) return undefined;
  const p = Math.pow(10, decimals);
  const rounded = Math.round(n * p) / p;
  // Create string with fixed decimals then strip trailing .0 or .00, etc.
  const fixed = rounded.toFixed(decimals);
  return fixed.replace(/\.0+$/, '');
}
