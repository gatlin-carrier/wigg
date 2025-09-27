import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { WiggPointForm } from '../WiggPointForm';

// Mock the dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn()
  }
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn()
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn()
}));

vi.mock('@/lib/api/services/wiggPoints', () => ({
  wiggPointService: {
    createWiggPoint: vi.fn()
  }
}));

// Import the mocked modules for type safety
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { wiggPointService } from '@/lib/api/services/wiggPoints';

describe('WiggPointForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      user: { id: 'test-user-id' }
    });

    // Set up default mock for wiggPointService to return success
    (wiggPointService.createWiggPoint as any).mockResolvedValue({
      success: true,
      data: {}
    });
  });

  it('should render form fields correctly', () => {
    render(<WiggPointForm />);
    
    expect(screen.getByLabelText('Media Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Type')).toBeInTheDocument();
    expect(screen.getByLabelText('When it gets good')).toBeInTheDocument();
    expect(screen.getByLabelText('Unit')).toBeInTheDocument();
    expect(screen.getByLabelText('Why does it get good? (optional)')).toBeInTheDocument();
    expect(screen.getByLabelText('Tags (press Enter to add)')).toBeInTheDocument();
    expect(screen.getByLabelText('Spoiler Level')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add WIGG Point' })).toBeInTheDocument();
  });

  it('should show validation errors for required fields', async () => {
    const user = userEvent.setup();
    render(<WiggPointForm />);

    const submitButton = screen.getByRole('button', { name: 'Add WIGG Point' });

    // Clear the media title field to make it explicitly empty
    const mediaTitleInput = screen.getByLabelText('Media Title');
    await user.clear(mediaTitleInput);

    // Clear the position field to make it explicitly empty
    const positionInput = screen.getByLabelText('When it gets good');
    await user.clear(positionInput);

    await user.click(submitButton);

    // Verify validation prevents submission
    expect(wiggPointService.createWiggPoint).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.getByText('Media title is required')).toBeInTheDocument();
      expect(screen.getByText('Position is required')).toBeInTheDocument();
    });
  });

  it('should submit form successfully with valid data', async () => {
    const user = userEvent.setup();
    const mockOnSuccess = vi.fn();

    render(<WiggPointForm onSuccess={mockOnSuccess} />);

    // Fill in required fields
    await user.type(screen.getByLabelText('Media Title'), 'Test Movie');
    await user.type(screen.getByLabelText('When it gets good'), '30');
    await user.type(screen.getByLabelText('Why does it get good? (optional)'), 'Great action scene');

    const submitButton = screen.getByRole('button', { name: 'Add WIGG Point' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(wiggPointService.createWiggPoint).toHaveBeenCalledWith(expect.objectContaining({
        mediaTitle: 'Test Movie',
        mediaType: 'game',
        posKind: 'min',
        posValue: 30,
        tags: [],
        reasonShort: 'Great action scene',
        spoilerLevel: 0,
        userId: 'test-user-id'
      }));

      expect(toast).toHaveBeenCalledWith({
        title: 'WIGG point added!',
        description: 'Successfully recorded when Test Movie gets good'
      });

      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('should handle tag addition and removal', async () => {
    const user = userEvent.setup();

    render(<WiggPointForm />);

    const tagInput = screen.getByLabelText('Tags (press Enter to add)');

    // Add first tag
    await user.type(tagInput, 'plot-twist');
    await user.keyboard('{Enter}');

    expect(screen.getByText('plot-twist')).toBeInTheDocument();
    expect(tagInput).toHaveValue('');

    // Add second tag
    await user.type(tagInput, 'character-development');
    await user.keyboard('{Enter}');

    expect(screen.getByText('plot-twist')).toBeInTheDocument();
    expect(screen.getByText('character-development')).toBeInTheDocument();

    // Remove first tag
    const removeButton = screen.getByText('plot-twist').parentElement?.querySelector('svg');
    if (removeButton) {
      await user.click(removeButton);
    }

    expect(screen.queryByText('plot-twist')).not.toBeInTheDocument();
    expect(screen.getByText('character-development')).toBeInTheDocument();
  });

  it('should pass spoiler level as proper numeric type not any', async () => {
    const user = userEvent.setup();

    render(<WiggPointForm />);

    // Fill in required fields
    await user.type(screen.getByLabelText('Media Title'), 'Test Movie');
    await user.type(screen.getByLabelText('When it gets good'), '30');

    const submitButton = screen.getByRole('button', { name: 'Add WIGG Point' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(wiggPointService.createWiggPoint).toHaveBeenCalledWith(expect.objectContaining({
        spoilerLevel: 0, // Should be number 0, not string "0"
      }));
    });
  });

  it('should properly handle form state without manual getValues/setValue calls', async () => {
    const user = userEvent.setup();

    render(<WiggPointForm />);

    const tagInput = screen.getByLabelText('Tags (press Enter to add)');

    // Type a tag and press Enter
    await user.type(tagInput, 'test-tag');
    await user.keyboard('{Enter}');

    // The form should clear the input properly using React Hook Form's mechanisms
    expect(tagInput).toHaveValue('');
    expect(screen.getByText('test-tag')).toBeInTheDocument();
  });

  it('should use WIGG Point Service instead of direct Supabase calls', async () => {
    const user = userEvent.setup();

    // Mock the WIGG Point Service response
    (wiggPointService.createWiggPoint as any).mockResolvedValue({
      success: true,
      data: { mediaId: 'media-789' }
    });

    render(<WiggPointForm />);

    // Fill form and submit
    await user.type(screen.getByLabelText('Media Title'), 'API Service Test');
    await user.type(screen.getByLabelText('When it gets good'), '25');
    await user.type(screen.getByLabelText('Why does it get good? (optional)'), 'Amazing plot twist');

    const submitButton = screen.getByRole('button', { name: 'Add WIGG Point' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(wiggPointService.createWiggPoint).toHaveBeenCalledWith(expect.objectContaining({
        mediaTitle: 'API Service Test',
        mediaType: 'game',
        posKind: 'min',
        posValue: 25,
        reasonShort: 'Amazing plot twist',
        spoilerLevel: 0,
        tags: []
      }));
    });
  });
});