import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const PI_BASE = 'https://api.podcastindex.org/api/1.0';

async function sha1Async(input: string): Promise<string> {
  const enc = new TextEncoder();
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error('WebCrypto unavailable');
  const digest = await subtle.digest('SHA-1', enc.encode(input));
  const bytes = new Uint8Array(digest);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function buildHeaders(): Promise<HeadersInit> {
  const apiKey = Deno.env.get('PI_API_KEY') || Deno.env.get('VITE_PI_API_KEY');
  const apiSecret = Deno.env.get('PI_API_SECRET') || Deno.env.get('VITE_PI_API_SECRET');
  const userAgent = Deno.env.get('PODCAST_USER_AGENT') || Deno.env.get('VITE_PODCAST_USER_AGENT') || 'WIGG/PodcastBrowse (+https://wigg.app)';
  if (!apiKey || !apiSecret) throw new Error('PodcastIndex API credentials not configured');
  const t = Math.floor(Date.now() / 1000);
  const auth = await sha1Async(`${apiKey}${apiSecret}${t}`);
  return {
    'X-Auth-Date': String(t),
    'X-Auth-Key': apiKey,
    'Authorization': auth,
    'User-Agent': userAgent,
  } as HeadersInit;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    let max = Math.min(parseInt(url.searchParams.get('max') || '24', 10) || 24, 50);
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        const bmax = parseInt(String(body?.max ?? ''), 10);
        if (!Number.isNaN(bmax)) max = Math.min(Math.max(bmax, 1), 50);
      } catch (_) {
        // ignore body parse errors
      }
    }
    const headers = await buildHeaders();
    const res = await fetch(`${PI_BASE}/podcasts/trending?max=${max}`, { headers });
    const text = await res.text();
    return new Response(text, { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
