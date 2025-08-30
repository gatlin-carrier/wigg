WiggMap Visualization Suite
===========================

Overview
 - Shared helpers: `packages/shared/wigg/curve.ts`
 - Web component: `apps/web/src/components/wigg/WiggMap.tsx`
 - Native component: `apps/native/src/components/wigg/WiggMap.native.tsx`
 - Shared types: `packages/shared/wigg/types.ts`

Data contracts
 - See `packages/shared/wigg/types.ts` for `PosKind`, `WiggPoint`, `WiggWindow`, `WiggConsensus`, `SensitivityFilter`, `WiggMapProps`.

Usage (Web)
```tsx
import { WiggMap } from '@/components/wigg/WiggMap';

<WiggMap
  consensus={{
    posKind: 'sec',
    duration: 5400,
    medianPos: 1820,
    windows: [
      { start: 1700, end: 1980, score: 1, label: 'tone lift', isPrimary: true },
      { start: 3100, end: 3400, score: 0.6, label: 'setpiece' }
    ]
  }}
  points={[
    { pos: 1780, weight: 1.2, tags: ['reveal'] },
    { pos: 1860, weight: 0.9, tags: ['action'] },
  ]}
  width={640}
  className="text-violet-500"
/>
```

Usage (Native)
```tsx
import { WiggMapNative } from '@/components/wigg/WiggMap.native';

<WiggMapNative
  consensus={{ posKind: 'sec', duration: 3600, medianPos: 900, windows: [] }}
  points={[{ pos: 880 }, { pos: 920 }]}
  className="text-violet-500"
/>
```

Deterministic behavior
 - Binning: width/6, clamped to [40..400] (native: based on layout width).
 - Kernel: triangular, bandwidth `h = 2 * (duration / numBins)`.
 - Normalized densities to [0..1].
 - Primary marker: `medianPos` else center of highest bin.

Accessibility
 - Web SVG has `role="img"` and `<title/>` + `<desc/>`.
 - `spoilerSafe` hides labels; shapes remain.

Styling
 - Uses `currentColor`. Control color via `className` (Tailwind/NativeWind).

Tests
 - Run `npm run test` for unit tests (Vitest).

