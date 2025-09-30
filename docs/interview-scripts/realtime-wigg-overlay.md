# Realtime WIGG Overlay UX Interview Script

**Intro (0:00-0:10)**  
"The Realtime WIGG overlay is a fun UX challenge: it marries live capture, feature flags, and accessibility."

**Data Sources (0:10-0:35)**  
"In `RealtimeWiggOverlay.tsx` we gate between `useUserWiggs` and the new data-layer hook via `useFeatureFlag`. Both expose the same contract, which made it painless to AB-test the new stack without touching the UI logic."

**Live Capture Loop (0:35-0:55)**  
"`useLiveCapture` simulates progression in demo mode, but the hook is architected for real telemetry: it exposes current percentage, async `markWigg`, and scrubbing APIs. We debounced keyboard shortcuts—space to mark, Cmd+Enter for power users—and keep everything synchronized with the live curve component."

**Confidence Heuristic (0:55-1:15)**  
"We compute T2G confidence on the fly by measuring variance across recent progress segments. Low variance earns a 'High confidence' badge, while sparse data falls back to 'Estimated', helping users interpret the signal."

**Accessibility & Safety (1:15-1:30)**  
"There’s an ARIA live region announcing percentage changes, an environment badge that only shows off prod domains, and a test-data detector that flags synthetic entries with an icon to avoid confusing QA telemetry."

**Close (1:30-1:35)**  
"Overall it’s a UX-heavy feature that still showcases thoughtful engineering and feature-flag-driven rollout." 
