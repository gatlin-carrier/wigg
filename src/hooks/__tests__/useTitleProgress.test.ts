import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useTitleProgress } from '../useTitleProgress';

describe('useTitleProgress', () => {
  it('should return loading state initially', () => {
    const { result } = renderHook(() => useTitleProgress('test-id'));
    
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should return progress data after loading completes', async () => {
    const { result } = renderHook(() => useTitleProgress('test-id'));
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.segments).toHaveLength(20);
    expect(result.current.data?.totalLengthSeconds).toBe(7200);
    expect(result.current.error).toBeNull();
  });

  it('should generate segments with realistic score distribution', async () => {
    const { result } = renderHook(() => useTitleProgress('test-id'));
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const segments = result.current.data?.segments || [];
    
    // Early segments (first 20%) should have lower scores
    const earlySegments = segments.slice(0, 4);
    const earlyAvg = earlySegments.reduce((sum, seg) => sum + (seg.meanScore || 0), 0) / earlySegments.length;
    expect(earlyAvg).toBeLessThan(3); // Should be generally lower
    
    // Later segments should have higher scores
    const lateSegments = segments.slice(12);
    const lateAvg = lateSegments.reduce((sum, seg) => sum + (seg.meanScore || 0), 0) / lateSegments.length;
    expect(lateAvg).toBeGreaterThan(2); // Should be generally higher
  });

  it('should not load data for empty titleId', () => {
    const { result } = renderHook(() => useTitleProgress(''));
    
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });
});