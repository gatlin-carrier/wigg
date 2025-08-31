import React from 'react';
import { TmdbSearch } from '@/components/tmdb/TmdbSearch';
import { Card } from '@/components/ui/card';

export default function TmdbDemo() {
  const [picked, setPicked] = React.useState<{ id: number; title: string; poster?: string } | null>(null);
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">TMDB Demo</h1>
      <Card className="p-4">
        <TmdbSearch onSelect={(it) => setPicked(it)} />
      </Card>
      {picked && (
        <div className="flex items-center gap-3 text-sm">
          {picked.poster && <img src={picked.poster} className="w-10 h-14 rounded object-cover" alt="picked poster" />}
          <div>
            <div className="font-medium">Selected</div>
            <div>{picked.title} (id: {picked.id})</div>
          </div>
        </div>
      )}
      <div className="text-xs text-muted-foreground">
        Note: set VITE_TMDB_API_KEY in your .env to enable requests.
      </div>
    </div>
  );
}

