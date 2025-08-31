import React from 'react';
import { WiggPointCard } from '@/components/WiggPointCard';
import { Card, CardContent } from '@/components/ui/card';

type WiggPoint = Parameters<typeof WiggPointCard>[0]['point'];

const DUMMY: WiggPoint[] = [
  {
    id: 'f1', media_title: 'Midnight Run', type: 'movie', pos_kind: 'min', pos_value: 18,
    reason_short: 'Buddy dynamic clicks during the first chase',
    tags: ['chemistry','chase'], spoiler: '0',
    created_at: new Date(Date.now() - 1000*60*30).toISOString(),
    username: 'sam', user_id: '00000000-0000-0000-0000-000000000011', vote_score: 12,
  },
  {
    id: 'f2', media_title: 'The Expanse S1', type: 'tv show', pos_kind: 'episode', pos_value: 4,
    reason_short: 'Political threads converge and raise stakes',
    tags: ['politics','reveal'], spoiler: '1',
    created_at: new Date(Date.now() - 1000*60*60*2).toISOString(),
    username: 'arya', user_id: '00000000-0000-0000-0000-000000000012', vote_score: 34,
  },
  {
    id: 'f3', media_title: 'Dune (novel)', type: 'book', pos_kind: 'page', pos_value: 80,
    reason_short: 'Worldbuilding coheres; first maneuver lands',
    tags: ['politics','lore'], spoiler: '0',
    created_at: new Date(Date.now() - 1000*60*60*6).toISOString(),
    username: 'kyle', user_id: '00000000-0000-0000-0000-000000000013', vote_score: 21,
  },
  {
    id: 'f4', media_title: 'Into the Spider‑Verse', type: 'movie', pos_kind: 'min', pos_value: 25,
    reason_short: 'First big set‑piece + theme stated',
    tags: ['setpiece','theme'], spoiler: '0',
    created_at: new Date(Date.now() - 1000*60*60*12).toISOString(),
    username: 'miles', user_id: '00000000-0000-0000-0000-000000000014', vote_score: 57,
  },
  {
    id: 'f5', media_title: 'The Last of Us (game)', type: 'game', pos_kind: 'hour', pos_value: 2,
    reason_short: 'Systems open up and tone locks in',
    tags: ['mechanics','tone'], spoiler: '1',
    created_at: new Date(Date.now() - 1000*60*60*24).toISOString(),
    username: 'ellie', user_id: '00000000-0000-0000-0000-000000000015', vote_score: 40,
  },
  {
    id: 'f6', media_title: 'Better Call Saul S1', type: 'tv show', pos_kind: 'episode', pos_value: 3,
    reason_short: 'Character aim crystallizes with a clever pivot',
    tags: ['character','pivot'], spoiler: '0',
    created_at: new Date(Date.now() - 1000*60*60*30).toISOString(),
    username: 'kim', user_id: '00000000-0000-0000-0000-000000000016', vote_score: 19,
  },
  {
    id: 'f7', media_title: 'Arrival', type: 'movie', pos_kind: 'min', pos_value: 35,
    reason_short: 'Linguistics route surfaces; tone deepens',
    tags: ['tone','pivot'], spoiler: '0',
    created_at: new Date(Date.now() - 1000*60*60*42).toISOString(),
    username: 'lou', user_id: '00000000-0000-0000-0000-000000000017', vote_score: 28,
  },
  {
    id: 'f8', media_title: 'Andre Agassi – Open', type: 'book', pos_kind: 'page', pos_value: 50,
    reason_short: 'Voice fully lands; themes cohere',
    tags: ['voice','memoir'], spoiler: '0',
    created_at: new Date(Date.now() - 1000*60*60*72).toISOString(),
    username: 'serena', user_id: '00000000-0000-0000-0000-000000000018', vote_score: 13,
  },
  {
    id: 'f9', media_title: 'Dark S1', type: 'tv show', pos_kind: 'episode', pos_value: 5,
    reason_short: 'Timeline interlocks; mystery hooks in',
    tags: ['mystery','timelines'], spoiler: '2',
    created_at: new Date(Date.now() - 1000*60*60*96).toISOString(),
    username: 'ulrich', user_id: '00000000-0000-0000-0000-000000000019', vote_score: 31,
  },
  {
    id: 'f10', media_title: 'Spider‑Man 2 (PS5)', type: 'game', pos_kind: 'hour', pos_value: 1,
    reason_short: 'Traversal + first boss showcase mechanics',
    tags: ['traversal','boss'], spoiler: '0',
    created_at: new Date(Date.now() - 1000*60*60*120).toISOString(),
    username: 'pete', user_id: '00000000-0000-0000-0000-000000000020', vote_score: 22,
  },
];

export default function Feed() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Community Feed</h1>
        <p className="text-sm text-muted-foreground">Prototype with sample WIGG points from other users.</p>
      </div>
      <div className="space-y-6">
        {DUMMY.map((p) => (
          <WiggPointCard key={p.id} point={p} />
        ))}
      </div>
      <Card className="mt-8">
        <CardContent className="p-4 text-xs text-muted-foreground">
          This is mock data for layout and interaction prototyping. Hook to Supabase later to load live feed.
        </CardContent>
      </Card>
    </div>
  );
}

