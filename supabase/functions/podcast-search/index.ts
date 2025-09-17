import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

import type { ExecutionContext, PodcastSearchInput, PodcastSearchResult } from './types.ts';
import { planPodcastQuery } from './planner.ts';
import { executePlans } from './executor.ts';
import { resolvePodcast } from './resolver.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function readPIAuthFromEnv() {
  const apiKey = Deno.env.get('PI_API_KEY');
  const apiSecret = Deno.env.get('PI_API_SECRET');
  const userAgent = Deno.env.get('PODCAST_USER_AGENT') ?? 'WIGG/PodcastSearch (+https://wigg.app)';
  if (!apiKey || !apiSecret) return undefined;
  return { apiKey, apiSecret, userAgent } as const;
}

async function runPodcastSearch(input: PodcastSearchInput, ctx?: ExecutionContext): Promise<PodcastSearchResult> {
  const { plans, flags } = planPodcastQuery(input);
  const raw = await executePlans(plans, ctx, { needEpisodes: flags.needEpisodes });
  const resolved = resolvePodcast(input.user_query, raw, plans);

  const providers_called = Object.keys(raw.raw);
  const tms_per_provider: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw.raw)) tms_per_provider[k] = v.t_ms;
  const episodes = resolved.episodes || [];

  return {
    resolved,
    telemetry: {
      providers_called,
      tms_per_provider,
      decision_mode: resolved.decision.mode,
      confidence: resolved.decision.confidence,
      episodes_fetched: episodes.length,
      episodes_with_chapters: episodes.filter(e => !!e.chapters).length,
      episodes_with_transcripts: episodes.filter(e => !!e.transcript).length,
      spotify_enrichment_applied: providers_called.some(k => k.startsWith('spotify:')),
    },
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const payload = await req.json();
    const input: PodcastSearchInput = {
      user_query: String(payload?.user_query || ''),
      locale: String(payload?.locale || 'en-US'),
      market: String(payload?.market || 'US'),
      user_profile: payload?.user_profile || undefined,
      cost_budget: payload?.cost_budget || { max_providers: 3, allow_fallbacks: true },
    };
    if (!input.user_query.trim()) throw new Error('user_query is required');

    const ctx: ExecutionContext = {
      podcastIndex: readPIAuthFromEnv(),
      spotifyAccessToken: payload?.spotify_access_token || undefined,
    };

    const result = await runPodcastSearch(input, ctx);
    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

