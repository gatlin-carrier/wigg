import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type GameDetails = {
  id: number;
  name: string;
  cover?: string | null;
  background?: string | null;
  rating?: number | null;
  releaseDate?: string | null; // ISO or YYYY
  summary?: string | null;
  genres?: string[];
  platforms?: string[];
  companies?: string[];
  url?: string | null;
};

async function getAccessToken(clientId: string, clientSecret: string): Promise<string> {
  const tokenResponse = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
  });
  if (!tokenResponse.ok) throw new Error(`Token request failed: ${tokenResponse.status}`);
  const tokenData = await tokenResponse.json();
  return tokenData.access_token as string;
}

function toHttpsSized(url?: string | null, replaceFrom: string, replaceTo: string): string | null {
  if (!url) return null;
  return `https:${url.replace(replaceFrom, replaceTo)}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const clientId = Deno.env.get("IGDB_CLIENT_ID");
    const clientSecret = Deno.env.get("IGDB_API_KEY");
    if (!clientId || !clientSecret) throw new Error("IGDB credentials not found");

    const body = await req.json().catch(() => ({}));
    const id = Number(body?.id);
    if (!id || Number.isNaN(id)) throw new Error("Missing or invalid 'id'");

    const accessToken = await getAccessToken(clientId, clientSecret);

    // Fetch detailed game info
    const query = [
      "fields",
      [
        "name",
        "url",
        "cover.url",
        "artworks.url",
        "screenshots.url",
        "rating",
        "aggregated_rating",
        "first_release_date",
        "summary",
        "genres.name",
        "platforms.name",
        "involved_companies.company.name",
        "websites.url",
      ].join(","),
      "; where id = ",
      String(id),
      "; limit 1;",
    ].join(" ");

    const resp = await fetch("https://api.igdb.com/v4/games", {
      method: "POST",
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: query,
    });

    if (!resp.ok) throw new Error(`IGDB request failed: ${resp.status}`);
    const arr = (await resp.json()) as any[];
    if (!arr.length) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const g = arr[0] as any;

    // Prefer artwork as background, fallback to screenshot
    const artworkUrl: string | null = g?.artworks?.[0]?.url ?? null;
    const screenshotUrl: string | null = g?.screenshots?.[0]?.url ?? null;

    const details: GameDetails = {
      id: g.id,
      name: g.name,
      cover: toHttpsSized(g?.cover?.url ?? null, "t_thumb", "t_cover_big"),
      background:
        toHttpsSized(artworkUrl, "t_thumb", "t_1080p") ||
        toHttpsSized(screenshotUrl, "t_screenshot_med", "t_1080p") ||
        toHttpsSized(screenshotUrl, "t_thumb", "t_1080p"),
      rating: typeof g.aggregated_rating === "number"
        ? g.aggregated_rating
        : (typeof g.rating === "number" ? g.rating : null),
      releaseDate: g.first_release_date ? new Date(g.first_release_date * 1000).toISOString().slice(0, 10) : null,
      summary: g.summary ?? null,
      genres: Array.isArray(g.genres) ? g.genres.map((x: any) => x?.name).filter(Boolean) : undefined,
      platforms: Array.isArray(g.platforms) ? g.platforms.map((x: any) => x?.name).filter(Boolean) : undefined,
      companies: Array.isArray(g.involved_companies)
        ? g.involved_companies.map((x: any) => x?.company?.name).filter(Boolean)
        : undefined,
      url: g.url ?? (Array.isArray(g.websites) ? g.websites[0]?.url ?? null : null),
    };

    return new Response(JSON.stringify({ game: details }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("fetch-game-details error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

