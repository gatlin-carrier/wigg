import type {
  AppleSearchItem,
  AppleSearchRes,
  PIEpisode,
  PIEpisodesRes,
  PIShow,
  PIShowRes,
  QueryPlan,
  RawResults,
  ResolvedEpisode,
  ResolvedPodcast,
  ResolvedShow,
} from './types.ts';

function norm(s?: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function fuzzy(a?: string, b?: string): number {
  const s1 = norm(a);
  const s2 = norm(b);
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1;
  if (s1.includes(s2) || s2.includes(s1)) return Math.max(s1.length, s2.length) ? Math.min(s1.length, s2.length) / Math.max(s1.length, s2.length) : 0;
  const d: number[][] = Array.from({ length: s2.length + 1 }, () => Array(s1.length + 1).fill(0));
  for (let i = 0; i <= s1.length; i++) d[0][i] = i;
  for (let j = 0; j <= s2.length; j++) d[j][0] = j;
  for (let j = 1; j <= s2.length; j++) {
    for (let i = 1; i <= s1.length; i++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      d[j][i] = Math.min(d[j - 1][i] + 1, d[j][i - 1] + 1, d[j - 1][i - 1] + cost);
    }
  }
  const maxLen = Math.max(s1.length, s2.length) || 1;
  return (maxLen - d[s2.length][s1.length]) / maxLen;
}

function domainFromUrl(u?: string): string | undefined {
  if (!u) return undefined;
  try { return new URL(u).hostname.toLowerCase().replace(/^www\./, ''); }
  catch { return undefined; }
}

const KNOWN_GOOD_FEED_DOMAINS = [
  'nytimes.com','wnyc.org','npr.org','prx.org','libsyn.com','buzzsprout.com','megaphone.fm','simplecast.com','art19.com','anchor.fm','spotify.com','audioboom.com','omny.fm',
];

function feedDomainReasonable(feedUrl?: string): number {
  const d = domainFromUrl(feedUrl);
  if (!d) return 0.3;
  if (KNOWN_GOOD_FEED_DOMAINS.some(g => d.endsWith(g))) return 1.0;
  if (/cloudfront|cdn|s3|storage|blob|googleusercontent/.test(d)) return 0.5;
  return 0.7;
}

function pickAppleTop(items: AppleSearchItem[], query: string): AppleSearchItem | undefined {
  const scored = items.map(it => ({ item: it, score: 0.7 * fuzzy(it.collectionName, query) + 0.3 * fuzzy(it.artistName || '', query) }));
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.item;
}

export function resolvePodcast(
  query: string,
  raw: RawResults,
  plans: QueryPlan[]
): ResolvedPodcast {
  const appleKey = 'apple:search';
  const piByItunesKey = 'podcastindex:podcasts/byitunesid';
  const piByFeedUrlKey = 'podcastindex:podcasts/byfeedurl';
  const piEpisodesKey = 'podcastindex:episodes/byfeedid';

  const appleRes = raw.raw[appleKey]?.data as AppleSearchRes | undefined;
  const piShowRes = (raw.raw[piByItunesKey]?.data || raw.raw[piByFeedUrlKey]?.data) as PIShowRes | undefined;
  const piEpisodesRes = raw.raw[piEpisodesKey]?.data as PIEpisodesRes | undefined;

  const appleTop = appleRes?.results?.length ? pickAppleTop(appleRes.results, query) : undefined;
  const piFeed: PIShow | undefined = piShowRes?.feed || (piShowRes?.feeds && piShowRes.feeds[0]) || undefined;

  const show: ResolvedShow = {
    id: piFeed ? `pi:feed:${piFeed.id}` : (appleTop ? `apple:show:${appleTop.collectionId}` : `unknown:${Date.now()}`),
    appleId: appleTop?.collectionId || piFeed?.itunesId,
    title: piFeed?.title || appleTop?.collectionName || query,
    publisher: piFeed?.author || appleTop?.artistName,
    feedUrl: piFeed?.url || appleTop?.feedUrl,
    artwork: appleTop?.artworkUrl600 ? { url: appleTop.artworkUrl600 } : (appleTop?.artworkUrl100 ? { url: appleTop.artworkUrl100 } : undefined),
  };

  const titleExact = norm(show.title) === norm(appleTop?.collectionName || show.title) ? 1.0 : fuzzy(show.title, query);
  const publisherSim = fuzzy(piFeed?.author || '', appleTop?.artistName || '');
  const idCrosscheck = appleTop?.collectionId && piFeed?.itunesId && appleTop.collectionId === piFeed.itunesId ? 1.0 : (piFeed ? 0.7 : 0.0);
  const feedDomainScore = feedDomainReasonable(show.feedUrl);
  let penalties = 0;
  if (!show.feedUrl) penalties += 0.1;

  const score = Math.max(0, 0.55 * titleExact + 0.20 * publisherSim + 0.15 * idCrosscheck + 0.10 * feedDomainScore - penalties);

  const alternatives = (appleRes?.results || [])
    .filter(it => it.collectionId !== appleTop?.collectionId)
    .map(it => ({ title: it.collectionName, appleId: it.collectionId, publisher: it.artistName, confidence: fuzzy(it.collectionName, query) }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);

  const episodes: ResolvedEpisode[] | undefined = piEpisodesRes?.items?.map(mapEpisode) || undefined;

  const decision = score >= 0.9
    ? { mode: 'auto_select' as const, confidence: score, why: buildWhy({ titleExact, idCrosscheck, recovered: !!show.feedUrl }) }
    : score >= 0.6
      ? { mode: 'disambiguate' as const, confidence: score, why: buildWhy({ titleExact, idCrosscheck, recovered: !!show.feedUrl, ambiguous: true }) }
      : { mode: 'disambiguate' as const, confidence: score, why: ['Low confidence', 'Consider refining search'] };

  return { decision, show, episodes, alternatives, query_plan_echo: plans };
}

function buildWhy(opts: { titleExact: number; idCrosscheck: number; recovered: boolean; ambiguous?: boolean }): string[] {
  const why: string[] = [];
  if (opts.titleExact >= 0.95) why.push('Exact title match');
  else if (opts.titleExact >= 0.8) why.push('Close title match');
  if (opts.idCrosscheck >= 0.95) why.push('Apple + PI id match');
  if (opts.recovered) why.push('FeedUrl recovered');
  if (opts.ambiguous) why.push('Multiple plausible matches');
  if (!why.length) why.push('Best available match');
  return why;
}

function toIso(epochSec?: number): string | undefined {
  if (!epochSec) return undefined;
  try { return new Date(epochSec * 1000).toISOString(); } catch { return undefined; }
}

function mapEpisode(ep: PIEpisode): ResolvedEpisode {
  const transcript = Array.isArray(ep.transcripts) && ep.transcripts.length > 0 ? ({ source: 'podcastindex', url: ep.transcripts[0].url, type: ep.transcripts[0].type } as const) : null;
  const chapters = ep.chaptersUrl ? ({ source: 'podcastindex', url: ep.chaptersUrl } as const) : null;
  return {
    id: `pi:episode:${ep.id}`,
    title: ep.title,
    pubDate: toIso(ep.datePublished),
    durationSec: ep.duration,
    enclosureUrl: ep.enclosureUrl,
    chapters,
    transcript,
  };
}

