import type { ExecutionContext, ProviderResult, QueryPlan, RawResults } from './types';
import type { AppleSearchRes, PIShowRes, PIEpisodesRes } from './types';
import { searchApple, lookupApple } from './apple';
import { piByItunesId, piByFeedUrl, piEpisodesByFeedId } from './podcastindex';
import { spMeShows } from './spotify';

export interface ExecutionFlags {
  needEpisodes: boolean;
}

export async function executePlans(
  plans: QueryPlan[],
  ctx: ExecutionContext | undefined,
  flags: ExecutionFlags
): Promise<RawResults> {
  const results: Record<string, ProviderResult> = {};

  // Helper to fetch the apple top hit collectionId (if any)
  function getAppleTopHitCollectionId(): number | undefined {
    const key = 'apple:search';
    const res = results[key]?.data as AppleSearchRes | undefined;
    if (!res?.results?.length) return undefined;
    return res.results[0]?.collectionId;
  }

  // Helper to fetch PI feedId from prior PI lookup
  function getPIResolvedFeedId(): number | undefined {
    const key = 'podcastindex:podcasts/byitunesid';
    const res = results[key]?.data as PIShowRes | undefined;
    const feed = res?.feed || (res?.feeds && res.feeds[0]);
    return feed?.id;
  }

  // Execute sequentially with conditional follow-ups so we can resolve placeholders
  for (const plan of plans) {
    const key = `${plan.provider}:${plan.endpoint}`;
    const start = performance.now();

    try {
      let data: any;

      // Resolve deferred params
      const params = { ...plan.params };
      if (params.idFrom === '<from apple.collectionId>') {
        const id = getAppleTopHitCollectionId();
        if (!id) {
          // Skip if no apple top hit available
          continue;
        }
        params.id = id;
        delete params.idFrom;
      }
      if (params.feedidFrom === '<from podcastindex.feedId>') {
        const feedid = getPIResolvedFeedId();
        if (!feedid) continue;
        params.id = feedid;
        delete params.feedidFrom;
      }

      // Honor needEpisodes flag for episode plan
      if (plan.endpoint === 'episodes/byfeedid' && !flags.needEpisodes) continue;

      // Dispatch by provider/endpoint
      if (plan.provider === 'apple') {
        if (plan.endpoint === 'search') {
          data = await withTimeout(searchApple(params.term, params.country, params.limit), plan.timeout_ms);
        } else if (plan.endpoint === 'lookup') {
          data = await withTimeout(lookupApple(params.id, params.country), plan.timeout_ms);
        } else {
          throw new Error(`Unsupported Apple endpoint: ${plan.endpoint}`);
        }
      } else if (plan.provider === 'podcastindex') {
        if (plan.endpoint === 'podcasts/byitunesid') {
          data = await withTimeout(piByItunesId(params.id, ctx), plan.timeout_ms);
        } else if (plan.endpoint === 'podcasts/byfeedurl') {
          data = await withTimeout(piByFeedUrl(params.url, ctx), plan.timeout_ms);
        } else if (plan.endpoint === 'episodes/byfeedid') {
          data = await withTimeout(piEpisodesByFeedId(params.id, params.max ?? 20, ctx), plan.timeout_ms);
        } else {
          throw new Error(`Unsupported PodcastIndex endpoint: ${plan.endpoint}`);
        }
      } else if (plan.provider === 'spotify') {
        if (plan.endpoint === 'me/shows') {
          data = await withTimeout(spMeShows(params.limit ?? 20, params.offset ?? 0, ctx), plan.timeout_ms);
        } else {
          // Ignore unsupported/default for now
          continue;
        }
      } else {
        throw new Error(`Unknown provider: ${plan.provider}`);
      }

      results[key] = { ok: true, t_ms: Math.round(performance.now() - start), data };
    } catch (err: any) {
      results[key] = {
        ok: false,
        t_ms: Math.round(performance.now() - start),
        error: err?.message || 'Unknown error',
      };
    }
  }

  return { raw: results };
}

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let t: any;
  const timeout = new Promise<never>((_, reject) => {
    t = setTimeout(() => reject(new Error('Timeout')), ms);
  });
  try {
    const res = await Promise.race([p, timeout]);
    return res as T;
  } finally {
    clearTimeout(t);
  }
}

