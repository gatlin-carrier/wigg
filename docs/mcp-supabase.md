## Supabase MCP Setup (Codex CLI)

This doc shows how to use the Supabase MCP server with Codex CLI in this repo, verify the config, and deploy the podcast search Edge Function.

### Sanity Check

- MCP config: `c:\Users\gatli\.codex\config.toml`
  - Uses: `npx -y @supabase/mcp-server-supabase@latest --read-only --project-ref=anmadaditlpkedmaeibx`
  - Has `SUPABASE_ACCESS_TOKEN` set in `env`.
- Project ref matches `.env`:
  - `.env: VITE_SUPABASE_PROJECT_ID` = `anmadaditlpkedmaeibx`

If you want reproducible behavior, consider pinning the MCP server version (e.g., `@supabase/mcp-server-supabase@1.x.y`).

### Requirements

- Node.js 18+
- Supabase CLI (for function deploys): `npm i -g supabase`
- A valid Supabase access token (already in your MCP config). Avoid committing tokens.

### Launch Codex With MCP

- Run Codex CLI. It auto-loads `~/.codex/config.toml` (Windows: `c:\Users\<you>\.codex\config.toml`).
  - `codex`
  - On start, Codex should list a `supabase` MCP tool if discovery is shown.

Notes on flags:
- In some builds, `--config`/`-c` is for "config overrides" (expects KEY=VALUE), not a file path — passing a path causes the "Invalid override (missing '=')" error you saw.
- If your build supports a file-path flag, use `--config-file` or `--config-path` instead, e.g.:
  - `codex --config-file "c:\\Users\\gatli\\.codex\\config.toml"`
  - `codex --config-path "c:\\Users\\gatli\\.codex\\config.toml"`
  - Check `codex --help` to confirm the exact flag name for your version.

Tip: You can test the MCP server directly:
- `npx -y @supabase/mcp-server-supabase@latest --help`
- `npx -y @supabase/mcp-server-supabase@latest --read-only --project-ref=anmadaditlpkedmaeibx`

### Deploy Edge Functions

Podcast search (uses Podcast Index + Apple + optional Spotify):

- Files:
  - `supabase/functions/podcast-search/index.ts`
  - `supabase/functions/podcast-search/{planner,executor,resolver,apple,podcastindex,spotify,types}.ts`

- Set function secrets (server-side):
  - `supabase secrets set PI_API_KEY=... PI_API_SECRET=... PODCAST_USER_AGENT="WIGG/PodcastSearch (+https://wigg.app)" --project-ref anmadaditlpkedmaeibx`

- Deploy:
  - `supabase functions deploy podcast-search --project-ref anmadaditlpkedmaeibx`

Smart search (existing function):
- Ensure `TMDB_API_KEY` is set:
  - `supabase secrets set TMDB_API_KEY=... --project-ref anmadaditlpkedmaeibx`
- Deploy if needed:
  - `supabase functions deploy smart-search --project-ref anmadaditlpkedmaeibx`

### Client Usage

- Hook: `src/integrations/podcast-search/hooks.ts` → `usePodcastSearch(q)`
- Direct client call: `src/integrations/podcast-search/client.ts` → `searchPodcasts(...)`
- UI: Podcasts section added in `src/pages/Search.tsx`

### Security Notes

- Keep Podcast Index secrets out of the browser. Prefer function secrets over `.env` `VITE_*` vars.
- You can remove `VITE_PI_API_KEY`/`VITE_PI_API_SECRET` from `.env` after setting Supabase function secrets.

### Troubleshooting

- MCP not visible in Codex:
  - Re-run Codex with `--config` pointing to your TOML.
  - Ensure Node can run `npx` (try `npx --version`).
  - Optionally pin MCP server version.
- Function call errors from client:
  - Confirm functions deployed: `supabase functions list --project-ref anmadaditlpkedmaeibx`
  - Check logs: `supabase functions logs --project-ref anmadaditlpkedmaeibx --function podcast-search`
