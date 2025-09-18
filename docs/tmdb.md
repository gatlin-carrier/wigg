TMDB Integration
================

Setup
- Add your API key to Vercel environment variables (production) or local `.env` (development):

  # Server-side only (Vercel dashboard or Edge Functions)
  TMDB_API_KEY=your_tmdb_v3_api_key

- IMPORTANT: Do NOT use VITE_TMDB_API_KEY as it exposes the key to browsers
- All TMDB requests go through secure Edge Functions at `/functions/v1/tmdb/*`

Files
- Client: `src/integrations/tmdb/client.ts`
- Types: `src/integrations/tmdb/types.ts`
- Hooks: `src/integrations/tmdb/hooks.ts`
- Search UI: `src/components/tmdb/TmdbSearch.tsx`
- Demo page: `src/pages/TmdbDemo.tsx` (route: `/tmdb`)

Usage (Search)
```tsx
import { TmdbSearch } from '@/components/tmdb/TmdbSearch';

<TmdbSearch onSelect={(it) => console.log(it)} />
```

Notes
- This client always uses secure Edge Functions to protect your TMDB API key
- TMDB v3 API calls are proxied through `/functions/v1/tmdb/*` endpoints
- API keys are never exposed to the browser for maximum security

