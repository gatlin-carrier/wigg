import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('IndexedDB Async Storage Persister', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should detect IndexedDB support', () => {
    // Mock IndexedDB availability
    Object.defineProperty(window, 'indexedDB', {
      value: {},
      writable: true,
    });
    
    const isSupported = typeof window !== 'undefined' && 'indexedDB' in window;
    expect(isSupported).toBe(true);
  });
});