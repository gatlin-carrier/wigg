import { describe, it, expect } from 'vitest';

describe('Service Worker File', () => {
  it('should have a service worker file available', async () => {
    // This test will fail if sw.js doesn't exist
    const response = await fetch('/sw.js');
    expect(response.status).toBe(200);
  });
});