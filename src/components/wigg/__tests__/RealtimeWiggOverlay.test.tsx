import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RealtimeWiggOverlay } from '../RealtimeWiggOverlay';

// Mock the hooks
const mockAddWigg = vi.fn().mockResolvedValue(undefined);

vi.mock('@/hooks/useTitleProgress', () => ({
  useTitleProgress: () => ({
    data: {
      segments: []
    }
  })
}));

vi.mock('@/hooks/useUserWiggs', () => ({
  useUserWiggs: () => ({
    data: {
      entries: [
        {
          id: 'test-wigg-123',
          pct: 25,
          note: '[TEST] Test entry',
          createdAt: new Date().toISOString()
        },
        {
          id: 'real-wigg-456',
          pct: 50,
          note: 'Real entry',
          createdAt: new Date().toISOString()
        }
      ],
      t2gEstimatePct: 50
    },
    addWigg: mockAddWigg
  })
}));

vi.mock('@/hooks/useLiveCapture', () => ({
  useLiveCapture: () => ({
    data: { currentPct: 25.0, isActive: true },
    markWigg: vi.fn().mockResolvedValue(undefined),
    setCurrentPct: vi.fn()
  })
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

describe('RealtimeWiggOverlay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should always persist WIGGs to Supabase when marking', async () => {
    const user = userEvent.setup();

    render(
      <RealtimeWiggOverlay
        titleId="test-title"
        isOpen={true}
        onClose={() => {}}
      />
    );

    // Find and click the mark button multiple times
    const markButton = screen.getByRole('button', { name: /mark/i });

    // Click the mark button twice
    await act(async () => {
      await user.click(markButton);
    });

    await act(async () => {
      await user.click(markButton);
    });

    // Due to Math.random() > 0.5, addWigg should be called inconsistently (sometimes 0, 1, or 2 times)
    // This test will fail sometimes due to randomness, proving the bug exists
    expect(mockAddWigg).toHaveBeenCalledTimes(2); // Should ALWAYS be 2, but random behavior will make this flaky
  });

  it('should show visual indicators for test data entries', () => {
    render(
      <RealtimeWiggOverlay
        titleId="test-movie-sample"
        titleName="Test Movie"
        isOpen={true}
        onClose={() => {}}
      />
    );

    // Should show both test and real entries
    expect(screen.getByText('[TEST] Test entry')).toBeInTheDocument();
    expect(screen.getByText('Real entry')).toBeInTheDocument();

    // This test expects visual indicators for test data - currently failing
    const testEntries = screen.getAllByText(/test/i);
    expect(testEntries.length).toBeGreaterThan(0);

    // Should have test tube icons for test entries (both entries are test data)
    const testIndicators = screen.getAllByTestId('test-indicator');
    expect(testIndicators.length).toBeGreaterThan(0);
  });

  it('should show environment indicator when on non-production URL', () => {
    // Mock window.location for non-production URL
    const originalLocation = window.location;
    delete (window as any).location;
    window.location = new URL('http://localhost:3000') as any;

    render(
      <RealtimeWiggOverlay
        titleId="regular-movie-123"
        titleName="Regular Movie"
        isOpen={true}
        onClose={() => {}}
      />
    );

    // Should show development/test environment indicator
    expect(screen.getByTestId('environment-indicator')).toBeInTheDocument();
    expect(screen.getByText(/development/i)).toBeInTheDocument();

    // Restore original location
    window.location = originalLocation;
  });
});