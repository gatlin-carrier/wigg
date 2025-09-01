import React, { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import MediaTile from '@/components/media/MediaTile';
import { useTmdbSearch } from '@/integrations/tmdb/hooks';
import { useOpenLibrarySearch } from '@/integrations/openlibrary/searchHooks';

function useDebounced<T>(value: T, delay = 300) {
  const [v, setV] = useState(value as any);
  React.useEffect(() => { const t = setTimeout(() => setV(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return v as T;
}

function detectDomain(q: string): 'tv' | 'book' | 'mixed' {
  const s = q.toLowerCase();
  if (/\bseason\b|\bepisode\b|\bs\d{1,2}\b/.test(s)) return 'tv';
  if (/\bbook\b|\bnovel\b|\bauthor\b|\bby\s+/.test(s)) return 'book';
  return 'mixed';
}

type Props = { onPick?: (media: { title: string; type: 'Movie'|'TV Show'|'Book'; poster?: string }) => void };

export default function GlobalSearch({ onPick }: Props) {
  const [query, setQuery] = useState('');
  const q = useDebounced(query, 350);
  const domain = useMemo(() => detectDomain(q), [q]);

  const tmdbMode = domain === 'tv' ? 'multi' as const : 'multi' as const;
  const { data: tmdb } = useTmdbSearch(q, tmdbMode);
  const { data: books } = useOpenLibrarySearch(domain === 'book' || domain === 'mixed' ? q : '');

  const tmdbItems = (tmdb?.results || []).filter((r: any) => ['movie','tv'].includes(r.media_type || 'movie')).slice(0, 8);
  const bookItems = (books || []).slice(0, 8);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Input
          placeholder="Search movies, TV, and books…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-11"
        />
      </div>
      {q && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium mb-2">Movies & TV</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {tmdbItems.map((r: any) => {
                const title = r.title ?? r.name ?? 'Untitled';
                const poster = r.poster_path ? `https://image.tmdb.org/t/p/w342${r.poster_path}` : undefined;
                const year = (r.release_date || r.first_air_date || '').slice(0, 4);
                const rating = typeof r.vote_average === 'number' ? `${r.vote_average.toFixed(1)}/10` : undefined;
                const type = (r.media_type === 'tv') ? 'TV Show' : 'Movie';
                return (
                  <MediaTile key={`${r.media_type}-${r.id}`} title={title} imageUrl={poster} year={year} ratingLabel={rating}
                    onAdd={() => onPick?.({ title, type, poster })}
                  />
                );
              })}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-2">Books</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {bookItems.map((b: any) => (
                <MediaTile key={b.id} title={b.title} imageUrl={b.cover_url} year={b.year} tags={b.genre ? [b.genre] : []}
                  onAdd={() => onPick?.({ title: b.title, type: 'Book', poster: b.cover_url })}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

