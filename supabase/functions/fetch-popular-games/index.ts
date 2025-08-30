import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get('IGDB_CLIENT_ID');
    const clientSecret = Deno.env.get('IGDB_API_KEY');

    if (!clientId || !clientSecret) {
      throw new Error('IGDB credentials not found');
    }

    console.log('Fetching access token from IGDB...');

    // Get access token from Twitch (IGDB is owned by Twitch)
    const tokenResponse = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
    });

    if (!tokenResponse.ok) {
      throw new Error(`Token request failed: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    console.log('Fetching popular games from IGDB...');

    // Fetch popular games from IGDB
    const gamesResponse = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: 'fields name,cover.url,rating,first_release_date,summary,genres.name; where rating > 80 & cover != null; sort rating desc; limit 12;',
    });

    if (!gamesResponse.ok) {
      throw new Error(`IGDB request failed: ${gamesResponse.status}`);
    }

    const games = await gamesResponse.json();

    console.log(`Successfully fetched ${games.length} popular games`);

    // Transform the data for our frontend
    const transformedGames = games.map((game: any) => ({
      id: game.id,
      name: game.name,
      cover: game.cover?.url ? `https:${game.cover.url.replace('t_thumb', 't_cover_big')}` : null,
      rating: game.rating ? Math.round(game.rating) : null,
      releaseDate: game.first_release_date ? new Date(game.first_release_date * 1000).getFullYear() : null,
      summary: game.summary || '',
      genres: game.genres?.map((g: any) => g.name).join(', ') || '',
    }));

    return new Response(JSON.stringify({ games: transformedGames }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in fetch-popular-games function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});