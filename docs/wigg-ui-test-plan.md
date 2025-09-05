# WIGG UI Test Plan (UI-only)

Scope: PacingBarcode, MilestonePath, LollipopStrip, RealtimeWiggOverlay, TitleCard, TitleHeader.

## Environments
- Browser: Chrome, Safari iOS, Firefox (latest)
- Devices: iPhone 12/13, Pixel 6/7, mid-tier Android (~60Hz)
- DPR: 1x, 2x, 3x

## Common Acceptance Criteria
- Performance: 60fps target during scrubbing/drag; <8ms/frame main thread updates.
- Accessibility: Keyboard operable; screen readers announce T2G and current progress; 44×44px hit targets.
- Resilience: Neutral rendering with empty/partial data; interactions still work where expected.
- State Sync: Optimistic mark placement; reconcile when backend responds.

## Component Test Cases

### PacingBarcode
- Rendering: Crisp canvas at 1x/2x/3x DPR; proper segment opacity mapping; T2G star clamped [0, 100].
- Interaction (interactive=true):
  - Tap maps to nearest segment center ±0.5 segment width.
  - Drag scrubs smoothly; highlight stripe follows.
  - Long-press triggers onMarkWigg; single tap triggers onCommitScrub.
  - Keyboard: Left/Right moves one segment; Enter marks; Escape cancels.
- Edit Mode (editable=true):
  - Tap → puck; drag to snap; long-press shows fisheye; double-tap to drop.
  - Undo removes last optimistic pin immediately.
  - rAF-throttled moves; no layout thrash; scroll locked in chart.

### MilestonePath
- Visual: Smooth SVG path; collision-avoidant labels; focus cursor at focusPct.
- Interaction: Tapping a stop calls onSelect; accessible buttons with aria-label.
- Colorization: Interpolated path color with segmentScores.

### LollipopStrip
- Beads: Size/fill reflect score; first above threshold shows T2G star.
- Responsive: Enables horizontal scroll-snap if beads <12px apart.
- Interaction: Each bead clickable/keyboard-activatable with aria-pressed mapping to user entries.

### RealtimeWiggOverlay
- Live: Subscribes to currentPct; large mark button commits; toast feedback.
- Barcode: Taller, interactive; confidence badge reflects variance bands.
- Keyboard: Escape closes; Enter on button marks; Alt+E toggles Edit Mode.

### TitleCard
- Layout: Compact barcode (24px); T2G label; pacing insight; moments logged.
- Gestures: Long-press opens overlay; right side click opens detail.

### TitleHeader
- Views: MilestonePath primary; toggles to Barcode/Lollipop.
- Stats: T2G summary visible if available; segments count.

## Non-functional
- Memory: No unbounded listeners; canvases recycled on resize/unmount.
- Errors: Components guard against missing data without throwing.

## Manual Scenarios (Storybook)
- Narrow width (220–280px), high DPR; empty/partial/dense data.
- Edit Graph first-time coachmark and subsequent hidden state.
- Keyboard-only placement and screen reader walkthrough.

## Notes
- Hooks are mocked; backend reconciliation and idempotency are verified via simulated responses in stories.
