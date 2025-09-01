import type { EntityCard, ResolvedSearch, SearchDecision, MediaType } from './types';
import type { NormalizedResult } from './providers';
import { normalizeQuery } from './planning';

// Improved fuzzy string matching
export function fuzzyMatch(a: string, b: string): number {
  const s1 = a.toLowerCase().trim();
  const s2 = b.toLowerCase().trim();
  
  if (s1 === s2) return s1.length === 0 ? 0.0 : 1.0; // Handle empty strings
  if (s1.length === 0 || s2.length === 0) return 0.0;
  
  // Check if one string contains the other
  if (s1.includes(s2) || s2.includes(s1)) {
    return Math.max(s2.length / s1.length, s1.length / s2.length) * 0.9;
  }
  
  // Simple Levenshtein-based similarity
  const maxLen = Math.max(s1.length, s2.length);
  const distance = levenshteinDistance(s1, s2);
  const similarity = (maxLen - distance) / maxLen;
  
  // Bonus for word overlap
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  const wordOverlap = words1.filter(w => words2.includes(w)).length;
  const wordBonus = wordOverlap / Math.max(words1.length, words2.length) * 0.2;
  
  return Math.min(1.0, similarity + wordBonus);
}

// Simple Levenshtein distance implementation
function levenshteinDistance(a: string, b: string): number {
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
  
  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  
  return matrix[b.length][a.length];
}

// Normalize titles for comparison
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(word => !['the', 'a', 'an', 'and', 'or', 'of', 'in', 'on', 'at', 'to', 'for', 'with', 'by'].includes(word))
    .join(' ');
}

// Score individual results against the query
export function scoreResult(
  result: NormalizedResult, 
  query: string, 
  predictedType: MediaType,
  genreMap?: Record<number, string>
): number {
  const normalizedQuery = normalizeTitle(query);
  const normalizedTitle = normalizeTitle(result.title);
  
  // 1. Title matching (55% weight)
  const titleMatch = normalizedQuery === normalizedTitle ? 1.0 : 
    fuzzyMatch(normalizedQuery, normalizedTitle);
  
  // 2. Type prior match (15% weight)
  const typeMatch = result.type === predictedType ? 1.0 : 
    getTypeSimilarity(result.type, predictedType);
  
  // 3. Popularity normalization (15% weight)
  const popularityScore = Math.min((result.popularity || 0) / 1000, 1.0);
  
  // 4. Year reasonableness (10% weight)
  const currentYear = new Date().getFullYear();
  const yearScore = result.year ? 
    Math.max(0, 1 - Math.abs(currentYear - result.year) / 50) : 0.5;
  
  // 5. Creator overlap (5% weight) - simplified for now
  const creatorScore = result.creators?.length ? 0.5 : 0.0;
  
  // Penalties
  let penalties = 0;
  
  // Low rating penalty
  if (result.rating !== undefined && result.rating < 3.0) penalties += 0.1;
  
  // Very old content penalty for modern queries
  if (result.year && result.year < 1980 && !query.includes(result.year.toString())) {
    penalties += 0.05;
  }
  
  // Adult content penalty if not explicitly searched
  if (result.genres?.some(g => typeof g === 'string' && g.toLowerCase().includes('adult'))) {
    penalties += 0.2;
  }
  
  const baseScore = 
    0.55 * titleMatch +
    0.15 * typeMatch +
    0.15 * popularityScore +
    0.10 * yearScore +
    0.05 * creatorScore;
  
  return Math.max(0, baseScore - penalties);
}

// Get similarity between media types
function getTypeSimilarity(actual: MediaType, expected: MediaType): number {
  const similarities: Record<MediaType, Record<MediaType, number>> = {
    tv: { tv: 1.0, anime: 0.8, movie: 0.6, book: 0.3, podcast: 0.4, video: 0.5, game: 0.2, manga: 0.2 },
    movie: { movie: 1.0, tv: 0.6, anime: 0.7, book: 0.4, podcast: 0.2, video: 0.8, game: 0.3, manga: 0.1 },
    anime: { anime: 1.0, tv: 0.8, movie: 0.7, manga: 0.9, book: 0.2, podcast: 0.1, video: 0.6, game: 0.4 },
    manga: { manga: 1.0, anime: 0.9, book: 0.6, tv: 0.2, movie: 0.1, podcast: 0.1, video: 0.2, game: 0.3 },
    book: { book: 1.0, manga: 0.6, tv: 0.3, movie: 0.4, anime: 0.2, podcast: 0.5, video: 0.2, game: 0.3 },
    podcast: { podcast: 1.0, tv: 0.4, book: 0.5, video: 0.6, movie: 0.2, anime: 0.1, manga: 0.1, game: 0.1 },
    video: { video: 1.0, movie: 0.8, podcast: 0.6, tv: 0.5, anime: 0.6, book: 0.2, manga: 0.2, game: 0.4 },
    game: { game: 1.0, anime: 0.4, movie: 0.3, tv: 0.2, video: 0.4, book: 0.3, manga: 0.3, podcast: 0.1 },
  };
  
  return similarities[actual]?.[expected] || 0.1;
}

