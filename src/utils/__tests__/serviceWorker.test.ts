import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Service Worker Registration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock navigator.serviceWorker
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        register: vi.fn(),
        ready: Promise.resolve({}),
      },
      writable: true,
    });
  });

  it('should detect service worker support', () => {
    const isSupported = 'serviceWorker' in navigator;
    expect(isSupported).toBe(true);
  });
});