import type { ExecutionContext, PodcastSearchInput, ResolvedPodcast } from './types';
import { planPodcastQuery } from './planner';
import { executePlans } from './executor';
import { resolvePodcast } from './resolver';

export interface PodcastSearchTelemetry {
  providers_called: string[];
  tms_per_provider: Record<string, number>;
  cache_hits?: string[]; // placeholder
  decision_mode: 'auto_select' | 'disambiguate';
  confidence: number;
  episodes_fetched?: number;
  episodes_with_chapters?: number;
  episodes_with_transcripts?: number;
  spotify_enrichment_applied?: boolean;
}

export interface PodcastSearchResult {
  resolved: ResolvedPodcast;
  telemetry: PodcastSearchTelemetry;
}

export async function runPodcastSearch(
  input: PodcastSearchInput,
  ctx?: ExecutionContext
): Promise<PodcastSearchResult> {
  const t0 = performance.now();
  const { plans, flags } = planPodcastQuery(input);

  const raw = await executePlans(plans, ctx, { needEpisodes: flags.needEpisodes });
  const resolved = resolvePodcast(input.user_query, raw, plans);

  // Telemetry aggregation
  const providers_called = Object.keys(raw.raw);
  const tms_per_provider: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw.raw)) tms_per_provider[k] = v.t_ms;

  const episodes = resolved.episodes || [];
  const telemetry: PodcastSearchTelemetry = {
    providers_called,
    tms_per_provider,
    decision_mode: resolved.decision.mode,
    confidence: resolved.decision.confidence,
    episodes_fetched: episodes.length,
    episodes_with_chapters: episodes.filter(e => !!e.chapters).length,
    episodes_with_transcripts: episodes.filter(e => !!e.transcript).length,
    spotify_enrichment_applied: providers_called.some(k => k.startsWith('spotify:')),
  };

  // Optionally include basic duration
  void performance.now() - t0;
  return { resolved, telemetry };
}

export * from './types';

