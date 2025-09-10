import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders: HeadersInit = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TMDB_BASE = "https://api.themoviedb.org/3";

function isNumericId(s: string): boolean {
  return /^[0-9]+$/.test(s);
}

// Restrict which paths can be proxied
function isAllowedPath(path: string): boolean {
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0) return false;

  // search endpoints
  if (parts[0] === "search" && (parts[1] === "movie" || parts[1] === "multi" || parts[1] === "tv")) return true;

  // trending endpoints: trending/{movie|tv}/{day|week}
  if (parts[0] === "trending" && (parts[1] === "movie" || parts[1] === "tv") && (parts[2] === "day" || parts[2] === "week")) return true;

  // popular endpoints
  if (parts[0] === "movie" && parts[1] === "popular") return true;
  if (parts[0] === "tv" && parts[1] === "popular") return true;

  // details endpoints: movie/{id}, tv/{id}
  if (parts[0] === "movie" && parts[1] && isNumericId(parts[1]) && parts.length === 2) return true;
  if (parts[0] === "tv" && parts[1] && isNumericId(parts[1]) && parts.length === 2) return true;

  // TV season details: tv/{id}/season/{season_number}
  if (
    parts[0] === "tv" &&
    parts[1] && isNumericId(parts[1]) &&
    parts[2] === "season" &&
    parts[3] && isNumericId(parts[3]) &&
    parts.length === 4
  ) return true;

  // TV episode details: tv/{id}/season/{season_number}/episode/{episode_number}
  if (
    parts[0] === "tv" &&
    parts[1] && isNumericId(parts[1]) &&
    parts[2] === "season" &&
    parts[3] && isNumericId(parts[3]) &&
    parts[4] === "episode" &&
    parts[5] && isNumericId(parts[5]) &&
    parts.length === 6
  ) return true;

  // genre lists
  if (parts[0] === "genre" && (parts[1] === "movie" || parts[1] === "tv") && parts[2] === "list") return true;

  // discover (used for anime heuristic)
  if (parts[0] === "discover" && (parts[1] === "movie" || parts[1] === "tv")) return true;

  return false;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    // Allow both styles: /functions/v1/tmdb/<path> or ?path=<path>
    const pathname = url.pathname;
    const idx = pathname.indexOf("/tmdb");
    let path = "";
    if (idx >= 0) {
      path = pathname.slice(idx + "/tmdb".length);
    }
    if (path.startsWith("/")) path = path.slice(1);
    if (!path) {
      path = url.searchParams.get("path") ?? "";
    }

    if (!path || !isAllowedPath(path)) {
      return new Response(JSON.stringify({ error: "Invalid or unsupported TMDB path" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("TMDB_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "TMDB_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build upstream URL with all original query params except our helper param 'path'
    const upstreamParams = new URLSearchParams(url.search);
    upstreamParams.delete("path");
    upstreamParams.set("api_key", apiKey);

    const upstreamUrl = `${TMDB_BASE}/${path}?${upstreamParams.toString()}`;

    const res = await fetch(upstreamUrl, { method: "GET" });
    const text = await res.text();

    // Forward status and body
    return new Response(text, {
      status: res.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("tmdb proxy error", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
