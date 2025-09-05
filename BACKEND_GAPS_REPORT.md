# Backend Integration Gaps Report

This document outlines the backend features and API contracts that are expected by the new mobile-first UI/UX components but may not exist in the current system.

## Summary

The new visualization components (`PacingBarcode`, `MilestonePath`, `LollipopStrip`, `RealtimeWiggOverlay`, `TitleCard`, `TitleHeader`) assume several backend capabilities that may need to be implemented or adapted.

### 🆕 **EDIT GRAPH MODE UPDATE**

This report has been updated to include requirements for the new **Edit Graph Mode** functionality, which allows users to:

- ✨ **Place WIGGs directly on the progress graph** with tap-to-place interaction
- 🎨 **Paint segment scores** using vertical drag gestures (Press-to-Paint)
- ↩️ **Undo/redo actions** with full history tracking
- 🔄 **Real-time collaboration** with multi-user editing support
- 📱 **Seamless mobile experience** with touch-optimized interactions

**Priority Impact:** Edit Graph Mode requires **5 new critical backend features** and should be prioritized as Phase 3 (❗ **Week 4-5**) to support the enhanced mobile-first user experience.

## Required Backend Features

### 🆕 **EDIT GRAPH MODE ADDITIONS**

The following requirements have been added for the new Edit Graph Mode functionality:

#### Direct WIGG Placement API

**Component:** `PacingBarcode` (Edit Graph Mode)
**Props Expected:** `onPlaceWigg?: (pct: number, note?: string) => Promise<void>`

**Backend Requirements:**
- **Real-time WIGG creation** at any percentage position (0-100%)
- **Optimistic UI support** - immediate response with rollback capability on error
- **Validation** - ensure percentage is within valid bounds
- **Duplicate handling** - prevent or merge WIGGs placed very close together (<1% difference)
- **Bulk operations** - support for batch WIGG creation from edit sessions

#### Press-to-Paint Segment Scoring API

**Component:** `PacingBarcode` (Paint Mode)
**Props Expected:** `onPaintSegmentScore?: (pct: number, score: number) => Promise<void>`

**Backend Requirements:**
- **Segment score updates** - ability to update individual segment scores
- **Batch paint operations** - handle multiple score updates from paint strokes
- **Score validation** - ensure scores are in valid range (0-4)
- **Conflict resolution** - handle concurrent segment updates
- **User attribution** - track which user painted which segments
- **EMA integration** - support for exponential moving average smoothing

#### Enhanced Undo/Redo System

**Backend Requirements:**
- **Action history tracking** - maintain stack of recent user actions
- **Undo endpoint** - reverse specific actions by ID
- **Action types supported:**
  - `place` - WIGG placement undo
  - `paint` - Segment score painting undo
  - Batch operations for complex edit sessions
- **Optimistic update rollbacks** - handle client-side undo with server sync

#### Real-time Collaboration Support

**Backend Requirements:**
- **WebSocket integration** - real-time updates for collaborative editing
- **Conflict resolution** - handle multiple users editing the same title
- **User presence** - show which users are actively editing
- **Action broadcasting** - notify other users of edit actions

## Existing Required Backend Features

### 1. Progress Segmentation API ❗ **CRITICAL**

**Expected Hook:** `useTitleProgress(titleId: string)`

**Required Data Contract:**
```typescript
interface ProgressSegment {
  startPct: number;        // 0-100
  endPct: number;          // 0-100
  meanScore?: number;      // 0-4 scale (community average)
  userScore?: number;      // 0-4 scale (user's personal rating)
}

interface TitleProgressData {
  totalLengthSeconds?: number;    // Total duration in seconds
  totalLengthPercent?: number;    // Should be 100, for completeness
  segments: ProgressSegment[];    // Array of N segments (default 20)
}
```

**Missing Implementation:**
- Server-side bucketing of wigg points into segments
- Calculation of mean scores per segment
- User-specific score overlays
- Dynamic segment count support (12-40 segments)

**Suggested Implementation:**
1. **Option A:** Server computes segments dynamically based on requested segment count
2. **Option B:** Pre-compute and cache segments at multiple resolutions (12, 20, 30, 40 segments)
3. **Option C:** Return raw data and let client bucket (less preferred due to performance)

### 2. User WIGG Management API ❗ **CRITICAL**

