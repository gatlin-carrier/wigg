import type { ExecutionContext, PIShowRes, PIEpisodesRes } from './types.ts';

const PI_BASE = 'https://api.podcastindex.org/api/1.0';

async function sha1Async(input: string): Promise<string> {
  const enc = new TextEncoder();
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error('WebCrypto unavailable');
  const digest = await subtle.digest('SHA-1', enc.encode(input));
  const bytes = new Uint8Array(digest);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function buildHeaders(ctx?: ExecutionContext): Promise<HeadersInit> {
  if (!ctx?.podcastIndex) throw new Error('PodcastIndex auth missing in ExecutionContext');
  const { apiKey, apiSecret, userAgent } = ctx.podcastIndex;
  const t = Math.floor(Date.now() / 1000);
  const auth = await sha1Async(`${apiKey}${apiSecret}${t}`);
  return {
    'X-Auth-Date': String(t),
    'X-Auth-Key': apiKey,
    'Authorization': auth,
    'User-Agent': userAgent || 'WIGG/PodcastSearch (+https://wigg.app)'
  } as HeadersInit;
}

async function piGet<T>(path: string, params: Record<string, any>, ctx?: ExecutionContext): Promise<T> {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== '') u.set(k, String(v));
  const url = `${PI_BASE}${path}?${u.toString()}`;
  const headers = await buildHeaders(ctx);
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`PodcastIndex ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export async function piByItunesId(appleId: number | string, ctx?: ExecutionContext): Promise<PIShowRes> {
  return piGet<PIShowRes>('/podcasts/byitunesid', { id: appleId }, ctx);
}

export async function piByFeedUrl(feedUrl: string, ctx?: ExecutionContext): Promise<PIShowRes> {
  return piGet<PIShowRes>('/podcasts/byfeedurl', { url: feedUrl }, ctx);
}

export async function piEpisodesByFeedId(feedId: number | string, max = 20, ctx?: ExecutionContext): Promise<PIEpisodesRes> {
  return piGet<PIEpisodesRes>('/episodes/byfeedid', { id: feedId, max }, ctx);
}

