import { describe, it, expect } from 'vitest';
import { detectPodcastIntent } from '../client';

describe('detectPodcastIntent', () => {
  it('should detect podcast-related queries', () => {
    expect(detectPodcastIntent('podcast')).toBe(true);
    expect(detectPodcastIntent('My favorite podcast')).toBe(true);
    expect(detectPodcastIntent('PODCAST')).toBe(true); // Case insensitive
  });

  it('should detect iTunes/Apple Podcasts URLs', () => {
    expect(detectPodcastIntent('itunes.apple.com/us/podcast/example/id123456')).toBe(true);
    expect(detectPodcastIntent('podcasts.apple.com/us/id123456')).toBe(true);
  });

  it('should detect RSS feeds and episode references', () => {
    expect(detectPodcastIntent('http://example.com/feed.rss')).toBe(true);
    expect(detectPodcastIntent('podcast feed.xml')).toBe(true);
    expect(detectPodcastIntent('episode #42')).toBe(true);
    expect(detectPodcastIntent('episode 15')).toBe(true);
  });

  it('should return false for non-podcast queries', () => {
    expect(detectPodcastIntent('movie')).toBe(false);
    expect(detectPodcastIntent('book review')).toBe(false);
    expect(detectPodcastIntent('')).toBe(false);
  });
});