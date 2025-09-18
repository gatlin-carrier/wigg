import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Analytics Worker', () => {
  let mockWorker: any;
  
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create mock worker instance
    mockWorker = new (global as any).Worker('test-url');
  });
  
  it('should load analytics worker successfully', () => {
    expect(() => {
      new Worker(new URL('../analytics.worker.ts', import.meta.url), {
        type: 'module'
      });
    }).not.toThrow();
  });

  it('should process analytics events', async () => {
    const worker = new Worker(new URL('../analytics.worker.ts', import.meta.url), {
      type: 'module'
    });

    const messagePromise = new Promise((resolve) => {
      worker.onmessage = (event) => {
        resolve(event.data);
      };
    });

    const testEvent = {
      id: 'test-1',
      type: 'track',
      payload: {
        type: 'pageview',
        data: { page: '/dashboard' },
        timestamp: Date.now()
      }
    };

    worker.postMessage(testEvent);

    const response = await messagePromise;
    expect(response).toEqual({ id: 'test-1', status: 'processed' });

    worker.terminate();
  });
});