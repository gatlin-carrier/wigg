import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

async function getIgdbToken(clientId: string, clientSecret: string): Promise<string> {
  const resp = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&grant_type=client_credentials`,
  });
  if (!resp.ok) throw new Error(`IGDB auth failed: ${resp.status}`);
  const data = await resp.json();
  return String(data.access_token || '');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const q = String(body?.q ?? '').trim();
    const limit = Math.min(Math.max(parseInt(String(body?.limit ?? '12'), 10) || 12, 1), 25);
    if (!q) throw new Error('q is required');

    const clientId = Deno.env.get('IGDB_CLIENT_ID');
    const clientSecret = Deno.env.get('IGDB_API_KEY');
    if (!clientId || !clientSecret) throw new Error('IGDB credentials not configured');

    const token = await getIgdbToken(clientId, clientSecret);

    const query = `search "${q.replace(/"/g, '\\"')}"; fields id,name,first_release_date,total_rating,rating,cover.url,cover.image_id; limit ${limit};`;
    const igdbRes = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'text/plain',
      },
      body: query,
    });
    if (!igdbRes.ok) throw new Error(`IGDB search failed: ${igdbRes.status}`);
    const items = await igdbRes.json();

    const results = (Array.isArray(items) ? items : []).map((g: any) => {
      const year = typeof g?.first_release_date === 'number' ? new Date(g.first_release_date * 1000).getUTCFullYear() : undefined;
      let cover: string | undefined = undefined;
      if (g?.cover?.url) {
        cover = `https:${String(g.cover.url).replace('t_thumb', 't_cover_big')}`;
      } else if (g?.cover?.image_id) {
        cover = `https://images.igdb.com/igdb/image/upload/t_cover_big/${g.cover.image_id}.jpg`;
      }
      const rating = typeof g?.total_rating === 'number' ? Math.round(g.total_rating) : (typeof g?.rating === 'number' ? Math.round(g.rating) : undefined);
      return {
        id: g.id,
        name: g.name || 'Untitled',
        cover: cover || null,
        rating,
        releaseDate: year,
      };
    });

    return new Response(JSON.stringify({ games: results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

