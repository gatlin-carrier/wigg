const ANILIST_GRAPHQL = 'https://graphql.anilist.co';

type GqlVars = Record<string, any>;

async function anilistQuery<T>(query: string, variables: GqlVars): Promise<T> {
  const res = await fetch(ANILIST_GRAPHQL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (!res.ok || json.errors) {
    const msg = json?.errors?.[0]?.message || `AniList ${res.status}`;
    throw new Error(msg);
  }
  return json.data as T;
}

export async function fetchTrendingAnime(page = 1, perPage = 24) {
  const query = `
    query TrendingAnime($page:Int, $perPage:Int){
      Page(page:$page, perPage:$perPage){
        media(type: ANIME, sort: TRENDING_DESC, isAdult:false){
          id
          title { romaji english native }
          coverImage { large extraLarge color }
          bannerImage
          seasonYear
          startDate { year }
          format
          genres
          averageScore
          popularity
          episodes
          description(asHtml:false)
        }
      }
    }
  `;
  type Resp = { Page: { media: any[] } };
  const data = await anilistQuery<Resp>(query, { page, perPage });
  return data.Page.media;
}

export async function fetchPopularAnime(page = 1, perPage = 24) {
  const query = `
    query PopularAnime($page:Int, $perPage:Int){
      Page(page:$page, perPage:$perPage){
        media(type: ANIME, sort: POPULARITY_DESC, isAdult:false){
          id
          title { romaji english native }
          coverImage { large extraLarge color }
          bannerImage
          seasonYear
          startDate { year }
          format
          genres
          averageScore
          popularity
          episodes
          description(asHtml:false)
        }
      }
    }
  `;
  type Resp = { Page: { media: any[] } };
  const data = await anilistQuery<Resp>(query, { page, perPage });
  return data.Page.media;
}

export async function fetchAnimeDetails(id: number) {
  const query = `
    query AnimeDetails($id:Int){
      Media(id:$id, type: ANIME){
        id
        title { romaji english native }
        coverImage { large extraLarge color }
        bannerImage
        seasonYear
        startDate { year }
        endDate { year }
        format
        genres
        averageScore
        popularity
        episodes
        duration
        description(asHtml:false)
        studios(isMain:true){ nodes { name } }
        siteUrl
      }
    }
  `;
  type Resp = { Media: any };
  const data = await anilistQuery<Resp>(query, { id });
  return data.Media;
}

export async function fetchPopularManga(page = 1, perPage = 24) {
  const query = `
    query PopularManga($page:Int, $perPage:Int){
      Page(page:$page, perPage:$perPage){
        media(type: MANGA, sort: POPULARITY_DESC, isAdult:false){
          id
          title { romaji english native }
          coverImage { large extraLarge color }
          bannerImage
          startDate { year }
          genres
          averageScore
          popularity
          chapters
          volumes
          description(asHtml:false)
          countryOfOrigin
          siteUrl
        }
      }
    }
  `;
  type Resp = { Page: { media: any[] } };
  const data = await anilistQuery<Resp>(query, { page, perPage });
  return data.Page.media;
}

export async function fetchMangaDetails(id: number) {
  const query = `
    query MangaDetails($id:Int){
      Media(id:$id, type: MANGA){
        id
        title { romaji english native }
        coverImage { large extraLarge color }
        bannerImage
        startDate { year }
        endDate { year }
        genres
        averageScore
        popularity
        chapters
        volumes
        description(asHtml:false)
        siteUrl
      }
    }
  `;
  type Resp = { Media: any };
  const data = await anilistQuery<Resp>(query, { id });
  return data.Media;
}

export async function searchManga(queryStr: string, page = 1, perPage = 24) {
  const query = `
    query SearchManga($search:String!, $page:Int, $perPage:Int){
      Page(page:$page, perPage:$perPage){
        media(type: MANGA, search: $search, sort: POPULARITY_DESC, isAdult:false){
          id
          title { romaji english native }
          coverImage { large extraLarge }
          startDate { year }
          genres
          averageScore
          popularity
          siteUrl
        }
      }
    }
  `;
  type Resp = { Page: { media: any[] } };
  const data = await anilistQuery<Resp>(query, { search: queryStr, page, perPage });
  return data.Page.media;
}

export async function fetchPopularWebtoons(page = 1, perPage = 24, country: 'KR' | 'CN' | 'TW' | 'JP' = 'KR') {
  const query = `
    query PopularWebtoons($page:Int, $perPage:Int, $country:CountryCode){
      Page(page:$page, perPage:$perPage){
        media(
          type: MANGA,
          sort: POPULARITY_DESC,
          isAdult:false,
          countryOfOrigin: $country
        ){
          id
          title { romaji english native }
          coverImage { large extraLarge color }
          bannerImage
          startDate { year }
          genres
          tags { name }
          averageScore
          popularity
          chapters
          countryOfOrigin
          description(asHtml:false)
          siteUrl
        }
      }
    }
  `;
  type Resp = { Page: { media: any[] } };
  const data = await anilistQuery<Resp>(query, { page, perPage, country });
  return data.Page.media;
}

export async function fetchPopularWebtoonsAll(page = 1, perPage = 24) {
  const query = `
    query PopularWebtoonsAll($page:Int, $perPage:Int){
      Page(page:$page, perPage:$perPage){
        media(
          type: MANGA,
          sort: POPULARITY_DESC,
          isAdult:false
        ){
          id
          title { romaji english native }
          coverImage { large extraLarge color }
          bannerImage
          startDate { year }
          genres
          tags { name }
          averageScore
          popularity
          chapters
          countryOfOrigin
          description(asHtml:false)
          siteUrl
        }
      }
    }
  `;
  type Resp = { Page: { media: any[] } };
  const data = await anilistQuery<Resp>(query, { page, perPage });
  return data.Page.media;
}
