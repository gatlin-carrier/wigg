import { render, screen } from '@testing-library/react';
import { MediaTile } from '../MediaTile';
import { vi } from 'vitest';

vi.mock('@/hooks/useTitleProgress', () => ({
  useTitleProgress: () => ({ data: { segments: [{ start: 0, end: 25, density: 0.3 }, { start: 25, end: 50, density: 0.8 }] } })
}));

vi.mock('@/hooks/useUserWiggs', () => ({ useUserWiggs: () => ({ data: {}, addWigg: vi.fn() }) }));
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: { getSession: () => Promise.resolve({ data: { session: null } }) } } }));

describe('MediaTile Peak Icon', () => {
  it('renders trending-up icon for peak callout', () => {
    render(<MediaTile title="Movie" imageUrl="test.jpg" year={2023} />);
    const peakIcon = screen.getByTestId('peak-icon');
    expect(peakIcon).toHaveClass('lucide-trending-up');
  });
});
