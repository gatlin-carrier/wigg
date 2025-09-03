import React from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import AddWiggLive from '../AddWiggLive';
import { useAuth } from '@/hooks/useAuth';
import { HeaderProvider } from '@/contexts/HeaderContext';

// Mock dependencies
vi.mock('@/hooks/useAuth');
vi.mock('@/integrations/supabase/client');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <HeaderProvider>
          {children}
        </HeaderProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('AddWiggLive', () => {
  it('shows loading state', () => {
    (useAuth as any).mockReturnValue({ user: null, loading: true });

    const { getByText } = render(<AddWiggLive />, {
      wrapper: createWrapper(),
    });

    expect(getByText('Loading...')).toBeInTheDocument();
  });

  it('shows login prompt for unauthenticated users', () => {
    (useAuth as any).mockReturnValue({ user: null, loading: false });

    const { getByText } = render(<AddWiggLive />, {
      wrapper: createWrapper(),
    });

    expect(getByText('Please log in to capture WIGG moments')).toBeInTheDocument();
    expect(getByText('Sign In')).toBeInTheDocument();
  });

  it('renders media search for authenticated users', () => {
    (useAuth as any).mockReturnValue({ 
      user: { id: 'user-123' }, 
      loading: false 
    });

    const { getByText } = render(<AddWiggLive />, {
      wrapper: createWrapper(),
    });

    expect(getByText('Live WIGG Capture')).toBeInTheDocument();
    expect(getByText(/Search for media to start rating/)).toBeInTheDocument();
  });
});