import type { ExecutionContext } from './types.ts';

const SPOTIFY_API = 'https://api.spotify.com/v1';

function requireToken(ctx?: ExecutionContext): string {
  const token = ctx?.spotifyAccessToken;
  if (!token) throw new Error('Spotify access token missing');
  return token;
}

export async function spMeShows(limit = 20, offset = 0, ctx?: ExecutionContext) {
  const token = requireToken(ctx);
  const url = `${SPOTIFY_API}/me/shows?limit=${limit}&offset=${offset}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Spotify ${res.status}: ${await res.text()}`);
  return res.json();
}

