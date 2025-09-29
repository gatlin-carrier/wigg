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
  ) ?? DEFAULT_SUPABASE_URL;

  const key = selectValue(
    usePreview ? previewKey : standardKey,
    usePreview ? standardKey : previewKey
  ) ?? anonKey ?? DEFAULT_SUPABASE_ANON_KEY;

  const source: SupabaseConfig['source'] = url === DEFAULT_SUPABASE_URL || key === DEFAULT_SUPABASE_ANON_KEY
    ? 'fallback'
    : usePreview && previewUrl
      ? 'preview'
      : 'standard';

  return {
    url,
    anonKey: key,
    isPreview: source === 'preview',
    source,
  };
};

export const supabaseConfig: SupabaseConfig = computeConfig();

export type { SupabaseConfig };
