import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import MediaTile from '@/components/media/MediaTile';
import { useTmdbSearch, useTmdbMovieGenres, useTmdbTvGenres } from '@/integrations/tmdb/hooks';
import { useOpenLibrarySearch } from '@/integrations/openlibrary/searchHooks';
import { Button } from '@/components/ui/button';

function isAnime(item: any, movieGenres: Record<number,string>, tvGenres: Record<number,string>) {
  const ids: number[] = item.genre_ids || [];
  const names = ids.map(id => movieGenres[id] || tvGenres[id]).filter(Boolean).map((s) => s.toLowerCase());
  const lang = (item.original_language || '').toLowerCase();
  const countries: string[] = item.origin_country || [];
  return names.includes('animation') && (lang === 'ja' || countries.includes('JP'));
}

export default function SearchPage() {
  const [sp, setSp] = useSearchParams();
  const navigate = useNavigate();
  const q = sp.get('q') || '';

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const input = form.elements.namedItem('q') as HTMLInputElement;
    const next = input.value.trim();
    navigate(`/search?q=${encodeURIComponent(next)}`);
  }

  const { data: tmdb } = useTmdbSearch(q, 'multi');
  const { data: books } = useOpenLibrarySearch(q);
  const { data: movieGenres = {} } = useTmdbMovieGenres();
  const { data: tvGenres = {} } = useTmdbTvGenres();

  const tv = (tmdb?.results || []).filter((r: any) => (r.media_type === 'tv'));
  const movies = (tmdb?.results || []).filter((r: any) => (r.media_type === 'movie'));
  const anime = (tmdb?.results || []).filter((r: any) => isAnime(r, movieGenres, tvGenres));

  const chips: Array<{ id: string; label: string; count: number }> = [
    { id: 'tv', label: 'TV', count: tv.length },
    { id: 'anime', label: 'Anime', count: anime.length },
    { id: 'movies', label: 'Movies', count: movies.length },
    { id: 'books', label: 'Books', count: (books || []).length },
  ].filter(c => c.count > 0);

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h1 className="text-xl font-semibold">Search Results</h1>
        <form onSubmit={onSubmit} className="w-full max-w-md">
          <Input name="q" defaultValue={q} placeholder="Search movies, TV, books…" />
        </form>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {chips.map(ch => (
            <a key={ch.id} href={`#${ch.id}`}>
              <Button variant="outline" size="sm">{ch.label} ({ch.count})</Button>
            </a>
          ))}
        </div>
      )}

      {/* TV */}
      {tv.length > 0 && (
        <section id="tv" className="space-y-3 mb-8">
          <h2 className="text-lg font-medium">TV</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {tv.slice(0,40).map((r: any) => {
              const title = r.name ?? 'Untitled';
              const poster = r.poster_path ? `https://image.tmdb.org/t/p/w342${r.poster_path}` : undefined;
              const year = (r.first_air_date || '').slice(0, 4);
              const rating = typeof r.vote_average === 'number' ? `${r.vote_average.toFixed(1)}/10` : undefined;
              return (
                <MediaTile key={`tv-${r.id}`} title={title} imageUrl={poster} year={year} ratingLabel={rating} />
              );
            })}
          </div>
        </section>
      )}

      {/* Anime */}
      {anime.length > 0 && (
        <section id="anime" className="space-y-3 mb-8">
          <h2 className="text-lg font-medium">Anime</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {anime.slice(0,40).map((r: any) => {
              const title = r.title ?? r.name ?? 'Untitled';
              const poster = r.poster_path ? `https://image.tmdb.org/t/p/w342${r.poster_path}` : undefined;
              const year = (r.release_date || r.first_air_date || '').slice(0, 4);
              const rating = typeof r.vote_average === 'number' ? `${r.vote_average.toFixed(1)}/10` : undefined;
              return (
                <MediaTile key={`anime-${r.media_type}-${r.id}`} title={title} imageUrl={poster} year={year} ratingLabel={rating} />
              );
            })}
          </div>
        </section>
      )}

      {/* Movies */}
      {movies.length > 0 && (
        <section id="movies" className="space-y-3 mb-8">
          <h2 className="text-lg font-medium">Movies</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {movies.slice(0,40).map((r: any) => {
              const title = r.title ?? 'Untitled';
              const poster = r.poster_path ? `https://image.tmdb.org/t/p/w342${r.poster_path}` : undefined;
              const year = (r.release_date || '').slice(0, 4);
              const rating = typeof r.vote_average === 'number' ? `${r.vote_average.toFixed(1)}/10` : undefined;
              return (
                <MediaTile key={`movie-${r.id}`} title={title} imageUrl={poster} year={year} ratingLabel={rating} />
              );
            })}
          </div>
        </section>
      )}

      {/* Books */}
      {books && books.length > 0 && (
        <section id="books" className="space-y-3 mb-8">
          <h2 className="text-lg font-medium">Books</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {books.slice(0,40).map((b: any) => (
              <MediaTile key={`book-${b.id}`} title={b.title} imageUrl={b.cover_url} year={b.year} tags={b.genre ? [b.genre] : []} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

