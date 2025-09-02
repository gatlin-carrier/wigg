import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import MediaTile from '@/components/media/MediaTile';
import { useTmdbSearch, useTmdbMovieGenres, useTmdbTvGenres } from '@/integrations/tmdb/hooks';
import { useOpenLibrarySearch } from '@/integrations/openlibrary/searchHooks';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { usePageHeader } from '@/contexts/HeaderContext';
import { usePodcastSearch } from '@/integrations/podcast-search/hooks';

function isAnime(item: { genre_ids?: number[]; original_language?: string; origin_country?: string[] }, movieGenres: Record<number,string>, tvGenres: Record<number,string>) {
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
  
  // Configure global header for this page
  usePageHeader({
    title: "Search Results",
    subtitle: q ? `Results for "${q}"` : undefined,
    showBackButton: true,
    showHomeButton: true,
  });
  
  // Collapse state management
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  
  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const expandSection = (sectionId: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      newSet.delete(sectionId);
      return newSet;
    });
  };

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
  const { data: podcast } = usePodcastSearch(q);

  const tv = (tmdb?.results || []).filter((r) => (r.media_type === 'tv'));
  const movies = (tmdb?.results || []).filter((r) => (r.media_type === 'movie'));
  const anime = (tmdb?.results || []).filter((r) => isAnime(r as any, movieGenres, tvGenres));

  const chips: Array<{ id: string; label: string; count: number }> = [
    { id: 'tv', label: 'TV', count: tv.length },
    { id: 'anime', label: 'Anime', count: anime.length },
    { id: 'movies', label: 'Movies', count: movies.length },
    { id: 'books', label: 'Books', count: (books || []).length },
    { id: 'podcasts', label: 'Podcasts', count: podcast?.resolved ? 1 : 0 },
  ].filter(c => c.count > 0);

  // Collapsible section component
  const CollapsibleSection = ({ 
    id, 
    title, 
    count, 
    children 
  }: { 
    id: string; 
    title: string; 
    count: number; 
    children: React.ReactNode; 
  }) => {
    const isCollapsed = collapsedSections.has(id);
    
    return (
      <section id={id} className="space-y-3 mb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">{title}</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSection(id)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <span className="text-sm">{count} result{count !== 1 ? 's' : ''}</span>
            {isCollapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        </div>
        {!isCollapsed && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {children}
          </div>
        )}
      </section>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex justify-end mb-4">
        <form onSubmit={onSubmit} className="w-full max-w-md">
          <Input name="q" defaultValue={q} placeholder="Search movies, TV, books…" />
        </form>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {chips.map(ch => (
            <a 
              key={ch.id} 
              href={`#${ch.id}`}
              onClick={(e) => {
                // Expand the section when chip is clicked
                expandSection(ch.id);
                // Let the default anchor behavior scroll to section
              }}
            >
              <Button variant="outline" size="sm">{ch.label} ({ch.count})</Button>
            </a>
          ))}
        </div>
      )}

      {/* TV */}
      {tv.length > 0 && (
        <CollapsibleSection id="tv" title="TV" count={tv.length}>
          {tv.slice(0,40).map((r) => {
            const title = r.name ?? 'Untitled';
            const poster = r.poster_path ? `https://image.tmdb.org/t/p/w342${r.poster_path}` : undefined;
            const year = (r.first_air_date || '').slice(0, 4);
            const rating = typeof r.vote_average === 'number' ? `${r.vote_average.toFixed(1)}/10` : undefined;
            return (
              <MediaTile key={`tv-${r.id}`} title={title} imageUrl={poster} year={year} ratingLabel={rating} />
            );
          })}
        </CollapsibleSection>
      )}

      {/* Anime */}
      {anime.length > 0 && (
        <CollapsibleSection id="anime" title="Anime" count={anime.length}>
          {anime.slice(0,40).map((r) => {
            const title = r.title ?? r.name ?? 'Untitled';
            const poster = r.poster_path ? `https://image.tmdb.org/t/p/w342${r.poster_path}` : undefined;
            const year = (r.release_date || r.first_air_date || '').slice(0, 4);
            const rating = typeof r.vote_average === 'number' ? `${r.vote_average.toFixed(1)}/10` : undefined;
            return (
              <MediaTile key={`anime-${r.media_type}-${r.id}`} title={title} imageUrl={poster} year={year} ratingLabel={rating} />
            );
          })}
        </CollapsibleSection>
      )}

      {/* Movies */}
      {movies.length > 0 && (
        <CollapsibleSection id="movies" title="Movies" count={movies.length}>
          {movies.slice(0,40).map((r) => {
            const title = r.title ?? 'Untitled';
            const poster = r.poster_path ? `https://image.tmdb.org/t/p/w342${r.poster_path}` : undefined;
            const year = (r.release_date || '').slice(0, 4);
            const rating = typeof r.vote_average === 'number' ? `${r.vote_average.toFixed(1)}/10` : undefined;
            return (
              <MediaTile key={`movie-${r.id}`} title={title} imageUrl={poster} year={year} ratingLabel={rating} />
            );
          })}
        </CollapsibleSection>
      )}

      {/* Books */}
      {books && books.length > 0 && (
        <CollapsibleSection id="books" title="Books" count={books.length}>
          {books.slice(0,40).map((b) => (
            <MediaTile 
              key={`book-${b.id}`} 
              title={b.title} 
              imageUrl={b.cover_url} 
              year={b.year} 
              tags={b.genre ? [b.genre] : []}
              onClick={() => navigate(`/media/openlibrary/${encodeURIComponent(b.id)}`)}
            />
          ))}
        </CollapsibleSection>
      )}

      {/* Podcasts (top resolved + up to 3 alternatives as tiles) */}
      {podcast?.resolved && (
        <CollapsibleSection id="podcasts" title="Podcasts" count={1 + (podcast.resolved.alternatives?.length || 0)}>
          {(() => {
            const tiles: Array<{ key: string; title: string; imageUrl?: string; subtitle?: string }> = [];
            const main = podcast.resolved.show;
            tiles.push({ key: main.id, title: main.title, imageUrl: main.artwork?.url, subtitle: main.publisher });
            (podcast.resolved.alternatives || []).forEach((alt, i) => {
              tiles.push({ key: `alt-${i}-${alt.appleId ?? i}`, title: alt.title, imageUrl: undefined, subtitle: alt.publisher });
            });
            return tiles.map(t => (
              <MediaTile key={t.key} title={t.title} imageUrl={t.imageUrl} tags={t.subtitle ? [t.subtitle] : []} />
            ));
          })()}
        </CollapsibleSection>
      )}
    </div>
  );
}

