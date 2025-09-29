interface SupabaseConfig {
  url: string;
  anonKey: string;
  isPreview: boolean;
  source: 'preview' | 'standard' | 'fallback';
}

const DEFAULT_SUPABASE_URL = 'https://test.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_test_anon_key';

// Use import.meta.env directly as the environment source
const env = import.meta.env as Record<string, string | boolean | undefined>;
export const resolvedSupabaseEnv = env;

const normalizeFlag = (value: string | boolean | undefined) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return false;
};

const isPreviewHostname = () => {
  if (normalizeFlag(env.VITE_SUPABASE_FORCE_PREVIEW)) {
    return true;
  }

  const vercelEnv = (env.VITE_VERCEL_ENV || env.VERCEL_ENV) as string | undefined;
  if (vercelEnv && vercelEnv.toLowerCase() === 'preview') {
    return true;
  }

  if (typeof window === 'undefined') {
    return false;
  }

  const hostname = window.location.hostname || '';
  if (!hostname) return false;

  return hostname.includes('.vercel.app') || hostname.startsWith('preview-');
};

const selectValue = (primary?: string, fallback?: string) => {
  if (primary?.length > 0) return primary;
  if (fallback?.length > 0) return fallback;
  return undefined;
};

const computeConfig = (): SupabaseConfig => {
  const usePreview = isPreviewHostname();

  const previewUrl = env.VITE_SUPABASE_URL_PREVIEW as string | undefined;
  const standardUrl = env.VITE_SUPABASE_URL as string | undefined;
  const previewKey = env.VITE_SUPABASE_PUBLISHABLE_KEY_PREVIEW as string | undefined;
  const standardKey = env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
  const anonKey = env.VITE_SUPABASE_ANON_KEY as string | undefined;

  const url = selectValue(
    usePreview ? previewUrl : standardUrl,
    usePreview ? standardUrl : previewUrl
  );

  const key = selectValue(
    usePreview ? previewKey : standardKey,
    usePreview ? standardKey : previewKey
  ) ?? anonKey;

  // Validation: Fail fast when required env vars are missing in production
  const isProduction = env.NODE_ENV === 'production' || env.VITE_VERCEL_ENV === 'production';
  const isTestEnv = env.NODE_ENV === 'test';

  if (!url || !key) {
    if (isProduction) {
      throw new Error('Missing required Supabase environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY must be set in production');
    }
    if (!isTestEnv) {
      console.warn('Missing Supabase environment variables, falling back to test defaults. This should only happen in development.');
    }
  }

  const finalUrl = url ?? DEFAULT_SUPABASE_URL;
  const finalKey = key ?? DEFAULT_SUPABASE_ANON_KEY;

  const source: SupabaseConfig['source'] = finalUrl === DEFAULT_SUPABASE_URL || finalKey === DEFAULT_SUPABASE_ANON_KEY
    ? 'fallback'
    : usePreview && previewUrl
      ? 'preview'
      : 'standard';

  return {
    url: finalUrl,
    anonKey: finalKey,
    isPreview: source === 'preview',
    source,
  };
};

export const supabaseConfig: SupabaseConfig = computeConfig();

export type { SupabaseConfig };
