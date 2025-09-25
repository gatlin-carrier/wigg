import React, { useState } from 'react';
import { useTmdbSearch } from '@/integrations/tmdb/hooks';
import { getImageUrl } from '@/integrations/tmdb/client';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

type Props = {
  onSelect?: (item: { id: number; title: string; poster?: string }) => void;
  mode?: 'movie' | 'multi';
};

export function TmdbSearch({ onSelect, mode = 'movie' }: Props) {
  const [query, setQuery] = useState('');
  const { data, isFetching, isError, error } = useTmdbSearch(query, mode);

  return (
    <div className="space-y-3">
      <Input
        placeholder="Search TMDB (movies, TV)..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {isError && (
        <div className="text-sm text-red-500">{String((error as any)?.message ?? 'Error')}</div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {isFetching && !data && (
          <div className="text-sm text-muted-foreground">Searching…</div>
        )}
        {data?.results?.slice(0, 24).map((r) => {
          const title = (r as any).title ?? (r as any).name ?? 'Untitled';
          const year = (r.release_date || r.first_air_date || '').slice(0, 4);
          const poster = getImageUrl(r.poster_path, 'w185');
          return (
            <Card key={`${r.media_type ?? 'movie'}-${r.id}`} className="p-3 flex gap-3 items-start hover:bg-muted/40 cursor-pointer"
              onClick={() => onSelect?.({ id: r.id, title, poster })}
            >
              <div className="w-[46px] h-[69px] flex-shrink-0 rounded overflow-hidden bg-muted">
                {poster ? (
                  <img
                    src={poster}
                    alt="poster"
                    className="w-full h-full object-cover"
                    width="46"
                    height="69"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="w-full h-full" />
                )}
              </div>
              <div className="min-w-0">
                <div className="font-medium text-sm truncate">{title}{year ? ` (${year})` : ''}</div>
                {r.overview && (
                  <div className="text-xs text-muted-foreground line-clamp-3">{r.overview}</div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default TmdbSearch;

