TMDB Integration
================

Setup
- Add your API key to `.env`:

  VITE_TMDB_API_KEY=your_tmdb_v3_api_key

- Restart dev server after editing `.env`.

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
- This client uses TMDB v3 with `api_key` query param.
- For production, consider proxying through your backend to avoid exposing keys.

