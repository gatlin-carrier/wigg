import { describe, it, expect } from 'vitest';
import { normalizeWork, getCoverUrl } from '../client';
import type { OLWork } from '../types';

describe('getCoverUrl', () => {
  it('should return undefined for missing cover ID', () => {
    expect(getCoverUrl()).toBeUndefined();
    expect(getCoverUrl(undefined)).toBeUndefined();
  });

  it('should generate correct cover URLs with different sizes', () => {
    expect(getCoverUrl(123456, 'S')).toBe('https://covers.openlibrary.org/b/id/123456-S.jpg');
    expect(getCoverUrl(123456, 'M')).toBe('https://covers.openlibrary.org/b/id/123456-M.jpg');
    expect(getCoverUrl(123456, 'L')).toBe('https://covers.openlibrary.org/b/id/123456-L.jpg');
    expect(getCoverUrl(123456)).toBe('https://covers.openlibrary.org/b/id/123456-M.jpg'); // Default M
  });
});

describe('normalizeWork', () => {
  it('should normalize OpenLibrary work data correctly', () => {
    const olWork: OLWork = {
      key: '/works/OL123456W',
      title: 'The Great Gatsby',
      cover_i: 987654,
      first_publish_year: 1925,
      author_name: ['F. Scott Fitzgerald'],
      subject: ['Fiction', 'American Literature']
    };

    const result = normalizeWork(olWork);
    
    expect(result.id).toBe('/works/OL123456W');
    expect(result.title).toBe('The Great Gatsby');
    expect(result.cover_url).toBe('https://covers.openlibrary.org/b/id/987654-L.jpg');
    expect(result.author).toBe('F. Scott Fitzgerald');
    expect(result.year).toBe(1925);
    expect(result.genre).toBe('Fiction');
  });

  it('should handle missing fields gracefully in normalizeWork', () => {
    const sparseWork: OLWork = {
      key: '/works/OL999999W',
      title: 'Untitled Work'
    };

    const result = normalizeWork(sparseWork);
    
    expect(result.id).toBe('/works/OL999999W');
    expect(result.title).toBe('Untitled Work');
    expect(result.cover_url).toBeUndefined();
    expect(result.author).toBeUndefined();
    expect(result.year).toBeUndefined();
    expect(result.genre).toBeUndefined();
  });
});