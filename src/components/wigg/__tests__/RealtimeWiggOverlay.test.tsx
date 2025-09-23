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
    data: { entries: [], t2gEstimatePct: 50 },
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
});