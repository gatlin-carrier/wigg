# WIGG Curve & Goodness Analytics Interview Script

**Lead-in (0:00-0:10)**  
"I’d love to show how we turn raw community WIGG points into an interpretable goodness curve."

**Curve Construction (0:10-0:35)**  
"`src/lib/wigg/curve.ts` bins each point using a triangular kernel—bin count scales with viewport width, so a wide chart gets finer granularity. We normalize the density per bin, which lets us render a smooth, resolution-agnostic curve."

**Segment Analysis (0:35-0:55)**  
"`analysis.ts` resamples progress segments, interpolates gaps, and applies a smoothing window before classifying peaks. We derive labels like 'Peak late' vs 'Strong start' by comparing early vs late averages and locating the global maximum."

**Time-to-Good Estimation (0:55-1:10)**  
"We estimate time-to-good (T2G) by scanning for sustained periods above a threshold, with configurable sustain bins to avoid one-frame spikes. Personal wiggs trump community curves, but we fall back gracefully when data is sparse."

**UI Integration (1:10-1:25)**  
"`buildGoodnessCurveSeries` memoizes labels and values for the React layer, and `GoodnessCurve.tsx` renders it with threshold lines, peak markers, and labels without re-computing the heavy math."

**Finish (1:25-1:35)**  
"It’s a nice example of pairing domain heuristics with visualization: the math is stable, yet the UI stays reactive and cheap." 
