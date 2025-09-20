import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { join } from 'path';

describe('Service Worker File', () => {
  it('should have a service worker file in the public directory', () => {
    const swPath = join(process.cwd(), 'public', 'sw.js');
    expect(existsSync(swPath)).toBe(true);
  });
});