**Expected Hook:** `useUserWiggs(titleId: string)`

**Required Data Contract:**
```typescript
interface WiggEntry {
  id: string;
  pct: number;           // 0-100 position
  note?: string;         // Optional user note
  createdAt: string;     // ISO timestamp
  rating?: number;       // 0-3 scale (zzz=0, good=1, better=2, peak=3)
}

interface UserWiggsData {
  entries: WiggEntry[];
  t2gEstimatePct?: number;  // Time-to-good estimate
}
```

**Required Methods:**
- `addWigg(pct: number, note?: string, rating?: number): Promise<void>`
- Optimistic updates support
- Idempotent create operations (prevent double-logging)

**Missing Implementation:**
- WIGG entry creation endpoint
- T2G calculation algorithm
- User-specific WIGG retrieval
- Note storage and retrieval

### 3. Time-to-Good (T2G) Calculation ⚠️ **HIGH PRIORITY**

**Current Status:** Mock implementation only

**Required Algorithm:**
- Server-side T2G calculation for consistency across users
- Confidence metric based on data variance
- Real-time updates as more data arrives

**Suggested Implementation:**
```sql
-- Example: First segment where mean_score >= threshold
SELECT MIN(segment_start_pct) as t2g_estimate
FROM title_segments 
WHERE title_id = ? AND mean_score >= 2.0
```

**Additional Features Needed:**
- Confidence scoring based on sample size and variance
- Fallback estimates for new titles
- T2G history tracking for trend analysis

### 4. Milestones Metadata API ⚠️ **MEDIUM PRIORITY**

**Expected Hook:** `useMilestones(titleId: string)`

**Required Data Contract:**
```typescript
interface Milestone {
  id: string;
  pct: number;
  label: string;
  icon?: React.ReactNode;  // Could be emoji string or icon name
}

interface MilestonesData {
  items: Milestone[];
}
```

**Missing Implementation:**
- Content database with story beats/milestones
- Scraping pipeline for milestone data
- Manual milestone entry system
- Icon/emoji mapping system

**Data Sources:**
- Community-contributed milestones
- Game guides and walkthroughs
- Movie/TV script analysis
- Book chapter/section markers

### 5. Live Capture Feed 🔶 **NICE TO HAVE**

**Expected Hook:** `useLiveCapture()`

**Required Data Contract:**
```typescript
interface LiveCaptureData {
  currentPct: number;    // Real-time progress 0-100
  isActive: boolean;     // Whether capture is running
}
```

**Required Methods:**
- `markWigg(pct: number, note?: string): Promise<void>`
- `setCurrentPct(pct: number): void`
- `startCapture()`, `stopCapture()`

**🆕 Edit Graph Mode Integration:**
- Support for **toggle between standard and edit modes**
- **Direct graph editing** within live capture sessions
- **Real-time segment score updates** during paint mode
- **Undo/redo support** for live editing actions
- **Session persistence** - save edit mode state across page refreshes

**Implementation Options:**
1. **Manual Input:** User manually sets current progress
2. **Player Integration:** Integration with game/video players
3. **Time-based:** Automatic progression based on session duration
4. **Platform APIs:** Steam, Netflix, etc. integration

### 6. Optimistic Updates Infrastructure ⚠️ **MEDIUM PRIORITY**

**Requirements:**
- Client-side optimistic WIGG creation
- Server reconciliation on connectivity restore
- Conflict resolution for offline/online sync
- Duplicate prevention via idempotency keys

**Suggested Implementation:**
```typescript
// Client generates UUID for optimistic operations
const optimisticId = crypto.randomUUID();
await addWigg(pct, note, rating, { optimisticId });
```

## Database Schema Implications

### New Tables Required

```sql
-- Title progress segments (pre-computed)
CREATE TABLE title_segments (
  id BIGSERIAL PRIMARY KEY,
  title_id TEXT NOT NULL,
  segment_count INTEGER NOT NULL, -- 12, 20, 30, 40
  segment_index INTEGER NOT NULL,
  start_pct DECIMAL(5,2) NOT NULL,
  end_pct DECIMAL(5,2) NOT NULL,
  mean_score DECIMAL(3,2),
  sample_size INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(title_id, segment_count, segment_index)
);

-- Milestones/story beats
CREATE TABLE title_milestones (
  id BIGSERIAL PRIMARY KEY,
  title_id TEXT NOT NULL,
  pct DECIMAL(5,2) NOT NULL,
  label TEXT NOT NULL,
  icon TEXT,
  source TEXT DEFAULT 'community', -- 'community', 'official', 'scraped'
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Existing Schema Modifications

```sql
-- Add to existing wigg_points table
ALTER TABLE wigg_points 
ADD COLUMN rating INTEGER CHECK (rating IN (0,1,2,3)),
ADD COLUMN note TEXT,
ADD COLUMN optimistic_id UUID UNIQUE;

