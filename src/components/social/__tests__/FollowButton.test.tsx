import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import FollowButton from '../FollowButton';

const mockUseFollowUser = vi.fn();

vi.mock('@/hooks/social/useFollowUser', () => ({
  useFollowUser: () => mockUseFollowUser(),
}));

describe('FollowButton', () => {
  beforeEach(() => {
    mockUseFollowUser.mockReset();
  });

  it('does not render when viewing own profile', () => {
    mockUseFollowUser.mockReturnValue({ isOwnProfile: true });
    const { container } = render(<FollowButton targetUserId="self" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders follow state and triggers toggle', () => {
    const toggle = vi.fn();
    mockUseFollowUser.mockReturnValue({ isOwnProfile: false, isFollowing: false, loading: false, toggle });
    render(<FollowButton targetUserId="abc" targetUsername="Jo" />);
    const button = screen.getByRole('button', { name: /Follow Jo/i });
    fireEvent.click(button);
    expect(toggle).toHaveBeenCalledTimes(1);
  });

  it('renders following state', () => {
    mockUseFollowUser.mockReturnValue({ isOwnProfile: false, isFollowing: true, loading: false, toggle: vi.fn() });
    render(<FollowButton targetUserId="abc" targetUsername="Jo" />);
    expect(screen.getByRole('button', { name: /Following/ })).toBeInTheDocument();
  });
});
