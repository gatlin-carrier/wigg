import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import NotificationBell from '../NotificationBell';

const mockUseNotifications = vi.fn();
const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('@/contexts/NotificationContext', () => ({
  useNotifications: () => mockUseNotifications(),
}));

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockUseNotifications.mockReturnValue({
      notifications: [],
      unreadCount: 2,
      loading: false,
      preferences: null,
      pushSupported: false,
      pushPermission: 'default' as NotificationPermission,
      refresh: vi.fn(),
      markAsRead: vi.fn(),
      markAllAsRead: vi.fn(),
      updatePreferences: vi.fn(),
      enablePush: vi.fn(),
      disablePush: vi.fn(),
    });
  });

  it('shows unread badge with count', () => {
    render(<NotificationBell />);
    expect(screen.getByLabelText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});
