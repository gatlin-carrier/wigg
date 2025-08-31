import React from 'react';
import WiggMap from '../../apps/web/src/components/wigg/WiggMap';

export default function WiggDemo() {
  const consensus = {
    posKind: 'sec' as const,
    duration: 7200,
    medianPos: 1880,
    windows: [
      { start: 1760, end: 2010, score: 1, label: 'setpiece', isPrimary: true },
      { start: 3600, end: 3840, score: 0.6, label: 'reveal' },
    ],
  };

  const points = Array.from({ length: 200 }, (_, i) => ({ pos: 1760 + (i % 50) * 5 }));

  return (
    <div className="p-6">
      <h1 className="text-lg font-medium mb-4">WiggMap Demo</h1>
      <div className="p-6 bg-zinc-950 rounded-md text-violet-400 w-fit">
        <WiggMap
          consensus={consensus}
          points={points}
          width={680}
          className="text-violet-400"
          onPeek={(p) => console.log('peek', Math.round(p))}
          onSeek={(p) => console.log('seek', Math.round(p))}
        />
      </div>
    </div>
  );
}

