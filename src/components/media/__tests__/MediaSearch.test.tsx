import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MediaSearch } from '../MediaSearch';
import { useAnilistMangaSearch } from '@/integrations/anilist/hooks';
import { usePodcastSearch } from '@/integrations/podcast-search/hooks';

// Mock the hooks
vi.mock('@/integrations/anilist/hooks');
vi.mock('@/integrations/podcast-search/hooks');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('MediaSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAnilistMangaSearch as any).mockReturnValue({
      data: null,
      isLoading: false,
    });
    (usePodcastSearch as any).mockReturnValue({
      data: null,
      isLoading: false,
    });
  });

  it('renders search input and media type tabs', () => {
    const onMediaSelect = vi.fn();
    const { getByPlaceholderText, getByText } = render(
      <MediaSearch onMediaSelect={onMediaSelect} />,
      { wrapper: createWrapper() }
    );

    expect(getByPlaceholderText(/Search for movies/)).toBeInTheDocument();
    expect(getByText('TV')).toBeInTheDocument();
    expect(getByText('Anime')).toBeInTheDocument();
    expect(getByText('Manga')).toBeInTheDocument();
    expect(getByText('Podcast')).toBeInTheDocument();
  });

  it('displays manga search results', async () => {
    const mockMangaData = {
      media: [
        {
          id: 1,
          title: { english: 'Attack on Titan' },
          startDate: { year: 2009 },
          coverImage: { medium: 'cover.jpg' },
          chapters: 139,
        }
      ]
    };

    (useAnilistMangaSearch as any).mockReturnValue({
      data: mockMangaData,
      isLoading: false,
    });

    const onMediaSelect = vi.fn();
    const { getByText, getByPlaceholderText } = render(
      <MediaSearch onMediaSelect={onMediaSelect} />,
      { wrapper: createWrapper() }
    );

    // Switch to manga tab
    fireEvent.click(getByText('Manga'));

    // Search for manga
    fireEvent.change(getByPlaceholderText(/Search for movies/), {
      target: { value: 'attack on titan' }
    });

    await waitFor(() => {
      expect(getByText('Attack on Titan')).toBeInTheDocument();
      expect(getByText('139 chapters')).toBeInTheDocument();
    });
  });

  it('calls onMediaSelect when result is clicked', async () => {
    const mockMangaData = {
      media: [
        {
          id: 1,
          title: { english: 'Attack on Titan' },
          startDate: { year: 2009 },
          coverImage: { medium: 'cover.jpg' },
          chapters: 139,
        }
      ]
    };

    (useAnilistMangaSearch as any).mockReturnValue({
      data: mockMangaData,
      isLoading: false,
    });

    const onMediaSelect = vi.fn();
    const { getByText, getByPlaceholderText } = render(
      <MediaSearch onMediaSelect={onMediaSelect} />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(getByText('Manga'));
    fireEvent.change(getByPlaceholderText(/Search for movies/), {
      target: { value: 'attack' }
    });

    await waitFor(() => {
      fireEvent.click(getByText('Attack on Titan'));
    });

    expect(onMediaSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '1',
        title: 'Attack on Titan',
        type: 'manga',
        year: 2009,
      })
    );
  });

  it('shows loading state', () => {
    (useAnilistMangaSearch as any).mockReturnValue({
      data: null,
      isLoading: true,
    });

    const onMediaSelect = vi.fn();
    const { getByText, getByPlaceholderText } = render(
      <MediaSearch onMediaSelect={onMediaSelect} />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(getByText('Manga'));
    fireEvent.change(getByPlaceholderText(/Search for movies/), {
      target: { value: 'test' }
    });

    expect(getByText('Searching...')).toBeInTheDocument();
  });

  it('shows create custom option when no results found', async () => {
    (useAnilistMangaSearch as any).mockReturnValue({
      data: { media: [] },
      isLoading: false,
    });

    const onMediaSelect = vi.fn();
    const { getByText, getByPlaceholderText } = render(
      <MediaSearch onMediaSelect={onMediaSelect} />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(getByText('Manga'));
    fireEvent.change(getByPlaceholderText(/Search for movies/), {
      target: { value: 'nonexistent' }
    });

    await waitFor(() => {
      expect(getByText(/Create custom manga/)).toBeInTheDocument();
    });

    fireEvent.click(getByText(/Create custom manga/));
    expect(onMediaSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'nonexistent',
        type: 'manga',
      })
    );
  });
});