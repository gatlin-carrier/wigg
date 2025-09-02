import type { ExecutionContext, ProviderResult, QueryPlan, RawResults } from './types.ts';
import type { AppleSearchRes, PIShowRes, PIEpisodesRes } from './types.ts';
import { searchApple, lookupApple } from './apple.ts';
import { piByItunesId, piByFeedUrl, piEpisodesByFeedId } from './podcastindex.ts';
import { spMeShows } from './spotify.ts';

export interface ExecutionFlags { needEpisodes: boolean }

export async function executePlans(
  plans: QueryPlan[],
  ctx: ExecutionContext | undefined,
  flags: ExecutionFlags
): Promise<RawResults> {
  const results: Record<string, ProviderResult> = {};

  function getAppleTopHitCollectionId(): number | undefined {
    const key = 'apple:search';
    const res = results[key]?.data as AppleSearchRes | undefined;
    if (!res?.results?.length) return undefined;
    return res.results[0]?.collectionId;
  }

  function getPIResolvedFeedId(): number | undefined {
    const key = 'podcastindex:podcasts/byitunesid';
    const res = results[key]?.data as PIShowRes | undefined;
    const feed = res?.feed || (res?.feeds && res.feeds[0]);
    return feed?.id;
  }

  for (const plan of plans) {
    const key = `${plan.provider}:${plan.endpoint}`;
    const start = performance.now();
    try {
      let data: any;
      const params = { ...plan.params };
      if (params.idFrom === '<from apple.collectionId>') {
        const id = getAppleTopHitCollectionId();
        if (!id) continue;
        params.id = id; delete params.idFrom;
      }
      if (params.feedidFrom === '<from podcastindex.feedId>') {
        const feedid = getPIResolvedFeedId();
        if (!feedid) continue;
        params.id = feedid; delete params.feedidFrom;
      }

      if (plan.endpoint === 'episodes/byfeedid' && !flags.needEpisodes) continue;

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
          continue;
        }
      } else {
        throw new Error(`Unknown provider: ${plan.provider}`);
      }

      results[key] = { ok: true, t_ms: Math.round(performance.now() - start), data };
    } catch (err: any) {
      results[key] = { ok: false, t_ms: Math.round(performance.now() - start), error: err?.message || 'Unknown error' };
    }
  }

  return { raw: results };
}

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let t: number | undefined;
  const timeout = new Promise<never>((_, reject) => {
    t = setTimeout(() => reject(new Error('Timeout')), ms) as unknown as number;
  });
  try { return await Promise.race([p, timeout]) as T; }
  finally { if (t !== undefined) clearTimeout(t); }
}

