import type { Meta, StoryObj } from '@storybook/react';
import { TitleCard } from '@/components/wigg/TitleCard';

const meta: Meta<typeof TitleCard> = {
  title: 'Wigg/TitleCard',
  component: TitleCard,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    mediaType: {
      control: 'select',
      options: ['movie', 'tv', 'game', 'book', 'manga'],
    },
    year: { control: 'number' },
    runtime: { control: 'number' },
  },
};

export default meta;

type Story = StoryObj<typeof TitleCard>;

const gameProps = {
  titleId: 'game-123',
  title: 'Elden Ring',
  coverArt: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co4jni.webp',
  mediaType: 'game' as const,
  year: 2022,
  runtime: 60, // 60 hours
  genre: ['Action RPG', 'Dark Fantasy'],
};

const movieProps = {
  titleId: 'movie-456',
  title: 'The Lord of the Rings: The Fellowship of the Ring',
  coverArt: 'https://m.media-amazon.com/images/I/91dZWeFcL3L._AC_UF1000,1000_QL80_.jpg',
  mediaType: 'movie' as const,
  year: 2001,
  runtime: 178, // 178 minutes
  genre: ['Fantasy', 'Adventure', 'Drama'],
};

const bookProps = {
  titleId: 'book-789',
  title: 'The Way of Kings',
  coverArt: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1388184640i/7235533.jpg',
  mediaType: 'book' as const,
  year: 2010,
  runtime: 1007, // 1007 pages
  genre: ['Epic Fantasy', 'High Fantasy'],
};

export const Game: Story = {
  args: gameProps,
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export const Movie: Story = {
  args: movieProps,
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export const Book: Story = {
  args: bookProps,
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export const LoadingState: Story = {
  args: {
    ...gameProps,
    title: 'Loading Game Title',
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Shows loading state while data is being fetched',
      },
    },
  },
};

export const Interactive: Story = {
  args: {
    ...gameProps,
    onTitleClick: () => {
      alert('Title clicked! Would navigate to detail page.');
    },
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <div className="mb-4 text-sm text-muted-foreground">
          Click the card to navigate • Long press for live session
        </div>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Interactive card with click and long-press handlers',
      },
    },
  },
};

export const GridLayout: Story = {
  decorators: [
    (Story) => (
      <div className="grid grid-cols-2 gap-4 w-[640px]">
        <TitleCard {...gameProps} />
        <TitleCard {...movieProps} />
        <TitleCard {...bookProps} />
        <TitleCard
          titleId="tv-show"
          title="Avatar: The Last Airbender"
          coverArt="https://m.media-amazon.com/images/I/81d5N6l-OeL._AC_UF1000,1000_QL80_.jpg"
          mediaType="tv"
          year={2005}
          runtime={22 // per episode
          }
          genre={['Animation', 'Adventure', 'Comedy']}
        />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Cards arranged in a grid layout',
      },
    },
  },
};

export const LongTitle: Story = {
  args: {
    titleId: 'long-title',
    title: 'The Incredibly Long and Verbose Title That Should Truncate Properly in the Card Layout',
    coverArt: 'https://via.placeholder.com/300x400',
    mediaType: 'game',
    year: 2023,
    runtime: 120,
    genre: ['Very Long Genre Name', 'Another Long Genre', 'Third Genre'],
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Tests text truncation with very long titles and genres',
      },
    },
  },
};

export const NoData: Story = {
  args: {
    titleId: 'no-data',
    title: 'Unknown Title',
    coverArt: 'https://via.placeholder.com/300x400?text=No+Cover',
    mediaType: 'game',
    // No year, runtime, or genre data
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Card with minimal data - missing year, runtime, and genre',
      },
    },
  },
};

export const MobileLayout: Story = {
  args: gameProps,
  decorators: [
    (Story) => (
      <div className="w-72 mx-auto">
        <div className="mb-4 text-sm text-muted-foreground text-center">
          Mobile-optimized layout
        </div>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Card optimized for mobile viewport',
      },
    },
  },
};