// Resolve search results to entities
export function resolveSearch(
  results: NormalizedResult[],
  query: string,
  predictedType: MediaType,
  userProfile?: { last_vertical?: MediaType }
): ResolvedSearch {
  if (results.length === 0) {
    return {
      decision: {
        mode: 'disambiguate',
        confidence: 0.0,
        why: ['No results found'],
      },
      primary: createEmptyEntityCard(query, predictedType),
      alternatives: [],
    };
  }
  
  // Score and sort all results
  const scored = results
    .map(result => ({
      ...result,
      score: scoreResult(result, query, predictedType),
    }))
    .sort((a, b) => b.score - a.score);
  
  const top = scored[0];
  const alternatives = scored.slice(1, 4).filter(r => r.score > 0.3);
  
  // Determine decision mode based on confidence thresholds
  let decision: SearchDecision;
  
  if (top.score >= 0.90) {
    decision = {
      mode: 'auto_select',
      confidence: top.score,
      why: buildWhyExplanation(top, query, predictedType),
    };
  } else if (top.score >= 0.60) {
    decision = {
      mode: 'disambiguate',
      confidence: top.score,
      why: buildWhyExplanation(top, query, predictedType, true),
    };
  } else {
    decision = {
      mode: 'disambiguate',
      confidence: top.score,
      why: ['Low confidence matches', 'Consider refining search'],
    };
  }
  
  return {
    decision,
    primary: resultToEntityCard(top),
    alternatives: alternatives.map(resultToEntityCard),
  };
}

// Build explanation for decision
function buildWhyExplanation(
  result: NormalizedResult & { score: number },
  query: string,
  predictedType: MediaType,
  isAmbiguous = false
): string[] {
  const reasons: string[] = [];
  
  const titleMatch = fuzzyMatch(normalizeTitle(query), normalizeTitle(result.title));
  
  if (titleMatch > 0.95) reasons.push('Exact title match');
  else if (titleMatch > 0.8) reasons.push('Close title match');
  
  if (result.type === predictedType) reasons.push(`${predictedType.toUpperCase()} prior match`);
  
  if (result.popularity && result.popularity > 500) reasons.push('High popularity');
  
  if (result.rating && result.rating > 7.5) reasons.push('High rating');
  
  if (isAmbiguous) reasons.push('Multiple good matches');
  
  if (reasons.length === 0) reasons.push('Best available match');
  
  return reasons;
}

// Convert normalized result to entity card
function resultToEntityCard(result: NormalizedResult & { score?: number }): EntityCard {
  // Extract provider information
  const providers: Record<string, { id: string | number } | null> = {};
  
  if (result.provider_data.tmdb) {
    providers.tmdb = { id: result.provider_data.tmdb.id };
  }
  if (result.provider_data.openlibrary) {
    providers.openlibrary = { id: result.provider_data.openlibrary.key };
  }
  
  return {
    title_id: result.id,
    display_title: result.title,
    type: result.type,
    year_start: result.year,
    confidence: result.score,
    providers,
  };
}

// Create empty entity card for no results
function createEmptyEntityCard(query: string, type: MediaType): EntityCard {
  return {
    title_id: `empty:${type}:${Date.now()}`,
    display_title: query,
    type,
    providers: {},
  };
}

// Deduplicate results from different providers
export function deduplicateResults(results: NormalizedResult[]): NormalizedResult[] {
  const seen = new Set<string>();
  const deduped: NormalizedResult[] = [];
  
  for (const result of results) {
    const key = `${normalizeTitle(result.title)}-${result.type}-${result.year || 'unknown'}`;
    
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(result);
    } else {
      // Merge provider data from duplicates
      const existing = deduped.find(r => 
        normalizeTitle(r.title) === normalizeTitle(result.title) &&
        r.type === result.type &&
        r.year === result.year
      );
      
      if (existing) {
        existing.provider_data = { ...existing.provider_data, ...result.provider_data };
      }
    }
  }
  
  return deduped;
}