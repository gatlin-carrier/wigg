export function formatT2G(pct?: number, runtime?: number, mediaType?: string): string {
  if (pct == null) return '';
  const pctLabel = `${pct.toFixed(0)}%`;
  if (!runtime || !mediaType) return pctLabel;

  const type = mediaType.toLowerCase();
  if (type === 'book' || type === 'manga') {
    const page = Math.round((pct / 100) * runtime);
    return `${pctLabel} (~page ${page})`;
  }
  // Assume runtime is minutes for movie/tv; for games runtime may be in minutes or hours
  let minutes = runtime;
  if (type === 'game' && runtime < 200) {
    // Heuristic: if games runtime is suspiciously low, treat as hours and convert to minutes
    minutes = runtime * 60;
  }
  const t2gMinutes = (pct / 100) * minutes;
  if (t2gMinutes < 60) return `${pctLabel} (~${Math.round(t2gMinutes)}m)`;
  const h = Math.floor(t2gMinutes / 60);
  const m = Math.round(t2gMinutes % 60);
  return `${pctLabel} (~${h}h${m ? ` ${m}m` : ''})`;
}

