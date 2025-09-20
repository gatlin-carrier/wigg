import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MediaTile } from '../MediaTile';

const classifyPeakFromSegmentsMock = vi.hoisted(() =>
  vi.fn(() => ({ label: 'Strong start', globalMaxPct: 50 })),
);

vi.mock('@/hooks/useTitleProgress', () => ({
  useTitleProgress: () => ({ data: { segments: [] } }),
}));

vi.mock('@/hooks/useUserWiggs', () => ({ useUserWiggs: () => ({ data: {}, addWigg: vi.fn() }) }));
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: { getSession: () => Promise.resolve({ data: { session: null } }) } } }));
vi.mock('@/lib/wigg/analysis', () => ({
  classifyPeakFromSegments: classifyPeakFromSegmentsMock,
}));

const renderTile = () => {
  render(<MediaTile title="Movie" imageUrl="test.jpg" year={2023} />);
  return screen.getByTestId('peak-icon');
};

describe('MediaTile Peak Icon', () => {
  beforeEach(() => {
    classifyPeakFromSegmentsMock.mockReturnValue({ label: 'Strong start', globalMaxPct: 50 });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders trending-up icon for strong start', () => {
    const peakIcon = renderTile();
    expect(peakIcon).toHaveClass('lucide-trending-up');
  });

  it('renders activity icon for even pacing', () => {
    classifyPeakFromSegmentsMock.mockReturnValue({ label: 'Even pacing', globalMaxPct: 50 });
    const peakIcon = renderTile();
    expect(peakIcon).toHaveClass('lucide-activity');
  });

  it('renders minus icon for peak late pacing', () => {
    classifyPeakFromSegmentsMock.mockReturnValue({ label: 'Peak late', globalMaxPct: 80 });
    const peakIcon = renderTile();
    expect(peakIcon).toHaveClass('lucide-minus');
  });
});