-- Add T2G cache table
CREATE TABLE title_t2g_cache (
  title_id TEXT PRIMARY KEY,
  t2g_estimate_pct DECIMAL(5,2),
  confidence_level TEXT CHECK (confidence_level IN ('low','medium','high')),
  sample_size INTEGER,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## API Endpoints Required

### REST Endpoints
```
GET  /api/titles/{titleId}/progress?segments=20
POST /api/titles/{titleId}/wiggs
GET  /api/titles/{titleId}/wiggs
GET  /api/titles/{titleId}/milestones
GET  /api/titles/{titleId}/t2g
POST /api/live-capture/mark-wigg
```

### Real-time Updates (Optional)
- WebSocket connection for live capture
- Server-Sent Events for T2G updates
- Push notifications for milestone achievements

## Implementation Priority

### Phase 1: Core Functionality (Week 1-2)
1. ✅ Mock hooks (completed)
2. ❗ Progress segmentation API
3. ❗ Basic WIGG CRUD operations
4. ❗ T2G calculation algorithm

### Phase 2: Enhanced Features (Week 3-4)
5. ⚠️ Milestones data pipeline
6. ⚠️ Optimistic updates
7. ⚠️ Live capture manual input

### Phase 3: Edit Graph Mode (Week 4-5) 🆕 **CRITICAL**
8. ❗ **Direct WIGG placement API** - Core edit mode functionality
9. ❗ **Segment score painting API** - Press-to-Paint feature
10. ⚠️ **Undo/redo system** - Essential UX for editing
11. ⚠️ **Edit session management** - Track editing state
12. 🔶 **Real-time collaboration** - WebSocket for multi-user editing

### Phase 4: Advanced Features (Week 6+)
13. 🔶 Real-time progress tracking
14. 🔶 External player integration
15. 🔶 Community milestone submissions

## 🆕 Edit Graph Mode Specific Requirements

### API Endpoints Needed

#### WIGG Placement
```typescript
POST /api/titles/{titleId}/wiggs
{
  "position_pct": number,  // 0-100
  "note"?: string,         // Optional user note
  "session_id"?: string    // For undo tracking
}

Response: {
  "id": string,
  "position_pct": number,
  "created_at": string,
  "undo_token": string     // For optimistic undo
}
```

#### Segment Score Painting
```typescript
PATCH /api/titles/{titleId}/segments/{segmentIndex}/score
{
  "score": number,         // 0-4
  "user_id": string,
  "paint_session_id": string
}

Response: {
  "segment_index": number,
  "new_score": number,
  "previous_score": number,
  "undo_token": string
}
```

#### Batch Paint Operations
```typescript
POST /api/titles/{titleId}/paint-batch
{
  "operations": [{
    "segment_index": number,
    "score": number,
    "weight": number       // EMA weight
  }],
  "session_id": string
}
```

#### Undo/Redo System
```typescript
POST /api/undo/{undoToken}
// Reverses the specific action

POST /api/titles/{titleId}/undo-session/{sessionId}
// Undoes all actions in an edit session
```

### Database Schema Extensions

#### Edit Sessions Table
```sql
CREATE TABLE edit_sessions (
  id UUID PRIMARY KEY,
  title_id UUID REFERENCES titles(id),
  user_id UUID REFERENCES users(id),
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  actions_count INTEGER DEFAULT 0
);
```

#### Action History Table
```sql
CREATE TABLE edit_actions (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES edit_sessions(id),
  action_type VARCHAR(20) NOT NULL, -- 'place', 'paint', 'undo'
  target_pct DECIMAL(5,2),          -- Position affected
  before_value JSONB,               -- State before action
  after_value JSONB,                -- State after action
  created_at TIMESTAMP DEFAULT NOW(),
  undone_at TIMESTAMP,              -- If action was undone
  undo_token VARCHAR(64) UNIQUE     -- For optimistic undo
);
```

#### Segment Scores Table
```sql
CREATE TABLE segment_scores (
  id UUID PRIMARY KEY,
  title_id UUID REFERENCES titles(id),
  user_id UUID REFERENCES users(id),
  segment_index INTEGER NOT NULL,
  score DECIMAL(3,2) NOT NULL CHECK (score >= 0 AND score <= 4),
  painted_at TIMESTAMP DEFAULT NOW(),
  session_id UUID REFERENCES edit_sessions(id)
);

CREATE UNIQUE INDEX idx_unique_user_segment 
ON segment_scores(title_id, user_id, segment_index);
```

### Real-time Features

#### WebSocket Events
```typescript
// User enters edit mode
{
  "type": "edit_mode_entered",
  "user_id": string,
  "title_id": string,
  "timestamp": string
}

// WIGG placed in real-time
{
  "type": "wigg_placed",
  "user_id": string,
  "title_id": string,
  "position_pct": number,
  "wigg_id": string
}

// Segment painted
{
  "type": "segment_painted",
  "user_id": string,
  "title_id": string,
  "segment_index": number,
  "new_score": number
}
```

## Testing Requirements

### Unit Tests Needed
- T2G calculation edge cases
- Segment bucketing algorithms
- Optimistic update reconciliation
- WIGG deduplication logic

**🆕 Edit Graph Mode Tests:**
- Direct WIGG placement validation
- Paint stroke EMA smoothing algorithms
- Undo/redo state consistency
- Batch paint operation atomicity
- Edit session lifecycle management
- Concurrent user conflict resolution

### Integration Tests
- End-to-end WIGG creation flow
- Live capture session management
- Progress segment consistency
- Cross-user T2G agreement

**🆕 Edit Graph Mode Integration Tests:**
- Edit mode toggle within RealtimeWiggOverlay
- Paint stroke to segment score persistence
- Undo operations across multiple users
- Real-time collaboration in edit mode
- Performance under high-frequency paint operations
- Edit session timeout and cleanup

## Performance Considerations

### Caching Strategy
- Pre-compute segments at common resolutions (12, 20, 30, 40)
- Cache T2G estimates with TTL
- Redis/Memcached for frequently accessed titles

### Database Indexes
```sql
CREATE INDEX idx_segments_title_count ON title_segments(title_id, segment_count);
CREATE INDEX idx_wigg_points_title_pct ON wigg_points(title_id, position_pct);
CREATE INDEX idx_milestones_title ON title_milestones(title_id, pct);
```

### Query Optimization
- Batch segment calculation for popular titles
- Lazy loading for milestone data
- Debounced T2G recalculation

## Security Considerations

- Rate limiting on WIGG creation (prevent spam)
- User ownership validation for WIGG operations
- Input validation for percentage ranges (0-100)
- XSS protection for user notes and milestone labels

**🆕 Edit Graph Mode Security:**
- **Paint spam prevention** - Rate limit paint operations (max 10/second)
- **Edit session hijacking** - Validate session ownership
- **Undo token security** - Time-limited, single-use tokens
- **Batch operation limits** - Max 100 paint operations per batch
- **Real-time DOS protection** - WebSocket rate limiting
- **Concurrent edit conflicts** - Optimistic locking with conflict resolution
- **Action history privacy** - Ensure users can only undo their own actions

## Migration Plan

1. **Database Migration:** Create new tables, add columns
2. **API Development:** Implement core endpoints
3. **Data Backfill:** Calculate segments for existing titles
4. **Frontend Integration:** Replace mock hooks with real implementations
5. **Testing & Validation:** Verify data consistency
6. **Gradual Rollout:** Feature flags for new components

---

## Contact & Next Steps

**Frontend Components Status:** ✅ **COMPLETE**
- All UI components implemented with mocks
- Storybook stories created
- Accessibility features included
- Mobile-first responsive design

**Backend Implementation:** ⚠️ **REQUIRED**
- Critical gaps identified above
- Suggested implementation approaches provided
- Database schema proposals included

**Immediate Action Items:**
1. Review this report with backend team
2. Prioritize Phase 1 implementations
3. Set up development/staging environment
4. Begin API development using suggested contracts

For questions about the frontend implementation or integration requirements, please refer to the component documentation and Storybook stories.