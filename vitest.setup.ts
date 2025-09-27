import '@testing-library/jest-dom/vitest';
import { vi, beforeAll, afterEach, afterAll } from 'vitest';
import { server } from './src/data/mocks/setup';

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
  VITE_SUPABASE_URL_PREVIEW: 'https://preview.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY_PREVIEW: 'sb_preview_key',
  VITE_SUPABASE_ANON_KEY: 'sb_publishable_test_key',
});

vi.stubEnv('MODE', 'test');
vi.stubEnv('NODE_ENV', 'test');
vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_test_key');
vi.stubEnv('VITE_SUPABASE_URL_PREVIEW', 'https://preview.supabase.co');
vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY_PREVIEW', 'sb_preview_key');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'sb_publishable_test_key');

const meta = (import.meta as unknown as { env?: Record<string, string> });
meta.env = {
  VITE_SUPABASE_URL: 'https://test.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test_key',
  VITE_SUPABASE_URL_PREVIEW: 'https://preview.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY_PREVIEW: 'sb_preview_key',
  VITE_SUPABASE_ANON_KEY: 'sb_publishable_test_key',
};

vi.stubGlobal('import', {
  meta: {
    env: {
      VITE_SUPABASE_URL: 'https://test.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test_key',
      VITE_SUPABASE_URL_PREVIEW: 'https://preview.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY_PREVIEW: 'sb_preview_key',
      VITE_SUPABASE_ANON_KEY: 'sb_publishable_test_key',
    }
  }
});

// Mock matchMedia for mobile hook
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Set up MSW server for integration tests
beforeAll(() => {
  server.listen();
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

