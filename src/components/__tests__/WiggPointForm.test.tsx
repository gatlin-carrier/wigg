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

// Import the mocked modules for type safety
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

describe('WiggPointForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      user: { id: 'test-user-id' }
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
    render(<WiggPointForm />);
    
    const submitButton = screen.getByRole('button', { name: 'Add WIGG Point' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Media title is required')).toBeInTheDocument();
      expect(screen.getByText('Position is required')).toBeInTheDocument();
    });
  });

  it('should submit form successfully with valid data', async () => {
    const user = userEvent.setup();
    const mockOnSuccess = vi.fn();
    
    // Mock successful RPC calls
    const mockRpc = vi.fn()
      .mockResolvedValueOnce({ data: 'mock-media-id', error: null }) // upsert_media
      .mockResolvedValueOnce({ data: null, error: null }); // add_wigg
    (supabase.rpc as any).mockImplementation(mockRpc);

    render(<WiggPointForm onSuccess={mockOnSuccess} />);
    
    // Fill in required fields
    await user.type(screen.getByLabelText('Media Title'), 'Test Movie');
    await user.type(screen.getByLabelText('When it gets good'), '30');
    await user.type(screen.getByLabelText('Why does it get good? (optional)'), 'Great action scene');
    
    const submitButton = screen.getByRole('button', { name: 'Add WIGG Point' });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledWith('upsert_media', {
        p_type: 'game',
        p_title: 'Test Movie',
        p_year: null
      });
      
      expect(mockRpc).toHaveBeenCalledWith('add_wigg', {
        p_media_id: 'mock-media-id',
        p_episode_id: null,
        p_user_id: 'test-user-id',
        p_pos_kind: 'min',
        p_pos_value: 30,
        p_tags: [],
        p_reason_short: 'Great action scene',
        p_spoiler: '0'
      });
      
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
});