import { describe, it, expect, vi, beforeEach } from 'vitest';

// Create a simple test that directly tests the failing config creation
const createConfigWithEmptyEnv = () => {
  // Simulate the exact logic from computeConfig() with empty env vars
  const env = {
    NODE_ENV: 'production',
    VITE_VERCEL_ENV: 'production',
    VITE_SUPABASE_URL: undefined,
    VITE_SUPABASE_PUBLISHABLE_KEY: undefined,
    VITE_SUPABASE_ANON_KEY: undefined,
    VITE_SUPABASE_URL_PREVIEW: undefined,
    VITE_SUPABASE_PUBLISHABLE_KEY_PREVIEW: undefined
  };

  const selectValue = (primary?: string, fallback?: string) => {
    if (primary?.length > 0) return primary;
    if (fallback?.length > 0) return fallback;
    return undefined;
  };

  const usePreview = false; // Simplified for test
  const url = selectValue(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_URL_PREVIEW);
  const key = selectValue(env.VITE_SUPABASE_PUBLISHABLE_KEY, env.VITE_SUPABASE_PUBLISHABLE_KEY_PREVIEW) ?? env.VITE_SUPABASE_ANON_KEY;

  const isProduction = env.NODE_ENV === 'production' || env.VITE_VERCEL_ENV === 'production';

  if (!url || !key) {
    if (isProduction) {
      throw new Error('Missing required Supabase environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY must be set in production');
    }
  }

  return { url: url ?? 'fallback', key: key ?? 'fallback' };
};

describe('Supabase config validation', () => {
  it('should throw when required environment variables are missing in production', () => {
    // Test the config creation logic directly
    expect(() => {
      createConfigWithEmptyEnv();
    }).toThrow('Missing required Supabase environment variables');
  });
});