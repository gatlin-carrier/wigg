// Shared types for WiggMap components (web + native)

export type PosKind = 'sec' | 'percent' | 'page';

export type WiggPoint = {
  pos: number;                // 0..duration (sec) or 0..100 if percent, or page number
  weight?: number;            // default 1; derived from trust_score
  createdAt?: string;
  tags?: string[];            // non-spoiler tags
};

export type WiggWindow = {
  start: number;              // inclusive
  end: number;                // exclusive
  score: number;              // relative strength for opacity; normalize 0..1
  label?: string;             // optional non-spoiler label
  isPrimary?: boolean;        // highlight this window
};

export type WiggConsensus = {
  posKind: PosKind;           // all inputs must match this kind
  duration: number;           // seconds | 100 | pages
  medianPos?: number;         // optional
  windows: WiggWindow[];      // can be empty
};

export type SensitivityFilter = {
  tagsToMute?: string[];      // e.g., ["gore","flashing"]
};

export type WiggMapProps = {
  consensus: WiggConsensus;
  points?: WiggPoint[];           // optional raw points for density
  height?: number;                // default 56
  width?: number;                 // for web only; native flexes
  posKindLabel?: string;          // e.g., "min", "%", "pg"
  spoilerSafe?: boolean;          // default true: hide labels, show shapes only
  sensitivity?: SensitivityFilter;
  showGrid?: boolean;             // default false
  showMiniBar?: boolean;          // default true (1-3px baseline)
  onSeek?: (pos: number) => void; // called on click/tap/drag end
  onPeek?: (pos: number) => void; // called on hover/drag
  formatTick?: (pos: number) => string; // override default formatting
  className?: string;             // Tailwind/NativeWind
};

