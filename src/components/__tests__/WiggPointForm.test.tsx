import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { WiggPointForm } from '../WiggPointForm';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

vi.mock('@/data', async () => {
  const actual = await vi.importActual<any>('@/data');
  return {
    ...actual,
    useCreateWiggPoint: vi.fn(),
  };
});

import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { useCreateWiggPoint } from '@/data';

describe('WiggPointForm', () => {
  const mutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mutateAsync.mockReset();
    (useAuth as unknown as vi.Mock).mockReturnValue({
      user: {
        id: 'test-user-id',
        user_metadata: { username: 'TestUser' },
        email: 'test@example.com',
      },
    });
    (useCreateWiggPoint as unknown as vi.Mock).mockReturnValue({
      mutateAsync,
      isPending: false,
    });
  });

  it('should render form fields correctly', () => {
    render(<WiggPointForm />);

    expect(screen.getByLabelText('Media Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Type')).toBeInTheDocument();
    expect(screen.getByLabelText('When it gets good')).toBeInTheDocument();
    expect(screen.getByLabelText('Unit')).toBeInTheDocument();
    expect(screen.getByLabelText('Why does it get good?')).toBeInTheDocument();
    expect(screen.getByLabelText('Spoiler Level')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit WIGG Point' })).toBeInTheDocument();
  });

  it('should show validation errors for required fields', async () => {
    render(<WiggPointForm />);

    const submitButton = screen.getByRole('button', { name: 'Submit WIGG Point' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Media title is required')).toBeInTheDocument();
      expect(screen.getByText('Position is required')).toBeInTheDocument();
    });
  });

  it('should submit form successfully with valid data', async () => {
    const user = userEvent.setup();
    const mockOnSuccess = vi.fn();

    mutateAsync.mockResolvedValueOnce(undefined);

    render(<WiggPointForm onSuccess={mockOnSuccess} />);

    await user.type(screen.getByLabelText('Media Title'), 'Test Movie');
    await user.type(screen.getByLabelText('When it gets good'), '30');
    await user.type(screen.getByLabelText('Why does it get good?'), 'Great action scene');

    const submitButton = screen.getByRole('button', { name: 'Submit WIGG Point' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        mediaTitle: 'Test Movie',
        mediaType: 'game',
        posKind: 'min',
        posValue: 30,
        reasonShort: 'Great action scene',
        tags: [],
        spoilerLevel: '0',
        userId: 'test-user-id',
        username: 'TestUser',
      });

      expect(toast).toHaveBeenCalledWith({
        title: 'WIGG point added!',
        description: 'Successfully recorded when Test Movie gets good',
      });

      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('should handle tag addition and removal', async () => {
    const user = userEvent.setup();

    render(<WiggPointForm />);

    const tagInput = screen.getByPlaceholderText('Add a tag and press Enter');

    await user.type(tagInput, 'plot-twist');
    await user.keyboard('{Enter}');

    expect(screen.getByText('plot-twist')).toBeInTheDocument();
    expect(tagInput).toHaveValue('');

    await user.type(tagInput, 'character-development');
    await user.keyboard('{Enter}');

    expect(screen.getByText('plot-twist')).toBeInTheDocument();
    expect(screen.getByText('character-development')).toBeInTheDocument();

    const removeButton = screen.getByText('plot-twist').parentElement?.querySelector('button');
    if (removeButton) {
      await user.click(removeButton);
    }

    expect(screen.queryByText('plot-twist')).not.toBeInTheDocument();
    expect(screen.getByText('character-development')).toBeInTheDocument();
  });
});
