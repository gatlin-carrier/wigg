import { renderHook, act } from '@testing-library/react';
import { useWiggSession } from '../useWiggSession';

const mockMedia = {
  id: 'test-media',
  title: 'Test Anime',
  type: 'anime' as const,
  year: 2024,
};

const mockUnits = [
  { id: 'ep-1', title: 'Episode 1', ordinal: 1, subtype: 'episode' as const },
  { id: 'ep-2', title: 'Episode 2', ordinal: 2, subtype: 'episode' as const },
];

describe('useWiggSession', () => {
  it('initializes with default state', () => {
    const { result } = renderHook(() => useWiggSession());

    expect(result.current.selectedMedia).toBeNull();
    expect(result.current.units).toEqual([]);
    expect(result.current.currentUnitIndex).toBe(0);
    expect(result.current.moments).toEqual([]);
    expect(result.current.progress).toBe(1);
    expect(result.current.sessionStats).toEqual({
      n: 0, peak: 0, good: 0, ok: 0, skip: 0
    });
  });

  it('updates selected media', () => {
    const { result } = renderHook(() => useWiggSession());

    act(() => {
      result.current.setSelectedMedia(mockMedia);
    });

    expect(result.current.selectedMedia).toEqual(mockMedia);
  });

  it('records swipe values correctly', () => {
    const { result } = renderHook(() => useWiggSession());

    act(() => {
      result.current.recordSwipe(3); // Peak
    });

    expect(result.current.sessionStats).toEqual({
      n: 1, peak: 1, good: 0, ok: 0, skip: 0
    });

    act(() => {
      result.current.recordSwipe(2); // Good
    });

    expect(result.current.sessionStats).toEqual({
      n: 2, peak: 1, good: 1, ok: 0, skip: 0
    });
  });

  it('advances to next unit', () => {
    const { result } = renderHook(() => useWiggSession());

    act(() => {
      result.current.setUnits(mockUnits);
    });

    expect(result.current.currentUnitIndex).toBe(0);

    act(() => {
      result.current.nextUnit();
    });

    expect(result.current.currentUnitIndex).toBe(1);
  });

  it('adds moments to list', () => {
    const { result } = renderHook(() => useWiggSession());

    const moment = {
      id: 'moment-1',
      unitId: 'ep-1',
      anchorType: 'timestamp' as const,
      anchorValue: 120,
      whyTags: ['pacing'],
      spoilerLevel: 'none' as const,
    };

    act(() => {
      result.current.addMoment(moment);
    });

    expect(result.current.moments).toContain(moment);
  });

  it('resets session state', () => {
    const { result } = renderHook(() => useWiggSession());

    // Set some state
    act(() => {
      result.current.setUnits(mockUnits);
      result.current.recordSwipe(3);
      result.current.nextUnit();
      result.current.setProgress(5);
    });

    // Reset
    act(() => {
      result.current.resetSession();
    });

    expect(result.current.currentUnitIndex).toBe(0);
    expect(result.current.moments).toEqual([]);
    expect(result.current.progress).toBe(1);
    expect(result.current.sessionStats).toEqual({
      n: 0, peak: 0, good: 0, ok: 0, skip: 0
    });
  });

  it('limits moments to 12 entries', () => {
    const { result } = renderHook(() => useWiggSession());

    // Add 15 moments
    act(() => {
      for (let i = 0; i < 15; i++) {
        result.current.addMoment({
          id: `moment-${i}`,
          unitId: 'ep-1',
          anchorType: 'timestamp',
          anchorValue: i * 10,
          whyTags: [],
          spoilerLevel: 'none',
        });
      }
    });

    expect(result.current.moments).toHaveLength(12);
    expect(result.current.moments[0].id).toBe('moment-14'); // Most recent first
  });
});