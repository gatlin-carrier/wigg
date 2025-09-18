import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock ResizeObserver for Recharts components
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock Web Worker for analytics worker tests
class MockWorker {
  constructor(public url: string, public options?: WorkerOptions) {}
  
  postMessage = vi.fn();
  terminate = vi.fn();
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  dispatchEvent = vi.fn();
  
  // Simulate worker message handling
  simulateMessage(data: any) {
    const event = { data, type: 'message' };
    const messageHandler = this.addEventListener.mock.calls
      .find(([type]) => type === 'message')?.[1];
    if (messageHandler) messageHandler(event);
  }
  
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  onmessageerror: ((event: MessageEvent) => void) | null = null;
}

// @ts-expect-error - MockWorker is not a full Worker implementation
global.Worker = MockWorker;

// Mock environment variables for tests
vi.stubGlobal('import.meta.env', {
  VITE_SUPABASE_URL: 'https://test.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test_key',
});

