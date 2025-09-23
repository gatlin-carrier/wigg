import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock environment variables
const mockEnv = {
  VITE_SUPABASE_URL: 'https://prod.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'prod-key',
  VITE_SUPABASE_URL_PREVIEW: 'https://preview.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY_PREVIEW: 'preview-key',
  DEV: true
};

// Mock import.meta.env
vi.mock('import.meta', () => ({
  env: mockEnv
}));

// Mock @supabase/supabase-js
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ auth: { storage: {} } }))
}));

describe('Supabase Client Environment Detection', () => {
  let originalLocation: Location;

  beforeEach(() => {
    // Save original location
    originalLocation = window.location;
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original location
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true
    });
  });

  const mockLocation = (hostname: string) => {
    delete (window as any).location;
    window.location = { ...originalLocation, hostname } as Location;
  };

  it('should use preview environment for vercel.app domains', async () => {
    mockLocation('my-app-preview-123.vercel.app');

    // Clear module cache to force re-evaluation
    vi.doUnmock('C:/Users/gatli/Projects/wigg/src/integrations/supabase/client.ts');

    // Import the client module
    const { supabase } = await import('../client');
    const { createClient } = await import('@supabase/supabase-js');

    expect(createClient).toHaveBeenCalledWith(
      'https://preview.supabase.co',
      'preview-key',
      expect.any(Object)
    );
  });
});